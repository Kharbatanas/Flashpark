import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['driver', 'host', 'both', 'admin'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseId: uuid('supabase_id').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  phoneNumber: text('phone_number'),
  role: userRoleEnum('role').notNull().default('driver'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeAccountId: text('stripe_account_id'), // for hosts (Connect)
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
