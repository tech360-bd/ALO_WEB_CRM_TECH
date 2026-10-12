#!/usr/bin/env node
// Read-only quality audit of the university/course CSV files committed in the
// repository. It does not touch any database and does not fetch any URL.
// Usage: node scripts/audit-catalogue-csv-quality.mjs [outputJsonPath]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2];

function load(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  return { rows: parse(buf, { columns: true, bom: true, skip_empty_lines: true, relax_column_count: true }), sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}
const count = (arr, f) => arr.reduce((m, r) => { const k = f(r); m[k] = (m[k] || 0) + 1; return m; }, {});
const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

const report = { generatedAt: new Date().toISOString(), note: 'Static analysis of repository CSV files only. No URL was fetched; "plausible" patterns are heuristics, not verification.', files: {} };

// --- Root seed set used by prisma/seed-complete.ts --------------------------
const unis = load('universities.csv');
const courses = load('courses.csv');
const intakes = load('course_intakes.csv');
const reqs = load('course_requirements.csv');
const eng = load('english_requirements.csv');
if (unis && courses) {
  const perUni = count(courses.rows, (r) => r.university_id);
  const perUniCounts = count(Object.values(perUni).map(String), (x) => x);
  const titlesByUni = {};
  for (const c of courses.rows) (titlesByUni[c.university_id] ??= []).push(c.course_title);
  const signature = count(Object.values(titlesByUni), (t) => t.map((x) => x.replace(/^[A-Za-z ]+ in /, '')).sort().join('|'));
  report.files['seed-complete set (universities.csv …)'] = {
    usedBy: 'prisma/seed-complete.ts (now gated behind ALO_SEED_UNIVERSITY_CATALOGUE=1)',
    universities: { rows: unis.rows.length, sha256: unis.sha256, byCountry: count(unis.rows, (r) => r.country), verificationStatus: count(unis.rows, (r) => r.verification_status) },
    courses: {
      rows: courses.rows.length, sha256: courses.sha256,
      coursesPerUniversityDistribution: perUniCounts,
      verificationStatus: count(courses.rows, (r) => r.verification_status),
      mostRepeatedTitles: top(count(courses.rows, (r) => r.course_title), 8),
      universitiesSharingTheMostCommonSubjectSet: top(signature, 1)[0]?.[1] ?? 0,
      hasCourseUrlColumn: Object.keys(courses.rows[0] || {}).some((k) => /url/i.test(k)),
      exampleRowsForFirstUniversity: courses.rows.filter((r) => r.university_id === unis.rows[0].university_id).slice(0, 5).map((r) => `${r.course_title} (${r.study_level})`),
    },
    intakes: intakes && {
      rows: intakes.rows.length, perCourse: intakes.rows.length / courses.rows.length,
      verificationStatus: count(intakes.rows, (r) => r.verification_status),
      lastVerifiedAt: top(count(intakes.rows, (r) => r.last_verified_at), 3),
    },
    requirements: reqs && {
      rows: reqs.rows.length,
      distinctAcademicRequirementTexts: Object.keys(count(reqs.rows, (r) => r.academic_requirement)).length,
      distinctMinScores: Object.keys(count(reqs.rows, (r) => r.min_score)).length,
    },
    englishRequirements: eng && { rows: eng.rows.length, distinctOverallScores: top(count(eng.rows, (r) => `${r.test_name} ${r.overall_score}`), 6) },
  };
}

// --- Canonical 01/02 set ----------------------------------------------------
const u1 = load('01_universities.csv');
const c2 = load('02_courses.csv');
if (u1 && c2) {
  const synthetic = c2.rows.filter((r) => {
    try {
      const u = new URL(r.official_course_url);
      const slug = r.official_course_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return u.pathname.replace(/\/$/, '') === `/courses/${slug}`;
    } catch { return false; }
  });
  report.files['01_universities.csv / 02_courses.csv'] = {
    universities: { rows: u1.rows.length, sha256: u1.sha256, verificationStatus: count(u1.rows, (r) => r.verification_status), sourceUrlEqualsHomepage: u1.rows.filter((r) => r.source_url === r.official_website).length, byCountry: count(u1.rows, (r) => r.country_name) },
    courses: {
      rows: c2.rows.length, sha256: c2.sha256, verificationStatus: count(c2.rows, (r) => r.verification_status),
      urlsFollowingGeneratedPattern_slashCoursesSlashTitleSlug: synthetic.length,
      mostRepeatedTitles: top(count(c2.rows, (r) => r.official_course_title), 8),
      examples: c2.rows.slice(0, 3).map((r) => `${r.official_course_title} → ${r.official_course_url}`),
    },
  };
}

// --- data/01_ALO_* master set ----------------------------------------------
const m1 = load('data/01_ALO_UNIVERSITY_MASTER.csv');
if (m1) {
  report.files['data/01_ALO_UNIVERSITY_MASTER.csv'] = { rows: m1.rows.length, sha256: m1.sha256, byCountry: count(m1.rows, (r) => r.country), verificationStatus: count(m1.rows, (r) => r.verification_status), lastVerifiedAt: top(count(m1.rows, (r) => r.last_verified_at), 3) };
}

const json = JSON.stringify(report, null, 2);
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, json + '\n'); console.log(`written ${out}`); }
else console.log(json);
