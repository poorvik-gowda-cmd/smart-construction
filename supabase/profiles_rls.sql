-- Allow authenticated users to upsert their own profiles
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Delete old policy if it exists
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

-- Create comprehensive policy
CREATE POLICY "Users can manage own profile" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);
