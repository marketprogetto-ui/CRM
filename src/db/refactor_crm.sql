-- Migration Refactor CRM

-- 1. Create Delivery Opportunities Table
CREATE TABLE IF NOT EXISTS delivery_opportunities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    commercial_opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
    title text NOT NULL,
    owner_id uuid REFERENCES auth.users(id),
    account_id uuid,
    primary_contact_id uuid,
    amount_final numeric,
    expected_install_at timestamptz,
    stage_id uuid REFERENCES stages(id),
    pipeline_id uuid REFERENCES pipelines(id),
    billing_status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create Payment Instructions Table
CREATE TABLE IF NOT EXISTS payment_instructions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    commercial_opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
    delivery_opportunity_id uuid REFERENCES delivery_opportunities(id) ON DELETE SET NULL,
    seller_amount numeric DEFAULT 0,
    supplier_amount numeric DEFAULT 0,
    installer_amount numeric DEFAULT 0,
    total_amount numeric DEFAULT 0,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enhance Proposals Table (for file uploads)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_link text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- 4. Add proposal_sent_at to Opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz;

-- 5. Create Storage Bucket for Proposals (User must do this in Dashboard, but we can try via SQL if extension enabled)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('proposals', 'proposals', false) ON CONFLICT DO NOTHING;
-- (Usually requires specific permissions, better to instruct user)

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_stage_updated ON opportunities(pipeline_id, stage_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_delivery_opportunities_pipeline ON delivery_opportunities(pipeline_id);

-- 7. Upsert Pipelines (Ensure slugs exist)
INSERT INTO pipelines (name, slug) VALUES 
('Comercial', 'commercial'),
('Entrega', 'delivery')
ON CONFLICT (slug) DO NOTHING;

-- 8. Upsert Stages (This needs to be handled carefully to not duplicate if IDs differ, usually matched by slug/pipeline)
-- We will assume the user runs a script or manually updates stages to match the requirement:
-- Commercial: prospecting (25%), qualification (25%), visit_measurement_proposal (25%), negotiation_closing (25%)
-- Delivery: measurement_scheduling (25%), production_transit (25%), installation (25%), completed (25%)
-- (The percentages seem to be Probability for Commercial and Progress for Delivery)
