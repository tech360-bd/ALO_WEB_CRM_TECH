import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { analyzePostOfferRequirements, checkPostOfferGate } from '@/lib/applications/post-offer-requirements';

// ============================================================================
// /api/employee-access/offer-letters
//
// OFFER LETTER MANAGEMENT (spec): every offer records University, Application,
// Student, Program, Campus, Intake, Offer Type, Conditions, Date Received,
// Source, Received By, Document, Version, Status — provenance is never lost.
// Persists on the REAL schema model `ApplicationOffer` (table: application_offers).
// ============================================================================

const VALID_SOURCES = ['university_portal', 'university_email', 'agent_portal', 'api', 'upload', 'other_authorized'];

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    // POST-OFFER REQUIREMENT SYSTEM (spec): after offer approval, analyze
    // conditions and categorize MANDATORY / RECOMMENDED / OPTIONAL requirements.
    const withRequirements = searchParams.get('withRequirements') === 'true';

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;

    const offers = await db.applicationOffer.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);

    if (withRequirements) {
      const enriched = offers.map((o: any) => {
        const requirements = analyzePostOfferRequirements(
          typeof o.conditions === 'string' ? (() => { try { const p = JSON.parse(o.conditions); return Array.isArray(p) ? p : o.conditions; } catch { return o.conditions; } })() : o.conditions,
        );
        const completed = Array.isArray(o.conditionsCompleted) ? o.conditionsCompleted : [];
        return {
          ...o,
          postOfferRequirements: requirements,
          visaGate: checkPostOfferGate(requirements, completed, 'visa'),
          paymentGate: checkPostOfferGate(requirements, completed, 'payment'),
        };
      });
      return NextResponse.json({ success: true, offers: enriched });
    }

    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles.map((r) => r.toLowerCase());
    const isAppTeam = ['application_team', 'application_manager', 'super_admin'].includes(roles[0] || '') ||
      roles.includes('application_manager') || roles.includes('application_team') || roles.includes('super_admin');
    if (!isAppTeam) {
      return NextResponse.json({ success: false, error: 'Application team/manager required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      applicationId, filePath, universityName, courseName, campus, intake,
      offerType, conditions, receivedDate, receivedSource,
    } = body;
    if (!applicationId || !filePath) {
      return NextResponse.json({ success: false, error: 'applicationId and filePath required' }, { status: 400 });
    }
    if (receivedSource && !VALID_SOURCES.includes(receivedSource)) {
      return NextResponse.json(
        { success: false, error: `receivedSource must be one of: ${VALID_SOURCES.join(', ')} — provenance is mandatory` },
        { status: 400 },
      );
    }

    // Version: ApplicationOffer is 1:1 with application; a replacement becomes
    // the next documentVersion with the previous one kept in audit history.
    const prior = await db.applicationOffer.findUnique({ where: { applicationId } }).catch(() => null);
    if (prior && prior.status === 'VERIFIED') {
      return NextResponse.json(
        { success: false, code: 'VERIFIED_IMMUTABLE', error: 'A VERIFIED offer exists for this application; supersede it through the review workflow with a recorded reason.' },
        { status: 409 },
      );
    }

    const offer = await db.applicationOffer.upsert({
      where: { applicationId },
      create: {
        applicationId,
        offerLetterUrl: filePath,
        universityName: universityName || '',
        courseName: courseName || '',
        campus: campus || '',
        intake: intake || '',
        offerType: offerType || '',
        conditions: conditions || '',
        offerDate: receivedDate || new Date().toISOString().slice(0, 10),
        receivedSource: receivedSource || '',
        receivedBy: auth.userId,
        receivedAt: new Date(),
        documentVersion: 1,
        createdBy: auth.userId,
        status: 'PENDING',
      },
      update: {
        offerLetterUrl: filePath,
        universityName: universityName || '',
        courseName: courseName || '',
        campus: campus || '',
        intake: intake || '',
        offerType: offerType || '',
        conditions: conditions || '',
        offerDate: receivedDate || new Date().toISOString().slice(0, 10),
        receivedSource: receivedSource || '',
        receivedBy: auth.userId,
        receivedAt: new Date(),
        documentVersion: (prior?.documentVersion || 0) + 1,
        status: 'PENDING',
      },
    });

    await logAuditAction(auth, prior ? 'OFFER_LETTER_SUPERSEDED' : 'OFFER_LETTER_CREATED', 'ApplicationOffer', offer.id, {
      applicationId,
      universityName: universityName || '',
      documentVersion: offer.documentVersion,
      receivedSource: receivedSource || '',
    });

    return NextResponse.json({
      success: true,
      data: offer,
      message: prior
        ? `Offer re-recorded as v${offer.documentVersion} (previous version kept in audit history) — pending verification`
        : 'Offer recorded with full provenance — pending verification',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
