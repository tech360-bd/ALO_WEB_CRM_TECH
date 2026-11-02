# Phase 0D · 04 — Remaining Mutating-Route Security Analysis

**Data:** `phase0c/authz-matrix.csv` (1,099 routes), `phase0c/authz-summary.json`,
`phase0d/test-blocker-analysis.csv` · **No application change was made.**

---

## 1. The seven previously flagged endpoints are protected — confirmed

`src/proxy.ts` is the Next.js **16.4.2** request boundary (`export default async function proxy`,
`config.matcher = ["/:path*"]`). For `/api/*` it executes, in order:

```ts
if (pathname.startsWith("/api/") && isPublicApiRequest(pathname, method)) return NextResponse.next();
if (pathname.startsWith("/api/")) {
  if (!token) return NextResponse.json({ error: "Unauthorized…" }, { status: 401 });
  for (const [prefix, allowedRoles] of Object.entries(SENSITIVE_API_ROUTES))
    if (matchesPath(pathname, prefix) && !allowedRoles.includes(sessionRole))
      return NextResponse.json({ error: "Forbidden…" }, { status: 403 });
  return NextResponse.next();
}
```

All seven are absent from `PUBLIC_API_READ_ROUTES` and `PUBLIC_API_WRITE_ROUTES`, and all seven fall under
a `SENSITIVE_API_ROUTES` prefix:

| Endpoint | Non-public | Role allow-list source | Anonymous | Wrong role |
|---|---|---|---|---|
| `/api/hr/leave` | ✔ | `/api/hr` | 401 | 403 |
| `/api/hr/devices` | ✔ | `/api/hr` | 401 | 403 |
| `/api/official-emails` | ✔ | own prefix (SUPER_ADMIN, ADMIN, MARKETING_MANAGER) | 401 | 403 |
| `/api/university-agreements` | ✔ | own prefix (SUPER_ADMIN, ADMIN) | 401 | 403 |
| `/api/b2b-contacts` | ✔ | own prefix (SUPER_ADMIN, ADMIN) | 401 | 403 |
| `/api/communications/templates` | ✔ | `/api/communications` (8 staff roles) | 401 | 403 |
| `/api/interview-questions` | ✔ | own prefix (SUPER_ADMIN, ADMIN, COUNSELOR) | 401 | 403 |

**Classification:** protected by the request boundary. Their gap is the absence of a *second* layer
inside the handler, so a future matcher change, a bypass, or an internal invocation loses all
authorisation at once. That is defence-in-depth debt (P2), not an open endpoint (P0).

## 2. The actually-unguarded mutating handlers: three, one of them real

| Route | Methods exported | In-handler guard | Reality |
|---|---|---|---|
| `/api/agent/course-advisor` | GET, POST, PUT, PATCH, DELETE | none | every method returns a `410` tombstone; imports no data module — **no risk** |
| `/api/inbox/reply` | POST | none | returns `410`; legacy send disabled — **no risk** |
| `/api/course-finder/eligibility` | **POST only** | **none** | live compute path; see §3 |

The two `410`s are correct decisions, not oversights: `course-advisor` was disabled because it served
invented supervisor records. They should still be *retired* eventually, because a tombstone that
happens to be unauthenticated is one refactor away from being a real endpoint again.

## 3. `/api/course-finder/eligibility` — verified, and the answer is "retire"

| Question | Answer |
|---|---|
| Methods | `POST` only (`export async function POST`) |
| Auth | none — no session read, no role check, no token |
| Data exposure | **None.** `baseWhere = { approvalStatus: 'PUBLISHED', verificationStatus: 'VERIFIED' }`, so it can only return records already public |
| PII exposure | none — course/university fields only |
| Code quality | `// @ts-nocheck` on a 265-line handler |
| Callers | exactly one: `src/components/course-finder/eligibility-checker.tsx`, itself an **orphan** whose host view is also an orphan |
| Live equivalent | `POST /api/course-finder/eligibility-engine` — public by design, backed by `src/lib/university-course/eligibility-engine`, used by 4 live components |

**Is handler/service-level defence needed?** Neither. Authorising the route would keep a second,
type-unchecked implementation of an engine that already ships and is maintained, and would leave dead UI
behind it. **Retirement is the correct fix.** Ordering matters: retire the route *and* the two orphan
components in one change, otherwise the 401 returns the moment someone re-links the view.

If a product owner insists on keeping it, the minimum is: delete `@ts-nocheck`, delegate to
`eligibility-engine`, add it to `PUBLIC_API_WRITE_ROUTES` with the same rate limit as the engine, and add
the tests in §6.

## 4. Public write surface — 33 routes, single-layer by design

`authz-matrix.csv` records **33** mutating routes that are public by design and have no handler guard:
`/api/leads`, `/api/website/lead`, `/api/lead-forms`, `/api/language-prep/leads`, `/api/marketing/consent`,
`/api/reviews/submit`, `/api/reviews/feedback`, `/api/chat`, `/api/events`, `/api/behavior/track`, the
`/api/ai/*` intake endpoints, and the provider webhooks (`httpsms`, `opensms`, `facebook`, `3cx`).

Their only protection is whatever each handler does itself: HMAC/JWT verification for webhooks, token
verification for unsubscribe/review, rate limiting for AI and lead capture. That is a legitimate design,
but it means **one missing check is an open endpoint**. Recommendation (P1 hardening, not a blocker):
a table-driven test that asserts every route in `PUBLIC_API_WRITE_ROUTES` either verifies a signature, a
token, or a rate limiter — so a new public write route cannot be added without one.

## 5. Two namespace/ordering findings

**(a) `/api/auth/*` is fail-open by namespace.** `isPublicApiRequest` contains:

```ts
if (matchesPath(pathname, "/api/auth") && !matchesPath(pathname, "/api/auth/change-password")) return true;
```

Every `/api/auth/*` route is public **by existing**, with `change-password` as a hard-coded exception.
A future `/api/auth/admin-reset` would be public on creation. This is how `register`, `reset-password`
and `verify-otp` correctly work anonymously — but the mechanism should be an explicit allow-list.

**(b) Authorisation-after-validation in `/api/whatsapp/numbers` (POST).** A failing test asserts it:

```
requires Super Admin for Meta identifiers … expected 400 to be 403
```

In the Meta-identifier branch the handler validates the phone number (line 167, `400`) **before** checking
`isSuperAdmin` (line 172, `403`), so a caller without the role learns that their input was invalid
rather than that they are forbidden. It is not privilege escalation — the request still fails — but it is
an information leak about validation internals, and it makes the authz contract untestable. Fix: move
role checks above body validation in that branch. This is one of the 16 genuine test failures
(report 05 §3), not an infrastructure artefact.

## 6. Tests to add with any change here

| Test | Asserts |
|---|---|
| Anonymous `POST /api/course-finder/eligibility` | **404** after retirement |
| Anonymous `POST /api/course-finder/eligibility-engine` | 200, and response contains no non-`VERIFIED` course |
| Each of the 7 endpoints, no session | 401 |
| Each of the 7 endpoints, wrong role (e.g. STUDENT token) | 403 |
| Each of the 7 endpoints, allowed role | 200 |
| Every route in `PUBLIC_API_WRITE_ROUTES` | has a signature, token or rate-limit check |
| `/api/whatsapp/numbers` POST, non-Super-Admin, malformed body | 403 (not 400) — the ordering fix |
| Any new `/api/auth/*` route not on the allow-list | 401 |

## 7. Summary judgement

| Item | Severity | Action |
|---|---|---|
| 7 endpoints rely solely on the proxy | P2 | optional defence-in-depth; add in-handler guards |
| `/api/course-finder/eligibility` unguarded | P3 (dead caller) | **retire route + 2 orphans** |
| 33 public write routes, single layer | P1 hardening | table-driven guarantee test |
| `/api/auth/*` fail-open namespace | P2 | explicit allow-list |
| `/api/whatsapp/numbers` validation-before-authz | P2 | reorder; genuine test failure |
| 2 unauthenticated `410` tombstones | P3 | retire eventually |

No endpoint in this analysis is anonymously reachable with unmet authorisation for its data.
