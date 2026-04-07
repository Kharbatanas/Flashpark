import { pgTable, uuid, text, numeric, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { bookings } from './bookings'

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved_refunded',
  'resolved_rejected',
  'resolved_compensation',
])

export const disputeTypeEnum = pgEnum('dispute_type', [
  'spot_occupied',
  'spot_not_matching',
  'access_issue',
  'safety_concern',
  'other',
])

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'restrict' }),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  reportedUserId: uuid('reported_user_id').references(() => users.id),
  type: disputeTypeEnum('type').notNull(),
  status: disputeStatusEnum('status').notNull().default('open'),
  description: text('description').notNull(),
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  adminNotes: text('admin_notes'),
  resolution: text('resolution'),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
})

export const hostStrikes = pgTable('host_strikes', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  disputeId: uuid('dispute_id')
    .notNull()
    .references(() => disputes.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  strikeNumber: integer('strike_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
