/**
 * Same-data rule for university / course catalogue imports (pure, DB-free).
 *
 *   identical values                         → SKIP
 *   only harmless formatting differs          → NORMALIZE (no public change)
 *   a material value differs on an existing row → PENDING_CHANGE
 *        (the current public value is kept; a Super Admin must approve)
 *   no existing row and no probable duplicate → NEW_PENDING_REVIEW (never auto-published)
 *   no existing row but a probable duplicate  → BLOCK_DUPLICATE
 *
 * Imports never verify or publish anything by themselves.
 */

export type ImportAction = 'SKIP' | 'NORMALIZE' | 'PENDING_CHANGE' | 'NEW_PENDING_REVIEW' | 'BLOCK_DUPLICATE';

export type FieldType = 'text' | 'name' | 'url' | 'number' | 'boolean' | 'code' | 'month';

export interface FieldSpec {
  /** Column name in the CSV row. */
  column: string;
  /** Property name on the stored record. */
  field: string;
  type: FieldType;
}

export interface FieldChange {
  column: string;
  field: string;
  oldValue: string;
  newValue: string;
  kind: 'format' | 'material';
}

export interface DuplicateCandidate {
  id: string;
  name: string;
  country?: string | null;
  website?: string | null;
}

export interface ImportDiffResult {
  action: ImportAction;
  changes: FieldChange[];
  /** True when the existing row is verified or published (public value must be preserved). */
  protectedRecord: boolean;
  requiresSuperAdmin: boolean;
  duplicateOf?: string;
  reason: string;
}

const MONTHS: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03', apr: '04', april: '04',
  may: '05', jun: '06', june: '06', jul: '07', july: '07', aug: '08', august: '08',
  sep: '09', sept: '09', september: '09', oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
};

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Canonical form used to decide whether two values are the same fact. */
export function canonicalValue(raw: unknown, type: FieldType): string {
  if (raw === null || raw === undefined) return '';
  const s = collapse(String(raw));
  if (!s) return '';
  switch (type) {
    case 'number': {
      const n = Number(s.replace(/[,\s£$€]/g, ''));
      // Treat the stored default 0 as "no value".
      return Number.isFinite(n) ? (n === 0 ? '' : String(n)) : s.toLowerCase();
    }
    case 'boolean': {
      const v = s.toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(v)) return 'true';
      if (['false', 'no', 'n', '0'].includes(v)) return 'false';
      return v;
    }
    case 'url': {
      try {
        const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        const path = u.pathname.replace(/\/+$/, '');
        return `${host}${path}${u.search}`;
      } catch {
        return s.toLowerCase();
      }
    }
    case 'month': {
      const v = s.toLowerCase();
      if (MONTHS[v]) return MONTHS[v];
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 12 ? String(n).padStart(2, '0') : v;
    }
    case 'code':
    case 'name':
    case 'text':
    default:
      return s.toLowerCase();
  }
}

function display(raw: unknown): string {
  return raw === null || raw === undefined ? '' : String(raw);
}

/** Compares one incoming CSV row with an existing record over the given fields. */
export function diffFields(incoming: Record<string, unknown>, existing: Record<string, unknown>, specs: FieldSpec[]): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const spec of specs) {
    if (!(spec.column in incoming)) continue;
    const newRaw = incoming[spec.column];
    // A blank incoming cell never clears an existing value.
    if (collapse(display(newRaw)) === '') continue;
    const oldRaw = existing[spec.field];
    if (display(oldRaw) === display(newRaw)) continue;
    const kind = canonicalValue(oldRaw, spec.type) === canonicalValue(newRaw, spec.type) ? 'format' : 'material';
    changes.push({ column: spec.column, field: spec.field, oldValue: display(oldRaw), newValue: display(newRaw), kind });
  }
  return changes;
}

/** Normalised institution name for duplicate detection. */
export function normalizeInstitutionName(name: string): string {
  return collapse(
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\bthe\b/g, ' '),
  );
}

function hostOf(url: string | null | undefined): string {
  if (!url) return '';
  return canonicalValue(url, 'url').split('/')[0];
}

export function findProbableDuplicate(
  candidate: { id: string; name: string; country?: string | null; website?: string | null },
  existing: DuplicateCandidate[],
): DuplicateCandidate | null {
  const name = normalizeInstitutionName(candidate.name);
  const country = (candidate.country ?? '').trim().toLowerCase();
  const host = hostOf(candidate.website);
  for (const e of existing) {
    if (e.id === candidate.id) continue;
    if (host && hostOf(e.website) === host) return e;
    const sameCountry = !country || !e.country || e.country.trim().toLowerCase() === country;
    if (name && sameCountry && normalizeInstitutionName(e.name) === name) return e;
  }
  return null;
}

export function isProtectedRecord(existing: Record<string, unknown> | null | undefined): boolean {
  if (!existing) return false;
  const v = String(existing.verificationStatus ?? '').toUpperCase();
  const p = String(existing.publicationStatus ?? '').toUpperCase();
  return v.startsWith('VERIFIED') || p === 'PUBLISHED';
}

export function classifyImportRow(args: {
  incoming: Record<string, unknown>;
  existing: Record<string, unknown> | null;
  specs: FieldSpec[];
  duplicateCheck?: { candidate: { id: string; name: string; country?: string | null; website?: string | null }; pool: DuplicateCandidate[] };
}): ImportDiffResult {
  const { incoming, existing, specs, duplicateCheck } = args;
  if (!existing) {
    const dup = duplicateCheck ? findProbableDuplicate(duplicateCheck.candidate, duplicateCheck.pool) : null;
    if (dup) {
      return { action: 'BLOCK_DUPLICATE', changes: [], protectedRecord: false, requiresSuperAdmin: false, duplicateOf: dup.id, reason: `Probable duplicate of existing record ${dup.id} (${dup.name}); merge or map it instead of creating a new record.` };
    }
    return { action: 'NEW_PENDING_REVIEW', changes: [], protectedRecord: false, requiresSuperAdmin: false, reason: 'New record — staged for review; it will not be published until verified.' };
  }
  const changes = diffFields(incoming, existing, specs);
  const protectedRecord = isProtectedRecord(existing);
  if (changes.length === 0) {
    return { action: 'SKIP', changes, protectedRecord, requiresSuperAdmin: false, reason: 'Identical to the stored record.' };
  }
  if (changes.every((c) => c.kind === 'format')) {
    return { action: 'NORMALIZE', changes, protectedRecord, requiresSuperAdmin: false, reason: 'Only formatting differs; stored values are unchanged.' };
  }
  const material = changes.filter((c) => c.kind === 'material').map((c) => c.column);
  return {
    action: 'PENDING_CHANGE',
    changes,
    protectedRecord,
    requiresSuperAdmin: protectedRecord,
    reason: protectedRecord
      ? `Material change to a verified/published record (${material.join(', ')}). The current public value is kept until a Super Admin approves.`
      : `Material change (${material.join(', ')}) — staged for review.`,
  };
}

// ---------------------------------------------------------------------------
// Field maps for the existing combined course import template
// ---------------------------------------------------------------------------

export const UNIVERSITY_IMPORT_FIELDS: FieldSpec[] = [
  { column: 'university_name', field: 'name', type: 'name' },
  { column: 'country', field: 'country', type: 'name' },
  { column: 'city', field: 'city', type: 'name' },
  { column: 'campus_name', field: 'campusName', type: 'name' },
  { column: 'ranking', field: 'ranking', type: 'number' },
  { column: 'world_ranking', field: 'worldRanking', type: 'number' },
  { column: 'university_type', field: 'type', type: 'text' },
  { column: 'founded', field: 'founded', type: 'number' },
  { column: 'website', field: 'website', type: 'url' },
  { column: 'official_url', field: 'officialUrl', type: 'url' },
  { column: 'source_url', field: 'sourceUrl', type: 'url' },
];

export const COURSE_IMPORT_FIELDS: FieldSpec[] = [
  { column: 'course_title', field: 'courseTitle', type: 'name' },
  { column: 'study_level', field: 'studyLevel', type: 'text' },
  { column: 'program_level', field: 'programLevel', type: 'text' },
  { column: 'subject_area', field: 'subjectArea', type: 'text' },
  { column: 'discipline_area', field: 'disciplineArea', type: 'text' },
  { column: 'duration_months', field: 'durationMonths', type: 'number' },
  { column: 'official_url', field: 'officialUrl', type: 'url' },
  { column: 'source_url', field: 'sourceUrl', type: 'url' },
];

export const INTAKE_FEE_IMPORT_FIELDS: FieldSpec[] = [
  { column: 'intake_month', field: 'intakeMonth', type: 'month' },
  { column: 'application_deadline', field: 'applicationDeadline', type: 'text' },
  { column: 'tuition_currency', field: 'tuitionCurrency', type: 'code' },
  { column: 'yearly_tuition', field: 'yearlyTuition', type: 'number' },
  { column: 'total_tuition', field: 'totalTuition', type: 'number' },
  { column: 'deposit_currency', field: 'depositCurrency', type: 'code' },
  { column: 'deposit_amount', field: 'depositAmount', type: 'number' },
  { column: 'app_fee_currency', field: 'appFeeCurrency', type: 'code' },
  { column: 'app_fee_amount', field: 'appFeeAmount', type: 'number' },
];

export const REQUIREMENT_IMPORT_FIELDS: FieldSpec[] = [
  { column: 'academic_req', field: 'academicReq', type: 'text' },
  { column: 'grading_system', field: 'gradingSystem', type: 'text' },
  { column: 'min_score', field: 'minScore', type: 'text' },
  { column: 'ielts_overall', field: 'ieltsOverall', type: 'number' },
  { column: 'ielts_min_band', field: 'ieltsMinBand', type: 'number' },
  { column: 'pte_overall', field: 'pteOverall', type: 'number' },
  { column: 'pte_min_band', field: 'pteMinBand', type: 'number' },
  { column: 'toefl_overall', field: 'toeflOverall', type: 'number' },
  { column: 'det_overall', field: 'detOverall', type: 'number' },
  { column: 'moi_accepted', field: 'moiAccepted', type: 'boolean' },
  { column: 'portfolio_required', field: 'portfolioRequired', type: 'boolean' },
  { column: 'interview_required', field: 'interviewRequired', type: 'boolean' },
];

const ACTION_RANK: Record<ImportAction, number> = { SKIP: 0, NORMALIZE: 1, NEW_PENDING_REVIEW: 2, PENDING_CHANGE: 3, BLOCK_DUPLICATE: 4 };

/** Combines per-entity results into one row-level action (the most significant wins). */
export function combineRowActions(results: ImportDiffResult[]): ImportAction {
  return results.reduce<ImportAction>((acc, r) => (ACTION_RANK[r.action] > ACTION_RANK[acc] ? r.action : acc), 'SKIP');
}
