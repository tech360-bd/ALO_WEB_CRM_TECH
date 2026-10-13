import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: Authenticate the caller. The previous version accepted a ?userId=
  // query param with no auth — IDOR allowing any user to fetch any other user's dashboard.
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use the authenticated user's id — ignore any client-supplied userId param.
    const userId = auth.user.id;
    const userType = auth.user.userType || 'employee';

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const roleName = user.userRoles[0]?.role?.name || '';

    // Admin / Super Admin Dashboard
    if (['super_admin', 'admin', 'branch_manager', 'country_manager', 'office_manager'].includes(roleName)) {
      const [
        totalStudents,
        totalLeads,
        totalApplications,
        totalPartners,
        totalEmployees,
        totalUniversities,
        activeApplications,
        recentLeads,
        recentApplications,
        leadsByStatus,
        applicationsByStatus,
        monthlyRevenue,
        totalCommissions,
        pendingCommissions,
        recentActivities,
      ] = await Promise.all([
        db.student.count(),
        db.lead.count(),
        db.application.count(),
        db.partner.count(),
        db.employee.count(),
        db.university.count(),
        db.application.count({ where: { status: { in: ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer'] } } }),
        db.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { counselor: true } }),
        db.application.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { student: true, university: true, course: true }
        }),
        db.lead.groupBy({ by: ['status'], _count: { status: true } }),
        db.application.groupBy({ by: ['status'], _count: { status: true } }),
        db.payment.aggregate({ _sum: { amount: true }, _count: true }),
        db.commission.aggregate({ _sum: { amount: true }, _count: true }),
        db.commission.count({ where: { status: { in: ['eligible', 'requested', 'under_review'] } } }),
        db.activityLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
      ]);

      return NextResponse.json({
        role: 'admin',
        stats: {
          totalStudents,
          totalLeads,
          totalApplications,
          totalPartners,
          totalEmployees,
          totalUniversities,
          activeApplications,
          revenue: monthlyRevenue._sum.amount || 0,
          totalPayments: monthlyRevenue._count,
          totalCommissionAmount: totalCommissions._sum.amount || 0,
          pendingCommissions,
        },
        charts: {
          leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count.status })),
          applicationsByStatus: applicationsByStatus.map(a => ({ status: a.status, count: a._count.status })),
        },
        recent: {
          leads: recentLeads,
          applications: recentApplications,
          activities: recentActivities,
        }
      });
    }

    // Student Dashboard
    if (userType === 'student' || roleName === 'student') {
      const student = await db.student.findFirst({
        where: { userId: user.id }
      });

      if (!student) {
        return NextResponse.json({ role: 'student', stats: {}, recent: {} });
      }

      const [
        totalApplications,
        totalDocuments,
        upcomingAppointments,
        applications,
        documents,
        appointments,
        payments,
      ] = await Promise.all([
        db.application.count({ where: { studentId: student.id } }),
        db.document.count({ where: { studentId: student.id } }),
        db.appointment.count({
          where: { studentId: student.id, date: { gte: new Date() }, status: 'scheduled' }
        }),
        db.application.findMany({
          where: { studentId: student.id },
          include: { university: true, course: true },
          orderBy: { createdAt: 'desc' }
        }),
        db.document.findMany({
          where: { studentId: student.id },
          orderBy: { uploadedAt: 'desc' },
          take: 5
        }),
        db.appointment.findMany({
          where: { studentId: student.id, date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 5
        }),
        db.payment.findMany({
          where: { studentId: student.id },
          orderBy: { paidAt: 'desc' },
          take: 5
        }),
      ]);

      return NextResponse.json({
        role: 'student',
        student: { id: student.id, studentId: student.studentId, name: `${student.firstName} ${student.lastName}` },
        stats: {
          totalApplications,
          totalDocuments,
          upcomingAppointments,
        },
        recent: {
          applications,
          documents,
          appointments,
          payments,
        }
      });
    }

    // Partner Dashboard
    if (userType === 'partner' || ['partner_super_admin', 'partner_staff'].includes(roleName)) {
      const partner = await db.partner.findFirst({
        where: { userId: user.id }
      });

      if (!partner) {
        return NextResponse.json({ role: 'partner', stats: {}, recent: {} });
      }

      const [
        totalStudents,
        totalApplications,
        totalCommissions,
        commissionAmount,
        pendingCommissions,
        recentStudents,
        recentApplications,
        commissions,
      ] = await Promise.all([
        db.student.count({ where: { partnerId: partner.id } }),
        db.application.count({ where: { partnerId: partner.id } }),
        db.commission.count({ where: { partnerId: partner.id } }),
        db.commission.aggregate({ where: { partnerId: partner.id }, _sum: { amount: true } }),
        db.commission.count({ where: { partnerId: partner.id, status: { in: ['eligible', 'requested', 'under_review'] } } }),
        db.student.findMany({ where: { partnerId: partner.id }, take: 5, orderBy: { createdAt: 'desc' } }),
        db.application.findMany({
          where: { partnerId: partner.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { student: true, university: true }
        }),
        db.commission.findMany({
          where: { partnerId: partner.id },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),
      ]);

      return NextResponse.json({
        role: 'partner',
        partner: { id: partner.id, partnerId: partner.partnerId, companyName: partner.companyName },
        stats: {
          totalStudents,
          totalApplications,
          totalCommissions,
          commissionAmount: commissionAmount._sum.amount || 0,
          pendingCommissions,
        },
        recent: {
          students: recentStudents,
          applications: recentApplications,
          commissions,
        }
      });
    }

    // Employee Dashboard (default)
    const employee = await db.employee.findFirst({
      where: { userId: user.id }
    });

    if (employee) {
      const [
        assignedLeadsCount,
        assignedTasksCount,
        todayAttendance,
        pendingTasks,
        assignedLeads,
        tasks,
        applicationsCount,
      ] = await Promise.all([
        db.lead.count({ where: { assignedTo: employee.id } }),
        db.task.count({ where: { assignedTo: employee.id, status: { in: ['pending', 'in_progress'] } } }),
        db.attendance.findFirst({
          where: { employeeId: employee.id, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
        }),
        db.task.count({ where: { assignedTo: employee.id, status: 'pending' } }),
        db.lead.findMany({
          where: { assignedTo: employee.id },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),
        db.task.findMany({
          where: { assignedTo: employee.id },
          take: 5,
          orderBy: { dueDate: 'asc' }
        }),
        db.application.count({ where: { counselorId: employee.id } }),
      ]);

      return NextResponse.json({
        role: 'employee',
        employee: { id: employee.id, employeeId: employee.employeeId, name: `${employee.firstName} ${employee.lastName}` },
        stats: {
          assignedLeads: assignedLeadsCount,
          pendingTasks: assignedTasksCount,
          todayAttendance: todayAttendance?.status || 'not_clocked_in',
          totalPendingTasks: pendingTasks,
          applicationsCount,
        },
        recent: {
          leads: assignedLeads,
          tasks,
        }
      });
    }

    // Fallback
    return NextResponse.json({
      role: 'unknown',
      stats: {},
      recent: {},
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
