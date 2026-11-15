# 01 — Existing system audit

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Audited commit:** `e9ccd3bded5b5fbff6fe9356ea14aa5171d19669` (`main`, 2026-11-14, merge of PR #59)
**Audit branch:** `arena/780bb927-alo-web-crm-tech`
**Audit date:** 2026-11-15
**Auditor method:** source inspection of the checked-out tree + `git`/`gh` history + test and typecheck execution in a sandbox. No production system was contacted.

---

## 1. Git and delivery state

| Item | Finding |
|---|---|
| Current branch (work) | `arena/780bb927-alo-web-crm-tech`, branched from `e9ccd3bd` |
| `main` HEAD | `e9ccd3bd` — *Merge pull request #59 from tech360-bd/feat/super-admin-ai-command-center* |
| Working tree before this pass | Clean (no uncommitted changes) |
| Recent merged PRs | #59 super-admin AI command centre (2026-11-14), #58 initial project audit docs (2026-11-13), #57 CI repair: MySQL 8 schema drift, integration suites, secret scan (2026-11-13), #56 B2B partnership manager (2026-11-10) |
| Stack | Next.js (App Router) + TypeScript, Prisma + MySQL, ~2,770 `src/**` files |
| Lint | `eslint .` |
| Typecheck | `tsc --noEmit` (requires `prisma generate`, which needs network access to `binaries.prisma.sh`) |
| Unit tests | `vitest run` — 3,715 tests across `tests/unit` |
| Non-vitest suites | `tests/secret-findings.test.mjs`, `tests/deployment-ownership.test.mjs`, `tests/runtime-standard.test.mjs` (`node --test`) |
| E2E | Playwright (`tests/e2e`, `playwright.config.ts`) |

### Deployment: what actually owns production

- `.github/workflows/deploy-production.yml` is **not a deployment mechanism**. It is a
  refusal notice: it runs only on `workflow_dispatch`, echoes
  *"BLOCKED: GitHub Actions owns CI only. Hostinger production configuration must be
  verified separately"* and exits 1.
- `docs/deployment-ownership` tests (`tests/deployment-ownership.test.mjs`) enforce that
  GitHub Actions cannot deploy.
- `vercel.json` contains 17 cron definitions. Whether Vercel or the VPS executes them in
  production is **not verifiable from this repository** — see
  `14-deployment-and-rollback.md`.

**Consequence for this work:** production deployment is **BLOCKED** for this environment.
No claim of deployment is made anywhere in this documentation set.

---

## 2. What already existed before this pass

The repository already contained a substantial Google integration layer, added on branch
`arena/11fdac10-alo-web-crm-tech` (documented in `docs/GOOGLE-STACK-IMPLEMENTATION-REPORT.md`).
This audit re-verified those modules at `e9ccd3bd` rather than assuming them:

| Area | Real location | Verified state at `e9ccd3bd` |
|---|---|---|
| Google config / tag-loader arbitration | `src/lib/google/config.ts` | Real, pure, unit-tested. Single source of truth for environment gating, placeholder-ID rejection, FREE/FREE_TIER/PAID classification |
| Shared OAuth (service account JWT + refresh token, per-scope cache, 401 retry) | `src/lib/google/oauth.ts` | Real. Token exchange needs a real credential — not exercised here |
| Tag loader (GTM *or* gtag.js, never both) + Consent Mode v2 bootstrap | `src/components/analytics/GoogleTags.tsx`, mounted in `src/app/layout.tsx` | Real, server component, renders nothing outside production |
| Consent banner | `src/components/analytics/ConsentBanner.tsx` | Real, revocable, clears identity on reject |
| Page-view ownership + route-derived events | `src/components/analytics/AnalyticsPageView.tsx`, `src/lib/analytics/{events,page-context,visitor,client}.ts` | Real; 111 unit tests |
| Contact-click tracking (WhatsApp / tel / mailto) | `src/components/analytics/AnalyticsClickTracker.tsx` | Real, one delegated listener |
| Event allowlist + three-layer PII screen | `src/lib/analytics/events.ts` | Real, unit-tested |
| Server-side conversions (GA4 Measurement Protocol) | `src/lib/analytics/server-conversions.ts` | Real; environment-gated; NOT_CONFIGURED honesty |
| Search Console API client + endpoints | `src/lib/seo/search-console-client.ts`, `src/app/api/seo/search-console/{status,performance,sitemaps,ingest}` | Real; needs a credential |
| Business Profile outbound client + read endpoint | `src/lib/google/business-profile.ts`, `src/app/api/google/business-profile` | Real; needs a credential |
| Business Profile inbound webhook | `src/app/api/marketing/webhooks/google-business/route.ts` | Real, `timingSafeEqual`, fails closed in production |
| YouTube privacy-enhanced embed | `src/components/website/YouTubeEmbed.tsx` | Real component |
| Lead attribution capture / first-touch merge / persistence | `src/lib/attribution/lead-attribution.ts`, `src/lib/analytics/attribution-payload.ts` | Real, 24 unit tests; wired into 5 lead-intake routes |
| Conversion funnel (CRM, not GA4) | `src/lib/analytics/conversion-funnel.ts`, `src/app/api/analytics/conversion-funnel` | Real engine; route needs a populated DB |
| Aggregate status endpoint | `src/app/api/google/status/route.ts` | Real; live checks need a credential |
| Admin module | `src/app/admin/google-stack/page.tsx` | Real; not exercised in a browser here |
| robots.txt / sitemap.xml | `src/app/robots.ts`, `src/app/sitemap.ts` | Real (see `06-search-console-implementation.md`) |
| Maps deep links (zero cost) | `global-offices`, `PublicFooter`, `public-contact` | Real; no API key involved |
| Org JSON-LD | `src/lib/seo/schema-helpers.ts` rendered in `src/app/layout.tsx` | Real |

## 3. Gaps found by this audit (and what was done about it)

| # | Gap | Evidence | Resolution in this pass |
|---|---|---|---|
| G1 | **GA4 Analytics Data API absent.** No reporting-read client at all, so "clicks/sessions/source/landing-page" data could not exist, and the connection list in the specification had no `Analytics Data API` entry. | `grep -ri "analytics-data\|analyticsData" src` → only YouTube Data API hits | **Implemented** — `src/lib/google/analytics-data.ts`, `GET /api/google/analytics/report`, admin panel, status entry, `GA4_PROPERTY_ID` env docs |
| G2 | **`pte_page_view` and `toefl_page_view` missing from the vocabulary**, and no route could produce them. Worse: every `/language-prep/*` page was classified `english_test`, and the derivation treated `english_test` as IELTS — so PTE and TOEFL traffic was silently counted as IELTS. | `ANALYTICS_EVENT_NAMES` had no pte/toefl entry; `pageViewEventsFor` pushed `ielts_page_view` for `type === 'english_test'` | **Fixed** — PTE/TOEFL page types + events; IELTS no longer claims them; 2 pre-existing tests that encoded the defect were corrected with an explanatory comment |
| G3 | **`country_page_view` / `destination_page_view` missing.** Country traffic was only visible as `page_view` with `page_type=country`. | vocabulary grep | **Implemented** — country detail → `country_page_view`, `/destinations` index → `destination_page_view` |
| G4 | **`page_scroll` missing entirely.** A required event with no implementation anywhere. | vocabulary grep | **Implemented** — `src/components/analytics/AnalyticsScrollTracker.tsx` (25/50/75/90, once per path, rAF-throttled, passive), mounted in the root layout |
| G5 | **`document_upload_completed` and `application_status_changed` missing** from the vocabulary and from every route. | vocabulary grep | **Implemented** — `src/lib/analytics/application-events.ts` + emits in the student upload route, the staff application-document route and the application stage-transition route |
| G6 | **`english_test_complete` declared but never emitted.** | only definition sites, no emit site | **Implemented at the one real completion signal** — recording an English test outcome against a student profile (`POST /api/student-portal/profile/sections`). Honest scope limit recorded in `04-ga4-implementation.md`: an ALO English Test finished on the external test platform is not observable from this application |
| G7 | **The eight `google.*` RBAC permissions did not exist.** The specification requires `google.integrations.view/manage`, `google.analytics.view`, `google.search_console.view`, `google.maps.manage`, `google.youtube.manage`, `google.billing.view`, `google.audit.view`. | `grep -rn "google\." src/lib/permissions.ts` → nothing | **Implemented** — new `google` permission module in `src/lib/permissions.ts` (super_admin inherits the whole catalogue; `marketing_manager` gets the three read permissions) + `src/lib/google/access.ts` |
| G8 | **No documentation set at the required paths** (`docs/google-free-stack/01…15`). Prior knowledge lived in three loose documents. | directory absent | **Implemented** — this 15-file set |
| G9 | Analytics Data API and Google Online Indexing (`web-vitals`) reporting still require a credential/decision | see G1, `04`/`06` | Reporting is `BLOCKED` on a credential, deliberately not faked |

## 4. Deliberately not changed

Rules from the brief that were honoured, with the mechanical reason:

- **No rebuild, no replacement CRM, no duplicate database.** Every change is additive in the
  existing module or a one-line call added to an existing route. No new Prisma model, no new
  table, no migration in this pass.
- **No existing environment variable overwritten.** `GA4_PROPERTY_ID` was *added* to
  `.env.example` with commentary; nothing was renamed or removed.
- **No paid dependency introduced.** The one new service surface (Analytics Data API) is
  classified `FREE` with no billing account.
- **No credential, key or token added to the repository.** See `11-security-and-rbac.md` for
  the scan that proves it.
- **No fake integration.** Every new endpoint returns `NOT_CONFIGURED` when unconfigured,
  and the tests assert that no network call is attempted in that state.

## 5. Verification performed in this environment

| Check | Command | Result |
|---|---|---|
| Dependencies | `npm ci` | 1,282 packages, clean |
| Unit tests (whole `tests/unit`) | `npx vitest run tests/unit` | 3688 pass / **27 fail** — baseline captured by stashing this pass's changes: **the identical 27 failures exist at `HEAD`**, in 13 files none of which this pass touched (Prisma-client-dependent suites plus pre-existing design-token guards) |
| New tests | `npx vitest run tests/unit/google-analytics-data-api.test.ts` | 29/29 pass |
| Existing Google tests | `npx vitest run tests/unit/google-stack.test.ts` | 111/111 pass |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=7000 npx tsc --noEmit` | 104 pre-existing errors, **0 in any file this pass touched** (see `13-testing-and-verification.md`) |
| Lint | `npx eslint <changed files>` | 0 problems |
| Secret scan | `node --test tests/secret-findings.test.mjs …` | 25/25 pass; manual pattern scan of changed files clean |
| `prisma generate` | n/a | **BLOCKED** — `binaries.prisma.sh` unreachable from this sandbox |
| Production build | `npm run build` | **BLOCKED** — requires `prisma generate` |

The distinction between "compiles in this sandbox" and "observed working against Google" is
maintained throughout. Nothing in this documentation set claims the latter.
