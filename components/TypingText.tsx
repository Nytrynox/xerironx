import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function TypingText({
  content,
  typingSpeed = 30,
  className,
}: {
  content: string
  typingSpeed?: number
  className?: string
}) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, typingSpeed)
      
      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
    }
  }, [content, currentIndex, typingSpeed])

  return (
    <div className={cn('whitespace-pre-wrap', className)}>
      {displayedContent}
      {!isComplete && (
        <span className="inline-block w-2 h-4 bg-neon-green animate-blink ml-0.5" />
      )}
    </div>
  )
}
