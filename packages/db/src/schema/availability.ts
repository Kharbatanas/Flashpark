import { pgTable, uuid, timestamp, boolean } from 'drizzle-orm/pg-core'
import { spots } from './spots'

export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
