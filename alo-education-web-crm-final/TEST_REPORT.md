# Test Report

## Static verification
- prisma format --check: initial FAIL, final PASS after prisma format.
- prisma validate: PASS.
- prisma generate: PASS.
- npm run typecheck: PASS.
- npm run lint: initial FAIL, final PASS after React hook fixes.
- npm run build: PASS.

## Automated tests
### Unit and integration command
```text
npm test
> alo-education-erp@0.3.0 test
> vitest run


 RUN  v4.1.10 [local-build-path-redacted]


 Test Files  4 passed (4)
      Tests  36 passed (36)
   Start at  04:35:12
   Duration  1.57s (transform 277ms, setup 0ms, import 1.50s, tests 1.22s, environment 1ms)
```

### Integration subset command
```text
npm run test:integration
> alo-education-erp@0.3.0 test:integration
> vitest run tests/integration


 RUN  v4.1.10 [local-build-path-redacted]


 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  04:35:14
   Duration  312ms (transform 21ms, setup 0ms, import 71ms, tests 65ms, environment 0ms)
```

### Playwright command
```text
npm run test:e2e
> alo-education-erp@0.3.0 test:e2e
> playwright test


Running 8 tests using 5 workers

  ✓  1 [chromium-desktop] › tests/e2e/public-and-auth.spec.ts:17:7 › public website and anonymous auth gates › protected UCC API rejects anonymous requests (62ms)
  ✓  5 [chromium-desktop] › tests/e2e/public-and-auth.spec.ts:23:7 › public website and anonymous auth gates › super admin command center route is present (2.8s)
  ✓  2 [chromium-mobile] › tests/e2e/public-and-auth.spec.ts:4:7 › public website and anonymous auth gates › public homepage renders meaningful ALO Education content (4.1s)
  ✓  4 [chromium-desktop] › tests/e2e/public-and-auth.spec.ts:4:7 › public website and anonymous auth gates › public homepage renders meaningful ALO Education content (4.2s)
  ✓  7 [chromium-mobile] › tests/e2e/public-and-auth.spec.ts:23:7 › public website and anonymous auth gates › super admin command center route is present (549ms)
  ✓  3 [chromium-desktop] › tests/e2e/public-and-auth.spec.ts:10:7 › public website and anonymous auth gates › portal login routes render for visitors (4.7s)
  ✓  8 [chromium-mobile] › tests/e2e/public-and-auth.spec.ts:17:7 › public website and anonymous auth gates › protected UCC API rejects anonymous requests (35ms)
  ✓  6 [chromium-mobile] › tests/e2e/public-and-auth.spec.ts:10:7 › public website and anonymous auth gates › portal login routes render for visitors (947ms)

  8 passed (7.5s)
```

## Critical gaps
- No full automated RBAC matrix suite exists for every role and scope.
- No real provider OAuth live tests executed.
- No successful Prisma migration/seed test.
- No database-backed AI Command Center persistence test because migration/setup failed and no command persistence API/model was found.
