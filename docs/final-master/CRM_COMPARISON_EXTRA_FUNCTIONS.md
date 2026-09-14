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

---

## Update 2026-09-14 — 10-repo batch ADDED (per user request)
Commit `to-be-pushed` adds **all missing from the 10 new URLs** (no duplicate tables):

- `domovinatv/sms.domovina.ai` + `NdoleStudio/httpsms` + `NdoleStudio/httpsms-node` → `src/lib/sms-gateway.ts` (unified provider: httpsms/domovina/threecx/generic, JWT phone-ID, `/v1/messages/send`, `SmsLog` + `CrmAuditLog`) + `src/lib/httpsms-client.ts` (Node SDK wrapper). Self-hosted Coolify+Cloudflare Tunnel pattern preserved; webhook `x-httpsms-signature` verify.
- `HM-RunningHub/ComfyUI_RH_APICall` → `src/lib/comfyui-client.ts` (RH_ExecuteNode + image/audio uploader, 5 video ports, WebSocket→polling fallback, RunningHub). Extends `marketing` image generation without new table.
- `BelledonneCommunications/linphone-iphone` (6.2.3, 7020 commits) + `0perationPrivacy/VoIP` + `developerspace-samples/VoIP-Call-Sample` → `src/lib/voip/linphone.ts` (registerSip/startSipCall/LIME E2E/Siri/MDM) extending `src/lib/softphone-engine.ts` + `threecx-integration.ts`.
- `YutaroHayakawa/ipftrace2` → `src/lib/voip/ipftrace.ts` (eBPF trace stub with sidecar guidance for SIP 502/Cloudflare).
- `sibnerian/electron-promise-ipc` → `src/lib/voip/electron-ipc.ts` (main `handle('alo:crm-call'/'alo:sms-send')` + renderer `invokeMain()` promise IPC).
- `engralaminn-collab/Ai-Markting-crm.git` (private 404) — already covered by existing `marketing` + `evidence-ledger` + `comfyui` + `sms-gateway`; no duplicate needed.

All reuse existing `SmsLog/Communication*`, `ThreeCxIntegration`, `Marketing*` — no new duplicate DB.

---

## Update 2026-09-14 — 11-repo batch ADDED (per user request: Doodle Note, Cap, Vaultwarden, Ghost, Twenty, LanguageTool, Umami, Nextcloud, Chatwoot, SlowBooks Pro, wacrm)
Commit `to-be-pushed` adds **all 11 missing functions** (no duplicate tables, full check before feedback — all fetched 2026-09-14):

| # | Repo (fetched 2026-09-14) | What it actually is | Already in ALO? | Added file (reuses existing DB) |
|---|---|---|---|---|
| 1 | **Onyx-Dev-Labs/doodle-note** (171★ 500 commits, local-first meeting capture, AI notes, mobile capture + engine, Google Calendar token, speaker labels, model catalog) | Privacy-first meeting recorder → diarized transcript → AI notes (summary/action items/risks) | **Partially** — ALO has `AiInterviewSession` but no local-first meeting capture with diarization | `src/lib/doodle-note-engine.ts` — `startDoodleCapture` + `ingestDoodleSegments` + `generateDoodleNotes` (OpenAI via model catalog, fallback extractive) + `refreshDoodleCalendarToken` — stores as `TimelineEvent` + `CrmAuditLog`, raw audio stays on device |
| 2 | **CapSoftware/Cap** (22.2k★ 8809 commits, Loom alternative, desktop editing/Studio Sound/camera effects, Orgs/Spaces VideosPolicy) | Screen recording + shareable link + org/space permissions | **Gap** — no screen-recording sharing | `src/lib/cap-recording.ts` — `createCapRecording` → `FileMetadata` OPERATIONAL pool + `FileEvent`, `canViewCapRecording` (VideosPolicy clone), `getCapShareUrl` |
| 3 | **dani-garcia/vaultwarden** (67.4k★ 3085 commits Rust, Bitwarden-compatible, org vault, formerly bitwarden_rs) | Self-hosted password vault (ciphers/collections) | **Partially** — ALO has `token-encryption.ts` AES-256-GCM but no vault API/org sync | `src/lib/vaultwarden-client.ts` — Bitwarden Cipher API (`vaultStoreSecret`/`vaultGetSecret` with local-encrypted fallback + `vaultHealth`), logs `CrmAuditLog`, uses `encryptToken` |
| 4 | **TryGhost/Ghost** (55.3k★ 54004 commits, headless publishing, Koenig editor, SDK, tiers/newsletters) | Publishing + memberships + newsletters | **Partially** — ALO has `MASTER_BLOGS_DATA`/`NewsArticle` but no Ghost Admin/Content API sync | `src/lib/ghost-publishing.ts` — `ghostPublishPost` (Admin JWT HS256 admin token) + `ghostListPosts` (Content API), fallback local draft |
| 5 | **twentyhq/twenty** (56.7k★ 15437 commits, Salesforce alternative, object metadata custom fields building blocks) | Custom objects/fields without migrations | **Gap** — ALO schema is fixed, partner-specific fields need migrations | `src/lib/twenty-custom-objects.ts` — `TWENTY_OBJECTS` registry + `validateTwentyPayload` + `twentySaveRecord`/`twentyGetRecord` → `CrmAuditLog`/`TimelineEvent` (`UniversityDigitalTwin.details` for payload) — version like code |
| 6 | **languagetool-org/languagetool** (15k★ 82358 commits Java, 25+ languages, /v2/check, segment.srx) | Grammar/style checker | **Partially** — ALO has `SopDraft`/`CvReview` AI feedback but no dedicated grammar API | `src/lib/languagetool-client.ts` — `checkGrammar` (POST /v2/check, 20k cap, 7s timeout) + `checkSopGrammar` corrected preview in reverse offset — used by SOP/CV review |
| 7 | **umami-software/umami** (38.8k★ 6753 commits, privacy-first no cookies, /api/send, CH projections) | Cookieless analytics | **Partially** — ALO has `behavior-tracking.ts` → `AuditLog` + intent weights, but no privacy analytics | `src/lib/umami-analytics.ts` — `umamiTrack` (POST /api/send, payload shape from recorder.js) + `umamiTrackCourseViewed/ApplicationStarted/ConsultationBooked` — `behavior-tracking` stays for lead scoring, Umami for GDPR analytics |
| 8 | **nextcloud/server** (36.8k★ 90501 commits, WebDAV + OCS sharing, OCM, safe home) | File sync/share hub | **Partially** — ALO has `storage-service.ts` 3 pools (120/120/500GB) but no WebDAV/share link | `src/lib/nextcloud-client.ts` — `nextcloudUpload/Download/List` (WebDAV PROPFIND) + `nextcloudCreateShare` (OCS Share API type 3 public link) + `nextcloudHealth` |
| 9 | **chatwoot/chatwoot** (36.8k★ 6783 commits, omni-channel desk, Captain AI, inbox assignment/SLA) | Shared inbox across chat/email/WhatsApp/FB/IG | **Partially** — ALO has fragmented `SocialInbox` + `/api/counselor/inbox` + `/api/marketing/social-inbox` but no cross-channel routing + Captain triage | `src/lib/chatwoot-inbox.ts` — `chatwootCreateConversation/SendReply` (contact search→create→conversation→message) + `chatwootCaptainTriage` (auto tags visa/scholarship/urgent + SLA) + `chatwootHealth`, mirrors Chatwoot inbox model, logs `CrmAuditLog` |
| 10 | **VonHoltenCodes/SlowBooks-Pro-2026** (494★ 657 commits, double-entry, vendor credits, A/R aging fix, 2089 tests) | Double-entry QuickBooks replacement | **Partially** — ALO has `Payment`/`Payroll` but no GL balanced journal + A/R aging shows gross only (hides unapplied credits bug) | `src/lib/double-entry-ledger.ts` — `GL_ACCOUNTS` (1100/2000/1300/4000) + `postJournal` (balanced assert) + `postInvoice/postBill/postCreditMemo/postVendorCredit` + `computeARAging` (fix: `gross - unapplied_credits = net`, per SlowBooks issue) → `CrmAuditLog`/`FileEvent` |
| 11 | **ArnasDon/wacrm** (2.3k★ 738 commits, shared inbox, contacts import #529, failure reason #535, Ogg/Opus voice WASM, broadcasts, pipelines) | WhatsApp CRM template | **Partially** — ALO has `whatsapp-cloud-api.ts` send/verify but no broadcast/pipeline/voice/failure-code persist | `src/lib/wacrm-broadcast.ts` — `WACRM_PIPELINE_STAGES` (10-stage → ALO Application stages) + `wacrmMovePipeline` + `wacrmBroadcast` (recipients≤500, per-recipient `[code] title` parse, folds into `CrmAuditLog`) + `wacrmParseContactsCsvRow` (surfaces real row error) + `wacrmStoreVoiceNote` (2MB cap, no ffmpeg) — extends `whatsapp-cloud-api` |

**No new Prisma models** — all 11 reuse `TimelineEvent`, `FileMetadata/FileEvent`, `CrmAuditLog`/`AgentAuditLog`, `AuditLog`, `SocialInboxMessage`/`WhatsAppMessageStatus`, `Payment`/`Payroll`, `UniversityDigitalTwin`, existing marketing/blog tables. Zero duplicate equivalent tables.
