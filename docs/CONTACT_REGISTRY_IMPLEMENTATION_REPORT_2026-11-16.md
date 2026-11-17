# ALO CRM — Central Contact Registry, Live Identification, Google Contacts & WhatsApp — factual implementation report

Date: 2026-11-16 · Branch: `arena/92d9a42c-alo-web-crm-tech` (from `6e14a614` of main) · Status vocabulary per the spec: **Completed and tested · Implemented but not tested · Waiting for credentials · Waiting for external verification · Waiting for approval · Not implemented · Failed**

**Honesty contract.** Every claim below is either backed by a command output recorded in this repository's session, by a test in `tests/unit|integration`, or is marked NOT VERIFIED. No screen in this build proves a Google or Meta integration works before a human supplies credentials. No Student ID is ever allocated from a Google row, an import file, or an inbound message without an identity-verified workflow. The central registry was decided to be the existing `WhatsAppContact` table — no parallel contact store was created.

## What changed in this pass

**New (additive only):**

1. `ContactPhone` model + `prisma/migrations/20261117000000_contact_phones_merge_history/migration.sql` — secondary/alternative numbers per registry contact (personal, business, WhatsApp, family, emergency), each separately searchable; shared numbers reported, never auto-merged.
2. `ContactMergeHistory` model (same migration) — one queryable, auditable row per merged pair, written inside the merge transaction.
3. `GET/POST /api/crm/contacts/{id}/phones` and `PATCH/DELETE /api/crm/contacts/{id}/phones/{phoneId}` — scoped, permissioned (`contacts.view` / `contacts.manage`), audited, same-origin-checked write paths.
4. Phone numbers panel on `/crm/contacts/[id]` (add/set-primary/set-WhatsApp/remove; live data; explains sharing semantics).
5. `/admin/google-contacts` — Google Contacts console: configured/reachable/last-sync shown separately, live People API probe button, dry-run/apply with explicit human confirmation, last-run batch report, actionable next steps.
6. `/admin/integration-health` — live per-integration verdicts for the registry, Google Contacts and the WhatsApp number pool; never claims healthy without a real check; every section links to its console.
7. "Family & guardians" tab on the canonical CRM Student 360 (`/crm/students/[id]`, `/counselor/students/[id]`) — lists ParentGuardian rows (relationship, phone/WhatsApp/email, access level, portal flag, communication consent state, primary/sponsor flags) and adds new members through the existing audited `/api/parents` staff endpoint. One parent may be linked to many students; each student keeps their own rows; a parent number is never copied to the student's personal fields.
8. Identification now also resolves numbers held in `ContactPhone` (additive OR fragment; a secondary match opens the owning primary contact — never a second identity).
9. Student ID format aligned to the owner-specified `AE-<YEAR>000001` shape (6-digit sequence) for **new** IDs; existing 4/5-digit IDs untouched and still accepted by the match policy (`/^AE-\d{4}\d{4,6}$/`). Allocator, canonical-student commentary and tests updated.
10. `.env.example` now ships the owner-requested configuration baseline `ALO_MAIN_WHATSAPP_NUMBER=01805020100`, `ALO_COO_WHATSAPP_NUMBER=01805020101`, `ALO_EMPLOYEE_WHATSAPP_NUMBERS=01805020102…01805020119` — as configuration, not verification.
11. Docs: `docs/GOOGLE_CONTACTS_AND_CONTACT_REGISTRY.md` (operator guide, sync runbook, honest limits) and updated `docs/WHATSAPP_NUMBER_REGISTRY.md`.
12. Tests: `tests/unit/contact-phones-route.test.ts` (11), `tests/unit/google-contacts-sync-route.test.ts` (7 — failure/recovery/bookkeeping), `tests/unit/migration-safety.test.ts` (4 — no data-destroying migration without reviewed reason; the registry migration is proven additive-only). Merge route now writes `ContactMergeHistory` in-transaction (suite updated and passing).
13. Hub nav (`/crm/contacts*`) now links Company Numbers, Google Contacts and Integration Health.

**Nothing was deleted.** No existing model, route, page, test or document was removed.

## 1–16 factual findings

| # | Topic (spec) | Status | Evidence / notes |
| --- | --- | --- | --- |
| 1 | Registry reuse decision (§2) | **Completed and tested** | `WhatsAppContact` remains the single registry; `src/lib/contacts/registry.ts` decision layer; `ContactPhone` additive (633 models). |
| 2 | All-people-categories registry (§1, §3) | **Implemented** | 13 categories + lifecycles in `src/lib/contacts/registry.ts`; list/search/detail + category filter at `/crm/contacts`; scoped server-side. Live counts NOT VERIFIED (no DB). |
| 3 | Unique Contact ID + multiple numbers (§3, §10) | **Completed and tested** | New `ContactPhone` + API + UI; identification variant lookup wired; 11 new route tests pass; secondary match never forks identity. |
| 4 | Student ID allocation (§4) | **Completed and tested** | Format `AE-YYYYNNNNNN` for new IDs; atomic per-year allocator; concurrent-allocation and rollback tests pass; legacy IDs preserved/accepted (`match-policy` 4–6 digits); never rewritten by any migration (guard test). |
| 5 | Live identification on inbound WhatsApp (§5) | **Implemented but not end-to-end tested** | `identifyByPhone` (phone-mandatory, never name-only; guardian/b2B/lead variants; scope + audit), identify UI at `/crm/contacts/identify`, webhook journey tests pass. Live webhook → screen flow NOT VERIFIED (no DB, no Meta credentials). |
| 6 | Relationships: parent↔students, agent↔agency, rep↔institution, employee↔company number (§6) | **Implemented** | `ParentGuardian` (+ consents, responsibilities, access levels) with `/api/parents` staff API and new Student-360 Family tab; agency/institution links via registry `partnerId`/category model; employee↔number via `WhatsAppNumberAssignmentAudit` + `/admin/whatsapp-numbers`. UI for agent→agency and rep→institution browsing beyond the registry is partial (see #14). |
| 7 | Google Contacts import via People API (§7) | **Implemented but not tested live / Waiting for credentials** | `src/lib/google/contacts.ts` (pure planner + thin HTTP), `/api/google/contacts/{status,sync}` (dry-run default, apply-gated, idempotent by resource name, CRM-authoritative, opt-out respected, conflicts→review queue), `/admin/google-contacts` console, audit + `ImportBatch(GOOGLE_CONTACTS)` ledger. 24 unit tests pass. Real import: **WAITING FOR CREDENTIALS** (human OAuth consent as alo.allcontacts@gmail.com) — sync model is manual/triggered pull, never advertised as real-time. |
| 8 | WhatsApp Cloud API integration (§8) | **Implemented but not tested live / Waiting for external verification** | `src/lib/whatsapp-cloud-api.ts` + `/api/whatsapp/webhook` (HMAC-verified status callbacks; production refuses unsigned) + inbox UI + signature tests pass. Number **01805020100** is a configured registry record only — ownership/WABA/registration NOT verified; no send possible until Meta credentials + provider check succeed. Inbound flow (identify → open conversation → save → assign → update lastContactAt): code exists, journey-tested with fakes; live E2E NOT VERIFIED. |
| 9 | Company number registry 01805020100/101/102–119 (§9) | **Implemented (config records) / Waiting for external verification** | Exact 20 requested records seeded idempotently as `disconnected` with zero Meta identifiers (`database/seed_alo_whatsapp_numbers.sql`, `scripts/seed-alo-whatsapp-numbers.mjs`, 2 test files); admin UI at `/admin/whatsapp-numbers` (preview/seed/verify_connection actions; super-admin-gated; 24h verification TTL; nothing claimed connected without a provider check); full assignment history via `WhatsAppNumberAssignmentAudit`. **The UI never shows 01805020100 as live until a provider check passes — today it must show unverified.** Admin UI for per-number build/activation/verification notes beyond seed+assign is partial. |
| 10 | Duplicate detection & merge (§10) | **Completed and tested** | Normalised-phone exact + possible-match suggestions, BD normalization, `ContactMatchReview` queue, manual confirmation-based merge with TOCTOU token, reversible via alias tags + `restore`, math seams unit-tested; new `ContactMergeHistory` gives queryable history; `contact-merge.test.ts`, `contact-security.test.ts` pass. |
| 11 | Global search (§11) | **Implemented** | Phone/student-ID/employee/agent/category search on `/crm/contacts` + `/api/crm/contacts?search=`; scoped; `contact-hub-api.test.ts` passes. |
| 12 | Automatic creation for unknown contacts (§12) | **Implemented but not live tested** | Unknown numbers become unverified leads/contacts via the webhook path (never a registered student, never a Student ID). `whatsapp-student-journey.test.ts` (13 tests) passes. |
| 13 | Lifecycle stages lead→enrolled, no duplicate profiles (§13) | **Implemented** | `CONTACT_LIFECYCLES` + `CONTACT_CATEGORIES`; lead→student keeps one registry row; Student creation only via registration workflow; merge path proven to preserve identity links. |
| 14 | Communication timeline + follow-ups + RBAC + dashboard + audit (§15–§18, §22) | **Implemented** | Timeline: `WhatsAppMessageArchive` + `/crm/communications/*` + contact detail history. Follow-ups: Day 3/7/14/21/25/30 templates/schedules + `/admin/whatsapp-followup`. RBAC: `contacts.view/manage/merge_review/consent.view/consent.manage/audit.view/export`, branch/assignment/partner scoping, `super_admin` override; `whatsapp.numbers.view/assign/api_config` for the pool. Dashboard: 16 metrics at `/crm/contacts/dashboard` (unavailable metrics render as unavailable, never 0). Audit: `portalAuditLog` on every contact mutation incl. phone add/remove/merge. |
| 15 | Migration/import safety (§19, §25) | **Completed (static guarantees) / Waiting for approval** | No production DB was touched — **no migration has been applied**; `migration-safety.test.ts` proves all migrations add only new tables or contain only reviewed comments/index changes; Student IDs are never rewritten; backups: `mysql-backup-safety.test.ts` proves the backup script refuses missing config/failures and never leaks credentials. Restorability **NOT VERIFIED** (no DB). Production migration: **WAITING FOR APPROVAL**. |
| 16 | Build/quality gates & report (§24–§27) | **Vitest re-verified 2026-11-16; `tsc`/build NOT VERIFIED this session** | `vitest`: 3,939 passed · 148 skipped · **0 failed** (370 files) — re-ran and confirmed green on 2026-11-16 (after `npm ci` + vendored Prisma engines). `tsc --noEmit`: **could not be completed** (Exit 137 — sandbox RAM ≈ 3.9 GB, no swap); prior full-build claims below are retained as historical record, not as current verification. `eslint` on changed files: 0 errors. |

## Appendix A — §23 UI sections: where each lives

| # | Spec section | Status | Home |
| --- | --- | --- | --- |
| 1 | Contact Dashboard | **Implemented** | `/crm/contacts/dashboard` (live metrics, scoped) |
| 2 | All Contacts | **Implemented** | `/crm/contacts` (search/filter/export) |
| 3 | Students | **Implemented** | All Contacts, category `STUDENT`; Student 360 `/crm/students/[id]` |
| 4 | Prospective Students | **Implemented** | All Contacts, category `PROSPECTIVE_STUDENT`; `/crm/leads` |
| 5 | Parents/Guardians | **Implemented (UI this pass)** | Student-360 **Family** tab + All Contacts category `PARENT_GUARDIAN_SPONSOR` + `/admin/parents`; API `/api/parents` |
| 6 | Employees | **Implemented** | All Contacts category `EMPLOYEE_MANAGER`/`BRANCH_DEPARTMENT`; `/admin/employees`, `/crm/hrm` |
| 7 | Agents/Partners | **Implemented** | All Contacts category `UNIVERSITY_PARTNER_AGENT`/`B2B_PROVIDER_SUB_AGENT`; `/partner/*` records linked by registry `partnerId` |
| 8 | Company Phone Numbers | **Implemented** | `/admin/whatsapp-numbers` (registry, seed, verify, reconcile) + hub link |
| 9 | WhatsApp CRM | **Implemented** | `/crm/whatsapp`, `/crm/communications/*`, `/crm/contacts/[id]` message history; webhook-verified; send path untestable without Meta credentials |
| 10 | Google Contacts Integration | **Implemented (UI this pass)** | `/admin/google-contacts` |
| 11 | Duplicate Management | **Implemented** | `/crm/contacts/duplicates` |
| 12 | Communication History | **Implemented** | `/crm/contacts/[id]` (per-contact archive), `/crm/communications/inbox|call-logs`, `/crm/contacts/audit` |
| 13 | Follow-Up Manager | **Implemented** | `/admin/whatsapp-followup` (templates Day 3/7/14/21/25/30, schedules) |
| 14 | Contact Import | **Implemented** | `/crm/contacts/import` + `/admin/import-center`; Google import via #10 |
| 15 | Integration Health | **Implemented (this pass)** | `/admin/integration-health` (+ link from hub) |
| 16 | Audit Logs | **Implemented** | `/crm/contacts/audit` (scoped) + `/admin/audit-logs` |
| 17 | Contact Settings | **Implemented (partial)** | `/crm/communications/settings` (channel/provider states), hub consent/segments views; no dedicated contact-settings page beyond these |

## Appendix B — Gate results (this pass; updated 2026-11-16 audit)

- `vitest run` — **3,939 passed / 148 skipped / 0 failed** (vs 3,917/148/0 before this pass; +22 new tests, zero regressions). **Re-run and confirmed identical on 2026-11-16** (357/370 test files run, 13 skipped, ~98 s).
- `eslint` on all changed/new files — **0 errors**.
- `tsc --noEmit` — historical claim: required 6,144 MB heap. **On 2026-11-16 this could not be re-run in the audit environment** (machine RAM ≈ 3.9 GB; process killed, Exit 137). Treat type checking of this tree as **NOT VERIFIED in the current session**.
- `npm run build` — historical claim (pre-snapshot state, not reproducible from this workspace): PASS (webpack compile 3.2 min, `BUILD_ID=ctiLjopBfnm3YYuQswLZU`, standalone `server.js` verified; route table included `/admin/google-contacts` and `/admin/integration-health`). **NOT re-verified on 2026-11-16.**
- `prisma validate` / `db:verify-client` — schema valid (review prior pass; client generated again 2026-11-16).
- 2026-11-16 cross-audit update: the full functional audit with matching evidence levels is in `docs/FINAL_FUNCTIONAL_AUDIT_2026-11-16.md`.
- No secrets added; `.env.example` placeholders only. Honest gaps: (a) live-credential paths untestable here; (b) prod DB unavailable (P1001); (c) §23 UI checklist — see Appendix A; (d) Student ID format decision recorded in `docs/GOOGLE_CONTACTS_AND_CONTACT_REGISTRY.md`.

## Appendix C — Waiting for / required before production

1. **Waiting for credentials:** Google OAuth consent as `alo.allcontacts@gmail.com` (People API, `contacts.readonly`); Meta Cloud API token + `phone_number_id`/WABA for the number set.
2. **Waiting for external verification:** ownership + WABA registration + webhook subscription + template approval for 01805020100 (and 017/018/019 pool); People API live probe verdict PASS.
3. **Approved 2026-11-16 by the administrator (with a verified production backup as precondition):** production migration `20261117000000_contact_phones_merge_history`. **Still NOT APPLIED** — no production DB is reachable from the working environment; see the production runbook in `docs/FINAL_FUNCTIONAL_AUDIT_2026-11-16.md` §10. Any enablement of a scheduled Google pull (none exists by default) remains open; push of any of this work to `main` (branch + PR only per §25) remains unauthorized.
4. **NOT VERIFIED anywhere in this environment:** live identification latency, live webhook delivery, backup restoration, sibling-portal access journeys, and Prometheus/log-based availability monitoring.
5. Known partials: agent→agency and rep→institution browsing UIs beyond the registry; Contact Settings is a composition of existing consoles; Google sync is pull-only.

*Report generated as part of the same branch; files listed in Appendix A/B are the deliverable.*
