/**
 * Knowledge Graph Engine — relationship discovery + impact analysis
 * Spec §18. Relationships between students, universities, courses, agents,
 * skills, SOPs, rules, prompts, departments, workflows, events.
 */
import { db } from "@/lib/db";

export interface GraphNode {
  id: string;
  type: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  weight?: number;
}

export class KnowledgeGraphEngine {
  /** Get the full enterprise knowledge graph */
  static async getGraph(limit = 500): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add departments as nodes
    const departments = await db.department.findMany({ take: 100 }).catch(() => []);
    for (const dept of departments) {
      nodes.push({ id: dept.id, type: "DEPARTMENT", label: dept.name });
    }

    // Add AI agents as nodes + edges to departments
    const agents = await db.aiAgent.findMany({ take: 200, select: { agentId: true, name: true, departmentId: true } }).catch(() => []);
    for (const agent of agents) {
      nodes.push({ id: agent.agentId, type: "AGENT", label: agent.name });
      if (agent.departmentId) {
        edges.push({ source: agent.agentId, target: agent.departmentId, relationship: "belongs_to" });
      }
    }

    // Add AI models as nodes
    const models = await db.aiModel.findMany({ take: 50, select: { id: true, name: true } }).catch(() => []);
    for (const model of models) {
      nodes.push({ id: model.id, type: "MODEL", label: model.name });
    }

    // Add skills as nodes
    const skills = await db.aiSkill.findMany({ take: 100, select: { id: true, name: true } }).catch(() => []);
    for (const skill of skills) {
      nodes.push({ id: skill.id, type: "SKILL", label: skill.name });
    }

    // Add SOPs as nodes
    const sops = await db.aiSop.findMany({ take: 100, select: { id: true, name: true } }).catch(() => []);
    for (const sop of sops) {
      nodes.push({ id: sop.id, type: "SOP", label: sop.name });
    }

    // Add agent relationships from AgentRelationship table
    const relationships = await db.agentRelationship.findMany({ take: 200 }).catch(() => []);
    for (const rel of relationships) {
      edges.push({
        source: rel.parentAgentId,
        target: rel.childAgentId,
        relationship: rel.relationshipType,
      });
    }

    // Add loop agents as nodes + edges to parents
    const loopAgents = await db.loopAgent.findMany({ take: 100, select: { id: true, name: true, parentAgentId: true } }).catch(() => []);
    for (const loop of loopAgents) {
      nodes.push({ id: loop.id, type: "LOOP_AGENT", label: loop.name });
      edges.push({ source: loop.parentAgentId, target: loop.id, relationship: "created_loop_agent" });
    }

    // Truncate to limit
    return {
      nodes: nodes.slice(0, limit),
      edges: edges.slice(0, limit),
    };
  }

  /** Impact analysis — what is affected if a node changes */
  static async impactAnalysis(nodeId: string, nodeType: string): Promise<string[]> {
    const impacted: string[] = [];

    // Find all edges where this node is the source or target
    const asSource = await db.agentRelationship.findMany({
      where: { parentAgentId: nodeId },
      select: { childAgentId: true },
    }).catch(() => []);
    impacted.push(...asSource.map((r: any) => r.childAgentId));

    const asTarget = await db.agentRelationship.findMany({
      where: { childAgentId: nodeId },
      select: { parentAgentId: true },
    }).catch(() => []);
    impacted.push(...asTarget.map((r: any) => r.parentAgentId));

    // Check loop agents
    const loopAgents = await db.loopAgent.findMany({
      where: { parentAgentId: nodeId },
      select: { id: true },
    }).catch(() => []);
    impacted.push(...loopAgents.map((l: any) => l.id));

    return [...new Set(impacted)];
  }

  /** Get graph statistics */
  static async getStats(): Promise<{ nodes: number; edges: number; byType: Record<string, number> }> {
    const [depts, agents, models, skills, sops, loopAgents, relationships] = await Promise.all([
      db.department.count().catch(() => 0),
      db.aiAgent.count().catch(() => 0),
      db.aiModel.count().catch(() => 0),
      db.aiSkill.count().catch(() => 0),
      db.aiSop.count().catch(() => 0),
      db.loopAgent.count().catch(() => 0),
      db.agentRelationship.count().catch(() => 0),
    ]);
    return {
      nodes: depts + agents + models + skills + sops + loopAgents,
      edges: relationships,
      byType: { DEPARTMENT: depts, AGENT: agents, MODEL: models, SKILL: skills, SOP: sops, LOOP_AGENT: loopAgents },
    };
  }
}
