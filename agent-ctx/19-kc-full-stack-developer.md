# Task 19-kc — Knowledge Center + Central AI Command Center

**Agent:** full-stack-developer
**Task:** Build two ALO Education views — `KnowledgeCenter` (employee knowledge base, news, training, AI search) and `CentralAiCommand` (central AI agent registry command center).

## Files created (exactly 2)

1. `/home/z/my-project/src/components/alo/views/knowledge-center.tsx` — named export `KnowledgeCenter`, no props, `"use client"`.
2. `/home/z/my-project/src/components/alo/views/central-ai-command.tsx` — named export `CentralAiCommand`, no props, `"use client"`.

## Work Log

- Read `worklog.md` (all prior tasks 1–3, 4-*, 13–18) to align with the ALO Education design system, shared.tsx helpers (Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader, Progress, MiniBar), alo-types.ts date helpers (fmtDate, timeAgo), and the shadcn/ui inventory.
- Inspected the 6 backend routes and the 5 Prisma models backing this task:
  - `GET/POST /api/knowledge-center/documents` → `{ documents[], categories[], stats: {total, featured, pinned} }` (POST returns `{ doc, message }`).
  - `GET /api/knowledge-center/news?category=&country=` → `{ news[] }`.
  - `GET /api/knowledge-center/training` → `{ trainings[] }`.
  - `GET /api/knowledge-center/search?q=` → `{ query, results: {documents, news, trainings, total}, documents[], news[], trainings[] }`.
  - `POST /api/knowledge-center/search` body `{ question }` → `{ answer, documents[], news[], totalResults }` (AI-powered via z-ai-web-dev-sdk on the backend).
  - `GET /api/ai-registry` → `{ agents[], stats: {total, active, totalRequests, dailyRequests, monthlyRequests, avgSuccessRate, errorCount} }`.
  - `PATCH /api/ai-registry` body `{ id, status }` → `{ agent, message }`.
- Verified Prisma schema for KnowledgeCategory, KnowledgeDocument (fileType, aiSummary, aiTags, isFeatured, isPinned, downloadCount, visibility), KnowledgeNews (category, country, isPinned, isFeatured, publishedAt), TrainingMaterial (type, duration, certificateEnabled, enrolledCount, completedCount), and AiAgentRegistry (agentCode, agentType, status, version, promptTemplate, apiUsed, fallbackApi, dailyRequests, monthlyRequests, totalRequests, successRate, avgResponseTime, lastExecutedAt, errorCount, lastError, executionLog, config).

## VIEW 1 — KnowledgeCenter (`knowledge-center.tsx`)

- PageHeader "Employee Knowledge Center", icon `BookMarked`, full subtitle, Refresh action.
- 4 StatCards: Total Documents (blue, hint pinned count), Featured Documents (orange), Latest News (violet, hint pinned count), Training Materials (emerald).
- 4 tabs: Documents | News & Updates | Training Center | AI Search.
- **Documents tab**: SectionCard with search input (title/description), category filter pills (All + every category returned by API, each with its icon if present), file-type filter pills (All + PDF/DOCX/PPT/XLSX/IMAGE/ZIP/VIDEO/AUDIO/LINK), live "showing X of Y" counter, responsive 1/2/3-col document grid. Each card: FileTypeBadge, Featured/Pinned badges, title, category chip, AI Summary block (violet-tinted, only shown when present) or description, TagPills (merged `tags` + `aiTags` JSON arrays via `safeParseTags`), download count + upload date + visibility, blue Download button (toast "access logged to your employee audit trail"). Upload Document button (orange #C2410C) opens Dialog with: title, category Select, file-type Select, visibility Select, file path, comma-separated tags, description Textarea → POST /api/knowledge-center/documents, optimistic refresh, toast confirms AI auto-processing.
- **News & Updates tab**: category filter pills for all 12 categories (OFFICE_ANNOUNCEMENT, UNIVERSITY_UPDATE, SCHOLARSHIP_UPDATE, COUNTRY_UPDATE, IMMIGRATION_UPDATE, TRAINING_NEWS, MEETING_NOTES, POLICY_UPDATE, HR_NOTICE, MARKETING_NOTICE, SALES_NOTICE, VISA_NOTICE) with category-colored badges; news cards with category badge + country badge + Pinned/Featured badges, title, truncated content, tags, published date + timeAgo.
- **Training Center tab**: cards with type badge (10 type meta: RECORDED_TRAINING, LIVE_TRAINING, QUIZ, CERTIFICATE, HANDBOOK, SALES_TRAINING, COUNSELING_TRAINING, VISA_TRAINING, CRM_TRAINING, AI_TRAINING), certificate badge (emerald) when `certificateEnabled`, title, description, tags, enrollment progress block (completed/enrolled + Progress bar colored blue + completion % + pass score when present), duration + enrolled count, orange Start Training button (toast).
- **AI Search tab — THE KEY FEATURE**: SectionCard "Ask AI — Knowledge Assistant" with question Input + blue "Ask AI" button → POST /api/knowledge-center/search; 6 example question chips ("UK visa documents", "Canada SDS requirements", "SOP template", "Bank statement guide", "Scholarship deadlines", "Australia GTE requirement") that trigger the search immediately; loading skeleton while AI is searching; on success renders AI answer in violet-gradient card with totalResults counter, matching documents grid (with per-doc FileTypeBadge + outline Download buttons that toast), and matching news list. Below it, a separate "Enterprise Search" SectionCard that does GET /api/knowledge-center/search?q=, showing 4 stats tiles (Total/Documents/News/Training) and grouped result lists for documents, news (with category + country badges), and training materials.
- Footer cards: RBAC note ("Employees Only" — amber-tinted, lists all 8 visibility options as pills) and AI Auto-Processing note ("AI Indexing Pipeline" — violet-tinted, 4-step pipeline tiles: Categorize, Tag, Summarize, Index).
- LoadingGrid (4 skeletons) + 4 skeleton cards during initial Promise.all fetch (documents + news + training).
- EmptyState fallbacks on every tab when collections are empty.

## VIEW 2 — CentralAiCommand (`central-ai-command.tsx`)

- PageHeader "Central AI Command Center", icon `BrainCircuit`, full subtitle, Refresh action.
- 6 StatCards: Total AI Agents (blue), Active Agents (emerald), Total Requests (violet, from stats.totalRequests), Daily Requests (orange, from stats.dailyRequests), Avg Success Rate (emerald, from stats.avgSuccessRate, with monthly hint), Error Count (rose, from stats.errorCount).
- **Architecture visualization** SectionCard: 3 ArchitectureBox components in a row (lg) / column (mobile) — AI Gateway (blue, Plug icon) → Task Router (violet, Split icon) → Specialized AI Agents (orange, Bot icon, dynamic count). Arrows flip between ArrowRight (desktop) and ArrowDown (mobile). Below: 3 mini-tiles describing "Single choke point", "Shared services", "Invisible to users".
- **AI Agent Registry table** SectionCard: search input + status filter Select + type filter Select + sort indicator. Sticky-header table inside a max-h-[640px] alo-scroll container. 13 columns: Agent Code (mono blue, sortable), Agent Name (sortable), Type (TypePill, sortable), Status (StatusPill with colored dot), Version (mono), Daily Requests (sortable), Monthly Requests, Total Requests (sortable), Success Rate (SuccessRateCell — colored value + Progress bar via `indicatorColor`, sortable), Avg Response Time (ms), API Used (mono pill, truncated), Last Executed (timeAgo), Actions (Pause/Activate outline button — emerald to activate, amber to pause). Clicking a row opens the detail dialog; clicking the Actions cell is stopPropagation'd so the toggle doesn't double-fire. Sortable by totalRequests, dailyRequests, successRate, type, name with asc/desc toggle.
- **Agent detail Dialog**: type pill + status pill + version badge + apiUsed badge + fallbackApi badge (when present); description block; 4×2 metrics grid (daily/monthly/total requests, error count, success rate with Progress, avg response, last executed with date+timeAgo); Configuration card (parses `config` JSON into key/value tiles); Prompt Template card (violet-tinted, `<pre>` with mono font, max-h-48 scroll); Execution Log card (parses `executionLog` JSON array, shows last 10 entries reversed with action + timestamp + status); Last Error card (rose-tinted `<pre>` when `lastError` present). Footer: Test Agent button (toast), Close, and a Pause/Activate button (amber for pause, emerald for activate) that calls PATCH /api/ai-registry and updates local state optimistically.
- **Footer**: AI integration note ("One AI brain. Every feature." — blue-gradient card, 4 mini-tiles: No duplicated logic / Single architecture / Shared services / Invisible to users) + **AI Safety Rules card** (rose-tinted "AI MUST NOT" with 7 items: delete production data, publish without approval, send bulk messages, change DNS, deploy, spend money, reveal sensitive data; emerald-tinted "AI MUST" with 4 items: save logs, mark uncertain data, send risky cases to human review, save every action to timeline).
- LoadingGrid (6 skeletons) + skeleton table card during initial fetch.
- Toast notifications for: fetch errors, toggle success/failure, test execution.

## Shared implementation details

- Both files use only `@/components/alo/shared` (Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader, Progress), `@/components/ui/*` (Button, Card, Badge, Input, Textarea, Label, Tabs, Dialog, Select, Table, Skeleton), `@/hooks/use-toast`, `@/lib/utils` (cn), `@/lib/alo-types` (fmtDate, timeAgo).
- Design system respected: Blue #0057B8 primary, SaaS Blue #2563EB secondary, CTA Orange #C2410C (upload/start-training CTA), white bg + white cards, border #E2E8F0, rounded-2xl, alo-shadow, alo-scroll custom scrollbar, badge-text/body-text/card-title/crm-page-title typography tokens.
- Mobile-first responsive: stat grids 2→3→6 / 2→4; tab strip wraps on mobile; tables horizontally scrollable; architecture boxes stack on mobile with vertical arrows.
- All JSON string fields (tags, aiTags, config, executionLog) parsed defensively via `safeParseTags`/`safeParseJson` with comma-separated fallback for tags.
- Numeric helpers: `fmtNum` (K/M suffix), `successRateColor` (≥95 emerald, ≥85 orange, ≥70 amber, <70 rose), reused for Progress `indicatorColor`.

## Quality Checks

- `npx tsc --noEmit -p tsconfig.json` → 0 errors in either file (after fixing one initial `safeParseJson` optional-param ordering error — made `raw` required `string | null | undefined` since every caller passes it).
- `bun run lint` (full project) → exit 0, no errors or warnings.
- Dev server log shows `✓ Ready` with no compile errors after the new files were added.

## Did NOT modify

- shared.tsx, alo-types.ts, any API route, any Prisma schema, page.tsx, app-shell.tsx, or any other existing file. Both files are net-new additions at the exact requested paths.
