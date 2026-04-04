-- =============================================
-- Add vehicles table + vehicle_id to bookings
-- =============================================

-- Vehicle type enum
DO $$ BEGIN CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'compact', 'van', 'motorcycle', 'electric'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  brand         TEXT,
  model         TEXT,
  color         TEXT,
  type          vehicle_type NOT NULL DEFAULT 'sedan',
  height        NUMERIC(4, 2),
  is_electric   BOOLEAN NOT NULL DEFAULT FALSE,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicles_owner_id_idx ON vehicles(owner_id);

-- Add vehicle reference to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own vehicles" ON vehicles FOR SELECT USING (owner_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (owner_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (owner_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
