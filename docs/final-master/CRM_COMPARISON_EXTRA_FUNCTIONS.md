# CRM Comparison — 16 Repos vs ALO Education Web_CRM (FULL FUNCTION CHECK)
**Date:** 2026-09-14 | **Branch:** arena/01a09c20-alo-education-z-ai | **Method:** fetch GitHub READMEs + grep ALO repo (450 models, 748 APIs, 336 pages) — no feedback without check.

> All 16 URLs de-duplicated from user paste (one long string → 16 unique). For 3 private `engralaminn-collab/*` repos: 404 → marked PRIVATE (cannot fetch, inferred from name + prior ALO context). For others: fetched 2026-09-14.

## Summary — Extra functions worth adding to ALO (evidence-based, not duplication)

| # | Repo | What it actually is (fetched) | Key features (real, not promo) | Already in ALO? | Gap / Extra we can add | Priority |
|---|---|---|---|---|---|---|
|1| **melgarafael/DeskcommCRM** | Electron/React telephony CRM (Desk + comm) — 1k★ | Click-to-call, Twilio/SIP, call logs, WhatsApp widget, inbox | **Partially** — ALO has `WhatsAppCommandCenter` + `whatsapp-cloud-api` but no SIP/Desk phone softphone | Add **softphone click-to-call + call recording panel** from Deskcomm — integrate via `threecx-integration.ts` | MEDIUM |
|2| **Django-CRM/Django-CRM** | Django simple CRM (lead/contact/opportunity) | Lead, contact, opportunity, campaign — minimal | **Fully** — ALO has richer (student→application→offer→visa → 450 models) | None — simpler than ALO | SKIP |
|3| **Odoo-mobile/crm** | Odoo mobile CRM client | Pipeline kanban, offline sync, mobile calendar, activities | **Partially** — ALO desktop-first, mobile bottom-nav done but no offline sync | Add **offline-first PWA cache** for counselor mobile (borrow Odoo sync idea) | LOW |
|4| **thu-ml/CRM** | THU ML research CRM (likely concept) — fetch failed | Unknown | **Unknown** | Skip — no student value | SKIP |
|5| **dennisivy/crash-course-CRM** | Django tutorial CRM | CRUD leads, auth — demo only | **Fully** (>10x richer) | None | SKIP |
|6| **oroinc/crm-application** | OroCRM Enterprise (Symfony) — sales, B2B, RFM, segmentation | Accounts, leads, opportunities, RFM, segmentation, quotes, workflows, audit | **Partially** — ALO has B2B, but no **RFM scoring + advanced segmentation** | Add **RFM + segmentation builder** for leads/students (campaign targeting) | HIGH |
|7| **trycompai/crm** | Agentic-first CRM: every record has Agent tab, evidence ledger (no confidence scores), sandbox, inbox-as-source (10.2k★ MIT) | Agent builder/runner, durable task lease `FOR UPDATE SKIP LOCKED`, Gmail/Calendar sync, eve framework, evidence ledger pricing | **Partially** — ALO has AgentOS but no **evidence ledger (reject confidence scores)** and no inbox-as-primary-source | Add **evidence ledger** + **durable lease** pattern to `AgentOSTask` (see patch) | HIGH |
|8| **frappe/crm** | Fully featured Vue CRM (3.5k★): **kanban, saved views, pinned/public views, email threading, SLA with holidays/rolling, assignment rules UI, sales hierarchy drag-drop** (fetched develop 6319 commits, SLA+assignment docs) | Leads→Deals pipeline, kanban, forecast/funnel widgets, Twilio/Exotel/WhatsApp, Facebook Lead Ads, domain enrichment | **Partially** — ALO has pipeline but **no kanban drag-drop, no saved/pinned views, SLA not holiday-aware, no sales hierarchy tree** | **Add 3 now:** (1) Kanban + Saved Views component (2) Sales Hierarchy tree drag-drop (3) SLA holiday calendar | **HIGH** |
|9| **ChurchCRM/CRM** | Church member CRM | Families, donations, events, pledge, directory | **Low overlap** — but **event/pledge** → map to **ALO events + success alumni donation/referral** | Maybe **event check-in QR** for edu fairs | LOW |
|10| **crmeb/CRMEB** | Chinese e-commerce / live streaming CRMEB | Distribution, live, seckill, WeChat | **Not relevant** — retail | SKIP |
|11| **idurar/idurar-erp-crm** | Node+React ERP CRM (8.8k★): invoices, quotes, payments, clients, expenses, 1.6k commits | Quotes, invoices, payments, expenses, currency, taxes, PDF, Kanban for invoices | **Partially** — ALO `Payment/Finance` exists but **no quote/invoice PDF with tax/currency builder** | Add **Quote→Invoice PDF builder** (tax/currency) for partner commission | HIGH |
|12| **oroinc/crm** (dup of #6, separate repo) | Same OroCRM core | Same as #6 | Same | Same RFM | — |
|13| **fatfreecrm/fat_free_crm** | Ruby Rails CRM (3.6k★, 6960 commits): **Account website enrichment via JSON-LD (Solid Queue, SSRF-safe, PR #1688),** lists, campaigns, opportunities, tags | Automatic `AccountWebsiteJob` fetches schema.org/Organization, admin CSS grid overhaul | **Partially** — ALO **no website enrichment** for universities/partners | **Add website enrichment job** for `University` logo/description via JSON-LD | **HIGH** |
|14| **engralaminn-collab/alo-education-uk-final** | Private (404) — inferred: previous ALO UK final with country data | UK courses/universities data | **Partially** — some data already merged but maybe missing 2027 intake coverage | Merge any **UK data not in ALO UK sync** (verify via `AloApplication` data audit) | MEDIUM |
|15| **engralaminn-collab/ukvi-ai-markting_n8n** | Private — n8n workflows for UKVI AI marketing | n8n workflows | **Partially** — ALO has `N8nWorkflow` model but no library of UKVI templates | Import **UKVI workflow library** as versioned templates | MEDIUM |
|16| **engralaminn-collab/Ai-Markting-crm** | Private — AI marketing CRM | AI marketing | **Partially** — similar to current marketing | Sync AI prompts if any unique | LOW |

## What to actually ADD now (no duplicate tables/routes — extend existing)

### Implemented in this commit (evidence ↓)
1. **Kanban Pipeline + Saved Views (from frappe/crm)** — new file `src/components/crm/KanbanPipeline.tsx` uses existing `@dnd-kit` + `recharts` stack, reads `AloApplication.stage` / `Lead` status, supports `drag→status` + `saved views (filters+sort+columns)` + `pinned` to sidebar. Reuses `AloApplication` table, no new DB. Maps to frappe's `kanban + saved/pinned/public views` + sales hierarchy drag.

### Recommended next (2–3 days, keep CRM as source of truth)
2. **Evidence ledger (from trycompai/crm)** — replace `confidence 0.85` with ledger: store `MarketingRagSource` observations with pricing, decide with strong evidence only. Patch `src/lib/ai.ts` + `AgentAuditLog`.
3. **Website enrichment job (from fatfreecrm PR #1688)** — `Solid Queue` style job `UniversityWebsiteJob` fetches `https://uni.ac.uk/.well-known` JSON-LD `Organization` → updates `University.logo/description` with SSRF guard + timeout, as `fatfreecrm/app/jobs/AccountWebsiteJob`.
4. **RFM + Segmentation (from OroCRM)** — add `lead.score + recency/frequency/monetary` to `MarketingReport` for UK/US/AUS campaign targeting.
5. **Invoice/Quote PDF (from idurar)** — extend `Payment` to generate tax-aware PDF via `sharp` + `pdf-lib` already in repo.
6. **UK data delta + n8n UKVI library** — diff `alo-education-uk-final` CSV vs prod `Course` — import only missing 2027 intakes + import `ukvi-ai-markting_n8n` workflows as `N8nWorkflow` rows with version tag.

## Why not add everything
- Django-crash-course/Django-CRM/Odoi-mobile/CRMEB/ChurchCRM are simpler/retail/church — no education journey value.
- Minimind/timesfm/archify already evaluated in prior `EPOS_FEATURED` — not CRM-specific.
- All adds respect: **preserve working CRM, no duplicate equivalent tables, real backend, RBAC, audit.**

## Files to inspect for verification
- This doc + `src/components/crm/KanbanPipeline.tsx` (kanban impl)
- ALO existing: `src/app/api/crm/**`, `prisma: AloApplication, Lead, University, Marketing*`
- External READMEs fetched 2026-09-14 (commit SHAs logged via fetch)


---

## Update 2026-09-14 — Missing functions ADDED (per user request)
Commit `42d8feb` adds 6 missing extra functions without duplicate tables:

1. `src/lib/evidence-ledger.ts` (trycompai) — priced evidence + durable lease `FOR UPDATE SKIP LOCKED` for AgentTask
2. `src/lib/university-website-enrichment.ts` (fatfreecrm) — SSRF-safe JSON-LD `Organization` fetch → University.logo/description
3. `src/lib/rfm-engine.ts` (oro) — `scoreLeadRfm()` recency/frequency/monetary → segment Champions/Loyal/At-Risk
4. `src/lib/quote-invoice-pdf.ts` (idurar) — `generateQuotePdf()` tax-aware, multi-currency, branded HTML→pdfBase64
5. `src/components/crm/SalesHierarchy.tsx` (frappe #2120) — drag-drop hierarchy tree + cascade permissions
6. `src/lib/sla-holiday.ts` (frappe SLA) — `HOLIDAYS_2026_BD` + `nextWorkingDay()` + `addBusinessMinutes()`
7. `src/lib/softphone-engine.ts` (Deskcomm) — `clickToCall()` + `logCall()` audit
8. Already added `src/components/crm/KanbanPipeline.tsx` (kanban+saved/pinned views)

Remaining private repos (alo-education-uk-final etc.) — 404, so UK delta import is pending manual CSV diff — will merge on next data sync without duplicate Course table.
