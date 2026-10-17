import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// ============================================================
// GET /api/crm/dashboard
// Lightweight role-aware dashboard data endpoint.
// Returns counts and a few recent items in small sequential
// queries to keep memory usage low.
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user } = auth;

    // Resolve the employee's primary role (single query)
    const userWithRoles = await db.user.findUnique({
      where: { id: user.id },
      include: { userRoles: { include: { role: true }, take: 1 } },
    });
    const roleName = userWithRoles?.userRoles[0]?.role?.name || 'employee';
    const employeeId = user.referenceId;

    // Sequential counts — keep memory footprint minimal
    const totalLeads = await db.lead.count();
    const totalStudents = await db.student.count();
    const totalPartners = await db.partner.count();
    const totalEmployees = await db.employee.count();
    const totalApplications = await db.application.count();
    const totalUniversities = await db.university.count();
    const totalCourses = await db.course.count();
    const totalScholarships = await db.scholarship.count();
    const totalVisaFiles = await db.visaFile.count();
    const totalDocuments = await db.document.count();
    const totalPayments = await db.payment.count();
    const totalCommissions = await db.commission.count();
    const totalAiLogs = await db.aiLog.count();
    const totalTasks = await db.task.count();
    const totalAppointments = await db.appointment.count();
    const totalWhatsappNumbers = await db.whatsappNumberPool.count();
    const totalCampaigns = await db.campaign.count();
    const totalBlogPosts = await db.blogPost.count();
    const totalAuditLogs = await db.auditLog.count();
    const totalInvoices = await db.invoice.count();

    // Status-specific counts
    const activeApplications = await db.application.count({ where: { status: { in: ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer'] } } });
    const activeEmployees = await db.employee.count({ where: { status: 'active' } });
    const totalLeaveRequests = await db.leaveRequest.count();
    const pendingCommissionsCount = await db.commission.count({ where: { status: { in: ['eligible', 'requested', 'under_review'] } } });
    const paidCommissionsCount = await db.commission.count({ where: { status: 'paid' } });
    const pendingInvoicesCount = await db.invoice.count({ where: { status: 'pending' } });
    const documentsPendingReview = await db.document.count({ where: { status: 'pending' } });
    const documentsApproved = await db.document.count({ where: { status: 'approved' } });
    const documentsRejected = await db.document.count({ where: { status: 'rejected' } });
    const visaPending = await db.visaFile.count({ where: { status: { in: ['pending', 'under_review', 'documents_requested'] } } });
    const visaApproved = await db.visaFile.count({ where: { status: 'approved' } });
    const visaRejected = await db.visaFile.count({ where: { status: 'rejected' } });
    const aiLogsPending = await db.aiLog.count({ where: { status: 'pending' } });
    const aiLogsApproved = await db.aiLog.count({ where: { status: 'approved' } });
    const aiLogsRejected = await db.aiLog.count({ where: { status: 'rejected' } });
    const publishedCampaigns = await db.campaign.count({ where: { status: 'published' } });
    const draftCampaigns = await db.campaign.count({ where: { status: 'draft' } });
    const publishedBlogPosts = await db.blogPost.count({ where: { status: 'published' } });
    const draftBlogPosts = await db.blogPost.count({ where: { status: 'draft' } });
    const attendanceToday = await db.attendance.count({ where: { date: new Date() } });
    const overdueTasks = await db.task.count({ where: { status: { in: ['pending', 'in_progress'] }, dueDate: { lt: new Date() } } });
    const todayAppointments = await db.appointment.count({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(23, 59, 59, 999)) } },
    });

    // Aggregates
    const paymentsAggregate = await db.payment.aggregate({ _sum: { amount: true }, _count: true });
    const commissionsAggregate = await db.commission.aggregate({ _sum: { amount: true }, _count: true });

    // Group-by charts
    const leadsByStatus = await db.lead.groupBy({ by: ['status'], _count: { status: true } });
    const applicationsByStatus = await db.application.groupBy({ by: ['status'], _count: { status: true } });
    const leadsBySource = await db.lead.groupBy({ by: ['source'], _count: { source: true } });
    const commissionsByStatus = await db.commission.groupBy({ by: ['status'], _count: { status: true }, _sum: { amount: true } });
    const documentsByStatus = await db.document.groupBy({ by: ['status'], _count: { status: true } });
    const visaByStatus = await db.visaFile.groupBy({ by: ['status'], _count: { status: true } });

    // Recent items (limited)
    const recentLeads = await db.lead.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, leadId: true, firstName: true, lastName: true, status: true, source: true, preferredCountry: true, createdAt: true } });
    const recentApplications = await db.application.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, applicationId: true, status: true, createdAt: true, student: { select: { firstName: true, lastName: true } }, university: { select: { name: true } } } });
    const recentCommissions = await db.commission.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, amount: true, status: true, createdAt: true, partner: { select: { companyName: true } } } });
    const recentAiLogs = await db.aiLog.findMany({ take: 6, orderBy: { createdAt: 'desc' }, select: { id: true, command: true, status: true, model: true, tokensUsed: true, createdAt: true } });
    const recentAuditLogs = await db.auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, module: true, createdAt: true } });
    const upcomingAppointments = await db.appointment.findMany({ where: { date: { gte: new Date() } }, take: 5, orderBy: { date: 'asc' }, select: { id: true, title: true, date: true, duration: true } });

    // Counselor-scoped data
    let counselorData: any = null;
    if (employeeId && ['counselor', 'junior_counselor', 'branch_manager'].includes(roleName)) {
      const isCounselor = roleName === 'counselor' || roleName === 'junior_counselor';
      const cLeads = await db.lead.count({ where: isCounselor ? { assignedTo: employeeId } : {} });
      const cStudents = await db.student.count({ where: isCounselor ? { assignedCounselor: employeeId } : {} });
      const cApps = await db.application.count({ where: isCounselor ? { counselorId: employeeId } : {} });
      const cAppts = await db.appointment.findMany({
        where: { employeeId: employeeId, date: { gte: new Date() } },
        take: 5,
        orderBy: { date: 'asc' },
        select: { id: true, title: true, date: true },
      });
      const cTodays = await db.task.count({
        where: { assignedTo: employeeId, dueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(23, 59, 59, 999)) }, status: { in: ['pending', 'in_progress'] } },
      });
      const cOverdue = await db.task.count({ where: { assignedTo: employeeId, dueDate: { lt: new Date() }, status: { in: ['pending', 'in_progress'] } } });
      counselorData = {
        leadsCount: cLeads,
        studentsCount: cStudents,
        applicationsCount: cApps,
        appointments: cAppts,
        todaysFollowups: cTodays,
        overdueFollowups: cOverdue,
      };
    }

    return NextResponse.json({
      role: roleName,
      timestamp: new Date().toISOString(),
      common: {
        totalLeads, totalStudents, totalPartners, totalEmployees, totalApplications,
        totalUniversities, totalCourses, totalScholarships, totalVisaFiles, totalDocuments,
        totalInvoices, totalPayments, totalCommissions, totalAiLogs, totalTasks, totalAppointments,
        totalWhatsappNumbers, totalCampaigns, totalBlogPosts, totalAuditLogs,
        activeApplications, activeEmployees, totalLeaveRequests,
        revenue: paymentsAggregate._sum.amount || 0,
        commissionAmount: commissionsAggregate._sum.amount || 0,
        pendingCommissionsCount, paidCommissionsCount, pendingInvoicesCount,
        documentsPendingReview, documentsApproved, documentsRejected,
        visaPending, visaApproved, visaRejected,
        aiLogsPending, aiLogsApproved, aiLogsRejected,
        publishedCampaigns, draftCampaigns, publishedBlogPosts, draftBlogPosts,
        attendanceToday, overdueTasks, todayAppointments,
      },
      charts: {
        leadsByStatus: leadsByStatus.map((l) => ({ status: l.status, count: l._count.status })),
        applicationsByStatus: applicationsByStatus.map((a) => ({ status: a.status, count: a._count.status })),
        leadsBySource: leadsBySource.map((l) => ({ source: l.source || 'unknown', count: l._count.source })),
        commissionsByStatus: commissionsByStatus.map((c) => ({ status: c.status, count: c._count.status, amount: c._sum.amount || 0 })),
        documentsByStatus: documentsByStatus.map((d) => ({ status: d.status, count: d._count.status })),
        visaByStatus: visaByStatus.map((v) => ({ status: v.status, count: v._count.status })),
      },
      recent: {
        leads: recentLeads,
        applications: recentApplications,
        commissions: recentCommissions,
        aiLogs: recentAiLogs,
        auditLogs: recentAuditLogs,
        appointments: upcomingAppointments,
      },
      counselor: counselorData,
    });
  } catch (error) {
    console.error('CRM dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
