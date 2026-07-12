'use client'

import { RiGithubFill } from '@remixicon/react'
import { Fragment } from 'react'
import { ThemeToggle } from '@/components/theme/toggle'
import { externalLinks, podcast } from '@/config'

export function PodcastAside() {
  return (
    <aside
      aria-label="播客工具"
      className={`
        flex shrink-0 items-center justify-between border-b border-border
        pt-[calc(0.75rem+env(safe-area-inset-top))]
        pr-[calc(1rem+env(safe-area-inset-right))] pb-3
        pl-[calc(1rem+env(safe-area-inset-left))]
        md:h-full md:w-16 md:flex-col md:overflow-y-auto md:overscroll-y-contain
        md:border-r md:border-b-0 md:px-4 md:py-8
      `}
    >
      <div className={`
        hidden items-center gap-3 whitespace-nowrap
        sm:flex
        md:gap-6 md:py-4 md:[writing-mode:vertical-rl]
      `}
      >
        <span className="font-mono text-muted-foreground">主播</span>
        <span className={`
          flex gap-3 font-bold
          md:gap-6
        `}
        >
          {podcast.hosts.map((host, index) => (
            <Fragment key={host.name}>
              {index !== 0 && (
                <span aria-hidden="true" className="text-muted-foreground">
                  /
                </span>
              )}
              <a
                href={host.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  cursor-pointer transition-colors
                  hover:text-theme-text
                  focus-visible:rounded-sm focus-visible:ring-2
                  focus-visible:ring-ring focus-visible:outline-none
                `}
              >
                {host.name}
              </a>
            </Fragment>
          ))}
        </span>
      </div>
      <div className={`
        ml-auto flex items-center gap-5
        md:ml-0 md:flex-col
      `}
      >
        <a
          href={externalLinks.github}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            cursor-pointer rounded-sm transition-colors
            hover:text-theme-text
            focus-visible:ring-2 focus-visible:ring-ring
            focus-visible:outline-none
          `}
          aria-label="打开 GitHub 仓库"
        >
          <RiGithubFill className="size-6" aria-hidden="true" />
        </a>
        <ThemeToggle />
      </div>
    </aside>
  )
}
