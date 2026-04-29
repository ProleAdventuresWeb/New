-- ===============================================
-- PROLE ADVENTURES — STORAGE SECURITY HARDENING
-- ===============================================
-- Only the admin (contact@proleadventures.com) can 
-- write/delete image assets from the 'post-images' bucket.
-- ===============================================

-- Ensure Row Level Security (RLS) is enabled on storage.objects
-- Note: Supabase enables this by default, but we'll be safe.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing broad policies on storage.objects if they might conflict
DROP POLICY IF EXISTS "Public can read post images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage post images" ON storage.objects;

-- 2. Create the fine-grained SELECT policy for public
-- Anyone (anon + authenticated) can read from 'post-images' bucket
CREATE POLICY "Public can read post images"
    ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'post-images');

-- 3. Create the admin-only write policy
-- Only 'contact@proleadventures.com' can perform these actions
CREATE POLICY "Admin can manage post images"
    ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'post-images' 
        AND auth.jwt() ->> 'email' = 'contact@proleadventures.com'
    )
    WITH CHECK (
        bucket_id = 'post-images' 
        AND auth.jwt() ->> 'email' = 'contact@proleadventures.com'
    );

-- 4. Verification
-- Verify these entries in the Supabase Dashboard under Storage -> Policies.
