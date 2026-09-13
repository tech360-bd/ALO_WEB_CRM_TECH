import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;
    const body = await req.json();
    const { status, notes, scheduledAt } = body;

    const existing = await db.appointment.findUnique({ where: { id } }).catch(() => null);
    if (!existing) return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });

    const updated = await db.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
    });

    await logAuditAction(auth, 'APPOINTMENT_UPDATED', 'Appointment', id, { status });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { id } = params;
    const appt = await db.appointment.findUnique({ where: { id } }).catch(() => null);
    if (!appt) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: appt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;
    await db.appointment.delete({ where: { id } }).catch(() => null);
    await logAuditAction(auth, 'APPOINTMENT_DELETED', 'Appointment', id, {});
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
