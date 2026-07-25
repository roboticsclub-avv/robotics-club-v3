-- =========================================================================
-- ROLLBACK SCRIPT: 01_profile_attendance_rollback.sql
-- Robotics Club V3 - Rollback Profile & Attendance Additions
-- Execute in: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

DROP FUNCTION IF EXISTS public.mark_event_attendance(UUID, UUID, UUID);
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.event_checkpoints CASCADE;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS uq_users_qr_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS qr_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS roll_number;
