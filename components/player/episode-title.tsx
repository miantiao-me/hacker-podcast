'use client'

import { useSelector } from '@tanstack/react-store'
import { ScrollTextContainer, ScrollTextRow } from '@/components/player/scroll-text'
import { playerStore } from '@/stores/player-store'

export function EpisodeTitle() {
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)
  const isPlaying = useSelector(playerStore, state => state.isPlaying)

  if (!currentEpisode) {
    return null
  }

  return (
    <ScrollTextContainer className="w-60 text-sm">
      <ScrollTextRow baseVelocity={20} direction={1} isPlaying={isPlaying}>
        {currentEpisode.title}
      </ScrollTextRow>
    </ScrollTextContainer>
  )
}
