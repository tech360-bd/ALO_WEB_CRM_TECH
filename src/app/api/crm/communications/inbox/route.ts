import { communicationScope } from '@/lib/communication/access-scope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// UNIFIED INBOX API — All channels, SLA-sorted
// /api/crm/communications/inbox
// Requirements 145-148
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const channel = searchParams.get('channel') || '';        // all|whatsapp|email|sms|phone|portal|social
      const priority = searchParams.get('priority') || '';
      const slaStatus = searchParams.get('sla') || '';          // overdue|warning|normal
      const assigneeId = searchParams.get('assignee') || '';
      const intent = searchParams.get('intent') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

      const scope = await communicationScope(auth);
      const where: any = { AND: [scope.threads], status: { not: 'closed' } };
      if (channel && channel !== 'all') where.channel = channel;
      if (priority) where.priority = priority;
      if (slaStatus) where.slaStatus = slaStatus;
      if (assigneeId) where.assignedToId = assigneeId;
      if (intent) where.intent = intent;
      if (search) {
        where.OR = [
          { lastMessagePreview: { contains: search } },
          { studentId: { contains: search } },
          { leadId: { contains: search } },
        ];
      }

      const now = new Date();

      const [threads, total] = await Promise.all([
        db.communicationThread.findMany({
          where,
          // SLA-priority sort: overdue first, then by slaDueAt ascending, then lastMessage
          orderBy: [{ lastMessageAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            messages: {
              where: scope.messages,
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true, messageBody: true, direction: true, senderName: true,
                createdAt: true, deliveryStatus: true, isAiGenerated: true,
              },
            },
          },
        }),
        db.communicationThread.count({ where }),
      ]);

      // Enrich threads with student/lead context and live SLA
      const enriched = await Promise.all(threads.map(async (t) => {
        let contactName = '';
        let contactId = '';
        let contactType = '';
        let applicationStage = '';

        if (t.studentId) {
          const s = await db.student.findUnique({
            where: { id: t.studentId },
            select: { name: true, studentId: true, counselorName: true },
          }).catch(() => null);
          if (s) {
            contactName = s.name || '';
            contactId = t.studentId;
            contactType = 'student';
            applicationStage = 'active';
          }
        } else if (t.leadId) {
          const l = await db.leadForm.findUnique({
            where: { id: t.leadId },
            select: { name: true, id: true },
          }).catch(() => null);
          if (l) {
            contactName = l.name || '';
            contactId = t.leadId;
            contactType = 'lead';
          }
        }

        // Live SLA calculation
        let slaRemainingMs: number | null = null;
        let slaOverdueMins: number | null = null;
        let liveSlaStatus = t.slaStatus || 'normal';

        if (t.slaDueAt) {
          const diff = t.slaDueAt.getTime() - now.getTime();
          if (diff <= 0) {
            slaOverdueMins = Math.floor(Math.abs(diff) / 60000);
            liveSlaStatus = 'overdue';
          } else {
            slaRemainingMs = diff;
            const slaTotal = t.slaTriggeredAt ? t.slaDueAt.getTime() - t.slaTriggeredAt.getTime() : 30 * 60000;
            const pctConsumed = 1 - (diff / slaTotal);
            if (pctConsumed >= 0.93) liveSlaStatus = 'urgent';
            else if (pctConsumed >= 0.67) liveSlaStatus = 'warning';
            else liveSlaStatus = 'normal';
          }
        }

        const lastMsg = t.messages[0] || null;

        return {
          id: t.id,
          threadCode: t.threadCode,
          channel: t.channel,
          priority: t.priority,
          intent: t.intent,
          status: t.status,
          assignedToId: t.assignedToId,
          assignedToName: t.assignedToName,
          contactName,
          contactId,
          contactType,
          applicationStage,
          lastMessage: lastMsg?.messageBody?.substring(0, 100) || '',
          lastMessageAt: t.lastMessageAt,
          lastMessageDir: lastMsg?.direction,
          lastSenderName: lastMsg?.senderName,
          unreadCount: t.unreadCount,
          slaStatus: liveSlaStatus,
          slaDueAt: t.slaDueAt,
          slaRemainingMs,
          slaOverdueMins,
          studentId: t.studentId,
          leadId: t.leadId,
          applicationId: t.applicationId,
        };
      }));

      // Sort enriched: overdue first
      enriched.sort((a, b) => {
        const order: any = { overdue: 0, urgent: 1, warning: 2, normal: 3 };
        return (order[a.slaStatus] ?? 4) - (order[b.slaStatus] ?? 4);
      });

      // Channel summaries for sidebar
      const channelSummary = await db.communicationThread.groupBy({
        by: ['channel'],
        where: { AND: [scope.threads], status: { not: 'closed' } },
        _count: { id: true },
      }).catch(() => []);

      const overdueCount = await db.communicationThread.count({
        where: { AND: [scope.threads], slaDueAt: { lt: now }, status: { not: 'closed' } },
      });

      return NextResponse.json({
        success: true,
        threads: enriched,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        channelSummary,
        overdueCount,
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Failed to load inbox' }, { status: 500 });
    }
  })(request);
}

// POST: Mark as resolved, assign, or create task from message
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { action, threadId, assigneeId, resolution, taskData } = body;

      if (!['mark_resolved', 'assign', 'view', 'create_task'].includes(action) || typeof threadId !== 'string') {
        return NextResponse.json({ success: false, error: 'Invalid inbox action' }, { status: 400 });
      }
      const scope = await communicationScope(auth);
      const thread = await db.communicationThread.findFirst({ where: { AND: [{ id: threadId }, scope.threads] } });
      if (!thread) return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
      if (!scope.master && (!scope.staff || !auth.permissions.includes(action === 'assign' ? 'communication.assign' : 'communication.reply'))) {
        return NextResponse.json({ success: false, error: 'Communication action not permitted' }, { status: 403 });
      }
      if (!scope.master && action === 'create_task' && assigneeId && assigneeId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Task assignment not permitted' }, { status: 403 });
      }
      if (action === 'assign') {
        const target = typeof assigneeId === 'string' ? await db.employee.findUnique({ where: { userId: assigneeId }, select: { status: true, name: true } }) : null;
        if (!target || target.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Active employee required' }, { status: 400 });
        body.assigneeName = target.name;
      }
      return await db.$transaction(async tx => {
        await tx.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: `COMMUNICATION_${action.toUpperCase()}`, entityType: 'CommunicationThread', entityId: threadId } });
      if (action === 'mark_resolved') {
        await tx.communicationThread.update({
          where: { id: threadId },
          data: { status: 'resolved', unreadCount: 0 },
        });
        await tx.communicationSlaEvent.updateMany({
          where: { threadId, slaStatus: { not: 'resolved' } },
          data: { slaStatus: 'resolved', resolvedAt: new Date() },
        });
        return NextResponse.json({ success: true, message: `Thread marked as ${resolution || 'resolved'}` });
      }

      if (action === 'assign') {
        await tx.communicationThread.update({
          where: { id: threadId },
          data: { assignedToId: assigneeId || '', assignedToName: body.assigneeName || '' },
        });
        // §150 — record when the conversation was assigned; keep the FIRST
        // assignment timestamp (later re-assignment must not rewrite history).
        await tx.communicationSlaEvent.updateMany({
          where: { threadId, assignedAt: null },
          data: {
            assignedAt: new Date(),
            counselorId: assigneeId || '',
            counselorName: body.assigneeName || '',
          },
        });
        return NextResponse.json({ success: true, message: 'Thread reassigned' });
      }

      if (action === 'view') {
        // §150 — record when the conversation was FIRST opened by staff.
        await tx.communicationSlaEvent.updateMany({
          where: { threadId, firstViewedAt: null },
          data: { firstViewedAt: new Date() },
        });
        return NextResponse.json({ success: true, message: 'First view recorded' });
      }

      if (action === 'create_task' && taskData) {
        await tx.counselorTask.create({
          data: {
            employeeId: assigneeId || auth.userId || '',
            studentId: thread?.studentId || '',
            leadId: thread?.leadId || '',
            title: taskData.title || 'Follow-up required',
            description: taskData.description || '',
            priority: taskData.priority || 'normal',
            type: 'follow_up',
            status: 'pending',
            dueDate: taskData.dueDate || '',
          },
        });
        return NextResponse.json({ success: true, message: 'Task created from communication' });
      }

      return NextResponse.json({ success: false, error: 'Unknown inbox action' }, { status: 400 });
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Inbox action failed' }, { status: 500 });
    }
  })(request);
}
