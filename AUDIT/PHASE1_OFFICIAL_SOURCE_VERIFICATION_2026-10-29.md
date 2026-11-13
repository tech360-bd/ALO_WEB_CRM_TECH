# Phase 1 — Official Source Verification and Institution Inventory

**As of:** 2026-10-29 (Asia/Dhaka)
**Overall status:** **INCOMPLETE — do not advance to Phase 2.**
**Scope:** United Kingdom, Australia, New Zealand, Ireland, United States, Canada.
**Mode:** Read-only source research and static repository review. The only new repository artifacts are this report, the partial institution CSV, and the source-register CSV.

## Executive result

- Official source universes or authoritative starting points were located for all six countries. Australia’s TEQSA category roster (44 rows), New Zealand’s eight-university list, and Ireland’s current HEA list (18 institutions) were captured as **identity-level** records in [the partial institution inventory](PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv).
- The UK’s **140-institution target is not verified**. England’s current OfS Register is accessible, but its full register/API chunks have not been extracted and filtered; the 140 UK-labelled rows in the existing export are not evidence of eligibility. The four nations’ lists overlap and distinguish degree-awarding bodies from teaching/listed providers.
- The official US and Canadian sources support a full-scope proposal, but neither institution roster has been extracted. The US source universe is much broader than “universities”; Canada has more than 300 degree-granting institutions across several provider types.
- Campus, faculty/department, international course catalogue, admissions, fees, intakes and scholarship URLs have **not** been surveyed institution by institution. Blank URLs in the CSV mean **not surveyed**, not “unavailable.”
- CRM model overlap, selected public-publication rules, and one university import route were reviewed statically. No model mapping was implemented and no route or workflow was run.
- Production/staging and live database access remain **UNVERIFIED**. `DATABASE_URL`, `TEST_DATABASE_URL`, and `DIRECT_URL` were absent in the earlier environment-presence check. No database/provider was contacted.

## Scope controls and evidence standard

1. Use current government, regulator, statutory, university, or authorized education-sector sources. Keep the exact source URL, access date, observed evidence, and verification status; the structured source list is [here](PHASE1_SOURCE_REGISTER_2026-10-29.csv).
2. Treat legal/registered identity, trading name, awarding body, teaching provider, campus, and immigration designation as separate concepts. Deduplicate only after checking identifiers and legal relationships.
3. An official website linked from an official register/list is recorded as a URL supplied by that source; it does **not** mean the website, course pages, live status, or content were individually checked.
4. Existing CSV labels, synthetic/ranking rows, historical status labels, and unverified reports are candidate seeds only—not inclusion evidence.
5. If a source is not accessible or its terms restrict use, record that blocker and stop at the allowed level. No authentication, paywall, anti-bot, rate-limit, or terms control was bypassed.

A read-only metadata check of `01_ALO_UNIVERSITY_MASTER.csv` found 400 rows across 14 country labels: UK 140 and 20 each for Australia, Canada, Cyprus, France, Germany, Ireland, Italy, Malta, Netherlands, New Zealand, South Korea, UAE, and the United States. These are export counts only, not evidence of recognition or current inclusion. The eight additional countries—**Cyprus, France, Germany, Italy, Malta, Netherlands, South Korea, and UAE**—remain preserved and outside the initial six-country release; none was edited or reclassified.

## Country universe findings and proposed Phase 1 criteria

### United Kingdom — 140 target not yet demonstrated

The UK is not a single regulator/register universe. GOV.UK routes recognition checks to the authority for England, Scotland, Wales, or Northern Ireland and explicitly warns that the body teaching a degree may differ from the body awarding it.

- **England:** the OfS says its Register contains **425 registered English higher-education providers** and includes provider registration, covered organisations, trading names, degree-awarding powers/level, university-title rights, fee limits, and conditions. This is a broad provider count, not 425 universities. OfS’s spreadsheet download is accessible and was parsed as 65 chunks; only the first chunk was fetched in the prior attempt. The official `/api/Provider/Name` response has 11 chunks and repeats aliases under the same UKPRN. The latest Recognised Bodies Order identified on the OfS page is the **2020** order. The OfS search UI’s loading placeholder is not a complete source-access blocker because the download/API works.
- **Scotland:** the Scottish Government states there are **19 autonomous higher-education institutions**, lists **18 recognised bodies with degree-awarding powers**, and separately names Glasgow School of Art as a provider with validation arrangements but no DAP. `The Open University in Scotland` appears in the 18-body list; the page also directs users to recognised bodies based elsewhere in the UK. These source lists must not be added across nations without deduplicating UK-wide awarding bodies.
- **Wales:** GOV.UK’s recognised-bodies page lists **11** bodies. It includes UK-wide bodies (including the Open University and Royal College of Nursing) and the University of Wales, so it is an awarding-body list—not a count of Welsh campus providers. The direct GOV.WALES `/recognised-bodies` URL returned a not-found page; the GOV.UK page linked by the GOV.UK recognition guide loaded and is used instead.
- **Northern Ireland:** the Department for the Economy lists **four recognised bodies**: Queen’s University Belfast, Ulster University, the Open University, and the Presbyterian Theological Faculty, Ireland (postgraduate only). It separately lists **17 listed bodies as of August 2026** whose degree courses are validated by recognised bodies, and identifies five public providers. Recognised and listed status must remain distinct; listed bodies are not automatically separate awarding universities.

**Recommended UK inclusion/identity rule (proposal, not approved):** use the current UKPRN/OfS provider identity where present; retain the legal awarding body and the teaching/delivery provider as separate linked roles; include an institution in the 140 only if it is an active UK-based higher-education provider with a current recognised degree-awarding/university-title basis or an explicitly approved listed-provider rule, and has official institution/course evidence. Store campuses under the provider rather than counting each campus as a new institution. Preserve aliases and cross-border awarding relationships. Do not select, rank, or force 140 records until the complete register is extracted and the user confirms whether listed/delivery providers count toward the 140.

**Current decision gap:** “140 qualifying institutions” still needs a precise rule on (a) awarding body versus teaching provider, (b) listed/validated providers, (c) UK-wide bodies with multiple regional listings, and (d) whether specialist degree-awarding institutions count. No 140-row source-verified UK roster exists yet.

### Australia — TEQSA category roster captured; 44 identity rows

TEQSA calls its National Register the authoritative provider-status source. The current register summary displays **44 Australian University** providers (44 self-accrediting, 0 non-self-accrediting). A filtered official data.gov.au/TEQSA API request returned **44** `Category=Australian University` records; every returned `RegistrationStatus` was `Active`. Provider IDs, legal/source names, trading/display names, websites, and CRICOS fields are in the CSV.

There is a source-level count discrepancy: the current TEQSA page displays **221 total providers**, while the linked TQNR data.gov.au resource reports **273 entries**. The category-specific Australian University total is 44 in both sources; the broader totals’ discrepancy is unresolved and does not change the 44 category rows captured.

**Important merger/status conflict:** TEQSA currently returns active category rows for `The University of Adelaide` (`PRV12105`), `University of South Australia` (`PRV12107`), and `Adelaide University` (`PRV14404`). The two legacy rows have blank CRICOS fields in the API response. Preserve all three source rows pending official reconciliation of legal succession, provider registration, CRICOS transition, and any continuing teach-out. Do not silently merge or discard them.

TQNR contains a registered-address field, but the CSV does not copy the full address column; no multi-campus inventory was surveyed. The listed CRICOS value is an additional international-student identifier, not proof that a course catalogue, admissions page, or course is current.

### New Zealand — eight source-listed universities

Universities New Zealand – Te Pōkai Tara identifies **eight universities** and links each to its official website. All eight names and links are in the CSV. The cited page does not provide a national identifier; no separate government-register identifier, campus list, faculty inventory, international course catalogue, admissions, fee, intake, or scholarship page was checked.

### Ireland — 18 HEA-listed institutions, with categories kept separate

The HEA’s current page lists **18** institutions with which it works under statute or which receive core public funding. The classification recommended for this catalogue is:

- **Seven traditional universities:** Dublin City University; Maynooth University; Trinity College Dublin; University College Cork; University College Dublin; University of Galway; University of Limerick. The Universities Act/IUA evidence supports the seven-member group. Treat `University of Dublin` as a Trinity alias, not a second teaching-provider row.
- **RCSI:** `RCSI University of Medicine and Health Sciences` is a specialist/private university whose use of the university title was authorised in 2019 and which has designated awarding-body status. Keep its specialist/private flag and its relationship with the National University of Ireland visible; do not fold it into the seven IUA members.
- **Five Technological Universities, separate from the traditional-university class:** Atlantic Technological University, Munster Technological University, South East Technological University, Technological University Dublin, and Technological University Shannon: Midlands Midwest. HEA identifies these five as established TUs.
- **Other HEI categories:** Dún Laoghaire Institute of Art, Design and Technology and Dundalk Institute of Technology (Institutes of Technology); Mary Immaculate College and National College of Art and Design (specialist colleges); and Royal Irish Academy (learned academy/other category, with teaching-provider role to confirm).

The 2022 gov.ie publicly funded HEI page places all five TUs under a “Publicly-funded universities” heading and does not list RCSI in that section. This is a **classification conflict**, not permission to relabel TUs as traditional universities. Use the current HEA TU listing and statutory/QQI sources for type; retain the older government page as an official website-link cross-check. The National University of Ireland is a federal awarding body, not an additional teaching provider; keep it as an awarder/relationship record rather than a separate university campus row. The HEA list is not a full list of all private QQI-validated providers.

The CSV includes official sites linked by the government/HEA sources and a preliminary class for each HEA row. Provider IDs, campus/faculty/course/admissions/fee/intake/scholarship sources, and awarder relationships remain unverified institution by institution.

### United States — source universe established; full scope proposed, roster not extracted

NCES/IPEDS reports **5,581** postsecondary institutions eligible to award federal student aid in academic year 2025–26 (provisional). The 2024–25 fall memo documents **5,829** expected IPEDS institutional-characteristics records including institutions, administrative offices, and service academies; its note distinguishes 5,760 institutions and 69 central/system offices and explains that four non-Title-IV service academies are included in the IPEDS universe. Its 2024–25 sector counts list 845 public, 1,545 private nonprofit, and 301 private for-profit four-year institutions (2,691 combined). These are collection-year/definition-specific baselines, not an extracted current university-only count.

**Recommended full-scope definition (proposal):** start from the current IPEDS institution-level file; include active institutions that offer and award a bachelor’s degree or higher, across public, private nonprofit, and private for-profit control; preserve graduate-only, specialist, faith-based, minority-serving, tribal, and service-academy classes separately; exclude administrative/system offices and do not turn a branch campus into a separate legal institution unless it is separately identified/authorized. Keep jurisdiction, parent/system, campus, and awarder relationships. Cross-check accreditation through the Department of Education’s DAPIP and state/recognized accreditor sources, but do not call DAPIP a regulator or sole approval list: DOE says it does not accredit institutions and warns its reported database is unaudited and may be incomplete or stale. For international recruitment, add DHS/SEVP certification as a **separate** student-visa overlay; that list is not yet checked.

The 5,581 IPEDS count is broader than this proposed bachelor’s-or-higher scope. A current, reproducible filtered roster/count and institution-level source checks are still required. The old 20-row US export is not a full-universe proposal or proof.

### Canada — authoritative directory found; full degree-granting scope proposed, roster not extracted

CICIC says its Directory of Educational Institutions in Canada is the only authoritative list of currently recognized, authorized, registered, and/or licensed institutions in the provinces and territories; it is maintained in consultation with competent authorities and updated on an ongoing basis. CICIC says **more than 300** public/private postsecondary institutions can grant degrees. That broad group includes universities, university colleges, colleges, CEGEPs, Indigenous postsecondary institutes, polytechnics, institutes of technology, and specialist institutions.

**Recommended full-scope definition (proposal):** extract current CICIC entries with `recognized` or credential-specific `authorized` status and authority to offer a bachelor’s degree or higher; preserve institution type, province/territory, public/private control, parent/affiliation and credential-specific scope. Keep colleges/polytechnics with bachelor’s or graduate powers in a separate type rather than relabelling them as universities. If the release is required to be strictly universities, use CICIC’s `University` type as the core release and maintain the wider authorized degree-granting set separately. Overlay IRCC DLI number/status for international-student/permit eligibility; DLI status is not degree authority or university status.

The source count is “more than 300,” not an exact current count. CICIC notes that it is not itself a competent authority, excludes some exempt providers, and does not provide a comprehensive program catalogue. The DLI list is available but is not a university universe. No institution-level Canadian roster, provincial authority rows, campuses, or course/admissions/fee sources have been extracted.

## Partial institution CSV — field meanings

`PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv` contains **70 identity rows**: Australia 44, New Zealand 8, Ireland 18. It intentionally does **not** claim Phase 1 completion.

- Australia’s legal/source name, trading/display name, TEQSA provider ID, website, active registration status and CRICOS field come from the filtered TQNR response. Empty CRICOS values are explicitly marked. Provider addresses were available in the TQNR dataset but are not copied into these rows.
- New Zealand’s names and official-site links are the eight entries shown by Universities New Zealand; that page shows no national ID.
- Ireland’s 18 names are the HEA current list. The current classification is a source-based preliminary classification, not a complete legal or awards audit.
- For every row, campus/faculty/course/admissions/fees/intakes/scholarships are `NOT_SURVEYED` unless the field says otherwise. This is an evidence status, not a negative finding.
- UK, US and Canada have no institution-level rows in this partial CSV yet. Their official source universes and proposed filters are recorded above and in the source register.

## Static CRM/catalogue review — mapping observations only

No model, route, seed, import, database, or publication state was changed.

### Candidate fields in the existing structured CRM

- `CrmUniversity` has `name`, `universityId`, `universityCode`, `countryId`, `country`, `website`, `officialUrl`, `sourceUrl`, `sourceUrls`, `aliases`, `officialInternationalAdmissionsUrl`, `officialCourseSearchUrl`, `officialTuitionFeeUrl`, `officialScholarshipUrl`, `applicationUrl`, `status`, `verificationStatus`, `publicationStatus`, and `lastVerifiedAt`. The external identifiers discovered here (UKPRN, TEQSA ProviderID, IPEDS UNITID, CICIC IDs) do **not** have an obvious dedicated authority-ID field. `universityId` is a unique CRM identifier; do not assume it is an external regulator ID.
- `Campus` is related to `CrmUniversity` and stores name, city, state, address, campus type and status, but has no per-campus official-source/verification fields. `CrmUniversity` also contains text campus fields, so a canonical campus representation is unresolved.
- `UniversityFaculty` stores a university slug, faculty name/type, parent faculty ID, official URL and verification/approval fields, but has no declared Prisma relation to `CrmUniversity`. Generic `Department` is an operational CRM department and is not a safe target for academic faculties/departments.
- `CrmCourse` has official/course/application source URLs, international eligibility, status, verification and publication fields. `CrmCourseIntakeFee` has fee/intake source URLs, status, currency/amount and verification fields. Legacy `CourseIntake` is a separate source-less intake model.
- Source/evidence candidates overlap: `OfficialSource` / `SourceSnapshot` / `DataChange`; `CrmOfficialSourceCheck`; `CrmSourceVerificationEvent`; `CrmSourceLog`; `UniversityResearchEvidence`; and discovery/staging records (`CrmDiscoverySource`/`CrmDiscoveryRecord`). No one evidence/logging model was selected or reconciled.
- Legacy `UniversityPage` / `CoursePage` form a separate catalogue path from `CrmUniversity` / `CrmCourse`. No cross-model mapping or duplication rule was implemented.

### Static publication rules observed

- Structured university visibility in `src/lib/public-catalog.ts` requires `status='active'`, `verificationStatus='VERIFIED'`, published publication status, and a non-empty `sourceUrl` or `officialUrl`.
- Structured course visibility requires active/verified/published status, a source link, a public parent university, and excludes explicit closed/domestic-only international eligibility values. The current structured predicate can leave unverified eligibility visible with a label; it does not use the same positive-only rule as the legacy international-page path.
- Structured intake/fee rows require active/verified status and an `intakeSourceUrl` or `feeSourceUrl`.
- Legacy `UniversityPage` / `CoursePage` policy separately requires published/verified, acceptable HTTPS source evidence, no open conflict, and a public parent. Legacy international listing requires explicit positive eligibility.

These are static-code observations only; complete RBAC, database, runtime behavior, and actual publication state remain unverified.

### Import/source-verification routes reviewed; not executed

- `POST /api/admin/import/universities` is an authenticated admin/super-admin, same-origin mutation route. It accepts up to 500 string rows; its duplicate test uses name, the CRM `universityId`, or a website-domain match. A non-dry-run creates `CrmUniversity` rows with `status='active'`, `publicationStatus='draft'`, and `verificationStatus='NEEDS_REVIEW'`, then writes an audit log. It maps the submitted website to `officialUrl`; it does not verify the external regulatory identifier or course evidence. No request was sent.
- `/api/crm/source-verification` is an admin route. Its POST statically upserts discovery-source metadata and an audit log; it does not itself fetch/verify an institution’s source page. No request was sent.
- Student `ImportBatch` workflows are separate and were not used for catalogue data.

## Phase 1 acceptance checklist

| Acceptance item | Status | Evidence / gap |
|---|---|---|
| Official universe source identified for all six countries | **Partial** | Sources and current broad counts/baselines are in the source register; UK roster filtering, US extract, and Canada extract remain. |
| Traceable inclusion/exclusion criteria | **Proposed, not approved** | Recommended country-specific filters are documented above; UK “140” rule and US/Canada breadth still need decisions. |
| Per-institution identity/classification/status/provenance for all target institutions | **Not met** | Only 70 partial identity rows (AU/NZ/IE); no UK 140, US filtered, or Canadian row-level inventory. |
| Campus and faculty/department inventories | **Not met** | Not surveyed at institution level. |
| International course catalogue and admissions/fees/intakes/scholarships source availability | **Not met** | URLs and availability have not been individually surveyed; CSV marks `NOT_SURVEYED`. |
| Gaps/conflicts/status documented | **Partial** | Material cross-source and classification conflicts are documented; institution-level conflicts remain. |
| CRM model/API/publication mapping reviewed | **Partial, static only** | Candidate fields, duplicate models, guards, and import routes recorded; no runtime, DB, or authorization test. |
| Remaining limitations/approvals recorded | **Yes, outstanding** | See decisions and next steps below. |

**Conclusion:** Phase 1 acceptance criteria are not met. Do not begin Phase 2 planning or any database work yet.

## Decisions needed before the final inventory can be accepted

1. **UK:** confirm whether the 140 counts only awarding/recognised bodies or also listed/delivery providers; confirm treatment of UK-wide bodies and specialist providers.
2. **Ireland:** confirm the recommended treatment of RCSI as a separately flagged specialist/private university, and the five TUs as a distinct class. NUI should remain an awarding-body relationship, not a separate campus provider.
3. **United States:** confirm the proposed all-sector bachelor’s-or-higher IPEDS scope, treatment of territories/service academies, and whether for-profit degree-granting institutions remain in scope.
4. **Canada:** confirm strict `University` directory types versus the broader recommended bachelor’s-or-higher authorized degree-granting catalogue, with non-university types separate.
5. **Phase 2 / environment:** production, staging, live DB and deployment access must be explicitly verified and separately authorized before any database/import/publication operation. No credentials are requested in this report.

## Remaining Phase 1 work (no Phase 2 action)

1. Retrieve the remaining OfS register/API chunks and extract/deduplicate providers by UKPRN; reconcile current England registration/DAP/title with the UK nation lists and produce the candidate UK roster before accepting the 140 target.
2. Extract the complete current IPEDS institution file and apply the approved US scope; cross-check accreditation using DAPIP/recognized agencies and add the separately approved SEVP overlay.
3. Extract CICIC’s current directory and provincial/territorial authority/credential fields; reconcile DLI and campus relationships; compute a reproducible count for the approved Canada scope.
4. Reconcile Ireland’s awarder/provider/campus relationships, especially RCSI/NUI, former university names, TUs, and specialist institutions.
5. For the 70 captured AU/NZ/IE rows, verify official campus lists, academic structure, international course catalogues and admissions/fees/intake/scholarship pages; record exact URLs, access dates, evidence, and field-specific status. Resolve the Adelaide/UniSA transition without deleting source records.
6. Only after every institution-level row and its gaps are documented, assess the Phase 1 acceptance checklist and request separate Phase 2 authorization.

## Repository and non-action log

Repository identity and target branch were confirmed: `tech360-bd/ALO_WEB_CRM_TECH`, branch `arena/95c5f3a5-alo-web-crm-tech`, HEAD `58971c9e61cfdbf9a763cb754ccb6b7ebd19517c`. Before these report artifacts, the worktree had 169 tracked modified paths, 15 untracked paths, an empty index, and no deletions. Those existing changes were preserved; only the three additive Phase 1 audit files named here were added.

No migrations, seeds, imports, DB writes, code/schema/environment edits, commits, pushes, merges, deployments, or releases were performed for Phase 1. No production/staging/live database or provider was contacted. No tests were run for these documentation-only additions. Source pages/data are not archived as raw snapshots in the repository; the links, observed evidence, access dates and limitations are recorded in the source register and should be re-fetched before any later verification/use.
