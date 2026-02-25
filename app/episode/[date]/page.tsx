import type { Metadata } from 'next'
import { env } from 'cloudflare:workers'
import { notFound } from 'next/navigation'
import { EpisodeDetail } from '@/components/episodes/detail'
import { PodcastScaffold } from '@/components/podcast/scaffold'
import { podcast, site } from '@/config'
import { buildEpisodeFromArticle } from '@/lib/episodes'

export const revalidate = 7200

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>
}): Promise<Metadata> {
  const runEnv = env.NODE_ENV || 'production'
  const { date } = await params
  const post = (await env.HACKER_PODCAST_KV.get(`content:${runEnv}:hacker-podcast:${date}`, 'json')) as unknown as Article | null

  if (!post) {
    return notFound()
  }

  const episode = buildEpisodeFromArticle(post, env.NEXT_STATIC_HOST)
  const title = episode.title || site.seo.defaultTitle
  const description = episode.description || site.seo.defaultDescription
  const url = `${podcast.base.link}/episode/${episode.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: new Date(episode.published).toISOString(),
      images: [
        {
          url: site.seo.defaultImage,
          alt: episode.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [site.seo.defaultImage],
    },
  }
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const runEnv = env.NODE_ENV || 'production'
  const { date } = await params
  const pageQuery = await searchParams
  const fallbackPage = Number.parseInt(pageQuery.page ?? '1', 10)

  const post = (await env.HACKER_PODCAST_KV.get(`content:${runEnv}:hacker-podcast:${date}`, 'json')) as unknown as Article | null

  if (!post) {
    return notFound()
  }

  const episode = buildEpisodeFromArticle(post, env.NEXT_STATIC_HOST)
  const podcastInfo = {
    title: podcast.base.title,
    description: podcast.base.description,
    link: podcast.base.link,
    cover: podcast.base.cover,
  }

  const safePage = Number.isNaN(fallbackPage) ? 1 : Math.max(1, fallbackPage)
  return (
    <PodcastScaffold podcastInfo={podcastInfo}>
      <EpisodeDetail episode={episode} initialPage={safePage} />
    </PodcastScaffold>
  )
}
