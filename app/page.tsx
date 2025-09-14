'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { DEFAULT_MODEL, FRAMEWORKS, MODELS, SITE_NAME, type FrameworkKey } from '@/lib/constants'
import { Logo } from '@/components/Logo'
import { safeParseFileMap, type FileMap } from '@/lib/prompt'

type StreamState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export default function HomePage() {
  const [prompt, setPrompt] = useState('A sleek, modern SaaS landing page for a task management app called FlowBoard with gradient hero, features grid, pricing, and CTA.')
  const [model, setModel] = useState<string>(DEFAULT_MODEL)
  const [framework, setFramework] = useState<FrameworkKey>('vanilla')
  const [state, setState] = useState<StreamState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fileMap, setFileMap] = useState<FileMap | null>(null)
  const [liveHtml, setLiveHtml] = useState<string | null>(null)
  const [htmlDetected, setHtmlDetected] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Step-by-step generation overlay state
// Attempt to import jszip; if unavailable, load from CDN and use global JSZip
async function loadJSZip(): Promise<any> {
  // Always use global/CDN to avoid bundler resolution issues
  const existing = (window as any).JSZip
  if (existing) return existing
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load JSZip from CDN'))
    document.head.appendChild(s)
  })
  const g = (window as any).JSZip
  if (!g) throw new Error('JSZip not available after CDN load')
  return g
}

  const steps = ['Planning layout', 'Building hero', 'Adding features', 'Wiring live data', 'Styling & polish', 'Finalizing']
  const [stepIndex, setStepIndex] = useState(0)
  const stepTimerRef = useRef<number | null>(null)

  async function runGenerate() {
    setState('loading')
    setFileMap(null)
    setErrorMsg(null)
    setLiveHtml(null)
    setHtmlDetected(false)
    setStepIndex(0)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, framework, prompt }),
      })
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'Request failed')
        throw new Error(text || 'Request failed')
      }
      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        buffer += chunk
        // Detect raw HTML early and progressively update preview
        if (!htmlDetected && /<html|<!doctype/i.test(buffer)) {
          setHtmlDetected(true)
        }
        if (htmlDetected) {
          // Use the buffer directly; extractHtml may return partial match too
          const partial = extractHtml(buffer) || buffer
          setLiveHtml(partial)
        }
      }
      // Try to parse a JSON file map first
      const fm = safeParseFileMap(buffer)
      if (fm) {
        setFileMap(ensureFullSite(fm, prompt))
        setState('done')
      } else {
        // If the model streamed raw HTML, use it directly
        const raw = extractHtml(buffer)
        if (raw) {
          const full = ensureFullHtml(raw)
          setFileMap({
            files: { '/index.html': { code: full } },
            entry: '/index.html',
            framework: 'vanilla'
          })
          setState('done')
        } else {
          // As a last resort, synthesize a simple site from the prompt
          const html = buildBasicSite(prompt)
          setFileMap({
            files: { '/index.html': { code: html } },
            entry: '/index.html',
            framework: 'vanilla'
          } as any)
          setState('done')
        }
      }
    } catch (e) {
      console.error(e)
  const msg = e instanceof Error ? e.message : 'Unknown error'
  setErrorMsg(msg)
      setState('error')
    }
  }

  // Export current generated project as a ZIP (in-component to access state)
  const exportZip = async () => {
    if (!fileMap) return
    try {
      setExporting(true)
      const JSZip: any = await loadJSZip()
      const zip = new JSZip()
      const entries = Object.entries(fileMap.files) as [string, { code: string }][]
      for (const [path, file] of entries) {
        const clean = path.replace(/^\//, '') || 'index.html'
        const code = /\.html?$/i.test(clean) ? ensureFullHtml(file.code) : file.code
        zip.file(clean, code)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'project.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('ZIP export failed', e)
      setErrorMsg('Export failed. See console for details.')
    } finally {
      setExporting(false)
    }
  }

  

  // Manage step animation timer
  useEffect(() => {
    if (state === 'streaming' || state === 'loading') {
      if (stepTimerRef.current) window.clearInterval(stepTimerRef.current)
      stepTimerRef.current = window.setInterval(() => {
        setStepIndex((i) => (i < steps.length - 2 ? i + 1 : i))
      }, 900)
    } else {
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current)
        stepTimerRef.current = null
      }
      if (state === 'done') setStepIndex(steps.length - 1)
    }
    return () => {
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current)
        stepTimerRef.current = null
      }
    }
  }, [state])

  const previewHtml: string | undefined = (() => {
    if (!fileMap) return undefined
    // Prefer the declared entry file; fallback to common index.html
    const entry = fileMap.entry || '/index.html'
    const file = fileMap.files[entry] || fileMap.files['/index.html'] || fileMap.files['index.html']
    return file?.code
  })()
  const showPreview = typeof previewHtml === 'string' && previewHtml.length > 0
  const activeHtml = liveHtml ?? previewHtml

  return (
    <main className="min-h-screen bg-[radial-gradient(900px_500px_at_0%_-10%,rgba(124,58,237,0.18),transparent),radial-gradient(800px_500px_at_110%_0%,rgba(6,182,212,0.15),transparent)]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--bg)]/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <motion.div layout className="flex items-center gap-3">
            <Logo size={28} />
            <div className="font-semibold tracking-tight">{SITE_NAME}</div>
            <div className="text-sm text-white/60">AI Website Studio</div>
          </motion.div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col">
              <label className="text-[11px] uppercase tracking-wider text-white/50 mb-1">Select model</label>
              <select aria-label="Model" title="Model" className="glass rounded-md px-3 py-2 bg-white/5" value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] uppercase tracking-wider text-white/50 mb-1">Select framework</label>
              <select aria-label="Framework" title="Framework" className="glass rounded-md px-3 py-2 bg-white/5" value={framework} onChange={e => setFramework(e.target.value as FrameworkKey)}>
                {FRAMEWORKS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <motion.button whileTap={{ scale: .98 }} whileHover={{ y: -1 }} onClick={runGenerate} className="rounded-md bg-brand-600 px-4 py-2 font-medium shadow-glow hover:bg-brand-500 transition">
              {state === 'loading' || state === 'streaming' ? 'Generating…' : 'Generate'}
            </motion.button>
            <motion.button whileTap={{ scale: .98 }} whileHover={{ y: -1 }} disabled={!fileMap || exporting} onClick={exportZip} className="rounded-md bg-white/10 px-4 py-2 font-medium border border-white/10 hover:bg-white/15 transition disabled:opacity-50">
              {exporting ? 'Preparing…' : 'Export ZIP'}
            </motion.button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Prompt Section */}
    <motion.div layout className="glass rounded-xl p-4 bg-[var(--panel)] border border-white/10">
          <h2 className="mb-2 text-sm font-semibold text-white/80">Prompt</h2>
          <textarea
            aria-label="Prompt"
            placeholder="Describe your site..."
      className="w-full h-48 rounded-md bg-black/30 p-3 outline-none focus:ring-2 focus:ring-brand-600 transition"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <p className="mt-2 text-xs text-white/50">Describe your site. The agent will generate code and a live preview.</p>
          {state === 'error' && (
            <div className="mt-3 text-rose-300 text-sm space-y-1">
              <div className="font-medium">Generation failed</div>
              {errorMsg && <div className="text-rose-200/90 whitespace-pre-wrap break-words">{errorMsg}</div>}
            </div>
          )}
  </motion.div>
  {/* Live Preview — enlarged */}
    <motion.div layout className="glass rounded-xl p-4 bg-[var(--panel)] border border-white/10 lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold text-white/80">Live Preview</h2>
          <div className="relative h-[80vh] overflow-hidden rounded-md bg-black/40">
            {showPreview ? (
              <iframe
                title="Live Preview"
                className="w-full h-full border-0"
                // Allow external CDNs and scripts in the preview
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                srcDoc={activeHtml}
              />
            ) : (
              <div className="h-full grid place-content-center text-white/50 text-sm">No preview yet. Generate to see your site live.</div>
            )}

            {(state === 'loading' || state === 'streaming') && (
              <div className="pointer-events-none absolute inset-0 bg-black/50 backdrop-blur-sm border border-white/10">
                <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
                  {(() => {
                    const widths = ['w-1/6','w-2/6','w-3/6','w-4/6','w-5/6','w-full']
                    const idx = Math.min(widths.length - 1, Math.max(0, stepIndex))
                    const wClass = widths[idx]
                    return <div className={`h-full ${wClass} bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400`} />
                  })()}
                </div>
                <div className="h-full p-6 flex flex-col items-center justify-center gap-6 text-white/90">
                  <div className="text-sm uppercase tracking-widest text-white/70">Website generating</div>
                  <div className="w-full max-w-md">
                    <ul className="space-y-2 text-sm">
                      {steps.map((s, i) => (
                        <li key={s} className="flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${i <= stepIndex ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-white/30'}`} />
                          <span className={i <= stepIndex ? 'text-white' : 'text-white/60'}>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  )
}



function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function stripFences(text: string) {
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t
      .split('\n')
      .filter((line) => !line.trim().startsWith('```'))
      .join('\n')
      .trim()
  }
  return t
}

function extractHtml(text: string): string | null {
  const t = stripFences(text)
  // quick check
  if (!/[<]html|<!doctype/i.test(t)) return null
  // try to extract <html>...</html>
  const m = t.match(/<!doctype[\s\S]*?<html[\s\S]*?<\/html>/i) || t.match(/<html[\s\S]*?<\/html>/i)
  return (m && m[0]) || t
}

// Ensure core sections exist and live data is wired
function ensureFullHtml(html: string): string {
  let out = html
  const hasHero = /<h1|class=["'][^"']*hero|id=["']?hero/i.test(out)
  const hasFeatures = /id=["']?features|>\s*Features\b/i.test(out)
  const hasPricing = /id=["']?pricing|>\s*Pricing\b/i.test(out)
  const hasCTA = />\s*(Get Started|Sign Up|Try Now)\b/i.test(out)
  const hasLive = /jsonplaceholder\.typicode\.com|fetch\(/i.test(out)
  const injects: string[] = []
  if (!hasHero) injects.push(`<section class="mt-12"><h1 class="text-4xl md:text-5xl font-semibold">Your Product</h1><p class="mt-3 text-gray-300">Beautiful, fast, and responsive.</p></section>`)
  if (!hasFeatures) injects.push(`
  <section id="features" class="mt-14">
    <h2 class="text-xl font-semibold">Features</h2>
    <div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="text-indigo-300">★</div><div class="mt-2 font-medium">Fast</div><p class="mt-1 text-sm text-gray-300">Quick to load with clean code.</p></div>
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="text-indigo-300">★</div><div class="mt-2 font-medium">Beautiful</div><p class="mt-1 text-sm text-gray-300">Thoughtful, modern design.</p></div>
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="text-indigo-300">★</div><div class="mt-2 font-medium">Responsive</div><p class="mt-1 text-sm text-gray-300">Looks great on any device.</p></div>
    </div>
  </section>`)
  if (!hasLive) injects.push(`
  <section id="live" class="mt-14">
    <h2 class="text-xl font-semibold">Live Posts</h2>
    <div id="posts" class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
  </section>
  <script>
    (function(){
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
        .then(function(r){return r.json()})
        .then(function(items){
          var c=document.getElementById('posts'); if(!c) return;
          c.innerHTML = items.map(function(p){return '<article class="p-4 rounded bg-black/40 border border-white/10"><div class="font-medium">'+String(p.title).slice(0,60)+'</div><p class="mt-1 text-sm text-gray-400">'+String(p.body).slice(0,100)+'...</p></article>'}).join('');
        })
        .catch(function(){ var c=document.getElementById('posts'); if(c) c.innerHTML='<div class="text-sm text-gray-400">Could not load posts.</div>'; });
    })();
  </script>`)
  if (!hasPricing) injects.push(`
  <section id="pricing" class="mt-14">
    <h2 class="text-xl font-semibold">Pricing</h2>
    <div class="mt-6 grid sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="font-medium">Free</div><div class="mt-1 text-3xl font-semibold">$0<span class="text-sm text-gray-400">/mo</span></div></div>
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="font-medium">Pro</div><div class="mt-1 text-3xl font-semibold">$12<span class="text-sm text-gray-400">/mo</span></div></div>
      <div class="p-5 rounded-lg bg-black/40 border border-white/10"><div class="font-medium">Business</div><div class="mt-1 text-3xl font-semibold">$29<span class="text-sm text-gray-400">/mo</span></div></div>
    </div>
  </section>`)
  if (!hasCTA) injects.push(`<div class="mt-10"><a href="#pricing" class="px-5 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium">Get Started</a></div>`)
  if (injects.length) {
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, injects.join('\n') + '\n</body>')
    else out += injects.join('\n')
  }
  return out
}

function ensureFullSite(fm: FileMap, _prompt: string): FileMap {
  try {
    const entry = fm.entry || '/index.html'
    const f = fm.files[entry]
    if (f && /\.html?$/i.test(entry)) {
      const fixed = ensureFullHtml(f.code)
      return { ...fm, files: { ...fm.files, [entry]: { code: fixed } } }
    }
    const idx = fm.files['/index.html'] || fm.files['index.html']
    if (idx) {
      const fixed = ensureFullHtml(idx.code)
      return { ...fm, files: { ...fm.files, '/index.html': { code: fixed } }, entry: '/index.html' }
    }
    return fm
  } catch {
    return fm
  }
}

function buildBasicSite(rawPrompt: string) {
  const title = (rawPrompt.match(/^[^.!?]{0,60}/)?.[0] || 'Your Landing Page').trim()
  const hero = rawPrompt
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      .grad { background: radial-gradient(1200px 600px at 10% -10%, #7c3aed22, transparent), radial-gradient(800px 500px at 90% 10%, #06b6d422, transparent); }
    </style>
  </head>
  <body class="bg-gray-950 text-gray-100 grad">
    <main class="max-w-6xl mx-auto px-6 py-10">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3"><div class="h-8 w-8 rounded-lg bg-indigo-600 shadow"></div><div class="font-semibold tracking-tight">VibeCoder</div></div>
        <a href="#pricing" class="text-sm text-gray-300 hover:text-white">Pricing</a>
      </header>
      <section class="mt-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 class="text-4xl md:text-5xl font-semibold leading-tight">${escapeHtml(title)}</h1>
          <p class="mt-4 text-gray-300">${escapeHtml(hero)}</p>
          <div class="mt-6 flex gap-3">
            <a href="#pricing" class="px-5 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium">Get Started</a>
            <a href="#features" class="px-5 py-3 rounded-md bg-white/5 hover:bg-white/10 border border-white/10">Learn More</a>
          </div>
        </div>
        <div class="aspect-video rounded-xl overflow-hidden border border-white/10">
          <img src="https://picsum.photos/960/540" alt="preview" class="w-full h-full object-cover" />
        </div>
      </section>
      <section id="features" class="mt-14">
        <h2 class="text-xl font-semibold">Features</h2>
        <div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${['Fast setup','Beautiful UI','Live data'].map(t => `<div class=\"p-5 rounded-lg bg-black/40 border border-white/10\"><div class=\"text-indigo-300\">★</div><div class=\"mt-2 font-medium\">${t}</div><p class=\"mt-1 text-sm text-gray-300\">Ready out of the box with modern design.</p></div>`).join('')}
        </div>
      </section>
      <section id="live" class="mt-14">
        <h2 class="text-xl font-semibold">Live Posts</h2>
        <div id="posts" class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </section>
      <section id="pricing" class="mt-14">
        <h2 class="text-xl font-semibold">Pricing</h2>
        <div class="mt-6 grid sm:grid-cols-3 gap-4">
          ${['Free','Pro','Business'].map((t,i)=>`<div class=\"p-5 rounded-lg bg-black/40 border border-white/10\"><div class=\"font-medium\">${t}</div><div class=\"mt-1 text-3xl font-semibold\">${i===0?'$0':'$'+(i*9+9)}<span class=\"text-sm text-gray-400\">/mo</span></div><button class=\"mt-4 w-full px-4 py-2 rounded-md ${i===1?'bg-indigo-600 hover:bg-indigo-500':'bg-white/5 hover:bg-white/10 border border-white/10'}\">Choose</button></div>`).join('')}
        </div>
      </section>
      <footer class="mt-16 py-6 text-sm text-gray-400 border-t border-white/10">© ${new Date().getFullYear()} VibeCoder</footer>
    </main>
    <script>
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
        .then(function(r){ return r.json(); })
        .then(function(items){
          var c = document.getElementById('posts');
          if (!c) return;
          c.innerHTML = items.map(function(p){
            return '<article class="p-4 rounded bg-black/40 border border-white/10">'
              + '<div class="font-medium">' + String(p.title).slice(0,60) + '</div>'
              + '<p class="mt-1 text-sm text-gray-400">' + String(p.body).slice(0,100) + '...</p>'
              + '</article>';
          }).join('');
        })
        .catch(function(){
          var c = document.getElementById('posts');
          if (c) c.innerHTML = '<div class="text-sm text-gray-400">Could not load posts.</div>';
        });
    </script>
  </body>
</html>`
}
