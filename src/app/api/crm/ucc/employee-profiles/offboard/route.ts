import { mutationOriginAllowed } from '@/lib/request-origin';
import { canUseUnscopedUccAdmin } from '@/lib/ucc/document-access';
// ============================================================
// /api/crm/ucc/employee-profiles/offboard
// POST — Securely offboard an employee:
//   1. Revoke all channel access flags
//   2. Reassign open conversations to another employee
//   3. Record offboarding in IntegrationAuditLog
//   4. Mark profile status as 'offboarded'
// RBAC: SUPER_ADMIN, ADMIN only
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (request.method !== 'GET' && !mutationOriginAllowed(request, auth)) return NextResponse.json({error:'Same-origin request required.'},{status:403});
    if (!canUseUnscopedUccAdmin(auth)) return NextResponse.json({success:false,code:'UCC_OWNERSHIP_SCOPE_PENDING',error:'Private UCC access is restricted to canonical administrators until domain-aware ownership is verified.'},{status:403});

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN'].includes(primaryRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — only SUPER_ADMIN and ADMIN can offboard employees.' },
        { status: 403 }
      );
    }

    const { employeeId, reassignToUserId, offboardingNote } = await request.json() as {
      employeeId: string;
      reassignToUserId?: string;
      offboardingNote?: string;
    };

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId is required.' }, { status: 400 });
    }

    const existingProfile = await db.employeeCommunicationProfile.findUnique({
      where: { employeeId },
    });

    if (!existingProfile) {
      return NextResponse.json({ success: false, error: 'No communication profile found for this employee.' }, { status: 404 });
    }

    if (existingProfile.status === 'offboarded') {
      return NextResponse.json({ success: false, error: 'Employee has already been offboarded.' }, { status: 409 });
    }

    // 1. Revoke all channel access
    await db.employeeCommunicationProfile.update({
      where: { employeeId },
      data: {
        status: 'offboarded',
        whatsappAccess: false,
        facebookAccess: false,
        instagramAccess: false,
        emailAccess: false,
        channelPermissions: JSON.stringify({}),
        assignedPages: JSON.stringify([]),
        offboardedAt: new Date(),
        offboardedById: auth.userId,
        offboardingNote: offboardingNote || '',
      },
    });

    // 2. Reassign open conversations
    let conversationsReassigned = 0;
    if (reassignToUserId) {
      const result = await db.uccConversation.updateMany({
        where: { assignedToUserId: employeeId, status: { in: ['open', 'pending'] } },
        data: { assignedToUserId: reassignToUserId },
      });
      conversationsReassigned = result.count;
    }

    // 3. Tamper-resistant audit log
    await db.integrationAuditLog.create({
      data: {
        actorId: auth.userId,
        actorName: auth.name || auth.email || 'Admin',
        actorRole: primaryRole,
        action: 'EMPLOYEE_OFFBOARD',
        resourceType: 'EmployeeCommunicationProfile',
        resourceId: employeeId,
        previousState: JSON.stringify({
          status: existingProfile.status,
          whatsappAccess: existingProfile.whatsappAccess,
          facebookAccess: existingProfile.facebookAccess,
          instagramAccess: existingProfile.instagramAccess,
          emailAccess: existingProfile.emailAccess,
        }),
        newState: JSON.stringify({
          status: 'offboarded',
          allAccessRevoked: true,
          reassignedTo: reassignToUserId,
          conversationsReassigned,
        }),
        result: 'success',
        metadata: JSON.stringify({ offboardingNote, offboardedAt: new Date().toISOString() }),
      },
    });

    await logAuditAction(auth, 'EMPLOYEE_OFFBOARDED', 'EmployeeCommunicationProfile', employeeId, {
      reassignToUserId,
      conversationsReassigned,
    });

    return NextResponse.json({
      success: true,
      message: `Employee offboarded successfully. All channel access revoked. ${conversationsReassigned} conversation(s) reassigned.`,
      conversationsReassigned,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
