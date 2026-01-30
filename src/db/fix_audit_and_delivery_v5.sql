-- ==========================================
-- FIX AUDIT LOGS & DELIVERY VISIBILITY (V5)
-- ==========================================

-- 1. AUDIT LOG SYSTEM
-- Create a centralized activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    entity_type text NOT NULL, -- 'opportunity', 'delivery', 'system'
    entity_id uuid,
    action text NOT NULL, -- 'create', 'update', 'delete', 'move_stage'
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read logs" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger Function to Auto-Log Changes
CREATE OR REPLACE FUNCTION public.log_opportunity_changes()
RETURNS TRIGGER AS $$
DECLARE
    actor_id uuid;
    payload jsonb;
    action_type text;
BEGIN
    actor_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        action_type := 'create';
        payload := jsonb_build_object('title', NEW.title, 'value', NEW.amount_final);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
            action_type := 'move_stage';
            payload := jsonb_build_object('from', OLD.stage_id, 'to', NEW.stage_id);
        ELSE
            action_type := 'update';
            payload := jsonb_build_object('changes', 'details_updated');
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'delete';
        payload := jsonb_build_object('old_title', OLD.title);
    END IF;

    INSERT INTO activity_logs (user_id, entity_type, entity_id, action, details)
    VALUES (actor_id, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), action_type, payload);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers to Commercial and Delivery Opportunities
DROP TRIGGER IF EXISTS audit_opportunities ON opportunities;
CREATE TRIGGER audit_opportunities
AFTER INSERT OR UPDATE OR DELETE ON opportunities
FOR EACH ROW EXECUTE FUNCTION log_opportunity_changes();

DROP TRIGGER IF EXISTS audit_delivery ON delivery_opportunities;
CREATE TRIGGER audit_delivery
AFTER INSERT OR UPDATE OR DELETE ON delivery_opportunities
FOR EACH ROW EXECUTE FUNCTION log_opportunity_changes();


-- 2. FIX DELIVERY VISIBILITY (Nuclear Fix for Owner/Profile Join)
-- Sometimes RLS on 'profiles' prevents joining. We allow reading profiles public/auth.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT TO authenticated, anon USING (true);

-- Ensure delivery_opportunities is readable
DROP POLICY IF EXISTS "Enable read access for all users" ON delivery_opportunities;
CREATE POLICY "Enable read access for all users" ON delivery_opportunities FOR SELECT TO authenticated USING (true);


-- 3. ENSURE DELIVERY STAGE IS CORRECT
-- Fix any delivery opportunity that might have a wrong stage_id (orphaned)
DO $$
DECLARE
    sched_stage_id uuid;
BEGIN
    SELECT id INTO sched_stage_id FROM stages 
    JOIN pipelines ON stages.pipeline_id = pipelines.id 
    WHERE pipelines.slug = 'delivery' AND stages.slug = 'scheduling' LIMIT 1;

    IF sched_stage_id IS NOT NULL THEN
        UPDATE delivery_opportunities 
        SET stage_id = sched_stage_id 
        WHERE stage_id IS NULL OR stage_id NOT IN (SELECT id FROM stages);
    END IF;
END $$;
