import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const total = await db.application.count();
  const active = await db.application.count({ where: { status: 'active' } });
  return NextResponse.json({ success: true, data: { total, active } });
});
