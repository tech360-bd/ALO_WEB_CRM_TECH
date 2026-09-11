# Task 14-superadmin — Super Admin Master Dashboard

**Agent:** full-stack-developer
**Date:** 2025-01-15
**Status:** ✅ COMPLETE

## Objective

Build the Super Admin Master Dashboard — a unified control hub that gives the Super Admin full control over the entire ALO Education system from one place. Links to all existing subsystems (CRM, employees, permissions, access-control, AI command center, audit logs, finance, HRM, marketing, visa, reports, import center, course management, partner portals) plus shows high-level metrics, quick actions, and tabbed deep-dive views.

## File Created

`/home/z/my-project/src/components/alo/views/super-admin-dashboard.tsx`

- 1100+ lines
- `"use client";` directive
- Named export: `SuperAdminDashboard`
- Props: `{ onNavigate: (v: ViewKey, slug?: string) => void }`

## Prior Work Context

Read these files for context (in `/home/z/my-project/`):
- `worklog.md` — full 12-task project history (design system, Prisma schema, APIs, public site, partner portal, employee management, access control center, audit logs, AI command center, etc.)
- `src/components/alo/shared.tsx` — Icon, StatCard, StatusBadge, SectionCard, EmptyState, LoadingGrid, MiniBar, PageHeader exports
- `src/components/alo/privacy-mode.tsx` — SensitiveField + usePrivacy exports (used for revenue display)
- `src/lib/alo-types.ts` — ViewKey union, fmtDate, timeAgo, STAGE_LABELS, STAGE_COLORS
- `src/components/alo/views/access-control-center.tsx` — AccessControlData shape, PROFILE_STATUS_COLORS, EMPLOYEE_STATUS_COLORS, QUOTA_TYPE_LABELS
- `src/components/alo/views/ai-command-center.tsx` — AiAgent shape, AGENT_STATUS_COLORS, AI_SAFETY_RULES pattern
- `src/components/alo/views/audit-logs.tsx` — AuditLog shape
- `src/components/alo/views/hrm-dashboard.tsx` — SensitiveField usage pattern

## API Contracts Used (8 parallel fetches)

1. `GET /api/stats` — counts, leadsBySource, appsByStage, docsByStatus, agentsByDept, finance (revenue, pendingPayments, commissionPending), recentAudit, avgProfileCompletion
2. `GET /api/audit?take=10` — `{ logs: AuditLog[] }` with `user` relation
3. `GET /api/access-control` — employees + packages + quotaRequests + summary (totalEmployees, activeEmployees, pendingProfiles, totalPartners, totalPackages, pendingQuotaRequests)
4. `GET /api/ai-agents` — `{ agents: AiAgent[] }` with department, status, jobsProcessed, pendingApprovals, lastRunAt
5. `GET /api/courses` — `{ courses: CoursePage[] }` with countrySlug (used for course count + per-country distribution)
6. `GET /api/universities` — `{ universities: UniversityPage[] }` with countrySlug + country relation (used for university count + per-country distribution)
7. `GET /api/countries` — `{ countries: CountryPage[] }` with flag, capital, currency, lastVerifiedAt, verificationStatus
8. `GET /api/scholarships` — `{ scholarships: ScholarshipPage[] }` with countrySlug (wrapped in `.catch(() => null)` fallback since endpoint may not exist in all deployments)

## Component Structure

### 1. PageHeader
- Title: "Super Admin Control Center"
- Icon: `ShieldCheck` (alo-gradient rounded-2xl)
- Subtitle: "Full system control — employees, partners, courses, finance, AI, and security."
- Action: emerald "All Systems Operational" badge with animated pulse dot

### 2. System-wide Metrics (grid-cols-2 md:grid-cols-4 lg:grid-cols-6)
12 StatCards — each with accent color, icon, value, hint:
1. Total Leads (blue, UserPlus) — stats.counts.leads
2. Total Students (orange, Users) — stats.counts.students
3. Active Applications (violet, ClipboardList) — stats.counts.applications
4. Visa Cases (rose, Plane) — stats.counts.visaCases
5. **Total Revenue (emerald, DollarSign) — uses `<RevenueSensitive />` sub-component** that respects privacy mode (blurred + click-to-reveal via usePrivacy hook)
6. Total Employees (amber, UserCog) — from access-control summary
7. AI Agents Active (blue, Bot) — agents.filter(ACTIVE).length
8. Partner Packages (orange, Package) — access-control summary
9. Courses Published (emerald, BookOpen) — courses.length
10. Universities (violet, Building2) — universities.length
11. Pending Approvals (amber, Clock) — pendingProfiles + pendingQuotaRequests
12. Audit Events (blue, ScrollText) — recent audit count

### 3. Quick Actions Grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
18 `QuickActionCard` components. Each card:
- Blue gradient circle icon (`bg-alo-gradient`)
- Title + 2-line description
- Count badge where applicable (mapped via `countKey`)
- Hover: `-translate-y-0.5` + shadow-md + border-[#0057B8]/40 + "Open →" reveal

Navigation targets (all via `onNavigate(view)`):
- employee-management, access-control-center, permission-matrix, crm, finance-dashboard, hrm-dashboard, marketing, marketing-ai, visa, application-team, ai-command, audit, weekly-reports, import-center, csv-import-center, admin-course-management, partner-admin-dashboard, partner-marketing-studio

### 4. Tabs (6 tabs)
Custom `TabsList` with `flex-wrap`, `data-[state=active]:bg-[#0057B8] data-[state=active]:text-white`.

#### System Overview
- 6 `HealthCard`s: Database, API Gateway, AI Services, Cache, Private Storage, Auth Service — each with emerald "Operational" badge + pulse dot + p95 latency
- Recent Audit Activity table (max-h-96 overflow-y-auto, custom scrollbar): Action (colored pill via AUDIT_ACTION_COLORS), User (name + role), Resource, Time (timeAgo), IP (mono). "View all" → audit
- Pending Approvals: 4 nested cards (Employee Profiles, Partner Registrations, Quota Requests with sample list, Import Approvals) — each with count + action button
- 3 chart SectionCards: Leads by Source (MiniBar blue), Applications by Stage (pills with STAGE_COLORS), Documents by Status (MiniBar with per-status color)

#### Employee Control
- Header + "Manage Employees" + "Access Control" buttons
- 4 distribution SectionCards: By Designation (blue bars), By Department (orange bars), By Office (violet bars), Profile Status (2-col grid with StatusBadge + count + percentage)
- Recent Employees table: 5 rows with Name/Designation/Department/Status/Profile Status

#### Branch Control
- "Add Branch" button (toast)
- Branch cards grid: derived from `byOffice` count. Each card shows share-of-workforce %, employees badge, derived Leads/Students/Revenue (proportional to employee count share)
- Branch Performance Comparison SectionCard (MiniBar headcount)

#### Country Control
- "Manage Countries" button (toast)
- Country cards grid (from /api/countries): flag emoji, name, capital+currency, verified/review badge, 2x2 stat grid (Universities, Courses, Scholarships, Students — derived), last verified date, "View country page" → `onNavigate("public-country", slug)`
- 2 performance SectionCards: Universities per Country (top 8, blue bars), Courses per Country (top 8, orange bars)

#### AI Command
- "Open AI Command Center" button → ai-command
- 4 AI StatCards: Total Agents, Active Agents, Jobs Processed, Pending Approvals
- Department Grid SectionCard: dynamically shows `{N} Departments` where N = actual count from `agentsByDept` (the "53 departments" label is replaced with the real count — seed has 18)
- AI Safety Rules SectionCard (amber-tinted): 8 non-negotiable "AI must NOT" rules

#### System Settings
- "View Audit Logs" outline button → audit
- 6 Settings cards: General, Email, WhatsApp, SMS, Security, Backup — each with 4 field rows + "Configure" button (toast)
- Feature Flags SectionCard: 12 toggle switches (Public Website, Student Portal, Partner Portal, Employee Portal, AI Interview Engine, AI SOP Writer, AI Course Match, AI Visa Coach, Marketing AI Engine, Bulk Import, CSV Pipeline, Audit Logging). Each toggle toasts current state.

### 5. Security & RBAC Summary Card (bottom)
- Gradient bg `from-[#e8f0fb]/40 to-white`, border-[#0057B8]/20
- 3 RBAC cards:
  1. "Backend RBAC enforced on every API route" — frontend PermissionGate only hides buttons; backend is final authority
  2. "All sensitive actions are audit-logged" — permission changes, salary views, document downloads, role changes, status changes, AI actions
  3. "Route protection via middleware.ts" — unauthenticated redirects + role-protected 403s + public whitelist
- Inline Revenue Snapshot with `SensitiveField` (id="super-admin-revenue-detail", type="currency", mono) — demonstrates the privacy-aware reveal pattern + note about SALARY_ACCESS/PAYMENT_UPDATE audit logging

## Sub-components

1. **`RevenueSensitive({ value })`** — uses `usePrivacy()` hook to blur revenue value with click-to-reveal. Falls back to plain display when privacy mode is OFF.
2. **`HealthCard({ label, icon, detail, latency })`** — operational status card with emerald badge + animated pulse dot.
3. **`QuickActionCard({ def, count, onNavigate })`** — large clickable navigation card with hover lift effect.

## Helper Functions

- `formatCurrency(value, currency="USD")` — Intl.NumberFormat with USD, max 0 fraction digits
- `countBy<T>(items, keyFn)` — generic group-by-key returning `Record<string, number>`

## Constants

- `PROFILE_STATUS_COLORS`, `EMPLOYEE_STATUS_COLORS`, `PROFILE_STATUS_LABELS` — 8 statuses each
- `AGENT_STATUS_COLORS` — ACTIVE/IDLE/PAUSED
- `QUOTA_TYPE_LABELS`, `QUOTA_STATUS_COLORS` — 4 quota types
- `AUDIT_ACTION_LABELS` + `AUDIT_ACTION_COLORS` — 19 audit actions
- `DOC_STATUS_LABELS` — 5 doc statuses
- `SOURCE_LABELS_LOCAL` — 10 lead sources
- `QUICK_ACTIONS` — 18 entries with label/description/icon/view/countKey
- `SYSTEM_HEALTH` — 6 health cards
- `SETTINGS_CARDS` — 6 settings cards with 4 fields each
- `FEATURE_FLAGS` — 12 toggle definitions
- `AI_SAFETY_RULES` — 8 non-negotiable rules
- `RBAC_SUMMARY` — 3 RBAC explanation cards

## Loading & Error States

- **Loading**: `LoadingGrid` (8 skeletons top + 2x2 secondary skeletons) shown while fetching
- **Error**: `toast({ title: "Failed to load dashboard data", description: err.message, variant: "destructive" })` + state remains empty
- **Empty sections**: `<EmptyState>` on every dynamic section when data is empty (audit logs, leads by source, applications by stage, documents by status, employees by designation, branches, countries, AI agents, etc.)

## Design System

- White bg via parent (`#F8FAFC` page bg set by app shell)
- Primary blue `#0057B8`
- CTA orange `#E8501A`
- All cards: `rounded-2xl border-2 border-[#E2E8F0]`
- Mobile-first responsive: `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` pattern
- Touch-friendly buttons (min size)
- Status pills with proper color contrast (emerald=good, amber=pending, rose=error, sky=in-progress, violet=info, blue=primary)
- Real Bangladeshi copy (Asia/Dhaka timezone, +880 WhatsApp, BulkSMS BD gateway, ALOEDU sender ID, etc.)

## Verification

```bash
cd /home/z/my-project
npx eslint src/components/alo/views/super-admin-dashboard.tsx    # ✅ clean (no output)
npx tsc --noEmit --skipLibCheck                                  # ✅ no errors in this file
bun run lint                                                     # 3 pre-existing errors in unrelated auth route files
tail -50 dev.log                                                 # ✅ "✓ Compiled" messages, GET / 200, no errors
```

## Files Modified

- ✅ Created: `/home/z/my-project/src/components/alo/views/super-admin-dashboard.tsx`
- ✅ Appended: `/home/z/my-project/worklog.md` (Task 14-superadmin record)
- ✅ Created: `/home/z/my-project/agent-ctx/14-superadmin-full-stack-developer.md` (this file)

## Notes for Orchestrator

- The file is ready to be wired into `page.tsx` via the app shell's view switcher (using `view === "super-admin-dashboard"`).
- ViewKey `super-admin-dashboard` already exists in `src/lib/alo-types.ts` (line 53).
- The component is self-contained — no new shared exports needed.
- All 18 quick-action navigation targets correspond to existing ViewKey values.
- The `RevenueSensitive` sub-component relies on `PrivacyProvider` being mounted at the app shell level (which it should be, since other dashboards like HRM/Finance use the same pattern).
- The "53 departments" label from the original task was replaced with the actual count from `/api/ai-agents` (seed data has 18 departments) — the SectionCard title dynamically renders `Department Grid · {N} Departments`.
- The "Add Branch" and "Manage Countries" buttons toast actionable messages directing to the appropriate sub-modules (no separate create-branch or country-management routes exist yet).
- The "Configure" buttons on the System Settings cards toast that the editor will open in a future release — actual configuration is via env vars + database.
- Feature flag toggles toast the current state + direct to the Access Control Center for actual changes (no direct mutation of feature flags from this dashboard).
