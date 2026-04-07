import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { wishlists, spots } from '@flashpark/db'

export const wishlistsRouter = createTRPCRouter({
  // Get all wishlisted spots for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(wishlists)
      .innerJoin(spots, eq(wishlists.spotId, spots.id))
      .where(eq(wishlists.userId, ctx.userId))
      .orderBy(wishlists.createdAt)

    return rows.map((r) => ({
      wishlistId: r.wishlists.id,
      savedAt: r.wishlists.createdAt,
      ...r.spots,
    }))
  }),

  // Toggle: add if not exists, remove if exists
  toggle: protectedProcedure
    .input(z.object({ spotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wishlists.findFirst({
        where: and(eq(wishlists.userId, ctx.userId), eq(wishlists.spotId, input.spotId)),
      })

      if (existing) {
        await ctx.db.delete(wishlists).where(eq(wishlists.id, existing.id))
        return { saved: false }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.insert(wishlists).values({
        userId: ctx.userId,
        spotId: input.spotId,
      } as any)
      return { saved: true }
    }),

  // Check if a spot is in current user's wishlist
  check: protectedProcedure
    .input(z.object({ spotId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wishlists.findFirst({
        where: and(eq(wishlists.userId, ctx.userId), eq(wishlists.spotId, input.spotId)),
      })
      return { saved: !!existing }
    }),

  // Batch check multiple spots
  checkMany: protectedProcedure
    .input(z.object({ spotIds: z.array(z.string().uuid()).max(100) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ spotId: wishlists.spotId })
        .from(wishlists)
        .where(eq(wishlists.userId, ctx.userId))

      const savedSet = new Set(rows.map((r) => r.spotId))
      return Object.fromEntries(input.spotIds.map((id) => [id, savedSet.has(id)])) as Record<string, boolean>
    }),
})
