import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    const { id } = params;

    const existing = await db.application.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

    // RBAC: counselor can update own assigned, application_team can update any, branch_manager own branch
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const isAppTeam = auth.roles.includes('application_team') || auth.roles.includes('application_manager');
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('senior_counselor');
    
    if (!isSuper && !isAppTeam) {
      if (isCounselor && existing.counselorId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Not assigned to this application' }, { status: 403 });
      }
      if (!isCounselor) {
        return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { stage, status, notes, deadline, counselorId, applicationOfficer } = body;

    // Sensitive changes require audit
    const beforeStage = existing.stage;

    const updated = await db.application.update({
      where: { id },
      data: {
        ...(stage && { stage }),
        ...(status && { status }),
        ...(notes && { notes }),
        ...(deadline && { deadline }),
        ...(counselorId && { counselorId }),
        ...(applicationOfficer && { applicationOfficer }),
      },
    });

    // Timeline
    await db.applicationStageHistory.create({
      data: {
        applicationId: id,
        stage: stage || existing.stage,
        status: 'completed',
        note: `Stage changed from ${beforeStage} to ${stage || beforeStage} by ${auth.name}`,
        actor: auth.name,
      },
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'APPLICATION_UPDATED',
        title: `Application ${stage ? 'stage changed to ' + stage : 'updated'}`,
        description: `By ${auth.name} (${auth.roles[0]})`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'APPLICATION_STAGE_UPDATED', 'Application', id, {
      before: { stage: beforeStage },
      after: { stage: stage || beforeStage },
      studentId: existing.studentId,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;

    const app = await db.application.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // RBAC + B2B confidentiality
    const canSeeB2b = auth.roles.includes('super_admin') || auth.roles.includes('application_team') || auth.roles.includes('application_manager');
    if (!canSeeB2b) {
      const { isB2b, b2bType, b2bProviderId, ...rest } = app as any;
      return NextResponse.json({ success: true, data: rest });
    }

    return NextResponse.json({ success: true, data: app });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
