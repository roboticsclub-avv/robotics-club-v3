-- 1. Create the 'gallery' table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    date TEXT,
    category TEXT,
    aspect TEXT DEFAULT 'square',
    hyperlink TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security and Define Policies
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone
DROP POLICY IF EXISTS "Allow public select on gallery" ON public.gallery;
CREATE POLICY "Allow public select on gallery" ON public.gallery
FOR SELECT USING (true);

-- Allow authenticated admins and staff members to insert, update, and delete rows
DROP POLICY IF EXISTS "Allow admin manage on gallery" ON public.gallery;
CREATE POLICY "Allow admin manage on gallery" ON public.gallery
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = auth.uid() AND role IN ('admin', 'technical', 'ops', 'data', 'secretary', 'media')
  )
);

-- 3. Storage Policies for the 'gallery' bucket
-- (Make sure you manually create the 'gallery' bucket in your Supabase storage dashboard and set it to PUBLIC)

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
