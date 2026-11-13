# ALO Education — public header & footer link map

Date: 2026-11-03. Canonical production origin: `https://aloeducation.com`.

The public header (`src/components/website/PublicNavbar.tsx`) and footer
(`src/components/website/PublicFooter.tsx`) are mounted **once** for every
pre-login page by `src/components/website/PublicLayoutWrapper.tsx` from
`src/app/layout.tsx`. Internal links are relative on purpose so the same
markup works on localhost, staging and production; the absolute column
below is the exact production URL for each required link.

Every internal route below was verified to have a real `page.tsx` (or a
matching dynamic segment) in `src/app/`; **no placeholder page needed to
be created**. No link points at a dead route.

## Required header menu (exact order)

| # | Label | Type | Relative path | Production URL |
| --- | --- | --- | --- | --- |
| 1 | Destinations | dropdown | `/destinations` | https://aloeducation.com/destinations |
| 2 | Course Finder | link | `/course-finder` | https://aloeducation.com/course-finder |
| 3 | Services | link | `/services` | https://aloeducation.com/services |
| 4 | Language Prep | dropdown | `/language-prep` | https://aloeducation.com/language-prep |
| 5 | Resources | dropdown | `/resources` | https://aloeducation.com/resources |
| 6 | Portal | dropdown | `/student/login` | https://aloeducation.com/student/login |
| 7 | AI SUPPORT | dropdown | `/ai/course-match` | https://aloeducation.com/ai/course-match |
| CTA | Book Free Counseling | orange button | `/book-consultation` | https://aloeducation.com/book-consultation |

Portal dropdown: `/student/login`, `/partner/login`, `/employee/login`.

## Required footer columns (exact order)

| Column | Label | Production URL |
| --- | --- | --- |
| Destinations | UK | https://aloeducation.com/destinations/uk |
| Destinations | Australia | https://aloeducation.com/destinations/australia |
| Destinations | Canada | https://aloeducation.com/destinations/canada |
| Destinations | Ireland | https://aloeducation.com/destinations/ireland |
| Destinations | New Zealand | https://aloeducation.com/destinations/new-zealand |
| Destinations | USA | https://aloeducation.com/destinations/usa |
| Destinations | Dubai | https://aloeducation.com/destinations/dubai |
| Quick Links | Course Finder | https://aloeducation.com/course-finder |
| Quick Links | Services | https://aloeducation.com/services |
| Quick Links | Language Prep | https://aloeducation.com/language-prep |
| Quick Links | Scholarships | https://aloeducation.com/scholarships |
| Company | About Us | https://aloeducation.com/about |
| Company | Contact Us | https://aloeducation.com/contact |
| Company | Global Offices | https://aloeducation.com/global-offices |
| Company | Code of Conduct | https://aloeducation.com/code-of-conduct |
| Company | Student Complaint Policy | https://aloeducation.com/student-complaint-policy |
| Company | AQF Compliance | https://aloeducation.com/aqf-compliance |

## Official external links (exact URLs)

| Purpose | URL |
| --- | --- |
| Facebook (official ALO Education) | https://www.facebook.com/aloeducationbangladesh/ |
| Instagram (official ALO Education) | https://www.instagram.com/aloeducation.bd/ |
| LinkedIn (official ALO Education) | https://www.linkedin.com/company/aloeducation |
| YouTube (official ALO Education) | https://www.youtube.com/@aloeducationbd |
| Google location | https://share.google/aarau5V2GfBrICZTj |
| WhatsApp +8801805020101 | https://wa.me/8801805020101 |
| Mobile +8801805020101-10 | tel:+8801805020101 |
| Email | mailto:info@aloeducation.com |

Social order is fixed as Facebook → Instagram → LinkedIn → YouTube in
`ALO_SOCIALS` (`src/lib/alo-site-info.ts`). These account URLs are
configuration/content; account ownership was not independently verified
from this workspace (no outbound access to those platforms).

## Contact copy

```text
WhatsApp: +8801805020101
Mobile: +8801805020101-10
Email: info@aloeducation.com
Address: Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.
```

The mobile value is a display **range**; the dial link intentionally targets
the first number (`tel:+8801805020101`) so it never becomes a fabricated
15-digit number.

## Full internal route inventory

62 distinct internal paths referenced by the public chrome:

| Relative path | Production URL |
| --- | --- |
| `/` | https://aloeducation.com |
| `/about` | https://aloeducation.com/about |
| `/accessibility` | https://aloeducation.com/accessibility |
| `/ai/course-match` | https://aloeducation.com/ai/course-match |
| `/ai/cv-helper` | https://aloeducation.com/ai/cv-helper |
| `/ai/scholarship-match` | https://aloeducation.com/ai/scholarship-match |
| `/ai/sop-helper` | https://aloeducation.com/ai/sop-helper |
| `/ai/visa-coach` | https://aloeducation.com/ai/visa-coach |
| `/application-process` | https://aloeducation.com/application-process |
| `/aqf-compliance` | https://aloeducation.com/aqf-compliance |
| `/blog` | https://aloeducation.com/blog |
| `/book-consultation` | https://aloeducation.com/book-consultation |
| `/code-of-conduct` | https://aloeducation.com/code-of-conduct |
| `/communication-policy` | https://aloeducation.com/communication-policy |
| `/contact` | https://aloeducation.com/contact |
| `/cookies` | https://aloeducation.com/cookies |
| `/course-finder` | https://aloeducation.com/course-finder |
| `/destinations` | https://aloeducation.com/destinations |
| `/destinations/australia` | https://aloeducation.com/destinations/australia |
| `/destinations/canada` | https://aloeducation.com/destinations/canada |
| `/destinations/dubai` | https://aloeducation.com/destinations/dubai |
| `/destinations/ireland` | https://aloeducation.com/destinations/ireland |
| `/destinations/new-zealand` | https://aloeducation.com/destinations/new-zealand |
| `/destinations/uk` | https://aloeducation.com/destinations/uk |
| `/destinations/usa` | https://aloeducation.com/destinations/usa |
| `/eligibility-check` | https://aloeducation.com/eligibility-check |
| `/employee/login` | https://aloeducation.com/employee/login |
| `/faqs` | https://aloeducation.com/faqs |
| `/global-offices` | https://aloeducation.com/global-offices |
| `/language-prep` | https://aloeducation.com/language-prep |
| `/language-prep/act` | https://aloeducation.com/language-prep/act |
| `/language-prep/cambridge-english` | https://aloeducation.com/language-prep/cambridge-english |
| `/language-prep/comparison` | https://aloeducation.com/language-prep/comparison |
| `/language-prep/duolingo` | https://aloeducation.com/language-prep/duolingo |
| `/language-prep/gmat` | https://aloeducation.com/language-prep/gmat |
| `/language-prep/gre` | https://aloeducation.com/language-prep/gre |
| `/language-prep/ielts` | https://aloeducation.com/language-prep/ielts |
| `/language-prep/ielts-ukvi` | https://aloeducation.com/language-prep/ielts-ukvi |
| `/language-prep/kaplan` | https://aloeducation.com/language-prep/kaplan |
| `/language-prep/languagecert` | https://aloeducation.com/language-prep/languagecert |
| `/language-prep/moi` | https://aloeducation.com/language-prep/moi |
| `/language-prep/oet` | https://aloeducation.com/language-prep/oet |
| `/language-prep/oietc` | https://aloeducation.com/language-prep/oietc |
| `/language-prep/oxford-ellt` | https://aloeducation.com/language-prep/oxford-ellt |
| `/language-prep/password` | https://aloeducation.com/language-prep/password |
| `/language-prep/pte-academic` | https://aloeducation.com/language-prep/pte-academic |
| `/language-prep/sat` | https://aloeducation.com/language-prep/sat |
| `/language-prep/toefl-ibt` | https://aloeducation.com/language-prep/toefl-ibt |
| `/lead-data-usage-policy` | https://aloeducation.com/lead-data-usage-policy |
| `/partner/login` | https://aloeducation.com/partner/login |
| `/privacy-policy` | https://aloeducation.com/privacy-policy |
| `/resources/accommodation` | https://aloeducation.com/resources/accommodation |
| `/resources/blogs` | https://aloeducation.com/resources/blogs |
| `/resources/financial-planning` | https://aloeducation.com/resources/financial-planning |
| `/resources/pre-departure` | https://aloeducation.com/resources/pre-departure |
| `/scholarships` | https://aloeducation.com/scholarships |
| `/services` | https://aloeducation.com/services |
| `/student-complaint-policy` | https://aloeducation.com/student-complaint-policy |
| `/student/login` | https://aloeducation.com/student/login |
| `/success-stories` | https://aloeducation.com/success-stories |
| `/terms` | https://aloeducation.com/terms |
| `/visa` | https://aloeducation.com/visa |

## Brand palette note

The brief names Education Blue `#0066CC`, ALO Orange `#F37021` and Accent
`#FFB347`. This repository enforces a newer accessible master palette in
`src/app/globals.css` (`--alo-brand: #0057B8`, `--alo-cta: #C93D13`,
`--alo-cta-vivid: #E8501A`); `tests/unit/design-tokens.test.ts` explicitly
retires the three legacy hexes because white-on-`#F37021` and the legacy
yellow accent fail the 4.5:1 text contrast floor.

**Decision (2026-11-03): keep the accessible master palette.** The public header
and footer therefore use the ALO blue/orange design tokens, with a white label on
the Deep Orange CTA and three moving cap-icon rows in `#0057B8` / `#E8501A` /
`#C93D13`. The stale Playwright colour assertions in `tests/e2e/public-header.spec.ts`
and `tests/e2e/public-footer.spec.ts` were aligned with this palette. Fonts stay
self-hosted Montserrat (headings) and Open Sans (body) from `globals.css`.
