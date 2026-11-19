-- V1 production amendment: public mission reads use a sanitized view.
-- The existing browser-based admin continues to write to public.adventures
-- as an authenticated user; this migration only removes anonymous direct
-- table access and ensures the public view never projects raw coordinates.

BEGIN;

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
  actual_spend_gbp,
  kebab_index_gbp,
  tomato_index_gbp,
  exchanges_count,
  free_pins_found_count,
  hassle_log,
  created_at,
  updated_at
FROM public.adventures;

-- PUBLIC grants were allowing anonymous callers to bypass the intended view.
-- Revoke at the source, then explicitly grant the safe projection.
REVOKE ALL PRIVILEGES ON public.adventures FROM PUBLIC;
REVOKE ALL PRIVILEGES ON public.adventures FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adventures TO authenticated;
GRANT SELECT ON public.adventures_secure TO anon, authenticated;

COMMIT;