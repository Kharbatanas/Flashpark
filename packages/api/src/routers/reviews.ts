import { z } from 'zod'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { reviews, bookings, users } from '@flashpark/db'

export const reviewsRouter = createTRPCRouter({
  // Public: list reviews for a spot with reviewer names
  bySpot: publicProcedure
    .input(z.object({ spotId: z.string().uuid(), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.reviews.findMany({
        where: eq(reviews.spotId, input.spotId),
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit,
      })

      // Attach reviewer names — single batch query
      const userIds = Array.from(new Set(rows.map((r) => r.reviewerId)))
      const reviewerUsers = userIds.length > 0
        ? await ctx.db.select({ id: users.id, fullName: users.fullName, email: users.email })
            .from(users)
            .where(inArray(users.id, userIds))
        : []
      const userMap = new Map(reviewerUsers.map((u) => [u.id, u.fullName ?? u.email]))

      return rows.map((r) => ({
        ...r,
        reviewerName: userMap.get(r.reviewerId) ?? 'Utilisateur',
      }))
    }),

  // Protected: check if current user can review a booking (completed, no existing review)
  canReview: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking || booking.status !== 'completed') return { canReview: false }

      const existing = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.bookingId, input.bookingId),
      })
      return { canReview: !existing }
    }),

  // Protected: submit a review
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate booking belongs to driver and is completed
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Réservation introuvable' })
      if (booking.status !== 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La réservation doit être terminée pour laisser un avis' })
      }

      // Check no existing review
      const existing = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.bookingId, input.bookingId),
      })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Vous avez déjà laissé un avis pour cette réservation' })

      const [review] = await ctx.db
        .insert(reviews)
        .values({
          bookingId: input.bookingId,
          reviewerId: ctx.userId,
          spotId: booking.spotId,
          rating: input.rating,
          comment: input.comment,
        })
        .returning()

      return review
    }),
})
