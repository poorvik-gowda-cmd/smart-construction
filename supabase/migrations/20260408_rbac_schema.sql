-- RBAC Schema Extension: Engineer-Client Assignments, Complaints, Pending Approval

-- 1. Add approval status and assigned engineer to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Engineer-Client Assignment Table
CREATE TABLE IF NOT EXISTS public.engineer_client_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    engineer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id) -- Each client can only be assigned to ONE engineer
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    to_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- open, acknowledged, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Add client_id to documents so engineer can share doc to a specific client
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS shared_with_client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. New clients default to is_approved = false
-- This is handled in create-profile API, but set DB default explicitly:
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;
-- (Clients will have is_approved = false set explicitly in the API route)
