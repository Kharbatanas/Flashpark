-- =============================================
-- Flashpark — Initial Schema Migration
-- =============================================

-- Enums
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('driver', 'host', 'both', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE spot_type AS ENUM ('outdoor', 'indoor', 'garage', 'covered', 'underground'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE spot_status AS ENUM ('active', 'inactive', 'pending_review'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id        UUID NOT NULL UNIQUE,
  email              TEXT NOT NULL UNIQUE,
  full_name          TEXT NOT NULL,
  avatar_url         TEXT,
  phone_number       TEXT,
  role               user_role NOT NULL DEFAULT 'driver',
  stripe_customer_id TEXT,
  stripe_account_id  TEXT,
  is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- spots
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  address            TEXT NOT NULL,
  city               TEXT NOT NULL DEFAULT 'Nice',
  latitude           NUMERIC(10, 8) NOT NULL,
  longitude          NUMERIC(11, 8) NOT NULL,
  price_per_hour     NUMERIC(10, 2) NOT NULL,
  price_per_day      NUMERIC(10, 2),
  type               spot_type NOT NULL DEFAULT 'outdoor',
  status             spot_status NOT NULL DEFAULT 'pending_review',
  has_smart_gate     BOOLEAN NOT NULL DEFAULT FALSE,
  parklio_device_id  TEXT,
  max_vehicle_height NUMERIC(5, 2),
  photos             JSONB NOT NULL DEFAULT '[]',
  amenities          JSONB NOT NULL DEFAULT '[]',
  instant_book       BOOLEAN NOT NULL DEFAULT TRUE,
  rating             NUMERIC(3, 2),
  review_count       INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spots_host_id_idx ON spots(host_id);
CREATE INDEX IF NOT EXISTS spots_status_idx ON spots(status);
CREATE INDEX IF NOT EXISTS spots_city_idx ON spots(city);

-- ─────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  spot_id                   UUID NOT NULL REFERENCES spots(id) ON DELETE RESTRICT,
  start_time                TIMESTAMPTZ NOT NULL,
  end_time                  TIMESTAMPTZ NOT NULL,
  total_price               NUMERIC(10, 2) NOT NULL,
  platform_fee              NUMERIC(10, 2) NOT NULL,
  host_payout               NUMERIC(10, 2) NOT NULL,
  status                    booking_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,
  qr_code                   TEXT,
  access_granted            BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at              TIMESTAMPTZ,
  cancelled_by              UUID REFERENCES users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_driver_id_idx ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS bookings_spot_id_idx ON bookings(spot_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_time_idx ON bookings(start_time, end_time);

-- ─────────────────────────────────────────────
-- reviews
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id     UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_spot_id_idx ON reviews(spot_id);

-- ─────────────────────────────────────────────
-- availability
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id      UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS availability_spot_id_idx ON availability(spot_id);

-- ─────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- users: anyone can read, only self can write
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid() = supabase_id);

-- spots: active spots are public, host can manage own
CREATE POLICY "Active spots are public" ON spots FOR SELECT USING (status = 'active' OR host_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Hosts can insert spots" ON spots FOR INSERT WITH CHECK (host_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Hosts can update own spots" ON spots FOR UPDATE USING (host_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- bookings: driver or host of the spot can read
CREATE POLICY "Drivers see own bookings" ON bookings FOR SELECT USING (driver_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Drivers can create bookings" ON bookings FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Drivers can update own bookings" ON bookings FOR UPDATE USING (driver_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- reviews: public read
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers can insert" ON reviews FOR INSERT WITH CHECK (reviewer_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Trigger: auto-create user record on auth signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO users (supabase_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (supabase_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- Trigger: update spot rating after review insert
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE spots
  SET
    rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE spot_id = NEW.spot_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE spot_id = NEW.spot_id),
    updated_at = NOW()
  WHERE id = NEW.spot_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_spot_rating();
