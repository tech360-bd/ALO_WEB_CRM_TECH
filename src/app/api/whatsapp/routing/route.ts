import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { determineSenderNumber, MAIN_NUMBER, COO_NUMBER, OFFICIAL_NUMBERS } from '@/lib/whatsapp-number-pool';
import { db } from '@/lib/db';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const {
      studentId,
      leadId,
      counselorId,
      branch,
      department,
      isComplaint,
      isFollowUp,
      isUrgent,
      isPartner,
      partnerId,
      campaignId,
      applicationId,
      financeIssue,
      visaIssue,
      explicitNumber,
      threadId,
      conversationId,
    } = body;

    const routing = await determineSenderNumber({
      studentId,
      leadId,
      counselorId,
      branch,
      department,
      isComplaint,
      isFollowUp,
      isUrgent,
      isPartner,
      partnerId,
      campaignId,
      applicationId,
      financeIssue,
      visaIssue,
      explicitNumber,
    });

    // Log routing decision
    await db.communicationRoutingLog.create({
      data: {
        threadId: threadId || '',
        conversationId: conversationId || '',
        studentId: studentId || '',
        fromNumber: '',
        toNumber: routing.number,
        routingReason: routing.reason,
        priority: isUrgent ? 3 : isComplaint ? 2 : 1,
        assignedToId: counselorId || '',
        branch: branch || '',
        department: department || '',
        fallbackUsed: routing.fallback,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      routing,
      officialNumbers: {
        main: MAIN_NUMBER,
        coo: COO_NUMBER,
        pool: OFFICIAL_NUMBERS,
        fallback: MAIN_NUMBER,
        urgent: COO_NUMBER,
        followUp: MAIN_NUMBER,
        complaint: MAIN_NUMBER,
      },
      priority: [
        'explicit_assignment',
        'student_counselor',
        'branch_assignment',
        'department_routing',
        'purpose_specific',
        'default_fallback',
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const logs = await db.communicationRoutingLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      logs,
      officialNumbers: {
        main: MAIN_NUMBER,
        coo: COO_NUMBER,
        pool: OFFICIAL_NUMBERS,
        total: 20,
        range: '01805020100-01805020119',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
