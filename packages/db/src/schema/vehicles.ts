import { pgTable, uuid, text, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicleSizeCategoryEnum } from './enums'

export { vehicleSizeCategoryEnum }

export const vehicleTypeEnum = pgEnum('vehicle_type', [
  'sedan',
  'suv',
  'compact',
  'van',
  'motorcycle',
  'electric',
])

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  licensePlate: text('license_plate').notNull(),
  brand: text('brand'),
  model: text('model'),
  color: text('color'),
  type: vehicleTypeEnum('type').notNull().default('sedan'),
  height: numeric('height', { precision: 4, scale: 2 }),
  // Physical dimensions (meters)
  width: numeric('width', { precision: 4, scale: 2 }),
  length: numeric('length', { precision: 4, scale: 2 }),
  sizeCategory: vehicleSizeCategoryEnum('size_category').notNull().default('sedan'),
  isElectric: boolean('is_electric').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
