import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// SLA status constants
const SLA_THRESHOLDS = {
  WARNING_PERCENT: 0.67,  // warning at 67% of SLA time consumed
  URGENT_PERCENT: 0.93,   // urgent at 93%
  INCIDENT_BREACH_COUNT: 5, // incidents before warning
};

function getSlaStatus(slaDueAt: Date | null): 'normal' | 'warning' | 'urgent' | 'overdue' | 'critical' {
  if (!slaDueAt) return 'normal';
  const now = new Date();
  const diff = slaDueAt.getTime() - now.getTime();
  if (diff <= 0) return 'overdue';
  return 'normal';
}

// GET: SLA status overview and per-counselor metrics
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const counselorId = searchParams.get('counselorId') || '';
      const period = searchParams.get('period') || '2026-08';

      const now = new Date();

      // Overdue threads across all channels
      const overdueThreads = await db.communicationThread.findMany({
        where: { slaDueAt: { lt: now }, status: { not: 'resolved' } },
        select: { id: true, channel: true, slaStatus: true, assignedToId: true, assignedToName: true, studentId: true, slaDueAt: true },
        orderBy: { slaDueAt: 'asc' },
        take: 50,
      });

      // SLA events for counselor
      const slaEvents = counselorId
        ? await db.communicationSlaEvent.findMany({
            where: { counselorId },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : [];

      // Counselor response metrics
      const metrics = counselorId
        ? await db.counselorResponseMetric.findFirst({ where: { counselorId, periodMonth: period } })
        : null;

      // Incidents for counselor
      const incidents = counselorId
        ? await db.communicationSlaIncident.findMany({
            where: { counselorId },
            include: { justification: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [];

      const summary = {
        totalOverdue: overdueThreads.length,
        byCounselor: overdueThreads.reduce((acc: any, t) => {
          const key = t.assignedToId || 'unassigned';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      };

      return NextResponse.json({
        success: true,
        overdueThreads,
        slaEvents,
        metrics,
        incidents,
        summary,
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to load SLA data' }, { status: 500 });
    }
  })(request);
}

// POST: Trigger SLA check, escalation, or justification actions
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { action, threadId, incidentId, counselorId, justificationData } = body;

      if (action === 'start_sla') {
        // Start SLA timer for a newly received message thread
        const rule = await db.communicationSlaRule.findFirst({
          where: { status: 'active' },
        });
        const slaMinutes = rule?.firstResponseMinutes || 30;
        const slaDueAt = new Date(Date.now() + slaMinutes * 60000);

        await db.communicationThread.update({
          where: { id: threadId },
          data: { slaDueAt, slaStatus: 'normal', slaTriggeredAt: new Date() },
        });

        await db.communicationSlaEvent.create({
          data: {
            threadId,
            counselorId: counselorId || '',
            slaMinutes,
            receivedAt: new Date(),
            slaDueAt,
            slaStatus: 'normal',
          },
        });

        return NextResponse.json({ success: true, slaDueAt, slaMinutes });
      }

      if (action === 'escalate') {
        await db.communicationThread.update({
          where: { id: threadId },
          data: { slaStatus: 'overdue', needsHumanTakeover: true },
        });

        await db.communicationSlaEvent.updateMany({
          where: { threadId, slaStatus: { not: 'resolved' } },
          data: { slaStatus: 'overdue', escalatedAt: new Date() },
        });

        return NextResponse.json({ success: true, message: 'Escalation created' });
      }

      if (action === 'submit_justification' && incidentId && justificationData) {
        const j = await db.communicationSlaJustification.create({
          data: {
            incidentId,
            counselorId: auth.userId || '',
            reason: justificationData.reason || '',
            explanation: justificationData.explanation || '',
            evidence: justificationData.evidence || '',
          },
        });
        await db.communicationSlaIncident.update({
          where: { id: incidentId },
          data: { status: 'under_review' },
        });
        return NextResponse.json({ success: true, justification: j });
      }

      if (action === 'manager_review' && incidentId) {
        const { decision, reviewNote } = body;
        await db.communicationSlaJustification.updateMany({
          where: { incidentId },
          data: {
            reviewedBy: auth.userId || '',
            reviewedAt: new Date(),
            reviewDecision: decision,
            reviewNote: reviewNote || '',
          },
        });
        await db.communicationSlaIncident.update({
          where: { id: incidentId },
          data: { status: 'resolved' },
        });
        return NextResponse.json({ success: true, message: 'Manager review recorded' });
      }

      return NextResponse.json({ success: false, error: 'Unknown SLA action' }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'SLA action failed' }, { status: 500 });
    }
  })(request);
}
