# Google SEO & Analytics Setup — ALO Education

**Do not conflate** Google Search Console, GA4, Google Business Profile, Google OAuth — four separate integrations with separate auth.

## 1) Sitemap / Robots / Canonical / Structured Data (already implemented)

- `src/app/sitemap.ts` — `MetadataRoute.Sitemap` with 560 universities (ALL_400_UNIVERSITIES) + 19 destinations + 15 language tests + dynamic blogs/courses/scholarships (best-effort DB). Daily for `/`, `/universities`, `/course-finder`, `/blog`; weekly for destinations.
- `src/app/robots.ts` — `allow /`, `disallow /api/crm/admin/partner-admin/employee`, `sitemap: https://aloeducation.com/sitemap.xml`.
- Canonical: `NEXT_PUBLIC_SITE_URL=https://aloeducation.com` in `src/app/layout.tsx` metadata.
- Structured data: `src/lib/seo/schema-helpers.ts` (Organization, Course, Article JSON-LD).

Health: `GET /api/seo/health` shows sitemap/robots ok.

## 2) GA4 Tracking (consent-aware)

Env:
```
GA4_MEASUREMENT_ID=G-XXXXXXXXXX # GA4 → Admin → Data Streams → Measurement ID
GA4_API_SECRET= # GA4 → Admin → Measurement Protocol → API secret
NEXT_PUBLIC_GA4_ENABLED=true
NEXT_PUBLIC_CONSENT_MODE=true
```

- Client: `src/lib/seo/ga4.ts` `ga4Script()` injected in layout when `NEXT_PUBLIC_GA4_ENABLED=true` + consent granted. Consent mode `anonymize_ip`.
- Server: `trackLeadConversion()` via Measurement Protocol for `generate_lead` conversion.

## 3) Google Search Console Integration

Env:
```
GOOGLE_CLIENT_ID= # Google Cloud OAuth2 (same as YouTube/Business Profile)
GOOGLE_CLIENT_SECRET=
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://aloeducation.com
GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON= # base64 service account JSON OR OAuth flow
```

- Verify domain in Search Console (DNS TXT or HTML).
- OAuth: Google Cloud → Enable Search Console API → OAuth consent → scopes `https://www.googleapis.com/auth/webmasters.readonly`.
- Reporting: `src/lib/seo-engine.ts` `analyzeSearchConsoleData` pulls `SearchConsoleRow` → creates `SeoOpportunity` (HIGH_IMPRESSION_LOW_CTR, RANKING_4_20, CONTENT_GAP).
- Indexing status: GSC → Indexing report (manual), no promise of ranking/indexing guarantees.

## 4) Google Business Profile

Env:
```
GOOGLE_BUSINESS_ACCOUNT_ID= # Business Profile → Manage → settings
GOOGLE_CLIENT_ID/SECRET (reuse)
```

- Enable Business Profile API in Google Cloud, OAuth `business.manage`.
- Do not treat as GA4 or Search Console — separate.

## 5) Permissions & Setup Checklist

- [ ] Domain verified in Search Console (https://search.google.com/search-console)
- [ ] GA4 stream created, Measurement ID in `.env` + VPS
- [ ] Consent banner implemented (Phase 9 `NEXT_PUBLIC_CONSENT_MODE`)
- [ ] Sitemap submitted in Search Console → Sitemaps → `https://aloeducation.com/sitemap.xml` → success
- [ ] `GET /api/seo/health` → `configured true` for each

No indexing/ranking guarantees — document only.
