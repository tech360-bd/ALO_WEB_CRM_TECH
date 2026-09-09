import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  if (authRes.type === 'student' || (authRes.type === 'portal' && !authRes.data.roles.includes('super_admin') && !authRes.data.roles.includes('application_team'))) {
    const { isB2b, b2bType, b2bProviderId, ...rest } = app;
    return NextResponse.json({ success: true, data: rest });
  }

  return NextResponse.json({ success: true, data: app });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: body
  });

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'UPDATE_APPLICATION', 'Application', params.id);
  }

  return NextResponse.json({ success: true, data: updated });
}
