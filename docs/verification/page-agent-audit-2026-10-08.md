# ALO Education page and agent audit — partial completion

Source: `engralaminn-collab/alo_education_z....ai`, base commit `8d8f8aece9f4acd81a30df765c34a507c85745dc`.

**Status: confirmed defects repaired; whole-product completion and production operation remain unverified.** This audit does not assert that every feature, page, API, integration or catalogued agent works. No production account, Hostinger configuration or live database was used.

## Scope and repairs

The base tree contains 5,990 tracked files, including historical copies, 379 current App Router page files and 880 current API route files. The current `src/`, tests, scripts, Prisma schema and build configuration were retrieved through the authorized GitHub connection. Retrieved source was checked against Git blob hashes; delivery uses the original Git tree as its base, preserving unrelated files and assets.

- Agent replay now checks current agent authorization and production activation before returning a cached run. The cached run must belong to the same actor, agent and mode. In-flight runs cannot masquerade as terminal results. Replay uses the stored fallback flag rather than treating any recorded runtime as a fallback.
- Workflow child-run keys now include workflow, actor and mode scope. A pending ledger result replays as awaiting approval.
- Awaiting approval writes `PENDING`, without claiming a human decision or intervention. Actually approved ledger outcomes map to human activity, while pending outcomes remain pending.
- ADMIN and MANAGER can enter the run-history endpoint; its own-run capability gate previously rejected roles with all-run visibility.
- Seeding with `runTests:false` no longer forges `TESTED` or deploys an untested version. It returns explicit installation failures at the test gate.
- Run-history pagination rejects invalid, fractional, zero and negative `take` values before Prisma receives them.
- `/student-journey` and `/research-opportunities` are public guidance pages and now pass the public-page policy; protected portal routes remain protected.
- Restored 57 existing navigation controls that had valid destinations but were disabled. They now render a single link through `Button asChild`, including language-prep discovery, comparison, guidance, course search, article and consultation links. The separate English prep directory link is also enabled.
- CRM university and course search now submit through working forms, cancel stale requests and display access/server failures instead of presenting those failures as empty successful searches.
- Events now come from upcoming, published database rows, with Bangladesh time, consultation links and explicit unavailable/empty states. Hardcoded 2024 “upcoming” listings were removed.
- Research guidance no longer advertises hardcoded projects, supervisors, funding and deadlines without sources. It provides working course-search and research-consultation links.
- Vitest and its coverage provider are pinned together at 4.1.11; the npm lockfile was regenerated. An early local install failed before the repository's `.npmrc` was retrieved; this is **not evidence that the original production install was broken**.

## Validation

| Check | Result | Boundary |
|---|---|---|
| Node/npm | Node 22.23.3; npm 10.9.9 | Local runtime |
| Dependency installation | Clean `npm ci --ignore-scripts` passed; final-config dry run passed | Install scripts are subsequently covered by explicit Prisma generation/build |
| Prisma generation | Passed; 527 models | MySQL client generated; no live MySQL connection tested |
| Lint | Full lint passed; later changed test/link files linted again | Retrieved source and tooling |
| Typecheck | `npm run typecheck`, heap 6144 MB, exit 0 | Isolated run; an earlier overlapping build/typecheck exceeded available memory |
| Unit tests | 94 files passed; 3 files skipped; 961 tests passed, 35 skipped | Skips remain skips, including DB integration cases |
| Deployment/runtime ownership checks | 16/16 passed | No hosting calls |
| Production build | `npm run build` passed, including Prisma, Next webpack/TypeScript, 981 static outputs and standalone preparation | Local code build; binary public assets were not downloaded for visual QA |
| AI Workforce acceptance | 11/11 installed agents; 5/5 representative workflows; 20/20 security controls | Disposable SQLite mirror with synthetic fixtures and deterministic runtime |
| Independent Workforce audit | 18/18 confirmed, zero defects or warnings | Checks persisted local fixture evidence |

The build preceded a final consultation-link destination correction; final typecheck, lint and unit tests include that correction. No deployed commit or live-domain success is inferred from a local build.

The Workforce test harness uses `PRODUCTION` as its run mode **inside the disposable SQLite fixture database**. That mode is not proof of production deployment. Only `alo-deterministic-v1` was available: the model adapters and external communications/providers were not exercised against live services. The volume check completed 8 of 12 lead workflows; approval-requiring work remains pending, rather than being falsely counted as approved/completed. The harness also intentionally exercises invalid/missing entities and denial paths.

Evidence:

- `ai-workforce-local-evidence-2026-10-08.json`
- `ai-workforce-local-audit-2026-10-08.json`
- `open-controls-2026-10-08.csv`

## Remaining work and release limits

1. **447 explicitly unimplemented controls across 146 source files remain.** The CSV records each file, source line, control and label. These require individual backend/UI implementation and business-flow testing; removing `disabled` alone would create false functionality. They include document actions, finance/HR, marketing, integrations and portal administration. This PR does not complete them.
2. The executable Workforce seed defines 11 agents. The separate 1,020-entry registry does not demonstrate 1,020 executable, activated or tested agents. Other legacy agent engines need their own runtime verification.
3. Live MySQL connectivity, migration state, authorization/session flows, provider credentials, external delivery, payment and scheduling remain unverified. Local SQLite fixtures do not establish MySQL or Hostinger readiness.
4. No full authenticated browser/E2E matrix for all 379 pages and 880 APIs was run. No visual QA of binary assets was performed.
5. Base-commit CI runs `37765593564` and health run `37766276193` reported failure with no executed job steps. The connector could not read check annotations, so the failure cause is unknown. This report does not label those runs green or diagnose an unproven billing/hosting cause.
6. Review and CI are required before release. Hostinger remains the production deployment owner. Production activation, exact deployed SHA, health and database evidence must be checked in that environment.
