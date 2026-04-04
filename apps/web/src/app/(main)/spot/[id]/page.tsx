import { notFound } from 'next/navigation'
import { serverApi } from '../../../../lib/trpc/server'
import { SpotContent } from './spot-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function SpotPage({ params }: Props) {
  let spot: {
    id: string
    title: string
    description: string | null
    address: string
    city: string
    latitude: string
    longitude: string
    pricePerHour: string
    pricePerDay: string | null
    type: string
    status: string
    hasSmartGate: boolean
    photos: string[]
    amenities: string[]
    instantBook: boolean
    rating: string | null
    reviewCount: number
    maxVehicleHeight: string | null
    hostId: string
  } | null = null

  try {
    const caller = await serverApi
    spot = await caller.spots.byId({ id: params.id })
  } catch {
    notFound()
  }

  if (!spot) notFound()

  return <SpotContent spot={spot} />
}
