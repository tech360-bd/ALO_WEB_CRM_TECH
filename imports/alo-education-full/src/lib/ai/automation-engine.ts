/**
 * ALO Education — Automation Policy Engine
 * Task ID: 7-ai-gateway
 *
 * Determines whether a task can be fully automated, needs AI assistance,
 * requires human input, or must be escalated.
 */

import type { AutomationPolicy, AutomationEvaluation, AutomationClass } from './types';

// ============================================================
// BUILT-IN POLICIES
// ============================================================

const policies: AutomationPolicy[] = [
  {
    taskType: 'lead_classification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 3,
    timeoutMs: 15_000,
  },
  {
    taskType: 'lead_scoring',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.7,
    approvalRequired: false,
    maxRetries: 3,
    timeoutMs: 15_000,
  },
  {
    taskType: 'lead_tagging',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'course_matching',
    automationClass: 'AI_ASSISTED',
    confidenceThreshold: 0.75,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 30_000,
  },
  {
    taskType: 'document_check',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.9,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 30_000,
  },
  {
    taskType: 'visa_advice',
    automationClass: 'HUMAN_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: false,
    maxRetries: 0,
    timeoutMs: 0,
  },
  {
    taskType: 'refund_approval',
    automationClass: 'HUMAN_APPROVAL_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: true,
    maxRetries: 0,
    timeoutMs: 0,
  },
  {
    taskType: 'financial_decision',
    automationClass: 'HUMAN_APPROVAL_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: true,
    maxRetries: 0,
    timeoutMs: 0,
  },
  {
    taskType: 'sensitive_complaint',
    automationClass: 'HUMAN_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: false,
    maxRetries: 0,
    timeoutMs: 0,
  },
  {
    taskType: 'email_draft',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 20_000,
  },
  {
    taskType: 'social_media_post',
    automationClass: 'HUMAN_APPROVAL_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: true,
    maxRetries: 0,
    timeoutMs: 0,
  },
  // ── Phase 7: Additional automation policies ──────────────────
  {
    taskType: 'follow_up_draft',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'lead_reclassification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'message_classification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 10_000,
  },
  {
    taskType: 'response_draft',
    automationClass: 'AI_ASSISTED',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 20_000,
  },
  {
    taskType: 'application_status_analysis',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'missing_requirements_check',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 20_000,
  },
  {
    taskType: 'document_classification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 10_000,
  },
  {
    taskType: 'document_completeness_check',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.9,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 20_000,
  },
  {
    taskType: 'missing_document_detection',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'content_generation',
    automationClass: 'AI_ASSISTED',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 30_000,
  },
  {
    taskType: 'ticket_classification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.85,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 10_000,
  },
  {
    taskType: 'report_generation',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 30_000,
  },
  {
    taskType: 'failure_analysis',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.7,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 20_000,
  },
  {
    taskType: 'profile_analysis',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.8,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 15_000,
  },
  {
    taskType: 'payment_notification',
    automationClass: 'AI_AUTOMATABLE',
    confidenceThreshold: 0.9,
    approvalRequired: false,
    maxRetries: 2,
    timeoutMs: 10_000,
  },
  {
    taskType: 'visa_decision',
    automationClass: 'HUMAN_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: false,
    maxRetries: 0,
    timeoutMs: 0,
  },
  {
    taskType: 'sensitive_document_approval',
    automationClass: 'HUMAN_APPROVAL_REQUIRED',
    confidenceThreshold: 0,
    approvalRequired: true,
    maxRetries: 0,
    timeoutMs: 0,
  },
];

/** Default policy for unknown task types */
const DEFAULT_POLICY: AutomationPolicy = {
  taskType: 'default',
  automationClass: 'AI_ASSISTED',
  confidenceThreshold: 0.7,
  approvalRequired: true,
  maxRetries: 2,
  timeoutMs: 20_000,
};

// ============================================================
// AUTOMATION ENGINE
// ============================================================

class AutomationEngine {
  private policyMap: Map<string, AutomationPolicy>;

  constructor() {
    this.policyMap = new Map();
    for (const p of policies) {
      this.policyMap.set(p.taskType, p);
    }
  }

  /**
   * Evaluate the automation policy for a task.
   *
   * If `overrideClass` is provided (e.g. from an explicit request),
   * it takes precedence over the built-in policy.
   */
  evaluate(
    taskType: string,
    overrideClass?: AutomationClass
  ): AutomationEvaluation {
    const policy = this.policyMap.get(taskType) ?? DEFAULT_POLICY;

    let automationClass = policy.automationClass;
    let canAutomate = automationClass === 'AI_AUTOMATABLE';
    let requiresApproval = policy.approvalRequired;
    let reason = '';

    // Override if explicitly set
    if (overrideClass) {
      automationClass = overrideClass;
      reason = 'Automation class explicitly overridden.';
    }

    switch (automationClass) {
      case 'AI_AUTOMATABLE':
        canAutomate = true;
        requiresApproval = false;
        if (!reason) reason = 'Task is fully automatable by AI.';
        break;

      case 'AI_ASSISTED':
        canAutomate = true;
        requiresApproval = true;
        if (!reason) reason = 'AI can assist, but human review is recommended.';
        break;

      case 'HUMAN_REQUIRED':
        canAutomate = false;
        requiresApproval = false;
        if (!reason) reason = 'This task requires a human to handle directly.';
        break;

      case 'HUMAN_APPROVAL_REQUIRED':
        canAutomate = false;
        requiresApproval = true;
        if (!reason) reason = 'AI can prepare a draft/action, but human approval is mandatory.';
        break;

      case 'ESCALATED':
        canAutomate = false;
        requiresApproval = true;
        if (!reason) reason = 'Task has been escalated — manual intervention required.';
        break;
    }

    return {
      taskType,
      automationClass,
      canAutomate,
      requiresApproval,
      reason,
    };
  }

  /**
   * Check whether a task result meets the confidence threshold.
   * If not, the task should be escalated to human review.
   */
  checkConfidence(taskType: string, confidence: number): { passes: boolean; reason: string } {
    const policy = this.policyMap.get(taskType) ?? DEFAULT_POLICY;

    if (policy.automationClass === 'HUMAN_REQUIRED' || policy.automationClass === 'ESCALATED') {
      return { passes: false, reason: 'Task type always requires human handling.' };
    }

    if (policy.confidenceThreshold > 0 && confidence < policy.confidenceThreshold) {
      return {
        passes: false,
        reason: `Confidence ${confidence.toFixed(2)} below threshold ${policy.confidenceThreshold} — escalate to human.`,
      };
    }

    return { passes: true, reason: 'Confidence threshold met.' };
  }

  /**
   * Get the full policy for a task type.
   */
  getPolicy(taskType: string): AutomationPolicy {
    return this.policyMap.get(taskType) ?? DEFAULT_POLICY;
  }

  /**
   * List all registered policies.
   */
  listPolicies(): AutomationPolicy[] {
    return [...this.policyMap.values()];
  }

  /**
   * Register or update a policy at runtime.
   */
  setPolicy(policy: AutomationPolicy): void {
    this.policyMap.set(policy.taskType, policy);
  }
}

/** Singleton automation engine instance */
export const automationEngine = new AutomationEngine();
