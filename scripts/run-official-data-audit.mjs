import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = process.env.ALO_DATA_AUDIT_DIR || 'data/official-source-audit';
mkdirSync(outputDir, { recursive: true });

const now = new Date().toISOString();

const discoverySources = [
  { name: 'GoStudyIn', url: 'https://gostudyin.com/course-search', robots: 'https://gostudyin.com/robots.txt', allowedUse: 'discovery_only' },
  { name: 'TCL Global', url: 'https://www.tclglobal.co.uk/courses', robots: 'https://www.tclglobal.co.uk/robots.txt', allowedUse: 'discovery_only' },
  { name: 'Studies Overseas', url: 'https://www.studies-overseas.com/universities', robots: 'https://www.studies-overseas.com/robots.txt', allowedUse: 'discovery_only' },
  { name: 'TopUniversities', url: 'https://www.topuniversities.com/find-your-university', robots: 'https://www.topuniversities.com/robots.txt', allowedUse: 'ranking_reference_only' },
  { name: 'Gradding', url: 'https://www.gradding.com/course-finder', robots: 'https://www.gradding.com/robots.txt', allowedUse: 'discovery_only' },
  { name: 'Coursefind', url: 'https://coursefind.app', robots: 'https://coursefind.app/robots.txt', allowedUse: 'manual_reference_only_no_bulk_extract' },
  { name: 'Coursefind Search', url: 'https://search.coursefind.app', robots: 'https://search.coursefind.app/robots.txt', allowedUse: 'manual_reference_only_no_bulk_extract' },
];

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName, headers, rows = []) {
  const body = [headers.join(','), ...rows.map((row) => headers.map((h) => csvEscape(row[h] ?? '')).join(','))].join('\n');
  writeFileSync(join(outputDir, fileName), `${body}\n`);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRobots(source, index) {
  if (index > 0) await wait(3000);
  try {
    const res = await fetch(source.robots, {
      redirect: 'follow',
      headers: { 'user-agent': 'ALOEducationDataAudit/1.0 (+https://aloeducation.com)' },
    });
    const text = await res.text();
    const disallowAll = /^disallow:\s*\/\s*$/im.test(text);
    const disallowApi = /^disallow:\s*\/api\/?/im.test(text);
    const disallowQuery = /disallow:\s*\/\*\?\*/i.test(text);
    return {
      source_name: source.name,
      source_url: source.url,
      robots_url: source.robots,
      http_status: res.status,
      final_url: res.url,
      allowed_use: source.allowedUse,
      disallow_all: disallowAll ? 'YES' : 'NO',
      disallow_api: disallowApi ? 'YES' : 'NO',
      disallow_query_urls: disallowQuery ? 'YES' : 'NO',
      checked_at: now,
      notes: disallowAll ? 'Automated crawling blocked or restricted for matching agents. Keep manual/reference only.' : 'Respect listed disallow rules and rate limits.',
    };
  } catch (error) {
    return {
      source_name: source.name,
      source_url: source.url,
      robots_url: source.robots,
      http_status: 0,
      final_url: '',
      allowed_use: source.allowedUse,
      disallow_all: 'UNKNOWN',
      disallow_api: 'UNKNOWN',
      disallow_query_urls: 'UNKNOWN',
      checked_at: now,
      notes: `Robots check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }
}

const robotRows = [];
for (let i = 0; i < discoverySources.length; i++) {
  robotRows.push(await checkRobots(discoverySources[i], i));
}

writeCsv('source_verification.csv', [
  'source_name',
  'source_url',
  'robots_url',
  'http_status',
  'final_url',
  'allowed_use',
  'disallow_all',
  'disallow_api',
  'disallow_query_urls',
  'checked_at',
  'notes',
], robotRows);

writeCsv('universities_discovered.csv', [
  'internal_university_id', 'official_name', 'aliases', 'country', 'city', 'official_website',
  'discovery_source_name', 'discovery_url', 'verification_status', 'publication_status', 'last_checked_date',
]);
writeCsv('courses_discovered.csv', [
  'internal_course_id', 'internal_university_id', 'official_course_title', 'qualification', 'campus',
  'delivery_mode', 'attendance_mode', 'discovery_source_name', 'discovery_url', 'verification_status', 'publication_status',
]);
writeCsv('universities_verified.csv', [
  'internal_university_id', 'official_name', 'country', 'city', 'official_website', 'official_international_admissions_url',
  'official_course_search_url', 'official_tuition_fee_url', 'official_scholarship_url', 'source_urls', 'last_checked_date',
  'verification_status', 'publication_status',
]);
writeCsv('courses_verified.csv', [
  'internal_course_id', 'internal_university_id', 'official_course_title', 'slug', 'qualification', 'study_level',
  'subject_area', 'discipline', 'country', 'city', 'campus', 'delivery_mode', 'attendance_mode', 'duration',
  'official_course_url', 'official_application_url', 'source_url', 'last_checked_date', 'verification_status', 'publication_status',
]);
writeCsv('course_intakes_fees_verified.csv', [
  'internal_course_id', 'campus', 'delivery_mode', 'attendance_mode', 'academic_year', 'intake_year', 'intake_month',
  'intake_name', 'application_deadline', 'international_tuition_currency', 'yearly_tuition', 'total_tuition',
  'tuition_period', 'application_fee', 'deposit', 'fee_source_url', 'intake_source_url', 'last_checked_date', 'verification_status',
]);
writeCsv('course_requirements_verified.csv', [
  'internal_course_id', 'academic_requirement', 'accepted_qualifications', 'minimum_grade', 'english_test',
  'overall_score', 'component_scores', 'work_experience', 'portfolio', 'interview', 'prerequisite_subjects',
  'country_specific_requirement', 'official_requirement_url', 'last_checked_date', 'verification_status',
]);
writeCsv('rankings_verified.csv', [
  'internal_university_id', 'ranking_provider', 'ranking_title', 'ranking_year', 'rank', 'rank_band',
  'official_ranking_source_url', 'retrieved_date', 'verification_status',
]);
writeCsv('scholarships_verified.csv', [
  'official_scholarship_name', 'provider', 'internal_university_id', 'internal_course_id', 'eligible_countries',
  'eligible_levels', 'award_currency', 'award_amount', 'award_percentage', 'coverage_type', 'application_method',
  'deadline', 'official_scholarship_url', 'academic_year', 'expiry_status', 'last_checked_date', 'verification_status',
]);
writeCsv('rejected_records.csv', [
  'record_type', 'source_name', 'source_url', 'reason', 'checked_at',
]);
writeCsv('unresolved_records.csv', [
  'record_type', 'source_name', 'source_url', 'unresolved_reason', 'next_review_action', 'checked_at',
], discoverySources.map((source) => ({
  record_type: 'source',
  source_name: source.name,
  source_url: source.url,
  unresolved_reason: 'Discovery source registered only; official university/course pages must be verified before publishing records.',
  next_review_action: 'Use official university pages and admin review queue.',
  checked_at: now,
})));
writeCsv('duplicate_merge_report.csv', [
  'record_type', 'candidate_a', 'candidate_b', 'merge_decision', 'reason', 'reviewed_at',
]);
writeCsv('image_attribution.csv', [
  'internal_university_id', 'image_type', 'source_url', 'copyright_status', 'usage_permission_status', 'downloaded', 'alt_text',
]);
writeCsv('URL_validation_report.csv', [
  'url', 'source_name', 'http_status', 'final_url', 'soft_404', 'checked_at', 'status',
], robotRows.map((row) => ({
  url: row.robots_url,
  source_name: row.source_name,
  http_status: row.http_status,
  final_url: row.final_url,
  soft_404: 'NO',
  checked_at: row.checked_at,
  status: row.http_status >= 200 && row.http_status < 400 ? 'SOURCE_FOUND' : 'URL_UNREACHABLE',
})));

writeFileSync(join(outputDir, 'final_database_audit.json'), JSON.stringify({
  generatedAt: now,
  productionTablesWritten: false,
  discoverySources: discoverySources.length,
  publishedRecordsCreated: 0,
  status: 'DATA STATUS: QUARANTINED / NOT PUBLISHED',
  reason: 'No discovery website data was bulk extracted. Official source verification and admin review are required before publishing.',
}, null, 2));

writeFileSync(join(outputDir, 'final_browser_test_report.md'), [
  '# Final Browser Test Report',
  '',
  `Generated: ${now}`,
  '',
  'Browser tests for newly verified public university/course data were not executed because no official-source-verified records were published in this run.',
  '',
  'DATA STATUS: QUARANTINED / NOT PUBLISHED',
  '',
].join('\n'));

console.log(`Official data audit files written to ${outputDir}`);
