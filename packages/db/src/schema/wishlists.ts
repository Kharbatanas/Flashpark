import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spots } from './spots'

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spotId: uuid('spot_id')
      .notNull()
      .references(() => spots.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueUserSpot: unique().on(t.userId, t.spotId),
  })
)
