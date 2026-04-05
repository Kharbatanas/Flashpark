import { Suspense } from 'react'
import { SpotMap } from '../../../components/map/spot-map'
import { serverApi } from '../../../lib/trpc/server'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  let initialSpots: Array<{
    id: string
    title: string
    address: string
    latitude: string
    longitude: string
    pricePerHour: string
    type: string
    photos: string[]
    rating: string | null
    reviewCount: number
  }> = []

  try {
    const caller = await serverApi
    initialSpots = await caller.spots.nearby({
      lat: 46.603354,
      lng: 1.888334,
      radiusKm: 1000,
    })
  } catch (err) {
    console.error('Failed to fetch initial spots:', err)
  }

  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0540FF] border-t-transparent" />
      </div>
    }>
      <SpotMap initialSpots={initialSpots} />
    </Suspense>
  )
}
