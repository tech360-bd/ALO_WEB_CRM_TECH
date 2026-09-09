import { db } from '@/lib/db';

interface AuditLogInput {
  userId: string;
  userName?: string;
  role: string;
  actingAsRole?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await db.marketingAuditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName || '',
        role: input.role,
        actingAsRole: input.actingAsRole || '',
        action: input.action,
        resource: input.resource || '',
        resourceId: input.resourceId || '',
        details: JSON.stringify(input.details || {}),
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(limit = 50) {
  return db.marketingAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}