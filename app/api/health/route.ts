import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://xerironx.vercel.app'
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    site: {
      url: siteUrl,
      origin: siteUrl.replace(/\/$/, '')
    },
    features: {
      googleAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      openrouter: !!process.env.OPENROUTER_API_KEY,
      nextauth: !!process.env.NEXTAUTH_SECRET
    },
    environment: process.env.NODE_ENV || 'development'
  }

  return Response.json(health, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json'
    }
  })
}
