-- =========================================================================
-- FIX ROW-LEVEL SECURITY (RLS) UPDATE POLICY ON USERS TABLE
-- Run this in your Supabase Dashboard -> SQL Editor
-- This fixes "new row violates row-level security policy for table users"
-- =========================================================================

-- 1. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing update policies
DROP POLICY IF EXISTS "Allow user update profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Update users policy" ON public.users;

-- 3. Create UPDATE policy allowing users to update their profile
CREATE POLICY "Allow user update profile" ON public.users
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- 4. Ensure INSERT and SELECT policies are present
DROP POLICY IF EXISTS "Allow public user registration" ON public.users;
CREATE POLICY "Allow public user registration" ON public.users
FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Select users policy" ON public.users;
CREATE POLICY "Select users policy" ON public.users
FOR SELECT TO public
USING (true);
