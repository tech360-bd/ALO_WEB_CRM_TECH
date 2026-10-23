import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { canViewUccB2B } from '@/lib/ucc/document-access';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const DASHBOARD_ROLES = new Set([
  'COUNSELOR', 'SENIOR_COUNSELOR', 'APPLICATION_TEAM', 'APPLICATION_MANAGER',
  'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER', 'FINANCE', 'MARKETING',
  'MARKETING_MANAGER', 'HR_MANAGER', 'BRANCH_MANAGER', 'COUNTRY_MANAGER',
  'OFFICE_MANAGER', 'FRONT_DESK', 'SUPPORT_STAFF', 'PARTNER_MANAGER',
  'CEO', 'DIRECTOR',
]);
const EMPTY_SCOPE = { id: { in: [] as string[] } };

function normalizeRole(role: string): string {
  return role.trim().replace(/[\s-]+/g, '_').toUpperCase();
}

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function parseDestinationFocus(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return uniqueIds(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return [];
  }
}

function dhakaDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const actorRoles = new Set([auth.userType, ...auth.roles].map(normalizeRole));
    if ([...actorRoles].some((role) => ADMIN_ROLES.has(role))) {
      return NextResponse.json({ success: false, error: 'Super Admin dashboards are separate from employee dashboards.' }, { status: 403 });
    }
    if (['STUDENT', 'PARTNER'].includes(normalizeRole(auth.userType))) {
      return NextResponse.json({ success: false, error: 'Employee dashboard access is not permitted.' }, { status: 403 });
    }

    const employee = await db.employee.findUnique({
      where: { userId: auth.userId },
      select: {
        id: true, userId: true, employeeId: true, status: true, role: true,
        branch: true, destinationFocus: true,
      },
    });
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
    }

    const permissions = new Set(Array.isArray(auth.permissions) ? auth.permissions : []);
    const hasDashboardPermission = permissions.has('employee.dashboard.view')
      || permissions.has('employee.dashboard.view_all');
    if (!hasDashboardPermission) {
      return NextResponse.json({ success: false, error: 'The employee dashboard permission is not assigned to this account.' }, { status: 403 });
    }
    const isAdmin = permissions.has('employee.dashboard.view_all');

    const url = new URL(request.url);
    const requestedRole = normalizeRole(url.searchParams.get('role') || '');
    if (requestedRole && ADMIN_ROLES.has(requestedRole)) {
      return NextResponse.json({ success: false, error: 'Super Admin dashboards are separate from employee dashboards.' }, { status: 403 });
    }
    if (requestedRole && !DASHBOARD_ROLES.has(requestedRole)) {
      return NextResponse.json({ success: false, error: 'Unsupported dashboard role.' }, { status: 400 });
    }
    const employeeRole = normalizeRole(employee.role || '');
    if (requestedRole && requestedRole !== employeeRole && !actorRoles.has(requestedRole)) {
      return NextResponse.json({ success: false, error: 'The requested dashboard role is not assigned to this account.' }, { status: 403 });
    }

    const userRole = requestedRole || (DASHBOARD_ROLES.has(employeeRole)
      ? employeeRole
      : [...actorRoles].find((role) => DASHBOARD_ROLES.has(role)) || '');
    if (!userRole || !DASHBOARD_ROLES.has(userRole)) {
      return NextResponse.json({ success: false, error: 'No authorized employee dashboard role is assigned.' }, { status: 403 });
    }

    const ownIds = uniqueIds([auth.userId, employee?.id, employee?.userId, employee?.employeeId]);
    let scopedEmployees: Array<{ id: string; userId: string; employeeId: string }> = employee
      ? [{ id: employee.id, userId: employee.userId, employeeId: employee.employeeId }]
      : [];
    const isBranchRole = ['HR_MANAGER', 'BRANCH_MANAGER', 'OFFICE_MANAGER'].includes(userRole);
    if (!isAdmin && isBranchRole && employee?.branch.trim()) {
      scopedEmployees = await db.employee.findMany({
        where: { branch: employee.branch, status: { in: ['active', 'ACTIVE'] } },
        select: { id: true, userId: true, employeeId: true },
      });
    }
    const scopeIds = isAdmin
      ? ownIds
      : uniqueIds(scopedEmployees.flatMap((item) => [item.id, item.userId, item.employeeId]));
    const branchEmployeeIds = isAdmin ? [] : uniqueIds(scopedEmployees.map((item) => item.id));
    const destinationCountries = parseDestinationFocus(employee?.destinationFocus);
    if (!isAdmin && ['HR_MANAGER', 'BRANCH_MANAGER', 'OFFICE_MANAGER'].includes(userRole) && !employee?.branch.trim()) {
      return NextResponse.json({ success: false, error: 'A branch scope is not assigned to this employee.' }, { status: 403 });
    }
    if (!isAdmin && userRole === 'COUNTRY_MANAGER' && destinationCountries.length === 0) {
      return NextResponse.json({ success: false, error: 'A destination scope is not assigned to this employee.' }, { status: 403 });
    }
    const today = dhakaDate();
    const now = new Date();
    const dhakaDayStart = new Date(`${today}T00:00:00+06:00`);
    const dhakaDayEnd = new Date(`${today}T23:59:59.999+06:00`);

    let leadWhere: any = isAdmin ? {} : { counselorId: { in: scopeIds } };
    let studentWhere: any = isAdmin ? {} : { counselorId: { in: scopeIds } };
    let applicationWhere: any = isAdmin ? {} : { counselorId: { in: scopeIds } };
    // Visa cases are private to assigned Visa officers; a counselorId match is
    // not sufficient authorization to reveal even a count.
    let visaCaseWhere: any = isAdmin ? {} : EMPTY_SCOPE;
    const canViewVisaModule = isAdmin || ['VISA_OFFICER', 'VISA_INTERVIEW_OFFICER'].includes(userRole);
    const threadWhere: any = { assignedToId: { in: ownIds }, status: { notIn: ['closed', 'CLOSED'] } };

    if (!isAdmin && ['APPLICATION_TEAM', 'APPLICATION_MANAGER'].includes(userRole)) {
      applicationWhere = {
        OR: [
          { appTeamOfficerId: { in: ownIds } },
          { applicationOfficer: { in: ownIds } },
        ],
      };
      studentWhere = EMPTY_SCOPE;
      visaCaseWhere = EMPTY_SCOPE;
    } else if (!isAdmin && ['VISA_OFFICER', 'VISA_INTERVIEW_OFFICER'].includes(userRole)) {
      visaCaseWhere = { visaOfficerId: { in: ownIds } };
      applicationWhere = { visaOfficerId: { in: ownIds } };
      studentWhere = EMPTY_SCOPE;
    } else if (!isAdmin && userRole === 'COUNTRY_MANAGER') {
      leadWhere = destinationCountries.length ? { destination: { in: destinationCountries } } : EMPTY_SCOPE;
      studentWhere = EMPTY_SCOPE;
      applicationWhere = destinationCountries.length ? { country: { in: destinationCountries } } : EMPTY_SCOPE;
      visaCaseWhere = destinationCountries.length ? { destinationCountry: { in: destinationCountries } } : EMPTY_SCOPE;
    } else if (!isAdmin && ['FINANCE', 'SUPPORT_STAFF'].includes(userRole)) {
      leadWhere = EMPTY_SCOPE;
      studentWhere = EMPTY_SCOPE;
      applicationWhere = EMPTY_SCOPE;
      visaCaseWhere = EMPTY_SCOPE;
    }

    if (!canViewUccB2B(auth) && ['APPLICATION_TEAM', 'APPLICATION_MANAGER', 'COUNSELOR', 'SENIOR_COUNSELOR'].includes(userRole)) {
      applicationWhere = { AND: [applicationWhere, { isB2bConfidential: false }] };
    }

    const [
      totalLeads,
      hotLeads,
      totalStudents,
      activeStudents,
      activeApplications,
      submittedApplications,
      offersReceived,
      visaCasesCount,
      pendingTasksCount,
      unreadPortalNotifications,
      unreadHrmNotifications,
      unreadMessagesAggregate,
      slaOverdueCount,
      slaBreachesCount,
      followUpsDue,
      overdueFollowUps,
    ] = await Promise.all([
      db.marketingLead.count({ where: leadWhere }),
      db.marketingLead.count({ where: { ...leadWhere, hotLead: true } }),
      db.student.count({ where: studentWhere }),
      db.student.count({ where: { ...studentWhere, status: { in: ['active', 'ACTIVE'] } } }),
      db.application.count({ where: { ...applicationWhere, stage: { notIn: ['enrolled', 'cancelled', 'rejected', 'ENROLLED', 'CANCELLED', 'REJECTED'] } } }),
      db.application.count({ where: { ...applicationWhere, safeStatus: { in: ['SUBMITTED', 'submitted'] } } }),
      db.application.count({ where: { ...applicationWhere, offerStatus: { in: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'conditional_offer', 'unconditional_offer'] } } }),
      canViewVisaModule ? db.visaCase.count({ where: visaCaseWhere }) : Promise.resolve(null),
      db.counselorTask.count({ where: { employeeId: { in: ownIds }, status: { in: ['pending', 'PENDING', 'in_progress', 'IN_PROGRESS'] } } }),
      db.portalNotification.count({ where: { userId: auth.userId, isRead: false } }),
      db.hrmNotification.count({ where: { recipientId: { in: ownIds }, isRead: false } }),
      db.communicationThread.aggregate({ where: threadWhere, _sum: { unreadCount: true } }),
      db.communicationThread.count({ where: { assignedToId: { in: ownIds }, slaDueAt: { lt: now }, status: { notIn: ['closed', 'CLOSED', 'resolved', 'RESOLVED'] } } }),
      db.slaEvent.count({ where: { counselorId: { in: ownIds }, escalatedAt: { not: null }, resolvedAt: null } }),
      db.marketingLead.count({ where: { ...leadWhere, followUpDone: false, followUpDueAt: { gte: now, lte: dhakaDayEnd } } }),
      db.marketingLead.count({ where: { ...leadWhere, followUpDone: false, followUpDueAt: { lt: now } } }),
    ]);

    const unreadMessagesCount = unreadMessagesAggregate._sum.unreadCount ?? 0;
    const roleSpecificData: Record<string, unknown> = {};
    if (userRole.includes('COUNSELOR')) {
      const [myStudents, myLeads, assignedLeads, convertedLeads, appointmentStudents] = await Promise.all([
        db.student.findMany({
          where: studentWhere,
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true, journeyStage: true },
        }),
        db.marketingLead.findMany({
          where: leadWhere,
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, phone: true, email: true, destination: true, status: true, createdAt: true },
        }),
        db.marketingLead.count({ where: leadWhere }),
        db.marketingLead.count({ where: { ...leadWhere, convertedAt: { not: null } } }),
        db.student.findMany({ where: studentWhere, select: { id: true, studentId: true } }),
      ]);
      roleSpecificData.myStudents = myStudents.map((student) => ({
        ...student, fullName: student.name, studentCode: student.studentId,
        currentStage: student.journeyStage,
      }));
      roleSpecificData.myLeads = myLeads;
      roleSpecificData.followUpsDue = followUpsDue;
      roleSpecificData.overdueFollowUps = overdueFollowUps;
      roleSpecificData.conversionRate = assignedLeads > 0
        ? `${((convertedLeads / assignedLeads) * 100).toFixed(1)}%`
        : null;
      const scopedStudentIds = uniqueIds(appointmentStudents.flatMap((student) => [student.id, student.studentId]));
      roleSpecificData.appointmentsToday = scopedStudentIds.length
        ? await db.appointment.count({
          where: {
            studentId: { in: scopedStudentIds },
            scheduledAt: { gte: new Date(`${today}T00:00:00+06:00`), lt: new Date(`${today}T23:59:59.999+06:00`) },
            status: { in: ['scheduled', 'confirmed', 'SCHEDULED', 'CONFIRMED'] },
          },
        })
        : 0;
    }

    if (userRole.includes('APPLICATION')) {
      const recentApplications = await db.application.findMany({
        where: applicationWhere,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, applicationId: true, studentId: true, universityName: true,
          courseName: true, country: true, intake: true, stage: true,
          safeStatus: true, updatedAt: true,
        },
      });
      roleSpecificData.recentApplications = recentApplications;
      roleSpecificData.draftCount = await db.application.count({
        where: { ...applicationWhere, stage: { in: ['APPLICATION_DRAFT', 'draft'] } },
      });
      roleSpecificData.reviewCount = await db.application.count({
        where: { ...applicationWhere, stage: { in: ['PROFILE_REVIEW', 'DOCUMENT_REVIEW', 'under_review'] } },
      });
      roleSpecificData.draftApplications = roleSpecificData.draftCount;
      roleSpecificData.offerCount = offersReceived;
    }

    if (userRole.includes('VISA')) {
      roleSpecificData.recentVisaCases = await db.visaCase.findMany({
        where: visaCaseWhere,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, caseCode: true, studentId: true, studentName: true,
          destinationCountry: true, university: true, course: true, currentStage: true,
          nextAction: true, deadline: true, updatedAt: true,
        },
      });
      roleSpecificData.highRiskCount = await db.visaCase.count({ where: { ...visaCaseWhere, riskLevel: { in: ['HIGH', 'high'] } } });
      roleSpecificData.interviewsScheduled = null;
    }

    if (['HR_MANAGER', 'BRANCH_MANAGER', 'OFFICE_MANAGER'].includes(userRole)) {
      const employeeScope = isAdmin ? {} : branchEmployeeIds.length ? { id: { in: branchEmployeeIds } } : EMPTY_SCOPE;
      const employeeKeyScope = isAdmin ? {} : scopeIds.length ? { employeeId: { in: scopeIds } } : { employeeId: { in: [] } };
      const [totalEmployees, activeEmployees, pendingProfiles, leaveRequestsToday, attendancePresent, branchCounselors] = await Promise.all([
        db.employee.count({ where: employeeScope }),
        db.employee.count({ where: { ...employeeScope, status: { in: ['active', 'ACTIVE'] } } }),
        db.employeeHRProfile.count({ where: employeeKeyScope }),
        db.leaveRequest.count({ where: { ...employeeKeyScope, status: { in: ['PENDING', 'pending'] }, createdAt: { gte: dhakaDayStart, lte: dhakaDayEnd } } }),
        db.employeeAttendance.count({ where: { ...employeeKeyScope, date: today, status: { in: ['present', 'PRESENT'] } } }),
        db.employee.count({ where: { ...employeeScope, role: { in: ['counselor', 'COUNSELOR', 'senior_counselor', 'SENIOR_COUNSELOR'] } } }),
      ]);
      roleSpecificData.totalEmployees = totalEmployees;
      roleSpecificData.activeEmployees = activeEmployees;
      roleSpecificData.pendingProfiles = pendingProfiles;
      roleSpecificData.leaveRequestsToday = leaveRequestsToday;
      roleSpecificData.attendancePresent = attendancePresent;
      roleSpecificData.branchCounselors = branchCounselors;
    }

    if (userRole.includes('COUNTRY')) {
      roleSpecificData.countryStudents = destinationCountries.length
        ? await db.portalStudentProfile.count({ where: { preferredCountry: { in: destinationCountries } } })
        : null;
      roleSpecificData.countryApplications = activeApplications;
      roleSpecificData.countryOffers = offersReceived;
      roleSpecificData.targetCountries = destinationCountries;
    }

    if (userRole.includes('MARKETING')) {
      const campaignWhere = isAdmin ? {} : { createdById: auth.userId };
      const activeCampaignWhere = { ...campaignWhere, status: { in: ['active', 'ACTIVE', 'published', 'PUBLISHED'] } };
      const [activeCampaigns, campaigns] = await Promise.all([
        db.marketingCampaign.count({ where: activeCampaignWhere }),
        db.marketingCampaign.findMany({
          where: activeCampaignWhere,
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, name: true, platform: true, status: true, updatedAt: true },
        }),
      ]);
      roleSpecificData.activeCampaigns = activeCampaigns;
      roleSpecificData.campaignsRunning = activeCampaigns;
      roleSpecificData.recentCampaigns = campaigns;
    }

    if (userRole.includes('FINANCE')) {
      roleSpecificData.pendingPayrollRecords = await db.employeePayroll.count({
        where: { employeeId: { in: ownIds }, status: { in: ['draft', 'reviewed', 'pending', 'DRAFT', 'REVIEWED', 'PENDING'] } },
      });
      roleSpecificData.pendingCommissionRecords = await db.employeeCommission.count({
        where: { employeeId: { in: ownIds }, status: { in: ['pending', 'PENDING'] } },
      });
      roleSpecificData.pendingPayments = null;
      roleSpecificData.outstandingInvoices = null;
      roleSpecificData.todaysReceipts = null;
      roleSpecificData.partnerCommissionPending = null;
      roleSpecificData.commissionApproved = null;
      roleSpecificData.monthlyRevenue = null;
    }

    if (userRole.includes('SUPPORT')) {
      roleSpecificData.openTickets = await db.communicationThread.count({
        where: { ...threadWhere, status: { in: ['open', 'OPEN'] } },
      });
      roleSpecificData.urgentTickets = await db.communicationThread.count({
        where: { ...threadWhere, status: { in: ['open', 'OPEN'] }, priority: { in: ['urgent', 'URGENT'] } },
      });
    }

    if (userRole.includes('BRANCH')) {
      roleSpecificData.branchStudents = totalStudents;
      roleSpecificData.branchLeads = totalLeads;
      roleSpecificData.branchApplications = activeApplications;
    }

    const metrics = {
      totalLeads,
      assignedLeads: totalLeads,
      hotLeads,
      newLeads: await db.marketingLead.count({ where: { ...leadWhere, status: { in: ['new', 'NEW'] } } }),
      totalStudents,
      activeStudents,
      activeApplications,
      submittedApplications,
      offersReceived,
      offerCount: offersReceived,
      visaCasesCount,
      visaCases: visaCasesCount,
      pendingTasksCount,
      unreadNotifsCount: unreadPortalNotifications + unreadHrmNotifications,
      unreadMessagesCount,
      unreadMessages: unreadMessagesCount,
      slaBreaches: slaBreachesCount,
      slaOverdueCount,
      followUpsDue,
      overdueFollowUps,
      branch: employee?.branch || null,
      country: destinationCountries[0] || null,
      ...roleSpecificData,
    };

    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'EMPLOYEE_DASHBOARD_VIEWED',
        entityType: 'EmployeeDashboard',
        entityId: auth.userId,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
        userAgent: request.headers.get('user-agent') || '',
        metadata: JSON.stringify({ effectiveUserId: auth.userId, role: userRole, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole, expiresAt: auth.actingAsExpiresAt?.toISOString() } : {}) }),
      },
    });

    return NextResponse.json({ success: true, userRole, userId: auth.userId, userName: auth.name, branch: employee.branch || null, country: destinationCountries[0] || null, actingAs: auth.actingAsSessionId ? { sessionId: auth.actingAsSessionId, role: auth.actingAsRole, expiresAt: auth.actingAsExpiresAt?.toISOString() || null, realActor: auth.actorName } : null, metrics });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee dashboard data is temporarily unavailable.' }, { status: 503 });
  }
}
