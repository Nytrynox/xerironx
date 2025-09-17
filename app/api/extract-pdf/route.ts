import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Hard cap to avoid OOM and provider limits (10MB)
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    if (!ct || (!ct.includes('application/octet-stream') && !ct.includes('application/pdf'))) {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type. Send raw PDF bytes with Content-Type: application/octet-stream' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const arrayBuffer = await req.arrayBuffer()
    const size = arrayBuffer?.byteLength ?? 0
    if (!arrayBuffer || size === 0) {
      return new Response(JSON.stringify({ error: 'Empty body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: `PDF too large (${(size / (1024 * 1024)).toFixed(1)} MB). Max allowed is 10 MB.` }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Optional password header support
    const password = req.headers.get('x-pdf-password') || undefined

  // Lazy import direct lib entry to avoid index.js debug harness in pdf-parse
  const { default: pdf } = (await import('pdf-parse/lib/pdf-parse.js')) as any
    const data = await pdf(Buffer.from(arrayBuffer), password ? { password } : undefined)
    const text: string = data?.text || ''
    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    // Normalize common pdf.js error messages
    const msg = typeof e?.message === 'string' ? e.message : 'Failed to extract PDF'
    const normalized =
      /password/i.test(msg)
        ? 'This PDF is password-protected. Provide the password.'
        : msg
    return new Response(JSON.stringify({ error: normalized }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
