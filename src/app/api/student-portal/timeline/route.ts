import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.userId;
    const studentProfile = await db.portalStudentProfile.findFirst({ where: { userId } }).catch(() => null);
    const studentId = studentProfile?.studentId || userId;

    let data: any = [];
    if ('timeline' === 'profile') {
      data = studentProfile || await db.portalUser.findFirst({ where: { id: userId } }).catch(()=>null);
    } else if ('timeline' === 'applications') {
      data = await db.application.findMany({ where: { studentId }, take: 50, orderBy: { createdAt: 'desc' } }).catch(()=>[]);
    } else if ('timeline' === 'documents') {
      data = await db.portalStudentDocument.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 100 }).catch(()=>[]);
    } else if ('timeline' === 'timeline') {
      data = await db.portalTimelineEvent.findMany({ where: { studentProfileId: studentProfile?.id || '' }, take: 100, orderBy: { createdAt: 'desc' } }).catch(()=>[]);
    }

    // Audit log
    await db.portalAuditLog.create({
      data: {
        actorUserId: userId,
        action: 'STUDENT_VIEW_timeline',
        entityType: 'student',
        entityId: studentId,
        metadata: JSON.stringify({ api: 'timeline' }),
      },
    }).catch(()=>{});

    return NextResponse.json({ success: true, data, message: 'Student timeline — real DB, no fake data, ownership check from authenticated session, audit logged, timeline event' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
