'use client'

import type { Episode } from '@/types/podcast'
import { useSelector } from '@tanstack/react-store'
import { pause, play, playerStore, setCurrentEpisode } from '@/stores/player-store'

export function useEpisodePlayback(episode: Episode) {
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)
  const playerIsPlaying = useSelector(playerStore, state => state.isPlaying)
  const isCurrentEpisode = currentEpisode?.id === episode.id
  const isPlaying = isCurrentEpisode && playerIsPlaying

  function togglePlayback() {
    if (isPlaying) {
      pause()
    }
    else if (isCurrentEpisode) {
      play()
    }
    else {
      setCurrentEpisode(episode)
    }
  }

  return { isPlaying, togglePlayback }
}
