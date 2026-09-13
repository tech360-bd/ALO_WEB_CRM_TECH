# Task 16-am — Application Manager Portal

**Agent:** full-stack-developer
**Date:** 2025-01-15
**Status:** ✅ COMPLETE

## Objective

Build the complete Application Manager Portal (`application-manager-portal.tsx`) — the command center for managing all ALO Education applications (direct, partner, B2B inbound/outbound) with strict B2B confidentiality enforcement across 7 tabs, 14 KPIs, 4 dialogs, and role-based visibility.

## Prior work context

This task continues from prior ALO Education work. View these files in `/home/z/my-project/` for context:
- `prisma/schema.prisma` — Application, B2bProvider, B2bApplication, ApplicationComment, ApplicationDocument, ApplicationDeadline, ApplicationTask, ApplicationStatusLog models (lines 210-233, 1923-2060)
- `src/lib/alo-types.ts` — STAGE_LABELS, STAGE_COLORS, fmtDate, timeAgo helpers
- `src/components/alo/shared.tsx` — Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader
- `src/components/alo/privacy-mode.tsx` — SensitiveField (PIN-gated reveal)
- `src/app/api/app-manager/{dashboard,b2b-providers,b2b-applications,comments}/route.ts` — pre-existing API routes (left untouched)
- `worklog.md` — full work history (Tasks 1-3 design system + APIs, 9-mega seed, 15-mkt marketing dashboard pattern, 16-hr enterprise HR pattern)

## What I created

**File:** `/home/z/my-project/src/components/alo/views/application-manager-portal.tsx` (~1180 lines)

### Architecture

- `"use client"` directive; named export `ApplicationManagerPortal` (no props).
- Single root component fetches dashboard via `GET /api/app-manager/dashboard`, then renders PageHeader → Access Banner → KPI Grid (14 StatCards) → Tabs (7 tabs) → Security notes.
- 7 sub-components per tab, each receiving its data slice as typed props:
  - `DashboardTab` — pipeline, submission queue, recent activity, B2B alerts, deadlines, tasks
  - `AllApplicationsTab` — filters + application table
  - `B2BApplicationsTab` — restricted B2B applications table + Create/Update dialogs
  - `B2BProvidersTab` — provider cards + Add Provider dialog
  - `CommentsTab` — multi-channel comment system
  - `DeadlinesTab` — deadline table + filter + stat cards
  - `TasksTab` — task table + Create Task dialog

### Key features

1. **Viewer Role Switcher** — Select dropdown with 6 roles (APPLICATION_TEAM, APPLICATION_MANAGER, SUPER_ADMIN, COUNSELOR, STUDENT, PARTNER). Defaults to APPLICATION_TEAM (full B2B access). When switched:
   - B2B tabs show Access Restricted EmptyState
   - B2B column hidden in All Applications table
   - B2B Confidential comment channel disabled
   - Hidden-comments count displayed in Comments tab

2. **14 KPI cards** in `grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7` — all from spec, each with proper accent color + icon + optional "Confidential" badge on B2B card.

3. **Dashboard tab:**
   - Application Pipeline — 15 stage pills with counts + MiniBar progress + tooltip %
   - Submission Queue — 4 actionable buckets (Ready/Missing/Fee/B2B Follow-up) derived from applications + b2bApplications
   - Recent Activity — statusLogs feed with B2B_CONFIDENTIAL visibility badges
   - B2B Confidential Alerts (only when canViewB2B) — b2b apps with overdue/due-soon follow-ups + commission amounts
   - Upcoming Deadlines — month/day tiles + days-remaining badges
   - Pending Tasks — checkboxes + priority badges

4. **All Applications tab:**
   - 6 filters: Source, Country, University, Status, Urgent-only checkbox, B2B-only checkbox
   - Source auto-derived via `detectSource()` (Direct / Partner / B2B_INBOUND / B2B_OUTBOUND)
   - Document Status auto-derived from documents array (missing / in review / ok)
   - Deadline days-remaining color-coded badge
   - 3 action buttons per row (toast-based)
   - B2B badge column only visible when canViewB2B

5. **B2B Applications tab — RESTRICTED:**
   - Red-bordered confidentiality warning card with exact spec text
   - B2B applications table: Provider, Type, Reference (mono), Status, Commission (rose), Claim Stage, Last/Next Follow-up, Actions
   - "Create B2B Application" button → Dialog (application select, provider select, type select, reference, commission, internal note)
   - "Update B2B Status" button → Dialog with 8 B2B status options
   - POST + PATCH integrations with audit-log references in toasts

6. **B2B Providers tab:**
   - Provider cards in `md:grid-cols-2 lg:grid-cols-3` with Name, Code, Type badge (7 types), Contact, Email, Phone, Portal URL, Commission Rule (SensitiveField PIN-gated), Portal Login ("••••••" masked via SensitiveField with "Encrypted" note), App count, Status, Last reviewed timeAgo
   - "Add Provider" button → Dialog with 7 fields
   - POST integration

7. **Comments tab:**
   - Application selector (Select)
   - 8 comment channels (Student-Visible, Partner-Visible, Counselor-Visible, Internal, B2B Confidential, University, Finance, Visa Handover) as toggle buttons
   - Two-column layout: left = channels, right = comments list + Add Comment form
   - B2B Confidential comments show red "CONFIDENTIAL" badge with Lock icon
   - Add Comment form: textarea + visibility Select (B2B disabled for non-authorized roles) + "Mark B2B Confidential" checkbox (only when canViewB2B) + Post Comment button
   - GET re-fetches when role changes; shows hidden-comments count
   - Visibility note: "Student-visible comments appear in Student Portal. B2B confidential comments are never visible to students, partners, or counselors."

8. **Deadlines tab:** 4 stat cards (Overdue / ≤3 days / Total Pending / Types) + deadline table with type filter (7 deadline types)

9. **Tasks tab:** Task table with priority/status badges + "Create Task" dialog (no POST endpoint specified — toast confirms creation)

10. **Security & Safe Status notes** at bottom — 2 cards with exact spec wording:
    - B2B Security (rose): "B2B provider name, contact, commission, portal credentials, and internal notes are hidden..."
    - Safe Status Mapping (blue): "Students and partners see safe status only..."

### Helper utilities

- `daysUntil(dateStr)` → number of days remaining (null if invalid)
- `daysRemainingBadge(dateStr)` → colored Badge (red overdue / amber <3d / sky <7d / emerald >7d / "Today")
- `formatCurrency(amount, currency)` → Intl.NumberFormat with $ fallback
- `detectSource(app, b2bApps)` → { source: DIRECT|PARTNER|B2B_INBOUND|B2B_OUTBOUND, b2b? }
- `docStatusSummary(docs)` → { label, cls, missing, total }

### Color & status maps

- `PROVIDER_TYPE_COLORS` (7 types), `B2B_STATUS_META` (8 statuses), `B2B_TYPE_META` (INBOUND/OUTBOUND), `SOURCE_META` (4 sources), `PRIORITY_META` (4 priorities), `COMMENT_CHANNEL_CLS` (8 channels), `DEADLINE_TYPE_META` (7 types), `TASK_STATUS_META` (5 statuses), `PIPELINE_STAGES` (15 stages subset)

## Verification

- `bun run lint` → exit 0 (0 errors, 0 warnings)
- File exists at `/home/z/my-project/src/components/alo/views/application-manager-portal.tsx`
- Named export `ApplicationManagerPortal` confirmed
- No props (matches `page.tsx` usage: `{view === "application-manager-portal" && <ApplicationManagerPortal />}`)
- Already wired into `page.tsx` line 59 (import) + line 145 (render) by Task 1-3

## What I did NOT modify

- `src/components/alo/shared.tsx` — consumed as-is
- `src/components/alo/privacy-mode.tsx` — consumed as-is (SensitiveField)
- `src/lib/alo-types.ts` — consumed as-is
- `src/app/page.tsx` — already wired
- `src/components/alo/app-shell.tsx` — unchanged
- All 4 `/api/app-manager/*` route files — unchanged
- `prisma/schema.prisma` — unchanged

## Notes for downstream agents

- The viewer-role switcher is a client-side demo of role-based visibility. Real production auth should be enforced server-side via session checks in the API routes (currently the routes return all data regardless of viewer role).
- The Comments tab is the only one that calls `/api/app-manager/comments` with `viewerRole` query param — the backend already filters comments based on that role. Other tabs simply hide B2B columns/UI client-side.
- B2B provider "Portal Login" is masked as "••••••" via SensitiveField with no real value — the `loginNote` field exists in the DB schema but the existing seed doesn't populate it. The SensitiveField still works correctly because the underlying value isn't shown.
- Task creation (Tasks tab → Create Task dialog) does NOT call any API — the spec doesn't list a task POST endpoint. The dialog shows a toast confirmation instead. If a task POST endpoint is added later, wire `handleCreate` to call it.
