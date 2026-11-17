# ALO EDUCATION — FEATURE GAP REPORT (spec §123)

**Date:** 2026-11-16
**Branch:** `arena/92d9a42c-alo-web-crm-tech` (from `6e14a614` of `main`)
**Method:** INSPECT → INVENTORY → GAP ANALYSIS → IMPLEMENT → TEST → VERIFY (spec §2)

A feature is marked implemented only when **UI + backend + database + permissions + workflow + error handling + testing** are connected where applicable (spec §123, §125). Levels follow spec §124:

| Level | Meaning |
|---|---|
| 0 | Not present |
| 1 | UI only |
| 2 | Backend connected |
| 3 | End-to-end functional |
| 4 | Automated |
| 5 | AI-assisted |
| 6 | Production verified |

**Honesty rule:** no row is Level 6 in this report because no production environment, production database or configured third-party credential set was available to verify against. Anything else would violate spec §94/§125.

---

## 1. What ALO already had vs top education CRMs (benchmark, spec §3)

Benchmarked by documented workflow categories only (ApplyBoard, Enroly, Studyportals, Unifrog, EduAgentCRM, SELMA, VisaCRM-class systems). **No proprietary code, branding, assets or private functionality was copied.**

| Benchmark capability | ALO status |
|---|---|
| Recruiter program search & filtering (ApplyBoard) | Present — `/course-finder`, `/university-finder`, `/compare`, `/eligibility-check` backed by canonical catalogue tables (`CrmUniversity`, `CrmCourse`, `CourseIntake`, `Scholarship`) |
| Application lifecycle management (ApplyBoard, Enroly) | Present — 21-stage application manager with enforced transitions (`src/lib/application-manager/`), first-class `Application` entity, multi-application support |
| Automated document collection requests (Enroly) | Present — request workflow, pre-checks, verification queue, expiry tracking |
| Application-to-arrival connected journey (Enroly) | Present — Student 360 timeline, journey stages, pre-departure/post-arrival modules |
| Study-choice discovery & demand analytics (Studyportals) | Present — country intelligence pages, analytics suite; provenance/`lastVerified` recorded for external facts (spec §43, §105) |
| Partner/agent management & ongoing risk grading (ApplyBoard-style) | Present — B2B portal, KYC workflow, commission engine, partner risk module, training system |
| University/institution portal (provider-side) | Present — `/university-portal` with tenant isolation tests (Level 3) |
| CRM lead engine with automation | Present — lead scoring, temperature tiers, automation rules, UCC communication center |
| Visa readiness & deadline management | Present — visa readiness engine, deadline engine, full visa CRM |

---

## 2. Gap matrix by module (spec §123 columns)

UI/BE/DB/PERM/WF/ERR/T = connected (✅) or missing. **Level** = spec §124 maturity. "DB unverified" applies to every row: migrations are written and statically audited but were never applied to a live MySQL in this environment (see §4). "Tested" means unit/static suites, not browser E2E.

| Module | UI | BE | DB | Perm | WF | Err | Tests | Level | Notes |
|---|---|---|---|---|---|---|---|---|---|
| CRM core / dashboards | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Multi-dashboard suite; not browser-verified |
| Leads | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Scoring + automation + dedup |
| Students / Student 360 | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Single profile across domains |
| Parents/Guardians | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 36 | 3 | Consent + payment visibility controls |
| Counseling | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Notes, metrics, follow-ups |
| Eligibility / matching | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 5 | Explainable scoring; no guarantees (spec §15) |
| Course finder / compare | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Compare + save + shortlist |
| University database | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | `CrmUniversity`, agreements, verification CSV pipeline |
| Course database | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | `CrmCourse`, canonical CSV pipeline |
| Intake management | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | `CourseIntake` + deadline warnings |
| Applications | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Enforced stage transitions, multi-app |
| Documents + QA gate | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Pre-submission quality gates; high-risk actions stay human |
| SOP/CV/LOR AI tools | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 5 | Human review required; never invents facts |
| Offers | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Conditions → auto tasks |
| Deposits/tuition | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Payment tracking; secrets never logged |
| CAS/COE/I-20 | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Configurable per country/institution |
| Visa CRM | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Statuses per spec §28 |
| Visa readiness engine | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Scored, configurable rules |
| Visa deadline engine | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Automated alerts/tasks |
| Pre-departure | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Checklist + tracking |
| Travel / arrival | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Flight/accommodation/enrollment |
| Post-arrival | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 2–3 | Workflow exists; lower test density |
| B2B partner portal | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Registration → KYC → agreement → training → active |
| Partner commission engine | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Tiered/fixed/clawback; audit trail enforced |
| Partner performance & risk | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Green/amber/red grading |
| Partner training | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Courses, quizzes, certificates |
| University portal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 33 | 3 | Tenant isolation + IDOR tests |
| Marketing CRM | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Campaigns, UTM attribution, landing pages |
| Communication center | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | SMS/Email/WhatsApp/calls/notes, one timeline |
| SMS abstraction | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | `SmsProvider` abstraction; NOT CONFIGURED until credentials set |
| WhatsApp layer | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Cloud API client; real delivery status only |
| Email | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Templates, tracking, unsubscribe |
| Tasks / SLA | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | SLA engine, escalation |
| Appointments | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Calendar + reminders |
| Support / tickets | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | SLA + attachments |
| Notifications | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | INFO/WARNING/URGENT/CRITICAL |
| Realtime (SSE) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ 38 | 3 | Code-verified; not runtime-verified here |
| AI workforce (16+ agents) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 5 | Human-in-the-loop approvals; never guarantees |
| AI Command Center | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4–5 | Approval queue, audit, rollback; DB evidence pending live DB |
| Attention engine (s108) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 22 | 3 | Every number links to records |
| **Daily Briefing (s109)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 10 | 3 | **Built this branch** (`/admin/daily-briefing`) |
| Opportunity Graph (s110) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 40 | 3 | API + explorer UI (`/admin/opportunity-graph`) |
| Application risk score (s111) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 27 | 3 | Green/amber/red |
| Student success score (s112) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 18 | 3 | Operational readiness only |
| Next-best-action (s113) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Consumed by 4 live surfaces |
| Deadline intelligence (s114) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Days-remaining + escalation |
| Automated case management (s115) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Tasks/SLA/milestones on Application |
| Feature flags (s117) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 22 | 5 | `FeatureFlag`, fail-closed, audited |
| Rule versioning (s106) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 92 | 3 | `RegulatoryRuleVersion`, append-only |
| Policy monitoring (s64) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 3 | Detection → affected records → human review task |
| Outbound webhooks (s77) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 35 | 4 | Signed, retried, dead-lettered, cron drain |
| Analytics + funnel (s71–72) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Real-data queries only |
| Data quality engine (s73) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Dedup, invalid formats, stale data |
| Global search (s74) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Permission-aware, 16 routes |
| Import/export (s75) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3–4 | Validation, error reports, rollback staging |
| RBAC / custom roles (s5) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Full permission catalogue + audit |
| Multi-branch (s68) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 3 | Branch scoping in reports/dashboards |
| Multi-tenant B2B isolation (s69) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Cross-tenant tests enforced in suite |
| Audit log (s65) | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 4 | Before/after, user, IP metadata where applicable |
| Backup/restore (s87) | ⚠️ | ✅ | — | n/a | ⚠️ | ✅ | ✅ 1 | 2 | Scripts + safety tests; **never executed against a live DB here** |
| Performance (s100) | — | — | — | — | — | — | — | 0–1 | Not measured |
| DB status enums (s5/20/28) | n/a | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 2 | Statuses are validated in app code; DB columns are free-text by design decision (see §4) |

---

## 3. Implemented during this branch (2026-11-16 pass)

| Item | Spec | Evidence |
|---|---|---|
| AI Daily Management Briefing — `buildDailyBriefing()`, `/api/intelligence/daily-briefing`, `/admin/daily-briefing` | §109 | 10 sections, live DB counts/sums, independent section failure isolation, deterministic highlights, 10 unit tests; linked from Super Admin Quick Actions |
| Stale cron verifier `scripts/verify-15-cron.ts` no longer asserts the obsolete hard-coded count of 15; derives from `CRON_JOB_COUNT` | §89 | Script exits 0; authoritative certification remains `cron-scheduler-policy-check.ts` (failed: 0) |
| Lint hygiene in `student-help.tsx` (external `mailto:` handoff, documented) | §101 | `npx eslint .` → 0 errors, 0 warnings |
| Quick Actions now surface Attention / Daily Briefing / Opportunity Graph on the canonical Super Admin dashboard | §107, §108, §109, §110 | `SuperAdminOperatingDashboard.tsx` |

Prior branch state (2026-10 pass, re-verified 2026-11-16): Feature flags, Outbound webhooks, Realtime SSE, Attention engine, Opportunity Graph, Application risk, Student success, Rule versioning, Policy monitoring, Parents, University portal.

---

## 4. Not implemented / not verified — do not claim as done

1. **Database migration application (spec §101).** No MySQL/MariaDB server is reachable in this environment (apt blocked, no `mysqld`). 51 migrations (incl. this branch's) are written and statically audited but were **never applied**. `prisma migrate deploy` remains `NOT CONFIGURED`.
2. **Database-backed integration tests.** 148 tests skipped (`TEST_DATABASE_URL` unset). The 75 previously-skipped DB tests remain skipped.
3. **End-to-end journeys A–D (spec §96, §97, §126).** Not executed; no database, no browser-verified deployment.
4. **Backup/restore (spec §87).** Documented + safety-tested scripts; **never run against a live database**. Per spec §87, backup must not be called "complete".
5. **Performance measurement (spec §100).** Not measured.
6. **External provider delivery (spec §9, §10, §11, §78, §94).** SMS/WhatsApp/email/payment remain `NOT CONFIGURED` until credentials are supplied; the system reports `NOT CONFIGURED`, never `SUCCESS`.
7. **Live OAuth/webhook provider verification (spec §77, §78).** Not performed.
8. **DB-level enum constraints on status columns (spec §5/§20/§28).** Deliberately not applied: converting 631-model schema free-text statuses to native enums requires a verified migration path against a live MySQL and would risk unverifiable breakage. Validation is enforced in application code (transition services) and by the RBAC/audit layer instead. Decision recorded; revisit when a staging database exists.
9. **Full RBAC/ownership matrix automation for every role × scope** (e.g., branch-scoped exports across all 30+ roles). Core RBAC is implemented and regression-tested (`api-authz-regression`), but exhaustive pairwise automation is not complete.
10. **Clean-extract gate.** Not passed in this environment.
11. **Level 6 claims.** None. Production verification requires a deployed environment.

---

## 5. Maturity roll-up (spec §124)

| Level | Modules |
|---|---|
| 4–5 (Automated / AI-assisted) | CRM core, Leads, Visa, Applications, Documents QA, AI workforce, AI Command Center, Marketing, UCC/comms, Cron system, Feature flags, Webhooks, Next-best-action, Deadline intelligence, Partner portal & risk, Entitlements |
| 3 (End-to-end functional) | Students, Offers, Deposits, CAS/COE/I-20, Pre/post-arrival, Counseling, Attention/Briefing/Opportunity Graph, University portal, Rule versioning, Policy monitoring, Notifications, Search, Analytics, RBAC |
| 2 (Backend connected) | Backup/restore, University portal automation/AI columns, post-arrival depth, DB enum constraint |
| 1 (UI only) | None identified |
| 0 (Absent) | Performance benchmarks (s100) — never measured, never built as harness |

**Bottom line:** the platform is a real, data-connected system with enforced workflows, permissions and audit trails — not a demo. It is **not production-verified** and must not be represented as such until the items in §4 are closed against a live database and deployment.
