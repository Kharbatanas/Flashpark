import { z } from 'zod'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure, hostProcedure } from '../trpc'
import { spots, users, vehicles } from '@flashpark/db'
import { createNotification } from '../lib/notify'

// Size category ordering used for compatibility checks (index = minimum supported rank)
const SIZE_RANK: Record<string, number> = {
  motorcycle: 0,
  compact: 1,
  sedan: 2,
  suv: 3,
  van: 4,
}

// Spot sizeCategory defines the MAXIMUM vehicle that fits
// e.g. spot 'compact' → only compact and motorcycle fit
const SPOT_MAX_RANK: Record<string, number> = {
  compact: 1,
  sedan: 2,
  suv: 3,
  van: 4,
  motorcycle: 0,
}

// 30 cm clearance margin applied to width/length checks
const DIMENSION_MARGIN = 0.3

const httpsUrlSchema = z.string().url().refine(url => url.startsWith('https://'), {
  message: 'URL must use HTTPS',
})

const newSpotFields = z.object({
  width: z.number().positive().max(10).optional(),
  length: z.number().positive().max(20).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).default('flexible'),
  accessInstructions: z.string().max(2000).optional(),
  accessPhotos: z.array(httpsUrlSchema).max(10).default([]),
  floorNumber: z.string().max(10).optional(),
  spotNumber: z.string().max(20).optional(),
  buildingCode: z.string().max(20).optional(),
  gpsPinLat: z.number().min(-90).max(90).optional(),
  gpsPinLng: z.number().min(-180).max(180).optional(),
  ownershipProofUrl: httpsUrlSchema.optional(),
  sizeCategory: z.enum(['compact', 'sedan', 'suv', 'van', 'motorcycle']).default('sedan'),
})

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
        photos: z.array(httpsUrlSchema).default([]),
      }).merge(newSpotFields)
    )
    .mutation(async ({ ctx, input }) => {
      const [spot] = await ctx.db
        .insert(spots)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({
          ...input,
          hostId: ctx.userId,
          pricePerHour: String(input.pricePerHour),
          pricePerDay: input.pricePerDay ? String(input.pricePerDay) : undefined,
          latitude: String(input.latitude),
          longitude: String(input.longitude),
          maxVehicleHeight: input.maxVehicleHeight ? String(input.maxVehicleHeight) : undefined,
          width: input.width ? String(input.width) : undefined,
          length: input.length ? String(input.length) : undefined,
          gpsPinLat: input.gpsPinLat ? String(input.gpsPinLat) : undefined,
          gpsPinLng: input.gpsPinLng ? String(input.gpsPinLng) : undefined,
          status: 'pending_review',
        } as any)
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
        photos: z.array(httpsUrlSchema).optional(),
        parkingInstructions: z.string().max(500).optional(),
        width: z.number().positive().max(10).optional(),
        length: z.number().positive().max(20).optional(),
        cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).optional(),
        accessInstructions: z.string().max(2000).optional(),
        accessPhotos: z.array(httpsUrlSchema).max(10).optional(),
        floorNumber: z.string().max(10).optional(),
        spotNumber: z.string().max(20).optional(),
        buildingCode: z.string().max(20).optional(),
        gpsPinLat: z.number().min(-90).max(90).optional(),
        gpsPinLng: z.number().min(-180).max(180).optional(),
        ownershipProofUrl: httpsUrlSchema.optional(),
        sizeCategory: z.enum(['compact', 'sedan', 'suv', 'van', 'motorcycle']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, pricePerHour, pricePerDay, width, length, gpsPinLat, gpsPinLng, ...rest } = input

      if (input.status === 'active') {
        const current = await ctx.db.query.spots.findFirst({
          where: and(eq(spots.id, input.id), eq(spots.hostId, ctx.userId)),
        })
        if (current?.status === 'pending_review') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cette annonce est en cours de vérification' })
        }
      }

      // Only include fields that were actually provided (not undefined)
      const setValues: Record<string, unknown> = { updatedAt: new Date() }
      if (rest.title !== undefined) setValues.title = rest.title
      if (rest.description !== undefined) setValues.description = rest.description
      if (rest.status !== undefined) setValues.status = rest.status
      if (rest.amenities !== undefined) setValues.amenities = rest.amenities
      if (rest.photos !== undefined) setValues.photos = rest.photos
      if (rest.parkingInstructions !== undefined) setValues.parkingInstructions = rest.parkingInstructions
      if (rest.cancellationPolicy !== undefined) setValues.cancellationPolicy = rest.cancellationPolicy
      if (rest.accessInstructions !== undefined) setValues.accessInstructions = rest.accessInstructions
      if (rest.accessPhotos !== undefined) setValues.accessPhotos = rest.accessPhotos
      if (rest.floorNumber !== undefined) setValues.floorNumber = rest.floorNumber
      if (rest.spotNumber !== undefined) setValues.spotNumber = rest.spotNumber
      if (rest.buildingCode !== undefined) setValues.buildingCode = rest.buildingCode
      if (rest.ownershipProofUrl !== undefined) setValues.ownershipProofUrl = rest.ownershipProofUrl
      if (rest.sizeCategory !== undefined) setValues.sizeCategory = rest.sizeCategory
      if (pricePerHour !== undefined) setValues.pricePerHour = String(pricePerHour)
      if (pricePerDay !== undefined) setValues.pricePerDay = String(pricePerDay)
      if (width !== undefined) setValues.width = String(width)
      if (length !== undefined) setValues.length = String(length)
      if (gpsPinLat !== undefined) setValues.gpsPinLat = String(gpsPinLat)
      if (gpsPinLng !== undefined) setValues.gpsPinLng = String(gpsPinLng)

      const [updated] = await ctx.db
        .update(spots)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set(setValues as any)
        .where(and(eq(spots.id, id), eq(spots.hostId, ctx.userId)))
        .returning()

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable ou non autorisé' })

      return updated
    }),

  // Verify a spot (admin only)
  verify: protectedProcedure
    .input(
      z.object({
        spotId: z.string().uuid(),
        approved: z.boolean(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      })
      if (!admin || admin.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès administrateur requis' })
      }

      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, input.spotId),
      })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable' })

      if (input.approved) {
        const [updated] = await ctx.db
          .update(spots)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set({
            status: 'active',
            verifiedAt: new Date(),
            verifiedBy: ctx.userId,
            updatedAt: new Date(),
          } as any)
          .where(eq(spots.id, input.spotId))
          .returning()

        await createNotification(ctx.db, {
          userId: spot.hostId,
          type: 'spot_verified',
          title: 'Annonce vérifiée',
          body: 'Votre annonce a été vérifiée et est maintenant active',
          data: { spotId: input.spotId },
        })

        return updated
      } else {
        const [updated] = await ctx.db
          .update(spots)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set({ status: 'inactive', updatedAt: new Date() } as any)
          .where(eq(spots.id, input.spotId))
          .returning()

        const body = input.adminNotes
          ? `Votre annonce n'a pas passé la vérification : ${input.adminNotes}`
          : "Votre annonce n'a pas passé la vérification"

        await createNotification(ctx.db, {
          userId: spot.hostId,
          type: 'spot_rejected',
          title: 'Annonce non vérifiée',
          body,
          data: { spotId: input.spotId },
        })

        return updated
      }
    }),

  // List spots pending admin verification (admin only)
  pendingVerification: protectedProcedure.query(async ({ ctx }) => {
    const admin = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    })
    if (!admin || admin.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès administrateur requis' })
    }

    const results = await ctx.db
      .select({
        spot: spots,
        hostEmail: users.email,
        hostFullName: users.fullName,
      })
      .from(spots)
      .innerJoin(users, eq(spots.hostId, users.id))
      .where(
        sql`${spots.status} IN ('pending_review', 'pending_verification')`
      )
      .orderBy(spots.createdAt)

    return results
  }),

  // Check if a vehicle is compatible with a spot (public)
  checkVehicleCompatibility: publicProcedure
    .input(
      z.object({
        spotId: z.string().uuid(),
        vehicleId: z.string().uuid().optional(),
        vehicleSize: z.enum(['compact', 'sedan', 'suv', 'van', 'motorcycle']).optional(),
      }).refine(data => data.vehicleId !== undefined || data.vehicleSize !== undefined, {
        message: 'vehicleId ou vehicleSize est requis',
      })
    )
    .query(async ({ ctx, input }) => {
      const spot = await ctx.db.query.spots.findFirst({
        where: eq(spots.id, input.spotId),
      })
      if (!spot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable' })

      const warnings: string[] = []
      let compatible = true

      let vehicleSizeCategory: string | null = input.vehicleSize ?? null
      let vehicleHeight: number | null = null
      let vehicleWidth: number | null = null
      let vehicleLength: number | null = null

      if (input.vehicleId) {
        const vehicle = await ctx.db.query.vehicles.findFirst({
          where: eq(vehicles.id, input.vehicleId),
        })
        if (!vehicle) throw new TRPCError({ code: 'NOT_FOUND', message: 'Véhicule introuvable' })

        vehicleSizeCategory = vehicle.sizeCategory
        vehicleHeight = vehicle.height ? parseFloat(vehicle.height) : null
        vehicleWidth = vehicle.width ? parseFloat(vehicle.width) : null
        vehicleLength = vehicle.length ? parseFloat(vehicle.length) : null
      }

      // Height check
      if (vehicleHeight !== null && spot.maxVehicleHeight !== null && spot.maxVehicleHeight !== undefined) {
        const maxHeight = parseFloat(spot.maxVehicleHeight)
        if (vehicleHeight > maxHeight) {
          compatible = false
          warnings.push(`Hauteur insuffisante : votre véhicule mesure ${vehicleHeight}m de haut, la place autorise ${maxHeight}m maximum`)
        }
      }

      // Width check (with 30 cm margin)
      if (vehicleWidth !== null && spot.width !== null && spot.width !== undefined) {
        const spotWidth = parseFloat(spot.width)
        if (vehicleWidth > spotWidth - DIMENSION_MARGIN) {
          compatible = false
          warnings.push(`Largeur insuffisante : votre véhicule mesure ${vehicleWidth}m de large, la place fait ${spotWidth}m (marge de ${DIMENSION_MARGIN}m requise)`)
        }
      }

      // Length check (with 30 cm margin)
      if (vehicleLength !== null && spot.length !== null && spot.length !== undefined) {
        const spotLength = parseFloat(spot.length)
        if (vehicleLength > spotLength - DIMENSION_MARGIN) {
          compatible = false
          warnings.push(`Longueur insuffisante : votre véhicule mesure ${vehicleLength}m de long, la place fait ${spotLength}m (marge de ${DIMENSION_MARGIN}m requise)`)
        }
      }

      // Size category check
      if (vehicleSizeCategory !== null) {
        const vehicleRank = SIZE_RANK[vehicleSizeCategory] ?? 2
        const spotMaxRank = SPOT_MAX_RANK[spot.sizeCategory] ?? 2

        if (vehicleRank > spotMaxRank) {
          compatible = false
          const categoryLabels: Record<string, string> = {
            compact: 'compacte',
            sedan: 'berline',
            suv: 'SUV',
            van: 'van',
            motorcycle: 'moto',
          }
          warnings.push(
            `Catégorie incompatible : cette place est prévue pour les véhicules de type ${categoryLabels[spot.sizeCategory] ?? spot.sizeCategory} au maximum, votre véhicule est de type ${categoryLabels[vehicleSizeCategory] ?? vehicleSizeCategory}`
          )
        }
      }

      return { compatible, warnings }
    }),

  // Host's listings
  myListings: hostProcedure.query(async ({ ctx }) => {
    return ctx.db.query.spots.findMany({
      where: eq(spots.hostId, ctx.userId),
      orderBy: (spots, { desc }) => [desc(spots.createdAt)],
    })
  }),

  // Delete a spot listing (host only, must own the spot)
  delete: hostProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(spots)
        .where(and(eq(spots.id, input.id), eq(spots.hostId, ctx.userId)))
        .returning()
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Place introuvable ou non autorisée' })
      return deleted
    }),
})
