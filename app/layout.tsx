import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import process from 'node:process'
import { headers } from 'next/headers'
import { Providers } from '@/components/providers'
import { podcast, site } from '@/config'
import { defaultLocale, detectLocale } from '@/i18n/config'
import './globals.css'
import '@vidstack/react/player/styles/base.css'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/audio.css'

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

// vinext's metadata shim expects a string (calls .startsWith()),
// not a URL object like Next.js does
const metadataBase = process.env.NEXT_PUBLIC_BASE_URL
  ? (process.env.NEXT_PUBLIC_BASE_URL as unknown as URL)
  : undefined

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: site.seo.defaultTitle,
    template: `%s · ${site.seo.siteName}`,
  },
  description: site.seo.defaultDescription,
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
  openGraph: {
    title: site.seo.defaultTitle,
    description: site.seo.defaultDescription,
    url: podcast.base.link,
    type: 'website',
    images: [
      {
        url: site.seo.defaultImage,
        alt: site.seo.defaultTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: site.seo.twitterHandle,
    title: site.seo.defaultTitle,
    description: site.seo.defaultDescription,
    images: [site.seo.defaultImage],
  },
  icons: {
    icon: site.favicon,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  const detectedLocale: Locale = acceptLanguage ? detectLocale(acceptLanguage) : defaultLocale

  return (
    <html
      lang={detectedLocale}
      className={`
        theme-${site.themeColor}
      `}
      suppressHydrationWarning
    >
      <head>
        <script id="theme-initializer">{themeInitializer}</script>
      </head>
      <body>
        <Providers detectedLocale={detectedLocale}>{children}</Providers>
      </body>
    </html>
  )
}
