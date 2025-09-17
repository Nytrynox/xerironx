import React, { useRef, useEffect, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'
import { Mic, Send, Loader2, Image, Code, MessageSquare, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Type a message...',
  activeMode = 'text',
  onModeChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  placeholder?: string
  activeMode?: 'text' | 'image' | 'code' | 'web'
  onModeChange?: (mode: 'text' | 'image' | 'code' | 'web') => void
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'text': return MessageSquare
      case 'image': return Image
      case 'code': return Code
      case 'web': return Globe
      default: return MessageSquare
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'text': return 'from-gray-800 to-gray-900'
      case 'image': return 'from-emerald-500 to-emerald-600'
      case 'code': return 'from-indigo-500 to-indigo-600'
      case 'web': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-800 to-gray-900'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className={cn(
        'relative flex items-end w-full rounded-2xl glass-card border border-gray-200/50 p-4 gap-4 backdrop-blur-xl',
        isFocused && 'ring-2 ring-indigo-500/40 border-indigo-400/50',
        className
      )}
    >
      {/* Mode Selection */}
      <motion.div 
        className="flex gap-1 p-1 bg-white/60 rounded-xl border border-gray-200/50"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
      >
        {(['text', 'image', 'code', 'web'] as const).map((mode) => {
          const Icon = getModeIcon(mode)
          const isActive = activeMode === mode
          return (
            <motion.button
              key={mode}
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 font-medium',
                isActive 
                  ? `bg-gradient-to-br ${getModeColor(mode)} text-white shadow-lg`
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
              )}
              onClick={() => onModeChange && onModeChange(mode)}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} generation`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="h-4 w-4" />
            </motion.button>
          )
        })}
      </motion.div>

      {/* Text Input */}
      <div className="flex-1 relative">
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent outline-none resize-none text-gray-700 placeholder:text-gray-400 text-base leading-relaxed min-h-[44px] max-h-[200px] px-0 py-2"
          maxRows={8}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          className="h-10 w-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 transition-all duration-300"
          title="Voice input (coming soon)"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="h-4 w-4" />
        </motion.button>
        
        <motion.button
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 font-medium',
            isLoading || value.trim() === ''
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg hover:from-gray-900 hover:to-black neon-glow'
          )}
          onClick={onSubmit}
          disabled={isLoading || value.trim() === ''}
          title="Send message"
          whileHover={!isLoading && value.trim() !== '' ? { scale: 1.05 } : {}}
          whileTap={!isLoading && value.trim() !== '' ? { scale: 0.95 } : {}}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
