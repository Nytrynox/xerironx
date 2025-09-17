import React, { useState, useEffect } from 'react'
import { Sandpack } from '@codesandbox/sandpack-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { RefreshCw, Code, Eye, Copy, Check } from 'lucide-react'

export type ViewMode = 'editor' | 'preview' | 'split'

export function LiveEditor({
  files,
  activeFile,
  template,
  viewMode = 'split',
  className,
}: {
  files: Record<string, { code: string }>
  activeFile: string
  template?: 'vanilla' | 'react' | 'nextjs' | 'vue'
  viewMode?: ViewMode
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (files && activeFile && files[activeFile]) {
      await navigator.clipboard.writeText(files[activeFile].code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cn('rounded-lg overflow-hidden border border-gray-200/60 bg-white', className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200/60">
        <div className="text-sm font-medium text-gray-800">
          {activeFile}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 w-7 p-0"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
      </div>
      <Sandpack
        files={files}
        template={template || 'vanilla'}
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: true,
          showInlineErrors: true,
          closableTabs: false,
          wrapContent: true,
          editorHeight: viewMode === 'split' ? '400px' : '600px',
          classes: {
            'sp-layout': 'custom-layout',
            'sp-stack': 'custom-stack',
          },
        }}
        customSetup={{
          dependencies: {},
        }}
      />
    </div>
  )
}
