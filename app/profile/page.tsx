"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const [useSessionHook, setUseSessionHook] = useState<null | (() => { data: any } | any)>(null)
  const [signOutFn, setSignOutFn] = useState<null | ((options?: any) => Promise<void>)>(null)
  useEffect(() => {
    import('next-auth/react')
      .then((m) => {
        setUseSessionHook(() => (m as any).useSession)
        setSignOutFn(() => (m as any).signOut)
      })
      .catch(() => {
        setUseSessionHook(null)
        setSignOutFn(null)
      })
  }, [])

  const sessionData = useSessionHook ? (useSessionHook() as any)?.data : null
  const user = sessionData?.user

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:underline">← Back</Link>
        <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 shadow">
          <div className="flex items-center gap-4">
            <img src={user?.image || '/user-avatar.svg'} alt={user?.name || 'User'} className="h-16 w-16 rounded-full border" />
            <div>
              <div className="text-xl font-semibold">{user?.name || 'Guest'}</div>
              <div className="text-gray-600 text-sm">{user?.email || 'Not signed in'}</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {user ? (
              <button onClick={() => signOutFn?.({ callbackUrl: '/' })} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200">Sign out</button>
            ) : (
              <Link href="/login" className="px-4 py-2 rounded-xl bg-gray-900 text-white">Sign in</Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
