# Unified Portal Dashboard Architecture — ALO Education Web CRM

> একটাই Shell, সব Portal — role অনুযায়ী menu/data/KPI/action আলাদা

## 1. Shell Layout (Next.js App Router — Shared + Nested Layouts)

```
src/app/(portal)/layout.tsx  → <UnifiedPortalShell>
  ├─ (student)/student/*      → StudentPortal (student-scoped data)
  ├─ (employee)/employee/*    → Employee / Counselor / TeamLead / ... (reuse shell)
  ├─ (partner)/partner/*      → PartnerPortal
  └─ (crm)/crm/*              → CrmPortal (role = crmRole)
```

- **Shell পুনর্ব্যবহার**: `UnifiedPortalShell` একটি client component, `usePortalStore` থেকে `user.crmRole / userType` পড়ে `getNavForRole(role)` দিয়ে menu filter করে।
- **Desktop**: `aside` fixed `w-64`, `collapsible` (icon-only `w-16` when `collapsed`). Content `flex-1 overflow-y-auto`, নিজস্ব scroll.
- **Tablet** (`md`): default collapsed, hover/press এ expand (`Sheet` / `Tooltip`).
- **Mobile**: `hamburger` → `Drawer` (Sheet). Bottom nav: role-এর `frequentlyUsed` top 4-5 destinations (Dashboard, Tasks, Messages, Calendar, Profile).
- **Security**: menu hide ≠ security. প্রতিটি `API`, `server action`, `download/export` এ `withAuth` + `checkScope` (`RBAC + record-level scope: GLOBAL|BRANCH|TEAM|ASSIGNED|OWN`) বাধ্যতামূলক।
- **TopBar**: `global search` (debounced) → `/api/search?q=` — server-side scope filter (`student/lead/application` শুধু অনুমোদিত). Primary action (`New Lead`, `Upload Document`, etc.) title-এর ডানে `Button variant="brand"`.
- **Bulk actions**: `table row select` না করলে hidden. `useRowSelection` → `selectedIds.length>0` হলে toolbar show, sensitive action (`delete/approve/send`) এ `ConfirmDialog` + permission check + `auditLog`.

## 2. Role-Scoped Navigation (Example — `src/lib/nav.ts`)

```ts
export const NAV_REGISTRY: Record<Role, NavGroup[]> = {
  student: [{ title:'', items: [Home, MyProfile, FindCourses, MyShortlist, ...]}],
  counselor: [{ title:'Workspace', items: [MyDashboard, MyLeads, Followups, MyStudents, Applications, DocumentRequests, Appointments, Messages, Tasks, Reports]}],
  senior_counselor: [{ title:'Team', items: [TeamOverview, UnassignedLeads, TeamLeads, Assignments, SLA, ...]}],
  // admissions, document_verification, visa, front_desk, marketing, partner, data, finance, hr, department_head, coo, super_admin ...
}
```

`getNavForRole` শুধু `role` দেখে filter করে, কিন্তু `canSeeNavItem` কে security ধরা হয় না — API তে আবার যাচাই।

## 3. Dashboard-Config — Typed Contract (Illustrative)

```ts
export type DashboardKpiConfig = {
  key: string; label: string; icon: string;
  sourceEntity: 'FollowUpTask'|'Application'|'DocumentReview'|...; // Prisma model নাম, অনুমান নয় schema দেখে
  calculation: { aggregate: 'count'|'sum'|'avg'; field?: string; formula?: string };
  filters: { scope: 'ASSIGNED'|'TEAM'|'BRANCH'; status?: string[]; dateRange?: 'todayDhaka'; timezone: 'Asia/Dhaka' };
  refresh: 'onMutation'|'poll:60s'|'manual';
  drillDown: { route: '/crm/leads?filter=dueToday'; params: { status: 'OVERDUE' } };
  emptyState: '0';
  permission: string; // e.g. 'leads:view:assigned'
}
```

**Example — Counselor `Follow-ups Due Today`**

- Source: `FollowUpTask` / `CommunicationTask` table (real).
- Filter: `assignedToId = auth.userId`, `dueDate = todayAsiaDhaka`, `status NOT IN (COMPLETED,CANCELLED)`.
- KPI click → same filter সহ `My Leads / Follow-ups` list.
- Button `Complete` → `PATCH /api/tasks/:id/complete` (server-side permission check, `completedAt`, `actor`, `auditEvent`).
- Refresh: mutation success → `queryClient.invalidateQueries(['counselor-kpis'])`.
- Empty → `0`, no fake sample.

**Reports must expose**: `dateRange`, `timezone`, `filters`, `metric definition/denominator`, `sourceEntity+field`, `lastUpdated`, `loading/no-data/error`, `permission-scoped drill-down`, server pagination, export audit, cache freshness.

## 4. Technology (Existing Stack — যাচাই করে)

| Layer | Choice | Why |
|-------|--------|-----|
| Web | Next.js 15 App Router + React 18 + TS | Shared layouts, nested layouts, server-only data |
| UI | Tailwind + shadcn (Card, Button brand orange, Table, Dialog, Sheet, Badge) | Existing CRM uses same, no duplicate UI |
| Forms | React Hook Form + Zod (already in `src/lib/hrms/validation`) | Client/server validation contract |
| DB | Prisma 6 + MySQL (existing) | Reuse migrations, relations, `binaryTargets` native |
| Data access | `src/lib/db` + service layer `src/lib/crm/*` server-only | UI থেকে direct DB নিষিদ্ধ |
| Charts | Existing `recharts` if present else `chart` already in repo | Check `package.json` — no new lib without proof |
| Tables | `src/components/ui/table` + server pagination (`take/skip`, cursor) | Large CRM queues |
| Auth | `src/lib/auth-middleware.ts` (`withAuth`, `authenticateRequest`) | No parallel login |
| AuthZ | `RBAC + scope.ts` (`GLOBAL|COUNTRY|BRANCH|TEAM|ASSIGNED|OWN`) | Student/partner isolation |
| Jobs | Existing `src/lib/cron` / `PM2` (`ecosystem.config.cjs`) | No new Redis/queue unless workload proves |
| Storage | `FileMetadata` + `storagePool` (STUDENT|OFFICIAL) | Single secure path |
| AI | `AgentRegistry` (`src/components/crm/agentos`) | No new agent system |
| Tests | Vitest + Playwright existing | Unit/integration/E2E workflows+perms |
| Deploy | PM2 + Caddy (`Caddyfile`) | Existing prod |

**New dependency যোগ করার আগে**: repo scan → working/missing proof → why needed.

## 5. Implementation Registry (Per-Portal)

`src/lib/dashboard/registry.ts` — each feature:

```ts
{ portal: 'counselor', feature: 'Follow-ups Due Today', route: '/counselor/followups', status: 'TESTED', evidence: { api: '/api/tasks?due=today', db: 'FollowUpTask', test: 'tests/e2e/counselor-followup.spec.ts' }, blockReason?: string }
```

Statuses: `NOT_STARTED|IN_PROGRESS|IMPLEMENTED|TESTED|BLOCKED|NOT_APPLICABLE` — `IMPLEMENTED ≠ TESTED`. `TESTED` requires 8 checks (route render, sidebar link, button mutation, DB result, unauthorized blocked, states, audit/history, automated test).

## 6. AI Builder Prompt (Technical Execution)

> For each portal: trace `menu → route → button → permission → API → database → report → test`. Verify menu link, button triggers real mutation, API creates expected DB row, report aggregates from real table with defined filters/timezone/denominator, unauthorized role blocked, audit/history written, test passes. Do not beautify dashboard without completing trace. Produce `registry` update + PR.


---

## 7 Implementation status 2026-09-15 — UI format only (shared shell delivered)

| Layer | File | Status |
|---|---|---|
| Shell (responsive desktop fixed w-64→w-16 / tablet icon / mobile drawer + bottom 4-5) | `src/components/shared/UnifiedPortalShell.tsx` | Done |
| Sidebar nav registry (scoped search, badges, nested submenu, active highlight) | `src/lib/portal-nav.ts` (getNavForRole/getFrequentForRole) | Done |
| KPI typed config (sourceEntity / calculation / filters / timezone Asia/Dhaka / drillDown / permission) | `src/lib/dashboard-config.ts` | Done |
| Dashboard visual primitives (PageHeader / FilterBar / KpiGrid / KpiCard / SectionCard / DataTableFrame / BulkToolbar / QuickActions / empty / skeleton) | `src/components/shared/PortalDashboardprimitives.tsx` | Done |
| 15 portal dashboards (Student/Counselor/Senior Admissions/Document/Visa/FrontDesk/Marketing/Partner/Data/Finance/HR/DeptHead/COO/SuperAdmin) — distinct KPIs, tables, charts, quick actions, drill-down | `src/components/shared/PortalDashboards.tsx` | Done |

Integration: any App Router layout can wrap `UnifiedPortalShell role={role} title/subtitle/primaryAction` without creating new routes; existing `src/app/(portal)/layout.tsx` or `employee/layout.tsx` etc. remain source of truth for auth/RBAC; server actions / exports / pagination remain server-checked (hidden menu ≠ security).

