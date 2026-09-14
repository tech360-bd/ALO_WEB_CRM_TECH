# ALO Portal Verification — REAL vs MOCK (Final Check 2026-09-14)

**Question:** Do all portals work with *real* DB + auth (no hardcoded fake students)?
**Answer:** **YES — after hardening patch.** All portals now query real Prisma tables behind `authenticateRequest`/`withAuth`. Hardcoded demo fallbacks (`Arif Khan / Sadia / Imtiaz`, `PARTNER-DEMO 28/12`, `branch Dh-456`) were removed; empty DB now shows `0 / []` with CTA, not fabricated rows.

**Method:** `find src/app -type f | grep portal/dashboard`, then read `src/app/api/{student-portal,counselor,admin,super-admin,partner-admin,crm,employee}/**/route.ts` and `src/components/*/views/*` for `withAuth`, `db.*`, and `||` fallback mocks. Build check: `npm run test` 148 pass (1 pre-existing Prisma offline), `npx tsc --skipLibCheck` no new errors, `security-hardening.test.ts` 17 pass.

---

## 1. Portal Inventory (frontend → API → DB → Auth)

| # | Portal (route) | Frontend enters | API (real?) | DB tables (real) | Auth | Before → After | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | **Student** `/student/dashboard` | `PremiumStudentDashboard.tsx` → `fetch /api/student-portal/{dashboard,profile,applications,documents,timeline}` with `Bearer portal_token` | `src/app/api/student-portal/dashboard|profile|applications|documents|timeline` — all `authenticateRequest`, `db.portalStudentProfile/Application/Document/Timeline`, `nextAction` derived from real counts, never hardcoded | `PortalStudentProfile`, `PortalUser`, `Application`, `PortalStudentDocument`, `PortalTimelineEvent`, `AloPayment`, `StudentEnglishTestRecord`, `AiInterviewSession`, `VisaChecklistItem` | `Bearer` + ownership `studentProfile.userId === auth.userId` + audit `PortalAuditLog` | Already real; message "real DB, no fake data" | **PASS REAL** |
| 2 | **Counselor** `/counselor/dashboard` | `counselor-dashboard.tsx` → `/api/counselor/dashboard` | `src/app/api/counselor/dashboard/route.ts` — `withAuth`, 12 real `count` queries (`CommunicationThread`, `CounselorTask`, `PortalStudentDocument`, `PortalStudentApplication`, etc.) | `EmployeeProfile`, `CommunicationThread/Message`, `CounselorTask`, `AloAppointment`, `MarketingLead`, `PortalStudentApplication` | `withAuth` + `employeeProfile.userId` | Already real | **PASS REAL** |
| 3 | **Admin / Super-Admin** `/admin/dashboard` `/super-admin/dashboard` | `EnhancedSuperAdminControlCenter.tsx` → fetches `/api/applications/metrics`, `/api/universities?limit=1`, `/api/course-finder?limit=1`, `/api/admin/employees`, `/api/weekly-updates`, `/api/employee-access/security-events`, `/api/agentos/dashboard` with `Bearer` | All target APIs `withAuth`/`authenticateRequest` + real `count` (`PortalStudentProfile`, `CrmUniversity`, `CrmCourse`, `Employee`, `PortalStudentApplication`, `AuditLog`) — `activeStudents: 0` when empty, not `1250` | `PortalStudentProfile`, `Crm*`, `Employee`, `AuditLog`, `AgentDashboardStats` | `Bearer` + role `SUPER_ADMIN/ADMIN` | Was real but had `|| 1250` KPIs — fixed | **PASS REAL** (after fix `employee/dashboard` `|| 64` removed, `super-admin/dashboard` already 0) |
| 4 | **CRM** `/crm/dashboard` | `crm-dashboard.tsx` | `src/app/api/crm/dashboard/route.ts` — `withAuth`, `PortalStudentProfile.count()`, `PortalStudentApplication`, `PartnerProfile`, `CrmUniversity/Course/Scholarship`, `CommunicationMessage isRead` | Same as above + `PortalAuditLog` | `withAuth` | Already real | **PASS REAL** |
| 5 | **CRM Documents** `/crm/documents/dashboard` | `document-hub.tsx` | `src/app/api/crm/documents/dashboard/route.ts` — **fixed:** `withAuth`, `PortalStudentDocument.findMany/count` (PENDING/VERIFIED/REJECTED/EXPIRED), `rejectedList/expiredList` from DB, `deadlineAlerts: []` — **removed** `Arif Khan / Sadia / Imtiaz / Sabbir / Fariha` hardcoded arrays and `totalDocs \|\| 34` etc | `PortalStudentDocument` | `withAuth` | Was **FAIL MOCK** (3 demo rows + `|| 34` etc) → **FIXED** | **PASS REAL** |
| 6 | **CRM AI** `/crm/ai/dashboard` | `enterprise-ai-command.tsx` etc | `src/app/api/crm/ai/dashboard/route.ts` — **fixed:** `withAuth`, `SopDraft.findMany`, `CvReview.findMany`, `SavedCourse.count()`, `AuditLog.findMany` for logs, `kpis` `String(sopsCount)` not `String(sopsCount \|\| 89)`; `VisaRiskAssessment.count()` real | `SopDraft`, `CvReview`, `SavedCourse`, `PortalStudentDocument`, `VisaRiskAssessment`, `AuditLog` | `withAuth` | Was **FAIL MOCK** (Arif/Manchester etc) → **FIXED** | **PASS REAL** |
| 7 | **CRM Marketing** `/crm/marketing/dashboard` | `marketing-dashboard.tsx` | `src/app/api/crm/marketing/dashboard/route.ts` — **fixed:** `withAuth`, `MarketingCampaign/Calendar/GeneratedContent` real, `MarketingLead` counts per source (`Facebook/WhatsApp/Website/Instagram` added), `campaignPerformance: campaigns.map()` not `? … : [UK Fall hardcode]`, `upcomingCalendar: events.map()` not demo fair, `aiContentQueue: generatedContent.map()` | `MarketingCampaign`, `MarketingCalendar`, `MarketingGeneratedContent`, `MarketingLead` | `withAuth` | Was **FAIL MOCK** (UK Fall/Canada etc) → **FIXED** | **PASS REAL** |
| 8 | **CRM CEO** `/crm/ceo/dashboard` | `crm-analytics.tsx` | `src/app/api/crm/ceo/dashboard/route.ts` — **fixed:** `AloPayment.aggregate`, `PortalStudentApplication/MarketingLead/PortalStudentProfile` real, `branchPerformance: []` (was 5 hardcoded branches), `highRiskCases` now `VisaCase.findMany where risk HIGH` | `AloPayment`, `PortalStudentApplication`, `MarketingLead`, `PortalUser`, `VisaCase` | `withAuth` | Was **FAIL MOCK** (Dhaka 456 etc + `|| 1250`) → **FIXED** | **PASS REAL** (branchPerformance now empty until `groupBy branch` added) |
| 9 | **Partner** `/partner` `/partner-admin/dashboard` | `partner-admin-dashboard.tsx` | `src/app/api/partner-admin/dashboard/route.ts` — **fixed:** `authenticateRequest` strict (`if !partnerId → 403`), **removed** `PARTNER-DEMO` fallback and `|| 28/12/8/5/3` demo numbers, `imagesUsed || 0`, `vouchersCount: vouchers.length` not `||6`, `seatRequests.length` real | `MarketingLead`, `PortalStudentApplication`, `PartnerUserSeatRequest`, `PartnerMarketingQuota/Usage`, `StudentMockTestVoucher`, `StudentBenefitEntitlement` | `authenticateRequest` + `partnerId === auth.partnerId` | Was **FAIL MOCK** (`PARTNER-DEMO` 28) → **FIXED** | **PASS REAL** |
| 10 | **Partner Marketing / Seat / Vouchers / Users** `/partner-admin/marketing|seat-request|vouchers|users` | same portal | **fixed** same `PARTNER-DEMO` + `||4/2` removed in `src/app/api/partner-admin/marketing|seat-request|users|vouchers` + `||0` | `PartnerMarketing*`, `StudentMockTestVoucher` | `authenticateRequest` | Was MOCK → **FIXED** | **PASS REAL** |
| 11 | **Employee Central** `/employee/dashboard` | `employee-workspace.tsx` | `src/app/api/employee/dashboard/route.ts` — **fixed:** all `|| 45/18/12/64/28/19/11/7/8/4` removed → `String(totalLeads)` etc show `0` when empty; `branchPerformance` not hardcoded; role-specific `totalEmployees` no `||24` | `Employee`, `CounselorTask`, `CommunicationThread`, `AloAppointment` etc | `withAuth` + `userRole` branch | Was **PARTIAL MOCK** (count fallbacks) → **FIXED** | **PASS REAL** |
| 12 | **Application Manager** `/application-manager` | `application-manager-portal.tsx` | `src/app/api/application-manager/**/route.ts` — `withAuth` + `db.portalStudentApplication.findMany` + stage checks | `PortalStudentApplication`, `PortalStudentDocument` | `withAuth` + `APPLICATION_TEAM` | Already real | **PASS REAL** |
| 13 | **Finance / HRM / Reports** `/finance/dashboard` `/hrm/dashboard` etc | respective views | `src/app/api/crm/finance|hr|reports` — `withAuth` + `AloPayment`, `Employee`, `Application` aggregates | same | `withAuth` + role | Already real | **PASS REAL** |
| 14 | **AI Workforce** `/admin/ai-command-center` etc + new ` /api/workforce/metrics|orchestrate|approval|classify|gateway` | `central-ai-command.tsx` | `src/lib/ai-gateway.ts` + `model-router.ts` + `groq-protection.ts` + `work-classification-engine.ts` + `agent-orchestrator.ts` + `tool-gateway.ts` — all DB/queue real (`AiEmployee 2000`, `AutomationEvent`, `AgentTask`, `AgentApprovalQueue`) no fake 70% | `AiEmployee`, `AutomationEvent`, `AgentTask`, `AuditLog` | `withAuth` | New on this branch, real | **PASS REAL** |
| 15 | **Public / Search** `/`, `/course-finder`, `/universities/:slug`, `/courses/:slug`, `/destinations/:slug` | `landing.tsx` etc | `src/app/api/course-finder/*`, `src/app/api/universities/*`, `src/app/api/courses/*` — `db.crmCourse/crmUniversity` with `sourceUrl/lastVerifiedAt` + `CourseComparison`, `SavedCourse` auth-guarded | `CrmCourse/University/Requirement/IntakeFee/Scholarship/Ranking` | Public read (no auth) + write `withAuth` | Already real (Bricks waterfall) | **PASS REAL** |

### Evidence — patches that removed mocks (this branch)

- `src/app/api/crm/documents/dashboard/route.ts` — deleted `Arif Khan/Sadia/Imtiaz/Sabbir/Fariha/Sharif/Tasnia/Fahim/Riya` hardcode, `String(x || 34)` → `String(x)`, `rejectedList/expiredList` from `PortalStudentDocument`.
- `src/app/api/crm/ai/dashboard/route.ts` — deleted same names, `sopDrafts.map()` + `auditLogs` from `AuditLog`, `String(sopsCount || 89)` → `String(sopsCount)`.
- `src/app/api/crm/marketing/dashboard/route.ts` — deleted `UK Fall 2025 - FB` etc, `events: []` when none, added `instaLeads` query, `value: String(instaLeads)` not `89`.
- `src/app/api/crm/ceo/dashboard/route.ts` — `branchPerformance: []` (was 5 hardcoded Dhaka...), `highRiskCases` → `VisaCase.findMany`.
- `src/app/api/partner-admin/dashboard|marketing|seat-request|users|vouchers` — `PARTNER-DEMO` → `403 if !partnerId`, `imagesUsed || 4 → 0`, `|| 28/12/6 → 0/length`.
- `src/app/api/employee/dashboard/route.ts` — `|| 45/18/12/64/28/19/11/...` → `||` removed (0 when empty).
- `src/components/student/PremiumStudentDashboard.tsx` + `counselor-dashboard.tsx` + `EnhancedSuperAdminControlCenter.tsx` — already `Promise.allSettled(fetch ... with Bearer, .catch(()=>null))` + empty `[]` not demo rows.

Post-patch `grep -r "Arif Khan" src/app/api` → **0 functional hits** (only comment `No demo fallback` remains), `grep -r "PARTNER-DEMO" src/app/api` → **1 comment** only.

---

## 2. What "real" means for each portal (definition of done)

1. **Auth-gated read/write:** every `POST/PATCH/DELETE` + sensitive `GET` goes through `authenticateRequest`/`withAuth`/`getServerSession` + `isGlobalAiPaused()` where applicable — verified `grep -L "authenticate"` after fix = `0` for protected set.
2. **DB-driven:** `db.*.count/findMany` against live MySQL (Prisma), not `const mock = [{...}]`. Empty DB → `data: []`, `value: "0"`, CTA "Complete profile / Upload document / Find courses".
3. **No hardcoded student names:** `student.name` comes from `PortalStudentProfile.fullName` / `Student.name`, not `Arif Khan`.
4. **No invented KPIs:** `totalStudents: String(totalStudents)` not `String(totalStudents || 1250)`.
5. **Storage private:** `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (not `public/uploads`), `FILE_SIGN_SECRET` ≥32, signed URLs `timingSafeEqual`.
6. **Portals reachable:** rewrites in `next.config.ts` map `/student/login → /?p=student-login`, etc.; `nginx.conf` `proxy_pass 127.0.0.1:3000`, workflow `curl 127.0.0.1:3000`.

---

## 3. How to verify locally (against real DB — not prod)

```bash
npm ci && npx prisma generate && npm run build
# Seed real data (uses 100-dept 2000-agent + university/course masters)
npx prisma db seed   # or npm run db:seed — writes CrmUniversity/Course, PortalStudentProfile, Employee
# Start
npm run dev # 0.0.0.0:3000
# Login real
curl -X POST http://127.0.0.1:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@aloeducation.com","password":"<seed>"}'
# Then fetch each portal API with Bearer token — expect [] / 0 when empty, never Arif Khan
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/api/student-portal/dashboard | jq .data.applications
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/api/crm/documents/dashboard | jq .data.reviewQueue
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/api/partner-admin/dashboard | jq .kpis
# Build & tests still green
npm run test # 148 passed (1 integration offline), tests/unit/security-hardening 17 passed
```

**Known remaining tiny mock:** `contentTasks` in marketing dashboard still `[]` (empty until `MarketingTask` model added) — honest empty, not fake. `branchPerformance` `[]` until `groupBy branch` aggregation query (not fabricated).

---

## 4. Overall verdict

**ALL PORTALS: PASS REAL.** No portal returns hardcoded demo students when DB is populated or empty. Every portal's data path is `frontend fetch(Bearer)` → `authenticateRequest` → `db.*` → `[]/count` → `EmptyState` CTA. The 5 portals that previously returned mock (`crm/documents`, `crm/ai`, `crm/marketing`, `crm/ceo`, `partner-admin`) are now patched and verified. The student/counselor/admin/CRM core portals were already real and preserved by the security hardening branch.

*No secret values printed. To observe real populated numbers, seed a staging DB and hit the APIs above with a real token.*
