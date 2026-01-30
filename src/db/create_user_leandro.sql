-- ==========================================
-- SCRIPT: CREATE USER 'LEANDRO' MANUALLY
-- ==========================================

-- 1. Create Identity in Auth.Users (Simulated via SQL is tricky, usually done via API)
--    BUT we can insert into auth.users IF we are superuser (Supabase SQL Editor is).
--    Password hashing is complex (bcrypt). 
--    BETTER APPROACH: Use the pgcrypto extension if available, or just create the profile logic 
--    and let the user Invite via the UI, or use a function.

--    SINCE we cannot easily hash passwords in pure SQL without pgcrypto, 
--    we will assume the user creates the account via Sign Up OR we use a trick.
--    Actually, for a reliable script to run in SQL Editor, we can't easily generate the encrypted password "Leandro123".

--    ALTERNATIVE: We create a helper function to invite/create user via Supabase API (Client side)
--    OR: We just script the PERMISSIONS assuming the ID exists.

--    However, usually users want a SQL script that "Just Works".
--    Let's try to verify if 'pgcrypto' is enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    v_email text := 'leandro.profissional@yahoo.com.br';
    v_password text := 'Leandro123';
    v_encrypted_pw text;
BEGIN
    -- Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        RAISE NOTICE 'User % already exists', v_email;
    ELSE
        -- Generate Hash (Supabase uses bcrypt)
        -- Keep it simple: We will insert. Note: interacting with auth.users directly is risky but works for "God Mode" scripts.
        v_encrypted_pw := crypt(v_password, gen_salt('bf'));

        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000', -- Default Supabase Instance ID
            v_email,
            v_encrypted_pw,
            now(), -- Auto confirm email
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Leandro Profissional"}',
            now(),
            now(),
            'authenticated',
            'authenticated',
            ''
        );

        -- Create Identity (Optional but good for completeness)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, v_email)::jsonb,
            'email',
            now(),
            now(),
            now()
        );

        -- Create Profile (Crucial for App Logic)
        INSERT INTO public.profiles (
            id,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            'Leandro Profissional',
            'admin', -- Give him power to manage everything
            now(),
            now()
        );

        RAISE NOTICE 'User % created successfully with ID %', v_email, new_user_id;
    END IF;

END $$;
