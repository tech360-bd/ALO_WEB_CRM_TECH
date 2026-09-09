import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const logs = await db.crmSourceLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
