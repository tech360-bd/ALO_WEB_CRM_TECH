# Task ID: COMM-FE-A — Frontend Engineer (subagent A)

## Task
Build the two ALO Education communication view files:
1. `src/components/alo/views/comm-command-center.tsx` — Unified Communication & Social Command Center
2. `src/components/alo/views/whatsapp-command-center.tsx` — WhatsApp Command Center

## Prior Work Reviewed
- `worklog.md` entries DESIGN-1, DESIGN-2 (design system v2.0), COMM-BACKEND (21 API routes + 14 Prisma models).
- `src/components/alo/ui.tsx` — 23 primitives (KpiCard, SectionCard, DataTable, Timeline, AISuggestionCard consumer, EmptyState, ErrorState, LoadingGrid, etc.).
- `src/components/alo/cards.tsx` — 12 domain cards (AISuggestionCard used in both views).
- `src/components/alo/shared.tsx` — legacy fallback for Icon etc.
- `src/lib/alo-types.ts` — ViewKey union, NAV_ITEMS, fmtDate, timeAgo.
- `src/app/globals.css` — design tokens (`var(--alo-*)`), `pulse-dot` animation keyframes, `bg-alo-gradient` utility.

## Backend Contracts Confirmed
| Endpoint | Method | Used For |
| --- | --- | --- |
| `/api/communications/sla/dashboard` | GET | SLA KPIs (pending, slaCompliancePct, openEscalations, etc.) |
| `/api/omnichannel/dashboard` | GET | Cross-channel stats (openTasks, pendingDrafts, slaCompliance, etc.) |
| `/api/communications/social-accounts` | GET | Per-channel "Configuration required" badge |
| `/api/inbox/unified?channel=WHATSAPP` | GET | Conversation list (grouped by student + channel) |
| `/api/inbox/unified` | POST | Send outbound reply (creates CommunicationMessage + TimelineEvent) |
| `/api/communications/tasks` | GET, POST | Task list + Create Task dialog |
| `/api/communications/drafts` | GET, POST | AI drafts list + create approved/sent draft audit trail |
| `/api/communications/drafts/[id]` | PATCH | Approve (status=APPROVED+approvedBy) / Reject (status=REJECTED) / Send (status=SENT+sentById) |
| `/api/communications/escalations?status=OPEN` | GET | Escalation Timeline feed |
| `/api/communications/quick-replies?channel=WHATSAPP` | GET | Quick reply chips |
| `/api/communications/templates?channel=WHATSAPP&status=APPROVED` | GET | Template dropdown |
| `/api/communications/contacts/match` | POST | Best-effort contact match for new WhatsApp numbers |
| `/api/communications/contacts/match/[id]/resolve` | POST | Resolve a ContactMatchReview (OPEN_EXISTING / MERGE_REQUEST / CREATE_NEW) |
| `/api/whatsapp/ai-reply` | POST | Generate context-aware AI reply (with OTP branch + student memory) — wrapped in try/catch |
| `/api/whatsapp/document-upload` | POST | Auto-detect document type, save Document + TimelineEvent + AuditLog |
| `/api/students?id=...` | GET | Student context (applications, documents, payments, interviews, timeline) |

## File 1 — comm-command-center.tsx (1156 lines)
Sections (in order):
1. `PageHeader` with subtitle + Refresh + Create Task actions.
2. 6 KPI cards (Pending, SLA %, Open Tasks, Open Escalations, AI Drafts, Unread Convos) with proper accents and trend.
3. Channel grid — 8 cards, each with Lucide icon, unread/pending counts, SLA status dot (pulse for non-NORMAL), Configuration Required badge for unconfigured social accounts, click → alo-navigate.
4. Unified Inbox Preview DataTable (10 rows, 8 sortable columns: Priority, SLA, Channel, Student/Sender, Message, Intent, Status, Received). Row click → channel workspace.
5. Communication Tasks DataTable (7 columns) + Create Task Dialog (POST /api/communications/tasks).
6. AI Drafts Pending Approval — AISuggestionCard per draft with Apply (PATCH APPROVED+approvedBy) / Dismiss (PATCH REJECTED) / Edit (opens whatsapp-command-center or unified-inbox).
7. Escalation Feed — Timeline with level-based accent (1=amber, 2=orange, 3=rose).

State: `Promise.allSettled` across 7 endpoints; LoadingGrid + LoadingSkeleton while loading; ErrorState with retry on full failure; EmptyState when no data; toast() feedback on every action.

## File 2 — whatsapp-command-center.tsx (1758 lines)
Responsive 3-column layout (lg:col-span-3 / lg:col-span-6 / lg:col-span-3). Stacks on mobile.

LEFT (Conversation List):
- SearchInput (name/phone/message).
- Select filter: All / Unread / SLA Overdue.
- Per-conversation: avatar initials, name/phone, last-message preview, timeAgo, unread badge, SLA severity dot.
- Auto-selects the first conversation on mount.

CENTER (Active Conversation):
- Header: avatar, contact name, phone (mono), WhatsApp badge, **live SLA countdown timer** (useEffect + setInterval every 1s; severity dot pulses when WARNING/OVERDUE/CRITICAL).
- Student context banner (if matched): Student ID + counselor + current stage.
- Message thread: inbound (left, surface bg) / outbound (right, blue-soft bg) bubbles, AI-assisted indicator, attachment chips (image/PDF/etc.), per-message delivery status icons (single check = SENT, double check = DELIVERED, blue double check = READ).
- AI Draft Reply panel: "AI GENERATED DRAFT" banner + confidence % + Edit/Reject/Approve&Send buttons. Generate AI Reply hits /api/whatsapp/ai-reply with last inbound message, conversationId, studentId. **Wrapped in try/catch** — on failure shows "AI service unavailable — manual reply required" inline + toast. Handles `requiresOtp: true` branch.
- Quick Replies: chips from /api/communications/quick-replies?channel=WHATSAPP.
- Templates dropdown: APPROVED WhatsApp templates.
- Composer: Textarea + Paperclip upload + drag-and-drop FileUploader + Send button (POST /api/inbox/unified + optimistic conversation update).
- Status bar: SENT / DELIVERED / READ legend with checkmark icons.

RIGHT (Context Panel):
- If student matched: StudentContextPanel with InfoRows for Name, Student ID, Phone, Counselor, Destination, Profile completion (with progress bar). Active applications list (max 3 with stage badge). Missing documents chips. Latest offer, payment status, interview score, last communication. AI Next Best Action AISuggestionCard.
- If no student matched: NewContactPanel showing phone + Contact Match Review panel with [Open Existing] / [Merge Request] / [Create New — Authorized Role Only] buttons → POST /api/communications/contacts/match/[id]/resolve.
- AI Message Classification panel: client-side heuristic intent detection (DOCUMENT_REQUIREMENT, PAYMENT_QUESTION, APPLICATION_STATUS, INTERVIEW_PREP, GREETING, GENERAL_INQUIRY) + Next Best Action AISuggestionCard.
- WhatsApp Document Receipt panel (when inbound attachment detected via `attachmentsJson`): file name + type icon + size, "Match to Application" dropdown, "Match to Document Requirement" dropdown, "Create Document Upload Event" button → POST /api/whatsapp/document-upload. Shows "DOCUMENT MATCH REVIEW REQUIRED" warning when no active application can be auto-determined.

## Lint & TypeScript Status
- `bun run lint` → exit 0, zero errors, zero warnings.
- `bunx tsc --noEmit --skipLibCheck` → zero errors in either new file.
- Two pre-existing errors elsewhere (ui.tsx ButtonProps re-export; social-dashboard.tsx Icon `style` prop) are untouched and out of scope.
- Used `unknown` + type guards (e.g. `e instanceof Error`) instead of `any` throughout.
- Toast variants limited to `default` | `destructive` per `use-toast.ts` contract.
- AISuggestionCard imported from `@/components/alo/cards` (correct module path).

## Exports
- `comm-command-center.tsx`: named export `CommCommandCenter` + default export.
- `whatsapp-command-center.tsx`: named export `WhatsAppCommandCenter` + default export + backward-compat alias `WhatsappCommandCenter` (handles both PascalCase interpretations; page.tsx imports `WhatsAppCommandCenter`).

## Files Touched
- Created: `/home/z/my-project/src/components/alo/views/comm-command-center.tsx` (1156 lines, 44 KB).
- Created: `/home/z/my-project/src/components/alo/views/whatsapp-command-center.tsx` (1758 lines, 73 KB).
- Modified: `/home/z/my-project/worklog.md` (appended COMM-FE-A entry).
- No other files touched. No tests written (per instructions). No Prisma or API changes.

## Issues / Notes for Downstream Agents
- The orchestrator (or a prior step) pre-wired `src/app/page.tsx` to import `WhatsAppCommandCenter` and `CommCommandCenter` from these paths. Both names now resolve correctly.
- WhatsApp AI reply endpoint may fail if Meta credentials are not configured — UI shows a graceful "AI service unavailable" inline message and toast. No silent failures.
- The student context panel hits `/api/students?id=...` which returns the full student record (applications, documents, payments, interviews, timeline). For very large student records this may be slow — future optimization could add a dedicated `/api/communications/student-context?studentId=...` lightweight endpoint.
- The contact match flow posts to `/api/communications/contacts/match` (which CREATES a ContactMatchReview when no match is found). This means each new conversation viewed will create a review record — appropriate behavior for the triage workflow.
