# 02 — Google account and project setup

**Status of this document:** the *requirements* are complete and actionable. The *account
work itself* is `BLOCKED` — it needs a human logged into Google, and no Google credential of
any kind exists in the environment where this work was done.

> **Do not store Google passwords anywhere in this repository or in any password manager
> shared with a contractor.** ALO needs a Google account the organisation owns, plus
> role-based delegation.

---

## 1. Accounts and properties ALO needs

| # | Thing | Required? | Owner | Who needs access | Status |
|---|---|---|---|---|---|
| 1 | ALO-owned Google account (infrastructure identity) | **Yes** | ALO organisation | 2+ named admins | **BLOCKED** — no account exists in this environment |
| 2 | GA4 **Standard** property + one Web data stream for `https://aloeducation.com` | **Yes** | ALO | Marketing manager (Editor), developer (Viewer) | **BLOCKED** |
| 3 | Google Tag Manager **Web** container for `aloeducation.com` | **Yes** | ALO | Marketing manager (Publish), developer (Edit) | **BLOCKED** |
| 4 | Search Console **Domain** property for `aloeducation.com` | **Yes** | ALO | Marketing manager (Full), service account (Restricted) | **BLOCKED** |
| 5 | Google Business Profile for the real Dhaka office | **Yes** | ALO | Marketing manager | **BLOCKED** |
| 6 | Official ALO YouTube channel | Recommended | ALO | Marketing manager | **BLOCKED** |
| 7 | Google Cloud project `alo-education-production` | **Conditional** | ALO | 1 admin + 1 ops | **BLOCKED** — see §4 |

"BLOCKED" here means *cannot be created from code*. Nothing in this repository can create a
Google account, verify a domain, or accept a console invite.

## 2. Why a Cloud project is conditional, not mandatory

| Service ALO actually uses | Needs a Cloud project? | Why |
|---|---|---|
| GA4 tag collection (gtag.js / GTM) | No | The Measurement ID and container ID are public identifiers |
| GA4 Measurement Protocol (server conversions) | No | Authenticated by a data-stream API secret |
| GA4 **Analytics Data API** (reporting reads) | **Yes** — to enable the API and hold the service account | An API must be enabled in *some* project. This project needs **no billing account** |
| Search Console API | **Yes** — same reason | Free, no billing account |
| Google Business Profile API | **Yes** — same reason | Free, no billing account |
| YouTube embedding | No | `youtube-nocookie.com` iframe needs no credential |
| Maps Platform | Would be | **Not used** — PAID, see `10-maps-integration.md` |

So ALO needs **one** Cloud project to hold the credential, with **only these three APIs
enabled** and **no billing account attached**. That is the entire Google Cloud footprint.

## 3. Manual console steps (exact, in order)

### 3a. Google account (10 min, one-time)

1. Create or adopt an account such as `infrastructure@aloeducation.com` on Google Workspace.
   A free `@gmail.com` address is acceptable only if ALO has no Workspace tenant — but then it
   must be a *shared, organisation-owned* account, never an employee's personal one.
2. Enable 2-step verification. Store recovery codes in the ALO-controlled vault, not in Git.
3. Add a second owner/admin so staff turnover cannot strand the properties.

### 3b. GA4 (15 min)

1. GA4 → **Admin → Create property** → name `ALO Education — Production`, timezone
   `Asia/Dhaka`, currency `BDT`.
2. **Data streams → Add stream → Web** → URL `https://aloeducation.com`, stream name
   `ALO website (production)`. **Enhanced measurement: leave ON** except *Form interactions*
   (ALO sends its own `lead_form_submit`; leaving the automatic one on double-counts).
3. Copy the **Measurement ID** (`G-…`) → this is `GA4_MEASUREMENT_ID`.
4. **Property settings** → copy the numeric **Property ID** → this is `GA4_PROPERTY_ID`
   (needed for reporting reads; it is *not* the `G-` id).
5. **Data streams → Measurement Protocol API secrets → Create** → this is `GA4_API_SECRET`
   for server-side conversions. This value is a **secret**.
6. Create a **second property** for staging, and never point staging at this one. The app
   already suppresses tag injection outside production (`src/lib/google/config.ts`), and the
   staging property is the second line of defence for the `ANALYTICS_ALLOW_NON_PRODUCTION`
   override.

### 3c. Google Tag Manager (10 min)

1. tagmanager.google.com → **Create account** `ALO Education` → **Container** `aloeducation.com`,
   target platform **Web**.
2. Copy the container ID (`GTM-…`) → `NEXT_PUBLIC_GTM_ID`.
3. Do **not** add a GA4 Configuration tag yet: read `05-gtm-implementation.md` first. The
   application already pushes every event into `dataLayer`; the container only needs the one
   GA4 Configuration tag plus triggers.
4. Publishing workflow: developer **Edit**, marketing manager **Publish**. Never publish an
   untested container (see the checklist in `05`).

### 3d. Search Console (10 min + DNS)

1. search.google.com/search-console → **Add property → Domain** → `aloeducation.com`.
   Choose **Domain**, not URL-prefix: a domain property covers http, https, `www` and every
   subdomain in one place.
2. Verify by **DNS TXT record** at the DNS provider. This is the only ownership check that
   does not depend on a specific web server or deployment.
3. Submit `https://aloeducation.com/sitemap.xml` under **Sitemaps**.
4. Leave **API access** until step 3f; verification alone does not grant API access.

### 3e. Business Profile (varies — may require postal verification)

1. business.google.com → check whether ALO already has a profile. **If one exists, claim and
   preserve it** — do not create a duplicate listing.
2. Only create a location if it is a real, staffed, customer-facing office. Never invent a
   branch.
3. Fill: official name, primary category (education consultant / study-abroad agency),
   website, local phone, hours, services, logo, and genuine photographs of the office.
4. Copy the **account ID** → `GOOGLE_BUSINESS_ACCOUNT_ID`.
5. Do not publish changes that need business sign-off before someone at ALO approves them.

### 3f. Cloud project (20 min, no billing)

1. console.cloud.google.com → **New project** → name `ALO Education Production`, ID
   `alo-education-production` (or a suffix if taken). **Check for an existing suitable
   project first** — one may already exist for OAuth.
2. **APIs & Services → Library** → enable exactly three:
   - `searchconsole.googleapis.com` (Search Console API)
   - `analyticsdata.googleapis.com` (Analytics Data API)
   - `mybusinessaccountmanagement.googleapis.com` + `mybusinessbusinessinformation.googleapis.com`
     (Business Profile)
3. **Do not** enable Maps JavaScript/Places/Geocoding — PAID. **Do not** attach a billing
   account. If the console demands billing for an API, stop: that API is not one of the three.
4. **IAM → Service accounts → Create** → `alo-web-reader` → no project roles (Google
   product access is granted per-property, not via project IAM).
5. Create a **JSON key**, download it once, and store it in the deployment secret store. It
   becomes `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` (inline JSON or base64 — both accepted by
   `src/lib/google/oauth.ts`). The same credential serves Search Console, Analytics Data and
   Business Profile.
6. Grant the service-account email `…@alo-education-production.iam.gserviceaccount.com`:
   - **Search Console** → Settings → Users and permissions → add as **Restricted** (read).
     Domain verification is *not* inherited by a service account; this grant is mandatory.
   - **GA4** → Admin → Property access management → add as **Viewer**.
   - **Business Profile** → Users → add as **Manager** (or read-only where offered).
7. Optional, if OAuth refresh tokens are preferred over a service account:
   **OAuth consent screen → External → add scopes** `webmasters.readonly`,
   `analytics.readonly`, `business.manage`; add `https://aloeducation.com` as an authorized
   domain; complete the consent flow once with the infrastructure account; store the refresh
   token as `GOOGLE_OAUTH_REFRESH_TOKEN`.

## 4. Ownership and administrator responsibilities

| Responsibility | Role | Cadence |
|---|---|---|
| Owns the Google account and its recovery method | Account owner (2 people) | Continuous |
| Adds/removes staff access to GA4, GTM, Search Console, Business Profile | Marketing manager | On staff change |
| Rotates the service-account key and the Measurement Protocol secret | Operations lead | Every 90 days, and on any suspected exposure |
| Publishes GTM containers | Marketing manager (after dev test) | Per change |
| Approves any billing-account creation | Director | Before any PAID service |
| Reviews `GET /api/google/status?live=true` | Marketing manager | Monthly |

## 5. What must never happen

- No Google password, OAuth client secret, refresh token, service-account key or Measurement
  Protocol secret in Git, in a chat, in a screenshot, or in a `NEXT_PUBLIC_*` variable. Only
  the GA4 Measurement ID and the GTM container ID are public by design.
- No billing account without written director approval (`12-billing-and-cost-control.md`).
- No duplicate GA4 property, GTM container, Search Console property or Business Profile
  listing "to be safe". Duplicates split data permanently and cannot be merged.
- No Business Profile location that is not a real office.

## 6. Environment variables this setup produces

| Variable | Secret? | Where it goes | Needed for |
|---|---|---|---|
| `GA4_MEASUREMENT_ID` | No (public) | deployment env | tag collection |
| `GA4_PROPERTY_ID` | No | deployment env | Analytics Data API reporting |
| `GA4_API_SECRET` | **Yes** | deployment secret store | server-side conversions |
| `NEXT_PUBLIC_GTM_ID` | No (public) | deployment env | GTM loader |
| `NEXT_PUBLIC_GA4_ENABLED` | No | deployment env | activation switch |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | No | deployment env | which property to query |
| `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` | **Yes** | deployment secret store | all three APIs |
| `GOOGLE_BUSINESS_ACCOUNT_ID` | No | deployment env | Business Profile reads |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE` | No | deployment env | channel link/embeds |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_REFRESH_TOKEN` | **Yes** (secret/refresh) | deployment secret store | alternative to service account |
| `NEXT_PUBLIC_SITE_URL` | No | deployment env | canonical origin used by analytics + sitemaps |
| `ANALYTICS_ALLOW_NON_PRODUCTION` | No | staging only | opt-in for staging DebugView |

Every one of these is documented with commentary in `.env.example`. `GA4_PROPERTY_ID` was
added in this pass; nothing existing was renamed or removed.
