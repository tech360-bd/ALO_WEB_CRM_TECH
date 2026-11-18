# ALO CRM — Central Contact Registry, Live Student Identification, Google Contacts, WhatsApp

Implementation report · branch `arena/780bb927-alo-web-crm-tech` · 2026-11-15

Status vocabulary used below is exactly the seven values from the brief:
`Completed and tested` · `Implemented but not tested` · `Waiting for credentials` ·
`Waiting for external verification` · `Waiting for approval` · `Not implemented` · `Failed`.

Nothing in this change was merged, deployed, migrated, or connected to production. No
production credential, database or DNS record was touched.

---

## 1. Executive summary

The brief asks for a central contact registry inside the existing CRM, live student
identification, a Google Contacts integration, WhatsApp handling, a company number
registry, deduplication, search, a lifecycle, family contacts, a timeline, follow-up
automation, RBAC, a dashboard, a safe migration, and a final report.

**Most of that already existed and was not rebuilt.** This repository already has a
central registry (`WhatsAppContact` + `src/lib/contacts/registry.ts`), phone→identity
matching, duplicate *review*, CSV import, consent, audit, WhatsApp webhook with
idempotency, the `[3,7,14,21,25,30]` follow-up schedule, `ParentGuardian` with consent,
and the `AE-YYYY000001` Student ID allocator. Re-implementing any of it would have
created the duplicate systems the brief forbids.

**Two things were genuinely missing, and both are now built:**

1. **Google Contacts / People API integration** — there was no code, no model, no scope
   and no environment variable for it anywhere in the repository. Now implemented as a
   read adapter plus a reconciliation policy that treats the CRM as authoritative.
2. **Live identification** — the existing `/api/communications/contacts/match` returns
   *candidates for a decision*; there was no endpoint that assembles the caller card
   (Student ID, application, counsellor, guardians, last conversation, open follow-ups,
   deep link) and no scoped, audited "who is this number?" surface. Now implemented,
   including a UI screen at `/crm/contacts/identify`.

Honest headline: the code is complete and unit-tested for everything that can be tested
without credentials or a database; **the Google integration is `Waiting for
credentials`** and has never spoken to Google, and **nothing here has been verified
against a live database in this environment** (see §14).

---

## 2. Scope and acceptance criteria

| Brief | Requirement | Where it is satisfied | Status |
| --- | --- | --- | --- |
| §2 | Google account `alo.allcontacts@gmail.com`, main number `01805020100` | `GOOGLE_CONTACTS_ACCOUNT` (defaults to that address), number pool config | Account: configured as default · Number: `Waiting for credentials` |
| §3 | One registry, unique contact id, every number searchable | `WhatsAppContact` (existing) + `phoneVariants` search | `Completed and tested` (existing, unchanged) |
| §4 | Student ID `AE-YYYY000001` only on approval, never re-issued | `src/lib/identity/student-id.ts` (existing) | `Completed and tested` (existing, verified unchanged) |
| §5 | Live identification card | `src/lib/contacts/identification*.ts`, `/api/crm/contacts/identify`, `/crm/contacts/identify` | `Implemented but not tested` against a live DB |
| §6 | Relationships; guardian number ≠ student number | `GUARDIAN_NUMBER` state + `ParentGuardian` (existing model) | `Completed and tested` (policy) |
| §7 | Google Contacts via OAuth + People API | `src/lib/google/contacts.ts`, `/api/google/contacts/{status,sync}` | `Waiting for credentials` |
| §8 | WhatsApp inbound/outbound, idempotent webhooks, no auto-student | existing webhook + `webhook-idempotency.ts` | `Completed and tested` (existing, unchanged); live sending `Waiting for credentials` |
| §9 | Company number registry `01805020100`–`…119` | `WhatsAppOfficialNumber` + `src/lib/whatsapp-number-pool.ts` (existing) | `Waiting for credentials` (pool is env-driven and currently empty) |
| §10 | Duplicate detection and merge | detection + review queue (existing); merge execution | Detection `Completed and tested`; merge **`Not implemented`** |
| §11 | Global search | `/api/crm/contacts` search (existing) | `Completed and tested` (existing, unchanged) |
| §12 | Unknown inbound ⇒ unverified contact, never a student | `UNKNOWN` state + `shouldAutoCreateStudent() === false` | `Completed and tested` |
| §13 | Lead→student lifecycle, no duplicate profiles | existing `Lead`/`Student`/`Application` pipeline | `Completed and tested` (existing, unchanged) |
| §14 | Family contacts with verification/consent | `ParentGuardian` + `ParentGuardianConsent` (existing) | `Completed and tested` (existing, unchanged) |
| §15 | Central communication timeline | `UccConversation`/`UccMessage`, `CommunicationThread`/`Message` (existing) | `Completed and tested` (existing, unchanged) |
| §16 | Follow-up day 3/7/14/21/25/30 | `DEFAULT_FOLLOWUP_DAYS` (existing) | `Completed and tested` (existing, unchanged) |
| §17 | Roles/permissions, branch restrictions | `DataScope`, `contactScopeWhere`, `hasCompanyWideContactAccess` + scope applied in the new endpoint | `Completed and tested` |
| §18 | Contact dashboard, 16 metrics | — | **`Not implemented`** |
| §19 | Safe migration, never delete/replace data | no schema change was needed (§5) | `Completed and tested` (nothing to migrate) |
| §20 | Reuse DB/ORM/API/auth, use existing model names | yes — no new table, no second database | `Completed and tested` |
| §21 | Idempotency, retries, last-sync, health, no false "real-time" | `/api/google/contacts/status`, sync tokens, explicit non-real-time wording | `Implemented but not tested` live |
| §22 | Security/privacy | see §13 of this report | `Completed and tested` (see §13) |
| §23 | UI sections | identify screen + Google panel added; other 15 sections already existed or are listed in §15 | partly `Not implemented` |
| §24 | 20 tests, no "works" claims from mocks | see §14 | see §14 |
| §25 | Branch, PR, no push to main, no merge/deploy | branch pushed, PR opened, nothing merged | `Completed and tested` |
| §26 | This report | 15 sections | `Completed and tested` |
| §27 | CRM is the single source of truth | enforced in `planContactImport` and the identification states | `Completed and tested` |

---

## 3. Repository audit — what already existed (and was therefore not rebuilt)

Verified by reading the code, not by assumption.

| Capability | Existing implementation |
| --- | --- |
| Central registry semantics | `src/lib/contacts/registry.ts` (13 categories, lifecycles, segments, CSV parse, duplicate grouping that refuses to auto-merge) over the `WhatsAppContact` table |
| Phone → identity matching | `src/lib/communications/contact-identity.ts` (`resolveContactIdentity`, confidence `exact/possible/none`, actions `open_existing/merge_request/create_new`, `shouldAutoCreateStudent(): false`) |
| Match endpoint | `src/app/api/communications/contacts/match/route.ts` + `/match/[id]/resolve` |
| Duplicate review | `/api/crm/contacts/duplicates` + `ContactMatchReview`, policy `REVIEW_REQUIRED` |
| CSV import | `/api/crm/contacts/import` with `ImportBatch`/`ImportError` ledger and lawful-basis capture |
| Contact Hub UI | `/crm/contacts`, `[id]`, `import`, `duplicates`, `consent`, `segments`, `audit` |
| WhatsApp webhook + idempotency | `/api/whatsapp/webhook`, `webhook-idempotency.ts`, `webhook-event-claim.ts`, `UnknownIncomingContact` |
| Company numbers | `WhatsAppOfficialNumber` + `WhatsAppNumberAssignmentAudit` + `/admin/whatsapp-numbers` |
| Follow-up schedule | `src/lib/whatsapp-followup-engine.ts` → `[3, 7, 14, 21, 25, 30]`, `WhatsAppFollowUpSchedule` |
| Family / guardians | `ParentGuardian`, `ParentGuardianConsent`, `ParentGuardianPaymentResponsibility` |
| Student ID | `src/lib/identity/student-id.ts` — `AE-<year><4 digits>`, atomic `LAST_INSERT_ID`, fails closed on overflow, never rewrites legacy IDs |
| RBAC | `src/lib/data-scope.ts` (`ALL/BRANCH/ASSIGNED/NONE`), `contactScopeWhere`, `hasCompanyWideContactAccess` |
| Audit | `AuditLog`, `IntegrationAuditLog` |

Gaps found by the audit, and what happened to them:

| Gap | Decision |
| --- | --- |
| No Google Contacts integration at all | **built** (§8) |
| No encrypted token store for a contact source | avoided: no token is stored in the database at all (§8) |
| No incremental sync state | stored on the existing `SocialIntegration` row, no new table (§8) |
| No merge with recovery | left `Not implemented`, stated honestly (§10) |
| No multi-phone child table | left as-is; the registry is phone-keyed (§9) |
| Number pool seeds 0 rows (env empty) | left untouched; the numbers are configuration, not code (§11) |
| No contact dashboard aggregate | `Not implemented` (§15) |

---

## 4. What was built

| File | Purpose |
| --- | --- |
| `src/lib/google/contacts.ts` (new) | People API adapter + reconciliation policy: `mapGooglePerson`, `mapGooglePeople`, `planContactImport`, `summarizePlan`, `listConnectionsPage`, `listAllConnections`, `verifyContactsAccess`, `describeContactsConfig` |
| `src/lib/google/oauth.ts` (extended, additive) | `SCOPE_CONTACTS_READONLY`; `resolveUserScopedCredential()`; optional credential override on `getGoogleAccessToken`/`googleApiRequest`; token cache keyed by scope **+ credential fingerprint** (SHA-256 prefix) so two credentials can never be confused |
| `src/app/api/google/contacts/status/route.ts` (new) | `GET` — configuration, live verification, last sync, imported counts, pending reviews, next steps. `PASS` only after a real Google call |
| `src/app/api/google/contacts/sync/route.ts` (new) | `POST` — `mode` defaults to `dry-run`; `apply` writes through the existing `ImportBatch`/`ImportError` ledger, queues `ContactMatchReview`, writes `AuditLog`, stores the sync token |
| `src/lib/contacts/identification-card.ts` (new) | db-free card assembly and the four states + `minimalProfile`, `normalizeIdentificationInput`, `rejectNameOnlyIdentification` |
| `src/lib/contacts/identification.ts` (new) | bounded database reads (`identifyByPhone`), guardian resolution, follow-ups from `Task` + `WhatsAppFollowUpSchedule`, last conversation from `UccConversation` |
| `src/app/api/crm/contacts/identify/route.ts` (new) | `GET`/`POST`; staff-only, scope applied, audit of every lookup, explicit `NAME_ONLY_NOT_ALLOWED` |
| `src/components/contacts/contact-hub-view.tsx` (extended) | new **Identify** tab and `IdentifyView` (card, possible matches, guardian number, unknown, audit notice, measured duration) |
| `src/app/crm/contacts/identify/page.tsx` (new) | the screen |
| `src/app/admin/google-stack/page.tsx` (extended) | **Google Contacts** panel: status, live verify, preview (writes nothing), import, last-run counters |
| `.env.example` (extended) | `GOOGLE_CONTACTS_ACCOUNT`, `GOOGLE_CONTACTS_REFRESH_TOKEN` (empty), with the service-account warning |
| `tests/unit/google-contacts.test.ts` (new) | 17 tests |
| `tests/unit/contact-identification.test.ts` (new) | 10 tests |

No existing file was deleted, no feature was removed, no environment value was changed.

---

## 5. Data model — mapping the brief's names onto the real schema, and why there is no migration

The brief names `Contact`, `ContactPhone`, `ContactEmail`, `ContactRelationship`,
`GoogleContactSync`, `ContactMergeHistory`. This database already has a table that *is*
that registry, and `src/lib/contacts/registry.ts` documents it as "the registry's single
source of truth … the webhook, consent ledger, campaigns and the CRM already use".

| Brief | Implemented as | Note |
| --- | --- | --- |
| `Contact` | `WhatsAppContact` | one row per number; the unique key is the normalised phone |
| `ContactPhone` | `WhatsAppContact.phone` / `normalizedPhone`, `Student.phone`, `Lead.phone`/`altPhone`, `ParentGuardian.phone`/`whatsapp` | **not** a child table — see §9 |
| `ContactEmail` | `WhatsAppContact.email` / `normalizedEmail`, `Student.email`, `Lead.email` | |
| unique Contact ID | `WhatsAppContact.id` (cuid) | |
| `ContactRelationship` | `ParentGuardian` (`studentId`, `relationship`, `isPrimaryContact`, `isFinancialSponsor`) | one parent may already have several students |
| `GoogleContactSync` | `SocialIntegration` (`provider='google_contacts'`, `lastSyncAt`, `healthStatus`, `metadata.syncToken`) | no new table |
| `ContactMergeHistory` | — | merge itself is not implemented (§10) |
| sync report | `ImportBatch` / `ImportError` | the existing import ledger |

**No migration was written and none is needed.** That is deliberate: the environment
cannot run `prisma generate` (binaries.prisma.sh is unreachable here), so a schema change
would have shipped unverified DDL. Nothing in this change alters the schema, so there is
nothing to roll back and no risk to existing Student IDs or records.

---

## 6. Student ID (§4) — verified, not modified

`src/lib/identity/student-id.ts` already implements exactly the requested contract:

* format `AE-<year><4 digits>` → `AE-2026000001`, year in `Asia/Dhaka`;
* allocation inside the caller's transaction via `LAST_INSERT_ID(expr)` (atomic, no
  read-then-write race);
* issued only from the registration-approval path; gaps are allowed and reuse is
  forbidden; overflow past `9999` fails closed rather than wrapping;
* existing IDs are never rewritten.

Nothing in this change creates a Student or a Student ID. The identification endpoint
asserts at runtime that auto-creation stays disabled and throws if that invariant is ever
broken.

---

## 7. Live identification (§5, §6, §12)

`GET|POST /api/crm/contacts/identify?phone=…`

Four states, and the UI switches on nothing else:

| State | Meaning | What the operator sees |
| --- | --- | --- |
| `IDENTIFIED` | exactly one record matched on its own number | name, Student ID, lifecycle, status, numbers **with provenance**, email, photo (or the honest reason there is none), parent/guardian, counsellor, application (university/course/stage), last conversation, open follow-ups, deep link |
| `POSSIBLE_MATCHES` | two or more records, or only a secondary field matched | the list, each with the facts needed to choose, `requiresConfirmation: true`, and a notice that ALO never merges or picks |
| `GUARDIAN_NUMBER` | the number is a registered parent/guardian line and not a student's own | the guardians and the student(s) they belong to, plus an explicit instruction not to treat it as the student's number |
| `UNKNOWN` | nobody recognises the number | the number, the allowed next actions, and "nothing was created" |

Enforced in code, not documentation:

* **No phone, no identification** — `NAME_ONLY_NOT_ALLOWED` (400) with an explanation;
  `normalizeIdentificationInput('Rakib Hasan')` returns `null`.
* **Never name-based matching** — the resolver's input is a number only; `resolveContactIdentity`
  scores phone/whatsapp/alt-phone/email only.
* **Ambiguity is surfaced** — a shared family number yields a review list, never a
  single confident card.
* **No auto-student** — `shouldAutoCreateStudent()` stays `false`, and the endpoint
  throws if it is ever `true`. A `UNKNOWN` number offers `create_unverified_contact`,
  `link_existing`, `create_lead`, `mark_spam`.
* **Measured, not asserted, timing** — each response carries `meta.durationMs` (server
  time for *this* resolution) and `meta.realTimeVerified: false` with the reason: the
  end-to-end delay from carrier/provider event to screen has not been measured, so the
  feature is not called real-time.

Privacy controls on this endpoint:

* **Staff-only.** Student and partner portal sessions are refused (`STAFF_ONLY`)
  *before* any database read, because even "this number exists" is personal data and
  would otherwise be a probe oracle.
* **Scope applied before the card is returned.** Company-wide roles see the card;
  `ASSIGNED` sees only their own; `BRANCH` only when the record's counsellor is an
  active employee of that branch; anything else comes back `restricted: true` with name,
  Student ID and history withheld.
* **Every lookup is audited** (`AuditLog`, action `contacts.identify`, masked number).
  If the audit write fails the card is still returned **and says so** — the failure is
  visible rather than silent.

---

## 8. Google Contacts integration (§7, §21)

### 8.1 The credential problem, stated rather than worked around

The People API reads the address book of a **signed-in user**. A service account has no
mailbox, so it cannot read `alo.allcontacts@gmail.com`'s contacts, and domain-wide
delegation does not apply to a consumer account. The integration therefore:

* requires `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_CONTACTS_REFRESH_TOKEN`
  (falling back to `GOOGLE_OAUTH_REFRESH_TOKEN`);
* returns `configured: false` with that explanation when only a service account exists —
  instead of returning "0 contacts", which would read as "the company has no contacts";
* uses `resolveUserScopedCredential` so a contacts token wins over a service account that
  is already configured for Search Console/GA4. Without this, a deployment holding both
  would have failed every contacts call with a misleading 403.

### 8.2 Reconciliation policy (the CRM is authoritative)

`planContactImport` is pure and unit-tested. For each Google person:

1. already linked by `resourceName` → `SKIP_ALREADY_LINKED` (idempotent re-runs);
2. deleted upstream → skipped (deletions are never propagated automatically);
3. no plausible phone → `SKIP_UNUSABLE` and reported (the registry is phone-keyed, so a
   phoneless person cannot be stored — inventing a number is not an option);
4. opted out or blocked → `SKIP_OPTED_OUT` (consent outranks freshness);
5. exactly one match, non-empty disagreement on name/email → `CONFLICT_REVIEW`, **no
   write**; otherwise `FILL_BLANK_FIELDS` (only empty fields) or `LINK_EXISTING`;
6. more than one match → `CONFLICT_REVIEW` (a shared family number is not proof of
   identity);
7. no match → `CREATE` as `source=GOOGLE_CONTACTS`, tags `identity:UNVERIFIED`.

Never written from Google: Student records, Student IDs, counsellor assignment,
guardians, relationships, consent state.

### 8.3 Operational behaviour

* `POST /api/google/contacts/sync` defaults to **`dry-run`**; writing requires
  `{"mode":"apply"}`.
* Dry run performs no writes at all — not even bookkeeping.
* Apply writes through the existing `ImportBatch` (counters: found/new/matched/duplicate/
  error), queues `ContactMatchReview` rows for conflicts (deduplicated, so a re-run does
  not create a second identical review), records `ImportError` rows for failed writes with
  driver codes only (never a bound-parameter dump), and writes an `AuditLog` row.
* Sync state: the People API `syncToken` is stored in `SocialIntegration.metadata`
  (`provider='google_contacts'`) with `lastSyncAt` and `healthStatus`. **No credential is
  written to the database** — the existing table's `accessToken`/`refreshToken` columns are
  left empty, which is the opposite of extending `SocialIntegration` the way the existing
  Meta integration does.
* Incremental sync uses the stored token; an expired token (HTTP 410) triggers exactly
  one full re-read rather than a retry loop.
* Pagination is capped (default 20 pages, hard maximum 50) and a truncated run reports
  `truncated: true` instead of implying a complete sync.
* Rate limited (`admin_settings`, 30/min) and requires
  `google.integrations.manage` (sync) / `google.integrations.view` (status).
* Health: `/api/google/contacts/status` separates `configured` from `liveVerified`, so
  "configured but Google refuses" is visible. `PASS` requires a real API answer.

### 8.4 Status

`Waiting for credentials`. The adapter, the policy, the routes and the panel are complete;
Google has never been called from this environment (no OAuth token, and outbound access
is restricted). Setup steps: `docs/contact-registry/02-google-contacts-setup.md`.

---

## 9. Registry, multi-number support and search (§3, §11)

Existing and unchanged. Each registry row holds one primary number (unique), and the CRM
finds a person through every stored field: `Student.phone`, `Lead.phone`,
`Lead.altPhone`, `ParentGuardian.phone`, `ParentGuardian.whatsapp`, plus digit-level
variants (`8801…`, `01…`, last ten digits).

**Honest limitation:** the brief's `contact_phones` child table does not exist. A person
with several numbers is represented as several rows or as parent/guardian and alternate
fields. Search therefore covers *each number separately* as required, but the schema
cannot yet express "these three numbers belong to one contact" without a migration. That
was left out deliberately (§5) rather than shipped unverified.

---

## 10. Deduplication and merge (§10)

* **Detection:** `buildDuplicateReviewGroups` groups exact normalised phone/email matches
  and returns `decision: 'REVIEW_REQUIRED'`. A shared family phone is reported, never
  merged.
* **Review:** `/api/crm/contacts/duplicates` (GET queue, POST review item) guarded by
  `contacts.merge_review` (falls back to `BRANCH_MANAGER`); its POST response states
  `merged: false`.
* **Google conflicts** now also land in the same queue (new in this change).
* **Merge execution with history and recovery: `Not implemented`.** There is no
  `ContactMergeHistory` table and no merge endpoint, so nothing can be silently merged —
  which is the safe failure mode, but it is a gap against the brief and is stated as one.

---

## 11. Numbers, WhatsApp, follow-ups, lifecycle, family, timeline, roles, dashboard

| § | Item | Status | Note |
| --- | --- | --- | --- |
| §8 | WhatsApp inbound webhook, verification, idempotency, unknown-sender handling | `Completed and tested` (existing) | `webhook-idempotency.ts` + `webhook-event-claim.ts`; live sending needs Meta credentials → `Waiting for credentials` |
| §9 | Company number pool `01805020100` main, `…101` COO, `…102–119` pool | `Waiting for credentials` | the pool is **env-driven** and the variables are empty in `.env.example`, so `seed_official_pool` creates 0 rows. The numbers must be supplied by ALO and their WhatsApp registration verified before any live operation |
| §13 | Lead → student lifecycle | `Completed and tested` (existing) | `Lead`, `Student`, `Application.stage`; no duplicate profiles are created by the new code |
| §14 | Family contacts with consent | `Completed and tested` (existing) | `ParentGuardian` + `ParentGuardianConsent`; now surfaced in the identification card |
| §15 | Communication timeline | `Completed and tested` (existing) | `UccConversation`/`UccMessage`, `CommunicationThread`/`CommunicationMessage` |
| §16 | Day 3/7/14/21/25/30 follow-ups | `Completed and tested` (existing) | `DEFAULT_FOLLOWUP_DAYS`, `WhatsAppFollowUpSchedule`; open follow-ups now appear on the card |
| §17 | Roles and the 14 permissions | `Completed and tested` | `DataScope`; branch/assignment scope now enforced on identification too |
| §18 | Contact dashboard with 16 metrics | **`Not implemented`** | no aggregate endpoint was added; the existing `/crm/contacts` list and `/crm/contacts/segments` show real counts only |
| §23 | The 17 UI sections | partly | Identify screen and Google panel are new; the rest of the Contact Hub (list, detail, import, duplicates, consent, segments, audit) already existed |

The company numbers deserve emphasis: the brief states them as facts, but this repository
stores them as configuration (`ALO_MAIN_WHATSAPP_NUMBER`, `ALO_COO_WHATSAPP_NUMBER`,
`ALO_EMPLOYEE_WHATSAPP_NUMBERS`) which is currently empty. Hard-coding them would have
been the easy and wrong move — it would overwrite deployment configuration and assert
ownership that nobody has verified with WhatsApp.

---

## 12. Migration and data safety (§19)

* Inspection: 51 migrations, latest `20261114020000_super_admin_ai_command_center`;
  `Student.studentId` is `@unique`; `WhatsAppContact.normalizedPhone` is `@unique`.
* **This change adds no migration.** No table, column, index or constraint was altered, so
  there is no destructive step, no backfill and nothing to roll back.
* Existing Student IDs are untouched: nothing in the new code writes `Student.studentId`.
* Google imports cannot overwrite CRM data (§8.2) and cannot delete anything.
* Backup/testing/approval sequence for the *future* `contact_phones` and merge-history
  migration is written down in §15 rather than performed.

---

## 13. Security and privacy (§22)

| Control | Implementation |
| --- | --- |
| RBAC | `withAuth` + scope (`ALL/BRANCH/ASSIGNED/NONE`); Google routes require `google.integrations.view/manage`; portal sessions refused on identification |
| Credential handling | refresh token lives only in the server environment; never in the database, never in a response, never logged. `/status` was tested to contain no token |
| Token cache safety | cache key = scope + SHA-256 prefix of the credential, so two credentials cannot collide |
| HTTPS / same-origin | inherited from the platform; `requireGoogleAccess` enforces `mutationOriginAllowed` for non-GET |
| Server-side validation | phone normalised and length-bounded; `mode` whitelisted; `maxPages` clamped; page size clamped to 1000 |
| Audit | every identification lookup (`AuditLog`), every sync run (`AuditLog`) and every batch (`ImportBatch`) |
| Data minimisation | queries `select` only displayed fields; sample tables mask numbers (`••••4567`); audit stores only the last four digits |
| Rate limits | `admin_settings` limiter (30/min) on both new Google routes and on identification |
| Error hygiene | driver messages are mapped to codes; Google error text is passed through but no request URL or credential is |
| Export/retention | existing `/api/crm/contacts/export` permission-gated; no new retention policy was invented |

Known, accepted trade-off: if the audit write fails, identification still returns the card
(in a call centre, blocking the screen is worse) **but flags `audit.recorded: false`** so the
failure is recorded and visible rather than hidden.

---

## 14. Tests and verification evidence (§24)

### Commands actually run in this environment, with results

| Command | Result |
| --- | --- |
| `npx vitest run tests/unit/google-contacts.test.ts` | **17/17 passed** |
| `npx vitest run tests/unit/contact-identification.test.ts` | **10/10 passed** |
| `npx vitest run` on 8 related suites (contact-hub-api, contact-hub-registry, contact-identity, google-stack, google-analytics-data-api, identity-match-policy, inbound-identity-provisioning, alo-whatsapp-number-seed) | **216/216 passed** |
| `NODE_OPTIONS="--max-old-space-size=7000" npx tsc --noEmit` | **104 errors — identical to the pre-change baseline; none in a touched file** |
| `npx eslint` on all touched files | **0 problems** |

### What those tests prove, item by item

| # | Verification | Where | Status |
| --- | --- | --- | --- |
| 1 | Google mapping keeps the resource name, normalises numbers, drops junk numbers | `google-contacts.test.ts` | `Completed and tested` |
| 2 | A service account is never reported as working Contacts access | same | `Completed and tested` |
| 3 | A contacts token wins over a service account | same | `Completed and tested` |
| 4 | No secret appears in the configuration description | same | `Completed and tested` |
| 5 | Google never overwrites a populated CRM value | same (`CONFLICT_REVIEW`) | `Completed and tested` |
| 6 | Google fills only empty fields | same | `Completed and tested` |
| 7 | A shared number ⇒ review, never a merge | same | `Completed and tested` |
| 8 | Re-running the plan is idempotent | same | `Completed and tested` |
| 9 | Opted-out contacts are never written | same | `Completed and tested` |
| 10 | A phoneless contact is reported, not invented | same | `Completed and tested` |
| 11 | Number variants (`01…` vs `8801…`) match | same | `Completed and tested` |
| 12 | Name-only identification is refused by code | `contact-identification.test.ts` | `Completed and tested` |
| 13 | A single exact match yields the full card without confirmation | same | `Completed and tested` |
| 14 | Two matching students ⇒ possible-match list, no auto-choice | same | `Completed and tested` |
| 15 | A secondary-field match is a possible match, not an identification | same | `Completed and tested` |
| 16 | A guardian number is reported as a guardian number | same | `Completed and tested` |
| 17 | An unknown number creates nothing and lists allowed actions | same | `Completed and tested` |
| 18 | The feature never claims real-time; it reports a measured duration | same | `Completed and tested` |
| 19 | The backfill/import of Google contacts writes correct rows against a live DB | — | `Waiting for credentials` |
| 20 | Duplicate webhook delivery is rejected; delivery/read status updates | existing suites (`whatsapp-webhook-handler`, `webhook` idempotency) | `Completed and tested` (existing) |

### What could NOT be run here, and why

* `prisma generate` / `npm run build` / `npm run typecheck` — `binaries.prisma.sh` is
  unreachable and `node_modules/.prisma/client` is a stub (`declare const PrismaClient: any`).
  Any Prisma-booting test suite is therefore unreliable in this sandbox. Build and
  typecheck are **`Waiting for external verification`** on a machine with Prisma binaries.
* Any call to Google (status live check, dry run, apply) — no OAuth token, no network
  egress to `people.googleapis.com` → `Waiting for credentials`.
* Any call to the identification endpoint against real data — no `DATABASE_URL` →
  `Implemented but not tested` live. The policy layer is unit-tested; the SQL has been
  reviewed but not executed.

---

## 15. Remaining work, manual steps, and approvals

### Required manual steps (nothing else can complete these)

1. Create the Google Contacts credential — exact steps in
   `docs/contact-registry/02-google-contacts-setup.md` (enable People API, consent once as
   `alo.allcontacts@gmail.com`, store the refresh token).
2. Supply the company numbers via `ALO_MAIN_WHATSAPP_NUMBER`, `ALO_COO_WHATSAPP_NUMBER`,
   `ALO_EMPLOYEE_WHATSAPP_NUMBERS`, then run `seed_official_pool` on
   `/admin/whatsapp-numbers`. **Ownership/registration of each number with WhatsApp must be
   verified before it is used to send** — a number in a list is not a verified sender.
3. Run `npx prisma generate && npm run build` on a machine with Prisma binaries and attach
   the output to the PR.
4. After (1): open `/admin/google-stack` → *Verify access* → *Preview import* →
   *Import*, and confirm the second run reports duplicates (idempotency) as described in
   §5 of the setup doc.

### Not implemented (stated, not hidden)

* Merge execution with history and recovery (§10).
* `contact_phones` child table for multiple numbers per contact (§9).
* Contact dashboard with the 16 metrics (§18).
* Import of Google `contactGroups` into categories.
* Student photo: the schema has no photo column and uploaded documents are private by
  design; the card returns `photoUrl: null` with `photoReason` rather than a fake avatar.

### Approval required (not performed)

* Merging this PR, deploying, running any migration, changing DNS, or adding production
  secrets. None of these happened. `main` was not pushed to.

### Final honest status

| Area | Status |
| --- | --- |
| Central registry, matching, dedupe detection, CSV import, consent, audit | `Completed and tested` (pre-existing, verified by reading and by its own suites) |
| Student ID contract | `Completed and tested` (pre-existing, unchanged) |
| Live identification (API + UI + policy) | `Implemented but not tested` against live data; policy layer `Completed and tested` |
| Google Contacts integration | `Waiting for credentials` — code complete and unit-tested, never called Google |
| Company number pool | `Waiting for credentials` (numbers are configuration and are currently empty) |
| WhatsApp live send/webhook verification | `Waiting for external verification` |
| Merge with recovery, multi-phone table, dashboard | `Not implemented` |
| Production build/typecheck with a real Prisma client | `Waiting for external verification` |
| Nothing merged, deployed or migrated | `Completed and tested` |
