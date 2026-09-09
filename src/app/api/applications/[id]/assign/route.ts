import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: body
  });
  
  await logAuditAction(auth, 'ASSIGN_APPLICATION', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: updated });
});
