"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [signIn, setSignIn] = useState<null | ((provider?: string, options?: any) => Promise<void>)>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('xerironx.userName')
      if (saved) setName(saved)
    } catch {}
    import('next-auth/react').then((m) => setSignIn(() => m.signIn as any)).catch(() => setSignIn(null))
  }, [])

  const handleSave = () => {
    try { localStorage.setItem('xerironx.userName', name.trim() || 'User') } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Logo size={96} />
          <h1 className="mt-4 text-2xl font-display font-extrabold tracking-tight">Create your account</h1>
          <p className="text-gray-600 mt-1">Set a display name and connect Google</p>
        </div>

        <div className="mt-6 grid gap-2">
          <label className="text-sm font-medium text-gray-700">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="Your name"
            className="input-modern rounded-xl border border-gray-200 px-3 py-2"
          />
          <p className="text-xs text-gray-500">We use this name in greetings; Google name shows elsewhere.</p>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 font-medium"
            onClick={() => signIn?.('google', { callbackUrl: '/' })}
          >
            <img src="/logo.svg" className="h-5 w-5" alt="Google" />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link className="text-indigo-600 hover:underline font-medium" href="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
