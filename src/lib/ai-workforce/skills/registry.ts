/**
 * ALO AI Workforce — skill registry.
 *
 * A skill is ALO-owned executable capability: it retrieves facts through
 * permitted tools, asks the gateway for a validated structured judgement, and
 * persists the outcome. Skills are versioned, permissioned and testable; they
 * are never free-form prompt text.
 */
import { z } from 'zod';
import { db } from '@/lib/db';
import type { ActorContext, RunMode, SkillResult } from './../types';
import type { ToolExecutionOutcome } from './../tools/registry';
import { describeZod } from './../tools/registry';

export interface SkillContext {
  actor: ActorContext;
  agentSlug: string;
  runId: string;
  mode: RunMode;
  correlationId: string;
  /** Tool invocation bound to this run; enforces grants, approvals and audit. */
  callTool: (slug: string, args: Record<string, unknown>, options?: { approvalId?: string }) => Promise<ToolExecutionOutcome>;
  /** Gateway call bound to this run; output is schema-validated before return. */
  reason: (params: {
    task: string;
    instructions: string;
    input: Record<string, unknown>;
    context?: Record<string, unknown>;
    outputSchemaKey: string;
    confidential?: boolean;
  }) => Promise<{ data: Record<string, unknown>; runtimeKey: string; deterministic: boolean; fallbackUsed: boolean }>;
  recordStep: (step: { stepKey: string; stepType: string; refSlug?: string; status: string; input?: unknown; output?: unknown; note?: string }) => Promise<void>;
  /** Approval ids the caller already holds for this run, keyed by action. */
  approvals?: Record<string, string>;
}

export interface SkillDefinition {
  slug: string;
  name: string;
  description: string;
  permission: 'SKILL_READ' | 'SKILL_WRITE' | 'SKILL_ADMIN';
  version: number;
  /** Tools this skill may use. Validation rejects an agent that lacks them. */
  requiredTools: string[];
  input: z.ZodTypeAny;
  output: z.ZodTypeAny;
  execute: (input: Record<string, unknown>, ctx: SkillContext) => Promise<SkillResult>;
}

const REGISTRY = new Map<string, SkillDefinition>();

export function registerSkill(definition: SkillDefinition): void {
  if (REGISTRY.has(definition.slug)) throw new Error(`AWF_SKILL_DUPLICATE: ${definition.slug}`);
  REGISTRY.set(definition.slug, definition);
}

export function getSkillDefinition(slug: string): SkillDefinition | undefined {
  return REGISTRY.get(slug);
}

export function listSkillDefinitions(): SkillDefinition[] {
  return [...REGISTRY.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function syncSkillRegistry(): Promise<number> {
  let count = 0;
  for (const skill of listSkillDefinitions()) {
    await db.awfSkill.upsert({
      where: { slug: skill.slug },
      create: {
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        handlerKey: skill.slug,
        inputSchema: JSON.stringify(describeZod(skill.input)),
        outputSchema: JSON.stringify(describeZod(skill.output)),
        permission: skill.permission,
        version: skill.version,
        status: 'ACTIVE',
      },
      update: {
        name: skill.name,
        description: skill.description,
        handlerKey: skill.slug,
        inputSchema: JSON.stringify(describeZod(skill.input)),
        outputSchema: JSON.stringify(describeZod(skill.output)),
        permission: skill.permission,
        version: skill.version,
      },
    });
    count += 1;
  }
  return count;
}

/** Execute a skill with input/output contract enforcement. */
export async function executeSkill(slug: string, input: Record<string, unknown>, ctx: SkillContext): Promise<SkillResult> {
  const skill = REGISTRY.get(slug);
  if (!skill) return { ok: false, output: {}, evidence: {}, error: `AWF_SKILL_UNKNOWN: ${slug}`, substantive: false };
  const parsedInput = skill.input.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      output: {},
      evidence: { issues: parsedInput.error.issues.map((issue) => issue.message).slice(0, 5) },
      error: 'AWF_SKILL_INVALID_INPUT',
      substantive: false,
    };
  }
  const result = await skill.execute(parsedInput.data as Record<string, unknown>, ctx);
  if (!result.ok) return result;
  const parsedOutput = skill.output.safeParse(result.output);
  if (!parsedOutput.success) {
    return {
      ok: false,
      output: {},
      evidence: { issues: parsedOutput.error.issues.map((issue) => issue.message).slice(0, 5) },
      error: 'AWF_SKILL_INVALID_OUTPUT',
      substantive: false,
    };
  }
  return { ...result, output: parsedOutput.data as Record<string, unknown> };
}
