> **2026-10-11 current gate notice:** NOT READY. Historical statements below are retained, not current certification. See [Phase 2 Gate1/Gate2 findings](AUDIT/phase2-gates-2026-10-11/REPORT.md) for measured counts, private-storage mitigation, tests and unresolved source/staging blockers. Legacy signed-download guidance below is superseded by resource-specific authorized downloads.

# MASTER REQUIREMENT REGISTER — ALO Education Web + CRM

**Purpose.** This file is the standing cross-check required by the master directive:
*"Treat every prompt I provide from this point forward as the MASTER REQUIREMENT and
cross-check it against ALL previous requirements/memory so that no previous feature or
instruction is accidentally omitted."*

Every requirement family below is mapped to **real code evidence in this repository** and
given an honest status. Statuses are never inferred from filenames or UI labels — they
follow the directive that **"file exists" / "API exists" / "model exists" ≠ complete**.

**Status vocabulary** (per directive):
`COMPLETE` · `PARTIAL` · `MISSING` · `BLOCKED` (external dependency) · `NOT VERIFIED`

**Last re-measured:** 2026-10-09 · branch `arena/8bfa5154-alo-education-z-ai` · base `90f3fb0`

---

## 0. Measured repository scale (verified this session, not taken from any prior report)

| Metric | Command | Value |
|---|---|---|
| Prisma models | `grep -c "^model " prisma/schema.prisma` | **531** |
| Schema lines | `wc -l prisma/schema.prisma` | 11,684 |
| DB provider | `datasource db` block | **mysql** ✅ (spec requires MySQL, not SQLite/Postgres) |
| API route handlers | `find src/app/api -name route.ts` | **895** |
| App Router pages | `find src/app -name page.tsx -not -path "*/api/*"` | **399** |
| Components | `find src/components -type f` | 485 |
| Lib modules | `find src/lib -type f` | 339 |
| Source lines | `find src -name "*.ts" -o -name "*.tsx" \| xargs wc -l` | **379,067** |
| Unit test files | `find tests -name "*.test.ts*"` | 124 |
| Node / npm | `node -v` / `npm -v` | **v22.22.3** / 10.9.8 ✅ (spec requires Node 22, NOT Bun) |

> Note: a prior report claimed "175 models / 137 API routes". The **real** numbers are far
> higher (531 / 895). Prior report figures must not be trusted; always re-measure.

---

## 1. Quality gates — ACTUAL results this session

| Gate | Command | Result | Evidence |
|---|---|---|---|
| Install | `npm ci` | **PASS** | 1209 packages, exit 0 |
| Lint | `npm run lint` (`eslint .`) | **PASS** | 0 errors, **0 warnings** after this session's fixes |
| Unit tests | `npx vitest run tests/unit` | **PARTIAL** | **1199 passed / 15 failed** in 4 files |
| Prisma validate | `npx prisma validate` | **BLOCKED** | needs `binaries.prisma.sh` (not in sandbox allowlist) |
| Prisma generate | `npx prisma generate` | **BLOCKED** | same; `--no-engine` also blocked (schema-engine still fetched) |
| Typecheck | `npm run typecheck` | **BLOCKED** | repo guard `db:verify-client` correctly refuses: *"Prisma model metadata is missing… A placeholder client is not type safety."* |
| Build | `npm run build` | **BLOCKED** | depends on `prisma generate` |
| CI (remote fallback) | GitHub Actions | **BLOCKED** | billing failure — jobs never start; see §1.3 |

### 1.1 The 15 test failures are PRE-EXISTING — proven, not assumed

Failing files: `accounting-ledger`, `cms-revisions`, `journal-integrity`,
`whatsapp-media-ingestion`.

Proof method: `git stash push -u` → re-ran those 4 files on the **clean tree at HEAD
`90f3fb0`** → **identical result: 15 failed / 45 passed**. Therefore this session's edits
introduce **zero** test regressions.

### 1.2 Why typecheck/build cannot be certified here (honest limitation)

`node_modules/.prisma/client/index.d.ts` is a **3,989-byte placeholder stub** containing
**0** real model references. Prisma's engine binaries are only served from
`binaries.prisma.sh`, which is outside this sandbox's network allowlist. `prisma-engines`
no longer publishes per-commit GitHub releases (verified: `api.github.com/repos/prisma/
prisma-engines/releases/tags/<sha>` → HTTP 404), so the allowed `github.com` mirror is not
a workaround.

**Consequence:** any claim of "typecheck PASS" or "build PASS" made from this sandbox would
be fabricated. Those gates are **NOT VERIFIED** and must be re-run in CI or on a host with
engine access. Syntax of every file touched this session *was* independently verified with
`esbuild` (parse-check, see §2.4).

### 1.3 ⛔ CI ITSELF IS DOWN — GitHub Actions billing failure (found this session)

Because the sandbox cannot run the Prisma gates, CI was the fallback source of
typecheck/build evidence. **CI is not running either.**

Evidence (`gh api`, 2026-10-09):

- PR #48's two jobs (`Lint · Typecheck · Tests · Prisma · Build`, `MySQL 8 · Migrate ·
  Integrate · Boot`) both concluded `failure` in **2 seconds** with an **empty `steps[]`
  array** — no step ever executed.
- Check-run annotation, identical on both jobs:
  > *"The job was not started because recent account payments have failed or your spending
  > limit needs to be increased. Please check the 'Billing & plans' section in your settings"*
- Conclusion tally over the last **100** workflow runs: **89 failure · 7 success · 4 cancelled**.
- **Last successful CI run: `2026-10-08T09:12:32Z`** (branch `arena/d36e2d29-…`); last success
  on `main`: `2026-10-08T08:27:59Z`.
- Sampled the most recent `main` run (`37926231042`) directly: **both** jobs carry the same
  billing annotation. So this is **not** a code failure and **not** specific to this branch.

**Impact.** Since ≈`2026-10-08T09:12Z` (≈27 hours before this writing) **every** push and PR on
this repository — including pushes to `main` — has had **zero** automated validation. Any
"CI PASS" evidence in reports dated before that timestamp is stale and no longer holds.
Nothing merged in that window has been typechecked, built, or test-run by CI.

**Fix (owner action required — not fixable from code).** GitHub → *Settings → Billing & plans*:
clear the failed payment or raise the Actions spending limit. Then re-run PR #48's checks to
obtain the missing `prisma validate` / `generate` / `typecheck` / `build` evidence.

**Status: `BLOCKED` — billing.** Until it is cleared, no gate beyond lint and unit tests can be
certified for this repository from any environment.

---

## 2. Requirement families — cross-check against real code

Route existence was verified by testing **85 distinct paths named across the master prompts**
against real `page.tsx` files: **84/85 present**. The single "miss"
(`/employee/access-control-center`) was an error in the test list — the spec actually names
`/admin/access-control-center`, which exists.

### (a) Application Manager Portal + Direct/Partner/B2B engine — `COMPLETE` (route+model level)
Routes verified present: `/application-manager/{dashboard,applications,create,direct,partner,
b2b,b2b/create,b2b/providers,submission-queue,document-review,offer-management,cas-i20-coe,
deadlines,comments,tasks,reports,settings}`; CRM mirrors `/crm/{applications,b2b-applications,
offer-letter-management,decision-pending,cas-i20-coe}`.
Models: `B2bApplication`, `B2bProvider`, `B2BContact`, `ApplicationOffer`, `ApplicationCasI20Coe`,
`ApplicationDeadline`, `ApplicationComment`, `ApplicationDocument`, `ApplicationStatusLog`,
`ApplicationTask`, `ApplicationNotification`.
*Backend-enforced B2B confidentiality (403 + field stripping) was verified as FIXED in a prior
session; not re-probed end-to-end this session → runtime behaviour `NOT VERIFIED` (no DB).*

### (b) Super Admin Control Center — `COMPLETE` (route+model level)
`/admin/{dashboard,employees,employee-control,role-permissions,permission-matrix,branch-control,
branches,country-control,destinations,reports,ai-command-center,agent-center,system-builder,
approvals,security,audit-logs,settings,access-control-center}` all present.

### (c) Unified University + Course Finder + Course Info — `COMPLETE` (route+model level)
Models: `CrmUniversity`, `CrmCourse`, `CrmCourseIntakeFee`, `CrmCourseRequirement`,
`CourseIntake`, `CoursePage`, `UniversityPage`, `UniversityFaculty`, `UniversityAgreement`,
`UniversityUpdateRequest`, `UniversityHistory`, `CourseHistory`, `SourceLog`, `UpdateRequest`,
`CountryQuickFact`, `CourseComparison`, `CourseShortlist`.
⚠️ Live production still renders a **static "362+ Universities"** headline beside an empty
DB list (prior audit finding A.3) and apex vs `www` served **different hero statistics**
(A.4). Those are production-data/deploy issues, `NOT VERIFIED` from this sandbox.

### (d) Services + Scholarships + Resources content system — `COMPLETE` (route+model level)
`Scholarship`, `Service`, `Resource` models present; `/services`, `/scholarships`,
`/resources` routes present; detail hubs `ServiceDetailHub`, `ScholarshipDetailHub`,
`ResourceDetailHub` exist.

### (e) Employee Access / HR / RBAC / quota / approval / audit — `COMPLETE` (route+model level)
Models: `EmployeeActivationToken`, `EmployeeProfile`, `EmployeeSalary`, `EmployeeDocument`,
`EmployeeEmergencyContact`, `PartnerPackage`, `PartnerUserSeatRequest`, `FeatureAccessRule`,
`StudentBenefitEntitlement`, `StudentMockTestVoucher`, `ApprovalRequest`, `ApprovalQueueItem`,
`ApprovalAction`, `IntegrationAuditLog`.

### (f) Student Journey + Student Portal — `COMPLETE` (route+model level)
`/student/{dashboard,profile,course-finder,applications,documents,messages,visa,cas,
ai-interview,shortlist,compare,sop,cv,payments,referrals}` present.
Models: `StudentNextBestAction`, `StudentMessage`, `OcrFieldExtraction`, `VisaCase`.

### (g) AI-native Student Journey OS — `PARTIAL`
Real: `src/lib/ai-gateway.ts` (`aiGateway`, `generateStructured`, `classify`, `summarize`,
`chat`, `stream`), `src/lib/model-router.ts` (`routeModel`, `requiresLocalAI`, privacy-first
routing — private tasks **hard-require** `LOCAL_AI_URL`/`LOCAL_AI_MODEL`),
`src/lib/department-model-config.ts`, `src/lib/groq-protection.ts`, `src/lib/ai.ts`
(`generateText`, `generateImage`, `generateVideo` via Z.ai).
⚠️ The gateway file itself states: *"This gateway is not yet used by every legacy AI caller."*
→ 34-agent orchestration coverage is `PARTIAL`, not `COMPLETE`.

### (h) Autonomous AI Workforce (2000 agents) — `PARTIAL`
`AiEmployee`, `AiAction`, `AiCommandAction`, `AwfApproval`, `AwfTestCase` models exist, plus a
real independent verification harness (`npm run awf:verify`, `awf:audit`, sqlite mirror in
`prisma/verification-mirror/`).
⚠️ Prior audit (A.7) found the 2,000-agent figure is **workforce bookkeeping** — `AiEmployee`
counters (`jobsProcessed`, `successRate`) are not derived from logged executions of that
specific row. Still `PARTIAL`. Measured automation rate vs the 70% target: `NOT VERIFIED`.

### (i) Employee dashboards on one reusable shell — `COMPLETE` (route level)
`/employee/{dashboard,counselor-dashboard,visa-dashboard,hr-dashboard,finance-dashboard,
marketing-dashboard,marketing-manager-dashboard}` present.

### (j) Visa Interview Officer system — `COMPLETE` (route+model level)
`VisaCase` model; `/employee/visa-dashboard` and 4 view-map aliases
(`employee-visa-officer`, `employee-visa-interview-officer`, `employee-visa-cases`) all resolve
to `VisaOfficerDashboard`. Evidence report `VISA_INTERVIEW_OFFICER_EVIDENCE_REPORT_A-N.md`.

### (k) Unified Communication & Social Command Center — `COMPLETE` (model level)
Models: `WhatsAppOfficialNumber`, `WhatsAppContact`, `WhatsAppMessageArchive`,
`WhatsAppMessageStatus`, `WhatsAppFollowUpTemplate`, `WhatsAppFollowUpSchedule`,
`WhatsAppRetryQueue`, `WhatsAppNumberAssignmentAudit`, `WhatsAppAnalyticsDaily`,
`CommunicationMessage`, `CommunicationSlaRule`, `CommunicationSlaEvent`,
`CommunicationSlaIncident`, `CommunicationSlaJustification`, `CommunicationEscalation`,
`SlaEvent`, `SlaPolicy`, `SlaJustification`, `SlaIncidentCounter`, `DashboardAlarm`,
`EscalationEvent`, `SocialInbox`, `SocialInboxMessage`, `SocialAccount`,
`SocialAccountOwnership`, `SocialConnectedAccount`, `SocialIntegration`, `SocialWebhookEvent`,
`ContactMatchReview`, `UnknownIncomingContact`, `InboundMessage`, `Broadcast`,
`BroadcastRecipient`, `AloMessage`, `UccMessage`.

### (l) Global design system + public site — `PARTIAL`
Palette in active use verified in code (`#F97316`/`#F37021` orange, `#2563EB`/`#0057B8` blue,
`#0F172A` text, 48px `h-12` buttons).
⚠️ Outstanding: production hero-stat contradiction (§2c) and the disabled-button inventory
(`BUTTON-INVENTORY.csv` referenced in code comments).

### (m) Language Preparation hub — `COMPLETE` (route level)
`/language-prep`, `/english-tests`, `/english-test-prep` present; `EnglishTest`,
`StudentMockTestVoucher` models.

### (n) Old-CRM student migration import center — `COMPLETE` (route level)
`crm-import-center` → `OldCrmImportCenterPage`; `ImportBatch` model; `csv-parse` dependency.

### (o) Production file/technology spec — `PARTIAL` / `BLOCKED`
✅ Node 22 (`.node-version`, `.nvmrc`, `scripts/assert-node22.cjs`), MySQL provider,
`standalone` output via `scripts/prepare-standalone.mjs`, runtime `sitemap.ts`,
`ecosystem.config.cjs` (PM2), `nginx.conf`, `deploy.sh`, `alo-vps-deploy.sh`.
❌ **Deployment is BLOCKED at infrastructure level** — GitHub Actions SSH deploy fails
(7/9 runs: auth/host-key rejected ~1s after a successful TCP preflight; 2/9: TCP preflight
itself fails). Fixing needs VPS shell access or repo-secret write access; this session has
neither (`gh api .../actions/secrets` → 403). Production has been running a **stale build
since ≈2026-09-18**.

---

## 3. Defects FOUND AND FIXED this session

### 3.1 Partner Marketing Studio was a disconnected fake — now real end-to-end

**What was actually wrong** (found by reading code, not labels):

1. **The real component was dead code.** `src/components/alo/views/partner-marketing-studio.tsx`
   (1,314 lines, 5 real `fetch` calls, approval/scheduling workflow) was **imported by nobody**
   — `grep -rn "partner-marketing-studio'"` returned zero importers.
2. **A fake mock was wired in instead.** `src/components/partner/PartnerMarketingStudioPage.tsx`
   (156 lines) was what `src/app/page.tsx` actually rendered for view keys
   `partner-admin-marketing-studio` and `partner-admin-content-generator`. It had **zero API
   calls**, hardcoded quota counters (`imageUsed = 6`, `videoUsed = 3`), "AI" that ignored the
   user's `idea` and `platform` and emitted a fixed template, and a disabled Submit button whose
   own title admitted *"Not yet wired"*.
3. **The route showed the wrong content.** `/partner-admin/marketing-studio` rendered
   `MasterPartnerAdminView`, which used `currentPath` **only** for nav-active styling and then
   rendered the generic dashboard body for every path.
4. **API contract mismatch (why it was never wired up).**
   | | UI expected | API actually did |
   |---|---|---|
   | GET | `{quota, usage, requests, socialAccounts}` | `{success, quota, requests}` — no `usage`, no `socialAccounts` |
   | POST | `country/university/course/cta/targetAudience/preferredStyle` | read `countryId/universityId/courseId`; ignored the other three |
   | PATCH | 6 actions | **no PATCH handler at all** → HTTP 405 |
5. **Quota reset was permanently broken.** POST created the usage row with a hardcoded
   `monthYear: '2026-08'`. The model is `@@unique([partnerId, monthYear])` — the whole design is
   a monthly roll-over, so pinning one month meant usage accumulated forever and never reset.
6. **Fabricated claims** (explicitly forbidden by every prompt): `£7,500` and `£5,000`
   scholarship amounts, `"100% free counseling"`, and hardcoded
   `University of Manchester` / `MSc Data Science` / `United Kingdom` defaults invented when the
   partner supplied nothing.
7. **Stale intake cycle.** UI defaults and API defaults said `September 2025` / `Sep 2026`; the
   spec mandates the **Jan 2027 – Jan 2028** window.

**Fixes applied** (7 files):

- `src/app/api/partner-admin/marketing/route.ts` — **rewritten**. Now implements real
  `GET` + `POST` + `PATCH`. Dynamic `currentMonthYear()`; `upsert` on
  `partnerId_monthYear` so the quota genuinely resets monthly; all six PATCH actions
  (`generate_image`, `generate_video`, `submit`, `approve`, `reject`, `schedule`, `publish`) with
  a real state machine; server-side quota enforcement; partner-scoping plus
  `requiresAloApproval`/`autoPublishAllowed` separation of duties; zod validation on both bodies;
  `IntegrationAuditLog` written on every state change; real AI copy via `generateStructured` with
  a strict JSON schema; real `generateImage`/`generateVideo`.
- **Anti-fabrication controls added.** `GUARANTEE_PATTERN` and `MONEY_PATTERN` reject any AI
  output containing an invented money figure or a guarantee; rejected output is **discarded** and
  rebuilt by `groundedTemplateCopy()`, which uses **only** partner-supplied facts. Every response
  discloses `generationMode: 'ai' | 'template'` — never presented as AI when it isn't.
- **No invented assets.** If the provider returns no URL, the route responds 502/503 and consumes
  **no quota** rather than storing a fake `assetUrl`. `publish` returns 409 because no
  partner-scoped social-account model exists — it refuses instead of recording a fabricated
  `publishedUrl`. `socialAccounts` honestly returns `[]` (`SocialAccountOwnership` is
  employee-scoped, not partner-scoped) so the UI shows its real empty state.
- `src/components/partner/MasterPartnerAdminView.tsx` — nav extracted to a shared `portalNav`;
  `/partner-admin/marketing-studio` and `/content-generator` now early-return the real studio
  inside the same portal chrome.
- `src/app/page.tsx` — both legacy view keys repointed from the mock to the real
  `PartnerMarketingStudio`.
- `src/components/partner/PartnerMarketingStudioPage.tsx` — **deleted** (fake duplicate; `git rm`;
  zero remaining references, verified by grep).
- `src/components/alo/views/partner-marketing-studio.tsx` — stale `September 2025` defaults at
  lines 427/637/798 → `January 2027`; placeholder copy updated to the Jan 2027 intake.
- `ApprovalQueueView.tsx` + `portal-section.tsx` — removed 2 dead `eslint-disable` directives,
  taking `npm run lint` to **0 errors / 0 warnings**.

**Verification performed:**
- `esbuild` parse-check on all 4 structurally-edited files → **PARSE OK** (this caught and let me
  fix a real JSX error I introduced: a `{/* comment */}` as a second root expression inside
  `const portalNav = (`, which is a syntax error).
- `npm run lint` → clean.
- `npx vitest run tests/unit` → 1199 passed; the 15 failures proven pre-existing (§1.1).
- grep confirms `£7,500` / `£5,000` / `100% free counseling` / `2026-08` are gone from all
  touched files.

**Still `NOT VERIFIED`:** live HTTP round-trip of the new route. Requires a MySQL database and a
generated Prisma client — both unavailable here (§1.2). The route is type-consistent with
verified model fields (every Prisma field used was read directly out of `schema.prisma`) but has
not been executed.

---

## 4. Standing rules carried forward (do not drop)

1. Audit before changing; never rebuild from zero; never create duplicate systems; reuse
   existing models/APIs/components.
2. No fake or hardcoded data, charts, counters, or demo dashboards in production views.
3. No UI-only security — backend must enforce auth + RBAC + ownership + visibility + validation +
   audit on every sensitive endpoint.
4. AI must not invent facts, must not bypass RBAC, must not auto-publish; high-risk actions
   require human approval.
5. No guaranteed visa/admission/scholarship claims; no fabricated testimonials or statistics.
6. Every page needs loading / empty / error / permission states.
7. Prove with FILE + ROUTE + API + DATABASE + RBAC + LIVE TEST evidence.
8. Final status must be exactly `COMPLETE` or `NOT COMPLETE` — never "almost complete" or
   "production ready" without evidence. Anything unverifiable is marked `NOT VERIFIED`.
9. Preserve the Student Dashboard and all existing working functionality.
10. Re-measure scale/health numbers; never trust figures quoted from an earlier report.

---

## 5. Known outstanding items (not yet fixed)

| # | Item | Status |
|---|---|---|
| 0 | **GitHub Actions billing failure — ALL CI dead since ≈2026-10-08T09:12Z, including on `main` (89/100 runs failed, jobs never start)** | **`BLOCKED` — owner must fix Billing & plans; highest priority, it blinds every other gate** |
| 1 | `prisma validate` / `generate` / `typecheck` / `build` | `BLOCKED` — sandbox cannot reach `binaries.prisma.sh`; CI fallback is also dead (#0) |
| 2 | 15 pre-existing unit-test failures (accounting-ledger, cms-revisions, journal-integrity, whatsapp-media-ingestion) | `OPEN` — proven pre-existing, not yet repaired |
| 3 | Production deploy via GitHub Actions SSH | `BLOCKED` — needs VPS shell or repo-secret write access |
| 4 | Production running stale build since ≈2026-09-18 | `BLOCKED` — depends on #3 |
| 5 | Static "362+ Universities" headline beside empty DB list; apex vs `www` hero-stat mismatch | `OPEN` |
| 6 | `AiEmployee` counters not derived from real per-agent executions | `OPEN` — "2000 agents" is bookkeeping |
| 7 | AI gateway not yet used by every legacy AI caller | `OPEN` |
| 8 | 38 stale `Sep 2025`-style references elsewhere in `src/` | `OPEN` — only the Marketing Studio ones were fixed |
| 9 | 3 high-severity `npm audit` findings via `prisma` CLI dev-dependency | `OPEN` — needs a breaking major bump |
| 10 | Live HTTP/E2E proof of the rewritten Marketing Studio API | `NOT VERIFIED` — needs DB + generated client |
| 11 | `alo-education-web-crm-final/` nested project copy | `NOT CLASSIFIED` — live vs archive not yet determined |
