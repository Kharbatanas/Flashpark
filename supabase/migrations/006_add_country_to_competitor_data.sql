-- Add country column to competitor_data and market_summary
ALTER TABLE competitor_data ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France';
ALTER TABLE market_summary ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France';

CREATE INDEX IF NOT EXISTS competitor_data_country_idx ON competitor_data(country);
CREATE INDEX IF NOT EXISTS market_summary_country_idx ON market_summary(country);

-- Update unique constraint to include country
ALTER TABLE market_summary DROP CONSTRAINT IF EXISTS market_summary_city_date_key;
ALTER TABLE market_summary ADD CONSTRAINT market_summary_country_city_date_key UNIQUE(country, city, date);
