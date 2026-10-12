/**
 * Catalogue CSV import — parsing and same-data classification.
 *
 * The database is injected (see `CatalogueLookup`) so the whole classification
 * is unit-testable without MySQL. Nothing here writes to the live catalogue:
 *   - SKIP / NORMALIZE rows cause no write at all;
 *   - PENDING_CHANGE rows become field-level proposals in the existing
 *     UniversityUpdateRequest review queue (current public values are kept);
 *   - NEW_PENDING_REVIEW rows are returned so an administrator can stage them
 *     as draft, unverified records through /api/crm/course-import/confirm;
 *   - BLOCK_DUPLICATE and invalid rows are reported and never imported.
 */

import { parse } from 'csv-parse/sync';
import {
  classifyImportRow,
  combineRowActions,
  COURSE_IMPORT_FIELDS,
  INTAKE_FEE_IMPORT_FIELDS,
  REQUIREMENT_IMPORT_FIELDS,
  UNIVERSITY_IMPORT_FIELDS,
  type DuplicateCandidate,
  type FieldChange,
  type ImportAction,
  type ImportDiffResult,
} from './import-diff';

export const MAX_IMPORT_ROWS = 500;
export const MAX_CELL_LENGTH = 191;
export const REQUIRED_IMPORT_COLUMNS = ['university_id', 'university_name', 'course_id', 'course_title', 'intake_year', 'intake_month'] as const;

export type CsvRow = Record<string, string>;

export class ImportParseError extends Error {}

/** Lower-snake header normalisation: "University Name" → "university_name". */
export function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Neutralise spreadsheet formula injection in exported/round-tripped cells. */
export function sanitizeCell(v: string): string {
  const t = v.trim();
  return /^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t) ? `'${t}` : t;
}

export function parseCatalogueCsv(text: string): CsvRow[] {
  let records: string[][];
  try {
    records = parse(text, { bom: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as string[][];
  } catch {
    throw new ImportParseError('The file is not valid CSV. Check quoting and delimiters.');
  }
  if (records.length < 2) throw new ImportParseError('The file has no data rows.');
  const headers = records[0].map(normalizeHeader);
  if (new Set(headers).size !== headers.length) throw new ImportParseError('Duplicate column headers found.');
  const missing = REQUIRED_IMPORT_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) throw new ImportParseError(`Missing required columns: ${missing.join(', ')}`);
  const body = records.slice(1);
  if (body.length > MAX_IMPORT_ROWS) throw new ImportParseError(`Too many rows (${body.length}); the maximum per file is ${MAX_IMPORT_ROWS}.`);
  return body.map((cells) => {
    const row: CsvRow = {};
    headers.forEach((h, i) => { if (h) row[h] = sanitizeCell(cells[i] ?? ''); });
    return row;
  });
}

export interface RowIssue { column: string; message: string }

export function validateCatalogueRow(row: CsvRow): RowIssue[] {
  const issues: RowIssue[] = [];
  for (const c of REQUIRED_IMPORT_COLUMNS) if (!row[c]) issues.push({ column: c, message: `${c} is required` });
  if (row.intake_year && !/^\d{4}$/.test(row.intake_year)) issues.push({ column: 'intake_year', message: 'intake_year must be a four-digit year' });
  for (const [k, v] of Object.entries(row)) if (v.length > MAX_CELL_LENGTH) issues.push({ column: k, message: `${k} exceeds ${MAX_CELL_LENGTH} characters` });
  for (const k of ['source_url', 'official_url', 'website']) {
    const v = row[k];
    if (v && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v)) issues.push({ column: k, message: `${k} must be an http(s) URL` });
    else if (v && isSyntheticHost(v)) issues.push({ column: k, message: `${k} points to a reserved example domain; template/sample rows cannot be imported` });
  }
  for (const k of ['university_id', 'course_id']) {
    if (row[k] && SYNTHETIC_ID.test(row[k])) issues.push({ column: k, message: `${k} uses the SAMPLE- prefix reserved for documentation; sample rows cannot be imported` });
  }
  return issues;
}

/** IDs reserved for the documented, clearly synthetic template examples. */
const SYNTHETIC_ID = /^SAMPLE-/i;

/** Reserved documentation domains (RFC 2606 / RFC 6761) used by template examples. */
export function isSyntheticHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
    return /(^|\.)(example\.(com|org|net)|example|invalid|test|localhost)$/.test(host);
  } catch {
    return false;
  }
}

export interface CatalogueLookup {
  universities(ids: string[]): Promise<Array<Record<string, unknown> & { universityId: string }>>;
  courses(ids: string[]): Promise<Array<Record<string, unknown> & { courseId: string }>>;
  intakeFees(courseIds: string[]): Promise<Array<Record<string, unknown> & { courseId: string; intakeYear: number; intakeMonth: string }>>;
  requirements(courseIds: string[]): Promise<Array<Record<string, unknown> & { courseId: string }>>;
  universityPool(): Promise<DuplicateCandidate[]>;
}

export interface ClassifiedRow {
  rowNumber: number;
  universityId: string;
  courseId: string;
  action: ImportAction | 'INVALID';
  issues: RowIssue[];
  entities: Array<{ entity: 'university' | 'course' | 'intake_fee' | 'requirement'; result: ImportDiffResult }>;
  materialChanges: Array<FieldChange & { entity: 'university' | 'course' | 'intake_fee' | 'requirement'; protectedRecord: boolean }>;
  /**
   * Set when the university and course already exist but this intake does not.
   * The intake is proposed through the approval queue (it may sit under a
   * verified course, which the draft-staging path refuses to touch).
   */
  newIntake?: { intakeKey: string; fields: Array<{ field: string; newValue: string }> };
  row: CsvRow;
}

function monthKey(m: string): string {
  const v = m.trim().toLowerCase().slice(0, 3);
  const map: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  if (map[v]) return map[v];
  const n = Number(m);
  return Number.isInteger(n) ? String(n).padStart(2, '0') : m.trim().toLowerCase();
}

export async function classifyCatalogueRows(rows: CsvRow[], lookup: CatalogueLookup): Promise<ClassifiedRow[]> {
  const uniIds = [...new Set(rows.map((r) => r.university_id).filter(Boolean))];
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))];
  const [unis, courses, fees, reqs, pool] = await Promise.all([
    lookup.universities(uniIds), lookup.courses(courseIds), lookup.intakeFees(courseIds), lookup.requirements(courseIds), lookup.universityPool(),
  ]);
  const uniById = new Map(unis.map((u) => [u.universityId, u]));
  const courseById = new Map(courses.map((c) => [c.courseId, c]));
  const feeByKey = new Map(fees.map((f) => [`${f.courseId}|${f.intakeYear}|${monthKey(String(f.intakeMonth))}`, f]));
  const reqByCourse = new Map<string, Record<string, unknown>>();
  for (const r of reqs) if (!reqByCourse.has(r.courseId)) reqByCourse.set(r.courseId, r);

  const seenInFile = new Set<string>();
  const newUniversitiesInFile: DuplicateCandidate[] = [];

  return rows.map((row, i) => {
    const rowNumber = i + 2; // header is line 1
    const base = { rowNumber, universityId: row.university_id ?? '', courseId: row.course_id ?? '', row };
    const issues = validateCatalogueRow(row);
    if (issues.length) return { ...base, action: 'INVALID' as const, issues, entities: [], materialChanges: [] };

    const fileKey = `${row.university_id}|${row.course_id}|${row.intake_year}|${monthKey(row.intake_month)}`;
    if (seenInFile.has(fileKey)) {
      return { ...base, action: 'INVALID' as const, issues: [{ column: 'course_id', message: 'Repeated university/course/intake row within this file' }], entities: [], materialChanges: [] };
    }
    seenInFile.add(fileKey);

    const entities: ClassifiedRow['entities'] = [];
    const existingUni = uniById.get(row.university_id) ?? null;
    const uniResult = classifyImportRow({
      incoming: row,
      existing: existingUni,
      specs: UNIVERSITY_IMPORT_FIELDS,
      duplicateCheck: {
        candidate: { id: row.university_id, name: row.university_name, country: row.country, website: row.website || row.official_url },
        pool: [...pool, ...newUniversitiesInFile],
      },
    });
    entities.push({ entity: 'university', result: uniResult });
    if (!existingUni && uniResult.action === 'NEW_PENDING_REVIEW' && !newUniversitiesInFile.some((u) => u.id === row.university_id)) {
      newUniversitiesInFile.push({ id: row.university_id, name: row.university_name, country: row.country, website: row.website || row.official_url });
    }

    const existingCourse = courseById.get(row.course_id) ?? null;
    if (existingCourse && existingCourse.universityId !== row.university_id) {
      return { ...base, action: 'INVALID' as const, issues: [{ column: 'course_id', message: `course_id already belongs to university ${String(existingCourse.universityId)}` }], entities, materialChanges: [] };
    }
    entities.push({ entity: 'course', result: classifyImportRow({ incoming: row, existing: existingCourse, specs: COURSE_IMPORT_FIELDS }) });

    const fee = feeByKey.get(`${row.course_id}|${row.intake_year}|${monthKey(row.intake_month)}`) ?? null;
    entities.push({ entity: 'intake_fee', result: classifyImportRow({ incoming: row, existing: fee, specs: INTAKE_FEE_IMPORT_FIELDS }) });

    const req = reqByCourse.get(row.course_id) ?? null;
    const hasReqColumns = REQUIREMENT_IMPORT_FIELDS.some((f) => row[f.column]);
    if (hasReqColumns) entities.push({ entity: 'requirement', result: classifyImportRow({ incoming: row, existing: req, specs: REQUIREMENT_IMPORT_FIELDS }) });

    // A new child (course / intake / requirement) under an existing parent is
    // new data for review, not a change to a public value.
    const action = combineRowActions(entities.map((e) => e.result));
    const newIntake = existingUni && existingCourse && !fee && action !== 'BLOCK_DUPLICATE'
      ? {
          intakeKey: `${row.intake_year}-${monthKey(row.intake_month)}`,
          fields: INTAKE_FEE_IMPORT_FIELDS
            .map((f) => ({ field: f.field, newValue: String(row[f.column] ?? '').replace(/\s+/g, ' ').trim() }))
            .filter((f) => f.newValue !== ''),
        }
      : undefined;
    const materialChanges = entities.flatMap((e) =>
      e.result.action === 'PENDING_CHANGE'
        ? e.result.changes.filter((c) => c.kind === 'material').map((c) => ({ ...c, entity: e.entity, protectedRecord: e.result.protectedRecord }))
        : [],
    );
    return { ...base, action, issues: [], entities, materialChanges, ...(newIntake ? { newIntake } : {}) };
  });
}

/**
 * Rows that should go to the draft-staging path (/api/crm/course-import/confirm).
 * A row whose only new entity is an intake under an existing course is handled
 * by `intake_new:` proposals instead, so it is not staged twice.
 */
export function rowsForDraftStaging(rows: ClassifiedRow[]): ClassifiedRow[] {
  return rows.filter((r) => {
    if (r.action !== 'NEW_PENDING_REVIEW') return false;
    if (!r.newIntake) return true;
    return r.entities.some((e) => e.entity !== 'intake_fee' && e.result.action === 'NEW_PENDING_REVIEW');
  });
}

export function summarize(rows: ClassifiedRow[]) {
  const counts: Record<ImportAction | 'INVALID', number> = { SKIP: 0, NORMALIZE: 0, PENDING_CHANGE: 0, NEW_PENDING_REVIEW: 0, BLOCK_DUPLICATE: 0, INVALID: 0 };
  for (const r of rows) counts[r.action]++;
  return counts;
}

/** Field-level proposals for the existing UniversityUpdateRequest review queue. */
export function toUpdateRequests(rows: ClassifiedRow[]) {
  const out: Array<{ universityId: string; courseId: string; entityType: string; entityName: string; country: string; fieldName: string; oldValue: string; newValue: string; evidenceUrl: string; aiConfidence: number; status: string }> = [];
  for (const r of rows) {
    if (r.action !== 'PENDING_CHANGE') continue;
    for (const c of r.materialChanges) {
      out.push({
        universityId: r.universityId,
        courseId: c.entity === 'university' ? '' : r.courseId,
        entityType: c.entity === 'university' ? 'university' : 'course',
        entityName: (c.entity === 'university' ? r.row.university_name : r.row.course_title).slice(0, 191),
        country: (r.row.country ?? '').slice(0, 191),
        fieldName: (c.entity === 'intake_fee' ? `intake:${r.row.intake_year}-${monthKey(r.row.intake_month)}:${c.field}` : c.entity === 'requirement' ? `requirement:${c.field}` : c.field).slice(0, 191),
        oldValue: c.oldValue.slice(0, 191),
        newValue: c.newValue.slice(0, 191),
        evidenceUrl: (r.row.source_url || r.row.official_url || '').slice(0, 191),
        // Human CSV import, not an AI detection.
        aiConfidence: 0,
        status: 'pending_approval',
      });
    }
  }
  for (const r of rows) {
    if (!r.newIntake || r.action === 'INVALID' || r.action === 'BLOCK_DUPLICATE') continue;
    for (const f of r.newIntake.fields) {
      out.push({
        universityId: r.universityId,
        courseId: r.courseId,
        entityType: 'course',
        entityName: (r.row.course_title ?? '').slice(0, 191),
        country: (r.row.country ?? '').slice(0, 191),
        fieldName: `intake_new:${r.newIntake.intakeKey}:${f.field}`.slice(0, 191),
        oldValue: '',
        // Values longer than the queue column are cut here and refused at apply time.
        newValue: f.newValue.slice(0, 191),
        evidenceUrl: (r.row.source_url || r.row.official_url || '').slice(0, 191),
        aiConfidence: 0,
        status: 'pending_approval',
      });
    }
  }
  return out;
}
