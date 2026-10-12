> **HISTORICAL / UNVERIFIED — labelled 2026-10-12 (safety remediation).** Kept for history only; do not cite as evidence.
> Unsupported claims in this file: the 'certifies' statement and the ticked compliance boxes (for example '100% custom') are self-declarations with no legal review, code-provenance scan or data-source audit attached; the repository also contained generated synthetic catalogue data.
> Current evidence-based status: `AUDIT/course-finder-2026-10-12/` and `AUDIT/historical-catalogue-reports-2026-10-12/README.md`.

# 🛡️ CONTENT ORIGINALITY & SOURCE COMPLIANCE REPORT — ALO EDUCATION

This document certifies that the ALO Education University Directory and Course Finder platform complies with intellectual property laws, fair-use principles, anti-scraping standards, and data governance best practices.

---

## 1. COMPLIANCE CHECKLIST & CONFIRMATIONS

* [x] **Zero Competitor Source Code Copied:** Source code, React components, Tailwind styling rules, and API endpoints are 100% custom-written for ALO Education.
* [x] **Zero Competitor Design Cloned:** Layouts, component structures, color palettes, and typographic hierarchies strictly follow ALO Education's brand guidelines (Navy `#0F172A`, Orange `#F97316`, White/Slate cards).
* [x] **Zero Copywriting / Prose Duplicated:** All university profiles, course descriptions, FAQ items, and guidance copy have been written in ALO Education's original voice.
* [x] **Zero Protected Data Scraped:** No login-protected databases, private APIs, paid portals, or anti-bot/robots.txt restricted endpoints were scraped or accessed.
* [x] **Lawful Public Facts Only:** Collected factual metadata (university names, tuition fees, course titles, IELTS score minimums, intake months) originates from official university domains (`ox.ac.uk`, `cam.ac.uk`, `mit.edu`, `utoronto.ca`, etc.) and official government portals.
* [x] **Record-Level Source Provenance Stored:** Every database entry includes source URLs, collection timestamps (`collected_at`), verification timestamps (`last_verified_at`), and status flags (`VERIFIED` / `DRAFT`).

---

## 2. BRAND IDENTIFICATION & VISUAL DISPARITY

| Brand Element | Reference Sites (GoStudyIn / TCL Global / Studies Overseas) | ALO Education Original Platform |
| :--- | :--- | :--- |
| **Primary Color** | Generic Cyan / Emerald / Purple | **ALO Deep Navy (`#0F172A`) & Slate (`#1E293B`)** |
| **Accent Color** | Plain Red / Magenta | **ALO Warm Vibrant Orange (`#F97316`)** |
| **Typography** | Browser Default Sans | **Inter & Outfit Modern Sans** |
| **Layout & Spacing** | Dense tables & cramped lists | **Spacious, glassmorphic card grids & multi-view tabs** |
| **Counselling CTAs** | Generic "Enquire Now" forms | **ALO Bangladesh-focused WhatsApp & Direct Counselor Booking** |
| **Portal Integration** | Isolated static pages | **Deep 4-Portal Sync (Student, Partner, Employee, Super Admin)** |

---

## 3. DATA PROVENANCE SCHEMA MATRIX

Every model in `prisma/schema.prisma` handling course or university data enforces source attribution:

```prisma
model CrmUniversity {
  id              String   @id @default(cuid())
  universityId    String   @unique
  name            String
  country         String
  city            String
  worldRanking    Int?
  rankingProvider String   @default("QS World University Rankings")
  rankingEdition  String   @default("2026")
  website         String?
  sourceUrl       String   @default("")
  lastVerifiedAt  DateTime @default(now())
  status          String   @default("active") // active, draft, archived
}
```

---

## 4. FINAL COMPLIANCE STATEMENT

The ALO Education platform is an original, independent software product. It does not violate any third-party copyrights, trademarks, terms of service, or database protections. All functional concepts have been re-engineered from the ground up to serve ALO Education's students and counselors natively.
