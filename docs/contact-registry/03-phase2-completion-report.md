# Phase 2 completion report — contact registry, merge, dashboard, phone pool

Branch `arena/780bb927-alo-web-crm-tech` · 2026-11-15 · extends PR #60

Statuses used exactly as requested: **PASS**, **PARTIAL**, **MISSING**, **BLOCKED**,
**NOT REQUIRED**.

Phase 1 (already in this PR) built the Google Contacts integration and live student
identification. Phase 2 was asked to finish and verify. This report answers each of the
19 requested items with what was actually observed, and separates what could be moved
forward here from what physically cannot be done without credentials or a database.

**The honest headline:** two of the nine tasks (real database verification, real Google
connection) are **BLOCKED** by the environment — no `DATABASE_URL`, no Google OAuth
token, no network route to `people.googleapis.com`. Everything that could be done
without them was done, tested, and is listed below with its evidence. Nothing was
merged, deployed, migrated, or forced to green.

---

## 1. Original implementation preserved — PASS

Phase 1 files are untouched in behaviour; the only edits to them are additive:

| File | Change in Phase 2 | Risk |
| --- | --- | --- |
| `src/lib/google/contacts.ts` | `ExistingRegistryRow.tags` added; the planner now also matches `google_alias:` tags | prevents a re-created contact after a merge; existing tests still pass |
| `src/app/api/google/contacts/sync/route.ts` | selects `tags` and parses them | one extra column in an existing select |
| `src/lib/whatsapp-number-pool.ts` | pure helpers **moved** to `whatsapp-number-pool-plan.ts` and re-exported | identical public API; all 18 pre-existing pool tests pass |
| `src/components/contacts/contact-hub-view.tsx` | new `Dashboard` tab | additive |
| `src/lib/permissions.ts` | one new permission `contacts.merge_execute` + `"execute"` action | additive |
| `src/app/api/whatsapp/numbers/route.ts` | `reconciliation` in GET, `preview_seed` action in POST | additive |

No existing feature, route, model, webhook handler or identity system was duplicated or
removed. `git diff --stat` is in §12.

## 2. Real Google OAuth connection evidence — BLOCKED

Not obtained. There is no Google credential in this environment and outbound access is
limited to GitHub/npm/PyPI; `people.googleapis.com` and `oauth2.googleapis.com` are
unreachable.

* What exists: a complete, unit-tested OAuth path (`resolveUserScopedCredential`,
  `GOOGLE_CONTACTS_REFRESH_TOKEN` precedence, token cache keyed by scope + credential
  fingerprint), and a service-account refusal that is itself tested.
* What is needed: `docs/contact-registry/02-google-contacts-setup.md` steps 1–4.
* How it will be proven: `node scripts/verify-contact-registry.mjs` (new) performs the
  refresh-token exchange, inspects `tokeninfo` for the contacts scope, and prints
  PASS/FAIL. Its current output here is `[BLOCKED] Google credential — missing
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CONTACTS_REFRESH_TOKEN`.

## 3. Real People API response evidence — BLOCKED

Same cause. The script's third step performs a real
`GET people/me/connections?personFields=names&pageSize=1` and records the HTTP status,
the number of contacts returned and whether page/sync tokens came back. No such response
has been seen yet, so **no claim is made** that the integration works against Google.
It is unit-tested; it is not verified.

## 4. Database verification evidence — BLOCKED (with a runnable instrument)

No `DATABASE_URL` is available, and even with one, `prisma generate` cannot run here
(`binaries.prisma.sh` is unreachable; the checked-in client is a placeholder — see §11).

`scripts/verify-contact-registry.mjs` was written to do exactly this, read-only:

* connect and `SELECT 1`;
* confirm the 13 tables this module depends on exist (`WhatsAppContact`,
  `ContactMatchReview`, `ImportBatch`, `ImportError`, `AuditLog`, `PortalAuditLog`,
  `SocialIntegration`, `WhatsAppOfficialNumber`, `WhatsAppNumberAssignmentAudit`,
  `CommunicationConsent`, `WhatsAppFollowUpSchedule`, `WhatsAppMessageArchive`,
  `UccConversation`);
* confirm the columns the new code reads/writes exist;
* print the last three applied migrations (`_prisma_migrations`);
* print a **record-count baseline** (`contacts`, student-linked, aliases, reviews,
  import batches, audit rows) so "no records lost or overwritten" is a diff, not an
  assertion;
* inspect the number pool and report how many numbers are verified within 24h vs blocked.

It writes nothing. Intended use: run against staging, attach the output to the PR.
Its current local output is `[BLOCKED] Database connection — DATABASE_URL is not set`.

**Merge correctness against a real database is therefore untested.** The transactional
guards are unit-tested at the route level (§9) but the SQL has never executed.

## 5. Official phone pool status — PARTIAL

What is verified:

* `database/seed_alo_whatsapp_numbers.sql` contains the 20 records `01805020100`–
  `01805020119`, unique, every row `connectionStatus = 'disconnected'`; the existing
  suite `tests/unit/alo-whatsapp-number-seed.test.ts` (7 tests) passes.
* `scripts/seed-alo-whatsapp-numbers.mjs` is the runner.
* Runtime configuration is separate and env-driven (`ALO_MAIN_WHATSAPP_NUMBER`,
  `ALO_COO_WHATSAPP_NUMBER`, `ALO_EMPLOYEE_WHATSAPP_NUMBERS`) — the numbers are **not**
  hardcoded in application source.
* New in Phase 2: `planPoolSeed()` (validation, de-duplication, "never overwrite an
  existing assignment") and `reconcilePool()` (configured vs registered vs **verified**),
  with 15 new tests. `GET /api/whatsapp/numbers` now returns `reconciliation`, and
  `POST {"action":"preview_seed"}` returns the plan without writing.
* Ownership/approval is **not** verified: no Meta credential exists, so every number
  remains blocked for live sending and the reconciliation reports them as unverified.

What is missing: applying the seed to a database and completing Meta verification
(BLOCKED, same root cause as §4/§2).

Note on "integrate with the `AE-YYYY000001` allocator": there is no integration point.
Student IDs are allocated by `src/lib/identity/student-id.ts` inside the registration
approval transaction; the number pool allocates no identifiers and must never mint a
Student ID. Nothing was changed there, deliberately.

## 6. Contact merge implementation — PASS (policy + route), UNTESTED against a database

New: `POST /api/crm/contacts/merge` with `preview` / `execute` / `restore`.

* **Explicit authorisation** — execution requires the new `contacts.merge_execute`
  permission, separate from `contacts.merge_review`; preview requires the review grant.
* **Scope** — both rows must be inside `contactScopeWhere(auth)`; otherwise 404 with the
  missing ids.
* **Preview before merge** — returns the field-by-field resolution, blockers, warnings,
  the numbers and Google resource names that will be preserved, and per-number counts of
  attached conversations/messages/consents/follow-ups.
* **Confirmation** — a 32-character token derived from the ids and both rows'
  `updatedAt`; `execute` recomputes it inside the transaction and refuses with
  `STALE_PREVIEW` if anything changed. A written reason of ≥10 characters is required.
* **Transactional** — every write is guarded by the `updatedAt` the plan was built from
  (`updateMany` with a timestamp predicate); a row modified mid-flight aborts the whole
  transaction with nothing written.
* **Nothing deleted** — the source rows are kept as aliases (`merged_into:<destId>` tag)
  so numbers stay searchable and conversations keep their numbers. See the design note
  in `src/lib/contacts/merge.ts`.
* **History/identity preserved** — conversations, messages, consents, guardians and
  applications are keyed by number or `studentId` and are never moved; conflicting
  `studentId`/`leadId`/`partnerId` values are a hard refusal, not a warning.
* **Google resource names preserved** — one column, so extras become `google_alias:`
  tags, and the Google sync planner now matches them (tested: the next sync does not
  re-create a merged contact).
* **Audit** — full before/after snapshot in `PortalAuditLog` (`CONTACT_MERGED`) plus one
  `ContactMatchReview` decision row (`status: MERGED`) per merged pair.
* **Recovery** — `mode: "restore"` replays the snapshot, and refuses (`STATE_CHANGED`) if
  either contact has been edited since the merge.

Evidence: 24 unit tests on the policy (`tests/unit/contact-merge.test.ts`) and 8
route-level tests (`tests/unit/contact-security.test.ts`) covering 403 for a reviewer,
404 for out-of-scope, refusal for two different students, refusal of a short reason,
`STALE_PREVIEW`, and a successful execution asserting two guarded updates + audit +
review row.

**Not implemented:** a merge UI. The endpoint is complete and documented; the Contact Hub
has no merge screen yet, so the flow is currently API-only (preview → confirm).

## 7. Contact registry decision (`contact_phones`) — NOT REQUIRED

Full analysis in `docs/contact-registry/04-contact-phones-decision.md`. Summary: each
number is a registry row; secondary numbers already live in `Lead.altPhone`,
`ParentGuardian.phone/whatsapp`, and confirmed merges keep absorbed numbers as aliases.
A child table would touch the webhook, imports, matching, sending, consent and 5 of the
16 metrics, and needs a backfill that cannot be verified here. Trigger conditions for
revisiting it are written down, along with the expand/migrate/contract shape it must
take. Nothing was added, so nothing has to be rolled back.

## 8. Sixteen dashboard metrics — PASS (definitions + API + UI), UNTESTED against data

Definitions live in one place (`src/lib/contacts/dashboard-metrics.ts`) and are published
in the API response, so any number can be checked without reading code.

| # | Metric | Calculation | Source | Range | Branch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Contacts (person records) | rows not tagged `merged_into:` | WhatsAppContact | current | yes | PASS (unit) |
| 2 | New contacts in range | `createdAt` within range | WhatsAppContact | **yes** | yes | PASS (unit) |
| 3 | Linked to a student | `studentId != ''` | WhatsAppContact | current | yes | PASS (unit) |
| 4 | Lead only | `leadId != ''` and `studentId = ''` | WhatsAppContact | current | yes | PASS (unit) |
| 5 | Unlinked contacts | no student/lead/partner id | WhatsAppContact | current | yes | PASS (unit) |
| 6 | Opted out | `isOptedOut` | WhatsAppContact | current | yes | PASS (unit) |
| 7 | Blocked | `isBlocked` | WhatsAppContact | current | yes | PASS (unit) |
| 8 | Merged aliases | rows tagged `merged_into:` | WhatsAppContact | current | yes | PASS (unit) |
| 9 | Possible duplicate groups | groups sharing an exact normalised phone/email (sample ≤1000, stated) | WhatsAppContact + `buildDuplicateReviewGroups` | current | yes | PASS (unit) |
| 10 | Match reviews pending | `status = PENDING`, filtered to visible numbers | ContactMatchReview | current | yes | PASS (unit) |
| 11 | Inbound messages | `direction = inbound` in range | WhatsAppMessageArchive | **yes** | no | PASS (unit) |
| 12 | Outbound messages | `direction = outbound` in range | WhatsAppMessageArchive | **yes** | no | PASS (unit) |
| 13 | Conversations active | `lastMessageAt` in range | UccConversation | **yes** | no | PASS (unit) |
| 14 | Follow-ups scheduled | `status = scheduled`, not paused | WhatsAppFollowUpSchedule | current | no | PASS (unit) |
| 15 | Follow-ups overdue | `scheduledAt < now`, still scheduled | WhatsAppFollowUpSchedule | current | no | PASS (unit) |
| 16 | Student link coverage | #3 ÷ #1 × 100, 1 dp; null at zero | derived | current | yes | PASS (unit) |

Rules the implementation enforces, each tested: a failed query yields `null` +
`UNAVAILABLE` + reason (never 0); every metric appears even if a query was skipped;
coverage is `null` at zero contacts; reversed date ranges are rejected, >366 days is
clamped and the clamp is stated; a branch parameter cannot widen a non-company-wide
caller's visibility; sampling is disclosed in the caveats. UI: `/crm/contacts/dashboard`
(loading, empty, error and "unavailable" states, definitions toggle).

**Not verified against real data** — no database. Query shapes were reviewed against the
schema but not executed.

## 9. Security verification — PASS (18 route-level tests)

`tests/unit/contact-security.test.ts` (all passing):

| Check | Result |
| --- | --- |
| Portal (student) session refused **before any database read** | PASS — 403 `STAFF_ONLY`, zero queries recorded |
| Partner portal session refused the same way | PASS |
| Name-only identification rejected | PASS — 400 `NAME_ONLY_NOT_ALLOWED`, zero queries |
| POST without a phone rejected | PASS |
| Role with no contact scope rejected | PASS — 403 `SCOPE_NONE` |
| Branch/assignment isolation | PASS — another counsellor's record returns `restricted: true`, no name/Student ID |
| Company-wide role sees the card | PASS |
| Guardian-number protection | PASS (policy tests: `GUARDIAN_NUMBER` state, never presented as the student's number) |
| Multiple-match confirmation | PASS (policy tests) |
| Unknown-number behaviour | PASS (policy tests: nothing created, allowed actions only) |
| Audit written on lookup, number masked | PASS |
| Audit failure reported, not swallowed | PASS — `audit.recorded: false` |
| Merge requires an explicit grant | PASS — 403 for a reviewer without `contacts.merge_execute` |
| Stale preview cannot be applied | PASS — 409 `STALE_PREVIEW`, no writes |
| Rate limiting | PASS (both new routes and identification use the `admin_settings` limiter; behaviour is the repository's existing limiter) |
| OAuth token protection | PASS (unit test: configuration description contains no token/secret) |
| Secret leakage in responses | PASS — status/sync/merge responses contain no credential; audit stores last 4 digits only |

Not tested here: TLS termination, WAF/rate limits at the edge, and anything requiring a
running server.

## 10. Complete test results — PASS (no regressions)

| Command | Result |
| --- | --- |
| `npx vitest run tests/unit` (whole suite) | **352 files · 3820 tests · 3793 passed · 27 failed** |
| failing files | **13 — the identical set that fails at pristine baseline** (accounting-ledger, ai-security-remediation, application-risk-score, business-hours-policy, cms-revisions, critical-safety-remediation, design-tokens, journal-integrity, migration-order, phd/auth-access, phd/storage-security, student-success-score, visual-system-redesign) |
| new Phase 2 tests | **78** — merge 24, dashboard 21, phone pool 15, security 18 |
| Phase 1 tests | 27 (unchanged) |
| `npx eslint` on every touched file | **0 problems** |
| `npm run audit:env -- --check` | **PASS** after regenerating `docs/environment-classification.json` (CI caught this; it was stale for the whole branch) |
| `node scripts/verify-contact-registry.mjs` | runs; correctly reports `BLOCKED` for database and Google |
| `npm run build` / `npm run typecheck` / `prisma validate` | **BLOCKED locally** — `prisma generate` cannot run (`binaries.prisma.sh` unreachable). CI runs these with a real client; see §15. |

## 11. TypeScript baseline comparison — PASS (no new errors), with the root cause identified

`NODE_OPTIONS="--max-old-space-size=7000" npx tsc --noEmit` → **104 errors, the same
count as before Phase 2, none in a touched file.**

Investigation of the 104 (asked for explicitly):

| Code | Count | Meaning |
| --- | --- | --- |
| TS2339 | 50 | property does not exist on `{}` — a `db.*` result typed as `{}` |
| TS2694 | 23 | `Prisma` namespace has no exported member — generated types absent |
| TS2322 / TS2345 / TS2347 | 19 | `{}` passed where a concrete row type is expected |
| TS2365 / TS2362 / TS18048 / TS18046 | 10 | arithmetic/comparison on `{}` / possibly-undefined |
| TS2559 / TS2305 | 2 | misc, same source |

Root cause, proven rather than assumed: `node_modules/.prisma/client/index.d.ts` is a
3.9 KB **placeholder** (`export declare const PrismaClient: any`), so every model result
degrades to `{}`. The repository's own guard says it best —
`node scripts/verify-prisma-client.mjs` → *"Prisma model metadata is missing … A
placeholder client is not type safety."*

Consequence, stated plainly: this environment cannot typecheck Prisma code at all. The
errors are **environmental** (top-12 files: ai-workforce/telemetry 13, accounting/ledger
11, rules/active 8, super-admin/agent-network 6…), **pre-existing**, and **not suppressed**
— no `@ts-expect-error`, no config loosening, no `any` casts added to hide them. New code
uses `as unknown as` only where rows are read from the stub client, with the row type
declared explicitly next to the `select`.

CI is the real check: on the previous commit, CI's lint and typecheck steps passed with a
generated client (the job failed later, at env classification).

## 12. Changed files — 18

New:
```
scripts/verify-contact-registry.mjs
src/lib/contacts/merge.ts
src/lib/contacts/dashboard-metrics.ts
src/lib/whatsapp-number-pool-plan.ts
src/app/api/crm/contacts/merge/route.ts
src/app/api/crm/contacts/dashboard/route.ts
src/app/crm/contacts/dashboard/page.tsx
tests/unit/contact-merge.test.ts
tests/unit/contact-dashboard-metrics.test.ts
tests/unit/contact-security.test.ts
tests/unit/whatsapp-pool-plan.test.ts
docs/contact-registry/03-phase2-completion-report.md
docs/contact-registry/04-contact-phones-decision.md
```

Modified:
```
src/app/api/google/contacts/sync/route.ts     (alias-aware existing rows)
src/lib/google/contacts.ts                    (google_alias: matching)
src/lib/whatsapp-number-pool.ts               (pure helpers extracted, re-exported)
src/app/api/whatsapp/numbers/route.ts         (reconciliation + preview_seed)
src/components/contacts/contact-hub-view.tsx  (Dashboard tab)
src/lib/permissions.ts                        (contacts.merge_execute, "execute")
docs/environment-classification.json          (regenerated — CI requirement)
```

## 13. Database migrations — none

Zero migrations added or modified. 51 migrations remain; the latest is
`20261114020000_super_admin_ai_command_center`. Nothing to deploy, nothing to roll back.
The two Phase 2 features that could have needed one (multi-number table, merge history
table) were deliberately designed without schema changes: merge reuses `PortalAuditLog`
+ `ContactMatchReview` + tags.

## 14. Branch and commit SHA — see the PR comment

`arena/780bb927-alo-web-crm-tech`. The session is pinned to this branch, so the requested
"dedicated completion branch" was not created: creating one would detach the work from
the tracked session and from PR #60. The Phase 2 commit is the second commit on the
branch and is listed in the PR comment.

## 15. PR URL — https://github.com/tech360-bd/ALO_WEB_CRM_TECH/pull/60

Open, not merged.

## 16. CI workflow URL and result

* CI — Pull Request Validation:
  https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/43715930663
* CodeQL Advanced: passed (actions, javascript-typescript, python).

Two CI jobs were failing **before** Phase 2:

1. **"Environment variable classification is current"** — real, and caused by this
   branch: `.env.example` gained `GOOGLE_CONTACTS_ACCOUNT` / `GOOGLE_CONTACTS_REFRESH_TOKEN`
   without regenerating the derived file. **Fixed** by running
   `npm run audit:env`; `--check` now passes locally and CI should go green.
2. **"Fresh-database migration (migrate deploy on empty MySQL 8)"** — **pre-existing on
   `main`** (run 43571147948 on 2026-11-14 fails the same step). Not caused by this work:
   no migration was added. The job log could not be downloaded from this environment
   (the log host is outside the permitted network), so the cause is **not diagnosed here**
   and is reported as an open blocker rather than guessed at.

## 17. Merge SHA — NOT MERGED

No merge occurred. Merging requires separate explicit authorisation, and the CI job above
still fails.

## 18. Production deployment evidence — NOT DEPLOYED

Nothing was deployed. No production database, DNS, secret or migration was touched. The
deployment workflow in this repository is a refusal notice that delegates to Hostinger;
using it requires the authorisation in §17.

## 19. Remaining blockers

| # | Blocker | Blocks | Resolution |
| --- | --- | --- | --- |
| B1 | No staging `DATABASE_URL` in this environment | Task 1 in full; merge/dashboard/identification SQL execution | run `node scripts/verify-contact-registry.mjs` with a staging URL, attach output |
| B2 | No Google OAuth credential (`GOOGLE_CONTACTS_REFRESH_TOKEN`) | Task 2 in full | `docs/contact-registry/02-google-contacts-setup.md` |
| B3 | `prisma generate` impossible here (`binaries.prisma.sh` unreachable) | local build/typecheck; any Prisma-booting suite | run in CI or a developer machine |
| B4 | No Meta/WhatsApp credential | number-pool ownership verification; live sending | Meta Business verification per number |
| B5 | Fresh-DB migration failure in CI, pre-existing on `main` | green CI | needs the job log/server access; not diagnosable from here |
| B6 | Merge UI not built | operator flow | endpoint is complete; a UI is the next increment |
| B7 | 13 unit suites fail at baseline | full green suite | unrelated to this work; each needs its own fix |
| B8 | Merge/dashboard SQL never executed | confidence in live behaviour | covered by B1 |

Nothing in this report is claimed as tested unless a command produced the result quoted.
