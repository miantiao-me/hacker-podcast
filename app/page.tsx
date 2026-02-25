import type { PodcastInfo } from '@/types/podcast'
import { env } from 'cloudflare:workers'
import { Podcast } from '@/components/podcast'
import { keepDays, podcast, site } from '@/config'
import { buildEpisodesFromArticles } from '@/lib/episodes'
import { getPastDays } from '@/lib/utils'

export const revalidate = 600

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const runEnv = env.NODE_ENV || 'production'
  const query = await searchParams
  const requestedPage = Number.parseInt(query.page ?? '1', 10)
  const currentPage = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage)
  const pastDays = getPastDays(keepDays)
  const kvPrefix = `content:${runEnv}:hacker-podcast:`
  const totalEpisodes = pastDays.length
  const totalPages = Math.max(1, Math.ceil(totalEpisodes / site.pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * site.pageSize
  const pageDays = pastDays.slice(startIndex, startIndex + site.pageSize)

  const posts = (
    await Promise.all(
      pageDays.map(async (day) => {
        const post = await env.HACKER_PODCAST_KV.get(`${kvPrefix}${day}`, 'json')
        return post as unknown as Article
      }),
    )
  ).filter(Boolean)

  const episodes = buildEpisodesFromArticles(posts, env.NEXT_STATIC_HOST)

  const podcastInfo: PodcastInfo = {
    title: podcast.base.title,
    description: podcast.base.description,
    link: podcast.base.link,
    cover: podcast.base.cover,
  }

  return (
    <Podcast
      episodes={episodes}
      currentPage={safePage}
      totalEpisodes={totalEpisodes}
      podcastInfo={podcastInfo}
    />
  )
}
