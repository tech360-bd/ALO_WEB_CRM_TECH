import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'ceo';

    // CEO Dashboard
    if (tab === 'ceo') {
      const [
        totalStudents, totalLeads, totalApplications, totalPartners, totalEmployees,
        leadsBySource, leadsByStatus, appsByStatus,
        monthlyPayments, totalRevenue, totalCommissions,
        topCounselors, countryDist,
      ] = await Promise.all([
        db.student.count(),
        db.lead.count(),
        db.application.count(),
        db.partner.count(),
        db.employee.count(),
        db.lead.groupBy({ by: ['source'], _count: { source: true } }),
        db.lead.groupBy({ by: ['status'], _count: { status: true } }),
        db.application.groupBy({ by: ['status'], _count: { status: true } }),
        db.payment.findMany({ orderBy: { paidAt: 'desc' }, take: 100, include: { student: true } }),
        db.payment.aggregate({ _sum: { amount: true } }),
        db.commission.aggregate({ _sum: { amount: true } }),
        db.employee.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
        db.student.groupBy({ by: ['preferredCountry'], _count: { preferredCountry: true } }),
      ]);

      // Get apps by country from student's preferredCountry via applications with student include
      const appsWithStudent = await db.application.findMany({
        select: { id: true, student: { select: { preferredCountry: true } } },
        take: 500,
      });
      const appsByCountryMap: Record<string, number> = {};
      for (const app of appsWithStudent) {
        const c = app.student?.preferredCountry;
        if (c) appsByCountryMap[c] = (appsByCountryMap[c] || 0) + 1;
      }
      const appsByCountry = Object.entries(appsByCountryMap).map(([country, count]) => ({ country, count }));

      const revenue = totalRevenue._sum.amount || 0;
      const activeApps = await db.application.count({ where: { status: { in: ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer'] } } });
      const enrolled = await db.application.count({ where: { status: 'enrolled' } });
      const convRate = totalLeads > 0 ? ((enrolled / totalLeads) * 100).toFixed(1) : '0';

      return NextResponse.json({
        stats: { totalStudents, totalRevenue: revenue, activeApplications: activeApps, conversionRate: convRate, totalLeads, totalApplications, totalPartners, totalEmployees, totalCommissions: totalCommissions._sum.amount || 0 },
        leadsBySource: leadsBySource.map(l => ({ source: l.source || 'Unknown', count: l._count.source })),
        leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count.status })),
        appsByStatus: appsByStatus.map(a => ({ status: a.status, count: a._count.status })),
        appsByCountry,
        countryDistribution: countryDist.filter(c => c.preferredCountry).map(c => ({ country: c.preferredCountry, count: c._count.preferredCountry })),
        recentPayments: monthlyPayments.slice(0, 10),
        topCounselors: topCounselors.slice(0, 5),
      });
    }

    // Lead Analytics
    if (tab === 'leads') {
      const [bySource, byStatus, byTemperature] = await Promise.all([
        db.lead.groupBy({ by: ['source'], _count: { source: true } }),
        db.lead.groupBy({ by: ['status'], _count: { status: true } }),
        db.lead.groupBy({ by: ['temperature'], _count: { temperature: true } }),
      ]);

      const totalLeads = await db.lead.count();
      const qualifiedLeads = await db.lead.count({ where: { status: { in: ['qualified', 'contacted', 'appointment_scheduled'] } } });
      const appliedLeads = await db.lead.count({ where: { status: 'converted' } });

      return NextResponse.json({
        totalLeads,
        bySource: bySource.map(l => ({ source: l.source || 'Unknown', count: l._count.source })),
        byStatus: byStatus.map(l => ({ status: l.status, count: l._count.status })),
        byTemperature: byTemperature.map(l => ({ temperature: l.temperature || 'warm', count: l._count.temperature })),
        funnel: [
          { stage: 'Total Leads', count: totalLeads },
          { stage: 'Qualified', count: qualifiedLeads },
          { stage: 'Applied', count: appliedLeads },
        ],
        conversionRate: totalLeads > 0 ? ((appliedLeads / totalLeads) * 100).toFixed(1) : '0',
      });
    }

    // Application Analytics
    if (tab === 'applications') {
      const [byStatus, byUniversity] = await Promise.all([
        db.application.groupBy({ by: ['status'], _count: { status: true } }),
        db.application.groupBy({ by: ['universityId'], _count: { universityId: true } }),
      ]);

      // Get apps by country from student's preferredCountry
      const appsWithStudent = await db.application.findMany({
        select: { id: true, student: { select: { preferredCountry: true } } },
        take: 500,
      });
      const byCountryMap: Record<string, number> = {};
      for (const app of appsWithStudent) {
        const c = app.student?.preferredCountry;
        if (c) byCountryMap[c] = (byCountryMap[c] || 0) + 1;
      }
      const byCountry = Object.entries(byCountryMap).map(([country, count]) => ({ country, count }));

      const topUniversities = await Promise.all(
        byUniversity.filter(u => u.universityId).slice(0, 10).map(async (u) => {
          const uni = await db.university.findUnique({ where: { id: u.universityId! } });
          return { university: uni?.name || 'Unknown', count: u._count.universityId };
        })
      );

      return NextResponse.json({
        byStatus: byStatus.map(a => ({ status: a.status, count: a._count.status })),
        byCountry,
        topUniversities,
      });
    }

    // Finance Reports
    if (tab === 'finance') {
      const [totalRevenue, totalCommissions, paymentsByStatus, recentPayments, expenses] = await Promise.all([
        db.payment.aggregate({ _sum: { amount: true }, _count: true }),
        db.commission.aggregate({ _sum: { amount: true }, _count: true }),
        db.payment.groupBy({ by: ['status'], _count: { status: true }, _sum: { amount: true } }),
        db.payment.findMany({ orderBy: { paidAt: 'desc' }, take: 20, include: { student: true } }),
        db.expense.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      ]);

      return NextResponse.json({
        totalRevenue: totalRevenue._sum.amount || 0,
        totalPayments: totalRevenue._count,
        totalCommissions: totalCommissions._sum.amount || 0,
        paymentsByStatus: paymentsByStatus.map(p => ({ status: p.status, count: p._count.status, amount: p._sum.amount || 0 })),
        recentPayments,
        expenses,
      });
    }

    // Partner Reports
    if (tab === 'partners') {
      const partners = await db.partner.findMany({
        include: {
          students: { select: { id: true } },
          commissions: { select: { amount: true, status: true } },
        },
      });

      const partnerStats = partners.map(p => ({
        id: p.id,
        name: p.companyName,
        type: p.businessType || 'N/A',
        studentCount: p.students.length,
        totalCommission: p.commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        paidCommission: p.commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0),
        pendingCommission: p.commissions.filter(c => c.status !== 'paid').reduce((sum, c) => sum + (c.amount || 0), 0),
      }));

      return NextResponse.json({ partners: partnerStats });
    }

    // Visa Reports
    if (tab === 'visa') {
      const [byStatus, visaFiles] = await Promise.all([
        (db.visaFile as any).groupBy({ by: ['stage'], _count: { stage: true } }),
        db.visaFile.findMany({
          select: { id: true, student: { select: { preferredCountry: true } } },
          take: 500,
        }),
      ]);

      // Group by student's preferredCountry as a proxy for country
      const byCountryMap: Record<string, number> = {};
      for (const vf of visaFiles) {
        const c = vf.student?.preferredCountry;
        if (c) byCountryMap[c] = (byCountryMap[c] || 0) + 1;
      }
      const byCountry = Object.entries(byCountryMap).map(([country, count]) => ({ country, count }));

      const totalVisa = await db.visaFile.count();
      const approved = await db.visaFile.count({ where: { visaDecision: 'approved' } });

      return NextResponse.json({
        totalVisa,
        approved,
        successRate: totalVisa > 0 ? ((approved / totalVisa) * 100).toFixed(1) : '0',
        byStatus: byStatus.map((v: any) => ({ status: v.stage, count: v._count.stage })),
        byCountry,
      });
    }

    // HR Reports
    if (tab === 'hr') {
      const [totalEmployees, byDepartmentId, attendance, leaves, tasks] = await Promise.all([
        db.employee.count(),
        db.employee.groupBy({ by: ['departmentId'], _count: { departmentId: true } }),
        db.attendance.findMany({ orderBy: { date: 'desc' }, take: 50 }),
        db.leaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
        db.task.findMany({ orderBy: { dueDate: 'desc' }, take: 50 }),
      ]);

      // Resolve departmentId to department name
      const byDepartment = [];
      for (const d of byDepartmentId) {
        if (d.departmentId) {
          const dept = await db.department.findUnique({ where: { id: d.departmentId } });
          byDepartment.push({ department: dept?.name || 'Unknown', count: d._count.departmentId });
        }
      }

      const completedTasks = await db.task.count({ where: { status: 'completed' } });
      const totalTasks = await db.task.count();

      return NextResponse.json({
        totalEmployees,
        byDepartment,
        recentAttendance: attendance,
        recentLeaves: leaves,
        taskCompletion: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0',
        totalTasks,
        completedTasks,
      });
    }

    // Marketing Reports
    if (tab === 'marketing') {
      const [campaigns, leadsBySource] = await Promise.all([
        db.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
        db.lead.groupBy({ by: ['source'], _count: { source: true } }),
      ]);

      return NextResponse.json({
        campaigns,
        leadsBySource: leadsBySource.map(l => ({ source: l.source || 'Unknown', count: l._count.source })),
      });
    }

    // AI Reports
    if (tab === 'ai') {
      const [byModel, recentLogs, totalLogs, errorLogs] = await Promise.all([
        db.aiLog.groupBy({ by: ['model'], _count: { model: true } }),
        db.aiLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
        db.aiLog.count(),
        db.aiLog.count({ where: { status: 'failed' } }),
      ]);

      return NextResponse.json({
        totalLogs,
        errorLogs,
        errorRate: totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(1) : '0',
        byAgentType: byModel.map(a => ({ agentType: a.model || 'Unknown', count: a._count.model })),
        recentLogs,
      });
    }

    return NextResponse.json({ error: 'Unknown tab' }, { status: 400 });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
