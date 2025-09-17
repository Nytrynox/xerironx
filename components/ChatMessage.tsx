import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Logo } from '@/components/Logo'
import { CodeBlock, type Language } from './CodeBlock'
import { TypingText } from './TypingText'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  isTyping?: boolean
}

export function ChatMessage({
  message,
  isLast = false,
  showTimestamp = false,
  className,
  userImage,
}: {
  message: Message
  isLast?: boolean
  showTimestamp?: boolean
  className?: string
  userImage?: string | null
}) {
  const userImg = userImage || null
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  // Extract code blocks from message content
  const parts = splitCodeBlocks(message.content)
  
  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex w-full gap-4 py-4',
        isUser && 'justify-end',
        className
      )}
    >
      {!isUser && !isSystem && (
        <div className="h-20 w-20 shrink-0 flex items-center justify-center">
          <Logo size={80} />
        </div>
      )}
      
      <div className={cn(
        'flex flex-col max-w-3xl space-y-2',
        isUser ? 'items-end' : 'items-start',
      )}>
        <div className={cn(
          'rounded-lg px-4 py-2 shadow-sm',
          isUser
            ? 'bg-indigo-600 text-white border border-indigo-700'
            : isSystem
            ? 'bg-gray-100 text-gray-600 border border-gray-200'
            : 'bg-white text-gray-800 border border-gray-200',
          message.isTyping && !isUser && 'border-indigo-300'
        )}>
          {!isSystem && (
            <div className="text-sm font-medium mb-1 inline-flex items-center gap-2">
              {isUser ? 'You' : 'AI'}
              {!isUser && message.isTyping && isLast && (
                <span className="inline-flex items-center gap-1" aria-label="AI is typing">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity }} />
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.18 }} />
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.36 }} />
                </span>
              )}
            </div>
          )}
          <div className="prose max-w-none">
            {parts.map((part, i) => {
              if (part.type === 'code') {
                return (
                  <CodeBlock
                    key={i}
                    code={part.content}
                    language={part.language as Language}
                    isTyping={message.isTyping && isLast}
                  />
                )
              } else {
                return message.isTyping && isLast ? (
                  <TypingText key={i} content={part.content} />
                ) : (
                  <div key={i} className="whitespace-pre-wrap">{part.content}</div>
                )
              }
            })}
          </div>
        </div>
        
        {showTimestamp && (
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        )}
      </div>
      
    {isUser && (
        <Avatar className="h-8 w-8 border border-gray-200/60">
          <AvatarImage src={userImg || "/user-avatar.svg"} alt="User" />
          <AvatarFallback className="bg-gray-800 text-white">You</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

type CodePart = {
  type: 'code'
  content: string
  language: string | null
}

type TextPart = {
  type: 'text'
  content: string
}

type Part = CodePart | TextPart

function splitCodeBlocks(content: string): Part[] {
  const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g
  const parts: Part[] = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || null,
      content: match[2]
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  return parts
}
