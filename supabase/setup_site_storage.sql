-- Ensure site-updates bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-updates', 'site-updates', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove old policies to prevent duplicates
DROP POLICY IF EXISTS "Public Select Updates" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Updates" ON storage.objects;

-- Create clean policies
CREATE POLICY "Public Select Updates" ON storage.objects 
FOR SELECT USING (bucket_id = 'site-updates');

CREATE POLICY "Public Insert Updates" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'site-updates');
