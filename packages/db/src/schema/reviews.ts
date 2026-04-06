import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spots } from './spots'
import { bookings } from './bookings'

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spots.id, { onDelete: 'cascade' }),
  ratingAccess: integer('rating_access').notNull(),
  ratingAccuracy: integer('rating_accuracy').notNull(),
  ratingCleanliness: integer('rating_cleanliness').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
