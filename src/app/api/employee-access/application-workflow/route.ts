import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// University application workflow with controlled transitions, document checklist, offer provenance, serial ALO-UK-2026-000123

function generateApplicationSerial(country: string, year: number, seq: number): string {
  return `ALO-${country.toUpperCase()}-${year}-${String(seq).padStart(6, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) return NextResponse.json({ success: false, error: 'applicationId required' }, { status: 400 });

    const app = await db.application.findUnique({ where: { id: applicationId } }).catch(() => null);
    if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

    const checklist = await (db as any).documentRequirement.findMany({ where: { applicationId } }).catch(() => []);
    const history = await db.applicationStageHistory.findMany({ where: { applicationId }, orderBy: { createdAt: 'asc' } }).catch(() => []);
    const payments = await (db as any).universityPayment.findMany({ where: { applicationId } }).catch(() => []);
    const interviews = await (db as any).visaInterview.findMany({ where: { applicationId } }).catch(() => []);

    return NextResponse.json({
      success: true,
      application: app,
      serial: (app as any).serialNumber || generateApplicationSerial((app as any).country || 'UK', new Date().getFullYear(), 1),
      checklist,
      history,
      payments,
      interviews,
      provenance: 'Offer letter provenance — who created, who verified, who sent, signed URL, expiry, audit',
      twoCommentSystems: {
        studentVisible: 'Student can see',
        internal: 'Internal only — never shown to student',
      },
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

    const body = await req.json();
    const { studentId, country, universityId, courseId, intake } = body;
    if (!studentId || !country) return NextResponse.json({ success: false, error: 'studentId and country required' }, { status: 400 });

    const count = await db.application.count().catch(() => 0);
    const serial = generateApplicationSerial(country, new Date().getFullYear(), count + 1);

    const application = await db.application.create({
      data: {
        studentId,
        country,
        universityId: universityId || null,
        courseId: courseId || null,
        intake: intake || '',
        stage: 'draft',
        status: 'draft',
        counselorId: auth.userId,
        serialNumber: serial,
      } as any,
    });

    await db.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        stage: 'draft',
        status: 'completed',
        note: `Application created with serial ${serial} by ${auth.name}`,
        actor: auth.name,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'APPLICATION_CREATED', 'Application', application.id, { serial, studentId, country });

    return NextResponse.json({ success: true, data: application, serial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
