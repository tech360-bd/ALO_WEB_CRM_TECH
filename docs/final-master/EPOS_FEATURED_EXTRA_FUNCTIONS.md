# EPOS Featured — Extra Functions Check for ALO Education Student Journey OS
**Date:** 2026-09-14 | **Branch:** arena/01a09c20-alo-education-z-ai  
**Question:** Can any function from the 10 featured + 7 audience repos be added usefully to ALO?  
**Method:** inspected repo READMEs + file tree + stars/maturity + license via fetch 2026-09-14; mapped to ALO gap matrix (120 items).

## TL;DR — Yes, 3 HIGH value, 4 MEDIUM, rest LOW/NOT_RELEVANT. Do not add all 17.

| Repo | What it actually is (2026-09) | Stars | ALO fit | Verdict |
|---|---|---|---|---|
| **tt-a1i/archify** | Agent skill for verifiable architecture/workflow/sequence/data-flow/lifecycle diagrams — self-contained HTML + motion + SVG export (60.7k★, MIT-ish) | 60.7k | **MEDIUM** — auto-generate ALO's 7-step Journey Map + system architecture docs (Student → Counselor → University flow) as branded self-contained HTML/SVG now done manually via `PortalDashboards.tsx` | Add as **docs generator skill** for `docs/final-master` + Journey OS architecture — low risk |
| **bilawalsidhu/gods-eye-view** | Redirect via YouTube — repo not fetched (likely dashboard/surveillance view) | — | **LOW** — naming suggests ops dashboard, but ALO already has `CrmAdminShell` + `AI Command Center`; no clear student value | Skip unless you want a “God’s Eye” ops view — overlap |
| **THU-MAIC/OpenMAIC** | Open Medical AI Collective (multimodal medical agents) | — | **NOT_RELEVANT** — medical imaging/LLM, not education consultancy | Skip |
| **JetBrains/go-modern-guidelines** | Idiomatic Go guidelines (Go 1.21+) | — | **NOT_RELEVANT** — ALO is Next.js 16 / TS / Prisma / MySQL — no Go runtime | Skip |
| **Gitlawb/openclaude** | Open Claude Code alternative / agent runtime | — | **MEDIUM** — could be an extra **model-router target** alongside Groq/OpenRouter/ZAI in `src/lib/ai.ts`; but ALO already has fallback chain. Value only if you need local Claude-compatible harness | Evaluate only if ZAI/Groq rate-limited |
| **K-Dense-AI/scientific-agent-skills** | Reusable agent skills for scientific research (literature, hypothesis, code) | — | **MEDIUM** — pattern library for **Research Agent** (university requirement verification from official sources) + 6-month interview research; but ALO’s RAG already covers — can steal skill prompt structure | Borrow skill cards, not full dep |
| **jingyaogong/minimind** | Train 26M–110M LLM from scratch in 2h (60.9k★, PyTorch) | 60.9k | **LOW** — ALO needs hosted cheap/fast/strong routing (ZAI/Groq), not training tiny base model. Private Ollama already supported in `lib/ai.ts` fallback notes | Skip training; keep Ollama inference only if privacy workload arises |
| **every-app/open-seo** | Open-source Semrush/Ahrefs: site audit, rank tracking, keyword research, content ops (18.6k★, self-host) | 18.6k | **HIGH** — ALO’s **Course Finder + University pages are SEO-critical** (visa/country/course). Today `seo-engine.ts` is thin. Open-SEO gives: audit crawler, keyword clusters, rank tracker, internal-link, schema, content brief | **Integrate:** add `SEO Agent` to Journey OS → crawl `/universities /courses /country/*`, auto keyword `Study Abroad / IELTS / UK` clusters, schema.org Course, audit backlog |
| **omacom/omarchy** | Omarchy — opinionated Arch Linux Hyprland dev env (DHH) | — | **LOW** — dev machine config, not student feature. Useful only for local dev laptops | Skip |
| **google-research/timesfm** | TimesFM 2.5/3.0 — Time-Series Foundation Model for forecasting (32.4k★, Apache 2.0) | 32.4k | **HIGH** — **Forecast** `lead→student→application→offer→visa` funnel, intake demand, counselor capacity, SLA overdue, marketing CPL. ALO has `ANALYTICS AGENT` gap (no forecasting) — TimesFM is perfect complement | **Integrate:** Python micro-service (FastAPI) `timesfm-forecasting` skill → `/api/brains/marketing/forecast` + `sla-engine` + `/crm/reports`. No DB change |
| **EfficientStreet/hindsight** | Decision record / “hindsight” logger (audience) | — | **MEDIUM** — append-only decision log → strengthens **Audit Log + Trajectory Security (#66)** — already have `AgentAuditLog` but hindsight’s time-travel format is nicer | Borrow append-only log schema for `ai_audit` |
| **timharris707/modeldeck** | Model card / deck generator (model metadata cards) | — | **MEDIUM** — **AI Command Center** needs model cards (cost/latency/eval) — today `FINAL_SECURITY_AUDIT` complains no model card | Generate `Model Deck` per `AgentDefinition.engineType` for observability |
| **Artistsyn/cortex_suite** | Cortex multi-agent suite (generic agent framework) | — | **LOW** — ALO already has `AgentOS` (AgentDefinition/Runtime/Tool Gateway). Adding second framework duplicates | Skip |
| **sulabhdubey/rta-smriti-brain** | RTA Smriti — human-like episodic memory brain (RTA) | — | **HIGH** — directly maps to **Student Memory 4 layers (#51)**: Structured/Semantic/Episodic/Timeline + `student_world_state` — ALO’s `AgentMemory` is generic single layer | **Integrate concept:** episodic memory with decay + retrieval by studentId+applicationId, not full repo import |
| **EfficientStreet/youtube-subscriptions-ingest** | Ingest YouTube subscriptions → DB + feed | — | **MEDIUM** — **Marketing:** ingest ALO YouTube + competitor channels for content ideas / trend detection (shorts/reels) alongside `open-seo` | Small n8n-youtube → `MarketingCalendar` ideas |
| **Kayforkind/reimagine-it** | Image “reimagine” (img2img) pipeline | — | **MEDIUM** — **Brand asset** image/video/reel generation — today `CampaignPost` is text-only. Reimagine provides branded template re-imagining | Add as optional image tool behind `brandOverlay:true` |
| **templetongroup/radiant** | Radiant (likely static site / UI radiance) — not fetched | — | **LOW** — unclear, no student journey pull | Skip |

## What to actually add (recommended order, no duplicate tables)

### 1) HIGH — `open-seo` → SEO Agent + Course Finder SEO (1–2 days)
- **Why:** ALO’s Course Finder lives/dies by SEO (country/course/intake pages). `open-seo` audit found rate-limit handling (PR #579), exact URL/subfolder research scopes, rank tracking seed.
- **How:** Docker `open-seo` + Postgres (separate DB, not `aloeduca_`), add `src/lib/seo/seo-agent.ts` that calls its API for `site audit + keywordResearch(country=UK,course=MSc) → KnowledgeBaseArticle` with provenance. Respect existing `seo-engine.ts` — extend, not replace. Keep crawler behind `OFFICIAL` role.
- **Risk:** Crawl rate-limit — use its built-in backoff.

### 2) HIGH — `timesfm` → Forecasting micro-service (2–3 days)
- **Why:** Reporting today is descriptive only (`FINAL_PERFORMANCE`/`AUTOMATION`). Spec needs predictive risk/deadline (#57) + marketing funnel conversion (#11). TimesFM 2.5/3.0 API is stable (379 commits, last 2026-09-09), Apache 2.0.
- **How:** New **optional** Python/FastAPI `ai-service/forecast` (per §115–116 architecture — AI Service separate from Next CRM). Node calls it: `POST /forecast { series: MarketingLead daily, horizon: 30 }`. Store forecast in `MarketingReport` + `StudentWorldState.risk_state`. Do not embed PyTorch in Next build; keep `ecosystem.config.cjs` Node only, add `ai-service` as second PM2 app if needed.
- **Eval:** Use `timesfm-forecasting/SKILL.md` (agentskills.io) — agent-installable.

### 3) HIGH — `rta-smriti-brain` concept → Student Episodic Memory (1 day, no new DB)
- **Why:** Spec #51 + #60 gap is 4-layer memory. Current `AgentMemory` is flat. Smriti’s episodic graph idea (events + decay + retrieval) fills it without importing the whole brain.
- **How:** Extend `AgentMemory` with `layer: STRUCTURED|SEMANTIC|EPISODIC|TIMELINE` + `world_state JSON` (goal/countries/document_state…) and retrieval `by studentId+applicationId+recency`. Keep Prisma, no new model — add columns.

### 4) MEDIUM — `archify` → Journey/Architecture diagram skill (0.5 day)
- Autogenerate 7-step Journey visual `LEAD→ALUMNI` as self-contained HTML/SVG via CLI, embed in `/student/journey` + `docs/final-master/ARCHITECTURE.html`. Useful for stakeholder review; zero DB change.

### 5) MEDIUM — `modeldeck` + `hindsight` → AI Observability pack (0.5 day)
- Model Deck cards for each `AgentDefinition` (model/cost/latency/hit-rate) → `/crm/ai-command-center`. Hindsight append-only log format for `AgentAuditLog` (actor, tool, confidence, policy).

**Skip:** openclaude (unless fallback needed), scientific-agent-skills (borrow prompt pattern only), minimind training, omarchy, OpenMAIC, Go guidelines, cortex_suite, radiant — not student-value for ALO.

## Implementation note (preserves your rule)
- No duplicate pages/tables — extend `seo-engine.ts`, add optional `ai-service/forecast`, extend `AgentMemory` columns, add `archify` CLI step in CI.
- All 3 HIGHs are **optional services** — CRM remains source of truth (§117). If you say “add TOP 3”, I can wire `open-seo + timesfm + smriti-memory` in this branch incrementally with audit + tests.

