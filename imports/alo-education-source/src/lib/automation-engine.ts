import { db } from '@/lib/db';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type AutomationClass =
  | 'AI_AUTOMATABLE'
  | 'AI_ASSISTED'
  | 'HUMAN_REQUIRED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'ESCALATED';

export interface AutomationPolicy {
  classification: AutomationClass;
  approvalPolicy: string;
  riskLevel: string;
}

// ------------------------------------------------------------------
// Policy Registry
// ------------------------------------------------------------------

export const AUTOMATION_POLICIES: Record<string, AutomationPolicy> = {
  LEAD_CLASSIFICATION:        { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  LEAD_TAGGING:              { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  LEAD_SCORING:              { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  LEAD_DUPLICATE_CHECK:      { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  COUNSELOR_ROUTING:         { classification: 'AI_ASSISTED',            approvalPolicy: 'AUTO',           riskLevel: 'MEDIUM' },
  FOLLOW_UP_CREATION:        { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  INACTIVE_LEAD_DETECT:      { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  SLA_MONITORING:            { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  ROUTINE_FAQ:               { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  STUDENT_ONBOARDING:        { classification: 'AI_ASSISTED',            approvalPolicy: 'AUTO',           riskLevel: 'MEDIUM' },
  COURSE_MATCHING:           { classification: 'AI_ASSISTED',            approvalPolicy: 'AUTO',           riskLevel: 'MEDIUM' },
  DOCUMENT_REMINDER:         { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  APPLICATION_CHECKLIST:     { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  MISSING_DOC_DETECT:        { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  DEADLINE_REMINDER:         { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  APPLICATION_SUMMARY:       { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  COMMUNICATION_CLASSIFY:    { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  RESPONSE_DRAFTING:         { classification: 'AI_ASSISTED',            approvalPolicy: 'REVIEW',         riskLevel: 'MEDIUM' },
  ROUTINE_RESPONSE_AUTO:     { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'MEDIUM' },
  CONVERSATION_SUMMARY:      { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  CONTENT_DRAFT:             { classification: 'AI_ASSISTED',            approvalPolicy: 'REVIEW',         riskLevel: 'MEDIUM' },
  CAMPAIGN_REPORTING:        { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  SEO_ANALYSIS:              { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  KPI_SUMMARY:               { classification: 'AI_AUTOMATABLE',          approvalPolicy: 'AUTO',           riskLevel: 'LOW' },
  ANOMALY_DETECTION:         { classification: 'AI_ASSISTED',            approvalPolicy: 'AUTO',           riskLevel: 'HIGH' },
  VISA_DECISION:             { classification: 'HUMAN_REQUIRED',         approvalPolicy: 'NEVER',          riskLevel: 'CRITICAL' },
  REFUND:                    { classification: 'HUMAN_APPROVAL_REQUIRED', approvalPolicy: 'HUMAN_REQUIRED', riskLevel: 'CRITICAL' },
  FINANCIAL_APPROVAL:        { classification: 'HUMAN_APPROVAL_REQUIRED', approvalPolicy: 'HUMAN_REQUIRED', riskLevel: 'CRITICAL' },
  SENSITIVE_COMPLAINT:       { classification: 'HUMAN_REQUIRED',         approvalPolicy: 'NEVER',          riskLevel: 'HIGH' },
  POLICY_CHANGE:             { classification: 'HUMAN_REQUIRED',         approvalPolicy: 'NEVER',          riskLevel: 'CRITICAL' },
  FINAL_ADMISSION_DECISION:  { classification: 'HUMAN_REQUIRED',         approvalPolicy: 'NEVER',          riskLevel: 'CRITICAL' },
  ESCALATED_FAILURE:         { classification: 'ESCALATED',              approvalPolicy: 'HUMAN_REQUIRED', riskLevel: 'HIGH' },
};

// ------------------------------------------------------------------
// Pure policy helpers (no DB)
// ------------------------------------------------------------------

/** Default policy returned for unknown task types. */
const FALLBACK_POLICY: AutomationPolicy = {
  classification: 'HUMAN_REQUIRED',
  approvalPolicy: 'HUMAN_REQUIRED',
  riskLevel: 'HIGH',
};

/**
 * classifyTask(taskType)
 * Returns the full policy for a given task type.
 * Unknown types default to HUMAN_REQUIRED with HIGH risk.
 */
export function classifyTask(taskType: string): AutomationPolicy {
  return AUTOMATION_POLICIES[taskType] ?? FALLBACK_POLICY;
}

/**
 * canAutoExecute(taskType)
 * True only when the task is classified as AI_AUTOMATABLE with AUTO approval.
 */
export function canAutoExecute(taskType: string): boolean {
  const policy = classifyTask(taskType);
  return policy.classification === 'AI_AUTOMATABLE' && policy.approvalPolicy === 'AUTO';
}

/**
 * requiresApproval(taskType)
 * True when the approval policy is REVIEW or HUMAN_REQUIRED.
 */
export function requiresApproval(taskType: string): boolean {
  const policy = classifyTask(taskType);
  return policy.approvalPolicy === 'REVIEW' || policy.approvalPolicy === 'HUMAN_REQUIRED';
}

/**
 * getRiskLevel(taskType)
 * Returns the risk level string (LOW, MEDIUM, HIGH, CRITICAL).
 */
export function getRiskLevel(taskType: string): string {
  return classifyTask(taskType).riskLevel;
}

// ------------------------------------------------------------------
// DB-backed metric functions
// ------------------------------------------------------------------

/**
 * calculateAutomationRate()
 * Queries the AiTask table and computes:
 *   automationRate = aiAutomated / totalCompleted * 100
 *
 * Considers only tasks with a terminal status (COMPLETED, FAILED, CANCELLED, ESCALATED).
 */
export async function calculateAutomationRate(): Promise<{
  total: number;
  aiAutomated: number;
  aiAssisted: number;
  humanRequired: number;
  approvalRequired: number;
  escalated: number;
  automationRate: number;
}> {
  const terminalStatuses = ['COMPLETED', 'FAILED', 'CANCELLED', 'ESCALATED'];

  const rows = await db.aiTask.findMany({
    where: { status: { in: terminalStatuses } },
    select: { automationClass: true },
  });

  const total = rows.length;
  let aiAutomated = 0;
  let aiAssisted = 0;
  let humanRequired = 0;
  let approvalRequired = 0;
  let escalated = 0;

  for (const row of rows) {
    switch (row.automationClass) {
      case 'AI_AUTOMATABLE':
        aiAutomated++;
        break;
      case 'AI_ASSISTED':
        aiAssisted++;
        break;
      case 'HUMAN_REQUIRED':
        humanRequired++;
        break;
      case 'HUMAN_APPROVAL_REQUIRED':
        approvalRequired++;
        break;
      case 'ESCALATED':
        escalated++;
        break;
    }
  }

  const automationRate = total > 0 ? (aiAutomated / total) * 100 : 0;

  return {
    total,
    aiAutomated,
    aiAssisted,
    humanRequired,
    approvalRequired,
    escalated,
    automationRate: Math.round(automationRate * 100) / 100, // 2 decimal places
  };
}

/**
 * recordDailyMetric()
 * Computes today's automation metrics from AiTask and upserts
 * (or creates) an AutomationMetric record for today's date.
 */
export async function recordDailyMetric(): Promise<import('@prisma/client').AutomationMetric> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Start of today in local time (SQLite stores as UTC text so we compare strings)
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const rows = await db.aiTask.findMany({
    where: {
      createdAt: { gte: dayStart, lte: dayEnd },
    },
    select: { automationClass: true },
  });

  let totalTasks = 0;
  let aiAutomated = 0;
  let aiAssisted = 0;
  let humanRequired = 0;
  let approvalRequired = 0;
  let escalated = 0;

  for (const row of rows) {
    totalTasks++;
    switch (row.automationClass) {
      case 'AI_AUTOMATABLE':
        aiAutomated++;
        break;
      case 'AI_ASSISTED':
        aiAssisted++;
        break;
      case 'HUMAN_REQUIRED':
        humanRequired++;
        break;
      case 'HUMAN_APPROVAL_REQUIRED':
        approvalRequired++;
        break;
      case 'ESCALATED':
        escalated++;
        break;
    }
  }

  const automationRate = totalTasks > 0 ? (aiAutomated / totalTasks) * 100 : 0;
  const humanRate = totalTasks > 0 ? ((humanRequired + approvalRequired) / totalTasks) * 100 : 0;

  // Upsert: create if not exists for today, otherwise update
  return db.automationMetric.upsert({
    where: { date: dateStr },
    update: {
      totalTasks,
      aiAutomated,
      aiAssisted,
      humanRequired,
      approvalRequired,
      escalated,
      automationRate: Math.round(automationRate * 100) / 100,
      humanRate: Math.round(humanRate * 100) / 100,
    },
    create: {
      date: dateStr,
      totalTasks,
      aiAutomated,
      aiAssisted,
      humanRequired,
      approvalRequired,
      escalated,
      automationRate: Math.round(automationRate * 100) / 100,
      humanRate: Math.round(humanRate * 100) / 100,
    },
  });
}
