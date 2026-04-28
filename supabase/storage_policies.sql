--
-- STORAGE POLICIES (PHASE 1A - SECURITY HARDENED)
--

-- Enable storage RLS
-- Buckets to create manually: 'files', 'avatars'

--
-- 1. AVATARS BUCKET
-- Path: avatars/{user_id}/avatar.png
--

DROP POLICY IF EXISTS "Avatars: Public View" ON storage.objects;
CREATE POLICY "Avatars: Public View" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars: Self Manage" ON storage.objects;
CREATE POLICY "Avatars: Self Manage" ON storage.objects
    FOR ALL USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

--
-- 2. FILES BUCKET
-- Path: files/{group_id}/{file_id}/{filename}
--

-- Readable only by members of the group extracted from path
DROP POLICY IF EXISTS "Files: Group Members View" ON storage.objects;
CREATE POLICY "Files: Group Members View" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'files' AND (
            is_group_member((storage.foldername(name))[1]::uuid) OR is_admin()
        )
    );

-- Upload allowed for active members of that group
DROP POLICY IF EXISTS "Files: Active Members Upload" ON storage.objects;
CREATE POLICY "Files: Active Members Upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'files' AND 
        is_active() AND 
        is_group_member((storage.foldername(name))[1]::uuid)
    );

-- Delete allowed for uploader, group owner, or admin
DROP POLICY IF EXISTS "Files: Manage" ON storage.objects;
CREATE POLICY "Files: Manage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'files' AND (
            auth.uid() = owner OR 
            is_admin() OR
            EXISTS (SELECT 1 FROM groups WHERE id = (storage.foldername(name))[1]::uuid AND owner_id = auth.uid())
        )
    );

--
-- QUOTA & SIZE ENFORCEMENT NOTE
-- 
-- 1. Single file max 50MB: Set in Supabase Storage Bucket settings.
-- 2. Per-user 200MB / Platform 1GB: 
--    These are TRACKED in profiles.storage_used but NOT BLOCKED by these policies.
--    To enforce blocking, an Edge Function or restricted Upload RPC must be used.
--
