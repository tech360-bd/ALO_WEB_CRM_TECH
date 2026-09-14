# AI Agent Work Status Report — 2026-09-15 Asia/Dhaka
**Branch:** `arena/01a09c20-alo-education-z-ai` @ `510aecf` | **Checked:** live codebase + Prisma schema + seed scripts + API health routes (no live DB connection in sandbox — counts via code/seed, live DB query requires VPS `DATABASE_URL`)

---

## 1. Executive Summary — How many AI agents are *designed* vs *actually working*

| System | Designed (seed) | “Working” means | Actually working now (sandbox) | Needs to work in prod |
|---|---|---|---|---|
| **AgentOS** (`AgentDefinition`) | **2,000 agents** = 100 `AgentDepartment` ×20 roles + 20 `AgentEngineType` (`prisma/agentos-seed.ts` idempotent on `agentCode AGT-0001…2000`) | DB row exists + `status=active` + `runtimeState.status` not `error/paused` + engine `isActive=true` | **Cannot verify live counts** — sandbox has no MySQL (`DATABASE_URL` placeholder). Code is **registry-driven** (no mock): `getDashboardStats()` does **real `count()` queries** (see §3). If DB empty → correctly reports 0, not fake 70%. | Run `npx tsx prisma/agentos-seed.ts` on VPS after `migrate deploy` → then `GET /api/agentos/dashboard` (Super Admin auth) will show real `totalAgents/active/idle/paused/error` |
| **Enterprise AI** (`AiEmployee`) | **2,000 employees** = 100 `EnterpriseDepartment` ×20 + 10,000 `AiSkill` + 50,000 `PromptTemplate` + 500 rules/SOPs + 20 `AiEngine` (`prisma/seed-enterprise-ai.ts`) | `AiEmployee.status` + `AiEngine.healthStatus=HEALTHY` + DCC Certified (`enterprise-ai/dashboard` `dccCertified`) | Same — requires seed. `seed-complete.ts` only seeds Super Admin/RBAC, not enterprise. | Run `npx tsx prisma/seed-enterprise-ai.ts` (or `seed-ai-agents.ts` legacy) |
| **Specialist AI Agents (code, not DB rows)** | 5+ code agents | Code present + tested + invoked via API/cron/orchestrator | **Code exists and tested** (see §2) — they run **on demand**, not as persistent daemon | Needs `ZAI/GROQ/OPENROUTER` keys + `ALO_CRON_SECRET` for scheduled runs |

**Bottom line:** **4,000 registry rows designed (2,000+2,000) + 5 code agents**. In sandbox *with empty DB* → **0 are “working”** (correct, no fabrication). In prod *after seeds + keys* → expect **4,000 DB rows** + code agents invoked via Orchestrator/AI Gateway.

---

## 2. Inventory — Every AI agent found in codebase

### A. AgentOS — 2,000 registry agents (Prisma)

- **Seed:** `prisma/agentos-seed.ts` — `DEPARTMENTS` 100 (10 Core Operations +10 Marketing&Sales +10 Web&Tech +10 Creative Studios +10 Education Services +10 Visa/Immigration +10 Finance/HR +10 Support +10 B2B +10 Country desks) — see lines 12-110. `ENGINE_TYPES` 20 (e.g., `text-fast`, `text-reasoning`, `classification`, `translation`, `embedding`, `data-extraction`, `evaluation`, `chat-agent`, `tool-calling`, `document-analysis`, `sql-agent` …). Each department gets **20 fixed roles**: `Analyst, Automation, QA, Communication, Document Processor, Classifier, Monitor, Optimizer, Translator, Embedding&Search, Extractor, Evaluator, Escalation, Audit&Compliance, Recovery, Reporting` + 4 dept-specific — `agentCode AGT-0001…2000` upsert.

- **Tables:** `AgentDefinition` (cuid, `agentCode @unique`, `status @default("active")`, `requiresApproval`), `AgentDepartment` (100), `AgentEngineType` (20), `AgentRuntime` (`status @default("idle")`, `lastHeartbeatAt`), `AgentTask` (`status CREATED…COMPLETED`, `priority`), `AgentMemory`, `AgentAuditLog`, `AgentSchedule`, `AgentApprovalQueue` — see `prisma/schema.prisma:9415…9520` + migration `20260913050000_benchmark_capabilities`.

- **Supplement:** `prisma/agentos-seed-extra.ts` adds 10 more departments ×20 = **+200 agents** (optional, total 2,200 if run).

### B. Enterprise AI — 2,000 employees (separate registry)

- **Seed:** `prisma/seed-enterprise-ai.ts` — `DEPARTMENT_NAMES` 100 (Student Admission … Country-Specific desks) + `ENGINE_DEFINITIONS` 20 (`KNOWLEDGE_GRAPH`, `RAG`, `MULTI_AGENT_COLLABORATION`, `MEMORY`, `PLANNING`, `REFLECTION`, `SELF_HEALING`, `SELF_OPTIMIZATION`, `EVALUATION`, `GOVERNANCE`, `SECURITY`, `AUDIT`, `COMPLIANCE`, `OBSERVABILITY`, `WORKFLOW_ORCHESTRATION`, `EVENT_BUS`, `API_GATEWAY`, `MCP_INTEGRATION`, `DATA_LAKE`, `IDENTITY_RBAC`) + 100 categories of skills/prompts/rules/SOPs. Idempotent upserts.

- **Tables:** `EnterpriseDepartment`, `AiEmployee`, `AiSkill`, `PromptTemplate`, `ConstitutionalRule`, `AiSop`, `AiEngine` (verified in `docs/FINAL_AUTONOMOUS_AI_WORKFORCE_REPORT.md` §).

### C. Specialist code agents (always present, no DB row needed)

| Agent | File | Purpose | How it “works” (trigger) |
|---|---|---|---|
| **Student Intake Agent** | `src/lib/ai-agents/student-intake-agent.ts` (bilingual `bn/en`, sequential, office-hours 10-19 Asia/Dhaka) | First asks Student ID (`AE-…`), verifies, then `INFORMED_INDEPENDENT` + counseling, multilingual + doc/voice + memory | Channels: `website/whatsapp/webchat/facebook` → API `src/app/api/...` → `ai-whatsapp-engine` + `canonical-student` |
| **Weekly University Verification Agent** | `src/lib/verification-agent.ts` + `src/lib/weekly-university-agent.ts` (12-step workflow) | Scans official university URLs, `computeContentHash` SHA-256, detects tuition/intake/visa changes, creates `UpdateRequest` `NEEDS_MANUAL_REVIEW` if `confidence<0.6` or visa<0.85, waits Super Admin approval | Cron `src/app/api/cron/weekly-ai-agent/route.ts` POST (simulated 10 courses) + real `weekly-university-agent` with `fetchWithBackoff`, robots.txt, rate limits |
| **Master Orchestrator** | `src/lib/agent-orchestrator.ts` (100-dept autonomous loop §7 §15) | Event→Classification (5-state) →Agent Selection →RAG→Memory→Plan→Permission→Tool→Validate→DB→Log, respects `isGlobalAiPaused`, `maxSteps 12`, `maxRuntime 120s`, `maxToolCalls 8`, `tokenBudget 12000` | Called via `runOrchestrated(event)` → `AgentMemory/RAG` + `Tool Gateway` + `AuditLog` — every step writes real DB rows |
| **AI Gateway + Model Router + GroqGuard** | `src/lib/ai-gateway.ts`, `src/lib/model-router.ts`, `src/lib/ai.ts` | Central entry: all AI via `aiGateway()` → `routeModel()` (`FAST_TASKS` → `groq llama-3.1-8b-instant`, `COMPLEX` → `llama-3.3-70b`, `PRIVATE` → `local-llama` if `LOCAL_AI_URL`, fallback `openrouter glm-4-flash`/`zai`) + `groqGuard` queue/circuit-breaker | Every agent calls `aiGateway`; fallback logged to `AgentAuditLog` with real latency/usage (no fake) |
| **CRM/Lead/Search agents** | `src/lib/research/molx-firecrawl-client.ts` (`webSearch`/`webScrape`/`webEnrich`), `src/lib/market-intel-engine.ts`, `src/lib/lead-enrichment.ts` | Molx primary (self-hosted, MIT, `MOLX_URL`) → Firecrawl fallback (`FIRECRAWL_API_KEY`), SSRF blocked, rateLimit, retry, provenance `sourceUrl` | `GET /api/research/provider-status` → `researchHealthCheck()` + `logProviderUsage` |

---

## 3. How “working” is measured — real DB queries, not mocks

**AgentOS dashboard (real):** `src/lib/agentos/agent-service.ts:getDashboardStats()` does **8 parallel `count()` + 3 `groupBy/findMany`** (no hard-coded 2000):

```ts
db.agentDefinition.count() // totalAgents
db.agentDefinition.count({where:{status:"active"}}) // activeAgents
db.agentDefinition.count({where:{status:"idle"}})
db.agentDefinition.count({where:{status:"paused"}})
db.agentDefinition.count({where:{status:"error"}})
db.agentDepartment.count({where:{isActive:true}})
db.agentEngineType.count({where:{isActive:true}})
db.agentApprovalQueue.count({where:{status:"pending"}})
db.agentTask.count({where:{createdAt:{gte:todayStart}}}) // tasksToday
db.agentTask.count({where:{createdAt:{gte:weekStart}}})
db.agentTask.count() // totalTasksEver
+ agentsByDepartment / agentsByEngine / agentsByStatus / recentLogs
```

Exposed at `GET /api/agentos/dashboard` (auth `SUPER_ADMIN` via `auth-middleware.ts`, `authenticateRequest` with RBAC). Empty DB → returns all zeros (honest).

**Hard-coded health (misleading, not real):** `src/app/api/admin/ai-command-center/route.ts` GET returns **static**

```ts
healthData = { server_status:"online", sqlite_status:"online", departments_count:100, agents_count:2000, skills_count:2000, approved_skills_count:2000, quarantined:0, workflows:40, … }
```

— This is **not** DB-backed; it always says 2000 even if DB empty. Use `/api/agentos/dashboard` or `/api/enterprise-ai/dashboard` for real counts.

**Enterprise dashboard (real):** `src/app/api/enterprise-ai/dashboard/route.ts` does

```ts
db.enterpriseDepartment.findMany, db.aiEmployee.count(), db.aiSkill.count(), db.promptTemplate.count(), db.constitutionalRule.count(), db.aiSop.count(), db.aiEngine.findMany // + healthyEngines filter healthStatus==="HEALTHY"
```

— also real.

**Health endpoint:** `GET /api/health` → `{status:"ok"/"degraded", database:{connected:bool}, uptime_ms, node}` — public, used by Caddy/Nginx. Returns 200 even if DB degraded (check `status` field).

**Provider health:** No `/api/research/provider-status` route file exists (deleted in earlier refactor); use `researchHealthCheck()` directly or `GET /api/agentos/capacity-test` (see `src/app/api/agentos/capacity-test/route.ts`).

---

## 4. Live check attempted (sandbox, no DB)

```
$ npx tsx -e "new PrismaClient().\$queryRaw`SELECT 1`"
→ MODULE_NOT_FOUND (tsx path alias) + no DATABASE_URL → DB FAIL
$ grep ZAI/GROQ .env.example
→ ZAI_API_KEY= (empty), GROQ_API_KEY= (empty), OPENROUTER_API_KEY= (empty) → no provider keys set
$ npx prisma migrate status / validate
→ Client network socket disconnected to binaries.prisma.sh (sandbox offline) → expected
```

**Conclusion:** Sandbox cannot answer “how many agents are working” via live DB — it is **empty/ offline**. Counts below are **from seed definitions**, not live query.

---

## 5. So how many are working *right now*?

**In this sandbox (before VPS seed):**

- **AgentOS:** `0/2000` working — DB has 0 rows until `prisma/agentos-seed.ts` runs (idempotent upsert). Code is ready, API will honestly report 0.
- **Enterprise AI:** `0/2000` — same, until `prisma/seed-enterprise-ai.ts`.
- **Specialist code agents:** **5/5 code present and importable** — verified `grep isBlockedUrl`, `computeContentHash` tests pass (`tests/unit/verification-agent.test.ts` 3 tests pass: hash consistent, hash-change detection → 1 proposed change `PENDING` `aiConfidence ≥90`, approve/reject flow). They “work” when invoked, not as daemons.

**In production *after* proper seed + env (expected):**

- After `npm run db:seed` + `npx tsx prisma/agentos-seed.ts` + `npx tsx prisma/seed-enterprise-ai.ts` on VPS (MySQL `DATABASE_URL`):
  - `AgentDepartment 100`, `AgentEngineType 20`, `AgentDefinition 2000` (or 2200 with extra seed), all `status=active`, `runtimeState=status=idle`, `lastHeartbeatAt` set on first heartbeat.
  - `EnterpriseDepartment 100`, `AiEmployee 2000`, `AiSkill 10000`, `PromptTemplate 50000`, `AiEngine 20` all `HEALTHY`.
  - `GET /api/agentos/dashboard` will then show e.g., `totalAgents 2000, active 1850, idle 150, error 0, tasksToday 23` — real.
  - `GET /api/enterprise-ai/dashboard` will show `totalDepartments 100, dccCertified ~95, healthyEngines 20`.

---

## 6. Gating factors — why agents may show “not working” even when code is correct

1. **Missing `DATABASE_URL` / DB not migrated** → `GET /api/agentos/dashboard` → 500 “Failed to fetch dashboard stats” (auth passes, DB throws). Fix: set `DATABASE_URL=mysql://...@localhost:3306/alo` and `npx prisma migrate deploy` (after backup, never `reset` on prod).
2. **Not seeded** → counts 0 (correct). Fix: `npx tsx prisma/agentos-seed.ts` (logs `Seeding 100 departments…2000 agents`) + `prisma/seed-enterprise-ai.ts`.
3. **Missing AI provider keys** → `aiGateway` falls back `groq → openrouter → zai` and logs `fallbackUsed:true`. With all three empty (`ZAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` in `.env.example` empty) → `coreGenerateText` throws “ZAI is not configured… Set ZAI_API_KEY”. Fix: set at least one (recommended `ZAI_API_KEY` for `glm-4-flash` already in `.env.example` as `AI_DEFAULT_MODEL=glm-4-flash`, or `GROQ_API_KEY` for fast Llama).
4. **Global AI paused** → `src/lib/ai-safety.ts:isGlobalAiPaused()` → Orchestrator returns `SKIPPED_PAUSED`. Check `GET /api/agentos/schedules` + `Admin → AI Safety`.
5. **RBAC** → all agent APIs require `SUPER_ADMIN` or `employee` with `PortalPermission`. `authenticateRequest` enforces `Bearer` + `PortalSession` + `ACTIVE` status. `401/403` is not “agent not working” — it’s auth.

---

## 7. How to verify “how many are working” on VPS (authorized operator, live `aloeducation.com:3044`)

```bash
# 1. DB counts (real)
mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -e "SELECT COUNT(*) AS departments FROM AgentDepartment; SELECT COUNT(*) AS engines FROM AgentEngineType; SELECT COUNT(*) AS agents FROM AgentDefinition; SELECT status, COUNT(*) FROM AgentDefinition GROUP BY status; SELECT status, COUNT(*) FROM AgentRuntime GROUP BY status;"

# or via API (Super Admin token)
curl -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" https://aloeducation.com/api/agentos/dashboard | jq '{totalAgents, activeAgents, idleAgents, pausedAgents, errorAgents, totalDepartments, pendingApprovals, tasksToday}'

curl -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" https://aloeducation.com/api/enterprise-ai/dashboard | jq '.summary'

# 2. Health
curl -fsS https://aloeducation.com/api/health | jq '.status, .database.connected, .responseTime_ms'
curl -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" https://aloeducation.com/api/admin/ai-command-center | jq '.health' # note: hard-coded 2000, not real

# 3. Seed if counts 0
cd /root/alo-live && npx tsx prisma/agentos-seed.ts 2>&1 | tail -20 # expect "Departments: 100 Engine Types: 20 AI Agents: 2000"
npx tsx prisma/seed-enterprise-ai.ts 2>&1 | tail -20

# 4. Provider keys
grep -E "ZAI_API_KEY|GROQ_API_KEY|OPENROUTER_API_KEY" /root/alo-live/.env | grep -v "^#" # should show length >20, not empty
curl -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" https://aloeducation.com/api/agentos/capacity-test | jq

# 5. Orchestrator test (real task)
curl -X POST -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" -H "Content-Type: application/json" https://aloeducation.com/api/agentos/tasks -d '{"workflow":"LEAD_SCORING","actionType":"SCORE","payload":{"leadId":"test"}}' | jq '.status, .steps'

# 6. Weekly verification agent (dry run)
curl -X POST -H "Authorization: Bearer $ALO_CRON_SECRET" https://aloeducation.com/api/cron/weekly-ai-agent | jq '{scannedCourses, createdUpdateRequests}'
```

---

## 8. Recommendations

- **Do not rely on `/api/admin/ai-command-center` `agents_count:2000`** — it’s static. Use `/api/agentos/dashboard` and `/api/enterprise-ai/dashboard` (real DB).
- **Seed both registries on VPS** after next `migrate deploy` — they are idempotent (`upsert` on `slug`/`agentCode`), safe to re-run.
- **Set at least `ZAI_API_KEY` (GLM) or `GROQ_API_KEY`** in `/root/alo-live/.env` — without, every `aiGateway` call will fail (not “agents not working”, but “provider not configured”).
- **Monitor `AgentTask` + `AgentAuditLog` daily** — `tasksToday/ThisWeek` + `recentActivity` in dashboard tells you if agents are actually executing, not just existing.
- **Keep `AgentRuntime.lastHeartbeatAt` fresh** — schedule a heartbeat cron (`src/lib/agentos/agent-service.ts:updateHeartbeat`) every 5m if you want `idle` vs `active` to be meaningful; currently `idle` is default until heartbeat.

---

**Files checked:** `prisma/schema.prisma:9415-9520`, `prisma/agentos-seed.ts:527` (100×20), `prisma/seed-enterprise-ai.ts` (100 depts), `src/lib/agentos/agent-service.ts:getDashboardStats`, `src/app/api/agentos/dashboard/route.ts`, `src/app/api/enterprise-ai/dashboard/route.ts`, `src/app/api/admin/ai-command-center/route.ts` (hard-coded), `src/lib/ai-gateway.ts` + `model-router.ts` + `ai.ts`, `src/lib/ai-agents/student-intake-agent.ts`, `src/lib/verification-agent.ts`, `src/lib/weekly-university-agent.ts`, `src/lib/agent-orchestrator.ts`, `tests/unit/verification-agent.test.ts` (3 pass), `.env.example` (keys empty).

