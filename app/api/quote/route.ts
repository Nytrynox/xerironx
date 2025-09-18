import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterHeaders } from '@/lib/utils';

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  const { model = 'qwen/qwen-2.5-72b-instruct:free' } = await req.json().catch(() => ({}))

  if (!apiKey) {
    // Fallback quote when no key is configured
    return Response.json({ quote: 'Configure OPENROUTER_API_KEY to fetch dynamic quotes.' }, { status: 200 })
  }

  const system = 'You generate a concise, original, upbeat one-line motivational prompt or quote for a professional AI app homepage. Keep it under 100 characters. No emojis.'
  const user = 'Give one short line only.'

  // Minimal retry/backoff on 429/5xx
  const payload = JSON.stringify({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  })

  const headers = getOpenRouterHeaders()

  let attempt = 0
  let lastRes: Response | null = null
  while (attempt < 3) {
    attempt++
    const res = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers, body: payload })
    lastRes = res
    if (res.ok) {
      const data = await res.json()
      const quote = data?.choices?.[0]?.message?.content?.trim() || ''
      return Response.json({ quote: quote.replace(/^"|"$/g, '') })
    }
    if (res.status === 429 || res.status >= 500) {
      const backoff = 300 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200)
      await new Promise(r => setTimeout(r, backoff))
      continue
    }
    break
  }

  if (lastRes) {
    const text = await lastRes.text().catch(() => 'Quote service error')
    return new Response(text, { status: lastRes.status || 502 })
  }
  return new Response('Quote service error', { status: 502 })
}
