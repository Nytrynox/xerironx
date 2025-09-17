import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('url') || ''
  if (!raw) return new Response('Missing url', { status: 400 })
  try {
    // Basic allowlist for protocols
    if (!/^https?:\/\//i.test(raw)) return new Response('Invalid url', { status: 400 })
    const upstream = await fetch(raw, { headers: { 'User-Agent': 'Xerironx-Image-Proxy/1.0' } })
    if (!upstream.ok || !upstream.body) {
      return new Response('Upstream error', { status: upstream.status || 502 })
    }
    // Forward content-type if available
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (e) {
    return new Response('Proxy failure', { status: 500 })
  }
}
