'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVerificationDoc } from './actions'

export function VerificationActions({ docId, currentStatus }: { docId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleAction(action: 'approved' | 'rejected') {
    let notes: string | undefined
    if (action === 'rejected') {
      const input = window.prompt('Raison du rejet :')
      if (!input) return
      notes = input
    }

    setLoading(true)
    setMessage(null)
    try {
      const result = await updateVerificationDoc(docId, action, notes)
      if (result.ok) {
        setMessage(action === 'approved' ? 'Approuve' : 'Rejete')
        router.refresh()
      } else {
        setMessage(result.error ?? 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus !== 'pending') {
    return <span className="text-xs text-gray-400">{currentStatus === 'approved' ? 'Approuve' : 'Rejete'}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('approved')}
        disabled={loading}
        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? '...' : 'Approuver'}
      </button>
      <button
        onClick={() => handleAction('rejected')}
        disabled={loading}
        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 disabled:opacity-50"
      >
        {loading ? '...' : 'Rejeter'}
      </button>
      {message && <span className="text-xs text-gray-500">{message}</span>}
    </div>
  )
}
