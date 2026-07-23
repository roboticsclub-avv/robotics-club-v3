-- =========================================================================
-- FIX USERS ROW-LEVEL SECURITY (RLS) FOR APPLICANT REGISTRATION
-- Execute this SQL in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive insert policies if present
DROP POLICY IF EXISTS "Insert own profile policy" ON public.users;
DROP POLICY IF EXISTS "Allow public user registration" ON public.users;

-- 3. Create public insert policy so new applicants can register their profile
CREATE POLICY "Allow public user registration" ON public.users
FOR INSERT TO public
WITH CHECK (true);

-- 4. Ensure SELECT policy allows users to view their profile and admins to view all
DROP POLICY IF EXISTS "Select users policy" ON public.users;
CREATE POLICY "Select users policy" ON public.users
FOR SELECT TO public
USING (true);

-- 5. Add photoURL column to users table if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "photoURL" text;
