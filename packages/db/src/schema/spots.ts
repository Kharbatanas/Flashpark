import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicleSizeCategoryEnum, cancellationPolicyEnum } from './enums'

export { vehicleSizeCategoryEnum, cancellationPolicyEnum }

export const spotTypeEnum = pgEnum('spot_type', [
  'outdoor',
  'indoor',
  'garage',
  'covered',
  'underground',
])
export const spotStatusEnum = pgEnum('spot_status', [
  'active',
  'inactive',
  'pending_review',
  'pending_verification',
])

export const spots = pgTable('spots', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  city: text('city').notNull().default('Nice'),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  pricePerHour: numeric('price_per_hour', { precision: 10, scale: 2 }).notNull(),
  pricePerDay: numeric('price_per_day', { precision: 10, scale: 2 }),
  type: spotTypeEnum('type').notNull().default('outdoor'),
  status: spotStatusEnum('status').notNull().default('pending_review'),
  hasSmartGate: boolean('has_smart_gate').notNull().default(false),
  parklioDeviceId: text('parklio_device_id'),
  maxVehicleHeight: numeric('max_vehicle_height', { precision: 5, scale: 2 }), // in meters
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  parkingInstructions: text('parking_instructions'),
  instantBook: boolean('instant_book').notNull().default(true),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count').notNull().default(0),
  // Physical dimensions (meters)
  width: numeric('width', { precision: 4, scale: 2 }),
  length: numeric('length', { precision: 4, scale: 2 }),
  sizeCategory: vehicleSizeCategoryEnum('size_category').notNull().default('sedan'),
  // Cancellation policy
  cancellationPolicy: cancellationPolicyEnum('cancellation_policy').notNull().default('flexible'),
  // Access details
  accessInstructions: text('access_instructions'),
  accessPhotos: jsonb('access_photos').$type<string[]>().notNull().default([]),
  // Precise location
  floorNumber: text('floor_number'),
  spotNumber: text('spot_number'),
  buildingCode: text('building_code'),
  gpsPinLat: numeric('gps_pin_lat', { precision: 10, scale: 8 }),
  gpsPinLng: numeric('gps_pin_lng', { precision: 11, scale: 8 }),
  // Verification
  ownershipProofUrl: text('ownership_proof_url'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
