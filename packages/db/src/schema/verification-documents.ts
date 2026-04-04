import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected'])
export const documentTypeEnum = pgEnum('document_type', [
  'id_card',
  'passport',
  'drivers_license',
  'proof_of_address',
  'property_proof',
])

export const verificationDocuments = pgTable('verification_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: documentTypeEnum('type').notNull(),
  fileUrl: text('file_url').notNull(),
  status: verificationStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
