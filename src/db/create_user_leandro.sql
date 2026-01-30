-- ==========================================
-- SCRIPT: CREATE USER 'LEANDRO' MANUALLY (FIXED V5)
-- ==========================================

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
        
        -- Optional: Ensure he is admin if he already exists
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = (SELECT id FROM auth.users WHERE email = v_email);
        
    ELSE
        -- Generate Hash
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
            '00000000-0000-0000-0000-000000000000', 
            v_email,
            v_encrypted_pw,
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Leandro Profissional"}',
            now(),
            now(),
            'authenticated',
            'authenticated',
            ''
        );

        -- Create Identity
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id, v_email)::jsonb,
            'email',
            new_user_id::text,
            now(),
            now(),
            now()
        );

        -- Create Profile (SAFE UPDATE)
        -- Trigger likely created the profile already with default role
        INSERT INTO public.profiles (
            id,
            full_name,
            role
        ) VALUES (
            new_user_id,
            'Leandro Profissional',
            'admin'
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role;

        RAISE NOTICE 'User % created successfully with ID %', v_email, new_user_id;
    END IF;

END $$;
