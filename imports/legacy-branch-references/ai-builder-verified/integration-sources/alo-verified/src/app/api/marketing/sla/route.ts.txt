import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess, requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * SLA escalation dashboard + sweep.
 * Level 1: 20 min → counselor
 * Level 2: 40 min → branch manager
 * Level 3: 50 min → super admin / CEO
 *
 * The sweep writes `logAudit` for every escalation level change.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';

    const where: Record<string, unknown> = {};
    if (!resolved) where.resolvedAt = null;

    const escalations = await db.slaEscalation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const slaConfig = await db.slaConfig.findFirst({ where: { active: true } });

    const stats = {
      level1: escalations.filter((e) => e.currentLevel >= 1).length,
      level2: escalations.filter((e) => e.currentLevel >= 2).length,
      level3: escalations.filter((e) => e.currentLevel >= 3).length,
      overdue: escalations.filter((e) => !e.resolvedAt && e.currentLevel >= 1).length,
      resolved: await db.slaEscalation.count({ where: { resolvedAt: { not: null } } }),
    };

    return NextResponse.json({ escalations, slaConfig, stats });
  } catch (error) {
    console.error('SLA GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { action } = body;

    if (action === 'resolve') {
      const { id, resolutionNote } = body;
      if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
      }
      const existing = await db.slaEscalation.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Escalation not found' }, { status: 404 });
      }
      const escalation = await db.slaEscalation.update({
        where: { id },
        data: { resolvedAt: new Date(), resolutionNote: resolutionNote || null },
      });

      await logAudit({
        userId: auth.user.id,
        action: 'whatsapp.sla.resolved',
        module: 'sla',
        recordId: escalation.id,
        oldData: existing,
        newData: escalation,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ escalation });
    }

    if (action === 'escalate') {
      const { conversationId, channel, contactIdentifier, assignedTo } = body;
      if (!contactIdentifier) {
        return NextResponse.json(
          { error: 'contactIdentifier is required' },
          { status: 400 }
        );
      }
      const escalation = await db.slaEscalation.create({
        data: {
          conversationId: conversationId || null,
          channel: channel || 'whatsapp',
          contactIdentifier,
          assignedTo: assignedTo || null,
          currentLevel: 1,
          level1EscalatedAt: new Date(),
        },
      });

      await logAudit({
        userId: auth.user.id,
        action: 'whatsapp.sla.escalation_1',
        module: 'sla',
        recordId: escalation.id,
        newData: escalation,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ escalation }, { status: 201 });
    }

    // Default: run escalation sweep
    const slaConfig = await db.slaConfig.findFirst({ where: { active: true } });
    const l1Minutes = slaConfig?.firstReminderMinutes || 20;
    const l2Minutes = slaConfig?.secondReminderMinutes || 40;
    const l3Minutes = slaConfig?.finalReminderMinutes || 50;

    const now = new Date();
    const openEscalations = await db.slaEscalation.findMany({
      where: { resolvedAt: null },
    });

    let escalated = 0;
    const escalatedIds: string[] = [];
    const escalationActions: Array<{ id: string; level: number }> = [];

    for (const e of openEscalations) {
      const created = new Date(e.createdAt);
      const minutesSince = (now.getTime() - created.getTime()) / 60000;

      if (minutesSince >= l3Minutes && e.currentLevel < 3) {
        await db.slaEscalation.update({
          where: { id: e.id },
          data: { currentLevel: 3, level3EscalatedAt: now },
        });
        escalated++;
        escalatedIds.push(e.id);
        escalationActions.push({ id: e.id, level: 3 });
      } else if (minutesSince >= l2Minutes && e.currentLevel < 2) {
        await db.slaEscalation.update({
          where: { id: e.id },
          data: { currentLevel: 2, level2EscalatedAt: now },
        });
        escalated++;
        escalatedIds.push(e.id);
        escalationActions.push({ id: e.id, level: 2 });
      } else if (minutesSince >= l1Minutes && e.currentLevel < 1) {
        await db.slaEscalation.update({
          where: { id: e.id },
          data: { currentLevel: 1, level1EscalatedAt: now },
        });
        escalated++;
        escalatedIds.push(e.id);
        escalationActions.push({ id: e.id, level: 1 });
      }
    }

    // Write one audit log per escalation level change
    for (const action of escalationActions) {
      const auditAction =
        action.level === 1
          ? 'whatsapp.sla.escalation_1'
          : action.level === 2
          ? 'whatsapp.sla.escalation_2'
          : 'whatsapp.sla.escalation_3';
      await logAudit({
        userId: auth.user.id,
        action: auditAction,
        module: 'sla',
        recordId: action.id,
        newData: { level: action.level, at: now.toISOString() },
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json({
      escalated,
      checked: openEscalations.length,
      escalationActions,
    });
  } catch (error) {
    console.error('SLA POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
