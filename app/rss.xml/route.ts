import { env } from 'cloudflare:workers'
import markdownit from 'markdown-it'
import { NextResponse } from 'next/server'
import { Podcast } from 'podcast'
import { podcast, rssEpisodeCount } from '@/config'
import { getArticlesByDates } from '@/lib/articles'
import { getPastDays } from '@/lib/date'
import { buildAudioUrl } from '@/lib/episodes'
import { getBaseUrl } from '@/lib/seo'

const md = markdownit()

export const revalidate = 3600

export async function GET() {
  const baseUrl = getBaseUrl()

  // 如果没有缓存，生成新的响应
  const feed = new Podcast({
    title: podcast.base.title,
    description: podcast.base.description,
    feedUrl: `${baseUrl}/rss.xml`,
    siteUrl: baseUrl,
    imageUrl: `${baseUrl}/logo.png`,
    language: 'zh-CN',
    pubDate: new Date(),
    ttl: 60,
    generator: podcast.base.title,
    author: podcast.base.title,
    categories: ['technology', 'news'],
    itunesImage: `${baseUrl}/logo.png`,
    itunesCategory: [{ text: 'Technology' }, { text: 'News' }],
    itunesOwner: {
      name: podcast.base.title,
      email: 'hacker-podcast@agi.li',
    },
    managingEditor: 'hacker-podcast@agi.li',
    webMaster: 'hacker-podcast@agi.li',
  })

  const pastDays = getPastDays(rssEpisodeCount)
  const posts = await getArticlesByDates(pastDays)

  const audioSizes = await Promise.all(
    posts.map(async (post) => {
      if (post.audioSize !== undefined) {
        return post.audioSize
      }

      const audioInfo = await env.HACKER_PODCAST_R2.head(post.audio)
      return audioInfo?.size
    }),
  )

  posts.forEach((post, index) => {
    const audioSize = audioSizes[index]

    const links = post.stories
      .map(s => `<li><a href="${s.hackerNewsUrl || s.url || ''}" title="${s.title || ''}">${s.title || ''}</a></li>`)
      .join('')
    const linkContent = `<p><b>相关链接：</b></p><ul>${links}</ul>`
    const blogContentHtml = md.render(post.blogContent || '')
    const finalContent = `
      <div>${blogContentHtml}<hr/>${linkContent}</div>
      ${env.NEXT_TRACKING_IMAGE ? `<img src="${env.NEXT_TRACKING_IMAGE}/${post.date}" alt="" width="1" height="1" loading="lazy" aria-hidden="true" style="opacity: 0;pointer-events: none;" />` : ''}
    `

    feed.addItem({
      title: post.title || '',
      description: post.introContent || post.podcastContent || '',
      content: finalContent,
      url: `${baseUrl}/episode/${post.date}`,
      guid: `/episode/${post.date}`,
      date: new Date(post.updatedAt ?? post.date),
      enclosure: {
        url: buildAudioUrl(env.NEXT_STATIC_HOST, post.audio, post.updatedAt),
        type: 'audio/mpeg',
        size: audioSize,
      },
    })
  })

  const response = new NextResponse(feed.buildXml(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  })

  return response
}
