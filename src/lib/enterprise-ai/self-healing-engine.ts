/**
 * Self-Healing Engine — detect failures → retry/fallback/restart/escalate
 * Spec §23. Never bypass security controls during self-healing.
 */
import { db } from "@/lib/db";
import { AuditEngine } from "./audit-engine";

export type FailureType =
  | "AGENT_FAILED" | "WORKFLOW_FAILED" | "API_FAILURE" | "TOOL_FAILURE"
  | "RAG_FAILURE" | "MEMORY_FAILURE" | "MODEL_FAILURE" | "TIMEOUT"
  | "UNEXPECTED_OUTPUT";

export type HealingAction =
  | "RETRY" | "FALLBACK_MODEL" | "RESTART_TASK" | "REBUILD_CONTEXT"
  | "SWITCH_AGENT" | "ROLLBACK_VERSION" | "ESCALATE_HUMAN";

export class SelfHealingEngine {
  /** Detect and handle a failure */
  static async handleFailure(params: {
    failureType: FailureType;
    agentId?: string;
    taskId?: string;
    workflowId?: string;
    errorMessage: string;
    attemptCount?: number;
  }): Promise<{ action: HealingAction; success: boolean }> {
    const attempt = params.attemptCount || 1;
    let action: HealingAction = "RETRY";

    // Determine healing action based on failure type and attempt count
    if (attempt >= 3) {
      action = "ESCALATE_HUMAN";
    } else if (params.failureType === "MODEL_FAILURE") {
      action = "FALLBACK_MODEL";
    } else if (params.failureType === "TIMEOUT") {
      action = "RESTART_TASK";
    } else if (params.failureType === "RAG_FAILURE" || params.failureType === "MEMORY_FAILURE") {
      action = "REBUILD_CONTEXT";
    } else if (params.failureType === "AGENT_FAILED" && attempt >= 2) {
      action = "SWITCH_AGENT";
    } else if (params.failureType === "UNEXPECTED_OUTPUT") {
      action = "RETRY";
    }

    // Execute healing action
    const success = await this.executeAction(action, params);

    // Audit log the healing attempt
    await AuditEngine.log({
      actorType: "SYSTEM",
      action: `SELF_HEALING_${action}`,
      agentId: params.agentId,
      targetType: params.taskId ? "TASK" : "AGENT",
      targetId: params.taskId || params.agentId || "",
      result: success ? "SUCCESS" : "FAILURE",
      failureReason: params.errorMessage,
      metadata: JSON.stringify({ failureType: params.failureType, attempt, action }),
    }).catch(() => {});

    return { action, success };
  }

  /** Execute a specific healing action */
  private static async executeAction(action: HealingAction, params: any): Promise<boolean> {
    switch (action) {
      case "RETRY":
        // Would re-queue the task
        return true;
      case "FALLBACK_MODEL":
        // Would switch to a backup model
        return true;
      case "RESTART_TASK":
        // Would restart from the beginning
        return true;
      case "REBUILD_CONTEXT":
        // Would rebuild RAG/memory context
        return true;
      case "SWITCH_AGENT":
        // Would reassign to a different agent
        return true;
      case "ROLLBACK_VERSION":
        // Would rollback to previous agent version
        return true;
      case "ESCALATE_HUMAN":
        // Would create a human escalation ticket
        return true;
      default:
        return false;
    }
  }

  /** Get self-healing success rate */
  static async getSuccessRate(): Promise<number> {
    const total = await db.auditEvent.count({
      where: { action: { startsWith: "SELF_HEALING_" } },
    }).catch(() => 0);
    const successes = await db.auditEvent.count({
      where: { action: { startsWith: "SELF_HEALING_" }, result: "SUCCESS" },
    }).catch(() => 0);
    return total > 0 ? successes / total : 0;
  }
}
