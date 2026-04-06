'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Calendar, Star } from 'lucide-react'

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

export default function ReviewPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter()
  const [ratingAccess, setRatingAccess] = useState(0)
  const [ratingAccuracy, setRatingAccuracy] = useState(0)
  const [ratingCleanliness, setRatingCleanliness] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { data: pending } = api.reviews.pendingReview.useQuery()
  const createReview = api.reviews.create.useMutation()

  const spotTitle = pending?.bookingId === params.bookingId ? pending.spotTitle : 'Place de parking'
  const spotAddress = pending?.bookingId === params.bookingId ? `${pending.spotAddress}, ${pending.spotCity}` : ''
  const startTime = pending?.bookingId === params.bookingId ? pending.startTime : null
  const endTime = pending?.bookingId === params.bookingId ? pending.endTime : null

  const allRated = ratingAccess > 0 && ratingAccuracy > 0 && ratingCleanliness > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allRated) { setError('Veuillez noter les 3 criteres'); return }
    setError(null)
    try {
      await createReview.mutateAsync({
        bookingId: params.bookingId,
        ratingAccess,
        ratingAccuracy,
        ratingCleanliness,
        comment: comment || undefined,
      })
      setSubmitted(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Star className="h-8 w-8 fill-emerald-500 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Merci pour votre avis !</h1>
          <p className="mt-2 text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Evaluez votre stationnement</h1>

      {/* Spot recap */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="font-semibold text-gray-900">{spotTitle}</p>
        {spotAddress && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{spotAddress}</span>
          </div>
        )}
        {startTime && endTime && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{fmt(startTime)} — {fmt(endTime)}</span>
          </div>
        )}
      </div>

      {/* Rating form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4">
          <StarRow label="Acces" value={ratingAccess} onChange={setRatingAccess} />
          <StarRow label="Conformite" value={ratingAccuracy} onChange={setRatingAccuracy} />
          <StarRow label="Proprete" value={ratingCleanliness} onChange={setRatingCleanliness} />
        </div>

        <div className="mb-6">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Decrivez votre experience (optionnel)..."
            className="resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!allRated}
          loading={createReview.isPending}
          className="w-full rounded-full bg-[#06B6D4] py-3 text-base font-semibold text-white hover:bg-[#0891B2] disabled:opacity-50"
        >
          Evaluer
        </Button>
      </form>
    </div>
  )
}
