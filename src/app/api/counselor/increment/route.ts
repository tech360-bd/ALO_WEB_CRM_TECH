import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const where: any = { employeeId: auth.userId };
    const increments = await db.employeeIncrement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, increments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
