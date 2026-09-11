# Task: COMM-FE-C — Build Template Manager + Partner Comm Hub + wire all views into page.tsx

**Agent:** Frontend Engineer (subagent C)
**Date:** 2026-08-15

## Summary

Built the Communication Template Manager and Partner Communication Hub views,
then wired all 7 new communication views into the main page switch.

## Files Created / Modified

| File | Action | Lines | Purpose |
| --- | --- | --- | --- |
| `src/components/alo/views/comm-templates.tsx` | CREATED | 1335 | Communication Template Manager (KPIs + filters + DataTable + Create/Edit dialogs + Quick Replies) |
| `src/components/alo/views/partner-comm-hub.tsx` | CREATED | 1188 | Partner Communication Hub (4 tabs: Messages / Applications / Documents / Updates + Contact ALO + Reply-via-ALO + Application details dialog) |
| `src/components/alo/views/comm-command-center.tsx` | STUB → OVERWRITTEN by COMM-FE-A | — | Scaffold created for import resolution; full impl by COMM-FE-A |
| `src/components/alo/views/whatsapp-command-center.tsx` | STUB → OVERWRITTEN by COMM-FE-A | — | Scaffold created for import resolution; full impl by COMM-FE-A |
| `src/components/alo/views/phone-call-center.tsx` | STUB → OVERWRITTEN by COMM-FE-B | — | Scaffold created for import resolution; full impl by COMM-FE-B |
| `src/components/alo/views/sla-performance.tsx` | STUB → OVERWRITTEN by COMM-FE-B | — | Scaffold created for import resolution; full impl by COMM-FE-B |
| `src/components/alo/views/social-dashboard.tsx` | STUB → OVERWRITTEN by COMM-FE-B | — | Scaffold created for import resolution; full impl by COMM-FE-B |
| `src/app/page.tsx` | MODIFIED | 315 (was 302) | +7 imports +7 render cases; no existing lines changed |

## Implementation Notes

### comm-templates.tsx (1335 lines)
- **KPIs**: Total / Approved / Pending Approval / Locked (Official) / Drafts / Archived
- **Filters**: Channel (All/WHATSAPP/EMAIL/SMS/PORTAL), Category (10 categories), Status (5), SearchInput by name/templateId/body
- **Templates DataTable**: sortable Name, Category badge, Channel icon+badge, Language, Version, Status badge, Lock icon, Last Updated (timeAgo). Row click → Edit dialog.
- **Create Template dialog**:
  - Auto-suggested `templateId` = `CATEGORY_CHANNEL_LANG_V1` (e.g. `DOCREQ_WH_EN_V1`)
  - 6 variable-insertion chips: `{{student_name}}`, `{{university}}`, `{{deadline}}`, `{{amount}}`, `{{counselor_name}}`, `{{appointment_date}}`
  - Auto-detected variables shown as chips
  - Subject field shown only when channel=EMAIL
  - RichTextEditor (toolbar: bold/italic/underline/lists/heading/quote/link)
  - `isLocked` checkbox gated to SUPER_ADMIN/ADMIN
- **Edit dialog**: PATCH /api/communications/templates/[id]. Locked templates show "Editing requires admin authorization" warning and disable fields. "Lock Template" button (admin only, requires APPROVED status) sets isLocked=true and status=LOCKED. "Archive" button uses DELETE (soft archive).
- **Quick Replies section**: separate SectionCard. DataTable: Title, Body (truncate), Category, Channel, Shortcut, Active, Used Count. Create dialog with title/body/category/channel/shortcut.

### partner-comm-hub.tsx (1188 lines)
- **Persistent restricted-info Notification** at top — visible across all tabs
- **5 KPI cards**: Assigned Students, Active Applications, Unread Messages, Pending Actions, Recent Updates
- **Tabs**: Messages / Applications / Documents / Updates
- **Messages tab**:
  - Notice: "Showing messages for students assigned to your partner account."
  - DataTable: Channel badge, Student, Sender, Message truncate, Time, Status
  - Row click → "Reply via ALO" dialog. POSTs CommunicationTask with source=PARTNER, assignedTo=ALO_SUPPORT
- **Applications tab**:
  - DataTable: Application ID, Student, University, Course, Stage badge, Last Update, Status
  - Row click → Application Details dialog
  - Dialog shows ONLY partner-visible fields: stage, status, document checklist status. Persistent info Notification: "Internal ALO notes, AI risk scores, and confidential employee communication are not visible."
- **Documents tab**:
  - Notice: "Official application documents cannot be deleted. They use lifecycle states (Submitted → Verified / Rejected)."
  - DataTable: Document Name, Type, Student, Application, Status (STUDENT_SUBMITTED/UNDER_REVIEW/VERIFIED/REJECTED badges), Uploaded At, Version
  - Version History explainer card showing "Version 1 Rejected → Version 2 Verified" lifecycle
- **Updates tab**:
  - Timeline component (vertical events)
  - Each item: priority-colored accent (URGENT=rose, HIGH=amber, RESOLVED=emerald, default=blue), actor (You / ALO Team)
- **Contact ALO dialog**: subject, message, priority (LOW/MEDIUM/HIGH/URGENT). POSTs CommunicationTask with source=PARTNER, assignedTo=null (ALO support queue)

### page.tsx (315 lines, was 302)
Added after `employee-workspace` import / render block:
```tsx
import { CommCommandCenter } from "@/components/alo/views/comm-command-center";
import { WhatsappCommandCenter } from "@/components/alo/views/whatsapp-command-center";
import { PhoneCallCenter } from "@/components/alo/views/phone-call-center";
import { SlaPerformance } from "@/components/alo/views/sla-performance";
import { SocialDashboard } from "@/components/alo/views/social-dashboard";
import { CommTemplates } from "@/components/alo/views/comm-templates";
import { PartnerCommHub } from "@/components/alo/views/partner-comm-hub";
```
Render cases added:
```tsx
{view === "comm-command-center" && <CommCommandCenter />}
{view === "whatsapp-command-center" && <WhatsappCommandCenter />}
{view === "phone-call-center" && <PhoneCallCenter />}
{view === "sla-performance" && <SlaPerformance />}
{view === "social-dashboard" && <SocialDashboard />}
{view === "comm-templates" && <CommTemplates />}
{view === "partner-comm-hub" && <PartnerCommHub />}
```
No existing imports or render cases were modified.

## Coordination with parallel subagents

COMM-FE-A and COMM-FE-B ran in parallel and overwrote the 5 minimal scaffolds I created. The final state of those 5 files is owned by those subagents. The `page.tsx` import names align to the canonical export names chosen by each subagent:
- `CommCommandCenter` (COMM-FE-A)
- `WhatsappCommandCenter` (COMM-FE-A) — capital W-A, not WhatsAppCommandCenter
- `PhoneCallCenter` (COMM-FE-B)
- `SlaPerformance` (COMM-FE-B)
- `SocialDashboard` (COMM-FE-B)

## Quality Gates

- **`bun run lint`**: exit code 0, no errors, no warnings.
- **`bunx tsc --noEmit --skipLibCheck`**: 0 errors in COMM-FE-C's own files (comm-templates.tsx, partner-comm-hub.tsx, page.tsx). Remaining pre-existing TS errors in `social-dashboard.tsx` (style prop on Icon) and `whatsapp-command-center.tsx` (wrong argument type) belong to COMM-FE-A / COMM-FE-B and are out of scope for this task.
- **Dev server**: confirmed running and serving requests normally; no regressions.

## Design System Adherence

- Uses NEW ALO design tokens via CSS variables: `var(--alo-blue)`, `var(--alo-orange)`, `var(--alo-success)`, `var(--alo-warning)`, `var(--alo-danger)`, `var(--alo-info)`, `var(--alo-bg)`, `var(--alo-surface)`, `var(--alo-surface-muted)`, `var(--alo-border)`, `var(--alo-border-strong)`, `var(--alo-text)`, `var(--alo-text-secondary)`, `var(--alo-muted)`.
- Uses NEW design-system components from `@/components/alo/ui`: `Icon`, `PageHeader`, `SectionCard`, `EmptyState`, `ErrorState`, `LoadingGrid`, `KpiCard`, `DataTable`, `SearchInput`, `RichTextEditor`, `Notification`, `StatusBadge`, `Timeline`, `TimelineItem`, `Column`, `AccentColor`.
- Mobile-first responsive (grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4/5/6 patterns).
- `"use client"` at top of every view file.
- `useToast` from `@/hooks/use-toast` for user feedback on all mutations.
- `fetch()` for API calls (relative paths only — no absolute URLs).
- Loading states via `LoadingGrid` during fetch.
- `ErrorState` with retry on fetch failure.
- `EmptyState` with primary CTA when no data.
