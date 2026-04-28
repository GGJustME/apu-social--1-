# IMPLEMENTATION_PLAN.md - Nexus Phase 1

## Phase 0: Cleanup & Architecture Alignment
- [ ] Mark `/server` and `/prisma` as `(DEPRECATED - Phase 1)`.
- [ ] Audit `types.ts` to ensure compatibility with Supabase PostgreSQL schema.
- [ ] Create `services/supabaseClient.ts` to initialize the connection.
- [ ] Verify `geminiService.ts` uses a valid model (e.g., `gemini-1.5-flash`).

## Phase 1: Supabase Setup
- [ ] **Database Schema:**
    - `profiles`: id, name, avatar, email, status (active/pending/admin), storage_used.
    - `groups`: id, name, type (social/work), is_private, owner_id, invite_code.
    - `group_members`: group_id, user_id, role.
    - `messages`: id, group_id, sender_id, content, type, event_details (jsonb).
    - `posts`: id, group_id, author_id, content, image_url.
    - `files`: id, group_id, parent_id, name, type, size, url, created_by.
- [ ] **RLS Policies:** Implement Row Level Security to enforce group privacy and user limits.
- [ ] **Storage Buckets:** Create `files` and `avatars` buckets. Configure max file size (50MB) and public/private access.

## Phase 2: Auth Migration
- [ ] Integrate Supabase Auth with Google OAuth.
- [ ] **Admin/Pending Logic:** 
    - Auto-assign `admin` status to `ling55785@gmail.com`.
    - Implement a trigger or edge function: If active users >= 20, new users are set to `status: 'pending'`.
    - Pending users see a "Waiting for Approval" screen instead of the main app.

## Phase 3: Database & Group System
- [ ] Refactor `api.ts` group methods to use Supabase.
- [ ] **Constraints Enforcement:**
    - Max 5 groups per creator (handled via RLS or Database Triggers).
    - Max 20 members per group.
- [ ] **Invitation System:**
    - Generate unique, permanent `invite_code` for groups.
    - Implement a join route that validates the code and member limit.

## Phase 4: Chat Migration
- [ ] Refactor `api.ts` messaging to use Supabase Realtime.
- [ ] Integrate Gemini event extraction into the message insertion flow.
- [ ] Implement reaction storage and retrieval.

## Phase 5: File Storage
- [ ] Implement file upload with size validation (50MB).
- [ ] **Quota Tracking:** Update user's `storage_used` on upload/delete; prevent upload if > 200MB per user or 1GB total platform limit.
- [ ] Implement preview logic for Images, PDFs, and Videos in `FileExplorer.tsx`.

## Phase 6: LiveKit Voice
- [ ] Set up LiveKit Cloud project and create `services/livekitService.ts`.
- [ ] Implement audio-only rooms with mute/unmute and member listing.
- [ ] **Active Speaker:** Enable Active Speaker detection in the UI.
- [ ] **Quota Protection:** Implement a check for LiveKit usage; disable the "Join Voice" button if the monthly reset has not occurred and quota is hit.

## Phase 7: Testing & Deployment
- [ ] E2E testing of the user flow: Google Login -> Join Group -> Chat -> Upload File -> Voice Call.
- [ ] Verify RLS policies prevent unauthorized access to private groups and files.
- [ ] Deploy frontend to Vercel/Netlify.
