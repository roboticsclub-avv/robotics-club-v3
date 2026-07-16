-- 1. Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT,
    attendance TEXT[] DEFAULT '{}'::text[],
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT 'all',
    date TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create member_points table
CREATE TABLE IF NOT EXISTS public.member_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE UNIQUE,
    total INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;

-- 4. Select Policies: Allow authenticated read access
DROP POLICY IF EXISTS "Allow authenticated read on meetings" ON public.meetings;
CREATE POLICY "Allow authenticated read on meetings" ON public.meetings
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on announcements" ON public.announcements;
CREATE POLICY "Allow authenticated read on announcements" ON public.announcements
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on member_points" ON public.member_points;
CREATE POLICY "Allow authenticated read on member_points" ON public.member_points
FOR SELECT TO authenticated USING (true);

-- 5. Manage Policies (Secretary or Admin): Allow insert, update, delete
CREATE OR REPLACE FUNCTION public.is_secretary_or_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = user_id AND role IN ('admin', 'secretary')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Allow secretary manage on meetings" ON public.meetings;
CREATE POLICY "Allow secretary manage on meetings" ON public.meetings
FOR ALL TO authenticated USING (public.is_secretary_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow secretary manage on announcements" ON public.announcements;
CREATE POLICY "Allow secretary manage on announcements" ON public.announcements
FOR ALL TO authenticated USING (public.is_secretary_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow secretary manage on member_points" ON public.member_points;
CREATE POLICY "Allow secretary manage on member_points" ON public.member_points
FOR ALL TO authenticated USING (public.is_secretary_or_admin(auth.uid()));
