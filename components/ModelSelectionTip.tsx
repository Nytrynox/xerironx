'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

export default function ModelSelectionTip() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    // Show the tip after a short delay
    const timer = setTimeout(() => {
      const hasSeenTip = localStorage.getItem('model-tip-seen')
      if (!hasSeenTip) {
        setVisible(true)
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem('model-tip-seen', 'true')
  }
  
  if (dismissed) return null
  
  return (
    <div className="relative">
      <button 
  className="text-gray-500 hover:text-gray-800 transition-colors"
        onClick={() => setVisible(prev => !prev)}
        title="Model Selection Help"
        aria-label="Get help about model selection"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-0 w-64 p-3 rounded-lg bg-white border border-gray-200/60 text-xs text-gray-700 shadow-lg z-10"
          >
            <button 
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
              onClick={handleDismiss}
            >
              ×
            </button>
            <p className="mb-2"><strong>Model Selection</strong></p>
            <p className="mb-2">You can choose different AI models for your specific task.</p>
            <p>Each model has different capabilities and performance characteristics.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
