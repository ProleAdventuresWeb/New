-- ===============================================
-- PROLE ADVENTURES — BLOG SECURITY HARDENING
-- ===============================================
-- Restricts access to the 'posts' table specifically 
-- to ensure only the admin (contact@proleadventures.com) 
-- can create, update, or delete posts.
-- ===============================================

-- 1. Enable Row Level Security (RLS) on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any, to avoid conflicts
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Admin can manage all posts" ON public.posts;

-- 3. Policy: Public can read published posts
CREATE POLICY "Public can read published posts" 
    ON public.posts 
    FOR SELECT 
    USING (published = true);

-- 4. Policy: Admin can manage all posts (SELECT, INSERT, UPDATE, DELETE)
-- Only 'contact@proleadventures.com' can perform these actions
CREATE POLICY "Admin can manage all posts" 
    ON public.posts 
    FOR ALL 
    USING (auth.jwt() ->> 'email' = 'contact@proleadventures.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'contact@proleadventures.com');

-- 5. Revoke broad permissions just in case
REVOKE ALL ON public.posts FROM authenticated;

-- 6. Grant SELECT permission to both authenticated and anon (since it's a public blog)
-- RLS will handle the 'published' filtering
GRANT SELECT ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- 7. Grant all access to service_role (standard)
GRANT ALL ON public.posts TO service_role;

-- ===============================================
-- VALIDATION
-- ===============================================
-- To verify, run:
-- SELECT * FROM pg_policies WHERE tablename = 'posts';
