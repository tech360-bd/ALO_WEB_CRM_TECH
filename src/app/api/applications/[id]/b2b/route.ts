import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const app = await db.b2bApplication.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ success: true, data: app });
});
