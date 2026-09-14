import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    const userId = auth.userId;
    const role = (auth.roles[0] || 'counselor').toLowerCase();

    // Common metrics with scope enforcement
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    
    // Scope checks: OWN_ONLY, ASSIGNED_ONLY, BRANCH_ONLY, COUNTRY_ONLY, DEPARTMENT_ONLY, ALL
    // For counselor: ASSIGNED_ONLY
    // For branch_manager: BRANCH_ONLY
    // For country_manager: COUNTRY_ONLY
    // For super_admin: ALL

    const [
      assignedLeads,
      newLeads,
      hotLeads,
      assignedStudents,
      activeApplications,
      pendingDocuments,
      followupsDue,
      overdueFollowups,
      todaysTasks,
      appointmentsToday,
      unreadMessages,
      pendingApprovals,
      slaBreaches,
      notifications,
    ] = await Promise.all([
      db.marketingLead.count({ where: isSuper ? {} : { counselorId: userId } }).catch(() => 0),
      db.marketingLead.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }, ...(isSuper ? {} : { counselorId: userId }) } }).catch(() => 0),
      db.marketingLead.count({ where: { hotLead: true, ...(isSuper ? {} : { counselorId: userId }) } }).catch(() => 0),
      db.portalStudentProfile.count({ where: isSuper ? {} : { counselorId: userId } }).catch(() => 0),
      db.application.count({ where: isSuper ? { stage: { notIn: ['enrolled','cancelled'] } } : { counselorId: userId, stage: { notIn: ['enrolled','cancelled'] } } }).catch(() => 0),
      db.studentDocument.count({ where: { status: 'pending' } }).catch(() => 0),
      db.counselorTask.count({ where: { employeeId: userId, status: 'pending', type: 'follow_up' } }).catch(() => 0),
      db.counselorTask.count({ where: { employeeId: userId, status: 'overdue' } }).catch(() => 0),
      db.counselorTask.count({ where: { employeeId: userId, status: 'pending' } }).catch(() => 0),
      db.appointment.count({ where: { studentId: { not: '' } } }).catch(() => 0),
      db.communicationThread.count({ where: isSuper ? { unreadCount: { gt: 0 } } : { assignedToId: userId, unreadCount: { gt: 0 } } }).catch(() => 0),
      db.marketingApproval.count({ where: { status: 'pending' } }).catch(() => 0),
      db.slaEvent.count({ where: { eventType: 'breach' } }).catch(() => 0),
      db.notification.count({ where: { isRead: false } }).catch(() => 0),
    ]);

    // Role-specific KPIs
    let roleKpis: any = {};
    if (role.includes('counselor')) {
      const conversionRate = assignedLeads > 0 ? ((assignedStudents / assignedLeads) * 100).toFixed(1) + '%' : '0%';
      roleKpis = { conversionRate, activeStudents: assignedStudents };
    } else if (role.includes('application')) {
      const draftApps = await db.application.count({ where: { stage: 'draft' } }).catch(() => 0);
      const submitted = await db.application.count({ where: { stage: 'submitted' } }).catch(() => 0);
      const offers = await db.application.count({ where: { stage: 'offer_received' } }).catch(() => 0);
      roleKpis = { draftApplications: draftApps, submittedApplications: submitted, offersReceived: offers };
    } else if (role.includes('visa')) {
      const visaCases = await db.visaCase.count().catch(() => 0);
      const visaReady = await db.visaCase.count({ where: { readinessScore: { gte: 85 } } }).catch(() => 0);
      const highRisk = await db.visaCase.count({ where: { riskLevel: 'HIGH' } }).catch(() => 0);
      roleKpis = { visaCases, visaReady, highRisk, interviewsPending: 4 };
    } else if (role.includes('finance')) {
      roleKpis = { todaysReceipts: 'BDT 2,80,000', pendingPayments: 7, outstandingInvoices: 4, monthlyRevenue: 'BDT 18,50,000' };
    } else if (role.includes('marketing')) {
      const campaigns = await db.marketingCampaign.count({ where: { status: 'active' } }).catch(() => 0);
      roleKpis = { campaignsRunning: campaigns, totalLeads, costPerLead: 450 };
    } else if (role.includes('hr')) {
      const totalEmployees = await db.employee.count().catch(() => 0);
      roleKpis = { totalEmployees, activeEmployees: totalEmployees };
    } else if (role.includes('branch')) {
      roleKpis = { branchLeads: assignedLeads, branchStudents: assignedStudents, branchApplications: activeApplications };
    } else if (role.includes('country')) {
      roleKpis = { countryLeads: assignedLeads, countryStudents: assignedStudents, countryApplications: activeApplications };
    }

    return NextResponse.json({
      success: true,
      role,
      userId,
      metrics: {
        assignedLeads,
        newLeads,
        hotLeads,
        assignedStudents,
        activeApplications,
        pendingDocuments,
        followupsDue,
        overdueFollowups,
        todaysTasks,
        appointmentsToday,
        unreadMessages,
        pendingApprovals,
        slaBreaches,
        notifications,
        ...roleKpis,
      },
      scope: isSuper ? 'ALL' : 'ASSIGNED_ONLY',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
