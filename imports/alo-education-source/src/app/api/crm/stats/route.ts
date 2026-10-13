import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

// GET — CRM Dashboard statistics (real data from database)
export async function GET(req: NextRequest) {
  const apiAuth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'APPLICATION_TEAM', 'VISA_TEAM', 'FINANCE']);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // Role-based access: SUPER_ADMIN, ADMIN, or staff with relevant roles
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'APPLICATION_TEAM', 'VISA_TEAM', 'FINANCE'];
  if (!allowedRoles.includes(auth.user.role)) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      totalLeads,
      totalApplications,
      thisMonthLeads,
      thisMonthApplications,
      offersReceived,
      pendingDocs,
      visaApproved,
    ] = await Promise.all([
      db.student.count(),
      db.lead.count(),
      db.application.count(),
      db.lead.count({ where: { createdAt: { gte: thisMonth } } }),
      db.application.count({ where: { createdAt: { gte: thisMonth } } }),
      // Offer stages in the Application model: CONDITIONAL_OFFFER, UNCONDITIONAL_OFFER
      db.application.count({ where: { stage: { in: ['CONDITIONAL_OFFFER', 'UNCONDITIONAL_OFFER'] } } }),
      db.applicationDocument.count({ where: { status: 'MISSING' } }),
      db.visaApplication.count({ where: { status: 'APPROVED' } }),
    ]);

    // Application pipeline counts
    const pipeline = await db.application.groupBy({
      by: ['stage'],
      _count: true,
    });

    const pipelineMap: Record<string, number> = {};
    pipeline.forEach(p => { pipelineMap[p.stage] = p._count; });

    // Recent leads (last 10)
    const recentLeads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, leadId: true, fullName: true, email: true, phone: true, source: true, preferredCountry: true, status: true, createdAt: true },
    });

    // Recent timeline events
    const recentActivity = await db.timelineEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, type: true, title: true, description: true, createdAt: true, studentId: true },
    });

    // AI interactions this month — use auditLog with AI_ACTION as proxy
    const aiActionsThisMonth = await db.auditLog.count({
      where: { action: 'AI_ACTION', createdAt: { gte: thisMonth } },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalLeads,
        totalApplications,
        thisMonthLeads,
        thisMonthApplications,
        offersReceived,
        pendingDocs,
        visaApproved,
        aiActionsThisMonth,
      },
      pipeline: pipelineMap,
      recentLeads,
      recentActivity,
    });
  } catch (error) {
    console.error('CRM stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
