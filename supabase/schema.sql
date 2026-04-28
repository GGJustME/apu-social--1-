-- 
-- NEXUS DATABASE SCHEMA (PHASE 1A - SECURITY HARDENED)
-- 

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS (Safe for Reruns)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE group_type AS ENUM ('social', 'work');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE group_member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'sticker');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    status user_status DEFAULT 'pending',
    bio TEXT,
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type group_type DEFAULT 'social',
    is_private BOOLEAN DEFAULT FALSE,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role group_member_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    event_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES files(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size BIGINT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SECURITY DEFINER FUNCTIONS (Hardened)

-- Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    active_count INT;
    admin_email TEXT := 'ling55785@gmail.com';
    initial_status public.user_status := 'active';
BEGIN
    IF NEW.email = admin_email THEN
        INSERT INTO public.profiles (id, email, name, avatar_url, role, status)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), NEW.raw_user_meta_data->>'avatar_url', 'admin', 'active');
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO active_count FROM public.profiles WHERE status = 'active';

    IF active_count >= 20 THEN
        initial_status := 'pending';
    END IF;

    INSERT INTO public.profiles (id, email, name, avatar_url, role, status)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.raw_user_meta_data->>'avatar_url', 'member', initial_status);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Handle Group Created
CREATE OR REPLACE FUNCTION public.handle_group_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update Storage Quota (Tracking Only)
CREATE OR REPLACE FUNCTION public.update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET storage_used = storage_used + NEW.size WHERE id = NEW.uploader_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET storage_used = storage_used - OLD.size WHERE id = OLD.uploader_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC FUNCTIONS (Secure Joins)

-- Join Public Group
CREATE OR REPLACE FUNCTION public.join_public_group(group_id_input UUID)
RETURNS UUID AS $$
DECLARE
    caller_id UUID := auth.uid();
    caller_status public.user_status;
    m_count INT;
BEGIN
    -- Check Auth
    IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    
    -- Check Caller Status
    SELECT status INTO caller_status FROM public.profiles WHERE id = caller_id;
    IF caller_status != 'active' THEN RAISE EXCEPTION 'Only active users can join groups'; END IF;

    -- Check Group Exists & Visibility
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = group_id_input AND is_private = FALSE) THEN
        RAISE EXCEPTION 'Public group not found';
    END IF;

    -- Check Membership
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id_input AND user_id = caller_id) THEN
        RETURN group_id_input; -- Already a member
    END IF;

    -- Check Capacity
    SELECT COUNT(*) INTO m_count FROM public.group_members WHERE group_id = group_id_input;
    IF m_count >= 20 THEN RAISE EXCEPTION 'Group is full (max 20)'; END IF;

    -- Join
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (group_id_input, caller_id, 'member');

    RETURN group_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Join Private Group via Invite
CREATE OR REPLACE FUNCTION public.join_group_via_invite(invite_code_input TEXT)
RETURNS UUID AS $$
DECLARE
    caller_id UUID := auth.uid();
    caller_status public.user_status;
    target_group_id UUID;
    m_count INT;
BEGIN
    -- Check Auth
    IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Check Caller Status
    SELECT status INTO caller_status FROM public.profiles WHERE id = caller_id;
    IF caller_status != 'active' THEN RAISE EXCEPTION 'Only active users can join groups'; END IF;

    -- Validate Invite
    SELECT group_id INTO target_group_id FROM public.group_invites 
    WHERE invite_code = invite_code_input AND is_revoked = FALSE;
    
    IF target_group_id IS NULL THEN RAISE EXCEPTION 'Invalid or revoked invite code'; END IF;

    -- Check Membership
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = target_group_id AND user_id = caller_id) THEN
        RETURN target_group_id; -- Already a member
    END IF;

    -- Check Capacity
    SELECT COUNT(*) INTO m_count FROM public.group_members WHERE group_id = target_group_id;
    IF m_count >= 20 THEN RAISE EXCEPTION 'Group is full (max 20)'; END IF;

    -- Join
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (target_group_id, caller_id, 'member');

    RETURN target_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 6. TRIGGERS (Safe for Reruns)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
    AFTER INSERT ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_group_created();

DROP TRIGGER IF EXISTS on_file_changed ON public.files;
CREATE TRIGGER on_file_changed
    AFTER INSERT OR DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.update_storage_quota();

-- 
-- NOTE: STORAGE QUOTA ENFORCEMENT
-- Quota blocking (50MB single, 200MB/user, 1GB total) is TRACKED via triggers 
-- but REQUIRES an Edge Function or RPC-based upload flow to BLOCK before write.
-- 
