import { NextRequest } from 'next/server'
import { DEFAULT_IMAGE_MODEL, IMAGE_MODELS } from '@/lib/constants'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { prompt, model, provider, width, height, style } = await req.json()
  const selectedModel: string = (typeof model === 'string' && IMAGE_MODELS.includes(model as any)) ? model : DEFAULT_IMAGE_MODEL

  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

  // Preferred: Use Pollinations to truly generate an image per prompt without external stock URLs
  if (!provider || provider === 'pollinations') {
    const w = Math.max(64, Math.min(Number(width) || 1024, 2048))
    const h = Math.max(64, Math.min(Number(height) || 576, 2048))
    const seed = Math.floor(Math.random() * 1e9)
    const styleParam = style && style !== 'default' ? `&model=${encodeURIComponent(style)}` : ''
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(String(prompt || 'image'))}.png?width=${w}&height=${h}&seed=${seed}${styleParam}`
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
    return Response.json({ imageUrl: url, proxyUrl, provider: 'pollinations', width: w, height: h, style: style || 'default' })
  }

  // We will retry across available IMAGE_MODELS on 429s with jittered backoff
  const candidates = [selectedModel, ...IMAGE_MODELS.filter(m => m !== selectedModel)]

  for (let idx = 0; idx < candidates.length; idx++) {
    const m = candidates[idx]
    const body: any = {
      model: m,
      messages: [
        {
          role: 'system',
          content: 'You create images. Reply with ONLY a direct HTTPS image URL that best matches the prompt. No markdown, no JSON, no extra text.'
        },
        { role: 'user', content: String(prompt || '').slice(0, 2000) }
      ],
      temperature: 0.7,
      max_tokens: 200,
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vibecoder.local',
        'X-Title': 'VibeCoder'
      },
      body: JSON.stringify(body)
    })

    if (res.status === 429) {
      // backoff then try next candidate
      const wait = 400 + Math.floor(Math.random() * 600) + idx * 300
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    if (!res.ok) {
      // try next model
      continue
    }
    const data = await res.json().catch(() => null)
    const choice = data?.choices?.[0]
    const content: string | undefined = choice?.message?.content || choice?.delta?.content
    const imageUrl = extractFirstUrl(String(content || ''))
    if (imageUrl) {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      return Response.json({ imageUrl, proxyUrl, sourceModel: m })
    }
  }

  // Final fallback to placeholder
  const url = `https://picsum.photos/seed/${encodeURIComponent(String(prompt || 'placeholder'))}/1024/576`
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`
  return Response.json({ imageUrl: url, proxyUrl, note: 'rate-limited-fallback' })
}

function extractFirstUrl(raw: string): string | null {
  let t = (raw || '').trim()
  if (!t) return null
  // If markdown image, pick inside parentheses: ![alt](URL)
  const md = t.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/)
  if (md?.[1]) return sanitizeUrl(md[1])
  // If angle brackets or quotes
  if ((t.startsWith('<') && t.endsWith('>')) || ((t.startsWith('"') || t.startsWith("'")) && (t.endsWith('"') || t.endsWith("'")))) {
    t = t.slice(1, -1)
  }
  // If it looks like HTML <img src="...">, try to extract src
  const htmlSrc = t.match(/src=["'](https?:[^"']+)["']/i)
  if (htmlSrc?.[1]) return sanitizeUrl(htmlSrc[1])
  // General URL scan
  const m = t.match(/https?:\/\/[^\s)\]>"']+/)
  if (m?.[0]) return sanitizeUrl(m[0])
  return null
}

function sanitizeUrl(u: string): string | null {
  let s = (u || '').trim()
  // Strip trailing punctuation or brackets
  s = s.replace(/[\.,;:!?)>\]]+$/g, '')
  // Remove surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  if (!/^https?:\/\//i.test(s)) return null
  // Encode spaces
  s = s.replace(/\s+/g, '%20')
  return s
}
