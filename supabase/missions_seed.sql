-- Prole Control Master Mission Seed
-- Use this to manage all missions. Safe to re-run multiple times.

-- 1. Ensure the table has the correct unique constraint for the upsert to work
-- Run this once if it's not already unique
-- ALTER TABLE public.adventures ADD CONSTRAINT adventures_title_key UNIQUE (title);

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
