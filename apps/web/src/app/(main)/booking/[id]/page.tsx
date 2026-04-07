import { notFound, redirect } from 'next/navigation'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { BookingContent } from './booking-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(d))
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

export default async function BookingConfirmationPage({ params }: Props) {
  const supabase = createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, authUser.id),
  })

  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, params.id),
  })

  if (!booking) notFound()

  const spot = await db.query.spots.findFirst({
    where: eq(spots.id, booking.spotId),
  })

  if (!spot) notFound()

  // Authorization: only the driver or the host of the spot may view this booking
  const isDriver = dbUser?.id === booking.driverId
  const isHost = dbUser?.id === spot.hostId
  if (!isDriver && !isHost) notFound()

  const startDate = new Date(booking.startTime)
  const endDate = new Date(booking.endTime)
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'text-[#F5A623] bg-amber-50' },
    confirmed: { label: 'Confirmée', color: 'text-[#0540FF] bg-blue-50' },
    active: { label: 'Active', color: 'text-[#10B981] bg-emerald-50' },
    completed: { label: 'Terminée', color: 'text-gray-600 bg-gray-50' },
    cancelled: { label: 'Annulée', color: 'text-red-600 bg-red-50' },
    refunded: { label: 'Remboursée', color: 'text-gray-600 bg-gray-50' },
  }

  const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, color: 'text-gray-600 bg-gray-50' }

  return (
    <BookingContent
      booking={{
        id: booking.id,
        spotId: booking.spotId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        platformFee: booking.platformFee,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        checkedInAt: booking.checkedInAt ? new Date(booking.checkedInAt).toISOString() : null,
        originalEndTime: booking.originalEndTime ? new Date(booking.originalEndTime).toISOString() : null,
      }}
      spot={{
        id: spot.id,
        title: spot.title,
        address: spot.address,
        pricePerHour: spot.pricePerHour,
        hasSmartGate: spot.hasSmartGate,
        latitude: spot.latitude,
        longitude: spot.longitude,
        parkingInstructions: spot.parkingInstructions,
      }}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
      hours={hours}
      statusInfo={statusInfo}
      formattedStartDate={formatDate(startDate)}
      formattedEndDate={formatDate(endDate)}
      formattedStartTime={formatTime(startDate)}
      formattedEndTime={formatTime(endDate)}
      qrCode={booking.qrCode}
      currentUserId={dbUser?.id ?? ''}
    />
  )
}
