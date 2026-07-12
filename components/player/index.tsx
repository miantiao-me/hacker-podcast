'use client'

import { useSelector } from '@tanstack/react-store'
import {
  MediaPlayer,

  MediaProvider,
  useMediaPlayer,
} from '@vidstack/react'
import { useEffect } from 'react'
import { PlayerLayout } from '@/components/player/layout'
import { useEpisodeFullscreen } from '@/hooks/use-episode-fullscreen'
import { cn } from '@/lib/utils'
import { pause, play, playerStore, setIsPlaying, setIsSourceChanging } from '@/stores/player-store'

function PlayerContent() {
  const player = useMediaPlayer()
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)
  const isPlaying = useSelector(playerStore, state => state.isPlaying)

  useEffect(() => {
    if (!player)
      return

    const handleCanPlay = () => {
      setIsSourceChanging(false)
    }
    const handlePlay = () => {
      setIsSourceChanging(false)
      setIsPlaying(true)
    }
    const handlePause = () => {
      if (!playerStore.state.isSourceChanging) {
        setIsPlaying(false)
      }
    }
    const handleEnded = () => {
      setIsSourceChanging(false)
      setIsPlaying(false)
    }

    player.addEventListener('can-play', handleCanPlay)
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('ended', handleEnded)

    return () => {
      player.removeEventListener('can-play', handleCanPlay)
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('ended', handleEnded)
    }
  }, [player])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.repeat)
        return
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      if (currentEpisode) {
        if (isPlaying) {
          pause()
        }
        else {
          play()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentEpisode, isPlaying])

  return null
}

export function Player() {
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)
  const isPlaying = useSelector(playerStore, state => state.isPlaying)
  const { isFullscreen: isEpisodeFullscreen } = useEpisodeFullscreen()
  const hasPlayer = currentEpisode !== null
  const shouldShowPlayer = hasPlayer && !isEpisodeFullscreen

  return (
    <div
      className={cn(
        `fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]`,
        isEpisodeFullscreen
          ? `
            md:left-0
            lg:left-0
          `
          : `
            md:left-96
            lg:left-112
          `,
        `
          border-t bg-background/95 backdrop-blur-sm
          supports-backdrop-filter:bg-background/60
        `,
        'transition-opacity duration-300',
        shouldShowPlayer
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
      )}
    >
      <MediaPlayer
        src={currentEpisode?.audio.src}
        autoPlay={isPlaying}
        paused={!isPlaying}
        viewType="audio"
        streamType="on-demand"
        preload="none"
        logLevel="warn"
        playsInline
        title={currentEpisode?.title || ''}
        onPlayFail={(error) => {
          console.error('Failed to play:', error)
          setIsSourceChanging(false)
          setIsPlaying(false)
        }}
      >
        <MediaProvider />
        <PlayerContent />
        <PlayerLayout />
      </MediaPlayer>
    </div>
  )
}
