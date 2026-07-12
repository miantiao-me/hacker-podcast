'use client'

import type { RemixiconComponentType } from '@remixicon/react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { RiAppleFill, RiRssLine, RiYoutubeFill } from '@remixicon/react'
import { Image } from '@unpic/react'
import Link from 'next/link'
import { useId, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownExternalLinkComponents } from '@/components/common/markdown-external-link'
import { Waveform } from '@/components/common/waveform'
import { SpotifyIcon } from '@/components/icons/spotify'
import { XYZIcon } from '@/components/icons/xyz'
import { podcast, site } from '@/config'
import { cn } from '@/lib/utils'

interface PlatformConfig {
  icon: ComponentType<SVGProps<SVGSVGElement>> | RemixiconComponentType
  colorClass: string
}

const platformIcons: Record<string, PlatformConfig> = {
  youtube: {
    icon: RiYoutubeFill,
    colorClass: 'text-red-500 hover:text-red-600',
  },
  apple: {
    icon: RiAppleFill,
    colorClass: 'text-purple-500 hover:text-purple-600',
  },
  rss: {
    icon: RiRssLine,
    colorClass: 'text-orange-500 hover:text-orange-600',
  },
  xiaoyuzhou: {
    icon: XYZIcon,
    colorClass: 'text-[#25b4e1] hover:text-[#25b4e1]',
  },
  spotify: {
    icon: SpotifyIcon,
    colorClass: 'text-green-500 hover:text-green-600',
  },
}

const coverImageOperations = {
  wsrv: {
    a: 'entropy',
    fit: 'cover',
    q: 88,
    we: true,
  },
} as const

export function PodcastInfo() {
  const [isExpanded, setIsExpanded] = useState(false)
  const titleId = useId()
  const aboutSectionId = useId()
  const listenSectionId = useId()
  const descriptionContentId = useId()
  const { title, description, cover } = podcast.base
  const coverAlt = `${title} 封面`
  const coverSrc = new URL(cover, podcast.base.link).toString()
  const homeLinkTitle = `返回首页：${title}`
  const shouldTruncate = description.length > site.defaultDescriptionLength
  const markdownComponents = {
    ...markdownExternalLinkComponents,
    p: ({ children }: { children?: ReactNode }) => (
      <p className="leading-relaxed text-pretty">{children}</p>
    ),
  }

  return (
    <article
      className={cn(
        `
          relative flex flex-col gap-8 px-4 pt-16 pb-10
          sm:px-8
        `,
        `
          md:gap-12 md:px-8 md:py-12
          lg:px-12
        `,
      )}
      aria-labelledby={titleId}
      itemScope
      itemType="https://schema.org/PodcastSeries"
    >
      <meta itemProp="url" content={podcast.base.link} />
      <meta itemProp="image" content={cover} />
      <Waveform
        className={`
          absolute inset-x-0 top-0 w-full
          md:hidden
        `}
        aria-hidden="true"
      />

      <figure className={`
        flex justify-center pt-4
        md:pt-0
      `}
      >
        <Link
          href="/"
          aria-label={homeLinkTitle}
          title={homeLinkTitle}
          className={`
            block aspect-square w-40
            md:w-full md:max-w-sm
            lg:max-w-md
          `}
        >
          <Image
            className="size-full rounded-2xl object-cover"
            src={coverSrc}
            alt={coverAlt}
            layout="constrained"
            width={640}
            height={640}
            fallback="wsrv"
            operations={coverImageOperations}
            objectFit="cover"
            priority
          />
        </Link>
        <figcaption className="sr-only">{title}</figcaption>
      </figure>

      <p
        id={titleId}
        className={`
          text-center text-2xl font-bold text-pretty wrap-break-word
          md:text-left md:text-xl
        `}
        itemProp="name"
      >
        {title}
      </p>

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-5" aria-labelledby={aboutSectionId}>
          <p
            className={`
              text-center font-mono text-xs text-muted-foreground
              md:text-left md:text-sm md:font-medium md:normal-case
            `}
            id={aboutSectionId}
          >
            关于
          </p>

          <div className="flex flex-col gap-2" itemProp="description">
            <div
              id={descriptionContentId}
              className={cn(shouldTruncate && !isExpanded && 'line-clamp-6')}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {description}
              </ReactMarkdown>
            </div>
            {shouldTruncate && (
              <button
                type="button"
                onClick={() => setIsExpanded(current => !current)}
                className={`
                  cursor-pointer self-start font-medium text-theme-text
                  transition-colors
                  hover:text-theme-text-hover
                `}
                aria-expanded={isExpanded}
                aria-controls={descriptionContentId}
              >
                {isExpanded ? '收起' : '展开更多'}
              </button>
            )}
          </div>
        </section>

        {podcast.platforms?.length
          ? (
              <section className="flex flex-col gap-5" aria-labelledby={listenSectionId}>
                <p
                  className={`
                    text-center font-mono text-xs text-muted-foreground
                    md:text-left md:text-sm md:font-medium md:normal-case
                  `}
                  id={listenSectionId}
                >
                  收听平台
                </p>

                <ul className={`
                  flex items-center justify-center gap-6
                  md:flex-col md:items-start md:justify-start
                `}
                >
                  {podcast.platforms.map((platform) => {
                    const config = platformIcons[platform.id]
                    if (!config)
                      return null
                    const Icon = config.icon
                    const platformLinkLabel = platform.id === 'rss'
                      ? '订阅 RSS'
                      : `前往 ${platform.name}`
                    return (
                      <li key={platform.id} className="list-none">
                        <a
                          href={platform.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`
                            flex cursor-pointer items-center gap-2
                            transition-colors
                            hover:text-theme-text-hover
                          `}
                          aria-label={platformLinkLabel}
                          itemProp="sameAs"
                        >
                          <Icon
                            className={cn(`
                              size-8
                              md:size-6
                            `, config.colorClass)}
                            aria-hidden="true"
                          />
                          <span className={`
                            hidden
                            md:inline
                          `}
                          >
                            {platformLinkLabel}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          : null}
      </div>

    </article>
  )
}
