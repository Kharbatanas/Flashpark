import { z } from 'zod'
import { eq, and, count } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { createTRPCRouter, protectedProcedure, hostProcedure } from '../trpc'
import { disputes, hostStrikes, bookings, spots, users } from '@flashpark/db'
import { createNotification } from '../lib/notify'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const DISPUTE_TYPE_VALUES = [
  'spot_occupied',
  'spot_not_matching',
  'access_issue',
  'safety_concern',
  'other',
] as const

const RESOLUTION_STATUS_VALUES = [
  'resolved_refunded',
  'resolved_rejected',
  'resolved_compensation',
] as const

const ALLOWED_BOOKING_STATUSES_FOR_DISPUTE = ['active', 'confirmed', 'completed'] as const

export const disputesRouter = createTRPCRouter({
  // Driver files a dispute against a booking
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        type: z.enum(DISPUTE_TYPE_VALUES),
        description: z.string().min(10).max(1000),
        photos: z
          .array(z.string().url().startsWith('https://'))
          .max(5)
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { bookingId, type, description, photos } = input

      // Validate booking exists and belongs to the reporter as driver
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, bookingId), eq(bookings.driverId, ctx.userId)),
      })

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Réservation introuvable ou vous n\'êtes pas le conducteur',
        })
      }

      // Validate booking status allows a dispute
      const allowedStatuses: string[] = [...ALLOWED_BOOKING_STATUSES_FOR_DISPUTE]
      if (!allowedStatuses.includes(booking.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Un litige ne peut être ouvert que pour une réservation active, confirmée ou terminée',
        })
      }

      // Validate no open dispute already exists for this booking
      const existingDispute = await ctx.db.query.disputes.findFirst({
        where: and(
          eq(disputes.bookingId, bookingId),
          eq(disputes.reporterId, ctx.userId)
        ),
      })

      if (existingDispute) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Un litige est déjà en cours pour cette réservation',
        })
      }

      // Fetch the spot to identify the host (reported user)
      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      const [dispute] = await ctx.db
        .insert(disputes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({
          bookingId,
          reporterId: ctx.userId,
          reportedUserId: spot?.hostId ?? null,
          type,
          status: 'open',
          description,
          photos,
        } as any)
        .returning()

      // Notify the host that a dispute was filed
      if (spot) {
        createNotification(ctx.db, {
          userId: spot.hostId,
          type: 'dispute_filed',
          title: 'Nouveau litige ouvert',
          body: `Un conducteur a ouvert un litige pour votre place "${spot.title}"`,
          data: { disputeId: dispute.id, bookingId, spotId: spot.id },
        }).catch((err) => console.warn('[notify] Notification failed:', err))
      }

      // Notify admins about the new dispute
      const adminUsers = await ctx.db.query.users.findMany({
        where: eq(users.role, 'admin'),
      })

      for (const admin of adminUsers) {
        createNotification(ctx.db, {
          userId: admin.id,
          type: 'dispute_new_admin',
          title: 'Nouveau litige à traiter',
          body: `Un litige de type "${type}" a été ouvert pour la réservation ${bookingId}`,
          data: { disputeId: dispute.id, bookingId },
        }).catch((err) => console.warn('[notify] Admin notification failed:', err))
      }

      return dispute
    }),

  // Driver: list all disputes they filed
  myDisputes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.disputes.findMany({
      where: eq(disputes.reporterId, ctx.userId),
      orderBy: (disputes, { desc }) => [desc(disputes.createdAt)],
    })
  }),

  // Driver or host: get dispute for a specific booking
  byBooking: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify the user has access (is the driver or the host)
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })
      }

      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      const isDriver = booking.driverId === ctx.userId
      const isHost = spot?.hostId === ctx.userId

      if (!isDriver && !isHost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Accès non autorisé à ce litige',
        })
      }

      return ctx.db.query.disputes.findFirst({
        where: and(
          eq(disputes.bookingId, input.bookingId),
          eq(disputes.reporterId, booking.driverId)
        ),
      })
    }),

  // Admin: resolve a dispute
  resolve: protectedProcedure
    .input(
      z.object({
        disputeId: z.string().uuid(),
        resolution: z.string().min(1).max(2000),
        status: z.enum(RESOLUTION_STATUS_VALUES),
        refundAmount: z.number().min(0).optional(),
        addStrike: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { disputeId, resolution, status, refundAmount, addStrike } = input

      // Admin-only check
      const currentUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      })

      if (!currentUser || currentUser.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' })
      }

      // Fetch the dispute
      const dispute = await ctx.db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
      })

      if (!dispute) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Litige introuvable' })
      }

      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce litige est déjà résolu',
        })
      }

      // Fetch the booking for refund and strike logic
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, dispute.bookingId),
      })

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation associée introuvable' })
      }

      // Issue Stripe refund before updating dispute (fail-closed)
      let refundedCents: number | null = null
      if (
        status === 'resolved_refunded' &&
        refundAmount !== undefined &&
        refundAmount > 0 &&
        booking.stripePaymentIntentId
      ) {
        const amountCents = Math.round(refundAmount * 100)
        try {
          await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId,
            amount: amountCents,
          })
          refundedCents = amountCents
        } catch {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Le remboursement Stripe a échoué. Le litige n\'a pas été mis à jour.',
          })
        }
      }

      const now = new Date()

      // Update the dispute
      const [updatedDispute] = await ctx.db
        .update(disputes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({
          status,
          resolution,
          adminNotes: `Résolu par ${currentUser.email} le ${now.toISOString()}`,
          refundAmount: refundedCents !== null ? String(refundedCents / 100) : null,
          resolvedAt: now,
          updatedAt: now,
        } as any)
        .where(eq(disputes.id, disputeId))
        .returning()

      // Mark booking as refunded if full refund matches total price
      if (refundedCents !== null) {
        const totalCents = Math.round(parseFloat(booking.totalPrice) * 100)
        if (refundedCents >= totalCents) {
          await ctx.db
            .update(bookings)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set({ status: 'refunded', updatedAt: now } as any)
            .where(eq(bookings.id, booking.id))
        }
      }

      // Add host strike if requested
      if (addStrike) {
        const spot = await ctx.db.query.spots.findFirst({
          where: eq(spots.id, booking.spotId),
        })

        if (spot) {
          const hostId = spot.hostId

          // Count existing strikes
          const [strikeCount] = await ctx.db
            .select({ count: count() })
            .from(hostStrikes)
            .where(eq(hostStrikes.hostId, hostId))

          const nextStrikeNumber = (strikeCount?.count ?? 0) + 1

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await ctx.db.insert(hostStrikes).values({
            hostId,
            disputeId,
            reason: resolution,
            strikeNumber: nextStrikeNumber,
          } as any)

          // If 3 or more strikes: deactivate all host spots
          if (nextStrikeNumber >= 3) {
            await ctx.db
              .update(spots)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .set({ status: 'inactive', updatedAt: now } as any)
              .where(eq(spots.hostId, hostId))
          }

          // Notify host about the strike
          createNotification(ctx.db, {
            userId: hostId,
            type: 'host_strike_added',
            title: `Avertissement ${nextStrikeNumber}/3 reçu`,
            body:
              nextStrikeNumber >= 3
                ? 'Vous avez reçu 3 avertissements. Vos annonces ont été désactivées.'
                : `Vous avez reçu un avertissement suite à un litige résolu (${nextStrikeNumber}/3)`,
            data: { disputeId, bookingId: booking.id, strikeNumber: String(nextStrikeNumber) },
          }).catch((err) => console.warn('[notify] Notification failed:', err))
        }
      }

      // Notify the reporter of the resolution
      createNotification(ctx.db, {
        userId: dispute.reporterId,
        type: 'dispute_resolved',
        title: 'Votre litige a été résolu',
        body: `Décision : ${resolution}`,
        data: { disputeId, bookingId: booking.id, status },
      }).catch((err) => console.warn('[notify] Notification failed:', err))

      return updatedDispute
    }),

  // Admin: list all disputes with optional filters
  listAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['open', 'under_review', 'resolved_refunded', 'resolved_rejected', 'resolved_compensation'])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Admin-only check
      const currentUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      })

      if (!currentUser || currentUser.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' })
      }

      const whereClause = input.status ? eq(disputes.status, input.status) : undefined

      const allDisputes = await ctx.db.query.disputes.findMany({
        where: whereClause,
        orderBy: (disputes, { desc }) => [desc(disputes.createdAt)],
        limit: input.limit,
        offset: input.offset,
      })

      // Enrich with booking + spot + driver info
      const enriched = await Promise.all(
        allDisputes.map(async (dispute) => {
          const booking = await ctx.db.query.bookings.findFirst({
            where: eq(bookings.id, dispute.bookingId),
          })

          if (!booking) return { ...dispute, spotTitle: null, driverEmail: null }

          const [spot, driver] = await Promise.all([
            ctx.db.query.spots.findFirst({ where: eq(spots.id, booking.spotId) }),
            ctx.db.query.users.findFirst({ where: eq(users.id, booking.driverId) }),
          ])

          return {
            ...dispute,
            spotTitle: spot?.title ?? null,
            driverEmail: driver?.email ?? null,
          }
        })
      )

      return enriched
    }),

  // Host: list disputes on their spots
  hostDisputes: hostProcedure.query(async ({ ctx }) => {
    // Fetch all spots owned by this host
    const hostSpots = await ctx.db.query.spots.findMany({
      where: eq(spots.hostId, ctx.userId),
    })

    if (hostSpots.length === 0) return []

    const spotIds = hostSpots.map((s) => s.id)

    // Fetch bookings for those spots
    const hostBookings = await ctx.db.query.bookings.findMany({
      where: (b, { inArray }) => inArray(b.spotId, spotIds),
    })

    if (hostBookings.length === 0) return []

    const bookingIds = hostBookings.map((b) => b.id)

    // Fetch disputes for those bookings
    const hostDisputesList = await ctx.db.query.disputes.findMany({
      where: (d, { inArray }) => inArray(d.bookingId, bookingIds),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    })

    return hostDisputesList
  }),
})
