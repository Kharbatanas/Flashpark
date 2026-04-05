import { z } from 'zod'
import { eq, and, or, not, gte, lte } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure, hostProcedure } from '../trpc'
import { bookings, spots, vehicles, availability } from '@flashpark/db'

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

      // Check spot exists and is active
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, spotId), eq(spots.status, 'active')),
      })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place non disponible' })

      // Check availability — if host blocked this period, reject
      const blockedSlot = await ctx.db.query.availability.findFirst({
        where: and(
          eq(availability.spotId, spotId),
          eq(availability.isAvailable, false),
          // blocked slot overlaps with requested time
          or(
            and(gte(availability.startTime, startTime), lte(availability.startTime, endTime)),
            and(gte(availability.endTime, startTime), lte(availability.endTime, endTime)),
            and(lte(availability.startTime, startTime), gte(availability.endTime, endTime))
          )
        ),
      })
      if (blockedSlot) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau est indisponible (bloqué par l\'hôte)' })
      }

      // Check for conflicts — exclude cancelled/refunded bookings
      const conflicts = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, spotId),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded')),
          or(
            and(gte(bookings.startTime, startTime), lte(bookings.startTime, endTime)),
            and(gte(bookings.endTime, startTime), lte(bookings.endTime, endTime)),
            and(lte(bookings.startTime, startTime), gte(bookings.endTime, endTime))
          )
        ),
      })
      if (conflicts) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau est déjà réservé' })
      }

      // Calculate pricing (20% platform fee)
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      const pricePerHour = parseFloat(spot.pricePerHour)
      const totalPrice = Math.round(hours * pricePerHour * 100) / 100
      const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
      const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100

      // Verify vehicle belongs to user and check height
      if (vehicleId) {
        const vehicle = await ctx.db.query.vehicles.findFirst({
          where: and(eq(vehicles.id, vehicleId), eq(vehicles.ownerId, ctx.userId)),
        })
        if (!vehicle) throw new TRPCError({ code: 'NOT_FOUND', message: 'Véhicule introuvable' })

        // Check vehicle height vs spot max height
        if (spot.maxVehicleHeight && vehicle.height) {
          if (parseFloat(vehicle.height) > parseFloat(spot.maxVehicleHeight)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Votre véhicule (${vehicle.height}m) dépasse la hauteur max de cette place (${spot.maxVehicleHeight}m)`,
            })
          }
        }
      }

      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          driverId: ctx.userId,
          spotId,
          startTime,
          endTime,
          vehicleId: vehicleId ?? null,
          totalPrice: String(totalPrice),
          platformFee: String(platformFee),
          hostPayout: String(hostPayout),
          status: 'pending',
        })
        .returning()

      return { booking, totalPrice, platformFee }
    }),

  // My bookings as driver
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.bookings.findMany({
      where: eq(bookings.driverId, ctx.userId),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    })
  }),

  // Cancel a booking
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.id), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })
      if (booking.status === 'cancelled') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette réservation est déjà annulée' })
      }
      if (booking.status === 'active' || booking.status === 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Impossible d'annuler une réservation active ou terminée" })
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() })
        .where(eq(bookings.id, input.id))
        .returning()

      return updated
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

      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(bookings.id, input.id))
        .returning()

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
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() })
        .where(eq(bookings.id, input.id))
        .returning()

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

      // Check booking conflicts
      const conflict = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, spotId),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded')),
          or(
            and(gte(bookings.startTime, startTime), lte(bookings.startTime, endTime)),
            and(gte(bookings.endTime, startTime), lte(bookings.endTime, endTime)),
            and(lte(bookings.startTime, startTime), gte(bookings.endTime, endTime))
          )
        ),
      })

      // Check blocked availability
      const blocked = await ctx.db.query.availability.findFirst({
        where: and(
          eq(availability.spotId, spotId),
          eq(availability.isAvailable, false),
          or(
            and(gte(availability.startTime, startTime), lte(availability.startTime, endTime)),
            and(gte(availability.endTime, startTime), lte(availability.endTime, endTime)),
            and(lte(availability.startTime, startTime), gte(availability.endTime, endTime))
          )
        ),
      })

      return {
        available: !conflict && !blocked,
        reason: conflict ? 'already_booked' : blocked ? 'host_blocked' : null,
      }
    }),
})
