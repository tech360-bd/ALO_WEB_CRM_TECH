// @ts-nocheck - Prisma stub requires VPS generation
/**
 * ALO Education AgentOS — Agent Runtime Service
 * Real DB-backed agent registry, execution simulator, and runtime state manager
 */

import { db } from "@/lib/db";
import type {
  AgentDefinition,
  AgentDepartment,
  AgentEngineType,
  AgentTask,
  AgentRuntime,
  AgentMemory,
  AgentApprovalQueue,
  AgentAuditLog,
  AgentSchedule,
} from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AgentWithRelations = AgentDefinition & {
  department: AgentDepartment;
  engineType: AgentEngineType;
  runtimeState: AgentRuntime | null;
  _count?: { tasks: number; memory: number; auditLogs: number };
};

export type AgentListFilters = {
  departmentSlug?: string;
  status?: string;
  engineSlug?: string;
  requiresApproval?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type DashboardStats = {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  pausedAgents: number;
  errorAgents: number;
  totalDepartments: number;
  totalEngineTypes: number;
  pendingApprovals: number;
  tasksToday: number;
  tasksThisWeek: number;
  totalTasksEver: number;
  agentsByDepartment: Array<{ department: string; slug: string; icon: string; color: string; count: number }>;
  agentsByEngine: Array<{ engine: string; slug: string; count: number }>;
  agentsByStatus: Array<{ status: string; count: number }>;
  recentActivity: Array<{ agentCode: string; agentName: string; action: string; ts: Date }>;
};

// ─── Agent Registry ────────────────────────────────────────────────────────────

export async function getAgents(filters: AgentListFilters = {}): Promise<{
  agents: AgentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.requiresApproval !== undefined) {
    where.requiresApproval = filters.requiresApproval;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { agentCode: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.departmentSlug) {
    where.department = { slug: filters.departmentSlug };
  }
  if (filters.engineSlug) {
    where.engineType = { slug: filters.engineSlug };
  }

  const [agents, total] = await Promise.all([
    db.agentDefinition.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        department: true,
        engineType: true,
        runtimeState: true,
        _count: { select: { tasks: true, memory: true, auditLogs: true } },
      },
      orderBy: [{ department: { sortOrder: "asc" } }, { agentCode: "asc" }],
    }),
    db.agentDefinition.count({ where }),
  ]);

  return {
    agents: agents as AgentWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAgentByCode(agentCode: string): Promise<AgentWithRelations | null> {
  return db.agentDefinition.findUnique({
    where: { agentCode },
    include: {
      department: true,
      engineType: true,
      runtimeState: true,
      _count: { select: { tasks: true, memory: true, auditLogs: true } },
    },
  }) as Promise<AgentWithRelations | null>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalAgents,
    activeAgents,
    idleAgents,
    pausedAgents,
    errorAgents,
    totalDepartments,
    totalEngineTypes,
    pendingApprovals,
    tasksToday,
    tasksThisWeek,
    totalTasksEver,
    agentsByDepartment,
    agentsByEngine,
    agentsByStatus,
    recentLogs,
  ] = await Promise.all([
    db.agentDefinition.count(),
    db.agentDefinition.count({ where: { status: "active" } }),
    db.agentDefinition.count({ where: { status: "idle" } }),
    db.agentDefinition.count({ where: { status: "paused" } }),
    db.agentDefinition.count({ where: { status: "error" } }),
    db.agentDepartment.count({ where: { isActive: true } }),
    db.agentEngineType.count({ where: { isActive: true } }),
    db.agentApprovalQueue.count({ where: { status: "pending" } }),
    db.agentTask.count({ where: { createdAt: { gte: todayStart } } }),
    db.agentTask.count({ where: { createdAt: { gte: weekStart } } }),
    db.agentTask.count(),
    db.agentDepartment.findMany({
      where: { isActive: true },
      include: { _count: { select: { agents: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.agentEngineType.findMany({
      where: { isActive: true },
      include: { _count: { select: { agents: true } } },
    }),
    db.agentDefinition.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.agentAuditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { agentCode: true, name: true } } },
    }),
  ]);

  return {
    totalAgents,
    activeAgents,
    idleAgents,
    pausedAgents,
    errorAgents,
    totalDepartments,
    totalEngineTypes,
    pendingApprovals,
    tasksToday,
    tasksThisWeek,
    totalTasksEver,
    agentsByDepartment: agentsByDepartment.map((d) => ({
      department: d.name,
      slug: d.slug,
      icon: d.icon,
      color: d.color,
      count: d._count.agents,
    })),
    agentsByEngine: agentsByEngine.map((e) => ({
      engine: e.name,
      slug: e.slug,
      count: e._count.agents,
    })),
    agentsByStatus: agentsByStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    recentActivity: recentLogs.map((l) => ({
      agentCode: l.agent?.agentCode ?? "UNKNOWN",
      agentName: l.agent?.name ?? "Unknown Agent",
      action: l.action,
      ts: l.createdAt,
    })),
  };
}

// ─── Department Registry ────────────────────────────────────────────────────────

export async function getDepartments(activeOnly = true) {
  return db.agentDepartment.findMany({
    where: activeOnly ? { isActive: true } : {},
    include: {
      _count: { select: { agents: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getDepartmentBySlug(slug: string) {
  return db.agentDepartment.findUnique({
    where: { slug },
    include: {
      agents: {
        include: { engineType: true, runtimeState: true },
        orderBy: { agentCode: "asc" },
      },
      _count: { select: { agents: true } },
    },
  });
}

// ─── Engine Types ────────────────────────────────────────────────────────────────

export async function getEngineTypes(activeOnly = true) {
  return db.agentEngineType.findMany({
    where: activeOnly ? { isActive: true } : {},
    include: { _count: { select: { agents: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Agent Runtime ───────────────────────────────────────────────────────────────

export async function getOrCreateRuntime(agentId: string): Promise<AgentRuntime> {
  const existing = await db.agentRuntime.findUnique({ where: { agentId } });
  if (existing) return existing;

  return db.agentRuntime.create({
    data: {
      agentId,
      status: "idle",
      lastHeartbeatAt: new Date(),
    },
  });
}

export async function updateRuntimeHeartbeat(agentId: string) {
  return db.agentRuntime.upsert({
    where: { agentId },
    update: { lastHeartbeatAt: new Date() },
    create: {
      agentId,
      status: "idle",
      lastHeartbeatAt: new Date(),
    },
  });
}

// ─── Task Management ─────────────────────────────────────────────────────────────

export type CreateTaskPayload = {
  agentId: string;
  triggeredBy: string;
  triggerType: "manual" | "cron" | "webhook" | "agent" | "user";
  input: string;
  metadata?: Record<string, unknown>;
};

export async function createTask(payload: CreateTaskPayload): Promise<AgentTask> {
  const taskNum = await db.agentTask.count();
  const taskCode = `TSK-${String(taskNum + 1).padStart(6, "0")}`;

  return db.agentTask.create({
    data: {
      taskCode,
      agentId: payload.agentId,
      triggeredBy: payload.triggeredBy,
      triggerType: payload.triggerType,
      input: payload.input,
      output: "",
      status: "pending",
      errorMessage: "",
    },
  });
}

export async function getTasks(agentId?: string, limit = 50) {
  return db.agentTask.findMany({
    where: agentId ? { agentId } : {},
    include: { agent: { select: { agentCode: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Approval Queue ───────────────────────────────────────────────────────────────

export async function getPendingApprovals(limit = 50): Promise<AgentApprovalQueue[]> {
  return db.agentApprovalQueue.findMany({
    where: { status: "pending" },
    include: { agent: { select: { agentCode: true, name: true, department: true } } } as never,
    orderBy: { createdAt: "asc" },
    take: limit,
  }) as Promise<AgentApprovalQueue[]>;
}

export async function processApproval(
  approvalId: string,
  decision: "approved" | "rejected",
  reviewerId: string,
  notes?: string
) {
  return db.agentApprovalQueue.update({
    where: { id: approvalId },
    data: {
      status: decision,
      ...(decision === "approved" ? {
        approvedById: reviewerId,
        approvedAt: new Date(),
      } : {
        rejectedById: reviewerId,
        rejectedAt: new Date(),
      })
    },
  });
}

// ─── Memory ────────────────────────────────────────────────────────────────────────

export async function getAgentMemory(agentId: string, memoryType?: string): Promise<AgentMemory[]> {
  return db.agentMemory.findMany({
    where: {
      agentId,
      ...(memoryType ? { memoryType } : {}),
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function writeAgentMemory(
  agentId: string,
  key: string,
  value: string,
  memoryType: "context" | "episodic" | "semantic" | "procedural" | "working",
  ttlHours?: number
) {
  const expiresAt = ttlHours ? new Date(Date.now() + ttlHours * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return db.agentMemory.upsert({
    where: { agentId_key: { agentId, key } },
    update: { value, expiresAt, updatedAt: new Date() },
    create: { agentId, key, value, expiresAt },
  });
}

// ─── Audit Logging ────────────────────────────────────────────────────────────────

export async function logAgentAction(
  agentId: string,
  action: string,
  details: Record<string, unknown>,
  actorId?: string,
  ipAddress?: string
) {
  return db.agentAuditLog.create({
    data: {
      agentId,
      action,
      actorId: actorId ?? "system",
      before: "",
      after: "",
      metadata: JSON.stringify(details),
      ipAddress: ipAddress ?? "::1",
    },
  });
}

// ─── Schedule Management ──────────────────────────────────────────────────────────

export async function getSchedules(agentId?: string): Promise<AgentSchedule[]> {
  return db.agentSchedule.findMany({
    where: {
      ...(agentId ? { agentId } : {}),
      isActive: true,
    },
    include: { agent: { select: { agentCode: true, name: true } } } as never,
    orderBy: { nextRunAt: "asc" },
  }) as Promise<AgentSchedule[]>;
}

export async function createSchedule(
  agentId: string,
  cronExpression: string,
  inputPayload: string,
  name: string,
  timezone = "Asia/Dhaka"
) {
  return db.agentSchedule.create({
    data: {
      agentId,
      cronExpression,
      inputPayload,
      name,
      timezone,
      isActive: true,
    },
  });
}
