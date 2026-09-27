# ALO Education production audit — 2026-09-21

Status: implementation and repository-level verification completed for the reachable scope; live production and third-party runtime verification remain explicitly separated below.

## Executive result

| Area | Result | Evidence / limitation |
|---|---|---|
| Type safety | PARTIAL | The application code typecheck passed earlier with the generated Prisma client; latest rerun is blocked only by the sandbox's missing generated Prisma exports (`PrismaClient`/`Prisma`) after `npm ci --ignore-scripts`. `prisma generate` cannot download its engine because the TLS connection to `binaries.prisma.sh` is disconnected. |
| Lint | PASS | `npm run lint` passed. |
| Unit/integration regression suite | PARTIAL | Latest `npm test`: 24 files passed with 259 tests passing; the consultation integration suite could not load because Prisma client generation is unavailable in this sandbox (`Cannot find module '.prisma/client/default'`). Earlier runs with the generated client passed 23 files/255 tests, with 7 intentionally skipped integration tests. |
| Focused security/tool-loop suite | PASS | Five focused files passed 41 tests, including API authz, proxy policy, payroll maker/checker, security hardening, and bounded tool-loop behavior. |
| Patch hygiene | PASS | `git diff --check` passed. |
| Production build | NOT VERIFIED | `npm run build` could not run `prisma generate`: Prisma engine checksum download failed because the sandbox TLS connection to `binaries.prisma.sh` was disconnected. A direct `next build --webpack` was subsequently killed by the sandbox worker (`SIGKILL`), so no successful production artifact is claimed. |
| Local browser/page smoke | PARTIAL | Dev server returned HTTP 200 for `/`, `/about`, `/contact`, `/student/login`, `/employee/login`, and `/admin/marketing-automation`. `/courses` was missing before the compatibility route was added; `src/app/courses/page.tsx` now redirects it to `/course-finder`. Interactive browser, keyboard, mobile, and authenticated flows were not fully executable in this environment. |
| Local API smoke | NOT VERIFIED | `/api/health`, `/api/faqs`, `/api/students`, `/api/course-finder/saved`, and `/api/knowledge-center/training` returned 500 locally because the checked-out `@prisma/client` had not been generated and the Prisma engine could not be downloaded. This is an environment/toolchain block, not evidence of a production response. |
| Live production server, SSH, PM2, database, deployment and rollback | NOT VERIFIED | No production credentials or server connection was used. The supplied target remains `server.aloeducation.com`, `115.187.18.239`, SSH `57813`, app port `3044`, PM2 `alo-education`, deploy directory `/root/alo-github-main`; these must be verified by an authorized operator. |
| DNS/SSL | NOT VERIFIED | No authoritative nameserver or certificate inspection was performed. Preserve the supplied ED25519 fingerprint unless fresh authorized evidence proves a change. |
| External supplied links | PARTIAL | All 91 normalized GitHub repository URLs were checked and recorded in `AUDIT/external-repository-review-2026-09-21.md` (88 HTTP 200, 3 HTTP 404). Non-GitHub pages and YouTube redirect targets were not fetched and remain NOT VERIFIED. |

## Implemented changes

### Authentication, authorization and data ownership

- Hardened the central proxy route policy in `src/proxy.ts`; public routes are explicit and sensitive prefixes default to employee/admin access requirements.
- Added authenticated handler-level protection to Knowledge Center documents, news, search, and training routes. Knowledge writes now use the authenticated author, create pending/draft content, and record the authenticated audit user.
- Added student-resource ownership checks in `src/lib/student-resource-auth.ts` and applied them to course compare, saved courses, shortlist, and eligibility endpoints. Caller-supplied student IDs cannot select another student's records.
- Protected student collection/detail access in `/api/students`, including staff-only collection access and self-only student access.
- Removed client-controlled identity from portal logout and payroll maker identity. Payroll approval now derives the actor from authenticated context, derives the maker from the persisted payroll record (`preparedBy`/`reviewedBy`), blocks missing/duplicate approval states, and requires a permitted finance/admin role; the production role/data semantics still require runtime verification.
- Added/strengthened authentication on storage, employee, review, scholarship, learning-post, FAQ, WhatsApp status, marketing webhook and other sensitive handlers included in the patch.
- Added regression assertions for public FAQ read access versus protected mutation, protected student/course-finder resources, and record-derived payroll maker/checker enforcement.
- Removed PostgreSQL-only Prisma `mode: "insensitive"` filters from MySQL-backed API search paths so search predicates are valid for the configured datasource.

### Portal/session behavior

- Aligned employee, partner and application-manager portal shells with server-authenticated session state rather than trusting stale client-only identity.
- Added login/logout session cleanup and safer auth handling for student and portal authentication routes.
- Preserved legitimate public registration, OTP, consent, review-token, webhook-signature and activation flows as explicit exceptions rather than broadly opening sensitive APIs.

### Marketing, design and external-reference applicability

- Added `src/components/marketing/EditorialFlowDiagram.tsx`: accessible static-first SVG/HTML workflow diagram, semantic labels, responsive connectors, and reduced-motion-safe behavior.
- Added `src/components/marketing/MarketingKitPanel.tsx`: review-ready consultation, IELTS, and visa-readiness kits with channel/objective/audience metadata, copy/hook controls, clipboard and text-download actions, draft-only labeling, and approval checklist.
- Integrated both into `src/app/admin/marketing-automation/page.tsx`.
- Added a backwards-compatible `/courses` entry point that redirects to the searchable `/course-finder` route instead of returning a framework 404.
- Completed a fresh occurrence-preserving audit of the latest supplied link list in `AUDIT/link-completion-matrix-2026-09-27.md`: 161 occurrences, 92 distinct GitHub targets, duplicate/Fetched/Read rows retained, 28 YouTube redirects resolved, and non-GitHub fetch outcomes recorded.
- Added the provider-neutral bounded tool-calling loop from the inspected OpenRouter pattern at `src/lib/ai-tool-loop.ts` with regression tests.
- External projects were used as evidence/reference patterns only. No untrusted plugin, native desktop/mobile application, third-party CRM, media renderer, or incompatible license/runtime was copied wholesale or claimed production-ready.

## Security and production verification matrix

| Check | Status | Required next action if not PASS |
|---|---|---|
| Unauthenticated access to sensitive APIs | PARTIAL/PASS at repository policy level | Run direct HTTP requests against the deployed app for every method and role; capture 401/403 evidence. |
| Cross-student read/write isolation | PASS in code/tests for patched course-finder resources | Run two real student sessions against GET/POST/DELETE combinations and confirm database state. |
| Maker/checker payroll separation | PARTIAL | Verify production role naming (`FINANCE` versus `FINANCE_OFFICER`), persist/derive the maker from the payroll record, and test maker approval rejection and independent checker approval with a backup. |
| Pagination/filter/search/sort and URL state | NOT VERIFIED end-to-end | Test zero, one, exact-boundary, multi-page, page-size, refresh, back/forward, direct URL, combined filter/search/sort, and post-mutation count cases for each list. |
| Forms/buttons/navigation/download/upload | NOT VERIFIED end-to-end | Use an authenticated browser matrix for public, student, employee, partner, counselor, application-manager and admin roles; record every failing control and link. |
| Accessibility/responsive behavior | PARTIAL | Run keyboard-only, focus, screen-reader semantics, reduced-motion, 320/375/768/1024/1440px checks and capture defects. |
| SEO/sitemap/robots/canonical/schema | NOT VERIFIED live | Request every generated sitemap/robots/canonical and validate representative public pages against production host. |
| Integrations, AI agents, queues, cron and webhooks | NOT VERIFIED live | Use sandbox provider credentials/test events; verify signatures, idempotency, retry/dead-letter behavior, approval gates and audit logs. |
| Database integrity/migrations/backups | NOT VERIFIED | Take an authorized backup, inspect current production state, run reversible migration rehearsal, and verify restore before any deployment. |
| DNS, SSL, firewall, proxy and PM2 | NOT VERIFIED | Inspect authoritative DNS (`ns1`/`ns2`), certificate chain, SSH host key, Nginx/Apache/Cloudflare path, PM2 process and port 3044 without changing configuration blindly. |
| Deployment/rollback | NOT VERIFIED | Use the correct SSH authentication, create a release/DB rollback point, deploy to the supplied directory, health-check on 3044, and rehearse rollback. |

## Known warnings that do not invalidate repository tests

- Vitest reports the existing Vite CommonJS/ESM native-config warning.
- Existing deployment tests report the known workflow `3025` versus production `3044` pending manual workflow permission/application; this remains a production deployment item, not silently marked fixed.
- Prisma CLI reports the deprecated `package.json#prisma` configuration and is blocked by the sandbox's unavailable Prisma engine download.

## Evidence boundaries

This report intentionally does not claim that untested production systems work. Live access, the Meta page that returned HTTP 403, production data, DNS/SSL, provider credentials, deployment, rollback, full browser coverage, and the Prisma-blocked consultation integration suite remain `NOT VERIFIED` until authorized runtime evidence is available. The supplied YouTube redirect wrappers were fetched and their GitHub destinations were independently checked; this does not verify the linked video content or any external account.
