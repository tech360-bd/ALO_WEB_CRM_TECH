import type { Prisma } from '@prisma/client';
import type { AuthContext } from '@/lib/auth-middleware';

// No global DB fallback and no swallowed failures. Caller must await inside the
// SAME interactive transaction as the business mutation. Do not truncate evidence.
export async function writePortalAudit(
  tx: Prisma.TransactionClient, auth: AuthContext, action: string,
  entityType: string, entityId: string, metadata: Record<string, unknown>, request?: Request,
) {
  if ('$transaction' in tx) throw new Error('Audit requires an interactive transaction client');
  return tx.portalAuditLog.create({ data: {
    actorUserId: auth.actorUserId, action, entityType, entityId,
    metadata: JSON.stringify(auth.actorUserId !== auth.userId ? { ...metadata, actingAsUser: auth.userId } : metadata),
    // Forwarded IP is proxy-asserted, not a verified actor identity.
    ipAddress: request?.headers.get('x-forwarded-for')?.split(',')[0].trim().slice(0, 191) || '',
    userAgent: request?.headers.get('user-agent')?.slice(0, 191) || '',
  } });
}

export async function writeHrmAudit(
  tx: Prisma.TransactionClient, auth: AuthContext, action: string,
  entityType: string, entityId: string, newValue: unknown, request?: Request,
) {
  if ('$transaction' in tx) throw new Error('Audit requires an interactive transaction client');
  const data = {
    actorId: auth.actorUserId || auth.userId, actorRole: auth.roles[0] || auth.userType,
    action, entityType, entityId, employeeId: entityId,
    oldValue: '{}', newValue: JSON.stringify(newValue),
    ipAddress: request?.headers.get('x-forwarded-for')?.split(',')[0].trim().slice(0, 191) || '',
    userAgent: request?.headers.get('user-agent')?.slice(0, 191) || '',
  };
  await tx.hrmAuditLog.create({ data });
  await tx.employeeAuditLog.create({ data });
}
