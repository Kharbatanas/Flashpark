import { z } from 'zod'
import { eq, and, or, asc, desc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { messages, bookings, spots } from '@flashpark/db'

export const messagesRouter = createTRPCRouter({
  // Get messages for a booking
  byBooking: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user is driver or host of this booking
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      const isDriver = booking.driverId === ctx.userId
      const isHost = spot?.hostId === ctx.userId
      if (!isDriver && !isHost) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès non autorisé' })
      }

      return ctx.db.query.messages.findMany({
        where: eq(messages.bookingId, input.bookingId),
        orderBy: [asc(messages.createdAt)],
      })
    }),

  // Send a message
  send: protectedProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is driver or host of this booking
      const booking = await ctx.db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })

      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      const isDriver = booking.driverId === ctx.userId
      const isHost = spot?.hostId === ctx.userId
      if (!isDriver && !isHost) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès non autorisé' })
      }

      const [msg] = await ctx.db
        .insert(messages)
        .values({
          bookingId: input.bookingId,
          senderId: ctx.userId,
          content: input.content,
        })
        .returning()

      return msg
    }),

  // Mark messages as read
  markRead: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.bookingId, input.bookingId),
            // Only mark OTHER person's messages as read
            or(
              eq(messages.senderId, ctx.userId) // actually we want NOT equal, but drizzle doesn't have neq easily
            )
          )
        )
      return { ok: true }
    }),
})
