import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, counselorScope } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const ALLOWED_CALL_TYPES = new Set(['inbound', 'outbound', 'missed']);
const ALLOWED_OUTCOMES = new Set([
  'answered',
  'no_answer',
  'busy',
  'callback_requested',
  'wrong_number',
  'resolved',
  'escalated',
]);

/**
 * Call Log API — Phone Call Center
 * - GET: list call logs (paginated, filter by studentId/leadId/phone)
 * - POST: create a call log (validate phone required, generate callCode CALL-YYYY000001)
 *
 * Role gating: requireAuth (any authenticated user). Counselors are scoped via
 * counselorScope to their own assigned students/leads + calls they created.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireAuth(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '25', 10), 1),
      200
    );
    const studentId = searchParams.get('studentId') || '';
    const leadId = searchParams.get('leadId') || '';
    const partnerId = searchParams.get('partnerId') || '';
    const phone = searchParams.get('phone') || '';
    const callType = searchParams.get('callType') || '';
    const callOutcome = searchParams.get('callOutcome') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (leadId) where.leadId = leadId;
    if (partnerId) where.partnerId = partnerId;
    if (phone) where.phone = { contains: phone };
    if (callType) where.callType = callType;
    if (callOutcome) where.callOutcome = callOutcome;

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};
      if (fromDate) createdAt.gte = new Date(fromDate);
      if (toDate) createdAt.lte = new Date(toDate);
      where.createdAt = createdAt;
    }

    // RBAC scoping: counselors see only calls for their assigned students/leads
    // + calls they created themselves. counselorScope returns assignedCounselor
    // for counselor / junior_counselor roles; for everyone else (super_admin,
    // admin, branch_manager, etc.) it returns null (no scoping).
    const scope = counselorScope(auth);
    if (scope?.assignedCounselor) {
      const counselorEmployeeId = auth.user.referenceId ?? null;
      const [assignedStudents, assignedLeads] = await Promise.all([
        counselorEmployeeId
          ? db.student.findMany({
              where: { assignedCounselor: counselorEmployeeId },
              select: { id: true },
            })
          : Promise.resolve([]),
        counselorEmployeeId
          ? db.lead.findMany({
              where: { assignedTo: counselorEmployeeId },
              select: { id: true },
            })
          : Promise.resolve([]),
      ]);
      const studentIds = assignedStudents.map((s) => s.id);
      const leadIds = assignedLeads.map((l) => l.id);
      const orClauses: Record<string, unknown>[] = [{ createdById: auth.user.id }];
      if (studentIds.length) orClauses.push({ studentId: { in: studentIds } });
      if (leadIds.length) orClauses.push({ leadId: { in: leadIds } });
      where.OR = orClauses;
    }

    const [callLogs, total] = await Promise.all([
      db.callLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.callLog.count({ where }),
    ]);

    return NextResponse.json({
      callLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('call-logs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Create a new CallLog.
 * Body:
 *  - phone: string (required)
 *  - callType?: 'inbound' | 'outbound' | 'missed' (default outbound)
 *  - callOutcome?: string
 *  - durationSeconds?: number
 *  - recordingUrl?: string
 *  - note?: string
 *  - studentVisibleNote?: string
 *  - internalNote?: string
 *  - leadId?: string
 *  - studentId?: string
 *  - partnerId?: string
 *  - applicationId?: string
 *  - nextFollowUpAt?: string (ISO date)
 */
export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireAuth(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const phone = (body.phone as string | undefined)?.trim();
    if (!phone || phone.length < 4) {
      return NextResponse.json(
        { error: 'phone is required (min 4 chars)', code: 'PHONE_REQUIRED' },
        { status: 400 }
      );
    }

    const callType = (body.callType as string) || 'outbound';
    if (!ALLOWED_CALL_TYPES.has(callType)) {
      return NextResponse.json(
        {
          error: `callType must be one of inbound, outbound, missed`,
          code: 'INVALID_CALL_TYPE',
        },
        { status: 400 }
      );
    }

    const callOutcomeRaw = (body.callOutcome as string | null | undefined) ?? null;
    const callOutcome =
      callOutcomeRaw && callOutcomeRaw.length > 0 ? callOutcomeRaw : null;
    if (callOutcome && !ALLOWED_OUTCOMES.has(callOutcome)) {
      return NextResponse.json(
        { error: `callOutcome not allowed`, code: 'INVALID_OUTCOME' },
        { status: 400 }
      );
    }

    const durationSeconds =
      typeof body.durationSeconds === 'number' && body.durationSeconds >= 0
        ? Math.floor(body.durationSeconds)
        : 0;

    const leadId = (body.leadId as string | undefined)?.trim() || null;
    const studentId = (body.studentId as string | undefined)?.trim() || null;
    const partnerId = (body.partnerId as string | undefined)?.trim() || null;
    const applicationId =
      (body.applicationId as string | undefined)?.trim() || null;
    const recordingUrl =
      (body.recordingUrl as string | undefined)?.trim() || null;
    const note = (body.note as string | undefined)?.trim() || null;
    const studentVisibleNote =
      (body.studentVisibleNote as string | undefined)?.trim() || null;
    const internalNote =
      (body.internalNote as string | undefined)?.trim() || null;
    const nextFollowUpAtRaw = body.nextFollowUpAt
      ? new Date(body.nextFollowUpAt as string)
      : null;
    if (nextFollowUpAtRaw && isNaN(nextFollowUpAtRaw.getTime())) {
      return NextResponse.json(
        { error: 'nextFollowUpAt must be a valid ISO date', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    // Generate callCode: CALL-YYYY000001 (deterministic sequence via SequenceCounter)
    const year = new Date().getFullYear();
    const counterKey = `CALL_${year}`;
    const counter = await db.sequenceCounter.upsert({
      where: { counterKey },
      update: { lastValue: { increment: 1 } },
      create: { counterKey, year, lastValue: 1 },
    });
    const callCode = `CALL-${year}${counter.lastValue.toString().padStart(6, '0')}`;

    const callLog = await db.callLog.create({
      data: {
        callCode,
        phone,
        callType,
        callOutcome,
        durationSeconds,
        recordingUrl,
        note,
        studentVisibleNote,
        internalNote,
        leadId,
        studentId,
        partnerId,
        applicationId,
        nextFollowUpAt: nextFollowUpAtRaw,
        createdById: auth.user.id,
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'call.logged',
      module: 'call_center',
      recordId: callLog.id,
      newData: {
        callCode: callLog.callCode,
        phone: callLog.phone,
        callType: callLog.callType,
        callOutcome: callLog.callOutcome,
        durationSeconds: callLog.durationSeconds,
        studentId: callLog.studentId,
        leadId: callLog.leadId,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ callLog }, { status: 201 });
  } catch (error) {
    console.error('call-logs POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
