export const stepNames = {
  topStories(today: string): string {
    return `fetch Hacker News top stories for ${today}`
  },
  storyContent(story: Story): string {
    return `fetch story content ${story.id}`
  },
  storySummary(story: Story): string {
    return `summarize story ${story.id} v2`
  },
  pauseAfterStory(story: Story): string {
    return `sleep after story ${story.id}`
  },
  audioSegment(index: number): string {
    return `synthesize audio segment ${index + 1} v2`
  },
  generatePodcastScript: 'generate podcast script',
  pauseAfterPodcastScript: 'sleep after podcast script',
  generateBlogArticle: 'generate blog article',
  pauseAfterBlogArticle: 'sleep after blog article',
  generateIntro: 'generate podcast intro',
  mergeAudioSegments: 'merge audio segments v2',
  saveEpisodeContent: 'save episode content v2',
  cleanupTemporaryAudio: 'cleanup temporary audio v2',
} as const
