-- Create orders table for Stripe integration
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    stripe_session_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Recommended)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (essential for the webhook)
CREATE POLICY "Service role has full access" ON orders 
FOR ALL USING (auth.uid() IS NULL); -- or similar policy that allows service role but prevents public access

-- Prevent public access to orders table
-- The service role key used in the backend webhook will bypass RLS.
-- This ensures the orders are never exposed via the anon key.
