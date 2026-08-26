-- =========================================================================
-- PROLE ADVENTURES — DATABASE TABLES & PERMISSIONS REPAIR
-- =========================================================================
-- Automatically creates `profiles` (and any other missing tables)
-- and grants full access to both anon and authenticated roles.
-- =========================================================================

-- 1. PROFILES TABLE (Extends auth.users for login / user accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. ADVENTURES TABLE
CREATE TABLE IF NOT EXISTS public.adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    codename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scouting',
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    lat NUMERIC(10,7) NOT NULL DEFAULT 51.5074,
    lng NUMERIC(10,7) NOT NULL DEFAULT -0.1278,
    bounty_target NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    bounty_current NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    reward_type TEXT,
    reward_title TEXT,
    reward_description TEXT,
    reward_delivery_mode TEXT,
    reward_url TEXT,
    is_reward_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. POSTS TABLE
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

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variants') THEN
        ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Adventures
DROP POLICY IF EXISTS "Public and auth can view adventures" ON public.adventures;
DROP POLICY IF EXISTS "Public can view adventures" ON public.adventures;
CREATE POLICY "Public and auth can view adventures" ON public.adventures FOR SELECT TO anon, authenticated USING (true);

-- Posts
DROP POLICY IF EXISTS "Public and auth can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Admin can manage all posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
CREATE POLICY "Public and auth can read published posts" ON public.posts FOR SELECT TO anon, authenticated 
    USING (published = true OR auth.jwt() ->> 'email' = 'contact@proleadventures.com');
CREATE POLICY "Admin can manage all posts" ON public.posts FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'contact@proleadventures.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'contact@proleadventures.com');

-- Products & Variants (if present)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        DROP POLICY IF EXISTS "Public and auth can read active products" ON public.products;
        CREATE POLICY "Public and auth can read active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variants') THEN
        DROP POLICY IF EXISTS "Public and auth can read active variants" ON public.product_variants;
        CREATE POLICY "Public and auth can read active variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (active = true);
    END IF;
END $$;

-- 6. Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.adventures TO anon, authenticated;
GRANT ALL ON public.adventures TO service_role;

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT ALL ON public.posts TO service_role;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        GRANT SELECT ON public.products TO anon, authenticated;
        GRANT ALL ON public.products TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variants') THEN
        GRANT SELECT ON public.product_variants TO anon, authenticated;
        GRANT ALL ON public.product_variants TO service_role;
    END IF;
END $$;
