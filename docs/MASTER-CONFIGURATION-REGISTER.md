# ALO Education — Master Configuration Register & Production Go-Live Specification

**Status: planning and verification register, not a deployment confirmation.**
**Prepared:** 13 October 2026 · **Register owner:** ALO Education
**Repository:** `tech360-bd/ALO_WEB_CRM_TECH` · **Branch:** `arena/57b0809e-alo-web-crm-tech` · **HEAD:** `7c26aad4`

> **Source note.** This register was compiled from the owner's specification
> received 2026-10-13. That specification arrives **truncated**: §5 ends mid-item
> at "CRM: lead inbo…". Everything from that point onward is therefore outside
> this document and is recorded as **NOT RECEIVED**, not as complete.

## Status vocabulary

| Status | Meaning |
|---|---|
| **VERIFIED (repo)** | Proven by a file, command or test in this repository. Evidence cited. |
| **PARTIAL** | Part of the item is proven and part is not; the proven half is named. |
| **UNKNOWN / BLOCKED** | Requires an authoritative dashboard, DNS authority or live check that is **not reachable from this environment**. A verification step is given. |
| **NOT DONE** | Deliberately not performed, with the reason. |
| **NOT RECEIVED** | Outside the supplied specification. |

**Nothing in this document contains a password, OTP, API token, private key or
full database URL** (§1). Where a credential is required, only its **variable
name** is recorded.

---

## 1. Purpose and completion rules

Adopted as binding. How each rule was applied to the work recorded here:

| Rule | Application |
|---|---|
| No item marked Complete without real-account / repo / staging / live evidence | Every row below carries a status and an evidence pointer. Items needing an external dashboard are **UNKNOWN / BLOCKED**, never "done". |
| No production data overwrite, DNS/nameserver change, mail-routing change, DB migration, credential rotation or deployment without a verified recovery path and authorization | **None performed.** Nothing was deployed; no DNS, mailbox, mail route, database or credential was touched (§6). |
| No passwords, OTPs, tokens, private keys or full DB URLs in this document, GitHub, chat, spreadsheets or logs | This document records **variable names only**. It also records (below) that the previously-committed cPanel artifacts did contain real account and database identifiers — that is why they were removed. |
| Unknown values stay UNKNOWN / BLOCKED until verified in the authoritative dashboard | No value was inferred, guessed or copied from a stale document. |
| Preserve student records, conversations, documents, audit trails, mailboxes and repository history | **No student/conversation/document/audit row and no mailbox was approached.** See §6 for the one repository-content action taken and why it *is* consistent with this rule. |

---

## 2. Known context and unresolved facts

| Item | Known / intended | Status | Evidence / verification step |
|---|---|---|---|
| Domain | `aloeducation.com` | **PARTIAL** | Referenced in `src/lib/alo-site-info.ts`, whose header states its values were verified against the live site on 2026-10-13. Registrar and DNS authority are **not** in the repository — see §3. |
| Public site | `aloeducation.com` / `www.aloeducation.com` | **UNKNOWN / BLOCKED** | Live page, form, TLS and redirect checks require outbound access to the domain from an authorized network. This environment cannot verify a live production host. |
| CRM | `crm.aloeducation.com` (proposed) | **UNKNOWN / BLOCKED** | The **only** occurrence of this string in the entire repository is `.env.example` → `OPENROUTER_SITE_URL=https://crm.aloeducation.com` (a sample value, not a deployment record). **This is not proof the subdomain exists.** Verify DNS + Hostinger site mapping. |
| Hosting | Hostinger Cloud (preferred) | **PARTIAL** | The repository declares Hostinger the only authorized runtime (`HOSTINGER-RUNTIME-STANDARD.md`, `HOSTINGER-DEPLOYMENT-GUIDE.md`). Plan, account and site mapping: **BLOCKED** — read from the Hostinger dashboard. |
| Application stack | Next.js / Node.js / Prisma / MySQL | **VERIFIED (repo)** | `package.json` `engines: {node: "22.x", npm: ">=10"}`, `packageManager: npm@10.9.2`; `.nvmrc` and `.node-version` both `22`; `prisma/schema.prisma` `provider = "mysql"`; `next.config.ts` `output: "standalone"`. This resolves §2's "older variants differ" — **audit before trusting any other source**. The scheduled-workflow split that once caused a phantom scheduler is documented in `CRON_JOBS.md`. |
| Email | Preserve current mailboxes unless migration separately approved | **NOT DONE — compliant** | See §4. No mailbox, alias, forwarder, autoresponder or mail route was read or changed. |
| DNS manager | Unknown | **UNKNOWN / BLOCKED** | Identify authoritative nameservers, then export the full zone (§3). |
| Database | MySQL intended | **PARTIAL** | Provider **VERIFIED**: `mysql`. Host, schema, backup state and credentials: **BLOCKED** — private, server-side only. Migration history exists under `prisma/migrations/` with `npm run db:deploy` (`prisma migrate deploy`); it must not be run from a workstation against production. |
| File storage | Private object storage preferred | **PARTIAL** | The code enforces privacy but on a **filesystem path, not an object store**: `src/lib/storage/private-file-store.ts` throws in production unless `STORAGE_POOL_C` is an absolute persistent path (temporary-directory fallback applies only outside production). Existing trees: `storage/{official,outputs,student-partner}`. Provider, bucket, region and access policy: **UNKNOWN / BLOCKED**. |
| Integrations | WhatsApp Business, Facebook Lead Ads, Instagram, SMS, CRM email | **PARTIAL** | All credential **names** are declared in `.env.example` / `.env.production.example` (WhatsApp Cloud API, Meta/Facebook, Instagram, HTTPSMS/Domovina SMS, SMTP/IMAP). Real assets, permissions, IDs and webhook registrations: **UNKNOWN / BLOCKED** — none can be verified without the provider dashboards. |
| Deployment | No production deployment performed | **VERIFIED (repo)** | `.github/workflows/deploy-production.yml` is a **refusal gate**: it runs only for `refs/heads/main` on `workflow_dispatch` and ends in `exit 1`. No deployment was performed by this work either. |

---

## 3. Domain, DNS, HTTPS and hosting

| # | Requirement | Status | Evidence / next step |
|---|---|---|---|
| 3.1 | Record registrar, authoritative nameservers, DNS provider, renewal date, DNSSEC state, full zone export | **UNKNOWN / BLOCKED** | Not held in the repository and not reachable from here. Read from the registrar and the DNS provider, then store the export in the operator's secret/records store — **not** in Git. |
| 3.2 | Inventory A, AAAA, CNAME, MX, TXT, SPF, DKIM, DMARC, SRV, CAA and verification records | **UNKNOWN / BLOCKED** | Same source as 3.1. Do this **before** 3.3. |
| 3.3 | Do not change nameservers or mail records until the zone is backed up and the mail provider identified | **NOT DONE — compliant** | No DNS or mail record was read, added, changed or removed by this work. |
| 3.4 | Public site on `aloeducation.com` + `www`; authenticated CRM on the CRM host; confirm API origin from the actual architecture | **PARTIAL** | Public origin is coded in `src/lib/alo-site-info.ts` and `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_APP_URL`/`PUBLIC_WEBSITE_URL`/`ALO_APP_URL` are declared in `.env.example`. `www` vs apex canonicalisation and the CRM host are **BLOCKED** pending 3.1/3.2. **Canonicalisation must be settled before cutover**, because the codebase already contains more than one origin variable. |
| 3.5 | Verify the Hostinger plan supports the framework, Node version, build/start process, background jobs, DB connection and file storage | **PARTIAL** | Repository requirements are now **precise** and can be checked against the plan: Node **22.x** exactly (`.nvmrc`, `engines`, and `scripts/assert-node22.cjs` **fails the build** on any other major); build = `npm ci` → `npm run build` (runs `prisma generate` then `next build --webpack` then `prepare-standalone.mjs`); start = `npm start` → `node server.js`, which **fails closed** unless a verified standalone build exists and honours the provider `PORT`. Background jobs: the scheduler is **HTTP-driven** (`/api/cron/<job>` with a bearer secret) or run by a worker process — see `CRON_JOBS.md`. The plan's ceiling on Node version, process count, cron **and persistent disk** is **BLOCKED**. |
| 3.6 | Lockfile-based reproducible install, documented build/start, HTTPS, canonical redirects, certificate-renewal monitoring | **PARTIAL** | `package-lock.json` present and used (`npm ci` in CI and in the documented flow). Build/start documented in `HOSTINGER-DEPLOYMENT-GUIDE.md` / `HOSTINGER-RUNTIME-STANDARD.md`. Permanent redirects are declared in `next.config.ts` (`redirects()`), **not** in page components, by design — see the comment there. **HTTPS and certificate-renewal monitoring: BLOCKED** (provider-side). |
| 3.7 | Keep staging and production separate by domain, database, credentials, storage bucket/prefix and webhook endpoints | **UNKNOWN / BLOCKED** | No staging environment configuration was found in the repository (no `.env.staging*`, no staging workflow). Because webhook endpoints are part of this requirement, **Meta/WhatsApp, SMS and any other inbound webhook must not point at a staging host by accident** — verify each provider's callback URL as part of 3.5. |
| 3.8 | Test staging and document rollback to the last known-good build before cutover | **PARTIAL** | Rollback documentation exists: `ROLLBACK-GUIDE.md`, `BACKUP_RESTORE_GUIDE.md`, `BACKUP_RESTORE_TEST_REPORT.md`, plus `.github/workflows/deploy-recovery.yml`. **Staging test: BLOCKED** — no staging environment is reachable, and a rollback cannot be claimed as tested in this environment. |

---

## 4. Business email and deliverability

### 4.1 Proposed functional addresses — what the repository can and cannot prove

| Address | Status | Evidence |
|---|---|---|
| `info@aloeducation.com` | **PARTIAL** | Used as the public contact address in `src/lib/alo-site-info.ts` (verified against the live contact page 2026-10-13). **Existence as a mailbox is not proven by its use in code.** |
| `support@aloeducation.com` | **UNKNOWN / BLOCKED** | Appears in source. Presence in source is **not** mailbox proof. |
| `marketing@aloeducation.com` | **UNKNOWN / BLOCKED** | Appears in source. Same caveat. |
| `admissions@aloeducation.com` | **NOT FOUND** | Not referenced anywhere in the repository. Create only after checking existing mailboxes, aliases and plan limits. |
| `documents@aloeducation.com` | **NOT FOUND** | Not referenced anywhere in the repository. Same. |
| `notifications@aloeducation.com` | **NOT FOUND** | Not referenced. Transactional sending is currently configured through the SMTP sender identity, not a dedicated mailbox. |
| Individual staff mailboxes | **NOT VERIFIED** | Addresses such as `sadia.rahman@…`, `tanvir.ahmed@…`, `taslima@…`, `admin@…`, `counselor@…`, `student@…`, `hello@…`, `you@…` appear in source, but they are **seed and fixture data** used for demos and tests. They must **not** be read as a staff mailbox inventory. |

> **Rule for this section: source usage ≠ mailbox existence.** Only the mail
> provider's mailbox/alias list is authoritative.

### 4.2 Deliverability and mail handling

| # | Requirement | Status | Evidence / next step |
|---|---|---|---|
| 4.3 | Preserve mailboxes, stored mail, aliases, forwarders, autoresponders and provider access | **NOT DONE — compliant** | Nothing in the mail system was read or changed. *(Note: the 2026-10-13 cleanup removed obsolete cPanel deployment **files** from the repository. It did not touch mailboxes, mail routing or DNS. Files and mailboxes are unrelated; no mail configuration was affected.)* |
| 4.4 | Configure SPF, DKIM and DMARC with the exact values from the actual provider; never invent DNS values | **UNKNOWN / BLOCKED** | **No authoritative record exists.** DKIM/DMARC are discussed in several repository documents, but a discussion is not a record of the deployed state. Obtain the exact records from the mail provider and store them with the zone export (3.1). **Do not copy values from any repository document.** |
| 4.5 | Server-side SMTP or supported email API; credentials in hosting environment settings / secret manager | **PARTIAL** | Mechanism **VERIFIED**: `src/lib/email-service.ts` sends through nodemailer (installed as the alias `smtp-mailer` → `nodemailer@10.0.13`, with a local type declaration at `src/types/smtp-mailer.d.ts`) and reads `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` (+ `SMTP_PORT`) from the environment. `MAIL_*` and `IMAP_*` / `POP3_*` names are also declared in `.env.example`. **Credentials and provider: BLOCKED.** A verification detail worth recording: in this environment the sender returns `SMTP_NOT_CONFIGURED` when the variables are absent — it never reports a fabricated success. |
| 4.6 | Separate transactional notifications, password reset, student service messages and marketing email | **PARTIAL** | Separation **is** implemented by category in code, and the environment declares `EMAIL_SENDING_ENABLED`, `EMAIL_TEST_MODE`, `EMAIL_TEST_RECIPIENTS`, `EMAIL_DAILY_CAP`, `EMAIL_HOURLY_CAP`, `EMAIL_BATCH_SIZE`, `EMAIL_MAX_ATTEMPTS` and `EMAIL_UNSUBSCRIBE_SECRET`. Which values are live in production: **BLOCKED**. |
| 4.7 | Test inbound/outbound delivery, authentication alignment, bounce handling, unsubscribe and mailbox recovery | **UNKNOWN / BLOCKED** | Requires the live mail account. Unsubscribe **secrets/handling** exist in code (`EMAIL_UNSUBSCRIBE_SECRET`); bounce handling and mailbox recovery must be proven against the provider. |

---

## 5. Website and Web CRM scope

> **This section is incomplete.** The supplied specification stops mid-item at
> "CRM: lead inbo…". Requirement 5.4 and everything after it are **NOT RECEIVED**.
> Send the remainder and this register will be extended; do not read the absence
> of an item below as a statement that it is satisfied.

| # | Requirement | Status | Evidence / next step |
|---|---|---|---|
| 5.1 | Public site: home, about, destinations, universities, courses, intakes, scholarships, eligibility guidance, contact, privacy/cookie notices and accessible inquiry flows | **PARTIAL** | The corresponding pages and public catalogue data exist in the repository (e.g. `src/app/aqf-compliance`, `code-of-conduct`, `student-complaint-policy` and the destination/course/university surfaces). **Live rendering, accessibility and cookie-notice behaviour on the production host are BLOCKED** (§3.2). Content correctness is governed separately by the project's data-provenance and "no fabricated data" rules. |
| 5.2 | Course Finder: subject/course, study level, destination and intake; display only published, verified, open-to-international-student records | **PARTIAL** | Course Finder fields, intake-window logic and the shared public form structure exist (`src/components/course-finder/PublicCourseFinder.tsx`, `src/lib/course-finder/intake-window.ts`, `/api/courses/search`, `src/lib/public-catalog.ts`). The **"only verified / open-to-international" filter must be re-confirmed against the live catalogue** before go-live; unverified values must render as "Check with counselor" / "Data pending verification" rather than a number. |
| 5.3 | Student portal: profile, applications, documents, status tracking, notifications, preferences/consent and secure account recovery | **PARTIAL** | Portal routes and APIs exist (`/api/student-portal/*`, `/api/student/*`, account/document/notification surfaces), and document access is authorized server-side (deny-by-default), not by hiding UI. **Secure account recovery and consent/preference behaviour: to be verified end-to-end on staging** (3.7). |
| 5.4 | CRM: lead inbo… *(specification text ends here)* | **NOT RECEIVED** | Send the remainder of §5 and any subsequent sections. |

---

## 6. Actions taken under this register

### 6.1 What was done

Only one class of change was made, and it was already requested by the owner on
2026-10-13: **removing obsolete cPanel deployment artifacts and one foreign-project
archive from the repository working tree.** Full list, per-file reasons and the
dependants that were updated: [`docs/DEPLOYMENT-ARTIFACT-CLEANUP-2026-10-13.md`](DEPLOYMENT-ARTIFACT-CLEANUP-2026-10-13.md).

This is **consistent with §1 and §2** rather than in conflict with them:

* No student record, conversation, document, audit row, mailbox, alias, forwarder
  or DNS record was touched. The cleanup was confined to repository files.
* It *serves* §1's "no credentials in documents" rule: the removed cPanel files
  contained the real cPanel account name, the production database name and
  database user, and absolute server paths. One of them
  (`documentation/CPANEL-DEPLOYMENT-GUIDE.md`) is the file the CI secret-scan
  comment records as having previously leaked a real production database
  password, and another (`public/docs/CPANEL_DEPLOYMENT_GUIDE.md`) was being
  **served publicly** from `public/`.
* Repository **history** was preserved: the files remain recoverable from Git;
  no history was rewritten.
* The Hostinger runtime guide was **renamed, not deleted**, because
  `tests/runtime-standard.test.mjs` asserts against it.

### 6.2 What was deliberately NOT done

| Not done | Reason |
|---|---|
| No deployment, push, merge or release | §1 — requires authorization |
| No DNS, nameserver, mail-routing or certificate change | §1/§3.3 |
| No database migration, reset, seed or bulk update | §1 — no recovery path verified; no production database reachable |
| No credential creation, rotation or storage | §1 |
| No staging environment created | Not authorized; and staging must be separated by domain, DB, credentials, storage prefix and webhook endpoints (§3.7) |
| No mailbox, alias or forwarder created | §4.3 — preserve first, create only after the existing inventory is read |

---

## 7. Consolidated blocker list (each needs an external dashboard)

1. Registrar, authoritative nameservers, DNS provider, renewal date, DNSSEC state, full zone export — §3.1.
2. Complete DNS record inventory including SPF, DKIM and DMARC **exact** values — §3.2, §4.4.
3. Hostinger plan identity and limits: Node version, process count, cron, **persistent disk** — §3.5. (Persistent disk matters: `STORAGE_POOL_C` must point at an absolute persistent path, and private student documents must survive a release.)
4. Hostinger site mapping for apex/`www` and the CRM host — §3.4.
5. Production database host, schema state, backup schedule and **restore test** — §2, §3.8.
6. Mail provider mailbox/alias inventory, then SPF/DKIM/DMARC alignment — §4.1, §4.4.
7. Live provider assets: WhatsApp Business account, phone number id, verified webhook, approved templates; Meta/Facebook Lead Ads; Instagram; SMS sender id — §2.
8. Staging environment (domain, DB, credentials, storage prefix, webhook endpoints) — §3.7.
9. Live verification of TLS, canonical redirects, forms and certificate renewal — §3.6.

Until items 1–4 are read from the authoritative dashboards, **no go-live claim can
be made** — which is what this register's opening line already states.

---

## 8. Verification performed for this register

| Check | Result |
|---|---|
| `node --test tests/runtime-standard.test.mjs` | **5 passed, 0 failed** |
| `vitest run tests/unit/deployment-config.test.ts tests/unit/cron-quarantine.test.ts` | **2 files, 15 tests passed** |
| `tsx scripts/cron-scheduler-policy-check.ts` | **221 passed, 0 failed** |
| `tsx scripts/document-access-policy-check.ts` | **86 passed, 0 failed** |
| `tsx scripts/b2b-access-policy-check.ts` | **94 passed, 0 failed** |
| `tsx scripts/communications-policy-check.ts` | **119 passed, 0 failed** |
| `eslint` (all files changed by this work) | **0 problems** |
| `prisma generate` + `node scripts/verify-prisma-client.mjs` | **533 models** |
| cPanel artifacts remaining in the tree | **0** |

These prove the **repository** is internally consistent. They do **not** prove any
production configuration, and this register does not claim that they do.
