ALTER TABLE adventures
ADD COLUMN IF NOT EXISTS reward_type TEXT,
ADD COLUMN IF NOT EXISTS reward_title TEXT,
ADD COLUMN IF NOT EXISTS reward_description TEXT,
ADD COLUMN IF NOT EXISTS reward_delivery_mode TEXT,
ADD COLUMN IF NOT EXISTS reward_url TEXT,
ADD COLUMN IF NOT EXISTS is_reward_active BOOLEAN DEFAULT false;

DROP VIEW IF EXISTS public.adventures_secure;

CREATE VIEW public.adventures_secure AS
SELECT 
    id,
    CASE WHEN status = 'scouting' THEN codename ELSE title END as display_title,
    codename,
    status,
    CASE WHEN status = 'scouting' THEN 'CLASSIFIED MISSION - INTEL LOCKED' ELSE description END as display_description,
    CASE WHEN status = 'scouting' THEN lat + (random() - 0.5) * 0.02 ELSE lat END as display_lat,
    CASE WHEN status = 'scouting' THEN lng + (random() - 0.5) * 0.02 ELSE lng END as display_lng,
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
    created_at,
    updated_at
FROM adventures;

ALTER TABLE mission_contributions
ADD COLUMN IF NOT EXISTS reward_delivered BOOLEAN DEFAULT false;
