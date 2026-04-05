import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { users } from '@flashpark/db'

export const usersRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
    return user
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).optional(),
        phoneNumber: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId))
        .returning()
      return updated
    }),

  becomeHost: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable — vérifiez que votre compte est bien créé' })

    if (!user?.isVerified) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Vous devez compléter la vérification d\'identité pour devenir hôte',
      })
    }

    const newRole = user.role === 'driver' ? 'both' : user.role
    const [updated] = await ctx.db
      .update(users)
      .set({ role: newRole as 'both', updatedAt: new Date() })
      .where(eq(users.id, ctx.userId))
      .returning()
    return updated
  }),
})
