'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteReview } from './actions'

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Supprimer cet avis ? Cette action est irreversible.')) return
    setLoading(true)
    try {
      const result = await deleteReview(reviewId)
      if (result.ok) {
        setDeleted(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (deleted) return <span className="text-xs text-gray-400">Supprime</span>

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? '...' : 'Supprimer'}
    </button>
  )
}
