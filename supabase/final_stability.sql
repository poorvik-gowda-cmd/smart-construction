-- 1. SYNC ROLES TO AUTH METADATA (The Supabase Way)
-- This puts the role directly into the JWT so we don't need to query the table during RLS
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN (SELECT id, role FROM public.profiles) LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', u.role)
        WHERE id = u.id;
    END LOOP;
END $$;

-- 2. UPDATE SECURITY RULES TO USE THE JWT (No Loops!)
DROP POLICY IF EXISTS "Unified Profile Access" ON public.profiles;

CREATE POLICY "JWT Based Access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  id = auth.uid() OR                           -- I can see myself
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' -- Admins can see everyone
)
WITH CHECK (
  id = auth.uid() OR                           -- I can edit myself
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' -- Admins can edit everyone
);

-- 3. ENSURE ANON ACCESS FOR LOGIN
DROP POLICY IF EXISTS "Allow anon to check engineer keys" ON public.profiles;
CREATE POLICY "Allow anon to check engineer keys" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (role = 'engineer');
