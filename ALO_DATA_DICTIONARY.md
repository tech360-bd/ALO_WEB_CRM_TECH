# ALO Education Higher-Education Dataset Data Dictionary
Version 1.0.0

This data dictionary provides the exact schema, field definitions, and types for the 18 relational and export CSV files included in the `ALO_UNIVERSITY_COURSE_DATA_PACKAGE.zip`.

---

## 1. 01_ALO_UNIVERSITY_MASTER.csv
Contains the canonical, audited profile of each higher-education institution.

| Field | Type | Description |
| --- | --- | --- |
| `university_id` | String (Key) | Unique stable identifier for the university (e.g. `UNI-UK-0001`). |
| `university_name` | String | Commercial name of the institution. |
| `official_name` | String | Legal chartered name of the institution. |
| `normalized_name` | String | Cleaned canonical name for matching. |
| `country` | String | Destination country of the institution. |
| `country_code` | String (2-letter) | ISO alpha-2 code of the destination country. |
| `region` | String | Regional division (e.g. Europe, North America). |
| `state` | String | State (for US/Australia). |
| `province` | String | Province (for Canada). |
| `city` | String | City where the main campus is located. |
| `postcode` | String | Postal code of the main campus. |
| `address` | String | Full physical street address. |
| `latitude` | Float | Geographic latitude coordinate. |
| `longitude` | Float | Geographic longitude coordinate. |
| `institution_type` | String | Type of institution (e.g. Public, Private). |
| `public_private` | String | Ownership class (Public / Private). |
| `established_year` | Integer | Founding year of the university. |
| `official_university_url` | String | Official home URL of the university. |
| `official_international_url` | String | Link to international student admissions. |
| `official_admissions_url` | String | General admissions page. |
| `official_application_url` | String | Link to direct application portal. |
| `official_course_catalogue_url` | String | Link to official programme search/catalogue. |
| `official_fees_url` | String | Tuition fee information page. |
| `official_scholarship_url` | String | Scholarship opportunities page. |
| `official_contact_url` | String | Contact form or contact information page. |
| `official_phone` | String | General university telephone number. |
| `official_email` | String | General admissions inquiry email. |
| `international_email` | String | Specific email for international applicants. |
| `international_phone` | String | Specific telephone for international applicants. |
| `website` | String | Short web address (e.g. `ox.ac.uk`). |
| `international_students` | String | Total count of international students. |
| `campuses_count` | Integer | Total number of campuses. |
| `campus_information` | String (JSON) | JSON structure listing campuses. |
| `faculties` | String (JSON) | Array of faculties/colleges. |
| `schools` | String (JSON) | Array of schools. |
| `departments` | String (JSON) | Array of academic departments. |
| `academic_structure` | String (Text) | Descriptive academic organization. |
| `research_information` | String (Text) | Research profile and facilities. |
| `ranking_information` | String | Summary ranking details. |
| `ranking_source` | String | Provider of ranking (e.g. QS, THE). |
| `accreditation` | String | Accrediting bodies. |
| `recognition` | String | Governmental recognition status. |
| `international_student_information` | String (Text)| Support and details for international applicants. |
| `student_support` | String (Text) | Available support services. |
| `accommodation` | String (Text) | Housing availability and fees. |
| `library` | String (Text) | Library details. |
| `facilities` | String (Text) | Athletic and medical facilities. |
| `career_services` | String (Text) | Career and employment support. |
| `industry_links` | String (Text) | Corporate partnerships. |
| `scholarships_available` | Boolean | True if scholarships exist. |
| `application_information` | String (Text) | Detailed application process overview. |
| `visa_information` | String (Text) | Student visa requirements link or guide. |
| `source_count` | Integer | Number of sources used to build record. |
| `primary_source` | String | Main official URL source. |
| `verification_status` | String | `VERIFIED_OFFICIAL`, `VERIFIED_GOVERNMENT`, `CROSS_SOURCE_VERIFIED`, `NEEDS_REVIEW`. |
| `last_verified_at` | String (Date) | Date of last verification (YYYY-MM-DD). |

---

## 2. 02_ALO_COURSE_MASTER.csv
Contains the comprehensive list of academic programmes without course count limits.

| Field | Type | Description |
| --- | --- | --- |
| `course_id` | String (Key) | Unique stable course code (e.g. `UNI-UK-0001-MSC-001`). |
| `university_id` | String (Ref) | Relational link to the university. |
| `university_name` | String | Name of the offering university. |
| `official_course_id` | String | University's internal course code. |
| `course_name` | String | Commercial title of the programme. |
| `official_course_name` | String | Exact title on the official catalogue. |
| `normalized_course_name` | String | Cleaned lowercase title for search indexing. |
| `course_code` | String | Course code on official portal. |
| `degree_level` | String | Level (e.g. Undergraduate, Postgraduate, Foundation, PhD). |
| `qualification` | String | Degree abbreviation (e.g. BSc, MSc, MBA, PhD). |
| `award` | String | Conferred award title. |
| `faculty` | String | Offering faculty. |
| `school` | String | Offering school. |
| `department` | String | Offering department. |
| `discipline` | String | Academic discipline. |
| `subject` | String | Primary subject area. |
| `sub_subject` | String | Secondary subject area. |
| `specialisation` | String | Major concentration or specialization. |
| `campus` | String | Campus location of the course. |
| `city` | String | City where course is taught. |
| `country` | String | Country where course is taught. |
| `study_mode` | String | Full-Time, Part-Time, Online, Blended. |
| `attendance` | String | Regular, Block, Distance. |
| `delivery_mode` | String | On-Campus, Hybrid, Online. |
| `online_available` | Boolean | True if fully online is available. |
| `duration` | String | String representation (e.g. `3 Years`). |
| `duration_value` | Integer | Value of duration (e.g. `36`). |
| `duration_unit` | String | Unit of duration (e.g. `Months`, `Years`). |
| `credits` | String | Academic credit value (ECTS/CATS). |
| `language_of_instruction` | String | E.g. English, German. |
| `course_description` | String (Text) | Detailed description of the programme. |
| `course_overview` | String (Text) | Brief high-level overview. |
| `learning_outcomes` | String (Text) | Skills acquired upon graduation. |
| `modules` | String (JSON) | List of core and elective modules. |
| `curriculum_url` | String | Official curriculum syllabus page link. |
| `course_url` | String | Landing page of the course. |
| `official_course_url` | String | Official course search page link. |
| `application_url` | String | Landing page to start application. |
| `international_application_url`| String | Specific portal link for international students. |
| `course_start_information` | String | Information on cohort startups. |

---

## 3. 03_ALO_COURSE_INTAKES_2027.csv
Contains the source-supported start cohorts for the year 2027.

| Field | Type | Description |
| --- | --- | --- |
| `course_intake_id` | String (Key) | Unique intake code (e.g. `INTK-00001`). |
| `course_id` | String (Ref) | Relational link to the course. |
| `intake_month` | String | Month of cohort start (e.g. `September`). |
| `intake_year` | Integer | Year of cohort start (e.g. `2027`). |
| `intake_label` | String | Label of the cohort (e.g. `September 2027`). |
| `start_date` | String (Date) | Expected start date (YYYY-MM-DD). |
| `application_open_date` | String (Date) | Date application portal opens. |
| `application_deadline` | String (Date) | General application deadline. |
| `international_deadline` | String (Date) | Priority deadline for international students. |
| `late_application_deadline` | String (Date) | Late or clearing deadline. |
| `intake_status` | String | `active`, `suspended`, `closed`. |
| `availability` | String | `open`, `limited`, `closed`. |
| `international_student_available`| Boolean | True if international students can apply. |
| `source_url` | String | Webpage link where intake was verified. |
| `official_source_url` | String | Official university link verifying the intake. |
| `evidence` | String (Text) | Full source quote or context proving intake validity. |
| `verification_status` | String | Verification level of intake. |
| `last_verified_at` | String (Date) | Last check timestamp. |

---

## 4. 04_ALO_UNIVERSITY_COURSE_MASTER.csv
Flattened canonical search engine index containing 1 row per course intake for 2027.

---

## 5. 05_ALO_COURSE_REQUIREMENTS.csv
Detailed academic and general admission criteria.

| Field | Type | Description |
| --- | --- | --- |
| `course_requirement_id` | String (Key) | Unique requirements ID. |
| `course_id` | String (Ref) | Link to course. |
| `academic_requirement` | String | Broad description of academic prerequisites. |
| `minimum_qualification` | String | Required degree (e.g. Bachelor). |
| `minimum_percentage` | String | E.g. `60%`. |
| `minimum_gpa` | String | E.g. `3.0/4.0`. |
| `grading_scale` | String | Scale description. |
| `subject_requirements` | String | Prerequisite high school or university subjects. |
| `math_requirement` | String | Mathematics specifications. |
| `science_requirement` | String | Science specifications. |
| `specific_subject_requirement` | String | Course-specific subjects. |
| `work_experience` | String | Required years or details. |
| `professional_experience` | String | Professional registration needed. |
| `study_gap_requirement` | String | Allowed study gaps. |
| `backlog_requirement` | String | Max backlogs allowed. |
| `portfolio_requirement` | String | True/Yes if portfolio must be submitted. |
| `interview_requirement` | String | True/Yes if interview is required. |
| `entrance_exam` | String | Name of required entrance exam. |
| `GRE` | String | Minimum GRE score. |
| `GMAT` | String | Minimum GMAT score. |
| `SAT` | String | Minimum SAT score. |
| `ACT` | String | Minimum ACT score. |
| `other_exam_requirements` | String | Other exams (e.g. MCAT). |
| `required_documents` | String | List of documents required. |

---

## 6. 06_ALO_ENGLISH_REQUIREMENTS.csv
Minimum English language test scores.

| Field | Type | Description |
| --- | --- | --- |
| `english_requirement_id` | String (Key) | Unique ID. |
| `course_id` | String (Ref) | Link to course. |
| `test_name` | String | `IELTS`, `PTE`, `TOEFL`, `Duolingo`, `Cambridge`, `LanguageCert`. |
| `overall_score` | Float | Required overall band score. |
| `minimum_band_score` | Float | Minimum score required in any single section. |

---

## 7. 07_ALO_TUITION_FEES.csv
Detailed international and domestic fees.

| Field | Type | Description |
| --- | --- | --- |
| `fee_id` | String (Key) | Unique fee ID. |
| `course_id` | String (Ref) | Link to course. |
| `amount` | Float | Fee value. |
| `currency` | String | ISO 3-letter currency code (e.g. `GBP`). |
| `period` | String | E.g. `yearly`, `semester`, `total`. |
| `fee_type` | String | `international_tuition`, `domestic_tuition`. |

---

## 8. 08_ALO_APPLICATION_DEADLINES.csv
Cohort application key cutoff dates.

| Field | Type | Description |
| --- | --- | --- |
| `deadline_id` | String (Key) | Unique deadline ID. |
| `course_id` | String (Ref) | Link to course. |
| `intake_month` | String | Month of intake. |
| `intake_year` | Integer | Year of intake. |
| `deadline_date` | String (Date) | Cutoff date (YYYY-MM-DD). |
| `deadline_type` | String | `international_priority`, `general`. |

---

## 9. 09_ALO_SCHOLARSHIPS.csv
Fiancial aids and international scholarships.

| Field | Type | Description |
| --- | --- | --- |
| `scholarship_id` | String (Key) | Unique scholarship ID. |
| `course_id` | String (Ref) | Link to course if course-specific, else empty. |
| `name` | String | Official name of scholarship. |
| `amount` | Float | Cash value. |
| `currency` | String | Currency of scholarship. |
| `eligibility_criteria` | String | Country/Academic eligibility criteria. |
| `application_method` | String | E.g. `Automatic`, `Separate Application`. |

---

## 10. 10_ALO_CAMPUS_MASTER.csv
Details of additional academic campuses.

| Field | Type | Description |
| --- | --- | --- |
| `campus_id` | String (Key) | Unique campus ID. |
| `university_id` | String (Ref) | Link to university. |
| `name` | String | Campus name. |
| `city` | String | City where campus is located. |
| `address` | String | Physical address. |

---

## 11. 11_ALO_SOURCE_PROVENANCE.csv
Tracks official and third-party sources of all data entries.

| Field | Type | Description |
| --- | --- | --- |
| `source_id` | String (Key) | Unique source ID. |
| `entity_type` | String | `UNIVERSITY`, `COURSE`, `INTAKE`. |
| `entity_id` | String | Link to target entity. |
| `source_name` | String | Official website, LeapScholar, ApplyBoard, etc. |
| `source_type` | String | `course_catalogue`, `admissions_page`, `third_party_sync`. |
| `source_url` | String | URL of page audited. |
| `official_or_third_party` | String | `official`, `third_party`. |
| `evidence` | String (Text) | Quote or hash verification context. |
| `collected_at` | String (Date) | Date collected. |
| `last_checked_at` | String (Date) | Date verified. |
| `verification_status` | String | Status. |

---

## 12. 12_ALO_VERIFICATION.csv
Audit log of data verification.

| Field | Type | Description |
| --- | --- | --- |
| `log_id` | String (Key) | Unique log ID. |
| `record_type` | String | `university`, `course`, `intake`. |
| `record_id` | String | ID of record. |
| `verification_status` | String | `VERIFIED_OFFICIAL`, `VERIFIED_GOVERNMENT`, `CROSS_SOURCE_VERIFIED`, `NEEDS_REVIEW`. |
| `verified_by` | String | AI Agent name or auditor ID. |
| `verified_at` | String (Date) | Verification timestamp. |
| `notes` | String | Auditor notes. |

---

## 13. 13_ALO_DEDUPLICATION.csv
Deduplication merge actions taken on duplicates.

| Field | Type | Description |
| --- | --- | --- |
| `log_id` | String (Key) | Unique ID. |
| `target_type` | String | Type of entity merged. |
| `original_id` | String | Saved canonical ID. |
| `duplicate_id` | String | Deleted duplicate ID. |
| `action_taken` | String | Action details (e.g. merged). |
| `merged_at` | String (Date) | Merge timestamp. |

---

## 14. 14_ALO_CONFLICTS.csv
Log of conflicts resolved between different sources.

| Field | Type | Description |
| --- | --- | --- |
| `log_id` | String (Key) | Unique ID. |
| `record_type` | String | Entity type. |
| `record_id` | String | Entity ID. |
| `field_name` | String | Column with conflict. |
| `source_1_value` | String | Value from official site. |
| `source_2_value` | String | Value from third party. |
| `resolved_value` | String | Selected value. |
| `resolution_strategy` | String | Strategy (e.g. override with official). |
| `resolved_at` | String (Date) | Resolve date. |

---

## 15. 15_ALO_UNIVERSITY_COVERAGE.csv
University catalogue completeness audit matrix.

| Field | Type | Description |
| --- | --- | --- |
| `university_id` | String (Key) | Link to university. |
| `university_name` | String | University name. |
| `official_catalogue_url` | String | URL to catalogue. |
| `catalogue_sections_found` | String | Audited sections. |
| `programmes_discovered` | Integer | Total courses found. |
| `programmes_imported` | Integer | Total courses imported. |
| `programmes_verified` | Integer | Total courses verified. |
| `programmes_missing` | Integer | Count of missing courses (should be `0` for complete). |
| `coverage_percentage` | String | Coverage percent (should be `100%` for complete). |
| `coverage_status` | String | `COMPLETE`, `PARTIAL`, `NEEDS_REVIEW`. |
| `last_checked_at` | String (Date) | Timestamp. |

---

## 16. 16_ALO_MISSING_COURSES.csv
Verification check mapping discoverable courses vs imported courses.

| Field | Type | Description |
| --- | --- | --- |
| `university_id` | String (Key) | Link to university. |
| `university_name` | String | University name. |
| `discoverable_courses_count` | Integer | Count of courses on official site. |
| `imported_courses_count` | Integer | Count of courses in ALO database. |
| `missing_courses_count` | Integer | Difference (should be `0`). |
| `coverage_status` | String | Verification status. |

---

## 17. 17_ALO_MISSING_UNIVERSITY_INFO.csv
Detailed report on missing fields in university records.

| Field | Type | Description |
| --- | --- | --- |
| `university_id` | String (Key) | Link to university. |
| `university_name` | String | University name. |
| `missing_field` | String | Column name that is blank. |
| `source_checked` | String | Source URL audited. |
| `reason` | String | Reason for omission (e.g. not public). |
| `status` | String | `RESOLVED_NULL`, `PENDING_RESEARCH`. |

---

## 18. 18_ALO_IMPORT_MANIFEST.csv
Ubuntu server database import validation checklist.

| Field | Type | Description |
| --- | --- | --- |
| `manifest_id` | String (Key) | Unique ID. |
| `import_batch_id` | String | Link to import batch. |
| `table_name` | String | DB table imported. |
| `rows_imported` | Integer | Number of rows imported. |
| `status` | String | `success`, `failed`. |
| `imported_at` | String (Date) | Date imported. |
