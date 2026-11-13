import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { appointmentStudentScope } from '@/lib/employees/appointment-access';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    const ids = await appointmentStudentScope(auth, 'view');
    const appointments = await db.appointment.findMany({ where: { studentId: { in: ids } }, orderBy: { scheduledAt: 'asc' }, take: 100 });
    return NextResponse.json({ success: true, appointments, total: appointments.length }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ success: false, error: 'Appointments are temporarily unavailable.' }, { status: 503 }); }
}
const Input = z.object({ studentId: z.string().min(1).max(191), title: z.string().trim().min(1).max(191).optional(), purpose: z.string().trim().min(1).max(191).optional(), scheduledAt: z.string().datetime({ offset: true }), venue: z.string().max(500).optional() }).strict().refine(value => value.title || value.purpose);
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const parsed = Input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A student, title and valid appointment time are required.' }, { status: 400 });
    const input = parsed.data;
    if (!(await appointmentStudentScope(auth, 'create')).includes(input.studentId)) return NextResponse.json({ success: false, error: 'Student is outside the permitted appointment scope.' }, { status: 403 });
    const appointment = await db.$transaction(async tx => {
      const created = await tx.appointment.create({ data: { studentId: input.studentId, title: input.title || input.purpose!, scheduledAt: new Date(input.scheduledAt), notes: input.venue || '', type: 'counseling', status: 'scheduled' } });
      await writePortalAudit(tx, auth, 'APPOINTMENT_CREATED', 'Appointment', created.id, { studentId: input.studentId }, req); return created;
    });
    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: 'Appointment could not be saved and audited.' }, { status: 503 }); }
}
