-- ==========================================
-- REFACTOR V12: NUCLEAR RESET FOR DELIVERY
-- ==========================================

-- 1. DROP TABLE (Start Fresh)
DROP TABLE IF EXISTS payment_instructions CASCADE;
DROP TABLE IF EXISTS delivery_opportunities CASCADE;

-- 2. CREATE TABLE (With ALL required columns)
CREATE TABLE delivery_opportunities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Keys
    pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
    stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable to prevent blocking
    commercial_opportunity_id uuid, -- Nullable for standalone creation
    account_id uuid, -- Nullable
    primary_contact_id uuid, -- Nullable
    
    -- Data Fields
    title text NOT NULL,
    status text DEFAULT 'active', -- 'active', 'won', 'lost'
    priority text DEFAULT 'medium', -- 'low', 'medium', 'high'
    
    -- Finance (All variations to satisfy frontend queries)
    amount_estimated numeric DEFAULT 0,
    amount_offered numeric DEFAULT 0,
    amount_final numeric DEFAULT 0,
    
    -- Metadata
    billing_status text DEFAULT 'pending',
    source text,
    proposal_sent_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. PERMISSIONS (RLS) - Permissive Mode
ALTER TABLE delivery_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "V12 Access All" ON delivery_opportunities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. RECREATE PAYMENT INSTRUCTIONS (Dependency)
CREATE TABLE payment_instructions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_opportunity_id uuid REFERENCES delivery_opportunities(id) ON DELETE CASCADE,
    commercial_opportunity_id uuid,
    seller_amount numeric,
    supplier_amount numeric,
    installer_amount numeric,
    total_amount numeric,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "V12 Payment Access" ON payment_instructions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. RELOAD API
NOTIFY pgrst, 'reload config';
