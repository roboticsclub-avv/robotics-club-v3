-- 1. First, delete any existing accounts to start fresh
DELETE FROM auth.users WHERE email = 'roboticsclub.avv@gmail.com';
DELETE FROM public.users WHERE email = 'roboticsclub.avv@gmail.com';

-- 2. Create the user in the Supabase Auth system (this gives them the secure password)
-- The crypt() function securely encrypts '8977425995_Lucky'
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'roboticsclub.avv@gmail.com',
  crypt('8977425995_Lucky', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Now perfectly link that new Auth user to our public.users table as an Admin
INSERT INTO public.users (
  uid, 
  email, 
  name, 
  role, 
  status, 
  "memberId"
) 
SELECT 
  id, 
  email, 
  'System Admin', 
  'admin', 
  'accepted', 
  'RC-ADMIN' 
FROM auth.users 
WHERE email = 'roboticsclub.avv@gmail.com';
