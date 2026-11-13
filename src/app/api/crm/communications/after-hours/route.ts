import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { handleAfterHoursMessage, getOfficeHoursStatus } from '@/lib/communication/after-hours';

const requestSchema = z.object({
  channel: z.enum(['whatsapp', 'sms', 'email', 'facebook_messenger', 'instagram_dm', 'website_chat']).default('whatsapp'),
  senderPhone: z.string().trim().max(40).optional(),
  senderEmail: z.string().trim().email().max(254).optional(),
  message: z.string().max(5000).default(''),
  leadId: z.string().max(191).optional(),
  studentId: z.string().max(191).optional(),
}).strict();

export async function GET() {
  try {
    const status = await getOfficeHoursStatus();
    return NextResponse.json({ success: true, ...status });
  } catch {
    return NextResponse.json({ success: false, error: 'Office-hours status is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const roles = auth.roles.map((role) => role.toLowerCase());
  const isPartner = Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  const canHandle = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'counselor', 'senior_counselor'].includes(role))
    || auth.permissions.includes('communication.manage');
  if (isPartner || !canHandle) return NextResponse.json({ success: false, error: 'Forbidden: communication.manage permission required' }, { status: 403 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid after-hours request', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  if (!body.leadId && !body.studentId) return NextResponse.json({ success: false, error: 'A verified leadId or studentId is required; this endpoint does not create inquiries.' }, { status: 400 });

  const isManager = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role));
  let assignedTo = '';
  if (body.leadId) {
    const lead = await db.marketingLead.findUnique({ where: { id: body.leadId }, select: { id: true, counselorId: true } });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    if (!isManager && lead.counselorId !== auth.userId) return NextResponse.json({ success: false, error: 'Lead is not assigned to this counselor.' }, { status: 403 });
    assignedTo = lead.counselorId || '';
  }
  if (body.studentId) {
    const student = await db.student.findFirst({
      where: { OR: [{ id: body.studentId }, { studentId: body.studentId }] },
      select: { id: true, studentId: true, counselorId: true },
    });
    const portalStudent = student ? null : await db.portalStudentProfile.findFirst({
      where: { OR: [{ id: body.studentId }, { studentId: body.studentId } ] },
      select: { id: true, studentId: true, counselorId: true },
    });
    const linked = student || portalStudent;
    if (!linked) return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
    if (!isManager && linked.counselorId !== auth.userId) return NextResponse.json({ success: false, error: 'Student is not assigned to this counselor.' }, { status: 403 });
    assignedTo = linked.counselorId || assignedTo;
  }

  try {
    const result = await handleAfterHoursMessage({ ...body, assignedTo });
    return NextResponse.json({
      success: true,
      isAfterHours: result.isAfterHours,
      autoReplyDraft: result.autoReply,
      autoReplyQueued: false,
      leadCreated: false,
      leadId: result.leadId,
      taskCreated: result.taskCreated,
      taskId: result.taskId,
      followUpQueued: result.followUpQueued,
      message: result.taskCreated ? 'Counselor callback task created for the next configured business opening.'
        : result.followUpQueued ? 'An existing callback task already covers this business opening.'
          : result.isAfterHours ? 'No outbound message was sent; follow-up could not be queued.' : 'Office is open; no after-hours action was taken.',
    });
  } catch (error) {
    console.error('[after-hours] request failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'After-hours follow-up could not be queued.' }, { status: 503 });
  }
}
