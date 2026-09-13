import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  if (authRes.type === 'student' && app.studentId !== authRes.data.studentId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const casRecord = await db.applicationCasI20Coe.findUnique({ where: { applicationId: params.id } });

  // Also return application cas status
  return NextResponse.json({
    success: true,
    data: casRecord,
    casI20Coe: casRecord,
    application: { casI20CoeStatus: app.casI20CoeStatus, stage: app.stage, safeStatus: app.safeStatus, country: app.country },
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') return NextResponse.json({ success: false, error: 'Students cannot manage CAS/I-20/COE' }, { status: 403 });

  const roles = authRes.data.roles || [];
  const canManage = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || authRes.data.permissions.includes('application.manage_cas_i20_coe');
  if (!canManage) return NextResponse.json({ success: false, error: 'Forbidden: manage_cas_i20_coe permission required' }, { status: 403 });

  const body = await req.json();
  const validTypes = ['CAS', 'I20', 'COE', 'LOA', 'PAL', 'OFFER_VISA_LETTER', 'CAS', 'I-20', 'COE'];
  const validStatuses = ['NOT_STARTED', 'REQUESTED', 'PENDING', 'RECEIVED', 'ISSUED', 'REJECTED'];

  if (body.documentType && !validTypes.map(t => t.toUpperCase()).includes(body.documentType.toUpperCase())) {
    // Allow but warn
  }

  const existing = await db.applicationCasI20Coe.findUnique({ where: { applicationId: params.id } });

  let record;
  if (existing) {
    record = await db.applicationCasI20Coe.update({
      where: { applicationId: params.id },
      data: {
        documentType: body.documentType || existing.documentType,
        status: body.status || existing.status,
        requestedDate: body.requestedDate ? new Date(body.requestedDate) : existing.requestedDate,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : existing.receivedDate,
        referenceNumber: body.referenceNumber ?? existing.referenceNumber,
        fileUrl: body.fileUrl ?? existing.fileUrl,
        conditionNote: body.conditionNote ?? existing.conditionNote,
        nextStep: body.nextStep ?? existing.nextStep,
        visaHandoverStatus: body.visaHandoverStatus || existing.visaHandoverStatus,
      },
    });
  } else {
    record = await db.applicationCasI20Coe.create({
      data: {
        applicationId: params.id,
        documentType: body.documentType || 'CAS',
        status: body.status || 'PENDING',
        requestedDate: body.requestedDate ? new Date(body.requestedDate) : new Date(),
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
        referenceNumber: body.referenceNumber || '',
        fileUrl: body.fileUrl || '',
        conditionNote: body.conditionNote || '',
        nextStep: body.nextStep || '',
        visaHandoverStatus: body.visaHandoverStatus || 'NOT_READY',
      },
    });
  }

  // Update application cas status and stage
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (app) {
    let newStage = app.stage;
    if (body.status === 'RECEIVED' || body.status === 'ISSUED') {
      if ((body.documentType || existing?.documentType) === 'CAS') newStage = 'CAS_RECEIVED';
      else if ((body.documentType || '').includes('I20') || (body.documentType || '').includes('I-20')) newStage = 'I20_RECEIVED';
      else if ((body.documentType || '').includes('COE')) newStage = 'COE_RECEIVED';
      else newStage = 'CAS_RECEIVED';
    } else if (body.status === 'PENDING' || body.status === 'REQUESTED') {
      if ((body.documentType || '').includes('CAS')) newStage = 'CAS_PENDING';
      else if ((body.documentType || '').includes('I20')) newStage = 'I20_PENDING';
      else if ((body.documentType || '').includes('COE')) newStage = 'COE_PENDING';
    }

    if (newStage !== app.stage) {
      await db.application.update({
        where: { id: params.id },
        data: { stage: newStage, casI20CoeStatus: body.status || app.casI20CoeStatus, safeStatus: 'VISA_PREPARATION' },
      });

      await db.applicationStatusLog.create({
        data: {
          applicationId: params.id,
          oldStatus: app.stage,
          newStatus: newStage,
          safeStatus: 'VISA_PREPARATION',
          changedBy: authRes.data.userId,
          visibility: 'public_safe',
          note: `${body.documentType || 'CAS/I-20/COE'} status: ${body.status}`,
        },
      });
    } else {
      await db.application.update({
        where: { id: params.id },
        data: { casI20CoeStatus: body.status || app.casI20CoeStatus },
      });
    }
  }

  await logAuditAction(authRes.data, 'MANAGE_CAS_I20_COE', 'Application', params.id, { documentType: body.documentType, status: body.status });
  await db.auditLog.create({
    data: {
      userId: authRes.data.userId,
      action: 'MANAGE_CAS_I20_COE',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify({ documentType: body.documentType, status: body.status }),
      actorRole: roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: record, casI20Coe: record, message: 'CAS/I-20/COE updated' });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return POST(req, { params });
}
