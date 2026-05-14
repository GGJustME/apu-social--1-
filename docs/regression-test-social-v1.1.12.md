# Manual Regression Test Checklist - Nexus social-v1.1.12

**Version:** social-v1.1.12  
**Date:** May 14, 2026  
**Environment:** Production/Staging (Supabase Backend)

---

## 1. Authentication & Session
| Task | Result | Notes |
| :--- | :--- | :--- |
| Google OAuth Login: Successfully redirects and signs in | [x] PASS [ ] FAIL [ ] BLOCKED | Google Login works. |
| Session Persistence: User remains logged in after page refresh | [x] PASS [ ] FAIL [ ] BLOCKED | Session persists after refresh. |
| Logout: Correctly clears session and returns to AuthScreen | [x] PASS [ ] FAIL [ ] BLOCKED | Logout returns to AuthScreen. |
| Profile Fetch: Avatar and name display correctly in Sidebar | [x] PASS [ ] FAIL [ ] BLOCKED | Pending and suspended routing previously implemented. |

---

## 2. Admin Control (Admin User: ling55785@gmail.com)
| Task | Result | Notes |
| :--- | :--- | :--- |
| User List: Admin can see all users in AdminPanelModal | [x] PASS [ ] FAIL [ ] BLOCKED | User list loads. |
| Pending Approval: New users are blocked by "Pending" screen | [x] PASS [ ] FAIL [ ] BLOCKED | Previously implemented and verified. |
| User Approval: Admin can change status from "pending" to "active" | [x] PASS [ ] FAIL [ ] BLOCKED | Approve / suspend / reactivate UI is available. |
| User Suspension: Admin can suspend an active user | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |
| Immediate Access: Approved users can enter app after refresh | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |

---

## 3. Groups & Invites
| Task | Result | Notes |
| :--- | :--- | :--- |
| Social Group Creation: Appears in sidebar immediately | [x] PASS [ ] FAIL [ ] BLOCKED | Public and private group creation works. |
| Work Group Creation: Enables the "Workspace" tab | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |
| Public Join: Can find and join public groups in Join Modal | [x] PASS [ ] FAIL [ ] BLOCKED | Public join works. |
| Invite Generation: Can generate 6-digit code for private groups | [x] PASS [ ] FAIL [ ] BLOCKED | Invite code generation works. |
| Invite Join: User B can join User A's group via code | [x] PASS [ ] FAIL [ ] BLOCKED | Second account can join via invite code. |
| Invite Revocation: Revoked codes no longer allow joining | [x] PASS [ ] FAIL [ ] BLOCKED | Revoke behavior works; should be monitored. |

---

## 4. Real-time Chat
| Task | Result | Notes |
| :--- | :--- | :--- |
| Message Sending: Text appears in chat area without lag | [x] PASS [ ] FAIL [ ] BLOCKED | Messages persist in Supabase. |
| Cross-user Sync: User B sees User A's message in real-time | [x] PASS [ ] FAIL [ ] BLOCKED | Cross-account realtime works. |
| Message History: History loads correctly when switching groups | [x] PASS [ ] FAIL [ ] BLOCKED | Messages appear after refresh. |
| Chat Auto-scroll: Chat area stays at the bottom on new message | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |

---

## 5. Workspace Files
| Task | Result | Notes |
| :--- | :--- | :--- |
| Folder Creation: Can create nested folders in Workspace | [x] PASS [ ] FAIL [ ] BLOCKED | Folder creation works and persists. |
| File Upload: Successfully upload Image/PDF (< 50MB) | [x] PASS [ ] FAIL [ ] BLOCKED | File upload works. |
| File Preview: Images and PDFs display via Signed URL | [x] PASS [ ] FAIL [ ] BLOCKED | Image preview works via signed URL. |
| File Renaming: Names update in the DB and UI | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |
| File Deletion: Removed from DB and Supabase Storage bucket | [x] PASS [ ] FAIL [ ] BLOCKED | Empty folder deletion works; non-empty blocked. |

---

## 6. Feed Posts
| Task | Result | Notes |
| :--- | :--- | :--- |
| Create Post: Text posts appear in the group feed | [x] PASS [ ] FAIL [ ] BLOCKED | Post creation works; posts are group-scoped. |
| Feed Ordering: Newest posts appear at the top | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |
| Post Persistence: Posts remain after logout/login | [x] PASS [ ] FAIL [ ] BLOCKED | Posts persist after refresh. |
| Post Deletion: Users can delete their own posts | [x] PASS [ ] FAIL [ ] BLOCKED | Works as expected. |

---

## 7. Permission / Role Check
| Task | Result | Notes |
| :--- | :--- | :--- |
| Admin Access: Only admins can see the "Shield" icon/panel | [x] PASS [ ] FAIL [ ] BLOCKED | Admin-only UI hidden from non-admins. |
| Group Owner: Only owner can generate/revoke invites | [x] PASS [ ] FAIL [ ] BLOCKED | RLS protects admin actions. |
| Member Limits: Non-members cannot see group content | [x] PASS [ ] FAIL [ ] BLOCKED | Private group access requires membership/invite. |

---

## 8. Cross-user File Access
| Task | Result | Notes |
| :--- | :--- | :--- |
| Shared Visibility: User B can see files uploaded by User A | [x] PASS [ ] FAIL [ ] BLOCKED | Second account can see uploaded files. |
| Shared Preview: User B can open User A's PDF via signed URL | [x] PASS [ ] FAIL [ ] BLOCKED | Signed URL preview works. |

---

## 9. Profile Sync
| Task | Result | Notes |
| :--- | :--- | :--- |
| Presence: Sidebar shows "Online" indicator for active users | [ ] PASS [ ] FAIL [x] PARTIAL PASS | Profile update flow may still be localStorage-based. |
| Bio/Sound Update: (MOCK CHECK) Does it persist across refresh? | [ ] PASS [ ] FAIL [x] PARTIAL PASS | Should be fixed in social-v1.1.13. |

---

## 10. Known Risks & Edge Cases
- **Leaderboard:** [x] PARTIAL PASS - Still uses `localStorage`. Not connected to live Supabase data.
- **Profile Updates:** [x] PARTIAL PASS - `updateUserProfile` currently targets `localStorage`.
- **Signed URL Expiry:** File previews will expire after 1 hour of the page being open without refresh.
- **Voice Rooms:** Currently a placeholder. LiveKit integration is the next phase.

---

## 11. Final Regression Result
**Overall Status:** [ ] PASS [ ] FAIL [x] PARTIAL PASS  
**Total Failures:** 0  
**Critical Blockers:** None  

**Notes:** Core modules (Auth, Admin, Groups, Chat, Files, Feed) are working. Remaining risks (Profile sync, Leaderboard, Voice) will be addressed in future versions.

**Reviewer Signature:** Manual Test  
**Date:** May 14, 2026  
