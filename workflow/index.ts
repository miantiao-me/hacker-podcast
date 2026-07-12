import type { WorkflowEvent, WorkflowStep, WorkflowStepConfig } from 'cloudflare:workers'
import type { Env, GeneratedContents, Params, WorkflowContext } from './context'
import type { Article } from '@/schemas/article'
import { generateText } from 'ai'
import { WorkflowEntrypoint } from 'cloudflare:workers'
import { podcastTitle } from '@/config'
import { articleSchema } from '@/schemas/article'
import { cleanupTemporaryAudio, processAudio } from './audio'
import { buildContext } from './context'
import { stepNames } from './names'
import { introPrompt, summarizeBlogPrompt, summarizePodcastPrompt, summarizeStoryPrompt } from './prompt'
import { getHackerNewsStory, getHackerNewsTopStories } from './utils'

const retryConfig: WorkflowStepConfig = {
  retries: {
    limit: 5,
    delay: '10 seconds',
    backoff: 'exponential',
  },
  timeout: '3 minutes',
}

async function getTopStories(today: string, isDev: boolean, step: WorkflowStep, env: Env): Promise<Story[]> {
  return await step.do(stepNames.topStories(today), retryConfig, async () => {
    const topStories = await getHackerNewsTopStories(today, env)

    if (!topStories.length) {
      throw new Error('no stories found')
    }

    topStories.length = Math.min(topStories.length, isDev ? 1 : 10)

    return topStories
  })
}

async function processStories(stories: Story[], step: WorkflowStep, ctx: WorkflowContext): Promise<string[]> {
  const summaries: string[] = []

  for (const story of stories) {
    const storyResponse = await step.do(stepNames.storyContent(story), retryConfig, async () => {
      return await getHackerNewsStory(story, ctx.maxTokens, ctx.env)
    })

    console.info(`get story ${story.id} content success`)

    const summary = await step.do(stepNames.storySummary(story), retryConfig, async () => {
      const { text, usage, finishReason } = await generateText({
        model: ctx.openai(ctx.env.OPENAI_MODEL),
        system: summarizeStoryPrompt,
        prompt: storyResponse,
      })

      console.info(`get story ${story.id} summary success`, { text, usage, finishReason })
      return `<story>${text}</story>`
    })

    summaries.push(summary)

    await step.sleep(stepNames.pauseAfterStory(story), ctx.breakTime)
  }

  return summaries
}

async function generateContents(allStories: string[], stories: Story[], step: WorkflowStep, ctx: WorkflowContext): Promise<GeneratedContents> {
  const podcastContent = await step.do(stepNames.generatePodcastScript, retryConfig, async () => {
    const { text, usage, finishReason } = await generateText({
      model: ctx.openai(ctx.env.OPENAI_THINKING_MODEL || ctx.env.OPENAI_MODEL),
      system: summarizePodcastPrompt,
      prompt: allStories.join('\n\n---\n\n'),
      maxOutputTokens: ctx.maxTokens,
      maxRetries: 3,
    })

    console.info(`create hacker podcast content success`, { text, usage, finishReason })

    return text
  })

  console.info('podcast content:\n', ctx.isDev ? podcastContent : podcastContent.slice(0, 100))

  await step.sleep(stepNames.pauseAfterPodcastScript, ctx.breakTime)

  const blogContent = await step.do(stepNames.generateBlogArticle, retryConfig, async () => {
    const { text, usage, finishReason } = await generateText({
      model: ctx.openai(ctx.env.OPENAI_THINKING_MODEL || ctx.env.OPENAI_MODEL),
      system: summarizeBlogPrompt,
      prompt: `<stories>${JSON.stringify(stories)}</stories>\n\n---\n\n${allStories.join('\n\n---\n\n')}`,
      maxOutputTokens: ctx.maxTokens,
      maxRetries: 3,
    })

    console.info(`create hacker daily blog content success`, { text, usage, finishReason })

    return text
  })

  console.info('blog content:\n', ctx.isDev ? blogContent : blogContent.slice(0, 100))

  await step.sleep(stepNames.pauseAfterBlogArticle, ctx.breakTime)

  const introContent = await step.do(stepNames.generateIntro, retryConfig, async () => {
    const { text, usage, finishReason } = await generateText({
      model: ctx.openai(ctx.env.OPENAI_MODEL),
      system: introPrompt,
      prompt: podcastContent,
      maxRetries: 3,
    })

    console.info(`create intro content success`, { text, usage, finishReason })

    return text
  })

  return { podcastContent, blogContent, introContent }
}

async function saveContent(contentKey: string, podcastKey: string, stories: Story[], contents: GeneratedContents, audioSize: number, step: WorkflowStep, ctx: WorkflowContext): Promise<void> {
  await step.do(stepNames.saveEpisodeContent, retryConfig, async () => {
    const article: Article = articleSchema.parse({
      date: ctx.today,
      title: `${podcastTitle} ${ctx.today}`,
      stories,
      podcastContent: contents.podcastContent,
      blogContent: contents.blogContent,
      introContent: contents.introContent,
      audio: podcastKey,
      audioSize,
      updatedAt: Date.now(),
    })

    await ctx.env.HACKER_PODCAST_KV.put(contentKey, JSON.stringify(article))

    return contents.introContent
  })

  console.info('save content to kv success')
}

export class HackerNewsWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
    console.info('trigged event: HackerNewsWorkflow', event)

    const ctx = buildContext(this.env, event)
    const stories = await getTopStories(ctx.today, ctx.isDev, step, ctx.env)
    console.info('top stories', ctx.isDev ? stories : JSON.stringify(stories))

    const allStories = await processStories(stories, step, ctx)
    const contents = await generateContents(allStories, stories, step, ctx)
    const contentKey = `content:${ctx.runEnv}:hacker-podcast:${ctx.today}`
    const podcastKey = `${ctx.today.replaceAll('-', '/')}/${ctx.runEnv}/hacker-podcast-${ctx.today}.mp3`
    const { audioSize, temporaryKeys } = await processAudio(contents.podcastContent, podcastKey, step, ctx, event)

    await saveContent(contentKey, podcastKey, stories, contents, audioSize, step, ctx)
    await cleanupTemporaryAudio(temporaryKeys, step, ctx.env)
  }
}
