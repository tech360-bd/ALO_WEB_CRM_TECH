import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { appointmentStudentScope } from '@/lib/employees/appointment-access';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';

type Context = { params: { id: string } | Promise<{ id: string }> };
async function access(req: NextRequest, context: Context, action: string) {
  const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
  const { id } = await context.params;
  const appointment = await db.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ success: false, error: 'Appointment not found.' }, { status: 404 });
  if (!(await appointmentStudentScope(auth, action)).includes(appointment.studentId)) return NextResponse.json({ success: false, error: 'Appointment access denied.' }, { status: 403 });
  return { auth, appointment };
}
export async function GET(req: NextRequest, context: Context) {
  try { const result = await access(req, context, 'view'); if (result instanceof NextResponse) return result;
    return NextResponse.json({ success: true, data: result.appointment }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ success: false, error: 'Appointment unavailable.' }, { status: 503 }); }
}
const Update = z.object({ status: z.enum(['REQUESTED', 'scheduled', 'confirmed', 'completed', 'cancelled']).optional(), notes: z.string().max(2000).optional(), scheduledAt: z.string().datetime({ offset: true }).optional() }).strict();
async function mutate(req: NextRequest, context: Context, archive: boolean) {
  try {
    const result = await access(req, context, archive ? 'archive' : 'edit'); if (result instanceof NextResponse) return result;
    const { auth, appointment } = result;
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const parsed = Update.safeParse(archive ? { status: 'cancelled' } : await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid appointment update.' }, { status: 400 });
    const updated = await db.$transaction(async tx => {
      const data = await tx.appointment.update({ where: { id: appointment.id }, data: { ...parsed.data, ...(parsed.data.scheduledAt ? { scheduledAt: new Date(parsed.data.scheduledAt) } : {}) } });
      await writePortalAudit(tx, auth, archive ? 'APPOINTMENT_ARCHIVED' : 'APPOINTMENT_UPDATED', 'Appointment', data.id, { before: appointment, after: data }, req); return data;
    });
    return NextResponse.json({ success: true, data: updated });
  } catch { return NextResponse.json({ success: false, error: 'Appointment could not be saved and audited.' }, { status: 503 }); }
}
export const PATCH = (req: NextRequest, context: Context) => mutate(req, context, false);
export const DELETE = (req: NextRequest, context: Context) => mutate(req, context, true);
