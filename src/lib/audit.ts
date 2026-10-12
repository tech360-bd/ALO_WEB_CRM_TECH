import { db } from './db';

export async function logAudit(data: {
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  userName?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity || null,
        entityId: data.entityId || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        userId: data.userId || null,
        userName: data.userName || null,
        ip: 'unknown',
        userAgent: 'unknown',
      },
    });
  } catch {
    // Silent fail
  }
}
