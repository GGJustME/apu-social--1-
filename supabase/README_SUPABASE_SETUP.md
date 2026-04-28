# Supabase Setup Guide for Nexus

Follow these steps to configure your Supabase project for Nexus Phase 1.

### !!! IMPORTANT SECURITY NOTICES !!!
1. **Frontend Isolation:** Do NOT expose `LIVEKIT_API_SECRET` or your production `GEMINI_API_KEY` in the Vite frontend (prefixed with `VITE_`).
2. **Edge Functions:**
   - **LiveKit:** Room token generation must be handled via a Supabase Edge Function using your secret.
   - **AI:** Production Gemini calls should be proxied through an Edge Function to protect your API key and implement rate limiting.
3. **Storage Quotas:**
   - Single file size (50MB) should be set in the Supabase Storage Bucket settings.
   - User and Platform total quotas are **tracked** in the database but **not blocked** by RLS. Full enforcement requires a controlled upload flow (Edge Function or RPC).

### 1. SQL Execution Order
1. `supabase/schema.sql` (Creates tables, triggers, and RPC functions)
2. `supabase/rls_policies.sql` (Enables Row Level Security)
3. `supabase/storage_policies.sql` (Secures file storage)
4. `supabase/seed.sql` (Sets platform limits)

### 2. Manual Storage Setup
1. Navigate to **Storage** in the sidebar.
2. Create two buckets:
   - `files` (Private) -> Set "Maximum File Size" to 50MB.
   - `avatars` (Public) -> Set "Maximum File Size" to 5MB.
3. Apply `storage_policies.sql`.

### 3. Joining Groups
Users cannot directly `INSERT` into `group_members`. Instead, call the RPC functions from the client:
- `join_public_group(group_id_input uuid)`
- `join_group_via_invite(invite_code_input text)`
