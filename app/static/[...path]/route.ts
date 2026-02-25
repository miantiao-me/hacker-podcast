import { env } from 'cloudflare:workers'

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params

  const file = await env.HACKER_PODCAST_R2.get(path.join('/'))
  return new Response(file?.body)
}
