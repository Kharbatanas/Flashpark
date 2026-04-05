-- =============================================
-- Competitive Intelligence Tables
-- =============================================

-- Competitor pricing and data
CREATE TABLE IF NOT EXISTS competitor_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,              -- 'zenpark', 'yespark', 'indigo', 'google_maps'
  city        TEXT NOT NULL,              -- 'Nice', 'Montpellier', 'Paris', etc.
  spot_name   TEXT,                       -- Name of the competitor listing
  spot_type   TEXT,                       -- 'outdoor', 'indoor', 'garage', 'underground'
  price_hour  NUMERIC(8,2),              -- Price per hour
  price_day   NUMERIC(8,2),              -- Price per day
  price_month NUMERIC(8,2),              -- Price per month (subscription)
  rating      NUMERIC(3,2),              -- Google/platform rating
  review_count INTEGER DEFAULT 0,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  address     TEXT,
  features    JSONB DEFAULT '[]'::jsonb,  -- ['ev_charging', 'covered', '24h_access', etc.]
  raw_data    JSONB DEFAULT '{}'::jsonb,  -- Full scraped payload for reference
  scraped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitor_data_source_idx ON competitor_data(source);
CREATE INDEX IF NOT EXISTS competitor_data_city_idx ON competitor_data(city);
CREATE INDEX IF NOT EXISTS competitor_data_scraped_at_idx ON competitor_data(scraped_at DESC);

-- SEO tracking
CREATE TABLE IF NOT EXISTS seo_tracking (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,              -- 'parking particulier nice', 'location parking montpellier'
  position    INTEGER,                    -- Google search position (null = not found)
  competitor  TEXT,                       -- Which competitor ranks here (null = flashpark)
  url         TEXT,                       -- The ranking URL
  city        TEXT,
  scraped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_tracking_keyword_idx ON seo_tracking(keyword);
CREATE INDEX IF NOT EXISTS seo_tracking_scraped_at_idx ON seo_tracking(scraped_at DESC);

-- Market summary (aggregated daily)
CREATE TABLE IF NOT EXISTS market_summary (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city            TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  avg_price_hour  NUMERIC(8,2),
  min_price_hour  NUMERIC(8,2),
  max_price_hour  NUMERIC(8,2),
  avg_price_day   NUMERIC(8,2),
  avg_price_month NUMERIC(8,2),
  total_listings  INTEGER DEFAULT 0,
  avg_rating      NUMERIC(3,2),
  source_breakdown JSONB DEFAULT '{}'::jsonb,  -- {"zenpark": 45, "yespark": 30, ...}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city, date)
);

CREATE INDEX IF NOT EXISTS market_summary_city_date_idx ON market_summary(city, date DESC);
