import { pgEnum } from 'drizzle-orm/pg-core'

// Shared enums used by multiple tables — kept in a separate file
// to avoid circular import chains that break Drizzle type inference.

export const vehicleSizeCategoryEnum = pgEnum('vehicle_size_category', [
  'compact',
  'sedan',
  'suv',
  'van',
  'motorcycle',
])

export const cancellationPolicyEnum = pgEnum('cancellation_policy', [
  'flexible',
  'moderate',
  'strict',
])
