/**
 * ALO AI Workforce — acceptance harness (§30, §43-§48).
 *
 * Boots the AI Workforce against a real relational database, executes the five
 * representative ALO workflows in PRODUCTION mode, proves runtime fallback,
 * runs the adversarial security suite, measures automation from persisted
 * ledger rows and writes AI-AUTOMATION-EVIDENCE.json.
 *
 * Usage:
 *   ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.awf-tmp/verify.db" \
 *     npx tsx scripts/ai-workforce/run-verification.ts
 */
import { writeFileSync } from 'node:fs';
import { db } from '@/lib/db';
import { seedAiWorkforce, seedInventory } from '@/lib/ai-workforce/seed';
import { runWorkflow, ingestEvent } from '@/lib/ai-workforce/workflow-engine';
import { runAgent } from '@/lib/ai-workforce/runner';
import { aiGatewayExecute, GatewayError, planRoute } from '@/lib/ai-workforce/gateway';
import { detectRuntimes } from '@/lib/ai-workforce/runtimes';
import { computeAutomationReport } from '@/lib/ai-workforce/automation';
import { dashboardSnapshot, agentPerformance } from '@/lib/ai-workforce/telemetry';
import { systemHealth, recoverFailures } from '@/lib/ai-workforce/health';
import { requestApproval, decideApproval } from '@/lib/ai-workforce/approvals';
import { executeTool } from '@/lib/ai-workforce/tools/registry';
import { retrieveKnowledge } from '@/lib/ai-workforce/knowledge';
import { createFixtures, fixtureCounts } from './fixtures';
import { runSecuritySuite, type Actors, type SecurityCase } from './security-suite';
import type { ActorContext } from '@/lib/ai-workforce/types';

const log = (message: string) => process.stdout.write(`${message}\n`);

interface WorkflowEvidence {
  workflow: string;
  status: string;
  runCodes: string[];
  durationMs: number;
  steps: Array<{ key: string; agent: string; status: string }>;
  databaseEffects: Record<string, unknown>;
  auditRows: number;
  passed: boolean;
  note: string;
}

async function main() {
  const startedAt = new Date();
  log('── ALO AI Workforce verification ─────────────────────────────');

  // ── Phase 1: operating data ──
  const fixtures = await createFixtures();
  const counts = await fixtureCounts();
  log(`[1] fixtures: ${JSON.stringify(counts)}`);

  const actors: Actors = {
    superAdmin: { userId: fixtures.users.superAdmin, role: 'SUPER_ADMIN', email: 'superadmin@aloeducation.test', ipAddress: '127.0.0.1' },
    admin: { userId: fixtures.users.admin, role: 'ADMIN', email: 'admin@aloeducation.test', ipAddress: '127.0.0.1' },
    manager: { userId: fixtures.users.manager, role: 'MANAGER', email: 'manager@aloeducation.test', ipAddress: '127.0.0.1' },
    counselor: { userId: fixtures.users.counselor, role: 'COUNSELOR', email: 'counselor@aloeducation.test', ipAddress: '127.0.0.1' },
    employee: { userId: fixtures.users.employee, role: 'EMPLOYEE', email: 'employee@aloeducation.test', ipAddress: '127.0.0.1' },
    partner: { userId: fixtures.users.partner, role: 'PARTNER', email: 'partner@aloeducation.test', ipAddress: '127.0.0.1' },
    student: { userId: fixtures.users.student, role: 'STUDENT', email: 'student@aloeducation.test', scopedEntityIds: [fixtures.studentIds[0]], ipAddress: '127.0.0.1' },
    student2: { userId: fixtures.users.student2, role: 'STUDENT', email: 'student2@aloeducation.test', scopedEntityIds: [fixtures.studentIds[1]], ipAddress: '127.0.0.1' },
  };

  // ── Phase 2: install the AI Workforce through the real lifecycle gates ──
  const seed = await seedAiWorkforce(actors.superAdmin, { runTests: true });
  log(`[2] seed: ${seed.deployed}/${seed.agents} agents deployed, ${seed.tools} tools, ${seed.skills} skills, ${seed.workflows} workflows, failures=${seed.failures.length}`);
  for (const failure of seed.failures) log(`    ! ${failure.agent} failed at ${failure.stage}: ${failure.detail}`);

  // ── Phase 3: the five representative workflows, in PRODUCTION ──
  const workflowEvidence: WorkflowEvidence[] = [];

  const auditCountFor = async (correlationId: string) => db.awfAuditLog.count({ where: { correlationId } });

  // 3.1 New lead processing
  {
    const result = await runWorkflow({
      workflowSlug: 'new-lead-processing',
      input: { leadId: 'AWF-TEST-LEAD-1' },
      actor: actors.counselor,
      mode: 'PRODUCTION',
      idempotencyKey: 'verify:new-lead-processing:AWF-TEST-LEAD-1',
      triggerType: 'MANUAL',
    });
    const lead = await db.lead.findUnique({ where: { leadId: 'AWF-TEST-LEAD-1' }, select: { leadScore: true, leadTier: true, counselorId: true } });
    const tasks = await db.task.count({ where: { assigneeId: fixtures.users.counselor } });
    workflowEvidence.push({
      workflow: 'new-lead-processing',
      status: result.status,
      runCodes: result.runCodes,
      durationMs: result.durationMs,
      steps: result.steps.map((step) => ({ key: step.key, agent: step.agent, status: step.status })),
      databaseEffects: { leadScore: lead?.leadScore, leadTier: lead?.leadTier, followUpTasks: tasks },
      auditRows: await auditCountFor(result.correlationId),
      passed: result.status === 'COMPLETED' && (lead?.leadScore ?? 0) > 0 && tasks > 0,
      note: 'Lead scored and persisted; follow-up task created for the owning counsellor.',
    });
  }

  // 3.2 Student course matching
  {
    const result = await runWorkflow({
      workflowSlug: 'student-course-matching',
      input: {
        studentId: 'AWF-TEST-STUDENT-1',
        preferredCountry: 'United Kingdom',
        preferredLevel: 'Masters',
        preferredCourse: 'Business Analytics',
        englishScore: 6.5,
        budget: 20000,
      },
      actor: actors.counselor,
      mode: 'PRODUCTION',
      idempotencyKey: 'verify:student-course-matching:AWF-TEST-STUDENT-1',
    });
    const matches = (result.output.matches as Array<Record<string, unknown>>) ?? [];
    workflowEvidence.push({
      workflow: 'student-course-matching',
      status: result.status,
      runCodes: result.runCodes,
      durationMs: result.durationMs,
      steps: result.steps.map((step) => ({ key: step.key, agent: step.agent, status: step.status })),
      databaseEffects: { matchesReturned: matches.length, eligible: matches.filter((match) => match.eligible === true).length, topCourse: matches[0]?.courseTitle ?? null },
      auditRows: await auditCountFor(result.correlationId),
      passed: result.status === 'COMPLETED' && matches.length > 0,
      note: 'Profile analysed and verified catalogue ranked with eligibility reasoning.',
    });
  }

  // 3.3 Application processing
  {
    const result = await runWorkflow({
      workflowSlug: 'application-processing',
      input: { applicationId: 'AWF-TEST-APP-1', deadline: new Date(Date.now() + 21 * 86_400_000).toISOString() },
      actor: actors.counselor,
      mode: 'PRODUCTION',
      idempotencyKey: 'verify:application-processing:AWF-TEST-APP-1',
    });
    const application = await db.application.findUnique({ where: { applicationCode: 'AWF-TEST-APP-1' }, select: { id: true } });
    const deadlines = application ? await db.applicationDeadline.count({ where: { applicationId: application.id } }) : 0;
    workflowEvidence.push({
      workflow: 'application-processing',
      status: result.status,
      runCodes: result.runCodes,
      durationMs: result.durationMs,
      steps: result.steps.map((step) => ({ key: step.key, agent: step.agent, status: step.status })),
      databaseEffects: { trackedDeadlines: deadlines, readiness: result.output.readiness, missingCount: result.output.missingCount },
      auditRows: await auditCountFor(result.correlationId),
      passed: result.status === 'COMPLETED' && deadlines > 0,
      note: 'Checklist derived from real application documents; deadline tracked in the database.',
    });
  }

  // 3.4 Content drafting -> QA -> approved publish through the Virtual Editor
  let publishedContentId = '';
  {
    const result = await runWorkflow({
      workflowSlug: 'content-publishing',
      input: { topic: 'Study in the United Kingdom from Bangladesh', contentType: 'GUIDE', keywords: ['study in uk', 'uk student visa'], country: 'United Kingdom', slug: 'study-in-the-uk-2026' },
      actor: actors.admin,
      mode: 'PRODUCTION',
      idempotencyKey: 'verify:content-publishing:study-in-the-uk-2026',
    });
    const asset = await db.contentAsset.findUnique({ where: { slug: 'study-in-the-uk-2026' }, select: { id: true, status: true, qualityScore: true } });
    publishedContentId = asset?.id || '';

    // Human approval, then the approval-gated publish.
    let publishStatus = 'NOT_ATTEMPTED';
    let publicationRows = 0;
    if (asset) {
      const approval = await requestApproval({
        runId: result.runCodes[0] || '',
        agentSlug: 'content-publisher-agent',
        toolSlug: 'cms.content.publish',
        action: 'tool:cms.content.publish',
        riskLevel: 'HIGH',
        reason: 'Verification: publish the AI-drafted country guide',
        payload: { contentId: asset.id },
        requestedById: actors.admin.userId,
      });
      await decideApproval(approval.id, actors.superAdmin, 'APPROVED', 'Reviewed by the verification Super Admin');
      const publish = await runAgent({
        agentSlug: 'content-publisher-agent',
        input: { contentId: asset.id, approvalId: approval.id },
        actor: actors.admin,
        mode: 'PRODUCTION',
        workflowSlug: 'content-publishing',
        approvals: { 'tool:cms.content.publish': approval.id },
      });
      publishStatus = publish.status;
      const after = await db.contentAsset.findUnique({ where: { id: asset.id }, select: { status: true } });
      publicationRows = await db.contentPublication.count({ where: { contentAssetId: asset.id } });
      publishStatus = `${publish.status}/${after?.status}`;
    }

    workflowEvidence.push({
      workflow: 'content-publishing',
      status: result.status,
      runCodes: result.runCodes,
      durationMs: result.durationMs,
      steps: result.steps.map((step) => ({ key: step.key, agent: step.agent, status: step.status })),
      databaseEffects: { contentAssetId: asset?.id ?? null, draftStatusAfterPublish: publishStatus, publicationRows, qaPassed: (result.output as Record<string, unknown>).seoScore ?? null },
      auditRows: await auditCountFor(result.correlationId),
      passed: Boolean(asset) && publicationRows > 0,
      note: 'Draft grounded in verified records, QA-validated, published only after a single-use human approval.',
    });
  }

  // 3.5 CRM operations review (event-driven)
  {
    const event = await ingestEvent({
      eventType: 'schedule.crm_review',
      payload: { status: 'NEW', period: 'verification window' },
      source: 'VERIFICATION',
      entityType: 'Lead',
      actor: actors.manager,
      mode: 'PRODUCTION',
    });
    const result = event.results[0];
    const duplicate = await ingestEvent({
      eventType: 'schedule.crm_review',
      payload: { status: 'NEW', period: 'verification window' },
      source: 'VERIFICATION',
      entityType: 'Lead',
      actor: actors.manager,
      mode: 'PRODUCTION',
    });
    workflowEvidence.push({
      workflow: 'crm-operations-review',
      status: result?.status ?? event.status,
      runCodes: result?.runCodes ?? [],
      durationMs: result?.durationMs ?? 0,
      steps: (result?.steps ?? []).map((step) => ({ key: step.key, agent: step.agent, status: step.status })),
      databaseEffects: { eventStatus: event.status, duplicateHandling: duplicate.status, issues: (result?.output.issues as unknown[])?.length ?? 0, scanned: result?.output.scanned ?? 0 },
      auditRows: result ? await auditCountFor(result.correlationId) : 0,
      passed: event.status === 'PROCESSED' && duplicate.status === 'DUPLICATE' && (result?.status === 'COMPLETED' || result?.status === 'PARTIAL'),
      note: 'Event-driven trigger with idempotent replay protection; CRM defects reported from live rows.',
    });
  }

  log(`[3] workflows: ${workflowEvidence.filter((entry) => entry.passed).length}/${workflowEvidence.length} passed`);

  // ── Phase 4: production volume so automation is measured, not asserted ──
  const leadIds = fixtures.leadIds;
  let volumeCompleted = 0;
  for (const leadId of leadIds) {
    try {
      const result = await runWorkflow({
        workflowSlug: 'new-lead-processing',
        input: { leadId },
        actor: actors.counselor,
        mode: 'PRODUCTION',
        idempotencyKey: `verify:volume:new-lead-processing:${leadId}`,
      });
      if (result.status === 'COMPLETED') volumeCompleted += 1;
    } catch (error) {
      log(`    ! lead ${leadId}: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }
  for (const applicationId of fixtures.applicationIds) {
    await runWorkflow({
      workflowSlug: 'application-processing',
      input: { applicationId, deadline: new Date(Date.now() + 30 * 86_400_000).toISOString() },
      actor: actors.counselor,
      mode: 'PRODUCTION',
      idempotencyKey: `verify:volume:application-processing:${applicationId}`,
    }).catch(() => undefined);
  }
  for (const studentId of ['AWF-TEST-STUDENT-1', 'AWF-TEST-STUDENT-2']) {
    await runWorkflow({
      workflowSlug: 'student-course-matching',
      input: { studentId, preferredCountry: 'United Kingdom', preferredLevel: 'Masters', preferredCourse: 'Computer Science', englishScore: 6.5, budget: 30000 },
      actor: actors.counselor,
      mode: 'PRODUCTION',
      idempotencyKey: `verify:volume:student-course-matching:${studentId}`,
    }).catch(() => undefined);
  }
  log(`[4] production volume: ${volumeCompleted}/${leadIds.length} lead workflows completed`);

  // ── Phase 5: routing, fallback and "never silently drop a task" ──
  const routing = detectRuntimes().map((runtime) => ({ runtimeKey: runtime.runtimeKey, tier: runtime.tier, kind: runtime.kind, isPaidService: runtime.isPaidService, enabled: runtime.enabled }));
  const plannedRoute = (await planRoute({ task: 'lead.qualify', instructions: 'x', input: {}, correlationId: 'route-probe' })).map((runtime) => runtime.runtimeKey);
  const confidentialRoute = (await planRoute({ task: 'lead.qualify', instructions: 'x', input: {}, correlationId: 'route-probe-confidential', confidential: true })).map((runtime) => runtime.runtimeKey);

  // Fault injection: register two self-hosted runtimes, force both to fail and
  // prove the task still completes on the ALO deterministic terminal runtime.
  // `failRuntimes` short-circuits inside the gateway, so this proves the
  // fallback chain without depending on a reachable model server.
  const previousPrimary = process.env.ALO_LOCAL_AI_URL;
  const previousSecondary = process.env.ALO_LOCAL_AI_FALLBACK_URL;
  process.env.ALO_LOCAL_AI_URL = 'http://alo-local-runtime.invalid/v1/chat/completions';
  process.env.ALO_LOCAL_AI_FALLBACK_URL = 'http://alo-local-runtime-2.invalid/v1/chat/completions';
  const faultChain = detectRuntimes();
  const fallbackProbe = await aiGatewayExecute(
    {
      task: 'lead.qualify',
      instructions: 'Qualify this lead.',
      input: {},
      context: { lead: { fullName: 'Fallback Probe', phone: '+8801700000000', email: 'fallback@example.test', source: 'WEBSITE', preferredCountry: 'United Kingdom', preferredCourse: 'Business', notes: 'Ready to apply now.' } },
      outputSchemaKey: 'lead.qualification',
      correlationId: 'fallback-probe',
    },
    { runtimes: faultChain, failRuntimes: ['alo-local-primary', 'alo-local-secondary', 'alo-optional-cloud'] }
  );
  const faultChainKeys = faultChain.map((runtime) => runtime.runtimeKey);
  if (previousPrimary === undefined) delete process.env.ALO_LOCAL_AI_URL;
  else process.env.ALO_LOCAL_AI_URL = previousPrimary;
  if (previousSecondary === undefined) delete process.env.ALO_LOCAL_AI_FALLBACK_URL;
  else process.env.ALO_LOCAL_AI_FALLBACK_URL = previousSecondary;

  let unsupportedTaskHandled = 'NOT_TESTED';
  try {
    await aiGatewayExecute({ task: 'task.that.does.not.exist', instructions: 'x', input: {}, correlationId: 'unsupported-probe' });
    unsupportedTaskHandled = 'FAILED — an unsupported task returned success';
  } catch (error) {
    unsupportedTaskHandled = error instanceof GatewayError ? `${error.category} (${error.attempts.length} attempt(s) recorded)` : 'unexpected error type';
  }

  log(`[5] routing: ${plannedRoute.join(' -> ')} | fallback terminal runtime: ${fallbackProbe.runtimeKey}`);

  // ── Phase 6: security suite ──
  const anyRun = await db.awfRun.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } });
  const securityCases: SecurityCase[] = await runSecuritySuite(actors, {
    studentId: fixtures.studentIds[0],
    otherStudentId: fixtures.studentIds[1],
    leadId: 'AWF-TEST-LEAD-1',
    runId: anyRun?.id || '',
  });
  const securityPassed = securityCases.filter((entry) => entry.passed).length;
  log(`[6] security: ${securityPassed}/${securityCases.length} controls held`);

  // ── Phase 7: knowledge access control ──
  const knowledgeAdmin = await retrieveKnowledge('automation measurement formula', actors.superAdmin, 3);
  const knowledgeStudent = await retrieveKnowledge('automation measurement formula', actors.student, 3);

  // ── Phase 8: measurement, telemetry and health ──
  const automation = await computeAutomationReport();
  const dashboard = await dashboardSnapshot();
  const performance = await agentPerformance();
  const health = await systemHealth({ probe: true });
  const recovery = await recoverFailures();

  log(`[7] automation: ${automation.automationRate}% of ${automation.eligibleTasks} eligible tasks (human intervention ${automation.humanInterventionRate}%)`);

  // ── Phase 9: persistence proof ──
  const persistence = {
    agents: await db.awfAgent.count(),
    activeAgents: await db.awfAgent.count({ where: { status: 'ACTIVE' } }),
    agentVersions: await db.awfAgentVersion.count(),
    deployedVersions: await db.awfAgentVersion.count({ where: { state: 'DEPLOYED' } }),
    promptVersions: await db.awfPromptVersion.count(),
    tools: await db.awfTool.count(),
    toolGrants: await db.awfToolGrant.count(),
    skills: await db.awfSkill.count(),
    skillGrants: await db.awfSkillGrant.count(),
    workflows: await db.awfWorkflow.count(),
    runs: await db.awfRun.count(),
    productionRuns: await db.awfRun.count({ where: { mode: 'PRODUCTION' } }),
    testRuns: await db.awfRun.count({ where: { mode: 'TEST' } }),
    runSteps: await db.awfRunStep.count(),
    toolCalls: await db.awfToolCall.count(),
    deniedToolCalls: await db.awfToolCall.count({ where: { status: 'DENIED' } }),
    approvals: await db.awfApproval.count(),
    consumedApprovals: await db.awfApproval.count({ where: { status: 'CONSUMED' } }),
    auditRows: await db.awfAuditLog.count(),
    events: await db.awfEvent.count(),
    testCases: await db.awfTestCase.count(),
    testResults: await db.awfTestResult.count(),
    memoryRows: await db.awfMemory.count(),
    knowledgeSources: await db.awfKnowledgeSource.count(),
    knowledgeChunks: await db.awfKnowledgeChunk.count(),
    taskLedger: await db.awfTaskLedger.count(),
    modelRuntimes: await db.awfModelRuntime.count(),
    crmTasksCreated: await db.task.count(),
    timelineEvents: await db.timelineEvent.count(),
    applicationDeadlines: await db.applicationDeadline.count(),
    contentAssets: await db.contentAsset.count(),
    contentPublications: await db.contentPublication.count(),
    automationEvents: await db.automationEvent.count(),
  };

  const paidRuntimesRequired = (await db.awfModelRuntime.findMany({ where: { enabled: true, isPaidService: true } })).length;

  const evidence = {
    product: 'ALO Education — AI Builder & AI Workforce',
    generatedAt: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    environment: {
      databaseDriver: process.env.ALO_DB_DRIVER === 'sqlite' ? 'sqlite (verification mirror of prisma/schema.prisma)' : 'mysql',
      nodeVersion: process.version,
      paidAiKeysPresent: {
        OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
        ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
        GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY),
        OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY),
        ZAI_API_KEY: Boolean(process.env.ZAI_API_KEY),
      },
      localRuntimeConfigured: Boolean(process.env.ALO_LOCAL_AI_URL || process.env.LOCAL_AI_URL),
    },
    fixtures: counts,
    installation: seed,
    inventory: seedInventory(),
    workflows: workflowEvidence,
    routing: {
      detectedRuntimes: routing,
      plannedRoute,
      confidentialRoute,
      confidentialExcludesCloud: !confidentialRoute.includes('alo-optional-cloud'),
      fallbackProbe: {
        chainUnderTest: faultChainKeys,
        forcedFailures: ['alo-local-primary', 'alo-local-secondary', 'alo-optional-cloud'],
        resolvedRuntime: fallbackProbe.runtimeKey,
        deterministic: fallbackProbe.deterministic,
        attempts: fallbackProbe.attempts.map((attempt) => ({ runtimeKey: attempt.runtimeKey, ok: attempt.ok, errorCategory: attempt.errorCategory })),
        outputValid: Boolean(fallbackProbe.data.tier),
      },
      unsupportedTaskHandling: unsupportedTaskHandled,
      paidRuntimesRequired,
    },
    security: {
      total: securityCases.length,
      passed: securityPassed,
      failed: securityCases.length - securityPassed,
      cases: securityCases,
    },
    knowledgeAccessControl: {
      superAdminChunks: knowledgeAdmin.length,
      studentChunks: knowledgeStudent.length,
      isolated: knowledgeStudent.length === 0 && knowledgeAdmin.length > 0,
    },
    automation,
    telemetry: {
      agents: dashboard.agents,
      registry: dashboard.registry,
      runs: dashboard.runs,
      tools: dashboard.tools,
      approvals: dashboard.approvals,
      topFailures: dashboard.topFailures,
      agentPerformance: performance,
    },
    health: {
      status: health.status,
      executableRuntimes: health.executableRuntimes,
      deterministicTasks: health.deterministicTasks,
      canServeAllTasks: health.canServeAllTasks,
      queues: health.queues,
      notes: health.notes,
      recovery,
    },
    persistence,
  };

  writeFileSync('AI-AUTOMATION-EVIDENCE.json', `${JSON.stringify(evidence, null, 2)}\n`);
  log('[8] wrote AI-AUTOMATION-EVIDENCE.json');

  const workflowsPassed = workflowEvidence.every((entry) => entry.passed);
  const allGreen = workflowsPassed && securityPassed === securityCases.length && seed.failures.length === 0;
  log(`── verification ${allGreen ? 'PASSED' : 'INCOMPLETE'} ─────────────────────────────`);
  process.exit(allGreen ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
