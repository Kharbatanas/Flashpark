'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activer' },
  { value: 'inactive', label: 'Désactiver' },
  { value: 'pending_review', label: 'Mettre en révision' },
]

export function SpotActions({ spotId, currentStatus }: { spotId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/spots/${spotId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erreur inconnue')
      } else {
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {STATUS_OPTIONS.filter((o) => o.value !== currentStatus).map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleStatusChange(opt.value)}
          disabled={loading}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            opt.value === 'active'
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : opt.value === 'inactive'
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {loading ? '...' : opt.label}
        </button>
      ))}
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
