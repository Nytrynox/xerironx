'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/Button'
import { ChevronLeft, ChevronRight, PlusCircle, Clock, Star, Trash2, MessageSquare, Sparkles } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

type Conversation = {
  id: string
  title: string
  timestamp: Date
  starred?: boolean
}

export function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onStarConversation,
  className,
}: {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onStarConversation: (id: string) => void
  className?: string
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.div
      initial={{ width: 320, opacity: 0, x: -50 }}
      animate={{
        width: isCollapsed ? 80 : 320,
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      className={cn(
        'h-full glass-panel border-r border-gray-200/60 flex flex-col backdrop-blur-xl',
        className
      )}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-6 border-b border-gray-200/60"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-800 text-lg">Conversations</h2>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100/60 glass-card transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </motion.div>
            <span className="sr-only">
              {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </Button>
        </motion.div>
      </motion.div>
      
      {/* New Chat Button */}
      <motion.div 
        className="p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onNewConversation}
            className={cn(
              'w-full gap-3 h-12 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white shadow-lg neon-glow transition-all duration-300',
              isCollapsed && 'justify-center px-0 w-12'
            )}
          >
            <motion.div
              animate={{ rotate: [0, 180, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <PlusCircle className="h-5 w-5" />
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  New Chat
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="px-4 pb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Recent</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="overflow-y-auto scroll-hidden px-2">
          <AnimatePresence>
            {conversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="mb-2"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'relative group rounded-xl p-3 cursor-pointer transition-all duration-300',
                    activeConversationId === conversation.id
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-lg'
                      : 'bg-white/50 hover:bg-white/70 border border-gray-200/60 hover:shadow-lg',
                    isCollapsed && 'p-2 justify-center'
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  {!isCollapsed ? (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {conversation.starred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {conversation.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(conversation.timestamp)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onStarConversation(conversation.id)
                          }}
                          className="p-1 rounded-lg hover:bg-gray-100/60 text-gray-500 hover:text-yellow-500"
                        >
                          <Star className={cn(
                            "h-3 w-3",
                            conversation.starred && "fill-current text-yellow-500"
                          )} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConversation(conversation.id)
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        activeConversationId === conversation.id
                          ? "bg-indigo-500"
                          : "bg-gray-400"
                      )} />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {conversations.length === 0 && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
              </motion.div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">No conversations yet</h3>
              <p className="text-xs text-gray-500">Start a new chat to begin</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="p-4 border-t border-gray-200/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-gray-200/60">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700">AI Studio</p>
                <p className="text-xs text-gray-500">Powered by AI</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
