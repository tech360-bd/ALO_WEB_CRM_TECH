# ALO Education — Testing Documentation

> Describes the **actual** test suite and the validation gates that CI runs
> on every pull request.

## 1. Tools & configuration

| Layer | Tool | Config |
|---|---|---|
| Unit + integration | Vitest 4 | `vitest.config.ts` (`tests/unit/**`, `tests/integration/**`, node env, `@` alias) |
| E2E | Playwright | `playwright.config.ts` (chromium desktop + Pixel 5 mobile; boots `npm start` on 127.0.0.1:3211 and waits for `/api/health/live`) |
| Deployment rules | `node --test` | `tests/deployment-ownership.test.mjs`, `tests/runtime-standard.test.mjs` |

## 2. Current suite

- **51 Vitest files** (49 unit + 2 integration). Unit tests are DB-free;
  DB-dependent integration tests **self-skip with a reason** when no
  disposable `DATABASE_URL` exists (they never target production — pinned by
  `test-database-safety.test.ts` and `prisma-config-compatibility.test.ts`).
- Coverage areas include: AI provider policy, tool permission boundaries,
  approval transitions, auth session hardening, password hashing, RBAC,
  data scope, SLA alarms, payroll controls and transactions, journal
  integrity, WhatsApp webhook security, visa security negatives, proxy
  security, standalone verification, health readiness, eligibility engine,
  content validation, source verification, cron auth/quarantine, e2e
  deployment config.
- **E2E** (`tests/e2e/public-and-auth.spec.ts`): public pages and auth flows
  on desktop + mobile viewports.

## 3. Commands

```bash
npm test                # vitest run (unit + integration)
npm run test:integration
npm run test:e2e        # playwright (builds nothing; uses npm start)
npm run lint            # eslint
npm run typecheck       # db:verify-client + tsc --noEmit (needs generated client)
npm run build           # full production build + standalone prep
node --test tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs
```

## 4. CI gates (`.github/workflows/ci.yml`)

In order — all blocking:
1. `npm ci` (lockfile reproducibility)
2. `npm audit --audit-level=high`
3. Secret-leak scan over **all tracked files** (docs included)
4. Deployment-ownership + runtime-standard tests
5. `prisma validate` → `prisma generate` → `db:verify-client`
6. `npm run lint`
7. Swap provisioning (tsc needs >4 GB effective memory)
8. `npm run typecheck` (6 GB heap)
9. `npm test`, then `npm run test:integration`
10. `npm run build` with dummy env + `verify-standalone.mjs`

CI **never deploys** — Hostinger owns production deployment.

## 5. Notes & environment caveats

- Typecheck memory: this repo's `tsc` requires a raised heap
  (`NODE_OPTIONS=--max-old-space-size=4096+`) and benefits from swap; CI
  provisions an 8 GB swapfile for this reason.
- E2E requires a built standalone output; Playwright starts it with test
  secrets and expects `/api/health/live` to respond.
- Vitest prints a benign warning about ESM syntax in `vitest.config.ts`
  (config-loader notice) — it does not affect results.

## 6. Adding tests

- Place unit tests in `tests/unit/*.test.ts`; mock the database (see
  existing helpers) — never import a live connection.
- Integration tests must follow the self-skip pattern from
  `tests/helpers/test-database.ts` when no disposable DB is configured.
- Security-relevant changes should extend the dedicated security regression
  files rather than creating new ad-hoc ones.
