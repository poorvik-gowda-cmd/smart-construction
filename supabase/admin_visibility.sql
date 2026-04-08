-- 1. UNLOCK ADMIN VISIBILITY: Allow admins to manage all profiles
-- We use a subquery check that avoids direct recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. ENSURE CLIENTS ARE MARKED AS PENDING
-- If a client exists but has no assignment yet, make sure they are in the "pending" list
UPDATE public.profiles 
SET pending_assignment = true 
WHERE role = 'client' 
AND id NOT IN (SELECT client_id FROM public.engineer_client_assignments);

-- 3. FIX ENGINEER DROPDOWN: Ensure roles are correctly capitalized and set
-- The frontend expects lowercase 'engineer' and 'client'
UPDATE public.profiles SET role = LOWER(role);
