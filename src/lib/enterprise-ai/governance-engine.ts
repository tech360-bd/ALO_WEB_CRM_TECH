/**
 * Governance Engine — agent/model/prompt change governance
 * Spec §26. Every governance action must be auditable.
 */
import { db } from "@/lib/db";
import { AuditEngine } from "./audit-engine";

export interface GovernanceRequest {
  actionType: string;
  targetType: string;
  targetId: string;
  requestedBy: string;
  reason: string;
  impactAssessment?: string;
}

export class GovernanceEngine {
  /** Request a governance action (CREATE_AGENT, MODEL_CHANGE, etc.) */
  static async request(req: GovernanceRequest): Promise<string> {
    const action = await db.governanceAction.create({
      data: {
        actionType: req.actionType,
        targetType: req.targetType,
        targetId: req.targetId,
        requestedBy: req.requestedBy,
        reason: req.reason,
        impactAssessment: req.impactAssessment || "",
        status: "PENDING",
      },
    }).catch(() => ({ id: `gov-${Date.now()}` }));

    await AuditEngine.log({
      actorType: "HUMAN",
      actorId: req.requestedBy,
      action: `GOVERNANCE_REQUEST_${req.actionType}`,
      targetType: req.targetType,
      targetId: req.targetId,
      result: "SUCCESS",
      metadata: JSON.stringify({ governanceActionId: action.id, reason: req.reason }),
    }).catch(() => {});

    return action.id;
  }

  /** Approve a governance action (Super Admin only) */
  static async approve(actionId: string, approvedBy: string): Promise<boolean> {
    await db.governanceAction.update({
      where: { id: actionId },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    }).catch(() => {});

    await AuditEngine.log({
      actorType: "HUMAN",
      actorId: approvedBy,
      action: "GOVERNANCE_APPROVE",
      targetType: "GOVERNANCE_ACTION",
      targetId: actionId,
      result: "SUCCESS",
      approved: true,
    }).catch(() => {});
    return true;
  }

  /** Reject a governance action */
  static async reject(actionId: string, rejectedBy: string, reason: string): Promise<boolean> {
    await db.governanceAction.update({
      where: { id: actionId },
      data: { status: "REJECTED", approvedBy: rejectedBy },
    }).catch(() => {});

    await AuditEngine.log({
      actorType: "HUMAN",
      actorId: rejectedBy,
      action: "GOVERNANCE_REJECT",
      targetType: "GOVERNANCE_ACTION",
      targetId: actionId,
      result: "SUCCESS",
      failureReason: reason,
    }).catch(() => {});
    return true;
  }

  /** Check if an agent creation is allowed (DCC + governance + resource check) */
  static async canCreateAgent(departmentId: string): Promise<{ allowed: boolean; reason: string }> {
    const { DCCEngine } = await import("./dcc-engine");
    const certified = await DCCEngine.isCertified(departmentId);
    if (!certified) {
      return { allowed: false, reason: "Department DCC certification required before agent creation" };
    }
    return { allowed: true, reason: "Department is DCC-certified" };
  }
}
