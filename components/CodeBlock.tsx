import React, { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Button } from './ui/Button'
import { Check, Copy, Wand2, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Language = 
  | 'markup'
  | 'bash'
  | 'clike'
  | 'c'
  | 'cpp'
  | 'css'
  | 'javascript'
  | 'jsx'
  | 'coffeescript'
  | 'actionscript'
  | 'css-extr'
  | 'diff'
  | 'git'
  | 'go'
  | 'graphql'
  | 'handlebars'
  | 'json'
  | 'less'
  | 'makefile'
  | 'markdown'
  | 'objectivec'
  | 'ocaml'
  | 'python'
  | 'reason'
  | 'sass'
  | 'scss'
  | 'sql'
  | 'stylus'
  | 'tsx'
  | 'typescript'
  | 'wasm'
  | 'yaml'

export function CodeBlock({ 
  code, 
  language = 'tsx', 
  animationDelay = 0,
  showLineNumbers = true,
  showCopyButton = true,
  isTyping = false,
  className
}: { 
  code: string; 
  language?: Language; 
  animationDelay?: number;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  isTyping?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false)
  const [modalOpen, setModalOpen] = useState<null | { mode: 'explain' | 'fix' }>(null)
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden my-4", className)}>
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        {showCopyButton && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="sr-only">Copy code</span>
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={async () => {
            setModalOpen({ mode: 'explain' })
            setAiText('')
            setLoading(true)
            try {
              const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'qwen/qwen-2.5-72b-instruct:free',
                  messages: [
                    { role: 'system', content: 'Explain the following code clearly, line by line, focusing on intent and flow.' },
                    { role: 'user', content: code }
                  ]
                })
              })
              if (res.ok && res.body) {
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                while (true) {
                  const { value, done } = await reader.read()
                  if (done) break
                  setAiText(prev => prev + decoder.decode(value))
                }
              }
            } finally {
              setLoading(false)
            }
          }}
          title="Explain"
        >
          <Wand2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={async () => {
            setModalOpen({ mode: 'fix' })
            setAiText('')
            setLoading(true)
            try {
              const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'qwen/qwen-2.5-72b-instruct:free',
                  messages: [
                    { role: 'system', content: 'Find bugs and propose minimal, safe fixes. Include patched snippets.' },
                    { role: 'user', content: code }
                  ]
                })
              })
              if (res.ok && res.body) {
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                while (true) {
                  const { value, done } = await reader.read()
                  if (done) break
                  setAiText(prev => prev + decoder.decode(value))
                }
              }
            } finally {
              setLoading(false)
            }
          }}
          title="Fix"
        >
          <Bug className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Highlight
        theme={themes.nightOwl}
        code={code.trim()}
        language={language}
      >
        {({ className: preClassName, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              "overflow-x-auto py-4 text-sm leading-6 code-block-background",
              preClassName
            )}
          >
            {tokens.map((line, i) => {
              const lineNumber = i + 1;
              const shouldAnimate = isTyping;
                
              return (
                <div
                  key={i}
                  {...getLineProps({ line, key: i })}
                  className={cn(
                    'px-4 border-l-2 border-transparent animate-typing-line',
                    shouldAnimate && 'animate-typing opacity-0',
                  )}
                >
                  {showLineNumbers && (
                    <span className="inline-block w-8 text-right mr-4 text-gray-500 select-none">
                      {lineNumber}
                    </span>
                  )}
                  <span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </span>
                  {shouldAnimate && i === tokens.length - 1 && (
                    <span className="code-caret h-[1.125rem] ml-1"></span>
                  )}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>

      {modalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="w-full max-w-lg glass-panel border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                {modalOpen.mode === 'explain' ? 'Explanation' : 'Fix Suggestions'}
              </div>
              <div className="flex items-center gap-1">
                {modalOpen.mode === 'fix' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('ai-apply-fix', { detail: { action: 'replace-active', content: aiText } }))
                        setModalOpen(null)
                      }}
                    >Replace Active</Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('ai-apply-fix', { detail: { action: 'new-file', content: aiText } }))
                        setModalOpen(null)
                      }}
                    >Add New File</Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(null)} className="h-7 px-2">Close</Button>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap max-h-72 overflow-y-auto">
              {aiText || (loading ? 'Loading…' : '')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
