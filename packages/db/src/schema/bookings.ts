import { pgTable, uuid, timestamp, numeric, text, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spots } from './spots'
import { vehicles } from './vehicles'

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'refunded',
])

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id, { onDelete: 'restrict' }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull(), // 20% take rate
  hostPayout: numeric('host_payout', { precision: 10, scale: 2 }).notNull(), // 80%
  status: bookingStatusEnum('status').notNull().default('pending'),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeTransferId: text('stripe_transfer_id'),
  qrCode: text('qr_code'), // for smart gate access
  accessGranted: boolean('access_granted').notNull().default(false),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
