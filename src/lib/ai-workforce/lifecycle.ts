/**
 * ALO AI Workforce — agent lifecycle and versioning (§11, §33).
 *
 * DRAFT -> VALIDATE -> TEST -> APPROVE -> DEPLOY -> ACTIVE -> PAUSED ->
 * DISABLED -> ARCHIVED, with an immutable version per change and a one-call
 * rollback. Every transition is capability-checked and audited; no transition
 * can be skipped (you cannot deploy a version that was never approved, and you
 * cannot approve a version that failed validation or testing).
 */
import { db } from '@/lib/db';
import { requireCapability } from './rbac';
import { writeAudit } from './audit';
import { validateAgentVersion, type ValidationReport } from './validation';
import { runAgent } from './runner';
import { stableHash, sortDeep } from './text';
import type { ActorContext } from './types';

export class LifecycleError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const VERSION_STATES = ['DRAFT', 'VALIDATED', 'VALIDATION_FAILED', 'TESTED', 'TEST_FAILED', 'APPROVED', 'DEPLOYED', 'ROLLED_BACK', 'ARCHIVED'] as const;
export type VersionState = (typeof VERSION_STATES)[number];

export const AGENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['VALIDATED', 'ARCHIVED'],
  VALIDATED: ['TESTED', 'DRAFT', 'ARCHIVED'],
  TESTED: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['DEPLOYING', 'DRAFT', 'ARCHIVED'],
  DEPLOYING: ['ACTIVE', 'APPROVED'],
  ACTIVE: ['PAUSED', 'DISABLED', 'DEPLOYING'],
  PAUSED: ['ACTIVE', 'DISABLED', 'ARCHIVED'],
  DISABLED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransition(from: string, to: string): boolean {
  return (AGENT_STATUS_TRANSITIONS[from] || []).includes(to);
}

// ───────────────────────────── departments & agents ─────────────────────────────

export async function upsertDepartment(
  input: { slug: string; name: string; description?: string; sortOrder?: number },
  actor: ActorContext
) {
  requireCapability(actor, 'awf.agent.create');
  const department = await db.awfDepartment.upsert({
    where: { slug: input.slug },
    create: { slug: input.slug, name: input.name, description: input.description || '', sortOrder: input.sortOrder ?? 0 },
    update: { name: input.name, description: input.description || '', sortOrder: input.sortOrder ?? 0 },
  });
  return department;
}

export interface CreateAgentInput {
  slug: string;
  name: string;
  departmentSlug: string;
  description?: string;
  purpose?: string;
  role?: string;
  allowedRoles: string[];
  ownerUserId?: string;
}

export async function createAgent(input: CreateAgentInput, actor: ActorContext) {
  requireCapability(actor, 'awf.agent.create');
  const department = await db.awfDepartment.findUnique({ where: { slug: input.departmentSlug }, select: { id: true } });
  if (!department) throw new LifecycleError('DEPARTMENT_UNKNOWN', `unknown department ${input.departmentSlug}`);
  const agent = await db.awfAgent.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      description: input.description || '',
      purpose: input.purpose || '',
      role: input.role || 'SPECIALIST',
      departmentId: department.id,
      allowedRoles: JSON.stringify(input.allowedRoles),
      ownerUserId: input.ownerUserId || actor.userId,
      createdById: actor.userId,
      status: 'DRAFT',
    },
    update: {
      name: input.name,
      description: input.description || '',
      purpose: input.purpose || '',
      role: input.role || 'SPECIALIST',
      departmentId: department.id,
      allowedRoles: JSON.stringify(input.allowedRoles),
    },
  });
  await writeAudit({ actor, action: 'AGENT_CREATED', objectType: 'AwfAgent', objectId: agent.id, after: { slug: agent.slug, department: input.departmentSlug } });
  return agent;
}

export interface CreateVersionInput {
  agentSlug: string;
  config: Record<string, unknown>;
  systemInstructions: string;
  memoryPolicy?: Record<string, unknown>;
  modelPolicy?: Record<string, unknown>;
  approvalPolicy?: Record<string, unknown>;
  securityPolicy?: Record<string, unknown>;
  changeReason?: string;
}

/** Versions are immutable: every edit produces a new version row. */
export async function createAgentVersion(input: CreateVersionInput, actor: ActorContext) {
  requireCapability(actor, 'awf.agent.edit');
  const agent = await db.awfAgent.findUnique({ where: { slug: input.agentSlug }, select: { id: true, latestVersionNo: true, slug: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', `unknown agent ${input.agentSlug}`);

  const versionNo = agent.latestVersionNo + 1;
  const configHash = stableHash(sortDeep(input.config));
  const previous = await db.awfAgentVersion.findFirst({
    where: { agentId: agent.id },
    orderBy: { versionNo: 'desc' },
    select: { id: true, systemInstructions: true },
  });

  const version = await db.awfAgentVersion.create({
    data: {
      agentId: agent.id,
      versionNo,
      config: JSON.stringify(input.config),
      systemInstructions: input.systemInstructions,
      skills: JSON.stringify(((input.config.pipeline as Array<{ skill: string }>) || []).map((step) => step.skill)),
      memoryPolicy: JSON.stringify(input.memoryPolicy ?? {}),
      modelPolicy: JSON.stringify(input.modelPolicy ?? {}),
      approvalPolicy: JSON.stringify(input.approvalPolicy ?? {}),
      securityPolicy: JSON.stringify(input.securityPolicy ?? {}),
      changeReason: input.changeReason || '',
      configHash,
      state: 'DRAFT',
      createdById: actor.userId,
    },
  });

  // Prompt history is versioned independently so instruction changes are reviewable.
  await db.awfPromptVersion.create({
    data: {
      versionId: version.id,
      agentSlug: agent.slug,
      previousText: previous?.systemInstructions || '',
      newText: input.systemInstructions,
      reason: input.changeReason || '',
      authorId: actor.userId,
    },
  });

  await db.awfAgent.update({ where: { id: agent.id }, data: { latestVersionNo: versionNo, currentVersionId: version.id, status: 'DRAFT' } });
  await writeAudit({ actor, action: 'AGENT_VERSION_CREATED', objectType: 'AwfAgentVersion', objectId: version.id, after: { agent: agent.slug, versionNo, configHash } });
  return version;
}

// ───────────────────────────── gates ─────────────────────────────

export async function validateVersion(versionId: string, actor: ActorContext): Promise<ValidationReport> {
  requireCapability(actor, 'awf.agent.validate');
  const report = await validateAgentVersion(versionId);
  const version = await db.awfAgentVersion.update({
    where: { id: versionId },
    data: { validationReport: JSON.stringify(report).slice(0, 200_000), state: report.passed ? 'VALIDATED' : 'VALIDATION_FAILED' },
    select: { agentId: true },
  });
  if (report.passed) {
    const agent = await db.awfAgent.findUnique({ where: { id: version.agentId }, select: { status: true } });
    if (agent && canTransition(agent.status, 'VALIDATED')) {
      await db.awfAgent.update({ where: { id: version.agentId }, data: { status: 'VALIDATED' } });
    }
  }
  await writeAudit({
    actor,
    action: 'AGENT_VALIDATED',
    objectType: 'AwfAgentVersion',
    objectId: versionId,
    after: { passed: report.passed, errors: report.errors.length, warnings: report.warnings.length },
    result: report.passed ? 'SUCCESS' : 'FAILED',
  });
  return report;
}

export interface TestReport {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  cases: Array<{ name: string; passed: boolean; critical: boolean; detail: string; runCode?: string }>;
  testedAt: string;
}

/**
 * Executes the agent's registered test cases in TEST mode. TEST runs never
 * mutate production data: mutating tools are intercepted by the simulation
 * guard in the tool gateway.
 */
export async function testVersion(versionId: string, actor: ActorContext): Promise<TestReport> {
  requireCapability(actor, 'awf.agent.test');
  const version = await db.awfAgentVersion.findUnique({ where: { id: versionId }, select: { id: true, agentId: true, state: true } });
  if (!version) throw new LifecycleError('VERSION_UNKNOWN', 'agent version not found');
  if (version.state === 'VALIDATION_FAILED' || version.state === 'DRAFT') {
    throw new LifecycleError('NOT_VALIDATED', 'the version must pass validation before it can be tested');
  }
  const agent = await db.awfAgent.findUnique({ where: { id: version.agentId }, select: { slug: true, id: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', 'owning agent not found');

  const testCases = await db.awfTestCase.findMany({ where: { agentId: agent.id, status: 'ACTIVE' } });
  const cases: TestReport['cases'] = [];

  for (const testCase of testCases) {
    const started = Date.now();
    let passed = false;
    let detail = '';
    let runCode: string | undefined;
    try {
      const result = await runAgent({
        agentSlug: agent.slug,
        input: JSON.parse(testCase.input || '{}'),
        actor,
        mode: 'TEST',
        triggerType: 'TEST_LAB',
      });
      runCode = result.runCode;
      const expectation = JSON.parse(testCase.expectation || '{}') as Record<string, unknown>;
      const evaluation = evaluateExpectation(result as unknown as Record<string, unknown>, expectation);
      passed = evaluation.passed;
      detail = evaluation.detail;
    } catch (error) {
      passed = false;
      detail = error instanceof Error ? error.message : 'test execution crashed';
    }
    cases.push({ name: testCase.name, passed, critical: testCase.critical, detail, runCode });
    await db.awfTestResult.create({
      data: {
        testCaseId: testCase.id,
        versionId,
        runId: runCode || '',
        passed,
        details: JSON.stringify({ detail }).slice(0, 20_000),
        durationMs: Date.now() - started,
      },
    });
  }

  const criticalFailures = cases.filter((entry) => !entry.passed && entry.critical).length;
  const report: TestReport = {
    passed: testCases.length > 0 && criticalFailures === 0,
    total: cases.length,
    passedCount: cases.filter((entry) => entry.passed).length,
    failedCount: cases.filter((entry) => !entry.passed).length,
    cases,
    testedAt: new Date().toISOString(),
  };

  await db.awfAgentVersion.update({
    where: { id: versionId },
    data: { testReport: JSON.stringify(report).slice(0, 200_000), state: report.passed ? 'TESTED' : 'TEST_FAILED' },
  });
  if (report.passed) {
    const current = await db.awfAgent.findUnique({ where: { id: agent.id }, select: { status: true } });
    if (current && canTransition(current.status, 'TESTED')) await db.awfAgent.update({ where: { id: agent.id }, data: { status: 'TESTED' } });
  }
  await writeAudit({
    actor,
    action: 'AGENT_TESTED',
    objectType: 'AwfAgentVersion',
    objectId: versionId,
    after: { passed: report.passed, total: report.total, failed: report.failedCount },
    result: report.passed ? 'SUCCESS' : 'FAILED',
  });
  return report;
}

/** Expectation DSL: `{ "status": "COMPLETED", "output.tier": "HOT", "output.score": { "gte": 70 } }`. */
export function evaluateExpectation(actual: Record<string, unknown>, expectation: Record<string, unknown>): { passed: boolean; detail: string } {
  const failures: string[] = [];
  for (const [path, expected] of Object.entries(expectation)) {
    const value = path.split('.').reduce<unknown>((acc, segment) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[segment] : undefined), actual);
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      const rule = expected as Record<string, unknown>;
      if (rule.gte !== undefined && !(Number(value) >= Number(rule.gte))) failures.push(`${path} ${String(value)} < ${String(rule.gte)}`);
      if (rule.lte !== undefined && !(Number(value) <= Number(rule.lte))) failures.push(`${path} ${String(value)} > ${String(rule.lte)}`);
      if (rule.in !== undefined && Array.isArray(rule.in) && !rule.in.includes(value as never)) failures.push(`${path} ${String(value)} not in ${JSON.stringify(rule.in)}`);
      if (rule.exists !== undefined && (value === undefined || value === null) === Boolean(rule.exists)) failures.push(`${path} existence mismatch`);
      if (rule.nonEmpty === true && !(Array.isArray(value) ? value.length : String(value || '').length)) failures.push(`${path} is empty`);
    } else if (value !== expected) {
      failures.push(`${path} expected ${JSON.stringify(expected)}, received ${JSON.stringify(value)}`);
    }
  }
  return { passed: failures.length === 0, detail: failures.join('; ') || 'all expectations met' };
}

export async function approveVersion(versionId: string, actor: ActorContext) {
  requireCapability(actor, 'awf.agent.approve');
  const version = await db.awfAgentVersion.findUnique({ where: { id: versionId }, select: { id: true, agentId: true, state: true, createdById: true } });
  if (!version) throw new LifecycleError('VERSION_UNKNOWN', 'agent version not found');
  if (version.state !== 'TESTED') throw new LifecycleError('NOT_TESTED', `version state is ${version.state}; only a TESTED version can be approved`);
  // Separation of duties: the author cannot approve their own version.
  if (version.createdById && version.createdById === actor.userId && actor.role !== 'SUPER_ADMIN') {
    throw new LifecycleError('SEPARATION_OF_DUTIES', 'the author of a version may not approve it');
  }
  const updated = await db.awfAgentVersion.update({
    where: { id: versionId },
    data: { state: 'APPROVED', approvedById: actor.userId, approvedAt: new Date() },
  });
  await db.awfPromptVersion.updateMany({ where: { versionId }, data: { approvedById: actor.userId, approvedAt: new Date(), testPassed: true } });
  const agent = await db.awfAgent.findUnique({ where: { id: version.agentId }, select: { status: true } });
  if (agent && canTransition(agent.status, 'APPROVED')) await db.awfAgent.update({ where: { id: version.agentId }, data: { status: 'APPROVED' } });
  await writeAudit({ actor, action: 'AGENT_APPROVED', objectType: 'AwfAgentVersion', objectId: versionId, after: { approvedBy: actor.userId } });
  return updated;
}

export async function deployVersion(versionId: string, actor: ActorContext) {
  requireCapability(actor, 'awf.agent.deploy');
  const version = await db.awfAgentVersion.findUnique({ where: { id: versionId }, select: { id: true, agentId: true, state: true, versionNo: true } });
  if (!version) throw new LifecycleError('VERSION_UNKNOWN', 'agent version not found');
  if (version.state !== 'APPROVED') throw new LifecycleError('NOT_APPROVED', `version state is ${version.state}; only an APPROVED version can be deployed`);

  const deployed = await db.$transaction(async (tx) => {
    // Any previously deployed version steps down; history is preserved.
    await tx.awfAgentVersion.updateMany({ where: { agentId: version.agentId, state: 'DEPLOYED' }, data: { state: 'ROLLED_BACK' } });
    const row = await tx.awfAgentVersion.update({
      where: { id: versionId },
      data: { state: 'DEPLOYED', deployedById: actor.userId, deployedAt: new Date() },
    });
    await tx.awfAgent.update({
      where: { id: version.agentId },
      data: { activeVersionId: versionId, currentVersionId: versionId, status: 'ACTIVE' },
    });
    return row;
  });

  await writeAudit({ actor, action: 'AGENT_DEPLOYED', objectType: 'AwfAgentVersion', objectId: versionId, after: { versionNo: version.versionNo, status: 'ACTIVE' } });
  return deployed;
}

export async function rollbackAgent(agentSlug: string, targetVersionNo: number, actor: ActorContext) {
  requireCapability(actor, 'awf.agent.rollback');
  const agent = await db.awfAgent.findUnique({ where: { slug: agentSlug }, select: { id: true, activeVersionId: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', `unknown agent ${agentSlug}`);
  const target = await db.awfAgentVersion.findUnique({ where: { agentId_versionNo: { agentId: agent.id, versionNo: targetVersionNo } } });
  if (!target) throw new LifecycleError('VERSION_UNKNOWN', `version ${targetVersionNo} does not exist`);
  if (!['DEPLOYED', 'ROLLED_BACK', 'APPROVED'].includes(target.state)) {
    throw new LifecycleError('NOT_DEPLOYABLE', `version ${targetVersionNo} was never approved; it cannot be rolled back to`);
  }
  await db.$transaction(async (tx) => {
    await tx.awfAgentVersion.updateMany({ where: { agentId: agent.id, state: 'DEPLOYED' }, data: { state: 'ROLLED_BACK' } });
    await tx.awfAgentVersion.update({ where: { id: target.id }, data: { state: 'DEPLOYED', deployedById: actor.userId, deployedAt: new Date() } });
    await tx.awfAgent.update({ where: { id: agent.id }, data: { activeVersionId: target.id, currentVersionId: target.id, status: 'ACTIVE' } });
  });
  await writeAudit({
    actor,
    action: 'AGENT_ROLLED_BACK',
    objectType: 'AwfAgent',
    objectId: agent.id,
    before: { activeVersionId: agent.activeVersionId },
    after: { activeVersionId: target.id, versionNo: targetVersionNo },
  });
  return target;
}

export async function setAgentStatus(agentSlug: string, status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED', actor: ActorContext) {
  requireCapability(actor, 'awf.agent.disable');
  const agent = await db.awfAgent.findUnique({ where: { slug: agentSlug }, select: { id: true, status: true, isProtected: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', `unknown agent ${agentSlug}`);
  if (agent.isProtected && status === 'ARCHIVED') throw new LifecycleError('PROTECTED', 'this agent is protected and cannot be archived');
  if (!canTransition(agent.status, status)) throw new LifecycleError('INVALID_TRANSITION', `cannot move from ${agent.status} to ${status}`);
  const updated = await db.awfAgent.update({ where: { id: agent.id }, data: { status } });
  const action = status === 'PAUSED' ? 'AGENT_PAUSED' : status === 'DISABLED' ? 'AGENT_DISABLED' : status === 'ARCHIVED' ? 'AGENT_ARCHIVED' : 'AGENT_DEPLOYED';
  await writeAudit({ actor, action, objectType: 'AwfAgent', objectId: agent.id, before: { status: agent.status }, after: { status } });
  return updated;
}

export interface VersionDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export async function compareVersions(agentSlug: string, fromNo: number, toNo: number): Promise<{ diffs: VersionDiff[]; identical: boolean }> {
  const agent = await db.awfAgent.findUnique({ where: { slug: agentSlug }, select: { id: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', `unknown agent ${agentSlug}`);
  const [from, to] = await Promise.all([
    db.awfAgentVersion.findUnique({ where: { agentId_versionNo: { agentId: agent.id, versionNo: fromNo } } }),
    db.awfAgentVersion.findUnique({ where: { agentId_versionNo: { agentId: agent.id, versionNo: toNo } } }),
  ]);
  if (!from || !to) throw new LifecycleError('VERSION_UNKNOWN', 'one of the compared versions does not exist');
  const fields: Array<keyof typeof from> = ['config', 'systemInstructions', 'memoryPolicy', 'modelPolicy', 'approvalPolicy', 'securityPolicy', 'skills'];
  const diffs: VersionDiff[] = [];
  for (const field of fields) {
    if (String(from[field]) !== String(to[field])) diffs.push({ field: String(field), from: from[field], to: to[field] });
  }
  return { diffs, identical: diffs.length === 0 };
}

/**
 * Agents may only PROPOSE changes to themselves. This is the single write path
 * an agent-originated improvement can take, and it never touches the live
 * configuration.
 */
export async function proposeImprovement(input: { agentSlug: string; title: string; rationale: string; diff: Record<string, unknown>; runId?: string; proposedBy: string }) {
  const agent = await db.awfAgent.findUnique({ where: { slug: input.agentSlug }, select: { id: true } });
  if (!agent) throw new LifecycleError('AGENT_UNKNOWN', `unknown agent ${input.agentSlug}`);
  const proposal = await db.awfImprovementProposal.create({
    data: {
      agentId: agent.id,
      proposedBy: input.proposedBy,
      runId: input.runId || '',
      title: input.title,
      rationale: input.rationale,
      diff: JSON.stringify(input.diff).slice(0, 100_000),
      status: 'PENDING',
    },
  });
  await writeAudit({ actor: null, action: 'PROPOSAL_CREATED', objectType: 'AwfImprovementProposal', objectId: proposal.id, after: { agent: input.agentSlug, title: input.title } });
  return proposal;
}

export async function decideProposal(proposalId: string, decision: 'APPROVED' | 'REJECTED', actor: ActorContext) {
  requireCapability(actor, 'awf.agent.approve');
  const proposal = await db.awfImprovementProposal.update({
    where: { id: proposalId },
    data: { status: decision, reviewedById: actor.userId, reviewedAt: new Date() },
  });
  await writeAudit({ actor, action: 'PROPOSAL_DECIDED', objectType: 'AwfImprovementProposal', objectId: proposalId, after: { decision } });
  return proposal;
}
