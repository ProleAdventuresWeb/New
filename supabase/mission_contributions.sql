-- Create mission_contributions table
CREATE TABLE IF NOT EXISTS mission_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id TEXT NOT NULL,
    mission_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    customer_email TEXT NOT NULL,
    stripe_session_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mission_contributions ENABLE ROW LEVEL SECURITY;

-- Allow service role access (webhook usage)
CREATE POLICY "Service role has full access to contributions" ON mission_contributions
FOR ALL USING (auth.uid() IS NULL);
