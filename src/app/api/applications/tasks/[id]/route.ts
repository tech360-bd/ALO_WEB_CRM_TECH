import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const task = await db.applicationTask.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ success: true, data: task });
});
