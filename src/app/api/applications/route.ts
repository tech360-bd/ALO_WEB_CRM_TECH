import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { logStudentEvent } from '@/lib/student-auth';

export async function GET(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  let where: any = {};

  if (authRes.type === 'student') {
    where.studentId = authRes.data.studentId;
  } else {
    const portal = authRes.data;
    if (portal.userType === 'partner') {
      where.partnerId = portal.userId;
    } else if (portal.userType === 'counselor') {
      where.counselorId = portal.userId;
    }
  }

  const applications = await db.application.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  const sanitized = applications.map(app => {
    if (authRes.type === 'student' || (authRes.type === 'portal' && !authRes.data.roles.includes('super_admin') && !authRes.data.roles.includes('application_team'))) {
      const { isB2b, b2bType, b2bProviderId, ...rest } = app;
      return rest;
    }
    return app;
  });

  return NextResponse.json({ success: true, data: sanitized });
}

export async function POST(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const body = await req.json();
  const sequence = await db.application.count();
  const applicationCode = `APP-${new Date().getFullYear()}-${String(sequence + 1).padStart(6, '0')}`;

  const newApp = await db.application.create({
    data: {
      ...body,
      applicationId: body.applicationId || applicationCode,
      studentId: authRes.type === 'student' ? authRes.data.studentId : body.studentId,
    }
  });

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'CREATE_APPLICATION', 'Application', newApp.id);
  } else {
    await logStudentEvent(authRes.data.studentId, 'CREATED_APPLICATION', { applicationId: newApp.id });
  }

  return NextResponse.json({ success: true, data: newApp });
}

export async function PATCH(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  const existing = await db.application.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  if (authRes.type === 'student' && existing.studentId !== authRes.data.studentId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const allowed = ['stage', 'status', 'notes', 'counselorId', 'counselorName', 'applicationOfficer', 'visaOfficerId', 'deadline', 'intake', 'level', 'universityName', 'courseName', 'country'] as const;
  const data = Object.fromEntries(allowed.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  const updated = await db.application.update({ where: { id }, data });
  if (authRes.type === 'portal') await logAuditAction(authRes.data, 'UPDATE_APPLICATION', 'Application', id, { fields: Object.keys(data) });
  else await logStudentEvent(authRes.data.studentId, 'UPDATED_APPLICATION', { applicationId: id, fields: Object.keys(data) });
  return NextResponse.json({ success: true, application: updated, data: updated });
}
