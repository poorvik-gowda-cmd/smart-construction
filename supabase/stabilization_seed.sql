-- ==========================================
-- SITE STABILIZATION SEED
-- ==========================================

-- 1. Add Mock Engineers to PROFILES 
-- These IDs are consistent with the auth system
INSERT INTO public.profiles (id, full_name, role, pending_assignment)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Arjun Mehta', 'engineer', false),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sarah Jenkins', 'engineer', false),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Viktor Volkov', 'engineer', false)
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  pending_assignment = EXCLUDED.pending_assignment;

-- 2. Ensure Storage Policies are PERMISSIVE (Development Mode)
-- We already disabled RLS on tables, but Storage needs explicit policies if RLS is on for buckets.
-- Let's just make sure buckets exist and are public.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-updates', 'site-updates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow all operations for now to unblock the user
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- 3. Confirm Client visibility
-- Ensure at least one client is "Pending" for testing
INSERT INTO public.profiles (id, full_name, role, pending_assignment)
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manoj Das', 'client', true)
ON CONFLICT (id) DO UPDATE SET pending_assignment = true;
