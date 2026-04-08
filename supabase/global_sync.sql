-- GLOBAL PROJECT SYNC: Restore visibility for all projects
DO $$ 
DECLARE 
    sarah_id UUID; 
BEGIN 
    -- 1. Get current Sarah ID
    SELECT id INTO sarah_id FROM public.profiles WHERE email = 'sarah.jenkins@sitemaster.com' LIMIT 1;

    IF sarah_id IS NOT NULL THEN
        -- Cleanup broken assignments
        DELETE FROM public.project_assignments 
        WHERE user_id NOT IN (SELECT id FROM public.profiles);

        -- Mass Link: Assign Sarah Jenkins to EVERY project currently unassigned
        INSERT INTO public.project_assignments (project_id, user_id)
        SELECT p.id, sarah_id
        FROM public.projects p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.project_assignments pa 
            WHERE pa.project_id = p.id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 2. Audit: Ensure every project has at least one assignment
-- This counts projects that are still invisible (should be 0)
SELECT COUNT(*) as invisible_projects 
FROM public.projects p 
WHERE NOT EXISTS (SELECT 1 FROM public.project_assignments pa WHERE pa.project_id = p.id);
