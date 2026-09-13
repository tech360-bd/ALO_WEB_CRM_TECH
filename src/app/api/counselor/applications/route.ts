import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('branch_manager');
    if (!isCounselor) return NextResponse.json({ success: false, error: 'Counselor role required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    // Counselor sees assigned only unless super_admin
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper && auth.roles.includes('counselor')) {
      where.counselorId = auth.userId;
    }

    const applications = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Sanitize B2B confidentiality unless application_team or super_admin
    const canSeeB2b = auth.roles.includes('super_admin') || auth.roles.includes('application_team');
    const sanitized = applications.map(app => {
      if (!canSeeB2b) {
        const { isB2b, b2bType, b2bProviderId, ...rest } = app as any;
        return rest;
      }
      return app;
    });

    return NextResponse.json({ success: true, applications: sanitized, count: sanitized.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
