import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { mutationOriginAllowed } from '@/lib/request-origin';
// /api/admin/crm/command-center — Super Admin CRM Master API
// Real-time aggregated CRM data for Super Admin to operate any agent task
// No mocks — all real DB queries

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, error: 'User administrator required' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const requestedModule = searchParams.get('module') || 'overview'; // overview, leads, students, applications, documents, visa, finance, marketing, hr, partners, universities, courses, communications, reports, tasks, audit

    const primaryRole = auth.roles[0] || auth.userType || '';
    const isSuper = ['SUPER_ADMIN', 'super_admin'].includes(primaryRole) || auth.roles.includes('super_admin') || auth.userType === 'SUPER_ADMIN';

    // Overview — real counts for all modules
    if (requestedModule === 'overview') {
      const [
        leadsCount,
        studentsCount,
        applicationsCount,
        visaCasesCount,
        documentsPending,
        employeesCount,
        partnersCount,
        universitiesCount,
        coursesCount,
        campaignsCount,
        tasksPending,
        recentLeads,
        recentApplications,
        recentStudents,
        weeklyReports,
        slaBreaches,
      ] = await Promise.all([
        db.lead.count().catch(() => 0),
        db.portalStudentProfile.count().catch(() => 0),
        db.application.count().catch(() => 0),
        db.visaCase.count().catch(() => 0),
        db.studentDocument.count({ where: { status: { in: ['pending', 'under_review', 'not_uploaded'] } } }).catch(() => 0),
        db.employee.count({ where: { status: 'active' } }).catch(() => 0),
        db.partnerProfile.count().catch(() => 0),
        db.crmUniversity.count().catch(() => 0),
        db.crmCourse.count().catch(() => 0),
        db.marketingCampaign.count().catch(() => 0),
        db.counselorTask.count({ where: { status: { in: ['pending', 'in_progress'] } } }).catch(() => 0),
        db.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, fullName: true, email: true, phone: true, status: true, source: true, createdAt: true } }).catch(() => []),
        db.application.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, applicationCode: true, studentId: true, universityName: true, courseName: true, stage: true, status: true, createdAt: true } }).catch(() => []),
        db.portalStudentProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, fullName: true, studentId: true, preferredCountry: true, journeyStage: true, createdAt: true } }).catch(() => []),
        db.weeklyReport.findMany({ orderBy: { generatedAt: 'desc' }, take: 3 }).catch(() => []),
        db.slaEvent.findMany({ where: { eventType: { contains: 'OVERDUE' } }, orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => []),
      ]);

      // Funnel stages real data
      let funnel: any[] = [];
      try {
        const stages = await db.lead.groupBy({ by: ['status'], _count: { id: true } });
        funnel = stages.map(s => ({ stage: s.status, count: s._count.id }));
      } catch { funnel = []; }

      return NextResponse.json({
        success: true,
        module: 'overview',
        data: {
          counts: {
            leads: leadsCount,
            students: studentsCount,
            applications: applicationsCount,
            visaCases: visaCasesCount,
            documentsPending,
            employees: employeesCount,
            partners: partnersCount,
            universities: universitiesCount,
            courses: coursesCount,
            campaigns: campaignsCount,
            tasksPending,
            slaBreaches: slaBreaches.length,
          },
          funnel,
          recent: {
            leads: recentLeads.map((l: any) => ({ ...l, name: l.fullName })),
            applications: recentApplications,
            students: recentStudents,
            reports: weeklyReports,
            slaBreaches,
          },
          isSuper,
        }
      });
    }

    // Leads module
    if (requestedModule === 'leads') {
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      
      const where: any = {};
      if (status && status !== 'all') where.status = status;
      if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }];
      
      const leads = await db.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.lead.count({ where }).catch(() => 0);
      
      return NextResponse.json({ success: true, module: 'leads', data: leads, total });
    }

    // Students
    if (requestedModule === 'students') {
      const search = searchParams.get('search');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      const where: any = search ? { OR: [{ fullName: { contains: search } }, { studentId: { contains: search } }] } : {};
      const students = await db.portalStudentProfile.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, include: { user: { select: { email: true, phone: true, status: true } } } }).catch(() => []);
      const total = await db.portalStudentProfile.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'students', data: students, total });
    }

    // Applications
    if (requestedModule === 'applications') {
      const stage = searchParams.get('stage');
      const search = searchParams.get('search');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      const where: any = {};
      if (stage && stage !== 'all') where.stage = stage;
      if (search) where.OR = [{ applicationCode: { contains: search } }, { studentId: { contains: search } }, { universityName: { contains: search } }];
      const apps = await db.application.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.application.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'applications', data: apps, total });
    }

    // Documents
    if (requestedModule === 'documents') {
      const status = searchParams.get('status');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      const where: any = status && status !== 'all' ? { status } : {};
      const docs = await db.studentDocument.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.studentDocument.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'documents', data: docs, total });
    }

    // Visa cases
    if (requestedModule === 'visa') {
      const stage = searchParams.get('stage');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      const where: any = stage && stage !== 'all' ? { currentStage: stage } : {};
      const cases = await db.visaCase.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.visaCase.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'visa', data: cases, total });
    }

    // Finance
    if (requestedModule === 'finance') {
      const [payments, commissions, payrolls] = await Promise.all([
        db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.commission.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.payroll.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'finance', data: { payments, commissions, payrolls } });
    }

    // Marketing
    if (requestedModule === 'marketing') {
      const [campaigns, leads, contents] = await Promise.all([
        db.marketingCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.marketingLead.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.marketingGeneratedContent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'marketing', data: { campaigns, leads, contents } });
    }

    // HR
    if (requestedModule === 'hr') {
      const [employees, attendance, leaves] = await Promise.all([
        db.employee.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []),
        db.employeeAttendance.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.leaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'hr', data: { employees, attendance, leaves } });
    }

    // Partners
    if (requestedModule === 'partners') {
      const partners = await db.partnerProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []);
      const partnerLeads = await db.partnerLead.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
      return NextResponse.json({ success: true, module: 'partners', data: { partners, leads: partnerLeads } });
    }

    // Universities & Courses
    if (requestedModule === 'universities') {
      const search = searchParams.get('search');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const where: any = search ? { OR: [{ name: { contains: search } }, { country: { contains: search } }] } : {};
      const unis = await db.crmUniversity.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.crmUniversity.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'universities', data: unis, total });
    }

    if (requestedModule === 'courses') {
      const search = searchParams.get('search');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const where: any = search ? { OR: [{ courseTitle: { contains: search } }, { subjectArea: { contains: search } }] } : {};
      const courses = await db.crmCourse.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const total = await db.crmCourse.count({ where }).catch(() => 0);
      return NextResponse.json({ success: true, module: 'courses', data: courses, total });
    }

    // Communications
    if (requestedModule === 'communications') {
      const [threads, messages, sla] = await Promise.all([
        db.communicationThread.findMany({ orderBy: { lastMessageAt: 'desc' }, take: 20 }).catch(() => []),
        db.communicationMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.slaEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'communications', data: { threads, messages, sla } });
    }

    // Tasks — agent tasks that Super Admin can perform
    if (requestedModule === 'tasks') {
      const [counselorTasks, visaTasks, aiTasks, appTasks] = await Promise.all([
        db.counselorTask.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.visaTask.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.aiTask.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        db.applicationTask.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'tasks', data: { counselorTasks, visaTasks, aiTasks, applicationTasks: appTasks } });
    }

    // Reports
    if (requestedModule === 'reports') {
      const [weekly, marketing, visa] = await Promise.all([
        db.weeklyReport.findMany({ orderBy: { generatedAt: 'desc' }, take: 10 }).catch(() => []),
        db.marketingReport.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []),
        db.visaReport.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []),
      ]);
      return NextResponse.json({ success: true, module: 'reports', data: { weekly, marketing, visa } });
    }

    // Audit logs
    if (requestedModule === 'audit') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
      const logs = await db.portalAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      const crmLogs = await db.crmAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []);
      return NextResponse.json({ success: true, module: 'audit', data: { portal: logs, crm: crmLogs } });
    }

    return NextResponse.json({ success: false, error: 'Invalid module' }, { status: 400 });
  } catch (e: any) {
    console.error('[admin.crm.command-center GET]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST — perform agent task as Super Admin
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, error: 'User administrator required' }, { status: 403 });

    if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required' }, { status: 403 });
    const body = await request.json();
    const { action, module: targetModule, data, id } = body;

    // Log every super admin action
    await logAuditAction(auth, `SUPER_ADMIN_${action}`, targetModule, id || '', data || {}).catch(()=>{});

    switch (action) {
      case 'assign_lead':
        return NextResponse.json({ success: false, code: 'ASSIGNMENT_MAPPING_UNVERIFIED', error: 'Assignment is unavailable until lead and counselor identity namespaces are verified.' }, { status: 409 });
      case 'update_application_stage': {
        const { applicationId, stage, note } = data;
        if (!applicationId || !stage) return NextResponse.json({ success: false, error: 'applicationId and stage required' }, { status: 400 });
        const app = await db.application.update({ where: { id: applicationId }, data: { stage, notes: note || '', updatedBy: auth.userId } });
        await db.applicationStatusLog.create({ data: { applicationId, newStatus: stage, safeStatus: stage, changedBy: auth.name || auth.userId || '', note: note || '' } }).catch(()=>{});
        return NextResponse.json({ success: true, data: app });
      }
      case 'verify_document': {
        const { documentId, status, reviewerNote } = data;
        if (!documentId || !status) return NextResponse.json({ success: false, error: 'documentId and status required' }, { status: 400 });
        const doc = await db.studentDocument.update({ where: { id: documentId }, data: { status, reviewerNote: reviewerNote || '', reviewedBy: auth.userId, reviewedAt: new Date() } });
        await db.documentAudit.create({ data: { documentId, studentId: doc.studentId, actorId: auth.userId, actorName: auth.name, action: status, previousStatus: '', newStatus: status, note: reviewerNote || '' } }).catch(()=>{});
        return NextResponse.json({ success: true, data: doc });
      }
      case 'update_visa_case': {
        const { caseId, updates } = data;
        if (!caseId) return NextResponse.json({ success: false, error: 'caseId required' }, { status: 400 });
        const visaCase = await db.visaCase.update({ where: { id: caseId }, data: updates });
        return NextResponse.json({ success: true, data: visaCase });
      }
      case 'create_task': {
        const { employeeId, title, description, type, priority, dueDate } = data;
        if (!employeeId || !title) return NextResponse.json({ success: false, error: 'employeeId and title required' }, { status: 400 });
        const task = await db.counselorTask.create({ data: { employeeId, title, description: description || '', type: type || 'follow_up', priority: priority || 'medium', status: 'pending', dueDate: dueDate || '' } });
        return NextResponse.json({ success: true, data: task });
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error('[admin.crm.command-center POST]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
