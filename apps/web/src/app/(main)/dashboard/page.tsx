import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq, inArray } from 'drizzle-orm'
import DashboardContent from './dashboard-content'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  const dbUser = await db.query.users.findFirst({ where: eq(users.supabaseId, user.id) })
  if (!dbUser) redirect('/login?redirect=/dashboard')

  // Fetch bookings with spot info using real DB id
  const userBookings = await db.query.bookings.findMany({
    where: eq(bookings.driverId, dbUser.id),
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  })

  // Fetch spot titles for each booking — single batch query
  const spotIds = Array.from(new Set(userBookings.map((b) => b.spotId)))
  const spotMap: Record<string, { title: string; address: string }> = {}
  if (spotIds.length > 0) {
    const spotsList = await db.query.spots.findMany({ where: inArray(spots.id, spotIds) })
    for (const s of spotsList) {
      spotMap[s.id] = { title: s.title, address: s.address }
    }
  }

  // Serialize dates for the client component
  const serializedBookings = userBookings.map((b) => ({
    id: b.id,
    spotId: b.spotId,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    totalPrice: b.totalPrice,
  }))

  return <DashboardContent userBookings={serializedBookings} spotMap={spotMap} />
}
