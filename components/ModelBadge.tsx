'use client'

import { Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModelBadgeProps {
  model: string
  className?: string
}

export function ModelBadge({ model, className }: ModelBadgeProps) {
  // Extract model name for display - format: 'organization/model:free'
  const getDisplayName = (modelPath: string) => {
    const parts = modelPath.split('/')
    const modelWithTag = parts[parts.length - 1]
    return modelWithTag.split(':')[0] // Remove the :free tag
  }
  
  // Get organization name
  const getOrgName = (modelPath: string) => {
    return modelPath.split('/')[0]
  }

  return (
    <div className={cn(
  "flex items-center gap-1 py-0.5 px-2 rounded-full border border-gray-200/60 bg-gray-50",
  "text-xs text-gray-700",
      className
    )}>
      <Cpu className="h-3 w-3" />
      <span>{getDisplayName(model)}</span>
    </div>
  )
}
