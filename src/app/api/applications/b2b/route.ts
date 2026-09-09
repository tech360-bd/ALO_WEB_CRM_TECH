import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const apps = await db.b2bApplication.findMany();
  return NextResponse.json({ success: true, data: apps });
});

export const POST = withAuth(async (req, auth) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const app = await db.b2bApplication.create({ data: body });
  return NextResponse.json({ success: true, data: app });
});
