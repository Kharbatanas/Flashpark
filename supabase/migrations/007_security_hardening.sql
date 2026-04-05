-- =============================================
-- 007: Security Hardening
-- Fixes all RLS gaps identified in the security audit.
-- =============================================


-- ─────────────────────────────────────────────
-- 1. Enable RLS on unprotected tables
--    competitor_data, market_summary, and seo_tracking were created
--    in 005_competitor_data.sql without RLS enabled.
-- ─────────────────────────────────────────────
ALTER TABLE competitor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_tracking ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────
-- 2. Admin-only policies for competitive intelligence tables
--    Note: The Supabase service_role key bypasses RLS entirely,
--    so the webhook/scraper (which uses the service_role key) can
--    still INSERT without a dedicated policy.
-- ─────────────────────────────────────────────

-- competitor_data
CREATE POLICY "Only admins read competitor_data"
  ON competitor_data FOR SELECT
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins write competitor_data"
  ON competitor_data FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins update competitor_data"
  ON competitor_data FOR UPDATE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins delete competitor_data"
  ON competitor_data FOR DELETE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

-- market_summary
CREATE POLICY "Only admins read market_summary"
  ON market_summary FOR SELECT
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins write market_summary"
  ON market_summary FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins update market_summary"
  ON market_summary FOR UPDATE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins delete market_summary"
  ON market_summary FOR DELETE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

-- seo_tracking
CREATE POLICY "Only admins read seo_tracking"
  ON seo_tracking FOR SELECT
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins write seo_tracking"
  ON seo_tracking FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins update seo_tracking"
  ON seo_tracking FOR UPDATE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));

CREATE POLICY "Only admins delete seo_tracking"
  ON seo_tracking FOR DELETE
  USING (auth.uid() IN (SELECT supabase_id FROM users WHERE role = 'admin'));


-- ─────────────────────────────────────────────
-- 3. Host booking access policies
--    Hosts need to see and manage bookings for their spots.
--    The existing policies only cover the driver side.
-- ─────────────────────────────────────────────
CREATE POLICY "Hosts see bookings for their spots"
  ON bookings FOR SELECT
  USING (
    spot_id IN (
      SELECT id FROM spots WHERE host_id IN (
        SELECT id FROM users WHERE supabase_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hosts update bookings for their spots"
  ON bookings FOR UPDATE
  USING (
    spot_id IN (
      SELECT id FROM spots WHERE host_id IN (
        SELECT id FROM users WHERE supabase_id = auth.uid()
      )
    )
  );


-- ─────────────────────────────────────────────
-- 4. Availability policies
--    Currently availability has RLS enabled (001) but NO policies,
--    meaning all access is denied. Fix: public read + host write.
-- ─────────────────────────────────────────────

-- Anyone can check availability (needed by the booking widget)
CREATE POLICY "Anyone can check availability"
  ON availability FOR SELECT
  USING (true);

-- Hosts manage availability for their own spots
CREATE POLICY "Hosts manage own spot availability"
  ON availability FOR ALL
  USING (
    spot_id IN (
      SELECT id FROM spots WHERE host_id IN (
        SELECT id FROM users WHERE supabase_id = auth.uid()
      )
    )
  );


-- ─────────────────────────────────────────────
-- 5. Users table exposure
--    The "Users are publicly readable" policy (001) exposes all
--    columns including stripe_customer_id, stripe_account_id, etc.
--    RLS cannot filter at the column level, so we keep the public
--    read policy but document the app-layer responsibility.
--
--    APP LAYER RESPONSIBILITY: API queries against the users table
--    MUST use .select() to return only safe columns:
--      id, full_name, avatar_url, role, is_verified, created_at
--    Never expose: email, phone_number, stripe_customer_id,
--                  stripe_account_id, supabase_id
-- ─────────────────────────────────────────────
-- (No SQL changes — keeping existing policy with this documented note)


-- ─────────────────────────────────────────────
-- 6. Missing indexes
--    bookings.vehicle_id was added in 003 without an index.
--    bookings.cancelled_by has no index for cancellation queries.
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_vehicle_id_idx ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS bookings_cancelled_by_idx ON bookings(cancelled_by);


-- ─────────────────────────────────────────────
-- 7. Schema drift fix
--    The app references parking_instructions but the column
--    was never added to the spots table.
-- ─────────────────────────────────────────────
ALTER TABLE spots ADD COLUMN IF NOT EXISTS parking_instructions TEXT;


-- ─────────────────────────────────────────────
-- 8. Fix update_spot_rating function
--    The original (001) lacks SECURITY DEFINER and SET search_path,
--    which means it runs with the caller's permissions and could
--    resolve tables incorrectly in certain contexts.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
