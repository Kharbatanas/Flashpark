import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { users, verificationDocuments } from '@flashpark/db'

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
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' })

    if (user.role === 'host' || user.role === 'both' || user.role === 'admin') {
      return user // already a host
    }

    const docs = await ctx.db.query.verificationDocuments.findMany({
      where: eq(verificationDocuments.userId, ctx.userId),
    })

    const hasSubmitted = docs.some((d) => d.status === 'pending' || d.status === 'approved')

    if (!hasSubmitted) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous devez soumettre vos documents de vérification avant de devenir hôte' })
    }

    const [updated] = await ctx.db
      .update(users)
      .set({ role: 'both', updatedAt: new Date() })
      .where(eq(users.id, ctx.userId))
      .returning()
    return updated
  }),
})
