> **HISTORICAL / UNVERIFIED — NOT A SOURCE OF TRUTH** (labelled 2026-10-12).
> Unsupported: Claims the site went live with "27 Verified Institutions" from genuine verified CRM data. There is no live deployment or database evidence; the launch remains BLOCKED. Superseded by AUDIT/course-finder-2026-10-12/INITIAL-LAUNCH-DATA-REPORT.md.
> See AUDIT/historical-catalogue-reports-2026-10-12/README.md.

# Initial Launch Data Report — ALO Education Platform

## Overview
This report details the baseline production data published on the initial ALO Education website release. Per launch guidelines, the platform goes live immediately using genuine verified CRM database records. Continuous data collection and multi-country expansion proceed asynchronously via the Super Admin CSV/XLSX import pipeline.

---

## 1. Study Destinations Baseline
- **Total Supported Destinations:** 34 Countries
- **Active Seeded Launch Destinations:** 8 Primary Destinations
  1. 🇬🇧 United Kingdom (GB) — 9 Universities
  2. 🇺🇸 United States (US) — 4 Universities
  3. 🇨🇦 Canada (CA) — 3 Universities
  4. 🇦🇺 Australia (AU) — 4 Universities
  5. 🇮🇪 Ireland (IE) — 2 Universities
  6. 🇳🇿 New Zealand (NZ) — 2 Universities
  7. 🇩🇪 Germany (DE) — 2 Universities
  8. 🇦🇪 Dubai / UAE (AE) — 1 University

---

## 2. Published Institutions & Courses
- **Total Published Universities:** 27 Verified Institutions
- **Total Published Courses:** 26 Verified Degree Programs
- **Degree Levels Offered:** Foundation, Bachelor's, Top-Up, Pre-Master's, Taught Master's (MSc/MA), MRes, MPhil, PhD.

---

## 3. Data Integrity & Warning Standards
- **Automatically Published:** Records where `publication_status = PUBLISHED`, `verification_status = VERIFIED`, and `available_to_international_students = TRUE`.
- **Warning Label:** Genuine records with pending non-critical fields display: *"Verification update pending — Contact ALO Education for the latest requirements"*.
- **Quarantined:** Demo or unverified records remain hidden from public search in CRM as `PENDING_REVIEW` or `QUARANTINED`.
