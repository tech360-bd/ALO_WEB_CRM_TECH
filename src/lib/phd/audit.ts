import { db } from '@/lib/db';
import type { PhdActor } from './auth';

/**
 * Consequential PhD actions are appended to an immutable audit log. Details are
 * deliberately narrow: ids, field names and decisions — never proposal content,
 * uploaded documents, identity numbers or email bodies.
 */
export interface AuditInput {
  actor: PhdActor | { userId: string; role?: string };
  action: string;
  entityType: string;
  entityId?: string;
  projectId?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
}

export async function recordPhdAudit(input: AuditInput): Promise<void> {
  try {
    const details = input.details
      ? Object.fromEntries(
          Object.entries(input.details)
            .filter(([, value]) => value !== undefined)
            .slice(0, 30)
            .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 300) : value]),
        )
      : {};
    await db.phdAuditLog.create({
      data: {
        actorId: input.actor.userId,
        actorRole: input.actor.role ?? '',
        action: input.action.slice(0, 80),
        entityType: input.entityType.slice(0, 60),
        entityId: (input.entityId ?? '').slice(0, 64),
        projectId: (input.projectId ?? '').slice(0, 64),
        details: JSON.stringify(details),
      },
    });
  } catch (error) {
    // Audit failures must be visible in logs but must not silently discard a
    // completed user action; privileged mutations also check this log via tests.
    console.error('[phd-audit] failed to record audit event', error instanceof Error ? error.message : 'unknown');
  }
}

export async function notifyPhdUser(input: {
  userId: string;
  projectId?: string | null;
  type?: string;
  title: string;
  body: string;
  dueAt?: Date | null;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    await db.phdNotification.create({
      data: {
        userId: input.userId,
        projectId: input.projectId ?? null,
        type: input.type ?? 'REMINDER',
        title: input.title.slice(0, 200),
        body: input.body.slice(0, 4000),
        dueAt: input.dueAt ?? null,
        entityType: input.entityType ?? '',
        entityId: input.entityId ?? '',
        deliveryStatus: 'IN_APP',
      },
    });
  } catch (error) {
    console.error('[phd-notify] failed', error instanceof Error ? error.message : 'unknown');
  }
}
