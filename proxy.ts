import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/', '/sitemap.xml'],
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname === '/' && searchParams.get('page') !== null) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  if (pathname === '/') {
    response.headers.set(
      'Cloudflare-CDN-Cache-Control',
      'public, max-age=600, stale-while-revalidate=31536000',
    )
  }
  else if (pathname === '/sitemap.xml') {
    response.headers.set(
      'Cloudflare-CDN-Cache-Control',
      'public, max-age=86400, stale-while-revalidate=31536000',
    )
  }

  return response
}
