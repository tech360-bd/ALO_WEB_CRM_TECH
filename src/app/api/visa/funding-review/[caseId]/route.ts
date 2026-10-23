import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive, hasVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';
import { listPrivateVisaDocumentLinks } from '@/lib/visa/private-document-links';


function parseStringList(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string' && entry.length <= 191) : [];
  } catch { return []; }
}

async function projectFundingReview(auth: AuthContext, visaCase: { id: string; studentId: string; visaOfficerId: string | null }, review: any) {
  if (!review) return null;
  const canDownload = isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.documents.download');
  const sponsorDocuments = canDownload
    ? await listPrivateVisaDocumentLinks(visaCase.studentId, visaCase.id, parseStringList(review.sponsorDocuments), canViewVisaSensitive(auth, visaCase))
    : [];
  const { sponsorDocuments: _storedIds, dependents: storedDependents, ...safeReview } = review;
  return { ...safeReview, sponsorDocuments, dependents: parseStringList(storedDependents) };
}

const schema = z.object({
  fundingStatus: z.enum(['pending', 'pending_review', 'complete', 'verified', 'needs_update']).optional(),
  sponsor: z.string().trim().max(191).optional(),
  sponsorRelation: z.string().trim().max(191).optional(),
  sponsorOccupation: z.string().trim().max(191).optional(),
  sponsorIncome: z.string().trim().max(191).optional(),
  sourceOfFund: z.string().trim().max(500).optional(),
  hasBankStatement: z.boolean().optional(),
  hasSolvencyCert: z.boolean().optional(),
  sourceOfFundExplanation: z.string().trim().max(4000).optional(),
  tuitionDeposit: z.string().trim().max(191).optional(),
  livingCostPlan: z.string().trim().max(4000).optional(),
  dependents: z.array(z.string().trim().min(1).max(191)).max(20).optional(),
  sponsorDocumentIds: z.array(z.string().trim().min(1).max(191)).max(20).optional(),
}).strict();

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.risk.view', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.risk.view permission required.' }, { status: 403 });
    const review = await db.visaFundingReview.findUnique({ where: { caseId } });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.actorUserId, action: 'VISA_FUNDING_VIEW', entityType: 'VisaFundingReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, hasReview: Boolean(review) }), ipAddress: '', userAgent: '' },
    });
    const data = await projectFundingReview(auth, visaCase, review);
    return NextResponse.json({ success: true, data, emptyState: review ? null : 'No funding review has been recorded.' }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Funding review view could not be audited or loaded.' }, { status: 503 });
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
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return NextResponse.json({ success: false, error: 'Invalid funding review update.', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });

    const { dependents, sponsorDocumentIds, ...fields } = parsed.data;
    if (sponsorDocumentIds?.length) {
      const documents = await db.studentDocument.findMany({
        where: { id: { in: sponsorDocumentIds }, studentId: visaCase.studentId, caseId: { in: [caseId, ''] }, isArchived: false, storagePath: { not: null }, mimeType: { not: null }, fileHash: { not: null } },
        select: { id: true },
      });
      if (documents.length !== new Set(sponsorDocumentIds).size) return NextResponse.json({ success: false, error: 'Every sponsor document must be a stored private document belonging to this student.' }, { status: 400 });
    }

    const reviewPrompts = [
      ...(fields.hasBankStatement === false ? ['Bank statement evidence is not marked available.'] : []),
      ...(fields.hasSolvencyCert === false ? ['Solvency certificate evidence is not marked available.'] : []),
      ...((fields.sourceOfFundExplanation || '').trim().length > 0 && (fields.sourceOfFundExplanation || '').trim().length < 20 ? ['Source-of-funds explanation may need more detail.'] : []),
      ...((dependents || []).length > 0 && !fields.livingCostPlan ? ['Review how dependent living costs are covered.'] : []),
    ];
    const updateData = {
      ...fields,
      ...(dependents !== undefined ? { dependents: JSON.stringify(dependents) } : {}),
      ...(sponsorDocumentIds !== undefined ? { sponsorDocuments: JSON.stringify(sponsorDocumentIds) } : {}),
      riskWarning: reviewPrompts.length ? reviewPrompts.join(' ') : 'human_review_required',
    };
    const existing = await db.visaFundingReview.findUnique({ where: { caseId } });
    const review = await db.$transaction(async (tx) => {
      const saved = await tx.visaFundingReview.upsert({
        where: { caseId },
        create: { caseId, studentId: visaCase.studentId, fundingStatus: 'pending_review', ...updateData },
        update: updateData,
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_FUNDING_UPDATE', entityType: 'VisaFundingReview', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, changedFields: Object.keys(parsed.data), before: existing ? { fundingStatus: existing.fundingStatus, hasBankStatement: existing.hasBankStatement, hasSolvencyCert: existing.hasSolvencyCert } : null, after: { fundingStatus: saved.fundingStatus, hasBankStatement: saved.hasBankStatement, hasSolvencyCert: saved.hasSolvencyCert } }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({
        data: { studentId: visaCase.studentId, stage: 'VISA_FUNDING_REVIEW_UPDATED', title: 'Visa funding review updated.', description: 'A restricted funding review was updated; sensitive financial details are not included in the timeline.', actor: auth.actorUserId },
      });
      return saved;
    });
    const data = await projectFundingReview(auth, visaCase, review);
    return NextResponse.json({ success: true, data, reviewPrompts, automatedAssessment: false }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Funding review could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
