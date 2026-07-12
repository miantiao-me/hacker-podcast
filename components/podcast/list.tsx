import { env } from 'cloudflare:workers'
import { redirect } from 'next/navigation'
import { EpisodeList } from '@/components/episodes/list'
import { PodcastLayout } from '@/components/podcast/layout'
import { StructuredData } from '@/components/seo/structured-data'
import { keepDays, site } from '@/config'
import { getArticlesByDates } from '@/lib/articles'
import { getPastDays } from '@/lib/date'
import { buildEpisodesFromArticles } from '@/lib/episodes'
import { createPodcastStructuredData } from '@/lib/structured-data'

interface PodcastListProps {
  currentPage: number
}

export async function PodcastList({ currentPage }: PodcastListProps) {
  const pastDays = getPastDays(keepDays)
  const totalEpisodes = pastDays.length
  const totalPages = Math.max(1, Math.ceil(totalEpisodes / site.pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

  if (safePage !== currentPage) {
    redirect(safePage <= 1 ? '/' : `/page/${safePage}`)
  }

  const startIndex = (safePage - 1) * site.pageSize
  const pageDays = pastDays.slice(startIndex, startIndex + site.pageSize)

  const posts = await getArticlesByDates(pageDays)

  const episodes = buildEpisodesFromArticles(posts, env.NEXT_STATIC_HOST)

  const structuredData = createPodcastStructuredData()

  return (
    <>
      <StructuredData data={structuredData} />
      <PodcastLayout>
        <EpisodeList
          episodes={episodes}
          currentPage={safePage}
          totalEpisodes={totalEpisodes}
        />
      </PodcastLayout>
    </>
  )
}
