/**
 * ALO AI Workforce — skill catalogue.
 *
 * Each skill performs real work: it pulls facts from the ALO database through
 * permitted tools, obtains a schema-validated judgement from the ALO AI
 * Gateway, and (where the workflow authorises it) persists the outcome. A skill
 * that cannot complete returns ok:false — it never returns a fabricated result.
 */
import { z } from 'zod';
import { registerSkill, type SkillContext } from './registry';
import type { SkillResult } from './../types';

const idSchema = z.string().trim().min(1).max(191);

function failure(error: string, evidence: Record<string, unknown> = {}): SkillResult {
  return { ok: false, output: {}, evidence, error, substantive: false };
}

// ───────────────────────────── lead intelligence ─────────────────────────────

registerSkill({
  slug: 'lead.qualify',
  name: 'Qualify lead',
  description: 'Score and classify a CRM lead, identify missing information and persist the result.',
  permission: 'SKILL_WRITE',
  version: 1,
  requiredTools: ['crm.lead.read', 'crm.lead.score.update'],
  input: z.object({ leadId: idSchema, persist: z.boolean().default(true) }),
  output: z.object({
    leadId: z.string(),
    tier: z.string(),
    score: z.number(),
    intent: z.string(),
    missingFields: z.array(z.string()),
    recommendedAction: z.string(),
    rationale: z.array(z.string()),
    persisted: z.boolean(),
  }),
  execute: async (input, ctx) => {
    const read = await ctx.callTool('crm.lead.read', { leadId: input.leadId });
    await ctx.recordStep({ stepKey: 'read-lead', stepType: 'TOOL', refSlug: 'crm.lead.read', status: read.ok ? 'COMPLETED' : 'FAILED', output: { found: read.data?.found } });
    if (!read.ok) return failure(read.error || 'lead read failed');
    if (!read.data?.found) return failure('AWF_LEAD_NOT_FOUND');
    const lead = read.data.lead as Record<string, unknown>;

    const judgement = await ctx.reason({
      task: 'lead.qualify',
      instructions:
        'Qualify this ALO Education lead. Score 0-100, classify intent, list missing fields using the exact CRM field names, and recommend one next action. Use only the supplied lead record.',
      input: {},
      context: { lead },
      outputSchemaKey: 'lead.qualification',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'qualify', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED', output: { tier: judgement.data.tier, score: judgement.data.score } });

    let persisted = false;
    if (input.persist) {
      const update = await ctx.callTool('crm.lead.score.update', {
        leadId: String(lead.id),
        score: Number(judgement.data.score),
        tier: String(judgement.data.tier),
      });
      await ctx.recordStep({ stepKey: 'persist-score', stepType: 'TOOL', refSlug: 'crm.lead.score.update', status: update.ok ? 'COMPLETED' : 'FAILED' });
      if (!update.ok) return failure(update.error || 'score persistence failed');
      persisted = ctx.mode === 'PRODUCTION';
    }

    return {
      ok: true,
      substantive: true,
      output: {
        leadId: String(lead.id),
        tier: String(judgement.data.tier),
        score: Number(judgement.data.score),
        intent: String(judgement.data.intent),
        missingFields: judgement.data.missingFields as string[],
        recommendedAction: String(judgement.data.recommendedAction),
        rationale: judgement.data.rationale as string[],
        persisted,
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic, fallbackUsed: judgement.fallbackUsed },
    };
  },
});

registerSkill({
  slug: 'lead.followup.plan',
  name: 'Plan lead follow-up',
  description: 'Create an idempotent follow-up task for the owning counsellor based on a qualification result.',
  permission: 'SKILL_WRITE',
  version: 1,
  requiredTools: ['crm.lead.read', 'crm.task.create'],
  input: z.object({
    leadId: idSchema,
    tier: z.string().min(1).max(40),
    recommendedAction: z.string().min(1).max(60),
    missingFields: z.array(z.string()).default([]),
    assigneeId: idSchema.optional(),
  }),
  output: z.object({ taskId: z.string(), created: z.boolean(), assigneeId: z.string(), title: z.string() }),
  execute: async (rawInput, ctx) => {
    const input = rawInput as { leadId: string; tier: string; recommendedAction: string; missingFields: string[]; assigneeId?: string };
    const read = await ctx.callTool('crm.lead.read', { leadId: input.leadId });
    if (!read.ok || !read.data?.found) return failure('AWF_LEAD_NOT_FOUND');
    const lead = read.data.lead as Record<string, unknown>;
    const assigneeId = String(input.assigneeId || lead.counselorId || '').trim();
    if (!assigneeId) {
      // No owner exists: this is genuinely human work, not a silent failure.
      return {
        ok: true,
        substantive: false,
        humanReviewRequired: true,
        output: { taskId: '', created: false, assigneeId: '', title: '' },
        evidence: { reason: 'lead has no assigned counsellor; assignment is an approval-gated action' },
      };
    }
    const title = `${input.recommendedAction.replace(/_/g, ' ')} — ${String(lead.fullName || 'lead')} [${input.tier}]`;
    const description = input.missingFields.length
      ? `AI qualification tier ${input.tier}. Collect missing information: ${input.missingFields.join(', ')}.`
      : `AI qualification tier ${input.tier}. No missing profile fields detected.`;
    const created = await ctx.callTool('crm.task.create', {
      title,
      description,
      assigneeId,
      studentId: lead.studentId ? String(lead.studentId) : undefined,
      type: 'FOLLOW_UP',
      priority: input.tier === 'HOT' ? 'HIGH' : 'NORMAL',
    });
    await ctx.recordStep({ stepKey: 'create-task', stepType: 'TOOL', refSlug: 'crm.task.create', status: created.ok ? 'COMPLETED' : 'FAILED' });
    if (!created.ok) return failure(created.error || 'task creation failed');
    return {
      ok: true,
      substantive: true,
      output: {
        taskId: String(created.data?.taskId ?? ''),
        created: Boolean(created.data?.created),
        assigneeId,
        title,
      },
      evidence: { idempotent: created.data?.created === false },
    };
  },
});

// ───────────────────────────── student profile ─────────────────────────────

registerSkill({
  slug: 'student.profile.analyze',
  name: 'Analyse student profile',
  description: 'Summarise a student profile, compute completeness and prepare a counsellor briefing.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['crm.student.read'],
  input: z.object({ studentId: idSchema }),
  output: z.object({
    studentId: z.string(),
    completeness: z.number(),
    missingFields: z.array(z.string()),
    strengths: z.array(z.string()),
    risks: z.array(z.string()),
    summary: z.string(),
    counselorBriefing: z.array(z.string()),
  }),
  execute: async (input, ctx) => {
    const read = await ctx.callTool('crm.student.read', { studentId: input.studentId });
    await ctx.recordStep({ stepKey: 'read-student', stepType: 'TOOL', refSlug: 'crm.student.read', status: read.ok ? 'COMPLETED' : 'FAILED' });
    if (!read.ok) return failure(read.error || 'student read failed');
    if (!read.data?.found) return failure('AWF_STUDENT_NOT_FOUND');

    const judgement = await ctx.reason({
      task: 'profile.analyze',
      instructions: 'Analyse this ALO student profile. Report completeness, missing sections, strengths, risks and a counsellor briefing. Use only the supplied records.',
      input: {},
      context: {
        student: read.data.student,
        education: read.data.education,
        englishTests: read.data.englishTests,
        documents: read.data.documents,
        passport: read.data.passport,
        funding: read.data.funding,
        preferences: read.data.preferences,
      },
      outputSchemaKey: 'profile.analysis',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'analyze', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });

    return {
      ok: true,
      substantive: true,
      output: {
        studentId: String((read.data.student as Record<string, unknown>).id),
        completeness: Number(judgement.data.completeness),
        missingFields: judgement.data.missingFields as string[],
        strengths: judgement.data.strengths as string[],
        risks: judgement.data.risks as string[],
        summary: String(judgement.data.summary),
        counselorBriefing: judgement.data.counselorBriefing as string[],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

// ───────────────────────────── course matching ─────────────────────────────

registerSkill({
  slug: 'course.match',
  name: 'Match courses',
  description: 'Compare a student profile against the verified course catalogue and explain eligibility.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['catalog.course.search'],
  input: z.object({
    profile: z.object({
      preferredCountry: z.string().max(120).optional(),
      preferredLevel: z.string().max(120).optional(),
      preferredCourse: z.string().max(200).optional(),
      currentQualification: z.string().max(200).optional(),
      englishScore: z.union([z.string(), z.number()]).optional(),
      budget: z.union([z.string(), z.number()]).optional(),
    }),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  output: z.object({
    matches: z.array(z.record(z.string(), z.unknown())),
    evaluated: z.number(),
    eligibleCount: z.number(),
    constraints: z.array(z.string()),
  }),
  execute: async (input, ctx) => {
    const profile = input.profile as Record<string, unknown>;
    const search = await ctx.callTool('catalog.course.search', {
      country: profile.preferredCountry,
      level: profile.preferredLevel,
      subject: profile.preferredCourse,
      limit: Number(input.limit),
    });
    await ctx.recordStep({ stepKey: 'search-courses', stepType: 'TOOL', refSlug: 'catalog.course.search', status: search.ok ? 'COMPLETED' : 'FAILED', output: { total: search.data?.total } });
    if (!search.ok) return failure(search.error || 'course search failed');

    const judgement = await ctx.reason({
      task: 'course.match',
      instructions: 'Rank the supplied ALO courses against the student profile. Mark eligibility strictly from the supplied requirements; never assume a requirement that is not present.',
      input: {},
      context: { profile, courses: search.data?.courses ?? [], requirements: search.data?.requirements ?? [] },
      outputSchemaKey: 'course.match',
    });
    await ctx.recordStep({ stepKey: 'rank', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });

    const matches = (judgement.data.matches as Array<Record<string, unknown>>) ?? [];
    return {
      ok: true,
      substantive: matches.length > 0,
      output: {
        matches,
        evaluated: Number(judgement.data.evaluated ?? 0),
        eligibleCount: matches.filter((match) => match.eligible === true).length,
        constraints: (judgement.data.constraints as string[]) ?? [],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic, catalogueSize: search.data?.total },
    };
  },
});

registerSkill({
  slug: 'university.research',
  name: 'Research universities',
  description: 'Retrieve verified university records with source metadata and citations.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['catalog.university.search'],
  input: z.object({ country: z.string().max(120).optional(), query: z.string().max(200).optional(), maxIelts: z.number().optional(), limit: z.number().int().min(1).max(50).default(15) }),
  output: z.object({ universities: z.array(z.record(z.string(), z.unknown())), evaluated: z.number(), citations: z.array(z.string()) }),
  execute: async (input, ctx) => {
    const search = await ctx.callTool('catalog.university.search', {
      country: input.country,
      query: input.query,
      maxIelts: input.maxIelts,
      limit: Number(input.limit),
    });
    if (!search.ok) return failure(search.error || 'university search failed');
    const judgement = await ctx.reason({
      task: 'university.research',
      instructions: 'Report the supplied universities with their verification status and official source URL. Do not add universities that are not in the supplied list.',
      input: {},
      context: { universities: search.data?.universities ?? [] },
      outputSchemaKey: 'university.research',
    });
    await ctx.recordStep({ stepKey: 'research', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    return {
      ok: true,
      substantive: Number(judgement.data.evaluated ?? 0) > 0,
      output: {
        universities: (judgement.data.universities as Array<Record<string, unknown>>) ?? [],
        evaluated: Number(judgement.data.evaluated ?? 0),
        citations: (judgement.data.citations as string[]) ?? [],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

registerSkill({
  slug: 'scholarship.find',
  name: 'Find scholarships',
  description: 'Match verified scholarships to a student profile and classify deadline status.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['catalog.scholarship.search'],
  input: z.object({
    profile: z.object({
      nationality: z.string().max(120).optional(),
      currentCountry: z.string().max(120).optional(),
      preferredLevel: z.string().max(120).optional(),
      preferredCountry: z.string().max(120).optional(),
    }),
    limit: z.number().int().min(1).max(50).default(25),
  }),
  output: z.object({ matches: z.array(z.record(z.string(), z.unknown())), evaluated: z.number(), eligibleCount: z.number() }),
  execute: async (input, ctx) => {
    const profile = input.profile as Record<string, unknown>;
    const search = await ctx.callTool('catalog.scholarship.search', { country: profile.preferredCountry, limit: Number(input.limit) });
    if (!search.ok) return failure(search.error || 'scholarship search failed');
    const judgement = await ctx.reason({
      task: 'scholarship.match',
      instructions: 'Evaluate the supplied scholarships against the student profile. Mark ineligible only with an explicit blocker derived from the supplied eligibility data.',
      input: {},
      context: { profile, scholarships: search.data?.scholarships ?? [] },
      outputSchemaKey: 'scholarship.match',
    });
    await ctx.recordStep({ stepKey: 'match-scholarships', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    const matches = (judgement.data.matches as Array<Record<string, unknown>>) ?? [];
    return {
      ok: true,
      substantive: matches.length > 0,
      output: { matches, evaluated: Number(judgement.data.evaluated ?? 0), eligibleCount: matches.filter((row) => row.eligible === true).length },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

// ───────────────────────────── applications & visa ─────────────────────────────

registerSkill({
  slug: 'application.checklist',
  name: 'Build application checklist',
  description: 'Derive the document checklist, readiness and next actions for an application.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['crm.application.read'],
  input: z.object({ applicationId: idSchema }),
  output: z.object({
    applicationId: z.string(),
    items: z.array(z.record(z.string(), z.unknown())),
    missingCount: z.number(),
    readiness: z.number(),
    nextActions: z.array(z.string()),
    escalate: z.boolean(),
  }),
  execute: async (input, ctx) => {
    const read = await ctx.callTool('crm.application.read', { applicationId: input.applicationId });
    await ctx.recordStep({ stepKey: 'read-application', stepType: 'TOOL', refSlug: 'crm.application.read', status: read.ok ? 'COMPLETED' : 'FAILED' });
    if (!read.ok) return failure(read.error || 'application read failed');
    if (!read.data?.found) return failure('AWF_APPLICATION_NOT_FOUND');
    const application = read.data.application as Record<string, unknown>;
    const judgement = await ctx.reason({
      task: 'application.checklist',
      instructions: 'Derive the ALO application document checklist from the supplied documents and deadline. Do not invent documents that ALO does not require.',
      input: {},
      context: { documents: read.data.documents, deadline: application.deadlineDate || application.deadline },
      outputSchemaKey: 'checklist',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'checklist', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    return {
      ok: true,
      substantive: true,
      output: {
        applicationId: String(application.id),
        items: judgement.data.items as Array<Record<string, unknown>>,
        missingCount: Number(judgement.data.missingCount),
        readiness: Number(judgement.data.readiness),
        nextActions: judgement.data.nextActions as string[],
        escalate: Boolean(judgement.data.escalate),
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

registerSkill({
  slug: 'application.deadline.track',
  name: 'Track application deadline',
  description: 'Persist or refresh the tracked deadline for an application.',
  permission: 'SKILL_WRITE',
  version: 1,
  requiredTools: ['application.deadline.upsert'],
  input: z.object({ applicationId: idSchema, deadlineType: z.string().min(1).max(60).default('DOCUMENT_DEADLINE'), deadlineDate: z.string().min(4).max(60), note: z.string().max(500).optional() }),
  output: z.object({ deadlineId: z.string(), created: z.boolean(), status: z.string() }),
  execute: async (input, ctx) => {
    const result = await ctx.callTool('application.deadline.upsert', {
      applicationId: input.applicationId,
      deadlineType: input.deadlineType,
      deadlineDate: input.deadlineDate,
      note: input.note,
    });
    await ctx.recordStep({ stepKey: 'upsert-deadline', stepType: 'TOOL', refSlug: 'application.deadline.upsert', status: result.ok ? 'COMPLETED' : 'FAILED' });
    if (!result.ok) return failure(result.error || 'deadline tracking failed');
    return {
      ok: true,
      substantive: true,
      output: {
        deadlineId: String(result.data?.deadlineId ?? ''),
        created: Boolean(result.data?.created),
        status: String(result.data?.status ?? ''),
      },
      evidence: {},
    };
  },
});

registerSkill({
  slug: 'visa.checklist',
  name: 'Build visa checklist',
  description: 'Derive the visa document checklist and escalation state for a student.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['document.analyze'],
  input: z.object({ studentId: idSchema, deadline: z.string().max(60).optional() }),
  output: z.object({
    studentId: z.string(),
    items: z.array(z.record(z.string(), z.unknown())),
    missingCount: z.number(),
    readiness: z.number(),
    nextActions: z.array(z.string()),
    escalate: z.boolean(),
  }),
  execute: async (input, ctx) => {
    const analysis = await ctx.callTool('document.analyze', { studentId: input.studentId });
    await ctx.recordStep({ stepKey: 'analyze-documents', stepType: 'TOOL', refSlug: 'document.analyze', status: analysis.ok ? 'COMPLETED' : 'FAILED' });
    if (!analysis.ok) return failure(analysis.error || 'document analysis failed');
    const judgement = await ctx.reason({
      task: 'visa.checklist',
      instructions: 'Derive the visa document checklist from the supplied student documents and deadline. Escalate when required documents are outstanding close to the deadline.',
      input: {},
      context: { documents: analysis.data?.documents ?? [], deadline: input.deadline },
      outputSchemaKey: 'checklist',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'visa-checklist', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    return {
      ok: true,
      substantive: true,
      output: {
        studentId: String(input.studentId),
        items: judgement.data.items as Array<Record<string, unknown>>,
        missingCount: Number(judgement.data.missingCount),
        readiness: Number(judgement.data.readiness),
        nextActions: judgement.data.nextActions as string[],
        escalate: Boolean(judgement.data.escalate),
      },
      evidence: { runtimeKey: judgement.runtimeKey, rejectedFiles: analysis.data?.rejectedFiles },
    };
  },
});

// ───────────────────────────── CRM operations ─────────────────────────────

registerSkill({
  slug: 'crm.data.audit',
  name: 'Audit CRM data quality',
  description: 'Scan CRM leads for data-quality defects and propose fixes for human confirmation.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['crm.lead.search'],
  input: z.object({ status: z.string().max(60).optional(), limit: z.number().int().min(1).max(200).default(100) }),
  output: z.object({ issues: z.array(z.record(z.string(), z.unknown())), scanned: z.number(), summary: z.string() }),
  execute: async (input, ctx) => {
    const search = await ctx.callTool('crm.lead.search', { status: input.status, limit: Number(input.limit) });
    await ctx.recordStep({ stepKey: 'scan-leads', stepType: 'TOOL', refSlug: 'crm.lead.search', status: search.ok ? 'COMPLETED' : 'FAILED', output: { total: search.data?.total } });
    if (!search.ok) return failure(search.error || 'lead scan failed');
    const judgement = await ctx.reason({
      task: 'crm.cleanup',
      instructions: 'Identify data-quality defects in the supplied CRM leads and propose a non-destructive fix for each. Never propose deleting a record.',
      input: {},
      context: { leads: search.data?.leads ?? [] },
      outputSchemaKey: 'crm.cleanup',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'audit', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    return {
      ok: true,
      substantive: true,
      output: {
        issues: judgement.data.issues as Array<Record<string, unknown>>,
        scanned: Number(judgement.data.scanned),
        summary: String(judgement.data.summary),
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

// ───────────────────────────── content & marketing ─────────────────────────────

registerSkill({
  slug: 'content.draft',
  name: 'Draft website content',
  description: 'Produce an SEO-reviewed content draft grounded in verified ALO records and store it as a draft.',
  permission: 'SKILL_WRITE',
  version: 1,
  requiredTools: ['catalog.university.search', 'cms.content.draft'],
  input: z.object({
    topic: z.string().min(3).max(200),
    contentType: z.string().min(2).max(60).default('ARTICLE'),
    keywords: z.array(z.string().max(80)).max(20).default([]),
    country: z.string().max(120).optional(),
    slug: z.string().max(190).optional(),
  }),
  output: z.object({
    contentId: z.string(),
    slug: z.string(),
    title: z.string(),
    seoScore: z.number(),
    seoIssues: z.array(z.string()),
    wordCount: z.number(),
    sources: z.array(z.string()),
  }),
  execute: async (input, ctx) => {
    const research = await ctx.callTool('catalog.university.search', { country: input.country, query: undefined, limit: 10 });
    const sources = research.ok
      ? ((research.data?.universities as Array<Record<string, unknown>>) ?? []).map((row) => ({
          kind: 'university',
          label: String(row.name ?? ''),
          value: `${row.country ?? ''}${row.worldRanking ? `, world ranking ${row.worldRanking}` : ''}${row.ieltsMin ? `, minimum IELTS ${row.ieltsMin}` : ''}`,
          sourceUrl: String(row.officialUrl || row.website || row.sourceUrl || ''),
        }))
      : [];
    await ctx.recordStep({ stepKey: 'gather-sources', stepType: 'TOOL', refSlug: 'catalog.university.search', status: research.ok ? 'COMPLETED' : 'FAILED', output: { sources: sources.length } });

    const judgement = await ctx.reason({
      task: 'content.draft',
      instructions: 'Draft ALO Education website content grounded only in the supplied verified records. Omit any figure that is not supplied rather than estimating it.',
      input: {},
      context: { brief: { topic: input.topic, keywords: input.keywords, slug: input.slug }, sources },
      outputSchemaKey: 'content.draft',
    });
    await ctx.recordStep({ stepKey: 'draft', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED', output: { seoScore: judgement.data.seoScore } });

    const seoScore = Number(judgement.data.seoScore);
    // SEO gate: a weak draft is not stored as a publishable asset.
    if (seoScore < 50) {
      return {
        ok: false,
        output: {},
        evidence: { seoScore, seoIssues: judgement.data.seoIssues },
        error: 'AWF_CONTENT_SEO_BELOW_THRESHOLD',
        substantive: false,
      };
    }

    const stored = await ctx.callTool('cms.content.draft', {
      slug: String(judgement.data.slug),
      title: String(judgement.data.title),
      contentType: input.contentType,
      body: String(judgement.data.body),
      metaTitle: String(judgement.data.metaTitle),
      metaDescription: String(judgement.data.metaDescription),
      keywords: judgement.data.keywords as string[],
      topic: input.topic,
    });
    await ctx.recordStep({ stepKey: 'store-draft', stepType: 'TOOL', refSlug: 'cms.content.draft', status: stored.ok ? 'COMPLETED' : 'FAILED' });
    if (!stored.ok) return failure(stored.error || 'draft storage failed', { seoScore });

    return {
      ok: true,
      substantive: true,
      humanReviewRequired: true,
      output: {
        contentId: String(stored.data?.contentId ?? ''),
        slug: String(judgement.data.slug),
        title: String(judgement.data.title),
        seoScore,
        seoIssues: judgement.data.seoIssues as string[],
        wordCount: String(judgement.data.body).split(/\s+/).filter(Boolean).length,
        sources: judgement.data.sources as string[],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

registerSkill({
  slug: 'content.publish',
  name: 'Publish approved content',
  description: 'Publish an approved content draft through the Virtual Editor. Requires an action-bound approval.',
  permission: 'SKILL_WRITE',
  version: 1,
  requiredTools: ['cms.content.publish'],
  input: z.object({ contentId: idSchema, approvalId: z.string().max(191).optional(), publishedUrl: z.string().max(500).optional() }),
  output: z.object({ contentId: z.string(), status: z.string(), publishedAt: z.string() }),
  execute: async (input, ctx) => {
    const approvalId = String(input.approvalId || ctx.approvals?.['tool:cms.content.publish'] || '');
    const result = await ctx.callTool('cms.content.publish', { contentId: input.contentId, publishedUrl: input.publishedUrl }, { approvalId: approvalId || undefined });
    await ctx.recordStep({ stepKey: 'publish', stepType: 'TOOL', refSlug: 'cms.content.publish', status: result.ok ? 'COMPLETED' : 'FAILED', note: result.decision });
    if (!result.ok) return failure(result.error || 'publish failed', { decision: result.decision });
    return {
      ok: true,
      substantive: true,
      output: {
        contentId: String(result.data?.contentId ?? input.contentId),
        status: String(result.data?.status ?? ''),
        publishedAt: String(result.data?.publishedAt ?? ''),
      },
      evidence: { approvalId },
    };
  },
});

// ───────────────────────────── QA & reporting ─────────────────────────────

registerSkill({
  slug: 'qa.validate',
  name: 'Validate AI output',
  description: 'Independently validate another agent output for missing fields, contradictions and unsafe claims.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: [],
  input: z.object({ payload: z.record(z.string(), z.unknown()), requiredFields: z.array(z.string()).default([]) }),
  output: z.object({ passed: z.boolean(), score: z.number(), missingFields: z.array(z.string()), contradictions: z.array(z.string()), unsafeFlags: z.array(z.string()) }),
  execute: async (input, ctx) => {
    const judgement = await ctx.reason({
      task: 'qa.validate',
      instructions: 'Validate the supplied AI output. Report missing required fields, internal contradictions and unsafe claims.',
      input: {},
      context: { payload: input.payload, requiredFields: input.requiredFields },
      outputSchemaKey: 'qa.validation',
      confidential: true,
    });
    await ctx.recordStep({ stepKey: 'validate', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED', output: { passed: judgement.data.passed } });
    return {
      ok: true,
      substantive: true,
      output: {
        passed: Boolean(judgement.data.passed),
        score: Number(judgement.data.score),
        missingFields: judgement.data.missingFields as string[],
        contradictions: judgement.data.contradictions as string[],
        unsafeFlags: judgement.data.unsafeFlags as string[],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

registerSkill({
  slug: 'reporting.summary',
  name: 'Operational report',
  description: 'Aggregate live operational metrics into a structured report.',
  permission: 'SKILL_READ',
  version: 1,
  requiredTools: ['reporting.metrics'],
  input: z.object({ scope: z.enum(['CRM', 'APPLICATIONS', 'AI']).default('CRM'), period: z.string().max(120).default('all time') }),
  output: z.object({ title: z.string(), period: z.string(), metrics: z.array(z.record(z.string(), z.unknown())), highlights: z.array(z.string()), concerns: z.array(z.string()) }),
  execute: async (input, ctx) => {
    const metrics = await ctx.callTool('reporting.metrics', { scope: input.scope });
    await ctx.recordStep({ stepKey: 'collect-metrics', stepType: 'TOOL', refSlug: 'reporting.metrics', status: metrics.ok ? 'COMPLETED' : 'FAILED' });
    if (!metrics.ok) return failure(metrics.error || 'metric collection failed');
    const judgement = await ctx.reason({
      task: 'report.summary',
      instructions: 'Summarise the supplied operational metrics. Do not introduce metrics that were not supplied.',
      input: {},
      context: { title: `ALO ${input.scope} operations`, period: input.period, metrics: metrics.data?.metrics ?? [] },
      outputSchemaKey: 'report.summary',
    });
    await ctx.recordStep({ stepKey: 'summarise', stepType: 'GATEWAY', refSlug: judgement.runtimeKey, status: 'COMPLETED' });
    return {
      ok: true,
      substantive: true,
      output: {
        title: String(judgement.data.title),
        period: String(judgement.data.period),
        metrics: judgement.data.metrics as Array<Record<string, unknown>>,
        highlights: judgement.data.highlights as string[],
        concerns: judgement.data.concerns as string[],
      },
      evidence: { runtimeKey: judgement.runtimeKey, deterministic: judgement.deterministic },
    };
  },
});

export const SKILL_COUNT = 13;
