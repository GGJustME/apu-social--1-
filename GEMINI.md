# GEMINI.md: Nexus (apu-social) - Phase 1 Context

## Project Overview
Nexus is transitioning to a serverless, cloud-first architecture for Phase 1. The goal is to build a visually polished, highly functional social/workspace hybrid with robust persistence and real-time capabilities.

### Phase 1 Tech Stack
- **Frontend:** React 19, Vite, TypeScript.
- **Backend-as-a-Service:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Voice Communication:** LiveKit Cloud (Audio-only).
- **AI Intelligence:** Google Gemini (Event extraction from chat).
- **Status:** The existing Express/Prisma backend is **DEPRECATED** for Phase 1 and remains only as a reference.

## Architecture & Structure
- `/components`: UI components (Chat, Feed, FileExplorer, MusicPlayer, etc.).
- `/services`:
    - `api.ts`: To be refactored to use `@supabase/supabase-js`.
    - `geminiService.ts`: AI logic for chat event extraction.
    - `livekitService.ts`: (New) Voice room management.
- `/server`: (Deprecated) Reference Express server.
- `/prisma`: (Deprecated) Reference Prisma schema.

## Business Logic & Constraints
- **Admin:** `ling55785@gmail.com`
- **User Growth:** Max 20 active users. Subsequent users are marked as `pending` and require admin approval.
- **Group Ownership:** Max 5 groups per user.
- **Group Capacity:** Max 20 members per group.
- **Invitations:** Permanent, unlimited-use, revocable invitation links for private groups.
- **Storage Limits:**
    - Max file size: 50MB.
    - Per-user quota: 200MB.
    - Total platform quota: 1GB.
- **File Support:** Preview support for Images, PDFs, and Videos.
- **Voice Features:** Audio-only, mute/unmute, active speaker detection, automatic shutdown on LiveKit quota exhaustion.

## Key Workflows
1. **Auth:** Google OAuth via Supabase. Profile check for "active" vs "pending" status.
2. **Groups:** CRUD for social/work groups. Workspaces enable the File Explorer.
3. **Chat:** Real-time messaging via Supabase Realtime with AI processing for schedule detection.
4. **Voice:** Ephemeral audio rooms managed via LiveKit tokens.
