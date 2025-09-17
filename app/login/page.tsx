"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { useEffect, useState } from 'react'
import { getFirebaseAnalytics } from '@/lib/firebase'

export default function LoginPage() {
  const [signIn, setSignIn] = useState<null | ((provider?: string, options?: any) => Promise<void>)>(null)
  useEffect(() => {
    getFirebaseAnalytics()
    import('next-auth/react').then((m) => setSignIn(() => m.signIn as any)).catch(() => setSignIn(null))
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Logo size={96} />
          <h1 className="mt-4 text-2xl font-display font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-gray-600 mt-1">Sign in to continue</p>
        </div>

        <div className="mt-8 grid gap-3">
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 font-medium"
            onClick={() => signIn?.('google', { callbackUrl: '/' })}
          >
            <img src="/logo.svg" className="h-5 w-5" alt="Google" />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link className="text-indigo-600 hover:underline font-medium" href="/register">Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
