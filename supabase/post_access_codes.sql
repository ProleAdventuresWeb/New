-- =============================================
-- PROLE ADVENTURES — COMPLETE POSTS & GATING SETUP
-- =============================================
-- Creates the `posts` table if it does not exist yet,
-- configures RLS security policies, and adds gating columns.
-- =============================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'dispatches',
    cover_image_url TEXT NOT NULL,
    read_time INTEGER NOT NULL DEFAULT 5,
    published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    layout TEXT NOT NULL DEFAULT 'template',
    template_data JSONB,
    is_gated BOOLEAN NOT NULL DEFAULT false,
    access_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add columns if table already existed without them
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_gated BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS access_code TEXT;

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_gated ON public.posts(is_gated);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid naming conflicts
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Admin can manage all posts" ON public.posts;

-- 6. Policy: Public can read published posts
CREATE POLICY "Public can read published posts" 
    ON public.posts 
    FOR SELECT 
    USING (published = true);

-- 7. Policy: Admin can manage all posts (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage all posts" 
    ON public.posts 
    FOR ALL 
    USING (auth.jwt() ->> 'email' = 'contact@proleadventures.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'contact@proleadventures.com');

-- 8. Grant Permissions
REVOKE ALL ON public.posts FROM authenticated;
GRANT SELECT ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
