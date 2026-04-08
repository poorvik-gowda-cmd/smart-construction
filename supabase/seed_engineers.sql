-- 1. Add company_id to profiles for Engineer identification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id TEXT UNIQUE;

-- 2. Add budget to projects if not exists (for AI calculations)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 100000;

-- 3. Seed mock engineers in profiles
-- Each engineer needs an email like 'companyID@sitemaster.com' for Supabase Auth compatibility
-- This assumes some users already exist or will be created.

-- Update existing 'internal' users to have a company_id
UPDATE profiles 
SET company_id = 'ENG-' || floor(random() * 8999 + 1000)::text 
WHERE role = 'internal' AND company_id IS NULL;

-- 4. Create a materialized view or function for AI stats (Optional but helpful)
-- For now, we will calculate these in the Next.js frontend to keep it simple and reactive.
