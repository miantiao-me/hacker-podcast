export type ThemeColor
  = | 'blue'
    | 'pink'
    | 'purple'
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red'

export interface Site {
  themeColor: ThemeColor
  pageSize: number
  defaultDescriptionLength: number
  seo: {
    siteName: string
    defaultTitle: string
    defaultDescription: string
    defaultImage: string
    twitterHandle?: string
    locale: string
  }
  favicon: string
}

export interface PodcastHost {
  name: string
  link: string
}

export interface PodcastPlatform {
  id: string
  name: string
  link: string
}

export interface PodcastBase {
  title: string
  description: string
  link: string
  cover: string
}

export interface Podcast {
  base: PodcastBase
  hosts: PodcastHost[]
  platforms: PodcastPlatform[]
}

export interface EpisodeAudio {
  src: string
  type: string
}

export interface Episode {
  id: string
  title: string
  description: string
  content?: string
  published: string
  audio: EpisodeAudio
  summary?: string
  stories?: Story[]
}
