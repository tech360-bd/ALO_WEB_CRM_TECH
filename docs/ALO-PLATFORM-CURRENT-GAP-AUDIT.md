# ALO Education Platform — Current Repository Gap Audit

**Audit date:** 2026-10-24  
**Branch:** `arena/07a873f9-alo-web-crm-tech`  
**Audit mode:** repository/source inspection only; no production credentials, Hostinger runtime, production database, external website, or live provider was accessed.  
**Overall result:** **NOT COMPLETE / NOT PRODUCTION VERIFIED**. This is an evidence-based code inventory, not a claim that every route, role, migration, or workflow is end-to-end functional.

## 1. Repository and architecture inventory

| Area | Evidence found | Inspection result |
|---|---|---|
| Web application | `src/app` App Router pages and route handlers | Existing Next.js/TypeScript application; not a new project |
| API surface | 966 `route.ts`/`route.js` files under `src/app/api` | Large API surface; route presence is not proof of successful runtime behavior |
| UI surface | 423 `page.tsx`/`page.jsx` files under `src/app` | Existing student, employee, partner, CRM, admin and portal pages |
| Database | Root `prisma/schema.prisma`, 548 Prisma models | MySQL datasource uses root `DATABASE_URL`; no live DB connected or inspected |
| Migration history | 30 directories under `prisma/migrations` | Files are present; applied production migration state is unknown |
| Authentication/access | `src/lib/auth-middleware.ts`, `auth.ts`, `student-auth.ts`, `employee-access-engine.ts`, `access-control/central-security-engine.ts`, `partner-tenant-guard.ts`, scope-specific access modules | Multiple existing centralized/scope-aware controls; every sensitive route still needs route-by-route negative testing |
| Scheduled operations | `src/cron/`, `src/app/api/cron/`, `scripts/cron-scheduler.sh` | `src/cron/cron-definitions.ts` declares 22 jobs; production scheduler, runtime env, and execution history are not verified |
| Deployment | `.github/workflows/deploy-production.yml` is an explicit refusal notice; recovery workflow also refuses production changes | CI is not proof of Hostinger release/deployment; deployment remains unauthorized |
| Environment configuration | `.env.example`, `.env.production.example`, environment audit scripts | Root production runtime source/effective environment is unknown; secret presence is unverified |

The primary URLs `https://aloeducation.com`, `https://alocrm.base44.app`, and `https://alo-web-cem--last.web.app` were not visited. Production access was intentionally not attempted.

## 2. Existing feature map and maturity

Maturity is assessed conservatively: **L0** absent; **L1** UI/model presence; **L2** backend/API present; **L3** end-to-end workflow tested; **L4** automated and verified; **L5** AI-assisted and evaluated; **L6** production verified. Source inspection alone cannot establish L3–L6.

| Domain | Existing evidence | Repository assessment | Current maturity evidence |
|---|---|---|---|
| Student identity/profile | `Student`, profile, education, passport, funding, preferences and event models in `prisma/schema.prisma`; `/student/*` pages and APIs; transactional allocator `src/lib/identity/student-id.ts` | Substantial foundation. Existing IDs are not to be rewritten. New-format policy was patched in this slice to `AE-YYYYNNNN`; historical 5/6-digit AE codes and `ALO-S-*` remain accepted. | L2; MySQL concurrency and full registration journey NOT VERIFIED |
| Public/WhatsApp intake | `src/app/api/whatsapp/webhook/route.ts`; `src/lib/ai-agents/student-intake-agent.ts`; `src/lib/communications/contact-identity.ts`; `ContactMatchReview` | Signed webhook, duplicate handling and contact/lead matching exist. Unknown WhatsApp sender currently becomes a Lead, while the public intake agent explicitly refuses identity-bound profile creation and directs users to the secure portal. Guided onboarding → Student ID → portal invitation is not proven end-to-end. | L2; requested Student journey acceptance test fails at this gap |
| Communication hub | `/crm/communications/inbox`, `/crm/social`, `/crm/whatsapp`; UCC and communication models; communication APIs; `/api/whatsapp/*`; Meta Facebook webhook | Substantial but overlapping legacy/canonical stores and WhatsApp webhook paths exist. Existing WhatsApp path writes to archive, UCC, social inbox and thread/message records. Cross-channel single-history correctness is not verified. | L2; no live provider delivery or cross-channel e2e verification |
| External channels | Facebook leadgen/Messenger code in `src/app/api/facebook/webhook/route.ts`; SMS receipt route `src/app/api/integrations/httpsms/webhook/route.ts`; 3CX routes and account registry | Facebook and WhatsApp code exists. The reviewed HTTPSMS route processes delivery receipts, not inbound SMS conversations. Instagram/LinkedIn/SMS live connectivity is not established by registry entries. | L1–L2; provider authorization and inbound coverage NOT VERIFIED |
| Official WhatsApp number pool | `src/lib/whatsapp-number-pool.ts`; `/api/whatsapp/numbers`; pool tests cover 20 numbers | Routing configuration exists in source. It does not prove any phone number has Meta `phone_number_id`, credentials, approved templates, or working Cloud API connectivity. | L2 configuration; live connections NOT VERIFIED |
| CRM leads and assignment | Lead/LeadForm/lead automation models; CRM APIs and pages; import/contact-match flows | Real backend components exist. Assignment/routing behavior, fair workload, and branch-specific access require end-to-end tests. | L2; L3 NOT VERIFIED |
| Applications / Application Manager | `/application-manager/*`, `/crm/applications`, `/crm/b2b-applications`; application and B2B APIs; `Application`, `B2bApplication`, status, comments, documents, deadlines, tasks, offer, CAS/I20/COE and finance models | Broad existing implementation already present; do not create a second application engine. Confidential B2B field filtering and every role/scope path require negative tests. | L2; role-by-role, partner-safe, end-to-end workflows NOT VERIFIED |
| Visa / Visa Interview Officer | `/employee/visa-interview-officer`, `/employee/visa-interviews/*`, `/crm/visa-*`, `/student/visa*`; `/api/visa/*`; `VisaCase`, interview, funding, refusal, study-gap, sensitive review, task and report models | Dedicated officer workspace, APIs, models, student-facing routes and report routes are present. Presence does not prove all controls, private document access, AI session persistence, feedback approvals, or cross-student isolation. | L2; security negatives and complete journey NOT VERIFIED |
| Documents | `StudentDocument`, `DocumentVersion`, `UccAttachment`, `ApplicationDocument`; private storage/access libraries; protected download routes | Versioning, private storage, checks and review APIs exist. Requirement-slot continuity, every download audit, immutability and application association require acceptance tests. | L2; full document lifecycle NOT VERIFIED |
| Employee access / HR | Role dashboards under `/employee/*`; `UnifiedEmployeeDashboard`, `EmployeePortalShell`, `EmployeeViewRouter`; `/api/employee/dashboard`, `/api/employee-access/*`, `/api/admin/access-control-center`, Acting-As APIs; employee/HR, roles, permissions, salary, document, attendance, leave, payroll, temporary access and audit models | Significant reusable foundation exists. The employee self-service dashboard previously lacked an active-employee gate, used only the portal user ID for record scopes, returned unfiltered agreement records, and returned storage-oriented document fields. Patched in this slice with active-employee enforcement, scope aliases resolved from that employee record, active agreement metadata + self-only acceptances, safe document projection, and private-view audit. Broader role×API, salary/download privacy, activation, custom permission and dashboard-workflow verification remains. | L2; 4 new focused negative/scope/audit tests pass; full employee matrix NOT VERIFIED |
| Partner portal / quota / benefits | `/partner-admin/*`; partner access APIs and `PartnerProfile`, packages, quotas, seat requests, marketing use, benefit/voucher models | Extensive portal and quota/benefit structures exist. Tenant isolation, race-safe quota reservation and voucher ownership must be verified through security/integration tests. | L2; cross-tenant tests NOT VERIFIED |
| University/course/country data | University/course/country models and pages; course finder APIs; admin import center; source logs, update requests, duplicate workflows; weekly scan/update routes | The data-center and source/approval concepts exist. Master-data consistency between public pages, CRM, AI retrieval and approved records is not proven end-to-end. | L2; source freshness/publication workflow NOT VERIFIED |
| Student portal / journey | `/student/*` includes dashboard, onboarding, profile, course finder, applications, documents, messages, timeline, English test, mock tests, AI interview, visa, CAS, referrals and payments | Broad journey UI and API coverage exists. A complete real-record journey from first contact through visa decision and pre-departure is not demonstrated. | L2; acceptance journey NOT VERIFIED |
| AI / memory / RAG | AI AgentOS, student-intake/AI agents, controlled memory, source/evidence and model integrations exist | Multiple AI capabilities exist. A single student-scoped orchestrator/tool gateway with policy-enforced retrieval, evaluations, cost observability and end-to-end human approvals has not been demonstrated. | L1–L2; production-safe autonomous actions NOT VERIFIED |
| Tasks / notifications / audit | Existing task, notification, webhook, audit, analytics and timeline models/routes; cron jobs | Shared engines exist and are preferable to duplicates. Complete event coverage, immutable audit controls, delivery semantics and production job liveness are unverified. | L2; production observability NOT VERIFIED |
| Backup / recovery | `docs/BACKUP_RESTORE_GUIDE.md`; backup cron declaration is intentionally blocked | No backup snapshot or tested restore was verified. Never assume one exists. | NOT VERIFIED; production backup evidence required |

## 3. Confirmed gaps and conflicts to resolve safely

1. **First-contact lifecycle:** the requested text contains both “create a Student immediately on unknown WhatsApp” and “do not create a full Student without guided onboarding/identity workflow.” Safest compatible interpretation: create/retain a Lead/contact at first message; ask for Student ID or start progressive registration; after required fields and consent are captured, create/link one Student, allocate the ID, invite the portal, and preserve the original conversation. The current public intake agent does not complete this flow.
2. **ID format conflict remains unresolved:** current allocator output is `AE-YYYYNNNN`, while the expanded request specifies `AE-YYYY000001` and `AET-YYYY000001`. The existing change only alters new AE allocator output and accepts historical IDs; it does not implement AET or rewrite existing IDs. Do not change the format again until the user confirms the canonical format and AET use/counter policy.
3. **Overlapping systems:** WhatsApp currently has canonical and legacy webhook routes and several persisted conversation/message representations. Consolidate by routing/adapter reuse, not by creating a second hub or deleting existing history.
4. **Provider configuration:** credentials, official phone-number IDs, OAuth approval, templates, SMS, mail, and telephony cannot be inferred from source. Show `CONFIGURATION REQUIRED` until actual authorized verification is performed.
5. **Website/external benchmark:** competitor/public-site benchmark was not performed because the sandbox has no general web access to those hosts. No competitor code or assets were used.
6. **Production truth:** no Hostinger app root, deployed release, effective environment, production database identity, permissions, backup, or live integrations have been independently verified. No production query, migration, write, restart, or deployment occurred.

## 4. Verification state

| Check | Result | Evidence | Remaining action |
|---|---|---|---|
| Repository branch and working tree | PASS | Active branch is `arena/07a873f9-alo-web-crm-tech`; pre-existing audit changes retained | Continue on this branch only |
| Static inventory | PASS, bounded | Counts and source paths listed above | Deeper route-by-route authorization review remains |
| New student ID + identity unit coverage | PASS | Final focused Vitest rerun: 9 files, 81 tests passed, including allocator, legacy ID acceptance, public intake safety, identity policy and registration. A prior fixture-only mismatch for `ALO-S-*` was fixed before this passing rerun. | Real MySQL concurrency still NOT VERIFIED |
| Root lint | PASS | `npm run lint` exited 0 after the patch | Full typecheck/build remain blocked by Prisma client generation |
| Diff hygiene | PASS | `git diff --check` exited 0; no stale six-digit-new-ID policy comments remain in source/tests/schema | Continue to run before every patch handoff |
| Full tests | FAIL / partially blocked | Latest `npm test -- --reporter=dot`: 2,729 passed, 3 failed, 28 skipped; 14 files failed, including 12 blocked by missing generated Prisma client. Failed tests reported: `ai-security-remediation` unknown-action risk, and two `business-hours-policy` persisted-read cases. | Restore Prisma client generation path; investigate the 3 test failures independently |
| Prisma validate/generate | BLOCKED | Previous Prisma engine download from `binaries.prisma.sh` failed TLS in this sandbox | Verify in authorized environment or approved cache; do not connect to production |
| Typecheck | FAIL / blocked | Current `npm run typecheck` stops at `db:verify-client`: `Cannot find module '.prisma/client/default'` | Generate client successfully before running `tsc` |
| Build | BLOCKED | Previous build stopped at the same Prisma engine download failure; not rerun after this code-only change | Re-run when Prisma generator is available |
| Production/database/integrations | NOT VERIFIED | No production access attempted | Requires separate explicit authorization and safe staging evidence |
| Deployment | NOT AUTHORIZED | Deployment/recovery workflows are refusal notices; `DEPLOY_ENABLED=false` policy preserved | Do not deploy |

## 5. User-requested master-build traceability

This matrix is a bounded repository check against the pasted 57-section master instruction. “Implemented” means relevant code is present; it does **not** mean the full end-to-end acceptance test passed. No production or real-provider verification occurred.

| Feature | Route / surface | Backend API | Database | Automation | Test result |
|---|---|---|---|---|---|
| Student identity + ID allocation | Student registration, `/student/*` | `src/lib/identity/student-id.ts`; canonical student validation | `Student`, `StudentIdSequence` | Transactional AE counter; no AET-only allocator found | PARTIAL. Focused allocator/legacy tests pass. **Format conflict requires decision:** current code emits `AE-YYYYNNNN`; pasted spec says `AE-YYYY000001` and requires `AET-YYYY000001`. No ID-policy change made pending clarification. |
| First contact / channel intake | WhatsApp webhook, website lead; Facebook webhook | `/api/whatsapp/webhook`, `/api/website/lead`, Facebook webhook; reviewed HTTPSMS webhook | Lead/contact/UCC/thread/archive/student | WA creates/links Lead/Contact and appends channel events; no fully automated guided registration-to-Student+portal invitation | PARTIAL. Unknown sender remains Lead first; end-to-end provider test NOT VERIFIED. HTTPSMS route is receipts-only, not inbound SMS conversation handling. |
| Student login / access | `/student/login`, `/student/register`, `/login`, `/forgot-password`, `/reset-password` | Student password/OTP login and session/auth routes exist | `Student`, `StudentSession`, OTP/login attempt records | Email OTP and session issuance; WhatsApp OTP, student-ID OTP, magic link, Google, English-test-only identity separation not proven | PARTIAL. Unit coverage exists, but login-to-all-portal-routes browser journey NOT VERIFIED. |
| Student dashboard | `/student/dashboard` | Dashboard, profile, applications, documents, timeline and next-action APIs | Student/profile sections/applications/documents/timeline/next actions | **Fixed in this pass:** dashboard now uses the cookie-backed StudentSession APIs, fails visibly on data-fetch errors, and no longer fabricates a Student ID/type/destination/referral code or journey completion from profile percentage | PARTIAL. Four related unit files / 25 tests pass, including profile response carrying the authenticated Student ID. Browser login/reload/ownership journey NOT VERIFIED. |
| Profile / eligibility / Course Finder | `/student/profile`, `/student/profile/onboarding`, `/student/course-finder`, `/student/compare` | Student profile sections; course finder and eligibility APIs | Student profile sections, courses/universities/intakes | Profile-based eligibility/course comparisons exist in part; full scores, visa impact and recommendation pipeline not proven | PARTIAL; full acceptance test NOT VERIFIED. |
| Application creation / tracker | `/student/applications`, `/student/apply/[course_id]` | Application readiness, draft, application and status APIs | `Application`, tasks, comments, deadlines, offers, CAS and finance models | Existing draft/checklist/task/event pieces; complete pre-check-to-submission automation and role-specific notifications not proven | PARTIAL; full workflow and negative tests NOT VERIFIED. |
| Documents / forms | `/student/documents`, protected downloads | Student private upload, review, download and document APIs | `StudentDocument`, `ApplicationDocument`, versions, audit/events | Private byte upload/versioning/review queue exist; full AI classification, expiry/page-quality checks, form detection/autofill and every application association are not proven | PARTIAL; focused upload tests exist, full upload→review→form journey NOT VERIFIED. |
| Offer / deposit / CAS | `/student/offers`, `/student/payments`, `/student/cas` | Offer, payment and CAS APIs | Offer/CAS/payment/application finance records | Offer extraction, verified-fee rules, payment settlement, CAS-triggered visa unlock not demonstrated end-to-end | PARTIAL / NOT VERIFIED. |
| English tests / AI interview | `/student/english-test`, `/student/mock-tests/*`, `/student/ai-interview`, `/student/credibility-interview` | Mock-test, interview and result APIs | English tests, mock credits/sessions, interview sessions | Separate English-test-only account and restricted dashboard were not found; scores/credits/evaluations and dynamic follow-up need verification | PARTIAL; complete student result-to-CRM/timeline visibility NOT VERIFIED. |
| Visa readiness / human review / decision | `/student/visa*`, `/student/cas`; staff Visa Officer workspace | Visa case, checklist, interview, readiness, feedback, stage and document APIs | `VisaCase`, checklist, readiness, interview, feedback, audit | Human review structures exist; final blocking checklist, approval, submission receipt, decision-triggered pre-departure/refusal workflow not proven as one continuous path | PARTIAL; visa approval is never claimed; end-to-end NOT VERIFIED. |
| Messages / AI memory / handover | `/student/messages`, public intake and communication hubs | Student messages, WhatsApp, intake, timeline and task APIs | UCC/conversation/thread/message, `AiStudentMemory`/AgentMemory, timeline/tasks | Multiple message stores/channels exist; one unified conversation, comprehensive persistent memory, student-scoped AI answers and automatic uncertainty handover are not established | PARTIAL. SMS inbound and live provider delivery NOT VERIFIED. |
| Notifications / timeline / referral | `/student/notifications`, `/student/timeline`, `/student/referrals` | Notification, timeline, referral APIs | Notification, timeline/audit, Referral/StudentReferral | Existing subsystems; event completeness, referral code/reward rules and notification delivery are not verified | PARTIAL; no live delivery or complete acceptance test. The dashboard no longer displays a fabricated referral code. |
| Security / quality / production | All protected routes | Student auth/RBAC/ownership, private storage, audit and validation foundations | Existing schema/migrations | Route-by-route auth, tenant, CSRF, rate limiting and immutable audit coverage not fully tested | PARTIAL. Full suite currently has 2,729 passed, 3 failed, 28 skipped; 12 of 14 failed files are blocked by generated Prisma client absence. Production remains NOT VERIFIED and deployment NOT AUTHORIZED. |

### Verification record for this pass

- Focused Vitest: `tests/unit/student-form-b-profile-route.test.ts`, `student-id-allocation`, `student-application-create-draft`, and `student-auth-identity`: **4 files, 25 tests passed**.
- Root `npm run lint`: **PASS** after the dashboard/auth-routing changes; no lint warnings remain.
- `git diff --check`: **PASS** after the documentation matrix update.
- The full test suite/typecheck remain blocked as described in §4. No build, migration, staging DB, browser, or live-provider verification was completed in this pass.

## 6. Work done in this slice

- Updated the shared transactional student ID allocator so **new** student codes follow `AE-YYYYNNNN`; partner/employee formats remain unchanged.
- Kept legacy Student IDs valid and unchanged; canonical validation and tests accept new four-digit AE IDs, historical five/six-digit AE IDs, and historical `ALO-S-*` IDs.
- Updated allocator, WhatsApp helper, student auth/layout comments and StudentIdSequence schema documentation to match the new-ID rule.
- Updated unit/integration test expectations for the new generated format.
- No schema migration or production data change was made. `StudentIdSequence` already exists; this is a format-policy code change only.

## 6. Next implementation order

1. Restore Prisma client generation through an approved, network-available path; rerun typecheck/full tests/build and investigate the remaining failures. Focused ID/identity/registration tests and root lint now pass.
2. Implement the guided inbound identity/onboarding workflow through the existing WhatsApp webhook, intake agent, contact-match review and portal-invitation services; do not create a Student on a bare “Hi” and do not merge on name/phone alone.
3. Audit and test authorization/tenant isolation for Application Manager, Visa Officer, employee HR and partner APIs; patch existing handlers only.
4. Complete communication-to-application/document/SLA/task/notification/audit event paths and prove idempotency.
5. Verify course/university approval and student migration/import paths; preserve rollback and source provenance.
6. Perform staging-only MySQL, provider, security, browser and end-to-end tests. Production remains out of scope until separately authorized.

## 7. Employee access-control audit (bounded; not a completion claim)

### Existing route/UI/API/model mapping

| Surface | Existing implementation | Audit result |
|---|---|---|
| Shared employee portal | `/employee/layout.tsx` wraps the portal shell; `EmployeePortalShell` supplies common navigation and Acting-As visibility; `/employee` uses `EmployeeViewRouter`; role-specific pages reuse `UnifiedEmployeeDashboard` | Reuse is appropriate; no duplicate dashboard was added. The shell navigation is store-based and works through the legacy `/employee` view router, while many role dashboards are separate routes. Live route-to-view behavior is still untested. |
| Role dashboards | Counselor, Senior Counselor, Application Team/Manager, Visa Officer/Interview Officer, Finance, Marketing/Marketing Manager, HR, Branch/Country/Office Manager, Front Desk, Support, Partner Manager | Pages and redirect mapping exist. CEO/Director fall through to the unified dashboard. A complete role×widget/action mapping is not proven. |
| Dashboard data API | `/api/employee/dashboard` validates active `Employee`, `employee.dashboard.view` / `view_all`, allowed role, branch/destination scope, assignment IDs, UCC B2B confidentiality and role-specific query filters | Server-side scope controls and `tests/unit/employee-dashboard-scope.test.ts` exist. This only covers selected counters/queries; every role-specific metric and other route still needs API-level negative tests. |
| Access control center | `/admin/access-control-center`; `/api/admin/access-control-center`; `/api/employee-access/feature-access`, `/permissions`, `/permission-packages` | Found and fixed a confirmed schema/contract mismatch in this slice. Feature rules now persist against the existing `FeatureAccessRule` shape, resolve the target from an existing Employee row, upsert exact per-employee feature/action keys, audit create/update, restrict rule enumeration to Super Admin, and are editable through the existing center. Role-package management and the broader custom permission workflow remain unverified. |
| Employee privacy / HR | `/api/employee-access/profile`, `/api/employee-access/employee-dashboard`, salary endpoints; `EmployeeProfile`, `EmployeeHRProfile`, `EmployeeHR`, `EmployeeSalary`, `EmployeePayroll`, `EmployeeDocument`, attendance/leave and emergency-contact records | The self-service dashboard route was patched in this slice. Other employee-profile, salary, directory, document-download and HR routes remain a separate route-by-route audit; no broad privacy claim is made. |
| Onboarding / lifecycle | Employee creation, activation, resend, HR profile and lifecycle endpoints; hashed activation token and employee audit models | Reusable flows exist. SMTP delivery, end-to-end activation, suspension/revocation and approval separation remain unverified. |
| Partner packages / quotas | Partner package/assignment, marketing quota/usage, seat and extra quota request models; entitlement-policy engine; Super Admin access center | Catalogue and some quota engines exist. Race-safe limit reservation, package create/assign/audit, seat approval effects and partner tenant negatives require focused audit/tests. |
| Acting-As | Existing start/stop/session routes; real actor/effective actor attribution; employee shell banner and Super Admin log endpoint | Reason, expiry and audit flow are present in code; session expiry/revocation and privileged-route negative tests remain unverified. |

### Change made in this slice

`/api/employee-access/employee-dashboard` now refuses callers without an active Employee record before querying HR data; derives compatible legacy ID aliases only from that authenticated Employee row; applies the resulting owner-only filter to employee-owned documents, attendance, leave, payroll, devices, acceptance records, permission requests and login history; returns only safe document metadata and active agreement metadata with only the current employee's acceptance rows; and writes a sensitive self-service audit event. The feature-access API and existing center UI were also repaired to persist schema-valid employee-scoped feature/action rules, prevent non-Super-Admin rule enumeration, and audit rule create/update. These are bounded corrections, not proof that all HR/access routes are secure.

### Employee acceptance evidence

| Check | Result |
|---|---|
| Employee self-service unauthenticated/nonemployee/inactive negative | New unit test verifies inactive account receives 403 before any HR-data reads. Authenticated nonemployee is represented by no Employee match and follows the same deny path. |
| Employee ID alias scoping | New unit test verifies all employee-owned list reads use IDs obtained from the authenticated Employee record and login history is constrained by those IDs or the same user ID. |
| Agreement/document minimization | New unit test verifies agreement content/file URL are not selected, acceptances are employee-filtered, and documents are projected without storage path/hash. |
| Sensitive read audit | New unit test verifies the route logs a category-only self-service event without including HR values. |
| Focused verification | Employee self-service, feature-access, dashboard-scope, deep-audit and acceptance suites: 5 files / 73 tests passed. ESLint on both changed APIs, the access-center page and new tests passed; `git diff --check` passed. |
| Overall employee authorization | NOT COMPLETE / NOT VERIFIED. No browser session, full role×capability suite, DB-backed integration, staging, or production check occurred. |

### Immediate employee work order

1. Add a dedicated permission-package/role scope workflow on top of the now schema-valid per-employee feature-rule editor; verify exact permission/action semantics and approvals.
2. Continue route-by-route salary, profile, document, directory and leave privacy checks, including own/assigned/branch/country/department/all scopes and sensitive-view/download audit.
3. Verify employee create → activation → profile completion/review → role/permission/package assignment → first authorized dashboard, plus suspension/revocation and non-self approval.
4. Test each role dashboard, every server data query, custom permissions and scope boundaries with both positive and negative integration tests; test Acting-As attribution and expiry separately.
5. Test partner package assignment and quotas with concurrent requests and tenant-isolation negatives; preserve existing partner/student records and entitlement rules.

No production or staging data was accessed or changed. No migrations, deployment, restart or environment changes were made.

## 8. Old-CRM student import hardening — partial, not live verified

### Changes made

- Added `src/lib/student-import-file.ts` with quoted CSV parsing and first-sheet XLSX parsing, header aliases, a 20 MB upload cap and 25,000-row cap. The import UI now sends the original file as multipart form data instead of splitting CSV lines naively.
- Reworked the student-batch staging route to require server-resolved Super Admin role, normalize old CRM rows, run the existing duplicate engine, persist row-level errors and legacy references, and create a review batch before live execution. JSON uploads receive the same row cap.
- Reworked the executor to atomically claim only `approved` batches; recheck identity duplicates; use row transactions; persist source/note/communication/document-reference history; create an application/task for applicable rows; apply only explicit supported merge decisions; and audit execution. It does **not** create PortalUser/login credentials. Document references are placeholders only—the bytes must be re-uploaded through secure document upload.
- Hardened approval, batch listing/detail/preview, duplicate review, merge decisions and field-mapping access to Super Admin. Approval and its audit are transactional. The rollback endpoint is intentionally nondestructive: it records a rollback-review request and does not delete students, applications, documents or history.
- Updated the import UI messages so execution reports counts and rollback is presented as “Request review,” not deletion. Added page-bounded staging/duplicate reads (100 rows max per request) and a field-by-field duplicate decision panel in the existing import page; supported choices are keep, use imported, or skip, and changes remain staged until approval/execution.

### Verification evidence and limits

| Check | Result |
|---|---|
| CSV/XLSX parser | PASS — `tests/unit/student-import-file.test.ts`, 3 tests: quoted comma/newline CSV, XLSX aliases, malformed CSV rejection |
| Approval boundary/state gate | PASS — `tests/unit/student-import-approval.test.ts`, 3 tests: ordinary Admin denied, Super Admin compare-and-set audited, wrong-state conflict |
| Focused touched-area tests | PASS — 10 files / 58 tests across focused runs; includes CSV/XLSX parsing, approval/merge authorization, bounded batch-detail access, student identity/profile, employee access and WhatsApp handling |
| ESLint | PASS — root `npm run lint` exited 0 during this slice; focused ESLint also passed on the later merge UI, pagination routes and merge executor changes |
| Diff hygiene | PASS — `git diff --check` exited 0 |
| Prisma validate | BLOCKED — schema engine download from `binaries.prisma.sh` failed TLS in this environment; no DB connection was made |
| Typecheck/build | BLOCKED — `db:verify-client` cannot load `.prisma/client/default`; TypeScript/build have not validated these route/model payloads |
| Browser/database/live import | NOT VERIFIED — no browser, staging or production database/provider execution was performed |

### Remaining import risks before use

- The merge decision UI is now present in the existing import page with bounded duplicate context and explicit supported fields, but the browser operator flow has not been tested. Server/model compatibility and executor behavior still need DB-backed integration tests.
- No executor integration tests yet cover model payloads, partial row failures, retry/idempotency, duplicate races, merge application, or audit transaction behavior. Generated Prisma client is unavailable, preventing typechecking against the client.
- `processing` batches can remain stuck if the process is terminated unexpectedly; recovery/lease handling needs a safe, audited flow. Review merge-vs-approval concurrency before live use.
- University/course/scholarship import routes remain separate existing paths and have not been reconciled to one approval/source-evidence flow in this pass.
- Treat all migration behavior as **NOT PRODUCTION READY / NOT LIVE VERIFIED**. Never execute against a real database until schema/client validation, transaction/retry tests, operator merge UX and authorized staging tests pass.

## 9. Existing build/deployment-file reconciliation

Read-only comparison of the root runtime and retained older build/export copies found:

- **Canonical repository package:** root `package.json` targets Node 22/npm, `build` runs the Node-version assertion, Prisma generation/client verification, Next standalone build and `scripts/prepare-standalone.mjs`; `start` calls root `server.js`. Root `server.js` refuses startup without `.next/standalone/server.js`, then sets production `HOSTNAME=0.0.0.0` and validates `PORT`.
- **Root Next config:** `output: "standalone"`; root `.dockerignore` excludes `.env*` except `.env.example`, local databases, uploads and generated dependencies.
- **Legacy nested export:** `alo-education-web-crm-final/package.json` and `deploy-build/package.json` have deliberate `build`/`start` scripts that throw `LEGACY / NOT USED FOR CURRENT PRODUCTION`. Their old server wrapper tries to load `.env` and contains fallback/runtime-copy logic. It must not be used as the current deployment entrypoint.
- **Historical backup:** `.repair-backup-20260819/package.json` differs in engine range and startup command; it is retained as a backup, not the active build contract.
- **Legacy operational scripts:** root and nested `.zscripts/build.sh` / `start.sh` exit through deployment quarantine; unreachable historical bodies refer to a retired path, Bun, and even copying a local test DB into a production package. Do not execute those historical bodies or use the old DB-packaging path.
- **Other quarantined entrypoints:** root Docker `CMD` and root `ecosystem.config.cjs` deliberately exit with disabled messages. These are not Hostinger Node startup instructions.
- **Evidence limit:** the root build itself was not verified because Prisma engine download failed TLS; the Hostinger account/runtime, actual application root, current deployed artifact, startup setting, and persistent storage were not accessed. Do not infer them from repository scripts. No old file was deleted, moved, restored or executed.


