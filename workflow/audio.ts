import type { WorkflowEvent, WorkflowStep, WorkflowStepConfig } from 'cloudflare:workers'
import type { Env, Params, WorkflowContext } from './context'
import type { Gender } from './tts/types'
import { stepNames } from './names'
import { synthesize } from './tts'
import { concatAudioFiles } from './utils'

interface Conversation {
  gender: Gender
  text: string
}

interface AudioSegment {
  key: string
  url: string
}

export interface AudioResult {
  audioSize: number
  temporaryKeys: string[]
}

const audioRetryConfig: WorkflowStepConfig = {
  retries: {
    limit: 5,
    delay: '10 seconds',
    backoff: 'exponential',
  },
  timeout: '3 minutes',
}

function parseConversations(podcastContent: string): Conversation[] {
  const conversations: Conversation[] = []

  for (const [index, line] of podcastContent.split('\n').entries()) {
    if (!line.trim())
      continue

    const match = line.trim().match(/^([男女])[:：](.*)$/)
    const text = match?.[2]?.trim()
    if (!match || !text)
      throw new Error(`播客对话第 ${index + 1} 行格式错误`)

    const gender: Gender = match[1] === '男' ? '男' : '女'
    conversations.push({ gender, text })
  }

  if (!conversations.length)
    throw new Error('播客对话至少需要一行')

  return conversations
}

export async function processAudio(
  podcastContent: string,
  podcastKey: string,
  step: WorkflowStep,
  ctx: WorkflowContext,
  event: WorkflowEvent<Params>,
): Promise<AudioResult> {
  const conversations = parseConversations(podcastContent)
  const browser = ctx.env.BROWSER
  if (!browser)
    throw new Error('BROWSER binding is required to merge podcast audio')

  const segments: AudioSegment[] = []
  for (const [index, conversation] of conversations.entries()) {
    const segment = await step.do(stepNames.audioSegment(index), { ...audioRetryConfig, timeout: '5 minutes' }, async () => {
      console.info('create conversation audio', conversation.text)
      const audio = await synthesize(conversation.text, conversation.gender, ctx.env)

      if (!audio.size)
        throw new Error('podcast audio size is 0')

      const key = `tmp/${event.instanceId}/${podcastKey}-${index}.mp3`
      const url = `${ctx.env.HACKER_PODCAST_R2_BUCKET_URL}/${key}?t=${Date.now()}`
      await ctx.env.HACKER_PODCAST_R2.put(key, audio)
      return { key, url }
    })
    segments.push(segment)
  }

  if (segments.length !== conversations.length || segments.some(segment => !segment.key || !segment.url))
    throw new Error('podcast audio segments are incomplete')

  const audioSize = await step.do(stepNames.mergeAudioSegments, audioRetryConfig, async () => {
    const blob = await concatAudioFiles(
      segments.map(segment => segment.url),
      browser,
      { workerUrl: ctx.env.HACKER_PODCAST_WORKER_URL },
    )
    if (!blob.size)
      throw new Error('merged podcast audio size is 0')

    await ctx.env.HACKER_PODCAST_R2.put(podcastKey, blob)
    const podcastAudioUrl = `${ctx.env.HACKER_PODCAST_R2_BUCKET_URL}/${podcastKey}?t=${Date.now()}`
    console.info('podcast audio url', podcastAudioUrl)
    return blob.size
  })

  console.info('save podcast to r2 success')
  return { audioSize, temporaryKeys: segments.map(segment => segment.key) }
}

export async function cleanupTemporaryAudio(keys: string[], step: WorkflowStep, env: Env): Promise<void> {
  await step.do(stepNames.cleanupTemporaryAudio, audioRetryConfig, async () => {
    await Promise.all(keys.map(key => env.HACKER_PODCAST_R2.delete(key)))
    return 'temporary audio cleaned up'
  })
}
