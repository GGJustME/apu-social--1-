--
-- RLS POLICIES (PHASE 1A - SECURITY HARDENED)
--

-- 1. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 2. Helper Functions (Hardened)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_active() RETURNS BOOLEAN AS $$
  SELECT status = 'active' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_group_member(gid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

--
-- 3. POLICIES (Safe for Reruns)
--

-- Profiles
DROP POLICY IF EXISTS "Profiles: Users view own" ON profiles;
CREATE POLICY "Profiles: Users view own" ON profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Profiles: Active users view shared groups" ON profiles;
CREATE POLICY "Profiles: Active users view shared groups" ON profiles FOR SELECT USING (
  is_active() AND (is_admin() OR EXISTS (
    SELECT 1 FROM group_members m1 JOIN group_members m2 ON m1.group_id = m2.group_id 
    WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
  ))
);

DROP POLICY IF EXISTS "Profiles: Admin full access" ON profiles;
CREATE POLICY "Profiles: Admin full access" ON profiles FOR ALL USING (is_admin());

-- Groups
DROP POLICY IF EXISTS "Groups: Active view public" ON groups;
CREATE POLICY "Groups: Active view public" ON groups FOR SELECT USING (is_active() AND is_private = FALSE);

DROP POLICY IF EXISTS "Groups: Members view private" ON groups;
CREATE POLICY "Groups: Members view private" ON groups FOR SELECT USING (is_group_member(id));

DROP POLICY IF EXISTS "Groups: Active create" ON groups;
CREATE POLICY "Groups: Active create" ON groups FOR INSERT WITH CHECK (is_active() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Groups: Owner/Admin update" ON groups;
CREATE POLICY "Groups: Owner/Admin update" ON groups FOR UPDATE USING (owner_id = auth.uid() OR is_admin());

-- Group Members (Joining Restricted to RPC)
DROP POLICY IF EXISTS "Members: View" ON group_members;
CREATE POLICY "Members: View" ON group_members FOR SELECT USING (
  is_active() AND (is_group_member(group_id) OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_private = FALSE) OR is_admin())
);

DROP POLICY IF EXISTS "Members: Owner/Admin manage" ON group_members;
CREATE POLICY "Members: Owner/Admin manage" ON group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()) OR is_admin()
);

DROP POLICY IF EXISTS "Members: Users leave" ON group_members;
CREATE POLICY "Members: Users leave" ON group_members FOR DELETE USING (user_id = auth.uid());

-- Messages
DROP POLICY IF EXISTS "Messages: View" ON messages;
CREATE POLICY "Messages: View" ON messages FOR SELECT USING (is_group_member(group_id) OR is_admin());

DROP POLICY IF EXISTS "Messages: Insert" ON messages;
CREATE POLICY "Messages: Insert" ON messages FOR INSERT WITH CHECK (is_active() AND is_group_member(group_id) AND sender_id = auth.uid());

DROP POLICY IF EXISTS "Messages: Update/Delete" ON messages;
CREATE POLICY "Messages: Update/Delete" ON messages FOR ALL USING (sender_id = auth.uid() OR is_admin());

-- Reactions
DROP POLICY IF EXISTS "Reactions: View" ON message_reactions;
CREATE POLICY "Reactions: View" ON message_reactions FOR SELECT USING (is_group_member(message_id IN (SELECT id FROM messages WHERE group_id = group_id)));

DROP POLICY IF EXISTS "Reactions: Manage own" ON message_reactions;
CREATE POLICY "Reactions: Manage own" ON message_reactions FOR ALL USING (is_active() AND user_id = auth.uid());

-- Posts
DROP POLICY IF EXISTS "Posts: View" ON posts;
CREATE POLICY "Posts: View" ON posts FOR SELECT USING (is_group_member(group_id) OR is_admin());

DROP POLICY IF EXISTS "Posts: Insert" ON posts;
CREATE POLICY "Posts: Insert" ON posts FOR INSERT WITH CHECK (is_active() AND is_group_member(group_id) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Posts: Delete" ON posts;
CREATE POLICY "Posts: Delete" ON posts FOR DELETE USING (
  author_id = auth.uid() OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()) OR is_admin()
);

-- Files
DROP POLICY IF EXISTS "Files: View metadata" ON files;
CREATE POLICY "Files: View metadata" ON files FOR SELECT USING (is_group_member(group_id) OR is_admin());

DROP POLICY IF EXISTS "Files: Insert metadata" ON files;
CREATE POLICY "Files: Insert metadata" ON files FOR INSERT WITH CHECK (is_active() AND is_group_member(group_id) AND uploader_id = auth.uid());

DROP POLICY IF EXISTS "Files: Delete" ON files;
CREATE POLICY "Files: Delete" ON files FOR DELETE USING (
  uploader_id = auth.uid() OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()) OR is_admin()
);

-- Platform Settings
DROP POLICY IF EXISTS "Settings: Active view" ON platform_settings;
CREATE POLICY "Settings: Active view" ON platform_settings FOR SELECT USING (is_active());

DROP POLICY IF EXISTS "Settings: Admin update" ON platform_settings;
CREATE POLICY "Settings: Admin update" ON platform_settings FOR ALL USING (is_admin());
