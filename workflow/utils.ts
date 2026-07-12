import puppeteer from '@cloudflare/puppeteer'
import * as cheerio from 'cheerio'
import { $fetch } from 'ofetch'

interface ContentSelector {
  include?: string
  exclude?: string
}

interface ContentKeys {
  JINA_KEY?: string
  FIRECRAWL_KEY?: string
}

interface FirecrawlResult {
  success: boolean
  data: Record<string, string>
}

function getErrorData(error: unknown): unknown {
  if (typeof error === 'object' && error && 'data' in error) {
    return error.data
  }

  return undefined
}

function xmlBlock(tag: string, content: string): string {
  return `
<${tag}>
${content}
</${tag}>
`
}

async function getContentFromJina(url: string, format: 'html' | 'markdown', selector?: ContentSelector, JINA_KEY?: string): Promise<string> {
  const jinaHeaders: HeadersInit = {
    'X-Retain-Images': 'none',
    'X-Return-Format': format,
  }

  if (JINA_KEY) {
    jinaHeaders.Authorization = `Bearer ${JINA_KEY}`
  }

  if (selector?.include) {
    jinaHeaders['X-Target-Selector'] = selector.include
  }

  if (selector?.exclude) {
    jinaHeaders['X-Remove-Selector'] = selector.exclude
  }

  console.info('get content from jina', url)
  const content = await $fetch<string>(`https://r.jina.ai/${url}`, {
    headers: jinaHeaders,
    timeout: 30000,
    parseResponse: txt => txt,
  })
  return content
}

async function getContentFromFirecrawl(url: string, format: 'html' | 'markdown' | 'rawHtml', selector?: ContentSelector, FIRECRAWL_KEY?: string): Promise<string> {
  if (!FIRECRAWL_KEY) {
    return ''
  }

  const firecrawlHeaders: HeadersInit = {
    Authorization: `Bearer ${FIRECRAWL_KEY}`,
  }

  try {
    console.info('get content from firecrawl', url)
    const result = await $fetch<FirecrawlResult>('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: firecrawlHeaders,
      timeout: 30000,
      body: {
        url,
        formats: [format],
        onlyMainContent: format !== 'rawHtml',
        maxAge: format === 'rawHtml' ? 0 : undefined,
        includeTags: selector?.include ? [selector.include] : undefined,
        excludeTags: selector?.exclude ? [selector.exclude] : undefined,
      },
    })
    if (result.success) {
      return result.data[format] || ''
    }
    else {
      console.error(`get content from firecrawl failed: ${url} ${result}`)
      return ''
    }
  }
  catch (error) {
    console.error(`get content from firecrawl failed: ${url} ${error}`, getErrorData(error))
    return ''
  }
}

async function getContent(url: string, format: 'html' | 'markdown', selector: ContentSelector, { JINA_KEY, FIRECRAWL_KEY }: ContentKeys): Promise<string> {
  if (FIRECRAWL_KEY) {
    const content = await getContentFromFirecrawl(url, format, selector, FIRECRAWL_KEY)
    if (content) {
      return content
    }
  }

  return getContentFromJina(url, format, selector, JINA_KEY)
}

function parseHackerNewsStories(html: string): Story[] {
  const $ = cheerio.load(html)
  const items = $('.athing.submission')

  const stories: Story[] = []
  items.each((_, el) => {
    const id = $(el).attr('id')
    const url = $(el).find('.titleline > a').attr('href')
    if (!id || !url) {
      return
    }

    stories.push({
      id,
      title: $(el).find('.titleline > a').text(),
      url,
      hackerNewsUrl: `https://news.ycombinator.com/item?id=${id}`,
    })
  })

  return stories
}

export async function getHackerNewsTopStories(today: string, { JINA_KEY, FIRECRAWL_KEY }: ContentKeys): Promise<Story[]> {
  const url = `https://news.ycombinator.com/front?day=${today}`

  if (FIRECRAWL_KEY) {
    const firecrawlHtml = await getContentFromFirecrawl(url, 'rawHtml', {}, FIRECRAWL_KEY)
    if (firecrawlHtml) {
      const firecrawlStories = parseHackerNewsStories(firecrawlHtml)
      if (firecrawlStories.length > 0) {
        return firecrawlStories
      }

      console.warn('getHackerNewsTopStories from Firecrawl parsed no stories, falling back to Jina')
    }
  }

  const html = await getContentFromJina(url, 'html', {}, JINA_KEY)
  return parseHackerNewsStories(html)
}

export async function getHackerNewsStory(story: Story, maxTokens: number, { JINA_KEY, FIRECRAWL_KEY }: ContentKeys): Promise<string> {
  const [article, comments] = await Promise.all([
    getContent(story.url!, 'markdown', {}, { JINA_KEY, FIRECRAWL_KEY }),
    getContent(`https://news.ycombinator.com/item?id=${story.id}`, 'markdown', { include: '.comment-tree', exclude: '.navs' }, { JINA_KEY, FIRECRAWL_KEY }),
  ])
  const blocks = [
    story.title ? xmlBlock('title', story.title) : '',
    article ? xmlBlock('article', article.substring(0, maxTokens * 5)) : '',
    comments ? xmlBlock('comments', comments.substring(0, maxTokens * 5)) : '',
  ]

  return blocks.filter(Boolean).join('\n\n---\n\n')
}

export async function concatAudioFiles(audioFiles: string[], BROWSER: Fetcher, { workerUrl }: { workerUrl: string }): Promise<Blob> {
  const browser = await puppeteer.launch(BROWSER)
  try {
    const page = await browser.newPage()
    await page.goto(`${workerUrl}/audio`)

    console.info('start concat audio files', audioFiles)
    const fileUrl = await page.evaluate(async (audioFiles) => {
      // 此处 JS 运行在浏览器中
      // @ts-expect-error 浏览器内的对象
      const blob = await concatAudioFilesOnBrowser(audioFiles)

      const result = new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      return await result
    }, audioFiles) as string

    console.info('concat audio files result', fileUrl.substring(0, 100))

    const response = await fetch(fileUrl)
    return await response.blob()
  }
  finally {
    await browser.close()
  }
}
