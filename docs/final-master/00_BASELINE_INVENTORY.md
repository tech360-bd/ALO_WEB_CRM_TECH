# 00 — BASELINE INVENTORY (Phase 1 & 2 entry)
**Generated:** 2026-09-14 Asia/Dhaka | **Repo:** alo_education_z....ai @ arena/01a09c20-alo-education-z-ai (936a7f5..285da6f)  
**Method:** `find` + `grep` on actual working tree — no assumed counts.

## Stack
| Layer | Evidence |
|---|---|
| Framework | `next ^16.1.1` (App Router), `react ^19.0.0`, `prisma ^6.19.3`, `mysql2 ^3.24.4` |
| Runtime | `node >=22.0.0` (host v22.22.3), `npm 10.9.8` |
| DB | `mysql` via `DATABASE_URL`, provider `mysql`, MySQL elsewhere `aloeduca_alo_education` |
| Auth | `next-auth ^4.24.11` + `@auth/prisma-adapter`, custom `PortalSession.token` Bearer + `auth-middleware.ts` |
| Deploy | `PM2` (`ecosystem.config.cjs` → `0.0.0.0:3044` → `Caddyfile` reverse_proxy) |
| Styling | `tailwindcss ^4.0.0` + `shadcn/ui` (`@radix-ui/*`) |

## Counts (recalculated)
| Item | Count | Source |
|---|---|---|
| Prisma models | 450 | `grep -c "^model "` schema.prisma (actual 452 inc. comments, validated 450) |
| Prisma indexes | 719 `@@index`, 23 `@@unique` | grep |
| Migrations | 9 dirs + `migration_lock.toml` | `prisma/migrations` |
| `src/app/**/page.tsx` | 336 | `find src/app -name page.tsx | wc -l` |
| `src/app/api/**/route.ts` | 748 API route files | `find src/app/api -name route.ts | wc -l` |
| `src/components/**/*` | 389 files | `find src/components -type f | wc -l` |
| `src/lib/**/*` | 112 files | `find src/lib -type f | wc -l` |
| Auth-guarded APIs | 397 contain `withAuth|authenticateRequest` | grep |
| Permission catalog | 50+ IDs, `super_admin` has all | `PERMISSION_CATALOG` test |

## Navigation & roles
- **Public:** `about, admission-requirements, blog, course-finder, destinations, universities, visa-support, student, partner, login, register` (`src/app/page.tsx` public shell)
- **Student portal:** `src/app/student/**` 27 pages + `StudentPortalShell` + `PortalStore` views (`student-dashboard, student-profile, student-course-finder, student-applications, student-documents…`)
- **Employee/CRM:** `src/app/employee/**` 30+ pages + `counselor/**`, `crm/**` (25 subdirs), `admin/**` (30+ pages) + `EmployeePortalShell` / `CrmAdminShell`
- **Roles in store:** `STUDENT, COUNSELOR, SENIOR_COUNSELOR, ADMISSIONS, DOCUMENT_VERIFICATION, VISA, FRONT_DESK, MARKETING, PARTNER, DATA, FINANCE, HR, DEPARTMENT_HEAD, COO, SUPER_ADMIN` (+ `PortalUserType`/`CrmRole`)
- **Unified portal shell:** `src/components/shared/UnifiedPortalShell.tsx` + `src/lib/portal-nav.ts` (15 role nav groups) + `PortalDashboardprimitives` — responsive `w-64→w-16` + mobile drawer + bottom 4-5

## AI / Automation / Integrations (grep)
- **AI providers:** `src/lib/ai.ts` routed `ZAI(glm-4-flash/plus)`, `OPENROUTER`, `GROQ_API_KEY`, `GROQ` + `OLLAMA` fallback in `ai-safety.ts`/`agentos`
- **WhatsApp:** `src/lib/whatsapp-cloud-api.ts`, `whatsapp-number-pool.ts` (ref `01805020100`), `whatsapp-followup-engine.ts`, `sla-engine.ts`, `ai-whatsapp-engine.ts` + `src/app/api/whatsapp/**` (10 subroutes)
- **Marketing:** `prisma` 15 Marketing* models + `BrandAsset`, `CampaignPost`, `N8nWorkflow`, `MarketingUserAccess` + `/api/marketing/**` (15 routes), `/api/campaigns`, `/api/content-engine`, `/api/brand-assets` + `src/components/alo/views/marketing-dashboard.tsx`
- **Email:** `src/lib/email-service.ts`, `OfficialEmail`, `NotificationEngine`, `MAIL_HOST mail.aloeducation.com 465`
- **Storage:** `FileMetadata` + `StoragePool` (`STUDENT_PARTNER|OFFICIAL|OPERATIONAL`) + `storage-service.ts` + `scripts/prepare-standalone.mjs` + `STORAGE_POOL_C=/home/aloeduca/...`
- **Queues/cron:** `src/lib/sla-engine.checkAndEscalateSla`, `src/app/api/cron/*`, `ecosystem.config.cjs` single instance, no Redis queue required (ioredis optional)
- **n8n:** `src/lib/n8n.ts` + `N8nWorkflow` model

## Tests
- `tests/unit/**` + `tests/integration/**` + `tests/e2e/**` (Playwright)
- `vitest run` + `next build` + `tsc --noEmit` + `eslint`
- Existing `permissions.test.ts` passes catalog uniqueness; other e2e require live DB — `BLOCKED` without creds

## Env
`env.example` lists `DATABASE_URL, NEXTAUTH_SECRET, WHATSAPP_TOKEN, FACEBOOK_APP_ID, FIREBASE_*, Caddy/PM2` — production values not committed (correct). `-.env` not inspected (not to print secrets).

## Baseline failures (pre-change)
- Unified dashboard `docs/UNIFIED_DASHBOARD_ARCHITECTURE.md` existed as illustrative only (now implemented); marketing `feedback.md` flagged 35% enforcement gap (see that file for full list).
- No `DATABASE_URL` available in this sandbox → DB-live checks `BLOCKED`.
- `portal-nav.ts` previously missing (now added).

Recalculated — do not reuse stale claims.
