-- OPTIMIZE PERFORMANCE (INDEXES)
-- Execute this to improve query speed on pipelines

-- 1. Index for Opportunities by Pipeline + Stage (Filters mostly used in Kanban)
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_stage 
ON opportunities(pipeline_id, stage_id);

-- 2. Index for Delivery Opportunities by Pipeline + Stage
CREATE INDEX IF NOT EXISTS idx_delivery_opportunities_pipeline_stage 
ON delivery_opportunities(pipeline_id, stage_id);

-- 3. Update existing indexes if necessary (or just ensure they exist)
-- idx_opportunities_pipeline_stage_updated was created in refactor_crm.sql
-- We add owner_id index as it's often joined
CREATE INDEX IF NOT EXISTS idx_opportunities_owner 
ON opportunities(owner_id);

CREATE INDEX IF NOT EXISTS idx_delivery_opportunities_owner 
ON delivery_opportunities(owner_id);

-- 4. Index for Activities due_at (Sorting activities)
CREATE INDEX IF NOT EXISTS idx_activities_due_at 
ON activities(due_at);

-- 5. Index for Proposals by Opportunity (Fetching proposals)
CREATE INDEX IF NOT EXISTS idx_proposals_opportunity 
ON proposals(opportunity_id);

-- 6. Index for Activities by Linked Entity
CREATE INDEX IF NOT EXISTS idx_activities_opportunity 
ON activities(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_activities_delivery_opportunity 
ON activities(delivery_opportunity_id);

SELECT 'Indexes created for performance optimization.' as status;
