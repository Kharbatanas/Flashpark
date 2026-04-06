import { z } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import Stripe from 'stripe'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { users, verificationDocuments, bookings } from '@flashpark/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

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

  ensureStripeCustomer: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' })

    if (user.stripeCustomerId) return { stripeCustomerId: user.stripeCustomerId }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName ?? undefined,
      metadata: { userId: user.id },
    })

    const [updated] = await ctx.db
      .update(users)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(users.id, ctx.userId))
      .returning()

    return { stripeCustomerId: updated.stripeCustomerId }
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

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // Cancel all pending/confirmed bookings first (bookings.driverId has onDelete: restrict)
    await ctx.db
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: ctx.userId, updatedAt: new Date() })
      .where(
        and(
          eq(bookings.driverId, ctx.userId),
          inArray(bookings.status, ['pending', 'confirmed'])
        )
      )

    // Delete user record — DB cascade handles related records
    await ctx.db.delete(users).where(eq(users.id, ctx.userId))

    // Note: the caller must also delete the Supabase Auth user via the admin API
    // (supabaseAdmin.auth.admin.deleteUser(supabaseId)) — cannot be done from tRPC layer
    return { success: true }
  }),
})
