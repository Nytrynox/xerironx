'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODELS, IMAGE_MODELS } from '@/lib/constants'

type ModelType = 'text' | 'image'

interface ModelSelectorProps {
  activeMode: 'text' | 'image' | 'code' | 'web'
  selectedModel: string
  onModelChange: (model: string) => void
  className?: string
}

export function ModelSelector({
  activeMode,
  selectedModel,
  onModelChange,
  className
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const modelList = activeMode === 'image' ? IMAGE_MODELS : MODELS
  
  // Get the display name from the model ID
  const getDisplayName = (modelId: string) => {
    const parts = modelId.split('/')
    const name = parts[1].split(':')[0]
    // Capitalize and format name
    return name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  // Get provider name
  const getProviderName = (modelId: string) => {
    return modelId.split('/')[0]
  }
  
  return (
    <div className={cn('relative z-10', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md transition-colors bg-white/60 hover:bg-gray-100/80 border border-gray-200/60"
      >
        <Cpu size={12} />
        <span className="truncate max-w-[100px]">{getDisplayName(selectedModel)}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
    className="absolute top-full right-0 mt-1 w-64 bg-[var(--panel)] rounded-lg shadow-lg border border-gray-200/60 py-1 max-h-80 overflow-y-auto"
        >
    <div className="px-3 py-2 text-xs text-gray-500 font-medium border-b border-gray-200/60">
            Select a model
          </div>
          <div className="py-1">
            {modelList.map((model) => (
              <button
                key={model}
                className={cn(
      'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
      selectedModel === model && 'bg-gray-100'
                )}
                onClick={() => {
                  onModelChange(model)
                  setIsOpen(false)
                }}
              >
                <div className="flex-1 flex flex-col">
                  <span className="font-medium">{getDisplayName(model)}</span>
      <span className="text-xs text-gray-500">{getProviderName(model)}</span>
                </div>
                {selectedModel === model && <Check size={16} />}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
