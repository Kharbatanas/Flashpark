// Database types derived from the Drizzle schema
// snake_case matches Supabase column names

export type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'
export type SpotStatus = 'active' | 'inactive' | 'pending_review' | 'pending_verification'
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'refunded'
export type UserRole = 'driver' | 'host' | 'both' | 'admin'
export type VehicleType = 'sedan' | 'suv' | 'compact' | 'van' | 'motorcycle' | 'electric'
export type VehicleSizeCategory = 'compact' | 'sedan' | 'suv' | 'van' | 'motorcycle'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'
export type DisputeStatus = 'open' | 'under_review' | 'resolved_refunded' | 'resolved_rejected' | 'resolved_compensation'
export type DisputeType = 'spot_occupied' | 'spot_not_matching' | 'access_issue' | 'safety_concern' | 'other'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address' | 'property_proof'

// User is the primary alias; DbUser kept for backward compatibility
export type User = DbUser

export interface DbUser {
  id: string
  supabase_id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone_number: string | null
  role: UserRole
  stripe_customer_id: string | null
  stripe_account_id: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Spot {
  id: string
  host_id: string
  title: string
  description: string | null
  address: string
  city: string
  latitude: string
  longitude: string
  price_per_hour: string
  price_per_day: string | null
  type: SpotType
  status: SpotStatus
  has_smart_gate: boolean
  parklio_device_id: string | null
  max_vehicle_height: string | null
  photos: string[]
  amenities: string[]
  parking_instructions: string | null
  instant_book: boolean
  rating: string | null
  review_count: number
  width: string | null
  length: string | null
  size_category: VehicleSizeCategory
  cancellation_policy: CancellationPolicy
  access_instructions: string | null
  access_photos: string[]
  floor_number: string | null
  spot_number: string | null
  building_code: string | null
  gps_pin_lat: string | null
  gps_pin_lng: string | null
  ownership_proof_url: string | null
  verified_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  driver_id: string
  spot_id: string
  start_time: string
  end_time: string
  total_price: string
  platform_fee: string
  host_payout: string
  status: BookingStatus
  vehicle_id: string | null
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
  qr_code: string | null
  access_granted: boolean
  cancelled_at: string | null
  cancelled_by: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  original_end_time: string | null
  extension_count: number
  overstay_charged: boolean
  overstay_amount: string | null
  no_show: boolean
  created_at: string
  updated_at: string
}

export interface BookingWithSpot extends Booking {
  spot: Spot
}

export interface Vehicle {
  id: string
  owner_id: string
  license_plate: string
  brand: string | null
  model: string | null
  color: string | null
  type: VehicleType
  height: string | null
  width: string | null
  length: string | null
  size_category: VehicleSizeCategory
  is_electric: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  spot_id: string
  rating_access: number
  rating_accuracy: number
  rating_cleanliness: number
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, string>
  read_at: string | null
  created_at: string
}

export interface Dispute {
  id: string
  booking_id: string
  reporter_id: string
  reported_user_id: string | null
  type: DisputeType
  status: DisputeStatus
  description: string
  photos: string[]
  admin_notes: string | null
  resolution: string | null
  refund_amount: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface Availability {
  id: string
  spot_id: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export interface Wishlist {
  id: string
  user_id: string
  spot_id: string
  created_at: string
}

export interface Conversation {
  booking_id: string
  latest_message: Message | null
  other_user_id: string
  spot: Pick<Spot, 'id' | 'title' | 'photos'>
  unread_count: number
}

export interface SpotFilters {
  type?: SpotType
  minPrice?: number
  maxPrice?: number
  instantBook?: boolean
  hasSmartGate?: boolean
  cancellationPolicy?: CancellationPolicy
  sizeCategory?: VehicleSizeCategory
}

export interface HostStats {
  total_earnings: number
  active_spots: number
  pending_bookings: number
  total_bookings: number
}

export interface UserStats {
  booking_count: number
  review_count: number
  member_since: string
}

export interface HostStrike {
  id: string
  host_id: string
  dispute_id: string
  reason: string
  strike_number: number
  created_at: string
}

export interface VerificationDocument {
  id: string
  user_id: string
  type: DocumentType
  file_url: string
  status: VerificationStatus
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
}
