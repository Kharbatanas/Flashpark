-- Reviews V2: Multi-dimension ratings (access, accuracy, cleanliness)
-- Replaces single `rating` column with 3 sub-ratings

-- Add new rating columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_access INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_accuracy INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_cleanliness INTEGER;

-- Migrate existing data: copy old rating to all 3 new columns
UPDATE reviews
SET rating_access = rating,
    rating_accuracy = rating,
    rating_cleanliness = rating
WHERE rating_access IS NULL;

-- Now make them NOT NULL with CHECK constraints
ALTER TABLE reviews ALTER COLUMN rating_access SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN rating_accuracy SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN rating_cleanliness SET NOT NULL;

ALTER TABLE reviews ADD CONSTRAINT chk_rating_access CHECK (rating_access BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT chk_rating_accuracy CHECK (rating_accuracy BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT chk_rating_cleanliness CHECK (rating_cleanliness BETWEEN 1 AND 5);

-- Drop old single rating column
ALTER TABLE reviews DROP COLUMN IF EXISTS rating;

-- Update the trigger to use average of 3 sub-ratings
CREATE OR REPLACE FUNCTION update_spot_rating()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE spots
  SET
    rating = (
      SELECT AVG((rating_access + rating_accuracy + rating_cleanliness) / 3.0)::NUMERIC(3,2)
      FROM reviews
      WHERE spot_id = NEW.spot_id
    ),
    review_count = (SELECT COUNT(*) FROM reviews WHERE spot_id = NEW.spot_id),
    updated_at = NOW()
  WHERE id = NEW.spot_id;
  RETURN NEW;
END;
$$;
