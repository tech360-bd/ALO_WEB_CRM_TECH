/**
 * CRM Automation Engine
 * 
 * Handles: lead scoring, counselor assignment, AI task creation,
 * follow-up scheduling, and automation metric tracking.
 */

import { db } from "@/lib/db";

// ─── Lead Scoring ──────────────────────────────────────────────

export interface LeadScoreResult {
  score: number; // 0-100
  tier: "HOT" | "WARM" | "COLD" | "URGENT" | "AT_RISK";
  reasons: string[];
}

export async function scoreLead(leadId: string): Promise<LeadScoreResult> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { score: 0, tier: "COLD", reasons: ["Lead not found"] };

  let score = 0;
  const reasons: string[] = [];

  // Study intent (clear destination + level)
  if (lead.preferredCountry) { score += 15; reasons.push("Has preferred destination"); }
  if (lead.preferredCourse) { score += 10; reasons.push("Has preferred course"); }
  if (lead.preferredLevel) { score += 10; reasons.push("Has preferred level"); }

  // Academic profile
  if (lead.currentQualification) { score += 10; reasons.push("Has qualification info"); }
  if (lead.cgpa && parseFloat(lead.cgpa) >= 3.0) { score += 15; reasons.push("Strong CGPA"); }
  else if (lead.cgpa) { score += 5; reasons.push("Has CGPA info"); }

  // English readiness
  if (lead.englishTest) { score += 10; reasons.push("Has English test"); }
  if (lead.englishScore) { score += 10; reasons.push("Has English score"); }

  // Intake + budget
  if (lead.preferredIntake) { score += 10; reasons.push("Has preferred intake"); }
  if (lead.budget) { score += 10; reasons.push("Has budget info"); }

  // Contact completeness
  if (lead.email && lead.phone) { score += 10; reasons.push("Complete contact info"); }
  else if (lead.phone) { score += 5; reasons.push("Has phone"); }

  // Cap at 100
  score = Math.min(100, score);

  // Determine tier
  let tier: LeadScoreResult["tier"] = "COLD";
  if (score >= 80) tier = "HOT";
  else if (score >= 60) tier = "WARM";
  else if (score >= 40) tier = "COLD";

  // Check urgency (intake approaching)
  if (lead.preferredIntake) {
    const intakeMatch = lead.preferredIntake.match(/(\d{4})/);
    if (intakeMatch) {
      const intakeYear = parseInt(intakeMatch[1]);
      const now = new Date();
      const monthsUntil = (intakeYear - now.getFullYear()) * 12;
      if (monthsUntil <= 6 && monthsUntil >= 0) {
        tier = "URGENT";
        reasons.push("Intake approaching within 6 months");
      }
    }
  }

  // Update lead
  await db.lead.update({
    where: { id: leadId },
    data: { leadScore: score, leadTier: tier },
  });

  // Log metric
  await incrementMetric("lead_qualification", "automated");

  return { score, tier, reasons };
}

// ─── Counselor Auto-Assignment ──────────────────────────────────

export async function autoAssignCounselor(leadId: string): Promise<{ counselorId: string | null; reason: string }> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { counselorId: null, reason: "Lead not found" };
  if (lead.counselorId) return { counselorId: lead.counselorId, reason: "Already assigned" };

  // Find counselors with least active leads
  const counselors = await db.user.findMany({
    where: {
      role: { in: ["COUNSELOR", "BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"] },
      status: "ACTIVE",
    },
    select: { id: true, name: true, role: true },
  });

  if (counselors.length === 0) return { counselorId: null, reason: "No active counselors available" };

  // Count active leads per counselor
  const leadCounts = await Promise.all(
    counselors.map(async (c) => ({
      ...c,
      activeLeads: await db.lead.count({
        where: {
          counselorId: c.id,
          status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
        },
      }),
    }))
  );

  // Sort by workload (ascending), breaking ties by role: dedicated
  // counselors take leads before branch managers, and admins/super-admins
  // only receive leads as a last-resort fallback when no counselor exists.
  const rolePriority: Record<string, number> = {
    COUNSELOR: 0,
    BRANCH_MANAGER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };
  const hasDedicated = leadCounts.some((c) => c.role === "COUNSELOR" || c.role === "BRANCH_MANAGER");
  const pool = hasDedicated
    ? leadCounts.filter((c) => c.role === "COUNSELOR" || c.role === "BRANCH_MANAGER")
    : leadCounts;
  pool.sort(
    (a, b) =>
      a.activeLeads - b.activeLeads ||
      (rolePriority[a.role] ?? 9) - (rolePriority[b.role] ?? 9)
  );

  // Pick the counselor with least workload
  const assigned = pool[0];
  const reason = `Auto-assigned to ${assigned.name} (${assigned.role}) — least workload (${assigned.activeLeads} active leads)`;

  await db.lead.update({
    where: { id: leadId },
    data: {
      counselorId: assigned.id,
      assignedReason: reason,
      status: lead.status === "NEW" ? "CONTACTED" : lead.status,
    },
  });

  // Create timeline event
  await db.timelineEvent.create({
    data: {
      studentId: "",
      leadId: lead.id,
      stage: "lead",
      type: "NOTE",
      title: "Counselor auto-assigned",
      description: reason,
      meta: JSON.stringify({ counselorId: assigned.id, counselorName: assigned.name, automated: true }),
    },
  }).catch(() => {});

  // Log metric
  await incrementMetric("assignment", "automated");

  return { counselorId: assigned.id, reason };
}

// ─── AI Task Creation ───────────────────────────────────────────

export async function createAiTask(params: {
  agentName: string;
  department: string;
  action: string;
  crmId?: string;
  crmType?: string;
  applicationId?: string;
  priority?: string;
  input?: Record<string, unknown>;
  approvalRequired?: boolean;
}): Promise<string> {
  const task = await db.aiTask.create({
    data: {
      taskCode: `ALO-AITASK-${Date.now().toString().slice(-6)}`,
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
    },
  });
  return task.id;
}

// ─── AI Action Logging ─────────────────────────────────────────

export async function logAiAction(params: {
  taskId: string;
  agentName: string;
  actionType: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  crmId?: string;
  crmType?: string;
  success?: boolean;
  errorMessage?: string;
  duration?: number;
}): Promise<void> {
  await db.aiAction.create({
    data: {
      taskId: params.taskId,
      agentName: params.agentName,
      actionType: params.actionType,
      toolName: params.toolName,
      toolInput: JSON.stringify(params.toolInput || {}),
      toolResult: JSON.stringify(params.toolResult || {}),
      crmId: params.crmId,
      crmType: params.crmType,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
      duration: params.duration,
    },
  });
}

// ─── Form Submission ───────────────────────────────────────────

export async function saveFormSubmission(params: {
  source: string;
  channel?: string;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  rawPayload: Record<string, unknown>;
  normalizedData?: Record<string, unknown>;
  crmId?: string;
  crmType?: string;
}): Promise<string> {
  const sub = await db.formSubmission.create({
    data: {
      submissionCode: `ALO-FS-${Date.now().toString().slice(-6)}`,
      source: params.source,
      channel: params.channel,
      sourceUrl: params.sourceUrl,
      utmSource: params.utmSource,
      utmMedium: params.utmMedium,
      utmCampaign: params.utmCampaign,
      rawPayload: JSON.stringify(params.rawPayload),
      normalizedData: JSON.stringify(params.normalizedData || {}),
      crmId: params.crmId,
      crmType: params.crmType,
      processingStatus: "PROCESSED",
    },
  });
  return sub.id;
}

// ─── Duplicate Detection ────────────────────────────────────────

export async function findDuplicateLead(params: { email?: string; phone?: string }): Promise<string | null> {
  if (!params.email && !params.phone) return null;

  const conditions: any[] = [];
  if (params.email) conditions.push({ email: params.email });
  if (params.phone) conditions.push({ phone: params.phone });

  const existing = await db.lead.findFirst({
    where: { OR: conditions },
    select: { id: true },
  });

  return existing?.id || null;
}

// ─── Follow-up Task Creation ───────────────────────────────────

export async function createFollowUpTask(leadId: string, daysFromNow: number = 1): Promise<void> {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + daysFromNow);

  await db.lead.update({
    where: { id: leadId },
    data: { followUpDate },
  });

  // Log metric
  await incrementMetric("follow_up", "automated");
}

// ─── Automation Metrics ────────────────────────────────────────

export async function incrementMetric(category: string, taskType: "automated" | "aiAssisted" | "human" | "failed"): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.automationMetric.findFirst({
    where: { category, date: today },
  });

  if (existing) {
    const updates: Record<string, number> = { totalTasks: existing.totalTasks + 1 };
    if (taskType === "automated") updates.automatedTasks = existing.automatedTasks + 1;
    else if (taskType === "aiAssisted") updates.aiAssistedTasks = existing.aiAssistedTasks + 1;
    else if (taskType === "human") updates.humanTasks = existing.humanTasks + 1;
    else if (taskType === "failed") updates.failedTasks = existing.failedTasks + 1;

    await db.automationMetric.update({ where: { id: existing.id }, data: updates });
  } else {
    await db.automationMetric.create({
      data: {
        category,
        date: today,
        totalTasks: 1,
        automatedTasks: taskType === "automated" ? 1 : 0,
        aiAssistedTasks: taskType === "aiAssisted" ? 1 : 0,
        humanTasks: taskType === "human" ? 1 : 0,
        failedTasks: taskType === "failed" ? 1 : 0,
      },
    });
  }
}

// ─── Automation Dashboard Stats ─────────────────────────────────

export async function getAutomationStats(): Promise<{
  totalTasks: number;
  automatedTasks: number;
  aiAssistedTasks: number;
  humanTasks: number;
  failedTasks: number;
  automationPercentage: number;
  byCategory: Array<{ category: string; total: number; automated: number; percentage: number }>;
}> {
  const metrics = await db.automationMetric.findMany();
  
  const totals = metrics.reduce((acc, m) => ({
    totalTasks: acc.totalTasks + m.totalTasks,
    automatedTasks: acc.automatedTasks + m.automatedTasks,
    aiAssistedTasks: acc.aiAssistedTasks + m.aiAssistedTasks,
    humanTasks: acc.humanTasks + m.humanTasks,
    failedTasks: acc.failedTasks + m.failedTasks,
  }), { totalTasks: 0, automatedTasks: 0, aiAssistedTasks: 0, humanTasks: 0, failedTasks: 0 });

  const byCategory = metrics.reduce((acc, m) => {
    const existing = acc.find(a => a.category === m.category);
    if (existing) {
      existing.total += m.totalTasks;
      existing.automated += m.automatedTasks + m.aiAssistedTasks;
    } else {
      acc.push({
        category: m.category,
        total: m.totalTasks,
        automated: m.automatedTasks + m.aiAssistedTasks,
        percentage: 0,
      });
    }
    return acc;
  }, [] as Array<{ category: string; total: number; automated: number; percentage: number }>);

  byCategory.forEach(c => {
    c.percentage = c.total > 0 ? Math.round((c.automated / c.total) * 100) : 0;
  });

  const automationPercentage = totals.totalTasks > 0
    ? Math.round(((totals.automatedTasks + totals.aiAssistedTasks) / totals.totalTasks) * 100)
    : 0;

  return { ...totals, automationPercentage, byCategory };
}
