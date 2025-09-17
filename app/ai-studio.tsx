'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { ChatInput } from '@/components/ChatInput'
import { ChatMessage, type Message } from '@/components/ChatMessage'
import { CanvasPanel } from '@/components/CanvasPanel'
import { CodeStudio } from '@/components/CodeStudio'
import { ModelSelector } from '@/components/ModelSelector'
import { FrameworkSelector } from '@/components/FrameworkSelector'
import ModelSelectionTip from '@/components/ModelSelectionTip'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SITE_NAME, MODELS, IMAGE_MODELS, DEFAULT_MODEL, DEFAULT_IMAGE_MODEL, type FrameworkKey } from '@/lib/constants'
import { useSession } from 'next-auth/react'

type GenerationMode = 'text' | 'image' | 'code' | 'web'

type ImageItem = {
  url: string
  pinned?: boolean
}

export default function AIStudioPage() {
  const { data: session } = useSession()
  const userImage = session?.user?.image || null
  const [activeMode, setActiveMode] = useState<GenerationMode>('text')
  // Widen types so the setter can accept any option from the list
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [selectedImageModel, setSelectedImageModel] = useState<string>(DEFAULT_IMAGE_MODEL)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([
    {
      id: 'current',
      title: 'New conversation',
      timestamp: new Date(),
      starred: false
    }
  ])
  const [activeConversationId, setActiveConversationId] = useState('current')
  const [canvasExpanded, setCanvasExpanded] = useState(false)
  const [canvasContent, setCanvasContent] = useState<React.ReactNode | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Sample code for CodeStudio demo
  const [codeFiles, setCodeFiles] = useState<Record<string, { code: string }>>({
    '/index.html': {
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- viewport tag intentionally omitted in demo HTML; outer app sets viewport -->
  <title>AI Generated Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>Welcome to <span class="highlight">FutureTech</span></h1>
      <p>Powered by AI</p>
    </header>
    <main>
      <section class="hero">
        <h2>The future is here</h2>
        <p>Experience the power of artificial intelligence</p>
        <button class="cta">Get Started</button>
      </section>
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    },
    '/style.css': {
      code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  background: #0f1116;
  color: white;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  padding: 40px 0;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 10px;
}

.highlight {
  color: #6ee7b7;
  font-weight: bold;
}

.hero {
  text-align: center;
  padding: 80px 0;
  background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://source.unsplash.com/random/1600x900/?technology');
  background-size: cover;
  border-radius: 12px;
  margin: 20px 0;
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.cta {
  padding: 12px 30px;
  background: #6ee7b7;
  color: #0f1116;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.cta:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(110, 231, 183, 0.6);
}`,
    },
    '/script.js': {
      code: `document.addEventListener('DOMContentLoaded', () => {
  const cta = document.querySelector('.cta');
  
  // Add animation to the button
  cta.addEventListener('mouseover', () => {
    cta.style.transform = 'scale(1.05)';
  });
  
  cta.addEventListener('mouseout', () => {
    cta.style.transform = 'scale(1)';
  });
  
  // Add click event
  cta.addEventListener('click', () => {
    alert('Welcome to the future of AI technology!');
  });

  // Add some dynamic text
  const createTypingEffect = (element, text, delay = 100) => {
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(timer);
      }
    }, delay);
  };
  
  // Create and insert a new element for typing effect
  const header = document.querySelector('header');
  const typingElement = document.createElement('p');
  typingElement.className = 'typing-text';
  header.appendChild(typingElement);
  
  // Start the typing effect after a small delay
  setTimeout(() => {
    createTypingEffect(typingElement, 'Where innovation meets intelligence...');
  }, 1000);
});`,
    },
  })
  const [activeCodeFile, setActiveCodeFile] = useState('/index.html')
  
  // Sample image for image generation demo
  const [generatedImage, setGeneratedImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80'
  )

  // Framework + memory mode + image settings
  const [framework, setFramework] = useState<FrameworkKey>('vanilla')
  const [projectName, setProjectName] = useState<string>('ai-studio-site')
  const [scaffoldNext, setScaffoldNext] = useState<boolean>(true)
  const [memoryMode, setMemoryMode] = useState<'fast' | 'memory'>('memory')
  const [imageWidth, setImageWidth] = useState<number>(1024)
  const [imageHeight, setImageHeight] = useState<number>(576)
  const [imageStyle, setImageStyle] = useState<string>('default')
  const [knowledgeText, setKnowledgeText] = useState<string>('')
  const [researchMode, setResearchMode] = useState<boolean>(false)
  const [imageGallery, setImageGallery] = useState<ImageItem[]>([])
  const [vercelToken, setVercelToken] = useState<string>('1BUBfCzA20J0v5g88y2tS04S')

  // Advanced text settings
  const [textTone, setTextTone] = useState<'neutral' | 'friendly' | 'formal' | 'playful' | 'concise'>('neutral')
  const [textFormat, setTextFormat] = useState<'auto' | 'bullets' | 'paragraph' | 'steps' | 'table'>('auto')
  const [attachedPdfName, setAttachedPdfName] = useState<string | null>(null)
  const [attachedPdfChars, setAttachedPdfChars] = useState<number | null>(null)

  // Load / persist image gallery to localStorage (with migration from string[])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aiStudio.imageGallery')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const migrated: ImageItem[] = parsed.map((it: any) =>
            typeof it === 'string' ? { url: it } : { url: String(it?.url || ''), pinned: !!it?.pinned }
          ).filter((it: ImageItem) => it.url)
          if (migrated.length) setImageGallery(migrated)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('aiStudio.imageGallery', JSON.stringify(imageGallery))
    } catch {}
  }, [imageGallery])

  const setAspect = (ratio: '16:9' | '1:1' | '9:16' | '4:3') => {
    switch (ratio) {
      case '1:1':
        setImageWidth(1024); setImageHeight(1024); break
      case '9:16':
        setImageWidth(768); setImageHeight(1365); break
      case '4:3':
        setImageWidth(1024); setImageHeight(768); break
      default:
        setImageWidth(1024); setImageHeight(576)
    }
  }

  const frameworkToTemplate = (fw: FrameworkKey): 'vanilla' | 'react' | 'nextjs' | 'vue' => {
    switch (fw) {
      case 'react': return 'react'
      case 'next': return 'nextjs'
      case 'vue': return 'vue'
      default: return 'vanilla'
    }
  }

  // Scaffold a minimal Next.js app around existing static files for deploy convenience
  const scaffoldNextFromStatic = (existing: Record<string, { code: string }>) => {
    const out: Record<string, { code: string }> = { ...existing }
    const hasPkg = !!out['/package.json']
    const hasNextConfig = !!out['/next.config.js'] || !!out['/next.config.ts']
    const hasAppPage = Object.keys(out).some(p => p.startsWith('/app/') && (p.endsWith('/page.jsx') || p.endsWith('/page.tsx')))
    if (!hasPkg) {
      out['/package.json'] = {
        code: JSON.stringify({
          name: 'ai-studio-next',
          private: true,
          version: '1.0.0',
          scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
          dependencies: { next: '14.2.5', react: '18.2.0', 'react-dom': '18.2.0' }
        }, null, 2)
      }
    }
    if (!hasNextConfig) {
      out['/next.config.js'] = { code: `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true }\nmodule.exports = nextConfig\n` }
    }
    if (!hasAppPage) {
      out['/app/layout.jsx'] = {
        code: `export const metadata = { title: 'AI Studio Next', description: 'Scaffolded by AI Studio' }\nexport default function RootLayout({ children }) {\n  return (\n    <html lang=\"en\">\n      <body style={{ margin: 0 }}>{children}</body>\n    </html>\n  )\n}\n`
      }
      const hasIndex = !!existing['/index.html']
      out['/app/page.jsx'] = {
        code: hasIndex
          ? `export default function Page() {\n  return (\n    <main style={{height:'100vh'}}>\n      <iframe src=\"/static/index.html\" style={{border:'0', width:'100%', height:'100%'}} title=\"Static site\" />\n    </main>\n  )\n}\n`
          : `export default function Page() {\n  return (\n    <main style={{padding:24}}>\n      <h1>Welcome to Next.js</h1>\n      <p>Scaffolded by AI Studio.</p>\n    </main>\n  )\n}\n`
      }
    }
    // Copy static assets into public/static
    Object.entries(existing).forEach(([path, val]) => {
      const lower = path.toLowerCase()
      if (lower.endsWith('.html') || lower.endsWith('.css') || lower.endsWith('.js') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') || lower.endsWith('.gif') || lower.endsWith('.webp')) {
        const clean = path.startsWith('/') ? path.slice(1) : path
        out[`/public/static/${clean}`] = { code: val.code }
      }
    })

    // Load saved Vercel token if any
    useEffect(() => {
      try {
        const t = localStorage.getItem('aiStudio.vercelToken')
        if (t) setVercelToken(t)
      } catch {}
    }, [])

    useEffect(() => {
      try {
        if (vercelToken) localStorage.setItem('aiStudio.vercelToken', vercelToken)
      } catch {}
    }, [vercelToken])
    return out
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle apply-fix events from CodeBlock
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { action: 'replace-active' | 'new-file', content: string }
      if (!detail?.content) return
      // naive extraction: if content includes a code block, try to pull it; else use full
      const match = detail.content.match(/```[\w-]*\n([\s\S]*?)```/)
      const newCode = match?.[1] || detail.content
      if (detail.action === 'replace-active' && activeCodeFile) {
        setCodeFiles(prev => ({ ...prev, [activeCodeFile]: { code: newCode } }))
      } else if (detail.action === 'new-file') {
        const name = prompt('New file name for AI fix (e.g. /fixed.js):', '/ai-fix.txt') || '/ai-fix.txt'
        setCodeFiles(prev => ({ ...prev, [name]: { code: newCode } }))
        setActiveCodeFile(name)
      }
    }
    window.addEventListener('ai-apply-fix', handler as any)
    return () => window.removeEventListener('ai-apply-fix', handler as any)
  }, [activeCodeFile])

  const handleModeChange = (mode: GenerationMode) => {
    setActiveMode(mode)

    // Fresh chat for each mode
    handleNewConversation()

    // Sensible defaults per mode
    if (mode === 'web') {
      setFramework('next')
      // Keep using text model state for web
    } else if (mode === 'code') {
      setFramework('vanilla')
      // Keep using text model state for code
    } else if (mode === 'image') {
      // ensure image model is set to default if unset
      setSelectedImageModel(prev => prev || DEFAULT_IMAGE_MODEL)
    }

    // Reset canvas when switching away from web mode
    if (mode !== 'web') setCanvasExpanded(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Compute a friendly time/day greeting (randomized headline+quote per load)
  const { greeting, sublineDefault } = useMemo(() => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.toLocaleDateString(undefined, { weekday: 'long' })
    const parts = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    // Read name once per load; guarded for SSR
    let name = 'Karthik'
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('xerironx.userName')
        if (stored) name = stored
      }
    } catch {}
    const headlines = [
      `${parts}, ${name}. Happy ${day}! What’s your plan today?`,
      `${parts}, ${name}. What will we build today?`,
      `${parts}, ${name}. Ready to create something great?`,
      `${parts}, ${name}. Let’s make progress today.`,
      `${parts}, ${name}. What’s your next big idea?`,
    ]
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    return { greeting: pick(headlines), sublineDefault: 'Let’s build something useful.' }
  }, [])

  // Fetch a dynamic professional quote when chat is empty
  const [quote, setQuote] = useState<string>('')
  useEffect(() => {
    if (messages.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        const now = Date.now()
        let cached: { quote: string; ts: number } | null = null
        try {
          const raw = localStorage.getItem('aiStudio.quoteCache')
          if (raw) cached = JSON.parse(raw)
        } catch {}
        // 30-minute cooldown to avoid 429s
        if (cached && cached.ts && now - cached.ts < 30 * 60 * 1000) {
          if (!cancelled) setQuote(cached.quote || '')
          return
        }
        const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        if (!res.ok) throw new Error('Quote request failed')
        const data = await res.json()
        const q = String(data?.quote || '')
        if (!cancelled) setQuote(q)
        try { localStorage.setItem('aiStudio.quoteCache', JSON.stringify({ quote: q, ts: now })) } catch {}
      } catch {
        // keep previous cached quote if available; else empty
        try {
          const raw = localStorage.getItem('aiStudio.quoteCache')
          if (raw && !cancelled) {
            const cached = JSON.parse(raw)
            setQuote(String(cached?.quote || ''))
          }
        } catch {}
      }
    })()
    return () => { cancelled = true }
  }, [messages.length])

  const handleSendMessage = async () => {
    const prompt = input.trim()
    if (prompt === '') return

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

  const currentModel = activeMode === 'image' ? selectedImageModel : selectedModel

    try {
  if (activeMode === 'text') {
  // Create a placeholder assistant message to stream into
  const aiId = generateId()
  setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '', timestamp: Date.now(), isTyping: true }])

        // Compose optional style directive for tone/format
        const styleParts: string[] = []
        if (textTone && textTone !== 'neutral') {
          const toneMap: Record<string, string> = {
            friendly: 'Use a friendly, encouraging tone.',
            formal: 'Use a formal, professional tone.',
            playful: 'Use a playful, creative tone.',
            concise: 'Be concise and avoid unnecessary verbosity.',
            neutral: 'Use a clear, neutral tone.'
          }
          styleParts.push(toneMap[textTone])
        }
        if (textFormat && textFormat !== 'auto') {
          const fmtMap: Record<string, string> = {
            bullets: 'Present the answer as concise bullet points.',
            paragraph: 'Present the answer in one or two well-structured paragraphs.',
            steps: 'Present the answer as numbered step-by-step instructions.',
            table: 'If applicable, include a compact table to summarize key points.',
            auto: ''
          }
          styleParts.push(fmtMap[textFormat])
        }
        const styleSystem = styleParts.length ? { role: 'system', content: styleParts.join(' ') } : null

        const baseSystem = knowledgeText ? { role: 'system', content: `Extra context (from attachments):\n${knowledgeText.slice(0, 4000)}` } : null

        // Auto-integrated live web data (always attempt; graceful if fails)
        let liveSystem: { role: 'system'; content: string } | null = null
        try {
          const sr = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: prompt, max: 5 })
          })
          if (sr.ok) {
            const data = await sr.json()
            const items: Array<{ title: string; url: string; snippet?: string }> = data?.sources || []
            if (items.length) {
              const lines = items.map((s: any, i: number) => `${i + 1}. ${s.title || 'Source'} - ${s.url}${s.snippet ? `\n   ${s.snippet}` : ''}`)
              const citeHint = '\nCite sources inline as [1], [2], etc., and include the link.'
              liveSystem = { role: 'system', content: `Recent web results:\n${lines.join('\n')}${citeHint}` }
            }
          }
        } catch {}

        const composedMessages = (
          memoryMode === 'memory'
            ? [
                ...(baseSystem ? [baseSystem] : []),
                ...(liveSystem ? [liveSystem] : []),
                ...(styleSystem ? [styleSystem] as any : []),
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: prompt }
              ]
            : [
                ...(baseSystem ? [baseSystem] : []),
                ...(liveSystem ? [liveSystem] : []),
                ...(styleSystem ? [styleSystem] as any : []),
                { role: 'user', content: prompt }
              ]
        )

        let res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: currentModel,
            messages: composedMessages
          })
        })
        // Light client retry on 429 with tiny backoff so the UI can show a quick notice
        if (res.status === 429) {
          setMessages(prev => prev.map(m => (m.id === aiId ? { ...m, content: (m.content || '') + '\n\n[rate limited — retrying…]', isTyping: true } : m)))
          await new Promise(r => setTimeout(r, 500))
          res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: currentModel, messages: composedMessages })
          })
        }
        if (!res.ok || !res.body) throw new Error(`Chat API error: ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          setMessages(prev => prev.map(m => (m.id === aiId ? { ...m, content: m.content + chunk, isTyping: true } : m)))
        }
        // stop typing indicator when finished
        setMessages(prev => prev.map(m => (m.id === aiId ? { ...m, isTyping: false } : m)))
    } else if (activeMode === 'image') {
  const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: currentModel, provider: 'pollinations', width: imageWidth, height: imageHeight, style: imageStyle })
        })
        if (!res.ok) throw new Error(`Image API error: ${res.status}`)
        const data = await res.json()
        const imageUrl: string | undefined = data?.proxyUrl || data?.imageUrl
        if (imageUrl) {
          setImageGallery(prev => {
            const next = [{ url: imageUrl }, ...prev]
            // keep pinned first, then recent
            const pinned = next.filter(i => i.pinned)
            const unpinned = next.filter(i => !i.pinned)
            return [...pinned, ...unpinned].slice(0, 30)
          })
          setCanvasContent(
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={imageUrl} alt="Generated" className="max-w-full max-h-full rounded-lg shadow-lg border border-white/10" />
            </div>
          )
          setCanvasExpanded(true)
          const aiMsg: Message = { id: generateId(), role: 'assistant', content: `Generated an image for: "${prompt}"`, timestamp: Date.now() }
          setMessages(prev => [...prev, aiMsg])
        } else {
          throw new Error('Image URL not found in response')
        }
      } else {
        // Code / Web: request multi-file project and stream into editor
        // Kick off UI with split-panel editor and framework/model controls
        setCanvasExpanded(true)
        setCanvasContent(
          <CodeStudio
            files={codeFiles}
            activeFile={activeCodeFile}
            onChangeActiveFile={setActiveCodeFile}
            onUpdateCode={(file, code) => {
              setCodeFiles(prev => {
                const next = { ...prev, [file]: { code } }
                setCanvasContent(
                  <CodeStudio
                    files={next}
                    activeFile={activeCodeFile}
                    onChangeActiveFile={setActiveCodeFile}
                    onUpdateCode={(f, c) => {
                      setCodeFiles(p => {
                        const n = { ...p, [f]: { code: c } }
                        setCanvasContent(
                          <CodeStudio
                            files={n}
                            activeFile={activeCodeFile}
                            onChangeActiveFile={setActiveCodeFile}
                            onUpdateCode={() => {}}
                            onCreateFile={(path) => {
                              setCodeFiles(p2 => ({ ...p2, [path]: { code: '' } }))
                              setActiveCodeFile(path)
                            }}
                            onDeleteFile={(path) => {
                              setCodeFiles(p2 => {
                                const copy = { ...p2 }
                                delete copy[path]
                                return copy
                              })
                            }}
                            canRun={true}
                            onRun={() => {}}
                            onDownload={() => {}}
                            template={frameworkToTemplate(framework)}
                            rightExtras={
                              <div className="flex items-center gap-2">
                                <FrameworkSelector value={framework} onChange={setFramework} />
                              </div>
                            }
                          />
                        )
                        return n
                      })
                    }}
                    onCreateFile={(path) => {
                      setCodeFiles(p => ({ ...p, [path]: { code: '' } }))
                      setActiveCodeFile(path)
                    }}
                    onDeleteFile={(path) => {
                      setCodeFiles(p => {
                        const copy = { ...p }
                        delete copy[path]
                        return copy
                      })
                    }}
                    canRun={true}
                    onRun={() => {}}
                    onDownload={() => {}}
                    template={frameworkToTemplate(framework)}
                    rightExtras={
                      <div className="flex items-center gap-2">
                        <FrameworkSelector value={framework} onChange={setFramework} />
                      </div>
                    }
                  />
                )
                return next
              })
            }}
            onCreateFile={(path) => {
              setCodeFiles(prev => ({ ...prev, [path]: { code: '' } }))
              setActiveCodeFile(path)
            }}
            onDeleteFile={(path) => {
              setCodeFiles(prev => {
                const copy = { ...prev }
                delete copy[path]
                return copy
              })
              if (activeCodeFile === path) {
                const remaining = Object.keys(codeFiles).filter(p => p !== path)
                setActiveCodeFile(remaining[0] || '')
              }
            }}
            canRun={true}
            onRun={() => {}}
            onDownload={() => {}}
            onDeploy={activeMode === 'web' ? async () => {
              try {
                const hasIndex = Object.keys(codeFiles).some(p => p === '/index.html' || p.endsWith('/index.html') || p === 'index.html')
                if (!hasIndex) {
                  setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Warning: No index.html found. The deployed site may not render.', timestamp: Date.now() }])
                }
                let deployFiles = codeFiles
                if (framework === 'next' && scaffoldNext) {
                  deployFiles = scaffoldNextFromStatic(codeFiles)
                }
                const res = await fetch('/api/deploy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ files: deployFiles, name: projectName || 'ai-studio-site', frameworkHint: frameworkToTemplate(framework), token: vercelToken || undefined })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.error || 'Failed to deploy')
                const live = data?.url
                const inspect = data?.inspectorUrl
                if (live) {
                  setCanvasContent(
                    <div className="p-3 text-sm">
                      <a className="text-emerald-600 underline" href={live} target="_blank" rel="noreferrer">Live website</a>
                      <div className="text-gray-600 mt-1">{live}</div>
                      {inspect && (
                        <div className="mt-2">
                          <a className="text-gray-600 underline" href={inspect} target="_blank" rel="noreferrer">Vercel deployment inspector</a>
                        </div>
                      )}
                    </div>
                  )
                  setCanvasExpanded(true)
                  setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Deployed to: ${live}`, timestamp: Date.now() }])
                } else {
                  throw new Error('No URL returned from Vercel')
                }
              } catch (err: any) {
                setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Deploy error: ${err?.message}`, timestamp: Date.now() }])
              }
            } : undefined}
            template={frameworkToTemplate(framework)}
            rightExtras={
              <div className="flex items-center gap-2">
                <FrameworkSelector value={framework} onChange={setFramework} />
              </div>
            }
          />
        )
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel, framework, prompt: `${prompt}${knowledgeText ? `\n\nAdditional context:\n${knowledgeText.slice(0, 4000)}` : ''}${researchMode ? `\n\nGuidance: include relevant citations as links when helpful.` : ''}` })
        })
        if (!res.ok || !res.body) throw new Error(`Generate API error: ${res.status}`)

        // Stream JSON text chunks and update files when complete
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          text += decoder.decode(value)
        }
        try {
          const payload = JSON.parse(text)
          const filesMap: Record<string, { code: string }> = payload.files || {}
          const entry: string = payload.entry || Object.keys(filesMap)[0]
          if (filesMap && Object.keys(filesMap).length > 0) {
            setCodeFiles(filesMap)
            setActiveCodeFile(entry)
            setCanvasContent(
              <CodeStudio
                files={filesMap}
                activeFile={entry}
                onChangeActiveFile={setActiveCodeFile}
                onUpdateCode={(file, code) => {
                  setCodeFiles(prev => {
                    const next = { ...prev, [file]: { code } }
                    setCanvasContent(
                      <CodeStudio
                        files={next}
                        activeFile={activeCodeFile}
                        onChangeActiveFile={setActiveCodeFile}
                        onUpdateCode={() => {}}
                        onCreateFile={(path) => {
                          setCodeFiles(p => ({ ...p, [path]: { code: '' } }))
                          setActiveCodeFile(path)
                        }}
                        onDeleteFile={(path) => {
                          setCodeFiles(p => {
                            const copy = { ...p }
                            delete copy[path]
                            return copy
                          })
                        }}
                        canRun={true}
                        onRun={() => {}}
                        onDownload={() => {}}
                        template={frameworkToTemplate(framework)}
                        rightExtras={
                          <div className="flex items-center gap-2">
                            <FrameworkSelector value={framework} onChange={setFramework} />
                          </div>
                        }
                      />
                    )
                    return next
                  })
                }}
                onCreateFile={(path) => {
                  setCodeFiles(prev => ({ ...prev, [path]: { code: '' } }))
                  setActiveCodeFile(path)
                }}
                onDeleteFile={(path) => {
                  setCodeFiles(prev => {
                    const copy = { ...prev }
                    delete copy[path]
                    return copy
                  })
                  if (activeCodeFile === path) {
                    const remaining = Object.keys(filesMap).filter(p => p !== path)
                    setActiveCodeFile(remaining[0] || '')
                  }
                }}
                canRun={true}
                onRun={() => {}}
                onDownload={() => {}}
                onDeploy={activeMode === 'web' ? async () => {
                  try {
                    const hasIndex = Object.keys(codeFiles).some(p => p === '/index.html' || p.endsWith('/index.html') || p === 'index.html')
                    if (!hasIndex) {
                      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: 'Warning: No index.html found. The deployed site may not render.', timestamp: Date.now() }])
                    }
                        let deployFiles = codeFiles
                        if (framework === 'next' && scaffoldNext) {
                          deployFiles = scaffoldNextFromStatic(codeFiles)
                        }
        const res = await fetch('/api/deploy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: deployFiles, name: projectName || 'ai-studio-site', frameworkHint: frameworkToTemplate(framework), token: vercelToken || undefined })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data?.error || 'Failed to deploy')
                    const live = data?.url
                    const inspect = data?.inspectorUrl
                    if (live) {
                      setCanvasContent(
                        <div className="p-3 text-sm">
                          <a className="text-emerald-600 underline" href={live} target="_blank" rel="noreferrer">Live website</a>
                          <div className="text-gray-600 mt-1">{live}</div>
                          {inspect && (
                            <div className="mt-2">
                              <a className="text-gray-600 underline" href={inspect} target="_blank" rel="noreferrer">Vercel deployment inspector</a>
                            </div>
                          )}
                        </div>
                      )
                      setCanvasExpanded(true)
                      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Deployed to: ${live}`, timestamp: Date.now() }])
                    } else {
                      throw new Error('No URL returned from Vercel')
                    }
                  } catch (err: any) {
                    setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Deploy error: ${err?.message}`, timestamp: Date.now() }])
                  }
                } : undefined}
                template={frameworkToTemplate(framework)}
                rightExtras={
                  <div className="flex items-center gap-2">
                    <FrameworkSelector value={framework} onChange={setFramework} />
                    {activeMode === 'web' && (
                      <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="Vercel token"
                        className="input-modern rounded-md px-2 py-1 text-sm w-40"
                        title="Vercel token (stored locally)"
                      />
                    )}
                  </div>
                }
              />
            )
          }
        } catch (e) {
          // If partial or invalid JSON, keep existing editor with initial files
        }
        const aiMsg: Message = { id: generateId(), role: 'assistant', content: `Generated a ${framework} project for: "${prompt}"`, timestamp: Date.now() }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (err: any) {
      const aiMsg: Message = { id: generateId(), role: 'assistant', content: `Error: ${err?.message || 'Failed to generate response'}`, timestamp: Date.now() }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = () => {
    const newId = generateId()
    setConversations(prev => [
      ...prev,
      {
        id: newId,
        title: 'New conversation',
        timestamp: new Date(),
        starred: false
      }
    ])
    setActiveConversationId(newId)
  setMessages([])
  }

  const handleDeleteConversation = (id: string) => {
    if (id === activeConversationId) {
      const remainingConvos = conversations.filter(c => c.id !== id)
      if (remainingConvos.length > 0) {
        setActiveConversationId(remainingConvos[0].id)
      } else {
        handleNewConversation()
      }
    }
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const handleStarConversation = (id: string) => {
    setConversations(prev => 
      prev.map(c => 
        c.id === id ? { ...c, starred: !c.starred } : c
      )
    )
  }

  return (
    <motion.div 
      className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onStarConversation={handleStarConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar 
          activeMode={activeMode} 
          onModeChange={handleModeChange}
          selectedModel={activeMode === 'image' ? selectedImageModel : selectedModel}
          onModelChange={(m) => {
            if (activeMode === 'image') setSelectedImageModel(m); else setSelectedModel(m)
          }}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <motion.main 
          className="flex-1 overflow-hidden flex flex-col"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            className="flex-1 overflow-y-auto p-6 scroll-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onDragOver={(e) => {
              if (activeMode === 'image') {
                e.preventDefault()
              }
            }}
            onDrop={(e) => {
              if (activeMode !== 'image') return
              e.preventDefault()
              const url = e.dataTransfer.getData('application/x-ai-image-url') || e.dataTransfer.getData('text/uri-list')
              if (url) {
                setCanvasContent(
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <motion.img 
                      src={url} 
                      alt="Dropped" 
                      className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )
                setCanvasExpanded(true)
              }
            }}
          >
            <div className="max-w-5xl w-full mx-auto">
              {activeMode === 'image' && imageGallery.length > 0 && (
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                    <div className="text-sm font-medium text-slate-600">Recent Images</div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {imageGallery.map((item, idx) => (
                      <motion.div 
                        key={idx} 
                        className="relative shrink-0 group"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <button
                          className="glass-card border border-white/30 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                          title="Open in preview"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-ai-image-url', item.url)
                            e.dataTransfer.setData('text/uri-list', item.url)
                          }}
                          onClick={() => {
                            setCanvasContent(
                              <div className="w-full h-full flex items-center justify-center p-4">
                                <motion.img 
                                  src={item.url} 
                                  alt="Generated" 
                                  className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/20"
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            )
                            setCanvasExpanded(true)
                          }}
                        >
                          <img src={item.url} alt="thumb" className="w-36 h-24 object-cover" />
                        </button>
                        {item.pinned && (
                          <motion.span 
                            className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            Pinned
                          </motion.span>
                        )}
                        <motion.div 
                          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <motion.button
                            className="text-xs px-2 py-1 rounded-lg bg-white/90 text-slate-700 hover:bg-white shadow-md font-medium"
                            title={item.pinned ? 'Unpin' : 'Pin'}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setImageGallery(prev => {
                                const copy = [...prev]
                                copy[idx] = { ...copy[idx], pinned: !copy[idx].pinned }
                                const pinned = copy.filter(i => i.pinned)
                                const unpinned = copy.filter(i => !i.pinned)
                                return [...pinned, ...unpinned]
                              })
                            }}
                          >
                            {item.pinned ? 'Unpin' : 'Pin'}
                          </motion.button>
                          <motion.button
                            className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 shadow-md font-medium"
                            title="Remove"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setImageGallery(prev => prev.filter((_, i) => i !== idx))
                            }}
                          >
                            Del
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              <AnimatePresence>
        {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full py-12"
                  >
                    <div className="text-center select-none">
          <div className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-4">
                        {greeting}
                      </div>
                      <div className="text-gray-600 text-base md:text-lg mb-1">{quote || sublineDefault}</div>
          <div className="text-gray-500 text-sm md:text-base">Type your request below to get started.</div>
                    </div>
                  </motion.div>
                )}
        {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <ChatMessage
                      message={message}
                      isLast={index === messages.length - 1}
                      showTimestamp={true}
          userImage={userImage}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Large global thinking animation removed; micro indicator shows by AI label */}
              
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
          
          <div className="p-4">
            <motion.div 
              className="max-w-5xl w-full mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {canvasContent && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <CanvasPanel
                    title={`${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Output`}
                    isExpanded={canvasExpanded}
                    onToggleExpand={() => setCanvasExpanded(!canvasExpanded)}
                    onClear={() => setCanvasContent(null)}
                    className="mb-6"
                  >
                    {canvasContent}
                  </CanvasPanel>
                </motion.div>
              )}
              
              <motion.div 
                className="glass-card rounded-2xl border border-white/30 p-6 mb-6 backdrop-blur-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Hide tips in Text mode for a distraction-free chat */}
                    {activeMode !== 'text' && <ModelSelectionTip />}

                    {/* Show framework picker only for Code and Web */}
                    {(activeMode === 'code' || activeMode === 'web') && (
                      <div className="hidden md:flex items-center gap-3">
                        <div className="h-4 w-px bg-slate-300" />
                        <FrameworkSelector value={framework} onChange={setFramework} />
                      </div>
                    )}

                    {/* Image Controls */}
                    {activeMode === 'image' && (
                      <motion.div 
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="h-4 w-px bg-slate-300" />
                        <span className="text-sm font-medium text-slate-600">Aspect:</span>
                        <div className="flex gap-1 p-1 bg-white/60 rounded-xl border border-white/30">
                          {['16:9','1:1','9:16','4:3'].map(r => (
                            <motion.button
                              key={r}
                              className="text-sm px-2 py-1 rounded-lg text-slate-600 hover:bg-white/80 font-medium transition-all duration-300"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setAspect(r as any)}
                            >{r}</motion.button>
                          ))}
                        </div>
                        
                        <span className="text-sm font-medium text-slate-600">Style:</span>
                        <select
                          value={imageStyle}
                          onChange={(e) => setImageStyle(e.target.value)}
                          aria-label="Image style preset"
                          className="text-sm bg-white/80 border border-white/40 rounded-lg px-3 py-1.5 font-medium text-slate-700 input-modern"
                        >
                          {['default','cyberpunk','clay','flat','anime'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Advanced Text Controls */}
                    {activeMode === 'text' && (
                      <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="h-4 w-px bg-slate-300" />
                        <span className="text-sm font-medium text-slate-600">Tone:</span>
                        <select
                          aria-label="Text tone"
                          value={textTone}
                          onChange={(e) => setTextTone(e.target.value as any)}
                          className="text-sm bg-white/80 border border-white/40 rounded-lg px-3 py-1.5 font-medium text-slate-700 input-modern"
                        >
                          {['neutral','friendly','formal','playful','concise'].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>

                        <span className="text-sm font-medium text-slate-600">Format:</span>
                        <select
                          aria-label="Text format"
                          value={textFormat}
                          onChange={(e) => setTextFormat(e.target.value as any)}
                          className="text-sm bg-white/80 border border-white/40 rounded-lg px-3 py-1.5 font-medium text-slate-700 input-modern"
                        >
                          {['auto','bullets','paragraph','steps','table'].map(f => (
                            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Status Text */}
                  <motion.div 
                    className="hidden lg:block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    {activeMode === 'text' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm shadow-md">
                        <span>💬</span>
                        <span className="font-medium">Chat mode active</span>
                      </div>
                    ) : activeMode === 'image' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 text-white text-sm shadow-md">
                        <span>✨</span>
                        <span className="font-medium">Image generation</span>
                      </div>
                    ) : activeMode === 'code' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm shadow-md">
                        <span>⚡</span>
                        <span className="font-medium">Code mode</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm shadow-md">
                        <span>🌐</span>
                        <span className="font-medium">Website builder</span>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                {/* Additional Controls Row - Web-only site options */}
                <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/20">
                  {activeMode === 'text' && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="text-sm font-medium text-slate-600">Attach:</label>
                      <label className="text-sm px-3 py-1.5 rounded-lg bg-white/80 border border-white/40 cursor-pointer hover:bg-white">
                        Upload PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setAttachedPdfName(file.name)
                            try {
                              // Basic client-side validation
                              if (file.type !== 'application/pdf') {
                                setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Please upload a valid PDF file.`, timestamp: Date.now() }])
                                return
                              }
                              const maxMb = 10
                              if (file.size > maxMb * 1024 * 1024) {
                                setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `PDF too large (${(file.size / (1024*1024)).toFixed(1)} MB). Max allowed is ${maxMb} MB.`, timestamp: Date.now() }])
                                return
                              }

                              const buf = await file.arrayBuffer()
                              const headers: Record<string, string> = {
                                'Content-Type': 'application/octet-stream',
                                'X-Filename': encodeURIComponent(file.name)
                              }
                              // If user has provided a password previously in localStorage, attach it
                              const storedPwd = localStorage.getItem('aiStudio.pdfPassword')
                              if (storedPwd) headers['X-Pdf-Password'] = storedPwd

                              const res = await fetch('/api/extract-pdf', {
                                method: 'POST',
                                headers,
                                body: buf
                              })
                              if (res.ok) {
                                const data = await res.json()
                                const text: string = data?.text || ''
                                if (text) {
                                  const clipped = text.slice(0, 120_000)
                                  setKnowledgeText(prev => (prev ? `${prev}\n\n${clipped}` : clipped))
                                  setAttachedPdfChars(clipped.length)
                                  setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `Attached PDF “${file.name}” (${clipped.length.toLocaleString()} chars extracted).`, timestamp: Date.now() }])
                                } else {
                                  setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: `No extractable text found in “${file.name}”. It may be a scanned PDF without OCR.`, timestamp: Date.now() }])
                                }
                              } else {
                                let errMsg = 'Failed to read PDF.'
                                try {
                                  const detail = await res.json()
                                  if (detail?.error) errMsg = detail.error
                                } catch {}
                                setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: errMsg, timestamp: Date.now() }])
                              }
                            } catch (err: any) {
                              const errMsg = typeof err?.message === 'string' ? err.message : 'Error processing PDF.'
                              setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: errMsg, timestamp: Date.now() }])
                            }
                          }}
                        />
                      </label>
                      {attachedPdfName && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                          {attachedPdfName} {attachedPdfChars ? `(${attachedPdfChars.toLocaleString()} chars)` : ''}
                        </span>
                      )}
                    </div>
                  )}
                  {activeMode === 'web' && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-600" htmlFor="projectName">Site:</label>
                      <input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="project-name"
                        className="text-sm input-modern rounded-lg px-3 py-1.5 w-32"
                      />
                      
                      <div className="flex items-center gap-2">
                        <input
                          id="scaffoldNext"
                          type="checkbox"
                          checked={scaffoldNext}
                          onChange={(e) => setScaffoldNext(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white border-2 border-white/40 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label className="text-sm font-medium text-slate-600" htmlFor="scaffoldNext">
                          Scaffold Next on deploy
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                placeholder={getPlaceholderByMode(activeMode)}
                activeMode={activeMode}
                onModeChange={handleModeChange}
              />
            </motion.div>
          </div>
        </motion.main>
      </div>
    </motion.div>
  )
}

function getPlaceholderByMode(mode: GenerationMode): string {
  switch (mode) {
    case 'text':
      return 'Ask me anything...'
    case 'image':
      return 'Describe the image you want to generate...'
    case 'code':
      return 'Describe the code you need...'
    case 'web':
      return 'Describe the website you want to build...'
    default:
      return 'Type a message...'
  }
}
