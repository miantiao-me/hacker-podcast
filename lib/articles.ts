import type { Article } from '@/schemas/article'
import { env } from 'cloudflare:workers'
import { cache } from 'react'
import { articleSchema } from '@/schemas/article'

function getArticleKey(date: string): string {
  const runEnv = env.NODE_ENV || 'production'
  return `content:${runEnv}:hacker-podcast:${date}`
}

async function getArticleByDateUncached(date: string): Promise<Article | null> {
  const key = getArticleKey(date)
  const value: unknown = await env.HACKER_PODCAST_KV.get(key, 'json')
  if (value === null) {
    return null
  }

  const result = articleSchema.safeParse(value)
  if (!result.success) {
    console.error('Invalid article in KV', { key, date, issues: result.error.issues })
    return null
  }

  return result.data
}

export const getArticleByDate = cache(getArticleByDateUncached)

export async function getArticlesByDates(dates: string[]): Promise<Article[]> {
  const articles = await Promise.all(dates.map(getArticleByDate))
  return articles.filter((article): article is Article => article !== null)
}
