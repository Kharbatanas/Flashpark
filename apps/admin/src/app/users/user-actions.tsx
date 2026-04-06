'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleUserVerified, demoteUser } from './actions'

export function UserActions({ userId, currentRole, isVerified }: { userId: string; currentRole: string; isVerified: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggleVerified() {
    setLoading(true)
    try {
      const result = await toggleUserVerified(userId, isVerified)
      if (result.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDemote() {
    if (!window.confirm('Bannir cet utilisateur ? Son role sera remis a "driver".')) return
    setLoading(true)
    try {
      const result = await demoteUser(userId)
      if (result.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleToggleVerified}
        disabled={loading}
        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isVerified
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {isVerified ? 'Verifie' : 'Non verifie'}
      </button>
      {currentRole !== 'admin' && (
        <button
          onClick={handleDemote}
          disabled={loading}
          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          Bannir
        </button>
      )}
    </div>
  )
}
