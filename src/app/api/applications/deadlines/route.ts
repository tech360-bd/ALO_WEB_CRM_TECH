import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const applicationId = searchParams.get('applicationId');
  const due = searchParams.get('due'); // TODAY, 3_DAYS, 7_DAYS, OVERDUE

  const where: any = {};
  if (status) where.status = status;
  if (type) where.deadlineType = type;
  if (applicationId) where.applicationId = applicationId;

  if (due) {
    const now = new Date();
    if (due === 'OVERDUE') where.deadlineDate = { lt: now };
    else if (due === 'DUE_TODAY') {
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
      where.deadlineDate = { gte: today, lt: tomorrow };
    } else if (due === '3_DAYS') {
      where.deadlineDate = { lte: new Date(Date.now() + 3*86400000), gte: now };
    } else if (due === '7_DAYS') {
      where.deadlineDate = { lte: new Date(Date.now() + 7*86400000), gte: now };
    }
  }

  const records = await db.applicationDeadline.findMany({
    where,
    include: { application: { select: { applicationCode: true, studentId: true, universityName: true, courseName: true, country: true } } },
    orderBy: { deadlineDate: 'asc' },
  });

  // Calculate SLA status
  const withSla = records.map((r: any) => {
    const diff = new Date(r.deadlineDate).getTime() - Date.now();
    let slaStatus = 'ON_TRACK';
    if (diff < 0) slaStatus = 'OVERDUE';
    else if (diff <= 86400000) slaStatus = 'DUE_TODAY';
    else if (diff <= 3*86400000) slaStatus = 'DUE_IN_3_DAYS';
    else if (diff <= 7*86400000) slaStatus = 'DUE_IN_7_DAYS';
    return { ...r, slaStatus };
  });

  return NextResponse.json({ success: true, data: withSla, deadlines: withSla });
});

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  if (!body.applicationId || !body.deadlineDate) {
    return NextResponse.json({ success: false, error: 'applicationId and deadlineDate required' }, { status: 400 });
  }

  const validTypes = ['APPLICATION_DEADLINE', 'DOCUMENT_DEADLINE', 'OFFER_CONDITION_DEADLINE', 'DEPOSIT_DEADLINE', 'CAS_DEADLINE', 'I20_DEADLINE', 'COE_DEADLINE', 'B2B_FOLLOWUP_DEADLINE', 'UNIVERSITY_FOLLOWUP_DEADLINE'];
  if (body.deadlineType && !validTypes.includes(body.deadlineType)) {
    return NextResponse.json({ success: false, error: `Invalid deadlineType. Must be one of ${validTypes.join(', ')}` }, { status: 400 });
  }

  const record = await db.applicationDeadline.create({
    data: {
      applicationId: body.applicationId,
      deadlineType: body.deadlineType || 'APPLICATION_DEADLINE',
      deadlineDate: new Date(body.deadlineDate),
      status: body.status || 'PENDING',
      assignedTo: body.assignedTo || auth.userId,
      note: body.note || '',
    },
  });

  await logAuditAction(auth, 'CREATE_DEADLINE', 'ApplicationDeadline', record.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'CREATE_DEADLINE',
      resource: 'ApplicationDeadline',
      resourceId: record.id,
      details: JSON.stringify({ applicationId: body.applicationId, deadlineType: body.deadlineType }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: record, deadline: record });
});
