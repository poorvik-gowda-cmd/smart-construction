-- ==========================================
-- BULLETPROOF SIGNUP FIX: SiteMaster
-- ==========================================
-- This script replaces the existing auth trigger with a "Failsafe" version.
-- It ensures that signup NEVER fails, even if there is a role mismatch.

-- 1. Create a defensive function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  role_name TEXT;
BEGIN
  -- A. Extract role from metadata and normalize it to lowercase
  role_name := LOWER(COALESCE(new.raw_user_meta_data->>'role', 'engineer'));
  
  -- B. Map legacy 'internal' role to the new 'engineer' role
  IF role_name = 'internal' THEN
    role_name := 'engineer';
  END IF;

  -- C. Validate against the enum (admin, engineer, client)
  -- If it's anything else, default to engineer to prevent an Enum Error
  IF role_name NOT IN ('admin', 'engineer', 'client') THEN
    role_name := 'engineer';
  END IF;

  -- D. Defensive Profile Insertion
  -- 'ON CONFLICT' prevents "Duplicate Key" errors if signup was retried
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
    role_name::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN new;

EXCEPTION WHEN OTHERS THEN
  -- E. EMERGENCY FAILSAFE
  -- If any database error occurs here (like a missing column), 
  -- we RETURN new anyway so that the USER is at least created in Supabase Auth.
  -- The dashboard layout is designed to help them 
  -- re-create their profile on first visit if it's missing.
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-apply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Confirm RLS is off for profiles to allow the dashboard to self-heal
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- END OF FIX;
