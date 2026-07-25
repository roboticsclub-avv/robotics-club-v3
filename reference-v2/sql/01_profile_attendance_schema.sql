-- =========================================================================
-- MIGRATION SCRIPT: 01_profile_attendance_schema.sql
-- Robotics Club V3 - Profile Redesign & Digital RC Attendance System
-- Execute in: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Add roll_number and qr_token columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT gen_random_uuid();

-- Enforce unique constraint on qr_token
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_qr_token'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT uq_users_qr_token UNIQUE (qr_token);
    END IF;
END $$;

-- Populate missing qr_token values for existing users
UPDATE public.users SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;

-- Safe backfill for roll_number from institutional email (av.sc.u4aie24053@... -> AV.SC.U4AIE24053)
UPDATE public.users 
SET roll_number = UPPER(split_part(email, '@', 1))
WHERE roll_number IS NULL 
  AND email LIKE 'av.%.%@%';


-- 2. Create Event Checkpoints Table
CREATE TABLE IF NOT EXISTS public.event_checkpoints (
    id UUID DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    checkpoint_name TEXT NOT NULL,
    checkpoint_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id),
    CONSTRAINT uq_checkpoint_event UNIQUE (id, event_id)
);


-- 3. Create Event Attendance Table
CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    checkpoint_id UUID NOT NULL,
    member_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES public.users(uid),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Composite FK guarantees checkpoint_id belongs to the exact supplied event_id!
    -- ON DELETE RESTRICT safeguards historical attendance data from deletion.
    CONSTRAINT fk_attendance_checkpoint_event 
        FOREIGN KEY (checkpoint_id, event_id) 
        REFERENCES public.event_checkpoints(id, event_id) 
        ON DELETE RESTRICT,
        
    -- Prevents duplicate scan at same checkpoint
    CONSTRAINT uq_event_checkpoint_member 
        UNIQUE (event_id, checkpoint_id, member_id)
);


-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_event_checkpoints_event ON public.event_checkpoints(event_id, checkpoint_order);
CREATE INDEX IF NOT EXISTS idx_event_attendance_matrix ON public.event_attendance(event_id, checkpoint_id, member_id);
CREATE INDEX IF NOT EXISTS idx_users_qr_token ON public.users(qr_token);


-- 5. ATOMIC ATTENDANCE RPC: mark_event_attendance
CREATE OR REPLACE FUNCTION public.mark_event_attendance(
    p_qr_token UUID,
    p_event_id UUID,
    p_checkpoint_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member RECORD;
    v_checkpoint RECORD;
    v_existing_scanned_at TIMESTAMPTZ;
    v_new_scanned_at TIMESTAMPTZ;
BEGIN
    -- 5.1 Verify caller authentication
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'UNAUTHORIZED',
            'message', 'Authentication required.'
        );
    END IF;

    -- 5.2 Verify caller authorization using centralized helper function
    IF NOT public.is_ops_or_admin(auth.uid()) THEN
        RETURN jsonb_build_object(
            'status', 'UNAUTHORIZED_OPERATOR',
            'message', 'Caller lacks attendance scanning privileges.'
        );
    END IF;

    -- 5.3 Resolve member from qr_token
    SELECT uid, name, "memberId", roll_number, "photoURL", status
    INTO v_member
    FROM public.users
    WHERE qr_token = p_qr_token;

    IF v_member.uid IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_TOKEN',
            'message', 'Invalid or unrecognized member QR token.'
        );
    END IF;

    -- 5.4 Verify membership status is active/accepted
    IF v_member.status IS DISTINCT FROM 'accepted' THEN
        RETURN jsonb_build_object(
            'status', 'UNAPPROVED_MEMBER',
            'message', 'Member account is pending approval or inactive.',
            'member_name', v_member.name,
            'member_id', COALESCE(v_member."memberId", 'N/A'),
            'roll_number', COALESCE(v_member.roll_number, 'N/A'),
            'photo_url', COALESCE(v_member."photoURL", '')
        );
    END IF;

    -- 5.5 Verify checkpoint existence, event matching, and active state
    SELECT id, event_id, checkpoint_name, is_active
    INTO v_checkpoint
    FROM public.event_checkpoints
    WHERE id = p_checkpoint_id;

    IF v_checkpoint.id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'INVALID_CHECKPOINT',
            'message', 'Selected checkpoint does not exist.'
        );
    END IF;

    IF v_checkpoint.event_id <> p_event_id THEN
        RETURN jsonb_build_object(
            'status', 'EVENT_CHECKPOINT_MISMATCH',
            'message', 'Selected checkpoint does not belong to this event.'
        );
    END IF;

    IF NOT v_checkpoint.is_active THEN
        RETURN jsonb_build_object(
            'status', 'INACTIVE_CHECKPOINT',
            'message', 'This checkpoint is currently inactive.'
        );
    END IF;

    -- 5.6 Preliminary duplicate scan check
    SELECT scanned_at INTO v_existing_scanned_at
    FROM public.event_attendance
    WHERE event_id = p_event_id 
      AND checkpoint_id = p_checkpoint_id 
      AND member_id = v_member.uid;

    IF v_existing_scanned_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'status', 'ALREADY_MARKED',
            'message', 'Attendance already recorded for this checkpoint.',
            'member_name', v_member.name,
            'member_id', COALESCE(v_member."memberId", 'N/A'),
            'roll_number', COALESCE(v_member.roll_number, 'N/A'),
            'photo_url', COALESCE(v_member."photoURL", ''),
            'checkpoint_name', v_checkpoint.checkpoint_name,
            'previous_scanned_at', v_existing_scanned_at
        );
    END IF;

    -- 5.7 Insert attendance record (Race condition safe via unique_violation exception handler)
    BEGIN
        INSERT INTO public.event_attendance (
            event_id,
            checkpoint_id,
            member_id,
            scanned_by,
            scanned_at
        ) VALUES (
            p_event_id,
            p_checkpoint_id,
            v_member.uid,
            auth.uid(),
            timezone('utc'::text, now())
        )
        RETURNING scanned_at INTO v_new_scanned_at;
    EXCEPTION 
        WHEN unique_violation THEN
            SELECT scanned_at INTO v_existing_scanned_at
            FROM public.event_attendance
            WHERE event_id = p_event_id 
              AND checkpoint_id = p_checkpoint_id 
              AND member_id = v_member.uid;

            RETURN jsonb_build_object(
                'status', 'ALREADY_MARKED',
                'message', 'Attendance already recorded for this checkpoint.',
                'member_name', v_member.name,
                'member_id', COALESCE(v_member."memberId", 'N/A'),
                'roll_number', COALESCE(v_member.roll_number, 'N/A'),
                'photo_url', COALESCE(v_member."photoURL", ''),
                'checkpoint_name', v_checkpoint.checkpoint_name,
                'previous_scanned_at', COALESCE(v_existing_scanned_at, timezone('utc'::text, now()))
            );
    END;

    -- 5.8 Return verification payload
    RETURN jsonb_build_object(
        'status', 'RECORDED',
        'message', 'Attendance successfully recorded.',
        'member_name', v_member.name,
        'member_id', COALESCE(v_member."memberId", 'N/A'),
        'roll_number', COALESCE(v_member.roll_number, 'N/A'),
        'photo_url', COALESCE(v_member."photoURL", ''),
        'checkpoint_name', v_checkpoint.checkpoint_name,
        'scanned_at', v_new_scanned_at
    );
EXCEPTION 
    -- 5.9 Catch all remaining database errors and return safe production status
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'ATTENDANCE_PROCESSING_ERROR',
            'message', 'System processing error encountered while marking attendance.'
        );
END;
$$;


-- 6. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.event_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- Checkpoints Read: Authenticated members
DROP POLICY IF EXISTS "Allow select checkpoints" ON public.event_checkpoints;
CREATE POLICY "Allow select checkpoints" ON public.event_checkpoints
FOR SELECT TO authenticated USING (true);

-- Checkpoints Manage: Authorized staff via is_ops_or_admin
DROP POLICY IF EXISTS "Allow manage checkpoints" ON public.event_checkpoints;
CREATE POLICY "Allow manage checkpoints" ON public.event_checkpoints
FOR ALL TO authenticated USING (public.is_ops_or_admin(auth.uid()));

-- Attendance Read: Self OR authorized staff via is_ops_or_admin
DROP POLICY IF EXISTS "Allow select attendance" ON public.event_attendance;
CREATE POLICY "Allow select attendance" ON public.event_attendance
FOR SELECT TO authenticated USING (
    auth.uid() = member_id OR public.is_ops_or_admin(auth.uid())
);
