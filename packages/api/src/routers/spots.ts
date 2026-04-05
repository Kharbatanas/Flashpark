import { z } from 'zod'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure, hostProcedure } from '../trpc'
import { spots } from '@flashpark/db'

export const spotsRouter = createTRPCRouter({
  // Get spots near a location (map view)
  nearby: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().min(0.1).max(1000).default(500),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { lat, lng, radiusKm } = input

      // Haversine distance filter using PostGIS-compatible SQL
      const results = await ctx.db
        .select()
        .from(spots)
        .where(
          and(
            eq(spots.status, 'active'),
            sql`(
              6371 * acos(
                cos(radians(${lat})) *
                cos(radians(${spots.latitude}::float)) *
                cos(radians(${spots.longitude}::float) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(${spots.latitude}::float))
              )
            ) <= ${radiusKm}`
          )
        )
        .limit(100)

      return results
    }),

  // Get a single spot by ID
  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const spot = await ctx.db.query.spots.findFirst({
      where: eq(spots.id, input.id),
    })
    if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable' })
    return spot
  }),

  // Create a new spot listing
  create: hostProcedure
    .input(
      z.object({
        title: z.string().min(5).max(100),
        description: z.string().max(1000).optional(),
        address: z.string().min(5),
        city: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        pricePerHour: z.number().positive(),
        pricePerDay: z.number().positive().optional(),
        type: z.enum(['outdoor', 'indoor', 'garage', 'covered', 'underground']),
        hasSmartGate: z.boolean().default(false),
        parklioDeviceId: z.string().optional(),
        maxVehicleHeight: z.number().positive().optional(),
        amenities: z.array(z.string()).default([]),
        parkingInstructions: z.string().max(500).optional(),
        instantBook: z.boolean().default(true),
        photos: z.array(z.string().url()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [spot] = await ctx.db
        .insert(spots)
        .values({
          ...input,
          hostId: ctx.userId,
          pricePerHour: String(input.pricePerHour),
          pricePerDay: input.pricePerDay ? String(input.pricePerDay) : undefined,
          latitude: String(input.latitude),
          longitude: String(input.longitude),
          maxVehicleHeight: input.maxVehicleHeight ? String(input.maxVehicleHeight) : undefined,
          status: 'pending_review',
        })
        .returning()

      return spot
    }),

  // Update spot
  update: hostProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(5).max(100).optional(),
        description: z.string().max(1000).optional(),
        pricePerHour: z.number().positive().optional(),
        pricePerDay: z.number().positive().optional(),
        status: z.enum(['active', 'inactive']).optional(),
        amenities: z.array(z.string()).optional(),
        photos: z.array(z.string().url()).optional(),
        parkingInstructions: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, pricePerHour, pricePerDay, ...rest } = input

      // Only include fields that were actually provided (not undefined)
      const setValues: Record<string, unknown> = { updatedAt: new Date() }
      if (rest.title !== undefined) setValues.title = rest.title
      if (rest.description !== undefined) setValues.description = rest.description
      if (rest.status !== undefined) setValues.status = rest.status
      if (rest.amenities !== undefined) setValues.amenities = rest.amenities
      if (rest.photos !== undefined) setValues.photos = rest.photos
      if (rest.parkingInstructions !== undefined) setValues.parkingInstructions = rest.parkingInstructions
      if (pricePerHour !== undefined) setValues.pricePerHour = String(pricePerHour)
      if (pricePerDay !== undefined) setValues.pricePerDay = String(pricePerDay)

      const [updated] = await ctx.db
        .update(spots)
        .set(setValues)
        .where(and(eq(spots.id, id), eq(spots.hostId, ctx.userId)))
        .returning()

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable ou non autorisé' })

      return updated
    }),

  // Host's listings
  myListings: hostProcedure.query(async ({ ctx }) => {
    return ctx.db.query.spots.findMany({
      where: eq(spots.hostId, ctx.userId),
      orderBy: (spots, { desc }) => [desc(spots.createdAt)],
    })
  }),
})
