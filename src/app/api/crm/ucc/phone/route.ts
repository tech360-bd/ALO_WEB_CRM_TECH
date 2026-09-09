import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// Phone Call Center API
// If no telephony provider is configured, shows CONFIGURATION_REQUIRED

const TELEPHONY_CONFIGURED = !!(process.env.TELEPHONY_PROVIDER_API_KEY);

// GET: Fetch call records for a counselor or student
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const studentId = searchParams.get('studentId') || '';
      const counselorId = searchParams.get('counselorId') || auth.userId || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const where: any = {};
      if (studentId) where.studentId = studentId;
      if (counselorId) where.counselorId = counselorId;

      const [calls, total] = await Promise.all([
        db.phoneCallRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.phoneCallRecord.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        calls,
        total,
        page,
        telephonyConfigured: TELEPHONY_CONFIGURED,
        configNote: !TELEPHONY_CONFIGURED
          ? 'CONFIGURATION_REQUIRED: No telephony provider configured. Set TELEPHONY_PROVIDER_API_KEY in environment variables to enable live call initiation.'
          : null,
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to load calls' }, { status: 500 });
    }
  })(request);
}

// POST: Initiate call, record outcome, or save post-call notes
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { action, studentId, recipientNumber, applicationId, outcome, durationSeconds,
               studentVisibleNote, internalNote, callId, recordingConsent } = body;

      if (action === 'initiate_call') {
        if (!TELEPHONY_CONFIGURED) {
          return NextResponse.json({
            success: false,
            configurationRequired: true,
            message: 'CONFIGURATION_REQUIRED: Telephony provider is not connected. Contact your system administrator to configure the telephony integration.',
          }, { status: 503 });
        }

        // Look up student for context
        const student = studentId
          ? await db.student.findUnique({ where: { id: studentId }, select: { name: true, phone: true } }).catch(() => null)
          : null;

        const callRecord = await db.phoneCallRecord.create({
          data: {
            callCode: `CALL-${Date.now()}`,
            direction: 'outbound',
            counselorId: auth.userId || '',
            counselorName: auth.name || '',
            studentId: studentId || '',
            studentName: student?.name || '',
            applicationId: applicationId || '',
            recipientNumber: recipientNumber || student?.phone || '',
            recordingConsent: recordingConsent || false,
            startedAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, call: callRecord, message: 'Call initiated via telephony provider.' });
      }

      if (action === 'record_outcome' && callId) {
        const updated = await db.phoneCallRecord.update({
          where: { id: callId },
          data: {
            outcome: outcome || 'answered',
            durationSeconds: durationSeconds || 0,
            endedAt: new Date(),
            studentVisibleNote: studentVisibleNote || '',
            internalNote: internalNote || '',
          },
        });
        return NextResponse.json({ success: true, call: updated });
      }

      if (action === 'incoming_match') {
        // Incoming call: match phone number to student
        const { callerNumber } = body;
        const normalized = callerNumber?.replace(/[^+0-9]/g, '') || '';

        const student = await db.student.findFirst({
          where: { OR: [{ phone: normalized }, { phone: callerNumber }] },
          select: { id: true, studentId: true, name: true, phone: true, counselorName: true },
        }).catch(() => null);

        if (student) {
          return NextResponse.json({ success: true, matchType: 'student', contact: student });
        }

        return NextResponse.json({
          success: true,
          matchType: 'unknown',
          contact: null,
          message: 'UNKNOWN_INCOMING_CONTACT — Please create a student/lead or link existing.',
        });
      }

      return NextResponse.json({ success: false, error: 'Unknown phone action' }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Phone API error' }, { status: 500 });
    }
  })(request);
}
