import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { canViewB2B, anonymizeTimelineEvent } from '@/lib/application-manager/service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  if (authRes.type === 'student' && app.studentId !== authRes.data.studentId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let canViewB2BFlag = false;
  if (authRes.type === 'portal') {
    canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
  }

  // Fetch from both old timelineEvent and new applicationStatusLog
  const [statusLogs, oldTimeline] = await Promise.all([
    db.applicationStatusLog.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' } }),
    db.timelineEvent.findMany({ where: { studentId: app.studentId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
  ]);

  const anonymized = statusLogs.map((log: any) => anonymizeTimelineEvent(log, canViewB2BFlag));

  // Filter out B2B confidential for unauthorized
  const filtered = canViewB2BFlag ? anonymized : anonymized.filter((log: any) => log.visibility !== 'B2B_CONFIDENTIAL' && log.visibility !== 'b2b_confidential');

  return NextResponse.json({ success: true, data: filtered, timeline: filtered, oldTimeline });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') return NextResponse.json({ success: false, error: 'Students cannot create timeline events' }, { status: 403 });

  const body = await req.json();

  const canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
  if ((body.visibility === 'B2B_CONFIDENTIAL' || body.isB2bConfidential) && !canViewB2BFlag) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B timeline requires permission' }, { status: 403 });
  }

  const event = await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: body.oldStatus || '',
      newStatus: body.newStatus || body.stage || 'NOTE',
      safeStatus: body.safeStatus || 'UNDER_REVIEW',
      changedBy: authRes.data.userId,
      visibility: body.visibility || 'public_safe',
      note: body.note || body.description || body.title || '',
    },
  });

  return NextResponse.json({ success: true, data: event, timeline: event });
}
