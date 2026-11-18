# 08 — Google Business Profile

**Cost:** FREE, no billing account. **Requires:** one verified, real, staffed location.

**Status:** `BLOCKED` — no Google Business Profile credential or account exists in this
environment, and creating or verifying a listing requires a human at the business address.

---

## 1. Duplicate check comes first

A duplicate listing splits reviews and ranking permanently and **cannot be merged**. Before
creating anything:

1. Search Google Maps for `ALO Education` + the office address, and for the phone number.
2. Search for variants: `ALO`, `ALO Education Consultancy`, `ALO Study Abroad`.
3. Check the Maps "claimed this business?" prompt on any listing found.
4. If a listing exists: **claim it** (or request access) and correct it. Do not create a new one.

## 2. What may be published — and only if real

| Field | Rule |
|---|---|
| Business name | The registered trading name. No keyword stuffing, no "ALO Education — Best Study Abroad Consultant Dhaka" |
| Primary category | Education consultant / study-abroad agency (whatever Google offers in the locale) |
| Website | `https://aloeducation.com` (the canonical origin used everywhere in this codebase) |
| Phone | The real office number. This is the number already published on the site's public contact surfaces |
| Hours | Real opening hours, including holiday closures |
| Services | The services ALO actually sells (listed in `src/app/services`) |
| Logo | The official ALO mark used by the site |
| Photos | **Genuine photographs of the real office**, not stock imagery or another branch |
| Address | The real address. Never a virtual office, never a colleague's flat |
| Reviews | Solicited honestly from real students. Never purchased, never gated |

**Never create a location that is not a real office.** The specification forbids invented
branches, and it is also a suspension risk for the whole account.

## 3. What is implemented in code

| Surface | File | Verified state |
|---|---|---|
| Shared Google OAuth for Business Profile | `src/lib/google/oauth.ts` (`SCOPE_BUSINESS_PROFILE`) | Real; needs a credential |
| Outbound read client | `src/lib/google/business-profile.ts` — accounts, locations, and a location projection (name, category, phone, website, hours summary, address, rating, review count) | Real; `BLOCKED` on credential |
| Read endpoint | `GET /api/google/business-profile` | Real; guarded by staff auth; returns `BLOCKED`/`NOT_CONFIGURED` honestly |
| Status row | `GET /api/google/status` → `BUSINESS_PROFILE` | Real, with `liveVerified` |
| Admin panel | `/admin/google-stack` → "Google Business Profile — locations" | Real |
| **Inbound** notifications | `POST /api/marketing/webhooks/google-business` | **PASS** — shared-token check with `timingSafeEqual`, fails closed with HTTP 500 in production when the token is unset |
| Env | `GOOGLE_BUSINESS_ACCOUNT_ID` | Documented in `.env.example` |

### Deliberately not implemented: write operations

There is **no** code path that creates or edits a profile, posts an update, uploads a photo or
replies to a review. Reasons:

1. The specification says not to publish business information without authorisation.
2. A write path needs a review/approval control the current UI does not have.
3. A wrong write is publicly visible and hard to retract — the asymmetry favours human action.

Review *reading* is also `NOT REQUIRED`: Google restricts the v4 reviews API to accounts with
10+ locations. ALO has one office, so the endpoint would return a permission error by design.

## 4. Preparation checklist (ready to execute)

- [ ] Duplicate search completed, result recorded with a date
- [ ] Existing listing claimed (if any) and *not* duplicated
- [ ] Real address, phone, hours, category confirmed by the office manager
- [ ] Official logo file chosen (same asset the website uses)
- [ ] ≥5 genuine office photographs available
- [ ] Services list matches `src/app/services`
- [ ] A named person at ALO with authority has approved publication
- [ ] `GOOGLE_BUSINESS_ACCOUNT_ID` captured after verification
- [ ] Service account added to the Business Profile account (for API reads)
- [ ] `GET /api/google/status?live=true` shows `BUSINESS_PROFILE: PASS`

## 5. Structured data that supports the listing

`organizationSchema()` in `src/lib/seo/schema-helpers.ts` is rendered site-wide from
`src/app/layout.tsx` as `<script type="application/ld+json">`, serialised with `<` escaped so a
field value cannot break out of the script element. This gives Google a sitewide
`EducationalOrganization` entity to associate with the Business Profile — which was previously
defined but never rendered.

The map requirement is met with zero-cost deep links (see `10-maps-integration.md`), so the
site shows where the office is without loading the Maps SDK.

## 6. Status

| Item | Status |
|---|---|
| Duplicate detection procedure | **PASS** (documented, mandatory first step) |
| Publication preparation | **PASS** (checklist above; content must come from the business) |
| Existing profile preservation | **BLOCKED** — cannot check Google from here |
| Listing creation / verification | **BLOCKED** — needs a human at the address; may require postal verification |
| API read of locations | **BLOCKED** — needs credential + account id |
| Inbound webhook | **PASS** (code; token-gated, fails closed) |
| Review reading | **NOT REQUIRED** — 10+ location restriction |
| Write/publish automation | **NOT REQUIRED by decision** — would violate the no-unsupervised-publication rule |
| Fake branches | **PROHIBITED** and not present |
