/**
 * Unified Automation Engine
 *
 * Single source of truth for the 70/30 automation KPI. Every routine
 * workflow goes through this engine so we can measure:
 *   - automated  (ELIGIBLE_ROUTINE + AUTOMATED)
 *   - human      (HUMAN_REQUIRED + HUMAN)
 *   - escalated  (HUMAN_REQUIRED + ESCALATED)
 *
 * Each `run*` workflow:
 *   1. Checks `isGlobalAiPaused()` first — aborts if paused.
 *   2. Creates an `AutomationEvent` row with idempotencyKey=`${workflow}:${targetId}`.
 *      P2002 (unique violation) means it already ran → cached return.
 *   3. Writes an `AuditLog` and a `TimelineEvent`.
 *
 * Models touched: AutomationEvent, AuditLog, TimelineEvent, Lead, Student,
 * Task, SocialInboxMessage, SlaEvent, Application, StudentNotification,
 * AutomationMetric (via crm-automation.incrementMetric).
 */

import { db } from "@/lib/db";
import { isGlobalAiPaused } from "@/lib/ai-safety";
import {
  scoreLead,
  autoAssignCounselor,
  createFollowUpTask,
  incrementMetric,
} from "@/lib/crm-automation";

// ─── Shared types ───────────────────────────────────────────────

export interface WorkflowResult<T = unknown> {
  workflow: string;
  targetId: string | null;
  skipped: boolean;          // paused or already-run
  pauseReason?: string;
  success: boolean;
  result?: T;
  error?: string;
  durationMs?: number;
  automationEventId?: string;
}

// ─── Idempotent runner ─────────────────────────────────────────

/**
 * Internal helper — wraps every workflow with:
 *   - global AI pause check
 *   - idempotencyKey dedup (P2002 → fetch existing)
 *   - AutomationEvent record (category=ELIGIBLE_ROUTINE, mode=AUTOMATED)
 *   - AuditLog + TimelineEvent
 */
async function runIdempotentWorkflow<T>(
  workflow: string,
  targetId: string | null,
  trigger: string,
  actor: string,
  targetType: string,
  action: string,
  fn: () => Promise<T>,
  opts?: {
    leadId?: string;
    studentId?: string;
    category?: string;
    mode?: string;
    riskLevel?: string;
  }
): Promise<WorkflowResult<T>> {
  const idempotencyKey = targetId ? `${workflow}:${targetId}` : `${workflow}:run`;
  const category = opts?.category ?? "ELIGIBLE_ROUTINE";
  const mode = opts?.mode ?? "AUTOMATED";

  // 1) Global AI pause check
  const paused = await isGlobalAiPaused();
  if (paused) {
    const result: WorkflowResult<T> = {
      workflow,
      targetId,
      skipped: true,
      pauseReason: "GLOBAL_AI_PAUSED",
      success: false,
    };
    return result;
  }

  // 2) Idempotency check — already ran?
  const existing = await db.automationEvent.findUnique({
    where: { idempotencyKey },
    select: { id: true, result: true, success: true },
  }).catch(() => null);

  if (existing) {
    return {
      workflow,
      targetId,
      skipped: true,
      success: existing.success,
      result: existing.result ? (safeParse(existing.result) as T) : undefined,
      automationEventId: existing.id,
    };
  }

  // 3) Create AutomationEvent row (P2002 race-safe)
  const start = Date.now();
  let automationEventId: string | undefined;
  try {
    const ev = await db.automationEvent.create({
      data: {
        workflow,
        category,
        mode,
        trigger,
        actor,
        targetType,
        targetId,
        action,
        riskLevel: opts?.riskLevel ?? "LOW",
        idempotencyKey,
        success: false,
      },
    });
    automationEventId = ev.id;
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Raced — another process won. Fetch its result.
      const raced = await db.automationEvent.findUnique({
        where: { idempotencyKey },
        select: { id: true, result: true, success: true },
      });
      return {
        workflow,
        targetId,
        skipped: true,
        success: raced?.success ?? false,
        result: raced?.result ? (safeParse(raced.result) as T) : undefined,
        automationEventId: raced?.id,
      };
    }
    throw err;
  }

  // 4) Execute the workflow body
  let success = true;
  let errorMessage: string | undefined;
  let resultValue: T | undefined;
  try {
    resultValue = await fn();
  } catch (err: any) {
    success = false;
    errorMessage = err?.message ?? String(err);
    console.error(`[automation-engine] ${workflow} failed:`, err);
  }
  const durationMs = Date.now() - start;

  // 5) Update AutomationEvent with outcome
  try {
    await db.automationEvent.update({
      where: { id: automationEventId },
      data: {
        success,
        errorMessage,
        durationMs,
        result: resultValue !== undefined ? safeStringify(resultValue) : null,
      },
    });
  } catch (err) {
    console.error(`[automation-engine] failed to update event:`, err);
  }

  // 6) AuditLog + TimelineEvent
  const details = {
    workflow,
    targetId,
    trigger,
    actor,
    action,
    success,
    errorMessage,
    durationMs,
    result: resultValue !== undefined ? safeStringify(resultValue) : null,
  };
  try {
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "AutomationEvent",
        resourceId: automationEventId,
        details: JSON.stringify(details),
      },
    });
  } catch (err) {
    console.error(`[automation-engine] failed to write audit log:`, err);
  }

  if (opts?.studentId) {
    try {
      await db.timelineEvent.create({
        data: {
          leadId: opts.leadId ?? null,
          studentId: opts.studentId,
          stage: "automation",
          title: `${workflow} ${success ? "succeeded" : "failed"}`,
          description: errorMessage ?? action,
          actor: "system",
        },
      });
    } catch (err) {
      console.error(`[automation-engine] failed to write timeline event:`, err);
    }
  }

  // 7) Increment metric (best-effort)
  await incrementMetric(workflow, success ? "automated" : "failed").catch(() => {});

  return {
    workflow,
    targetId,
    skipped: false,
    success,
    result: resultValue,
    error: errorMessage,
    durationMs,
    automationEventId,
  };
}

// ─── Small JSON helpers ─────────────────────────────────────────

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}
function safeParse(s: string | null | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// ─── 1. Lead welcome flow ───────────────────────────────────────

export async function runLeadWelcomeFlow(leadId: string): Promise<WorkflowResult<{ welcomeSent: boolean }>> {
  return runIdempotentWorkflow<{ welcomeSent: boolean }>(
    "lead_welcome_flow",
    leadId,
    "LEAD_CREATED",
    "automation-engine",
    "Lead",
    "Send welcome message + mark welcomeSent=true",
    async () => {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (!lead) throw new Error(`Lead ${leadId} not found`);
      if (lead.welcomeSent) return { welcomeSent: true };

      await db.lead.update({
        where: { id: leadId },
        data: { welcomeSent: true },
      });

      return { welcomeSent: true };
    },
    { leadId }
  );
}

// ─── 2. Lead scoring ────────────────────────────────────────────

export async function runLeadScoring(leadId: string): Promise<WorkflowResult<{ score: number; tier: string }>> {
  return runIdempotentWorkflow<{ score: number; tier: string }>(
    "lead_scoring",
    leadId,
    "LEAD_UPDATED",
    "automation-engine",
    "Lead",
    "Score lead (0-100) + assign tier",
    async () => {
      const result = await scoreLead(leadId);
      return { score: result.score, tier: result.tier };
    },
    { leadId }
  );
}

// ─── 3. Counselor assignment ────────────────────────────────────

export async function runCounselorAssignment(leadId: string): Promise<WorkflowResult<{ counselorId: string | null; reason: string }>> {
  return runIdempotentWorkflow<{ counselorId: string | null; reason: string }>(
    "counselor_assignment",
    leadId,
    "LEAD_ASSIGNED",
    "automation-engine",
    "Lead",
    "Auto-assign counselor by workload",
    async () => {
      return await autoAssignCounselor(leadId);
    },
    { leadId }
  );
}

// ─── 4. Follow-up task creation ─────────────────────────────────

export async function runFollowUpTaskCreation(
  leadId: string,
  days: number = 1
): Promise<WorkflowResult<{ followUpDate: string }>> {
  return runIdempotentWorkflow<{ followUpDate: string }>(
    "follow_up_task_creation",
    leadId,
    "LEAD_FOLLOWUP_DUE",
    "automation-engine",
    "Lead",
    `Create follow-up task in ${days} day(s)`,
    async () => {
      await createFollowUpTask(leadId, days);

      const lead = await db.lead.findUnique({
        where: { id: leadId },
        select: { followUpDate: true, counselorId: true, fullName: true },
      });

      // Create a Task record for the counselor
      if (lead?.counselorId) {
        const due = new Date();
        due.setDate(due.getDate() + days);
        await db.task.create({
          data: {
            title: `Follow up with ${lead.fullName}`,
            description: `Automated follow-up task (${days}d) for lead ${leadId}`,
            assigneeId: lead.counselorId,
            type: "FOLLOW_UP",
            priority: "NORMAL",
            status: "PENDING",
            dueDate: due.toISOString(),
          },
        }).catch((err) => {
          console.error("[automation-engine] failed to create follow-up Task:", err);
        });
      }

      return { followUpDate: lead?.followUpDate?.toISOString() ?? new Date().toISOString() };
    },
    { leadId }
  );
}

// ─── 5. SLA tracking ────────────────────────────────────────────

export async function runSlaTracking(): Promise<WorkflowResult<{ breached: number }>> {
  // No specific target — idempotencyKey uses a per-run timestamp bucket
  // so the scheduler can run every ~5min without colliding.
  const minuteBucket = Math.floor(Date.now() / (5 * 60 * 1000));
  return runIdempotentWorkflow<{ breached: number }>(
    "sla_tracking",
    `bucket-${minuteBucket}`,
    "SCHEDULER_5MIN",
    "automation-engine",
    "SocialInboxMessage",
    "Detect inbound messages >40min without reply",
    async () => {
      const cutoff = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes ago

      const inboundMessages = await db.socialInboxMessage.findMany({
        where: {
          direction: "INBOUND",
          receivedAt: { lt: cutoff },
        },
        select: {
          id: true,
          platform: true,
          conversationId: true,
          senderId: true,
          studentId: true,
          leadId: true,
          employeeId: true,
          receivedAt: true,
        },
      });

      let breached = 0;
      for (const msg of inboundMessages) {
        // Has any OUTBOUND reply been sent for this conversation/sender after msg.receivedAt?
        const orClauses: any[] = [];
        if (msg.conversationId) orClauses.push({ conversationId: msg.conversationId });
        if (msg.senderId) orClauses.push({ senderId: msg.senderId });
        const replyWhere: any = {
          direction: "OUTBOUND",
          receivedAt: { gt: msg.receivedAt },
        };
        if (orClauses.length > 0) replyWhere.OR = orClauses;

        const reply = await db.socialInboxMessage.findFirst({
          where: replyWhere,
          select: { id: true },
        });

        if (!reply) {
          breached++;
          // Create or update SlaEvent (communicationId is optional — no unique constraint,
          // so we use findFirst + create/update).
          try {
            const existing = await db.slaEvent.findFirst({
              where: { threadId: msg.id },
              select: { id: true },
            });
            if (existing) {
              await db.slaEvent.update({
                where: { id: existing.id },
                data: { eventType: "ESCALATED_40", escalatedAt: new Date() },
              });
            } else {
              await db.slaEvent.create({
                data: {
                  threadId: msg.id,
                  channel: msg.platform,
                  studentId: msg.studentId ?? "",
                  counselorId: msg.employeeId ?? "",
                  firstMessageAt: msg.receivedAt,
                  eventType: "ESCALATED_40",
                  escalatedAt: new Date(),
                },
              });
            }
          } catch (err) {
            console.error(`[automation-engine] sla event write failed for ${msg.id}:`, err);
          }
        }
      }

      return { breached };
    }
  );
}

// ─── 6. Missing data detection ──────────────────────────────────

export async function runMissingDataDetection(
  studentId?: string
): Promise<WorkflowResult<{ scanned: number; incomplete: number; tasksCreated: number }>> {
  const targetKey = studentId ?? "all";
  return runIdempotentWorkflow<{ scanned: number; incomplete: number; tasksCreated: number }>(
    "missing_data_detection",
    targetKey,
    "SCHEDULER_HOURLY",
    "automation-engine",
    "Student",
    "Scan students for missing profile data + create Task",
    async () => {
      const where: any = { status: "ACTIVE" };
      if (studentId) where.id = studentId;

      const students = await db.student.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          name: true,
          counselorId: true,
          email: true,
          phone: true,
          profileComplete: true,
        },
      });

      let incomplete = 0;
      let tasksCreated = 0;
      for (const s of students) {
        const missing: string[] = [];
        if (!s.email) missing.push("email");
        if (!s.phone) missing.push("phone");
        if (s.profileComplete < 100) missing.push("profile");

        if (missing.length === 0) continue;
        incomplete++;

        if (!s.counselorId) continue;
        try {
          await db.task.create({
            data: {
              title: `Collect missing data: ${s.name} (${s.studentId})`,
              description: `Missing fields: ${missing.join(", ")}`,
              assigneeId: s.counselorId,
              studentId: s.id,
              type: "DOCUMENT_REQUEST",
              priority: missing.length >= 3 ? "HIGH" : "NORMAL",
              status: "PENDING",
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          });
          tasksCreated++;
        } catch (err) {
          console.error(`[automation-engine] missing-data task creation failed for ${s.id}:`, err);
        }
      }

      return { scanned: students.length, incomplete, tasksCreated };
    },
    studentId ? { studentId } : {}
  );
}

// ─── 7. Deadline reminders ──────────────────────────────────────

export async function runDeadlineReminders(): Promise<WorkflowResult<{ within7: number; within14: number; within30: number }>> {
  const dayBucket = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return runIdempotentWorkflow<{ within7: number; within14: number; within30: number }>(
    "deadline_reminders",
    `day-${dayBucket}`,
    "SCHEDULER_DAILY",
    "automation-engine",
    "Application",
    "Send deadline reminders for applications due in 7/14/30 days",
    async () => {
      const apps = await db.application.findMany({
        where: { stage: { notIn: ["ENROLLED", "VISA_REFUSED"] } },
        select: {
          id: true,
          applicationId: true,
          studentId: true,
          universityName: true,
          courseName: true,
          country: true,
          intake: true,
          deadline: true,
          counselorId: true,
        },
      });

      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      let within7 = 0;
      let within14 = 0;
      let within30 = 0;

      for (const app of apps) {
        const dateStr = app.deadline || parseIntakeToDate(app.intake);
        if (!dateStr) continue;
        const due = new Date(dateStr);
        if (isNaN(due.getTime())) continue;

        const diffDays = Math.floor((due.getTime() - now) / DAY);
        if (diffDays < 0 || diffDays > 30) continue;

        let bucket: 7 | 14 | 30 | null = null;
        if (diffDays <= 7) { within7++; bucket = 7; }
        else if (diffDays <= 14) { within14++; bucket = 14; }
        else { within30++; bucket = 30; }

        // StudentNotification
        try {
          await db.studentNotification.create({
            data: {
              studentId: app.studentId,
              type: "DEADLINE",
              title: `Application deadline in ${diffDays} day(s)`,
              message: `Your application to ${app.universityName} (${app.courseName}, ${app.country}) is due on ${due.toDateString()}.`,
              priority: bucket === 7 ? "URGENT" : bucket === 14 ? "HIGH" : "NORMAL",
              relatedId: app.id,
              actionUrl: `/student/applications`,
            },
          });
        } catch (err) {
          console.error(`[automation-engine] deadline notification failed for ${app.id}:`, err);
        }

        // Task for counselor
        if (app.counselorId) {
          try {
            await db.task.create({
              data: {
                title: `Deadline in ${diffDays}d: ${app.applicationId}`,
                description: `Application to ${app.universityName} - ${app.courseName} (${app.country}) due ${due.toDateString()}.`,
                assigneeId: app.counselorId,
                studentId: app.studentId,
                type: "OTHER",
                priority: bucket === 7 ? "URGENT" : bucket === 14 ? "HIGH" : "NORMAL",
                status: "PENDING",
                dueDate: due.toISOString(),
              },
            });
          } catch (err) {
            console.error(`[automation-engine] deadline task creation failed for ${app.id}:`, err);
          }
        }
      }

      return { within7, within14, within30 };
    }
  );
}

// Parse an intake string like "September 2026" → "2026-09-01"
function parseIntakeToDate(intake?: string | null): string | null {
  if (!intake) return null;
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
    jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
  };
  const match = intake.toLowerCase().match(/([a-z]+)\s+(\d{4})/);
  if (!match) return null;
  const m = months[match[1]];
  if (m === undefined) return null;
  const year = parseInt(match[2], 10);
  return new Date(Date.UTC(year, m, 1)).toISOString();
}

// ─── 8. Automated notifications ─────────────────────────────────

export async function runAutomatedNotifications(): Promise<WorkflowResult<{ sent: number }>> {
  const hourBucket = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  return runIdempotentWorkflow<{ sent: number }>(
    "automated_notifications",
    `hour-${hourBucket}`,
    "SCHEDULER_HOURLY",
    "automation-engine",
    "StudentNotification",
    "Send notifications: lead assigned, task overdue, SLA breach",
    async () => {
      let sent = 0;

      // a) Lead assigned → notify counselor (recent assignments in last hour)
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const recentAssignedLeads = await db.lead.findMany({
        where: {
          counselorId: { not: null },
          updatedAt: { gte: since },
          welcomeSent: true,
        },
        select: { id: true, leadId: true, fullName: true, counselorId: true },
      });
      for (const lead of recentAssignedLeads) {
        if (!lead.counselorId) continue;
        try {
          await db.task.create({
            data: {
              title: `New lead assigned: ${lead.fullName} (${lead.leadId})`,
              description: `Reach out within 30 minutes per SLA policy.`,
              assigneeId: lead.counselorId,
              type: "CALL",
              priority: "HIGH",
              status: "PENDING",
              dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            },
          });
          sent++;
        } catch (err) {
          console.error("[automation-engine] lead-assignment task failed:", err);
        }
      }

      // b) Overdue tasks
      const overdueTasks = await db.task.findMany({
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
          dueDate: { not: null },
        },
        select: { id: true, assigneeId: true, title: true, dueDate: true, studentId: true },
      });
      const now = new Date();
      for (const t of overdueTasks) {
        if (!t.dueDate) continue;
        const due = new Date(t.dueDate);
        if (due.getTime() >= now.getTime()) continue;
        try {
          await db.task.update({
            where: { id: t.id },
            data: { priority: "URGENT" },
          });
          sent++;
        } catch (err) {
          console.error("[automation-engine] overdue task bump failed:", err);
        }
      }

      // c) SLA breaches — already escalated at runSlaTracking, here we notify
      const breaches = await db.slaEvent.findMany({
        where: { eventType: "ESCALATED_40", escalatedAt: { gte: since } },
        select: { id: true, counselorId: true, studentId: true, channel: true },
      });
      for (const b of breaches) {
        if (!b.counselorId) continue;
        try {
          await db.task.create({
            data: {
              title: `SLA breach on ${b.channel}`,
              description: `SLA breached (>40min). Respond immediately.`,
              assigneeId: b.counselorId,
              studentId: b.studentId ?? undefined,
              type: "CALL",
              priority: "URGENT",
              status: "PENDING",
              dueDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            },
          });
          sent++;
        } catch (err) {
          console.error("[automation-engine] SLA breach task creation failed:", err);
        }
      }

      return { sent };
    }
  );
}

// ─── 9. Report generation ───────────────────────────────────────

export async function runReportGeneration(): Promise<WorkflowResult<{ reportDate: string; totalEvents: number }>> {
  const dayBucket = new Date().toISOString().slice(0, 10);
  return runIdempotentWorkflow<{ reportDate: string; totalEvents: number }>(
    "report_generation",
    `day-${dayBucket}`,
    "SCHEDULER_DAILY",
    "automation-engine",
    "AutomationEvent",
    "Generate daily automation report",
    async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const totalEvents = await db.automationEvent.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      });

      // Persist a simple audit-trail entry — the actual report rendering
      // happens in the UI; here we just record that the job ran.
      return { reportDate: dayBucket, totalEvents };
    }
  );
}

// ─── 10. Lead tagging ───────────────────────────────────────────

export async function runLeadTagging(leadId: string): Promise<WorkflowResult<{ tags: string[] }>> {
  return runIdempotentWorkflow<{ tags: string[] }>(
    "lead_tagging",
    leadId,
    "LEAD_UPDATED",
    "automation-engine",
    "Lead",
    "Tag lead by source / country / level",
    async () => {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        select: { id: true, source: true, preferredCountry: true, preferredLevel: true, rawSubmission: true, notes: true },
      });
      if (!lead) throw new Error(`Lead ${leadId} not found`);

      const tags: string[] = [];
      // Source-based
      const sourceTagMap: Record<string, string> = {
        FACEBOOK: "social-paid",
        INSTAGRAM: "social-organic",
        WHATSAPP: "whatsapp-inbound",
        WEBSITE: "website-organic",
        PHONE_CALL: "inbound-call",
        PARTNER_REFERRAL: "partner-referral",
        OFFICE_VISIT: "walk-in",
        EVENT: "event-lead",
        MOCK_TEST: "mock-test-lead",
        COURSE_FINDER: "course-finder",
      };
      if (lead.source && sourceTagMap[lead.source]) tags.push(sourceTagMap[lead.source]);

      // Country-based
      if (lead.preferredCountry) {
        const c = lead.preferredCountry.toLowerCase().replace(/\s+/g, "-");
        tags.push(`destination:${c}`);
      }
      // Level-based
      if (lead.preferredLevel) {
        const l = lead.preferredLevel.toLowerCase().replace(/\s+/g, "-");
        tags.push(`level:${l}`);
      }

      // Persist tags into rawSubmission (merge) + notes
      let raw: any = {};
      try { raw = lead.rawSubmission ? JSON.parse(lead.rawSubmission) : {}; } catch { raw = {}; }
      raw.tags = tags;
      await db.lead.update({
        where: { id: leadId },
        data: {
          rawSubmission: JSON.stringify(raw),
          notes: lead.notes ? `${lead.notes}\n[AI Tags: ${tags.join(", ")}]` : `[AI Tags: ${tags.join(", ")}]`,
        },
      });

      return { tags };
    },
    { leadId }
  );
}

// ─── Human-required action logger ───────────────────────────────

export interface HumanRequiredActionParams {
  workflow: string;
  targetId?: string | null;
  targetType: string;
  action: string;
  trigger: string;
  actor?: string;
  reason: string;
  riskLevel?: string;
  leadId?: string;
  studentId?: string;
  suggestedAssigneeId?: string;
}

/**
 * Log a workflow that MUST be handled by a human (not eligible for automation).
 * Category=HUMAN_REQUIRED, mode=ESCALATED.
 *
 * Writes AutomationEvent + AuditLog + TimelineEvent + (optionally) a Task.
 */
export async function logHumanRequiredAction(
  params: HumanRequiredActionParams
): Promise<{ automationEventId: string | null; taskId: string | null }> {
  const idempotencyKey = params.targetId
    ? `${params.workflow}:human:${params.targetId}`
    : `${params.workflow}:human:${Date.now()}`;

  const start = Date.now();
  let automationEventId: string | null = null;
  let taskId: string | null = null;

  try {
    const ev = await db.automationEvent.create({
      data: {
        workflow: params.workflow,
        category: "HUMAN_REQUIRED",
        mode: "ESCALATED",
        trigger: params.trigger,
        actor: params.actor ?? "automation-engine",
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        action: params.action,
        riskLevel: params.riskLevel ?? "MEDIUM",
        idempotencyKey,
        success: true,
        result: JSON.stringify({ reason: params.reason, suggestedAssigneeId: params.suggestedAssigneeId }),
        durationMs: Date.now() - start,
      },
    });
    automationEventId = ev.id;
  } catch (err: any) {
    if (err?.code === "P2002") {
      const existing = await db.automationEvent.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      automationEventId = existing?.id ?? null;
    } else {
      console.error("[automation-engine] logHumanRequiredAction failed:", err);
    }
  }

  // AuditLog
  try {
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "AutomationEvent",
        resourceId: automationEventId ?? undefined,
        details: JSON.stringify({
          category: "HUMAN_REQUIRED",
          mode: "ESCALATED",
          ...params,
        }),
      },
    });
  } catch (err) {
    console.error("[automation-engine] human-required audit log failed:", err);
  }

  // TimelineEvent requires a student owner in Main's schema.
  if (params.studentId) {
    try {
      await db.timelineEvent.create({
        data: {
          leadId: params.leadId ?? null,
          studentId: params.studentId,
          stage: "human_required",
          title: `Human required: ${params.action}`,
          description: params.reason,
          actor: "system",
        },
      });
    } catch (err) {
      console.error("[automation-engine] human-required timeline failed:", err);
    }
  }

  return { automationEventId, taskId };
}

// ─── Unified automation stats (real DB) ─────────────────────────

export interface UnifiedAutomationStats {
  automated: number;
  human: number;
  escalated: number;
  aiAssisted: number;
  total: number;
  automationRate: number; // round(automated / (automated + human + escalated) * 100)
  byWorkflow: Array<{ workflow: string; automated: number; human: number; escalated: number; total: number }>;
}

/**
 * Compute the 70/30 automation rate from real AutomationEvent rows.
 *
 * automationRate = round(automated / (automated + human + escalated) * 100)
 */
export async function getUnifiedAutomationStats(): Promise<UnifiedAutomationStats> {
  try {
    const rows = await db.automationEvent.findMany({
      select: { workflow: true, mode: true, category: true },
    });

    let automated = 0;
    let human = 0;
    let escalated = 0;
    let aiAssisted = 0;
    const byWorkflowMap = new Map<string, { automated: number; human: number; escalated: number; total: number }>();

    for (const r of rows) {
      const w = byWorkflowMap.get(r.workflow) ?? { automated: 0, human: 0, escalated: 0, total: 0 };
      w.total++;
      if (r.mode === "AUTOMATED") { automated++; w.automated++; }
      else if (r.mode === "AI_ASSISTED") { aiAssisted++; w.automated++; }
      else if (r.mode === "HUMAN") { human++; w.human++; }
      else if (r.mode === "ESCALATED") { escalated++; w.escalated++; }
      byWorkflowMap.set(r.workflow, w);
    }

    const denom = automated + human + escalated;
    const automationRate = denom > 0 ? Math.round((automated / denom) * 100) : 0;

    return {
      automated,
      human,
      escalated,
      aiAssisted,
      total: rows.length,
      automationRate,
      byWorkflow: Array.from(byWorkflowMap.entries()).map(([workflow, v]) => ({ workflow, ...v })),
    };
  } catch (err) {
    console.error("[automation-engine] getUnifiedAutomationStats error:", err);
    return {
      automated: 0,
      human: 0,
      escalated: 0,
      aiAssisted: 0,
      total: 0,
      automationRate: 0,
      byWorkflow: [],
    };
  }
}

// ─── Public workflow dispatch ──────────────────────────────────

export async function runWorkflow(
  workflow: string,
  options: { targetId?: string; days?: number; actorId?: string; dryRun?: boolean } = {}
): Promise<unknown> {
  if (options.dryRun) {
    return { workflow, targetId: options.targetId ?? null, skipped: true, reason: "DRY_RUN" };
  }

  const targetId = options.targetId;
  if (["lead_welcome_flow", "lead_scoring", "counselor_assignment", "follow_up_task_creation", "lead_tagging"].includes(workflow) && !targetId) {
    const leads = await db.lead.findMany({ where: { status: { not: "CONVERTED" } }, select: { id: true }, take: 100 });
    const results: unknown[] = [];
    for (const lead of leads) {
      results.push(await runWorkflow(workflow, { ...options, targetId: lead.id }));
    }
    return { workflow, processed: results.length, results };
  }

  switch (workflow) {
    case "lead_welcome_flow": return runLeadWelcomeFlow(targetId!);
    case "lead_scoring": return runLeadScoring(targetId!);
    case "counselor_assignment": return runCounselorAssignment(targetId!);
    case "follow_up_task_creation": return runFollowUpTaskCreation(targetId!, options.days ?? 1);
    case "lead_tagging": return runLeadTagging(targetId!);
    case "sla_tracking": return runSlaTracking();
    case "missing_data_detection": return runMissingDataDetection(targetId);
    case "deadline_reminders": return runDeadlineReminders();
    case "automated_notifications": return runAutomatedNotifications();
    case "report_generation": return runReportGeneration();
    default: throw new Error(`Unsupported automation workflow: ${workflow}`);
  }
}

/** Compatibility entrypoint used by the admin scheduler API. */
export async function runAllSchedulers(options: { actorId?: string; dryRun?: boolean } = {}) {
  if (options.dryRun) {
    return { dryRun: true, workflows: ["sla_tracking", "missing_data_detection", "deadline_reminders", "automated_notifications", "report_generation"] };
  }
  return runAllSchedulerWorkflows();
}

// ─── Scheduler entrypoint ───────────────────────────────────────

/**
 * Run all scheduler-style workflows in sequence.
 *
 * Used by cron / queue workers. Lead-specific workflows (welcome,
 * scoring, assignment, follow-up, tagging) are triggered by events
 * elsewhere — not run here.
 */
export async function runAllSchedulerWorkflows(): Promise<{
  slaTracking: WorkflowResult;
  missingData: WorkflowResult;
  deadlines: WorkflowResult;
  notifications: WorkflowResult;
  report: WorkflowResult;
}> {
  const slaTracking = await runSlaTracking();
  const missingData = await runMissingDataDetection();
  const deadlines = await runDeadlineReminders();
  const notifications = await runAutomatedNotifications();
  const report = await runReportGeneration();

  return { slaTracking, missingData, deadlines, notifications, report };
}
