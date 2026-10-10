import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM DASHBOARD API — Returns real data from database
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // Get real counts from database
      const [
        totalStudents,
        activeApplications,
        totalPartners,
        totalEmployees,
        totalUniversities,
        totalCourses,
        totalScholarships,
        pendingLeads,
        visaApproved,
        visaPending,
        documentsPending,
        unreadMessages,
      ] = await Promise.all([
        db.portalStudentProfile.count(),
        db.portalStudentApplication.count({ where: { stage: { notIn: ['enrolled', 'withdrawn', 'rejected'] } } }),
        db.partnerProfile.count(),
        db.employeeProfile.count(),
        db.crmUniversity.count(),
        db.crmCourse.count(),
        db.crmScholarship.count(),
        db.partnerLead.count({ where: { status: 'new' } }),
        db.portalStudentApplication.count({ where: { stage: 'visa_approved' } }),
        db.portalStudentApplication.count({ where: { stage: { in: ['visa_applied', 'visa_prep'] } } }),
        db.portalStudentDocument.count({ where: { status: { in: ['pending', 'pending_review', 'needs_update'] } } }),
        db.communicationMessage.count({ where: { isRead: false, senderType: 'student' } }),
      ]);

      // Get recent applications
      const recentApps = await db.portalStudentApplication.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          studentProfile: { select: { studentId: true, fullName: true } },
        },
      });

      // Get recent threads
      const recentThreads = await db.communicationThread.findMany({
        take: 10,
        orderBy: { lastMessageAt: 'desc' },
      });

      // Get task summary
      const pendingTasks = await db.counselorTask.count({ where: { status: 'pending' } });
      const overdueTasks = await db.counselorTask.count({
        where: { status: 'pending', dueDate: { lt: new Date().toISOString().split('T')[0] } },
      });

      // Get recent audit logs
      const recentLogs = await db.portalAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
      });

      const data = {
        // The counts are real database reads. There is no historical baseline
        // stored anywhere, so no period-over-period change is asserted: every
        // `change` is null and `changeMeasured` is false.
        kpis: [
          { label: 'Total Students', value: String(totalStudents), change: null, changeMeasured: false, icon: 'Users' },
          { label: 'Active Applications', value: String(activeApplications), change: null, changeMeasured: false, icon: 'FileText' },
          { label: 'Partner Organizations', value: String(totalPartners), change: null, changeMeasured: false, icon: 'Handshake' },
          { label: 'Employees', value: String(totalEmployees), change: null, changeMeasured: false, icon: 'UserCheck' },
          { label: 'Universities', value: String(totalUniversities), change: null, changeMeasured: false, icon: 'GraduationCap' },
          { label: 'Courses', value: String(totalCourses), change: null, changeMeasured: false, icon: 'BookOpen' },
          { label: 'Scholarships', value: String(totalScholarships), change: null, changeMeasured: false, icon: 'Award' },
          { label: 'Pending Leads', value: String(pendingLeads), change: null, changeMeasured: false, icon: 'Target' },
          { label: 'Visa Approved', value: String(visaApproved), change: null, changeMeasured: false, icon: 'CheckCircle' },
          { label: 'Visa Pending', value: String(visaPending), change: null, changeMeasured: false, icon: 'Clock' },
          { label: 'Documents Pending', value: String(documentsPending), change: null, changeMeasured: false, icon: 'FileCheck' },
          { label: 'Unread Messages', value: String(unreadMessages), change: null, changeMeasured: false, icon: 'MessageSquare' },
        ],
        tables: [
          {
            title: 'Recent Applications',
            columns: ['Student ID', 'Name', 'University', 'Course', 'Stage', 'Updated'],
            rows: recentApps.map(app => [
              app.studentProfile?.studentId || 'N/A',
              app.studentProfile?.fullName || 'Unknown',
              app.university,
              app.course,
              app.stage.replace(/_/g, ' '),
              app.updatedAt.toISOString().split('T')[0],
            ]),
          },
          {
            title: 'Active Communication Threads',
            columns: ['Thread ID', 'Channel', 'Status', 'Assigned To', 'Last Message', 'Unread'],
            rows: recentThreads.map(t => [
              t.id.substring(0, 8),
              t.channel,
              t.status,
              t.assignedToName || 'Unassigned',
              t.lastMessageAt.toISOString().split('T')[0],
              String(t.unreadCount),
            ]),
          },
        ],
        alerts: [
          ...(pendingTasks > 0 ? [{ message: `${pendingTasks} tasks pending`, severity: 'warning' as const, action: '/crm-tasks' }] : []),
          ...(overdueTasks > 0 ? [{ message: `${overdueTasks} overdue tasks`, severity: 'error' as const, action: '/crm-tasks' }] : []),
          ...(unreadMessages > 20 ? [{ message: `${unreadMessages} unread messages`, severity: 'warning' as const, action: '/crm-inbox' }] : []),
          { message: 'System operational', severity: 'success' as const, action: '' },
        ],
        charts: [
          {
            title: 'Applications by Stage',
            data: await getApplicationStageCounts(),
          },
          {
            title: 'Students per Month (Last 6)',
            data: await getStudentMonthlyCounts(),
          },
        ],
        recentLogs,
        meta: { generatedAt: new Date().toISOString(), role: auth.roles.join(', '), user: auth.name },
      };

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Dashboard API error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }
  })(request);
}

async function getApplicationStageCounts() {
  const stages = ['research', 'shortlisted', 'counseling', 'document_ready', 'submitted', 'under_review', 'offer_received', 'visa_applied', 'visa_approved', 'enrolled'];
  const data: Array<{ label: string; value: number }> = [];
  for (const stage of stages) {
    const count = await db.portalStudentApplication.count({ where: { stage } });
    if (count > 0) data.push({ label: stage.replace(/_/g, ' '), value: count });
  }
  return data.length > 0 ? data : [{ label: 'No data', value: 0 }];
}

async function getStudentMonthlyCounts() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const students = await db.portalStudentProfile.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const monthlyCounts: Record<string, number> = {};
  students.forEach(s => {
    const month = s.createdAt.toISOString().substring(0, 7);
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  return Object.entries(monthlyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 6)
    .map(([month, count]) => ({ label: month, value: count }));
}
