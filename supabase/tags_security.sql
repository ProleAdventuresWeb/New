-- ===============================================
-- PROLE ADVENTURES — TAGS SECURITY HARDENING
-- ===============================================
-- Restricts access to 'tags' and 'post_tags' tables 
-- to ensure only the admin (contact@proleadventures.com) 
-- can create, update, or delete tagging metadata.
-- ===============================================

-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read all tags" ON public.tags;
DROP POLICY IF EXISTS "Admin can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Public can read all post_tags" ON public.post_tags;
DROP POLICY IF EXISTS "Admin can manage post_tags" ON public.post_tags;

-- 3. Create SELECT policies for public (anon + authenticated)
CREATE POLICY "Public can read all tags" 
    ON public.tags 
    FOR SELECT 
    USING (true);

CREATE POLICY "Public can read all post_tags" 
    ON public.post_tags 
    FOR SELECT 
    USING (true);

-- 4. Create admin-only write policies
-- Only 'contact@proleadventures.com' can perform these actions
CREATE POLICY "Admin can manage tags" 
    ON public.tags 
    FOR ALL 
    USING (auth.jwt() ->> 'email' = 'contact@proleadventures.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'contact@proleadventures.com');

CREATE POLICY "Admin can manage post_tags" 
    ON public.post_tags 
    FOR ALL 
    USING (auth.jwt() ->> 'email' = 'contact@proleadventures.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'contact@proleadventures.com');

-- 5. Revoke/Grant statements to align role privileges
REVOKE ALL ON public.tags FROM authenticated;
REVOKE ALL ON public.post_tags FROM authenticated;

GRANT SELECT ON public.tags TO authenticated;
GRANT SELECT ON public.tags TO anon;
GRANT SELECT ON public.post_tags TO authenticated;
GRANT SELECT ON public.post_tags TO anon;

GRANT ALL ON public.tags TO service_role;
GRANT ALL ON public.post_tags TO service_role;

-- 6. Validation
-- Run this to verify policies are active:
-- SELECT * FROM pg_policies WHERE tablename IN ('tags', 'post_tags');
