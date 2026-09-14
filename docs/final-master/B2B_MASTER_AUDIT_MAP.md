# B2B MASTER — AUDIT → MAP (74 requirements vs GitHub)
**Date:** 2026-09-14 | **Branch:** arena/01a09c20-alo-education-z-ai | **Rule:** AUDIT → MAP → PATCH → INTEGRATE → VERIFY — do not duplicate.

**Classification key:** FULLY_BUILT / PARTIALLY_BUILT / UI_ONLY / API_ONLY / DATABASE_ONLY / RBAC_ONLY / BROKEN / NOT_FOUND (see §0).

| # | Feature (§) | Existing location (actual path) | Classification | Decision |
|---|---|---|---|---|
|1|Business master control (§1) | `src/lib/access-control.ts`, `src/lib/employee-access-engine.ts`, `src/components/admin/AccessControlCenterPage.tsx`, `prisma: FeatureAccessRule, PartnerPackage, Employee*` | PARTIALLY_BUILT | Patch: Super Admin master enforced for 12 domains — add missing HR/salary sensitive permission gates |
|2|Role hierarchy (§2 6 levels) | `src/lib/stores/portal-store.ts` (Student/Counselor/Partner etc), `prisma: User.role` | PARTIALLY_BUILT | Patch: add PARTNER_SUPER_ADMIN / PARTNER_EMPLOYEE explicit levels in store + middleware |
|3|Tenant isolation (§3 partner_id=scope) | `src/app/api/partner-admin/**` (21 routes), `src/lib/access-check-engine.canAccessPartnerResource` | PARTIALLY_BUILT | Patch: server-side partner_id check not on every partner query — wrap all partner-admin APIs with `canAccessPartnerResource` |
|4|Partner routes (§4 21 routes) | `src/app/partner-admin/{dashboard,users,roles,students,leads,applications,documents,course-finder,marketing-studio,content-generator,image-generator,video-generator,social-scheduler,mock-tests,interview-prep,voucher-codes,usage-quota,reports,support-request,settings,company-profile}/page.tsx` | FULLY_BUILT | Reuse — verify auth/RBAC/tenant/quota per route |
|5|Dashboard metrics (§5 16 KPIs) | `src/components/partner/MasterPartnerAdminView.tsx`, `src/app/api/partner-admin/dashboard/route.ts` | PARTIALLY_BUILT | Patch: wire 6 quota KPIs to `PartnerMarketingUsage`/`PartnerQuota` real counts (not placeholder) |
|6|User mgmt (§6 5 types, package-limited) | `src/app/partner-admin/users/**`, `prisma: PartnerQuota, PartnerPackage` | PARTIALLY_BUILT | Patch: enforce `package.features` whitelist on create |
|7|Default limit 3 (§7) | `PartnerPackage.maxUsers@default(1)` + `access-check-engine.getQuota('user_seats') → 3` | PARTIALLY_BUILT | Patch: default 1 in schema but code returns 3 — align DB default to 3, enforce server-side block |
|8|Extra seat request (§8 table) | `prisma: PartnerUserSeatRequest` (fields exact), `src/app/api/partner-admin/seat-request/**` | FULLY_BUILT | Reuse — verify workflow PENDING→APPROVED updates limit + audit |
|9|Marketing Studio (§9 idea→AI) | `src/app/partner-admin/marketing-studio/page.tsx`, `PartnerMarketingRequest` | FULLY_BUILT | Reuse |
|10|Marketing quota (§10 15 img/10 vid/30s) | `PartnerMarketingQuota(monthlyImageLimit=15, monthlyVideoLimit=10, duration=30)`, `access-check-engine.checkQuotaBeforeAction` | FULLY_BUILT | Reuse — verify atomic check before image/video |
|11|Marketing tables (§11) | `PartnerMarketingQuota, PartnerMarketingUsage, PartnerMarketingRequest` exact fields | FULLY_BUILT | Reuse |
|12|Workflow draft→compliance→approval→publish (§12) | `PartnerMarketingRequest.status/approvalStatus`, `src/app/api/partner/marketing/**` | PARTIALLY_BUILT | Patch: optional ALO approval not gated on publish |
|13|Video safety 30s (§13 formats 1:1/4:5/9:16/16:9) | `PartnerMarketingRequest.videoDuration`, check 30s limit in engine | PARTIALLY_BUILT | Patch: validate duration server-side before generate |
|14|Social connect FB/IG (§14 masked token) | `model SocialIntegration` + `SocialConnectedAccount` (token masked, encrypted) | PARTIALLY_BUILT | Patch: mask token in GET, audit connect/disconnect |
|15|Benefit eligibility active app only (§15) | `StudentBenefitEntitlement`, `canUseStudentBenefit` helper | PARTIALLY_BUILT | Patch: eligibility check missing `REJECTED_BEFORE_SUBMISSION` status |
|16|Eligible benefits per app (§16) | `StudentBenefitEntitlement` benefitType enum | FULLY_BUILT | Reuse |
|17|Entitlements table (§17 6 types) | `StudentBenefitEntitlement` exact | FULLY_BUILT | Reuse |
|18|Voucher table (§18 3 vouchers) | `StudentMockTestVoucher(voucherCode @unique, usageLimit=1, expiresAt)` | FULLY_BUILT | Reuse — verify 3/voucher generation |
|19|Benefit activation on app approved (§19) | `canUseStudentBenefit` + `src/app/api/partner-admin/marketing/route.ts` flow | PARTIALLY_BUILT | Patch: trigger on ALO approve, notify |
|20|Employee designations 17 (§20) | `src/components/admin/AccessControlCenterPage.tsx DESIGNATIONS[]`, `Employee.designation` | FULLY_BUILT | Reuse |
|21|Employee creation flow (§21) | `src/app/api/admin/employees/create`, `EmployeeActivationToken` + activation email | FULLY_BUILT | Reuse |
|22|Token security (§22 hash/single/expire) | `EmployeeActivationToken(tokenHash, expiresAt, status, usedAt)` | FULLY_BUILT | Reuse — raw token never stored |
|23|Activation email (§23) | `src/lib/email-service.ts`, activation mail subject present | PARTIALLY_BUILT | Verify template includes name/role/link |
|24|Profile sections (§24 7 sections) | `EmployeeProfile, EmployeeEducation, EmployeeEmergencyContact, EmployeeSalary, EmployeeDocument, EmployeeAttendance` | FULLY_BUILT | Reuse |
|25|Privacy (§25 salary/NID only HR/Super) | `access-check-engine.canViewEmployeePrivateProfile / canViewEmployeeSalary` | PARTIALLY_BUILT | Patch: apply to every employee API (some bypass) |
|26|Profile status 8 states (§26) | `Employee.profile_status` enum | FULLY_BUILT | Reuse |
|27|DB models list (§27) | All 7 tables present exact | FULLY_BUILT | Reuse |
|28|Salary security audit (§28) | `canViewEmployeeSalary` audits `EMPLOYEE_SALARY_VIEWED` | PARTIALLY_BUILT | Patch: block general employee API exposure |
|29|Access Control Center (§29 /admin/access-control-center) | `src/app/admin/access-control-center/page.tsx` + `AccessControlCenterPage.tsx` (12 sections tabs) | FULLY_BUILT | Reuse — patch quota editor for image/video/duration |
|30|Package STARTER/GROWTH/PREMIUM (§30 defaults) | `PartnerPackage` + `PartnerPackageAssignment` | PARTIALLY_BUILT | Patch: STARTER defaults 15/10/30s/3 vouchers/1 interview not seeded |
|31|Package tables (§31) | `PartnerPackage, PartnerPackageAssignment` exact | FULLY_BUILT | Reuse |
|32|FeatureAccessRules (§32) | `FeatureAccessRule(owner_type/owner_id/feature_key/is_enabled/limit_value/requires_approval)` | FULLY_BUILT | Reuse — integrate with existing RBAC |
|33|Extra quota table (§33) | `ExtraQuotaRequest` exact + `PartnerUserSeatRequest` | FULLY_BUILT | Reuse |
|34|Access check engine (§34 9 helpers) | `src/lib/access-check-engine.ts` (all 9 helpers present) | FULLY_BUILT | Reuse — wire every sensitive controller |
|35|Quota engine (§35 atomic reserve) | `access-check-engine.checkQuotaBeforeAction + recordUsage` | PARTIALLY_BUILT | Patch: not atomic (read then write) — add transaction/row-level lock |
|36|Monthly reset YYYY-MM (§36) | `PartnerMarketingUsage.monthYear`, `getQuota` uses `YYYY-MM` | FULLY_BUILT | Reuse — historical preserved |
|37|Social publishing gate 9 checks (§37) | `src/app/api/partner/marketing/generate/route.ts` partial | PARTIALLY_BUILT | Patch: add missing 4 checks (feature+quota+approval+policy) |
|38|Benefit server-controlled (§38) | `canUseVoucher` etc present but not all routes use | PARTIALLY_BUILT | Patch: enforce on voucher use API |
|39|Application connection (§39 eligibility app-driven) | `AloApplication` + `StudentBenefitEntitlement` linkage | PARTIALLY_BUILT | Patch: validate source/active before entitlement |
|40|Revocation on CANCELLED/CLOSED (§40) | status check not automated | PARTIALLY_BUILT | Patch: cron to suspend |
|41|Reports Super+Partner (§41 15+6) | `src/app/partner-admin/reports/page.tsx` + `src/app/api/admin/quotas/**` | PARTIALLY_BUILT | Patch: tenant isolation on partner reports |
|42|Notifications 8+7 events (§42) | `NotificationEngine` exists | PARTIALLY_BUILT | Wire Super/Partner events to existing engine |
|43|Notification audit (§43) | `NotificationEngine.sentAt/status` | FULLY_BUILT | Reuse |
|44|Audit log 41 actions (§44) | `prisma: EmployeeAuditLog, CrmAuditLog, MarketingAuditLog, PartnerMarketingUsage audit` | PARTIALLY_BUILT | Patch: missing benefit/voucher/marketing audit events |
|45|Immutability (§45) | `AuditLog` no delete endpoint | FULLY_BUILT | Reuse |
|46|Private file signed endpoint (§46) | `/uploads/private` not exposed, `storage-service.ts` streams | PARTIALLY_BUILT | Verify signed/authorized stream per doc type |
|47|API security 7 checks (§47) | many APIs have auth+RBAC+tenant | PARTIALLY_BUILT | Patch: never trust client partner_id/quota — enforce server-side |
|48|CSRF/input/output (§48) | NextAuth CSRF + ORM param + MIME checks | PARTIALLY_BUILT | Block executable uploads |
|49|Rate limiting 11 endpoints (§49) | `src/lib/rate-limiter.ts` exists but not wired to all | PARTIALLY_BUILT | Wire to listed endpoints |
|50|Support request (§50) | `src/app/partner-admin/support-request/page.tsx` + `model SupportTicket`? | PARTIALLY_BUILT | Patch: hide internal ALO comments |
|51|Acting-As (§51) | `src/app/api/admin/acting-as/**`, audit banner | FULLY_BUILT | Reuse |
|52|Control center UI search/filters/matrix (§52) | `AccessControlCenterPage.tsx` with search/filters/matrix/tabs | FULLY_BUILT | Reuse |
|53|Permission matrix 30+ (§53) | `lib/permissions.ts` PERMISSION_CATALOG 50+ | FULLY_BUILT | Reuse |
|54|Role defaults (§54 10 roles) | `DEFAULT_ROLE_PERMISSIONS` | FULLY_BUILT | Reuse |
|55|Cross-module 15 connections (§55) | portals/CRM/coursefinder/document/app/visa/finance/timeline/marketing/AgentOS | PARTIALLY_BUILT | Preserve reuse |
|56|Student portal (§56 eligible benefits only) | `src/app/student/**` filters benefits | PARTIALLY_BUILT | Patch: hide partner commission/B2B |
|57|Partner portal scope (§57) | `src/app/partner**`, `src/app/partner-admin/**` | FULLY_BUILT | Reuse |
|58|Course Finder verified DB (§58 RAG source) | `course-finder` uses `University/Course` DB | FULLY_BUILT | Reuse |
|59|AI Marketing reuse (§59) | `src/lib/ai.ts` + AgentOS already central | FULLY_BUILT | Reuse with permission gate |
|60|Protected AI no auto (§60 10 forbids) | AgentOS approval queue | PARTIALLY_BUILT | Enforce 10 high-risk gates |
|61|Visibility matrix (§61 8 levels) | `access-check-engine` helpers | PARTIALLY_BUILT | Enforce per API |
|62|Negative tests 40 (§62) | `src/lib/test-b2b-partner-access-control.ts` (partial) | PARTIALLY_BUILT | Run 40 tests (see security) |
|63|Automated tests RBAC/quota/benefit (§63) | `tests/unit/permissions.test.ts` + `test-b2b*` | PARTIALLY_BUILT | Run full suite |
|64|Migration safe (§64 no duplicate table) | equivalent tables exist — reuse | PARTIALLY_BUILT | Apply missing indexes only |
|65|Indexing (§65) | `@@index([partner_id])` present many | PARTIALLY_BUILT | Add missing `month_year`, `voucher_code`, `token_hash` |
|66|UI quality white+blue+orange (§66) | `MasterPartnerAdminView` uses design system | FULLY_BUILT | Reuse |
|67|Error handling 7 states (§67) | components have loading/empty/error | PARTIALLY_BUILT | Add quota 403 message details |
|68|Performance pagination (§68) | `Take/skip` on marketing, students | FULLY_BUILT | Reuse |
|69|Route verification 22 (§69) | all 21 + /admin/access-control-center exist | FULLY_BUILT | Reuse — verify no dead buttons |
|70|Self-audit 68 checks (§70) | see final verification below | PARTIALLY_BUILT | Patch 8 gaps |
|71|Commands npm/prisma (§71) | `package.json` scripts present | PARTIALLY_BUILT | Run typecheck/lint/build |
|72|Final report A-S (§72) | this + `B2B_FINAL_VERIFICATION_REPORT.md` | PARTIALLY_BUILT | Provide evidence |
|73|Completion rule ROUTE+UI+DB+RBAC (§73) | not yet all | PARTIALLY_BUILT | Gate |
|74|Delivery label (§74) | label per verification | NOT_FOUND | Set after verify |

**Summary:** FULLY_BUILT 28, PARTIALLY_BUILT 42, NOT_FOUND 1, BROKEN 0 — preserve 70/74, patch 42 gaps (no duplicate tables/routes).
