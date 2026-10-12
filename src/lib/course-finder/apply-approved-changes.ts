/**
 * Approval-to-apply for catalogue proposals (UniversityUpdateRequest).
 *
 * Contract (Course Finder remediation plan, step D):
 *  - Approval (catalog-update-review.ts) and apply are separate actions; this
 *    module performs apply only and is called by a Super-Admin-only route.
 *  - The proposal payload must hash to the value recorded by the latest
 *    approve audit entry. Any difference requires a fresh approval.
 *  - Identity, field allowlist, value type, provenance, duplicates and the
 *    current live value (stale check) are revalidated at apply time.
 *  - A batch is applied in one transaction: either every proposal is written
 *    or none is. Re-sending an applied batch is a no-op.
 *  - Every write is audited with actor, target, previous value, approved
 *    value, provenance and result.
 *  - Apply never sets a record verified and never writes publicationStatus /
 *    visibility / lastVerifiedAt. Owner decision (2026-10-12): when an applied
 *    change materially alters a record that is currently verified, that record
 *    moves to NEEDS_REVIEW in the same transaction (so it leaves the public
 *    catalogue until re-verified), and the prior and new state are audited.
 *
 * No schema change: statuses are strings in the existing `status` column and
 * the approval hash lives in PortalAuditLog.metadata.
 */
import { canonicalValue, type FieldType } from './import-diff';
import { isSyntheticHost } from './catalogue-import-service';
import { approvalHashFromAudit, isValidFingerprint, proposalPayloadHash, type ProposalPayload } from './catalog-change-payload';
import { PROPOSAL_STATUS } from './catalog-change-status';

export const MAX_APPLY_BATCH = 50;
/** UniversityUpdateRequest string columns are VARCHAR(191). */
const QUEUE_COLUMN_MAX = 191;

export type TargetModel = 'CrmUniversity' | 'CrmCourse' | 'CrmCourseIntakeFee' | 'CrmCourseRequirement';
type PrismaScalar = 'String' | 'Int' | 'Float' | 'Boolean';

export interface ApplyFieldSpec {
  field: string;
  /** Comparison/normalisation type shared with the import diff. */
  type: FieldType;
  /** Prisma scalar type in prisma/schema.prisma (checked by a unit test). */
  prisma: PrismaScalar;
  min?: number;
  max?: number;
}

const money = { min: 0, max: 100_000_000 };

/**
 * Fields that may be changed by an approved proposal. Derived from the import
 * diff specs, minus fields that need their own evidence workflow:
 *  - ranking / worldRanking: a ranking must never be shown without provider and
 *    edition, which a single-field proposal cannot carry.
 *  - intakeMonth on an existing intake: changes the intake identity.
 * Verification, publication and visibility fields are deliberately absent.
 */
export const APPLY_FIELD_ALLOWLIST: Record<TargetModel, Record<string, ApplyFieldSpec>> = {
  CrmUniversity: {
    name: { field: 'name', type: 'name', prisma: 'String' },
    country: { field: 'country', type: 'name', prisma: 'String' },
    city: { field: 'city', type: 'name', prisma: 'String' },
    campusName: { field: 'campusName', type: 'name', prisma: 'String' },
    type: { field: 'type', type: 'text', prisma: 'String' },
    founded: { field: 'founded', type: 'number', prisma: 'Int', min: 800, max: 2100 },
    website: { field: 'website', type: 'url', prisma: 'String' },
    officialUrl: { field: 'officialUrl', type: 'url', prisma: 'String' },
    sourceUrl: { field: 'sourceUrl', type: 'url', prisma: 'String' },
  },
  CrmCourse: {
    courseTitle: { field: 'courseTitle', type: 'name', prisma: 'String' },
    studyLevel: { field: 'studyLevel', type: 'text', prisma: 'String' },
    programLevel: { field: 'programLevel', type: 'text', prisma: 'String' },
    subjectArea: { field: 'subjectArea', type: 'text', prisma: 'String' },
    disciplineArea: { field: 'disciplineArea', type: 'text', prisma: 'String' },
    durationMonths: { field: 'durationMonths', type: 'number', prisma: 'Int', min: 1, max: 120 },
    officialUrl: { field: 'officialUrl', type: 'url', prisma: 'String' },
    sourceUrl: { field: 'sourceUrl', type: 'url', prisma: 'String' },
  },
  CrmCourseIntakeFee: {
    applicationDeadline: { field: 'applicationDeadline', type: 'text', prisma: 'String' },
    tuitionCurrency: { field: 'tuitionCurrency', type: 'code', prisma: 'String' },
    yearlyTuition: { field: 'yearlyTuition', type: 'number', prisma: 'Float', ...money },
    totalTuition: { field: 'totalTuition', type: 'number', prisma: 'Float', ...money },
    depositCurrency: { field: 'depositCurrency', type: 'code', prisma: 'String' },
    depositAmount: { field: 'depositAmount', type: 'number', prisma: 'Float', ...money },
    appFeeCurrency: { field: 'appFeeCurrency', type: 'code', prisma: 'String' },
    appFeeAmount: { field: 'appFeeAmount', type: 'number', prisma: 'Float', ...money },
  },
  CrmCourseRequirement: {
    academicReq: { field: 'academicReq', type: 'text', prisma: 'String' },
    gradingSystem: { field: 'gradingSystem', type: 'text', prisma: 'String' },
    minScore: { field: 'minScore', type: 'text', prisma: 'String' },
    ieltsOverall: { field: 'ieltsOverall', type: 'number', prisma: 'Float', min: 0, max: 9 },
    ieltsMinBand: { field: 'ieltsMinBand', type: 'number', prisma: 'Float', min: 0, max: 9 },
    pteOverall: { field: 'pteOverall', type: 'number', prisma: 'Float', min: 10, max: 90 },
    pteMinBand: { field: 'pteMinBand', type: 'number', prisma: 'Float', min: 10, max: 90 },
    toeflOverall: { field: 'toeflOverall', type: 'number', prisma: 'Float', min: 0, max: 120 },
    detOverall: { field: 'detOverall', type: 'number', prisma: 'Float', min: 10, max: 160 },
    moiAccepted: { field: 'moiAccepted', type: 'boolean', prisma: 'Boolean' },
    portfolioRequired: { field: 'portfolioRequired', type: 'boolean', prisma: 'Boolean' },
    interviewRequired: { field: 'interviewRequired', type: 'boolean', prisma: 'Boolean' },
  },
};

/** Never writable through apply, whatever the field name parser says. */
export const APPLY_FORBIDDEN_FIELDS = new Set([
  'id', 'universityId', 'courseId', 'verificationStatus', 'publicationStatus', 'visibility', 'lastVerifiedAt',
  'status', 'createdAt', 'updatedAt', 'createdBy', 'batchId', 'slug',
]);

export type FailureCode =
  | 'NOT_APPROVED'
  | 'APPROVAL_HASH_MISSING'
  | 'PAYLOAD_MISMATCH'
  | 'UNSUPPORTED_FIELD'
  | 'INVALID_VALUE'
  | 'VALUE_POSSIBLY_TRUNCATED'
  | 'EVIDENCE_INVALID'
  | 'TARGET_MISSING'
  | 'IDENTITY_MISMATCH'
  | 'DUPLICATE_TARGET'
  | 'DUPLICATE_IN_BATCH'
  | 'STALE'
  | 'TRANSACTION_FAILED';

export type ParsedTarget =
  | { kind: 'university'; model: 'CrmUniversity'; field: string }
  | { kind: 'course'; model: 'CrmCourse'; field: string }
  | { kind: 'intake_update'; model: 'CrmCourseIntakeFee'; year: number; month: string; field: string }
  | { kind: 'intake_create'; model: 'CrmCourseIntakeFee'; year: number; month: string; field: string }
  | { kind: 'requirement'; model: 'CrmCourseRequirement'; field: string };

const INTAKE_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Parses the queue's fieldName convention (see catalogue-import-service.toUpdateRequests). */
export function parseProposalTarget(entityType: string, fieldName: string): ParsedTarget | null {
  const parts = fieldName.split(':');
  if (parts.length === 3 && (parts[0] === 'intake' || parts[0] === 'intake_new')) {
    const m = INTAKE_KEY.exec(parts[1]);
    if (!m || entityType !== 'course') return null;
    const year = Number(m[1]);
    if (parts[0] === 'intake') return { kind: 'intake_update', model: 'CrmCourseIntakeFee', year, month: m[2], field: parts[2] };
    return { kind: 'intake_create', model: 'CrmCourseIntakeFee', year, month: m[2], field: parts[2] };
  }
  if (parts.length === 2 && parts[0] === 'requirement' && entityType === 'course') {
    return { kind: 'requirement', model: 'CrmCourseRequirement', field: parts[1] };
  }
  if (parts.length === 1 && fieldName) {
    if (entityType === 'university') return { kind: 'university', model: 'CrmUniversity', field: fieldName };
    if (entityType === 'course') return { kind: 'course', model: 'CrmCourse', field: fieldName };
  }
  return null;
}

export function fieldSpecFor(target: ParsedTarget): ApplyFieldSpec | null {
  if (APPLY_FORBIDDEN_FIELDS.has(target.field)) return null;
  if (target.kind === 'intake_create' && target.field === 'intakeMonth') {
    return { field: 'intakeMonth', type: 'month', prisma: 'String' };
  }
  return APPLY_FIELD_ALLOWLIST[target.model][target.field] ?? null;
}

/** Converts an approved string value to the stored type, or explains why it cannot. */
export function coerceApprovedValue(spec: ApplyFieldSpec, raw: string): { ok: true; value: string | number | boolean } | { ok: false; code: FailureCode; message: string } {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return { ok: false, code: 'INVALID_VALUE', message: 'Blank values cannot be applied; a blank never clears a stored value.' };
  if (raw.length >= QUEUE_COLUMN_MAX && (spec.type === 'text' || spec.type === 'name' || spec.type === 'url')) {
    return { ok: false, code: 'VALUE_POSSIBLY_TRUNCATED', message: 'The value reached the 191-character queue limit and may be truncated; enter it in the record editor instead.' };
  }
  switch (spec.prisma) {
    case 'Int':
    case 'Float': {
      const n = Number(s.replace(/[,\s£$€]/g, ''));
      if (!Number.isFinite(n)) return { ok: false, code: 'INVALID_VALUE', message: 'Not a number.' };
      if (spec.prisma === 'Int' && !Number.isInteger(n)) return { ok: false, code: 'INVALID_VALUE', message: 'Must be a whole number.' };
      if ((spec.min !== undefined && n < spec.min) || (spec.max !== undefined && n > spec.max)) {
        return { ok: false, code: 'INVALID_VALUE', message: `Must be between ${spec.min ?? '-∞'} and ${spec.max ?? '∞'}.` };
      }
      return { ok: true, value: n };
    }
    case 'Boolean': {
      const c = canonicalValue(s, 'boolean');
      if (c !== 'true' && c !== 'false') return { ok: false, code: 'INVALID_VALUE', message: 'Must be yes/no.' };
      return { ok: true, value: c === 'true' };
    }
    default: {
      if (spec.type === 'code') {
        if (!/^[A-Za-z]{3}$/.test(s)) return { ok: false, code: 'INVALID_VALUE', message: 'Currency must be a three-letter ISO code.' };
        return { ok: true, value: s.toUpperCase() };
      }
      if (spec.type === 'url') {
        const bad = urlProblem(s);
        if (bad) return { ok: false, code: 'INVALID_VALUE', message: bad };
        return { ok: true, value: s };
      }
      if (spec.type === 'month') {
        if (!canonicalValue(s, 'month').match(/^(0[1-9]|1[0-2])$/)) return { ok: false, code: 'INVALID_VALUE', message: 'Not a recognised month.' };
        return { ok: true, value: s };
      }
      return { ok: true, value: s };
    }
  }
}

function urlProblem(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return 'Must be an https URL.';
    if (u.username || u.password) return 'URL must not contain credentials.';
    if (isSyntheticHost(value)) return 'Reserved example domains cannot be used as evidence or record URLs.';
    return null;
  } catch {
    return 'Not a valid URL.';
  }
}

function display(raw: unknown): string {
  return raw === null || raw === undefined ? '' : String(raw);
}

/** True when the live value is still the value the proposal was reviewed against. */
export function liveMatchesOldValue(live: unknown, oldValue: string, type: FieldType): boolean {
  const liveText = display(live);
  if (liveText === oldValue) return true;
  if (canonicalValue(liveText, type) === canonicalValue(oldValue, type)) return true;
  // The queue stores at most 191 characters of the old value.
  return liveText.length > QUEUE_COLUMN_MAX && oldValue.length === QUEUE_COLUMN_MAX && liveText.slice(0, QUEUE_COLUMN_MAX) === oldValue;
}

function monthOf(raw: unknown): string {
  const c = canonicalValue(raw, 'month');
  return c;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------
// Data access contract (subset of the Prisma client actually used)
// ---------------------------------------------------------------------------

type AnyArgs = Record<string, unknown>;
interface Delegate {
  findMany(args: AnyArgs): Promise<Array<Record<string, any>>>;
  updateMany(args: AnyArgs): Promise<{ count: number }>;
  create?(args: AnyArgs): Promise<Record<string, any>>;
}
export interface ApplyTx {
  universityUpdateRequest: Delegate;
  portalAuditLog: Delegate & { create(args: AnyArgs): Promise<Record<string, any>> };
  crmUniversity: Delegate;
  crmCourse: Delegate;
  crmCourseIntakeFee: Delegate & { create(args: AnyArgs): Promise<Record<string, any>> };
  crmCourseRequirement: Delegate;
}
export interface ApplyClient extends ApplyTx {
  $transaction<T>(fn: (tx: ApplyTx) => Promise<T>): Promise<T>;
}

export interface ApplyActor {
  actorUserId: string;
  effectiveUserId: string;
  identityDomain: string;
}

export type ItemOutcome = 'applied' | 'already_applied' | 'failed' | 'requeued_stale' | 'not_applied_batch_aborted' | 'not_approved';

export interface ItemResult {
  requestId: string;
  outcome: ItemOutcome;
  code?: FailureCode;
  message?: string;
  target?: { model: TargetModel; key: string; field: string };
  previousValue?: string;
  appliedValue?: string;
  /** Present when the target record was verified and has been moved to needs review. */
  verificationTransition?: { from: string; to: string };
}

export interface ApplyResult {
  httpStatus: 200 | 404 | 409 | 503;
  ok: boolean;
  code?: 'APPLIED' | 'ALREADY_APPLIED' | 'NOT_FOUND' | 'NOT_APPROVED' | 'VALIDATION_FAILED' | 'CONCURRENT_CHANGE' | 'TRANSACTION_FAILED';
  message: string;
  results: ItemResult[];
}

const AUDIT_APPROVE = 'CATALOG_PROPOSAL_APPROVE';
export const AUDIT_APPLIED = 'CATALOG_CHANGE_APPLIED';
export const AUDIT_APPLY_FAILED = 'CATALOG_CHANGE_APPLY_FAILED';
export const AUDIT_STALE_REQUEUED = 'CATALOG_CHANGE_STALE_REQUEUED';
export const AUDIT_VERIFICATION_DOWNGRADED = 'CATALOG_RECORD_VERIFICATION_DOWNGRADED';

/** Status written when a verified record is materially changed by apply. */
export const DOWNGRADED_VERIFICATION_STATUS = 'NEEDS_REVIEW';

/** Verification labels that count as "currently verified" (VERIFIED, verified, VERIFIED_OFFICIAL, ...). */
export function isVerifiedStatus(raw: unknown): boolean {
  return /^verified/i.test(display(raw).trim());
}

/** True when writing `next` changes the stored value in substance (same normalisation as the import diff). */
export function isMaterialChange(live: unknown, next: unknown, type: FieldType): boolean {
  return canonicalValue(display(live), type) !== canonicalValue(display(next), type);
}

class ConcurrentChange extends Error {}

interface Planned {
  req: Record<string, any>;
  target: ParsedTarget;
  spec: ApplyFieldSpec;
  value: string | number | boolean;
  approvalAuditId: string;
  approvedHash: string;
  /** Primary key of the row to update; undefined for intake creation. */
  rowId?: string;
  previous: string;
  targetKey: string;
}

interface Failure {
  req: Record<string, any>;
  code: FailureCode;
  message: string;
  liveValue?: string;
  target?: ParsedTarget;
  targetKey?: string;
}

function payloadOf(r: Record<string, any>): ProposalPayload {
  return {
    id: String(r.id), universityId: display(r.universityId), courseId: display(r.courseId), entityType: display(r.entityType),
    fieldName: display(r.fieldName), oldValue: display(r.oldValue), newValue: display(r.newValue), evidenceUrl: display(r.evidenceUrl),
  };
}

function claimWhere(r: Record<string, any>) {
  return { id: r.id, status: PROPOSAL_STATUS.APPROVED, newValue: r.newValue, oldValue: r.oldValue, evidenceUrl: r.evidenceUrl, fieldName: r.fieldName };
}

function targetKeyOf(r: Record<string, any>, t: ParsedTarget): string {
  switch (t.kind) {
    case 'university': return `university:${r.universityId}`;
    case 'course': return `course:${r.courseId}`;
    case 'requirement': return `requirement:${r.courseId}`;
    default: return `intake:${r.courseId}:${t.year}-${t.month}`;
  }
}


/** Loads live rows needed to validate the given proposals. */
async function loadLive(tx: ApplyTx, reqs: Array<Record<string, any>>) {
  const uniIds = [...new Set(reqs.map((r) => display(r.universityId)).filter(Boolean))];
  const courseIds = [...new Set(reqs.map((r) => display(r.courseId)).filter(Boolean))];
  const [unis, courses, intakes, requirements] = await Promise.all([
    uniIds.length ? tx.crmUniversity.findMany({ where: { universityId: { in: uniIds } } }) : [],
    courseIds.length ? tx.crmCourse.findMany({ where: { courseId: { in: courseIds } } }) : [],
    courseIds.length ? tx.crmCourseIntakeFee.findMany({ where: { courseId: { in: courseIds } } }) : [],
    courseIds.length ? tx.crmCourseRequirement.findMany({ where: { courseId: { in: courseIds } } }) : [],
  ]);
  return { unis, courses, intakes, requirements };
}

type Live = Awaited<ReturnType<typeof loadLive>>;

/** Resolves the row a proposal targets and checks identity; no writes. */
function resolveTarget(r: Record<string, any>, t: ParsedTarget, live: Live):
  | { ok: true; row: Record<string, any> | null }
  | { ok: false; code: FailureCode; message: string } {
  const unis = live.unis.filter((u) => u.universityId === r.universityId);
  if (unis.length === 0) return { ok: false, code: 'TARGET_MISSING', message: 'University not found.' };
  if (unis.length > 1) return { ok: false, code: 'DUPLICATE_TARGET', message: 'More than one university has this ID.' };
  if (t.kind === 'university') {
    if (display(r.courseId)) return { ok: false, code: 'IDENTITY_MISMATCH', message: 'University proposal must not name a course.' };
    return { ok: true, row: unis[0] };
  }
  const courses = live.courses.filter((c) => c.courseId === r.courseId);
  if (courses.length === 0) return { ok: false, code: 'TARGET_MISSING', message: 'Course not found.' };
  if (courses.length > 1) return { ok: false, code: 'DUPLICATE_TARGET', message: 'More than one course has this ID.' };
  if (courses[0].universityId !== r.universityId) return { ok: false, code: 'IDENTITY_MISMATCH', message: 'Course belongs to a different university.' };
  if (t.kind === 'course') return { ok: true, row: courses[0] };
  if (t.kind === 'requirement') {
    const rows = live.requirements.filter((q) => q.courseId === r.courseId);
    if (rows.length === 0) return { ok: false, code: 'TARGET_MISSING', message: 'Course has no requirement record; requirements are created through draft staging.' };
    if (rows.length > 1) return { ok: false, code: 'DUPLICATE_TARGET', message: 'Course has more than one requirement record; resolve the duplicate first.' };
    return { ok: true, row: rows[0] };
  }
  const rows = live.intakes.filter((i) => i.courseId === r.courseId && Number(i.intakeYear) === t.year && monthOf(i.intakeMonth) === t.month);
  if (rows.length > 1) return { ok: false, code: 'DUPLICATE_TARGET', message: 'More than one intake exists for this course and month; resolve the duplicate first.' };
  if (t.kind === 'intake_update') {
    if (rows.length === 0) return { ok: false, code: 'TARGET_MISSING', message: 'Intake not found.' };
    return { ok: true, row: rows[0] };
  }
  // intake_create: an existing row (e.g. created by an earlier part of the same proposal set) is updated only if the field is still blank.
  return { ok: true, row: rows[0] ?? null };
}

/**
 * Applies approved proposals. `client` is the Prisma client (or a compatible
 * test double). Returns a structured result; never throws for expected states.
 */
export async function applyApprovedCatalogChanges(client: ApplyClient, requestIds: string[], actor: ApplyActor): Promise<ApplyResult> {
  const ids = [...new Set(requestIds)];
  const reqs = await client.universityUpdateRequest.findMany({ where: { id: { in: ids } } });
  const byId = new Map(reqs.map((r) => [String(r.id), r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    return { httpStatus: 404, ok: false, code: 'NOT_FOUND', message: 'One or more proposals were not found; nothing was applied.', results: missing.map((id) => ({ requestId: id, outcome: 'failed', code: 'TARGET_MISSING', message: 'Proposal not found.' })) };
  }

  const already = ids.filter((id) => byId.get(id)!.status === PROPOSAL_STATUS.APPLIED);
  const candidates = ids.filter((id) => !already.includes(id)).map((id) => byId.get(id)!);
  const alreadyResults: ItemResult[] = already.map((id) => ({ requestId: id, outcome: 'already_applied' }));
  if (candidates.length === 0) {
    return { httpStatus: 200, ok: true, code: 'ALREADY_APPLIED', message: 'All selected proposals were already applied; nothing changed.', results: alreadyResults };
  }

  const notApproved = candidates.filter((r) => r.status !== PROPOSAL_STATUS.APPROVED);
  if (notApproved.length) {
    return {
      httpStatus: 409, ok: false, code: 'NOT_APPROVED', message: 'Only approved proposals can be applied; nothing was applied.',
      results: [
        ...alreadyResults,
        ...candidates.map((r): ItemResult => notApproved.includes(r)
          ? { requestId: r.id, outcome: 'not_approved', code: 'NOT_APPROVED', message: `Status is ${r.status}.` }
          : { requestId: r.id, outcome: 'not_applied_batch_aborted' }),
      ],
    };
  }

  // ---- Validation (read-only) -------------------------------------------
  const audits = await client.portalAuditLog.findMany({
    where: { entityType: 'UniversityUpdateRequest', entityId: { in: candidates.map((r) => r.id) }, action: AUDIT_APPROVE },
    orderBy: { createdAt: 'desc' },
  });
  const latestApproval = new Map<string, Record<string, any>>();
  for (const a of audits) if (!latestApproval.has(String(a.entityId))) latestApproval.set(String(a.entityId), a);

  const live = await loadLive(client, candidates);
  const planned: Planned[] = [];
  const failures: Failure[] = [];
  const seenTargets = new Map<string, Record<string, any>>();

  for (const r of candidates) {
    const approval = latestApproval.get(String(r.id));
    const approvedHash = approvalHashFromAudit(approval);
    if (!approval || !isValidFingerprint(approvedHash)) {
      // Historical approvals are never upgraded: a missing or malformed fingerprint requires a fresh approval.
      failures.push({ req: r, code: 'APPROVAL_HASH_MISSING', message: 'No valid approval fingerprint (approved before fingerprints were introduced, or the record is malformed); approve again.' });
      continue;
    }
    if (approvedHash !== proposalPayloadHash(payloadOf(r))) {
      failures.push({ req: r, code: 'PAYLOAD_MISMATCH', message: 'The proposal differs from what was approved; review it again.' });
      continue;
    }
    const target = parseProposalTarget(display(r.entityType), display(r.fieldName));
    const spec = target ? fieldSpecFor(target) : null;
    if (!target || !spec) {
      failures.push({ req: r, code: 'UNSUPPORTED_FIELD', message: `Field "${display(r.fieldName)}" cannot be applied through this workflow.` });
      continue;
    }
    const evidenceProblem = urlProblem(display(r.evidenceUrl));
    if (evidenceProblem) {
      failures.push({ req: r, code: 'EVIDENCE_INVALID', message: `Evidence URL: ${evidenceProblem}`, target });
      continue;
    }
    const coerced = coerceApprovedValue(spec, display(r.newValue));
    if (!coerced.ok) {
      failures.push({ req: r, code: coerced.code, message: coerced.message, target });
      continue;
    }
    const targetKey = targetKeyOf(r, target);
    const fieldKey = `${targetKey}|${spec.field}`;
    const clash = seenTargets.get(fieldKey);
    if (clash) {
      failures.push({ req: r, code: 'DUPLICATE_IN_BATCH', message: `Conflicts with proposal ${clash.id} for the same field.`, target, targetKey });
      if (!failures.some((f) => f.req.id === clash.id)) {
        failures.push({ req: clash, code: 'DUPLICATE_IN_BATCH', message: `Conflicts with proposal ${r.id} for the same field.`, target, targetKey });
        const idx = planned.findIndex((p) => p.req.id === clash.id);
        if (idx >= 0) planned.splice(idx, 1);
      }
      continue;
    }
    seenTargets.set(fieldKey, r);

    const resolved = resolveTarget(r, target, live);
    if (!resolved.ok) {
      failures.push({ req: r, code: resolved.code, message: resolved.message, target, targetKey });
      continue;
    }
    const liveValue = resolved.row ? display(resolved.row[spec.field]) : '';
    const expectedOld = target.kind === 'intake_create' ? '' : display(r.oldValue);
    if (target.kind === 'intake_create' && display(r.oldValue) !== '') {
      failures.push({ req: r, code: 'INVALID_VALUE', message: 'New-intake proposals must not carry an old value.', target, targetKey });
      continue;
    }
    const matches = target.kind === 'intake_create' && target.field === 'intakeMonth'
      ? true // the key already identifies the month; the row either does not exist or matches it
      : !resolved.row ? true : liveMatchesOldValue(resolved.row[spec.field], expectedOld, spec.type);
    if (!matches) {
      failures.push({ req: r, code: 'STALE', message: 'The live value changed since this proposal was reviewed.', liveValue, target, targetKey });
      continue;
    }
    planned.push({ req: r, target, spec, value: coerced.value, approvalAuditId: String(approval.id), approvedHash, rowId: resolved.row ? String(resolved.row.id) : undefined, previous: liveValue, targetKey });
  }

  if (failures.length) {
    try {
      await recordFailures(client, failures, actor, ids);
    } catch {
      return { httpStatus: 503, ok: false, code: 'TRANSACTION_FAILED', message: 'Validation failed and the failure could not be recorded; nothing was applied. Retry later.', results: [] };
    }
    const failedIds = new Set(failures.map((f) => String(f.req.id)));
    return {
      httpStatus: 409, ok: false, code: 'VALIDATION_FAILED',
      message: 'Some proposals failed revalidation, so the batch was not applied. Stale proposals were returned to review with the current live value.',
      results: [
        ...alreadyResults,
        ...failures.map((f): ItemResult => ({
          requestId: f.req.id, outcome: f.code === 'STALE' ? 'requeued_stale' : 'failed', code: f.code, message: f.message,
          ...(f.target ? { target: { model: f.target.model, key: f.targetKey ?? '', field: f.target.field } } : {}),
          ...(f.liveValue !== undefined ? { previousValue: f.liveValue } : {}),
        })),
        ...candidates.filter((r) => !failedIds.has(String(r.id))).map((r): ItemResult => ({ requestId: r.id, outcome: 'not_applied_batch_aborted' })),
      ],
    };
  }

  // ---- Apply (single transaction) ---------------------------------------
  try {
    const results = await client.$transaction(async (tx) => {
      const out: ItemResult[] = [];
      const fresh = await loadLive(tx, planned.map((p) => p.req));
      const createdIntakes = new Map<string, string>();
      const now = new Date().toISOString();
      const actorLabel = `${actor.identityDomain}:${actor.actorUserId}`.slice(0, 191);

      // Group creations so one intake row is created per course/month.
      const creationGroups = new Map<string, Planned[]>();
      for (const p of planned) {
        if (p.target.kind === 'intake_create' && !p.rowId) {
          const g = creationGroups.get(p.targetKey) ?? [];
          g.push(p);
          creationGroups.set(p.targetKey, g);
        }
      }

      for (const p of planned) {
        const claimed = await tx.universityUpdateRequest.updateMany({ where: claimWhere(p.req), data: { status: PROPOSAL_STATUS.APPLIED } });
        if (claimed.count !== 1) throw new ConcurrentChange();
        let transition: { from: string; to: string } | undefined;

        // Re-check identity and the live value inside the transaction.
        const again = resolveTarget(p.req, p.target, fresh);
        if (!again.ok) throw new ConcurrentChange();
        const t = p.target;
        if (t.kind === 'intake_create' && !p.rowId) {
          if (again.row) throw new ConcurrentChange(); // someone created it meanwhile
          let rowId = createdIntakes.get(p.targetKey);
          if (!rowId) {
            const group = creationGroups.get(p.targetKey) ?? [p];
            const data: Record<string, unknown> = {
              universityId: p.req.universityId,
              courseId: p.req.courseId,
              intakeYear: t.year,
              intakeMonth: MONTH_NAMES[Number(t.month) - 1],
              // Provenance on the new row; NOT verified, so not public until separately verified.
              intakeSourceUrl: p.req.evidenceUrl,
              feeSourceUrl: p.req.evidenceUrl,
              verificationStatus: 'NEEDS_REVIEW',
              status: 'active',
            };
            for (const g of group) data[g.spec.field] = g.value;
            const created = await tx.crmCourseIntakeFee.create({ data });
            rowId = String(created.id);
            createdIntakes.set(p.targetKey, rowId);
          }
        } else if (t.kind === 'intake_create' && t.field === 'intakeMonth') {
          // The intake already exists for this month: the month is identity, nothing to write.
          if (!again.row || String(again.row.id) !== p.rowId) throw new ConcurrentChange();
        } else {
          if (!again.row || String(again.row.id) !== p.rowId) throw new ConcurrentChange();
          const expected = t.kind === 'intake_create' ? '' : display(p.req.oldValue);
          if (!liveMatchesOldValue(again.row[p.spec.field], expected, p.spec.type)) throw new ConcurrentChange();
          const extra: Record<string, unknown> = t.kind === 'university' || t.kind === 'course' ? { lastApprovedUpdateAt: now, updatedBy: actorLabel } : {};
          const delegate = t.model === 'CrmUniversity' ? tx.crmUniversity : t.model === 'CrmCourse' ? tx.crmCourse : t.model === 'CrmCourseIntakeFee' ? tx.crmCourseIntakeFee : tx.crmCourseRequirement;
          const priorVerification = display(again.row.verificationStatus);
          const downgrade = isVerifiedStatus(priorVerification) && isMaterialChange(again.row[p.spec.field], p.value, p.spec.type);
          // When downgrading, the write is conditional on the verification label read in this transaction.
          const where = downgrade ? { id: p.rowId, verificationStatus: priorVerification } : { id: p.rowId };
          const data = { [p.spec.field]: p.value, ...extra, ...(downgrade ? { verificationStatus: DOWNGRADED_VERIFICATION_STATUS } : {}) };
          const written = await delegate.updateMany({ where, data });
          if (written.count !== 1) throw new ConcurrentChange();
          again.row[p.spec.field] = p.value; // keep the in-transaction view current for later items
          if (downgrade) {
            again.row.verificationStatus = DOWNGRADED_VERIFICATION_STATUS;
            transition = { from: priorVerification, to: DOWNGRADED_VERIFICATION_STATUS };
            await tx.portalAuditLog.create({
              data: {
                actorUserId: actor.actorUserId,
                action: AUDIT_VERIFICATION_DOWNGRADED,
                entityType: t.model,
                entityId: p.rowId,
                metadata: JSON.stringify({
                  identityDomain: actor.identityDomain, effectiveUserId: actor.effectiveUserId,
                  previousVerificationStatus: priorVerification, newVerificationStatus: DOWNGRADED_VERIFICATION_STATUS,
                  reason: 'Approved material change applied to a verified record; re-verification required before it is public again.',
                  triggeredByRequestId: p.req.id, key: p.targetKey, field: p.spec.field,
                  previousValue: p.previous, appliedValue: display(p.value), evidenceUrl: p.req.evidenceUrl,
                  batchRequestIds: ids, verified: false, published: false,
                }),
              },
            });
          }
        }

        const appliedValue = display(p.value);
        await tx.portalAuditLog.create({
          data: {
            actorUserId: actor.actorUserId,
            action: AUDIT_APPLIED,
            entityType: 'UniversityUpdateRequest',
            entityId: p.req.id,
            metadata: JSON.stringify({
              identityDomain: actor.identityDomain, effectiveUserId: actor.effectiveUserId,
              target: { model: t.model, key: p.targetKey, field: p.spec.field, rowId: p.rowId ?? createdIntakes.get(p.targetKey) ?? null, created: t.kind === 'intake_create' && !p.rowId },
              previousValue: p.previous, approvedValue: display(p.req.newValue), appliedValue,
              evidenceUrl: p.req.evidenceUrl, approvedBy: p.req.reviewedBy, approvalAuditId: p.approvalAuditId, approvedPayloadHash: p.approvedHash,
              batchRequestIds: ids, result: 'applied', verified: false, published: false,
              verificationTransition: transition ?? null,
              ...(t.kind === 'intake_create' ? { createdVerificationStatus: 'NEEDS_REVIEW' } : {}),
            }),
          },
        });
        out.push({ requestId: p.req.id, outcome: 'applied', target: { model: t.model, key: p.targetKey, field: p.spec.field }, previousValue: p.previous, appliedValue, ...(transition ? { verificationTransition: transition } : {}) });
      }
      return out;
    });
    const downgraded = results.filter((r) => r.verificationTransition).length;
    const verificationNote = downgraded
      ? ` ${downgraded} verified record(s) were moved to needs review and are hidden from the public catalogue until re-verified.`
      : ' No record was marked verified.';
    return { httpStatus: 200, ok: true, code: 'APPLIED', message: `Applied ${results.length} proposal(s) in one transaction.${verificationNote}`, results: [...alreadyResults, ...results] };
  } catch (error) {
    if (error instanceof ConcurrentChange) {
      return {
        httpStatus: 409, ok: false, code: 'CONCURRENT_CHANGE',
        message: 'A proposal or live record changed while applying; the transaction was rolled back and nothing was applied. Reload and retry.',
        results: [...alreadyResults, ...planned.map((p): ItemResult => ({ requestId: p.req.id, outcome: 'not_applied_batch_aborted' }))],
      };
    }
    try {
      await recordFailures(client, planned.map((p) => ({ req: p.req, code: 'TRANSACTION_FAILED' as const, message: 'The database transaction failed and was rolled back.', target: p.target, targetKey: p.targetKey })), actor, ids);
    } catch {
      return { httpStatus: 503, ok: false, code: 'TRANSACTION_FAILED', message: 'The transaction failed and was rolled back; the failure could not be recorded. Nothing was applied.', results: [] };
    }
    return {
      httpStatus: 503, ok: false, code: 'TRANSACTION_FAILED',
      message: 'The transaction failed and was rolled back; nothing was applied. The proposals were marked apply_failed and need a fresh approval.',
      results: [...alreadyResults, ...planned.map((p): ItemResult => ({ requestId: p.req.id, outcome: 'failed', code: 'TRANSACTION_FAILED' }))],
    };
  }
}

/** Records validation/transaction failures in their own transaction. */
async function recordFailures(client: ApplyClient, failures: Failure[], actor: ApplyActor, batchIds: string[]) {
  await client.$transaction(async (tx) => {
    for (const f of failures) {
      const stale = f.code === 'STALE';
      const data = stale
        ? { status: PROPOSAL_STATUS.PENDING, oldValue: (f.liveValue ?? '').slice(0, QUEUE_COLUMN_MAX) }
        : { status: PROPOSAL_STATUS.APPLY_FAILED };
      const res = await tx.universityUpdateRequest.updateMany({ where: claimWhere(f.req), data });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: actor.actorUserId,
          action: stale ? AUDIT_STALE_REQUEUED : AUDIT_APPLY_FAILED,
          entityType: 'UniversityUpdateRequest',
          entityId: f.req.id,
          metadata: JSON.stringify({
            identityDomain: actor.identityDomain, effectiveUserId: actor.effectiveUserId,
            code: f.code, message: f.message,
            target: f.target ? { model: f.target.model, key: f.targetKey ?? null, field: f.target.field } : null,
            previousOldValue: f.req.oldValue, liveValue: f.liveValue ?? null, approvedValue: f.req.newValue, evidenceUrl: f.req.evidenceUrl,
            statusChanged: res.count === 1, newStatus: res.count === 1 ? data.status : null,
            batchRequestIds: batchIds, result: stale ? 'requeued_stale' : 'failed', verified: false, published: false,
          }),
        },
      });
    }
  });
}
