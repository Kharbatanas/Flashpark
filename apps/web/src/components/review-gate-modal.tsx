'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/trpc/client'
import { Star, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${active >= s ? 'fill-[#06B6D4] text-[#06B6D4]' : 'fill-none text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ReviewGateModal() {
  const router = useRouter()
  const { data: pending, isLoading } = api.reviews.pendingReview.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  const [ratingAccess, setRatingAccess] = useState(0)
  const [ratingAccuracy, setRatingAccuracy] = useState(0)
  const [ratingCleanliness, setRatingCleanliness] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const createReview = api.reviews.create.useMutation()
  const allRated = ratingAccess > 0 && ratingAccuracy > 0 && ratingCleanliness > 0

  // Don't show if loading, no pending review, or already submitted
  if (isLoading || !pending || submitted) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allRated || !pending) { setError('Veuillez noter les 3 criteres'); return }
    setError(null)
    try {
      await createReview.mutateAsync({
        bookingId: pending.bookingId,
        ratingAccess,
        ratingAccuracy,
        ratingCleanliness,
        comment: comment || undefined,
      })
      setSubmitted(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#06B6D4]/10">
            <Star className="h-6 w-6 text-[#06B6D4]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Comment s&apos;est passe votre stationnement ?</h2>
          <p className="mt-1 text-sm text-gray-500">Evaluez votre experience avant de continuer</p>
        </div>

        {/* Spot recap */}
        <div className="mb-5 rounded-xl bg-gray-50 p-3">
          <p className="font-medium text-gray-900 text-sm">{pending.spotTitle}</p>
          {pending.spotAddress && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{pending.spotAddress}, {pending.spotCity}</span>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{fmt(pending.startTime)} — {fmt(pending.endTime)}</span>
          </div>
        </div>

        {/* Rating form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
            <StarRow label="Acces" value={ratingAccess} onChange={setRatingAccess} />
            <StarRow label="Conformite" value={ratingAccuracy} onChange={setRatingAccuracy} />
            <StarRow label="Proprete" value={ratingCleanliness} onChange={setRatingCleanliness} />
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Un commentaire ? (optionnel)"
            className="mb-4 resize-none text-sm"
          />

          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!allRated}
            loading={createReview.isPending}
            className="w-full rounded-full bg-[#06B6D4] py-2.5 font-semibold text-white hover:bg-[#0891B2] disabled:opacity-50"
          >
            Evaluer
          </Button>
        </form>
      </div>
    </div>
  )
}
