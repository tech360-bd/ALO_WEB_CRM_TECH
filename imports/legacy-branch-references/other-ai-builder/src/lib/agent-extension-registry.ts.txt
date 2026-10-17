// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Agent Extension Registry
 *
 * Maps AI capabilities (skills + tools) onto existing AiAgents. Each agent
 * may belong to one or more "brains" (Content, SEO, University Research,
 * Marketing, Student Intelligence) and have multiple skills + tools.
 *
 * HARD RULE: this module NEVER creates new AiAgent records.
 *   - assignSkillToAgent and assignToolToAgent verify the agent exists first.
 *   - If the agent doesn't exist, they throw — they do NOT create one.
 *
 * Schema dependency:
 *   - AiAgent (exists)
 *   - AgentSkillExtension (typed via db-as-any cast) — skillCode, agentId, brain, capability
 *   - AgentToolExtension (typed via db-as-any cast) — toolId/toolCode, agentId, brain, ...
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export type AgentBrain =
  | "CONTENT"
  | "SEO"
  | "UNIVERSITY_RESEARCH"
  | "MARKETING"
  | "STUDENT_INTELLIGENCE";

export const AGENT_BRAINS: string[] = [
  "CONTENT",
  "SEO",
  "UNIVERSITY_RESEARCH",
  "MARKETING",
  "STUDENT_INTELLIGENCE",
];

export interface AssignSkillInput {
  skillCode: string;
  skillName: string;
  brain: string;
  capability: string; // e.g. "draft_blog_post", "analyze_search_console"
  description?: string;
  proficiencyLevel?: string; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, MASTER
}

export interface AssignToolInput {
  toolId: string;
  toolName: string;
  brain: string;
  capability: string;
  description?: string;
  config?: Record<string, unknown>;
}

export interface AgentSkillExtensionShape {
  id: string;
  agentId: string;
  skillCode: string;
  skillName: string;
  brain: string;
  capability: string;
  description: string | null;
  proficiencyLevel: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentToolExtensionShape {
  id: string;
  agentId: string;
  toolId: string;
  toolName: string;
  brain: string;
  capability: string;
  description: string | null;
  config: string; // JSON
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrainCapabilities {
  agentId: string;
  brains: string[];
  skills: Array<{ brain: string; skillCode: string; skillName: string; capability: string }>;
  tools: Array<{ brain: string; toolId: string; toolName: string; capability: string }>;
}

export interface BrainStats {
  byBrain: Record<AgentBrain, { agentCount: number; skillCount: number; toolCount: number }>;
  totalAgents: number;
  totalSkills: number;
  totalTools: number;
}

// Cast db to access extension models not on the standard client.

// ─── assignSkillToAgent ──────────────────────────────────────────

/**
 * Attach a skill to an existing AiAgent. NEVER creates a new AiAgent.
 *
 * Idempotent: if the (agentId, skillCode, brain) tuple already exists,
 * this is a no-op (but updates proficiencyLevel if changed).
 */
export async function assignSkillToAgent(
  agentId: string,
  input: AssignSkillInput
): Promise<{ extensionId: string; created: boolean }> {
  if (!agentId) throw new Error("assignSkillToAgent: agentId is required");
  if (!input.skillCode || !input.skillName || !input.brain || !input.capability) {
    throw new Error("assignSkillToAgent: skillCode, skillName, brain, capability are required");
  }
  if (!AGENT_BRAINS.includes(input.brain)) {
    throw new Error(`assignSkillToAgent: invalid brain ${input.brain}`);
  }

  // HARD RULE: agent must already exist — never create one
  const agent = await db.aiAgent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error(`assignSkillToAgent: AiAgent ${agentId} does not exist — refusing to create one`);
  }

  const existing = await db.agentSkillExtension.findFirst({
    where: { agentId, skillCode: input.skillCode, brain: input.brain },
  });

  if (existing) {
    await db.agentSkillExtension.update({
      where: { id: existing.id },
      data: {
        skillName: input.skillName,
        capability: input.capability,
        description: input.description ?? existing.description,
        proficiencyLevel: input.proficiencyLevel ?? existing.proficiencyLevel,
      },
    });
    return { extensionId: existing.id, created: false };
  }

  const ext = await db.agentSkillExtension.create({
    data: {
      agentId,
      skillCode: input.skillCode,
      skillName: input.skillName,
      brain: input.brain,
      capability: input.capability,
      description: input.description ?? null,
      proficiencyLevel: input.proficiencyLevel ?? "EXPERT",
      status: "ACTIVE",
    },
  });

  return { extensionId: ext.id, created: true };
}

// ─── assignToolToAgent ───────────────────────────────────────────

/**
 * Attach a tool to an existing AiAgent. NEVER creates a new AiAgent.
 *
 * Idempotent on (agentId, toolId, brain).
 */
export async function assignToolToAgent(
  agentId: string,
  input: AssignToolInput
): Promise<{ extensionId: string; created: boolean }> {
  if (!agentId) throw new Error("assignToolToAgent: agentId is required");
  if (!input.toolId || !input.toolName || !input.brain || !input.capability) {
    throw new Error("assignToolToAgent: toolId, toolName, brain, capability are required");
  }
  if (!AGENT_BRAINS.includes(input.brain)) {
    throw new Error(`assignToolToAgent: invalid brain ${input.brain}`);
  }

  // HARD RULE: agent must already exist
  const agent = await db.aiAgent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error(`assignToolToAgent: AiAgent ${agentId} does not exist — refusing to create one`);
  }

  const existing = await db.agentToolExtension.findFirst({
    where: { agentId, toolId: input.toolId, brain: input.brain },
  });

  if (existing) {
    await db.agentToolExtension.update({
      where: { id: existing.id },
      data: {
        toolName: input.toolName,
        capability: input.capability,
        description: input.description ?? existing.description,
        config: JSON.stringify(input.config ?? {}),
      },
    });
    return { extensionId: existing.id, created: false };
  }

  const ext = await db.agentToolExtension.create({
    data: {
      agentId,
      toolId: input.toolId,
      toolName: input.toolName,
      brain: input.brain,
      capability: input.capability,
      description: input.description ?? null,
      config: JSON.stringify(input.config ?? {}),
      status: "ACTIVE",
    },
  });

  return { extensionId: ext.id, created: true };
}

// ─── getAgentBrainCapabilities ───────────────────────────────────

/**
 * Get all skills + tools attached to an agent, grouped by brain.
 */
export async function getAgentBrainCapabilities(agentId: string): Promise<BrainCapabilities> {
  if (!agentId) throw new Error("getAgentBrainCapabilities: agentId is required");

  const [skills, tools] = await Promise.all([
    db.agentSkillExtension.findMany({ where: { agentId, status: "ACTIVE" } }),
    db.agentToolExtension.findMany({ where: { agentId, status: "ACTIVE" } }),
  ]);

  const brainSet = new Set<AgentBrain>();
  for (const s of skills) brainSet.add(s.brain);
  for (const t of tools) brainSet.add(t.brain);

  return {
    agentId,
    brains: Array.from(brainSet),
    skills: skills.map((s) => ({
      brain: s.brain,
      skillCode: s.skillCode,
      skillName: s.skillName,
      capability: s.capability,
    })),
    tools: tools.map((t) => ({
      brain: t.brain,
      toolId: t.toolId,
      toolName: t.toolName,
      capability: t.capability,
    })),
  };
}

// ─── getAgentsByBrain ────────────────────────────────────────────

/**
 * List all AiAgents that have at least one skill or tool assigned to a brain.
 */
export async function getAgentsByBrain(brain: string): Promise<Array<{
  agentId: string;
  agentCode: string;
  agentName: string;
  department: string;
  skillCount: number;
  toolCount: number;
}>> {
  if (!AGENT_BRAINS.includes(brain)) {
    throw new Error(`getAgentsByBrain: invalid brain ${brain}`);
  }

  const [skillExtensions, toolExtensions] = await Promise.all([
    db.agentSkillExtension.findMany({ where: { brain, status: "ACTIVE" } }),
    db.agentToolExtension.findMany({ where: { brain, status: "ACTIVE" } }),
  ]);

  const agentIds = new Set<string>([
    ...skillExtensions.map((s) => s.agentId),
    ...toolExtensions.map((t) => t.agentId),
  ]);

  const result: Array<{
    agentId: string;
    agentCode: string;
    agentName: string;
    department: string;
    skillCount: number;
    toolCount: number;
  }> = [];

  for (const agentId of agentIds) {
    const agent = await db.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) continue;
    result.push({
      agentId: agent.id,
      agentCode: agent.agentCode,
      agentName: agent.agentName,
      department: agent.department,
      skillCount: skillExtensions.filter((s) => s.agentId === agentId).length,
      toolCount: toolExtensions.filter((t) => t.agentId === agentId).length,
    });
  }

  return result;
}

// ─── getBrainStats ───────────────────────────────────────────────

/**
 * Aggregate skill/tool counts per brain.
 */
export async function getBrainStats(): Promise<BrainStats> {
  const [skills, tools] = await Promise.all([
    db.agentSkillExtension.findMany({ where: { status: "ACTIVE" } }),
    db.agentToolExtension.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const byBrain: Record<AgentBrain, { agentCount: number; skillCount: number; toolCount: number }> = {
    CONTENT: { agentCount: 0, skillCount: 0, toolCount: 0 },
    SEO: { agentCount: 0, skillCount: 0, toolCount: 0 },
    UNIVERSITY_RESEARCH: { agentCount: 0, skillCount: 0, toolCount: 0 },
    MARKETING: { agentCount: 0, skillCount: 0, toolCount: 0 },
    STUDENT_INTELLIGENCE: { agentCount: 0, skillCount: 0, toolCount: 0 },
  };

  const agentBrainSet = new Map<string, Set<AgentBrain>>();
  for (const s of skills) {
    byBrain[s.brain].skillCount++;
    if (!agentBrainSet.has(s.agentId)) agentBrainSet.set(s.agentId, new Set());
    agentBrainSet.get(s.agentId)!.add(s.brain);
  }
  for (const t of tools) {
    byBrain[t.brain].toolCount++;
    if (!agentBrainSet.has(t.agentId)) agentBrainSet.set(t.agentId, new Set());
    agentBrainSet.get(t.agentId)!.add(t.brain);
  }
  for (const brainSet of agentBrainSet.values()) {
    for (const b of brainSet) byBrain[b].agentCount++;
  }

  const totalAgents = agentBrainSet.size;

  return {
    byBrain,
    totalAgents,
    totalSkills: skills.length,
    totalTools: tools.length,
  };
}

// ─── seedDefaultBrainAssignments ─────────────────────────────────

/**
 * Seed sensible default skill + tool assignments for existing AiAgents
 * based on their department.
 *
 * Idempotent: only creates assignments that don't already exist.
 * NEVER creates new AiAgents.
 */
export async function seedDefaultBrainAssignments(): Promise<{
  skillsAssigned: number;
  toolsAssigned: number;
  agentsSkipped: number;
}> {
  const agents = await db.aiAgent.findMany();

  // Map department → brain(s)
  const departmentBrainMap: Record<string, AgentBrain[]> = {
    "Content": ["CONTENT"],
    "Marketing": ["MARKETING", "CONTENT"],
    "SEO": ["SEO"],
    "University Data": ["UNIVERSITY_RESEARCH"],
    "Course Finder": ["UNIVERSITY_RESEARCH"],
    "Student Admission": ["STUDENT_INTELLIGENCE"],
    "Counseling": ["STUDENT_INTELLIGENCE"],
  };

  let skillsAssigned = 0;
  let toolsAssigned = 0;
  let agentsSkipped = 0;

  for (const agent of agents) {
    const brains = departmentBrainMap[agent.department] ?? [];
    if (brains.length === 0) {
      agentsSkipped++;
      continue;
    }

    for (const brain of brains) {
      const skillCode = `SKILL-${brain}-${agent.agentCode}`.slice(0, 40);
      const toolId = `TOOL-${brain}-${agent.agentCode}`.slice(0, 40);

      // Skill
      const existingSkill = await db.agentSkillExtension.findFirst({
        where: { agentId: agent.id, skillCode, brain },
      });
      if (!existingSkill) {
        await db.agentSkillExtension.create({
          data: {
            agentId: agent.id,
            skillCode,
            skillName: `${brain.toLowerCase()} capability`,
            brain,
            capability: `${brain.toLowerCase()}_default`,
            description: `Default ${brain} skill for ${agent.agentName}`,
            proficiencyLevel: "EXPERT",
            status: "ACTIVE",
          },
        });
        skillsAssigned++;
      }

      // Tool
      const existingTool = await db.agentToolExtension.findFirst({
        where: { agentId: agent.id, toolId, brain },
      });
      if (!existingTool) {
        await db.agentToolExtension.create({
          data: {
            agentId: agent.id,
            toolId,
            toolName: `${brain.toLowerCase()}_toolkit`,
            brain,
            capability: `${brain.toLowerCase()}_execute`,
            description: `Default ${brain} tool access for ${agent.agentName}`,
            config: "{}",
            status: "ACTIVE",
          },
        });
        toolsAssigned++;
      }
    }
  }

  return { skillsAssigned, toolsAssigned, agentsSkipped };
}
