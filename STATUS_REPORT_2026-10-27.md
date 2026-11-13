# ALO WEB CRM — Build Status Report
**Date:** 2026-10-27 · **Branch:** `arena/5e872afd-alo-web-crm-tech` · **HEAD:** `02a59d47`

This report separates **what is proven** from **what is written but unproven** and from
**what is not built**. Where something cannot be verified in this sandbox, it says so
instead of implying completion.

---

## 1. Verification performed in this session

| Check | Command | Result |
|---|---|---|
| Prisma schema valid | `npx prisma validate` | ✅ valid, **610 models** |
| Client generated | `npx prisma generate` | ✅ Prisma Client v6.19.3 |
| Model list matches schema | `node scripts/verify-prisma-client.mjs` | ✅ `Verified generated Prisma client: 610 models` |
| Verification mirror | `node scripts/ai-workforce/mirror-schema.mjs` | ✅ `Mirrored 610 models` |
| Scoped typecheck | `npx tsc -p tsconfig.super-admin-check.json --noEmit` | ✅ **0 errors, 85 files** |
| Lint (changed trees) | `npx eslint src/lib/super-admin src/app/api/super-admin src/app/student src/components/student src/components/auth src/proxy.ts` | ✅ clean |
| Runtime smoke — Super Admin API | 39 endpoints, non-acting, no session | ✅ all compile, all `401 Unauthorized` |
| Runtime smoke — Student pages | dev server, `--webpack` | ✅ 200 on public entry pages; 307 → `/student-login` on gated ones |
| Super Admin dashboard pages | anonymous | ✅ 307 → `/login?callbackUrl=…` (unchanged) |

### Not verified (cannot be, in this environment)
- **`npm run build`** — killed by the sandbox OOM (~3.9 GB) every time. Needs CI.
- **Full-project `tsc` / `eslint`** — same memory ceiling; only scoped runs are possible here.
- **Authenticated happy paths** — there is no MySQL server in the sandbox (`127.0.0.1:3306`
  unreachable), so no query behind `requireSuperAdmin` was ever executed against real rows.
  Every "authorised" path is type-checked and lint-clean but **not executed**.
- **Migrations against a real database** — the three migrations are hand-written, additive,
  `CREATE TABLE IF NOT EXISTS`; they have never been applied.

---

## 2. Super Admin operating system (spec §28)

### Built and wired

**37 new route files this pass**, on top of the 20 that already existed.

| Area | Endpoints | Notes |
|---|---|---|
| Report Center | `GET /reports`, `POST /reports/generate`, `GET /reports/{id}/download` | **24 report definitions** with declared filters. Generation is an explicit audited POST; download is audited *before* bytes are served. |
| AI Command Center | `GET/POST /ai/agents`, `GET/PATCH /ai/agents/{id}`, `GET/POST /ai/jobs`, `PATCH /ai/jobs/{id}/approve`, `PATCH /ai/jobs/{id}/reject` | 11 protected actions are held in `WAITING` until a human approves. |
| AI System Builder | `POST /ai/system-builder/request`, `GET /ai/system-builder/requests`, `PATCH .../{id}/approve`, `POST .../{id}/apply` | Plan is a **rule-engine template, explicitly not an LLM**. Apply refuses anything not `APPROVED`. |
| Approval Center | `PATCH /approvals/{id}/approve`, `/reject`, `/revision-needed` | Double-decision blocked inside the transaction. |
| RBAC | `GET/POST /roles`, `GET/PATCH /roles/{id}`, `GET/PATCH /users/{id}/roles`, `GET/PATCH /users/{id}/permissions`, `GET/POST /permissions/temporary`, `GET/POST /permissions/rollback` | Per-user ALLOW/DENY in its own table; rollback restores the snapshot. |
| People | `POST /employees`, `GET/PATCH /employees/{id}`, `PATCH .../force-password-change`, `GET .../activity`, `GET .../dashboard-access` | Account creation reuses `createEmployeeAccount` — not duplicated. |
| Geography | `GET/PATCH /branches/{id}`, `GET /branches/{id}/report`, `GET /countries/{id}/report`, `POST /countries/{id}/assign-team`, `POST /countries/{id}/trigger-data-scan` | Reports return `unavailableMetrics[]` with the required schema fix rather than invented numbers. |
| Security | `GET /security/logins`, `GET /security/sessions`, `POST /security/revoke-session` | Failed-attempt threshold computed from real `login_attempts`. |
| Settings | `GET/PATCH /settings/maintenance-mode` | Persisted in `system_settings`, audited with before/after. |
| Acting-As | `POST /acting-as/start`, `POST /acting-as/stop`, `GET /acting-as/action-log` | start/stop **re-export** the single portal-auth implementation. |
| Overview | `GET /overview` | Live counts + an on-disk diff of route folders versus the required surface. |

### Deliberate non-fabrications
- Report categories with no modelled source return **0 rows + a `limitation` string**.
- `trigger-data-scan` queues a real `Task(DATA_SCAN)`; it does not pretend to scan.
- System-builder `apply` marks the request applied and **does not rewrite source files**
  from a web request — that would be an unaudited RCE surface.
- Branch/country reports name the missing links (`branchId` on Application/Payment/Document)
  in `requiredFix`.

### Still missing in this area
- **No UI for any of the 57 routes beyond the existing 15-section dashboard.** The dashboard
  does not yet surface reports, AI jobs, system builder, approvals sub-actions, security
  forensics, or the acting-as log.
- `overview` cannot see UI pages, so it is a route-folder diff — **not a completion score**.
- No authenticated end-to-end run (see §1).

---

## 3. Student journey (spec §23)

### Built this pass
- `/student-login`, `/student-register` — spec URLs, sharing the one login/register implementation.
- `/english-test-login`, `/english-test-register` — candidate entry; a candidate **is** a student account.
- `/test-student` + `GET /api/student/test-check` — reads the caller's own rows and returns
  PASS / FAIL / SKIPPED per step, each FAIL naming the fix.
- `/student/compare` — removed the hardcoded `"Sep, Jan"` intake and `"Check with counselor"`
  placeholders; cells now read stored columns and say "Not published" otherwise.
- `/student/shortlist` — the disabled Remove button now deletes through the API.
- `src/proxy.ts` — anonymous `/student/**` and `/test-student` now redirect to `/student-login`
  (the staff login cannot authenticate a student), plus the new public entry URLs.

### What already existed and was NOT rebuilt
The student area already has **57 pages** (`/student/login` is a 338-line form with password +
OTP, `/student/profile/onboarding` is a 327-line real component reading `/api/student/profile`).
The gap was the spec's *named URLs* and the two weakly-wired pages above.

### Still missing / incomplete in the student journey
- `/student/compare` and `/student/shortlist` are correct but thin: no add-to-compare control
  on the course card, no eligibility column source for every row.
- No bulk/export, no mobile-specific layouts for either page.
- **Not exercised with a real student session** — no database in this sandbox.

---

## 4. Data model changes

Three migrations, all additive, none applied anywhere yet:

| Migration | Contents |
|---|---|
| `20261027120000_super_admin_operating_models` | `permission_groups`, `permission_group_grants`, `system_settings` |
| `20261027140000_super_admin_reports_and_build_requests` | `reports`, `module_build_requests` |
| `20261027160000_super_admin_user_permission_overrides` | `user_permission_overrides` |

`UserPermissionOverride` replaced an earlier JSON `!key` deny hack: one row per user+key,
with author, reason and timestamp, so the rollback endpoint can restore a real prior state.

---

## 5. Honest bottom line

| Claim | Status |
|---|---|
| "Super Admin API surface is complete as files and passes typecheck/lint" | ✅ provable |
| "Every Super Admin endpoint rejects unauthenticated callers" | ✅ provable (39/39 → 401) |
| "Super Admin endpoints work for an authorised user" | ❌ **not proven** — no DB, no session |
| "The Super Admin dashboard has UI for all of this" | ❌ **false** — 15 sections only |
| "The student journey is complete" | ❌ **false** — entry URLs done, data-wiring thin, no roadmap of remaining student pages audited |
| "It builds" | ⚠️ **unknown** — `next build` OOMs in the sandbox; needs CI |

Next highest-value work, in order:
1. Wire the dashboard UI to the new endpoints (Report Center, AI jobs queue, approvals actions).
2. Run the three migrations + `next build` in CI, then execute the authenticated paths.
3. Audit the remaining student pages the same way `compare`/`shortlist` were audited.
