-- Seed baseline mission records without making adventure titles globally unique.
-- Multiple audits of the same place are valid; this seed only avoids duplicating
-- these legacy records when the script is run again.
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
)
SELECT
  seed.title,
  seed.codename,
  seed.status,
  seed.description,
  seed.lat,
  seed.lng,
  seed.bounty_target,
  seed.bounty_current,
  seed.video_url,
  seed.thumbnail_url
FROM (
  VALUES
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
) AS seed(
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
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.adventures AS existing
  WHERE existing.title = seed.title
);
