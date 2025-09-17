import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'
import { Download, Maximize2, Minimize2, X, RefreshCw } from 'lucide-react'

export function CanvasPanel({
  title = 'Canvas',
  isExpanded = false,
  onToggleExpand,
  onDownload,
  onClear,
  className,
  children,
}: {
  title?: string
  isExpanded?: boolean
  onToggleExpand?: () => void
  onDownload?: () => void
  onClear?: () => void
  className?: string
  children: React.ReactNode
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(isExpanded ? '500px' : '350px')

  useEffect(() => {
    setHeight(isExpanded ? '500px' : '350px')
  }, [isExpanded])

  const downloadCanvas = () => {
    if (onDownload) {
      onDownload()
    } else if (canvasRef.current) {
      // Default download behavior
      const canvas = canvasRef.current.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.download = 'canvas-image.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, height: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        height: height,
        transition: { duration: 0.5, ease: "easeOut" }
      }}
      className={cn(
        'w-full glass-card rounded-2xl overflow-hidden border border-white/30 backdrop-blur-xl shadow-lg',
        className
      )}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          {title}
        </h3>
        <div className="flex gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-white/60"
              title="Clear Canvas"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadCanvas}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-white/60"
              title="Download"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-white/60"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="sr-only">{isExpanded ? "Collapse" : "Expand"}</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHeight('0px')}
              className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Content */}
      <motion.div 
        ref={canvasRef} 
        className="w-full h-full overflow-auto bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
