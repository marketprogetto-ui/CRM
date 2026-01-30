-- ==========================================
-- FIX LOST STAGE VISIBILITY & LOSS REASON (V6)
-- ==========================================

-- 1. ADD LOSS REASON COLUMN
-- We need to store why an opportunity was lost.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS loss_reason text;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS loss_details text;

-- 2. UPDATE STAGE POSITION
-- Make 'closed_lost' visible (Position 6, assuming Won is 5)
UPDATE stages 
SET position = 6 
WHERE slug = 'closed_lost';

-- 3. ENSURE WON IS 5 (Safety)
UPDATE stages 
SET position = 5 
WHERE slug = 'closed_won';
