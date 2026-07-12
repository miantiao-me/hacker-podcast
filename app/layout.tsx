import type { ThemeColor } from '@/types/podcast'
import { Providers } from '@/components/providers'
import { podcast, site } from '@/config'
import { getAbsoluteUrl } from '@/lib/seo'
import './globals.css'

const themeInitializer = `
  (function() {
    try {
      const theme = localStorage.getItem('next-ui-theme') || 'system'
      const root = document.documentElement
      root.classList.remove('light', 'dark')

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      }
      else {
        root.classList.add(theme)
      }
    }
    catch (error) {
      console.error('Failed to initialize theme', error)
    }
  })()
`

const themeClassNames = {
  blue: 'theme-blue',
  pink: 'theme-pink',
  purple: 'theme-purple',
  green: 'theme-green',
  yellow: 'theme-yellow',
  orange: 'theme-orange',
  red: 'theme-red',
} satisfies Record<ThemeColor, string>

export const metadata = {
  title: {
    default: site.seo.defaultTitle,
    template: `%s · ${site.seo.siteName}`,
  },
  description: site.seo.defaultDescription,
  alternates: {
    canonical: podcast.base.link,
    types: {
      'application/rss+xml': getAbsoluteUrl('/rss.xml'),
    },
  },
  openGraph: {
    title: site.seo.defaultTitle,
    description: site.seo.defaultDescription,
    url: podcast.base.link,
    locale: site.seo.locale,
    type: 'website',
    images: [
      {
        url: getAbsoluteUrl(site.seo.defaultImage),
        width: 1200,
        height: 630,
        alt: site.seo.defaultTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: site.seo.twitterHandle,
    title: site.seo.defaultTitle,
    description: site.seo.defaultDescription,
    images: [getAbsoluteUrl(site.seo.defaultImage)],
  },
  icons: {
    icon: site.favicon,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={themeClassNames[site.themeColor]}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
        <script id="theme-initializer">{themeInitializer}</script>
      </head>
      <body>
        <a
          href="#main-scroll-container"
          className={`
            sr-only
            focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100
            focus:rounded-md focus:bg-background focus:px-4 focus:py-2
            focus:text-foreground focus:shadow-lg
            focus-visible:ring-2 focus-visible:ring-ring
            focus-visible:outline-none
          `}
        >
          跳到主要内容
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
