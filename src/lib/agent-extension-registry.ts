/**
 * Agent Extension Registry — manages AgentSkillExtension + AgentToolExtension rows.
 *
 * CRITICAL RULES:
 *  - NEVER creates new AiAgent rows. All skills/tools are attached to EXISTING agents.
 *  - assignSkillToAgent() throws if the AiAgent doesn't exist.
 *  - seedDefaultBrainAssignments() is SUPER_ADMIN-only and idempotent.
 */

import { db } from "@/lib/db";

export const BRAINS = [
  "content",
  "university-research",
  "seo",
  "marketing",
  "student-intelligence",
  "automation",
  "safety",
  "whatsapp",
  "facebook",
  "knowledge-base",
] as const;

export type BrainName = (typeof BRAINS)[number];

export interface AssignSkillParams {
  skillCode: string;
  skillName: string;
  brain: string;
  capability: string;
  proficiencyLevel?: string; // NOVICE | PROFICIENT | EXPERT | MASTER
}

export interface AssignToolParams {
  toolId: string;
  toolName: string;
  brain: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  permission?: string; // READ | EXECUTE | WRITE | ADMIN
  riskLevel?: string; // LOW | MEDIUM | HIGH | CRITICAL
  approvalRequired?: boolean;
  rateLimit?: number;
  timeout?: number;
}

/**
 * Assign (or update) a skill to an existing agent. Throws if agent doesn't exist.
 * NEVER creates a new AiAgent.
 */
export async function assignSkillToAgent(agentId: string, params: AssignSkillParams) {
  const agent = await db.aiAgent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}. Skills can only be assigned to existing agents.`);
  }

  return db.agentSkillExtension.upsert({
    where: {
      agentId_skillCode: { agentId, skillCode: params.skillCode },
    },
    update: {
      skillName: params.skillName,
      brain: params.brain,
      capability: params.capability,
      proficiencyLevel: params.proficiencyLevel || "EXPERT",
      status: "ACTIVE",
    },
    create: {
      agentId,
      skillCode: params.skillCode,
      skillName: params.skillName,
      brain: params.brain,
      capability: params.capability,
      proficiencyLevel: params.proficiencyLevel || "EXPERT",
      status: "ACTIVE",
    },
  });
}

/**
 * Assign (or update) a tool to an existing agent. Throws if agent doesn't exist.
 */
export async function assignToolToAgent(agentId: string, params: AssignToolParams) {
  const agent = await db.aiAgent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}. Tools can only be assigned to existing agents.`);
  }

  return db.agentToolExtension.upsert({
    where: {
      agentId_toolId: { agentId, toolId: params.toolId },
    },
    update: {
      toolName: params.toolName,
      brain: params.brain,
      inputSchema: JSON.stringify(params.inputSchema || {}),
      outputSchema: JSON.stringify(params.outputSchema || {}),
      permission: params.permission || "EXECUTE",
      riskLevel: params.riskLevel || "LOW",
      approvalRequired: params.approvalRequired ?? false,
      rateLimit: params.rateLimit ?? 100,
      timeout: params.timeout ?? 30000,
      status: "ACTIVE",
    },
    create: {
      agentId,
      toolId: params.toolId,
      toolName: params.toolName,
      brain: params.brain,
      inputSchema: JSON.stringify(params.inputSchema || {}),
      outputSchema: JSON.stringify(params.outputSchema || {}),
      permission: params.permission || "EXECUTE",
      riskLevel: params.riskLevel || "LOW",
      approvalRequired: params.approvalRequired ?? false,
      rateLimit: params.rateLimit ?? 100,
      timeout: params.timeout ?? 30000,
      status: "ACTIVE",
    },
  });
}

/**
 * Get all skills + tools (capabilities) for an agent, grouped by brain.
 */
export async function getAgentBrainCapabilities(agentId: string) {
  const [skills, tools, agent] = await Promise.all([
    db.agentSkillExtension.findMany({ where: { agentId, status: "ACTIVE" } }),
    db.agentToolExtension.findMany({ where: { agentId, status: "ACTIVE" } }),
    db.aiAgent.findUnique({
      where: { id: agentId },
      select: { id: true, agentName: true, agentCode: true, department: true, status: true },
    }),
  ]);

  if (!agent) {
    return null;
  }

  const byBrain: Record<string, { skills: any[]; tools: any[] }> = {};
  for (const s of skills) {
    if (!byBrain[s.brain]) byBrain[s.brain] = { skills: [], tools: [] };
    byBrain[s.brain].skills.push(s);
  }
  for (const t of tools) {
    if (!byBrain[t.brain]) byBrain[t.brain] = { skills: [], tools: [] };
    byBrain[t.brain].tools.push(t);
  }

  return {
    agent,
    brains: byBrain,
    totals: {
      skills: skills.length,
      tools: tools.length,
      brains: Object.keys(byBrain).length,
    },
  };
}

/**
 * Get all agents (with their skills/tools) for a given brain.
 */
export async function getAgentsByBrain(brain: string) {
  const [skills, tools] = await Promise.all([
    db.agentSkillExtension.findMany({
      where: { brain, status: "ACTIVE" },
    }),
    db.agentToolExtension.findMany({
      where: { brain, status: "ACTIVE" },
    }),
  ]);

  // Collect all unique agentIds and fetch the corresponding AiAgent rows
  const agentIds = Array.from(
    new Set<string>([
      ...skills.map((s) => s.agentId),
      ...tools.map((t) => t.agentId),
    ])
  );
  const agents = await db.aiAgent.findMany({
    where: { id: { in: agentIds } },
    select: {
      id: true,
      agentName: true,
      agentCode: true,
      department: true,
      status: true,
    },
  });
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  // Group by agent
  const byAgent: Record<string, any> = {};
  for (const s of skills) {
    if (!byAgent[s.agentId]) {
      byAgent[s.agentId] = { agent: agentMap.get(s.agentId) || { id: s.agentId }, skills: [], tools: [] };
    }
    byAgent[s.agentId].skills.push(s);
  }
  for (const t of tools) {
    if (!byAgent[t.agentId]) {
      byAgent[t.agentId] = { agent: agentMap.get(t.agentId) || { id: t.agentId }, skills: [], tools: [] };
    }
    byAgent[t.agentId].tools.push(t);
  }

  return Object.values(byAgent);
}

/**
 * Compute REAL stats across all brain extensions. Never fabricated.
 */
export async function getBrainStats() {
  const [totalSkills, totalTools, totalAgents, agentsWithSkills, agentsWithTools] = await Promise.all([
    db.agentSkillExtension.count(),
    db.agentToolExtension.count(),
    db.aiAgent.count(),
    db.agentSkillExtension.findMany({ where: { status: "ACTIVE" }, select: { agentId: true }, distinct: ["agentId"] }),
    db.agentToolExtension.findMany({ where: { status: "ACTIVE" }, select: { agentId: true }, distinct: ["agentId"] }),
  ]);

  const agentIdsWithExtensions = new Set<string>([
    ...agentsWithSkills.map((s) => s.agentId),
    ...agentsWithTools.map((t) => t.agentId),
  ]);
  const agentsWithExtensions = agentIdsWithExtensions.size;

  const [skillsByBrain, toolsByBrain, skillsByProficiency, toolsByRisk, toolsByPermission] = await Promise.all([
    db.agentSkillExtension.groupBy({ by: ["brain"], _count: true, orderBy: { _count: { brain: "desc" } } }),
    db.agentToolExtension.groupBy({ by: ["brain"], _count: true, orderBy: { _count: { brain: "desc" } } }),
    db.agentSkillExtension.groupBy({ by: ["proficiencyLevel"], _count: true }),
    db.agentToolExtension.groupBy({ by: ["riskLevel"], _count: true }),
    db.agentToolExtension.groupBy({ by: ["permission"], _count: true }),
  ]);

  return {
    totalAgents,
    agentsWithExtensions,
    agentsWithoutExtensions: totalAgents - agentsWithExtensions,
    totalSkills,
    totalTools,
    skillsByBrain: skillsByBrain.map((s: any) => ({ brain: s.brain, count: s._count })),
    toolsByBrain: toolsByBrain.map((t: any) => ({ brain: t.brain, count: t._count })),
    skillsByProficiency: skillsByProficiency.map((s: any) => ({
      proficiency: s.proficiencyLevel,
      count: s._count,
    })),
    toolsByRisk: toolsByRisk.map((t: any) => ({ risk: t.riskLevel, count: t._count })),
    toolsByPermission: toolsByPermission.map((t: any) => ({
      permission: t.permission,
      count: t._count,
    })),
    knownBrains: BRAINS,
  };
}

/**
 * Seed default brain→agent assignments. SUPER_ADMIN only.
 * Idempotent: only creates assignments that don't already exist.
 * NEVER creates new agents.
 */
export async function seedDefaultBrainAssignments() {
  const agents = await db.aiAgent.findMany({ select: { id: true, agentCode: true, department: true, agentName: true } });

  if (agents.length === 0) {
    return { seeded: 0, skipped: 0, message: "No agents found. Cannot seed extensions." };
  }

  // Map departments → recommended brains + skills + tools
  const departmentBrainMap: Record<string, Array<{ skillCode: string; skillName: string; brain: string; capability: string }>> = {
    Marketing: [
      { skillCode: "content-strategy", skillName: "Content Strategy", brain: "content", capability: "Plan and prioritize content opportunities" },
      { skillCode: "seo-dna", skillName: "SEO DNA Computation", brain: "seo", capability: "Compute and track content DNA fingerprints" },
      { skillCode: "personalization", skillName: "Personalization", brain: "marketing", capability: "Generate personalized recommendations" },
    ],
    "Lead Management": [
      { skillCode: "lead-scoring", skillName: "Lead Scoring", brain: "student-intelligence", capability: "Score and tier incoming leads" },
      { skillCode: "journey-tracking", skillName: "Journey Tracking", brain: "student-intelligence", capability: "Track 11-stage student journey" },
    ],
    "University Data": [
      { skillCode: "twin-builder", skillName: "Digital Twin Builder", brain: "university-research", capability: "Build/maintain university digital twins" },
      { skillCode: "knowledge-curator", skillName: "Knowledge Curation", brain: "university-research", capability: "Create knowledge objects from sources" },
    ],
    WhatsApp: [
      { skillCode: "wa-routing", skillName: "WhatsApp Routing", brain: "whatsapp", capability: "Route inbound WhatsApp messages" },
      { skillCode: "wa-send", skillName: "WhatsApp Outbound", brain: "whatsapp", capability: "Send templated WhatsApp messages" },
    ],
    "Social Media": [
      { skillCode: "fb-webhook", skillName: "Facebook Webhook", brain: "facebook", capability: "Process Facebook lead webhooks" },
    ],
    "AI Interview": [
      { skillCode: "intelligence-recommend", skillName: "Next-Action Recommendation", brain: "student-intelligence", capability: "Recommend next action for a student" },
    ],
  };

  let seeded = 0;
  let skipped = 0;

  for (const agent of agents) {
    const assignments = departmentBrainMap[agent.department] || [];
    for (const a of assignments) {
      try {
        const existing = await db.agentSkillExtension.findUnique({
          where: { agentId_skillCode: { agentId: agent.id, skillCode: a.skillCode } },
        });
        if (existing) {
          skipped++;
          continue;
        }
        await db.agentSkillExtension.create({
          data: {
            agentId: agent.id,
            skillCode: a.skillCode,
            skillName: a.skillName,
            brain: a.brain,
            capability: a.capability,
            proficiencyLevel: "EXPERT",
            status: "ACTIVE",
          },
        });
        seeded++;
      } catch (err: any) {
        // Race / unique constraint — skip silently
        skipped++;
      }
    }
  }

  return {
    seeded,
    skipped,
    totalAgents: agents.length,
    message: `Seeded ${seeded} new skill assignments; ${skipped} already existed.`,
  };
}
