/**
 * Safe DEPLOY_CONTENT handling for the inline fallback in
 * /api/ai-command/execute (used when ai-action-executor throws).
 *
 * Phase 1 review (2026-10-12), P0-B. The previous fallback:
 *  - created CoursePage rows with invented facts ("aalborg-university",
 *    "denmark", "IELTS 6.0", "SSC/HSC equivalent", "3 years", "September",
 *    "Contact for details", ...) and did not set verificationStatus, so the
 *    row inherited the schema default VERIFIED;
 *  - updated CoursePage rows with `data: payload.data` verbatim, so an AI
 *    payload could set approvalStatus=PUBLISHED / verificationStatus=VERIFIED;
 *  - reported "Content deployed to <type>" for every other target type
 *    without writing anything.
 *
 * Now: AI output is never verification and never publication.
 *  - create: name, slug, universitySlug and countrySlug must be supplied; no
 *    value is invented. Other text fields left empty. Always UNVERIFIED +
 *    DRAFT with no verification date.
 *  - update: allow-listed content fields only; control fields are rejected;
 *    any real change downgrades VERIFIED -> NEEDS_REVIEW and takes a
 *    PUBLISHED page back to PENDING_REVIEW for human review.
 *  - unsupported targets throw, so the action is recorded as FAILED instead
 *    of a fake success.
 */
import { db } from '@/lib/db';
import {
  COURSE_PAGE_CONTROL_FIELDS,
  NEEDS_REVIEW,
  UNVERIFIED,
  sanitizeCoursePageFields,
  withoutUnchanged,
} from './content-page-guards';

const REQUIRED_FOR_CREATE = ['name', 'slug', 'universitySlug', 'countrySlug'] as const;
const EMPTY_TEXT_FIELDS = ['city', 'level', 'subject', 'duration', 'intake', 'tuition', 'englishRequirement', 'academicRequirement', 'overview'];

function rejectControl(source: Record<string, unknown>) {
  const present = Object.keys(source).filter((k) => COURSE_PAGE_CONTROL_FIELDS.has(k) || k === 'lastVerifiedBy');
  if (present.length) throw new Error(`AI content cannot set control fields: ${present.join(', ')}`);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function deployContentFallback(targetType: string, targetId: string | undefined, payload: unknown) {
  if (targetType !== 'CoursePage') {
    throw new Error(`DEPLOY_CONTENT fallback does not support target ${String(targetType).slice(0, 60)}; nothing was deployed`);
  }
  const body = asObject(payload);

  if (targetId) {
    const patch = asObject(body.data);
    rejectControl(patch);
    const sanitized = sanitizeCoursePageFields(patch);
    if (!sanitized.ok) throw new Error(sanitized.error);
    const existing = await db.coursePage.findUnique({ where: { id: targetId } });
    if (!existing) throw new Error('Course page not found');
    const data: Record<string, unknown> = withoutUnchanged(sanitized.data, existing as any);
    if (Object.keys(data).length === 0) return { id: existing.id, summary: `Course page ${existing.name}: no changes` };
    if (existing.verificationStatus === 'VERIFIED') data.verificationStatus = NEEDS_REVIEW;
    if (existing.approvalStatus === 'PUBLISHED') data.approvalStatus = 'PENDING_REVIEW';
    const result = await db.coursePage.updateMany({ where: { id: targetId, updatedAt: existing.updatedAt }, data: data as any });
    if (result.count !== 1) throw new Error('Course page changed concurrently; nothing was updated');
    return {
      id: existing.id,
      summary: `Course page ${existing.name} updated by AI action; needs human review`,
      verificationStatus: (data.verificationStatus as string) || existing.verificationStatus,
      approvalStatus: (data.approvalStatus as string) || existing.approvalStatus,
    };
  }

  rejectControl(body);
  const sanitized = sanitizeCoursePageFields(body);
  if (!sanitized.ok) throw new Error(sanitized.error);
  const missing = REQUIRED_FOR_CREATE.filter((f) => !sanitized.data[f]);
  if (missing.length) throw new Error(`DEPLOY_CONTENT create requires ${missing.join(', ')}; no values are assumed`);
  const empty: Record<string, string> = {};
  for (const f of EMPTY_TEXT_FIELDS) empty[f] = '';
  const created = await db.coursePage.create({
    data: {
      ...empty,
      ...sanitized.data,
      lastVerifiedAt: null,
      verificationStatus: UNVERIFIED,
      approvalStatus: 'DRAFT',
    } as any,
  });
  return { id: created.id, summary: `Course page ${created.name} created as an unverified draft`, verificationStatus: UNVERIFIED, approvalStatus: 'DRAFT' };
}
