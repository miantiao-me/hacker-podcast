import { env } from 'cloudflare:workers'
import { notFound } from 'next/navigation'
import { EpisodeDetail } from '@/components/episodes/detail'
import { PodcastLayout } from '@/components/podcast/layout'
import { StructuredData } from '@/components/seo/structured-data'
import { podcast, site } from '@/config'
import { getArticleByDate } from '@/lib/articles'
import { toIsoDateString } from '@/lib/date'
import { buildEpisodeFromArticle } from '@/lib/episodes'
import { cleanMetadataDescription, getAbsoluteUrl } from '@/lib/seo'
import { createEpisodeStructuredData } from '@/lib/structured-data'

export const revalidate = 7200

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const post = await getArticleByDate(date)

  if (!post) {
    return notFound()
  }

  const episode = buildEpisodeFromArticle(post, env.NEXT_STATIC_HOST)
  const title = episode.title || site.seo.defaultTitle
  const description = cleanMetadataDescription(episode.description || site.seo.defaultDescription)
  const url = `${podcast.base.link}/episode/${episode.id}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      locale: site.seo.locale,
      type: 'article',
      publishedTime: toIsoDateString(episode.published),
      images: [
        {
          url: getAbsoluteUrl(site.seo.defaultImage),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getAbsoluteUrl(site.seo.defaultImage)],
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params

  const post = await getArticleByDate(date)

  if (!post) {
    return notFound()
  }

  const episode = buildEpisodeFromArticle(post, env.NEXT_STATIC_HOST)
  const structuredData = createEpisodeStructuredData(episode, post.updatedAt)

  return (
    <PodcastLayout>
      <StructuredData data={structuredData} />
      <EpisodeDetail episode={episode} />
    </PodcastLayout>
  )
}
