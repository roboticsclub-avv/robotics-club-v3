-- =========================================================================
-- AUTO-CONFIRM USER EMAILS IN SUPABASE AUTH
-- Run this in your Supabase Dashboard -> SQL Editor
-- This immediately fixes "Email not confirmed" error for all existing & new users
-- =========================================================================

-- 1. Confirm all existing users in auth.users whose email is not confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger function to automatically confirm emails for all new signups
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS tr_auto_confirm_user_email ON auth.users;
CREATE TRIGGER tr_auto_confirm_user_email
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user_email();
