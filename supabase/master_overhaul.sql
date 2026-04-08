-- ==========================================
-- SITEMASTER: MASTER DATABASE OVERHAUL SCRIPT
-- ==========================================
-- INSTRUCTIONS: Run this entire script in your Supabase SQL Editor.
-- This will wipe all existing public tables and create a fresh, 
-- production-aligned schema with mock data and public storage.

-- 1. CLEAN START: Drop all existing public tables and types
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS issue_severity CASCADE;
DROP TYPE IF EXISTS issue_status CASCADE;

-- 2. DEFINE TYPES
CREATE TYPE user_role AS ENUM ('admin', 'engineer', 'client');
CREATE TYPE project_status AS ENUM ('planned', 'ongoing', 'on_hold', 'completed', 'delayed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'overtime');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status AS ENUM ('open', 'acknowledged', 'in_progress', 'resolved', 'closed');

-- 3. CORE TABLES

-- 3.1 Profiles (Extended User Data)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'engineer',
    company_id TEXT, -- For Engineer specific login
    project_id UUID, -- Fast reference for clients/engineers
    pending_assignment BOOLEAN DEFAULT false, -- For new clients
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 Projects
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'ongoing',
    budget NUMERIC(15, 2) DEFAULT 0.0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.3 Assignments
CREATE TABLE public.project_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

CREATE TABLE public.engineer_client_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    engineer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, project_id)
);

-- 3.4 Operational Data (Labor, Attendance, Materials)
CREATE TABLE public.labor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    skill_tag TEXT, -- 'Safety', 'Mason', 'Electrician'
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    daily_rate NUMERIC(10, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    labor_id UUID REFERENCES public.labor(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'present',
    overtime_hours NUMERIC(4, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT, -- 'Bags', 'Metric Tons', 'Sq Ft'
    stock_level NUMERIC(12, 2) DEFAULT 0,
    reorder_point NUMERIC(12, 2) DEFAULT 10,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.5 Suppliers & Procurement
CREATE TABLE public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info TEXT,
    material_tags TEXT[], -- Array of strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.purchase_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.6 Financials
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    category TEXT, -- 'Labor', 'Material', 'Safety', 'Equipment'
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.7 Site Logs (Map Feature)
CREATE TABLE public.site_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    notes TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    client_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.8 Feedback & Safety
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'Blueprint', 'Invoice', 'Permit'
    category TEXT DEFAULT 'Other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.safety_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity issue_severity DEFAULT 'medium',
    status issue_status DEFAULT 'open',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    from_client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status issue_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SECURITY (Disable RLS for Dev)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_client_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;

-- 5. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('site-updates', 'site-updates', true),
    ('documents', 'documents', true),
    ('safety-reports', 'safety-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public Access policies for Buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('site-updates', 'documents', 'safety-reports'));
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('site-updates', 'documents', 'safety-reports'));

-- 6. AUTH AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), COALESCE((new.raw_user_meta_data->>'role')::user_role, 'engineer'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. MOCK DATA (5-6 Rows per table)
-- Note: Profiles and Assignments are omitted here as they require live auth.users IDs.
-- They will be populated as you use the application.

-- 7.1 Projects
INSERT INTO public.projects (id, name, description, status, budget, progress_percent, location_lat, location_lng)
VALUES
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Skyline Apartments', '20-story residential complex in Whitefield.', 'ongoing', 15000000, 45, 12.9716, 77.5946),
    ('8d5f32a1-7c45-4b21-8e99-521473669143', 'Mega Mall Extension', 'Adding a new wing to Phoenix Marketcity.', 'planned', 8000000, 5, 12.9916, 77.6846),
    ('9e2a44b2-8d56-4c32-9f01-632584770254', 'Highway Bridge B-42', 'Infrastructure upgrade over the Outer Ring Road.', 'delayed', 12000000, 30, 13.0416, 77.6146),
    ('0f3b55c3-9e67-4d43-a012-743695881365', 'Tech Park Zeta', 'Modern IT workspace with sustainable energy.', 'ongoing', 25000000, 65, 12.9216, 77.6746),
    ('1a4c66d4-0f78-4e54-b123-854706992476', 'Sunset Villas', 'Exclusive gated community of 15 premium villas.', 'on_hold', 5000000, 15, 13.1116, 77.5346);

-- 7.2 Labor
INSERT INTO public.labor (id, full_name, skill_tag, project_id, daily_rate)
VALUES
    ('2b5d77e5-1a89-4f65-c234-965817003587', 'Manoj Das', 'Safety Specialist', '7c9e13d9-6012-4c2d-9475-430985227092', 1200),
    ('3c6e88f6-2b90-4076-d345-076928114698', 'Rahul Verma', 'Electrician', '7c9e13d9-6012-4c2d-9475-430985227092', 1000),
    ('4d7f9907-3c01-4187-e456-187039225709', 'Suresh Raina', 'Mason', '7c9e13d9-6012-4c2d-9475-430985227092', 800),
    ('5e8a0a18-4d12-4298-f567-298140336810', 'Pritam Jha', 'Plumber', '7c9e13d9-6012-4c2d-9475-430985227092', 950),
    ('6f9b1b29-5e23-43a9-0678-309251447921', 'John Doe', 'General Labor', '7c9e13d9-6012-4c2d-9475-430985227092', 600);

-- 7.3 Attendance
INSERT INTO public.attendance (labor_id, project_id, date, status, overtime_hours)
VALUES
    ('2b5d77e5-1a89-4f65-c234-965817003587', '7c9e13d9-6012-4c2d-9475-430985227092', CURRENT_DATE - 4, 'present', 0),
    ('2b5d77e5-1a89-4f65-c234-965817003587', '7c9e13d9-6012-4c2d-9475-430985227092', CURRENT_DATE - 3, 'present', 2),
    ('2b5d77e5-1a89-4f65-c234-965817003587', '7c9e13d9-6012-4c2d-9475-430985227092', CURRENT_DATE - 2, 'present', 0),
    ('2b5d77e5-1a89-4f65-c234-965817003587', '7c9e13d9-6012-4c2d-9475-430985227092', CURRENT_DATE - 1, 'absent', 0),
    ('2b5d77e5-1a89-4f65-c234-965817003587', '7c9e13d9-6012-4c2d-9475-430985227092', CURRENT_DATE, 'present', 4);

-- 7.4 Materials
INSERT INTO public.materials (id, name, unit, stock_level, reorder_point, project_id)
VALUES
    ('7f0c2c30-6f34-44ba-1789-410362558032', 'Grade A Cement', 'Bags', 1500, 200, '7c9e13d9-6012-4c2d-9475-430985227092'),
    ('8a1d3d41-7045-45bb-2890-521473669143', 'Steel Rods (12mm)', 'Metric Tons', 45, 10, '7c9e13d9-6012-4c2d-9475-430985227092'),
    ('9b2e4e52-8156-46cc-3901-632584770254', 'River Sand', 'Metric Tons', 120, 50, '7c9e13d9-6012-4c2d-9475-430985227092'),
    ('0c3f5f63-9267-47dd-4012-743695881365', 'Granite Tiles', 'Sq Ft', 500, 1000, '7c9e13d9-6012-4c2d-9475-430985227092'),
    ('1d4a6a74-0378-48ee-5123-854706992476', 'Electrical Wiring (2mm)', 'Rolls', 80, 20, '7c9e13d9-6012-4c2d-9475-430985227092');

-- 7.5 Expenses
INSERT INTO public.expenses (project_id, amount, category, description, date)
VALUES
    ('7c9e13d9-6012-4c2d-9475-430985227092', 50000, 'Labor', 'Weekly site worker wages (Week 14)', CURRENT_DATE - 7),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 120000, 'Material', 'Purchase of 500 bags of Premium Cement', CURRENT_DATE - 5),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 15000, 'Safety', 'New hard hats and safety harnesses', CURRENT_DATE - 10),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 8000, 'Equipment', 'Generator rental and fuel', CURRENT_DATE - 2),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 3500, 'Misc', 'Site office stationery and supplies', CURRENT_DATE - 1);

-- 7.6 Site Updates
INSERT INTO public.site_updates (project_id, notes, latitude, longitude, image_url)
VALUES
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Foundation slab pouring completed. Night shift worker safety verified.', 12.9716, 77.5946, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Electrical piping started for the first floor west wing.', 12.9717, 77.5947, 'https://images.unsplash.com/photo-1504307651254-35680f3366d4?q=80&w=2070&auto=format&fit=crop');

-- 7.7 Safety Issues
INSERT INTO public.safety_issues (project_id, description, severity, status, latitude, longitude)
VALUES
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Loose scafolding detected on the north face, 4th floor.', 'high', 'in_progress', 12.9718, 77.5948),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Missing warning signage near the deep excavation pit.', 'medium', 'open', 12.9719, 77.5949);

-- 7.8 Suppliers
INSERT INTO public.suppliers (name, contact_info, material_tags)
VALUES
    ('Mega-Concrete Ltd', '+91 98765 43210', ARRAY['Cement', 'Aggregate']),
    ('Steel-Strong Solutions', '+91 91234 56789', ARRAY['Steel', 'Iron']),
    ('Eco-Sand & Aggregates', '+91 88888 77777', ARRAY['Sand', 'Stone']);

-- 7.9 Documents
INSERT INTO public.documents (project_id, name, file_url, file_type, category)
VALUES 
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Main Architectural Blueprint', 'https://example.com/blueprints/skyline-main.pdf', 'PDF', 'Blueprint'),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Structural Analysis Report', 'https://example.com/reports/skyline-structural.pdf', 'PDF', 'Report'),
    ('8d5f32a1-7c45-4b21-8e99-521473669143', 'Safety Compliance Certificate', 'https://example.com/docs/compliance.pdf', 'PDF', 'Permit'),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Site Survey Map - Q1', 'https://example.com/images/survey-map.jpg', 'JPG', 'Survey'),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Material Invoice #992', 'https://example.com/invoices/inv-992.pdf', 'PDF', 'Invoice');

-- 7.10 Complaints
-- Note: These are standalone for now; links to Profiles occur after you sign up.
INSERT INTO public.complaints (project_id, subject, message, status)
VALUES 
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Material Delay', 'The granite tiles for the lobby have not arrived yet. This is stalling the flooring team.', 'open'),
    ('7c9e13d9-6012-4c2d-9475-430985227092', 'Safety Concern', 'Scaffolding on the north side looks unstable after the rain.', 'acknowledged');

-- 7.11 QUICK START: ASSIGN YOURSELF (OPTIONAL)
-- After you sign up/log in, run this block to link your account to the mock data.
-- Replace 'PASTE_YOUR_UUID_HERE' with your ID from the Supabase "Users" table.
/*
UPDATE public.profiles 
SET role = 'admin', company_id = 'MASTER-001' 
WHERE id = 'PASTE_YOUR_UUID_HERE';

INSERT INTO public.project_assignments (project_id, user_id)
VALUES ('7c9e13d9-6012-4c2d-9475-430985227092', 'PASTE_YOUR_UUID_HERE');
*/

-- END OF SCRIPT;
