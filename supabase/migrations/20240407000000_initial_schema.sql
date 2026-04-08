-- Construction Management System Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'internal', 'client');
CREATE TYPE project_status AS ENUM ('planned', 'ongoing', 'on_hold', 'completed', 'delayed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'overtime');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- 1. Profiles (Extends Supabase Auth Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'internal',
    project_id UUID, -- For clients to see only their project; internal/admin might have null or multiple
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'planned',
    budget NUMERIC(15, 2),
    start_date DATE,
    end_date DATE,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link profiles to projects (many-to-many for internal users, one-to-one for clients)
CREATE TABLE public.project_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 3. Labor & Attendance
CREATE TABLE public.labor (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT NOT NULL,
    skill_tag TEXT, -- e.g., 'Mason', 'Electrician', 'Plumber'
    project_id UUID REFERENCES public.projects ON DELETE SET NULL,
    daily_rate NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    labor_id UUID REFERENCES public.labor ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'present',
    overtime_hours NUMERIC(4, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Materials & Suppliers
CREATE TABLE public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT, -- 'bags', 'metric tons', 'sq ft'
    stock_level NUMERIC(12, 2) DEFAULT 0,
    reorder_point NUMERIC(12, 2) DEFAULT 0,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info TEXT,
    material_tags TEXT[], -- Array of strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.purchase_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID REFERENCES public.materials ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers ON DELETE SET NULL,
    quantity NUMERIC(12, 2),
    total_cost NUMERIC(15, 2),
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Expenses
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    category TEXT, -- 'Labor', 'Material', 'Permits', 'Travel', 'Misc'
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Site Updates (with Geo-tagging)
CREATE TABLE public.site_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles ON DELETE SET NULL,
    image_url TEXT,
    notes TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Documents
CREATE TABLE public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Safety & Issues
CREATE TABLE public.safety_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    reported_by UUID REFERENCES public.profiles ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity issue_severity DEFAULT 'medium',
    status issue_status DEFAULT 'open',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Framerwork for Project-level isolation)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
-- (Other tables will be enabled during setup)

-- Admin has full access
CREATE POLICY "Admin full access" ON public.projects 
    FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Internal users can see projects they are assigned to
CREATE POLICY "Internal assigned project access" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_assignments 
            WHERE project_id = public.projects.id AND user_id = auth.uid()
        )
    );

-- Clients can see only their assigned project
CREATE POLICY "Client project access" ON public.projects
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client'
        AND id = (SELECT project_id FROM public.profiles WHERE id = auth.uid())
    );

-- RLS for profiles: Users can read their own profile, admins see all
CREATE POLICY "Profile self access" ON public.profiles FOR SELECT USING ( auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
