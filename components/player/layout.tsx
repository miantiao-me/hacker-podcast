'use client'

import { useSelector } from '@tanstack/react-store'
import { Controls } from '@vidstack/react'
import { EpisodeTitle } from '@/components/player/episode-title'
import { Play } from '@/components/player/play'
import { SeekBackward, SeekForward } from '@/components/player/seek'
import { Speed } from '@/components/player/speed'
import { CurrentTime, Duration } from '@/components/player/time-info'
import { TimeSliders } from '@/components/player/time-sliders'
import { Mute, Volume } from '@/components/player/volume'
import { cn } from '@/lib/utils'
import { playerStore } from '@/stores/player-store'

export function PlayerLayout() {
  const currentEpisode = useSelector(playerStore, state => state.currentEpisode)

  return (
    <Controls.Root
      className={cn(
        `
          flex w-full flex-col gap-3 px-4 py-3
          md:gap-5 md:px-10 md:py-4
        `,
        '[--media-menu-y-offset:10px] [--media-tooltip-y-offset:10px]',
      )}
    >
      {currentEpisode && (
        <div className={`
          line-clamp-1 text-center text-sm font-medium
          md:hidden
        `}
        >
          {currentEpisode.title}
        </div>
      )}

      <Controls.Group className={`
        relative flex w-full items-center justify-center
        md:min-h-14 md:justify-between
      `}
      >
        <div className={`
          hidden
          xl:block
        `}
        >
          <EpisodeTitle />
        </div>

        <div className={`
          flex items-center gap-3
          md:absolute md:top-1/2 md:left-1/2 md:-translate-1/2 md:gap-4
        `}
        >
          <SeekBackward />
          <Play
            tooltipPlacement="top"
            className={`
              size-10
              md:size-12
            `}
          />
          <SeekForward />
        </div>

        <div className={`
          hidden
          xl:block
        `}
        >
          <div className="flex items-center gap-4">
            <Speed />
            <div className="flex items-center">
              <Mute />
              <Volume />
            </div>
          </div>
        </div>
      </Controls.Group>

      <Controls.Group className={`
        flex size-full items-center gap-2
        md:gap-3
      `}
      >
        <CurrentTime className={`
          text-xs
          md:text-sm
        `}
        />
        <TimeSliders />
        <Duration className={`
          text-xs
          md:text-sm
        `}
        />
      </Controls.Group>
    </Controls.Root>
  )
}
