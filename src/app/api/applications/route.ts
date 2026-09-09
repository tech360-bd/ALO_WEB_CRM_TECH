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
  const applicationCode = `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;

  const newApp = await db.application.create({
    data: {
      ...body,
      applicationCode,
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
