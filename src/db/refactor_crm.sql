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

-- 5. Add delivery_opportunity_id to Activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS delivery_opportunity_id uuid REFERENCES delivery_opportunities(id);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_stage_updated ON opportunities(pipeline_id, stage_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_delivery_opportunities_pipeline ON delivery_opportunities(pipeline_id);

-- 7. Upsert Pipelines (Ensure slugs exist)
INSERT INTO pipelines (name, slug) VALUES 
('Comercial', 'commercial'),
('Entrega', 'delivery')
ON CONFLICT (slug) DO NOTHING;

-- 8. Storage Bucket Setup (Proposals)
-- Create a public bucket named 'proposals'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proposals', 'proposals', true) 
ON CONFLICT (id) DO NOTHING;

-- Standard RLS Policies for the 'proposals' bucket
-- Allow public read access (matches getPublicUrl usage in code)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'proposals');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'proposals' AND auth.role() = 'authenticated');

-- Allow authenticated users to update/delete their uploads (optional foundation security)
CREATE POLICY "Owner Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'proposals' AND auth.uid() = owner);
