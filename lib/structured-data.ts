import type { Episode } from '@/types/podcast'
import { podcast, site } from '@/config'
import { toIsoDateString } from '@/lib/date'
import { cleanMetadataDescription, getAbsoluteUrl } from '@/lib/seo'

export function createPodcastStructuredData(): Record<string, unknown> {
  const organizationId = `${podcast.base.link}/#organization`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        'name': podcast.base.title,
        'url': podcast.base.link,
        'logo': getAbsoluteUrl(podcast.base.cover),
      },
      {
        '@type': 'PodcastSeries',
        '@id': `${podcast.base.link}/#podcast`,
        'name': podcast.base.title,
        'description': podcast.base.description,
        'url': podcast.base.link,
        'image': getAbsoluteUrl(podcast.base.cover),
        'inLanguage': 'zh-CN',
        'webFeed': getAbsoluteUrl('/rss.xml'),
        'publisher': {
          '@id': organizationId,
        },
      },
    ],
  }
}

export function createEpisodeStructuredData(
  episode: Episode,
  updatedAt?: number,
): Record<string, unknown> {
  const title = episode.title || site.seo.defaultTitle
  const url = `${podcast.base.link}/episode/${episode.id}`
  const description = cleanMetadataDescription(episode.description || site.seo.defaultDescription)
  const publishedDate = toIsoDateString(episode.published)
  const modifiedDate = toIsoDateString(updatedAt ?? episode.published)
  const organizationId = `${podcast.base.link}/#organization`
  const podcastId = `${podcast.base.link}/#podcast`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        'name': podcast.base.title,
        'url': podcast.base.link,
        'logo': getAbsoluteUrl(podcast.base.cover),
      },
      {
        '@type': 'PodcastSeries',
        '@id': podcastId,
        'name': podcast.base.title,
        'description': podcast.base.description,
        'url': podcast.base.link,
        'image': getAbsoluteUrl(podcast.base.cover),
        'inLanguage': 'zh-CN',
        'webFeed': getAbsoluteUrl('/rss.xml'),
        'publisher': {
          '@id': organizationId,
        },
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        'headline': title,
        description,
        url,
        'image': getAbsoluteUrl(site.seo.defaultImage),
        'datePublished': publishedDate,
        'dateModified': modifiedDate,
        'inLanguage': 'zh-CN',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': url,
        },
        'author': {
          '@id': organizationId,
        },
        'publisher': {
          '@id': organizationId,
        },
      },
      {
        '@type': 'PodcastEpisode',
        '@id': `${url}#podcast-episode`,
        'name': title,
        description,
        url,
        'datePublished': publishedDate,
        'associatedMedia': {
          '@type': 'MediaObject',
          'contentUrl': episode.audio.src,
          'encodingFormat': episode.audio.type,
        },
        'partOfSeries': {
          '@id': podcastId,
        },
      },
    ],
  }
}
