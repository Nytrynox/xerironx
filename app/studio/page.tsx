'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the AI Studio page to avoid server-side rendering issues
const AIStudioPage = dynamic(() => import('@/app/ai-studio'), {
  ssr: false,
})

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-neon-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-700">Loading AI Studio...</p>
        </div>
      </div>
    }>
      <AIStudioPage />
    </Suspense>
  )
}
