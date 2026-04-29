-- ============================================================
-- PROLE ADVENTURES — Field Drops (Geocache) Schema
-- Run this in your Supabase SQL editor:
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- 1) Drops table
CREATE TABLE IF NOT EXISTS drops (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    drop_number   integer NOT NULL UNIQUE,
    title         text NOT NULL,
    region        text NOT NULL,              -- Vague area e.g. "East London"
    clues         text[] NOT NULL DEFAULT '{}',
    status        text NOT NULL DEFAULT 'unreleased'
                    CHECK (status IN ('unreleased', 'available', 'claimed')),
    release_date  timestamp with time zone,   -- NULL = not scheduled yet
    claimed_by    text,                       -- Winner's alias
    claimed_at    timestamp with time zone,
    created_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- 2) Claims log — every claim attempt stored for your records
CREATE TABLE IF NOT EXISTS drop_claims (
    id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    drop_id        uuid REFERENCES drops(id) ON DELETE CASCADE,
    finder_alias   text NOT NULL,
    finder_message text,
    created_at     timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_drops_status       ON drops(status);
CREATE INDEX IF NOT EXISTS idx_drops_release_date ON drops(release_date);
CREATE INDEX IF NOT EXISTS idx_drop_claims_drop   ON drop_claims(drop_id);

-- 4) Row Level Security
ALTER TABLE drops       ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_claims ENABLE ROW LEVEL SECURITY;

-- Public can read drops that are available or claimed (not unreleased)
CREATE POLICY "Public reads released drops" ON drops
    FOR SELECT USING (status IN ('available', 'claimed'));

-- Public can mark a drop as claimed (only if it is currently 'available')
CREATE POLICY "Public can claim an available drop" ON drops
    FOR UPDATE
    USING  (status = 'available')
    WITH CHECK (status = 'claimed');

-- Anyone can submit a claim record
CREATE POLICY "Anyone can submit a claim" ON drop_claims
    FOR INSERT WITH CHECK (true);

-- Only authenticated users (you) can manage drops
CREATE POLICY "Authenticated users manage drops" ON drops
    FOR ALL USING (auth.role() = 'authenticated');

-- 5) Auto-update updated_at
CREATE OR REPLACE FUNCTION update_drops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drops_updated_at
    BEFORE UPDATE ON drops
    FOR EACH ROW EXECUTE FUNCTION update_drops_updated_at();

-- ============================================================
-- Optional: seed a sample drop for testing
-- ============================================================
-- INSERT INTO drops (drop_number, title, region, clues, status, release_date)
-- VALUES (
--   1,
--   'Drop #001 — The Copper Token',
--   'East London, Greater London',
--   ARRAY[
--     'Where the old iron meets the new glass, beneath a painted sky.',
--     'Step through the market''s shadow — the traders have long since gone home.',
--     'The token waits inside a rusted fitting, fixed to something that hasn''t moved in years.'
--   ],
--   'available',
--   now()
-- );
