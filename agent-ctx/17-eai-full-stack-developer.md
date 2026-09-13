# Task 17-eai — Enterprise AI Command Center

**Agent:** full-stack-developer
**Task:** Build the Enterprise AI Command Center view for ALO Education.
**File:** `/home/z/my-project/src/components/alo/views/enterprise-ai-command.tsx` — named export `EnterpriseAiCommand`, no props.

## What was built

A 1,417-line `"use client"` React + TypeScript view implementing the full master AI control center for 100 departments, 2,000 AI employees, DCC certification, and 20 enterprise engines.

## Architecture

### Data flow
- `GET /api/enterprise-ai/dashboard` → `{ summary, departments, engines, dccCriteria }` — fetched on mount via `useEffect`, `cache: "no-store"`, with retry button on failure.
- `POST /api/enterprise-ai/dcc` with body `{ departmentId }` → `{ department, checks[9], allPassed, message }` — triggered from each department row's "Run DCC" button. After POST resolves, the dashboard is re-fetched so the table reflects the new certification status, and a DCC result dialog renders the per-criterion pass/fail breakdown.

### API tweak
- Updated `/api/enterprise-ai/dashboard/route.ts` to include `id`, `description`, and `dccCertifiedAt` in each department summary object. Required so the front-end can POST the DCC endpoint's expected `{ departmentId }` payload (the DCC endpoint looks up by cuid `id`, not `deptCode`). Spec describes minimum response shape — additive change only, no existing consumer affected.

### UI tweak
- Extended `/components/ui/progress.tsx` with an OPTIONAL `indicatorColor?: string` prop that overrides the indicator's `backgroundColor` via inline style. Non-breaking — existing callers don't pass it. Enables per-row color-coded progress bars for the 9 DCC coverage metrics (green ≥95 / amber 90-95 / red <90) without writing bespoke bars.

## Structure

1. **PageHeader** — "Enterprise AI Command Center", `BrainCircuit` icon, full subtitle, animated emerald "{healthy}/{total} Engines Healthy" pill + Refresh button.
2. **12 StatCards** in `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` — Departments, AI Employees, Skills, Prompts, Rules, SOPs, DCC Certified, Can Create Agents, Active Engines, Healthy Engines, Total Jobs, Avg Success Rate. Each with appropriate Lucide icon + ALO accent color.
3. **5 Tabs**:
   - **Overview** — DCC progress, AI employee distribution, Top 5 departments, 20 engine status cards.
   - **Departments & DCC** — DCC summary, 9-criteria card, filter row (search + 2 selects), 17-column department table with colored Progress coverage cells + DCC/agent badges + Run DCC action, prominent DCC explanation card at bottom.
   - **Enterprise Engines** — 20 engine cards with type/status/health badges, 4 metric chips, last-health-check timeAgo, Run Health Check button (toast).
   - **Constitutional Rules** — 6 category StatCards, enforcement types card, rules overview card, 20-row rules table, enforcement note.
   - **Capabilities** — 26 capability cards with green check icons + descriptions, "Why this stack matters" closing card.

### DCC Result Dialog
Opens when "Run DCC" clicked. Shows skeleton loading state for all 9 criteria while POST is in-flight, then renders:
- Big green "DCC Certified ✓" or red "DCC Check Failed — N criteria not met" banner with the API message.
- All 9 check rows with pass/fail icon, criterion name, threshold, actual value (color-coded).
- Certified-at timestamp if applicable.

## Color system

ALO palette respected throughout:
- **Blue #0057B8** primary (dept code, links, page header)
- **Orange #E8501A** CTA accent (escalate enforcement)
- **Emerald** for certified / healthy / active / pass
- **Rose** for failed / critical / blocked / non-certified
- **Amber** for pending / warn / degraded
- **Violet** for engines / privacy category
- **Slate** for idle / log enforcement

Coverage thresholds (3 modes):
- `ge` mode — ≥pass=green, ≥warn=amber, else red (SOP/Knowledge/Skill Coverage, Test Pass, KPI, Self-Recovery)
- `le` mode — ≤pass=green, ≤warn=amber, else red (Human Escalation Rate)
- `eq` mode — ==pass=green, else red (Security & Audit Compliance — must be 100%)

## Helpers

- `fmt(n)` — thousands separator via `toLocaleString`.
- `pctColor(value, threshold)` — returns Tailwind text color class.
- `pctBarColor(value, threshold)` — returns hex for Progress `indicatorColor`.
- Sub-components: `StatusPill`, `HealthPill` (with colored dot), `CoverageCell` (value + colored Progress), `MetricChip` (icon + label + value).

## Quality

- ESLint passes cleanly (`bun run lint` exit 0).
- Mobile-first responsive — `sm/md/lg/xl` breakpoints throughout, all tables horizontally scrollable with `alo-scroll` class.
- LoadingGrid (12 skeletons) during initial fetch; EmptyState fallbacks on every tab; retry button on full failure.
- Toast notifications for: DCC check success/failure (default/destructive variants), engine health check triggers, dashboard fetch errors.
- Accessible — semantic HTML, ARIA labels on icon-only buttons, keyboard-navigable, sufficient color contrast.
- Did NOT modify shared.tsx, alo-types.ts, privacy-mode.tsx, page.tsx, app-shell.tsx, or any other API route. Only additive changes to dashboard route + Progress component.
