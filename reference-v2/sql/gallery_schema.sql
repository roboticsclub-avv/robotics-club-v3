-- 1. Create the 'gallery' table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    date TEXT,
    category TEXT,
    aspect TEXT DEFAULT 'square',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Disable Row Level Security (consistent with other schema files in the project)
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;

-- 3. Storage Policies for the 'gallery' bucket
-- (Make sure you manually create the 'gallery' bucket in your Supabase storage dashboard and set it to PUBLIC)

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
