import { NextRequest } from 'next/server'
import { FALLBACK_MODELS } from '@/lib/constants'
import { getSiteOrigin } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
	const { messages = [], model, temperature, max_tokens } = await req.json()

	const apiKey = process.env.OPENROUTER_API_KEY
	const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

	if (!apiKey) {	
		const encoder = new TextEncoder()
		const mock = `Hello! (No OPENROUTER_API_KEY set). You asked: "${messages?.[messages.length-1]?.content || ''}".`
		const chunks = mock.match(/.{1,80}/g) || [mock]
		const readable = new ReadableStream<Uint8Array>({
			async start(controller) {
				for (const c of chunks) {
					controller.enqueue(encoder.encode(c))
					await new Promise(r => setTimeout(r, 30))
				}
				controller.close()
			}
		})
		return new Response(readable, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
		})
	}

	async function callUpstream(selectedModel: string) {
		const body: any = {
			model: selectedModel,
			stream: true,
			temperature: typeof temperature === 'number' ? temperature : 0.5,
			max_tokens: typeof max_tokens === 'number' ? max_tokens : 1000,
			messages
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

	// Retry with exponential backoff on 429/5xx and then fall back to alternates
	async function tryWithRetries(modelsToTry: string[]): Promise<Response> {
		let last: Response | null = null
		for (const m of modelsToTry) {
			for (let attempt = 1; attempt <= 3; attempt++) {
				const res = await callUpstream(m)
				last = res
				if (res.ok && res.body) return res
				const retryAfter = Number(res.headers.get('retry-after') || '0')
				const shouldRetry = res.status === 429 || res.status >= 500
				if (!shouldRetry || attempt === 3) break
				const base = retryAfter > 0 ? retryAfter * 1000 : 300 * Math.pow(2, attempt - 1)
				const jitter = Math.floor(Math.random() * 200)
				await new Promise(r => setTimeout(r, base + jitter))
			}
		}
		return last || new Response('Upstream error', { status: 502 })
	}

	const upstream = await tryWithRetries([model, ...FALLBACK_MODELS])
	if (!upstream.ok || !upstream.body) {
		const text = await upstream.text().catch(() => 'Upstream error')
		return new Response(text, { status: upstream.status || 502 })
	}

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
							controller.enqueue(encoder.encode(data))
						}
					}
				}
				if (buffer) {
					try {
						const json = JSON.parse(buffer)
						const choice = json.choices?.[0]
						const delta = choice?.delta?.content ?? choice?.message?.content ?? ''
						if (delta) controller.enqueue(encoder.encode(delta))
					} catch {}
				}
			} catch (e: any) {
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
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
	})
}

