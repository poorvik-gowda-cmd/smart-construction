-- Final provision of Engineer Accounts
DO $$ 
DECLARE 
    new_user_id UUID; 
    -- Generic bcrypt hash for 'SiteMaster123!'
    -- Produced via extensions.crypt('SiteMaster123!', extensions.gen_salt('bf'))
    hashed_password TEXT := '$2a$06$7R4U8zYv8S8v8S8v8S8v8O9e4e4e4e4e4e4e4e4e4e4e4e4e4e4e'; -- placeholder that will be replaced in-script
BEGIN 
    -- We'll use the runtime crypt function to ensure compatibility
    hashed_password := extensions.crypt('SiteMaster123!', extensions.gen_salt('bf'));

    -- 1. SARAH
    DELETE FROM auth.users WHERE email = 'sarah.jenkins@sitemaster.com';
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.jenkins@sitemaster.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{"role":"engineer"}', now(), now()) 
    RETURNING id INTO new_user_id; 

    DELETE FROM public.profiles WHERE email = 'sarah.jenkins@sitemaster.com' OR full_name = 'Sarah Jenkins'; 
    INSERT INTO public.profiles (id, full_name, role, email, access_key) 
    VALUES (new_user_id, 'Sarah Jenkins', 'engineer', 'sarah.jenkins@sitemaster.com', 'ENG-3342'); 

    -- 2. ARJUN
    DELETE FROM auth.users WHERE email = 'arjun.mehta@sitemaster.com'; 
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arjun.mehta@sitemaster.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{"role":"engineer"}', now(), now()) 
    RETURNING id INTO new_user_id; 

    DELETE FROM public.profiles WHERE email = 'arjun.mehta@sitemaster.com' OR full_name = 'Arjun Mehta'; 
    INSERT INTO public.profiles (id, full_name, role, email, access_key) 
    VALUES (new_user_id, 'Arjun Mehta', 'engineer', 'arjun.mehta@sitemaster.com', 'ENG-7821'); 

    -- 3. VIKTOR
    DELETE FROM auth.users WHERE email = 'viktor.volkov@sitemaster.com'; 
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viktor.volkov@sitemaster.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{"role":"engineer"}', now(), now()) 
    RETURNING id INTO new_user_id; 

    DELETE FROM public.profiles WHERE email = 'viktor.volkov@sitemaster.com' OR full_name = 'Viktor Volkov'; 
    INSERT INTO public.profiles (id, full_name, role, email, access_key) 
    VALUES (new_user_id, 'Viktor Volkov', 'engineer', 'viktor.volkov@sitemaster.com', 'ENG-9012'); 
END $$;
