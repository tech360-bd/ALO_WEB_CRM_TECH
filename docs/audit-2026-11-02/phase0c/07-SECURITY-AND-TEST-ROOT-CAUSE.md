# Phase 0C · 07 — Security & Test Root-Cause Analysis

**Generated:** 2026-11-02 · **Data:** `authz-matrix.csv` (1,099 routes), `authz-summary.json`,
`api-auth-scan.json` · **Script:** `phase0c/build-authz-matrix.py`
**No application code was altered.** Fixes in §7 are prepared as proposals, not applied.

---

## 1. Correction: the "7 unauthenticated endpoints" finding was wrong

The Phase 0A report asserted that seven route handlers have **no auth at all**. A route-level regex scan
supported that — all seven handlers do genuinely contain no `requireAuth`, no session read and no role
check. But the scan ignored the **global gate**, and the gate decides the actual exposure.

`src/proxy.ts` is the Next.js **16.4.2** middleware (`export default async function proxy`,
`config.matcher: ["/:path*"]` — Next 16 renamed `middleware.ts` to `proxy.ts`). For every `/api/*`
request it does:

```
if (public-listed)            → next()
if (pathname starts /api/)    → if (!token) 401
                                if (prefix in SENSITIVE_API_ROUTES && role not allowed) 403
                                else next()
```

All seven endpoints are checked against that logic:

| Endpoint | Public-listed? | Role allow-list | Anonymous reachable? |
|---|---|---|---|
| `/api/hr/leave` | no | `/api/hr` → SUPER_ADMIN, ADMIN, HR_MANAGER | **no — 401** |
| `/api/hr/devices` | no | `/api/hr` → same | **no — 401** |
| `/api/official-emails` | no | SUPER_ADMIN, ADMIN, MARKETING_MANAGER | **no — 401** |
| `/api/university-agreements` | no | SUPER_ADMIN, ADMIN | **no — 401** |
| `/api/b2b-contacts` | no | SUPER_ADMIN, ADMIN | **no — 401** |
| `/api/communications/templates` | no | 8 staff roles | **no — 401** |
| `/api/interview-questions` | no | SUPER_ADMIN, ADMIN, COUNSELOR | **no — 401** |

**Corrected finding:** these seven are *not* anonymously exposed. They are protected by one centralised
layer (authentication + role allow-list) and have **no second layer of defence inside the handler**.
That is a hardening gap (P2), not an open door (P0). The severity was overstated because the scan
looked only at the handler, which is exactly the mistake this audit is supposed to avoid.

## 2. What the 1,099 routes actually look like

| Verdict | All routes | Mutating routes |
|---|---:|---:|
| `role-gated` (proxy allow-list **and/or** handler guard) | 659 | 337 |
| `handler-gated` (guard in the handler, no proxy prefix) | 261 | 59 |
| `public` (explicitly listed, no handler guard) | 69 | 14 |
| `public-write-gap` (public **and** mutating, no handler guard) | 33 | 33 |
| `auth-only` (any authenticated role, no further check) | 77 | **3** |

Guard vocabulary actually observed: `withAuth` 441, `authenticate*` 213, `require*` 141,
`getServerSession` 74, `is*Manager/Admin` 58, `guard(...)` 23, `has*Access` 21, `resolveStudent*` 8,
`can(...)` 2, secrets/signatures 2.

An earlier version of this analysis reported 288 `auth-only` and 102 "mutating with no guard" because
it matched only `require*`/`auth*` names. It missed `withAuth`, `authenticateRequest`,
`requireCatalogAdmin`, `hasMarketingAccess` and the shared `guard(request, 'awf.*')` helper entirely.
The table above is the corrected result.

## 3. The real residual: 3 mutating routes with no handler-level authorisation

| Route | What it does | Actual risk |
|---|---|---|
| `/api/agent/course-advisor` | all 5 methods return a `410` tombstone; imports no data module | **none** — deliberately disabled, fail-closed |
| `/api/inbox/reply` | `POST` returns `410`; legacy send endpoint disabled | **none** — same |
| `/api/course-finder/eligibility` | computes eligibility; `POST` only; no guard | **latent** — see §4 |

So the honest count of genuinely unguarded *mutating* handlers is **one**, and its caller is dead code.

## 4. The one latent defect, traced end to end

`src/components/course-finder/eligibility-checker.tsx` posts to `/api/course-finder/eligibility`.
That endpoint is **not** in `PUBLIC_API_WRITE_ROUTES` and **not** under a `SENSITIVE_API_ROUTES`
prefix, so an anonymous visitor gets **401**. Note the near-miss that hides this: the public list
contains `/api/course-finder/eligibility-engine` and the sensitive list contains
`/api/course-finder/eligible` — two different spellings, neither of which matches the endpoint the
component actually calls.

The chain then stops being a user-facing bug, because:

* `eligibility-checker.tsx` is an **orphan** (no importer) — report 06 §4;
* its only host, `components/alo/views/public-country.tsx`, is **also an orphan**;
* `public-country` is used as a view name via `onNavigate("public-country", …)` from eight files, and
  **no view registry maps that name** (report 05 §3.3) — the registry exists only in the snapshot.

The live public path is different: `src/app/eligibility-check/page.tsx` → `EligibilityCheckerEnhanced`
→ the public `eligibility-engine` route, which works.

**Conclusion:** the public eligibility flow is *not* broken today, but three separate defects
(an orphaned component, an orphaned host view, a missing view registry) are stacked on top of a 401
that would surface the moment anyone repairs the navigation. Fixing the registry without noticing the
401 would turn a dead link into a confusing error.

## 5. The 33 public mutating routes — by design, but single-layer

These are intentionally anonymous (webhooks, lead capture, consent, review submission, chat, AI
intake). Their safety depends entirely on validation inside each handler: HMAC/JWT for the
`httpsms`/`opensms`/`facebook`/`3cx` webhooks, token verification for `email/unsubscribe` and
`reviews/submit`, rate limiting for the AI and lead endpoints. Examples: `/api/leads`,
`/api/website/lead`, `/api/marketing/consent`, `/api/reviews/submit`, `/api/chat`, `/api/ai/intake`.

**Risk:** any handler that forgets its own validation is open to the internet with no second layer.
That is a legitimate P1 hardening item — but it is *not* the same finding as "7 endpoints have no auth".

One related observation: `isPublicApiRequest` contains a namespace rule —
`if (matchesPath(pathname, "/api/auth") && !matchesPath(pathname, "/api/auth/change-password")) return true`.
This makes **every** `/api/auth/*` route public, including any future one, with `change-password` as the
single hard-coded exception. It is a fail-open default inside that namespace; a new `/api/auth/admin-*`
route would be public on creation. This is worth converting to an explicit allow-list.

## 6. Tests: the 31 failures cannot be attributed to code here

Running the suite reproduces failures, but the cause is environmental:

```
Error: Cannot find module '.prisma/client/default'
Require stack: /home/user/ALO_WEB_CRM_TECH/node_modules/@prisma/client/default.js
```

The Prisma client has never been generated in this sandbox. `npx prisma generate` fails because it
needs `https://binaries.prisma.sh/...`, which is unreachable here:

```
Error: request to https://binaries.prisma.sh/all_commits/c2990dca…/schema-engine.gz.sha256 failed,
reason: Client network socket disconnected
```

Sampled evidence: `tests/unit/business-hours-policy.test.ts` — 5 passed, 2 failed, both failing tests
on the same missing-module error, not on an assertion. `tests/unit/journal-integrity.test.ts` fails at
**collection** for the same reason.

**Therefore the previous claim — "31 tests fail, pre-existing, present on the base commit, CI is red due
to code" — is not supported.** What is supported:

* a subset of the suite fails in *this* environment;
* the observed cause is a missing generated Prisma client, i.e. environment, not logic;
* the true pass/fail state of those 31 tests is **unknown** until `prisma generate` runs somewhere with
  network access.

This does not mean CI is green. It means the test gate is **BLOCKED — unmeasured**, and must be
re-measured on a machine that can generate the client before it is used as a release gate either way.

Failure-cause taxonomy observed so far: (a) missing generated Prisma client — confirmed, environmental;
(b) collection-time import errors — same root cause; (c) genuine assertion failures — **not yet
observed in any sampled file**. The earlier "two failing suites touch authz and storage security"
statement is unverified and should not be repeated until measured.

## 7. Minimal fixes prepared (NOT applied)

| # | Fix | Files | Risk | Regression test to add |
|---|---|---|---|---|
| 1 | Add `requireAuth` + role check inside the 7 handlers (defence in depth) | 7 route files | very low — the proxy already enforces it, so behaviour is unchanged for legitimate callers | 401 with no session, 403 with wrong role, 200 with allowed role |
| 2 | Add `/api/course-finder/eligibility` to `PUBLIC_API_WRITE_ROUTES` **or** delete the orphan component | `proxy.ts` **or** 2 components | low | anonymous POST returns 200 (choice A) or 404 (choice B) |
| 3 | Replace the `/api/auth/*` namespace rule with an explicit list | `proxy.ts` | medium — could lock out a legitimate flow | each listed route remains public; an unlisted `/api/auth/x` returns 401 |
| 4 | Restore a view registry for `onNavigate` view names | 1 file + snapshot | medium | clicking a country card navigates rather than no-ops |
| 5 | Re-measure the test gate with a generated Prisma client | CI only | none | the suite runs green or lists real assertion failures |

None of these was applied. Items 1 and 2 are small and independent; item 3 must not be attempted
without a route-by-route audit of `/api/auth/*` first.

## 8. What is genuinely good

1. **Fail-closed by default.** Unlisted `/api/*` requires a token; missing `NEXTAUTH_SECRET` fails
   closed rather than open.
2. **Private-upload defence in the gate** — path-traversal, double-encoding, and `_next/image`
   absolute-URL abuse are blocked *before* the static-asset bypass, with `403` and `nosniff`.
3. **Two genuinely dead endpoints return `410`** with an explanatory body rather than silently lying —
   including `course-advisor`, which was disabled *because* it served invented supervisor data. That is
   a correct decision, documented in the code.
4. **Role resolution is centralised** with alias handling (`HR` → `HR_MANAGER`, `SUPPORT_AGENT` →
   `SUPPORT_STAFF`) so legacy 7-day sessions do not land on an empty allow-list.
5. **The scan's own errors were found by verification**, not accepted — which is the only reason this
   report can be trusted.
