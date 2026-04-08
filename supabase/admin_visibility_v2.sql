-- 1. CREATE SECURITY HELPER (Avoids Recursion)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-APPLY POLICY USING HELPER
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- 3. ENSURE PERMISSIONS
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 4. ENSURE CLIENTS ARE PENDING
UPDATE public.profiles 
SET pending_assignment = true 
WHERE role = 'client' 
AND id NOT IN (SELECT client_id FROM public.engineer_client_assignments);
