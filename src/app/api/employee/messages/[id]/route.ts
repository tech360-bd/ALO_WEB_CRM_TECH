import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { id } = params;
    const msg = await db.communicationMessage.findUnique({ where: { id } }).catch(() => null) ||
                await db.uccMessage.findUnique({ where: { id } }).catch(() => null);
    if (!msg) return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: msg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;
    const body = await req.json();
    const { isRead, status } = body;

    let updated;
    try {
      updated = await db.communicationMessage.update({ where: { id }, data: { isRead: isRead ?? true, status: status || 'read' } });
    } catch {
      updated = await db.uccMessage.update({ where: { id }, data: { status: status || 'read' } }).catch(() => null);
    }

    await logAuditAction(auth, 'MESSAGE_READ', 'CommunicationMessage', id, {});
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
