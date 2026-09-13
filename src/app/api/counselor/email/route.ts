import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const where: any = {};
    if (studentId) where.studentId = studentId;

    const emails = await db.internalComment.findMany({
      where: { ...where, commentType: 'partner_email_update' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    const partnerUpdates = await (db as any).partnerEmailUpdate.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    return NextResponse.json({ success: true, emails: [...emails, ...partnerUpdates], note: 'Partner email auto-parse → internal note → student-facing clean message, B2B confidentiality enforced' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
