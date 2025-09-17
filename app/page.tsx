"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { useEffect } from 'react'
import { getFirebaseAnalytics } from '@/lib/firebase'

export default function Home() {
  useEffect(() => {
    getFirebaseAnalytics()
  }, [])
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--bg)]">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full bg-white rounded-3xl p-10 text-center border border-gray-200/60 shadow-2xl"
      >
        <div className="mb-6 flex justify-center"><Logo size={128} /></div>
        <motion.h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">Create with AI</motion.h1>
        <motion.p className="text-lg text-gray-600 mb-8">All-in-one studio for chat, images, code, and websites.</motion.p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="px-6 py-3 rounded-full bg-gray-900 text-white font-medium shadow hover:shadow-md">Create account</Link>
          <Link href="/login" className="px-6 py-3 rounded-full bg-white text-gray-900 font-medium border border-gray-200 hover:bg-gray-50">Sign in</Link>
          <Link href="/studio" className="px-6 py-3 rounded-full bg-indigo-600 text-white font-medium shadow hover:shadow-md">Launch Studio</Link>
        </div>
      </motion.div>
    </div>
  )
}
