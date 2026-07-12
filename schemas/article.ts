import { z } from 'zod'

const storySchema = z.looseObject({
  id: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  hackerNewsUrl: z.string().optional(),
})

export const articleSchema = z.looseObject({
  date: z.string(),
  title: z.string(),
  stories: z.array(storySchema),
  podcastContent: z.string(),
  blogContent: z.string(),
  introContent: z.string().default(''),
  audio: z.string(),
  audioSize: z.number().optional(),
  updatedAt: z.number().optional(),
})

export type Article = z.infer<typeof articleSchema>
