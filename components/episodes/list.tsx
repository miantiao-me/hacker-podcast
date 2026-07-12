'use client'

import type { Episode } from '@/types/podcast'
import { useEffect, useId } from 'react'
import { Waveform } from '@/components/common/waveform'
import { EpisodeItem } from '@/components/episodes/episode-item'
import { EpisodePagination } from '@/components/episodes/pagination'
import { site } from '@/config'
import { setDefaultEpisode } from '@/stores/player-store'

interface EpisodeListProps {
  episodes: Episode[]
  currentPage: number
  totalEpisodes: number
}

export function EpisodeList({ episodes, currentPage, totalEpisodes }: EpisodeListProps) {
  useEffect(() => {
    if (!episodes[0])
      return

    setDefaultEpisode(episodes[0])
  }, [episodes])

  const headingId = useId()
  const listHeadingId = useId()
  const pageSize = site.pageSize
  const totalPages = Math.max(1, Math.ceil(totalEpisodes / pageSize))
  const hasEpisodes = episodes.length > 0

  return (
    <section className="flex w-full flex-col" aria-labelledby={headingId}>
      <header className={`
        sticky top-0 z-10 border-b border-border bg-background/95
        backdrop-blur-lg
        md:bg-background md:backdrop-blur-none
      `}
      >
        <div className="relative flex items-center">
          <Waveform
            className={`
              hidden h-24 w-full
              md:block
            `}
            aria-hidden="true"
          />
          <h1
            id={headingId}
            className={`
              px-4 py-6 text-xl font-bold text-pretty
              md:absolute md:inset-0 md:top-10 md:px-10 md:py-0 md:text-2xl
              lg:px-20
            `}
          >
            节目列表
          </h1>
        </div>
      </header>

      <div className={`
        px-4 pt-6
        md:px-10 md:pt-12
        lg:px-20
      `}
      >
        <h2
          id={listHeadingId}
          className={`
            text-lg font-semibold text-pretty text-foreground
            md:text-xl
          `}
        >
          最近更新
        </h2>
      </div>

      {!hasEpisodes
        ? (
            <p
              className={`
                px-4 py-8 text-center text-muted-foreground
                md:px-10 md:py-20
                lg:px-20
              `}
              role="status"
            >
              暂无节目
            </p>
          )
        : (
            <>
              <ul className="flex flex-col" aria-labelledby={listHeadingId}>
                {episodes.map(episode => (
                  <EpisodeItem key={episode.id} episode={episode} />
                ))}
              </ul>
              <EpisodePagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
    </section>
  )
}
