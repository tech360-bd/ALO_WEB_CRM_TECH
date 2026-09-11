# Task 16-hr — Enterprise HR Dashboard

**Agent:** full-stack-developer (Main)
**File:** `src/components/alo/views/enterprise-hr-dashboard.tsx`
**Export:** `EnterpriseHrDashboard` (named, no props, `"use client"`)

## What was built

A complete enterprise HR management center as a single Next.js 16 client component (~1500 lines), wired into the existing `AppShell` via `page.tsx` (already routed by prior task).

## Architecture

- **Single fetch** on mount to `GET /api/hr/analytics` returning analytics + 9 collection arrays (employees, leaveRequests, payroll, devices, loginSecurity, notices, exits, upcomingBirthdays, attendance).
- **Local state mirrors** (`leaves`, `payrolls`, `devices`) initialized from the analytics payload so mutations can apply optimistic updates without re-fetching.
- **employeeMap** built once per data change — `getEmployeeMeta(id)` returns `{name, code, designation}` for any employee-referenced record.
- **Mutations** call the dedicated PATCH/POST endpoints (`/api/hr/leave`, `/api/hr/payroll`, `/api/hr/devices`), update local state optimistically, and revert + toast on failure.

## View structure

1. **PageHeader** — "Enterprise HR Management", Briefcase icon, subtitle, PrivacyToggle action.
2. **16-card analytics grid** — `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` with brand-colored StatCards. The "Total Payroll Cost" card uses an inline `SensitiveField` (PIN-gated, blurred by default).
3. **7-tab Tabs** inside a SectionCard:
   - **Overview** — Upcoming birthdays (next 30 days, urgency color-coded) + Today's Attendance summary (4 status tiles + Progress) + Quick Stats (departments/offices/designations Badge clouds) + Recent joiners table (last 30 days).
   - **Leave Management** — Leave requests table with approve/reject h-8 buttons for PENDING rows. "Request Leave" h-12 button opens a Dialog (employee select, leave-type select, start/end date inputs, auto-calculated days, reason textarea) → POST `/api/hr/leave`.
   - **Payroll** — 3-card monthly summary (SensitiveField for totals) + payroll table with per-cell `PrivateAmount` (PIN-gated inline reveal) for Basic/Allowances/Deductions/Net Pay. DRAFT→Approve / APPROVED→Pay actions via PATCH `/api/hr/payroll`.
   - **Devices** — Device table with status Badges, "Return" h-8 button for ASSIGNED rows (PATCH `/api/hr/devices`). "Register Device" h-12 button opens Dialog (employee select, device-type select, name/serial/asset-tag inputs, assigned/warranty date pickers) → POST `/api/hr/devices`.
   - **Login Security** — 3 stat cards (Active Sessions, Failed Attempts, Unique IPs) + sessions table (User avatar, IP mono, Browser, OS, Location with MapPin icon, login time, failed-attempts Badge, session-status Badge).
   - **Notice & Exit** — 2-col grid of Active Notices (countdown remaining-days tile, clearance/asset/settlement Badges) and Exit Records (final settlement BDT, letter check marks).
   - **Analytics** — Headcount by Department / Designation / Office (MiniBar with brand colors), Leave Usage by Type, Attendance Rate Trend (7-day bar chart), Payroll Cost by Month (MiniBar list, orange).
4. **Privacy & Data Protection SectionCard** — 3 info tiles + red-tinted note with the exact spec wording.

## Privacy integration

- Uses `PrivacyProvider` already wrapping `AppShell` in `page.tsx` — no provider added inside the component.
- `SensitiveField` for the Total Payroll Cost analytics card + payroll summary cards.
- Inline `PrivateAmount` component for table cells (mirrors `SensitiveField` UX: blurred until PIN-locked reveal, audit-log notice, auto-hide after 60s inactivity via context).
- `PrivacyToggle` in the PageHeader action slot.

## Design conformance

- Blue `#0057B8` (primary), Orange `#E8501A` (CTA), White bg, rounded-2xl cards, h-12 buttons for primary actions (Submit/Approve/Register), h-8 compact buttons for inline table actions.
- shadcn/ui only: Button, Card, Badge, Input, Label, Textarea, Tabs, Table, Dialog, Select.
- Mobile-first responsive (grid-cols-2 → md:grid-cols-4 → lg:grid-cols-6 for analytics; lg:grid-cols-2 / lg:col-span-2 / lg:grid-cols-3 for tab content).
- LoadingGrid while fetching; EmptyState when collections are empty; useToast for every action with descriptive titles and audit-log references.
- ARIA-friendly: semantic TableHeader/TableRow, icon-prefixed tab triggers, title attributes on icon-only buttons.

## Quality gates

- `bun run lint` — exit 0, no errors.
- Dev server log inspected — no errors related to this view.
- Did NOT modify shared.tsx, alo-types.ts, privacy-mode.tsx, page.tsx, app-shell.tsx, or any API route. All backend endpoints (`/api/hr/analytics`, `/api/hr/leave`, `/api/hr/payroll`, `/api/hr/devices`) and the Prisma schema were already in place from prior tasks.
