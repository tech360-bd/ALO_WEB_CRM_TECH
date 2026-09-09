import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const records = await db.b2bProvider.findMany();
  return NextResponse.json({ success: true, data: records });
});
export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const record = await db.b2bProvider.create({ data: body });
  return NextResponse.json({ success: true, data: record });
});
