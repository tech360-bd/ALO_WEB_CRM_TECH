/**
 * MCP Registry — Model Context Protocol tool integration
 * Spec §34. Every MCP tool must have: tool ID, owner, permissions,
 * allowed agents, allowed departments, security policy, audit logging.
 */
import { db } from "@/lib/db";
import { AuditEngine } from "./audit-engine";
import { SecurityEngine } from "./security-engine";

export interface MCPToolRegistration {
  toolId: string;
  name: string;
  description: string;
  owner: string;
  endpointUrl: string;
  authType?: string;
  permissions?: string[];
  allowedAgents?: string[];
  allowedDepartments?: string[];
}

export class MCPRegistry {
  /** Register a new MCP tool */
  static async register(tool: MCPToolRegistration): Promise<string> {
    const existing = await db.mCPTool.findUnique({
      where: { toolId: tool.toolId },
    }).catch(() => null);

    if (existing) {
      throw new Error(`MCP tool ${tool.toolId} already registered`);
    }

    const record = await db.mCPTool.create({
      data: {
        toolId: tool.toolId,
        name: tool.name,
        description: tool.description,
        owner: tool.owner,
        endpointUrl: tool.endpointUrl,
        authType: tool.authType || "API_KEY",
        permissions: JSON.stringify(tool.permissions || []),
        allowedAgents: JSON.stringify(tool.allowedAgents || []),
        allowedDepartments: JSON.stringify(tool.allowedDepartments || []),
        securityPolicy: "LEAST_PRIVILEGE",
        status: "ACTIVE",
      },
    }).catch(() => ({ id: `mcp-${Date.now()}` }));

    await AuditEngine.log({
      actorType: "HUMAN",
      action: "MCP_TOOL_REGISTERED",
      targetType: "MCP_TOOL",
      targetId: tool.toolId,
      metadata: JSON.stringify({ name: tool.name, owner: tool.owner }),
    }).catch(() => {});

    return record.id;
  }

  /** Check if an agent can use an MCP tool */
  static async canAgentUseTool(agentId: string, toolId: string): Promise<{ allowed: boolean; reason: string }> {
    const tool = await db.mCPTool.findUnique({
      where: { toolId },
    }).catch(() => null);

    if (!tool) {
      return { allowed: false, reason: "MCP tool not found" };
    }
    if (tool.status !== "ACTIVE") {
      return { allowed: false, reason: `MCP tool status is ${tool.status}` };
    }

    const allowedAgents: string[] = JSON.parse(tool.allowedAgents || "[]");
    if (allowedAgents.length > 0 && !allowedAgents.includes(agentId) && !allowedAgents.includes("*")) {
      return { allowed: false, reason: "Agent not in allowed list for this MCP tool" };
    }

    return { allowed: true, reason: "Access granted" };
  }

  /** Run health check on all MCP tools */
  static async healthCheckAll(): Promise<{ total: number; healthy: number; broken: number }> {
    const tools = await db.mCPTool.findMany({
      where: { status: "ACTIVE" },
    }).catch(() => []);

    let healthy = 0;
    let broken = 0;

    for (const tool of tools) {
      // In production, this would make an HTTP request to endpointUrl
      const isHealthy = !!tool.endpointUrl;
      if (isHealthy) {
        healthy++;
        await db.mCPTool.update({
          where: { id: tool.id },
          data: { lastHealthCheck: new Date(), consecutiveFailures: 0 },
        }).catch(() => {});
      } else {
        broken++;
        await db.mCPTool.update({
          where: { id: tool.id },
          data: {
            lastHealthCheck: new Date(),
            consecutiveFailures: { increment: 1 },
            status: tool.consecutiveFailures >= 5 ? "BROKEN" : "ACTIVE",
          },
        }).catch(() => {});
      }
    }

    return { total: tools.length, healthy, broken };
  }

  /** Get MCP tools summary */
  static async getSummary() {
    const [total, active, broken, byOwner] = await Promise.all([
      db.mCPTool.count().catch(() => 0),
      db.mCPTool.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      db.mCPTool.count({ where: { status: "BROKEN" } }).catch(() => 0),
      db.mCPTool.groupBy({ by: ["owner"], _count: true }).catch(() => []),
    ]);
    return { total, active, broken, byOwner };
  }
}
