# ALO CRM — Web Search → Crawl/Scrape → Extract → AI Structured → CRM

**Pattern:** `Web Search → Website Crawl/Scrape → Extract → AI/structured data → Database/CRM`  
**Date:** 2026-09-14  **Branch:** `arena/01a09c20-alo-education-z-ai`  
**Principle:** Full check before feedback — all 10 repos fetched, no fake completion. Insert/update `University / Course / Country / Visa / Lead` with `sourceUrl + lastVerifiedAt` + human approval gate.

---

## 1) Top 3 For ALO (evidence-based)

| Rank | Repo | Why practical for ALO |
|---|---|---|
| **#1 Molx** — [ioi-labs/molx](https://github.com/ioi-labs/molx) — 35 commits, Go 1.25+, MIT, self-hosted Firecrawl alternative | **Free, on VPS, no per-lead markup.** HTTP API: `/v1/search`, `/v1/scrape`, `/v1/crawl`, `/v1/batch`, `/v1/enrich` (prompt + JSON schema → `GET /enrich/{id}` polling). Lean 3MB idle / 7MB workload, Obscura glibc 2.35+, Go binary. Directly replaces paid Firecrawl for BD host with low VPS overhead. |
| **#2 Market Intelligence Radar** — [guifav/market-intelligence-radar](https://github.com/guifav/market-intelligence-radar) — MIT, Next.js + Python `mir/` | **Web → AI → PostgreSQL → CRM matching** already solved. Pipeline: scan configurable news sources (RSS/search) → LLM extract `(people, companies, deals, signals)` (Claude/GPT-4o/Gemini) → CRM CSV matching → Apollo/SalesQL enrichment → dashboard lead approval. Taxonomy/divisions/target profiles, Docker healthcheck. **We adapt PG → MySQL** (ALO uses MySQL 8.4). |
| **#3 Firecrawl** — [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) — 180k★ 6292 commits + [firecrawl/web-agent](https://github.com/firecrawl/web-agent) 1.2k★ 538 commits | **Production-grade Search → Scrape → Crawl → Map → Extract** ecosystem + schema validation. Provider discovery via Search + billed Scrape (Autumn credits, Exchange). Web-agent adds `validateAgainstSchema` / `plan(schema)` / `formatOutput` repair gate (bounded `schemaRepairAttempts`). Use as **cloud fallback** when Molx not yet deployed. |

**Chosen practical architecture for ALO:**
```
Molx (self-hosted, free) ─┐
                           ├─→ [AI Research Agent + Schema Gate] ─→ Prisma MySQL (University/Course/Country/Visa/Lead + sourceUrl/lastVerifiedAt) ─→ Super Admin approval (DataChange) ─→ CRM
Firecrawl (cloud fallback) ┘         ↑ existing university-monitoring-engine.ts + OfficialSource/SourceSnapshot/VerificationRun
```
Why: Molx runs at cost on your VPS (no vendor lock-in), Firecrawl guarantees continuity, market-radar pattern gives the DB/approval shape, and the monitoring engine already has `OfficialSource → SourceSnapshot → DataChange → queue` with `sourceUrl + lastVerifiedAt`.

Other 7 enrich the same pipeline (not separate stacks): see §2.

---

## 2) All 10 repos — full function check → what ALO already has vs gap → where integrated

| # | Repo (fetched 2026-09-14) | Core function (real) | Already in ALO? | Gap | Integrated file |
|---|---|---|---|---|---|
| 1 | **ioi-labs/molx** — scrape/search/batch/LLM-enrich HTTP API, Go, batch+cleaner+extractor+obscura+scraper+searchfactory, 3MB idle | Unified scrape API | **Partial** — `university-monitoring-engine.ts` uses `z-ai-web-dev-sdk` remote reader/search, **no self-hosted scrape**, no batch, no `/enrich` schema polling | Needs self-hosted lane | `src/lib/research/molx-firecrawl-client.ts` — `webSearch`/`webScrape`/`webCrawl`/`webBatch`/`webEnrich` (Molx primary → Firecrawl fallback), `researchProviderStatus()` |
| 2 | **firecrawl/firecrawl** — 180k★ search+scrape+crawl+map+extract, provider discovery, billed execution, BullMQ, Autumn | Production crawl/map/extract | Same as #1 + missing `map` | Same | same file (Firecrawl fallback, `FIRECRAWL_*` env) |
| 3 | **firecrawl/web-agent** — schema-validate `coerceToJson`/`extractFieldPaths`/`validateAgainstSchema`, `plan(schema)` injects required paths, `formatOutput` gate + repair hint, `schemaRepairAttempts` | Typed extraction with gate | **Gap** — ALO calls LLM via `generateText` but **no schema gate**; hallucinations not caught | Needs gate | `src/lib/research/structured-extractor.ts` — `extractFieldPaths`/`coerceToJson`/`validateAgainstSchema` + `llmExtract(..., repairAttempts=2)` |
| 4 | **firecrawl org** — ecosystem (reference) | Org-level SDK/docs | — | — | same as #1 |
| 5 | **guifav/market-intelligence-radar** — news scan → LLM entities (people/companies/deals/signals) multi-LLM → PG → CRM CSV match → Apollo/SalesQL → dashboard approval, auth hardening | News → CRM with approval | **Partial** — `university-monitoring-engine.ts` does official source polling + AI `extractKeyFacts` + `DataChange` queue, but **no news-RSS scan, no people/deals entity set, PG not MySQL** | Adapt PG→MySQL + add news source type | `src/lib/research/market-intel-radar.ts` — `radarScanSource` (RSS or search fallback) → `radarExtractArticle` → `radarMatchToCRM` (University/Lead) → `CrmAuditLog RADAR_SIGNAL` → approval queue |
| 6 | **parthasarathy123/n8n-gtm-lead-enrichment** — Apify Google Places → normalize → contactability filter (email OR phone) → deterministic `identityKey` → quality score + confidence bands → Clay async (2h timeout) → Zoho duplicate search → 4 branches (create/update/review/failure) → Qualified Output only after Zoho success, Sheets I/O | GTM lead pipeline with Zoho gate | **Partial** — `lead-scoring-engine.ts` + `behavior-tracking.ts` + `facebook-lead-sync.ts` exist, but **no Apify sourcing, no deterministic dedup key, no confidence bands, no 4-branch gate** | Add | `src/lib/research/lead-enrichment-pipeline.ts` — `leadIdentityKey` + `scoreLeadQuality` (HIGH/MEDIUM/LOW/REJECT) + `fetchApifyLeads` + `runGtmPipeline(rows→qualified/review/rejected, qualified only after ALO `Lead` created)` |
| 7 | **brightdata/open-enrich** — 11★ 73 commits, pnpm workspace, `enrich-core` CLI (`npx open-enrich`), table enrichment via Bright Data, LangChain, `enriching-tables` skill | Enrich CSV table with LLM | **Gap** | Needs generic enricher | same file — `enrichTableRow(row, instruction, schema)` via ALO `generateText` (primary) + `BRIGHTDATA_API_KEY` fallback |
| 8 | **clawnify/OpenProspector** — 6★ 18 commits, Clay alternative, no per-lead markup, Signals `domain|type|source_url` normalized uniqueness → upsert `seen_count` → freshness windows from `occurred_at` (not `detected_at`) → `live` derived on read → `POST /api/signals/{id}/run` 409 when stale | Dated reasons to call, re-sweep free | **Gap** — no signals store; resweeps would double-pay | Add | same file — `upsertSignal` / `listSignals` / `runSignal` (409 on stale) over `CrmAuditLog`+`TimelineEvent` (no new table) |
| 9 | **workwithlos-ui/dave** — 14 commits Python `dave/search` (BaseSearchProvider DuckDuckGo pluggable) + `dave/leads` (Apify Google Maps → `Lead`/`LeadsReport.to_csv`), `search_extract` per-hit isolated + cache/retries/cost, URL→clean validated structured | Search→extract isolation | **Gap** | Needs isolated per-hit pattern | `src/lib/research/structured-extractor.ts` — `searchAndExtract(query,schema,prompt)` per-hit isolated + `scrapeWithWaterfall` + `src/lib/research/lead-enrichment-pipeline.ts` `fetchApifyLeads` |
| 10 | **BraaMohammed/bricks** — 63★ 79 commits, **fully local Clay**, AI agents + Puppeteer, search/scrape waterfalls `TinyFish (api.search.tinyfish.ai / api.fetch.tinyfish.ai) → ScraperAPI → Diffbot → Puppeteer` with 429 handling, Vite React | Local waterfall scrape | **Gap** — no waterfall | Add | `structured-extractor.ts` `scrapeWithWaterfall` (TinyFish → Molx/Firecrawl → direct fetch) + `TINYFISH_API_KEY` env |

---

## 3) Files added (no new Prisma model — reuse existing MySQL)

```
src/lib/research/molx-firecrawl-client.ts     — unified adapter (1+2+3+4), env MOLX_URL/MOLX_API_KEY/FIRECRAWL_API_KEY, search/scrape/crawl/batch/enrich + polling + provider status
src/lib/research/structured-extractor.ts      — schema gate + waterfall + searchAndExtract + upsertWithProvenance (→ CrmAuditLog/SourceSnapshot + sourceUrl/lastVerifiedAt)
src/lib/research/market-intel-radar.ts        — PG→MySQL radar cycle (scan → extract → match → RADAR_SIGNAL audit + approval)
src/lib/research/lead-enrichment-pipeline.ts  — identityKey + quality score + Apify leads + signals store (domain|type|source_url, live derived) + enrichTableRow + runGtmPipeline
```

Reuse: `OfficialSource`, `SourceSnapshot`, `VerificationRun`, `DataChange`, `Lead`, `CrmAuditLog`, `TimelineEvent`, `University`/`Course` (existing).  
No duplicate table: signals → `CrmAuditLog(entityType='Signal')`, radar → `CrmAuditLog(entityType='RadarSignal')`, GTM stats → `CrmAuditLog(entityType='GtmRun')`.

### Env added to `.env.example` (names only, no values — VPS `.env` is source of truth)
```
MOLX_URL=                         # http://molx:3001 or http://localhost:3001
MOLX_API_KEY=
FIRECRAWL_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=                # fallback when MOLX_URL empty/5xx
TINYFISH_API_KEY=                 # Bricks waterfall provider
APIFY_TOKEN=                      # DAVE/GTM: Apify Google Maps (fallback→webSearch)
APIFY_ACTOR=compass/crawler-google-places
BRIGHTDATA_API_KEY=               # Open Enrich fallback
APOLLO_API_KEY= / SALESQL_API_KEY # MIR enrichment (optional)
ALO_CRON_SECRET=                  # scheduler gate (was missing — added)
ALO_APP_URL=https://aloeducation.com
REDIS_URL=redis://127.0.0.1:6379
```

---

## 4) How to run locally (free path)

```bash
# 0) Start Molx (self-hosted, MIT) — lean Go binary
docker compose -f docker-compose.molx.yml up -d  # or: docker run -p 3001:3001 ghcr.io/ioi-labs/molx
# set in .env (local or VPS):
echo "MOLX_URL=http://localhost:3001" >> .env

# 1) News → CRM (Market Radar adapted)
# via ALO API route (to add): POST /api/research/radar/run {sourcesLimit:5}
# or directly:
# import { radarRunCycle } from '@/lib/research/market-intel-radar'
# await radarRunCycle({ sourcesLimit: 5 })

# 2) Search → Extract with schema gate (web-agent pattern)
# import { searchAndExtract } from '@/lib/research/structured-extractor'
# const { extracted, sources } = await searchAndExtract(
#   "Aston University MSc Business fees 2026",
#   { type:"object", properties:{ tuitionFee:{type:"number"}, intake:{type:"string"} }, required:["tuitionFee"] },
#   "Extract tuitionFee and intake"
# )
# extracted[].forEach(e => upsertWithProvenance({ entityType:'COURSE', payload:e, sourceUrl:e._sourceUrl }))
```

**No `MOLX_URL`?** The client automatically falls back: `Molx → Firecrawl → direct fetch`. No code change needed — just set `FIRECRAWL_API_KEY` for cloud fallback.

---

## 5) Verification

- `npx tsc --noEmit --skipLibCheck` — **research/* = 0 errors** (1 fixed `ApifyLead` const assertion)
- `git log --oneline` — commits `09af4da` + this batch will be `feat(research): Web Search → Scrape → Extract → AI → CRM (Molx+Firecrawl+web-agent+radar+GTM/enrich/prospector/dave/bricks)`
- Existing `university-monitoring-engine.ts` (OfficialSource → SourceSnapshot → DataChange → approval queue) is **kept** as the human-review backbone; research pipeline **feeds it** via `upsertWithProvenance`.
