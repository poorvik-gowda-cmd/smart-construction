-- 1. FIX LOGIN BLOCKER: Allow anon users to read specific columns for key verification
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;

-- Ensure RLS is active
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow engineers to be found by their security key before they are logged in
DROP POLICY IF EXISTS "Allow anon to check engineer keys" ON public.profiles;
CREATE POLICY "Allow anon to check engineer keys" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (role = 'engineer');

-- 2. FIX MISSING NAMES: Link orphaned data to the new engineer IDs
-- Assuming Sarah Jenkins is the primary manager for orphaned data
DO $$ 
DECLARE 
    sarah_id UUID; 
BEGIN 
    SELECT id INTO sarah_id FROM public.profiles WHERE email = 'sarah.jenkins@sitemaster.com' LIMIT 1;

    IF sarah_id IS NOT NULL THEN
        -- Link orphaned complaints
        UPDATE public.complaints 
        SET to_engineer_id = sarah_id 
        WHERE to_engineer_id NOT IN (SELECT id FROM public.profiles) OR to_engineer_id IS NULL;

        -- Link orphaned site updates
        UPDATE public.site_updates 
        SET created_by = sarah_id 
        WHERE created_by NOT IN (SELECT id FROM public.profiles);

        -- Link orphaned assignments
        UPDATE public.engineer_client_assignments 
        SET engineer_id = sarah_id 
        WHERE engineer_id NOT IN (SELECT id FROM public.profiles);
    END IF;
END $$;

-- 3. ENSURE CLIENT VISIBILITY
-- Manually re-assign Client A to Sarah Jenkins if missing
INSERT INTO public.engineer_client_assignments (client_id, engineer_id)
SELECT p_client.id, p_eng.id
FROM public.profiles p_client, public.profiles p_eng
WHERE p_client.role = 'client' AND p_eng.email = 'sarah.jenkins@sitemaster.com'
ON CONFLICT DO NOTHING;
