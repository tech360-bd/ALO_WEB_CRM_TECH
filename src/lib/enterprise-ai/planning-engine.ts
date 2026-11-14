/**
 * Planning Engine — objective → tasks → assign → execute → monitor → replan
 * Spec §21. Plans must be auditable.
 */
import { db } from "@/lib/db";
import { AuditEngine } from "./audit-engine";

export interface TaskBreakdown {
  taskId: string;
  description: string;
  assignedAgentId: string;
  dependencies: string[];
  status: "PENDING" | "ASSIGNED" | "EXECUTING" | "COMPLETED" | "FAILED";
}

export class PlanningEngine {
  /** Create a plan from an objective */
  static async createPlan(params: {
    agentId: string;
    departmentId: string;
    objective: string;
    objectiveType?: string;
    tasks: TaskBreakdown[];
    requestedBy: string;
  }): Promise<string> {
    const plan = await db.plan.create({
      data: {
        agentId: params.agentId,
        departmentId: params.departmentId,
        objective: params.objective,
        objectiveType: params.objectiveType || "task",
        status: "DRAFT",
        tasksJson: JSON.stringify(params.tasks),
        taskCount: params.tasks.length,
        completedTasks: 0,
        failedTasks: 0,
      },
    }).catch(() => ({ id: `plan-${Date.now()}` }));

    await AuditEngine.log({
      actorType: "AI_AGENT",
      actorId: params.agentId,
      action: "PLAN_CREATED",
      targetType: "PLAN",
      targetId: plan.id,
      metadata: JSON.stringify({ objective: params.objective, taskCount: params.tasks.length }),
    }).catch(() => {});

    return plan.id;
  }

  /** Approve and start executing a plan */
  static async approveAndExecute(planId: string, approvedBy: string): Promise<void> {
    await db.plan.update({
      where: { id: planId },
      data: { status: "EXECUTING", approvedBy, approvedAt: new Date() },
    }).catch(() => {});

    await AuditEngine.log({
      actorType: "HUMAN",
      actorId: approvedBy,
      action: "PLAN_APPROVED",
      targetType: "PLAN",
      targetId: planId,
      approved: true,
    }).catch(() => {});
  }

  /** Update task status within a plan */
  static async updateTaskStatus(planId: string, taskId: string, status: string): Promise<void> {
    const plan = await db.plan.findUnique({ where: { id: planId } }).catch(() => null);
    if (!plan) return;

    const tasks: TaskBreakdown[] = JSON.parse(plan.tasksJson || "[]");
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) task.status = status as any;

    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const failedTasks = tasks.filter((t) => t.status === "FAILED").length;
    const newStatus = failedTasks > 0 ? "FAILED" : completedTasks === tasks.length ? "COMPLETED" : "EXECUTING";

    await db.plan.update({
      where: { id: planId },
      data: {
        tasksJson: JSON.stringify(tasks),
        completedTasks,
        failedTasks,
        status: newStatus,
      },
    }).catch(() => {});
  }

  /** Escalate a failed plan to human review */
  static async escalate(planId: string, reason: string): Promise<void> {
    await db.plan.update({
      where: { id: planId },
      data: { status: "ESCALATED", escalationReason: reason },
    }).catch(() => {});

    await AuditEngine.log({
      action: "PLAN_ESCALATED",
      targetType: "PLAN",
      targetId: planId,
      result: "ESCALATED",
      escalationReason: reason,
    }).catch(() => {});
  }
}
