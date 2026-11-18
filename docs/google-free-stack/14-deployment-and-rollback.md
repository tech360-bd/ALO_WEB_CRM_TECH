# 14 — Deployment and rollback

**This pass deployed nothing.** Production deployment is not available from this environment,
and the repository is designed that way on purpose.

---

## 1. Where production actually lives

| Fact | Evidence |
|---|---|
| GitHub Actions **cannot** deploy to production | `.github/workflows/deploy-production.yml` is a refusal notice: it only runs on `workflow_dispatch`, prints *"BLOCKED: GitHub Actions owns CI only. Hostinger production configuration must be verified separately. No deployment or recovery performed."*, and exits 1 |
| The same rule is enforced by a test | `tests/deployment-ownership.test.mjs` |
| Production hosting is **Hostinger** | the notice above, `README_DEPLOYMENT.md`, `alo-vps-deploy.sh`, `docs/DEPLOYMENT.md`, `VPS_PRODUCTION_AUDIT_*.md` |
| Cron definitions exist in `vercel.json` | 17 entries — whether Vercel or the VPS executes them in production is **not determinable from this repository**, and nobody should assume either way without checking the live host |
| `main` HEAD at the time of this audit | `e9ccd3bd` (merge of PR #59, 2026-11-14) |
| Whether that commit is what is deployed | **UNKNOWN.** The specification explicitly forbids assuming the latest commit is deployed, and this audit cannot verify it |

**Therefore:** deployment is `BLOCKED` for this environment. The correct next step is a human
running the procedure in §4 on the actual host.

## 2. Branch and commit state of this work

| Item | Value |
|---|---|
| Work branch | `arena/780bb927-alo-web-crm-tech` |
| Branched from | `e9ccd3bded5b5fbff6fe9356ea14aa5171d19669` |
| Commits in this pass | see `15-final-implementation-report.md` §12 |
| Files added | 6 source/test files + this 15-document set |
| Files modified | 10 (5 API routes, 1 layout, 2 libraries, 1 permission catalogue, 1 test file, `.env.example`) |
| Database migrations | **NONE** — no schema change, so no migration and no backup obligation from this pass |
| New environment variables | **ONE**, optional: `GA4_PROPERTY_ID` (documented in `.env.example`). Absent ⇒ reporting reports `NOT_CONFIGURED`; nothing breaks |

## 3. Pre-merge gates — status for this pass

| Gate (from the specification) | Required | Result here |
|---|---|---|
| Existing lint | ✅ | **PASS** — `eslint` clean on every changed file |
| TypeScript checks | ✅ | **PASS for this pass's code** — 0 errors in touched files; 104 pre-existing remain (see `13` §3) |
| Unit tests | ✅ | **PASS** — new 29/29; existing 111/111; whole-suite failures identical to the pre-existing baseline |
| Integration tests | ✅ | **NOT RUN** — `npm run test:integration` needs a database |
| Validate Prisma | ✅ | **BLOCKED** — `prisma generate`/`validate` cannot download the engine here |
| Validate migrations | ✅ | **N/A** — no migration in this pass |
| Production build | ✅ | **BLOCKED** — `next build` requires `prisma generate` |
| Secret scan | ✅ | **PASS** — 25/25 node tests + manual pattern scan clean |
| Review database changes | ✅ | **N/A** — none |
| Verify environment configuration | ✅ | **PASS** — added variable documented; nothing overwritten |

**Honest conclusion: the full gate set has NOT passed in this environment.** Two gates
(integration tests, production build) and one validator cannot run without a database and
Prisma engine. Merging is therefore a decision for a human with a working CI/staging
environment, not something this pass can authorise.

## 4. Deployment procedure (for the human operator)

### 4.1 Pre-flight

```bash
# 1. Confirm what is actually deployed RIGHT NOW (do not assume)
ssh <host> 'cd <app-dir> && git rev-parse HEAD && pm2 list'   # or the host's equivalent

# 2. Confirm the source you are about to deploy
git log --oneline -1
git status --porcelain          # must be clean

# 3. Back up configuration and database BEFORE anything
cp .env .env.backup.$(date +%F-%H%M)
mysqldump --single-transaction --routines --triggers <db> > backup-$(date +%F-%H%M).sql
ls -lh backup-*.sql             # verify non-empty and plausible size
```

### 4.2 Build and migrate

```bash
npm ci                          # lockfile-exact
npx prisma generate
npx prisma migrate deploy       # NOT `migrate dev` — dev can reset
npm run build                   # must exit 0; do not deploy a failed build
```

There are **no new migrations in this pass**, so `migrate deploy` should be a no-op. If it
reports a migration to apply, stop and investigate — it means the deployed schema is behind.

### 4.3 Environment

Add only if GA4 reporting is wanted:

```
GA4_PROPERTY_ID=<numeric property id>
```

Nothing else is required by this pass. `GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`,
`GOOGLE_SEARCH_CONSOLE_*` are unchanged existing variables — do not overwrite them.

### 4.4 Restart and verify

```bash
pm2 restart <app> --update-env   # or the host's process manager
curl -sfI https://aloeducation.com/ | head -1        # expect 200
```

Then run the verification in §5.

## 5. Post-deployment verification (record the output of each)

| # | Check | Expected |
|---|---|---|
| 1 | `GET /` | 200, page renders, no new console errors |
| 2 | `GET /destinations/uk` | 200 |
| 3 | `GET /course/<a real slug>` | 200 |
| 4 | `GET /sitemap.xml` | 200, valid XML, non-empty `<urlset>` |
| 5 | `GET /robots.txt` | 200, contains `Disallow: /admin/` and the other internal paths |
| 6 | View source | exactly **one** tag loader (GTM `gtm.js` **or** `gtag/js`, never both) |
| 7 | View source | consent defaults appear **before** the Google library in execution order |
| 8 | `GET /api/google/status` (staff session) | JSON; each service states `configured`, `status`, `costTier`; `costSummary.paidServicesInUse` is `[]` |
| 9 | `GET /api/google/status?live=true` | the services with credentials show `liveVerified: true`; the rest say `NOT_CONFIGURED` with a reason |
| 10 | `GET /api/google/analytics/report?preset=acquisition` | `status: READY` with rows, or `NOT_CONFIGURED` with a reason (never zeroes presented as data) |
| 11 | `/admin/google-stack` (staff) | page renders; load the GA4 acquisition report; Search Console and Business Profile panels show their real state |
| 12 | Submit a test lead in a private window | row created; attribution columns populated when the URL carried a UTM |
| 13 | GA4 DebugView | `page_view`, `page_scroll`, `country_page_view` arrive; exactly one `page_view` per navigation |
| 14 | GA4 DebugView | `/language-prep/pte-academic` produces `pte_page_view`, **not** `ielts_page_view` |
| 15 | Decline consent, then browse | no request to `google-analytics.com` / `analytics.google.com` in the Network tab |
| 16 | Move an application stage | `application_status_changed` appears (Measurement Protocol), and the CRM stage actually changed |
| 17 | Upload a student document | `document_upload_completed` with `upload_kind`, no file name; the document is stored privately |

Any check that cannot be run yet must be recorded as `BLOCKED`, not assumed to pass.

## 6. Rollback

### 6.1 Code

```bash
git checkout <previous-known-good-commit>   # the SHA recorded in §4.1 step 1
npm ci && npx prisma generate && npm run build
pm2 restart <app>
```

### 6.2 Database

No migration was added by this pass, so **no schema rollback is required**. For any future
migration, restore from the `mysqldump` taken in §4.1 — never attempt a hand-written down
migration on production data.

### 6.3 Environment

```bash
cp .env.backup.<timestamp> .env && pm2 restart <app> --update-env
```

### 6.4 Analytics-specific rollback (fastest, no deploy)

| Symptom | One-line mitigation | Effect |
|---|---|---|
| Bad data reaching GA4 | Set `NEXT_PUBLIC_GA4_ENABLED=false` (if gtag.js is the loader) **or** `NEXT_PUBLIC_GTM_ENABLED=false` (if GTM is) | Stops tag injection; the site is unchanged |
| Server conversions misfiring | Remove `GA4_API_SECRET` | `sendServerEvent` returns `NOT_CONFIGURED`; nothing is sent |
| Reporting endpoint misbehaving | Unset `GA4_PROPERTY_ID` | Reporting reports `NOT_CONFIGURED`; tag collection continues |
| A GTM tag misfires | In GTM, publish the previous container version | Container-level revert, no deploy |

Note the asymmetry that makes this safe: **turning analytics off cannot break the website**,
because no Google call sits on a render path.

### 6.5 What must NOT be done in a rollback

- Do not `prisma migrate reset` on production.
- Do not delete releases, backups or logs.
- Do not remove environment variables you did not add.
- Do not revert `src/app/robots.ts` to a version that leaves staff portals crawlable.

## 7. Status

| Item | Status |
|---|---|
| Deployment performed | **BLOCKED** — no host access, and Actions is designed not to deploy |
| Pre-merge gates fully passed | **BLOCKED** — build + integration tests need Prisma engine + DB |
| Rollback plan | **PASS** — documented with a no-deploy analytics kill switch |
| Database backup requirement from this pass | **NONE** — no schema change |
| Production verification | **BLOCKED** — must be executed by the operator using §5 |
