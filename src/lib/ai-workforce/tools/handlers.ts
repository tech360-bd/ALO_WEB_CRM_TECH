/**
 * ALO AI Workforce — tool handlers.
 *
 * Every handler performs a real operation against the existing ALO database
 * through Prisma. There are no placeholders: a read tool reads rows, a write
 * tool writes rows and reports how many mutations it performed, and anything
 * that cannot be completed safely fails loudly instead of returning a
 * fabricated success.
 *
 * Row scoping is enforced here as well as in RBAC: a STUDENT or PARTNER actor
 * can only ever reach entities listed in `actor.scopedEntityIds`.
 */
import { z } from 'zod';
import { db } from '@/lib/db';
import { registerTool } from './registry';
import type { ToolExecutionContext, ToolResult } from './../types';
import { screenFileInput } from './../security';
import { parseDateLoose, stableHash, tokenize, overlapScore } from './../text';

const id = z.string().trim().min(1).max(191);
const shortText = z.string().trim().min(1).max(500);

function scopeViolation(ctx: ToolExecutionContext, entityId: string): boolean {
  if (!['STUDENT', 'PARTNER'].includes(ctx.actor.role)) return false;
  return !(ctx.actor.scopedEntityIds || []).includes(entityId);
}

const fail = (error: string): ToolResult => ({ ok: false, error });

// ───────────────────────────── CRM reads ─────────────────────────────

registerTool({
  slug: 'crm.lead.read',
  name: 'Lead lookup',
  description: 'Read a single CRM lead with the fields required for qualification.',
  category: 'CRM',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 120,
  securityClass: 'CONFIDENTIAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({ leadId: id }),
  output: z.object({ found: z.boolean(), lead: z.record(z.string(), z.unknown()).nullable() }),
  handler: async (args, ctx) => {
    const leadId = String(args.leadId);
    if (scopeViolation(ctx, leadId)) return fail('lead is outside the caller scope');
    const lead = await db.lead.findFirst({
      where: { OR: [{ id: leadId }, { leadId }] },
      select: {
        id: true, leadId: true, fullName: true, email: true, phone: true, source: true, sourceDetail: true,
        preferredCountry: true, preferredCourse: true, preferredLevel: true, preferredIntake: true,
        currentQualification: true, englishTest: true, englishScore: true, budget: true, cgpa: true,
        notes: true, status: true, leadScore: true, leadTier: true, counselorId: true, studentId: true,
        createdAt: true, updatedAt: true,
      },
    });
    return { ok: true, data: { found: lead !== null, lead: lead as Record<string, unknown> | null } };
  },
});

registerTool({
  slug: 'crm.lead.search',
  name: 'Lead search',
  description: 'List CRM leads matching status/source filters for operational analysis.',
  category: 'CRM',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 60,
  securityClass: 'CONFIDENTIAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({
    status: z.string().trim().max(60).optional(),
    source: z.string().trim().max(60).optional(),
    unassignedOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  }),
  output: z.object({ leads: z.array(z.record(z.string(), z.unknown())), total: z.number().int() }),
  handler: async (args, ctx) => {
    if (['STUDENT', 'PARTNER'].includes(ctx.actor.role)) return fail('bulk lead search is not available to this role');
    const leads = await db.lead.findMany({
      where: {
        ...(args.status ? { status: String(args.status) } : {}),
        ...(args.source ? { source: String(args.source) } : {}),
        ...(args.unassignedOnly ? { OR: [{ counselorId: null }, { counselorId: '' }] } : {}),
      },
      select: {
        id: true, leadId: true, fullName: true, email: true, phone: true, source: true, status: true,
        counselorId: true, leadScore: true, leadTier: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(args.limit ?? 50),
    });
    return { ok: true, data: { leads: leads as unknown as Record<string, unknown>[], total: leads.length } };
  },
});

registerTool({
  slug: 'crm.student.read',
  name: 'Student profile lookup',
  description: 'Read a student profile with education, English tests, documents and preferences.',
  category: 'CRM',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 120,
  securityClass: 'CONFIDENTIAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({ studentId: id }),
  output: z.object({
    found: z.boolean(),
    student: z.record(z.string(), z.unknown()).nullable(),
    education: z.array(z.record(z.string(), z.unknown())),
    englishTests: z.array(z.record(z.string(), z.unknown())),
    documents: z.array(z.record(z.string(), z.unknown())),
    passport: z.record(z.string(), z.unknown()).nullable(),
    funding: z.record(z.string(), z.unknown()).nullable(),
    preferences: z.record(z.string(), z.unknown()).nullable(),
  }),
  handler: async (args, ctx) => {
    const studentId = String(args.studentId);
    if (scopeViolation(ctx, studentId)) return fail('student is outside the caller scope');
    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { studentId }] },
      select: {
        id: true, studentId: true, name: true, email: true, phone: true, status: true, journeyStage: true,
        currentCountry: true, currentCity: true, profileComplete: true, counselorId: true, createdAt: true,
      },
    });
    if (!student) {
      return {
        ok: true,
        data: { found: false, student: null, education: [], englishTests: [], documents: [], passport: null, funding: null, preferences: null },
      };
    }
    const [education, englishTests, documents, passport, funding, preferences] = await Promise.all([
      db.studentEducation.findMany({ where: { studentId: student.id }, take: 20 }),
      db.studentEnglishTest.findMany({ where: { studentId: student.id }, take: 20 }),
      db.studentDocument.findMany({
        where: { studentId: student.id, isArchived: false },
        select: { id: true, category: true, fileName: true, status: true, reviewerNote: true, rejectionReason: true, createdAt: true },
        take: 60,
      }),
      db.studentPassport.findFirst({ where: { studentId: student.id } }),
      db.studentFunding.findFirst({ where: { studentId: student.id } }),
      db.studentAdmissionPreference.findFirst({ where: { studentId: student.id } }),
    ]);
    return {
      ok: true,
      data: {
        found: true,
        student: student as unknown as Record<string, unknown>,
        education: education as unknown as Record<string, unknown>[],
        englishTests: englishTests as unknown as Record<string, unknown>[],
        documents: documents.map((doc) => ({ ...doc, documentType: doc.category })) as unknown as Record<string, unknown>[],
        passport: (passport as unknown as Record<string, unknown>) ?? null,
        funding: (funding as unknown as Record<string, unknown>) ?? null,
        preferences: (preferences as unknown as Record<string, unknown>) ?? null,
      },
    };
  },
});

registerTool({
  slug: 'crm.application.read',
  name: 'Application lookup',
  description: 'Read an application with its documents and deadlines.',
  category: 'APPLICATIONS',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 120,
  securityClass: 'CONFIDENTIAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({ applicationId: id }),
  output: z.object({
    found: z.boolean(),
    application: z.record(z.string(), z.unknown()).nullable(),
    documents: z.array(z.record(z.string(), z.unknown())),
    deadlines: z.array(z.record(z.string(), z.unknown())),
  }),
  handler: async (args, ctx) => {
    const applicationId = String(args.applicationId);
    const application = await db.application.findFirst({
      where: { OR: [{ id: applicationId }, { applicationCode: applicationId }] },
      select: {
        id: true, applicationCode: true, studentId: true, universityName: true, courseName: true, country: true,
        intake: true, level: true, stage: true, safeStatus: true, documentStatus: true, deadline: true,
        deadlineDate: true, counselorId: true, createdAt: true,
      },
    });
    if (!application) return { ok: true, data: { found: false, application: null, documents: [], deadlines: [] } };
    if (scopeViolation(ctx, application.studentId)) return fail('application is outside the caller scope');
    const [documents, deadlines] = await Promise.all([
      db.applicationDocument.findMany({
        where: { applicationId: application.id },
        select: { id: true, documentType: true, fileName: true, status: true, reviewerNote: true },
        take: 60,
      }),
      db.applicationDeadline.findMany({ where: { applicationId: application.id }, take: 30 }),
    ]);
    return {
      ok: true,
      data: {
        found: true,
        application: application as unknown as Record<string, unknown>,
        documents: documents as unknown as Record<string, unknown>[],
        deadlines: deadlines as unknown as Record<string, unknown>[],
      },
    };
  },
});

// ───────────────────────────── catalogue reads ─────────────────────────────

registerTool({
  slug: 'catalog.university.search',
  name: 'University search',
  description: 'Search the verified ALO university catalogue and return source metadata.',
  category: 'CATALOG',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 120,
  securityClass: 'PUBLIC',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({
    country: z.string().trim().max(120).optional(),
    query: z.string().trim().max(200).optional(),
    maxIelts: z.number().min(0).max(10).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  output: z.object({ universities: z.array(z.record(z.string(), z.unknown())), total: z.number().int() }),
  handler: async (args) => {
    const rows = await db.crmUniversity.findMany({
      where: {
        ...(args.country ? { country: { contains: String(args.country) } } : {}),
        ...(args.query ? { name: { contains: String(args.query) } } : {}),
        ...(args.maxIelts !== undefined ? { ieltsMin: { lte: Number(args.maxIelts) } } : {}),
      },
      select: {
        id: true, universityId: true, name: true, country: true, city: true, worldRanking: true, ranking: true,
        ieltsMin: true, officialUrl: true, website: true, sourceUrl: true, lastVerifiedAt: true, verificationStatus: true,
      },
      orderBy: [{ worldRanking: 'asc' }, { name: 'asc' }],
      take: Number(args.limit ?? 20),
    });
    return { ok: true, data: { universities: rows as unknown as Record<string, unknown>[], total: rows.length } };
  },
});

registerTool({
  slug: 'catalog.course.search',
  name: 'Course search',
  description: 'Search the ALO course catalogue with optional level/country/subject filters.',
  category: 'CATALOG',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 20_000,
  rateLimitPerMin: 120,
  securityClass: 'PUBLIC',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({
    country: z.string().trim().max(120).optional(),
    level: z.string().trim().max(120).optional(),
    subject: z.string().trim().max(200).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  output: z.object({
    courses: z.array(z.record(z.string(), z.unknown())),
    requirements: z.array(z.record(z.string(), z.unknown())),
    total: z.number().int(),
  }),
  handler: async (args) => {
    const limit = Number(args.limit ?? 40);
    const candidates = await db.crmCourse.findMany({
      where: {
        ...(args.country ? { country: { contains: String(args.country) } } : {}),
        ...(args.level ? { studyLevel: { contains: String(args.level) } } : {}),
      },
      select: {
        id: true, courseId: true, courseTitle: true, universityId: true, country: true, city: true,
        studyLevel: true, qualification: true, subjectArea: true, disciplineArea: true, durationMonths: true,
        tuitionFee: true, currency: true, highAcceptance: true, officialUrl: true, deadline: true,
      },
      take: Math.max(limit * 4, 80),
    });
    // Subject relevance is ranked deterministically rather than by a LIKE scan,
    // so "business analytics" also matches "MSc Business Analytics and Data Science".
    const subjectTokens = args.subject ? tokenize(String(args.subject)) : [];
    const ranked = subjectTokens.length
      ? candidates
          .map((course) => ({
            course,
            relevance: overlapScore(subjectTokens, tokenize(`${course.courseTitle} ${course.subjectArea} ${course.disciplineArea}`)),
          }))
          .filter((row) => row.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, limit)
          .map((row) => row.course)
      : candidates.slice(0, limit);

    const universityIds = [...new Set(ranked.map((course) => course.universityId))];
    const universities = universityIds.length
      ? await db.crmUniversity.findMany({ where: { universityId: { in: universityIds } }, select: { universityId: true, name: true, ieltsMin: true } })
      : [];
    const universityByKey = new Map(universities.map((row) => [row.universityId, row]));
    const courseIds = ranked.map((course) => course.courseId);
    const requirements = courseIds.length
      ? await db.crmCourseRequirement.findMany({
          where: { courseId: { in: courseIds } },
          select: { courseId: true, ieltsOverall: true, ieltsMinBand: true, minScore: true, academicReq: true, englishTest: true },
        })
      : [];
    const courses = ranked.map((course) => ({
      ...course,
      universityName: universityByKey.get(course.universityId)?.name ?? '',
      ieltsMin: universityByKey.get(course.universityId)?.ieltsMin ?? 0,
    }));
    return {
      ok: true,
      data: {
        courses: courses as unknown as Record<string, unknown>[],
        requirements: requirements as unknown as Record<string, unknown>[],
        total: courses.length,
      },
    };
  },
});

registerTool({
  slug: 'catalog.scholarship.search',
  name: 'Scholarship search',
  description: 'Search verified scholarships with eligibility and deadline metadata.',
  category: 'CATALOG',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 120,
  securityClass: 'PUBLIC',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({
    universityId: z.string().trim().max(191).optional(),
    country: z.string().trim().max(120).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  output: z.object({ scholarships: z.array(z.record(z.string(), z.unknown())), total: z.number().int() }),
  handler: async (args) => {
    let universityIds: string[] | undefined;
    if (args.country) {
      const universities = await db.crmUniversity.findMany({
        where: { country: { contains: String(args.country) } },
        select: { universityId: true },
        take: 500,
      });
      universityIds = universities.map((row) => row.universityId);
    }
    const rows = await db.crmScholarship.findMany({
      where: {
        status: 'active',
        ...(args.universityId ? { universityId: String(args.universityId) } : {}),
        ...(universityIds ? { universityId: { in: universityIds.length ? universityIds : ['__none__'] } } : {}),
      },
      select: {
        id: true, scholarshipName: true, provider: true, universityId: true, eligibleCountries: true,
        eligibleLevels: true, scholarshipAmount: true, scholarshipCurrency: true, deadline: true,
        officialScholarshipUrl: true, expiryStatus: true,
      },
      take: Number(args.limit ?? 40),
    });
    return { ok: true, data: { scholarships: rows as unknown as Record<string, unknown>[], total: rows.length } };
  },
});

// ───────────────────────────── knowledge ─────────────────────────────

registerTool({
  slug: 'knowledge.search',
  name: 'Knowledge retrieval',
  description: 'Retrieve access-controlled knowledge chunks with citations.',
  category: 'KNOWLEDGE',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 120,
  securityClass: 'INTERNAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({ query: shortText, limit: z.number().int().min(1).max(20).optional() }),
  output: z.object({
    chunks: z.array(z.object({ content: z.string(), citation: z.string(), score: z.number(), sourceSlug: z.string() })),
    total: z.number().int(),
  }),
  handler: async (args, ctx) => {
    const { retrieveKnowledge } = await import('./../knowledge');
    const chunks = await retrieveKnowledge(String(args.query), ctx.actor, Number(args.limit ?? 5));
    return { ok: true, data: { chunks, total: chunks.length } };
  },
});

// ───────────────────────────── document analysis ─────────────────────────────

registerTool({
  slug: 'document.analyze',
  name: 'Document analysis',
  description: 'Validate uploaded document metadata and classify completeness for a student.',
  category: 'DOCUMENTS',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 60,
  securityClass: 'CONFIDENTIAL',
  mutates: false,
  auditPolicy: 'ALWAYS',
  input: z.object({ studentId: id }),
  output: z.object({
    documents: z.array(z.record(z.string(), z.unknown())),
    rejectedFiles: z.array(z.object({ fileName: z.string(), reasons: z.array(z.string()) })),
    verifiedCount: z.number().int(),
  }),
  handler: async (args, ctx) => {
    const studentId = String(args.studentId);
    if (scopeViolation(ctx, studentId)) return fail('student is outside the caller scope');
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true } });
    if (!student) return fail('student not found');
    const documents = await db.studentDocument.findMany({
      where: { studentId: student.id, isArchived: false },
      select: { id: true, category: true, fileName: true, status: true, fileUrl: true },
      take: 100,
    });
    const rejectedFiles: Array<{ fileName: string; reasons: string[] }> = [];
    const accepted: Record<string, unknown>[] = [];
    for (const doc of documents) {
      const screening = screenFileInput({ fileName: doc.fileName });
      if (!screening.ok) rejectedFiles.push({ fileName: doc.fileName, reasons: screening.reasons });
      else accepted.push({ ...doc, documentType: doc.category });
    }
    return {
      ok: true,
      data: {
        documents: accepted,
        rejectedFiles,
        verifiedCount: accepted.filter((doc) => String(doc.status).toUpperCase() === 'VERIFIED').length,
      },
    };
  },
});

// ───────────────────────────── reporting ─────────────────────────────

registerTool({
  slug: 'reporting.metrics',
  name: 'Operational metrics',
  description: 'Aggregate live operational counters from the ALO database for reporting.',
  category: 'REPORTING',
  permission: 'TOOL_READ',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 20_000,
  rateLimitPerMin: 30,
  securityClass: 'INTERNAL',
  mutates: false,
  auditPolicy: 'ON_WRITE',
  input: z.object({ scope: z.enum(['CRM', 'APPLICATIONS', 'AI']).default('CRM') }),
  output: z.object({ metrics: z.array(z.object({ label: z.string(), value: z.number(), unit: z.string() })) }),
  handler: async (args, ctx) => {
    if (['STUDENT', 'PARTNER'].includes(ctx.actor.role)) return fail('operational reporting is internal to ALO staff');
    const scope = String(args.scope || 'CRM');
    const metrics: Array<{ label: string; value: number; unit: string }> = [];
    if (scope === 'CRM') {
      const [leads, newLeads, unassigned, students] = await Promise.all([
        db.lead.count(),
        db.lead.count({ where: { status: 'NEW' } }),
        db.lead.count({ where: { OR: [{ counselorId: null }, { counselorId: '' }] } }),
        db.student.count(),
      ]);
      metrics.push(
        { label: 'Total leads', value: leads, unit: '' },
        { label: 'New leads', value: newLeads, unit: '' },
        { label: 'Unassigned leads', value: unassigned, unit: '' },
        { label: 'Total students', value: students, unit: '' }
      );
    } else if (scope === 'APPLICATIONS') {
      const [applications, drafts, overdue] = await Promise.all([
        db.application.count(),
        db.application.count({ where: { safeStatus: 'DRAFT' } }),
        db.applicationDeadline.count({ where: { status: 'OVERDUE' } }),
      ]);
      metrics.push(
        { label: 'Total applications', value: applications, unit: '' },
        { label: 'Draft applications', value: drafts, unit: '' },
        { label: 'Overdue deadlines', value: overdue, unit: '' }
      );
    } else {
      const [runs, failed, approvals] = await Promise.all([
        db.awfRun.count(),
        db.awfRun.count({ where: { status: 'FAILED' } }),
        db.awfApproval.count({ where: { status: 'PENDING' } }),
      ]);
      metrics.push(
        { label: 'Agent runs', value: runs, unit: '' },
        { label: 'Failed runs', value: failed, unit: '' },
        { label: 'Pending approvals', value: approvals, unit: '' }
      );
    }
    return { ok: true, data: { metrics } };
  },
});

// ───────────────────────────── CRM writes ─────────────────────────────

registerTool({
  slug: 'crm.task.create',
  name: 'Create follow-up task',
  description: 'Create a CRM task for a human owner. Idempotent on title + assignee + student.',
  category: 'CRM',
  permission: 'TOOL_WRITE',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 60,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    title: shortText,
    description: z.string().trim().max(2000).optional(),
    assigneeId: id,
    studentId: z.string().trim().max(191).optional(),
    type: z.string().trim().max(60).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().trim().max(40).optional(),
  }),
  output: z.object({ taskId: id, created: z.boolean() }),
  handler: async (args) => {
    const title = String(args.title);
    const assigneeId = String(args.assigneeId);
    const studentId = args.studentId ? String(args.studentId) : null;
    // Idempotency (§21): the same proposed task is never duplicated.
    const existing = await db.task.findFirst({
      where: { title, assigneeId, studentId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      select: { id: true },
    });
    if (existing) return { ok: true, data: { taskId: existing.id, created: false }, mutationCount: 0 };
    const task = await db.task.create({
      data: {
        title,
        description: args.description ? String(args.description) : null,
        assigneeId,
        studentId,
        type: String(args.type || 'FOLLOW_UP'),
        priority: String(args.priority || 'NORMAL'),
        status: 'PENDING',
        dueDate: args.dueDate ? String(args.dueDate) : null,
      },
      select: { id: true },
    });
    return { ok: true, data: { taskId: task.id, created: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'crm.timeline.append',
  name: 'Append timeline event',
  description: 'Record an AI-generated note on the student timeline.',
  category: 'CRM',
  permission: 'TOOL_WRITE',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 120,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    studentId: id,
    title: shortText,
    stage: z.string().trim().max(60).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  output: z.object({ eventId: id }),
  handler: async (args, ctx) => {
    const studentId = String(args.studentId);
    if (scopeViolation(ctx, studentId)) return fail('student is outside the caller scope');
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true } });
    if (!student) return fail('student not found');
    const row = await db.timelineEvent.create({
      data: {
        studentId: student.id,
        stage: String(args.stage || 'AI_NOTE'),
        title: String(args.title),
        actor: `agent:${ctx.agentSlug}`,
        type: 'AI_NOTE',
        meta: JSON.stringify(args.metadata ?? {}).slice(0, 20_000),
      },
      select: { id: true },
    });
    return { ok: true, data: { eventId: row.id }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'crm.lead.score.update',
  name: 'Update lead score',
  description: 'Persist an AI-derived lead score and tier on the CRM lead record.',
  category: 'CRM',
  permission: 'TOOL_WRITE',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 120,
  securityClass: 'CONFIDENTIAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    leadId: id,
    score: z.number().int().min(0).max(100),
    tier: z.enum(['HOT', 'WARM', 'COLD', 'UNQUALIFIED']),
  }),
  output: z.object({ leadId: id, score: z.number().int(), tier: z.string(), changed: z.boolean() }),
  handler: async (args) => {
    const lookup = String(args.leadId);
    const lead = await db.lead.findFirst({ where: { OR: [{ id: lookup }, { leadId: lookup }] }, select: { id: true, leadScore: true, leadTier: true } });
    if (!lead) return fail('lead not found');
    const score = Number(args.score);
    const tier = String(args.tier);
    if (lead.leadScore === score && lead.leadTier === tier) {
      return { ok: true, data: { leadId: lead.id, score, tier, changed: false }, mutationCount: 0 };
    }
    await db.lead.update({ where: { id: lead.id }, data: { leadScore: score, leadTier: tier } });
    return { ok: true, data: { leadId: lead.id, score, tier, changed: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'crm.appointment.create',
  name: 'Create appointment',
  description: 'Schedule a counselling appointment for a student. Idempotent per student + slot.',
  category: 'CRM',
  permission: 'TOOL_WRITE',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 30,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    studentId: id,
    title: shortText,
    scheduledAt: z.string().trim().min(4).max(60),
    type: z.string().trim().max(60).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  output: z.object({ appointmentId: id, created: z.boolean() }),
  handler: async (args, ctx) => {
    const studentId = String(args.studentId);
    if (scopeViolation(ctx, studentId)) return fail('student is outside the caller scope');
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true } });
    if (!student) return fail('student not found');
    const scheduledAt = parseDateLoose(args.scheduledAt);
    if (!scheduledAt) return fail('scheduledAt is not a parseable date');
    const existing = await db.appointment.findFirst({
      where: { studentId: student.id, scheduledAt, status: { in: ['scheduled', 'confirmed'] } },
      select: { id: true },
    });
    if (existing) return { ok: true, data: { appointmentId: existing.id, created: false }, mutationCount: 0 };
    const row = await db.appointment.create({
      data: {
        studentId: student.id,
        title: String(args.title),
        type: String(args.type || 'counseling'),
        status: 'scheduled',
        scheduledAt,
        notes: String(args.notes || ''),
      },
      select: { id: true },
    });
    return { ok: true, data: { appointmentId: row.id, created: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'notification.prepare',
  name: 'Prepare notification',
  description: 'Prepare an in-app notification for human review. Does not deliver anything externally.',
  category: 'COMMUNICATION',
  permission: 'TOOL_WRITE',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 60,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    studentId: id,
    title: shortText,
    message: z.string().trim().min(1).max(2000),
    type: z.string().trim().max(40).optional(),
  }),
  output: z.object({ notificationId: id, delivered: z.boolean(), created: z.boolean() }),
  handler: async (args, ctx) => {
    const studentId = String(args.studentId);
    if (scopeViolation(ctx, studentId)) return fail('student is outside the caller scope');
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true } });
    if (!student) return fail('student not found');
    const title = String(args.title);
    const existing = await db.notification.findFirst({ where: { studentId: student.id, title, isRead: false }, select: { id: true } });
    if (existing) return { ok: true, data: { notificationId: existing.id, delivered: false, created: false }, mutationCount: 0 };
    const row = await db.notification.create({
      data: { studentId: student.id, title, message: String(args.message), type: String(args.type || 'info') },
      select: { id: true },
    });
    // `delivered` is always false: external delivery is a separate, approval-gated tool.
    return { ok: true, data: { notificationId: row.id, delivered: false, created: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'application.deadline.upsert',
  name: 'Track application deadline',
  description: 'Create or refresh a tracked deadline on an application.',
  category: 'APPLICATIONS',
  permission: 'TOOL_WRITE',
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 10_000,
  rateLimitPerMin: 60,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    applicationId: id,
    deadlineType: z.string().trim().min(1).max(60),
    deadlineDate: z.string().trim().min(4).max(60),
    note: z.string().trim().max(500).optional(),
  }),
  output: z.object({ deadlineId: id, created: z.boolean(), status: z.string() }),
  handler: async (args) => {
    const applicationId = String(args.applicationId);
    const application = await db.application.findFirst({
      where: { OR: [{ id: applicationId }, { applicationCode: applicationId }] },
      select: { id: true },
    });
    if (!application) return fail('application not found');
    const deadlineDate = parseDateLoose(args.deadlineDate);
    if (!deadlineDate) return fail('deadlineDate is not a parseable date');
    const days = Math.floor((deadlineDate.getTime() - Date.now()) / 86_400_000);
    const status = days < 0 ? 'OVERDUE' : days === 0 ? 'DUE_TODAY' : days <= 3 ? 'DUE_IN_3_DAYS' : days <= 7 ? 'DUE_IN_7_DAYS' : 'PENDING';
    const existing = await db.applicationDeadline.findFirst({
      where: { applicationId: application.id, deadlineType: String(args.deadlineType) },
      select: { id: true },
    });
    if (existing) {
      await db.applicationDeadline.update({ where: { id: existing.id }, data: { deadlineDate, status, note: String(args.note || '') } });
      return { ok: true, data: { deadlineId: existing.id, created: false, status }, mutationCount: 1 };
    }
    const row = await db.applicationDeadline.create({
      data: { applicationId: application.id, deadlineType: String(args.deadlineType), deadlineDate, status, note: String(args.note || '') },
      select: { id: true },
    });
    return { ok: true, data: { deadlineId: row.id, created: true, status }, mutationCount: 1 };
  },
});

// ───────────────────────────── website / Virtual Editor ─────────────────────────────

registerTool({
  slug: 'cms.content.draft',
  name: 'Create website content draft',
  description: 'Write an unpublished draft into the ALO content store for Virtual Editor review.',
  category: 'WEBSITE',
  permission: 'TOOL_WRITE',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  timeoutMs: 15_000,
  rateLimitPerMin: 30,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    slug: z.string().trim().min(1).max(190),
    title: shortText,
    contentType: z.string().trim().min(1).max(60),
    body: z.string().trim().min(20).max(100_000),
    metaTitle: z.string().trim().max(200).optional(),
    metaDescription: z.string().trim().max(400).optional(),
    keywords: z.array(z.string().trim().max(80)).max(30).optional(),
    topic: z.string().trim().max(200).optional(),
  }),
  output: z.object({ contentId: id, status: z.string(), created: z.boolean() }),
  handler: async (args, ctx) => {
    const slug = String(args.slug);
    const existing = await db.contentAsset.findUnique({ where: { slug }, select: { id: true, status: true } });
    const data = {
      title: String(args.title),
      topic: args.topic ? String(args.topic) : null,
      contentType: String(args.contentType),
      body: String(args.body),
      metaTitle: args.metaTitle ? String(args.metaTitle) : null,
      metaDescription: args.metaDescription ? String(args.metaDescription) : null,
      targetKeywords: args.keywords ? JSON.stringify(args.keywords) : null,
      authorAgentId: ctx.agentSlug,
      status: 'DRAFT',
      source: 'ALO_AI_WORKFORCE',
    };
    if (existing) {
      if (existing.status === 'PUBLISHED') return fail('published content cannot be overwritten by a draft tool; use the publish workflow');
      await db.contentAsset.update({ where: { id: existing.id }, data });
      return { ok: true, data: { contentId: existing.id, status: 'DRAFT', created: false }, mutationCount: 1 };
    }
    const row = await db.contentAsset.create({ data: { ...data, slug }, select: { id: true } });
    return { ok: true, data: { contentId: row.id, status: 'DRAFT', created: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'cms.content.publish',
  name: 'Publish website content',
  description: 'Publish an approved content draft to the live website. High risk: requires an action-bound human approval.',
  category: 'WEBSITE',
  permission: 'TOOL_WRITE',
  riskLevel: 'HIGH',
  requiresApproval: true,
  timeoutMs: 15_000,
  rateLimitPerMin: 10,
  securityClass: 'INTERNAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({ contentId: id, publishedUrl: z.string().trim().max(500).optional() }),
  output: z.object({ contentId: id, status: z.string(), publishedAt: z.string() }),
  handler: async (args, ctx) => {
    const contentId = String(args.contentId);
    const asset = await db.contentAsset.findUnique({ where: { id: contentId }, select: { id: true, status: true, body: true, title: true, slug: true } });
    if (!asset) return fail('content asset not found');
    if (asset.status === 'PUBLISHED') return { ok: true, data: { contentId: asset.id, status: 'PUBLISHED', publishedAt: new Date().toISOString() }, mutationCount: 0 };
    const publishedAt = new Date();
    const publishedUrl = args.publishedUrl ? String(args.publishedUrl) : `/${asset.slug}`;
    // Virtual Editor integration: the publication record is the editor-visible
    // history entry, and the approving human is recorded on the asset itself.
    const [, publication] = await db.$transaction([
      db.contentAsset.update({
        where: { id: asset.id },
        data: { status: 'PUBLISHED', publishedAt, publishedUrl, humanApproverId: ctx.actor.userId },
      }),
      db.contentPublication.create({
        data: {
          contentAssetId: asset.id,
          platform: 'WEBSITE',
          status: 'PUBLISHED',
          publishedAt,
          publishedUrl,
        },
        select: { id: true },
      }),
    ]);
    void publication;
    return { ok: true, data: { contentId: asset.id, status: 'PUBLISHED', publishedAt: publishedAt.toISOString() }, mutationCount: 2 };
  },
});

// ───────────────────────────── high-risk / gated ─────────────────────────────

registerTool({
  slug: 'comms.external.send',
  name: 'Send external message',
  description: 'Deliver a message outside ALO. Requires an action-bound approval AND a verified connector.',
  category: 'COMMUNICATION',
  permission: 'TOOL_EXTERNAL_SEND',
  riskLevel: 'HIGH',
  requiresApproval: true,
  timeoutMs: 20_000,
  rateLimitPerMin: 10,
  securityClass: 'CONFIDENTIAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
    recipient: z.string().trim().min(3).max(200),
    subject: z.string().trim().max(200).optional(),
    body: z.string().trim().min(1).max(5000),
  }),
  output: z.object({ queued: z.boolean(), draftId: id, reason: z.string() }),
  handler: async (args, ctx) => {
    // Even with an approval consumed, external delivery only proceeds when an
    // operator has configured a verified connector. Otherwise the message is
    // persisted as a reviewable draft; it is never silently dropped.
    const connectorConfigured = Boolean(process.env.ALO_VERIFIED_OUTBOUND_CONNECTOR);
    const draft = await db.communicationDraft.create({
      data: {
        channel: String(args.channel),
        draftBody: String(args.body),
        aiGenerated: true,
        riskLevel: 'HIGH',
        mode: 'APPROVED_AUTOMATION',
        status: connectorConfigured ? 'APPROVED' : 'DRAFT',
        aiReasoning: JSON.stringify({
          recipient: String(args.recipient),
          subject: String(args.subject || ''),
          connector: connectorConfigured ? 'verified' : 'not-configured',
        }),
        createdBy: `agent:${ctx.agentSlug}`,
        approvedBy: ctx.actor.userId,
        approvedAt: new Date(),
      },
      select: { id: true },
    });
    return {
      ok: true,
      data: {
        queued: connectorConfigured,
        draftId: draft.id,
        reason: connectorConfigured ? 'queued on the verified connector' : 'no verified outbound connector configured; stored as an approved draft',
      },
      mutationCount: 1,
    };
  },
});

registerTool({
  slug: 'crm.lead.assign',
  name: 'Assign lead to counsellor',
  description: 'Reassign CRM ownership of a lead. High risk: requires an action-bound human approval.',
  category: 'CRM',
  permission: 'TOOL_WRITE',
  riskLevel: 'HIGH',
  requiresApproval: true,
  timeoutMs: 10_000,
  rateLimitPerMin: 20,
  securityClass: 'CONFIDENTIAL',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({ leadId: id, counselorId: id, reason: z.string().trim().max(300).optional() }),
  output: z.object({ leadId: id, counselorId: id, changed: z.boolean() }),
  handler: async (args) => {
    const lookup = String(args.leadId);
    const lead = await db.lead.findFirst({ where: { OR: [{ id: lookup }, { leadId: lookup }] }, select: { id: true, counselorId: true } });
    if (!lead) return fail('lead not found');
    const counselorId = String(args.counselorId);
    const counselor = await db.user.findUnique({ where: { id: counselorId }, select: { id: true, status: true } });
    if (!counselor || counselor.status !== 'ACTIVE') return fail('counsellor is not an active user');
    if (lead.counselorId === counselorId) return { ok: true, data: { leadId: lead.id, counselorId, changed: false }, mutationCount: 0 };
    await db.lead.update({ where: { id: lead.id }, data: { counselorId, assignedReason: String(args.reason || 'AI workforce assignment (human approved)') } });
    return { ok: true, data: { leadId: lead.id, counselorId, changed: true }, mutationCount: 1 };
  },
});

registerTool({
  slug: 'finance.payment.record',
  name: 'Record a payment',
  description: 'Record a financial transaction. CRITICAL: Super Admin approval is always required.',
  category: 'FINANCE',
  permission: 'TOOL_FINANCE',
  riskLevel: 'CRITICAL',
  requiresApproval: true,
  timeoutMs: 15_000,
  rateLimitPerMin: 5,
  securityClass: 'RESTRICTED',
  mutates: true,
  auditPolicy: 'ALWAYS',
  input: z.object({
    studentId: id,
    amount: z.number().positive().max(10_000_000),
    currency: z.string().trim().min(3).max(6),
    purpose: shortText,
  }),
  output: z.object({ paymentId: id, amount: z.number(), status: z.string() }),
  handler: async (args) => {
    const studentId = String(args.studentId);
    const student = await db.student.findFirst({ where: { OR: [{ id: studentId }, { studentId }] }, select: { id: true } });
    if (!student) return fail('student not found');
    const amount = Number(args.amount);
    const purpose = String(args.purpose).toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 40) || 'SERVICE_CHARGE';
    // Deterministic payment id keeps a retried approved action idempotent.
    const paymentId = `AWF-${stableHash({ studentId: student.id, amount, currency: args.currency, purpose })}`;
    const existing = await db.payment.findUnique({ where: { paymentId }, select: { id: true } });
    if (existing) return { ok: true, data: { paymentId: existing.id, amount, status: 'PENDING' }, mutationCount: 0 };
    const row = await db.payment.create({
      data: {
        paymentId,
        studentId: student.id,
        amount,
        currency: String(args.currency).toUpperCase(),
        type: purpose,
        status: 'PENDING',
      },
      select: { id: true },
    });
    return { ok: true, data: { paymentId: row.id, amount, status: 'PENDING' }, mutationCount: 1 };
  },
});

export const TOOL_COUNT = 18;
