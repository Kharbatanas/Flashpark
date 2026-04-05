import { Suspense } from 'react'
import { SpotMap } from '../../../components/map/spot-map'
import { serverApi } from '../../../lib/trpc/server'

export const dynamic = 'force-dynamic'

async function MapContent() {
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

  return <SpotMap initialSpots={initialSpots} />
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-72px)] items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0540FF]" />
          <p className="text-sm text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  )
}
