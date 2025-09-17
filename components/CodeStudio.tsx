'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { LiveEditor } from './LiveEditor'
import { Play, Download, Copy, Check, Save, Upload } from 'lucide-react'

export type CodeStudioTab = 'editor' | 'preview' | 'split'

export function CodeStudio({
  files,
  activeFile,
  onChangeActiveFile,
  onUpdateCode,
  onCreateFile,
  onDeleteFile,
  onRun,
  onDownload,
  onDeploy,
  canRun = true,
  rightExtras,
  template,
  className,
}: {
  files: Record<string, { code: string }>
  activeFile: string
  onChangeActiveFile: (file: string) => void
  onUpdateCode?: (file: string, code: string) => void
  onCreateFile?: (path: string) => void
  onDeleteFile?: (path: string) => void
  onRun?: () => void
  onDownload?: () => void
  onDeploy?: () => void
  canRun?: boolean
  rightExtras?: React.ReactNode
  template?: 'vanilla' | 'react' | 'nextjs' | 'vue'
  className?: string
}) {
  const [tab, setTab] = useState<CodeStudioTab>('split')
  const [copied, setCopied] = useState(false)
  const [showFiles, setShowFiles] = useState(true)
  const fileKeys = Object.keys(files)

  const copyToClipboard = async () => {
    if (files && activeFile && files[activeFile]) {
      await navigator.clipboard.writeText(files[activeFile].code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDropInsert = (e: React.DragEvent) => {
    e.preventDefault()
    if (!activeFile || !files[activeFile]) return
    const url = e.dataTransfer.getData('application/x-ai-image-url') || e.dataTransfer.getData('text/uri-list')
    if (!url) return
    const current = files[activeFile].code || ''
    const lower = activeFile.toLowerCase()
    let snippet = ''
    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      snippet = `\n<img src="${url}" alt="Image" />\n`
    } else if (lower.endsWith('.md')) {
      snippet = `\n![](${url})\n`
    } else if (lower.endsWith('.css')) {
      snippet = `\n/* image reference */\n/* ${url} */\n`
    } else if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.jsx') || lower.endsWith('.tsx')) {
      snippet = `\n// Image URL inserted via drag-and-drop\nconst imageUrl = '${url}'\n`
    } else {
      snippet = `\n${url}\n`
    }
    onUpdateCode?.(activeFile, current + snippet)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'w-full rounded-lg bg-white border border-gray-200/60 overflow-hidden flex flex-col shadow-sm',
        className
      )}
    >
  <div className="flex items-center justify-between border-b border-gray-200/60 p-2 bg-gray-50">
        <div className="flex items-center overflow-x-auto scroll-hidden">
          {fileKeys.map((file) => (
            <button
              key={file}
              onClick={() => onChangeActiveFile(file)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg mr-1.5 transition-colors',
                activeFile === file
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {file.startsWith('/') ? file.substring(1) : file}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {rightExtras}
          <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const name = prompt('New file path (e.g. /index.html):', '/new-file.txt')
              if (!name) return
              onCreateFile?.(name)
            }}
            className="h-7 px-2"
            title="New file"
          >
            +
          </Button>
          {activeFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!activeFile) return
                const ok = confirm(`Delete ${activeFile}?`)
                if (!ok) return
                onDeleteFile?.(activeFile)
              }}
              className="h-7 px-2"
              title="Delete file"
            >
              ×
            </Button>
          )}
      {onRun && (
            <Button
        variant="default"
              size="sm"
              onClick={onRun}
              disabled={!canRun}
              className="h-7 gap-1"
              title="Run code"
            >
              <Play className="h-3.5 w-3.5" />
              <span className="text-xs">Run</span>
            </Button>
          )}
          {onDeploy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeploy}
              className="h-7 gap-1"
              title="Deploy to Vercel"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="text-xs">Deploy</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 w-7 p-0"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-7 w-7 p-0"
              title="Download files"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex items-center bg-gray-50 border-b border-gray-200/60 p-1.5">
          <div className="flex items-center mx-auto bg-white rounded-md p-0.5 border border-gray-200/60 shadow-sm">
            <Button
              variant={tab === 'editor' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('editor')}
              className="h-7 text-xs"
            >
              Editor
            </Button>
            <Button
              variant={tab === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('preview')}
              className="h-7 text-xs"
            >
              Preview
            </Button>
            <Button
              variant={tab === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('split')}
              className="h-7 text-xs"
            >
              Split
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex" onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-ai-image-url') || e.dataTransfer.types.includes('text/uri-list')) {
            e.preventDefault()
          }
        }} onDrop={handleDropInsert}>
  <div className={cn('border-r border-gray-200/60 bg-gray-50 transition-all', showFiles ? 'w-48' : 'w-0')}>
            {showFiles && (
              <div className="h-full overflow-y-auto p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">Files</div>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowFiles(false)}>Hide</Button>
                </div>
                <div className="space-y-1">
                  {fileKeys.map((file) => (
                    <button
                      key={file}
                      onClick={() => onChangeActiveFile(file)}
                      className={cn(
                        'w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100 truncate',
                        activeFile === file ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                      )}
                      title={file}
                    >
                      {file.startsWith('/') ? file.substring(1) : file}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
              <LiveEditor
                files={files}
                activeFile={activeFile}
                template={template}
                viewMode={tab}
              />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
