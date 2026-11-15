# 13 — Testing and verification

**Environment note, stated once and applied everywhere:** this work was performed in a sandbox
with the repository, Node 22 and npm registry access, but **no Google credential, no database
connection, and no network route to `binaries.prisma.sh`**. That third limitation blocks
`prisma generate`, which blocks `tsc --noEmit` from being a clean gate and blocks
`next build`. Every test result below is labelled with what it does and does not prove.

---

## 1. Summary

| Gate | Command | Result | Meaning |
|---|---|---|---|
| Test suite | `npx vitest run tests/unit` | **3688 passed / 27 failed** | Baseline comparison below proves all 27 failures pre-exist at `HEAD` |
| New tests | `npx vitest run tests/unit/google-analytics-data-api.test.ts` | **29/29 passed** | New surface behaves as specified on its guard paths |
| Existing Google tests | `npx vitest run tests/unit/google-stack.test.ts` | **111/111 passed** | Two assertions were **corrected** — they encoded the IELTS/PTE defect (see §4) |
| Attribution funnel tests | `npx vitest run tests/unit/course-finder-attribution-funnel.test.ts` | **passed** | No regression in attribution |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=7000 npx tsc --noEmit` | **104 errors, 0 in touched files** | Remaining errors are Prisma-client-dependent files untouched by this pass |
| Lint | `npx eslint <changed files>` | **0 problems** | |
| Secret scan | `node --test tests/secret-findings.test.mjs tests/deployment-ownership.test.mjs tests/runtime-standard.test.mjs` | **25/25 passed** | |
| Secret pattern scan of changed files | manual grep | **0 real findings** | Only pre-existing dummy fixtures matched |
| `prisma validate` / `generate` | `npx prisma generate` | **BLOCKED** | Engine download unreachable |
| Production build | `npm run build` | **BLOCKED** | Requires `prisma generate` |
| E2E (Playwright) | `npm run test:e2e` | **NOT RUN** | Needs a running app + database |

## 2. The baseline comparison — why 27 failures are not this pass's fault

The claim "these failures are pre-existing" was **tested, not assumed**:

1. Ran `npx vitest run tests/unit` on the working tree → 27 failures in 13 files.
2. Captured the exact failing file list.
3. `git stash push -u` (removing every change from this pass, including untracked files).
4. Re-ran the same 13 files at pristine `HEAD`.
5. Result: **identical — 13 files failed, 27 tests failed, 126 passed.**
6. `git stash pop` restored the work (verified by `git status`).

The 13 files:

`accounting-ledger`, `ai-security-remediation`, `application-risk-score`,
`business-hours-policy`, `cms-revisions`, `critical-safety-remediation`, `design-tokens`,
`journal-integrity`, `migration-order`, `visual-system-redesign`, `phd/auth-access`,
`phd/storage-security`, `student-success-score`.

Causes are environmental/pre-existing:

- **Prisma-dependent suites** (`cms-revisions` DMMF, `migration-order`, `accounting-ledger`,
  `journal-integrity`, `business-hours-policy`, `phd/*`, `application-risk-score`,
  `student-success-score`): `@prisma/client` has no generated model types in this sandbox
  because the engine download is blocked, so model access resolves to `{}`.
- **Design guards** (`design-tokens`, `visual-system-redesign`): pre-existing violations in
  `src/app/super-admin/ai-command-center/*` — files this pass did not touch.

**Evidence that this pass added nothing:** the failing set is identical before and after, and
the new test file (29 tests) passes.

## 3. Typecheck — how 104 errors were triaged

`tsc --noEmit` with the default heap size crashes with an OOM (V8 heap ≈1.9 GB of a 3.9 GB
sandbox). With `--max-old-space-size=7000` it completes.

- Total errors: **104**.
- Filtered to every file this pass touched (`src/lib/google/*`, `src/lib/analytics/*`,
  `src/components/analytics/*`, `src/app/api/google/*`, `src/app/api/applications/[id]/*`,
  `src/app/api/student/*`, `src/app/api/student-portal/*`, `src/app/layout.tsx`,
  `src/lib/permissions.ts`, `src/app/admin/google-stack/page.tsx`): **0 errors**.
- Error codes are dominated by `TS2339`/`TS2694`/`TS2322` against non-generated Prisma types in
  files untouched by this pass.
- Seven genuine errors **were** found in the new `analytics-data.ts` on the first pass (a
  discriminated-union narrowing mistake and a wrong credential property) and were fixed before
  this documentation was written — the count went 111 → 104 with zero errors left in new code.

## 4. Test assertions that were corrected (and why that is not cheating)

Two pre-existing assertions encoded the defect this pass fixed:

```ts
// before
expect(detectPageType('/language-prep/pte-academic')).toBe('english_test');
expect(pageViewEventsFor('/english-tests')).toContain('ielts_page_view');
```

Both were true of the old mapping, and both are wrong: the first made `pte_page_view` and
`toefl_page_view` impossible; the second counted every English-test hub page as IELTS traffic.
The tests were **rewritten to assert the correct mapping, with an explanatory comment**, and
new tests were added that would fail if the defect returned:

- `/language-prep/pte-academic` → `pte_page_view`, and **not** `ielts_page_view`
- `/language-prep/toefl-ibt` → `toefl_page_view`, and **not** `pte_page_view` / `ielts_page_view`
- `/destinations/uk` → `country_page_view`, **not** `destination_page_view`
- `/destinations` → `destination_page_view`, **not** `country_page_view`

No assertion was deleted to make a build pass.

## 5. New tests written (29)

`tests/unit/google-analytics-data-api.test.ts`

| Group | What it proves |
|---|---|
| Configuration | Read-only scope only; property-id parsing accepts `123456789`/`properties/123456789`; rejects `G-…`; never "configured" on a property id alone; FREE tier with no billing account; exposed through the shared config |
| Request validation | Relative/absolute dates validated; unknown dimension rejected; unknown metric rejected; ≥1 metric required; row limit bounded; **no PII-shaped field in either allowlist**; every dashboard preset uses only allowlisted fields; acquisition coverage (`source/medium`, channel group, campaigns, landing pages); preset key cannot be path-traversed |
| NOT_CONFIGURED contract | `NOT_CONFIGURED` (not zeroes) with no property; `NOT_CONFIGURED` **without calling Google** when a property exists but no credential; invalid request rejected before any network call (`fetch` spy asserted **not called**) |
| Lifecycle vocabularies | Document category → coarse `upload_kind`; free text collapses to `other` and is never echoed; test name → fixed `test_type`; `upload_kind` passes the PII screen while `file_name`/`document_id` are dropped; stage transition passes while a typed `reason` (with a phone number) is dropped |
| Scroll depth | No measurement when the page cannot scroll; measures the **scrollable** distance (the classic bug is measuring document height); clamps overscroll/negative; 25/50/75/90 each once |
| Catalogue completeness | All 27 required events declared by name; unknown names still rejected |

## 6. The specification's required test cases — actual status

### Website
| Case | Status |
|---|---|
| Homepage / destination / course-finder / university / course / services / language-prep render | **PARTIAL** — routes exist and typecheck; no browser was available in this sandbox |
| Lead forms, WhatsApp, phone, counsellor requests | **PARTIAL** — instrumentation unit-tested; form submission not exercised end-to-end here |

### Analytics
| Case | Status |
|---|---|
| GA4 configuration | **PASS** (unit-tested) / **BLOCKED** (no property) |
| Page views | **PASS** (logic) — delivery **BLOCKED** |
| Event collection | **PASS** (catalogue + emitters) — delivery **BLOCKED** |
| GTM Preview | **BLOCKED** — no container |
| Duplicate-event prevention | **PASS** (mechanism tested) / **PARTIAL** (not observed live) |
| Conversion events | **BLOCKED** — needs `GA4_API_SECRET` |
| Consent behaviour | **PASS** (unit-tested) / **PARTIAL** (not observed in a browser) |
| No PII transmission | **PASS** (unit-tested, three layers) |

### Search Console
| Case | Status |
|---|---|
| Domain verification | **BLOCKED** (DNS) |
| Sitemap submission | **BLOCKED** (no credential) — generator itself is real |
| API authentication | **BLOCKED** |
| Search performance query | **BLOCKED** |
| Indexing inspection | **BLOCKED** |
| SEO reporting | **PARTIAL** — endpoints and UI built, `NOT_CONFIGURED` returned honestly |

### CRM
| Case | Status |
|---|---|
| New lead | **PARTIAL** — library-level tested; needs a live DB |
| Existing student matching / Student ID / duplicate prevention | **PARTIAL** — existing logic untouched |
| Attribution preservation (first/last touch) | **PASS** — unit-tested |
| Counsellor assignment / follow-up | **PARTIAL** — existing logic untouched, not exercised here |
| Application conversion | **PARTIAL** — the new emit is attached after commit; not exercised end-to-end |

### Security
| Case | Status |
|---|---|
| RBAC | **PASS** (permissions defined + enforced by `requireGoogleAccess`) |
| Secret protection | **PASS** (scan + tests) |
| API authentication / authorization | **PASS** (staff gate on every endpoint) |
| Rate limiting | **PASS** (applied to every Google-reporting route) |
| Audit logs | **PASS** for stage/document changes (existing `AuditLog`); **MISSING** for a Google-specific audit UI |
| No private data in analytics | **PASS** (unit-tested) |

### Reliability
| Case | Status |
|---|---|
| Google API timeout | **PASS** — `TIMEOUT` status, abortable request, 15s/4s limits |
| Invalid credentials | **PASS** — `AUTH_FAILED` with Google's reason, no secret in the message |
| Expired OAuth token | **PASS** — one forced refresh, then failure |
| API quota exceeded | **PASS** — surfaced as `API_ERROR`/`NO_ACCESS` with Google's reason |
| Missing configuration | **PASS** — `NOT_CONFIGURED`, no request, tested |
| Google service unavailable | **PASS** — every path is a no-op/typed failure; the website and CRM continue |
| Website remains operational | **PASS by design** — no Google call is on any render path; `GoogleTags` renders `null` and swallows failure |

## 7. What still must be tested by a human, in production, and how

See `04-ga4-implementation.md` §5 (GA4 + DebugView), `05-gtm-implementation.md` §2 step 7
(GTM Preview), `06-search-console-implementation.md` §6 (Search Console) and
`14-deployment-and-rollback.md` §5 (post-deploy verification). Until those are run and their
results recorded, the corresponding lines in `15-final-implementation-report.md` stay `BLOCKED`
or `PARTIAL`. They must not be upgraded on the strength of this document.
