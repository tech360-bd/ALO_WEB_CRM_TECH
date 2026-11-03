# Backend authorization triage — 2026-11-03

Scope: all `src/app/api/**/route.ts` handlers in this checkout (1,101 API route
files). This is a static source audit, **not** a live penetration test.

## Method

1. Enumerated every handler exporting `POST`, `PUT`, `PATCH` or `DELETE`.
2. Flagged files with no recognizable authentication/authorization helper.
   - Narrow first pass: 148 candidates.
   - After recognizing the repo's own subsystem guards (`phdRoute`,
     `requireCron`, `validateRequestAccess`, `withMarketingAccess`,
     `resolveStudentAccess`, `reviewCatalogUpdate`, `withAuth`,
     `authenticateRequest`, …): 51 candidates.
   - After excluding delegating wrappers and intentionally public endpoints:
     10 genuine candidates.
3. Cross-checked against `src/proxy.ts`: every non-public `/api/...` path
   requires a session token, and `SENSITIVE_API_ROUTES` adds role allow-lists for
   sensitive families. The proxy gate is real backend enforcement, but it is a
   coarse prefix rule; the remaining defect is **route-level** actor binding,
   same-origin write enforcement, field whitelisting and audit events.
4. The pre-existing `api-auth-scan.json` (102 mutating-no-guard entries) remains
   in the repository as historical audit evidence; it is not a proof of current
   state.

## Hardened in this session

**Phase A / P0 — 8 handlers** (`src/lib/api/staff-endpoint-guard.ts`):

`hr/leave`, `hr/devices`, `official-emails`, `university-agreements`,
`b2b-contacts`, `communications/templates`, `communications/templates/[id]`,
`interview-questions`. All now use `withAuth`, the shared staff policy,
same-origin write checks, whitelisted Prisma writes, session-bound approval
actors, audit events and sanitized errors. Verified by
`tests/unit/staff-endpoint-backend-rbac.test.ts` and
`tests/unit/interview-question-api.test.ts`.

**Phase B / Contact Hub — 8 new handlers** under `src/app/api/crm/contacts/`:
list, profile `[id]`, duplicates, consent, segments, audit, import, export.
All use `withAuth` + `contacts.*` permission checks + scoped reads; writes are
audited. Verified by `tests/unit/contact-hub-api.test.ts`.

**Additional legacy handlers — 7 files / 12 handlers**:

| Route | Defect fixed |
| --- | --- |
| `api/partner-packages` GET/POST/PATCH | `db.partnerPackage.create({ data: body })` mass assignment; PARTNER sessions could reprice/disable B2B packages |
| `api/communications/tasks` GET/POST | no route-level auth; client-supplied `createdBy` |
| `api/communications/tasks/[id]` PATCH | no route-level auth |
| `api/communications/escalations` GET/POST | no route-level auth |
| `api/communications/escalations/[id]` PATCH | no route-level auth |
| `api/communications/sla/policies` GET/POST | no route-level auth on SLA configuration |
| `api/communications/sla/justifications/[id]/review` POST | no route-level auth; client-supplied `reviewedBy` |
| `api/website/search-log` POST | public by design, but unbounded anonymous inserts; now rate-limited, field-whitelisted and length-bounded |

New shared policies added to `src/lib/api/staff-endpoint-guard.ts`:
`partnerPackages`, `communicationTasks`, `slaPolicies`. Verified by
`tests/unit/communication-staff-rbac.test.ts` (9 tests, 11 handlers).

## Deliberate non-changes (documented, not defects)

- `/api/whatsapp/webhook` and `/api/crm/ucc/webhooks/[provider]` are public
  inbound webhooks. They validate Meta signatures / `hub.verify_token`; the
  compatibility alias delegates to the canonical handler and does not bypass it.
- `/api/admin/university-data/updates/[id]/{approve,edit,reject}` are 2-line
  delegates to `reviewCatalogUpdate()` in
  `src/lib/crm/catalog-update-review.ts`, which performs `authenticateRequest`,
  ADMIN/SUPER_ADMIN checks, same-origin enforcement and audit logging.
- `/api/cron/**` uses `requireCron()` (`ALO_CRON_SECRET` / `CRON_SECRET` ≥16
  chars, or an authorized admin session) and a lease-protected job runner.
- `/api/student/referrals` uses `resolveStudentAccess()`.
- `/api/phd/**` (36 handlers) uses `phdRoute()` with actor resolution.
- `/api/auth/**`, `/api/portal-auth/**`, `/api/marketing/consent/revoke`,
  `/api/email/unsubscribe`, `/api/crm/leads/public` and other explicitly public
  flows remain public by design; their handlers validate and consume their own
  tokens / rate limits.

## Remaining debt (NOT fixed — do not claim universal backend RBAC)

1. `/api/enterprise-ai/dcc` POST has no route-level guard; it relies on the
   proxy's `/api/enterprise-ai` → SUPER_ADMIN/ADMIN rule only.
2. `/api/international-officer/agreements` GET has no session check in the
   handler; it relies on the proxy's `SENSITIVE_API_ROUTES` prefix.
3. `/api/communications/sla/incidents`,
   `/api/communications/sla/justifications`,
   `/api/communications/quick-replies`, `/api/communications/calls/*` and
   several `/api/ai-workforce/*` handlers still rely on proxy-level RBAC plus
   rate limiting rather than a route-level actor/permission check.
4. Static analysis cannot prove that every one of the remaining ~1,000 handlers
   binds its actor to the session. A full runtime authorization sweep with real
   sessions is required before claiming Phase I complete.

## Verification

- Scoped TypeScript compile:
  `NODE_OPTIONS=--max-old-space-size=3400 npx tsc --project tsconfig.contact-hub-check.json --noEmit` → `EXIT=0`.
- Scoped unit tests: 6 files, 61 tests passed (see the final report).
- Full Vitest suite and full `tsc --noEmit`: not green in this sandbox (Prisma
  native query engine unavailable; full typecheck exceeds available memory).
- Live API authorization testing with real sessions and a database: **NOT TESTED**.
