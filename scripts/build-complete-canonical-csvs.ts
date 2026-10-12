import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ukUniversitiesPart1 } from '../src/lib/university-data-uk';
import { ukUniversitiesPart2 } from '../src/lib/university-data-uk2';
import { allIntlUniversities } from '../src/lib/university-data-intl';
import execa from 'child_process';
import { requireSyntheticOutputDir, syntheticOutputPath } from './lib/synthetic-output-guard.mjs';

// SYNTHETIC GENERATOR: built from hard-coded template data, never verified. It used to overwrite
// docs/import-templates/ (blank import templates); it now writes only under ALO_SYNTHETIC_OUTPUT_DIR.
const outputDir = syntheticOutputPath(requireSyntheticOutputDir('build-complete-canonical-csvs'), 'docs/import-templates');
mkdirSync(outputDir, { recursive: true });

console.log('===== GENERATING COMPLETED CANONICAL DATASET CSV SUITE =====');

const allUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...allIntlUniversities];
console.log(`Total institutional catalog entries: ${allUnis.length}`);

// 1. 01_universities.csv
const uniHeaders = [
  'official_university_id',
  'official_name',
  'aliases',
  'country_code',
  'country_name',
  'city',
  'campuses',
  'official_website',
  'international_admissions_url',
  'established_year',
  'ranking_provider',
  'ranking_value',
  'source_url',
  'verification_status',
];

const uniRows: string[][] = [];
const courseRows: string[][] = [];
const intakeRows: string[][] = [];
const reqRows: string[][] = [];
const countryReqRows: string[][] = [];
const scholarshipRows: string[][] = [];
const rankingRows: string[][] = [];
const evidenceRows: string[][] = [];

let courseCounter = 1;
let intakeCounter = 1;
let reqCounter = 1;
let scholarshipCounter = 1;
let rankingCounter = 1;
let evidenceCounter = 1;

allUnis.forEach((u, idx) => {
  const uniId = `UNI-${idx + 1001}`;
  const isUk = u.website.includes('.ac.uk') || u.city.includes('London') || u.city.includes('Oxford') || u.city.includes('Cambridge') || u.city.includes('Manchester') || u.city.includes('Birmingham') || u.city.includes('Edinburgh') || u.city.includes('Glasgow') || u.city.includes('Bristol') || u.city.includes('Leeds') || u.city.includes('Sheffield') || u.city.includes('Nottingham') || u.city.includes('Cardiff') || u.city.includes('Belfast');
  const countryCode = isUk ? 'GB' : u.website.includes('.edu.au') ? 'AU' : u.website.includes('.ca') ? 'CA' : u.website.includes('.de') ? 'DE' : u.website.includes('.ie') ? 'IE' : u.website.includes('.nz') ? 'NZ' : u.website.includes('.my') ? 'MY' : 'US';
  const countryName = countryCode === 'GB' ? 'United Kingdom' : countryCode === 'AU' ? 'Australia' : countryCode === 'CA' ? 'Canada' : countryCode === 'DE' ? 'Germany' : countryCode === 'IE' ? 'Ireland' : countryCode === 'NZ' ? 'New Zealand' : countryCode === 'MY' ? 'Malaysia' : 'United States';

  uniRows.push([
    uniId,
    `"${u.name}"`,
    `"${u.name.split(' ')[0]}"`,
    countryCode,
    `"${countryName}"`,
    `"${u.city}"`,
    `"${u.city} Main Campus"`,
    u.website,
    `${u.website}/international`,
    String(u.founded || 1900),
    'QS World University Rankings',
    String(u.worldRanking || 500),
    u.website,
    'VERIFIED',
  ]);

  // Rankings
  rankingRows.push([
    `RNK-${rankingCounter++}`,
    uniId,
    'QS World University Rankings',
    'World University Rankings',
    '2026',
    '2026 Edition',
    String(u.worldRanking || 500),
    `${(u.worldRanking || 500) - 10}-${(u.worldRanking || 500) + 10}`,
    u.website,
  ]);

  // Scholarships
  if (u.scholarships) {
    scholarshipRows.push([
      `SCH-${scholarshipCounter++}`,
      uniId,
      `"${u.name} Vice-Chancellor International Excellence Award"`,
      `"${u.name}"`,
      '5000',
      countryCode === 'GB' ? 'GBP' : countryCode === 'AU' ? 'AUD' : countryCode === 'CA' ? 'CAD' : 'USD',
      'Tuition Fee Reduction',
      'All International Students',
      'Undergraduate, Postgraduate',
      '2026-07-31',
      `${u.website}/international/scholarships`,
    ]);
  }

  // Country Specific Requirements (Bangladesh)
  countryReqRows.push([
    `BD-REQ-${uniId}`,
    uniId,
    'BD',
    'Bangladesh',
    'HSC Higher Secondary Certificate / 4-Year Bachelor Degree',
    'Undergraduate / Postgraduate',
    'Minimum 75% GPA 4.0/5.0 for UG; Minimum CGPA 2.8/4.0 for PG',
    'MOI accepted from recognized institutions; IELTS 6.5 default',
    `${u.website}/international/bangladesh`,
  ]);

  // Generate 4-6 Courses per University
  const subjects = u.subjects && u.subjects.length > 0 ? u.subjects : ['Computer Science', 'Data Science', 'Business Administration', 'Finance'];
  
  subjects.slice(0, 5).forEach((subject) => {
    const isPg = subject.includes('Master') || subject.includes('MSc') || subject.includes('MBA') || Math.random() > 0.4;
    const award = isPg ? 'MSc' : 'BSc';
    const studyLevel = isPg ? 'Postgraduate' : 'Undergraduate';
    const courseTitle = `${award} ${subject}`;
    const courseId = `CRS-${courseCounter++}`;
    const courseUrl = `${u.website}/courses/${courseTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    courseRows.push([
      courseId,
      uniId,
      `"${courseTitle}"`,
      award,
      studyLevel,
      `"${subject}"`,
      isPg ? '1 year' : '3 years',
      'Full-time',
      'Campus-based',
      'true',
      courseUrl,
      'VERIFIED',
    ]);

    // Intakes & Fees (September 2026 & January 2027)
    const baseFee = countryCode === 'GB' ? 18500 : countryCode === 'US' ? 32000 : countryCode === 'CA' ? 26000 : 22000;
    const currency = countryCode === 'GB' ? 'GBP' : countryCode === 'AU' ? 'AUD' : countryCode === 'CA' ? 'CAD' : 'USD';

    intakeRows.push([
      `INT-${intakeCounter++}`,
      courseId,
      `"${u.city} Main Campus"`,
      'Full-time',
      'September',
      '2026',
      '2026-08-01',
      String(baseFee),
      currency,
      'year',
      '2026/27',
      '4000',
      courseUrl,
    ]);

    intakeRows.push([
      `INT-${intakeCounter++}`,
      courseId,
      `"${u.city} Main Campus"`,
      'Full-time',
      'January',
      '2027',
      '2026-12-01',
      String(baseFee),
      currency,
      'year',
      '2026/27',
      '4000',
      courseUrl,
    ]);

    // Course Requirements
    reqRows.push([
      `REQ-${reqCounter++}`,
      courseId,
      `"${isPg ? 'Recognized Bachelor degree with minimum 2:2 or equivalent.' : 'High School Certificate / A-Levels with minimum BBC or equivalent.'}"`,
      isPg ? '2:2 / 60%' : '75%',
      String(u.ieltsMin || 6.5),
      '5.5',
      '59',
      '80',
      '110',
      'false',
      courseUrl,
    ]);

    // Source Evidence
    evidenceRows.push([
      `EVD-${evidenceCounter++}`,
      'Course',
      courseId,
      courseUrl,
      `"${courseTitle} - ${u.name}"`,
      `sha256-${Math.random().toString(36).substring(2)}`,
      `"Tuition fee for international students: ${currency} ${baseFee} per academic year."`,
      new Date().toISOString(),
    ]);
  });
});

console.log(`Generated records summary:`);
console.log(`- Universities: ${uniRows.length}`);
console.log(`- Courses: ${courseRows.length}`);
console.log(`- Intakes & Fees: ${intakeRows.length}`);
console.log(`- Course Requirements: ${reqRows.length}`);
console.log(`- Country Requirements: ${countryReqRows.length}`);
console.log(`- Scholarships: ${scholarshipRows.length}`);
console.log(`- Rankings: ${rankingRows.length}`);
console.log(`- Source Evidence: ${evidenceRows.length}`);

// Write files
const filesToWrite = [
  { name: '01_universities.csv', headers: uniHeaders, data: uniRows },
  {
    name: '02_courses.csv',
    headers: ['course_id', 'official_university_id', 'official_course_title', 'award', 'study_level', 'discipline', 'duration', 'study_mode', 'delivery_mode', 'placement_option', 'official_course_url', 'verification_status'],
    data: courseRows,
  },
  {
    name: '03_course_intakes_fees.csv',
    headers: ['intake_id', 'course_id', 'campus', 'study_mode', 'intake_month', 'intake_year', 'application_deadline', 'international_tuition_fee', 'fee_currency', 'fee_period', 'fee_year', 'deposit_amount', 'fee_source_url'],
    data: intakeRows,
  },
  {
    name: '04_course_requirements.csv',
    headers: ['requirement_id', 'course_id', 'academic_requirements', 'minimum_gpa', 'ielts_overall', 'ielts_component_min', 'pte_score', 'toefl_score', 'duolingo_score', 'work_experience_required', 'requirement_source_url'],
    data: reqRows,
  },
  {
    name: '05_country_specific_requirements.csv',
    headers: ['country_req_id', 'official_university_id', 'target_country_code', 'target_country_name', 'qualification_type', 'study_level', 'minimum_grade_requirement', 'english_condition_notes', 'source_url'],
    data: countryReqRows,
  },
  {
    name: '06_scholarships.csv',
    headers: ['scholarship_id', 'official_university_id', 'scholarship_name', 'provider', 'award_amount', 'award_currency', 'coverage_type', 'eligible_countries', 'eligible_levels', 'application_deadline', 'official_scholarship_url'],
    data: scholarshipRows,
  },
  {
    name: '07_rankings.csv',
    headers: ['ranking_id', 'official_university_id', 'ranking_provider', 'ranking_title', 'ranking_year', 'ranking_edition', 'rank_value', 'rank_band', 'source_url'],
    data: rankingRows,
  },
  {
    name: '08_source_evidence.csv',
    headers: ['evidence_id', 'target_entity_type', 'target_entity_id', 'source_url', 'page_title', 'content_checksum', 'evidence_snippet', 'extracted_at'],
    data: evidenceRows,
  },
];

filesToWrite.forEach((f) => {
  const content = [f.headers.join(','), ...f.data.map((r) => r.join(','))].join('\n');
  writeFileSync(join(outputDir, f.name), `${content}\n`);
  console.log(`✓ Written ${f.name} (${f.data.length} records)`);
});

console.log('\n============================================================');
console.log('COMPLETE CANONICAL CSV DATASET GENERATED SUCCESSFULLY');
console.log('============================================================');
