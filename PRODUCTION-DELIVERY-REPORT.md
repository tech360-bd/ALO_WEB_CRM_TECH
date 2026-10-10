> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education — Production Delivery Report

## Architecture
Next.js 16 (App Router) + TypeScript + Prisma (SQLite sandbox / MySQL production-ready) + NextAuth + shadcn/ui

## Major Implemented Systems

### Public Website (118 views)
Home, Destinations, Countries, Universities, Course Finder, Courses, Scholarships, Services, Language Preparation, Resources, Events, About, Contact, Blog, FAQ + all portal dashboards

### CRM
Leads → Counselling → Application → Offer → CAS → Visa → Enrollment
21 communication routes, leads with automation, counselor assignment, scoring, follow-up tasks

### Authentication
NextAuth credentials provider, JWT sessions, RBAC via middleware (PUBLIC_API_ROUTES + SENSITIVE_API_ROUTES), canonical Student ID (AE-YYYYXXXXXX)

### AgentOS (100 departments / 2,000 agents capacity)
- 54 existing AiAgent records (preserved, extended with autonomyLevel, supervisorAgentId, modelProvider, toolScopes, approvalPolicy)
- 10 Department records (preserved, extended with supervisorAgentId, defaultModel, agentLimit, skillLimit)
- 10,000 AiSkill records (preserved)
- 3 new models: AgentOSTool, AgentOSTask, AgentOSExecution
- 6 AgentOS API routes (/api/agentos/*)
- Registry-based architecture (not process-per-agent) — 2ms query latency

### AI Command Center
- execute (idempotent, risk-classified, human approval for MEDIUM+)
- retry (max 3, PERMANENTLY_FAILED)
- stats (real from DB)
- Global AI Pause (server-side, returns 423 when paused)

### Automation Engine
- 10 run* workflows (lead_welcome, lead_scoring, counselor_assignment, follow_up_task, sla_tracking, missing_data_detection, deadline_reminder, notification, reporting, lead_tagging)
- AutomationEvent model (real 70/30 KPI: automated/(automated+human+escalated)*100)
- Cron scheduler script (scripts/cron-scheduler.sh)

### 5 Brain Libraries
Content Brain, University Research Brain, SEO Brain, Marketing Brain, Student Intelligence Brain

### Organic Growth Flywheels
- Behavior tracking (19 event types, configurable intent weights)
- Marketing consent (explicit opt-in, frequency caps, revocable)
- Lead scoring (composite 0-100, tiers COLD/WARM/HOT/URGENT)
- Review engine (never incentivized)
- Referral engine (AEFR-XXXXXX codes)
- Source intelligence (change detection, evidence provenance)
- Content engine (7 quality gates, DRAFT→APPROVE→PUBLISH)
- SEO engine (opportunity detection, keyword research)
- Employee learning resources
- Study guide generator (JSON + HTML, UNVERIFIED fields marked)

### Integrations
- WhatsApp Cloud API (signature verification, outbound send, delivery status)
- Facebook Lead Ads (OAuth, lead webhook, CRM sync)
- 3CX Telephony (contact lookup, call journaling, click-to-call, extension mapping)
- Phone normalization (BD + international)
- Event bus (pub/sub + EventLog persistence)
- Knowledge base engine (structured by country/course/topic)
- Keyword research engine (discovery, clustering, prioritization)

## Database
- 212 Prisma models
- 276 API routes
- 39 library files
- 54 AiAgents (preserved)
- 13 Students, 34 Leads, 400 Universities, 10 Departments, 10,000 Skills (all preserved)

## Security
- RBAC (middleware SENSITIVE_API_ROUTES)
- bcrypt password hashing
- CSRF protection (NextAuth)
- Webhook signature verification (HMAC SHA-256)
- Idempotency (unique constraints + P2002 retry)
- Rate limiting (frequency caps on marketing)
- No secrets in frontend code
- No plaintext passwords
- Audit logging on every consequential action

## Deployment
1. Upload ZIP to server
2. Extract: `unzip ALO-EDUCATION-FINAL-PRODUCTION.zip`
3. Install: `bun install`
4. Configure: copy `.env.example` to `.env`, fill with real credentials
5. Database: `bunx prisma generate` + `bunx prisma db push` (SQLite) or `bunx prisma migrate deploy` (MySQL)
6. Build: `bun run build`
7. Start: `NODE_ENV=production node .next/standalone/server.js`
8. Health: `curl http://localhost:3000/api/health`
9. Cron: `*/5 * * * * /path/to/scripts/cron-scheduler.sh`

## Environment Variables (NAMES ONLY)
See `.env.example` — never commit real secrets.

## Migration Procedure
See `docs/MYSQL-DEPLOYMENT.md` — safe, non-destructive, additive only.

## Health Checks
`GET /api/health` returns: status, database connection, storage, redis

## Backup Procedure
```bash
mysqldump -u <user> -p <database> > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Rollback Procedure
```bash
mysql -u <user> -p <database> < backup-YYYYMMDD-HHMMSS.sql
git revert <commit>
```

## Test Results
- TypeScript: 0 errors
- ESLint: 0 errors (3 cosmetic warnings)
- Prisma validate: Valid
- Build: Standalone prepared
- AgentOS Dashboard: 10 depts, 54 agents, 10K skills, 2ms latency
- AI Pause: 423 when paused
- Idempotency: cached returns on duplicate
- RBAC: 401 for unauth, 403 for wrong role

## Known Limitations
1. SQLite in sandbox (MySQL-compatible schema, procedure documented)
2. No VPS deployment (external blocker)
3. Ollama not tested (architecture supports via modelProvider field)
4. WhatsApp/Facebook/3CX credentials not configured (graceful degradation when missing)
5. No automated test suite (per project rules)

## Items Requiring External Credentials/Services
- MySQL/MariaDB server (for production DB)
- VPS with SSH access (for deployment)
- Meta credentials (WhatsApp/Facebook — for live integration)
- 3CX PBX credentials (for telephony)
- Google Search Console API (for SEO data)
- Email/SMS provider credentials (for communication)
