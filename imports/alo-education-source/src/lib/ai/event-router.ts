// Event Router — ALO Education AI Workforce Activation (Phase 7)
// Central event-to-task mapping system. Server-side only.

import { db } from '@/lib/db';
import { priorityToInt } from './types';
import { automationEngine } from './automation-engine';
import type { AutomationClass } from './types';

// ---------------------------------------------------------------------------
// Enums & Interfaces
// ---------------------------------------------------------------------------

export enum EventType {
  NEW_LEAD = 'NEW_LEAD',
  LEAD_UPDATED = 'LEAD_UPDATED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  MISSING_DOCUMENT = 'MISSING_DOCUMENT',
  MARKETING_REQUEST = 'MARKETING_REQUEST',
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',
  REPORT_REQUEST = 'REPORT_REQUEST',
  AGENT_FAILURE = 'AGENT_FAILURE',
  STUDENT_UPDATED = 'STUDENT_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
}

export interface BusinessEvent {
  type: EventType;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  userId?: string;
  timestamp?: Date;
}

export interface AiTaskDefinition {
  taskType: string;
  departmentCode: string;
  agentCode?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  automationClass?: AutomationClass;
  input: Record<string, unknown>;
  description: string;
}

// ---------------------------------------------------------------------------
// EventRouter
// ---------------------------------------------------------------------------

export class EventRouter {
  private handlers = new Map<EventType, (event: BusinessEvent) => AiTaskDefinition[]>();

  constructor() {
    this.registerHandler(EventType.NEW_LEAD, (event) => {
      const { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message } = event.data;
      return [
        {
          taskType: 'lead_classification',
          departmentCode: 'LEAD_CLASSIFY',
          priority: 'high',
          automationClass: 'AI_AUTOMATABLE',
          input: { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message },
          description: 'Classify the incoming lead by intent, quality tier, and urgency.',
        },
        {
          taskType: 'lead_scoring',
          departmentCode: 'LEAD_SCORING',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message },
          description: 'Score the lead based on engagement signals and profile fit.',
        },
        {
          taskType: 'follow_up_draft',
          departmentCode: 'FOLLOWUP_MGMT',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message },
          description: 'Draft a personalised follow-up message for the new lead.',
        },
      ];
    });

    this.registerHandler(EventType.LEAD_UPDATED, (event) => {
      const { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message } = event.data;
      return [
        {
          taskType: 'lead_reclassification',
          departmentCode: 'LEAD_MGMT',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { leadId, fullName, email, phone, source, preferredCountry, preferredCourse, message },
          description: 'Reclassify a lead after its data has been updated.',
        },
      ];
    });

    this.registerHandler(EventType.NEW_MESSAGE, (event) => {
      const { messageId, senderId, body, type } = event.data;
      return [
        {
          taskType: 'message_classification',
          departmentCode: 'CONVO_CLASSIFY',
          priority: 'high',
          automationClass: 'AI_AUTOMATABLE',
          input: { messageId, senderId, body, type },
          description: 'Classify the incoming message by intent and sentiment.',
        },
        {
          taskType: 'response_draft',
          departmentCode: 'CONVO_CLASSIFY',
          priority: 'normal',
          automationClass: 'AI_ASSISTED',
          input: { messageId, senderId, body, type },
          description: 'Draft a suggested reply for the incoming message.',
        },
      ];
    });

    this.registerHandler(EventType.APPLICATION_UPDATED, (event) => {
      const { applicationId, stage, studentName, university, course } = event.data;
      return [
        {
          taskType: 'application_status_analysis',
          departmentCode: 'APP_PROCESSING',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { applicationId, stage, studentName, university, course },
          description: 'Analyse the updated application stage and flag any issues.',
        },
        {
          taskType: 'missing_requirements_check',
          departmentCode: 'APP_PROCESSING',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { applicationId, stage, studentName, university, course },
          description: 'Check for missing or incomplete application requirements.',
        },
      ];
    });

    this.registerHandler(EventType.DOCUMENT_UPLOADED, (event) => {
      const { documentId, category, fileName, studentId, applicationId } = event.data;
      return [
        {
          taskType: 'document_classification',
          departmentCode: 'DOC_PROCESSING',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { documentId, category, fileName, studentId },
          description: 'Classify the uploaded document by type and validity.',
        },
        {
          taskType: 'document_completeness_check',
          departmentCode: 'DOC_PROCESSING',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { documentId, studentId, applicationId },
          description: 'Check whether the uploaded document satisfies all completeness criteria.',
        },
      ];
    });

    this.registerHandler(EventType.MISSING_DOCUMENT, (event) => {
      const { documentId, studentId, applicationId, category } = event.data;
      return [
        {
          taskType: 'missing_document_detection',
          departmentCode: 'DOC_PROCESSING',
          priority: 'high',
          automationClass: 'AI_AUTOMATABLE',
          input: { documentId, studentId, applicationId, category },
          description: 'Detect and report the missing document, suggesting next steps.',
        },
      ];
    });

    this.registerHandler(EventType.MARKETING_REQUEST, (event) => {
      const { requestId, topic, audience, channel, brief } = event.data;
      return [
        {
          taskType: 'content_generation',
          departmentCode: 'CONTENT_PROD',
          priority: 'normal',
          automationClass: 'AI_ASSISTED',
          input: { requestId, topic, audience, channel, brief },
          description: 'Generate marketing content based on the request brief.',
        },
      ];
    });

    this.registerHandler(EventType.SUPPORT_REQUEST, (event) => {
      const { ticketId, subject, description, priority, requesterId } = event.data;
      return [
        {
          taskType: 'ticket_classification',
          departmentCode: 'COMPLAINT',
          priority: 'high',
          automationClass: 'AI_AUTOMATABLE',
          input: { ticketId, subject, description, priority, requesterId },
          description: 'Classify the support ticket by category and urgency.',
        },
        {
          taskType: 'response_draft',
          departmentCode: 'COMPLAINT',
          priority: 'normal',
          automationClass: 'AI_ASSISTED',
          input: { ticketId, subject, description, priority, requesterId },
          description: 'Draft a suggested response for the support ticket.',
        },
      ];
    });

    this.registerHandler(EventType.REPORT_REQUEST, (event) => {
      const { reportType, parameters, requestedBy } = event.data;
      return [
        {
          taskType: 'report_generation',
          departmentCode: 'ANALYTICS_RPT',
          priority: 'low',
          automationClass: 'AI_AUTOMATABLE',
          input: { reportType, parameters, requestedBy },
          description: 'Generate the requested analytics report.',
        },
      ];
    });

    this.registerHandler(EventType.AGENT_FAILURE, (event) => {
      const { taskId, agentId, errorMessage, stackTrace, lastInput } = event.data;
      return [
        {
          taskType: 'failure_analysis',
          departmentCode: 'AI_SYS_OPS',
          priority: 'high',
          automationClass: 'AI_AUTOMATABLE',
          input: { taskId, agentId, errorMessage, stackTrace, lastInput },
          description: 'Analyse the root cause of an AI agent failure and suggest remediation.',
        },
      ];
    });

    this.registerHandler(EventType.STUDENT_UPDATED, (event) => {
      const { studentId, fullName, email, updatedFields } = event.data;
      return [
        {
          taskType: 'profile_analysis',
          departmentCode: 'STUDENT_SUPPORT',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { studentId, fullName, email, updatedFields },
          description: 'Analyse the student profile update for segmentation and engagement impact.',
        },
      ];
    });

    this.registerHandler(EventType.PAYMENT_RECEIVED, (event) => {
      const { paymentId, studentId, amount, currency, applicationId } = event.data;
      return [
        {
          taskType: 'payment_notification',
          departmentCode: 'PAYMENT_PROC',
          priority: 'normal',
          automationClass: 'AI_AUTOMATABLE',
          input: { paymentId, studentId, amount, currency, applicationId },
          description: 'Generate a confirmation and next-steps notification for the received payment.',
        },
      ];
    });
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Route a business event to one or more AI task definitions.
   */
  route(event: BusinessEvent): AiTaskDefinition[] {
    const handler = this.handlers.get(event.type);
    if (!handler) {
      return [];
    }
    return handler(event);
  }

  /**
   * Route a business event, persist AiTask records in the DB, and return
   * the created task IDs.
   */
  async dispatch(event: BusinessEvent): Promise<string[]> {
    const definitions = this.route(event);
    if (definitions.length === 0) return [];

    const taskIds: string[] = [];

    for (const def of definitions) {
      // ── Duplicate protection ───────────────────────────────────
      // Check if a QUEUED or RUNNING task already exists for this
      // same event + taskType + entity (idempotency).
      const existingDupe = await db.aiTask.findFirst({
        where: {
          type: def.taskType,
          status: { in: ['QUEUED', 'RUNNING'] },
          input: { contains: event.entityId },
        },
        select: { id: true },
      });
      if (existingDupe) {
        console.log(
          `[EventRouter] Skipping duplicate: ${event.type} → ${def.taskType} for ${event.entityType}:${event.entityId} (existing ${existingDupe.id})`
        );
        taskIds.push(existingDupe.id);
        continue;
      }

      // Resolve department
      const department = await db.aiDepartment.findFirst({
        where: { code: def.departmentCode },
      });
      if (!department) {
        console.error(`[EventRouter] Department not found for code: ${def.departmentCode}`);
        continue;
      }

      // Find the first ACTIVE or IDLE agent in the department
      const agent = await db.aiAgent.findFirst({
        where: { departmentId: department.id, status: { in: ['ACTIVE', 'IDLE'] } },
      });
      if (!agent) {
        console.error(`[EventRouter] No active agent found in department: ${def.departmentCode}`);
        continue;
      }

      // Evaluate whether approval is required via the automation engine
      const evalResult = def.automationClass
        ? automationEngine.evaluate(def.taskType, def.automationClass)
        : null;
      const requiresApproval = evalResult?.requiresApproval ?? false;

      const task = await db.aiTask.create({
        data: {
          agentId: agent.id,
          departmentId: department.id,
          type: def.taskType,
          priority: priorityToInt(def.priority),
          status: 'QUEUED',
          automationClass: def.automationClass ?? undefined,
          input: JSON.stringify(def.input),
          requiresApproval,
          metadata: JSON.stringify({
            source: 'event_router',
            eventType: event.type,
            entityType: event.entityType,
            entityId: event.entityId,
            timestamp: (event.timestamp ?? new Date()).toISOString(),
            userId: event.userId ?? null,
          }),
        },
      });

      taskIds.push(task.id);
    }

    return taskIds;
  }

  /**
   * Register a custom handler for a given event type.
   */
  registerHandler(
    eventType: EventType,
    handler: (event: BusinessEvent) => AiTaskDefinition[],
  ): void {
    this.handlers.set(eventType, handler);
  }

  /**
   * Return all event types that currently have a registered handler.
   */
  getRegisteredEvents(): EventType[] {
    return Array.from(this.handlers.keys());
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const eventRouter = new EventRouter();
