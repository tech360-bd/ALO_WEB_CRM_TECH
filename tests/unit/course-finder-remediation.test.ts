import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyCatalogueRows,
  isSyntheticHost,
  parseCatalogueCsv,
  rowsForDraftStaging,
  toUpdateRequests,
  validateCatalogueRow,
  normalizeHeader,
  REQUIRED_IMPORT_COLUMNS,
  type CatalogueLookup,
} from '@/lib/course-finder/catalogue-import-service';
import { COURSE_IMPORT_FIELDS, INTAKE_FEE_IMPORT_FIELDS, REQUIREMENT_IMPORT_FIELDS, UNIVERSITY_IMPORT_FIELDS } from '@/lib/course-finder/import-diff';
import { syntheticAgentDataAllowed } from '@/lib/ai-agents/synthetic-data-guard';

const FABRICATED = ['supervisors.csv', 'universities.csv', 'courses.csv', 'course_intakes.csv', 'course_requirements.csv', 'tuition_fees.csv', 'english_requirements.csv', 'campuses.csv', '02_courses.csv', '01_universities.csv', '01_ALO_UNIVERSITY_MASTER.csv'];
const GUARDED_MODULES = new Set([
  'src/lib/ai-agents/supervisor-matcher.ts',
  'src/lib/ai-agents/international-course-agent.ts',
  'src/lib/ai-agents/campus-course-mapper.ts',
  'src/lib/ai-agents/synthetic-data-guard.ts', // documentation comment only
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

describe('fabricated data containment', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('no runtime source file references the fabricated CSV sets except the guarded legacy loaders', () => {
    const offenders: string[] = [];
    for (const file of walk('src')) {
      if (GUARDED_MODULES.has(file)) continue;
      const text = readFileSync(file, 'utf8');
      for (const csv of FABRICATED) if (new RegExp(`['"\`/]${csv.replace('.', '\\.')}['"\`]`).test(text)) offenders.push(`${file} → ${csv}`);
    }
    expect(offenders).toEqual([]);
  });

  it('every guarded loader checks the guard before touching a CSV path', () => {
    for (const file of [...GUARDED_MODULES].filter((f) => !f.endsWith('synthetic-data-guard.ts'))) {
      const text = readFileSync(file, 'utf8');
      // CSV reads go only through syntheticFixturePath (non-production archive), after the guard.
      expect(text, file).not.toContain('process.cwd()');
      const csvReads = text.split('\n').filter((l) => /syntheticFixturePath\('[a-z_]+\.csv'\)/.test(l));
      expect(csvReads.length, file).toBeGreaterThan(0);
      for (const line of csvReads) expect(line.indexOf('syntheticAgentDataAllowed()'), `${file}: ${line.slice(0, 80)}`).toBeGreaterThan(-1);
      for (const line of csvReads) expect(line.indexOf('syntheticAgentDataAllowed()')).toBeLessThan(line.indexOf('syntheticFixturePath('));
    }
  });

  it('the guard is closed by default and always closed in production', () => {
    expect(syntheticAgentDataAllowed({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(false);
    expect(syntheticAgentDataAllowed({ NODE_ENV: 'production', ALO_ALLOW_SYNTHETIC_AGENT_DATA: '1' } as NodeJS.ProcessEnv)).toBe(false);
    expect(syntheticAgentDataAllowed({ NODE_ENV: 'development', ALO_ALLOW_SYNTHETIC_AGENT_DATA: '1' } as NodeJS.ProcessEnv)).toBe(true);
  });

  it('legacy loaders return no invented supervisors or catalogue rows even though the CSV files exist', async () => {
    vi.stubEnv('ALO_ALLOW_SYNTHETIC_AGENT_DATA', '');
    const { findSupervisorsForProfile, getSupervisorsForCourse } = await import('@/lib/ai-agents/supervisor-matcher');
    const { loadCampuses, loadCoursesWithCampus } = await import('@/lib/ai-agents/campus-course-mapper');
    expect(statSync('supervisors.csv').size).toBeGreaterThan(0); // the file is still in the repo
    expect(await findSupervisorsForProfile({ researchInterest: 'machine learning', desiredLevel: 'PhD' })).toEqual([]);
    expect(await getSupervisorsForCourse('anything', 'machine learning')).toEqual([]);
    expect(loadCampuses()).toEqual([]);
    expect(loadCoursesWithCampus()).toEqual([]);
  });

  it('course advisor fails closed for every method and imports no CSV-reading module', async () => {
    const source = readFileSync('src/app/api/agent/course-advisor/route.ts', 'utf8');
    expect(source).not.toMatch(/^import .*ai-agents/m);
    const route = await import('@/app/api/agent/course-advisor/route');
    for (const handler of [route.GET, route.POST, route.PUT, route.PATCH, route.DELETE]) {
      const res = await handler();
      expect(res.status).toBe(503);
      const text = await res.text();
      expect(JSON.parse(text)).toMatchObject({ success: false, disabled: true, code: 'COURSE_ADVISOR_DISABLED_UNVERIFIED_DATA' });
      expect(text).not.toMatch(/@|Supervisor|560|11200/);
    }
  });

  it('the destructive template seed refuses to run without an explicit non-production opt-in', () => {
    const source = readFileSync('prisma/seed-university-data.ts', 'utf8');
    const guardAt = source.indexOf('if (!destructiveTemplateSeedAllowed())');
    expect(guardAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(source.indexOf('deleteMany'));
    expect(source).toMatch(/ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED === "1" && env\.NODE_ENV !== "production"/);
  });
});

// ---------------------------------------------------------------------------
const HEADER = 'University ID,University Name,Country,Website,Source URL,Course ID,Course Title,Study Level,Intake Year,Intake Month,Tuition Currency,Yearly Tuition';
function lookup(): CatalogueLookup {
  return {
    universities: async () => [{ universityId: 'UNI-1', name: 'University One', country: 'United Kingdom', website: 'https://www.uni-one.ac.uk', sourceUrl: 'https://www.uni-one.ac.uk/intl', verificationStatus: 'VERIFIED', publicationStatus: 'published' }],
    courses: async () => [{ courseId: 'CRS-1', universityId: 'UNI-1', courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate', sourceUrl: 'https://www.uni-one.ac.uk/intl', verificationStatus: 'VERIFIED', publicationStatus: 'published' }],
    intakeFees: async () => [{ courseId: 'CRS-1', intakeYear: 2027, intakeMonth: 'September', tuitionCurrency: 'GBP', yearlyTuition: 20000, verificationStatus: 'VERIFIED' }],
    requirements: async () => [],
    universityPool: async () => [{ id: 'UNI-1', name: 'University One', country: 'United Kingdom', website: 'https://www.uni-one.ac.uk' }],
  };
}

describe('new intake on an existing verified course', () => {
  it('is proposed through the approval queue (intake_new) and not sent to draft staging', async () => {
    const rows = parseCatalogueCsv(`${HEADER}\nUNI-1,University One,United Kingdom,https://www.uni-one.ac.uk,https://www.uni-one.ac.uk/intl,CRS-1,MSc Data Science,Postgraduate,2028,January,GBP,"21,500"`);
    const classified = await classifyCatalogueRows(rows, lookup());
    expect(classified[0].newIntake).toMatchObject({ intakeKey: '2028-01' });
    const proposals = toUpdateRequests(classified);
    expect(proposals.map((p) => p.fieldName).sort()).toEqual(['intake_new:2028-01:intakeMonth', 'intake_new:2028-01:tuitionCurrency', 'intake_new:2028-01:yearlyTuition']);
    for (const p of proposals) expect(p).toMatchObject({ oldValue: '', status: 'pending_approval', aiConfidence: 0, evidenceUrl: 'https://www.uni-one.ac.uk/intl', courseId: 'CRS-1', universityId: 'UNI-1' });
    expect(rowsForDraftStaging(classified)).toHaveLength(0);
  });

  it('an existing intake produces no new-intake proposal; a new course still goes to draft staging', async () => {
    const rows = parseCatalogueCsv([
      HEADER,
      'UNI-1,University One,United Kingdom,https://www.uni-one.ac.uk,https://www.uni-one.ac.uk/intl,CRS-1,MSc Data Science,Postgraduate,2027,September,GBP,20000',
      'UNI-1,University One,United Kingdom,https://www.uni-one.ac.uk,https://www.uni-one.ac.uk/intl,CRS-NEW,MSc Robotics,Postgraduate,2027,September,GBP,24000',
    ].join('\n'));
    const classified = await classifyCatalogueRows(rows, lookup());
    expect(classified[0].newIntake).toBeUndefined();
    expect(classified[1].newIntake).toBeUndefined();
    expect(toUpdateRequests(classified)).toEqual([]);
    expect(rowsForDraftStaging(classified).map((r) => r.courseId)).toEqual(['CRS-NEW']);
  });
});

describe('synthetic template rows cannot be imported', () => {
  it('rejects SAMPLE- identifiers and reserved example domains', () => {
    const base = { university_id: 'UNI-9', university_name: 'X', country: 'United Kingdom', course_id: 'C-9', course_title: 'Y', intake_year: '2027', intake_month: 'September' } as Record<string, string>;
    expect(validateCatalogueRow({ ...base, university_id: 'SAMPLE-UNI-001' }).map((i) => i.column)).toContain('university_id');
    expect(validateCatalogueRow({ ...base, course_id: 'sample-c-1' }).map((i) => i.column)).toContain('course_id');
    for (const url of ['https://sample-university.invalid/x', 'https://example.com/a', 'https://uni.example/x', 'https://a.test/']) {
      expect(isSyntheticHost(url), url).toBe(true);
      expect(validateCatalogueRow({ ...base, source_url: url }).map((i) => i.column)).toContain('source_url');
    }
    for (const url of ['https://www.example.ac.uk/intl', 'https://www.ox.ac.uk', 'https://examples.edu']) expect(isSyntheticHost(url), url).toBe(false);
  });

  it('the documented example CSV is rejected row by row by the real validator', () => {
    const rows = parseCatalogueCsv(readFileSync('docs/catalogue-import/catalogue-import-EXAMPLE-SYNTHETIC.csv', 'utf8'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(validateCatalogueRow(row).length).toBeGreaterThan(0);
  });

  it('the header-only template parses with the required columns and has no data rows', () => {
    const text = readFileSync('docs/catalogue-import/catalogue-import-TEMPLATE.csv', 'utf8').trim();
    expect(text.split('\n')).toHaveLength(1);
    const headers = text.split(',').map(normalizeHeader);
    for (const c of REQUIRED_IMPORT_COLUMNS) expect(headers).toContain(c);
    // Every column is understood by the import (identity columns + diff specs); rankings are deliberately absent.
    const known = new Set(['university_id', 'course_id', 'intake_year', ...[UNIVERSITY_IMPORT_FIELDS, COURSE_IMPORT_FIELDS, INTAKE_FEE_IMPORT_FIELDS, REQUIREMENT_IMPORT_FIELDS].flat().map((f) => f.column)]);
    expect(headers.filter((h) => !known.has(h))).toEqual([]);
    expect(headers).not.toContain('ranking');
    expect(() => parseCatalogueCsv(text)).toThrow(/no data rows/);
  });
});
