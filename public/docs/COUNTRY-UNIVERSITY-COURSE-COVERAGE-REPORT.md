# 🌍 COUNTRY, UNIVERSITY & COURSE COVERAGE REPORT — ALO EDUCATION

This report provides the master audit for international study destination coverage, university thresholds, degree level spectrums, ranking provider integration, and data ingestion governance for ALO Education.

---

## 1. 34-COUNTRY COVERAGE MATRIX & THRESHOLD AUDIT

| # | Study Destination Country | Target Minimum Institutions | Current Verified Seed Count | Ingestion & Verification Status | Exception / Coverage Notes |
| :-: | :--- | :-: | :-: | :--- | :--- |
| 1 | **United Kingdom** | **140** | 9 (Base) | `INGESTION_IN_PROGRESS` | Full UK directory expansion targeting 140+ Russell Group, Modern & Specialist universities. |
| 2 | **United States** | **20** | 4 (Base) | `INGESTION_IN_PROGRESS` | US F-1 / OPT eligible institutions. |
| 3 | **Canada** | **20** | 3 (Base) | `INGESTION_IN_PROGRESS` | DLI-approved Canadian universities & PGWP eligible institutions. |
| 4 | **Australia** | **20** | 4 (Base) | `INGESTION_IN_PROGRESS` | CRICOS-registered Australian universities. |
| 5 | **Ireland** | **20** | 2 (Base) | `INGESTION_IN_PROGRESS` | All recognized Irish public universities & institutes of technology. |
| 6 | **New Zealand** | **20** | 2 (Base) | `INGESTION_IN_PROGRESS` | All 8 NZ public universities + institutes. |
| 7 | **Germany** | **20** | 2 (Base) | `INGESTION_IN_PROGRESS` | Tuition-free public & private university coverage. |
| 8 | **Netherlands** | **20** | 0 | `INGESTION_IN_PROGRESS` | Research & Applied Sciences universities (TU Delft, UvA, Leiden). |
| 9 | **Sweden** | **20** | 0 | `INGESTION_IN_PROGRESS` | KTH, Lund, Uppsala, Chalmers. |
| 10 | **Finland** | **20** | 0 | `INGESTION_IN_PROGRESS` | Aalto, University of Helsinki, LUT. |
| 11 | **Denmark** | **20** | 0 | `INGESTION_IN_PROGRESS` | UCPH, DTU, Aarhus University. |
| 12 | **France** | **20** | 0 | `INGESTION_IN_PROGRESS` | Sorbonne, École Polytechnique, HEC Paris. |
| 13 | **Italy** | **20** | 0 | `INGESTION_IN_PROGRESS` | Politecnico di Milano, Sapienza, Bologna. |
| 14 | **Spain** | **20** | 0 | `INGESTION_IN_PROGRESS` | UB, UAM, IE University. |
| 15 | **Austria** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Vienna, TU Wien. |
| 16 | **Belgium** | **20** | 0 | `INGESTION_IN_PROGRESS` | KU Leuven, Ghent University. |
| 17 | **Switzerland** | **20** | 0 | `INGESTION_IN_PROGRESS` | ETH Zurich, EPFL, University of Zurich. |
| 18 | **Poland** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Warsaw, Jagiellonian University. |
| 19 | **Hungary** | **20** | 0 | `INGESTION_IN_PROGRESS` | Eötvös Loránd University, Semmelweis. |
| 20 | **Czech Republic** | **20** | 0 | `INGESTION_IN_PROGRESS` | Charles University, CTU Prague. |
| 21 | **Lithuania** | **20** | 0 | `INGESTION_IN_PROGRESS` | Vilnius University, KTU. |
| 22 | **Latvia** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Latvia, RTU. |
| 23 | **Cyprus** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Cyprus, UNIC. |
| 24 | **Malta** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Malta. |
| 25 | **Malaysia** | **20** | 0 | `INGESTION_IN_PROGRESS` | Universiti Malaya, Taylor's, Sunway. |
| 26 | **Singapore** | **20** | 0 | `INGESTION_IN_PROGRESS` | NUS, NTU, SMU, SUTD. |
| 27 | **United Arab Emirates** | **20** | 0 | `INGESTION_IN_PROGRESS` | UAEU, AUS, Khalifa University. |
| 28 | **Dubai** | **20** | 1 (Base) | `INGESTION_IN_PROGRESS` | International branch campuses in DIAC & Knowledge Park. |
| 29 | **Qatar** | **20** | 0 | `INGESTION_IN_PROGRESS` | Qatar University, Education City branch campuses. |
| 30 | **Saudi Arabia** | **20** | 0 | `INGESTION_IN_PROGRESS` | KAUST, KAU, KFUPM. |
| 31 | **Japan** | **20** | 0 | `INGESTION_IN_PROGRESS` | University of Tokyo, Kyoto, Waseda. |
| 32 | **South Korea** | **20** | 0 | `INGESTION_IN_PROGRESS` | SNU, KAIST, Yonsei, Korea University. |
| 33 | **China** | **20** | 0 | `INGESTION_IN_PROGRESS` | Tsinghua, Peking, Fudan, Zhejiang. |
| 34 | **Hong Kong** | **20** | 0 | `INGESTION_IN_PROGRESS` | HKU, HKUST, CUHK, PolyU. |

---

## 2. DEGREE LEVEL COVERAGE SPECTRUM

The system architecture (`CrmCourse` model) fully categorizes programmes across 6 distinct academic levels:

1. **Pre-University & Pathways:** International Foundation Year (IFY), Foundation Diploma, International Year One (IY1), International Year Two (IY2), Pre-Master's, Pre-sessional English.
2. **Undergraduate Degrees:** Bachelor of Arts (BA), Bachelor of Science (BSc), Bachelor of Engineering (BEng), Bachelor of Laws (LLB), Bachelor of Business Administration (BBA), Bachelor of Architecture (BArch), Accelerated Degrees.
3. **Top-Up Degrees:** 1-Year Final-Year Top-Up (Level 5 to Level 6 Progression), HND-to-Degree Top-Up.
4. **Advanced Entry:** Year 2 Entry & Year 3 Entry credit transfers.
5. **Postgraduate Taught:** MA, MSc, MBA, LLM, MEd, MArch, MPH, MPA, MFA, Master's with Professional Placement/Internship.
6. **Postgraduate Research & Doctorates:**
   * **Research Master's:** Master of Research (MRes), MSc by Research, MA by Research, Master of Philosophy (MPhil).
   * **Doctoral Degrees:** Doctor of Philosophy (PhD / DPhil), Doctor of Business Administration (DBA), Doctor of Education (EdD), Doctor of Engineering (EngD).
   * **Research Project Opportunities:** Funded PhD Projects, Self-Funded PhDs, Supervisor-Led Projects, Graduate Teaching Assistantships (GTA).

---

## 3. RANKING PROVIDER INTEGRATION

The platform supports multi-publisher world and national rankings without conflating numbers:
* **QS World University Rankings** (Default 2026 Edition)
* **Times Higher Education (THE)**
* **Academic Ranking of World Universities (ARWU / Shanghai)**
* **U.S. News & World Report Best Global Universities**
* **Complete University Guide & Guardian University Guide** (UK National)

### Sorting & Filtering Mechanics:
* Sort by: *Highest Ranking First, Lowest Ranking First, Ranked First, Unranked First, A-Z, Lowest Tuition First*.
* Status Labels: `Ranked`, `Unranked`, `Ranking Unavailable`, `Specialist Institution`.

---

## 4. INTERNATIONAL STUDENT AVAILABILITY FLAGS

Public searches filter courses using the `availableToInternational` attribute:
* `INTERNATIONAL_OPEN` *(Default public display)*
* `INTERNATIONAL_CLOSED`
* `INTERNATIONAL_RESTRICTED`
* `INTERNATIONAL_STATUS_UNCONFIRMED`
* `NOT_CURRENTLY_RECRUITING`
* `APPLICATION_CLOSED`
* `COURSE_SUSPENDED`
* `COURSE_DISCONTINUED`
