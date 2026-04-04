import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { vehicles } from '@flashpark/db'

export const vehiclesRouter = createTRPCRouter({
  // List my vehicles
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.vehicles.findMany({
      where: eq(vehicles.ownerId, ctx.userId),
      orderBy: (vehicles, { desc }) => [desc(vehicles.isDefault), desc(vehicles.createdAt)],
    })
  }),

  // Add a vehicle
  create: protectedProcedure
    .input(
      z.object({
        licensePlate: z.string().min(2).max(20),
        brand: z.string().max(50).optional(),
        model: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
        type: z.enum(['sedan', 'suv', 'compact', 'van', 'motorcycle', 'electric']).default('sedan'),
        height: z.number().positive().max(5).optional(),
        isElectric: z.boolean().default(false),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.db
          .update(vehicles)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(vehicles.ownerId, ctx.userId), eq(vehicles.isDefault, true)))
      }

      const [vehicle] = await ctx.db
        .insert(vehicles)
        .values({
          ...input,
          ownerId: ctx.userId,
          height: input.height ? String(input.height) : undefined,
        })
        .returning()

      return vehicle
    }),

  // Update a vehicle
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        licensePlate: z.string().min(2).max(20).optional(),
        brand: z.string().max(50).optional(),
        model: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
        type: z.enum(['sedan', 'suv', 'compact', 'van', 'motorcycle', 'electric']).optional(),
        height: z.number().positive().max(5).optional(),
        isElectric: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, height, isDefault, ...rest } = input

      if (isDefault) {
        await ctx.db
          .update(vehicles)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(vehicles.ownerId, ctx.userId), eq(vehicles.isDefault, true)))
      }

      const setValues: Record<string, unknown> = { ...rest, updatedAt: new Date() }
      if (height !== undefined) setValues.height = String(height)
      if (isDefault !== undefined) setValues.isDefault = isDefault

      const [updated] = await ctx.db
        .update(vehicles)
        .set(setValues)
        .where(and(eq(vehicles.id, id), eq(vehicles.ownerId, ctx.userId)))
        .returning()

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Véhicule introuvable' })
      return updated
    }),

  // Delete a vehicle
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(vehicles)
        .where(and(eq(vehicles.id, input.id), eq(vehicles.ownerId, ctx.userId)))
        .returning()

      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Véhicule introuvable' })
      return deleted
    }),
})
