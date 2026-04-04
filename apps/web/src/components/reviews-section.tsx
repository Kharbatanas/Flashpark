'use client'

import { useState } from 'react'
import { api } from '../lib/trpc/client'
import { motion, AnimatePresence, StaggerContainer, StaggerItem } from './motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ReviewsSectionProps {
  spotId: string
  /** bookingId to check if the current user can submit a review */
  bookingId?: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
        >
          <svg
            className={`h-7 w-7 transition-colors ${active >= s ? 'text-[#F5A623] fill-current' : 'text-gray-200 fill-current'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </motion.button>
      ))}
    </div>
  )
}

function ReviewForm({ bookingId, spotId, onDone }: { bookingId: string; spotId: string; onDone: () => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const createReview = api.reviews.create.useMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Veuillez sélectionner une note'); return }
    setError(null)
    try {
      await createReview.mutateAsync({ bookingId, rating, comment: comment || undefined })
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
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
        >
          ✓ Merci pour votre avis !
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#0540FF]/20 bg-blue-50/50 p-5">
        <h3 className="mb-4 font-semibold text-[#1A1A2E]">Laissez un avis</h3>
        <div className="mb-4">
          <Label className="mb-2 block text-sm text-gray-600">Votre note</Label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div className="mb-4">
          <Label htmlFor="review-comment" className="mb-1.5 block">Commentaire (optionnel)</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Décrivez votre expérience..."
            className="resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
        </div>
        {error && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" loading={createReview.isPending}>
          Publier l&apos;avis
        </Button>
      </form>
    </motion.div>
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
      <h2 className="mb-4 text-lg font-semibold text-[#1A1A2E]">
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
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5">
                <CardContent className="p-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#0540FF]/10 text-xs font-bold text-[#0540FF]">
                          {review.reviewerName[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-[#1A1A2E]">{review.reviewerName}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={s}
                          className={`h-3.5 w-3.5 fill-current ${review.rating >= s ? 'text-[#F5A623]' : 'text-gray-200'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>
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
