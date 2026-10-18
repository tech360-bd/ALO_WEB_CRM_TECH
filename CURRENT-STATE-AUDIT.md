# CURRENT-STATE-AUDIT — ALO Education Web CRM

Audit date: **2026-10-18**
Auditor: Arena agent session, branch `arena/ef31f574-alo-web-crm-tech`
Base commit: `ef7fb8b2b50e9f4cba01645a7588e3c198b31474` (`main`)

---

## 0. How to read this document

Every claim below is either (a) the output of a command run in this session, or
(b) a file path you can open. Where something could **not** be verified here, it
says so explicitly and is marked **UNVERIFIED**. Nothing in this document claims
a production service is live.

### What this audit environment had

| Capability | Status | Evidence |
|---|---|---|
| Repository checkout | Available | `/home/user/ALO_WEB_CRM_TECH` |
| `npm ci` | Available | `added 1198 packages in 37s` |
| Prisma client generation | Available (see §1.3) | `Verified generated Prisma client: 533 models` |
| Unit test suite | Runnable | 2087 tests, 0 failures |
| Full TypeScript typecheck | Runnable (needed swap) | `TSC_EXIT=0` |
| ESLint | Runnable | exit 0, no output |
| **MySQL server** | **NOT available** | `which mysql mysqld` → empty |
| **Production / Hostinger access** | **NOT available** | no credentials supplied |
| **Outbound internet** | **Allow-listed only** | github.com, npmjs.org, pypi.org only |
| **EBN DNS / email infra** | **NOT available** | out of scope of this sandbox |

**Consequence:** no live WhatsApp, Meta, Google, YouTube or ALO Labs call was or
could be made from this environment. Every integration status below describes
**code state**, not runtime state.

---

## 1. Repository shape (measured)

```
git ls-files | wc -l                       → 67,767 tracked files
find src/app/api -name route.ts | wc -l    → 911 API route files
find src/app -name page.tsx | wc -l        → 413 page routes
grep -c '^model ' prisma/schema.prisma     → 533 Prisma models
find tests -name '*.test.*' | wc -l        → 201 test files
wc -c prisma/schema.prisma                 → 433,850 bytes
```

Of the 67,767 tracked files, **58,758 are vendored `node_modules`** committed
under `imports/alo-education-full/node_modules`:

```
git ls-files 'imports/alo-education-full/node_modules' | wc -l → 58,758
```

That is 86.7% of the repository. The CI secret scanner explicitly excludes this
tree (`.github/workflows/ci.yml`, documented inline) and states the residual risk
in writing. This is a real, acknowledged exposure, not a new finding, and
untracking it is a separate decision.

### 1.1 Stack

From `package.json`:

| Concern | Implementation | Version |
|---|---|---|
| Framework | Next.js (App Router) | `16.4.0` |
| Runtime | Node | `22.x` (asserted by `scripts/assert-node22.cjs`) |
| ORM | Prisma | `6.19.3` |
| Production database | MySQL | `mysql2 ^3.24.4`, `provider = "mysql"` |
| Auth | next-auth v4 | `^4.24.11` |
| Test runner | Vitest | `4.1.11` |
| E2E | Playwright | `^1.62.0` |
| Crypto | node:crypto (AES-256-GCM), `jose`, `bcryptjs` | — |

### 1.2 Deployment ownership

`.github/workflows/deploy-production.yml` is **not** a deployment mechanism. Its
only job is a refusal:

```yaml
name: Production deployment disabled — Hostinger owned
...
      - name: Refuse production changes from GitHub Actions
        run: |
          echo "BLOCKED: GitHub Actions owns CI only. ..."
          exit 1
```

`.github/workflows/ci.yml` states the same: *"This workflow NEVER deploys.
Hostinger production branch mapping is external and must be verified
separately."*

**Implication for this engagement:** deployment to Hostinger cannot be performed
or verified from this repository, and no agent should claim otherwise.

### 1.3 Sandbox constraint encountered (worth recording)

`prisma generate` normally downloads engine binaries from `binaries.prisma.sh`,
which is **not** reachable from this sandbox. The engines were recovered from the
vendored tree after confirming an exact version match:

```
installed @prisma/engines-version → 7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7
vendored  @prisma/engines-version → 7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7   (identical)
```

then wired via Prisma's documented custom-binary variables:

```
PRISMA_QUERY_ENGINE_LIBRARY=<repo>/imports/alo-education-full/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node
PRISMA_SCHEMA_ENGINE_BINARY=<repo>/imports/alo-education-full/node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
```

**`prisma/schema.prisma` was temporarily reduced to `binaryTargets = ["native"]`
to attempt this, then restored byte-identical** (`md5sum -c` → `OK`; full
5-target list confirmed present). No committed file carries that change.

A full `tsc --noEmit` was **OOM-killed** at first (`TSC_EXIT=137`, `Killed`) on
this host's 3.8 GiB RAM. CI documents the same need and provisions 8 GiB of
swap. After provisioning 6 GiB of swap locally, the full typecheck completed with
`TSC_EXIT=0`.

---

## 2. Verification results (this session)

### 2.1 Baseline, before any edit

```
Test Files  186 passed | 6 skipped (192)
     Tests  2008 passed | 72 skipped (2080)
  Duration  43.42s
```

`npm run audit:env -- --check` → `✓ environment classification is up to date`

The baseline was **green**. No pre-existing test failures were inherited.

### 2.2 After the changes in this branch

```
Test Files  191 passed | 7 skipped (198)
     Tests  2087 passed | 75 skipped (2162)
  Duration  43.74s
```

| Check | Command | Result |
|---|---|---|
| Unit + integration suite | `npx vitest run` | **2087 passed, 0 failed** |
| Full typecheck (911 routes) | `npx tsc --noEmit` | **exit 0** |
| Lint | `npm run lint` | **exit 0**, no findings |
| Prisma client | `npm run db:verify-client` | **533 models verified** |
| Env contract | `npm run audit:env -- --check` | **up to date** |
| Schema/migrations | `git diff HEAD -- prisma/` | **empty — no changes** |

Delta: **+5 test files, +79 passing tests, 0 regressions.**

### 2.3 What the "skipped" tests mean

The 75 skipped tests are the DB-integration suites. They self-skip because
`TEST_DATABASE_URL` is unset here (no MySQL). They are **not** passing. In CI
they run for real against the `mysql:8.4` service declared in
`.github/workflows/ci.yml`. The skipped set includes the new
`tests/integration/whatsapp-student-journey.test.ts`.

---

## 3. Findings

Severity: **HIGH** = exploitable or data-corrupting; **MED** = correctness or
maintainability; **LOW** = hygiene.

### F-01 — HIGH (fixed): Student IDs were generated by `COUNT(*) + 1`

**File:** `src/app/api/crm/leads/counselling/route.ts` (was line 140)

```ts
const year = now.getFullYear();
const seq = (await tx.student.count({ where: { studentId: { startsWith: `AE-${year}` } } })) + 1;
const studentCode = `AE-${year}${String(seq).padStart(6, '0')}`;
```

Two defects in one statement:

1. **Duplicate identifiers under concurrency.** `Student.studentId` is `@unique`,
   so two simultaneous counsellor submissions for different people both compute
   the same `seq` and one insert fails with `P2002`. Worse, `Student.email` and
   `Student.phone` carry **no** unique index (`String @default("")`), so the
   surrounding find-then-create is also a check-then-act race that can insert two
   rows for one person.
2. **Format divergence.** This produced `AE-2026` + **6** digits
   (`AE-2026000001`). Every other writer uses the canonical
   `AE-2026` + **5** digits (`AE-202600001`) from
   `formatIdentifier()` in `src/lib/identity/student-id.ts`. The repository
   already contained a correct, atomically-safe allocator —
   `allocateIdentifier()` — used by `src/app/api/portal-auth/register/route.ts`
   and `src/app/api/admin/import-center/route.ts`, and covered by 8 unit tests.
   This route simply did not use it.

**Fix applied:** the route now calls `allocateIdentifier(tx, 'AE')` inside the
same transaction, and serializes the find-or-create on a MySQL advisory lock
keyed by the normalized natural key
(`src/lib/identity/student-create-lock.ts`). No unique index was added — that
would be a destructive migration against a table that may already hold
duplicates, which is out of bounds without a verified backup and approval.

> **Behaviour change to note:** newly created students from this route now get
> the canonical 5-digit format. Any pre-existing 6-digit `AE-` values remain
> valid and unique; `studentId` is an opaque identifier. No data was rewritten.

### F-02 — HIGH (fixed): Facebook page tokens and app secret stored in plaintext

**File:** `src/app/api/facebook/callback/route.ts`

The OAuth callback wrote `pageAccessToken`, `appSecret` and `verifyToken`
straight into `FacebookIntegration` with no encryption. A single SQL read, a
leaked backup, or a read-only replica would expose every connected page's
credentials.

Meanwhile the repository shipped **two** AES-256-GCM implementations —
`src/lib/token-encryption.ts` (hex encoding, used only by
`src/lib/vaultwarden-client.ts`) and `src/lib/social/token-encryption.ts`
(base64 encoding, imported by **no source file at all** — verified by grep
across `src/`, `tests/`, `scripts/`). The capability existed and was unused.

**Fix applied:** `src/lib/social/token-encryption.ts` is now a thin adapter over
the single canonical module (removing the duplicate), exposing
`encryptStoredToken` / `decryptStoredToken` / `isEncrypted`. The callback
encrypts before write; the three readers in `src/app/api/facebook/webhook/route.ts`
(lines 27, 112, 246) decrypt on read. `decryptStoredToken` passes legacy
plaintext rows through, so already-connected pages keep working, and returns `''`
— never the ciphertext — when the key has rotated.

### F-03 — HIGH (fixed): OAuth callback accepted unsigned `state` and allowed open redirect

**Files:** `src/app/api/facebook/auth/route.ts`, `src/app/api/facebook/callback/route.ts`

`/api/facebook/auth` built `state` as a plain `base64url` blob. The callback only
*decoded* it — it never verified the server had issued it:

```ts
if (state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (decoded.returnTo) returnTo = decoded.returnTo;
  } catch {}
}
const redirectUrl = `${returnTo}?fb_connected=${savedPages.length}`;
return NextResponse.redirect(new URL(redirectUrl, req.url));
```

Two vulnerabilities:

- **Connection CSRF** — an attacker chooses `state`, so a victim's browser can
  complete an OAuth exchange the attacker crafted.
- **Open redirect** — `new URL("https://evil.example", req.url)` resolves
  absolutely. The callback therefore redirected users off-site, carrying the
  trust of a just-completed successful connection. Ideal phishing hop.

**Fix applied:** `src/lib/social/oauth-state.ts` issues an HMAC-SHA256-signed,
10-minute-expiring, provider-bound state, and `safeReturnTo()` constrains the
target to a same-origin absolute path (rejecting `//host`, `/\host`, schemes,
control characters, and >512 chars). The callback verifies **before** exchanging
the code and returns `403` on any failure.

The signing key is `NEXTAUTH_SECRET` (already production-required) with
`AUTH_SECRET` as alias. It **fails closed in every environment** — deliberately
no dev fallback, both because a predictable signing key is forgeable and because
every other `NEXTAUTH_SECRET` consumer in this repo fails closed. This keeps the
documented classification of `NEXTAUTH_SECRET` at `REFERENCED_FAIL_CLOSED`.

### F-04 — HIGH (implemented, daemon pending): no malware scanning on document ingestion

A repository-wide search for antivirus capability found **nothing**:

```
grep -rln "clamav|ClamAV|virus|malware|EICAR" --include=*.ts --include=*.tsx src/ scripts/ .github/
  → src/components/alo/views/public-cookie.tsx
  → src/components/alo/views/public-terms.tsx        (legal prose only)
```

Student documents arrive from untrusted senders (WhatsApp attachments, portal
uploads, upload-on-behalf) and were written to private storage after only
magic-byte MIME validation.

**Implemented:** `src/lib/documents/malware-scan.ts` — a built-in signature layer
(always runs, catches EICAR plus MZ/ELF/PowerShell/macro markers) and a ClamAV
`clamd` INSTREAM client (used when `CLAMAV_HOST` is set). Wired into both
ingestion paths **before** `storePrivateFile`:

| Endpoint | File | On infected | On unscannable |
|---|---|---|---|
| `POST /api/crm/ucc/documents/upload` | `src/app/api/crm/ucc/documents/upload/route.ts` | `400` + threat name | `503` |
| `POST /api/documents` | `src/app/api/documents/route.ts` | `400` + threat name | `503` |

`POST /api/marketing/whatsapp-doc-upload` inherits this automatically — it is a
re-export of the UCC route.

Production **fails closed**: an unreachable scanner rejects the upload rather
than storing an unscanned document. Outside production it returns an explicit
`unavailable` verdict so local development is not blocked.

> **Open gap, stated plainly:** the scan verdict is **not persisted**. Upload
> routes already write `AuditLog` / `TimelineEvent` rows, but the verdict itself
> is not recorded, so "was this file scanned, by which engine, with what result"
> cannot be answered from the database after the fact. Adding a verdict column or
> an audit row is the natural next step and is deliberately **not** done here,
> because it requires a schema change.

### F-05 — MED (documented, not fixed): `@ts-nocheck` on the primary WhatsApp webhook

`src/app/api/whatsapp/webhook/route.ts` — 1,077 lines — begins with:

```ts
// @ts-nocheck - Complex webhook with Prisma stub issues, requires generated-client verification in Node 22 CI
```

The single most security-sensitive inbound surface in the system is excluded from
type checking. Repository-wide: **8 files** carry `@ts-nocheck`, **4** of them
API routes. Removing them is real work and is not attempted here; it is recorded
so it is not mistaken for a green typecheck covering this file. The
`TSC_EXIT=0` result in §2.2 **does not cover this file**.

### F-06 — MED: ALO Labs AI has no integration surface at all

```
grep -rln "ALO_LABS|alo-labs|aloLabs|ALO LABS" .  (excluding node_modules) → no matches
```

There is no client, no endpoint, no configuration variable, and no queue binding.
Task 7 cannot be completed without the ALO Labs API contract and credentials.
See `AI-AGENT-INTEGRATION.md`.

### F-07 — MED: three of five requested social platforms have no server-side OAuth

| Platform | Env vars declared | Server-side OAuth | Verdict |
|---|---|---|---|
| Facebook | `FACEBOOK_APP_ID/SECRET/REDIRECT_URI/VERIFY_TOKEN` | Yes — `auth` + `callback` | Implemented |
| WhatsApp | `WHATSAPP_*` (11 vars) | n/a (token-based Cloud API) | Implemented |
| Instagram | `INSTAGRAM_ACCESS_TOKEN/APP_ID/APP_SECRET` | **No** | Missing |
| Google Ads | **none** | **No** | Missing |
| YouTube | `YOUTUBE_CLIENT_ID/SECRET` | **No** | Missing |

`GOOGLE_ADS` appears only inside a UI component
(`src/components/marketing/hub/AdvertisingManagerView.tsx`); `YOUTUBE` only in
`src/app/admin/settings/digital-assets/page.tsx`. Env-var presence is not
integration. See `SOCIAL-API-CONNECTIONS.md`.

### F-08 — LOW: `SocialConnectedAccount.tokenRef` is a free-text reference

`src/lib/social/token-encryption.ts` documents intent (*"encrypted
ConnectedAccount columns"*) but `SocialConnectedAccount` stores only
`tokenRef String @default("")`. Where the referenced secret actually lives is not
enforced by the schema. Flagged for the credential-management work in
`INTEGRATION-MAP.md`.

---

## 4. Constraints honoured

| Constraint | Status | Evidence |
|---|---|---|
| Preserve Hostinger site, CRM, EBN DNS, email | **Honoured** | no infra, DNS, MX or hosting file touched |
| Audit before editing | **Honoured** | this document; §2.1 baseline captured first |
| Reuse, don't duplicate | **Honoured** | reused `allocateIdentifier`; *removed* a duplicate crypto impl (F-02) |
| Never expose credentials/tokens/documents | **Improved** | F-02, F-03 fixed; no secret value appears in any deliverable |
| No destructive migrations without backup + approval | **Honoured** | `git diff HEAD -- prisma/` is **empty**; zero migrations added |
| Do not change EBN nameservers / MX / unrelated VPS apps | **Honoured** | not touched; no such access exists here |
| Work on a feature branch, open a PR | **Done** | branch `arena/ef31f574-alo-web-crm-tech` |

---

## 5. Explicitly NOT verified

Stated so no one reads silence as assurance.

- **No production smoke test.** No production URL was called. `PRODUCTION-VERIFICATION.md`
  records what CI proves and what only Hostinger can.
- **No live provider call.** No WhatsApp, Meta, Google, YouTube or ALO Labs
  request was made. Outbound network is allow-listed to github.com, npmjs.org and
  pypi.org.
- **No real-MySQL concurrency proof locally.** `GET_LOCK` and `LAST_INSERT_ID`
  behaviour is modelled in unit tests; the real proof is
  `tests/integration/whatsapp-student-journey.test.ts`, which requires the CI
  MySQL service.
- **No ClamAV daemon exercised.** The INSTREAM client is tested against a
  purpose-built fake clamd speaking the real protocol; no genuine clamd was
  available.
- **Backup status unknown.** No backup was inspected, created or verified. Any
  deployment must confirm this independently.
