/**
 * n8n Webhook Integration for ALO Education
 * 
 * Sends event webhooks to n8n for workflow automation.
 * Falls back gracefully when N8N_WEBHOOK_URL is not configured.
 * 
 * Usage:
 *   import { triggerWorkflow } from "@/lib/n8n";
 *   await triggerWorkflow("lead.created", { leadId: "ALO-L-10001", name: "John" });
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_AUTH_HEADER = process.env.N8N_AUTH_HEADER;

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  source: string;
  idempotencyKey?: string;
}

// In-memory idempotency tracking (prevents duplicate webhook sends within a window)
const sentWebhooks = new Map<string, number>();
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Trigger an n8n workflow via webhook.
 * 
 * @param event - Event name (e.g., "lead.created", "document.uploaded")
 * @param data - Event payload data
 * @param idempotencyKey - Optional key to prevent duplicate sends
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function triggerWorkflow(
  event: string,
  data: Record<string, unknown>,
  idempotencyKey?: string
): Promise<{ success: boolean; error?: string }> {
  // If n8n is not configured, log and return success (don't block the main operation)
  if (!N8N_WEBHOOK_URL) {
    console.warn(`[n8n] N8N_WEBHOOK_URL not set — event "${event}" not sent`);
    return { success: false, error: "N8N_WEBHOOK_URL not configured" };
  }

  // Check idempotency
  const idKey = idempotencyKey || `${event}:${JSON.stringify(data).slice(0, 100)}`;
  const now = Date.now();
  const lastSent = sentWebhooks.get(idKey);
  if (lastSent && now - lastSent < IDEMPOTENCY_WINDOW_MS) {
    console.log(`[n8n] Duplicate event "${event}" suppressed (idempotency key: ${idKey})`);
    return { success: true };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    source: "alo-education-crm",
    idempotencyKey: idKey,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (N8N_AUTH_HEADER) {
      headers["Authorization"] = `Bearer ${N8N_AUTH_HEADER}`;
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`[n8n] Webhook failed for "${event}": HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    // Track successful send for idempotency
    sentWebhooks.set(idKey, now);

    // Clean up old entries
    for (const [key, timestamp] of sentWebhooks.entries()) {
      if (now - timestamp > IDEMPOTENCY_WINDOW_MS) {
        sentWebhooks.delete(key);
      }
    }

    console.log(`[n8n] Webhook sent: ${event}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[n8n] Webhook error for "${event}":`, message);
    return { success: false, error: message };
  }
}

/**
 * Trigger workflow with retry logic.
 * Retries up to 3 times with exponential backoff.
 */
export async function triggerWorkflowWithRetry(
  event: string,
  data: Record<string, unknown>,
  maxRetries: number = 3
): Promise<{ success: boolean; attempts: number; error?: string }> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await triggerWorkflow(event, data, `${event}-${attempt}`);

    if (result.success) {
      return { success: true, attempts: attempt };
    }

    lastError = result.error;

    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, attempts: maxRetries, error: lastError };
}

// ─── Pre-built event triggers ────────────────────────────────

export const n8nEvents = {
  leadCreated: (leadId: string, leadData: Record<string, unknown>) =>
    triggerWorkflow("lead.created", { leadId, ...leadData }, `lead-${leadId}`),

  leadUpdated: (leadId: string, changes: Record<string, unknown>) =>
    triggerWorkflow("lead.updated", { leadId, changes }),

  studentCreated: (studentId: string, studentData: Record<string, unknown>) =>
    triggerWorkflow("student.created", { studentId, ...studentData }, `student-${studentId}`),

  documentUploaded: (documentId: string, studentId: string, category: string) =>
    triggerWorkflow("document.uploaded", { documentId, studentId, category }),

  documentClassified: (documentId: string, classification: string, confidence: number) =>
    triggerWorkflow("document.classified", { documentId, classification, confidence }),

  applicationCreated: (applicationId: string, studentId: string, university: string, course: string) =>
    triggerWorkflow("application.created", { applicationId, studentId, university, course }),

  applicationUpdated: (applicationId: string, stage: string) =>
    triggerWorkflow("application.updated", { applicationId, stage }),

  visaDeadline: (studentId: string, deadline: string, daysRemaining: number) =>
    triggerWorkflow("visa.deadline", { studentId, deadline, daysRemaining }),

  followUpDue: (leadId: string, scheduledAt: string) =>
    triggerWorkflow("followup.due", { leadId, scheduledAt }),

  appointmentCreated: (appointmentId: string, studentId: string, scheduledAt: string) =>
    triggerWorkflow("appointment.created", { appointmentId, studentId, scheduledAt }),

  paymentCreated: (paymentId: string, studentId: string, amount: number, currency: string) =>
    triggerWorkflow("payment.created", { paymentId, studentId, amount, currency }),

  messageReceived: (messageId: string, channel: string, from: string, studentId?: string) =>
    triggerWorkflow("message.received", { messageId, channel, from, studentId }),

  aiEscalation: (taskId: string, reason: string, crmId: string, priority: string) =>
    triggerWorkflow("ai.escalation", { taskId, reason, crmId, priority }),

  nightShiftStarted: () =>
    triggerWorkflow("nightshift.started", { timestamp: new Date().toISOString() }),

  nightShiftCompleted: (summary: Record<string, unknown>) =>
    triggerWorkflow("nightshift.completed", summary),
};
