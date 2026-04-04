import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'
import HostContent from './host-content'

export const dynamic = 'force-dynamic'

export default async function HostDashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login?redirect=/host')

  // Look up real DB user by supabase_id
  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, authUser.id),
  })

  if (!dbUser) redirect('/login?redirect=/host')

  // If not a host yet, show the "become host" wall
  const isHost = dbUser.role === 'host' || dbUser.role === 'both' || dbUser.role === 'admin'
  if (!isHost) {
    return <HostContent isHost={false} stats={[]} recentBookings={[]} spotMap={{}} />
  }

  // Fetch host's spots using the correct DB id
  const hostSpots = await db.query.spots.findMany({
    where: eq(spots.hostId, dbUser.id),
  })

  const hostSpotIds = hostSpots.map((s) => s.id)
  const activeListings = hostSpots.filter((s) => s.status === 'active').length

  let recentBookings: Array<{
    id: string; spotId: string; startTime: Date; endTime: Date
    status: string; totalPrice: string; platformFee: string; hostPayout: string; createdAt: Date
  }> = []
  let totalEarnings = 0
  let pendingCount = 0
  let totalCount = 0

  if (hostSpotIds.length > 0) {
    for (const spotId of hostSpotIds) {
      const spotBookings = await db.query.bookings.findMany({
        where: eq(bookings.spotId, spotId),
        orderBy: (b, { desc }) => [desc(b.createdAt)],
      })
      recentBookings.push(...spotBookings)
      totalCount += spotBookings.length
      pendingCount += spotBookings.filter((b) => b.status === 'pending').length
      totalEarnings += spotBookings
        .filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
        .reduce((acc, b) => acc + Number(b.hostPayout), 0)
    }
    recentBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    recentBookings = recentBookings.slice(0, 10)
  }

  const spotMap: Record<string, string> = {}
  for (const s of hostSpots) {
    spotMap[s.id] = s.title
  }

  const stats = [
    {
      label: 'Revenus totaux',
      value: `${totalEarnings.toFixed(2).replace('.', ',')} \u20AC`,
      icon: 'earnings',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Annonces actives',
      value: activeListings,
      icon: 'listings',
      bg: 'bg-blue-50',
    },
    {
      label: 'Demandes en attente',
      value: pendingCount,
      icon: 'pending',
      bg: 'bg-amber-50',
    },
    {
      label: 'R\u00E9servations totales',
      value: totalCount,
      icon: 'total',
      bg: 'bg-gray-50',
    },
  ]

  // Serialize bookings for client
  const serializedBookings = recentBookings.map((b) => ({
    id: b.id,
    spotId: b.spotId,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    hostPayout: b.hostPayout,
  }))

  return (
    <HostContent
      isHost={true}
      stats={stats}
      recentBookings={serializedBookings}
      spotMap={spotMap}
    />
  )
}
