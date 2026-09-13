import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { threadId, conversationId, toEmployeeId, reason } = body;
    const finalThreadId = threadId || conversationId;
    if (!finalThreadId || !toEmployeeId) return NextResponse.json({ success: false, error: 'threadId and toEmployeeId required' }, { status: 400 });

    let thread = await db.communicationThread.findUnique({ where: { id: finalThreadId } }).catch(() => null) ||
                 await db.uccConversation.findUnique({ where: { id: finalThreadId } }).catch(() => null);

    if (!thread) return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });

    // Update assignment
    try {
      await db.communicationThread.update({ where: { id: finalThreadId }, data: { assignedToId: toEmployeeId, status: 'assigned' } });
    } catch {
      try { await db.uccConversation.update({ where: { id: finalThreadId }, data: { assignedTo: toEmployeeId, status: 'assigned' } }); } catch {}
    }

    // Create task for new assignee
    await db.counselorTask.create({
      data: {
        employeeId: toEmployeeId,
        studentId: (thread as any).studentId || '',
        title: `Handover: ${reason || 'Conversation transferred'}`,
        description: `Transferred from ${auth.name} (${auth.userId}) - Reason: ${reason || 'N/A'}`,
        type: 'handover',
        priority: 'high',
        status: 'pending',
      },
    }).catch(() => {});

    await db.aloAuditLog.create({
      data: {
        studentId: (thread as any).studentId || '',
        actorType: auth.roles[0] || 'counselor',
        actorName: auth.name || auth.userId,
        action: 'THREAD_HANDOVER',
        resource: 'CommunicationThread',
        resourceId: finalThreadId,
        details: JSON.stringify({ from: auth.userId, to: toEmployeeId, reason }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Thread handed over' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
