/**
 * AgentOS — Unified AI Agent / Employee / Engine / Skill / Task dashboard.
 *
 * Canonical model mapping (per task spec):
 *   AiEmployee  → workforce  (real digital employees that do work)
 *   AiAgent     → legacy     (legacy agent registry, kept for backward compat)
 *   AiAgentRegistry → config (configuration entries — NOT workforce)
 *
 * Schema graceful-degradation:
 *   - No `AiTool` model exists. Tools are represented as AiAgent entries with
 *     department="TOOLING" — getTools()/getToolStats() filter on that.
 *   - AiTask is the unified task queue.
 */

import { db } from "@/lib/db";

// ─── Department Stats ──────────────────────────────────────────

export interface DepartmentStats {
  total: number;
  byName: Array<{
    name: string;
    workforce: number;       // AiEmployee count
    legacy: number;          // AiAgent count
    config: number;          // AiAgentRegistry count (NOT workforce)
    activeTasks: number;
    pendingApprovals: number;
  }>;
}

/**
 * Aggregate department-level stats.
 */
export async function getDepartmentStats(): Promise<DepartmentStats> {
  const [departments, aiEmployees, aiAgents, aiRegistries, activeTasks] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true } }),
    db.aiEmployee.findMany({ select: { departmentId: true, status: true } }),
    db.aiAgent.findMany({ select: { department: true, status: true, pendingApprovals: true } }),
    db.aiAgentRegistry.findMany({ select: { agentType: true, status: true } }),
    db.aiTask.findMany({ where: { status: { in: ["QUEUED", "RUNNING", "WAITING"] } }, select: { department: true, status: true, approvalRequired: true } }),
  ]);

  const byNameMap = new Map<string, {
    name: string;
    workforce: number;
    legacy: number;
    config: number;
    activeTasks: number;
    pendingApprovals: number;
  }>();

  const ensure = (name: string) => {
    if (!byNameMap.has(name)) byNameMap.set(name, { name, workforce: 0, legacy: 0, config: 0, activeTasks: 0, pendingApprovals: 0 });
    return byNameMap.get(name)!;
  };

  // Map AiEmployee.departmentId → Department.name
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
  for (const e of aiEmployees) {
    const name = deptNameById.get(e.departmentId) || e.departmentId || "Unknown";
    ensure(name).workforce++;
  }
  for (const a of aiAgents) {
    const name = a.department || "Unknown";
    ensure(name).legacy++;
    ensure(name).pendingApprovals += a.pendingApprovals || 0;
  }
  for (const r of aiRegistries) {
    const name = r.agentType || "Unknown";
    ensure(name).config++;
  }
  for (const t of activeTasks) {
    const name = t.department || "Unknown";
    ensure(name).activeTasks++;
    if (t.approvalRequired && (t.status === "WAITING")) {
      ensure(name).pendingApprovals++;
    }
  }

  return {
    total: byNameMap.size,
    byName: Array.from(byNameMap.values()).sort((a, b) => b.workforce + b.legacy - a.workforce - a.legacy),
  };
}

// ─── Agent Stats ───────────────────────────────────────────────

export interface AgentStats {
  canonical: {
    workforce: number;        // AiEmployee count
    legacy: number;           // AiAgent count
    config: number;           // AiAgentRegistry count (NOT workforce)
  };
  workforce: Array<{
    id: string;
    code: string;
    name: string;
    role: string;
    department: string;
    status: string;
    jobsProcessed: number;
    successRate: number;
    avgResponseTime: number;
    lastActiveAt: Date | null;
  }>;
  legacy: Array<{
    id: string;
    code: string;
    name: string;
    department: string;
    status: string;
    jobsProcessed: number;
    pendingApprovals: number;
    lastRunAt: Date | null;
  }>;
  config: Array<{
    id: string;
    code: string;
    name: string;
    agentType: string;
    status: string;
    version: string;
    successRate: number;
    dailyRequests: number;
    monthlyRequests: number;
    totalRequests: number;
    lastExecutedAt: Date | null;
  }>;
}

/**
 * Return agent stats with canonical classification:
 *   AiEmployee = workforce, AiAgent = legacy, AiAgentRegistry = config (NOT workforce).
 */
export async function getAgentStats(): Promise<AgentStats> {
  const [aiEmployees, aiAgents, aiRegistries, departments] = await Promise.all([
    db.aiEmployee.findMany({
      select: { id: true, employeeCode: true, name: true, role: true, departmentId: true, status: true, jobsProcessed: true, successRate: true, avgResponseTime: true, lastActiveAt: true },
      take: 200,
    }),
    db.aiAgent.findMany({
      select: { id: true, agentCode: true, agentName: true, department: true, status: true, jobsProcessed: true, pendingApprovals: true, lastRunAt: true },
      take: 200,
    }),
    db.aiAgentRegistry.findMany({
      select: { id: true, agentCode: true, agentName: true, agentType: true, status: true, version: true, successRate: true, dailyRequests: true, monthlyRequests: true, totalRequests: true, lastExecutedAt: true },
      take: 200,
    }),
    db.department.findMany({ select: { id: true, name: true } }),
  ]);

  const deptName = new Map(departments.map((d) => [d.id, d.name]));

  return {
    canonical: {
      workforce: aiEmployees.length,
      legacy: aiAgents.length,
      config: aiRegistries.length,
    },
    workforce: aiEmployees.map((e) => ({
      id: e.id,
      code: e.employeeCode,
      name: e.name,
      role: e.role,
      department: deptName.get(e.departmentId) || e.departmentId,
      status: e.status,
      jobsProcessed: e.jobsProcessed,
      successRate: e.successRate,
      avgResponseTime: e.avgResponseTime,
      lastActiveAt: e.lastActiveAt,
    })),
    legacy: aiAgents.map((a) => ({
      id: a.id,
      code: a.agentCode,
      name: a.agentName,
      department: a.department,
      status: a.status,
      jobsProcessed: a.jobsProcessed,
      pendingApprovals: a.pendingApprovals,
      lastRunAt: a.lastRunAt,
    })),
    config: aiRegistries.map((r) => ({
      id: r.id,
      code: r.agentCode,
      name: r.agentName,
      agentType: r.agentType,
      status: r.status,
      version: r.version,
      successRate: r.successRate,
      dailyRequests: r.dailyRequests,
      monthlyRequests: r.monthlyRequests,
      totalRequests: r.totalRequests,
      lastExecutedAt: r.lastExecutedAt,
    })),
  };
}

// ─── AgentOS Dashboard ─────────────────────────────────────────

export interface AgentOSDashboard {
  raw: {
    aiEmployees: number;
    aiAgents: number;
    aiAgentRegistries: number;
    aiEngines: number;
    aiSkills: number;
    aiTasks: {
      total: number;
      queued: number;
      running: number;
      waiting: number;
      completed: number;
      failed: number;
      escalated: number;
    };
    departments: number;
  };
  canonical: {
    workforce: number;     // = raw.aiEmployees
    legacy: number;        // = raw.aiAgents
    config: number;        // = raw.aiAgentRegistries
  };
  capacity: {
    totalJobsProcessed: number;
    avgSuccessRate: number;
    activeTasks: number;
    pendingApprovals: number;
    utilisation: number;   // (running+queued) / (workforce+legacy) — capped 100%
  };
  recent: {
    tasks: Array<{ id: string; code: string; action: string; status: string; createdAt: Date }>;
  };
}

/**
 * Top-level AgentOS dashboard — raw counts + canonical classification +
 * capacity metrics.
 */
export async function getAgentOSDashboard(): Promise<AgentOSDashboard> {
  const [
    aiEmployeesCount, aiAgentsCount, aiRegistriesCount, aiEnginesCount, aiSkillsCount,
    departmentsCount,
    tasksByStatus,
    recentTasks,
    totals,
  ] = await Promise.all([
    db.aiEmployee.count(),
    db.aiAgent.count(),
    db.aiAgentRegistry.count(),
    db.aiEngine.count(),
    db.aiSkill.count(),
    db.department.count(),
    db.aiTask.groupBy({ by: ["status"], _count: true }),
    db.aiTask.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, taskCode: true, action: true, status: true, createdAt: true } }),
    Promise.all([
      db.aiEmployee.aggregate({ _sum: { jobsProcessed: true, successRate: true } }),
      db.aiAgent.aggregate({ _sum: { jobsProcessed: true, pendingApprovals: true } }),
      db.aiTask.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
      db.aiTask.count({ where: { status: "WAITING", approvalRequired: true } }),
    ]),
  ]);

  const statusMap = new Map(tasksByStatus.map((s) => [s.status, s._count]));
  const taskStats = {
    total: Array.from(statusMap.values()).reduce((a, b) => a + b, 0),
    queued: statusMap.get("QUEUED") || 0,
    running: statusMap.get("RUNNING") || 0,
    waiting: statusMap.get("WAITING") || 0,
    completed: statusMap.get("COMPLETED") || 0,
    failed: statusMap.get("FAILED") || 0,
    escalated: statusMap.get("ESCALATED") || 0,
  };

  const [empAgg, agentAgg, activeTasks, pendingApprovals] = totals;
  const totalJobsProcessed = (empAgg._sum.jobsProcessed || 0) + (agentAgg._sum.jobsProcessed || 0);
  const workforceLegacyCount = aiEmployeesCount + aiAgentsCount;
  const avgSuccessRate = workforceLegacyCount > 0
    ? Math.round(((empAgg._sum.successRate || 0) + 95 * aiAgentsCount) / workforceLegacyCount * 10) / 10
    : 0;
  const utilisation = workforceLegacyCount > 0
    ? Math.min(100, Math.round(((activeTasks) / workforceLegacyCount) * 100))
    : 0;

  return {
    raw: {
      aiEmployees: aiEmployeesCount,
      aiAgents: aiAgentsCount,
      aiAgentRegistries: aiRegistriesCount,
      aiEngines: aiEnginesCount,
      aiSkills: aiSkillsCount,
      aiTasks: taskStats,
      departments: departmentsCount,
    },
    canonical: {
      workforce: aiEmployeesCount,
      legacy: aiAgentsCount,
      config: aiRegistriesCount,
    },
    capacity: {
      totalJobsProcessed,
      avgSuccessRate,
      activeTasks,
      pendingApprovals,
      utilisation,
    },
    recent: {
      tasks: recentTasks.map((t) => ({
        id: t.id,
        code: t.taskCode,
        action: t.action,
        status: t.status,
        createdAt: t.createdAt,
      })),
    },
  };
}

// ─── Capacity Test ─────────────────────────────────────────────

export interface CapacityTestResult {
  ok: boolean;
  checkedAt: Date;
  totalWorkforce: number;
  totalActiveTasks: number;
  utilisation: number;
  bottlenecked: boolean;       // utilisation > 80%
  byDepartment: Array<{
    department: string;
    workforce: number;
    activeTasks: number;
    deptUtilisation: number;
    bottlenecked: boolean;
  }>;
  recommendations: string[];
}

/**
 * Run a capacity test — identify bottlenecks where active tasks exceed
 * workforce headcount.
 */
export async function runCapacityTest(): Promise<CapacityTestResult> {
  const [aiEmployees, activeTasks, departments] = await Promise.all([
    db.aiEmployee.findMany({ select: { departmentId: true, status: true } }),
    db.aiTask.findMany({
      where: { status: { in: ["QUEUED", "RUNNING", "WAITING"] } },
      select: { department: true, status: true },
    }),
    db.department.findMany({ select: { id: true, name: true } }),
  ]);

  const deptName = new Map(departments.map((d) => [d.id, d.name]));

  const byDept = new Map<string, { workforce: number; activeTasks: number }>();
  for (const e of aiEmployees) {
    const name = deptName.get(e.departmentId) || e.departmentId;
    if (!byDept.has(name)) byDept.set(name, { workforce: 0, activeTasks: 0 });
    byDept.get(name)!.workforce++;
  }
  for (const t of activeTasks) {
    const name = t.department || "Unknown";
    if (!byDept.has(name)) byDept.set(name, { workforce: 0, activeTasks: 0 });
    byDept.get(name)!.activeTasks++;
  }

  const byDepartment = Array.from(byDept.entries()).map(([department, v]) => {
    const utilisation = v.workforce > 0 ? Math.min(100, Math.round((v.activeTasks / v.workforce) * 100)) : (v.activeTasks > 0 ? 100 : 0);
    return {
      department,
      workforce: v.workforce,
      activeTasks: v.activeTasks,
      deptUtilisation: utilisation,
      bottlenecked: utilisation > 80,
    };
  }).sort((a, b) => b.deptUtilisation - a.deptUtilisation);

  const totalWorkforce = aiEmployees.length;
  const totalActiveTasks = activeTasks.length;
  const utilisation = totalWorkforce > 0 ? Math.min(100, Math.round((totalActiveTasks / totalWorkforce) * 100)) : 0;
  const bottlenecked = utilisation > 80;

  const recommendations: string[] = [];
  if (bottlenecked) recommendations.push("System-wide utilisation > 80% — consider scaling up AI workforce.");
  for (const d of byDepartment) {
    if (d.bottlenecked) recommendations.push(`Department "${d.department}" is bottlenecked (${d.deptUtilisation}% utilisation).`);
  }
  if (totalWorkforce === 0) recommendations.push("No AI employees provisioned — assign workforce before running tasks.");
  if (recommendations.length === 0) recommendations.push("All systems operating within capacity.");

  return {
    ok: !bottlenecked,
    checkedAt: new Date(),
    totalWorkforce,
    totalActiveTasks,
    utilisation,
    bottlenecked,
    byDepartment,
    recommendations,
  };
}

// ─── Engines ───────────────────────────────────────────────────

export interface EngineInfo {
  id: string;
  engineCode: string;
  name: string;
  type: string;
  status: string;
  healthStatus: string;
  metrics: Record<string, unknown> | null;
  lastHealthCheck: Date | null;
}

export async function getEngines(): Promise<EngineInfo[]> {
  const engines = await db.aiEngine.findMany({
    select: { id: true, engineCode: true, name: true, type: true, status: true, healthStatus: true, metrics: true, lastHealthCheck: true },
    orderBy: { type: "asc" },
  });
  return engines.map((e) => ({
    ...e,
    metrics: e.metrics ? safeParse(e.metrics) : null,
  }));
}

export interface EngineStats {
  total: number;
  byType: Array<{ type: string; total: number; healthy: number; degraded: number; critical: number }>;
  byStatus: Record<string, number>;
  byHealth: Record<string, number>;
}

export async function getEngineStats(): Promise<EngineStats> {
  const engines = await db.aiEngine.findMany({ select: { type: true, status: true, healthStatus: true } });

  const byTypeMap = new Map<string, { total: number; healthy: number; degraded: number; critical: number }>();
  const byStatus: Record<string, number> = {};
  const byHealth: Record<string, number> = {};

  for (const e of engines) {
    const t = byTypeMap.get(e.type) || { total: 0, healthy: 0, degraded: 0, critical: 0 };
    t.total++;
    if (e.healthStatus === "HEALTHY") t.healthy++;
    else if (e.healthStatus === "DEGRADED") t.degraded++;
    else if (e.healthStatus === "CRITICAL") t.critical++;
    byTypeMap.set(e.type, t);

    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    byHealth[e.healthStatus] = (byHealth[e.healthStatus] || 0) + 1;
  }

  return {
    total: engines.length,
    byType: Array.from(byTypeMap.entries()).map(([type, v]) => ({ type, ...v })),
    byStatus,
    byHealth,
  };
}

// ─── Skills ────────────────────────────────────────────────────

export interface SkillInfo {
  id: string;
  skillCode: string;
  name: string;
  description: string | null;
  category: string;
  departmentId: string | null;
  proficiencyLevel: string;
  status: string;
}

export async function getSkills(): Promise<SkillInfo[]> {
  const skills = await db.aiSkill.findMany({
    select: { id: true, skillCode: true, name: true, description: true, category: true, departmentId: true, proficiencyLevel: true, status: true },
    orderBy: { category: "asc" },
  });
  return skills;
}

export interface SkillStats {
  total: number;
  byCategory: Array<{ category: string; total: number; active: number }>;
  byProficiency: Record<string, number>;
  byStatus: Record<string, number>;
}

export async function getSkillStats(): Promise<SkillStats> {
  const skills = await db.aiSkill.findMany({ select: { category: true, proficiencyLevel: true, status: true } });

  const byCatMap = new Map<string, { total: number; active: number }>();
  const byProf: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const s of skills) {
    const c = byCatMap.get(s.category) || { total: 0, active: 0 };
    c.total++;
    if (s.status === "ACTIVE") c.active++;
    byCatMap.set(s.category, c);
    byProf[s.proficiencyLevel] = (byProf[s.proficiencyLevel] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }

  return {
    total: skills.length,
    byCategory: Array.from(byCatMap.entries()).map(([category, v]) => ({ category, ...v })),
    byProficiency: byProf,
    byStatus,
  };
}

// ─── Tools (mapped from AiAgent where department=TOOLING) ──────

export interface ToolInfo {
  id: string;
  code: string;
  name: string;
  department: string;
  status: string;
  jobsProcessed: number;
  pendingApprovals: number;
  lastRunAt: Date | null;
}

export async function getTools(): Promise<ToolInfo[]> {
  const tools = await db.aiAgent.findMany({
    where: { department: { in: ["TOOLING", "Tools", "Tool"] } },
    select: { id: true, agentCode: true, agentName: true, department: true, status: true, jobsProcessed: true, pendingApprovals: true, lastRunAt: true },
    orderBy: { agentName: "asc" },
  });
  return tools.map((t) => ({
    id: t.id,
    code: t.agentCode,
    name: t.agentName,
    department: t.department,
    status: t.status,
    jobsProcessed: t.jobsProcessed,
    pendingApprovals: t.pendingApprovals,
    lastRunAt: t.lastRunAt,
  }));
}

export interface ToolStats {
  total: number;
  active: number;
  paused: number;
  idle: number;
  totalJobsProcessed: number;
  totalPendingApprovals: number;
}

export async function getToolStats(): Promise<ToolStats> {
  const tools = await db.aiAgent.findMany({
    where: { department: { in: ["TOOLING", "Tools", "Tool"] } },
    select: { status: true, jobsProcessed: true, pendingApprovals: true },
  });
  const byStatus: Record<string, number> = {};
  let totalJobs = 0;
  let totalPending = 0;
  for (const t of tools) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    totalJobs += t.jobsProcessed || 0;
    totalPending += t.pendingApprovals || 0;
  }
  return {
    total: tools.length,
    active: byStatus["ACTIVE"] || 0,
    paused: byStatus["PAUSED"] || 0,
    idle: byStatus["IDLE"] || 0,
    totalJobsProcessed: totalJobs,
    totalPendingApprovals: totalPending,
  };
}

// ─── Tasks ─────────────────────────────────────────────────────

export interface TaskInfo {
  id: string;
  taskCode: string;
  agentName: string;
  department: string;
  action: string;
  status: string;
  priority: string;
  crmId: string | null;
  crmType: string | null;
  approvalRequired: boolean;
  retryCount: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export async function getTasks(limit: number = 100): Promise<TaskInfo[]> {
  const tasks = await db.aiTask.findMany({
    select: {
      id: true, taskCode: true, agentName: true, department: true, action: true,
      status: true, priority: true, crmId: true, crmType: true, approvalRequired: true,
      retryCount: true, createdAt: true, startedAt: true, completedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return tasks;
}

export interface TaskStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  pendingApprovals: number;
  failed: number;
  avgRetryCount: number;
}

export async function getTaskStats(): Promise<TaskStats> {
  const tasks = await db.aiTask.findMany({
    select: { status: true, priority: true, department: true, approvalRequired: true, retryCount: true },
  });
  const byStatusMap = new Map<string, number>();
  const byPriority: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};
  let pendingApprovals = 0;
  let failed = 0;
  let totalRetries = 0;

  for (const t of tasks) {
    byStatusMap.set(t.status, (byStatusMap.get(t.status) || 0) + 1);
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
    if (t.approvalRequired && t.status === "WAITING") pendingApprovals++;
    if (t.status === "FAILED") failed++;
    totalRetries += t.retryCount || 0;
  }

  return {
    total: tasks.length,
    byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count })),
    byPriority,
    byDepartment,
    pendingApprovals,
    failed,
    avgRetryCount: tasks.length > 0 ? Math.round((totalRetries / tasks.length) * 100) / 100 : 0,
  };
}

export interface CreateTaskParams {
  agentId?: string;
  agentName: string;
  department: string;
  action: string;
  crmId?: string;
  crmType?: string;
  applicationId?: string;
  priority?: string;
  input?: Record<string, unknown>;
  approvalRequired?: boolean;
  deadline?: Date;
}

/**
 * Create a new AiTask in the QUEUED state.
 */
export async function createTask(params: CreateTaskParams): Promise<{ id: string; taskCode: string }> {
  const task = await db.aiTask.create({
    data: {
      taskCode: `ALO-AITASK-${Date.now().toString().slice(-6)}`,
      agentId: params.agentId,
      agentName: params.agentName,
      department: params.department,
      action: params.action,
      crmId: params.crmId,
      crmType: params.crmType,
      applicationId: params.applicationId,
      priority: params.priority || "NORMAL",
      input: JSON.stringify(params.input || {}),
      approvalRequired: params.approvalRequired || false,
      status: "QUEUED",
      deadline: params.deadline,
    },
  });
  return { id: task.id, taskCode: task.taskCode };
}

// ─── Agent Hierarchy ───────────────────────────────────────────

export interface AgentHierarchyNode {
  agentId: string;
  agentCode: string;
  parentAgentId: string | null;
  parentAgentCode: string | null;
  generation: number;
  lineagePath: string;
  isTwoLoopModel: boolean;
  graduatedAt: Date | null;
  children: AgentHierarchyNode[];
}

/**
 * Return the lineage tree rooted at `agentId` (uses AiAgentLineage).
 */
export async function getAgentHierarchy(agentId: string): Promise<AgentHierarchyNode | null> {
  const root = await db.aiAgentLineage.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });
  if (!root) return null;

  // Find all descendants via lineagePath contains agentId
  const all = await db.aiAgentLineage.findMany({
    where: { lineagePath: { contains: root.agentId } },
    orderBy: { generation: "asc" },
  });

  const buildNode = (row: typeof root): AgentHierarchyNode => {
    const children = all
      .filter((r) => r.parentAgentId === row.agentId && r.agentId !== row.agentId)
      .map(buildNode);
    return {
      agentId: row.agentId,
      agentCode: row.agentCode,
      parentAgentId: row.parentAgentId,
      parentAgentCode: row.parentAgentCode,
      generation: row.generation,
      lineagePath: row.lineagePath,
      isTwoLoopModel: row.isTwoLoopModel,
      graduatedAt: row.graduatedAt,
      children,
    };
  };

  return buildNode(root);
}

// ─── Helpers ───────────────────────────────────────────────────

function safeParse(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return (v && typeof v === "object") ? v : null;
  } catch {
    return null;
  }
}
