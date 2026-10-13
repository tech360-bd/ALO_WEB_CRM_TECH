import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET — List VoIP calls                                               */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const outcome = searchParams.get('outcome');
  const direction = searchParams.get('direction');
  const agentId = searchParams.get('agentId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  try {
    // Use the CommunicationCall model if it exists, otherwise return mock data
    // The existing schema has communications/calls routes
    const where: any = {};
    if (outcome) where.outcome = outcome;
    if (direction) where.direction = direction;
    if (agentId) where.assignedToId = agentId;

    const [calls, total] = await Promise.all([
      db.communicationCall.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          contact: { select: { id: true, name: true, phone: true, email: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      db.communicationCall.count({ where }),
    ]);

    // Compute call analytics
    const [totalCalls, answeredCalls, avgDurationResult] = await Promise.all([
      db.communicationCall.count(),
      db.communicationCall.count({ where: { outcome: 'ANSWERED' } }),
      db.communicationCall.aggregate({
        _avg: { duration: true },
        where: { outcome: 'ANSWERED' },
      }),
    ]);

    const connectionRate = totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : '0.0';
    const avgDuration = avgDurationResult._avg.duration || 0;

    return NextResponse.json({
      success: true,
      calls,
      analytics: {
        totalCalls,
        answeredCalls,
        connectionRate: parseFloat(connectionRate),
        avgDuration: Math.round(avgDuration),
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch VoIP calls' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create / log a VoIP call                                     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, direction, outcome, duration, notes, recordingUrl, scheduledAt, assignedToId } = body;

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required.' },
        { status: 400 },
      );
    }

    const call = await db.communicationCall.create({
      data: {
        contactId,
        direction: direction || 'OUTBOUND',
        outcome: outcome || 'PENDING',
        duration: duration || 0,
        notes: notes || null,
        recordingUrl: recordingUrl || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        assignedToId: assignedToId || null,
      },
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Call logged',
      call,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log call' },
      { status: 500 },
    );
  }
}
