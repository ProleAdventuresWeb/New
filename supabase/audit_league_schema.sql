-- Migration: Add Proletariat League Table and Audit fields to adventures table

-- 1. Drop every single-column unique constraint or unique index on title.
-- Places may have multiple audits over time, so title must not be globally unique.
DO $$
DECLARE
  title_constraint record;
BEGIN
  FOR title_constraint IN
    SELECT constraint_name
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'adventures'
      AND column_name = 'title'
      AND constraint_name IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'adventures'
          AND constraint_type = 'UNIQUE'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE public.adventures DROP CONSTRAINT IF EXISTS %I',
      title_constraint.constraint_name
    );
  END LOOP;
END $$;

DO $$
DECLARE
  title_index record;
BEGIN
  FOR title_index IN
    SELECT index_class.relname AS index_name
    FROM pg_index AS index_definition
    JOIN pg_class AS index_class
      ON index_class.oid = index_definition.indexrelid
    JOIN pg_namespace AS index_schema
      ON index_schema.oid = index_class.relnamespace
    JOIN pg_attribute AS indexed_column
      ON indexed_column.attrelid = index_definition.indrelid
      AND indexed_column.attnum = index_definition.indkey[0]
    WHERE index_schema.nspname = 'public'
      AND index_definition.indrelid = 'public.adventures'::regclass
      AND index_definition.indisunique
      AND index_definition.indnatts = 1
      AND indexed_column.attname = 'title'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', title_index.index_name);
  END LOOP;
END $$;

-- 2. Add Audit columns to adventures table
ALTER TABLE public.adventures
ADD COLUMN IF NOT EXISTS episode_number integer,
ADD COLUMN IF NOT EXISTS audit_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS youtube_id text,
ADD COLUMN IF NOT EXISTS story_slug text,
ADD COLUMN IF NOT EXISTS score integer CHECK (score IS NULL OR (score >= 1 AND score <= 100)),
ADD COLUMN IF NOT EXISTS verdict_line text,
ADD COLUMN IF NOT EXISTS actual_spend_gbp numeric(10,2),
ADD COLUMN IF NOT EXISTS kebab_index_gbp numeric(10,2),
ADD COLUMN IF NOT EXISTS tomato_index_gbp numeric(10,2),
ADD COLUMN IF NOT EXISTS exchanges_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_pins_found_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hassle_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conditions_line text,
ADD COLUMN IF NOT EXISTS commissioned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS funder_credit text,
ADD COLUMN IF NOT EXISTS commissioning_question text,
-- Prole Foods one-shot bounty per mission
ADD COLUMN IF NOT EXISTS prole_foods_claimed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prole_foods_donor_name text,
ADD COLUMN IF NOT EXISTS prole_foods_town text,
ADD COLUMN IF NOT EXISTS prole_foods_instruction text,
ADD COLUMN IF NOT EXISTS prole_foods_amount numeric(10,2);

-- 3. Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_adventures_score ON public.adventures(score);
CREATE INDEX IF NOT EXISTS idx_adventures_story_slug ON public.adventures(story_slug);
CREATE INDEX IF NOT EXISTS idx_adventures_episode_number ON public.adventures(episode_number);

-- 4. Recreate adventures_secure view to include audit fields with coordinate jitter for scouting missions
DROP VIEW IF EXISTS public.adventures_secure;

CREATE VIEW public.adventures_secure AS
SELECT
    id,
    CASE
        WHEN status = 'scouting' THEN codename
        ELSE title
    END as display_title,
    codename,
    status,
    CASE
        WHEN status = 'scouting' THEN 'CLASSIFIED MISSION - INTEL LOCKED'
        ELSE description
    END as display_description,
    CASE
        WHEN status = 'scouting' THEN lat + (random() - 0.5) * 0.02
        ELSE lat
    END as display_lat,
    CASE
        WHEN status = 'scouting' THEN lng + (random() - 0.5) * 0.02
        ELSE lng
    END as display_lng,
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
    -- Audit fields
    episode_number,
    audit_date,
    youtube_id,
    story_slug,
    score,
    verdict_line,
    actual_spend_gbp,
    kebab_index_gbp,
    tomato_index_gbp,
    exchanges_count,
    free_pins_found_count,
    hassle_log,
    conditions_line,
    commissioned,
    funder_credit,
    commissioning_question,
    -- Prole Foods
    prole_foods_claimed,
    prole_foods_donor_name,
    prole_foods_town,
    prole_foods_instruction,
    prole_foods_amount,
    created_at,
    updated_at
FROM public.adventures;
