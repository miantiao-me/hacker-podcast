import type { WorkflowEvent, WorkflowSleepDuration } from 'cloudflare:workers'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export interface Params {
  today?: string
}

export interface Env extends CloudflareEnv {
  OPENAI_BASE_URL: string
  OPENAI_API_KEY: string
  OPENAI_MODEL: string
  OPENAI_THINKING_MODEL?: string
  OPENAI_MAX_TOKENS?: string
  JINA_KEY?: string
  NODE_ENV: string
  HACKER_PODCAST_WORKER_URL: string
  HACKER_PODCAST_R2_BUCKET_URL: string
  HACKER_PODCAST_WORKFLOW: Workflow
  BROWSER?: Fetcher
  TTS_PROVIDER?: string
  TTS_API_URL?: string
  TTS_API_ID?: string
  TTS_API_KEY?: string
  TTS_MODEL?: string
  TTS_REGION?: string
  MAN_VOICE_ID?: string
  WOMAN_VOICE_ID?: string
  AUDIO_SPEED?: string
}

export interface WorkflowContext {
  runEnv: string
  isDev: boolean
  breakTime: WorkflowSleepDuration
  today: string
  openai: ReturnType<typeof createOpenAICompatible>
  maxTokens: number
  env: Env
}

export interface GeneratedContents {
  podcastContent: string
  blogContent: string
  introContent: string
}

function parseMaxTokens(value?: string): number {
  const maxTokens = Number.parseInt(value || '', 10)
  return Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 4096
}

export function buildContext(env: Env, event: WorkflowEvent<Params>): WorkflowContext {
  const runEnv = env.NODE_ENV || 'production'
  const isDev = runEnv !== 'production'
  const breakTime = isDev ? '2 seconds' : '5 seconds'
  const today = event.payload?.today || new Date().toISOString().split('T')[0]
  const openai = createOpenAICompatible({
    name: 'openai',
    baseURL: env.OPENAI_BASE_URL,
    apiKey: env.OPENAI_API_KEY,
  })
  const maxTokens = parseMaxTokens(env.OPENAI_MAX_TOKENS)

  return { runEnv, isDev, breakTime, today, openai, maxTokens, env }
}
