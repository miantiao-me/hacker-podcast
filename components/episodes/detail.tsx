'use client'

import type { Components } from 'react-markdown'

import type { Episode } from '@/types/podcast'
import { RiArrowLeftSLine, RiPauseFill, RiPlayFill } from '@remixicon/react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ImageZoom } from '@/components/common/image-zoom'
import { markdownExternalLinkComponents } from '@/components/common/markdown-external-link'
import { Waveform } from '@/components/common/waveform'
import { EpisodeFullscreenToggle } from '@/components/episodes/fullscreen-toggle'
import { useEpisodeFullscreen } from '@/hooks/use-episode-fullscreen'
import { useEpisodePlayback } from '@/hooks/use-episode-playback'
import { formatZhCnUtcDate, toIsoDateString } from '@/lib/date'
import { extractImagesFromMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface EpisodeDetailProps {
  episode: Episode
}

interface EpisodeBackButtonProps {
  ariaLabel: string
  label: string
  className?: string
}

export function EpisodeDetail({ episode }: EpisodeDetailProps) {
  const content = episode.content ?? episode.description ?? ''

  const images = useMemo(() => extractImagesFromMarkdown(content), [content])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const markdownComponents: Partial<Components> = {
    ...markdownExternalLinkComponents,
    img: ({ src, alt }) => {
      if (typeof src !== 'string')
        return null
      const index = images.findIndex(img => img.src === src)
      return (
        <ImageZoom
          src={src}
          alt={alt}
          index={index >= 0 ? index : 0}
        />
      )
    },
  }

  return (
    <EpisodeDetailContent
      episode={episode}
      markdownComponents={markdownComponents}
    />
  )
}

interface EpisodeDetailContentProps extends EpisodeDetailProps {
  markdownComponents: Partial<Components>
}

function EpisodeDetailContent({ episode, markdownComponents }: EpisodeDetailContentProps) {
  const isoPublishedDate = toIsoDateString(episode.published)
  const publishedDateLabel = formatZhCnUtcDate(episode.published)
  const headlineId = useId()
  const { isPlaying, togglePlayback } = useEpisodePlayback(episode)
  const { isFullscreen } = useEpisodeFullscreen({ manageBodyLock: true, resetOnMount: true })

  const articlePath = `/episode/${episode.id}`
  const backLinkTitle = '返回节目列表'
  const detailHeaderClass = cn(
    `
      -mx-4 flex items-center gap-4 border-b border-border/60 px-4 py-6
      md:-mx-10 md:gap-6 md:px-10 md:py-8
      lg:-mx-20 lg:px-20
    `,
    isFullscreen
      ? `
        relative top-auto z-10 bg-background pt-0 shadow-none
        md:top-auto md:pt-0
      `
      : `
        sticky top-14 z-20 bg-background/95 backdrop-blur-sm
        supports-backdrop-filter:bg-background/80
        md:top-24
      `,
  )

  return (
    <section
      className={cn(
        'flex w-full flex-col',
        isFullscreen && `
          fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background
        `,
      )}
      aria-labelledby={headlineId}
      data-fullscreen={isFullscreen}
    >
      <header
        className={cn(
          `
            sticky top-0 z-10 border-b border-border bg-background/95
            backdrop-blur-md
            md:bg-background md:backdrop-blur-none
          `,
          isFullscreen && 'hidden',
        )}
      >
        <div className={`
          flex h-14 w-full items-center justify-center px-4
          md:hidden
        `}
        >
          <EpisodeBackButton
            ariaLabel={backLinkTitle}
            label="返回"
            className="justify-center text-sm"
          />
        </div>
        <div className={`
          relative hidden h-24 w-full items-center
          md:flex
        `}
        >
          <Waveform className="absolute inset-0 size-full" aria-hidden="true" />
          <nav
            aria-label={backLinkTitle}
            className="absolute inset-0 flex items-center"
          >
            <EpisodeBackButton
              ariaLabel={backLinkTitle}
              label="返回"
              className={`
                px-10 text-base
                lg:px-20
              `}
            />
          </nav>
        </div>
      </header>

      <article
        className={cn(`
          px-4 py-8
          md:px-10 md:py-16
          lg:px-20
        `, isFullscreen && `mx-auto w-full max-w-5xl`)}
        itemScope
        itemType="https://schema.org/Article"
        aria-labelledby={headlineId}
      >
        <meta itemProp="url" content={articlePath} />
        <meta itemProp="inLanguage" content="zh" />
        <header className={detailHeaderClass}>
          <button
            type="button"
            onClick={togglePlayback}
            className={cn(
              `
                group mt-2 flex size-14 shrink-0 items-center justify-center
                rounded-full bg-theme
              `,
              `
                shadow-lg shadow-theme/20
                transition-[background-color,box-shadow,transform]
                hover:scale-105 hover:bg-theme-hover hover:shadow-xl
                hover:shadow-theme/30
                motion-reduce:transition-none
                motion-reduce:hover:scale-100
              `,
              `
                cursor-pointer
                focus-visible:ring-2 focus-visible:ring-theme
                focus-visible:ring-offset-2 focus-visible:outline-none
                md:size-18
              `,
            )}
            aria-label={isPlaying ? '暂停播放' : '播放节目'}
          >
            {isPlaying
              ? (
                  <RiPauseFill className={`
                    size-6 fill-white text-white
                    md:size-8
                  `}
                  />
                )
              : (
                  <RiPlayFill className={`
                    size-6 fill-white text-white
                    md:size-8
                  `}
                  />
                )}
          </button>

          <div className="flex w-full items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-col">
              <h1
                id={headlineId}
                className={`
                  mt-2 text-2xl font-bold text-pretty wrap-break-word
                  text-foreground
                  md:text-4xl
                `}
                itemProp="headline"
              >
                {episode.title}
              </h1>
              <time
                className={`
                  order-first font-mono text-xs/7 text-muted-foreground
                  md:text-sm
                `}
                dateTime={isoPublishedDate}
                itemProp="datePublished"
              >
                {publishedDateLabel}
              </time>
            </div>
            <EpisodeFullscreenToggle className="shrink-0 self-center" />
          </div>
        </header>

        <div
          className={cn(
            `
              episode-content text-[1.05rem] leading-[1.85]
              md:text-[1.1rem] md:leading-[1.95]
            `,
            'tracking-wide',
          )}
          itemProp="articleBody"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {episode.content ?? episode.description ?? ''}
          </ReactMarkdown>
        </div>
      </article>
    </section>
  )
}

function EpisodeBackButton({ ariaLabel, label, className }: EpisodeBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        `
          flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent
          p-0 text-left text-foreground transition-colors
          hover:text-muted-foreground
        `,
        className,
      )}
      title={ariaLabel}
      aria-label={ariaLabel}
    >
      <RiArrowLeftSLine className="size-4" />
      <span className="font-bold">{label}</span>
    </button>
  )
}
