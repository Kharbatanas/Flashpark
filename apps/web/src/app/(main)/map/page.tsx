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
      lat: 43.7102,
      lng: 7.262,
      radiusKm: 20,
    })
  } catch (err) {
    console.error('Failed to fetch initial spots:', err)
  }

  return <SpotMap initialSpots={initialSpots} />
}
