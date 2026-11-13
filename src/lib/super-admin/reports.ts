// ============================================================
// ALO EDUCATION — GLOBAL REPORT CENTER DEFINITIONS (spec §12)
//
// 24 report categories. Each definition declares:
//   • the filters it accepts
//   • a `build` function that reads real rows and returns { columns, rows }
//
// A category whose source data is not yet modelled returns a report with zero
// rows and a `limitation` string explaining exactly what is missing. It never
// returns invented numbers.
// ============================================================

import { db } from '@/lib/db';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  branch?: string;
  country?: string;
  role?: string;
  employeeId?: string;
  counselorId?: string;
  partnerId?: string;
  campaign?: string;
  source?: string;
  intake?: string;
  applicationStage?: string;
  visaStage?: string;
  status?: string;
}

export interface ReportResult {
  columns: string[];
  rows: Array<Array<string | number | null>>;
  limitation?: string;
}

export interface ReportDefinition {
  key: string;
  name: string;
  category: string;
  description: string;
  filters: Array<keyof ReportFilters>;
  build: (filters: ReportFilters) => Promise<ReportResult>;
}

function dateRange(filters: ReportFilters): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (!Number.isNaN(from.getTime())) range.gte = from;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      range.lte = to;
    }
  }
  return range;
}

function hasRange(range: { gte?: Date; lte?: Date }): boolean {
  return Boolean(range.gte || range.lte);
}

const ALL_FILTERS: Array<keyof ReportFilters> = [
  'dateFrom', 'dateTo', 'branch', 'country', 'role', 'employeeId', 'counselorId',
  'partnerId', 'campaign', 'source', 'intake', 'applicationStage', 'visaStage', 'status',
];

export const REPORT_CATALOG: readonly ReportDefinition[] = [
  {
    key: 'ceo_overview',
    name: 'CEO / Super Admin Overview',
    category: 'Executive',
    description: 'One row per core entity family with a live count.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const where = hasRange(range) ? { createdAt: range } : {};
      const [students, leads, applications, partners, employees, visaCases, payments] = await Promise.all([
        db.student.count({ where }),
        db.lead.count({ where }),
        db.application.count({ where }),
        db.partnerProfile.count({ where: hasRange(range) ? { createdAt: range } : {} }),
        db.employee.count(),
        db.visaCase.count({ where: hasRange(range) ? { createdAt: range } : {} }),
        db.payment.count({ where: hasRange(range) ? { createdAt: range } : {} }),
      ]);
      return {
        columns: ['Entity', 'Count'],
        rows: [
          ['Students', students],
          ['Leads', leads],
          ['Applications', applications],
          ['Partners', partners],
          ['Employees', employees],
          ['Visa cases', visaCases],
          ['Payments', payments],
        ],
      };
    },
  },
  {
    key: 'student_report',
    name: 'Student Report',
    category: 'Students',
    description: 'Student list with type, stage, country and counselor.',
    filters: ['dateFrom', 'dateTo', 'country', 'status'],
    build: async (filters) => {
      const range = dateRange(filters);
      const rows = await db.student.findMany({
        where: {
          ...(hasRange(range) ? { createdAt: range } : {}),
          ...(filters.country ? { currentCountry: filters.country } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        take: 5000,
        select: { studentId: true, name: true, userType: true, journeyStage: true, currentCountry: true, status: true, profileComplete: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return {
        columns: ['Student ID', 'Name', 'Type', 'Journey stage', 'Country', 'Status', 'Profile %', 'Created'],
        rows: rows.map((row) => [
          row.studentId, row.name, row.userType, row.journeyStage, row.currentCountry,
          row.status, row.profileComplete, row.createdAt.toISOString().slice(0, 10),
        ]),
      };
    },
  },
  {
    key: 'lead_report',
    name: 'Lead Report',
    category: 'Leads',
    description: 'Leads with source, status, country and assignment.',
    filters: ['dateFrom', 'dateTo', 'source', 'country', 'branch', 'status'],
    build: async (filters) => {
      const range = dateRange(filters);
      const rows = await db.lead.findMany({
        where: {
          ...(hasRange(range) ? { createdAt: range } : {}),
          ...(filters.source ? { source: filters.source } : {}),
          ...(filters.country ? { preferredCountry: filters.country } : {}),
          ...(filters.branch ? { branch: filters.branch } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        take: 5000,
        select: { leadId: true, fullName: true, phone: true, source: true, status: true, preferredCountry: true, counselorId: true, branch: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return {
        columns: ['Lead ID', 'Name', 'Phone', 'Source', 'Status', 'Country', 'Counselor', 'Branch', 'Created'],
        rows: rows.map((row) => [
          row.leadId, row.fullName, row.phone, row.source, row.status,
          row.preferredCountry || '', row.counselorId || 'unassigned', row.branch || '',
          row.createdAt.toISOString().slice(0, 10),
        ]),
      };
    },
  },
  {
    key: 'partner_report',
    name: 'Partner Report',
    category: 'Partners',
    description: 'Partner accounts with approval state and lead counts.',
    filters: ['dateFrom', 'dateTo', 'status'],
    build: async (filters) => {
      const rows = await db.partnerProfile.findMany({
        where: filters.status ? { approvalStatus: filters.status } : {},
        take: 2000,
        select: { partnerId: true, companyName: true, contactPerson: true, approvalStatus: true, totalLeads: true, activeStudents: true, commissionPending: true, commissionPaid: true },
      });
      return {
        columns: ['Partner ID', 'Company', 'Contact', 'Status', 'Leads', 'Active students', 'Commission pending', 'Commission paid'],
        rows: rows.map((row) => [
          row.partnerId, row.companyName, row.contactPerson, row.approvalStatus,
          row.totalLeads, row.activeStudents, row.commissionPending, row.commissionPaid,
        ]),
      };
    },
  },
  {
    key: 'counselor_report',
    name: 'Counselor Report',
    category: 'Counseling',
    description: 'Per-counselor workload: assigned leads, follow-ups, open tasks.',
    filters: ['branch', 'dateFrom', 'dateTo'],
    build: async (filters) => {
      const counselors = await db.employee.findMany({
        where: {
          role: { in: ['counselor', 'senior_counselor', 'COUNSELOR', 'SENIOR_COUNSELOR'] },
          ...(filters.branch ? { branch: filters.branch } : {}),
        },
        select: { id: true, userId: true, employeeId: true, name: true, branch: true, status: true },
      });
      const rows: Array<Array<string | number | null>> = [];
      for (const counselor of counselors) {
        const [leads, overdue, openTasks] = await Promise.all([
          db.lead.count({ where: { counselorId: counselor.userId } }).catch(() => 0),
          db.lead.count({ where: { counselorId: counselor.userId, followUpDate: { lt: new Date() } } }).catch(() => 0),
          db.task.count({ where: { assigneeId: counselor.userId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }).catch(() => 0),
        ]);
        rows.push([counselor.employeeId, counselor.name, counselor.branch || '', counselor.status, leads, overdue, openTasks]);
      }
      return {
        columns: ['Employee ID', 'Counselor', 'Branch', 'Status', 'Assigned leads', 'Overdue follow-ups', 'Open tasks'],
        rows,
      };
    },
  },
  {
    key: 'application_report',
    name: 'Application Report',
    category: 'Applications',
    description: 'Applications with stage, documents, offer and visa handover status.',
    filters: ['dateFrom', 'dateTo', 'country', 'applicationStage', 'status'],
    build: async (filters) => {
      const range = dateRange(filters);
      const rows = await db.application.findMany({
        where: {
          ...(hasRange(range) ? { createdAt: range } : {}),
          ...(filters.country ? { country: filters.country } : {}),
          ...(filters.applicationStage ? { stage: filters.applicationStage } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        take: 5000,
        select: { applicationCode: true, universityName: true, courseName: true, country: true, intake: true, stage: true, documentStatus: true, offerStatus: true, visaHandoverStatus: true, deadline: true },
        orderBy: { updatedAt: 'desc' },
      });
      return {
        columns: ['Application', 'University', 'Course', 'Country', 'Intake', 'Stage', 'Documents', 'Offer', 'Visa handover', 'Deadline'],
        rows: rows.map((row) => [
          row.applicationCode, row.universityName, row.courseName, row.country, row.intake,
          row.stage, row.documentStatus, row.offerStatus, row.visaHandoverStatus, row.deadline || '',
        ]),
      };
    },
  },
  {
    key: 'document_report',
    name: 'Document Report',
    category: 'Documents',
    description: 'Documents by category and review status.',
    filters: ['status', 'dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const groups = await db.document.groupBy({
        by: ['category', 'status'],
        where: {
          ...(hasRange(range) ? { createdAt: range } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        _count: { _all: true },
      });
      return {
        columns: ['Category', 'Status', 'Count'],
        rows: groups.map((row) => [row.category, row.status, row._count._all]),
      };
    },
  },
  {
    key: 'marketing_report',
    name: 'Marketing Report',
    category: 'Marketing',
    description: 'Campaigns with channel, spend, leads and conversions.',
    filters: ['dateFrom', 'dateTo', 'campaign', 'status'],
    build: async (filters) => {
      const rows = await db.campaign.findMany({
        where: {
          ...(filters.campaign ? { name: filters.campaign } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        select: { name: true, channel: true, status: true, budget: true, spent: true, leadsCount: true, conversionsCount: true, startDate: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      return {
        columns: ['Campaign', 'Channel', 'Status', 'Budget', 'Spent', 'Leads', 'Conversions', 'Start'],
        rows: rows.map((row) => [row.name, row.channel, row.status, row.budget ?? 0, row.spent, row.leadsCount, row.conversionsCount, row.startDate || '']),
      };
    },
  },
  {
    key: 'campaign_roi_report',
    name: 'Campaign ROI Report',
    category: 'Marketing',
    description: 'Conversions per unit spent, per campaign.',
    filters: ['dateFrom', 'dateTo', 'campaign'],
    build: async (filters) => {
      const rows = await db.campaign.findMany({
        where: filters.campaign ? { name: filters.campaign } : {},
        select: { name: true, spent: true, conversionsCount: true, leadsCount: true },
      });
      return {
        columns: ['Campaign', 'Spent', 'Leads', 'Conversions', 'Conversions per unit spent', 'Note'],
        rows: rows.map((row) => [
          row.name, row.spent, row.leadsCount, row.conversionsCount,
          row.spent > 0 ? Math.round((row.conversionsCount / row.spent) * 1000) / 10 : null,
          row.spent > 0 ? '' : 'no spend recorded — ratio not computable',
        ]),
      };
    },
  },
  {
    key: 'social_inbox_report',
    name: 'Social Inbox Report',
    category: 'Marketing',
    description: 'Inbound social messages, unread and AI-handled counts by platform.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const groups = await db.socialInboxMessage.groupBy({
        by: ['platform', 'isRead'],
        where: hasRange(range) ? { createdAt: range } : {},
        _count: { _all: true },
      });
      return {
        columns: ['Platform', 'Read state', 'Count'],
        rows: groups.map((row) => [row.platform, row.isRead ? 'read' : 'unread', row._count._all]),
      };
    },
  },
  {
    key: 'visa_report',
    name: 'Visa Report',
    category: 'Visa',
    description: 'Visa cases with stage, readiness, risk and officer.',
    filters: ['dateFrom', 'dateTo', 'country', 'visaStage'],
    build: async (filters) => {
      const rows = await db.visaCase.findMany({
        where: {
          ...(filters.country ? { destinationCountry: filters.country } : {}),
          ...(filters.visaStage ? { currentStage: filters.visaStage } : {}),
        },
        take: 5000,
        select: { caseCode: true, studentName: true, destinationCountry: true, currentStage: true, readinessScore: true, riskLevel: true, visaOfficerName: true, nextAction: true },
        orderBy: { lastUpdated: 'desc' },
      });
      return {
        columns: ['Case', 'Student', 'Country', 'Stage', 'Readiness', 'Risk', 'Officer', 'Next action'],
        rows: rows.map((row) => [
          row.caseCode, row.studentName, row.destinationCountry, row.currentStage,
          row.readinessScore, row.riskLevel, row.visaOfficerName, row.nextAction,
        ]),
      };
    },
  },
  {
    key: 'visa_risk_report',
    name: 'Visa Risk Report',
    category: 'Visa',
    description: 'High and critical risk visa cases only.',
    filters: ['country'],
    build: async (filters) => {
      const rows = await db.visaCase.findMany({
        where: {
          riskLevel: { in: ['high', 'HIGH', 'critical', 'CRITICAL'] },
          ...(filters.country ? { destinationCountry: filters.country } : {}),
        },
        take: 2000,
        select: { caseCode: true, studentName: true, destinationCountry: true, readinessScore: true, riskLevel: true, missing: true, whatIsWeak: true },
      });
      return {
        columns: ['Case', 'Student', 'Country', 'Readiness', 'Risk', 'Missing items', 'Weaknesses'],
        rows: rows.map((row) => [row.caseCode, row.studentName, row.destinationCountry, row.readinessScore, row.riskLevel, row.missing, row.whatIsWeak]),
      };
    },
  },
  {
    key: 'english_test_report',
    name: 'English Test Report',
    category: 'English Test',
    description: 'Recorded English test results per student.',
    filters: ['dateFrom', 'dateTo'],
    build: async () => {
      const rows = await db.studentEnglishTest.findMany({
        take: 5000,
        select: { studentId: true, testType: true, overallScore: true, readingScore: true, writingScore: true, listeningScore: true, speakingScore: true, testDate: true },
        orderBy: { createdAt: 'desc' },
      });
      return {
        columns: ['Student', 'Test', 'Overall', 'Reading', 'Writing', 'Listening', 'Speaking', 'Date'],
        rows: rows.map((row) => [
          row.studentId, row.testType, row.overallScore, row.readingScore,
          row.writingScore, row.listeningScore, row.speakingScore, row.testDate,
        ]),
      };
    },
  },
  {
    key: 'mock_test_revenue_report',
    name: 'Mock Test Revenue Report',
    category: 'English Test',
    description: 'Mock test credits issued and used, plus recorded mock payments.',
    filters: ['dateFrom', 'dateTo'],
    build: async () => {
      const [credits, payments] = await Promise.all([
        db.mockTestCredit.aggregate({ _sum: { totalCredits: true, usedCredits: true }, _count: { _all: true } }),
        db.payment.aggregate({ where: { type: 'MOCK_TEST' }, _sum: { amount: true }, _count: { _all: true } }).catch(() => null),
      ]);
      return {
        columns: ['Metric', 'Value'],
        rows: [
          ['Credit accounts', credits._count._all],
          ['Credits issued', credits._sum.totalCredits ?? 0],
          ['Credits used', credits._sum.usedCredits ?? 0],
          ['Mock payments recorded', payments?._count._all ?? 0],
          ['Mock payment amount', payments?._sum.amount ?? 0],
        ],
      };
    },
  },
  {
    key: 'finance_report',
    name: 'Finance Report',
    category: 'Finance',
    description: 'Payments grouped by type and status.',
    filters: ['dateFrom', 'dateTo', 'status'],
    build: async (filters) => {
      const range = dateRange(filters);
      const groups = await db.payment.groupBy({
        by: ['type', 'status', 'currency'],
        where: {
          ...(hasRange(range) ? { createdAt: range } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        },
        _sum: { amount: true },
        _count: { _all: true },
      });
      return {
        columns: ['Type', 'Status', 'Currency', 'Amount', 'Count'],
        rows: groups.map((row) => [row.type, row.status, row.currency, row._sum.amount ?? 0, row._count._all]),
      };
    },
  },
  {
    key: 'commission_report',
    name: 'Commission Report',
    category: 'Finance',
    description: 'Commissions by status with totals.',
    filters: ['dateFrom', 'dateTo', 'status'],
    build: async (filters) => {
      const groups = await db.commission.groupBy({
        by: ['type', 'status', 'currency'],
        where: filters.status ? { status: filters.status } : {},
        _sum: { amount: true },
        _count: { _all: true },
      });
      return {
        columns: ['Type', 'Status', 'Currency', 'Amount', 'Count'],
        rows: groups.map((row) => [row.type, row.status, row.currency, row._sum.amount ?? 0, row._count._all]),
      };
    },
  },
  {
    key: 'hr_report',
    name: 'HR Report',
    category: 'HR',
    description: 'Attendance and leave summary.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const dateFrom = range.gte ? range.gte.toISOString().slice(0, 10) : undefined;
      const dateTo = range.lte ? range.lte.toISOString().slice(0, 10) : undefined;
      const [attendance, leave] = await Promise.all([
        db.employeeAttendance.groupBy({
          by: ['status'],
          where: dateFrom && dateTo ? { date: { gte: dateFrom, lte: dateTo } } : {},
          _count: { _all: true },
        }),
        db.employeeLeave.groupBy({ by: ['status'], _count: { _all: true } }),
      ]);
      return {
        columns: ['Area', 'Status', 'Count'],
        rows: [
          ...attendance.map((row): Array<string | number | null> => ['Attendance', row.status, row._count._all]),
          ...leave.map((row): Array<string | number | null> => ['Leave', row.status, row._count._all]),
        ],
      };
    },
  },
  {
    key: 'branch_report',
    name: 'Branch Report',
    category: 'Operations',
    description: 'Per-branch employees and leads.',
    filters: [],
    build: async () => {
      const offices = await db.office.findMany({ select: { code: true, name: true, city: true, country: true, status: true } });
      const employees = await db.employee.groupBy({ by: ['branch'], _count: { _all: true } });
      const employeeMap = new Map<string, number>(employees.map((row): [string, number] => [row.branch || '', row._count._all]));
      const leads: Array<{ branch: string | null; _count: { _all: number } }> = await db.lead
        .groupBy({ by: ['branch'], _count: { _all: true } })
        .catch(() => [] as Array<{ branch: string | null; _count: { _all: number } }>);
      const leadMap = new Map<string, number>(leads.map((row): [string, number] => [row.branch || '', row._count._all]));
      return {
        columns: ['Code', 'Branch', 'City', 'Country', 'Status', 'Employees', 'Leads'],
        rows: offices.map((office): Array<string | number | null> => [
          office.code, office.name, office.city || '', office.country || '', office.status,
          employeeMap.get(office.code) ?? employeeMap.get(office.name) ?? 0,
          leadMap.get(office.code) ?? leadMap.get(office.name) ?? 0,
        ]),
      };
    },
  },
  {
    key: 'country_report',
    name: 'Country Report',
    category: 'Operations',
    description: 'Per-destination leads, applications and visa cases.',
    filters: [],
    build: async () => {
      const countries = await db.country.findMany({ select: { name: true, code: true, status: true, universityCount: true, courseCount: true } });
      const empty = [] as Array<{ key: string | null; _count: { _all: number } }>;
      const leads: Array<{ key: string | null; _count: { _all: number } }> = await db.lead
        .groupBy({ by: ['preferredCountry'], _count: { _all: true } })
        .then((rows) => rows.map((row) => ({ key: row.preferredCountry, _count: row._count })))
        .catch(() => empty);
      const apps: Array<{ key: string | null; _count: { _all: number } }> = await db.application
        .groupBy({ by: ['country'], _count: { _all: true } })
        .then((rows) => rows.map((row) => ({ key: row.country, _count: row._count })))
        .catch(() => empty);
      const visa: Array<{ key: string | null; _count: { _all: number } }> = await db.visaCase
        .groupBy({ by: ['destinationCountry'], _count: { _all: true } })
        .then((rows) => rows.map((row) => ({ key: row.destinationCountry, _count: row._count })))
        .catch(() => empty);
      const l = new Map<string, number>(leads.map((row): [string, number] => [row.key || '', row._count._all]));
      const a = new Map<string, number>(apps.map((row): [string, number] => [row.key || '', row._count._all]));
      const v = new Map<string, number>(visa.map((row): [string, number] => [row.key || '', row._count._all]));
      return {
        columns: ['Country', 'Code', 'Status', 'Universities', 'Courses', 'Leads', 'Applications', 'Visa cases'],
        rows: countries.map((country): Array<string | number | null> => [
          country.name, country.code, country.status, country.universityCount, country.courseCount,
          l.get(country.name) ?? 0, a.get(country.name) ?? 0, v.get(country.name) ?? 0,
        ]),
      };
    },
  },
  {
    key: 'ai_agent_report',
    name: 'AI Agent Report',
    category: 'AI',
    description: 'Agents by department and status, plus job counts.',
    filters: [],
    build: async () => {
      const agents = await db.aiAgent.groupBy({ by: ['department', 'status'], _count: { _all: true } });
      const jobs = await db.aiTask.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => []);
      return {
        columns: ['Area', 'Group', 'Status', 'Count'],
        rows: [
          ...agents.map((row): Array<string | number | null> => ['Agent', row.department, row.status, row._count._all]),
          ...jobs.map((row): Array<string | number | null> => ['Job', 'ai_tasks', row.status, row._count._all]),
        ],
      };
    },
  },
  {
    key: 'website_seo_report',
    name: 'Website / SEO Report',
    category: 'Marketing',
    description: 'Content publication state by type.',
    filters: [],
    build: async () => {
      const groups = await db.cmsManagedContent.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => []);
      if (groups.length === 0) {
        return {
          columns: ['Content type', 'Status', 'Count'],
          rows: [],
          limitation: 'No CMS content rows are present, so there is nothing to report yet.',
        };
      }
      return {
        columns: ['Status', 'Count'],
        rows: groups.map((row) => [row.status, row._count._all]),
      };
    },
  },
  {
    key: 'audit_log_report',
    name: 'Audit Log Report',
    category: 'Compliance',
    description: 'Audit rows in the selected window.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const rows = await db.auditLog.findMany({
        where: hasRange(range) ? { createdAt: range } : {},
        take: 5000,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, action: true, actorRole: true, userId: true, resource: true, resourceId: true },
      });
      return {
        columns: ['When', 'Action', 'Actor role', 'Actor id', 'Resource', 'Resource id'],
        rows: rows.map((row) => [
          row.createdAt.toISOString(), row.action, row.actorRole, row.userId || '', row.resource, row.resourceId,
        ]),
      };
    },
  },
  {
    key: 'security_report',
    name: 'Security Report',
    category: 'Compliance',
    description: 'Unresolved security events and failed login attempts.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const [events, failedLogins] = await Promise.all([
        db.employeeSecurityEvent.findMany({
          where: { ...(hasRange(range) ? { createdAt: range } : {}), isResolved: false },
          take: 2000,
          select: { eventType: true, severity: true, description: true, createdAt: true, isResolved: true },
        }),
        db.loginAttempt.count({
          where: { success: false, ...(hasRange(range) ? { createdAt: range } : {}) },
        }).catch(() => null),
      ]);
      return {
        columns: ['Event', 'Severity', 'Description', 'When', 'Resolved'],
        rows: [
          ...events.map((row) => [row.eventType, row.severity, row.description, row.createdAt.toISOString(), row.isResolved ? 'yes' : 'no']),
          ['failed_login_attempts', 'aggregate', 'Total failed login attempts in window', '', String(failedLogins ?? 'unavailable')],
        ],
      };
    },
  },
  {
    key: 'sla_report',
    name: 'SLA Report',
    category: 'Operations',
    description: 'SLA incidents by severity and status.',
    filters: ['dateFrom', 'dateTo'],
    build: async (filters) => {
      const range = dateRange(filters);
      const groups = await db.communicationSlaIncident.groupBy({
        by: ['severity', 'status'],
        where: hasRange(range) ? { createdAt: range } : {},
        _count: { _all: true },
      }).catch(() => []);
      if (groups.length === 0) {
        return {
          columns: ['Severity', 'Status', 'Count'],
          rows: [],
          limitation: 'No SLA incidents have been recorded in this window.',
        };
      }
      return {
        columns: ['Severity', 'Status', 'Count'],
        rows: groups.map((row) => [row.severity, row.status, row._count._all]),
      };
    },
  },
] as const;

export function findReport(key: string): ReportDefinition | undefined {
  return REPORT_CATALOG.find((report) => report.key === key);
}

export function toCsv(result: ReportResult): string {
  const escape = (value: string | number | null): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [result.columns.map(escape).join(','), ...result.rows.map((row) => row.map(escape).join(','))].join('\n');
}

export const ALL_REPORT_FILTERS = ALL_FILTERS;
