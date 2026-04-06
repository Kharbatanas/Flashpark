'use client'

import { useState } from 'react'
import { api } from '../lib/trpc/client'
import { motion, AnimatePresence, StaggerContainer, StaggerItem } from './motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'

interface ReviewsSectionProps {
  spotId: string
  bookingId?: string
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`h-5 w-5 transition-colors ${active >= s ? 'fill-[#06B6D4] text-[#06B6D4]' : 'fill-none text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewForm({ bookingId, spotId, onDone }: { bookingId: string; spotId: string; onDone: () => void }) {
  const [ratingAccess, setRatingAccess] = useState(0)
  const [ratingAccuracy, setRatingAccuracy] = useState(0)
  const [ratingCleanliness, setRatingCleanliness] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const createReview = api.reviews.create.useMutation()
  const allRated = ratingAccess > 0 && ratingAccuracy > 0 && ratingCleanliness > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allRated) { setError('Veuillez noter les 3 criteres'); return }
    setError(null)
    try {
      await createReview.mutateAsync({
        bookingId,
        ratingAccess,
        ratingAccuracy,
        ratingCleanliness,
        comment: comment || undefined,
      })
      setSubmitted(true)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (submitted) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
        >
          Merci pour votre avis !
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E0F2FE] bg-[#F0F9FF] p-5">
        <h3 className="mb-3 font-semibold tracking-tight text-[#0A0A0A]">Laissez un avis</h3>
        <div className="mb-4 divide-y divide-[#E0F2FE]">
          <StarRow label="Acces" value={ratingAccess} onChange={setRatingAccess} />
          <StarRow label="Conformite" value={ratingAccuracy} onChange={setRatingAccuracy} />
          <StarRow label="Proprete" value={ratingCleanliness} onChange={setRatingCleanliness} />
        </div>
        <div className="mb-4">
          <Label htmlFor="review-comment" className="mb-1.5 block">Commentaire (optionnel)</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Decrivez votre experience..."
            className="resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
        </div>
        {error && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" disabled={!allRated} loading={createReview.isPending} className="bg-[#06B6D4] text-white hover:bg-[#0891B2]">
          Publier l&apos;avis
        </Button>
      </form>
    </motion.div>
  )
}

function RatingBreakdown({ access, accuracy, cleanliness }: { access: number; accuracy: number; cleanliness: number }) {
  const items = [
    { label: 'Acces', value: access },
    { label: 'Conformite', value: accuracy },
    { label: 'Proprete', value: cleanliness },
  ]
  return (
    <div className="mt-2 flex items-center gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-1 text-xs text-gray-400">
          <span>{label}</span>
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-[#06B6D4] text-[#06B6D4]" />
            <span className="font-medium text-gray-600">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReviewsSection({ spotId, bookingId }: ReviewsSectionProps) {
  const { data: reviewsList, refetch } = api.reviews.bySpot.useQuery({ spotId })
  const { data: canReviewData } = api.reviews.canReview.useQuery(
    { bookingId: bookingId! },
    { enabled: !!bookingId }
  )

  const canReview = !!bookingId && !!canReviewData?.canReview

  if (!reviewsList?.length && !canReview) return null

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-[#0A0A0A]">
        Avis{reviewsList?.length ? ` (${reviewsList.length})` : ''}
      </h2>

      {canReview && (
        <div className="mb-6">
          <ReviewForm bookingId={bookingId!} spotId={spotId} onDone={() => refetch()} />
        </div>
      )}

      <StaggerContainer className="space-y-4">
        {reviewsList?.map((review) => (
          <StaggerItem key={review.id}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card className="border-[#E0F2FE] p-5">
                <CardContent className="p-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#06B6D4]/10 text-xs font-bold text-[#06B6D4]">
                          {review.reviewerName[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-[#0A0A0A]">{review.reviewerName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#06B6D4] text-[#06B6D4]" />
                      <span className="text-sm font-semibold text-gray-900">{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <RatingBreakdown
                    access={review.ratingAccess}
                    accuracy={review.ratingAccuracy}
                    cleanliness={review.ratingCleanliness}
                  />
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(review.createdAt))}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  )
}
