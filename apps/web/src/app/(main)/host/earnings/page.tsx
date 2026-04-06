import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq, inArray } from 'drizzle-orm'
import EarningsContent from './earnings-content'

export const dynamic = 'force-dynamic'

function getMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(
    new Date(year, month - 1)
  )
}

export default async function EarningsPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/host/earnings')

  const dbUser = await db.query.users.findFirst({ where: eq(users.supabaseId, user.id) })
  if (!dbUser) redirect('/login?redirect=/host/earnings')

  const isHost = dbUser.role === 'host' || dbUser.role === 'both' || dbUser.role === 'admin'
  if (!isHost) redirect('/host/onboarding')

  const hostSpots = await db.query.spots.findMany({
    where: eq(spots.hostId, dbUser.id),
  })

  const hostSpotIds = hostSpots.map((s) => s.id)
  const allBookings: Array<{
    id: string
    spotId: string
    startTime: Date
    totalPrice: string
    platformFee: string
    hostPayout: string
    status: string
  }> = hostSpotIds.length > 0
    ? await db.select().from(bookings).where(inArray(bookings.spotId, hostSpotIds))
    : []

  const paidBookings = allBookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'refunded' && b.status !== 'pending'
  )

  const totalEarnings = paidBookings.reduce((sum, b) => sum + Number(b.hostPayout), 0)
  const totalGross = paidBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0)
  const totalFees = paidBookings.reduce((sum, b) => sum + Number(b.platformFee), 0)
  const totalBookings = paidBookings.length

  const monthlyMap: Record<string, { gross: number; payout: number; count: number }> = {}
  for (const b of paidBookings) {
    const d = new Date(b.startTime)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyMap[key]) monthlyMap[key] = { gross: 0, payout: 0, count: 0 }
    monthlyMap[key].gross += Number(b.totalPrice)
    monthlyMap[key].payout += Number(b.hostPayout)
    monthlyMap[key].count++
  }

  const months: { key: string; label: string; gross: number; payout: number; count: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      label: getMonthLabel(d.getFullYear(), d.getMonth() + 1),
      ...(monthlyMap[key] ?? { gross: 0, payout: 0, count: 0 }),
    })
  }

  const maxPayout = Math.max(...months.map((m) => m.payout), 1)

  const spotEarnings = hostSpots.map((s) => {
    const sb = paidBookings.filter((b) => b.spotId === s.id)
    return {
      id: s.id,
      title: s.title,
      payout: sb.reduce((sum, b) => sum + Number(b.hostPayout), 0),
      count: sb.length,
    }
  }).sort((a, b) => b.payout - a.payout)

  return (
    <EarningsContent
      totalEarnings={totalEarnings}
      totalGross={totalGross}
      totalFees={totalFees}
      totalBookings={totalBookings}
      months={months}
      maxPayout={maxPayout}
      spotEarnings={spotEarnings}
    />
  )
}
