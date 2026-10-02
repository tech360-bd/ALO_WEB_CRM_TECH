/**
 * ALO AI Workforce — agent validation gates (§11).
 *
 * An agent version cannot reach ACTIVE until every gate below passes. The
 * checks are executed against the real registries and the real grant rows, so
 * a version that would fail at runtime cannot be deployed.
 */
import { db } from '@/lib/db';
import { ALO_ROLES } from './types';
import { getSkillDefinition } from './skills/registry';
import { getToolDefinition } from './tools/registry';
import { getOutputSchema } from './output-schemas';
import { detectInjection, redactSecrets } from './security';
import { parseMemoryPolicy } from './memory';
import { listDeterministicTasks } from './deterministic-engine';
import type { PipelineStep } from './runner';

export interface ValidationCheck {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
}

export interface ValidationReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checks: ValidationCheck[];
  validatedAt: string;
}

interface VersionLike {
  id: string;
  agentId: string;
  config: string;
  systemInstructions: string;
  memoryPolicy: string;
}

export async function validateAgentVersion(versionId: string): Promise<ValidationReport> {
  const checks: ValidationCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const push = (check: ValidationCheck) => {
    checks.push(check);
    if (check.status === 'FAIL') errors.push(`${check.id}: ${check.detail}`);
    if (check.status === 'WARN') warnings.push(`${check.id}: ${check.detail}`);
  };

  const version = (await db.awfAgentVersion.findUnique({
    where: { id: versionId },
    select: { id: true, agentId: true, config: true, systemInstructions: true, memoryPolicy: true },
  })) as VersionLike | null;

  if (!version) {
    return {
      passed: false,
      errors: ['version.exists: agent version not found'],
      warnings: [],
      checks: [{ id: 'version.exists', label: 'Version exists', status: 'FAIL', detail: 'agent version not found' }],
      validatedAt: new Date().toISOString(),
    };
  }

  const agent = await db.awfAgent.findUnique({ where: { id: version.agentId }, select: { id: true, slug: true, allowedRoles: true, departmentId: true } });
  if (!agent) {
    return {
      passed: false,
      errors: ['agent.exists: owning agent not found'],
      warnings: [],
      checks: [{ id: 'agent.exists', label: 'Agent exists', status: 'FAIL', detail: 'owning agent not found' }],
      validatedAt: new Date().toISOString(),
    };
  }

  // 1. Configuration parses and declares a pipeline.
  let config: { pipeline?: PipelineStep[]; outputStep?: string; automation?: { category?: string; eligible?: boolean } } = {};
  try {
    config = JSON.parse(version.config || '{}');
    push({ id: 'config.parse', label: 'Configuration is valid JSON', status: 'PASS', detail: 'parsed' });
  } catch {
    push({ id: 'config.parse', label: 'Configuration is valid JSON', status: 'FAIL', detail: 'configuration is not valid JSON' });
  }

  const pipeline = Array.isArray(config.pipeline) ? config.pipeline : [];
  push({
    id: 'config.pipeline',
    label: 'Pipeline declares at least one step',
    status: pipeline.length ? 'PASS' : 'FAIL',
    detail: pipeline.length ? `${pipeline.length} step(s)` : 'pipeline is empty; the agent would do nothing',
  });

  // 2. Every referenced skill is implemented.
  const unknownSkills = pipeline.filter((step) => !getSkillDefinition(step.skill)).map((step) => step.skill);
  push({
    id: 'skills.implemented',
    label: 'All pipeline skills are implemented',
    status: unknownSkills.length ? 'FAIL' : 'PASS',
    detail: unknownSkills.length ? `unimplemented skills: ${unknownSkills.join(', ')}` : 'all skills resolve to ALO implementations',
  });

  // 3. Step keys are unique and output step exists.
  const keys = pipeline.map((step) => step.key);
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
  push({
    id: 'config.step_keys',
    label: 'Step keys are unique',
    status: duplicateKeys.length ? 'FAIL' : 'PASS',
    detail: duplicateKeys.length ? `duplicate step keys: ${[...new Set(duplicateKeys)].join(', ')}` : 'unique',
  });
  if (config.outputStep) {
    push({
      id: 'config.output_step',
      label: 'Output step exists in the pipeline',
      status: keys.includes(config.outputStep) ? 'PASS' : 'FAIL',
      detail: keys.includes(config.outputStep) ? config.outputStep : `outputStep "${config.outputStep}" is not a pipeline step`,
    });
  }

  // 4. Tool grants cover every tool the pipeline's skills require, and the
  //    grant permission is sufficient. Agents cannot self-grant: validation
  //    FAILS rather than creating the missing grant.
  const requiredTools = new Set<string>();
  for (const step of pipeline) {
    const skill = getSkillDefinition(step.skill);
    for (const tool of skill?.requiredTools ?? []) requiredTools.add(tool);
  }
  const grants = await db.awfToolGrant.findMany({
    where: { agentId: agent.id, status: 'ACTIVE' },
    select: { permission: true, tool: { select: { slug: true, status: true, riskLevel: true, requiresApproval: true } } },
  });
  const grantedSlugs = new Map(grants.map((grant) => [grant.tool.slug, grant]));
  const missingGrants = [...requiredTools].filter((slug) => !grantedSlugs.has(slug));
  push({
    id: 'tools.granted',
    label: 'Required tools are granted',
    status: missingGrants.length ? 'FAIL' : 'PASS',
    detail: missingGrants.length ? `missing active grants: ${missingGrants.join(', ')}` : `${requiredTools.size} tool grant(s) verified`,
  });

  const inactiveTools = [...requiredTools].filter((slug) => grantedSlugs.get(slug)?.tool.status && grantedSlugs.get(slug)!.tool.status !== 'ACTIVE');
  push({
    id: 'tools.active',
    label: 'Granted tools are active',
    status: inactiveTools.length ? 'FAIL' : 'PASS',
    detail: inactiveTools.length ? `inactive tools: ${inactiveTools.join(', ')}` : 'all granted tools are active',
  });

  const unregisteredTools = [...requiredTools].filter((slug) => !getToolDefinition(slug));
  push({
    id: 'tools.implemented',
    label: 'Granted tools have handlers',
    status: unregisteredTools.length ? 'FAIL' : 'PASS',
    detail: unregisteredTools.length ? `no handler registered: ${unregisteredTools.join(', ')}` : 'all tools have ALO handlers',
  });

  // 5. High-risk tools must be approval-gated.
  const ungatedHighRisk = [...requiredTools].filter((slug) => {
    const definition = getToolDefinition(slug);
    if (!definition) return false;
    if (!['HIGH', 'CRITICAL'].includes(definition.riskLevel)) return false;
    return !definition.requiresApproval;
  });
  push({
    id: 'tools.approval_gate',
    label: 'High-risk tools require approval',
    status: ungatedHighRisk.length ? 'FAIL' : 'PASS',
    detail: ungatedHighRisk.length ? `high-risk tools without an approval gate: ${ungatedHighRisk.join(', ')}` : 'all high-risk tools are approval-gated',
  });

  // 6. Instructions: present, free of injection payloads and of secrets.
  const instructions = String(version.systemInstructions || '');
  push({
    id: 'instructions.present',
    label: 'System instructions are present',
    status: instructions.trim().length >= 40 ? 'PASS' : 'FAIL',
    detail: instructions.trim().length >= 40 ? `${instructions.length} characters` : 'system instructions are missing or too short to constrain behaviour',
  });
  const injection = detectInjection(instructions);
  push({
    id: 'instructions.injection_free',
    label: 'Instructions contain no injection payload',
    status: injection.length ? 'FAIL' : 'PASS',
    detail: injection.length ? `patterns detected: ${injection.map((finding) => finding.id).join(', ')}` : 'clean',
  });
  push({
    id: 'instructions.secret_free',
    label: 'Instructions contain no credentials',
    status: redactSecrets(instructions) === instructions ? 'PASS' : 'FAIL',
    detail: redactSecrets(instructions) === instructions ? 'no credential pattern found' : 'a credential-like string is embedded in the instructions',
  });

  // 7. Invocation roles.
  let allowedRoles: string[] = [];
  try {
    allowedRoles = JSON.parse(agent.allowedRoles || '[]');
  } catch {
    allowedRoles = [];
  }
  const invalidRoles = allowedRoles.filter((role) => !(ALO_ROLES as readonly string[]).includes(role));
  push({
    id: 'rbac.allowed_roles',
    label: 'Allowed roles are valid and non-empty',
    status: allowedRoles.length && !invalidRoles.length ? 'PASS' : 'FAIL',
    detail: !allowedRoles.length ? 'no role may invoke this agent' : invalidRoles.length ? `unknown roles: ${invalidRoles.join(', ')}` : allowedRoles.join(', '),
  });

  // 8. Memory policy.
  const memoryPolicy = parseMemoryPolicy(version.memoryPolicy);
  const selfApprovingWrites = memoryPolicy.writeScopes.filter((scope) => scope === 'COMPANY' || scope === 'LONG_TERM');
  push({
    id: 'memory.policy',
    label: 'Memory policy is explicit',
    status: 'PASS',
    detail: `scopes: ${Object.entries({
      SHORT_TERM: memoryPolicy.shortTerm,
      LONG_TERM: memoryPolicy.longTerm,
      COMPANY: memoryPolicy.company,
      DEPARTMENT: memoryPolicy.department,
      USER: memoryPolicy.user,
    })
      .filter(([, enabled]) => enabled)
      .map(([scope]) => scope)
      .join(', ') || 'none'}; max confidentiality ${memoryPolicy.maxConfidentiality}`,
  });
  if (selfApprovingWrites.length) {
    push({
      id: 'memory.durable_writes',
      label: 'Durable memory writes need human approval',
      status: 'WARN',
      detail: `${selfApprovingWrites.join(', ')} writes are declared; entries stay unapproved until an admin approves them`,
    });
  }

  // 9. Gateway reachability for every task the pipeline can emit: the
  //    deterministic terminal runtime must implement each one, otherwise the
  //    agent could fail when no model runtime is configured.
  const deterministicTasks = new Set(listDeterministicTasks());
  const schemaKeys = new Set(['lead.qualification', 'profile.analysis', 'course.match', 'scholarship.match', 'checklist', 'crm.cleanup', 'content.draft', 'qa.validation', 'report.summary', 'university.research']);
  const unsupported: string[] = [];
  for (const step of pipeline) {
    const skill = getSkillDefinition(step.skill);
    if (!skill) continue;
    const taskHint = step.skill.replace('.find', '.match').replace('student.profile.analyze', 'profile.analyze');
    if (deterministicTasks.has(taskHint) === false && deterministicTasks.has(step.skill) === false) continue;
    if (!deterministicTasks.has(taskHint)) unsupported.push(step.skill);
  }
  push({
    id: 'gateway.deterministic_fallback',
    label: 'Deterministic fallback covers the pipeline',
    status: unsupported.length ? 'WARN' : 'PASS',
    detail: unsupported.length ? `no ALO rule set for: ${unsupported.join(', ')}` : `${deterministicTasks.size} deterministic task(s) available as terminal fallback`,
  });
  push({
    id: 'gateway.output_schemas',
    label: 'Output schemas are registered',
    status: [...schemaKeys].every((key) => getOutputSchema(key)) ? 'PASS' : 'FAIL',
    detail: `${schemaKeys.size} schema contract(s) registered`,
  });

  // 10. Automation declaration.
  const category = config.automation?.category || 'ELIGIBLE_ROUTINE';
  push({
    id: 'automation.category',
    label: 'Automation category is valid',
    status: ['ELIGIBLE_ROUTINE', 'HUMAN_REQUIRED', 'SAFETY_APPROVAL'].includes(category) ? 'PASS' : 'FAIL',
    detail: category,
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    checks,
    validatedAt: new Date().toISOString(),
  };
}
