'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FRAMEWORKS, type FrameworkKey } from '@/lib/constants'

export function FrameworkSelector({
	value,
	onChange,
	className,
}: {
	value: FrameworkKey
	onChange: (fw: FrameworkKey) => void
	className?: string
}) {
	const [open, setOpen] = useState(false)
	const label = FRAMEWORKS.find(f => f.key === value)?.label || 'Framework'

	return (
		<div className={cn('relative', className)}>
			<button
				onClick={() => setOpen(o => !o)}
				className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md transition-colors bg-white/60 hover:bg-gray-100/80 border border-gray-200/60"
			>
				<Layers className="h-3.5 w-3.5" />
				<span>{label}</span>
				{open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
			</button>
			{open && (
				<div className="absolute top-full left-0 mt-1 w-48 bg-[var(--panel)] rounded-md shadow-lg border border-gray-200/60 py-1 z-20">
					{FRAMEWORKS.map(f => (
						<button
							key={f.key}
							className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
							onClick={() => { onChange(f.key); setOpen(false) }}
						>
							{f.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

