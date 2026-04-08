-- 1. DEFINE SHARED SECURITY LOGIC
CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID) 
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Admins see all
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
    -- Engineers see their assignments
    EXISTS (
      SELECT 1 FROM public.project_assignments 
      WHERE project_id = p_id AND user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APPLY TO ALL OPERATIONAL TABLES
-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Engineer Attendance Access" ON public.attendance;
CREATE POLICY "Engineer Attendance Access" ON public.attendance FOR ALL TO authenticated USING (public.can_manage_project(project_id)) WITH CHECK (public.can_manage_project(project_id));

-- Labor
ALTER TABLE public.labor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Engineer Labor Access" ON public.labor;
CREATE POLICY "Engineer Labor Access" ON public.labor FOR ALL TO authenticated USING (public.can_manage_project(project_id)) WITH CHECK (public.can_manage_project(project_id));

-- Materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Engineer Materials Access" ON public.materials;
CREATE POLICY "Engineer Materials Access" ON public.materials FOR ALL TO authenticated USING (public.can_manage_project(project_id)) WITH CHECK (public.can_manage_project(project_id));

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Engineer Expenses Access" ON public.expenses;
CREATE POLICY "Engineer Expenses Access" ON public.expenses FOR ALL TO authenticated USING (public.can_manage_project(project_id)) WITH CHECK (public.can_manage_project(project_id));

-- 3. ENSURE PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.labor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated;
