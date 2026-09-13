# Task 4-f — AI Command Center & Audit Logs views

**Agent:** full-stack-developer
**Date:** 2025-06-28

## What was built

Two production-ready view components for the ALO Education system:

### 1. `src/components/alo/views/ai-command-center.tsx`
Exports `AiCommandCenter` (named, no props).

**Sections implemented:**
- **PageHeader** — title "AI Command Center", icon `Bot`, subtitle "18 departments · 54+ AI agents managing the entire student journey." with a Refresh button.
- **AI Safety Rules banner** — orange-bordered card (`bg-orange-50/40 border-[#E8501A]/40`) with two columns: "AI MUST NOT" (8 items with red `X` icons) and "AI MUST" (8 items with green `Check` icons).
- **Stats row** — 4 StatCards derived from `GET /api/ai-agents`: Total AI Agents (blue/Bot), Active Agents (emerald/Activity), Jobs Processed (orange/Zap), Pending Approvals (amber/AlertCircle).
- **Department grid** — agents grouped by 18 departments (`DEPT_ICONS` map → UserPlus, MessageSquare, ClipboardList, Plane, Megaphone, MessageCircle, Share2, GraduationCap, Mic, FileCheck, FileText, Building2, Search, DollarSign, Users, BarChart3, ShieldCheck, ScrollText). Each `SectionCard` lists every agent with `agentCode`, `agentName`, status badge (ACTIVE=emerald, IDLE=amber, PAUSED=slate), `jobsProcessed`, pending badge (red when >0), `lastRunAt` via `timeAgo`, and per-agent Run/Pause/Resume/Details action buttons. Responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.
- **Human Approval Queue** — aggregates agents with `pendingApprovals > 0`, shows per-department approval text from `APPROVAL_TEXT` map, with green Approve + red Reject buttons that toast.
- **Risk Alerts** — 4 sample alerts (visa risk, scholarship uncertainty, duplicate lead, SOP similarity) with high/medium severity badges and "Assign to reviewer" toast action.
- LoadingGrid (count=4 for stats, count=6 for departments) while fetching.

### 2. `src/components/alo/views/audit-logs.tsx`
Exports `AuditLogs` (named, no props).

**Sections implemented:**
- **PageHeader** — title "Audit Logs", icon `ShieldCheck`, with Refresh button.
- **Stats row** — 4 StatCards computed from logs: Total Events (blue/ScrollText), Logins Today (emerald/LogIn, since 00:00), Failed Actions (rose/AlertTriangle), AI Actions (violet/Bot).
- **Security summary banner** — blue-tinted card with 4 security posture points: permission-checked downloads, private routes only, no public file URLs, suspended users blocked.
- **Filters** — action-type Select (13 options incl. ALL), resource Select (5 options), and a search Input (matches user, IP, action, resource ID, details summary). Clear-filters button when active.
- **Audit table** — scrollable `max-h-[40rem] overflow-y-auto alo-scroll`, sticky header, columns: Timestamp (fmtDate + fmtTime, mono small), Action (StatusBadge with full 17-action color map), Resource + Resource ID, User (name + role badge + email), Details (summarized from JSON, line-clamped with tooltip), IP Address (mono), View button.
- **Detail Dialog** — opens on View click, shows action, timestamp, resource, IP, user, and pretty-printed raw JSON (`JSON.stringify(parsed, null, 2)`) in a scrollable `<pre>`. Includes Copy JSON + Flag for review buttons.
- EmptyState when no logs / no matches; LoadingGrid while fetching.

## Technical decisions
- All data fetched client-side with `fetch(..., { cache: "no-store" })` and proper loading/refresh/error states.
- JSON parsed safely via `safeParseJSON` helper with try/catch and fallback.
- `summarizeDetails` helper prefers `note/summary/description/message/reason/action` keys, else shows first 2 key-value pairs.
- Toasts for every interactive button (Run/Pause/Resume/Approve/Reject/Assign/Copy/Flag/Details).
- All cards use `rounded-2xl border-2` per design system; orange CTA `bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12` used for the Flag-for-review action.
- No indigo/blue-500 defaults; brand blue `#0057B8` used consistently for headers, icons, and accent borders.
- Mobile-first responsive layouts throughout (grid breakpoints, table horizontal-scroll, dialog `sm:max-w-2xl`).

## Verification
- `bun run lint` → 0 errors (only a pre-existing warning in `prisma/seed.ts`).
- Dev server compiles cleanly: `✓ Compiled in 185ms` (stale "module not found" lines in `dev.log` reference other views being built in parallel by sibling agents — out of scope for 4-f).
- Both files created at the exact requested paths with the correct named exports and no props.

## Files touched
- Created: `src/components/alo/views/ai-command-center.tsx` (25.7 KB)
- Created: `src/components/alo/views/audit-logs.tsx` (27.5 KB)
- Did NOT modify: `shared.tsx`, `alo-types.ts`, `app-shell.tsx`, `page.tsx`.
