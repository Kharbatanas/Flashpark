'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/trpc/client'

export default function BecomeHostButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const becomeHost = api.users.becomeHost.useMutation()

  async function handle() {
    setLoading(true)
    setError(null)
    try {
      await becomeHost.mutateAsync()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl bg-[#0540FF] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Devenir hôte gratuitement
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
