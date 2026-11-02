// GET  /api/admin/security/lockdown — current emergency lockdown state
// POST /api/admin/security/lockdown — activate (reason required) or lift
//
// The state is persisted in `system_settings` (see src/lib/emergency-lockdown.ts)
// and enforced by the auth middleware, so activating a lockdown really does
// refuse non-Super-Admin API access instead of only writing an audit row.
//
// Safety rules:
//   • activation requires a written reason (10+ characters);
//   • the real, non-acting Super Admin is required (an Acting-As session must
//     never be able to lock, or unlock, the platform);
//   • the Super Admin recovery path is never blocked by a lockdown;
//   • activation and deactivation both write an audit row.

import { NextResponse } from 'next/server';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import {
  readEmergencyLockdown,
  writeEmergencyLockdown,
  type LockdownState,
} from '@/lib/emergency-lockdown';
import { isSameOrigin } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

function isRealSuperAdmin(auth: AuthContext): boolean {
  const superAdmin = auth.userType === 'SUPER_ADMIN'
    || auth.roles.some((role) => role.toLowerCase() === 'super_admin');
  return superAdmin && auth.actorUserId === auth.userId && !auth.actingAsSessionId;
}

async function handleGet(_request: Request, auth: AuthContext) {
  if (!isRealSuperAdmin(auth)) {
    return NextResponse.json(
      { success: false, error: 'SUPER_ADMIN required to read the emergency lockdown state.' },
      { status: 403 },
    );
  }
  const lockdown = await readEmergencyLockdown(true);
  return NextResponse.json({ success: true, lockdown });
}

async function handlePost(request: Request, auth: AuthContext) {
  if (!isRealSuperAdmin(auth)) {
    return NextResponse.json(
      { success: false, error: 'A real, non-acting SUPER_ADMIN is required for Emergency Lockdown.' },
      { status: 403 },
    );
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A valid request body is required.' }, { status: 400 });
  }

  const active = (body as { active?: unknown }).active;
  const reason = typeof (body as { reason?: unknown }).reason === 'string'
    ? ((body as { reason: string }).reason).trim()
    : '';

  if (typeof active !== 'boolean') {
    return NextResponse.json({ success: false, error: '`active` must be a boolean.' }, { status: 400 });
  }
  if (active && reason.length < 10) {
    return NextResponse.json(
      { success: false, error: 'A reason of at least 10 characters is required to activate the lockdown.' },
      { status: 400 },
    );
  }

  const previous = await readEmergencyLockdown(true);
  const now = new Date().toISOString();
  const next: LockdownState = active
    ? {
      active: true,
      reason: reason.slice(0, 500),
      activatedBy: auth.actorUserId,
      activatedAt: now,
      deactivatedAt: previous.deactivatedAt,
    }
    : {
      ...previous,
      active: false,
      deactivatedAt: now,
    };

  try {
    const saved = await writeEmergencyLockdown(next, auth.actorUserId);
    await logAuditAction(
      auth,
      active ? 'EMERGENCY_LOCKDOWN_ACTIVATED' : 'EMERGENCY_LOCKDOWN_DEACTIVATED',
      'System',
      'emergency_lockdown',
      {
        active: saved.active,
        reason: saved.reason,
        previousActive: previous.active,
        activatedAt: saved.activatedAt,
        deactivatedAt: saved.deactivatedAt,
        enforcedBy: 'auth-middleware',
      },
    );

    return NextResponse.json({
      success: true,
      lockdown: saved,
      message: saved.active
        ? 'Emergency lockdown activated. Non-Super-Admin API access is refused until a Super Admin lifts it. The Super Admin recovery path stays open.'
        : 'Emergency lockdown lifted. Normal operations resumed. The deactivation is audited.',
    });
  } catch (error) {
    console.error('[admin/security/lockdown] failed to persist state', error);
    return NextResponse.json(
      { success: false, error: 'The lockdown state could not be saved. Nothing was changed.' },
      { status: 503 },
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
