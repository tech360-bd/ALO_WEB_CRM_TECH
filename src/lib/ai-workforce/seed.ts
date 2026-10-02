/**
 * ALO AI Workforce — installation seed (§31).
 *
 * Creates the real ALO AI departments, agents, versions, tool/skill grants,
 * test cases and workflows. Every department here corresponds to an existing
 * ALO operation (admissions, student services, applications, CRM operations,
 * website content, quality assurance) — none were invented to inflate counts.
 *
 * The seed is idempotent: re-running it upgrades definitions in place and
 * never duplicates an agent, grant or workflow.
 */
import { db } from '@/lib/db';
import { syncRuntimes } from './runtimes';
import { listToolDefinitions, syncToolRegistry } from './tools/registry';
import { getSkillDefinition, listSkillDefinitions, syncSkillRegistry } from './skills/registry';
import { createAgent, createAgentVersion, approveVersion, deployVersion, testVersion, upsertDepartment, validateVersion } from './lifecycle';
import { upsertWorkflow, type WorkflowDefinition } from './workflow-engine';
import { ingestKnowledge } from './knowledge';
import type { ActorContext } from './types';
import type { PipelineStep } from './runner';

// Loading the catalogues registers tools and skills.
import './tools/handlers';
import './skills/catalog';

export const SEED_AUTHOR_ID = 'alo-awf-seed';

interface AgentSeed {
  slug: string;
  name: string;
  department: string;
  purpose: string;
  description: string;
  allowedRoles: string[];
  instructions: string;
  pipeline: PipelineStep[];
  outputStep?: string;
  automation: { eligible: boolean; category: string; taskType: string };
  memoryPolicy?: Record<string, unknown>;
  testCases: Array<{ name: string; input: Record<string, unknown>; expectation: Record<string, unknown>; critical?: boolean }>;
}

const DEPARTMENTS = [
  { slug: 'admissions', name: 'Admissions & Counselling', description: 'Lead qualification, student profiling, course and scholarship matching.', sortOrder: 1 },
  { slug: 'applications', name: 'Applications & Compliance', description: 'Application readiness, document checklists, deadlines and visa documentation.', sortOrder: 2 },
  { slug: 'crm-operations', name: 'CRM Operations', description: 'CRM data quality, assignment hygiene and operational reporting.', sortOrder: 3 },
  { slug: 'website-content', name: 'Website & Content', description: 'Research-grounded website content drafting and Virtual Editor publishing.', sortOrder: 4 },
  { slug: 'quality-assurance', name: 'Quality Assurance', description: 'Independent validation of AI output before it reaches a student or the public site.', sortOrder: 5 },
];

const AGENTS: AgentSeed[] = [
  {
    slug: 'lead-qualification-agent',
    name: 'Lead Qualification Agent',
    department: 'admissions',
    purpose: 'Score, classify and route inbound ALO leads.',
    description: 'Reads the CRM lead, scores it against the ALO qualification rule set, persists the score and prepares a counsellor follow-up task.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR'],
    instructions:
      'You qualify inbound ALO Education leads. Use only the lead record supplied by ALO tools. Score completeness, intent, urgency, English level, budget and recency. Never invent contact details, never promise admission or a visa, and never contact the lead directly. Missing information must be reported using the exact CRM field names so a counsellor can collect it.',
    pipeline: [
      { key: 'qualify', skill: 'lead.qualify', input: { leadId: '$input.leadId', persist: true } },
      {
        key: 'followup',
        skill: 'lead.followup.plan',
        input: {
          leadId: '$input.leadId',
          tier: '$steps.qualify.tier',
          recommendedAction: '$steps.qualify.recommendedAction',
          missingFields: '$steps.qualify.missingFields',
        },
        optional: true,
      },
    ],
    outputStep: 'qualify',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'LEAD_QUALIFICATION' },
    testCases: [
      {
        name: 'qualifies a complete study-abroad lead',
        input: { leadId: 'AWF-TEST-LEAD-1' },
        expectation: { status: 'COMPLETED', 'output.tier': { in: ['HOT', 'WARM', 'COLD'] }, 'output.score': { gte: 0 } },
      },
      {
        name: 'reports a missing lead instead of inventing one',
        input: { leadId: 'definitely-not-a-lead' },
        expectation: { status: 'FAILED' },
        critical: false,
      },
    ],
  },
  {
    slug: 'student-profile-agent',
    name: 'Student Profile Agent',
    department: 'admissions',
    purpose: 'Summarise student profiles and brief counsellors.',
    description: 'Analyses education history, English tests, documents and funding to produce a completeness score and a counsellor briefing.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR'],
    instructions:
      'You analyse ALO student profiles for counsellors. Report completeness, strengths, risks and missing items strictly from the supplied records. Never speculate about immigration outcomes and never disclose another student\'s data.',
    pipeline: [{ key: 'analyze', skill: 'student.profile.analyze', input: { studentId: '$input.studentId' } }],
    outputStep: 'analyze',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'PROFILE_ANALYSIS' },
    testCases: [
      {
        name: 'analyses a seeded student profile',
        input: { studentId: 'AWF-TEST-STUDENT-1' },
        expectation: { status: 'COMPLETED', 'output.completeness': { gte: 0 } },
      },
    ],
  },
  {
    slug: 'course-matching-agent',
    name: 'Course Matching Agent',
    department: 'admissions',
    purpose: 'Match students to verified courses and scholarships.',
    description: 'Ranks the verified ALO course catalogue against a student profile and reports eligibility blockers and scholarship options.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR', 'STUDENT'],
    instructions:
      'You match ALO students to courses from the verified ALO catalogue only. Eligibility must be derived from stored requirements; when a requirement is unknown, say so instead of assuming. Never recommend a course that is not in the supplied catalogue and never guarantee admission.',
    pipeline: [
      { key: 'match', skill: 'course.match', input: { profile: '$input.profile', limit: 20 } },
      { key: 'scholarships', skill: 'scholarship.find', input: { profile: '$input.profile', limit: 20 }, optional: true },
    ],
    outputStep: 'match',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'COURSE_MATCHING' },
    testCases: [
      {
        name: 'returns ranked matches for a UK masters profile',
        input: { profile: { preferredCountry: 'United Kingdom', preferredLevel: 'Masters', preferredCourse: 'Business Analytics', englishScore: 6.5, budget: 20000 } },
        expectation: { status: 'COMPLETED', 'output.evaluated': { gte: 0 } },
      },
    ],
  },
  {
    slug: 'university-research-agent',
    name: 'University Research Agent',
    department: 'admissions',
    purpose: 'Provide verified university facts with citations.',
    description: 'Reports verified university records, rankings and official source URLs for counsellors and content writers.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR'],
    instructions:
      'You report ALO-verified university information. Every fact must come from the supplied records and carry its official source URL. Never state a ranking, fee or requirement that is not in the supplied data.',
    pipeline: [{ key: 'research', skill: 'university.research', input: { country: '$input.country', query: '$input.query', limit: 15 } }],
    outputStep: 'research',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'UNIVERSITY_RESEARCH' },
    testCases: [
      {
        name: 'returns verified universities with citations',
        input: { country: 'United Kingdom' },
        expectation: { status: 'COMPLETED', 'output.evaluated': { gte: 0 } },
      },
    ],
  },
  {
    slug: 'application-readiness-agent',
    name: 'Application Readiness Agent',
    department: 'applications',
    purpose: 'Keep applications document-complete and on time.',
    description: 'Builds the application document checklist, computes readiness and tracks the next deadline.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR'],
    instructions:
      'You assess ALO application readiness. Derive the checklist only from ALO document requirements and the documents actually on file. Escalate when a required document is missing close to the deadline. Never submit an application and never alter a decision.',
    pipeline: [
      { key: 'checklist', skill: 'application.checklist', input: { applicationId: '$input.applicationId' } },
      {
        key: 'deadline',
        skill: 'application.deadline.track',
        input: { applicationId: '$input.applicationId', deadlineType: 'DOCUMENT_DEADLINE', deadlineDate: '$input.deadline', note: 'Tracked by the ALO Application Readiness Agent' },
        optional: true,
        when: { path: 'input.deadline' },
      },
    ],
    outputStep: 'checklist',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'APPLICATION_READINESS' },
    testCases: [
      {
        name: 'builds a checklist for a seeded application',
        input: { applicationId: 'AWF-TEST-APP-1' },
        expectation: { status: 'COMPLETED', 'output.readiness': { gte: 0 } },
      },
    ],
  },
  {
    slug: 'visa-documentation-agent',
    name: 'Visa Documentation Agent',
    department: 'applications',
    purpose: 'Track visa document readiness for students.',
    description: 'Screens uploaded documents and reports the visa checklist, readiness and escalation state.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR'],
    instructions:
      'You track ALO visa document readiness. Report only on documents actually on file. Never give immigration advice, never predict a visa decision and never state that a visa is guaranteed.',
    pipeline: [{ key: 'checklist', skill: 'visa.checklist', input: { studentId: '$input.studentId', deadline: '$input.deadline' } }],
    outputStep: 'checklist',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'VISA_READINESS' },
    testCases: [
      {
        name: 'produces a visa checklist for a seeded student',
        input: { studentId: 'AWF-TEST-STUDENT-1' },
        expectation: { status: 'COMPLETED', 'output.items': { nonEmpty: true } },
      },
    ],
  },
  {
    slug: 'crm-data-quality-agent',
    name: 'CRM Data Quality Agent',
    department: 'crm-operations',
    purpose: 'Find and explain CRM data defects.',
    description: 'Scans CRM leads for missing contact details, unassigned ownership and stale records, and proposes non-destructive fixes.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    instructions:
      'You audit ALO CRM data quality. Identify defects and propose non-destructive fixes only. Never delete a record, never merge records automatically and never reassign ownership without human approval.',
    pipeline: [{ key: 'audit', skill: 'crm.data.audit', input: { status: '$input.status', limit: 100 } }],
    outputStep: 'audit',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'CRM_DATA_QUALITY' },
    testCases: [
      {
        name: 'scans CRM leads and reports issues',
        input: {},
        expectation: { status: 'COMPLETED', 'output.scanned': { gte: 0 } },
      },
    ],
  },
  {
    slug: 'operations-reporting-agent',
    name: 'Operations Reporting Agent',
    department: 'crm-operations',
    purpose: 'Summarise live operational metrics.',
    description: 'Aggregates live CRM, application and AI counters into a structured operations summary.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    instructions:
      'You summarise ALO operational metrics. Use only metrics supplied by ALO reporting tools. Never estimate a number, never extrapolate a trend from a single data point and never present a target as an achievement.',
    pipeline: [{ key: 'summary', skill: 'reporting.summary', input: { scope: '$input.scope', period: '$input.period' } }],
    outputStep: 'summary',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'OPERATIONS_REPORTING' },
    testCases: [
      {
        name: 'summarises CRM operations',
        input: { scope: 'CRM', period: 'all time' },
        expectation: { status: 'COMPLETED', 'output.metrics': { nonEmpty: true } },
      },
    ],
  },
  {
    slug: 'content-writer-agent',
    name: 'Content Writer Agent',
    department: 'website-content',
    purpose: 'Draft research-grounded website content.',
    description: 'Produces an SEO-reviewed website draft grounded in verified ALO university records and stores it for Virtual Editor review.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    instructions:
      'You draft ALO Education website content. Ground every factual statement in the verified records supplied to you and cite the source. Omit any figure you were not given. Never guarantee admission, visas or outcomes, never fabricate rankings and never include contact or payment instructions.',
    pipeline: [
      { key: 'draft', skill: 'content.draft', input: { topic: '$input.topic', contentType: '$input.contentType', keywords: '$input.keywords', country: '$input.country', slug: '$input.slug' } },
    ],
    outputStep: 'draft',
    automation: { eligible: true, category: 'SAFETY_APPROVAL', taskType: 'CONTENT_DRAFTING' },
    testCases: [
      {
        name: 'drafts a country guide with sources',
        input: { topic: 'Study in the United Kingdom', contentType: 'GUIDE', keywords: ['study in uk'], country: 'United Kingdom', slug: 'awf-test-study-uk' },
        expectation: { status: { in: ['COMPLETED', 'AWAITING_APPROVAL'] } },
      },
    ],
  },
  {
    slug: 'content-publisher-agent',
    name: 'Content Publisher Agent',
    department: 'website-content',
    purpose: 'Publish approved content through the Virtual Editor.',
    description: 'Publishes an approved content draft to the live website. Every publish consumes a single-use human approval.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    instructions:
      'You publish ALO website content that a human has already approved. You may never publish without an action-bound approval, never edit the approved body and never publish content flagged by quality assurance.',
    pipeline: [{ key: 'publish', skill: 'content.publish', input: { contentId: '$input.contentId', approvalId: '$input.approvalId' } }],
    outputStep: 'publish',
    automation: { eligible: true, category: 'SAFETY_APPROVAL', taskType: 'CONTENT_PUBLISHING' },
    testCases: [
      {
        name: 'refuses to publish without an approval',
        input: { contentId: 'AWF-TEST-CONTENT-1' },
        expectation: { status: 'FAILED' },
        critical: false,
      },
    ],
  },
  {
    slug: 'qa-validator-agent',
    name: 'QA Validator Agent',
    department: 'quality-assurance',
    purpose: 'Independently validate AI output before it is used.',
    description: 'Checks another agent output for missing fields, contradictions and unsafe claims before it reaches a human or the public site.',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    instructions:
      'You independently validate ALO AI output. Flag missing required fields, internal contradictions and unsafe claims such as guaranteed visas, guaranteed admission, fabricated rankings, payment instructions or exposed personal data. Never rewrite the output; only report.',
    pipeline: [{ key: 'validate', skill: 'qa.validate', input: { payload: '$input.payload', requiredFields: '$input.requiredFields' } }],
    outputStep: 'validate',
    automation: { eligible: true, category: 'ELIGIBLE_ROUTINE', taskType: 'QUALITY_ASSURANCE' },
    testCases: [
      {
        name: 'flags a guaranteed-visa claim',
        input: { payload: { body: 'We guarantee your visa approval and guaranteed admission.' }, requiredFields: [] },
        expectation: { status: 'COMPLETED', 'output.passed': false },
      },
    ],
  },
];

const WORKFLOWS: Array<{
  slug: string;
  name: string;
  description: string;
  department: string;
  triggerType: string;
  triggerEvent: string;
  definition: WorkflowDefinition;
}> = [
  {
    slug: 'new-lead-processing',
    name: 'New Lead Processing',
    description: 'Qualify a new CRM lead, persist the score and prepare the counsellor follow-up.',
    department: 'admissions',
    triggerType: 'EVENT',
    triggerEvent: 'crm.lead.created',
    definition: {
      steps: [{ key: 'qualify', agent: 'lead-qualification-agent', input: { leadId: '$input.leadId' } }],
      outputStep: 'qualify',
      entityType: 'Lead',
      entityIdPath: 'input.leadId',
      automation: { eligible: true, department: 'admissions' },
    },
  },
  {
    slug: 'student-course-matching',
    name: 'Student Course Matching',
    description: 'Analyse a student profile and produce ranked, eligibility-checked course matches.',
    department: 'admissions',
    triggerType: 'EVENT',
    triggerEvent: 'crm.student.profile_updated',
    definition: {
      steps: [
        { key: 'profile', agent: 'student-profile-agent', input: { studentId: '$input.studentId' } },
        {
          key: 'match',
          agent: 'course-matching-agent',
          input: {
            profile: {
              preferredCountry: '$input.preferredCountry',
              preferredLevel: '$input.preferredLevel',
              preferredCourse: '$input.preferredCourse',
              englishScore: '$input.englishScore',
              budget: '$input.budget',
            },
          },
        },
      ],
      outputStep: 'match',
      entityType: 'Student',
      entityIdPath: 'input.studentId',
      automation: { eligible: true, department: 'admissions' },
    },
  },
  {
    slug: 'application-processing',
    name: 'Application Processing',
    description: 'Check application document readiness and track the next deadline.',
    department: 'applications',
    triggerType: 'EVENT',
    triggerEvent: 'crm.application.updated',
    definition: {
      steps: [{ key: 'readiness', agent: 'application-readiness-agent', input: { applicationId: '$input.applicationId', deadline: '$input.deadline' } }],
      outputStep: 'readiness',
      entityType: 'Application',
      entityIdPath: 'input.applicationId',
      automation: { eligible: true, department: 'applications' },
    },
  },
  {
    slug: 'content-publishing',
    name: 'Content Draft to Virtual Editor',
    description: 'Draft website content from verified records, validate it, and hand it to the Virtual Editor for human publishing.',
    department: 'website-content',
    triggerType: 'MANUAL',
    triggerEvent: 'content.requested',
    definition: {
      steps: [
        { key: 'draft', agent: 'content-writer-agent', input: { topic: '$input.topic', contentType: '$input.contentType', keywords: '$input.keywords', country: '$input.country', slug: '$input.slug' } },
        { key: 'qa', agent: 'qa-validator-agent', input: { payload: '$steps.draft', requiredFields: ['title', 'slug', 'seoScore'] } },
      ],
      outputStep: 'draft',
      entityType: 'ContentAsset',
      automation: { eligible: true, department: 'website-content' },
    },
  },
  {
    slug: 'crm-operations-review',
    name: 'CRM Operations Review',
    description: 'Audit CRM data quality and summarise live operational metrics for managers.',
    department: 'crm-operations',
    triggerType: 'SCHEDULE',
    triggerEvent: 'schedule.crm_review',
    definition: {
      steps: [
        { key: 'audit', agent: 'crm-data-quality-agent', input: { status: '$input.status' } },
        { key: 'report', agent: 'operations-reporting-agent', input: { scope: 'CRM', period: '$input.period' }, optional: true },
      ],
      outputStep: 'audit',
      entityType: 'Lead',
      automation: { eligible: true, department: 'crm-operations' },
    },
  },
];

export interface SeedResult {
  departments: number;
  tools: number;
  skills: number;
  runtimes: number;
  agents: number;
  deployed: number;
  grants: number;
  testCases: number;
  workflows: number;
  knowledgeSources: number;
  failures: Array<{ agent: string; stage: string; detail: string }>;
}

/**
 * Seeds (or upgrades) the whole AI Workforce. The actor must hold the
 * lifecycle capabilities; nothing here bypasses the normal gates — agents go
 * through validate -> test -> approve -> deploy exactly like a UI-built agent.
 */
export async function seedAiWorkforce(actor: ActorContext, options: { runTests?: boolean } = {}): Promise<SeedResult> {
  const failures: SeedResult['failures'] = [];

  const runtimes = await syncRuntimes();
  const tools = await syncToolRegistry();
  const skills = await syncSkillRegistry();

  for (const department of DEPARTMENTS) await upsertDepartment(department, actor);

  let grants = 0;
  let testCases = 0;
  let deployed = 0;

  for (const seed of AGENTS) {
    const agent = await createAgent(
      {
        slug: seed.slug,
        name: seed.name,
        departmentSlug: seed.department,
        description: seed.description,
        purpose: seed.purpose,
        allowedRoles: seed.allowedRoles,
      },
      actor
    );

    // Tool grants are derived from the skills in the pipeline — least privilege
    // by construction, and never self-granted at runtime.
    const required = new Set<string>();
    for (const step of seed.pipeline) {
      const skill = getSkillDefinition(step.skill);
      for (const tool of skill?.requiredTools ?? []) required.add(tool);
    }
    for (const toolSlug of required) {
      const definition = listToolDefinitions().find((entry) => entry.slug === toolSlug);
      const row = await db.awfTool.findUnique({ where: { slug: toolSlug }, select: { id: true } });
      if (!definition || !row) continue;
      await db.awfToolGrant.upsert({
        where: { agentId_toolId: { agentId: agent.id, toolId: row.id } },
        create: {
          agentId: agent.id,
          toolId: row.id,
          permission: definition.permission,
          approvalRequired: definition.requiresApproval,
          maxCallsPerRun: 10,
          status: 'ACTIVE',
          grantedById: actor.userId,
        },
        update: { permission: definition.permission, approvalRequired: definition.requiresApproval, status: 'ACTIVE' },
      });
      grants += 1;
    }

    // Skill grants mirror the pipeline.
    for (const step of seed.pipeline) {
      const skillRow = await db.awfSkill.findUnique({ where: { slug: step.skill }, select: { id: true } });
      if (!skillRow) continue;
      await db.awfSkillGrant.upsert({
        where: { agentId_skillId: { agentId: agent.id, skillId: skillRow.id } },
        create: { agentId: agent.id, skillId: skillRow.id, status: 'ACTIVE', grantedById: actor.userId },
        update: { status: 'ACTIVE' },
      });
    }

    for (const testCase of seed.testCases) {
      const existing = await db.awfTestCase.findFirst({ where: { agentId: agent.id, name: testCase.name }, select: { id: true } });
      if (existing) {
        await db.awfTestCase.update({
          where: { id: existing.id },
          data: { input: JSON.stringify(testCase.input), expectation: JSON.stringify(testCase.expectation), critical: testCase.critical !== false },
        });
      } else {
        await db.awfTestCase.create({
          data: {
            agentId: agent.id,
            name: testCase.name,
            input: JSON.stringify(testCase.input),
            expectation: JSON.stringify(testCase.expectation),
            critical: testCase.critical !== false,
            createdById: actor.userId,
          },
        });
      }
      testCases += 1;
    }

    // Create a version only when the configuration actually changed.
    const config = {
      pipeline: seed.pipeline,
      outputStep: seed.outputStep,
      automation: seed.automation,
    };
    const latest = await db.awfAgentVersion.findFirst({ where: { agentId: agent.id }, orderBy: { versionNo: 'desc' } });
    const unchanged = latest && latest.config === JSON.stringify(config) && latest.systemInstructions === seed.instructions;
    const version = unchanged
      ? latest
      : await createAgentVersion(
          {
            agentSlug: seed.slug,
            config,
            systemInstructions: seed.instructions,
            memoryPolicy: seed.memoryPolicy ?? { shortTerm: true, longTerm: false, company: false, department: false, user: false, maxConfidentiality: 'CONFIDENTIAL', writeScopes: ['SHORT_TERM'] },
            modelPolicy: { preferred: 'auto', confidential: true, minRuntimes: 2 },
            approvalPolicy: { highRiskToolsRequireApproval: true },
            securityPolicy: { screenContext: true, redactSecrets: true },
            changeReason: 'ALO AI Workforce seed',
          },
          actor
        );

    if (version.state === 'DEPLOYED') {
      deployed += 1;
      continue;
    }

    const validation = await validateVersion(version.id, actor);
    if (!validation.passed) {
      failures.push({ agent: seed.slug, stage: 'VALIDATE', detail: validation.errors.join(' | ') });
      continue;
    }

    if (options.runTests !== false) {
      const report = await testVersion(version.id, actor);
      if (!report.passed) {
        failures.push({ agent: seed.slug, stage: 'TEST', detail: report.cases.filter((entry) => !entry.passed).map((entry) => `${entry.name}: ${entry.detail}`).join(' | ') });
        continue;
      }
    } else {
      await db.awfAgentVersion.update({ where: { id: version.id }, data: { state: 'TESTED' } });
    }

    try {
      await approveVersion(version.id, actor);
      await deployVersion(version.id, actor);
      deployed += 1;
    } catch (error) {
      failures.push({ agent: seed.slug, stage: 'DEPLOY', detail: error instanceof Error ? error.message : 'deployment failed' });
    }
  }

  for (const workflow of WORKFLOWS) {
    await upsertWorkflow(
      {
        slug: workflow.slug,
        name: workflow.name,
        description: workflow.description,
        departmentSlug: workflow.department,
        triggerType: workflow.triggerType,
        triggerEvent: workflow.triggerEvent,
        definition: workflow.definition,
        status: 'ACTIVE',
        eligible: true,
      },
      actor
    );
  }

  const knowledgeSources = await seedKnowledge(actor);

  return {
    departments: DEPARTMENTS.length,
    tools,
    skills,
    runtimes: runtimes.length,
    agents: AGENTS.length,
    deployed,
    grants,
    testCases,
    workflows: WORKFLOWS.length,
    knowledgeSources,
    failures,
  };
}

/** Operating knowledge that agents may cite. Internal policy only — no student data. */
async function seedKnowledge(actor: ActorContext): Promise<number> {
  const sources = [
    {
      slug: 'alo-service-standards',
      title: 'ALO Education service standards',
      content: [
        'ALO Education counsellors respond to a new qualified lead within one business day.',
        'Every course or university fact shared with a student must come from the ALO verified catalogue and carry its official source URL.',
        'ALO never guarantees admission, a scholarship or a visa outcome. Counsellors describe requirements and probabilities in terms of published criteria only.',
        'Application documents are checked against the ALO document checklist before an application is submitted to a university partner.',
        'Student personal data is shared only with the student, their assigned counsellor and staff with an operational need.',
      ].join('\n\n'),
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COUNSELOR', 'EMPLOYEE'],
      confidentiality: 'INTERNAL' as const,
    },
    {
      slug: 'alo-ai-operating-rules',
      title: 'ALO AI Workforce operating rules',
      content: [
        'ALO owns all agent instructions, routing, validation and tool permissions. Open-source models are inference engines only and are never described as ALO-proprietary models.',
        'An agent may propose a change to its own configuration but may never apply one. Proposals are reviewed by a human in the AI Workforce console.',
        'Sensitive actions - external messages, publishing, lead reassignment and any financial record - require a single-use, action-bound human approval.',
        'When no model runtime is reachable, the ALO deterministic rule engine completes the task so no workflow fails for the lack of a paid API key.',
        'Automation is measured as agent-completed eligible tasks divided by all eligible automatable tasks. Human approvals are reported separately and are not counted as failures.',
      ].join('\n\n'),
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
      confidentiality: 'INTERNAL' as const,
    },
  ];
  for (const source of sources) {
    await ingestKnowledge({
      slug: source.slug,
      title: source.title,
      content: source.content,
      sourceType: 'POLICY',
      department: 'company',
      confidentiality: source.confidentiality,
      allowedRoles: source.allowedRoles,
      actor,
    });
  }
  return sources.length;
}

export function seedInventory() {
  return {
    departments: DEPARTMENTS.map((department) => department.slug),
    agents: AGENTS.map((agent) => ({ slug: agent.slug, department: agent.department, skills: agent.pipeline.map((step) => step.skill) })),
    workflows: WORKFLOWS.map((workflow) => ({ slug: workflow.slug, trigger: workflow.triggerEvent, steps: workflow.definition.steps.length })),
    tools: listToolDefinitions().map((tool) => ({ slug: tool.slug, risk: tool.riskLevel, permission: tool.permission, mutates: tool.mutates })),
    skills: listSkillDefinitions().map((skill) => ({ slug: skill.slug, permission: skill.permission, tools: skill.requiredTools })),
  };
}
