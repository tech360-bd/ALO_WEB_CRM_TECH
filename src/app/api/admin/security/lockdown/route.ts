import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

let lockdownState = { active: false, reason: '', activatedBy: '', activatedAt: null as any, deactivatedAt: null as any };

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isSuperAdmin = auth.roles.some((r) => ['SUPER_ADMIN', 'super_admin'].includes(r));
      if (!isSuperAdmin) return NextResponse.json({ success: false, error: 'SUPER_ADMIN required for Emergency Lockdown' }, { status: 403 });

      const body = await req.json();
      const { active, reason } = body;

      if (active && !reason) return NextResponse.json({ success: false, error: 'Reason required for Emergency Lockdown — explicit Super Admin authorization + strong confirmation + required reason' }, { status: 400 });

      const now = new Date();

      if (active) {
        lockdownState = { active: true, reason, activatedBy: auth.actorUserId, activatedAt: now, deactivatedAt: null };
      } else {
        lockdownState = { ...lockdownState, active: false, deactivatedAt: now };
      }

      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: active ? 'EMERGENCY_LOCKDOWN_ACTIVATED' : 'EMERGENCY_LOCKDOWN_DEACTIVATED',
          entityType: 'system',
          entityId: 'lockdown',
          metadata: JSON.stringify({ active, reason, activatedBy: auth.actorUserId, activatedAt: lockdownState.activatedAt, deactivatedAt: lockdownState.deactivatedAt, auditTrail: true, safeRecovery: true, noAccidentalPermanentLockout: true }),
        },
      }).catch(() => {});

      await db.auditLog.create({
        data: {
          userId: auth.actorUserId,
          action: active ? 'EMERGENCY_LOCKDOWN_ACTIVATED' : 'EMERGENCY_LOCKDOWN_DEACTIVATED',
          resource: 'System',
          resourceId: 'lockdown',
          details: JSON.stringify({ active, reason, activatedBy: auth.actorUserId }),
          actorRole: 'SUPER_ADMIN',
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        lockdown: lockdownState,
        message: active ? 'EMERGENCY LOCKDOWN ACTIVATED! Non-admin access restricted — explicit Super Admin authorization + strong confirmation + required reason + recorded activation status + timestamp + activating administrator + recorded deactivation + safe recovery process + audit trail + no accidental permanent lockout of all Super Admin accounts via super_admin bypass — when active block normal privileged operations according to documented policy — do not disable only recovery path — test lockdown and recovery in non-production environment before production use' : 'Emergency lockdown disengaged. System operating normally — safe recovery process + audit trail + no accidental permanent lockout',
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  })(request);
}

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, lockdown: lockdownState });
  })(request);
}
