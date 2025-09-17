import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function fetchDuckDuckGo(query: string, max: number) {
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return []
    const html = await res.text()
    const items: any[] = []
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) && items.length < max) {
      const url = m[1]
      const title = m[2]?.replace(/<[^>]+>/g, '')
      const snippet = m[3]?.replace(/<[^>]+>/g, '')
      items.push({ title, url, snippet })
    }
    return items
  } catch {
    return []
  }
}

async function fetchWikipedia(query: string, max: number) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${Math.min(max, 10)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const search = data?.query?.search || []
    return search.slice(0, max).map((s: any) => ({
      title: s.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/\s/g, '_'))}`,
      snippet: s.snippet?.replace(/<[^>]+>/g, '')
    }))
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, max = 5 } = await req.json()
    const n = Math.max(1, Math.min(10, Number(max) || 5))
    const [ddg, wiki] = await Promise.all([
      fetchDuckDuckGo(query, Math.ceil(n / 2)),
      fetchWikipedia(query, Math.floor(n / 2))
    ])
    const combined = [...ddg, ...wiki].slice(0, n)
    return new Response(JSON.stringify({ sources: combined }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'search failed' }), { status: 500 })
  }
}
