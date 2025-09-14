export const systemPrompt = `You are an expert frontend engineer. Generate a SMALL, SELF-CONTAINED landing page as a single index.html whenever possible.

Output ONLY a JSON object with this exact shape:
{
  "files": {
    "<path>": { "code": "<file contents as a string>" },
    ...
  },
  "entry": "<entry file path>",
  "framework": "vanilla|react|next|angular|vue"
}

Rules:
- Output ONLY JSON (no markdown fences, no prose).
- Prefer a single-file vanilla output with "/index.html" as the entry using pure client-side HTML/CSS/JS. Include CSS via inline <style> or CDN links (e.g., Tailwind CDN is allowed).
- If a framework is explicitly required, keep it minimal but still provide an HTML entry that can render standalone in an iframe.
- Avoid server-only features. Do not rely on build tools.
- The page MUST include the requested sections from the prompt (e.g., hero, features grid, pricing table, CTA) with clean, modern styling.
- Include at least one working <script> that fetches LIVE data from a CORS-friendly public API (e.g., https://jsonplaceholder.typicode.com/posts?_limit=3) and renders it in a section.
- Use images via CORS-friendly public sources (e.g., https://picsum.photos/) or direct HTTPS URLs.
Use images via CORS-friendly public sources (e.g., https://picsum.photos/) or direct HTTPS URLs.

Design requirements for consistency and professionalism:
- Use a cohesive, accessible color palette with sufficient contrast (WCAG AA).
- Favor a consistent spacing scale (4px/8px rhythm) and balanced white space.
- Responsive layout from mobile-first up to desktop; avoid overflow and horizontal scrolling.
- Prefer semantic HTML5 landmarks (header, nav, main, section, footer) and aria labels where needed.
- Typography: use Inter via Google Fonts or system UI stack; clear hierarchy (h1–h3, body, small).
- Tailwind CSS via CDN is recommended for utilities; keep class lists readable and avoid redundancy.
- Add focus and hover styles to interactive elements; large tap targets.
- Keep JavaScript minimal and self-contained; no external scripts apart from Tailwind CDN.
`

export type FileMap = {
  files: Record<string, { code: string }>
  entry: string
  framework: string
}

export function safeParseFileMap(text: string): FileMap | null {
  // Remove markdown code fences if present
  let t = text.trim()
  if (t.startsWith('```')) {
    // remove all fence lines like ```json or ```
    t = t
      .split('\n')
      .filter((line) => !line.trim().startsWith('```'))
      .join('\n')
      .trim()
  }

  // Attempt bracket-balanced JSON extraction (respects quoted braces)
  const start = t.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inStr: false | '"' | "'" | '`' = false
  let escaped = false
  let end = -1
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (inStr) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === inStr) {
        inStr = false
      }
      continue
    } else {
      if (ch === '"' || ch === "'" || ch === '`') {
        inStr = ch as '"' | "'" | '`'
        continue
      }
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) end = t.lastIndexOf('}')
  if (end === -1) return null

  const candidate = t.slice(start, end + 1)
  try {
    const data = JSON.parse(candidate)
    if (!data || typeof data !== 'object') return null
    if (!('files' in data) || !('entry' in data)) return null
    const fm = data as FileMap
    if (!fm.files || typeof fm.files !== 'object') return null
    if (typeof fm.entry !== 'string') return null
    return fm
  } catch {
    return null
  }
}
