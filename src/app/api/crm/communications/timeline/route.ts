import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const studentId = searchParams.get('studentId');
    const partnerId = searchParams.get('partnerId');
    const applicationId = searchParams.get('applicationId');
    const documentId = searchParams.get('documentId');
    const visaFileId = searchParams.get('visaFileId');
    const campaignId = searchParams.get('campaignId');
    const taskId = searchParams.get('taskId');
    const b2bProviderId = searchParams.get('b2bProviderId');

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (studentId) where.studentId = studentId;
    if (partnerId) where.partnerId = partnerId;
    if (applicationId) where.applicationId = applicationId;
    if (documentId) where.documentId = documentId;
    if (visaFileId) where.visaFileId = visaFileId;
    if (campaignId) where.campaignId = campaignId;
    if (taskId) where.taskId = taskId;
    if (b2bProviderId) where.b2bProviderId = b2bProviderId;

    // Enforce role-based visibility filter on database side
    const userType = auth.userType || 'STUDENT';
    const isSuperAdmin = auth.roles.includes('super_admin');

    if (!isSuperAdmin) {
      if (userType === 'STUDENT') {
        where.visibility = { in: ['public_safe', 'student_visible'] };
      } else if (userType === 'PARTNER') {
        where.visibility = { in: ['public_safe', 'partner_visible'] };
      } else if (auth.roles.includes('counselor')) {
        where.visibility = { notIn: ['b2b_confidential', 'super_admin_only'] };
      } else if (auth.roles.includes('marketing_manager')) {
        where.visibility = { in: ['public_safe', 'marketing_visible', 'student_visible'] };
      }
    }

    const messages = await db.communicationMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch communication timeline' },
      { status: 500 }
    );
  }
});
