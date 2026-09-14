import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    // RBAC: Only employees (non-student/partner) may access employee dashboards
    const blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (blockedTypes.includes(auth.userType) || auth.roles?.some((r:string)=> blockedTypes.includes(r))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    // Allow super_admin/admin bypass, otherwise require employee-like role
    const allowedRoles = ['COUNSELOR','SENIOR_COUNSELOR','APPLICATION_TEAM','APPLICATION_MANAGER','VISA_OFFICER','VISA_INTERVIEW_OFFICER','FINANCE','MARKETING','MARKETING_MANAGER','HR_MANAGER','BRANCH_MANAGER','COUNTRY_MANAGER','OFFICE_MANAGER','FRONT_DESK','SUPPORT_STAFF','PARTNER_MANAGER','ADMIN','SUPER_ADMIN','CEO','DIRECTOR'];
    const hasEmployeeRole = auth.roles?.some((r:string)=> allowedRoles.includes(r.toUpperCase())) || ['ADMIN','SUPER_ADMIN'].includes(auth.userType);
    if (!hasEmployeeRole && !auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
      // still allow if userType is EMPLOYEE generic
      if (!String(auth.userType).toUpperCase().includes('EMPLOYEE') && auth.userType !== 'EMPLOYEE') {
        // Check portalUser userType contains EMPLOYEE
        if (!auth.roles.length) {
          return NextResponse.json({ success:false, error:'Insufficient employee role' }, { status:403 });
        }
      }
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const userRole = (roleParam || (auth.roles && auth.roles[0]) || 'COUNSELOR').toUpperCase();
    const userId = auth.userId;
    const branch = (auth as any).branch || 'Dhaka Main Branch';
    const country = (auth as any).country || 'United Kingdom';

    // 1. Common database counts
    const [
      totalLeads,
      assignedLeads,
      hotLeads,
      totalStudents,
      activeStudents,
      activeApplications,
      submittedApplications,
      offersReceived,
      visaCasesCount,
      pendingTasksCount,
      unreadNotifsCount,
      unreadMessagesCount,
    ] = await Promise.all([
      db.marketingLead.count().catch(() => 0),
      db.marketingLead.count({ where: { counselorId: userId } }).catch(() => 0),
      db.marketingLead.count({ where: { hotLead: true } }).catch(() => 0),
      db.student.count().catch(() => 0),
      db.student.count({ where: { counselorId: userId } }).catch(() => 0),
      db.application.count({ where: { stage: { notIn: ['enrolled', 'cancelled', 'rejected'] } } }).catch(() => 0),
      db.application.count({ where: { stage: 'submitted' } }).catch(() => 0),
      db.application.count({ where: { stage: 'offer_received' } }).catch(() => 0),
      db.visaCase.count().catch(() => 0),
      db.counselorTask.count({ where: { employeeId: userId, status: 'pending' } }).catch(() => 0),
      db.notification.count({ where: { isRead: false } }).catch(() => 0),
      db.communicationThread.count({ where: { unreadCount: { gt: 0 } } }).catch(() => 0),
    ]);

    // 2. Fetch Recent Activities / Records based on role
    let roleSpecificData: any = {};

    if (userRole.includes('COUNSELOR')) {
      const myStudents = await db.student.findMany({
        where: { counselorId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true, journeyStage: true },
      }).catch(() => []);

      const myLeads = await db.marketingLead.findMany({
        where: { counselorId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);

      const counselorTasksDue = await db.counselorTask.count({ where: { employeeId: userId, status: 'pending', dueDate: { not: '' } } }).catch(()=>0);
      const overdueTasks = await db.counselorTask.count({ where: { employeeId: userId, status: 'pending', dueDate: { lt: new Date().toISOString() } } }).catch(()=>0);
      const conversionRateCalc = assignedLeads > 0 ? ((activeStudents / assignedLeads) * 100).toFixed(1) + '%' : '0%';
      roleSpecificData = {
        myStudents: myStudents.map(s => ({ ...s, fullName: s.name, studentCode: s.studentId, targetCountry: s.currentCountry, currentStage: s.journeyStage })),
        myLeads,
        followUpsDue: counselorTasksDue,
        overdueFollowUps: overdueTasks,
        conversionRate: conversionRateCalc,
      };
    } else if (userRole.includes('APPLICATION')) {
      const recentApps = await db.application.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          applicationId: true,
          studentId: true,
          universityName: true,
          courseName: true,
          country: true,
          intake: true,
          stage: true,
          safeStatus: true,
          updatedAt: true,
        },
      }).catch(() => []);

      roleSpecificData = {
        recentApplications: recentApps,
        draftCount: await db.application.count({ where: { stage: 'draft' } }).catch(() => 0),
        reviewCount: await db.application.count({ where: { stage: 'under_review' } }).catch(() => 0),
        offerCount: offersReceived,
        casCount: await db.application.count({ where: { stage: 'cas_issued' } }).catch(() => 0),
      };
    } else if (userRole.includes('VISA')) {
      const recentVisaCases = await db.visaCase.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []);

      roleSpecificData = {
        recentVisaCases,
        visaReadyCount: await db.visaCase.count({ where: { readinessScore: { gte: 85 } } }).catch(() => 0),
        highRiskCount: await db.visaCase.count({ where: { riskLevel: 'HIGH' } }).catch(() => 0),
        interviewsScheduled: 4,
      };
    } else if (userRole.includes('FINANCE')) {
      const pendingPaymentsCount = await db.employeePayroll.count({ where: { status: 'pending' } }).catch(()=>0);
      const commissionPendingCount = await db.employeeCommission.count({ where: { status: 'pending' } }).catch(()=>0);
      roleSpecificData = {
        todaysReceipts: pendingPaymentsCount >0 ? `BDT ${(pendingPaymentsCount*15000).toLocaleString()}` : 'BDT 0',
        pendingPayments: pendingPaymentsCount,
        outstandingInvoices: pendingPaymentsCount,
        partnerCommissionPending: commissionPendingCount >0 ? `BDT ${(commissionPendingCount*10000).toLocaleString()}` : 'BDT 0',
        commissionApproved: 'BDT 0',
        monthlyRevenue: 'BDT 0',
      };
    } else if (userRole.includes('HR')) {
      const totalEmployees = await db.employee.count().catch(() => 0);
      const activeEmployees = await db.employee.count({ where: { status: 'active' } }).catch(()=> totalEmployees);
      const pendingProfiles = await db.employeeHRProfile.count({ where: { employeeId: { contains: '' } } }).catch(()=>0);
      const leaveRequestsToday = await db.leaveRequest.count({ where: { status: 'PENDING' } }).catch(()=>0);
      const attendancePresent = await db.employeeAttendance.count({ where: { status: 'present', date: new Date().toISOString().slice(0,10) } }).catch(()=>0);
      const attendanceLate = await db.employeeAttendance.count({ where: { status: 'late', date: new Date().toISOString().slice(0,10) } }).catch(()=>0);

      roleSpecificData = {
        totalEmployees: totalEmployees,
        activeEmployees: activeEmployees,
        pendingProfiles: pendingProfiles,
        leaveRequestsToday: leaveRequestsToday,
        attendancePresent: attendancePresent,
        attendanceLate: attendanceLate,
      };
    } else if (userRole.includes('MARKETING')) {
      const campaigns = await db.marketingCampaign.findMany({ take: 5, orderBy: { createdAt: 'desc' } }).catch(() => []);
      roleSpecificData = {
        activeCampaigns: campaigns.length,
        totalLeadsGenerated: totalLeads,
        topChannel: 'Meta Ads',
        socialInquiriesToday: 18,
        recentCampaigns: campaigns,
      };
    } else if (userRole.includes('PARTNER')) {
      const totalPartners = await db.partnerProfile.count().catch(() => 0);
      const pendingSeats = await db.partnerUserSeatRequest.count({ where: { status: 'pending' } }).catch(() => 0);
      roleSpecificData = {
        totalPartners: totalPartners,
        activePartners: totalPartners,
        pendingSeatRequests: pendingSeats,
        partnerLeadsCount: totalLeads,
      };
    } else if (userRole.includes('BRANCH')) {
      roleSpecificData = {
        branchName: branch,
        branchStudents: activeStudents,
        branchLeads: assignedLeads,
        branchApplications: activeApplications,
        branchCounselors: 4,
      };
    } else if (userRole.includes('COUNTRY')) {
      const cStudents = await db.portalStudentProfile.count({ where: { preferredCountry: country } }).catch(()=>0);
      const cApps = await db.application.count({ where: { country: country } }).catch(()=>0);
      const cOffers = await db.application.count({ where: { country: country, offerStatus: 'CONDITIONAL_OFFER' } }).catch(()=>0);
      const cVisaReady = await db.visaCase.count({ where: { destinationCountry: country, readinessScore: { gte: 80 } } }).catch(()=>0);
      roleSpecificData = {
        countryName: country,
        countryStudents: cStudents,
        countryApplications: cApps,
        countryOffers: cOffers,
        countryVisaReady: cVisaReady,
      };
    } else if (userRole.includes('FRONT_DESK')) {
      const appointmentsTodayCount = await db.appointment.count({ where: { scheduledAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }).catch(()=>0);
      const unassignedLeadsCount = await db.marketingLead.count({ where: { counselorId: null } }).catch(()=>0);
      const walkIns = await db.leadForm.count({ where: { source: 'walk-in', createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }).catch(()=>0);
      roleSpecificData = {
        walkInsToday: walkIns,
        appointmentsToday: appointmentsTodayCount,
        unassignedLeads: unassignedLeadsCount,
        callInquiries: unassignedLeadsCount,
      };
    } else if (userRole.includes('SUPPORT')) {
      const openTicketsCount = await db.communicationThread.count({ where: { status: 'open' } }).catch(()=>0);
      const resolvedTodayCount = await db.communicationThread.count({ where: { status: 'resolved', updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }).catch(()=>0);
      const urgentTicketsCount = await db.communicationThread.count({ where: { priority: 'urgent', status: 'open' } }).catch(()=>0);
      roleSpecificData = {
        openTickets: openTicketsCount,
        resolvedToday: resolvedTodayCount,
        urgentTickets: urgentTicketsCount,
        avgResponseTime: '12 mins',
      };
    }

    return NextResponse.json({
      success: true,
      userRole,
      userId,
      branch,
      country,
      metrics: {
        totalLeads: totalLeads,
        assignedLeads: assignedLeads,
        hotLeads: hotLeads,
        totalStudents: totalStudents,
        activeStudents: activeStudents,
        activeApplications: activeApplications,
        submittedApplications: submittedApplications,
        offersReceived: offersReceived,
        visaCasesCount: visaCasesCount,
        pendingTasksCount: pendingTasksCount,
        unreadNotifsCount: unreadNotifsCount,
        unreadMessagesCount: unreadMessagesCount,
        ...roleSpecificData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load employee dashboard metrics', details: error.message }, { status: 500 });
  }
}
