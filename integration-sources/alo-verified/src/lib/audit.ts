import { db } from './db';

export interface AuditLogInput {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string;
  userAgent?: string;
  actingAsUserId?: string;
  actingAsRole?: string;
  reason?: string;
}

/**
 * Write an immutable audit log entry. Never throws — failures are swallowed and logged
 * so that audit logging never blocks a business operation.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        module: input.module,
        recordId: input.recordId ?? null,
        oldData: input.oldData !== undefined ? JSON.stringify(input.oldData) : null,
        newData: input.newData !== undefined ? JSON.stringify(input.newData) : null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write audit log', input.action, err);
  }
}

/**
 * Write an automation run log entry (for n8n/webhook/rule executions).
 */
export async function logAutomationRun(input: {
  ruleName: string;
  triggerEvent: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  message?: string;
  executionMs?: number;
}): Promise<void> {
  try {
    await db.automationRunLog.create({
      data: {
        ruleName: input.ruleName,
        triggerEvent: input.triggerEvent,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        status: input.status ?? 'success',
        message: input.message ?? null,
        executionMs: input.executionMs ?? null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[automation] failed to write run log', input.ruleName, err);
  }
}
