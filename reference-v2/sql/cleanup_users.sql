-- =========================================================================
-- CLEANUP USERS SCRIPT
-- Deletes all applicant/member records EXCEPT the 4 essential team accounts
-- Run in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Clean public profile records
DELETE FROM public.users 
WHERE LOWER(email) NOT IN (
  'likithsaikvs@gmail.com',
  'roboticsclub.avv@gmail.com',
  'nishanthchowdary1234@gmail.com',
  'basementdiaries1234@gmail.com'
);

-- 2. Clean auth user credentials
DELETE FROM auth.users 
WHERE LOWER(email) NOT IN (
  'likithsaikvs@gmail.com',
  'roboticsclub.avv@gmail.com',
  'nishanthchowdary1234@gmail.com',
  'basementdiaries1234@gmail.com'
);
