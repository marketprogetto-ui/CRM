-- ==========================================
-- FIX V14: REPAIR LOGIN & TRIGGERS
-- ==========================================

-- 1. DROP POTENTIAL BAD TRIGGERS ON AUTH.USERS
-- "Database error querying schema" on login often means an UPDATE trigger on auth.users failed
-- (Supabase updates last_sign_in_at on login).

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS status_update ON auth.users;

-- Drop associated functions to be safe (clean slate)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- 2. RECREATE SAFE PROFILE CREATION TRIGGER
-- We need a minimal, safe function that inserts only what exists.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'user' -- Default role, admin script overrides this later if needed
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 3. RE-BIND TRIGGER (Only for INSERT, not UPDATE)
-- Login only does UPDATE. We do NOT want a trigger on UPDATE unless necessary.
-- By only triggering on INSERT, we avoid breaking Login if the function is buggy.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. ENSURE PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- 5. RELOAD CONFIG
NOTIFY pgrst, 'reload config';
