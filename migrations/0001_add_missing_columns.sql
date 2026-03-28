-- Add missing columns to tracks table
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS track_number integer;

-- If the column still doesn't exist (different database state), add remaining columns
DO $$
BEGIN
    -- Add track_number if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='tracks' AND column_name='track_number') THEN
        ALTER TABLE tracks ADD COLUMN track_number integer;
    END IF;
END $$;
