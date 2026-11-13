import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { createFollowUpScheduleForStudent, processDueFollowUps } from '@/lib/whatsapp-followup-engine';
import { getScopeForAuth } from '@/lib/data-scope';

const PRIVILEGED = new Set(['SUPER_ADMIN']);

async function allowedStudentCounselors(auth: AuthContext): Promise<{ all: boolean; userIds: string[] }> {
  const scope = getScopeForAuth(auth);
  if (scope === 'ALL') return { all: true, userIds: [] };
  const isBranchManager = auth.roles.some((role) => role.toLowerCase() === 'branch_manager');
  if (scope === 'BRANCH' && auth.branch && isBranchManager) {
    const employees = await db.employee.findMany({ where: { branch: auth.branch, status: 'active' }, select: { userId: true } });
    return { all: false, userIds: employees.map((employee) => employee.userId) };
  }
  return { all: false, userIds: [auth.userId] };
}

async function canAccessStudent(auth: AuthContext, student: { counselorId: string | null }): Promise<boolean> {
  const allowed = await allowedStudentCounselors(auth);
  return allowed.all || allowed.userIds.includes(student.counselorId || '');
}

export const GET = withAuth(async (req, auth) => {
  if (!auth.permissions.includes('c1') && !auth.permissions.includes('c2') && !auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'WhatsApp follow-up view permission required.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const requestedStudent = searchParams.get('studentId')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const day = searchParams.get('day')?.trim() || '';
    const allowed = await allowedStudentCounselors(auth);
    let studentIds: string[] | undefined;
    if (!allowed.all) {
      const students = await db.student.findMany({ where: { counselorId: { in: allowed.userIds } }, select: { id: true, studentId: true } });
      studentIds = students.map((student) => student.id);
      if (requestedStudent) {
        const selected = students.find((student) => student.id === requestedStudent || student.studentId === requestedStudent);
        if (!selected) return NextResponse.json({ success: false, error: 'Student not found in your assigned scope.' }, { status: 404 });
        studentIds = [selected.id];
      }
    } else if (requestedStudent) {
      const selected = await db.student.findFirst({ where: { OR: [{ id: requestedStudent }, { studentId: requestedStudent }] }, select: { id: true } });
      studentIds = selected ? [selected.id] : [];
    }
    const where: any = {};
    if (studentIds) where.studentId = { in: studentIds };
    if (status) where.status = status;
    if (day && /^\d+$/.test(day)) where.scheduledDay = Number(day);
    const schedules = await db.whatsAppFollowUpSchedule.findMany({ where, orderBy: { scheduledAt: 'asc' }, take: 100 });
    return NextResponse.json({ success: true, schedules });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp follow-up schedules could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid request body is required.' }, { status: 400 });
  const { action } = body;

  if (action === 'create_for_student') {
    if (!auth.permissions.includes('c2') && !auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
      return NextResponse.json({ success: false, error: 'WhatsApp send permission required.' }, { status: 403 });
    }
    const requestedStudentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '';
    if (!requestedStudentId || !contactPhone) return NextResponse.json({ success: false, error: 'studentId and contactPhone are required.' }, { status: 400 });
    const student = await db.student.findFirst({ where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] }, select: { id: true, counselorId: true, phone: true } });
    if (!student) return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessStudent(auth, student))) return NextResponse.json({ success: false, error: 'Student is outside your assignment or branch scope.' }, { status: 403 });
    const created = await createFollowUpScheduleForStudent({ studentId: student.id, leadId: typeof body.leadId === 'string' ? body.leadId : undefined, contactPhone, country: typeof body.country === 'string' ? body.country : undefined, intake: typeof body.intake === 'string' ? body.intake : undefined });
    return NextResponse.json({ success: true, created, count: created.length, message: created.length ? undefined : 'No schedules created: verify current promotional consent, contact identity, application status, and active approved template.' });
  }

  if (action === 'process_due') {
    if (!PRIVILEGED.has(auth.userType.toUpperCase()) && !auth.roles.some((role) => ['super_admin', 'admin'].includes(role.toLowerCase()))) {
      return NextResponse.json({ success: false, error: 'Administrator access is required to process due follow-ups.' }, { status: 403 });
    }
    const results = await processDueFollowUps();
    return NextResponse.json({ success: true, results, processed: results.length });
  }

  if (action === 'pause' || action === 'cancel') {
    const scheduleId = typeof body.scheduleId === 'string' ? body.scheduleId.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : '';
    if (!scheduleId) return NextResponse.json({ success: false, error: 'scheduleId is required.' }, { status: 400 });
    const schedule = await db.whatsAppFollowUpSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) return NextResponse.json({ success: false, error: 'Schedule not found.' }, { status: 404 });
    const student = await db.student.findUnique({ where: { id: schedule.studentId }, select: { counselorId: true } });
    if (!student || !(await canAccessStudent(auth, student))) return NextResponse.json({ success: false, error: 'Schedule is outside your assignment or branch scope.' }, { status: 403 });
    const updated = await db.whatsAppFollowUpSchedule.update({ where: { id: schedule.id }, data: { status: action === 'pause' ? 'paused' : 'cancelled', isPaused: action === 'pause', pauseReason: reason || `${action} by authorized user` } });
    await db.auditLog.create({ data: { userId: auth.userId, action: action === 'pause' ? 'WHATSAPP_FOLLOWUP_PAUSED' : 'WHATSAPP_FOLLOWUP_CANCELLED', resource: 'WhatsAppFollowUpSchedule', resourceId: schedule.id, actorRole: auth.roles.join(','), details: JSON.stringify({ studentId: schedule.studentId, reason }) } }).catch(() => {});
    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
});
