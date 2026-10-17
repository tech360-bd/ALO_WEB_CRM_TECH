/**
 * Unified Automation Engine
 *
 * Each `run*` workflow:
 *   1. Checks `isGlobalAiPaused()` first — short-circuits if paused.
 *   2. Creates an AutomationEvent record (AuditLog action="AUTOMATION_EVENT",
 *      resource=workflow name, details=JSON {category, mode, trigger, actor,
 *      targetType, targetId, action, riskLevel, ...}).
 *   3. Writes a TimelineEvent for the affected Lead/Student/User.
 *   4. Uses idempotencyKey = `${workflow}:${targetId}:${ymd}` stored in
 *      AuditLog.details JSON; P2002 race returns the existing record.
 *
 * Schema graceful-degradation:
 *   - No dedicated `AutomationEvent` model — AuditLog is the source of truth.
 *   - `incrementMetric` is reused from crm-automation.ts to track AutomationMetric.
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { isGlobalAiPaused } from "@/lib/ai-safety";
import {
  scoreLead, autoAssignCounselor, createFollowUpTask, incrementMetric,
} from "@/lib/crm-automation";

// ─── Types ─────────────────────────────────────────────────────

export type AutomationMode = "AUTOMATED" | "AI_ASSISTED" | "HUMAN" | "ESCALATED";
export type AutomationCategory =
  | "ELIGIBLE_ROUTINE"
  | "INELIGIBLE"
  | "HUMAN_REQUIRED"
  | "ESCALATION";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AutomationEventParams {
  workflow: string;
  category: AutomationCategory;
  mode: AutomationMode;
  trigger: string;
  actor?: string;            // userId or "system"
  actorType?: "SYSTEM" | "USER" | "AI_AGENT";
  targetType?: string;       // Lead, Student, Application, etc.
  targetId?: string;
  action: string;
  riskLevel?: RiskLevel;
  result?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
  durationMs?: number;
  idempotencyKey: string;
}

export interface AutomationEventRecord {
  id: string;
  workflow: string;
  category: AutomationCategory;
  mode: AutomationMode;
  trigger: string;
  actor: string;
  targetType?: string;
  targetId?: string;
  action: string;
  riskLevel: RiskLevel;
  result: Record<string, unknown> | null;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
  idempotencyKey: string;
  createdAt: Date;
}

// ─── Event Persistence (idempotent) ────────────────────────────

const AUTOMATION_RESOURCE = "AutomationEvent";
const AUTOMATION_ACTION = "AUTOMATION_EVENT";

function stableIdempotencyKey(workflow: string, targetId?: string | null, salt?: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const base = `${workflow}:${targetId || "none"}:${today}`;
  const hash = crypto.createHash("sha256").update(base + (salt || "")).digest("hex").slice(0, 16);
  return `auto-${workflow}-${hash}`;
}

/**
 * Persist an AutomationEvent (idempotent by idempotencyKey stored in AuditLog.details).
 *
 * - If an AuditLog row already exists for this idempotencyKey, returns it (cached).
 * - On Prisma P2002 race, re-fetches and returns the existing row.
 */
export async function logAutomationEvent(params: AutomationEventParams): Promise<AutomationEventRecord> {
  // Idempotency check
  const existing = await db.auditLog.findFirst({
    where: {
      resource: AUTOMATION_RESOURCE,
      action: AUTOMATION_ACTION,
      details: { contains: `"idempotencyKey":"${params.idempotencyKey}"` },
    },
  });
  if (existing) {
    return auditLogToRecord(existing);
  }

  const details = JSON.stringify({
    workflow: params.workflow,
    category: params.category,
    mode: params.mode,
    trigger: params.trigger,
    actor: params.actor || "system",
    actorType: params.actorType || "SYSTEM",
    targetType: params.targetType || null,
    targetId: params.targetId || null,
    action: params.action,
    riskLevel: params.riskLevel || "LOW",
    result: params.result || null,
    success: params.success ?? true,
    errorMessage: params.errorMessage || null,
    durationMs: params.durationMs ?? null,
    idempotencyKey: params.idempotencyKey,
  });

  try {
    const row = await db.auditLog.create({
      data: {
        action: AUTOMATION_ACTION,
        resource: AUTOMATION_RESOURCE,
        resourceId: params.targetId || null,
        userId: params.actor && params.actor !== "system" ? params.actor : null,
        details,
      },
    });
    return auditLogToRecord(row);
  } catch (err: any) {
    if (err?.code === "P2002") {
      const race = await db.auditLog.findFirst({
        where: {
          resource: AUTOMATION_RESOURCE,
          action: AUTOMATION_ACTION,
          details: { contains: `"idempotencyKey":"${params.idempotencyKey}"` },
        },
      });
      if (race) return auditLogToRecord(race);
    }
    throw err;
  }
}

function auditLogToRecord(row: {
  id: string;
  details: string | null;
  createdAt: Date;
}): AutomationEventRecord {
  let d: any = {};
  try { d = JSON.parse(row.details || "{}"); } catch {}
  return {
    id: row.id,
    workflow: d.workflow,
    category: d.category,
    mode: d.mode,
    trigger: d.trigger,
    actor: d.actor,
    targetType: d.targetType,
    targetId: d.targetId,
    action: d.action,
    riskLevel: d.riskLevel,
    result: d.result,
    success: d.success,
    errorMessage: d.errorMessage,
    durationMs: d.durationMs,
    idempotencyKey: d.idempotencyKey,
    createdAt: row.createdAt,
  };
}

// ─── Helpers ───────────────────────────────────────────────────

async function checkPauseAndLog(workflow: string): Promise<{ paused: boolean; startedAt: number }> {
  const paused = await isGlobalAiPaused();
  if (paused) {
    await logAutomationEvent({
      workflow,
      category: "INELIGIBLE",
      mode: "AUTOMATED",
      trigger: "scheduler",
      actor: "system",
      targetType: "GLOBAL",
      action: "skipped_due_to_global_pause",
      riskLevel: "LOW",
      success: true,
      idempotencyKey: stableIdempotencyKey(workflow, "pause-check", String(Date.now())),
    });
  }
  return { paused, startedAt: Date.now() };
}

async function writeTimeline(params: {
  leadId?: string;
  studentId?: string;
  userId?: string;
  type: string;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.timelineEvent.create({
      data: {
        leadId: params.leadId,
        studentId: params.studentId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        meta: params.meta ? JSON.stringify(params.meta) : null,
      },
    });
  } catch (e) {
    // timeline failures are non-fatal
  }
}

// ─── Workflows ─────────────────────────────────────────────────

export interface WorkflowResult {
  workflow: string;
  success: boolean;
  skipped: boolean;
  reason?: string;
  result?: Record<string, unknown>;
  eventId: string;
  durationMs: number;
}

/**
 * 1. Lead Welcome Flow — sends welcome message + creates timeline event.
 */
export async function runLeadWelcomeFlow(leadId: string): Promise<WorkflowResult> {
  const start = Date.now();
  const workflow = "lead_welcome";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) {
    return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "lead_not_found",
      riskLevel: "LOW", success: false, errorMessage: "Lead not found",
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: false, skipped: false, reason: "not_found", eventId: ev.id, durationMs: Date.now() - start };
  }

  if (lead.welcomeSent) {
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "welcome_already_sent",
      riskLevel: "LOW", success: true, result: { skipped: "already_sent" },
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: true, skipped: true, reason: "already_sent", eventId: ev.id, durationMs: Date.now() - start };
  }

  // Mark welcome sent + create timeline event
  await db.lead.update({ where: { id: leadId }, data: { welcomeSent: true, status: lead.status === "NEW" ? "CONTACTED" : lead.status } });
  await writeTimeline({
    leadId,
    type: "LEAD_CREATED",
    title: "Welcome message dispatched",
    description: `Automated welcome sent to ${lead.fullName}.`,
    meta: { workflow, source: lead.source },
  });
  await incrementMetric("lead_intake", "automated");

  const ev = await logAutomationEvent({
    workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "lead.created",
    actor: "system", targetType: "Lead", targetId: leadId, action: "welcome_sent",
    riskLevel: "LOW", success: true, result: { welcomeSent: true },
    idempotencyKey: stableIdempotencyKey(workflow, leadId),
  });
  return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start };
}

/**
 * 2. Lead Scoring — invokes crm-automation.scoreLead.
 */
export async function runLeadScoring(leadId: string): Promise<WorkflowResult & { score?: number; tier?: string }> {
  const start = Date.now();
  const workflow = "lead_scoring";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const res = await scoreLead(leadId);
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "scored",
      riskLevel: "LOW", success: true, result: { score: res.score, tier: res.tier, reasons: res.reasons },
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    await writeTimeline({
      leadId, type: "AI_ACTION", title: "Lead scored",
      description: `Score ${res.score} (${res.tier})`,
      meta: { workflow, score: res.score, tier: res.tier },
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, score: res.score, tier: res.tier };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "scoring_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 3. Counselor Assignment — invokes crm-automation.autoAssignCounselor.
 */
export async function runCounselorAssignment(leadId: string): Promise<WorkflowResult & { counselorId?: string | null }> {
  const start = Date.now();
  const workflow = "counselor_assignment";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const res = await autoAssignCounselor(leadId);
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "counselor_assigned",
      riskLevel: "LOW", success: true, result: { counselorId: res.counselorId, reason: res.reason },
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, counselorId: res.counselorId };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "assignment_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 4. Follow-up Task Creation — invokes crm-automation.createFollowUpTask.
 */
export async function runFollowUpTaskCreation(leadId: string, days: number = 1): Promise<WorkflowResult> {
  const start = Date.now();
  const workflow = "follow_up_task";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    await createFollowUpTask(leadId, days);
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "Lead", targetId: leadId, action: "follow_up_scheduled",
      riskLevel: "LOW", success: true, result: { daysFromNow: days },
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    await writeTimeline({
      leadId, type: "NOTE", title: "Follow-up scheduled",
      description: `Auto follow-up in ${days} day(s).`,
      meta: { workflow, days },
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "Lead", targetId: leadId, action: "follow_up_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 5. SLA Tracking — scans SlaEvent rows past their SLA window and escalates.
 */
export async function runSlaTracking(): Promise<WorkflowResult & { checked?: number; escalated?: number }> {
  const start = Date.now();
  const workflow = "sla_tracking";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const now = new Date();
    const overdue = await db.slaEvent.findMany({
      where: {
        status: { in: ["UNREAD", "PENDING"] },
        receivedAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) }, // 30+ min ago
      },
      take: 200,
    });

    let escalated = 0;
    for (const e of overdue) {
      const minutesSince = Math.floor((now.getTime() - e.receivedAt.getTime()) / 60000);
      let newStatus = e.status;
      if (minutesSince >= 50) newStatus = "ESCALATED_50";
      else if (minutesSince >= 40) newStatus = "ESCALATED_40";

      if (newStatus !== e.status) {
        await db.slaEvent.update({
          where: { id: e.id },
          data: { status: newStatus, escalatedAt: now },
        });
        escalated++;

        // Create EscalationEvent
        try {
          await db.escalationEvent.create({
            data: {
              type: minutesSince >= 50 ? "SLA_URGENT" : "SLA_WARNING",
              level: minutesSince >= 50 ? 2 : 1,
              slaEventId: e.id,
              studentId: e.studentId,
              counselorId: e.counselorId,
              message: `SLA ${minutesSince}min overdue on ${e.channel} (event ${e.id})`,
              status: "OPEN",
            },
          });
        } catch {}
      }
    }

    await incrementMetric("communication", "automated");
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "SlaEvent", action: "sla_scan_complete",
      riskLevel: "MEDIUM", success: true,
      result: { checked: overdue.length, escalated },
      idempotencyKey: stableIdempotencyKey(workflow, "sla", now.toISOString().slice(0, 13)),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, checked: overdue.length, escalated };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "SlaEvent", action: "sla_scan_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, "sla", String(Date.now())),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 6. Missing Data Detection — scans a student (or all students) for profile gaps.
 */
export async function runMissingDataDetection(studentId?: string): Promise<WorkflowResult & { missingFields?: string[] }> {
  const start = Date.now();
  const workflow = "missing_data_detection";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const where = studentId ? { id: studentId } : { status: "ACTIVE" };
    const students = await db.student.findMany({
      where,
      select: {
        id: true, fullName: true, mobile: true, email: true,
        dateOfBirth: true, gender: true, hasPassport: true, passportNumber: true,
        educationHistory: true, englishTests: true, studyDestination: true,
        programTitle: true, profileCompletion: true,
      },
      take: studentId ? 1 : 100,
    });

    let totalMissing = 0;
    for (const s of students) {
      const missing: string[] = [];
      if (!s.dateOfBirth) missing.push("dateOfBirth");
      if (!s.gender) missing.push("gender");
      if (!s.hasPassport || !s.passportNumber) missing.push("passport");
      const edu = JSON.parse(s.educationHistory || "[]");
      if (!Array.isArray(edu) || edu.length === 0) missing.push("educationHistory");
      const eng = JSON.parse(s.englishTests || "[]");
      if (!Array.isArray(eng) || eng.length === 0) missing.push("englishTests");
      if (!s.studyDestination) missing.push("studyDestination");
      if (!s.programTitle) missing.push("programTitle");

      totalMissing += missing.length;

      if (missing.length > 0) {
        await writeTimeline({
          studentId: s.id, type: "PROFILE_UPDATED", title: "Missing profile fields detected",
          description: `Missing: ${missing.join(", ")}`,
          meta: { workflow, missing },
        });
      }
    }

    await incrementMetric("data_entry", "automated");
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: studentId ? "Student" : "Student[]",
      targetId: studentId, action: "missing_data_scanned",
      riskLevel: "LOW", success: true, result: { studentsScanned: students.length, totalMissing },
      idempotencyKey: stableIdempotencyKey(workflow, studentId || "all"),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, missingFields: [] };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "Student", targetId: studentId,
      action: "missing_data_failed", riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, studentId || "all"),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 7. Deadline Reminders — scans ApplicationDeadline rows approaching due date.
 */
export async function runDeadlineReminders(): Promise<WorkflowResult & { sent?: number }> {
  const start = Date.now();
  const workflow = "deadline_reminders";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days

    const deadlines = await db.applicationDeadline.findMany({
      where: { deadlineDate: { gte: now.toISOString().slice(0, 10), lte: soon.toISOString().slice(0, 10) } },
      take: 100,
    });

    let sent = 0;
    for (const d of deadlines) {
      try {
        await db.notificationEngine.create({
          data: {
            recipientType: "STUDENT",
            channel: "IN_APP",
            title: "Application deadline approaching",
            message: `Deadline for application ${d.applicationId || "(unknown)"} on ${d.deadlineDate}`,
            category: "DEADLINE",
            priority: "HIGH",
            actionUrl: "/student/dashboard",
          },
        });
        sent++;
      } catch {}
    }

    await incrementMetric("deadline_tracking", "automated");
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "ApplicationDeadline", action: "reminders_sent",
      riskLevel: "LOW", success: true, result: { total: deadlines.length, sent },
      idempotencyKey: stableIdempotencyKey(workflow, "all", now.toISOString().slice(0, 10)),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, sent };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "ApplicationDeadline", action: "reminders_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, "all", String(Date.now())),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 8. Automated Notifications — fan out queued NotificationEngine rows.
 */
export async function runAutomatedNotifications(): Promise<WorkflowResult & { sent?: number }> {
  const start = Date.now();
  const workflow = "automated_notifications";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const pending = await db.notificationEngine.findMany({
      where: { sentAt: null },
      take: 100,
    });

    let sent = 0;
    for (const n of pending) {
      try {
        await db.notificationEngine.update({
          where: { id: n.id },
          data: { sentAt: new Date() },
        });
        sent++;
      } catch {}
    }

    await incrementMetric("communication", "automated");
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "NotificationEngine", action: "notifications_sent",
      riskLevel: "LOW", success: true, result: { sent, total: pending.length },
      idempotencyKey: stableIdempotencyKey(workflow, "all", new Date().toISOString().slice(0, 13)),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, sent };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "NotificationEngine", action: "notifications_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, "all", String(Date.now())),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 9. Report Generation — creates WeeklyReport row.
 */
export async function runReportGeneration(): Promise<WorkflowResult & { reportId?: string }> {
  const start = Date.now();
  const workflow = "report_generation";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)}`;

    const [leads, students, apps, visas] = await Promise.all([
      db.lead.count({ where: { createdAt: { gte: weekStart } } }),
      db.student.count({ where: { createdAt: { gte: weekStart } } }),
      db.application.count({ where: { createdAt: { gte: weekStart } } }),
      db.visaCase.count({ where: { createdAt: { gte: weekStart } } }),
    ]);

    const report = await db.weeklyReport.create({
      data: {
        type: "BRANCH",
        periodStart: weekStart.toISOString().slice(0, 10),
        periodEnd: now.toISOString().slice(0, 10),
        summary: JSON.stringify({ leads, students, apps, visas, generatedAt: now.toISOString() }),
        insights: `Auto-generated — ${leads} leads, ${students} students, ${apps} apps, ${visas} visas`,
        status: "GENERATED",
      },
    }).catch(() => null);

    await incrementMetric("reporting", "automated");
    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "WeeklyReport", action: "report_generated",
      riskLevel: "LOW", success: true, result: { leads, students, apps, visas, reportId: report?.id },
      idempotencyKey: stableIdempotencyKey(workflow, weekKey),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, reportId: report?.id };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "scheduler",
      actor: "system", targetType: "WeeklyReport", action: "report_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, "all", String(Date.now())),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

/**
 * 10. Lead Tagging — auto-tag leads by source / preferred country.
 */
export async function runLeadTagging(leadId: string): Promise<WorkflowResult & { tags?: string[] }> {
  const start = Date.now();
  const workflow = "lead_tagging";
  const { paused } = await checkPauseAndLog(workflow);
  if (paused) return { workflow, success: false, skipped: true, reason: "global_pause", eventId: "", durationMs: Date.now() - start };

  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      const ev = await logAutomationEvent({
        workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "lead.created",
        actor: "system", targetType: "Lead", targetId: leadId, action: "lead_not_found",
        riskLevel: "LOW", success: false, errorMessage: "Lead not found",
        idempotencyKey: stableIdempotencyKey(workflow, leadId),
      });
      return { workflow, success: false, skipped: false, reason: "not_found", eventId: ev.id, durationMs: Date.now() - start };
    }

    const tags: string[] = [];
    if (lead.source) tags.push(`source:${lead.source}`);
    if (lead.preferredCountry) tags.push(`country:${lead.preferredCountry}`);
    if (lead.preferredLevel) tags.push(`level:${lead.preferredLevel}`);
    if (lead.leadTier) tags.push(`tier:${lead.leadTier}`);
    if (lead.priority && lead.priority !== "NORMAL") tags.push(`priority:${lead.priority}`);

    await writeTimeline({
      leadId, type: "NOTE", title: "Lead auto-tagged",
      description: `Tags: ${tags.join(", ")}`,
      meta: { workflow, tags },
    });
    await incrementMetric("lead_qualification", "automated");

    const ev = await logAutomationEvent({
      workflow, category: "ELIGIBLE_ROUTINE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "tagged",
      riskLevel: "LOW", success: true, result: { tags },
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: true, skipped: false, eventId: ev.id, durationMs: Date.now() - start, tags };
  } catch (err: any) {
    const ev = await logAutomationEvent({
      workflow, category: "INELIGIBLE", mode: "AUTOMATED", trigger: "lead.created",
      actor: "system", targetType: "Lead", targetId: leadId, action: "tagging_failed",
      riskLevel: "MEDIUM", success: false, errorMessage: err?.message,
      idempotencyKey: stableIdempotencyKey(workflow, leadId),
    });
    return { workflow, success: false, skipped: false, reason: err?.message, eventId: ev.id, durationMs: Date.now() - start };
  }
}

// ─── Human-required Action Logger ──────────────────────────────

export interface HumanRequiredActionParams {
  workflow: string;
  targetType: string;
  targetId?: string;
  action: string;
  reason: string;
  riskLevel?: RiskLevel;
  suggestedAssignee?: string;
  meta?: Record<string, unknown>;
}

/**
 * Log an action that requires human intervention (creates a CommunicationTask +
 * AutomationEvent with category=HUMAN_REQUIRED).
 */
export async function logHumanRequiredAction(params: HumanRequiredActionParams): Promise<{ taskId: string; eventId: string }> {
  // Create a CommunicationTask for human pickup
  const task = await db.communicationTask.create({
    data: {
      title: `[HR-required] ${params.workflow}: ${params.action}`,
      description: params.reason,
      studentId: params.targetType === "Student" ? params.targetId : undefined,
      applicationId: params.targetType === "Application" ? params.targetId : undefined,
      assignedTo: params.suggestedAssignee,
      priority: params.riskLevel === "CRITICAL" ? "URGENT" : params.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      source: "AI_CLASSIFICATION",
    },
  }).catch(() => null);

  const ev = await logAutomationEvent({
    workflow: params.workflow,
    category: "HUMAN_REQUIRED",
    mode: "HUMAN",
    trigger: "automation.escalation",
    actor: "system",
    targetType: params.targetType,
    targetId: params.targetId,
    action: params.action,
    riskLevel: params.riskLevel || "MEDIUM",
    success: true,
    result: { reason: params.reason, taskId: task?.id, suggestedAssignee: params.suggestedAssignee, meta: params.meta },
    idempotencyKey: stableIdempotencyKey(params.workflow, params.targetId || "none", String(Date.now())),
  });

  return { taskId: task?.id || "", eventId: ev.id };
}

// ─── Unified Stats ─────────────────────────────────────────────

export interface UnifiedAutomationStats {
  total: number;
  automated: number;
  aiAssisted: number;
  human: number;
  escalated: number;
  failed: number;
  automationRate: number;       // round(automated / (automated+human+escalated) * 100)
  byWorkflow: Array<{ workflow: string; total: number; automated: number; successRate: number }>;
  byCategory: Record<string, number>;
  last24h: number;
}

/**
 * Aggregate automation stats across all AuditLog-backed AutomationEvent rows.
 *
 * automationRate = round(automated / (automated + human + escalated) * 100)
 */
export async function getUnifiedAutomationStats(): Promise<UnifiedAutomationStats> {
  const rows = await db.auditLog.findMany({
    where: { resource: AUTOMATION_RESOURCE, action: AUTOMATION_ACTION },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  const parsed: AutomationEventRecord[] = rows.map(auditLogToRecord).filter((r) => r && r.workflow);

  const counts = {
    total: parsed.length,
    automated: 0,
    aiAssisted: 0,
    human: 0,
    escalated: 0,
    failed: 0,
  };
  const byWorkflowMap = new Map<string, { total: number; automated: number; success: number }>();
  const byCategory: Record<string, number> = {};

  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  let last24h = 0;

  for (const r of parsed) {
    if (r.mode === "AUTOMATED") counts.automated++;
    else if (r.mode === "AI_ASSISTED") counts.aiAssisted++;
    else if (r.mode === "HUMAN") counts.human++;
    else if (r.mode === "ESCALATED") counts.escalated++;
    if (!r.success) counts.failed++;

    byCategory[r.category] = (byCategory[r.category] || 0) + 1;

    const w = byWorkflowMap.get(r.workflow) || { total: 0, automated: 0, success: 0 };
    w.total++;
    if (r.mode === "AUTOMATED") w.automated++;
    if (r.success) w.success++;
    byWorkflowMap.set(r.workflow, w);

    if (r.createdAt.getTime() > cutoff24h) last24h++;
  }

  const denom = counts.automated + counts.human + counts.escalated;
  const automationRate = denom > 0 ? Math.round((counts.automated / denom) * 100) : 0;

  const byWorkflow = Array.from(byWorkflowMap.entries()).map(([workflow, v]) => ({
    workflow,
    total: v.total,
    automated: v.automated,
    successRate: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
  }));

  return { ...counts, automationRate, byWorkflow, byCategory, last24h };
}

// ─── Scheduler ─────────────────────────────────────────────────

/**
 * Run all scheduled workflows (intended to be called by a cron / queue worker).
 * Each workflow is independent — failures don't block siblings.
 */
export async function runAllSchedulerWorkflows(): Promise<Array<WorkflowResult>> {
  const results: WorkflowResult[] = [];

  // Global workflows
  results.push(await runSlaTracking().catch((e) => ({ workflow: "sla_tracking", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
  results.push(await runMissingDataDetection().catch((e) => ({ workflow: "missing_data_detection", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
  results.push(await runDeadlineReminders().catch((e) => ({ workflow: "deadline_reminders", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
  results.push(await runAutomatedNotifications().catch((e) => ({ workflow: "automated_notifications", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
  results.push(await runReportGeneration().catch((e) => ({ workflow: "report_generation", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));

  // Per-lead workflows for new leads created in the last hour
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const newLeads = await db.lead.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { id: true },
      take: 50,
    });
    for (const lead of newLeads) {
      results.push(await runLeadWelcomeFlow(lead.id).catch((e) => ({ workflow: "lead_welcome", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
      results.push(await runLeadScoring(lead.id).catch((e) => ({ workflow: "lead_scoring", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
      results.push(await runCounselorAssignment(lead.id).catch((e) => ({ workflow: "counselor_assignment", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
      results.push(await runFollowUpTaskCreation(lead.id, 1).catch((e) => ({ workflow: "follow_up_task", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
      results.push(await runLeadTagging(lead.id).catch((e) => ({ workflow: "lead_tagging", success: false, skipped: false, reason: e?.message, eventId: "", durationMs: 0 })));
    }
  } catch {}

  return results;
}
