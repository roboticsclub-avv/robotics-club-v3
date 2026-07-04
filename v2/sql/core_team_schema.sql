-- 1. Create the Core Team table
CREATE TABLE core_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT,
    quote TEXT,
    bio TEXT,
    research TEXT,
    type TEXT CHECK (type IN ('faculty', 'member')) DEFAULT 'member',
    display_order INTEGER DEFAULT 0
);

-- 2. Enable public read access
ALTER TABLE core_team DISABLE ROW LEVEL SECURITY;

-- Note: To create the Storage Bucket for uploaded team images:
-- In the Supabase Dashboard, you MUST manually go to Storage -> "New Bucket"
-- Name: "team-images"
-- Make sure the "Public bucket" toggle is turned ON.

-- Policies to allow public reading and authenticated uploading to the bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'team-images');
CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'team-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'team-images' AND auth.role() = 'authenticated');
