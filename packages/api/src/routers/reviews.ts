import { z } from 'zod'
import { eq, and, desc, inArray, isNull } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { reviews, bookings, users, spots } from '@flashpark/db'

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

      const userIds = Array.from(new Set(rows.map((r) => r.reviewerId)))
      const reviewerUsers = userIds.length > 0
        ? await ctx.db.select({ id: users.id, fullName: users.fullName, email: users.email })
            .from(users)
            .where(inArray(users.id, userIds))
        : []
      const userMap = new Map(reviewerUsers.map((u) => [u.id, u.fullName ?? u.email]))

      return rows.map((r) => ({
        ...r,
        rating: Math.round(((r.ratingAccess + r.ratingAccuracy + r.ratingCleanliness) / 3) * 10) / 10,
        reviewerName: userMap.get(r.reviewerId) ?? 'Utilisateur',
      }))
    }),

  // Protected: check if current user can review a booking
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

  // Protected: get the oldest unreviewed completed booking for the current user
  // Used by the review gate modal to block navigation
  pendingReview: protectedProcedure
    .query(async ({ ctx }) => {
      // Find completed bookings by this driver that have no review
      const completedBookings = await ctx.db
        .select({
          id: bookings.id,
          spotId: bookings.spotId,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
        })
        .from(bookings)
        .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
        .where(
          and(
            eq(bookings.driverId, ctx.userId),
            eq(bookings.status, 'completed'),
            isNull(reviews.id)
          )
        )
        .orderBy(bookings.endTime)
        .limit(1)

      if (completedBookings.length === 0) return null

      const booking = completedBookings[0]

      // Fetch spot details for display
      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, booking.spotId),
      })

      return {
        bookingId: booking.id,
        spotId: booking.spotId,
        spotTitle: spot?.title ?? 'Place de parking',
        spotAddress: spot?.address ?? '',
        spotCity: spot?.city ?? '',
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
      }
    }),

  // Protected: submit a review with 3 sub-ratings
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        ratingAccess: z.number().int().min(1).max(5),
        ratingAccuracy: z.number().int().min(1).max(5),
        ratingCleanliness: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.driverId, ctx.userId)),
      })
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation introuvable' })
      if (booking.status !== 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La reservation doit etre terminee pour laisser un avis' })
      }

      const existing = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.bookingId, input.bookingId),
      })
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Vous avez deja laisse un avis pour cette reservation' })

      const [review] = await ctx.db
        .insert(reviews)
        .values({
          bookingId: input.bookingId,
          reviewerId: ctx.userId,
          spotId: booking.spotId,
          ratingAccess: input.ratingAccess,
          ratingAccuracy: input.ratingAccuracy,
          ratingCleanliness: input.ratingCleanliness,
          comment: input.comment,
        })
        .returning()

      return review
    }),
})
