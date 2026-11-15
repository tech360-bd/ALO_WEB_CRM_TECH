# 10 — Google Maps requirements assessment

**Decision: Maps Platform is NOT USED. Status: `NOT REQUIRED` — by documented decision, not by
oversight.**

---

## 1. The requirement, honestly assessed

The specification asks what ALO actually needs Maps for:

| Potential use | Does ALO need the Maps SDK? |
|---|---|
| Office locator | No — "Open in Google Maps" deep links already do this |
| University campus locations | No — a deep link plus the address text is sufficient and infinitely cheaper |
| Campus maps | No — the university's own site is authoritative |
| Directions | No — a deep link hands the user to Google Maps with the destination preset |
| Country and city pages | No — these are editorial pages, not map surfaces |
| Real office location map | **This is the only candidate** — and a static deep-link card satisfies it |

## 2. What is live instead (zero cost, zero key, zero billing)

| Surface | File | Mechanism |
|---|---|---|
| Global offices page | `src/app/global-offices/page.tsx` | `https://www.google.com/maps/search/?api=1&query=…` deep link |
| Public footer | `src/components/website/PublicFooter.tsx` | Deep link |
| Public contact view | `src/components/alo/views/public-contact.tsx` | Deep link |

These are ordinary links. They cost nothing, need no key, cannot be rate-limited, cannot
exceed a quota, cannot be billed, and keep working if Google is unreachable (the user's own
Maps app handles it).

## 3. Why an embedded map was rejected

| Cost of adopting Maps | Detail |
|---|---|
| **Billing account required** | There is no billing-free Maps tier any more. Adopting it means the first PAID Google dependency in a system whose brief is a *free* stack |
| **Key management** | A browser-embedded key must be HTTP-referrer restricted *and* API restricted; an unrestricted key is a well-known way to receive a five-figure bill from someone else's traffic |
| **Consent surface** | The Maps JS SDK sets cookies and loads third-party script on page load. That is a new consent obligation for every visitor on every page that shows a map |
| **Reliability** | A map is a third-party render dependency; on a slow Bangladeshi mobile connection it would delay the page it appears on |
| **Benefit** | One click saved on one page |

## 4. Code posture (already correct, nothing to change)

| Guard | Implementation |
|---|---|
| The key is read **server-side only** | `getGoogleStackConfig().maps` reads `GOOGLE_MAPS_API_KEY`; there is no `NEXT_PUBLIC_` alias, so the key cannot be inlined into the client bundle even if someone sets it |
| Nothing loads the Maps SDK | No `maps.googleapis.com` script tag exists anywhere in the repository |
| The key is never rendered | It appears only as a presence flag in `/api/google/status` |
| Cost classified as PAID | `GOOGLE_SERVICE_COSTS.MAPS` → `tier: 'PAID'`, `billingAccountRequired: true`, `optional: true` |
| Reported as deliberately unused | The status endpoint's `MAPS` row carries `NOT CONFIGURED — intentional` and the deep-link list |

## 5. If Maps is ever genuinely required — mandatory pre-flight

None of this is done, and none of it may be done without written director approval.

- [ ] Written business case naming the specific feature and page that needs an interactive map
- [ ] Director approval recorded **before** a billing account is attached
- [ ] A dedicated Cloud project (never the same project as analytics/search credentials)
- [ ] Billing account attached, **budget alert at a low threshold**, and a named person who
      receives the alerts
- [ ] API key restricted to: **HTTP referrers** (`https://aloeducation.com/*`,
      `https://www.aloeducation.com/*`) **and** specific APIs (only the ones needed)
- [ ] Per-API daily quota caps set below the free credit, so an abuse spike degrades instead of
      billing
- [ ] Consent review: does the map load before consent? (If yes, it must not)
- [ ] Graceful fallback implemented and tested: with the SDK blocked, the page must show the
      address text and the deep link
- [ ] Documented overage exposure: what one million map loads would cost at current pricing
      (pricing changes; re-check at adoption time, do not quote a figure from memory)
- [ ] Confirmation that **budget alerts are notifications, not hard caps** — quota limits are
      the only real ceiling

## 6. Status

| Item | Status |
|---|---|
| Requirements assessment | **PASS** — this document |
| Zero-cost alternative in production | **PASS** — three live deep-link surfaces |
| Maps SDK / API | **NOT REQUIRED** |
| Billing account for Maps | **NOT CREATED** — and must not be without approval |
| Unrestricted key exposure | **PASS** — no key is rendered or inlined; server-side read only |
