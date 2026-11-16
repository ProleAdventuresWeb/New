-- League Table format migration.
-- Retains legacy audit metrics in storage for historic records, but the public
-- and admin audit interfaces now use place, housing, basket, safety, access,
-- score, and Tomato Index fields.

BEGIN;

ALTER TABLE public.adventures
  ADD COLUMN IF NOT EXISTS place text,
  ADD COLUMN IF NOT EXISTS rent_mo text,
  ADD COLUMN IF NOT EXISTS basket text,
  ADD COLUMN IF NOT EXISTS safety text,
  ADD COLUMN IF NOT EXISTS access text,
  ADD COLUMN IF NOT EXISTS tomato_score integer;

-- Existing records stored the public location in title.
UPDATE public.adventures
SET place = title
WHERE place IS NULL OR btrim(place) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'adventures_place_not_blank'
      AND conrelid = 'public.adventures'::regclass
  ) THEN
    ALTER TABLE public.adventures
      ADD CONSTRAINT adventures_place_not_blank
      CHECK (place IS NULL OR btrim(place) <> '') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'adventures_episode_positive'
      AND conrelid = 'public.adventures'::regclass
  ) THEN
    ALTER TABLE public.adventures
      ADD CONSTRAINT adventures_episode_positive
      CHECK (episode_number IS NULL OR episode_number > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'adventures_tomato_score_range'
      AND conrelid = 'public.adventures'::regclass
  ) THEN
    ALTER TABLE public.adventures
      ADD CONSTRAINT adventures_tomato_score_range
      CHECK (tomato_score IS NULL OR tomato_score BETWEEN 1 AND 10) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_adventures_place_search
  ON public.adventures (lower(place));

CREATE INDEX IF NOT EXISTS idx_adventures_completed_audit_date
  ON public.adventures (audit_date DESC)
  WHERE status = 'complete';

DROP VIEW IF EXISTS public.adventures_secure;

CREATE VIEW public.adventures_secure AS
SELECT
  id,
  CASE
    WHEN status = 'scouting' THEN codename
    ELSE COALESCE(NULLIF(place, ''), title)
  END AS display_title,
  COALESCE(NULLIF(place, ''), title) AS place,
  codename,
  status,
  CASE
    WHEN status = 'scouting' THEN 'CLASSIFIED MISSION - INTEL LOCKED'
    ELSE description
  END AS display_description,
  CASE
    WHEN status = 'scouting' THEN lat + (random() - 0.5) * 0.02
    ELSE lat
  END AS display_lat,
  CASE
    WHEN status = 'scouting' THEN lng + (random() - 0.5) * 0.02
    ELSE lng
  END AS display_lng,
  lat,
  lng,
  bounty_target,
  bounty_current,
  reward_type,
  reward_title,
  reward_description,
  reward_delivery_mode,
  reward_url,
  is_reward_active,
  video_url,
  thumbnail_url,
  images,
  episode_number,
  audit_date,
  score,
  tomato_score,
  rent_mo,
  basket,
  safety,
  access,
  verdict_line,
  youtube_id,
  story_slug,
  conditions_line,
  commissioned,
  funder_credit,
  commissioning_question,
  prole_foods_claimed,
  prole_foods_donor_name,
  prole_foods_town,
  prole_foods_instruction,
  prole_foods_amount,
  -- Legacy audit fields retained for backwards compatibility only.
  actual_spend_gbp,
  kebab_index_gbp,
  tomato_index_gbp,
  exchanges_count,
  free_pins_found_count,
  hassle_log,
  created_at,
  updated_at
FROM public.adventures;

COMMIT;