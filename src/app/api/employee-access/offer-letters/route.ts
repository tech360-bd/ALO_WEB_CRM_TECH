import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { analyzePostOfferRequirements, checkPostOfferGate } from '@/lib/applications/post-offer-requirements';
import { PrivateApplicationDocumentError, resolveApplicationDocumentLink, sanitizeApplicationDocumentLink } from '@/lib/application-manager/private-document-link';

// ============================================================================
// /api/employee-access/offer-letters
//
// OFFER LETTER MANAGEMENT (spec): every offer records University, Application,
// Student, Program, Campus, Intake, Offer Type, Conditions, Date Received,
// Source, Received By, Document, Version, Status — provenance is never lost.
// Persists on the REAL schema model `ApplicationOffer` (table: application_offers).
// ============================================================================

const VALID_SOURCES = ['university_portal', 'university_email', 'agent_portal', 'api', 'upload', 'other_authorized'] as const;

function isPartner(auth: AuthContext): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

function canReadOfferLetters(auth: AuthContext): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer', 'visa_officer', 'counselor'].some((role) => roles.includes(role))
    || auth.permissions.includes('application.view_offer')
    || auth.permissions.includes('application.manage_offer');
}

function canManageOfferLetters(auth: AuthContext): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return ['super_admin', 'admin', 'application_manager', 'application_team'].some((role) => roles.includes(role))
    || auth.permissions.includes('application.manage_offer');
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    if (!canReadOfferLetters(auth) || isPartner(auth)) return NextResponse.json({ success: false, error: 'Offer-letter access is not permitted.' }, { status: 403 });

    const applicationId = req.nextUrl.searchParams.get('applicationId');
    if (!applicationId) return NextResponse.json({ success: false, error: 'applicationId is required.' }, { status: 400 });
    const app = await db.application.findUnique({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    const roles = auth.roles.map((role) => role.toLowerCase());
    if (roles.includes('counselor') && !roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) && app.counselorId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Application is not assigned to this counselor.' }, { status: 403 });
    }

    const withRequirements = req.nextUrl.searchParams.get('withRequirements') === 'true';
    const records = await db.applicationOffer.findMany({ where: { applicationId }, orderBy: { createdAt: 'desc' } });
    const offers = await Promise.all(records.map(async (offer) => {
      const safe = { ...offer, offerLetterUrl: await sanitizeApplicationDocumentLink(db, app.studentId, offer.offerLetterUrl) };
      if (!withRequirements) return safe;
      const requirements = analyzePostOfferRequirements(
        typeof offer.conditions === 'string' ? (() => { try { const parsed = JSON.parse(offer.conditions); return Array.isArray(parsed) ? parsed : offer.conditions; } catch { return offer.conditions; } })() : offer.conditions,
      );
      const completed = Array.isArray((offer as any).conditionsCompleted) ? (offer as any).conditionsCompleted : [];
      return { ...safe, postOfferRequirements: requirements, visaGate: checkPostOfferGate(requirements, completed, 'visa'), paymentGate: checkPostOfferGate(requirements, completed, 'payment') };
    }));
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error('[employee-offer-letters] read failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Offer letters are temporarily unavailable.' }, { status: 503 });
  }
}

const offerUploadBodySchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  // Backward-compatible field name; must be a Document ID or the private
  // /api/documents/:id/download path, never a public URL or filesystem path.
  filePath: z.string().trim().min(1).max(1000),
  universityName: z.string().trim().max(191).optional(),
  courseName: z.string().trim().max(191).optional(),
  campus: z.string().trim().max(191).optional(),
  intake: z.string().trim().max(191).optional(),
  offerType: z.string().trim().max(100).optional(),
  conditions: z.string().max(10000).optional(),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receivedSource: z.enum(VALID_SOURCES).optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    if (!canManageOfferLetters(auth) || isPartner(auth)) {
      return NextResponse.json({ success: false, error: 'ALO application-team offer-management permission required.' }, { status: 403 });
    }

    const parsed = offerUploadBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid offer-letter update.', details: parsed.error.flatten() }, { status: 400 });
    const body = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id: body.applicationId } });
      if (!app) throw Object.assign(new Error('Application not found.'), { code: 'APPLICATION_NOT_FOUND' });
      const prior = await tx.applicationOffer.findUnique({ where: { applicationId: body.applicationId } });
      if (prior?.status === 'VERIFIED') throw Object.assign(new Error('A VERIFIED offer is immutable; use the authorized supersede/review workflow.'), { code: 'VERIFIED_IMMUTABLE' });
      const privateLink = await resolveApplicationDocumentLink(tx, app.studentId, body.filePath);
      const documentVersion = (prior?.documentVersion || 0) + 1;
      const offer = await tx.applicationOffer.upsert({
        where: { applicationId: body.applicationId },
        create: {
          applicationId: body.applicationId,
          offerLetterUrl: privateLink,
          universityName: body.universityName || '',
          courseName: body.courseName || '',
          campus: body.campus || '',
          intake: body.intake || '',
          offerType: body.offerType || '',
          conditions: body.conditions || '',
          offerDate: body.receivedDate || new Date().toISOString().slice(0, 10),
          receivedSource: body.receivedSource || '',
          receivedBy: auth.userId,
          receivedAt: new Date(),
          documentVersion: documentVersion,
          createdBy: auth.userId,
          status: 'PENDING',
        },
        update: {
          offerLetterUrl: privateLink,
          universityName: body.universityName || '',
          courseName: body.courseName || '',
          campus: body.campus || '',
          intake: body.intake || '',
          offerType: body.offerType || '',
          conditions: body.conditions || '',
          offerDate: body.receivedDate || new Date().toISOString().slice(0, 10),
          receivedSource: body.receivedSource || '',
          receivedBy: auth.userId,
          receivedAt: new Date(),
          documentVersion,
          status: 'PENDING',
        },
      });
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: prior ? 'OFFER_LETTER_SUPERSEDED' : 'OFFER_LETTER_CREATED',
          resource: 'ApplicationOffer',
          resourceId: offer.id,
          studentId: app.studentId,
          actorRole: auth.roles[0] || '',
          details: JSON.stringify({ applicationId: body.applicationId, documentVersion, receivedSource: body.receivedSource || '', linkedPrivateDocument: true }),
        },
      });
      return { offer, prior };
    });

    return NextResponse.json({
      success: true,
      data: result.offer,
      message: result.prior
        ? `Offer re-recorded as v${result.offer.documentVersion}; previous private document record remains intact — pending verification.`
        : 'Offer recorded with verified private-document linkage — pending human verification.',
    });
  } catch (error: any) {
    if (error instanceof PrivateApplicationDocumentError) return NextResponse.json({ success: false, error: error.message, code: 'PRIVATE_DOCUMENT_REQUIRED' }, { status: 400 });
    if (error?.code === 'APPLICATION_NOT_FOUND') return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    if (error?.code === 'VERIFIED_IMMUTABLE') return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 409 });
    console.error('[employee-offer-letters] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Offer letter could not be recorded.' }, { status: 503 });
  }
}
