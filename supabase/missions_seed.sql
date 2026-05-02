-- 1. Schema setup: Add missing columns if they don't exist
ALTER TABLE public.adventures 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Ensure title is unique so the update logic (ON CONFLICT) works
-- We use a DO block to add the constraint only if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'adventures_title_key') THEN
    ALTER TABLE public.adventures ADD CONSTRAINT adventures_title_key UNIQUE (title);
  END IF;
END $$;

-- 3. Unified Upsert: Insert or Update mission data
INSERT INTO public.adventures (
  title, 
  codename, 
  status, 
  description, 
  lat, 
  lng, 
  bounty_target, 
  bounty_current,
  video_url,
  thumbnail_url
) VALUES 
(
  'Escape The Midlands Matrix',
  'Escape The Midlands Matrix',
  'complete',
  'No cash, no cares, it''s time for this Prole to escape and explore what''s left of Freedom in 2026',
  53.018028,
  -1.308472,
  50.00,
  50.00,
  'https://www.youtube.com/@ProleAdventures',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop'
),
(
  'The Land That Time Begot',
  'The Land That Time Begot',
  'complete',
  'The Prole visits a town that''s been dragged, kicking and screaming into the 4th Industrial revolution.',
  53.020111,
  -1.327778,
  0.00,
  0.00,
  'https://www.youtube.com/@ProleAdventures',
  '/images/Missions/The_Land_That_time_Begot.jpg'
),
(
  'Target Alpha',
  'Target Alpha',
  'active',
  'A high-priority scouting mission into the subterranean infrastructure. Gear up for low-light conditions.',
  51.5432,
  -0.0876,
  100.00,
  0.00,
  NULL,
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000'
)
ON CONFLICT (title) 
DO UPDATE SET 
  codename = EXCLUDED.codename,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  bounty_target = EXCLUDED.bounty_target,
  bounty_current = EXCLUDED.bounty_current,
  video_url = EXCLUDED.video_url,
  thumbnail_url = EXCLUDED.thumbnail_url;
