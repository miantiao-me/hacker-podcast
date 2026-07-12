import { PodcastAside } from '@/components/podcast/aside'
import { PodcastInfo } from '@/components/podcast/info'

interface PodcastLayoutProps {
  children: React.ReactNode
}

export function PodcastLayout({ children }: PodcastLayoutProps) {
  return (
    <div className={`
      flex min-h-dvh flex-col
      md:fixed md:inset-0 md:flex-row md:overflow-hidden md:bg-background
    `}
    >
      <PodcastAside />

      <div className={`
        flex flex-col border-b border-border
        md:h-full md:w-80 md:shrink-0 md:overflow-y-auto md:overscroll-y-contain
        md:border-r md:border-b-0
        lg:w-96
      `}
      >
        <PodcastInfo />
      </div>

      <main
        id="main-scroll-container"
        tabIndex={-1}
        className={`
          flex flex-1 flex-col pb-[calc(7rem+env(safe-area-inset-bottom))]
          md:overflow-y-auto md:overscroll-y-contain
        `}
      >
        {children}
      </main>
    </div>
  )
}
