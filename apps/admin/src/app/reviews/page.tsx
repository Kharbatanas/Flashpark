import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'
import { ReviewActions } from './review-actions'

export const dynamic = 'force-dynamic'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? 'text-amber-400' : 'text-gray-200'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

export default async function ReviewsAdminPage() {
  const supabase = createSupabaseServerClient()

  // Fetch reviews with count
  const { data: reviews, count: totalCount } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer_id, spot_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  const allReviews = reviews ?? []
  const reviewCount = totalCount ?? 0

  // Calculate average rating from all reviews
  let averageRating = 0
  if (reviewCount > 0) {
    // Fetch all ratings for average calculation
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
    if (allRatings && allRatings.length > 0) {
      averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    }
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }))
  const maxDistribution = Math.max(...distribution.map((d) => d.count), 1)

  // Fetch reviewer names and spot titles
  const reviewerIds = Array.from(new Set(allReviews.map((r) => r.reviewer_id).filter(Boolean)))
  const spotIds = Array.from(new Set(allReviews.map((r) => r.spot_id).filter(Boolean)))

  const [{ data: reviewers }, { data: spots }] = await Promise.all([
    reviewerIds.length > 0
      ? supabase.from('users').select('id, full_name').in('id', reviewerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    spotIds.length > 0
      ? supabase.from('spots').select('id, title').in('id', spotIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])

  const reviewerMap = new Map((reviewers ?? []).map((u) => [u.id, u.full_name]))
  const spotMap = new Map((spots ?? []).map((s) => [s.id, s.title]))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Avis</h1>
            <p className="text-sm text-gray-400">Avis et notes des utilisateurs</p>
          </div>
        </header>
        <div className="p-8">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-medium text-gray-500">Note Moyenne</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-[#1A1A2E]">
                  {reviewCount > 0 ? averageRating.toFixed(1) : '—'}
                </p>
                <span className="text-amber-400 text-xl">★</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">sur 5</p>
            </div>
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-medium text-gray-500">Total Avis</p>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">
                {reviewCount.toLocaleString('fr-FR')}
              </p>
              <p className="mt-1 text-xs text-gray-400">avis publies</p>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-gray-500 mb-3">Repartition</p>
              <div className="space-y-1.5">
                {distribution.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                    <span className="text-xs text-amber-400">★</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(count / maxDistribution) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews list */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-[#1A1A2E]">Avis recents</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {allReviews.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-400">Aucun avis</p>
              ) : (
                allReviews.map((review) => (
                  <div key={review.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 shrink-0">
                          {(reviewerMap.get(review.reviewer_id) ?? '?')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#1A1A2E]">
                              {reviewerMap.get(review.reviewer_id) ?? 'Anonyme'}
                            </span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs text-gray-500">
                              {spotMap.get(review.spot_id) ?? 'Place inconnue'}
                            </span>
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} />
                          </div>
                          {review.comment && (
                            <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(review.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <ReviewActions reviewId={review.id} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
