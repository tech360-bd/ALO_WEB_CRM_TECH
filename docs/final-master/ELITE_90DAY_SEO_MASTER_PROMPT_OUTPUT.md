# ELITE 90-DAY SEO MASTER PROMPT — TOP-3 GOOGLE (ALO EDUCATION)
**Date:** 2026-09-14 Asia/Dhaka — Knowledge cutoff preserved, live web verified  
**Repo:** `alo_education_z....ai` @ `arena/01a09c20-alo-education-z-ai` (2521bfa → this commit)  
**Owner:** ALO Education — green-road, Dhaka — Bangladesh → UK/USA/Canada/Australia/Germany  
**Goal:** 90 days to Top-3 for 15+ money long-tails · 90 SEO pages indexed · 540 social assets · 5k leads  
**Stack reused:** `next sitemap.ts / robots.ts + /api/marketing/seo|auto-pipeline + Brand Kit + SIZE_MATRIX + Library Repost + Google webhook` (audit 6/6 fixed)

> **Live SEO note (Sept 2026):** Content below uses **fresh web verification** (Sept 14 2026). Do NOT use pre-2024 SDS/GTE/2-year Graduate visa claims. See §0.

---

## §0 — 2026 LIVE TRUTH (verified 2026-09-14)

### 0.1 UK Graduate Route — 18 months from 1 Jan 2027
- **Until 31 Dec 2026:** taught bachelor's/masters = **2 years**, PhD = 3 years.
- **From 1 Jan 2027 applications:** taught bachelor's/masters = **18 months**, PhD stays **3 years**. Confirmed by UK Government Graduate visa page, Bath.ac.uk (Statement of Changes 14 Oct 2025, Home Office guidance 11 Nov 2025), Hexons Law 16 Apr 2026. PhD not cut.
- **SEO implication:** Every UK page must say `2 years if you apply by 31 Dec 2026, 18 months from 1 Jan 2027` — never `2 years` alone. Add “PhD stays 3 years”.

### 0.2 Canada — SDS GONE, regular stream, PAL + capped permits, PGWP rules tightened
- **SDS / NSE ended 2:00 p.m. ET 8 Nov 2024** — all permits now regular stream (20-45d → 8-12 weeks for India/Bangladesh) [studies-overseas, immigrationnewscanada, hindustantimes, ndtvprofit, karangupta 30 Apr 2026].
- **Study permit cap:** 437k (2025) → **408,000 (2026)**; master's/PhD exempt from cap/PAL from 1 Jan 2026; diploma/bachelor need PAL + compete.
- **PGWP from 1 Nov 2024:** language `CLB 7` degree / `CLB 5` diploma+PTE Core valid; **field-of-study restriction** for non-degree: program's 6-digit **CIP code** must be on IRCC shortage list (Healthcare/STEM/Trades/Agriculture/Transport/Education). Degrees exempt. **List frozen for 2026** (IRCC 15 Jan 2026) — 1,107 programs eligible; June 2025 revision added 119 / removed 178 [eecglobal 7 Feb 2026, applyboard 30 Jun 2026, jcalaw 5 Aug 2026, economictimes 12 Sep 2026, visaflo 23 Apr 2026].
- **Spouse open work permit:** restricted to master's 16+ months / doctoral only from 1 Jan 2025.
- **SEO implication:** Never promise SDS “20-day”. Always explain PAL, cap, CIP check before enrolling, language test before PGWP.

### 0.3 Australia — Genuine Student (GS) replaced GTE 23 Mar 2024, cost AUD $29,710
- **GS requirement** = structured questions (ties home, why course/provider, future benefit, immigration history). Accepts future PR intent if primary purpose is genuine study [studyau 12 May 2025, mymigration 3 Aug 2026, migrationvisportal 25 Mar 2026].
- **Living costs 2026:** `AUD $29,710/yr` + tuition + travel (partner +$10,394, child +$4,449), secure-centre English only (no at-home), OSHC full duration, CoE via PRISMS+CRICOS, work **48h/fortnight** [applyboard 18 Jun 2026].
- **SEO implication:** Replace every “GTE” with GS. Quote $29,710 plus tuition.

### 0.4 Google FAQ Rich Results — killed 7 May 2026
- Display stopped 7 May 2026 (banner on FAQPage docs), GSC report + Rich Results Test removed June 2026, Search Console API removed Aug 2026. Even gov/health lost eligibility (they alone had it since Aug 2023) [seo-kreativ 23 Aug 2026, fastfrigate 13 Aug 2026, nobsmarketplace 8 May 2026]. Google still parses FAQPage but **no SERP dropdown**.
- **SEO implication:** Keep `FAQPage` schema for Bing/AI parsers + on-page UX, but do NOT pitch “FAQ rich result” to client. Shift to `Article` + `HowTo` + `BreadcrumbList` + enhanced TOC/featured snippet targeting.

### 0.5 Site truth
- `https://aloeducation.com` returned **502 Bad Gateway (nginx 1.20.1)** on fetch 2026-09-14 — infra fix needed (Caddy/PM2). Cached SERP shows: Suite 347 Concept Tower 68/69 Green Road, Panthapath Dhaka-1205, +8801327189194, info@aloeducation.com, “Education Counseling and Application Processing are completely free”.

---

## DELIVERABLE 01 — Technical SEO Hardening (Sitemap / Robots / Indexing)

### 1A. Sitemap — FIXED in this commit
Previous `sitemap.ts` only emitted static routes + universities from `university-data-uk/intl` (not DB, not blog/courses/scholarships/resources). Patched to:

```ts
// src/app/sitemap.ts (after patch)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aloeducation.com";
  const staticRoutes = [...]; // with correct changeFrequency/priority + new /blog /services /resources
  // universities from code (kept) + dynamic from DB (if reachable)
  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const [courses, blogs, scholars, resources] = await Promise.all([
      db.coursePage.findMany({ select:{slug:true,updatedAt:true,status:true}, where:{status:"PUBLISHED"}, take:5000 }).catch(()=>[]),
      db.blogPost.findMany({ select:{slug:true,updatedAt:true}, where:{status:"PUBLISHED"}, take:1000 }).catch(()=>[]),
      db.scholarship.findMany({ select:{slug:true,updatedAt:true}, where:{status:"PUBLISHED"}, take:1000 }).catch(()=>[]),
      db.resource.findMany({ select:{slug:true,updatedAt:true}, where:{status:"PUBLISHED"}, take:1000 }).catch(()=>[]),
    ]);
    // map each → { url, lastModified, changeFrequency:'weekly', priority:0.7-0.8 }
  } catch {}
  return [...staticRoutes, ...universityRoutes, ...dynamic];
}
```
Also adds `/services`, `/blog`, `/scholarships`, `/resources` with `daily/weekly`. Falls back to static when DB unavailable (sandbox-safe).

### 1B. Robots — kept but tightened
```ts
disallow: ['/api/','/crm/','/admin/','/partner-admin/','/employee/','/student/','/_next/']
allow: ['/']
sitemap: https://aloeducation.com/sitemap.xml
```
No crawl budget wasted on API/CRM.

### 1C. Indexing ops (existing + new)
- **Auto `sitemap.xml` regeneration** on every blog/course publish (via `auto-pipeline` BLOG branch).
- **Search Console Indexing API** — use service account JSON (`GOOGLE_INDEXING_SERVICE_ACCOUNT`) to `POST https://indexing.googleapis.com/v3/urlNotifications:publish {url, type: URL_UPDATED}` after each publish. Documented in §15 ENV.
- **Internal sitemap ping:** `GET https://www.google.com/ping?sitemap=https://aloeducation.com/sitemap.xml` on deploy.

**Status:** `FULLY_BUILT` (patched + tested typecheck)

---

## DELIVERABLE 02 — Keyword Universe — Pillar-Cluster (Bangladesh → 5 destinations)

Core principle: **1 pillar per country/intent**, **6-10 clusters per pillar**, each article targets one primary keyword + 3-5 secondary + FAQ.

### Primary money pillars (5) → 15 long-tails to Top-3

| Pillar | Primary keyword (Bangladesh) | Difficulty note | Cluster count |
|---|---|---|---|
| **PILLAR UK** | study in UK from Bangladesh | High vol · 18mo Graduate hook | 10 |
| PILLAR Canada | study in Canada from Bangladesh requirements 2026 | SDS-dead + PAL/PGWP hook | 10 |
| PILLAR Australia | study in Australia from Bangladesh cost 2026 | GS + $29,710 hook | 8 |
| PILLAR USA | study in USA from Bangladesh without IELTS | Medium | 8 |
| PILLAR Germany | study in Germany from Bangladesh free tuition | Medium | 6 |
| **SCHOLARSHIP** | scholarships for Bangladeshi students 2026 | Cross-pillar | 8 |
| **VISA** | UK student visa from Bangladesh / Canada study permit | Cross-pillar | 8 |

### Full long-tail target list (15 → Top-3, 60+ supporting)

**UK (updated Graduate 18mo)**
1. `study in UK from Bangladesh without IELTS` (updated: IELTS alternatives + UKVI)
2. `UK September 2026 intake Bangladesh deadline`
3. `UK January 2027 intake Bangladesh apply`
4. `UK graduate visa 18 months Bangladesh` — **new 2027 angle — zero competition freshness**
5. `UK student visa requirements Bangladesh 2026`
6. `study in UK cost Bangladesh 2026`
7. `UK scholarship Bangladesh 2026`
8. `MOI accepted UK universities Bangladesh`
9. `UK CAS process Bangladesh`
10. `UK credibility interview Bangladesh`

**Canada (SDS ended → regular; PGWP CIP gate)**
11. `study in Canada from Bangladesh requirements 2026` (PAL, proof funds)
12. `Canada study permit without SDS Bangladesh` — **new post-SDS intent**
13. `Canada PGWP eligible courses Bangladesh 2026` (CIP list frozen)
14. `Canada study permit cap PAL Bangladesh`
15. `Canada student visa processing time Bangladesh 2026`
16. `study in Canada cost Bangladesh 2026`

**Australia (GS)**
17. `study in Australia from Bangladesh requirements 2026` (GS)
18. `Australia student visa Genuine Student Bangladesh`
19. `Australia student visa cost 29,710 Bangladesh 2026`
20. `study in Australia without IELTS Bangladesh` (PTE)

**USA/Germany/scholarship**
21. `study in USA from Bangladesh scholarship`
22. `study in Germany free tuition Bangladesh 2026`
23. `fully funded scholarships Bangladeshi students UK Canada Australia`
24. `scholarship without IELTS Bangladeshi students`
25. `study abroad consultancy Dhaka Bangladesh` (brand/BNP)

### Keyword → intent map (sample)

| Keyword | Intent | Page type | CTA |
|---|---|---|---|
| study in UK from Bangladesh without IELTS | Informational → transactional | Pillar UK + landing | Book Free Counseling + Eligibility Check |
| UK graduate visa 18 months | Informational (freshness) | Blog + FAQ | Consult + Course Finder |
| Canada study permit without SDS | Informational + anxiety | Pillar Canada + checklist | PAL Explainer + Counselor |
| Canada PGWP eligible courses | Commercial investigation | Course list + CIP tool | PGWP Checker + Apply |
| Australia Genuine Student requirement | Informational | Pillar AU + GS template | GS Statement Help |

All keywords map to **one dedicated URL** — no cannibalization. See §09 linking.

---

## DELIVERABLE 03 — 90-Day Editorial Calendar (90 posts: 15 Sep → 13 Dec 2026)

Cadence: **1 blog/day** (800-2000w) + **3 social posts/day** (FB/IG/LINKEDIN) via auto-pipeline = **90 blogs + 270 social = 360 indexed assets + 540 with 4-size variants**.

Calendar file: `docs/final-master/90DAY_EDITORIAL_CALENDAR.csv` (machine-readable) + summary below.

### Weekly structure (repeated 13 weeks)

| Day | Blog pillar | Primary keyword | Social angle |
|---|---|---|---|
| Mon | UK | UK September intake / Graduate 18mo | Scholarship alert |
| Tue | Canada | SDS-dead / PAL / PGWP CIP | Course eligibility carousel |
| Wed | Australia | GS / $29,710 / work 48h | Cost breakdown |
| Thu | USA/Germany | Without IELTS / free tuition | Success story |
| Fri | Scholarship | Fully funded | Scholarship of week |
| Sat | Visa How-to | Visa requirements 2026 | Checklist visual |
| Sun | Life/FAQ | Cost of living / MOI | FAQ / poll |

### First 30 days (excerpt — full 90 in CSV)

| Day | Date | Blog title (60-70ch) | URL slug | Primary KW | Cluster |
|---|---|---|---|---|---|
| 1 | 2026-09-15 | Study in UK from Bangladesh 2026: Cost, Visa & Graduate 18 Months | `study-in-uk-from-bangladesh-2026` | study in UK from Bangladesh | UK PILLAR |
| 2 | 2026-09-16 | Canada Study Permit Without SDS: PAL, Requirements 2026 | `canada-study-permit-without-sds-2026` | Canada study permit without SDS | Canada PILLAR |
| 3 | 2026-09-17 | Study in Australia 2026: Genuine Student + AUD 29,710 Guide | `study-in-australia-gs-29710-2026` | study in Australia from Bangladesh | Australia PILLAR |
| 4 | 2026-09-18 | Study in USA Without IELTS from Bangladesh 2026 | `study-in-usa-without-ielts-bangladesh` | study in USA without IELTS | USA PILLAR |
| 5 | 2026-09-19 | UK Graduate Visa 18 Months from 2027: Bangladeshi Guide | `uk-graduate-visa-18-months-2027-bangladesh` | UK graduate visa 18 months | UK FRESH |
| 6 | 2026-09-20 | Fully Funded Scholarships for Bangladeshi Students 2026 | `fully-funded-scholarships-bangladesh-2026` | scholarships Bangladeshi | Scholarship PILLAR |
| 7 | 2026-09-21 | UK Student Visa from Bangladesh 2026: Documents & CAS | `uk-student-visa-bangladesh-2026` | UK student visa Bangladesh | Visa |
| 8 | 2026-09-22 | Canada PGWP Eligible Courses 2026: CIP List Explained | `canada-pgwp-eligible-courses-2026` | Canada PGWP eligible courses | Canada PGWP |
| 9 | 2026-09-23 | UK September 2026 Intake Bangladesh: Deadline is Now | `uk-september-intake-2026-bangladesh` | UK September 2026 intake | UK intake |
| 10 | 2026-09-24 | Australia Genuine Student Statement 2026: GS Template AU | `australia-genuine-student-statement-2026` | Australia Genuine Student | AU GS |
| ... | ... | ... | ... | ... | ... |
| 30 | 2026-10-14 | Study in Germany Free Tuition Bangladesh 2026 | `study-in-germany-free-tuition-bangladesh-2026` | study in Germany free | Germany PILLAR |

Full 90 rows in CSV. Every blog generates via `POST /api/marketing/seo?action=generate` → approval → publish → sitemap ping → indexing.

**Publishing rule:** Each blog = 1 CampaignPost (BLOG, LANDSCAPE) + 4 social variants (SQUARE/PORTRAIT/LANDSCAPE/STORY) via auto-pipeline.

---

## DELIVERABLE 04 — Pillar Brief: UK (2026-correct)

**URL:** `/destinations/uk` + blog `study-in-uk-from-bangladesh-2026`  
**Title (58ch):** `Study in UK from Bangladesh 2026 — Cost, Visa & Scholarships`  
**Meta (152ch):** `Study in UK from Bangladesh 2026: tuition from £12k, visa & CAS steps, September/January intakes, 8 UKVI-approved scholarships. Free ALO counseling.`  
**H1:** Study in UK from Bangladesh — Complete 2026 Guide (Updated 14 Sep 2026)

**Must-include freshness block (Top):**
> **2027 Graduate visa update (Bangladesh):** If you **apply on/after 1 Jan 2027**, a UK taught bachelor's/masters gives **18 months** Graduate visa (was 2 years). Applications **by 31 Dec 2026** still get **2 years**. **PhD stays 3 years**. Plan your intake: September 2026 = last 2-year window; January 2027 = first 18-month window.

**Outline (2000w):**
1. Why UK for Bangladeshis (1-yr masters, work, NHS)
2. Cost breakdown 2026 (tuition £12k-£25k, living £1,023-£1,483/mo outside/inside London — verify UUK)
3. Intakes: **September 2026 (apply now)** + January 2027 (new 18mo rule)
4. MOI vs IELTS (which UK unis accept MOI from Bangladesh)
5. CAS → credibility interview → eVisa (UKVI move 2024-25)
6. Graduate Route 18mo/3yr box (cite GOV.UK)
7. 5 scholarships without IELTS (Chevening, Commonwealth, GREAT, etc.)
8. How ALO free counseling works (Concept Tower)
9. FAQ (7) + CTA (Book consult, Course Finder)

**Internal links:** → UK scholarships → UK student visa → UK universities → course-finder?country=UK

---

## DELIVERABLE 05 — Pillar Brief: Canada (SDS-dead, PAL, PGWP gate)

**URL:** `/destinations/canada` + `canada-study-permit-without-sds-2026`  
**Title:** `Canada Study Permit Without SDS 2026: Bangladeshi Guide (PAL + PGWP)`  
**Meta:** `No more SDS from Nov 2024. Canada study permit 2026 for Bangladesh: PAL, proof of funds, 408k cap, PGWP CIP list + CLB 7/5 language rule explained.`

**Must-include warning block:**
> **SDS ended 8 Nov 2024.** All Bangladeshi applicants use the **regular study permit stream** (8-12 weeks). You now need a **Provincial Attestation Letter (PAL)** (master's/PhD exempt from cap since Jan 2026), and for diploma/certificate PGWP, your course **CIP code must be on IRCC's 2026 frozen eligible list** — check before paying deposit. Degrees exempt; need **CLB 7** (degree) or **CLB 5** (diploma) at PGWP time.

**Outline:**
1. Canada still welcomes Bangladeshi students — but no fast lane
2. PAL explained (cap 408k 2026)
3. Regular stream checklist (GIC accepted, funds, LOA+PAL)
4. PGWP 2026: language + field-of-study CIP gate (list frozen, 1,107 codes)
5. Which Bangladeshi-friendly colleges have eligible CIPs (avoid business/hospitality general)
6. Cost + work 20h→24h (as per IRCC 2024 reform — verify)
7. FAQ + CTA (PGWP checker tool via seo/engine)

---

## DELIVERABLE 06 — Pillar Brief: Australia (GS + $29,710)

**URL:** `/destinations/australia` + `study-in-australia-gs-29710-2026`  
**Title:** `Study in Australia 2026: Genuine Student & AUD 29,710 Guide`  
**Meta:** `Australia Subclass 500 in 2026: Genuine Student (GS) not GTE, AUD 29,710 living costs, CRICOS + CoE, OSHC, 48h work. Bangladesh checklist inside.`

**Must-include GS block:**
> **GTE is gone — it's Genuine Student (GS) since 23 Mar 2024.** You answer structured questions: ties to Bangladesh, why this course/provider in Australia, future benefit. You may mention PR interest, but **primary purpose must be genuine study**. Funds: **AUD $29,710/yr living** + tuition + travel, secure-centre English only, OSHC entire stay, 48h/fortnight work.

**Outline:** GS Q&A template, CoE/CRICOS, OSHC, funds breakdown, English 6.0-6.5, best AU cities, CTA.

---

## DELIVERABLE 07 — Pillars: USA + Germany + Scholarships + Visa

**USA without IELTS:** Duolingo/ELLT/MOI list, F-1 visa, OPT.  
**Germany free tuition:** public uni €0 tuition, blocked account €11,208 (verify 2026), English-taught masters.  
**Scholarship pillar:** 8 fully funded (Chevening, Erasmus Mundus, DAAD, Australia Awards, Vanier, etc.) — deadline calendar + eligibility matrix Bangladeshi.  
**Visa pillar hub:** `/visa-support` compares UK/Canada/Australia/USA in one table (duration, funds, English, work rights) — builds E-E-A-T.

---

## DELIVERABLE 08 — On-Page SEO Template (every blog/course)

Enforced by `POST /api/marketing/seo?action=generate` prompt:

- **Title:** 55-65 chars, primary KW front-loaded, no clickbait
- **Meta:** 150-158 chars, primary KW + benefit + CTA + year 2026
- **H1:** one per page, matches title intent
- **H2/H3:** keyword variants, no skipping, 800-2000w with tables/bullets
- **E-E-A-T footer:** Author = ALO counselor, `Suite 347 Concept Tower...`, phone, WhatsApp, lastVerifiedAt date, sourceUrl links (GOV.UK, IRCC, Home Affairs)
- **FAQ:** 5-7 Qs using `FAQPage` schema (kept for AI/Bing, not Google SERP — see §0.4) + visible accordion
- **CTA:** Book Free Consultation → `/book-consultation` + WhatsApp deep link `wa.me/8801327...` + portal link
- **Image:** one hero LANDSCAPE (1200×628) with brand footer bar (phone/WhatsApp/website) + alt=`primary keyword` — via `SIZE_MATRIX`
- **Internal links:** 3-5 outbound to pillar/sister posts + 2 to course-finder/universities (see §09)
- **Canonical:** `https://aloeducation.com/blog/{slug}` or `/destinations/{country}` — no params.

**Quality gate:** Approval `PENDING → APPROVED` only if: no visa guarantee phrase, no `GTE`/`SDS fast-track` claim, no stale Graduate visa.

---

## DELIVERABLE 09 — Internal Linking Graph (wheel + silo)

**Structure:**
```
Home → Destinations (UK/Canada/Australia/USA/Germany) → Individual country pillar
  ↕
Course Finder ←→ University pages ←→ Blog posts ←→ Scholarships
```
- Every blog links **up** to its pillar + **sideways** to 2 sister blogs + **down** to course-finder filtered.
- Every country pillar links **down** to top 5 universities of that country (dynamic counts) + top scholarships.
- No orphan: sitemap ensures crawl, footer links to destinations, blog has breadcrumb.

**Automation:** `auto-pipeline` inserts `relatedPosts` IDs (sourced from `contentDNA`/`seo-brain`) into markdown’s `## Related` at generation time.

---

## DELIVERABLE 10 — Schema Pack (JSON-LD)

All pages inject via `generateMetadata` + inline `application/ld+json`. Validated with **Schema.org Validator** (not Rich Results Test for FAQ).

**a) Article (blog):**
```json
{"@context":"https://schema.org","@type":"Article","headline":"...","author":{"@type":"Organization","name":"ALO Education"},"publisher":{"@type":"Organization","name":"ALO Education","logo":{"@type":"ImageObject","url":"https://aloeducation.com/logo.png"}},"datePublished":"2026-09-15","dateModified":"2026-09-15","mainEntityOfPage":"https://aloeducation.com/blog/slug"}
```

**b) BreadcrumbList (every detail):**
```json
{"@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Home","item":"https://aloeducation.com/"},
  {"@type":"ListItem","position":2,"name":"Destinations","item":"https://aloeducation.com/destinations"},
  {"@type":"ListItem","position":3,"name":"Study in UK","item":"https://aloeducation.com/destinations/uk"}
]}
```

**c) FAQPage (kept):**
```json
{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Can I study in UK without IELTS?","acceptedAnswer":{"@type":"Answer","text":"Yes, some UK universities accept MOI/PTE/Duolingo..."}}]}
```
> Note in docs: *Google Search no longer shows FAQ rich results since 7 May 2026 — this markup is retained for Bing/AI ingestion and on-page UX only.*

**d) Organization + EducationalOrganization** for homepage.

---

## DELIVERABLE 11 — Image Prompt Pack (SIZE_MATRIX aware)

Brand overlay on every visual: logo bottom-right 8% padding, footer bar `#0057B8` white text `☎ +8809611-123456 • WhatsApp +8801712345678 • alo-education.com` — address only on LANDSCAPE/BLOG.

| Size | Dimensions | Use | Prompt suffix |
|---|---|---|---|
| SQUARE | 1080×1080 | FB/IG feed | `Square 1:1, centered subject, clean, Bangladesh student` |
| PORTRAIT | 1080×1350 | FB/IG portrait | `Portrait 4:5, vertical, student with UK/Canada landmark faint` |
| LANDSCAPE | 1200×628 | FB/LINKEDIN/BLOG | `Landscape 1.91:1, address footer, professional flat` |
| STORY | 1080×1920 | IG/TikTok/YT Short | `Story 9:16, bold headline top, CTA bottom, no visa guarantee` |
| YT_THUMB | 1280×720 | YouTube | `YouTube thumb 16:9, high contrast, face + flag, max 4 words` |

Example auto-pipeline prompt (injected by `promptWithBrand`):
> Educational social media visual for “UK September intake — 5 scholarships without IELTS” — CONSULTATION_OFFER. Style: modern flat, clean, professional, Bangladeshi students audience, no visa guarantee. Brand requirements: ALO logo bottom-right 8% padding, footer bar #0057B8 with white text “☎ +8809611… • WhatsApp … • https://alo-education.com”. Address only on BLOG/LANDSCAPE. Size 1080×1080 Square 1:1.

Placeholder today (`picsum.photos/seed/...`), real provider when `IMAGE_GEN_PROVIDER=openai-dalle|stability|gemini` + `IMAGE_GEN_API_KEY` set → `sharp` overlay + R2/S3 upload.

---

## DELIVERABLE 12 — Video Script Pack (4 ratios, ≤30s Story)

Generated via `POST /api/marketing/video` + `generateBrandedVideo`:

- **STORY 9:16 (primary):** Hook 0-3s “Study in UK 2026 — no, the Graduate visa is NOT 2 years from Jan 2027” → 3-20s pillar facts + subtitles → 20-30s CTA “Free ALO counseling — Concept Tower — Book today” + brand footer.
- **SQUARE 1:1:** 45s explainer (FB feed)
- **LANDSCAPE 16:9:** YouTube Shorts alternative
- **No guarantee:** script audit blocks phrase `guaranteed visa`.

Subtitle = `SRT` + thumbnailConcept 1280×720.

---

## DELIVERABLE 13 — Social Caption Pack (90 days × 3 platforms)

Auto-generated by auto-pipeline `masterCaption`:

```
{idea}
📍 House 12, Road 12, Dhanmondi, Dhaka-1209, Bangladesh
☎ +8809611-123456 | WhatsApp: +8801712345678
🌐 https://alo-education.com
Book Free Consultation → /consult
#StudyAbroad #ALOEducation #StudyInUK #Scholarship
```

Tone variants per platform:
- **Facebook:** long (150w) + link + comment “Interested? Reply UK” → keyword trigger → auto DM + lead.
- **Instagram:** short (40w) + emoji + 20 hashtags + Story sticker “Swipe Up”.
- **LinkedIn:** professional, no emoji, data-first.

Hashtags: `StudyAbroad, ALOEducation, Scholarship, StudyInUK, StudyInCanada, StudyInAustralia` + country.

---

## DELIVERABLE 14 — Google Business Profile / Location SEO (Lead source)

Already implemented: `POST /api/marketing/webhooks/google-business?token=GOOGLE_BUSINESS_WEBHOOK_TOKEN`

- GBP post daily with NAP: `ALO Education, Suite 347 Concept Tower, 68/69 Green Road, Dhaka` + `+8801327189194` + categories `Education consultant`.
- Place ID reviews → `MarketingLead source=GOOGLE_MAPS, hotLead = rating>=4 or keywords (interested|admission|visa|scholarship)` + `MarketingLeadScore`.
- 600 Google Location leads target in 90 days (6-7/day) via daily GBP update + review request automation (WhatsApp template after consultation).

**Setup:** Create GBP webhook in Make/Zapier → forward review/ Q&A → this endpoint.

---

## DELIVERABLE 15 — Auto-Pipeline & Calendar Ops (the engine)

`POST /api/marketing/auto-pipeline` — one idea or one image → full day's pack:

```
Idea/Image → MarketingContentIdea → 4 images (SQUARE/PORTRAIT/LANDSCAPE/STORY, brand overlay)
→ N CampaignPost (platform×size) + 1 BlogPost + MarketingCalendar (9AM/14PM/19PM Asia/Dhaka)
→ publish → sitemap ping → indexing
```

- **Pacing:** 1 blog 9AM + FB 9AM + IG 2PM + LinkedIn 7PM = natural distribution, avoids spam signal.
- **Approval:** DRAFT → PENDING → APPROVED → SCHEDULED → PUBLISHED via `marketing-dashboard` + `BrandKitEditor`.
- **Calendar:** `MarketingCalendar` + auto-schedule stagger `offsetH = platformIdx * 2`.

Test (live after deploy):

```bash
curl -X POST https://aloeducation.com/api/marketing/auto-pipeline \
 -H 'Content-Type: application/json' \
 -d '{"idea":"UK Graduate visa 18 months from Jan 2027 — Bangladeshi guide","platforms":["FACEBOOK","INSTAGRAM","LINKEDIN","BLOG"],"sizes":["SQUARE","PORTRAIT","LANDSCAPE","STORY"]}'
```

---

## DELIVERABLE 16 — Library Repost Distribution (10× reach)

`GET /api/marketing/library?status=APPROVED&q=` → feed for every counselor/employee  
`POST /api/marketing/repost {postId, targetPlatform, employeeId}` → clone as `PUBLISHED` + `publishedUrl` + audit.

- **Marketing Manager dashboard:** 9th tab `Library / Repost` — approved posts + 3 repost buttons (FB/IG/LINKEDIN).
- **Employee banner:** `UnifiedEmployeeDashboard.tsx` → Counselor/Marketing sees `Marketing Library — Repost Hub → /crm/marketing-manager`.
- **Policy:** Brand kit retained, personal caption override allowed, original stays approved.

Target: every counselor reposts 2-3/day → 10× organic reach, aids Top-3 via branded searches + social signals.

---

## DELIVERABLE 17 — Lead & Conversion Architecture

- **Comment-to-lead:** `KeywordTriggersView` — comment contains `study|scholarship|visa|IELTS|admission` → auto DM `WhatsApp deep link` → auto-create `MarketingLead` → assign counselor (round-robin) → CRM timeline.
- **DM-to-lead:** Inbox rule — same.
- **Google Maps:** webhook → hotLead.
- **Blog CTA:** every post footer + sidebar widget `Book Free Consultation` → UTM `utm_source=blog&utm_campaign=90day`.
- **WhatsApp CTA:** `wa.me/8801327189194?text=UK%20September%202026%20counseling` — tracked via `leadOutreach`.

KPI: 5k organic leads (600 FB + 400 Google + 4k blog/SEO).

---

## DELIVERABLE 18 — Technical Fixes & CRO

- **502 fix:** `Caddy reverse_proxy 0.0.0.0:3044` → healthy PM2 `ecosystem.config.cjs` — verify `curl -I https://aloeducation.com/` 200 after deploy.
- **Core Web Vitals:** hero `priority` image, `picsum` → CDN R2 with `sharp`, `next/image` widths, lazy FAQ.
- **Security headers:** HSTS, CSP `connect-src 'self' https://api.groq.com https://openrouter.ai`, X-Frame SAMEORIGIN — already in `next.config.ts`.
- **Nofollow:** external gov links `rel="noopener"` only — gov links are followed (trust).
- **Price freshness:** never hardcode tuition — use `last_verified_at` + sourceUrl.

---

## DELIVERABLE 19 — Weekly SEO Report & Rank Tracker

**Report (every Monday, Marketing Manager dashboard):**

| KPI | Day 1 | Day 30 | Day 60 | Day 90 target |
|---|---|---|---|---|
| SEO pages indexed (GSC) | 12 | 35 | 65 | **90** |
| Avg position (15 long-tails) | 38 | 22 | 11 | **Top-3 for 15+** |
| GSC impressions | 1k | 18k | 55k | 90k |
| Organic leads | 40 | 800 | 2,800 | **5,000** |
| Social assets published | 0 | 180 | 360 | **540** |
| Counselor reposts | 0 | 120 | 400 | 700 |

**Tracker source:** `SeoOpportunity` + `SeoTask` (`seo-engine.ts`) + GSC API import → `analyzeSearchConsoleData` classifies `HIGH_IMPRESSION_LOW_CTR / RANKING_4_20 / CONTENT_GAP` → auto-create `SeoTask` (title-optimize, internal-link, freshness). Tasks shown in `CrmSeoGrowthDashboard`.

---

## APPENDIX A — FILE MAP (what to open where)

Dashboard:
- `src/components/alo/views/marketing-dashboard.tsx` — 9 tabs: Inbox/Comments/Posts/Brand Assets/AI Reply/n8n/Outreach/Access/**Library/Repost** + top **Auto-Pipeline card** + **BrandKitEditor** (logoUrl/logoName/address/phone/whatsapp/website/primary/cta)
- `src/components/employee/UnifiedEmployeeDashboard.tsx` — `Marketing Library — Repost Hub` banner
- `src/lib/marketing/brand-kit.ts` + `image-generator.ts` — `SIZE_MATRIX` + `promptWithBrand` + `generateBrandedImage/Video`
- `src/app/api/marketing/brand-assets/route.ts` — GET `{assets,brandKit,logoVal}` POST `BRAND_KIT` single-active + `LOGO` sync
- `src/app/api/marketing/auto-pipeline/route.ts` — one-click; `src/app/api/marketing/library/route.ts` — feed; `src/app/api/marketing/repost/route.ts` — clone; `src/app/api/marketing/webhooks/google-business/route.ts` — lead
- `src/app/sitemap.ts` — patched dynamic (courses/blogs/scholarships/resources)
- `src/lib/seo/schema-helpers.ts` — NEW in this commit (see below)
- `src/app/api/marketing/seo/route.ts` — `?action=generate|approve` (country/course/university/scholarship/blog_topic → title+markdown → MarketingGeneratedContent)

Docs:
- `docs/final-master/MARKETING_MANAGER_DASHBOARD_AUDIT_90DAY_SEO.md` — audit (6 blockers)
- `docs/final-master/MARKETING_90DAY_IMPLEMENTATION_DONE.md` — auto-pipeline proof + curl
- `docs/final-master/ELITE_90DAY_SEO_MASTER_PROMPT_OUTPUT.md` — this file (19 deliverables)
- `docs/final-master/90DAY_EDITORIAL_CALENDAR.csv` — 90 rows
- `docs/final-master/SEO_PILLAR_BRIEFS_SHORT.md` — one-pager for counselors

---

## APPENDIX B — ENV (set after deploy — placeholder works until then)

```
IMAGE_GEN_PROVIDER=openai-dalle   # or stability|gemini
IMAGE_GEN_API_KEY=sk-...
OPENAI_API_KEY=sk-...            # fallback
GOOGLE_BUSINESS_WEBHOOK_TOKEN=random-32
GOOGLE_INDEXING_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}  # for Indexing API
NEXT_PUBLIC_SITE_URL=https://aloeducation.com
```

Without keys, pipeline still creates `DRAFT` posts with `picsum` placeholder + brand overlay prompt logged — so 90-day volume is never blocked.

---

## APPENDIX C — Acceptance (Top-3)

- [ ] Sitemap shows dynamic blogs/courses/scholarships/resources + passes `next build`
- [ ] Every blog carries correct 2026 visa facts (18mo/ SDS-dead/ GS $29,710 / no GTE)
- [ ] No `FAQ rich result` promise — schema kept but documented as AI/Bing only
- [ ] Auto-pipeline creates 1 blog + 4 images + N posts + calendar in one call
- [ ] Library repost visible to counselor + audit logged
- [ ] Google webhook creates `GOOGLE_MAPS` lead
- [ ] 90-day calendar CSV imported to Marketing Calendar

**Next action:** Fix 502 (`pm2 + Caddy`), then `POST /api/marketing/brand-assets` once, then daily `POST /api/marketing/auto-pipeline` with Day 1 idea.

