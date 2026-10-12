import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { approvalFingerprintState, proposalPayloadHash } from '@/lib/course-finder/catalog-change-payload';

const statuses = ['pending_approval', 'pending', 'reviewed_unverified', 'approved', 'rejected', 'applied', 'apply_failed', 'published', 'rolled_back', 'all'] as const;
const query = z.object({
  status: z.enum(statuses).optional(), entityType: z.enum(['course', 'university']).optional(),
  confidence: z.coerce.number().finite().min(0).max(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
const id = z.string().trim().min(1).max(191);
const reviewBody = z.object({
  requestId: id, action: z.enum(['approve', 'reject', 'edit']),
  newValue: z.string().trim().min(1).max(191).optional(),
  evidenceUrl: z.url().max(191).refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }).optional(),
  reviewNote: z.string().max(2000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.action === 'edit' && (!value.newValue || !value.evidenceUrl)) ctx.addIssue({ code: 'custom', message: 'Edit requires value and evidence URL' });
});

async function authorize(req: Request, mutation: boolean) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.userId || !auth.actorUserId || !['user', 'portal'].includes(auth.identityDomain || '') || !['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ success: false, error: 'Catalogue administrator required' }, { status: 403 });
  }
  if (mutation && !mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required' }, { status: 403 });
  return auth;
}

export async function listCatalogUpdates(req: Request) {
  try {
    const auth = await authorize(req, false); if (auth instanceof NextResponse) return auth;
    const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid update filters' }, { status: 400 });
    const { status, entityType, confidence, limit } = parsed.data;
    const updates = await db.universityUpdateRequest.findMany({
      where: { ...(status && status !== 'all' ? { status } : {}), ...(entityType ? { entityType } : {}), ...(confidence === undefined ? {} : { aiConfidence: { gte: confidence } }) },
      orderBy: { createdAt: 'desc' }, take: limit,
    });
    const annotated = await annotateApprovalFingerprints(updates);
    return NextResponse.json({ success: true, updates: annotated, data: annotated, count: annotated.length,
      publicationAvailable: false, scannerStatus: 'NOT_VERIFIED', lastScanAt: null, nextScanAt: null,
      message: 'Returned review queue only; source links, prior approved labels and AI confidence are not proof of verification. No synthetic scans or automatic publication.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to list catalogue updates' }, { status: 503 });
  }
}

/** Statuses that represent an approval and therefore need a valid fingerprint before apply. */
const APPROVAL_STATUSES = new Set(['reviewed_unverified', 'approved']);

/**
 * Adds `approvalFingerprint` (valid | missing | mismatch) to approved rows so
 * reviewers see which historical approvals must be approved again. Read-only.
 * Legacy `approved` rows are always `missing`-or-worse unless re-approved.
 */
async function annotateApprovalFingerprints<T extends Record<string, any>>(rows: T[]): Promise<Array<T & { approvalFingerprint?: string }>> {
  const approved = rows.filter(r => APPROVAL_STATUSES.has(String(r.status)));
  if (!approved.length) return rows;
  const audits = await db.portalAuditLog.findMany({
    where: { entityType: 'UniversityUpdateRequest', entityId: { in: approved.map(r => String(r.id)) }, action: 'CATALOG_PROPOSAL_APPROVE' },
    orderBy: { createdAt: 'desc' },
    select: { entityId: true, metadata: true },
  });
  const latest = new Map<string, { metadata?: unknown }>();
  for (const a of audits) if (!latest.has(String(a.entityId))) latest.set(String(a.entityId), a);
  return rows.map(r => {
    if (!APPROVAL_STATUSES.has(String(r.status))) return r;
    const state = r.status === 'approved' ? 'missing' : approvalFingerprintState({ ...r, id: r.id }, latest.get(String(r.id)));
    return { ...r, approvalFingerprint: state };
  });
}

class ReviewConflict extends Error {}
class ReviewMissing extends Error {}

/** Human triage only. No live catalogue, verification, fee, or publication writes. */
export async function reviewCatalogUpdate(req: Request, routeAction?: 'approve' | 'reject' | 'edit') {
  try {
    const auth = await authorize(req, true); if (auth instanceof NextResponse) return auth;
    const input = await req.json().catch(() => null);
    const routeId = routeAction ? new URL(req.url).pathname.split('/').at(-2) : undefined;
    const parsed = reviewBody.safeParse(routeAction ? { ...(input ?? {}), requestId: routeId, action: routeAction } : input);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid review action, ID, value or evidence' }, { status: 400 });
    const p = parsed.data;
    const update = await db.$transaction(async tx => {
      const current = await tx.universityUpdateRequest.findUnique({ where: { id: p.requestId } });
      if (!current) throw new ReviewMissing();
      // `applied` is final; `apply_failed` may be reviewed again (a fresh approval is required before any retry).
      // Legacy `approved` rows predate approval fingerprints and must be re-approved (or rejected) before apply.
      if (!['pending_approval', 'pending', 'reviewed_unverified', 'apply_failed', 'approved'].includes(current.status)) throw new ReviewConflict();
      const status = p.action === 'approve' ? 'reviewed_unverified' : p.action === 'reject' ? 'rejected' : 'pending_approval';
      const claimed = await tx.universityUpdateRequest.updateMany({
        where: { id: current.id, status: current.status, newValue: current.newValue, evidenceUrl: current.evidenceUrl, reviewedBy: current.reviewedBy },
        data: { status, reviewedBy: `${auth.identityDomain}:${auth.actorUserId}`, ...(p.newValue === undefined ? {} : { newValue: p.newValue }), ...(p.evidenceUrl === undefined ? {} : { evidenceUrl: p.evidenceUrl }) },
      });
      if (claimed.count !== 1) throw new ReviewConflict();
      // Integrity anchor for apply: hash of exactly the payload being approved.
      const approvedPayloadHash = status === 'reviewed_unverified'
        ? proposalPayloadHash({ ...current, newValue: p.newValue ?? current.newValue, evidenceUrl: p.evidenceUrl ?? current.evidenceUrl })
        : undefined;
      await tx.portalAuditLog.create({ data: {
        actorUserId: auth.actorUserId, action: `CATALOG_PROPOSAL_${p.action.toUpperCase()}`, entityType: 'UniversityUpdateRequest', entityId: current.id,
        metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, previousStatus: current.status, status, previousValue: current.newValue, newValue: p.newValue ?? current.newValue, evidenceUrl: p.evidenceUrl ?? current.evidenceUrl, reviewNote: p.reviewNote, approvedPayloadHash, verified: false, published: false }),
      } });
      return tx.universityUpdateRequest.findUnique({ where: { id: current.id } });
    });
    return NextResponse.json({ success: true, data: update, verified: false, published: false,
      message: p.action === 'approve' ? 'Proposal approved for apply; no live data changed. A Super Admin must apply it separately, and approval does not mark any record verified.' : 'Proposal updated; no live data changed.',
    });
  } catch (error) {
    if (error instanceof ReviewMissing) return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    if (error instanceof ReviewConflict) return NextResponse.json({ success: false, error: 'Proposal changed or is not reviewable; reload before retrying' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Review failed; no changes committed' }, { status: 503 });
  }
}

/** Legacy paths lack field authority, snapshot, and cache invalidation contracts. */
export async function unavailableCatalogAction(req: Request) {
  const auth = await authorize(req, true); if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ success: false, code: 'CATALOG_EVIDENCE_PIPELINE_REQUIRED', verified: false, published: false,
    error: 'This legacy scan/publication/rollback path is unavailable: official field evidence, typed target mapping and versioned publication snapshots are required. Submit proposals through /api/weekly-updates; no changes were made.',
  }, { status: 409 });
}
