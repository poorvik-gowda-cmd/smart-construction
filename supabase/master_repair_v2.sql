-- FIXED MASTER REPAIR SCRIPT
DO $$ 
DECLARE 
    sarah_id UUID; 
BEGIN 
    -- 1. Get current Sarah ID
    SELECT id INTO sarah_id FROM public.profiles WHERE email = 'sarah.jenkins@sitemaster.com' LIMIT 1;

    IF sarah_id IS NOT NULL THEN
        -- Link orphaned complaints
        UPDATE public.complaints 
        SET to_engineer_id = sarah_id 
        WHERE to_engineer_id NOT IN (SELECT id FROM public.profiles) OR to_engineer_id IS NULL;

        -- Link orphaned site updates (Corrected column: user_id)
        UPDATE public.site_updates 
        SET user_id = sarah_id 
        WHERE user_id NOT IN (SELECT id FROM public.profiles) OR user_id IS NULL;

        -- Link orphaned assignments
        UPDATE public.engineer_client_assignments 
        SET engineer_id = sarah_id 
        WHERE engineer_id NOT IN (SELECT id FROM public.profiles) OR engineer_id IS NULL;
    END IF;
END $$;

-- 2. ENSURE CLIENT VISIBILITY
INSERT INTO public.engineer_client_assignments (client_id, engineer_id)
SELECT p_client.id, p_eng.id
FROM public.profiles p_client, public.profiles p_eng
WHERE p_client.role = 'client' AND p_eng.email = 'sarah.jenkins@sitemaster.com'
ON CONFLICT DO NOTHING;
