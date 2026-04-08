-- 1. CLEANUP OLD CONFLICTING POLICIES
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage anything" ON public.profiles;

-- 2. CREATE A ROBUST UNIFIED POLICY
-- This single policy covers both self-management and administrative oversight
CREATE POLICY "Unified Profile Access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  id = auth.uid() OR 
  public.is_admin()
)
WITH CHECK (
  id = auth.uid() OR 
  public.is_admin()
);

-- 3. ENSURE ADMIN IS_ADMIN HELPER IS STABLE
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  -- Use a direct check that avoids RLS loops
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FINAL PERMISSIONS SYNC
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
