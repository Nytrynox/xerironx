'use client'

import React, { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [SessionProvider, setSessionProvider] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    let mounted = true
    import('next-auth/react')
      .then((m) => {
        if (mounted) setSessionProvider(() => m.SessionProvider as any)
      })
      .catch(() => {
        // ignore – auth is optional at hydration time
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!SessionProvider) return <>{children}</>
  return <SessionProvider>{children}</SessionProvider>
}
