'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './trpc/client'

/**
 * Hook that checks if the current user has host role.
 * Redirects to /host/onboarding if not a host.
 * Returns { isHost, isLoading } so the page can show a spinner.
 */
export function useRequireHost() {
  const router = useRouter()
  const { data: me, isLoading } = api.users.me.useQuery()
  const isHost = me?.role === 'host' || me?.role === 'both' || me?.role === 'admin'

  useEffect(() => {
    if (!isLoading && me && !isHost) {
      router.replace('/host/onboarding')
    }
  }, [isLoading, me, isHost, router])

  return { isHost, isLoading }
}
