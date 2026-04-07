import { z } from 'zod'
import { eq, and, or, not, gt, lt, gte, lte, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { createTRPCRouter, publicProcedure, protectedProcedure, hostProcedure } from '../trpc'
import { bookings, spots, vehicles, availability } from '@flashpark/db'
import { createNotification } from '../lib/notify'

function generateQrCode(): string {
  // 16 hex chars from a full UUID = ~64 bits of entropy (brute-force resistant)
  const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
  return `FP-${uid}`
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const bookingsRouter = createTRPCRouter({
  // Create a booking (returns clientSecret for Stripe)
  create: protectedProcedure
    .input(
      z.object({
        spotId: z.string().uuid(),
        startTime: z.date(),
        endTime: z.date(),
        vehicleId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { spotId, startTime, endTime, vehicleId } = input

      if (startTime >= endTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "L'heure de début doit être avant l'heure de fin" })
      }

      if (startTime <= new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "L'heure de début doit être dans le futur" })
      }

      // Validate duration
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      if (hours > 24) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La durée maximale de réservation est de 24 heures' })
      }

      // Check spot exists and is active (outside transaction — read-only)
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, spotId), eq(spots.status, 'active')),
      })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place non disponible' })

      // Prevent self-booking
      if (spot.hostId === ctx.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas réserver votre propre place' })
      }

      // Verify vehicle (outside transaction — read-only)
      if (vehicleId) {
        const vehicle = await ctx.db.query.vehicles.findFirst({
          where: and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, ctx.userId)),
        })
        if (!vehicle) throw new TRPCError({ code: 'NOT_FOUND', message: 'Véhicule introuvable' })

        if (spot.maxVehicleHeight && vehicle.height) {
          if (parseFloat(vehicle.height) > parseFloat(spot.maxVehicleHeight)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Votre véhicule (${vehicle.height}m) dépasse la hauteur max de cette place (${spot.maxVehicleHeight}m)`,
            })
          }
        }
      }

      // Calculate pricing
      const pricePerHour = parseFloat(spot.pricePerHour)
      const totalPrice = Math.round(hours * pricePerHour * 100) / 100
      const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
      const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100

      // Instant book: skip pending, confirm immediately and generate QR
      const isInstantBook = spot.instantBook === true
      const initialStatus = isInstantBook ? 'confirmed' : 'pending'
      const qrCode = isInstantBook ? generateQrCode() : null

      // TRANSACTION: conflict check + insert (atomic — prevents race condition)
      const [booking] = await ctx.db.transaction(async (tx) => {
        // Check host blocked this period (strict boundary: touching edges are fine)
        const blockedSlot = await tx.query.availability.findFirst({
          where: and(
            eq(availability.spotId, spotId),
            eq(availability.isAvailable, false),
            or(
              and(gt(availability.startTime, startTime), lt(availability.startTime, endTime)),
              and(gt(availability.endTime, startTime), lt(availability.endTime, endTime)),
              and(lte(availability.startTime, startTime), gte(availability.endTime, endTime))
            )
          ),
        })
        if (blockedSlot) {
          throw new TRPCError({ code: 'CONFLICT', message: "Ce créneau est indisponible (bloqué par l'hôte)" })
        }

        // Check booking conflicts (strict boundary: adjacent bookings are allowed)
        const conflicts = await tx.query.bookings.findFirst({
          where: and(
            eq(bookings.spotId, spotId),
            not(eq(bookings.status, 'cancelled')),
            not(eq(bookings.status, 'refunded')),
            or(
              and(gt(bookings.startTime, startTime), lt(bookings.startTime, endTime)),
              and(gt(bookings.endTime, startTime), lt(bookings.endTime, endTime)),
              and(lte(bookings.startTime, startTime), gte(bookings.endTime, endTime))
            )
          ),
        })
        if (conflicts) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau est déjà réservé' })
        }

        // Insert — if we get here, no conflict exists (atomically guaranteed)
        return tx
          .insert(bookings)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .values({
            driverId: ctx.userId,
            spotId,
            startTime,
            endTime,
            vehicleId: vehicleId ?? null,
            totalPrice: String(totalPrice),
            platformFee: String(platformFee),
            hostPayout: String(hostPayout),
            status: initialStatus,
            qrCode,
          } as any)
          .returning()
      })

      // Notify host of new booking (fire-and-forget — non-critical)
      createNotification(ctx.db, {
        userId: spot.hostId,
        type: 'booking_new',
        title: 'Nouvelle réservation',
        body: isInstantBook
          ? `Réservation confirmée automatiquement pour "${spot.title}"`
          : `Nouvelle demande de réservation pour "${spot.title}"`,
        data: { bookingId: booking.id, spotId },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return { booking, totalPrice, platformFee }
    }),

  // My bookings as driver
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.bookings.findMany({
      where: eq(bookings.driverId, ctx.userId),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    })
  }),

  // Most recent completed booking for current user on a given spot
  myBookingForSpot: protectedProcedure
    .input(z.object({ spotId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.driverId, ctx.userId),
          eq(bookings.spotId, input.spotId),
          eq(bookings.status, 'completed')
        ),
        orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      })
    }),

  // Cancel a booking (with time-based cancellation policy and Stripe refund)
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })
      if (booking.status === 'cancelled' || booking.status === 'refunded') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette réservation est déjà annulée' })
      }
      if (booking.status === 'active' || booking.status === 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Impossible d'annuler une réservation active ou terminée" })
      }

      const now = new Date()
      const hoursUntilStart = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Fetch the spot to determine the cancellation policy
      const cancelSpot = await ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) })
      const policy = cancelSpot?.cancellationPolicy ?? 'flexible'

      // Thresholds (hours) per policy:
      //   flexible:  full refund > 2h before, 50% 0–2h before
      //   moderate:  full refund > 24h before, 50% 2–24h before, no refund < 2h
      //   strict:    full refund > 48h before, 50% 24–48h before, no refund < 24h
      const thresholds: Record<string, { full: number; half: number }> = {
        flexible:  { full: 2,  half: 0  },
        moderate:  { full: 24, half: 2  },
        strict:    { full: 48, half: 24 },
      }
      const { full: fullRefundHours, half: halfRefundHours } = thresholds[policy]!

      let refundAmountCents: number | null = null
      if (booking.stripePaymentIntentId) {
        const totalCents = Math.round(parseFloat(booking.totalPrice) * 100)
        if (booking.status === 'pending') {
          // Pending bookings always get full refund (payment was captured but not yet confirmed)
          refundAmountCents = totalCents
        } else if (hoursUntilStart > fullRefundHours) {
          refundAmountCents = totalCents
        } else if (hoursUntilStart > halfRefundHours) {
          refundAmountCents = Math.round(totalCents * 0.5)
        } else {
          refundAmountCents = 0
        }
      }

      // Issue Stripe refund BEFORE updating status — fail-closed
      const needsRefund = refundAmountCents !== null && refundAmountCents > 0 && booking.stripePaymentIntentId
      if (needsRefund) {
        try {
          await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId!,
            amount: refundAmountCents!,
          })
        } catch (err) {
          // Refund failed — do NOT cancel the booking, surface the error
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: "Le remboursement a échoué. La réservation n'a pas été annulée. Veuillez réessayer ou contacter le support.",
          })
        }
      }

      // Refund succeeded (or not needed) — now cancel the booking
      const finalStatus = needsRefund ? 'refunded' : 'cancelled'
      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: finalStatus, cancelledAt: now, cancelledBy: ctx.userId, updatedAt: now } as any)
        .where(and(
          eq(bookings.id, input.id),
          eq(bookings.driverId, ctx.userId),
          or(eq(bookings.status, 'pending'), eq(bookings.status, 'confirmed'))
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      // Notify host of driver cancellation
      const cancelledSpot = await ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) })
      if (cancelledSpot) {
        createNotification(ctx.db, {
          userId: cancelledSpot.hostId,
          type: 'booking_cancelled',
          title: 'Réservation annulée',
          body: `Le conducteur a annulé sa réservation pour "${cancelledSpot.title}"`,
          data: { bookingId: booking.id, spotId: cancelledSpot.id },
        }).catch((err) => console.warn('[notify] Notification failed:', err))
      }

      const refundedAmount = refundAmountCents !== null ? refundAmountCents / 100 : null
      return { ...updated, refundedAmount }
    }),

  // Host confirms a pending booking
  confirm: hostProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      // Verify the host owns the spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: "Vous n'êtes pas le propriétaire de cette place" })

      if (booking.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Cette réservation n'est pas en attente" })
      }

      const qrCode = generateQrCode()

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: 'confirmed', qrCode, updatedAt: new Date() } as any)
        .where(and(
          eq(bookings.id, input.id),
          eq(bookings.status, 'pending')
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      // Notify driver of confirmation
      createNotification(ctx.db, {
        userId: booking.driverId,
        type: 'booking_confirmed',
        title: 'Réservation confirmée',
        body: `Votre réservation pour "${spot.title}" a été confirmée`,
        data: { bookingId: booking.id, spotId: spot.id, qrCode },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return updated
    }),

  // Host rejects a pending booking
  reject: hostProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      // Verify the host owns the spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: "Vous n'êtes pas le propriétaire de cette place" })

      if (booking.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Cette réservation n'est pas en attente" })
      }

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() } as any)
        .where(and(
          eq(bookings.id, input.id),
          eq(bookings.status, 'pending')
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      // Notify driver of rejection
      createNotification(ctx.db, {
        userId: booking.driverId,
        type: 'booking_rejected',
        title: 'Réservation refusée',
        body: `Votre demande de réservation pour "${spot.title}" a été refusée par l'hôte`,
        data: { bookingId: booking.id, spotId: spot.id },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return updated
    }),

  // Host cancels a confirmed booking (before start time)
  hostCancel: hostProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: "Vous n'êtes pas le propriétaire de cette place" })

      if (booking.status !== 'confirmed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Seules les réservations confirmées peuvent être annulées par l'hôte" })
      }

      if (new Date(booking.startTime) <= new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Impossible d'annuler une réservation déjà commencée" })
      }

      // Full refund since host cancelled — refund BEFORE status change (fail-closed)
      if (booking.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId })
        } catch {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: "Le remboursement a échoué. L'annulation n'a pas été effectuée. Veuillez réessayer.",
          })
        }
      }

      const finalStatus = booking.stripePaymentIntentId ? 'refunded' : 'cancelled'
      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: finalStatus, cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() } as any)
        .where(and(eq(bookings.id, input.id), eq(bookings.status, 'confirmed')))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      // Notify driver
      createNotification(ctx.db, {
        userId: booking.driverId,
        type: 'booking_host_cancelled',
        title: "Réservation annulée par l'hôte",
        body: `L'hôte a annulé votre réservation confirmée pour "${spot.title}". Vous serez remboursé intégralement.`,
        data: { bookingId: booking.id, spotId: spot.id },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return updated
    }),

  // Host: get all bookings for a specific spot
  bySpot: hostProcedure
    .input(z.object({ spotId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify host owns the spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, input.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorise' })

      return ctx.db.query.bookings.findMany({
        where: and(
          eq(bookings.spotId, input.spotId),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded'))
        ),
        orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
      })
    }),

  // Public: check if a time slot is available for a spot
  checkSlot: publicProcedure
    .input(z.object({
      spotId: z.string().uuid(),
      startTime: z.date(),
      endTime: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const { spotId, startTime, endTime } = input

      // Check booking conflicts (strict boundary)
      const conflict = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, spotId),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded')),
          or(
            and(gt(bookings.startTime, startTime), lt(bookings.startTime, endTime)),
            and(gt(bookings.endTime, startTime), lt(bookings.endTime, endTime)),
            and(lte(bookings.startTime, startTime), gte(bookings.endTime, endTime))
          )
        ),
      })

      // Check blocked availability (strict boundary)
      const blocked = await ctx.db.query.availability.findFirst({
        where: and(
          eq(availability.spotId, spotId),
          eq(availability.isAvailable, false),
          or(
            and(gt(availability.startTime, startTime), lt(availability.startTime, endTime)),
            and(gt(availability.endTime, startTime), lt(availability.endTime, endTime)),
            and(lte(availability.startTime, startTime), gte(availability.endTime, endTime))
          )
        ),
      })

      return {
        available: !conflict && !blocked,
        reason: conflict ? 'already_booked' : blocked ? 'host_blocked' : null,
      }
    }),

  // Driver checks in at the parking spot
  checkIn: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      if (booking.status !== 'confirmed' && booking.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez faire un check-in que sur une réservation confirmée ou active' })
      }

      const now = new Date()
      const startTime = new Date(booking.startTime)
      const endTime = new Date(booking.endTime)
      const minutesBeforeStart = (startTime.getTime() - now.getTime()) / (1000 * 60)

      if (minutesBeforeStart > 15) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le check-in est disponible 15 minutes avant le début de la réservation' })
      }

      if (now > endTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La réservation est terminée, impossible de faire un check-in' })
      }

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ checkedInAt: now, status: 'active', updatedAt: now } as any)
        .where(and(
          eq(bookings.id, input.bookingId),
          eq(bookings.driverId, ctx.userId),
          or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'active'))
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      const spot = await ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) })
      if (spot) {
        createNotification(ctx.db, {
          userId: spot.hostId,
          type: 'booking_checked_in',
          title: 'Conducteur arrivé',
          body: `Le conducteur a effectué son check-in pour "${spot.title}"`,
          data: { bookingId: booking.id, spotId: spot.id },
        }).catch((err) => console.warn('[notify] Notification failed:', err))
      }

      return updated
    }),

  // Driver checks out of the parking spot
  checkOut: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      if (booking.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez faire un check-out que sur une réservation active' })
      }

      if (!booking.checkedInAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous devez effectuer un check-in avant de pouvoir faire un check-out' })
      }

      const now = new Date()

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ checkedOutAt: now, status: 'completed', updatedAt: now } as any)
        .where(and(
          eq(bookings.id, input.bookingId),
          eq(bookings.driverId, ctx.userId),
          eq(bookings.status, 'active')
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      const spot = await ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) })
      if (spot) {
        createNotification(ctx.db, {
          userId: spot.hostId,
          type: 'booking_checked_out',
          title: 'Conducteur parti',
          body: `Le conducteur a effectué son check-out pour "${spot.title}"`,
          data: { bookingId: booking.id, spotId: spot.id },
        }).catch((err) => console.warn('[notify] Notification failed:', err))
      }

      return updated
    }),

  // Driver extends an active booking
  extend: protectedProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      newEndTime: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { bookingId, newEndTime } = input

      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      if (booking.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "L'extension n'est possible que sur une réservation active" })
      }

      const currentEndTime = new Date(booking.endTime)

      if (newEndTime <= currentEndTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "La nouvelle heure de fin doit être après l'heure de fin actuelle" })
      }

      // Use original_end_time if this booking was already extended, otherwise current end_time
      const baseEndTime = booking.originalEndTime ? new Date(booking.originalEndTime) : currentEndTime
      const maxEndTime = new Date(baseEndTime.getTime() + 8 * 60 * 60 * 1000)

      if (newEndTime > maxEndTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "L'extension ne peut pas dépasser 8 heures au-delà de l'heure de fin originale" })
      }

      // Check for conflicts with other bookings in the extended period
      const conflict = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, booking.spotId),
          not(eq(bookings.id, bookingId)),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded')),
          or(
            and(gt(bookings.startTime, currentEndTime), lt(bookings.startTime, newEndTime)),
            and(gt(bookings.endTime, currentEndTime), lt(bookings.endTime, newEndTime)),
            and(lte(bookings.startTime, currentEndTime), gte(bookings.endTime, newEndTime))
          )
        ),
      })
      if (conflict) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau est déjà réservé par un autre conducteur' })
      }

      const spot = await ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable' })

      const additionalHours = (newEndTime.getTime() - currentEndTime.getTime()) / (1000 * 60 * 60)
      const additionalPrice = Math.round(additionalHours * parseFloat(spot.pricePerHour) * 100) / 100
      const additionalFee = Math.round(additionalPrice * 0.2 * 100) / 100
      const additionalPayout = Math.round((additionalPrice - additionalFee) * 100) / 100

      const newTotalPrice = Math.round((parseFloat(booking.totalPrice) + additionalPrice) * 100) / 100
      const newPlatformFee = Math.round((parseFloat(booking.platformFee) + additionalFee) * 100) / 100
      const newHostPayout = Math.round((parseFloat(booking.hostPayout) + additionalPayout) * 100) / 100

      // Preserve the original end time (before any extension) on first extension
      const originalEndTime = booking.originalEndTime ?? currentEndTime

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({
          endTime: newEndTime,
          originalEndTime,
          extensionCount: (booking.extensionCount ?? 0) + 1,
          totalPrice: String(newTotalPrice),
          platformFee: String(newPlatformFee),
          hostPayout: String(newHostPayout),
          updatedAt: new Date(),
        } as any)
        .where(and(
          eq(bookings.id, bookingId),
          eq(bookings.driverId, ctx.userId),
          eq(bookings.status, 'active')
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      createNotification(ctx.db, {
        userId: spot.hostId,
        type: 'booking_extended',
        title: 'Réservation prolongée',
        body: `Le conducteur a prolongé sa réservation pour "${spot.title}" jusqu'à ${newEndTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        data: { bookingId: booking.id, spotId: spot.id },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return { ...updated, additionalCost: { price: additionalPrice, fee: additionalFee, payout: additionalPayout } }
    }),

  // Host marks a driver as no-show
  markNoShow: hostProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: "Vous n'êtes pas le propriétaire de cette place" })

      if (booking.status !== 'confirmed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Seules les réservations confirmées peuvent être marquées comme no-show" })
      }

      const now = new Date()
      const minutesSinceStart = (now.getTime() - new Date(booking.startTime).getTime()) / (1000 * 60)

      if (minutesSinceStart < 30) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Vous pouvez marquer un no-show uniquement 30 minutes après l'heure de début" })
      }

      if (booking.checkedInAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Le conducteur a déjà effectué son check-in' })
      }

      const [updated] = await ctx.db
        .update(bookings)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ noShow: true, status: 'completed', updatedAt: now } as any)
        .where(and(
          eq(bookings.id, input.bookingId),
          eq(bookings.status, 'confirmed')
        ))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Le statut de la réservation a changé entre-temps' })
      }

      createNotification(ctx.db, {
        userId: booking.driverId,
        type: 'booking_no_show',
        title: 'No-show enregistré',
        body: `Vous avez été marqué comme absent pour votre réservation chez "${spot.title}". Aucun remboursement ne sera effectué.`,
        data: { bookingId: booking.id, spotId: spot.id },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return updated
    }),

  // Verify a booking by QR code or booking ID (for hosts)
  verifyCode: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { code } = input

      // Exact match on qr_code or booking ID only (no partial matching)
      const booking = await ctx.db.query.bookings.findFirst({
        where: or(eq(bookings.qrCode, code), eq(bookings.id, code)),
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation introuvable' })
      }

      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      const now = new Date()
      const start = new Date(booking.startTime)
      const end = new Date(booking.endTime)

      let isValid = false
      let message = ''

      if (booking.status === 'cancelled' || booking.status === 'refunded') {
        message = 'Cette reservation a ete annulee'
      } else if (booking.status === 'completed') {
        message = 'Cette reservation est terminee'
      } else if (booking.status === 'pending') {
        message = 'En attente de confirmation par l\'hote'
      } else if (now < start) {
        isValid = true
        message = `Valide — debut prevu le ${start.toLocaleDateString('fr-FR')} a ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      } else if (now >= start && now <= end) {
        isValid = true
        message = 'Reservation active — le conducteur peut acceder a la place'
      } else {
        message = 'Le creneau est depasse'
      }

      return {
        isValid,
        message,
        spotTitle: spot?.title ?? 'Place inconnue',
        booking: {
          id: booking.id,
          status: booking.status,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          qrCode: booking.qrCode,
        },
      }
    }),
})
