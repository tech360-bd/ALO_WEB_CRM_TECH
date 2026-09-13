# FINAL_MASTER_INVENTORY — ALO Education Platform
**Date:** 2026-09-14 | **Branch:** arena/01a09c20-alo-education-z-ai | **Commit:** 285da6f → 936a7f5 (this report adds inventory)  
**Engine:** Node 22.22.3, Next 16.1.1, Prisma 6.19.3, MySQL (`DATABASE_URL`) — PM2:3044 → Caddy `aloeducation.com`

> Stable IDs are filesystem paths + Prisma model names + route paths. Counts re-ran on 2026-09-14 (see `00_BASELINE_INVENTORY.md`).

## 1. Pages / Layouts (`src/app/**/page.tsx` = 336)
| Area | Example paths | Auth |
|---|---|---|
| Public | `app/page.tsx`, `app/about/page.tsx`, `app/course-finder/page.tsx`, `app/universities/page.tsx`, `app/visa-support/page.tsx` | public |
| Auth | `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/**` | public / NextAuth |
| Student | `app/student/{dashboard,profile,course-finder,applications,documents,appointments,messages,payments,ai-interview,visa-checklist}/page.tsx` (+ layout `StudentAuthContext`) | `STUDENT` |
| Employee | `app/employee/{dashboard,counselor-dashboard,leads,students,applications,tasks,visa-dashboard,marketing-dashboard,hr-dashboard}/**` | `EMPLOYEE` types |
| Admin/CRM | `app/admin/{dashboard,audit-logs,marketing-automation,whatsapp-numbers,ai-command-center,access-control-center,destinations,…30+}/page.tsx`, `app/crm/**`, `app/counselor/**`, `app/super-admin/**` | `SUPER_ADMIN/ADMIN` etc. |
| Portal alias | `app/portal/**` | mixed |

## 2. API routes (`src/app/api/**/route.ts` = 748 files, 397 guarded)
| Group | Routes | Guard |
|---|---|---|
| Auth | `auth/**`, `portal-auth/**`, `admin/audit/**` | `withAuth` + NextAuth Bearer/cookie |
| CRM core | `crm/{dashboard,leads,students,applications,documents,visa,finance,social,reports,inbox}/**` | `withAuth` |
| Marketing | `marketing/{dashboard,social,approvals,comments/convert-lead,dm/convert-lead,content,campaigns,video,whatsapp-doc-upload,consent,user-access,automation,calendar,social}/**` (15+) | `requireUserTypes:MARKETING*` |
| WhatsApp | `whatsapp/{webhook,send,ai-reply,ai-intent,document-upload,followup,numbers,routing,analytics}/**` (10) | bearer `WHATSAPP_APP_SECRET` + `authenticateRequest` |
| Content/Data | `admin/import/**`, `course-finder/**`, `universities/**`, `crm/course-import/**` | role-gated |
| Ops | `cron/**`, `health/route.ts`, `audit/route.ts` | internal |

HTTP methods: `GET/POST/PATCH/DELETE` mix — see `FINAL_API_ROUTE_AUDIT.md` for method inventory.

## 3. Components (`src/components/**/ = 389 files`)
- `admin/` (7): `MasterSuperAdminDashboard`, `AccessControlCenterPage`, `AdminCountryBuilderView`, `SocialIntegrationCenterPage` …
- `alo/views/` (70+): `public-home`, `student-dashboard`, `marketing-dashboard`, `whatsapp-command-center`, `crm-dashboard`, `visa-dashboard`, `application-manager-portal` …
- `communication/` (7): `WhatsAppCommandCenter`, `UnifiedCommunicationTimeline`, `EmployeeOmnichannelInbox` …
- `counselor/`, `crm/`, `employee/` (15): `EmployeePortalShell`, `CrmAdminShell`, `CounselorPortalShell`
- `shared/` (new): `UnifiedPortalShell`, `PortalDashboards (15 roles)`, `PortalDashboardprimitives`
- `ui/` shadcn 20+ Radix primitives
- `marketing/` (hub shells)

## 4. Database (Prisma `schema.prisma`)
- **Models:** 450 (validated) — key groups: `User(roles/permissions)`, `Student(50+ relations)`, `Lead(6390-line)`, `AloApplication(>30 status columns)`, `Marketing* (15 models: Campaign/Content/Video/Calendar/Approval/SocialMessage/DMThread/Comment/Lead…)`, `BrandAsset`, `CampaignPost`, `N8nWorkflow`, `MarketingUserAccess`, `SocialConnectedAccount`, `FileMetadata+StoragePool`, `AuditLog+MarketingAuditLog`, `SlaPolicy/SlaEvent`, `CommunicationThread/UCC`, `OfficialSource/SourceSnapshot`, `University/Course/…`
- **Migrations:** `20260731000000_init_mysql` → `20260913050000_benchmark_capabilities` (9). `prisma validate` — PASS locally (sans DB). `migrate deploy` — BLOCKED (no `DATABASE_URL` in sandbox).
- **Indexes:** 719 `@@index`, 23 `@@unique`, FKs present on `Student.leadId`, `AloApplication.studentId/universityId`, `FileMetadata.entity` etc. — see `FINAL_DATABASE_AUDIT.md`.

## 5. Automation
- `sla-engine.checkAndEscalateSla` (40/20/10 in spec, code 30/20/10 — gap logged), `whatsapp-followup-engine` (3,7,14,21,25,30 days), `cron/weekly-reports`, `brains/marketing/**` jobs — cron `*/5` not yet registered in PM2.

## 6. Integrations & credentials (from `.env.example`, never real values committed)
- WhatsApp: `WHATSAPP_TOKEN/PHONE_NUMBER_ID/APP_SECRET/VERIFY_TOKEN` (sender `01805020100` via `whatsapp-number-pool`)
- Meta: `FACEBOOK_APP_ID/SECRET`, `INSTAGRAM_APP_ID/SECRET`, `LINKEDIN_*`
- Email: `MAIL_HOST mail.aloeducation.com:465`, `IMAP/POP3`
- AI: `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ZAI_API_KEY`, models `glm-4-flash/plus`
- Firebase: `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`
- Deploy: `DEPLOY_HOST/USER/SSH_KEY/PORT` → `ecosystem.config.cjs` + `Caddyfile`

## 7. Tests / quality
- `vitest run` (unit+integration), `playwright test` (e2e), `next build`, `tsc --noEmit`, `eslint .`
- `tests/unit/permissions.test.ts` — PASS (catalog consistency). Full suite — `BLOCKED` without DB in sandbox; see regression report.

## 8. Existing failures (pre-this-report)
- `docs/MARKETING_AUTOMATION_FEEDBACK.md` — 16-section execution verdict with gaps (RBAC 3-user cap, comment auto-reply, OTP, SLA constants, brand gate, approval gate, n8n toggle). That file is evidence for §11.
- No production DB connection in this environment → integrity checks live-run `BLOCKED` (counted honestly).

**Inventory complete — used as source for traceability.**
