import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, hasVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';
import { listPrivateVisaDocumentLinks } from '@/lib/visa/private-document-links';


function privateDocumentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^\/api\/visa\/documents\/([^/]+)\/download$/.exec(value);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

const schema = z.object({
  hasVisaRefusal: z.boolean(),
  refusalCountry: z.string().trim().max(191).optional(),
  visaType: z.string().trim().max(100).optional(),
  refusalDate: z.string().trim().max(80).optional(),
  refusalReason: z.string().trim().max(5000).optional(),
  refusalLetterDocumentId: z.string().trim().max(191).optional(),
  previousApplication: z.string().trim().max(5000).optional(),
  improvementPlan: z.string().trim().max(5000).optional(),
  newExplanation: z.string().trim().max(5000).optional(),
  officerNote: z.string().trim().max(5000).optional(),
  previousRefusalCount: z.number().int().min(0).max(50).optional(),
  humanReviewStatus: z.enum(['pending', 'reviewed', 'needs_super_review']).optional(),
}).strict();

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.risk.view', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.risk.view permission required.' }, { status: 403 });
    const review = await db.visaRefusalReview.findUnique({ where: { caseId } });
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_REFUSAL_VIEW', entityType: 'VisaRefusalReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, hasReview: Boolean(review) }), ipAddress: '', userAgent: '' } });
    if (!review) return NextResponse.json({ success: true, data: null, emptyState: 'No refusal-history review recorded.' });
    const { refusalLetterUrl, ...safeReview } = review;
    const documentId = privateDocumentId(refusalLetterUrl);
    const documentLinks = documentId && (isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download'))
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, [documentId])
      : [];
    return NextResponse.json({ success: true, data: { ...safeReview, refusalLetterDownloadUrl: documentLinks[0]?.downloadUrl || null } }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Refusal review could not be audited or loaded.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.risk.update', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.risk.update permission required.' }, { status: 403 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid refusal-history review.', details: parsed.error.flatten() }, { status: 400 });

    let refusalLetterUrl = '';
    if (parsed.data.refusalLetterDocumentId) {
      if (!canManageVisaPermission(auth, 'visa.documents.view', visaCase)) {
        return NextResponse.json({ success: false, error: 'visa.documents.view permission is required to link a refusal letter.' }, { status: 403 });
      }
      const document = await db.studentDocument.findFirst({ where: { id: parsed.data.refusalLetterDocumentId, studentId: visaCase.studentId, caseId: { in: [caseId, ''] }, isArchived: false, storagePath: { not: null }, mimeType: { not: null }, fileHash: { not: null } }, select: { id: true } });
      if (!document) return NextResponse.json({ success: false, error: 'Refusal letter must be a stored private document belonging to this student.' }, { status: 400 });
      refusalLetterUrl = `/api/visa/documents/${encodeURIComponent(document.id)}/download`;
    }

    const { refusalLetterDocumentId: _documentId, ...fields } = parsed.data;
    const existing = await db.visaRefusalReview.findUnique({ where: { caseId } });
    const completenessFlags = parsed.data.hasVisaRefusal ? [
      ...(!refusalLetterUrl && !existing?.refusalLetterUrl ? ['Refusal letter is not linked.'] : []),
      ...(!parsed.data.refusalReason?.trim() && !existing?.refusalReason ? ['Refusal reason has not been documented.'] : []),
      ...(!parsed.data.improvementPlan?.trim() && !existing?.improvementPlan ? ['Improvement explanation has not been documented.'] : []),
    ] : [];

    const review = await db.$transaction(async (tx) => {
      const saved = await tx.visaRefusalReview.upsert({
        where: { caseId },
        create: { caseId, studentId: visaCase.studentId, ...fields, refusalLetterUrl, humanReviewStatus: parsed.data.humanReviewStatus || 'pending' },
        update: { ...fields, ...(parsed.data.refusalLetterDocumentId !== undefined ? { refusalLetterUrl } : {}), humanReviewStatus: parsed.data.humanReviewStatus || 'pending' },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_REFUSAL_UPDATE', entityType: 'VisaRefusalReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, changedFields: Object.keys(parsed.data), before: existing ? { hasVisaRefusal: existing.hasVisaRefusal, previousRefusalCount: existing.previousRefusalCount, humanReviewStatus: existing.humanReviewStatus } : null, after: { hasVisaRefusal: saved.hasVisaRefusal, previousRefusalCount: saved.previousRefusalCount, humanReviewStatus: saved.humanReviewStatus } }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_REFUSAL_REVIEW_UPDATED', title: 'Restricted visa-history review updated.', description: 'A restricted review was updated; refusal details are not included in the timeline.', actor: auth.actorUserId } });
      return saved;
    });
    const { refusalLetterUrl: _privateUrl, ...safeReview } = review;
    const savedDocumentId = privateDocumentId(review.refusalLetterUrl);
    const documentLinks = savedDocumentId && (isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download'))
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, [savedDocumentId])
      : [];
    return NextResponse.json({ success: true, data: { ...safeReview, refusalLetterDownloadUrl: documentLinks[0]?.downloadUrl || null }, completenessFlags, automatedAssessment: false }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Refusal review could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
