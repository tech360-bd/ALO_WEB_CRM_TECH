import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive, hasVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';
import { listPrivateVisaDocumentLinks } from '@/lib/visa/private-document-links';

const schema = z.object({
  hasStudyGap: z.boolean(),
  gapDurationMonths: z.number().int().min(0).max(600),
  gapFrom: z.string().trim().max(80).optional(),
  gapTo: z.string().trim().max(80).optional(),
  gapPurpose: z.string().trim().max(4000).optional(),
  workExpDuringGap: z.string().trim().max(4000).optional(),
  explanationClarity: z.enum(['clear', 'partial', 'unclear', 'unknown']).optional(),
  supportingDocumentIds: z.array(z.string().trim().min(1).max(191)).max(20).optional(),
  employmentDetails: z.string().trim().max(4000).optional(),
  trainingDetails: z.string().trim().max(4000).optional(),
  familyReason: z.string().trim().max(4000).optional(),
  medicalReason: z.string().trim().max(4000).optional(),
  visaReason: z.string().trim().max(4000).optional(),
}).strict();

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.risk.view', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.risk.view permission required.' }, { status: 403 });
    const review = await db.visaStudyGapReview.findUnique({ where: { caseId } });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.actorUserId, action: 'VISA_STUDY_GAP_VIEW', entityType: 'VisaStudyGapReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, hasReview: Boolean(review) }), ipAddress: '', userAgent: '' },
    });
    if (!review) return NextResponse.json({ success: true, data: null, emptyState: 'No study-gap review recorded.' });
    const documentIds = (() => { try { const parsed = JSON.parse(review.supportingDocuments || '[]'); return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.length <= 191) : []; } catch { return []; } })();
    const documentLinks = isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download')
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, documentIds, canViewVisaSensitive(auth, visaCase))
      : [];
    return NextResponse.json({ success: true, data: { ...review, medicalReason: canViewVisaSensitive(auth, visaCase) ? review.medicalReason : undefined, supportingDocuments: documentLinks } }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Study-gap review could not be audited or loaded.' }, { status: 503 });
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
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid study-gap review.', details: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.medicalReason !== undefined && !canManageVisaPermission(auth, 'visa.sensitive.update', visaCase)) {
      return NextResponse.json({ success: false, error: 'visa.sensitive.update permission and assigned case required for medical details.' }, { status: 403 });
    }

    const { supportingDocumentIds, ...fields } = parsed.data;
    const existing = await db.visaStudyGapReview.findUnique({ where: { caseId } });
    const existingDocumentIds = (() => { try { const value = JSON.parse(existing?.supportingDocuments || '[]'); return Array.isArray(value) ? value.filter((id) => typeof id === 'string' && id.length <= 191) : []; } catch { return []; } })();
    if (supportingDocumentIds !== undefined && !canManageVisaPermission(auth, 'visa.documents.view', visaCase)) {
      return NextResponse.json({ success: false, error: 'visa.documents.view permission is required to change linked study-history evidence.' }, { status: 403 });
    }
    if (supportingDocumentIds !== undefined) {
      const idsToCheck = [...new Set([...supportingDocumentIds, ...(canViewVisaSensitive(auth, visaCase) ? [] : existingDocumentIds)])];
      const documents = idsToCheck.length ? await db.studentDocument.findMany({
        where: { id: { in: idsToCheck }, studentId: visaCase.studentId, caseId: { in: [caseId, ''] }, isArchived: false, storagePath: { not: null }, mimeType: { not: null }, fileHash: { not: null } },
        select: { id: true, category: true },
      }) : [];
      const foundIds = new Set(documents.map((document) => document.id));
      if (supportingDocumentIds.some((id) => !foundIds.has(id))) return NextResponse.json({ success: false, error: 'Supporting evidence must be stored private documents for this student and current case.' }, { status: 400 });
      if (!canViewVisaSensitive(auth, visaCase) && documents.some((document) => ['medical', 'criminal', 'sensitive'].some((part) => document.category.toLowerCase().includes(part)))) {
        return NextResponse.json({ success: false, error: 'Explicit sensitive-data permission is required to change restricted supporting evidence.' }, { status: 403 });
      }
    }
    const documentIdsToSave = supportingDocumentIds ?? existingDocumentIds;
    const review = await db.$transaction(async (tx) => {
      const saved = await tx.visaStudyGapReview.upsert({
        where: { caseId },
        create: { caseId, studentId: visaCase.studentId, ...fields, supportingDocuments: JSON.stringify(documentIdsToSave), riskFlag: parsed.data.hasStudyGap ? 'human_review_required' : 'not_applicable' },
        update: { ...fields, supportingDocuments: JSON.stringify(documentIdsToSave), riskFlag: parsed.data.hasStudyGap ? 'human_review_required' : 'not_applicable' },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_STUDY_GAP_UPDATE', entityType: 'VisaStudyGapReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, changedFields: Object.keys(parsed.data), before: existing ? { hasStudyGap: existing.hasStudyGap, gapDurationMonths: existing.gapDurationMonths } : null, after: { hasStudyGap: saved.hasStudyGap, gapDurationMonths: saved.gapDurationMonths } }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_STUDY_GAP_REVIEW_UPDATED', title: 'Restricted study-history review updated.', description: 'Review metadata changed; private explanation details are not included in the timeline.', actor: auth.actorUserId } });
      return saved;
    });
    const savedDocumentIds = (() => { try { const parsed = JSON.parse(review.supportingDocuments || '[]'); return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.length <= 191) : []; } catch { return []; } })();
    const documentLinks = isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download')
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, savedDocumentIds, canViewVisaSensitive(auth, visaCase))
      : [];
    return NextResponse.json({ success: true, data: { ...review, medicalReason: canViewVisaSensitive(auth, visaCase) ? review.medicalReason : undefined, supportingDocuments: documentLinks }, automatedAssessment: false }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Study-gap review could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
