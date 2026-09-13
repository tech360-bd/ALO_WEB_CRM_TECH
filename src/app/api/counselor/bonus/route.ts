import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const where: any = { employeeId: auth.userId };
    const bonuses = await db.employeeBonus.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const total = bonuses.reduce((s, b) => s + (b.amount || 0), 0);
    return NextResponse.json({ success: true, bonuses, summary: { total, count: bonuses.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
