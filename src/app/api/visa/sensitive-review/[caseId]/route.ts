import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canViewVisaSensitive, canManageVisaPermission, hasVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';
import { listPrivateVisaDocumentLinks } from '@/lib/visa/private-document-links';

const schema = z.object({
  seriousMedicalCondition: z.boolean().optional(),
  medicalExplanation: z.string().trim().max(5000).optional(),
  medicalDocumentId: z.string().trim().min(1).max(191).optional(),
  criminalOffense: z.boolean().optional(),
  criminalExplanation: z.string().trim().max(5000).optional(),
  criminalDocumentId: z.string().trim().min(1).max(191).optional(),
  officerInternalNote: z.string().trim().max(5000).optional(),
  studentSafeNote: z.string().trim().max(2000).optional(),
}).strict();

function privateDocumentId(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^\/api\/visa\/documents\/([^/]+)\/download$/.exec(value);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

function safeReview(review: any, links: Array<{ id: string; downloadUrl: string }>) {
  if (!review) return null;
  const medicalId = privateDocumentId(review.medicalDocumentUrl);
  const criminalId = privateDocumentId(review.criminalDocumentUrl);
  const byId = new Map(links.map((link) => [link.id, link.downloadUrl]));
  const medicalUrl = medicalId ? byId.get(medicalId) || null : null;
  const criminalUrl = criminalId ? byId.get(criminalId) || null : null;
  return {
    id: review.id,
    caseId: review.caseId,
    studentId: review.studentId,
    seriousMedicalCondition: review.seriousMedicalCondition,
    medicalExplanation: review.medicalExplanation,
    medicalDocumentAvailable: Boolean(medicalUrl),
    medicalDocumentDownloadUrl: medicalUrl,
    criminalOffense: review.criminalOffense,
    criminalExplanation: review.criminalExplanation,
    criminalDocumentAvailable: Boolean(criminalUrl),
    criminalDocumentDownloadUrl: criminalUrl,
    officerInternalNote: review.officerInternalNote,
    studentSafeNote: review.studentSafeNote,
    humanReviewRequired: review.humanReviewRequired,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canViewVisaSensitive(auth, visaCase)) return NextResponse.json({ success: false, error: 'visa.sensitive.view permission and assigned case required.' }, { status: 403 });
    const review = await db.visaSensitiveReview.findUnique({ where: { caseId } });
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_SENSITIVE_VIEW', entityType: 'VisaSensitiveReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, hasReview: Boolean(review) }), ipAddress: '', userAgent: '' } });
    const documentIds = [privateDocumentId(review?.medicalDocumentUrl), privateDocumentId(review?.criminalDocumentUrl)].filter((id): id is string => Boolean(id));
    const links = documentIds.length && (isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download'))
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, documentIds, true)
      : [];
    return NextResponse.json({ success: true, data: safeReview(review, links), emptyState: review ? null : 'No restricted sensitive review recorded.' }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Sensitive review view could not be audited or loaded.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.sensitive.update', visaCase)) return NextResponse.json({ success: false, error: 'visa.sensitive.update permission and assigned case required.' }, { status: 403 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return NextResponse.json({ success: false, error: 'Invalid restricted review update.', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });

    const existing = await db.visaSensitiveReview.findUnique({ where: { caseId } });
    const documentIds = [parsed.data.medicalDocumentId, parsed.data.criminalDocumentId].filter((id): id is string => Boolean(id));
    if (documentIds.length) {
      if (!canManageVisaPermission(auth, 'visa.documents.view', visaCase) || !canViewVisaSensitive(auth, visaCase)) {
        return NextResponse.json({ success: false, error: 'Sensitive-view and visa.documents.view permissions are required to link restricted evidence.' }, { status: 403 });
      }
      const documents = await db.studentDocument.findMany({ where: { id: { in: documentIds }, studentId: visaCase.studentId, caseId: { in: [caseId, ''] }, isArchived: false, storagePath: { not: null }, mimeType: { not: null }, fileHash: { not: null } }, select: { id: true, category: true } });
      if (documents.length !== new Set(documentIds).size) return NextResponse.json({ success: false, error: 'Sensitive evidence must be a stored private document belonging to this student.' }, { status: 400 });
      const categoryById = new Map(documents.map((document) => [document.id, document.category.toLowerCase()]));
      const medicalCategory = parsed.data.medicalDocumentId ? categoryById.get(parsed.data.medicalDocumentId) || '' : '';
      const criminalCategory = parsed.data.criminalDocumentId ? categoryById.get(parsed.data.criminalDocumentId) || '' : '';
      if (medicalCategory && !medicalCategory.includes('medical') && !medicalCategory.includes('sensitive')) return NextResponse.json({ success: false, error: 'Medical evidence must use a medical or sensitive document category.' }, { status: 400 });
      if (criminalCategory && !criminalCategory.includes('criminal') && !criminalCategory.includes('sensitive')) return NextResponse.json({ success: false, error: 'Criminal-history evidence must use a criminal or sensitive document category.' }, { status: 400 });
    }

    const medical = parsed.data.seriousMedicalCondition ?? existing?.seriousMedicalCondition ?? false;
    const criminal = parsed.data.criminalOffense ?? existing?.criminalOffense ?? false;
    const data: any = {
      ...(parsed.data.seriousMedicalCondition !== undefined ? { seriousMedicalCondition: parsed.data.seriousMedicalCondition } : {}),
      ...(parsed.data.medicalExplanation !== undefined ? { medicalExplanation: parsed.data.medicalExplanation } : {}),
      ...(parsed.data.medicalDocumentId !== undefined ? { medicalDocumentUrl: `/api/visa/documents/${encodeURIComponent(parsed.data.medicalDocumentId)}/download` } : {}),
      ...(parsed.data.criminalOffense !== undefined ? { criminalOffense: parsed.data.criminalOffense } : {}),
      ...(parsed.data.criminalExplanation !== undefined ? { criminalExplanation: parsed.data.criminalExplanation } : {}),
      ...(parsed.data.criminalDocumentId !== undefined ? { criminalDocumentUrl: `/api/visa/documents/${encodeURIComponent(parsed.data.criminalDocumentId)}/download` } : {}),
      ...(parsed.data.officerInternalNote !== undefined ? { officerInternalNote: parsed.data.officerInternalNote } : {}),
      ...(parsed.data.studentSafeNote !== undefined ? { studentSafeNote: parsed.data.studentSafeNote } : {}),
      humanReviewRequired: medical || criminal,
    };

    const review = await db.$transaction(async (tx) => {
      const saved = await tx.visaSensitiveReview.upsert({
        where: { caseId },
        create: { caseId, studentId: visaCase.studentId, seriousMedicalCondition: medical, criminalOffense: criminal, humanReviewRequired: medical || criminal, ...data },
        update: data,
      });
      await tx.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_SENSITIVE_UPDATE', entityType: 'VisaSensitiveReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, changedFields: Object.keys(parsed.data), before: existing ? { seriousMedicalCondition: existing.seriousMedicalCondition, criminalOffense: existing.criminalOffense } : null, after: { seriousMedicalCondition: saved.seriousMedicalCondition, criminalOffense: saved.criminalOffense, humanReviewRequired: saved.humanReviewRequired } }), ipAddress: '', userAgent: '' } });
      await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_SENSITIVE_REVIEW_UPDATED', title: 'Restricted visa review updated.', description: 'A restricted review was updated. Sensitive details are not included in the timeline.', actor: auth.actorUserId } });
      return saved;
    });
    const documentIds = [privateDocumentId(review.medicalDocumentUrl), privateDocumentId(review.criminalDocumentUrl)].filter((id): id is string => Boolean(id));
    const links = documentIds.length && (isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download'))
      ? await listPrivateVisaDocumentLinks(visaCase.studentId, caseId, documentIds, true)
      : [];
    return NextResponse.json({ success: true, data: safeReview(review, links) }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Sensitive review could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
