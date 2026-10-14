import { communicationScope } from '@/lib/communication/access-scope';
import {
  resolveSlaPolicy,
  evaluateSlaClock,
  computeResponseMetrics,
  toSlaChannel,
  toSlaPriority,
  toSlaIntent,
} from '@/lib/communications/sla-policy';
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
      if (slaStatus) {
        // §148 vocabulary is normal | warning | overdue | critical. Stored rows use
        // a wider legacy set, so map the requested state onto every spelling that
        // can legitimately display as it.
        if (slaStatus === 'critical') where.slaStatus = { in: ['critical', 'overdue', 'urgent', 'sla_overdue'] };
        else if (slaStatus === 'overdue') where.slaStatus = { in: ['overdue', 'urgent', 'sla_overdue', 'critical'] };
        else if (slaStatus === 'warning') where.slaStatus = { in: ['warning', 'urgent'] };
        else where.slaStatus = slaStatus;
      }
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

      // ── Contact context (batched — spec §122 asks for one workspace, not a
      //     query per row; the previous per-thread lookups were N+1) ───────────
      const studentIds = [...new Set(threads.map((t) => t.studentId).filter(Boolean))];
      const leadIds = [...new Set(threads.map((t) => t.leadId).filter(Boolean))];
      const applicationIds = [...new Set(threads.map((t) => t.applicationId).filter(Boolean))];
      const threadIds = threads.map((t) => t.id);

      const [students, leads, applications, responses] = await Promise.all([
        studentIds.length
          ? db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, studentId: true, counselorName: true, phone: true } }).catch(() => [])
          : Promise.resolve([] as any[]),
        leadIds.length
          ? db.leadForm.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, phone: true } }).catch(() => [])
          : Promise.resolve([] as any[]),
        applicationIds.length
          ? db.application.findMany({ where: { id: { in: applicationIds } }, select: { id: true, status: true, universityName: true, courseName: true } }).catch(() => [] as any[])
          : Promise.resolve([] as any[]),
        // §150 first-response tracking: the earliest staff reply per thread, in one query.
        threadIds.length
          ? db.communicationMessage.groupBy({
              by: ['threadId'],
              where: { threadId: { in: threadIds }, direction: 'outbound', isInternal: false },
              _min: { createdAt: true },
            }).catch(() => [] as any[])
          : Promise.resolve([] as any[]),
      ]);

      const studentMap = new Map(students.map((row: any) => [row.id, row]));
      const leadMap = new Map(leads.map((row: any) => [row.id, row]));
      const applicationMap = new Map(applications.map((row: any) => [row.id, row]));
      const responseMap = new Map(responses.map((row: any) => [row.threadId, row._min?.createdAt ?? null]));

      // Enrich threads with contact context and a live, policy-driven SLA clock
      const enriched = threads.map((t) => {
        let contactName = '';
        let contactId = '';
        let contactType = '';
        let contactPhone = '';
        let applicationStage = '';
        let applicationLabel = '';

        if (t.studentId) {
          const student: any = studentMap.get(t.studentId);
          if (student) {
            contactName = student.name || '';
            contactId = t.studentId;
            contactType = 'student';
            contactPhone = student.phone || '';
            applicationStage = 'active';
          }
        } else if (t.leadId) {
          const lead: any = leadMap.get(t.leadId);
          if (lead) {
            contactName = lead.name || '';
            contactId = t.leadId;
            contactType = 'lead';
            contactPhone = lead.phone || '';
          }
        }

        if (t.applicationId) {
          const application: any = applicationMap.get(t.applicationId);
          if (application) {
            applicationStage = application.status || applicationStage;
            applicationLabel = [application.universityName, application.courseName].filter(Boolean).join(' — ');
          }
        }

        const lastMsg = t.messages[0] || null;
        const lastResponseAt: Date | null = responseMap.get(t.id) ?? null;

        // §147-§149: one policy source of truth for the clock. The stored deadline
        // stays authoritative — we never rewrite history — but the STATE now comes
        // from the configurable policy ladder instead of the hard-coded 0.67/0.93
        // fractions this route used to carry.
        const policy = resolveSlaPolicy({
          // Stored channel/priority/intent are free-form; the policy layer owns
          // the canonical vocabulary (spec §147: configurable by channel,
          // priority, student type, application stage and intent).
          channel: toSlaChannel(t.channel),
          priority: toSlaPriority(t.priority),
          intent: toSlaIntent(t.intent),
          studentType: t.studentId ? 'applicant' : t.leadId ? 'lead' : undefined,
          applicationStage: applicationStage || undefined,
        });

        // The clock stops at the first staff reply: an answered conversation must
        // not keep counting down in the operator's face (§150 first response).
        const responded = !!lastResponseAt && lastResponseAt.getTime() <= now.getTime();
        const clock = t.slaDueAt
          ? evaluateSlaClock(
              t.slaDueAt,
              responded ? (lastResponseAt as Date) : now,
              policy,
            )
          : null;

        const metrics = t.slaDueAt
          ? computeResponseMetrics({
              receivedAt: t.slaTriggeredAt ?? t.createdAt,
              firstResponseAt: lastResponseAt,
              dueAt: t.slaDueAt,
              now,
            })
          : null;

        return {
          id: t.id,
          threadCode: t.threadCode,
          channel: t.channel,
          priority: t.priority,
          intent: t.intent,
          status: t.status,
          visibility: t.visibility,
          assignedToId: t.assignedToId,
          assignedToName: t.assignedToName,
          contactName,
          contactId,
          contactType,
          contactPhone,
          applicationStage,
          applicationLabel,
          lastMessage: lastMsg?.messageBody?.substring(0, 120) || t.lastMessagePreview || '',
          lastMessageAt: t.lastMessageAt,
          lastMessageDir: lastMsg?.direction,
          lastSenderName: lastMsg?.senderName,
          lastResponseAt,
          unreadCount: t.unreadCount,
          // §148 state vocabulary: normal | warning | overdue | critical
          slaState: clock?.state ?? 'none',
          slaDisplay: clock?.display ?? 'NO SLA SET',
          slaIconName: clock?.icon ?? null,
          slaAriaLabel: clock?.ariaLabel ?? 'No SLA deadline recorded for this conversation',
          slaDueAt: t.slaDueAt,
          slaSecondsRemaining: clock?.secondsRemaining ?? null,
          slaMinutes: policy.minutes,
          slaPolicyLabel: policy.label,
          slaCalendarTime: policy.calendarTime,
          slaMissing: !t.slaDueAt,
          // §150 response tracking, per conversation.
          slaResponded: responded,
          firstResponseAt: lastResponseAt,
          firstResponseMinutes: metrics?.responseTimeMs != null ? Math.round(metrics.responseTimeMs / 60000) : null,
          slaBreached: metrics?.slaBreached ?? false,
          countsAsBreach: metrics?.countsAsBreach ?? false,
        };
      });

      // Sort for the operator: worst SLA state first, then the nearest deadline.
      const STATE_RANK: Record<string, number> = { critical: 0, overdue: 1, warning: 2, normal: 3, none: 4 };
      enriched.sort((a, b) => {
        const rank = (STATE_RANK[a.slaState] ?? 5) - (STATE_RANK[b.slaState] ?? 5);
        if (rank !== 0) return rank;
        const aDue = a.slaDueAt ? new Date(a.slaDueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.slaDueAt ? new Date(b.slaDueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
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
        if (action === 'mark_resolved' && typeof body.resolutionNote === 'string' && body.resolutionNote.trim()) {
          await tx.communicationTask.create({
            data: {
              title: `Resolution record — ${thread.threadCode || threadId}`,
              description: body.resolutionNote.trim(),
              studentId: thread.studentId || null,
              applicationId: thread.applicationId || null,
              assignedTo: auth.actorUserId || null,
              status: 'RESOLVED',
              source: 'ESCALATION',
              resolution: body.resolutionNote.trim(),
              resolvedAt: new Date(),
              createdBy: auth.actorUserId || null,
            },
          }).catch(() => {});
        }
      if (action === 'mark_resolved') {
        // §158: an AI must never silently resolve a critical case — and neither
        // should a human by accident. A conversation that breached or is about to
        // breach its SLA needs an explicit, recorded resolution note.
        const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
        const breached = !!thread.slaDueAt && thread.slaDueAt.getTime() < Date.now();
        const criticalStates = ['critical', 'overdue', 'urgent', 'sla_overdue'];
        if ((breached || criticalStates.includes(String(thread.slaStatus))) && resolutionNote.length < 10) {
          return NextResponse.json({
            success: false,
            code: 'RESOLUTION_NOTE_REQUIRED',
            error: 'This conversation breached its SLA. Record what resolved it (at least 10 characters) before closing it.',
          }, { status: 409 });
        }
        await tx.communicationThread.update({
          where: { id: threadId },
          data: {
            status: 'resolved',
            unreadCount: 0,
            ...(resolutionNote ? { lastMessagePreview: thread.lastMessagePreview } : {}),
          },
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
