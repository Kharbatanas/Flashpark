'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveSpot, rejectSpot } from './actions'

interface SpotVerificationActionsProps {
  spotId: string
}

export function SpotVerificationActions({ spotId }: SpotVerificationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setMessage(null)
    try {
      const result = await approveSpot(spotId)
      if (result.ok) {
        router.refresh()
      } else {
        setMessage(result.error ?? 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setLoading(true)
    setMessage(null)
    try {
      const result = await rejectSpot(spotId, notes)
      if (result.ok) {
        setRejectOpen(false)
        router.refresh()
      } else {
        setMessage(result.error ?? 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Approuver'}
        </button>
        <button
          onClick={() => setRejectOpen((v) => !v)}
          disabled={loading}
          className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Rejeter
        </button>
      </div>

      {rejectOpen && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Raison du rejet (optionnel)..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Confirmer'}
            </button>
            <button
              onClick={() => { setRejectOpen(false); setNotes('') }}
              disabled={loading}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-xs text-red-500">{message}</p>}
    </div>
  )
}
