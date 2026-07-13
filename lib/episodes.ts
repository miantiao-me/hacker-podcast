import type { Article } from '@/schemas/article'
import type { Episode } from '@/types/podcast'

function appendUpdatedAt(url: string, updatedAt?: number): string {
  return updatedAt ? `${url}?t=${updatedAt}` : url
}

export function buildAudioUrl(staticHost: string, audioPath: string, updatedAt?: number): string {
  const normalizedHost = staticHost?.replace(/\/$/, '')
  if (/^https?:\/\//.test(audioPath)) {
    return appendUpdatedAt(audioPath, updatedAt)
  }

  const cleanedPath = audioPath.replace(/^\//, '')
  return appendUpdatedAt(`${normalizedHost}/${cleanedPath}`, updatedAt)
}

function buildReferencesSection(stories?: Story[]): string {
  if (!stories || stories.length === 0) {
    return ''
  }

  const items = stories
    .flatMap((story): string[] => {
      const title = story.title || story.url || story.hackerNewsUrl || ''
      const href = story.url || story.hackerNewsUrl || '#'
      if (!title || !href)
        return []
      return [`- [${title}](${href})`]
    })

  if (items.length === 0) {
    return ''
  }

  return ['## 参考链接', ...items].join('\n')
}

export function buildEpisodeFromArticle(
  article: Article,
  staticHost: string,
): Episode {
  const description
    = article.introContent
      || article.podcastContent?.split('\n')?.[0]
      || article.blogContent?.split('\n')?.[0]
      || article.title

  const sections: string[] = []

  if (article.blogContent) {
    sections.push(article.blogContent)
  }

  if (article.podcastContent) {
    sections.push(`## 播客全文\n\n${article.podcastContent}`)
  }

  const references = buildReferencesSection(article.stories)
  if (references) {
    sections.push(references)
  }

  return {
    id: article.date,
    title: article.title,
    description,
    content: sections.join('\n\n'),
    published: article.date,
    audio: {
      src: buildAudioUrl(staticHost, article.audio, article.updatedAt),
      type: 'audio/mpeg',
    },
    summary: article.introContent,
    stories: article.stories,
  }
}

export function buildEpisodesFromArticles(
  articles: Article[],
  staticHost: string,
): Episode[] {
  return articles
    .map(article => buildEpisodeFromArticle(article, staticHost))
    .sort((a, b) => (a.published < b.published ? 1 : -1))
}
