'use client'

import type { Episode } from '@/types/podcast'
import { RiPauseFill, RiPlayFill } from '@remixicon/react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownExternalLink } from '@/components/common/markdown-external-link'
import { useEpisodePlayback } from '@/hooks/use-episode-playback'
import { formatZhCnUtcDate, toIsoDateString } from '@/lib/date'
import { cn } from '@/lib/utils'

interface EpisodeItemProps {
  episode: Episode
}

export function EpisodeItem({ episode }: EpisodeItemProps) {
  const { isPlaying, togglePlayback } = useEpisodePlayback(episode)

  const dateFormatter = formatZhCnUtcDate(episode.published)
  const isoPublishedDate = toIsoDateString(episode.published)

  const linkHref = `/episode/${episode.id}`
  const episodeLinkTitle = `查看《${episode.title}》详情`
  const showNotesTitle = `打开《${episode.title}》的节目详情页`
  return (
    <li className="list-none">
      <article
        className={cn(
          `
            flex flex-col gap-3 border-b border-border px-4 py-8
            sm:px-6
          `,
          `
            md:px-10 md:py-12
            lg:px-20
          `,
        )}
        itemScope
        itemType="https://schema.org/PodcastEpisode"
      >
        <meta itemProp="url" content={linkHref} />
        <time
          dateTime={isoPublishedDate}
          className={`
            text-xs text-muted-foreground
            md:text-sm
          `}
          itemProp="datePublished"
        >
          {dateFormatter}
        </time>
        <h3 className={`
          text-xl/tight font-bold text-pretty wrap-break-word text-foreground
          md:text-2xl
        `}
        >
          <Link
            href={linkHref}
            className={`
              cursor-pointer transition-colors
              hover:text-theme-text
            `}
            itemProp="url"
            title={episodeLinkTitle}
            aria-label={episodeLinkTitle}
          >
            <span itemProp="name">{episode.title}</span>
          </Link>
        </h3>
        {episode.description && (
          <div
            className={cn(
              `line-clamp-2 leading-relaxed wrap-break-word text-foreground/80`,
              `
                text-sm
                md:text-base
              `,
            )}
            itemProp="description"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <MarkdownExternalLink
                    href={href}
                    className="underline"
                  >
                    {children}
                  </MarkdownExternalLink>
                ),
              }}
            >
              {episode.description}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={cn(
            `
              mt-2 flex flex-wrap items-center font-medium text-theme-text
              hover:text-theme-text-hover
            `,
            `
              gap-3 text-xs
              md:gap-4 md:text-sm
            `,
          )}
        >
          <button
            type="button"
            onClick={togglePlayback}
            className={`
              flex cursor-pointer items-center gap-1.5 font-medium
              text-theme-text transition-colors
              hover:text-theme-text-hover
              md:gap-2
            `}
            aria-label={isPlaying ? '暂停播放' : '播放节目'}
          >
            {isPlaying
              ? (
                  <RiPauseFill className={`
                    size-3.5
                    md:size-4
                  `}
                  />
                )
              : (
                  <RiPlayFill className={`
                    size-3.5
                    md:size-4
                  `}
                  />
                )}
            <span>{isPlaying ? '暂停' : '播放'}</span>
          </button>
          <span className="text-muted-foreground">/</span>
          <Link
            href={linkHref}
            className={`
              cursor-pointer font-medium text-theme-text
              hover:text-theme-text-hover
            `}
            title={showNotesTitle}
            aria-label={showNotesTitle}
          >
            查看详情
          </Link>
        </div>
      </article>
    </li>
  )
}
