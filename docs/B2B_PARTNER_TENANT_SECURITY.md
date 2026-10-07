# ALO B2B Partner — Tenant Isolation, Seats, Quota & Benefits

Audit and hardening of the existing B2B partner subsystem (partner super admin,
employee seats, marketing quota, student benefits). This is a **patch of the
existing CRM** — no new project, no parallel system, no duplicated models,
routes, RBAC or quota engine.

The audit followed the rule that *a file existing does not mean it is
enforced*. Every helper, route and model found present was re-checked for a
real implementation, actual invocation, and server-side tenant filtering.

---

## 1. Audit result

### Already present and genuinely built (reused, not rebuilt)

| Area | Finding |
|---|---|
| 23 partner routes (`/partner-admin/*`, `/admin/access-control-center`) | All page files present |
| 16 of 18 Prisma models (quota, usage, packages, feature rules, seat/quota requests, benefits, vouchers, 6 employee models) | Present |
| 12 access-check helpers in `src/lib/access-check-engine.ts` | All present, real implementations (not stubs) |
| `/api/student/vouchers/redeem` | Auth, ownership, status, expiry and audit all correct |
| `@@unique([partnerId, monthYear])` on `PartnerMarketingUsage` | Present — made the atomic fix below possible |

### Defects found and fixed

| # | Defect | Class | Impact |
|---|---|---|---|
| D1 | `PartnerProfile.partnerId` was `@unique` | DATABASE / BROKEN | A partner company could hold **exactly one user**. The Starter package (1 Partner Super Admin + 2 Employees) was impossible; creating the 2nd user always failed on the unique constraint |
| D2 | `AuthContext` never carried `partnerId` | API / BROKEN | Every route reading `auth.partnerId` rejected all callers with "Partner identity required" — partner user management, vouchers, marketing and seat requests were entirely non-functional |
| D3 | `/api/partner-admin/seat-requests` had **no authentication** | SECURITY (critical) | `PATCH {id, status:"APPROVED"}` from **any anonymous caller** approved any seat request — directly defeating the partner user limit. GET exposed all tenants' requests; POST forged requests for any `partnerId` |
| D4 | `/api/partner-admin/quota` had **no authentication** | SECURITY | `?partnerId=` read any partner's quota; with no parameter it fell back to `findFirst({role:'PARTNER'})` and returned an unrelated partner's figures |
| D5 | Partner dashboard counted applications with **no partner filter** | SECURITY / FAKE DATA | Every partner saw ALO's **platform-wide** application totals as its own. The lead count had a `.catch()` that fell back to counting every lead in the system |
| D6 | `getQuota` did not recognise `marketing_images` / `marketing_videos` | BROKEN | Those are the exact keys `/api/partner/marketing/generate` passes. `getQuota` returned 0, so every partner was told **"quota finished (0/0)"** on a fresh month. Image and video generation was 100 % unusable |
| D7 | Quota enforced by check-then-act | SECURITY (race) | Measured: **20 concurrent requests against a 5-image limit all succeeded** (400 % overrun) |
| D8 | Voucher redemption read-then-wrote `usedCount` | SECURITY (race) | Measured: **10 concurrent redemptions of a single-use voucher all succeeded** |
| D9 | No role check on partner user creation | RBAC | Any partner user, not just the Partner Super Admin, could create users |
| D10 | Voucher issuance did not verify application ownership, and was not idempotent | SECURITY / DATA | A partner could mint vouchers against **another partner's** application; repeat calls issued unlimited duplicate benefit packages |
| D11 | `getServerSession` threw outside a request scope | SECURITY (error handling) | An unauthenticated call raised an unhandled exception (500 + stack trace) instead of a clean 401 |
| D12 | Dashboard `counselorSeats.used` counted **seat requests**, limit hardcoded to 3 | FAKE DATA | Filing one request made the tenant look like it had consumed a seat; package and approved grants ignored |

### Not addressed (declared, not hidden)

- `PartnerSupportTicket` and `PartnerSocialAccount` models do not exist. Existing
  social models (`SocialAccountOwnership`, `SocialIntegration`, `SocialAccount`)
  are **ALO-organisation scoped and carry no `partnerId`**, so they are not
  partner-tenant equivalents. Partner support tickets (§50) and partner-scoped
  social publishing (§14) therefore remain **DATABASE_MISSING**.
- The 22 `/partner-admin/*` pages all render one shared
  `MasterPartnerAdminView` component which uses `currentPath` only to highlight
  navigation. Route-specific UI (user list, quota editor, approval drawer,
  audit timeline) is **not built** — these routes are **UI_ONLY**.
- Employee activation tokens, private-profile/salary/document streaming
  endpoints, marketing publishing gate chain, rate limiting, and the Access
  Control Center's 12 sections were **not** modified in this pass.

---

## 2. Changes

### Schema — `prisma/schema.prisma`

| Model | Change |
|---|---|
| `PartnerProfile` | `partnerId` `@unique` → indexed tenant key; new `partnerRole` (default `PARTNER_SUPER_ADMIN`); `@@index([partnerId])`, `@@index([partnerId, partnerRole])` |
| `PartnerPackageAssignment` | New `seatOverride Int?` so an approved extra-seat request actually raises the enforced limit; 3 indexes |
| `PartnerUserSeatRequest` | 3 indexes for the partner view and the ALO review queue |

Migration `prisma/migrations/20261008010000_partner_tenant_seats/migration.sql`
follows the repository's existing guarded-idempotent-DDL convention
(`information_schema` checks + `PREPARE`/`EXECUTE`). **Additive and
non-destructive**: nothing is dropped except the `partnerId` UNIQUE index,
which is replaced by a plain index on the same column.

### New — `src/lib/partner-tenant-guard.ts`

Fail-closed guards used by every partner endpoint. `partnerId` is **always**
derived from the session; a client-supplied value may only be asserted equal to
it.

- `requirePartnerContext` — authenticated + belongs to a tenant
- `requirePartnerSuperAdmin` — additionally the tenant's Super Admin
- `requireAloSuperAdmin` — ALO master authority, **partner accounts explicitly
  rejected** so a partner can never approve its own request
- `assertSameTenant`, `assertRecordInTenant` (404, so tenant membership is not
  leaked), `isAloSuperAdmin`, `isPartnerSuperAdmin`

### `src/lib/access-check-engine.ts`

- `normalizeQuotaKey` + alias table — every spelling of a quota key resolves to
  one canonical key, fixing D6 at all call sites at once
- `reserveQuota` — **atomic** reserve via a conditional `updateMany`
  (`where: { [column]: { lt: limit } }`) inside a transaction, so the database
  re-checks the limit as part of the write
- `releaseQuota` — refunds the unit when the generation it paid for fails
- `currentPeriod` (`YYYY-MM`), `quotaExceededMessage`, and named Starter
  constants replacing magic numbers

### Routes

| Route | Change |
|---|---|
| `api/partner-admin/seat-requests` | Full rewrite: auth on all verbs; tenant-scoped GET; Partner-Super-Admin POST with server-read `currentLimit`, validation and one-open-request rule; **ALO-Super-Admin-only PATCH** that applies `seatOverride` in the same transaction as the approval; audit on every mutation |
| `api/partner-admin/quota` | Auth + session tenant + `assertSameTenant`; limits via `getQuota`; current-period usage by unique key |
| `api/partner-admin/dashboard` | Rewrite: all counts tenant-filtered through `studentProfile.partnerId`; seats = real users vs package limit; current-month usage; no hardcoded limits; no global fallbacks |
| `api/partner-admin/users` | `requirePartnerSuperAdmin`; role allow-list (cannot grant ALO roles or a 2nd Partner Super Admin); email validation; **seat count re-checked inside the transaction**; `pending_activation` + empty hash instead of a shared placeholder password hash |
| `api/partner-admin/vouchers` | Application ownership + tenant verified; eligibility stages; idempotency guard; full §16 benefit package; audit |
| `api/partner/marketing/generate` | `reserveQuota` before work, `releaseQuota` on failure |
| `api/student/vouchers/redeem` | Conditional atomic claim; 409 when another request wins |
| `src/lib/auth-middleware.ts` | `partnerId`/`partnerRole` resolved server-side (follows the effective user under Acting-As, while audit keeps the real actor); `getServerSession` failure now fails closed to 401 |

---

## 3. Verification

All commands were run; results are quoted as produced.

| Check | Command | Result |
|---|---|---|
| Schema | `npx prisma validate` | ✅ valid |
| Client | `npx prisma generate` | ✅ 527 models |
| Types | `npx tsc -p tsconfig.b2b-scope.json --noEmit` | ✅ 0 errors |
| Lint | `npx eslint <changed files>` | ✅ 0 problems |
| Migration drift | `vitest run tests/unit/migration-order.test.ts` | ✅ 4 passed |
| Full suite | `ALO_DB_DRIVER=sqlite … npx vitest run` | ✅ **921 passed, 7 skipped, 0 failed** (84 files) |

New: `tests/integration/partner-b2b-security.test.ts` — **23 tests**, all
against the real Prisma client and real session rows.

Measured before/after on a real database:

```
quota, limit 5, 20 concurrent requests
  check-then-act : granted=20  imagesUsed=20     <- bypass
  reserveQuota   : granted=5   imagesUsed=5      <- enforced

single-use voucher, 10 concurrent redemptions
  read-then-write : granted=10                   <- double-spend
  atomic claim    : granted=1                    <- enforced

quota key used by /api/partner/marketing/generate
  before : marketing_images -> limit=0  allowed=false  "quota finished (0/0)"
  after  : marketing_images -> limit=15 allowed=true

users per partner tenant
  before : 2nd user fails, "Unique constraint failed on the fields: (partnerId)"
  after  : 3 users (1 Partner Super Admin + 2 employees)
```

### Not verified

- **`npm run build` could not be completed.** `next build` OOMs in this
  sandbox (`Ineffective mark-compacts near heap limit` → SIGABRT at ~2.3 GB;
  the machine has 3 GB and the repo's own build script requests 4096 MB). This
  is environmental and unrelated to these changes; it was equally true before
  them.
- The migration was **hand-written and statically verified**, not executed
  against a live MySQL server — `prisma migrate` needs the Rust engines, whose
  download host is blocked here. It is guarded and idempotent, but it should be
  run against a staging database before production.
- Full-repo `tsc` is not runnable here (OOM); the scoped project covers every
  changed file.

---

## 4. Status

Partner tenant isolation, the user-seat model, the marketing quota engine and
voucher integrity are **complete and regression-tested**. Partner support
tickets, partner-scoped social accounts, the per-route partner UI, employee
activation/document streaming and rate limiting are **not complete** and are
itemised above.
