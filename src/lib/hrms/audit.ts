// ALO HRMS — Audit log helper (version history, soft delete, activity logs)
import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';

export async function logHrmAudit(params: {
  actor: AuthContext;
  action: string;
  entityType: string;
  entityId: string;
  employeeId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  userAgent?: string;
}) {
  const ip = params.ip || '';
  const ua = params.userAgent || '';
  try {
    // Primary HR audit table
    await db.hrmAuditLog.create({
      data: {
        actorId: params.actor.actorUserId || params.actor.userId,
        actorRole: params.actor.roles?.[0] || params.actor.userType || '',
        action: params.action,
        entityType: params.entityType,
        entityId: String(params.entityId),
        employeeId: String(params.employeeId || params.entityId || ''),
        oldValue: JSON.stringify(params.oldValue || {}).slice(0, 8000),
        newValue: JSON.stringify(params.newValue || {}).slice(0, 8000),
        ipAddress: ip,
        userAgent: ua,
      },
    }).catch(()=>{});
    // Also mirror to legacy EmployeeAuditLog for compatibility
    await (db as any).employeeAuditLog?.create({
      data: {
        actorId: params.actor.actorUserId || params.actor.userId,
        actorRole: params.actor.roles?.[0] || '',
        action: params.action,
        entityType: params.entityType,
        entityId: String(params.entityId),
        employeeId: String(params.employeeId || ''),
        oldValue: JSON.stringify(params.oldValue || {}).slice(0,8000),
        newValue: JSON.stringify(params.newValue || {}).slice(0,8000),
        ipAddress: ip,
        userAgent: ua,
      }
    }).catch(()=>{});
  } catch {}
}

export function diffObjects(before: any, after: any): { before: any; after: any } {
  const b: any = {}; const a: any = {};
  const keys = new Set([...Object.keys(before||{}), ...Object.keys(after||{})]);
  for (const k of keys) {
    if (JSON.stringify((before||{})[k]) !== JSON.stringify((after||{})[k])) {
      b[k] = (before||{})[k]; a[k] = (after||{})[k];
    }
  }
  return { before: b, after: a };
}
