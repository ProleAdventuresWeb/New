-- =============================================
-- PROLE ADVENTURES — SHOP SCHEMA MIGRATION
-- =============================================
-- Run this in Supabase SQL Editor in order.
-- This extends the existing database with ecommerce tables.
-- Existing tables (orders, mission_contributions, adventures, subscribers) are preserved.
-- =============================================

-- =============================================
-- 1. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role full access to profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Revoke execute from public roles to prevent direct RPC execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- =============================================
-- 2. ADDRESSES
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'default',          -- 'default', 'home', 'work', etc.
    address_type TEXT NOT NULL DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing')),
    full_name TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    line3 TEXT,
    city TEXT NOT NULL,
    county TEXT,
    postcode TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'GB',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_addresses_profile ON addresses(profile_id);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
    ON addresses FOR ALL
    USING (auth.uid() = profile_id);

CREATE POLICY "Service role full access to addresses"
    ON addresses FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 3. PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'merch',
    base_price_pence INTEGER NOT NULL,     -- price in pence
    currency TEXT NOT NULL DEFAULT 'gbp',
    image_url TEXT,
    printful_product_id TEXT,              -- Printful sync ID
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can browse active products
CREATE POLICY "Public can read active products"
    ON products FOR SELECT
    USING (active = true);

CREATE POLICY "Service role full access to products"
    ON products FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 4. PRODUCT VARIANTS
-- =============================================
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    printful_variant_id TEXT,               -- Printful variant sync ID
    name TEXT NOT NULL,                     -- e.g. "Black / Large"
    attributes JSONB DEFAULT '{}',          -- e.g. {"colour": "black", "size": "L"}
    price_override_pence INTEGER,           -- null = use base_price
    stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'printful_managed')),
    image_url TEXT,                         -- variant-specific image
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_printful ON product_variants(printful_variant_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active variants"
    ON product_variants FOR SELECT
    USING (active = true);

CREATE POLICY "Service role full access to variants"
    ON product_variants FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 5. ORDERS (replaces existing flat orders table)
-- =============================================
-- NOTE: Run ALTER on existing orders table or drop and recreate.
-- This creates a new shop_orders table to avoid breaking existing data.
-- Migrate data from old `orders` table manually if needed.
CREATE TABLE IF NOT EXISTS shop_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,      -- human-readable, e.g. PA-000001
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- null = guest
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'
    )),
    subtotal_pence INTEGER NOT NULL DEFAULT 0,
    shipping_pence INTEGER NOT NULL DEFAULT 0,
    total_pence INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'gbp',
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    shipping_address JSONB,                 -- snapshot at time of order
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_shop_orders_profile ON shop_orders(profile_id);
CREATE INDEX idx_shop_orders_email ON shop_orders(email);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_orders_stripe ON shop_orders(stripe_checkout_session_id);
CREATE INDEX idx_shop_orders_number ON shop_orders(order_number);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON shop_orders FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Service role full access to orders"
    ON shop_orders FOR ALL
    USING (auth.role() = 'service_role');

-- Auto-generate order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'PA-' || LPAD(nextval('public.order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_order_number ON shop_orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON shop_orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Revoke execute from public roles to prevent direct RPC execution
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;


-- =============================================
-- 6. ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,             -- snapshot
    variant_name TEXT,                      -- snapshot
    sku TEXT,                               -- snapshot
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_pence INTEGER NOT NULL,
    total_pence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shop_orders
            WHERE shop_orders.id = order_items.order_id
            AND shop_orders.profile_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to order items"
    ON order_items FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 7. PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    amount_pence INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
    )),
    refund_amount_pence INTEGER DEFAULT 0,
    payment_method TEXT,                    -- 'card', 'paypal', etc.
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shop_orders
            WHERE shop_orders.id = payments.order_id
            AND shop_orders.profile_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to payments"
    ON payments FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 8. FULFILMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS fulfilments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    printful_order_id TEXT,
    printful_status TEXT,                   -- raw Printful status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'created', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed'
    )),
    carrier TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    estimated_delivery TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fulfilments_order ON fulfilments(order_id);
CREATE INDEX idx_fulfilments_printful ON fulfilments(printful_order_id);

ALTER TABLE fulfilments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fulfilments"
    ON fulfilments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shop_orders
            WHERE shop_orders.id = fulfilments.order_id
            AND shop_orders.profile_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to fulfilments"
    ON fulfilments FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 9. SHIPPING EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS shipping_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfilment_id UUID NOT NULL REFERENCES fulfilments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_shipping_events_fulfilment ON shipping_events(fulfilment_id);

ALTER TABLE shipping_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shipping events"
    ON shipping_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM fulfilments
            JOIN shop_orders ON shop_orders.id = fulfilments.order_id
            WHERE fulfilments.id = shipping_events.fulfilment_id
            AND shop_orders.profile_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to shipping events"
    ON shipping_events FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 10. EMAIL EVENTS (transactional email log)
-- =============================================
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES shop_orders(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template TEXT NOT NULL,                 -- 'order_confirmed', 'shipping_update', etc.
    provider TEXT NOT NULL DEFAULT 'brevo',
    provider_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
    sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_email_events_order ON email_events(order_id);
CREATE INDEX idx_email_events_profile ON email_events(profile_id);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email events"
    ON email_events FOR SELECT
    USING (auth.uid() = profile_id);

-- Service role does not need an explicit policy because it naturally bypasses RLS in Supabase.
-- This prevents the "RLS Policy Always True" linter warning.


-- =============================================
-- 11. WEBHOOK EVENTS (idempotency log)
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,                 -- 'stripe', 'printful'
    event_id TEXT NOT NULL,                 -- provider's event ID
    event_type TEXT NOT NULL,               -- 'checkout.session.completed', etc.
    processed BOOLEAN DEFAULT false,
    raw_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(provider, event_id)
);

CREATE INDEX idx_webhook_events_lookup ON webhook_events(provider, event_id);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role should access webhook events
-- Service role does not need an explicit policy because it naturally bypasses RLS in Supabase.
-- This prevents the "RLS Policy Always True" linter warning.


-- =============================================
-- 12. EMAIL SIGNUPS (clean separation)
-- =============================================
-- Note: The existing 'subscribers' table may still be in use.
-- This creates a proper email_signups table for future use.
-- Migrate data from subscribers if appropriate.
CREATE TABLE IF NOT EXISTS email_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website',          -- 'website', 'checkout', 'footer', etc.
    subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    unsubscribed_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true
);

CREATE INDEX idx_email_signups_email ON email_signups(email);

ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (for signup forms)
CREATE POLICY "Anyone can subscribe"
    ON email_signups FOR INSERT
    TO anon
    WITH CHECK (email IS NOT NULL);

CREATE POLICY "Service role full access to email signups"
    ON email_signups FOR ALL
    USING (auth.role() = 'service_role');


-- =============================================
-- 13. DONATION EVENTS (reporting separation)
-- =============================================
-- Keep mission_contributions as-is.
-- This view provides clean reporting separation.
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
    'shop' AS revenue_type,
    so.id AS reference_id,
    so.email,
    so.total_pence AS amount_pence,
    so.currency,
    so.status,
    so.created_at
FROM shop_orders so
WHERE so.status IN ('paid', 'processing', 'fulfilled', 'shipped', 'delivered')

UNION ALL

SELECT
    'contribution' AS revenue_type,
    mc.id AS reference_id,
    mc.customer_email AS email,
    (mc.amount * 100)::INTEGER AS amount_pence,
    mc.currency,
    mc.status,
    mc.created_at
FROM mission_contributions mc
WHERE mc.status = 'paid';


-- =============================================
-- 14. UPDATED_AT TRIGGER (reusable)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'profiles', 'addresses', 'products', 'product_variants',
            'shop_orders', 'payments', 'fulfilments'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', t, t);
    END LOOP;
END $$;


-- =============================================
-- 15. GRANT PERMISSIONS
-- =============================================
-- Ensure anon can read products (for browsing)
GRANT SELECT ON products TO anon;
GRANT SELECT ON product_variants TO anon;
GRANT INSERT ON email_signups TO anon;

-- Authenticated users get their RLS-filtered access
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT ALL ON addresses TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON product_variants TO authenticated;
GRANT SELECT ON shop_orders TO authenticated;
GRANT SELECT ON order_items TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON fulfilments TO authenticated;
GRANT SELECT ON shipping_events TO authenticated;
GRANT SELECT ON email_events TO authenticated;

-- Service role gets everything (for webhooks/API)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
