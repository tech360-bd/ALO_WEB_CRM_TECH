// ============================================================
// ALO Education — University & Course Monitoring RBAC Guard
// ============================================================
//
// Why this file exists (audit finding):
// Every route under /api/university-monitoring/* except the index shipped with
// NO authentication at all, and the Super Admin UI hard-coded
// `performedBy: "superadmin@aloedu.com"` into the request body. The combination
// meant any anonymous caller could:
//
//   • POST /trigger                      → start a monitoring run
//   • PATCH /changes/[id] {APPROVE}      → approve a change, mutating the
//                                          production UniversityPage/CoursePage
//                                          rows that feed the public website
//   • PATCH /sources                     → disable monitoring of a source
//   • PATCH /conflicts                   → resolve a data conflict
//   • POST /recheck                      → force outbound re-fetches
//
// …and every one of those actions would be written to the audit log
// attributed to the Super Admin, because the actor came from the request body
// rather than the session.
//
// The spec is explicit:
//   "Only authorized Super Admin users can: Approve, Reject, Force recheck,
//    Modify source configuration, Trigger monitoring, Change monitoring
//    frequency."
//   "Employees may: View approved information, Search Knowledge Center,
//    View source, View approved history."
//
// This module is the single enforcement point for both rules. Handlers must
// derive the acting user from the returned AuthContext and must never trust a
// `performedBy` value supplied by the client.

import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';

/** Roles permitted to perform privileged monitoring actions (write/approve). */
const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin'];

/**
 * Roles permitted read access to monitoring/verification data.
 * Deliberately excludes STUDENT and PARTNER: monitoring data contains
 * *pending, unapproved* detected changes, which the spec forbids showing to
 * students ("AI must never present unapproved detected changes as confirmed
 * facts to students").
 */
const STAFF_ROLES = [
  'SUPER_ADMIN', 'super_admin',
  'ADMIN', 'admin',
  'EMPLOYEE', 'employee',
  'COUNSELOR', 'counselor',
  'MANAGER', 'manager',
  'STAFF', 'staff',
];

/** User types that must never reach monitoring endpoints. */
const DENIED_USER_TYPES = ['STUDENT', 'student', 'PARTNER', 'partner'];

function hasAnyRole(auth: AuthContext, allowed: string[]): boolean {
  if (allowed.includes(auth.userType)) return true;
  return auth.roles.some((r) => allowed.includes(r));
}

/**
 * Resolve the session, failing CLOSED on any error.
 *
 * `authenticateRequest` falls back to NextAuth's `getServerSession` when no
 * portal cookie/bearer token is present, and that call throws if it cannot
 * read request headers (outside a request scope, or a NextAuth
 * misconfiguration). An exception escaping the guard would surface as a 500
 * — which is noisy, but worse, any future `catch` around the handler that
 * treats errors as non-fatal would silently skip the authorization check.
 * Converting a failure into an explicit 401 keeps the deny path unambiguous.
 */
async function resolveSession(req: Request): Promise<AuthContext | NextResponse> {
  try {
    return await authenticateRequest(req);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please login.' },
      { status: 401 },
    );
  }
}

export interface MonitoringActor {
  /** Resolved User.id — safe to store in AuditLog.userId / DataChange.reviewedBy. */
  userId: string;
  email: string;
  name: string;
  userType: string;
  auth: AuthContext;
}

function toActor(auth: AuthContext): MonitoringActor {
  return {
    // Prefer the real actor (handles "acting as" impersonation correctly:
    // the audit trail must record who actually clicked, not the assumed role).
    userId: auth.actorUserId || auth.userId,
    email: auth.actorEmail || auth.email,
    name: auth.actorName || auth.name,
    userType: auth.userType,
    auth,
  };
}

export type MonitoringAuthResult =
  | { ok: true; actor: MonitoringActor }
  | { ok: false; response: NextResponse };

/**
 * Super-Admin-only guard for privileged monitoring actions:
 * approve or reject a detected change, request a recheck, trigger a run,
 * register/modify sources, resolve conflicts, and change monitoring frequency.
 */
export async function authorizeMonitoringAdmin(req: Request): Promise<MonitoringAuthResult> {
  const session = await resolveSession(req);
  if (session instanceof NextResponse) {
    return { ok: false, response: session };
  }

  if (!hasAnyRole(session, SUPER_ADMIN_ROLES)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            'Super Admin privileges are required for this action. ' +
            'Approving, rejecting, rechecking, triggering monitoring runs and ' +
            'modifying source configuration are restricted to Super Admin users.',
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, actor: toActor(session) };
}

/**
 * Staff read guard for monitoring dashboards, queues, logs, runs and sources.
 * Students and partners are rejected — the queue exposes unapproved data.
 */
export async function authorizeMonitoringViewer(req: Request): Promise<MonitoringAuthResult> {
  const session = await resolveSession(req);
  if (session instanceof NextResponse) {
    return { ok: false, response: session };
  }

  if (DENIED_USER_TYPES.includes(session.userType) || !hasAnyRole(session, STAFF_ROLES)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            'Insufficient access level. Monitoring data includes unapproved ' +
            'detected changes and is restricted to authorized staff.',
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, actor: toActor(session) };
}

/**
 * Convenience wrappers mirroring `requireCron`:
 *
 *   const guard = await requireMonitoringAdmin(req);
 *   if (!guard.ok) return guard.response;
 *   const actor = guard.actor;
 */
export const requireMonitoringAdmin = authorizeMonitoringAdmin;
export const requireMonitoringViewer = authorizeMonitoringViewer;

/**
 * Allow EITHER the scheduler secret (unattended 7-day cron) OR an interactive
 * Super Admin session. Used by the cron entry point so the same run logic can
 * be invoked by the platform scheduler and by a human.
 */
export async function authorizeMonitoringRun(
  req: Request,
): Promise<
  | { ok: true; via: 'secret'; actor: null }
  | { ok: true; via: 'session'; actor: MonitoringActor }
  | { ok: false; response: NextResponse }
> {
  const { verifyCronSecret } = await import('@/lib/cron-auth');
  if (verifyCronSecret(req)) return { ok: true, via: 'secret', actor: null };

  const admin = await authorizeMonitoringAdmin(req);
  if (admin.ok) return { ok: true, via: 'session', actor: admin.actor };
  return { ok: false, response: admin.response };
}
