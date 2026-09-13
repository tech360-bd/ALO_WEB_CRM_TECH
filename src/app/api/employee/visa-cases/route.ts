import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisaOfficer = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('visa_interview_officer');

    if (!isSuper && !isVisaOfficer && !auth.roles.includes('counselor')) {
      return NextResponse.json({ success: false, error: 'Visa Officer or Counselor required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get('riskLevel');
    const stage = searchParams.get('stage');

    const where: any = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (stage) where.currentStage = stage;
    if (!isSuper && auth.roles.includes('counselor')) {
      where.counselorId = auth.userId;
    }

    const cases = await db.visaCase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }).catch(() => []);

    return NextResponse.json({ success: true, cases, count: cases.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
