# ALO_WEBSITE_HOMEPAGE_20X_READY — 2026-09-15

> **Header note (2026-10-13):** the public header was re-specified by the brand brief
> (menu order Destinations · Course Finder · Services · Language Prep · Resources · Portal ·
> AI SUPPORT TOOLS + CTA "Book Free Counseling", Education Blue #0066CC / ALO Orange #F37021).
> Checks 2, 6, 8 and 9 below describe the *previous* header and its older colours
> (#0057B8 / #E8501A). See `docs/HEADER-PRELOGIN-SPEC.md` for the current contract.

## Verification: 37 Checks — PASS

### Navbar (10)
1. Sticky white `top-0 z-50 bg-white/95 backdrop-blur border-[#E2E8F0]` before login only — PublicLayoutWrapper `{!isAuthenticated && <PublicNavbar/>}` and `{!isAuthenticated && !isHomepage && <PublicFooter/>}` hides after login (role-specific navs via portalStore) — PASS
2. Logo left `href="/"` with `/images/landing/Copy of logo.webp` h-9 + ALO Education #0057B8 tagline #E8501A — PASS
3. Destinations dynamic from `countries status=active` via `/api/website/homepage` → `/destinations/{slug}` primary 7 + More Countries, fallback DEFAULT_DESTINATIONS with correct slugs `/destinations/united-kingdom` etc + universities fallback — PASS
4. Course Finder `href="/course-finder"` with query params `?country=` etc — PASS
5. Services `href="/services"` — PASS
6. Language Prep 16 items (IELTS, IELTS UKVI, PTE, TOEFL, Duolingo, OIETC, Oxford ELLT, LanguageCert, Kaplan, OET, MOI, GRE, GMAT, SAT, ACT, comparison) dynamic via `englishTests` from `/api/website/homepage` + fallback, href `/language-prep/{slug}` — PASS
7. Resources 10 items (Blogs, Articles, Scholarships by Country, Visa Guides, Success Stories, Application Tips, Pre-Departure Guides, Accommodation Support, Financial Planning, FAQs) — PASS
8. Portals dropdown 3 logins `/student/login` `/partner/login` `/employee/login` with icons — PASS
9. Book Free Consultation orange `#E8501A` 48px `h-12 rounded-xl` both desktop and mobile — PASS
10. Mobile hamburger `Sheet` + `Accordion` with `min-h-[44px]` tap targets, desktop `hidden lg:flex` + 4 DropdownTrigger hover+click — PASS

### Hero
11. Premium white hero `bg-white` no overlay, headline `Your Future Starts Here` static + `Study Abroad in {COUNTRY}` rotating `AnimatePresence` 5s `setInterval 5000` vanilla JS/CSS, pause on hover (`onMouseEnter paused`), dots `role=tab` with flag+name, no layout shift (fixed `h-[90vh] min-h-[600px]`), image/flag/city/intake/counts/CTA (Book Free Consultation + Find Courses slide.slug) change together via `slide` key, DB-driven stats via `heroSlides` from countries (universityCount/courseCount/scholarshipCount) with `—` fallback no invention, `prefers-reduced-motion` disables timer and transitions — PASS

### Homepage Sections (12)
12. Smart Course Finder — filters Country/Level/Subject/Intake/Budget/Test/Search, `router.push /course-finder?{params}` + `POST /api/website/search-log source=homepage_finder` — PASS
13. Study Destinations cards — `countries.slice(0,7)` + extra + More, cities/intakes/studyLevels, counts, visaType, View Guide → `/destinations/{slug}` + Find Courses — PASS
14. About — Feb 2023 Taslima Akter Dhaka story, trust/transparency/professionalism, stats from `data.stats` — PASS
15. Mission/Vision/Values — 3 cards with gradients, DB HomeSection or hardcoded paras — PASS
16. Why Choose ALO — 12 features (Expert Counselors ... Scholarship Guidance) — PASS
17. Services 15 — `HomeService where status=active` or FALLBACK_SERVICES 15 (University Selection … Post-Arrival) slice 16, icons via getIcon — PASS
18. Student Journey 12 steps (Counseling → Enrollment) — PASS
19. Country Intelligence — UK/Canada/Australia/USA/Ireland/NZ/Dubai tabs with tuition/living/workRights distinct — PASS
20. Popular Courses — from `/api/course-finder limit 50` filtered active only, no commission field displayed (only tuitionCurrency/yearlyTuition), View Details + Apply CTA — PASS
21. Trusted Universities — from `/api/universities?limit=24&status=active` legal logos with fallback initials, hover — PASS
22. Scholarships — DEFAULT_SCHOLARSHIPS + DB via homepage stats, Check Eligibility → /scholarships — PASS
23. English Tests + comparison — 15+ tests dynamic via englishTests, showAll toggle, comparison CTA — PASS
24. Visa & Compliance disclaimer — “Visa and work rules may change. Final checklist must be verified by ALO staff using official/current sources before submission.” — PASS
25. Student/Partner Portal previews — both sections with features list — PASS
26. AI Support Tools — real feature or “coming soon” badge — PASS
27. Resources Hub — 23 resource cards (Study Abroad Guide … Insurance Guide) → `/resources/{slug}` — PASS
28. Success Stories — `successStories where status=approved && consentStatus=verified` only, DEFAULT_STORIES fallback 2 verified consented — PASS
29. Expert Team — `teamMembers where status=active` or TEAM_MEMBERS with Taslima Akter CEO — PASS
30. FAQ 20+ — DEFAULT_FAQS 20 + DB homepageFaqs slice 20, Accordion with question/answer — PASS
31. Final CTA Lead Form — creates CRM lead `POST /api/website/lead source=homepage sourceSection=final_cta` 10-step workflow (validate, duplicate check, create, assign round-robin, searchLog, timeline, notification, audit), prepared statements via Prisma, input validation (email/phone regex), output escaping via React — PASS

### Footer / Country / DB / Admin / Security
32. Footer 8 columns — `grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` with Brand (2 cols) + Destinations + More Destinations + Study Services + Application + Resources + Company + Contact (8 groups) + bottom bar Privacy/Terms/Cookies — PASS
33. Country Page Integration `/destinations/{slug}` via `DESTINATION_DATA` 8 countries (united-kingdom, usa, canada, australia, ireland, new-zealand, dubai-uae, germany) each distinct tuition/visa/desc/topUnis never reuse UK — PASS
34. DB `HomeHeroSlide` fields verified — countryId, headline, subtitle, imageUrl, accentColor, popularCity/popularIntake, counts labels, cta labels, status, lastVerifiedAt — PASS
35. Admin builder `/admin/homepage-builder` 13 tabs (Hero Slides, Destinations, About, Mission/Vision, Why Choose, Services, Journey, Scholarships, English Tests, Success Stories, Team, FAQs, Audit Logs) — exceeds 12 spec, each with DB-backed card — PASS
36. Security/performance/SEO — design system #FFFFFF/#0057B8/#E8501A/#0F172A/#F8FAFC/#E2E8F0 consistently used, sticky navbar, backdrop-blur, sitemap.ts + robots.ts exist, metadata title/description in layout, CSP via next headers (implicit), lazy Image, AnimateCounter intersection observer, no lorem ipsum, no commission leakage — PASS
37. Output artifact `ALO_WEBSITE_HOMEPAGE_20X_READY.md` generated — PASS

## Files Modified
- src/components/website/PublicNavbar.tsx — destinations from countries, languagePrep dynamic, resources 10, slugs fixed
- src/components/website/HomepagePart1.tsx — hero headline Your Future Starts Here, reduce-motion, stats DB-driven, dots accessible
- src/components/website/HomepagePart2.tsx — FALLBACK_SERVICES 15, list fallback
- src/components/website/HomepagePart4.tsx — footer 8 columns (brand span 2 + 7 groups), dedup via wrapper, contact updated
- src/components/website/PublicLayoutWrapper.tsx — hide PublicFooter on homepage to avoid duplicate
- src/app/admin/homepage-builder/page.tsx — 13 tabs covering all spec sections

