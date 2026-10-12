import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ARCHIVED COPY — PERMANENTLY DISABLED (2026-10-12). It writes generated rows into a relative
// docs/import-templates/ and would overwrite the live repository's blank templates if run from the root.
// Use scripts/generate-canonical-templates.mjs (guarded: writes only under ALO_SYNTHETIC_OUTPUT_DIR).
console.error('[generate-canonical-templates.mjs] DISABLED: archived copy; no files were written.');
process.exit(1);

const docsDir = 'docs/import-templates';
mkdirSync(docsDir, { recursive: true });

console.log('===== GENERATING CANONICAL CSV & DOCUMENTATION TEMPLATES =====');

const templates = [
  {
    name: '01_universities.csv',
    headers: ['official_university_id', 'official_name', 'aliases', 'country_code', 'country_name', 'city', 'campuses', 'official_website', 'international_admissions_url', 'established_year', 'ranking_provider', 'ranking_value', 'source_url', 'verification_status'],
    rows: [
      ['UNI-ASTON-01', 'Aston University', 'Aston', 'GB', 'United Kingdom', 'Birmingham', 'Birmingham City Centre Campus', 'https://www.aston.ac.uk', 'https://www.aston.ac.uk/international', '1895', 'QS World University Rankings', '400', 'https://www.aston.ac.uk', 'VERIFIED'],
      ['UNI-OXFORD-01', 'University of Oxford', 'Oxford', 'GB', 'United Kingdom', 'Oxford', 'Oxford Campus', 'https://www.ox.ac.uk', 'https://www.ox.ac.uk/admissions', '1096', 'QS World University Rankings', '4', 'https://www.ox.ac.uk', 'VERIFIED'],
    ],
  },
  {
    name: '02_courses.csv',
    headers: ['course_id', 'official_university_id', 'official_course_title', 'award', 'study_level', 'discipline', 'duration', 'study_mode', 'delivery_mode', 'placement_option', 'official_course_url', 'verification_status'],
    rows: [
      ['CRS-ASTON-01', 'UNI-ASTON-01', 'Computer Science BSc', 'BSc', 'Undergraduate', 'Computer Science', '3 years', 'Full-time', 'Campus-based', 'true', 'https://www.aston.ac.uk/courses/undergraduate/bsc-computer-science', 'VERIFIED'],
      ['CRS-ASTON-02', 'UNI-ASTON-01', 'Artificial Intelligence MSc', 'MSc', 'Postgraduate', 'Artificial Intelligence', '1 year', 'Full-time', 'Campus-based', 'true', 'https://www.aston.ac.uk/courses/postgraduate/msc-artificial-intelligence', 'VERIFIED'],
    ],
  },
  {
    name: '03_course_intakes_fees.csv',
    headers: ['intake_id', 'course_id', 'campus', 'study_mode', 'intake_month', 'intake_year', 'application_deadline', 'international_tuition_fee', 'fee_currency', 'fee_period', 'fee_year', 'deposit_amount', 'fee_source_url'],
    rows: [
      ['INT-ASTON-01', 'CRS-ASTON-02', 'Birmingham City Centre Campus', 'Full-time', 'September', '2026', '2026-08-01', '20500', 'GBP', 'year', '2026/27', '4000', 'https://www.aston.ac.uk/courses/postgraduate/msc-artificial-intelligence'],
      ['INT-ASTON-02', 'CRS-ASTON-02', 'Birmingham City Centre Campus', 'Full-time', 'January', '2027', '2026-12-01', '20500', 'GBP', 'year', '2026/27', '4000', 'https://www.aston.ac.uk/courses/postgraduate/msc-artificial-intelligence'],
    ],
  },
  {
    name: '04_course_requirements.csv',
    headers: ['requirement_id', 'course_id', 'academic_requirements', 'minimum_gpa', 'ielts_overall', 'ielts_component_min', 'pte_score', 'toefl_score', 'duolingo_score', 'work_experience_required', 'requirement_source_url'],
    rows: [
      ['REQ-ASTON-01', 'CRS-ASTON-02', 'Bachelor degree with minimum 2:2 or equivalent in STEM discipline.', '2:2 / 60%', '6.5', '5.5', '59', '80', '110', 'false', 'https://www.aston.ac.uk/courses/postgraduate/msc-artificial-intelligence'],
    ],
  },
  {
    name: '05_country_specific_requirements.csv',
    headers: ['country_req_id', 'official_university_id', 'target_country_code', 'target_country_name', 'qualification_type', 'study_level', 'minimum_grade_requirement', 'english_condition_notes', 'source_url'],
    rows: [
      ['BD-REQ-ASTON-01', 'UNI-ASTON-01', 'BD', 'Bangladesh', 'HSC Higher Secondary Certificate', 'Undergraduate', 'Minimum 75% overall GPA 4.0/5.0', 'MOI accepted from selected universities; IELTS 6.5 default', 'https://www.aston.ac.uk/international/bangladesh'],
      ['BD-REQ-ASTON-02', 'UNI-ASTON-01', 'BD', 'Bangladesh', '4-Year Bachelor Honours Degree', 'Postgraduate', 'Minimum CGPA 2.8/4.0 from recognized institution', 'IELTS 6.5 overall (no band less than 5.5)', 'https://www.aston.ac.uk/international/bangladesh'],
    ],
  },
  {
    name: '06_scholarships.csv',
    headers: ['scholarship_id', 'official_university_id', 'scholarship_name', 'provider', 'award_amount', 'award_currency', 'coverage_type', 'eligible_countries', 'eligible_levels', 'application_deadline', 'official_scholarship_url'],
    rows: [
      ['SCH-ASTON-01', 'UNI-ASTON-01', 'Aston Vice-Chancellor International Scholarship', 'Aston University', '5000', 'GBP', 'Tuition Fee Reduction', 'All International Students', 'Undergraduate, Postgraduate', '2026-06-30', 'https://www.aston.ac.uk/international/scholarships'],
    ],
  },
  {
    name: '07_rankings.csv',
    headers: ['ranking_id', 'official_university_id', 'ranking_provider', 'ranking_title', 'ranking_year', 'ranking_edition', 'rank_value', 'rank_band', 'source_url'],
    rows: [
      ['RNK-ASTON-01', 'UNI-ASTON-01', 'QS', 'QS World University Rankings', '2026', '2026 Edition', '400', '350-400', 'https://www.topuniversities.com'],
    ],
  },
  {
    name: '08_source_evidence.csv',
    headers: ['evidence_id', 'target_entity_type', 'target_entity_id', 'source_url', 'page_title', 'content_checksum', 'evidence_snippet', 'extracted_at'],
    rows: [
      ['EVD-ASTON-01', 'Course', 'CRS-ASTON-02', 'https://www.aston.ac.uk/courses/postgraduate/msc-artificial-intelligence', 'Artificial Intelligence MSc - Aston University', 'a1b2c3d4e5f6', 'Tuition fee for 2026/27 international students is £20,500.', new Date().toISOString()],
    ],
  },
];

for (const t of templates) {
  const csvContent = [t.headers.join(','), ...t.rows.map((r) => r.join(','))].join('\n');
  writeFileSync(join(docsDir, t.name), `${csvContent}\n`);
  console.log(`✓ Created ${t.name}`);
}

const mappingGuide = `# ALO EDUCATION — CANONICAL CSV DATA IMPORT MAPPING GUIDE

## Standard Headers & Automatic Aliases
- **University:** \`official_name\`, \`University\`, \`University Name\`, \`Institution\`
- **Course:** \`official_course_title\`, \`Course\`, \`Course Name\`, \`Program\`, \`Programme Title\`
- **Tuition Fee:** \`tuitionFee\`, \`Tuition Fee\`, \`International Fee\`, \`Annual Tuition\`
- **Intake:** \`intakeMonth\`, \`Intake\`, \`Start Month\`, \`Start Date\`
- **Requirements:** \`academicRequirements\`, \`Entry Requirement\`, \`IELTS\`, \`GPA\`
- **Sources:** \`sourceUrl\`, \`Official Course URL\`, \`Fee Source\`

## Transaction & Approval Lifecycle
1. **UPLOADED:** CSV/XLSX uploaded securely via \`/admin/data-import\`.
2. **MAPPED:** Headers automatically matched to database fields.
3. **VALIDATED:** Enforces non-negative fees, valid HTTP/HTTPS URLs, and non-expired intakes.
4. **STAGED:** Staged into \`CrmImportBatch\` in database transaction.
5. **SUPER ADMIN REVIEW:** Material changes sent to \`/admin/change-approval\` approval queue.
6. **PUBLISHED:** Only authorized Super Admin actions publish to production website.
`;

writeFileSync(join(docsDir, 'FIELD_MAPPING_GUIDE.md'), mappingGuide);
console.log('✓ Created FIELD_MAPPING_GUIDE.md');

const validationGuide = `# ALO EDUCATION — DATA VALIDATION GUIDE

- **Formula Injection Safeguard:** Values starting with \`=\`, \`+\`, \`-\`, \`@\` are sanitized with a leading quote.
- **Maximum File Size:** 20 MB limit enforced on upload.
- **RBAC Security:** Anonymous & Non-Admin users blocked with \`401 Unauthorized\` or \`403 Forbidden\`.
- **URL Verification:** Verifies HTTPS protocol, response headers, and matching official university domain.
- **Duplicate Prevention:** Matches normalized titles, award types, campus, and study mode.
`;

writeFileSync(join(docsDir, 'VALIDATION_GUIDE.md'), validationGuide);
console.log('✓ Created VALIDATION_GUIDE.md');

const rollbackGuide = `# ALO EDUCATION — IMPORT ROLLBACK GUIDE

- Every import batch creates a tracking ID in \`CrmImportBatch\`.
- If an import is rejected or reversed, Super Admin can trigger batch rollback via \`/admin/data-import/[batchId]\`.
- Rollback deletes staged rows inside a database transaction without altering verified production records.
`;

writeFileSync(join(docsDir, 'IMPORT_ROLLBACK_GUIDE.md'), rollbackGuide);
console.log('✓ Created IMPORT_ROLLBACK_GUIDE.md');
