-- =============================================
-- 012: Expert Features
-- Disputes, host strikes, cancellation policies,
-- vehicle size categories, booking check-in/out,
-- overstay tracking, and spot verification fields.
-- =============================================


-- ─────────────────────────────────────────────
-- A. New enums
-- ─────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_refunded', 'resolved_rejected', 'resolved_compensation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dispute_type AS ENUM ('spot_occupied', 'spot_not_matching', 'access_issue', 'safety_concern', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cancellation_policy AS ENUM ('flexible', 'moderate', 'strict'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vehicle_size_category AS ENUM ('compact', 'sedan', 'suv', 'van', 'motorcycle'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────
-- B. Add 'pending_verification' to spot_status enum
-- ─────────────────────────────────────────────
ALTER TYPE spot_status ADD VALUE IF NOT EXISTS 'pending_verification';


-- ─────────────────────────────────────────────
-- C. New table: disputes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  reporter_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reported_user_id UUID REFERENCES users(id),
  type             dispute_type NOT NULL,
  status           dispute_status NOT NULL DEFAULT 'open',
  description      TEXT NOT NULL,
  photos           JSONB NOT NULL DEFAULT '[]',
  admin_notes      TEXT,
  resolution       TEXT,
  refund_amount    NUMERIC(10, 2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS disputes_booking_id_idx  ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS disputes_reporter_id_idx ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx      ON disputes(status);
CREATE INDEX IF NOT EXISTS disputes_created_at_idx  ON disputes(created_at);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Reporters can see their own disputes
CREATE POLICY "Reporters see own disputes"
  ON disputes FOR SELECT
  USING (
    reporter_id IN (
      SELECT id FROM users WHERE supabase_id = auth.uid()
    )
  );

-- Reporters can create disputes
CREATE POLICY "Reporters can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (
    reporter_id IN (
      SELECT id FROM users WHERE supabase_id = auth.uid()
    )
  );

-- Admins can see all disputes
CREATE POLICY "Admins see all disputes"
  ON disputes FOR SELECT
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

-- Admins can update disputes (resolve, add notes)
CREATE POLICY "Admins update disputes"
  ON disputes FOR UPDATE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));


-- ─────────────────────────────────────────────
-- D. New table: host_strikes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS host_strikes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispute_id    UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  strike_number INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS host_strikes_host_id_idx ON host_strikes(host_id);

ALTER TABLE host_strikes ENABLE ROW LEVEL SECURITY;

-- Service role only — no direct user access
CREATE POLICY "Admins manage host strikes"
  ON host_strikes FOR ALL
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));


-- ─────────────────────────────────────────────
-- E. ALTER TABLE spots — new columns
-- ─────────────────────────────────────────────
ALTER TABLE spots ADD COLUMN IF NOT EXISTS width                 NUMERIC(4, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS length                NUMERIC(4, 2);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS cancellation_policy   cancellation_policy NOT NULL DEFAULT 'flexible';
ALTER TABLE spots ADD COLUMN IF NOT EXISTS access_instructions   TEXT;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS access_photos         JSONB NOT NULL DEFAULT '[]';
ALTER TABLE spots ADD COLUMN IF NOT EXISTS floor_number          TEXT;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS spot_number           TEXT;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS building_code         TEXT;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS gps_pin_lat           NUMERIC(10, 8);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS gps_pin_lng           NUMERIC(11, 8);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS ownership_proof_url   TEXT;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS verified_at           TIMESTAMPTZ;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS verified_by           UUID REFERENCES users(id);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS size_category         vehicle_size_category NOT NULL DEFAULT 'sedan';


-- ─────────────────────────────────────────────
-- F. ALTER TABLE bookings — new columns
-- ─────────────────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at      TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_out_at     TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_end_time  TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extension_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS overstay_charged   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS overstay_amount    NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show            BOOLEAN NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────
-- G. ALTER TABLE vehicles — new columns
-- ─────────────────────────────────────────────
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS width         NUMERIC(4, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS length        NUMERIC(4, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS size_category vehicle_size_category NOT NULL DEFAULT 'sedan';
