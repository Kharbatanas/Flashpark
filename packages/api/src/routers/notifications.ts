import { z } from 'zod'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { notifications } from '@flashpark/db'

export const notificationsRouter = createTRPCRouter({
  // Get my notifications
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.unreadOnly
        ? and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt))
        : eq(notifications.userId, ctx.userId)

      return ctx.db.query.notifications.findMany({
        where,
        orderBy: [desc(notifications.createdAt)],
        limit: 50,
      })
    }),

  // Count unread
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const unread = await ctx.db.query.notifications.findMany({
      where: and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt)),
      columns: { id: true },
    })
    return { count: unread.length }
  }),

  // Mark all as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, ctx.userId), isNull(notifications.readAt)))
    return { ok: true }
  }),

  // Mark one as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.userId)))
      return { ok: true }
    }),
})
