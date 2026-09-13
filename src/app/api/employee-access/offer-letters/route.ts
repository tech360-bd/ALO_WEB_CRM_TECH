import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;

    const offers = await (db as any).offerLetter.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      offers,
      provenanceFields: ['createdBy','verifiedBy','sentBy','signedUrl','expiry','auditTrail','bankVerified'],
      note: 'University payment verified bank info — must verify before payment step',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isAppTeam = auth.roles.includes('application_team') || auth.roles.includes('application_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isAppTeam) return NextResponse.json({ success: false, error: 'Application team/manager required' }, { status: 403 });

    const body = await req.json();
    const { applicationId, filePath, universityName, courseName, intake, conditions, tuitionFee, scholarship } = body;
    if (!applicationId || !filePath) return NextResponse.json({ success: false, error: 'applicationId and filePath required' }, { status: 400 });

    const offer = await (db as any).offerLetter.create({
      data: {
        applicationId,
        filePath,
        universityName: universityName || '',
        courseName: courseName || '',
        intake: intake || '',
        conditions: conditions || '',
        tuitionFee: tuitionFee || 0,
        scholarship: scholarship || 0,
        status: 'pending_verification',
        createdBy: auth.userId,
      },
    });

    await logAuditAction(auth, 'OFFER_LETTER_CREATED', 'OfferLetter', offer.id, { applicationId, universityName });

    return NextResponse.json({ success: true, data: offer, message: 'Offer provenance tracked — createdBy logged, requires verification' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
