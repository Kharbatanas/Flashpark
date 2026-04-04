import { z } from 'zod'
import { eq, and, or, gte, lte } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, hostProcedure } from '../trpc'
import { bookings, spots } from '@flashpark/db'

export const bookingsRouter = createTRPCRouter({
  // Create a booking (returns clientSecret for Stripe)
  create: protectedProcedure
    .input(
      z.object({
        spotId: z.string().uuid(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { spotId, startTime, endTime } = input

      if (startTime >= endTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Start time must be before end time' })
      }

      // Check spot exists and is active
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, spotId), eq(spots.status, 'active')),
      })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Spot not available' })

      // Check for conflicts
      const conflicts = await ctx.db.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, spotId),
          or(
            and(gte(bookings.startTime, startTime), lte(bookings.startTime, endTime)),
            and(gte(bookings.endTime, startTime), lte(bookings.endTime, endTime))
          )
        ),
      })
      if (conflicts) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Spot already booked for this time' })
      }

      // Calculate pricing (20% platform fee)
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      const pricePerHour = parseFloat(spot.pricePerHour)
      const totalPrice = Math.round(hours * pricePerHour * 100) / 100
      const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
      const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100

      const [booking] = await ctx.db
        .insert(bookings)
        .values({
          driverId: ctx.userId,
          spotId,
          startTime,
          endTime,
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
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND' })
      if (booking.status === 'active' || booking.status === 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot cancel an active booking' })
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId })
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
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND' })

      // Verify the host owns the spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your spot' })

      if (booking.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking is not pending' })
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
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND' })

      // Verify the host owns the spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, booking.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your spot' })

      if (booking.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking is not pending' })
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() })
        .where(eq(bookings.id, input.id))
        .returning()

      return updated
    }),
})
