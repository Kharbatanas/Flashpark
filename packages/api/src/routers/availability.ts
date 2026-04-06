import { z } from 'zod'
import { eq, and, gte, lte, or, lt, gt } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, hostProcedure } from '../trpc'
import { availability, spots } from '@flashpark/db'

export const availabilityRouter = createTRPCRouter({
  // Get availability for a spot
  bySpot: protectedProcedure
    .input(z.object({
      spotId: z.string().uuid(),
      from: z.date().optional(),
      to: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const from = input.from ?? new Date()
      const to = input.to ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead

      return ctx.db.query.availability.findMany({
        where: and(
          eq(availability.spotId, input.spotId),
          gte(availability.endTime, from),
          lte(availability.startTime, to)
        ),
        orderBy: (availability, { asc }) => [asc(availability.startTime)],
      })
    }),

  // Set availability window (host only)
  set: hostProcedure
    .input(z.object({
      spotId: z.string().uuid(),
      startTime: z.date(),
      endTime: z.date(),
      isAvailable: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify host owns this spot
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, input.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Place introuvable ou non autorisée' })

      if (input.startTime >= input.endTime) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "L'heure de début doit être avant l'heure de fin" })
      }

      const overlapping = await ctx.db.select().from(availability)
        .where(and(
          eq(availability.spotId, input.spotId),
          lt(availability.startTime, input.endTime),
          gt(availability.endTime, input.startTime),
        ))
      if (overlapping.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau chevauche un créneau existant' })
      }

      const [slot] = await ctx.db
        .insert(availability)
        .values({
          spotId: input.spotId,
          startTime: input.startTime,
          endTime: input.endTime,
          isAvailable: input.isAvailable,
        })
        .returning()

      return slot
    }),

  // Delete an availability slot
  delete: hostProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify host owns the spot through the availability record
      const slot = await ctx.db.query.availability.findFirst({
        where: eq(availability.id, input.id),
      })
      if (!slot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Créneau introuvable' })

      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, slot.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorisé' })

      const [deleted] = await ctx.db
        .delete(availability)
        .where(eq(availability.id, input.id))
        .returning()

      return deleted
    }),

  // Bulk set: block/unblock multiple days at once
  bulkSet: hostProcedure
    .input(z.object({
      spotId: z.string().uuid(),
      slots: z.array(z.object({
        startTime: z.date(),
        endTime: z.date(),
        isAvailable: z.boolean(),
      })).min(1).max(60),
    }))
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.query.spots.findFirst({
        where: and(eq(spots.id, input.spotId), eq(spots.hostId, ctx.userId)),
      })
      if (!spot) throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorisé' })

      const rows = input.slots.map((s) => ({
        spotId: input.spotId,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
      }))

      const inserted = await ctx.db.insert(availability).values(rows).returning()
      return inserted
    }),
})
