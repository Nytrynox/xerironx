import { NextRequest } from 'next/server'
import { systemPrompt } from '@/lib/prompt'
import { FALLBACK_MODELS, SITE_NAME } from '@/lib/constants'
import { getSiteOrigin } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { model, framework, prompt } = await req.json()

  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

  // If no API key configured, stream a local mock JSON so the UI still works
  if (!apiKey) {
    const mock = makeMockFileMap('vanilla', prompt)
    const encoder = new TextEncoder()
    const chunks = chunkString(JSON.stringify(mock), 180)
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const c of chunks) {
          controller.enqueue(encoder.encode(c))
          await delay(40)
        }
        controller.close()
      }
    })
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  }

  async function callUpstream(selectedModel: string) {
    const body: any = {
      model: selectedModel,
      stream: true,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Return ONLY valid JSON (no markdown fences). Start your reply with '{' and end with '}'. Do not add commentary.\nWebsite name: ${SITE_NAME}\nFramework: ${framework}\nPrompt: ${prompt}`
        }
      ]
    }
    return fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': getSiteOrigin(),
        'X-Title': 'Xerironx'
      },
      body: JSON.stringify(body)
    })
  }

  // Primary attempt
  let upstream = await callUpstream(model)
  // Retry with fallbacks on model-not-found (404/400) or non-ok
  if ((!upstream.ok) && (upstream.status === 404 || upstream.status === 400)) {
    for (const alt of FALLBACK_MODELS) {
      const tryRes = await callUpstream(alt)
      if (tryRes.ok && tryRes.body) { upstream = tryRes; break }
    }
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => 'Upstream error')
    return new Response(text, { status: upstream.status || 502 })
  }

  // Transform SSE to plain text token stream
  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      let buffer = ''
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              const choice = json.choices?.[0]
              const delta = choice?.delta?.content ?? choice?.message?.content ?? ''
              if (delta) controller.enqueue(encoder.encode(delta))
            } catch {
              // If it's not JSON, forward as-is
              controller.enqueue(encoder.encode(data))
            }
          }
        }
        if (buffer) {
          // final partial line
          try {
            const json = JSON.parse(buffer)
            const choice = json.choices?.[0]
            const delta = choice?.delta?.content ?? choice?.message?.content ?? ''
            if (delta) controller.enqueue(encoder.encode(delta))
          } catch {
            // ignore
          }
        }
      } catch (e: any) {
        // Swallow abort-related errors to avoid noisy logs
        if (e?.name === 'AbortError' || e?.code === 'ECONNRESET') {
          try { controller.close() } catch {}
        } else {
          controller.error(e)
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

function chunkString(s: string, n: number) {
  const out: string[] = []
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n))
  return out
}

function makeMockFileMap(_framework: string, prompt: string) {
  const title = 'Preview — Mock Output'
  const description = `This is a local mock preview because OPENROUTER_API_KEY is not set.\nPrompt: ${prompt}`
  return {
    files: {
      '/index.html': { code: `<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/><title>${title}</title><link href=\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\"></head><body class=\"bg-gray-950 text-gray-100\"><main class=\"max-w-3xl mx-auto p-6\"><h1 class=\"text-2xl font-semibold\">${title}</h1><p class=\"mt-2 text-gray-300\">${description}</p><div class=\"mt-6 grid grid-cols-2 gap-3\"><div class=\"p-4 rounded bg-gray-900 border border-white/10\">Card A</div><div class=\"p-4 rounded bg-gray-900 border border-white/10\">Card B</div></div></main></body></html>` }
    },
    entry: '/index.html',
    framework: 'vanilla'
  }
}
