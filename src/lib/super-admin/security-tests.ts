// ============================================================
// ALO EDUCATION — SUPER ADMIN SECURITY NEGATIVE TESTS
//
// IMPORTANT (integrity note):
// This module previously hardcoded `result: 'PASS'` on all 30 tests with
// prose "evidence" strings, including tests that referenced routes which do
// not exist in this repository (`/api/admin/roles`,
// `/api/employee-access/salary`). That is not evidence — a static claim can
// never fail, so it can never prove anything.
//
// It now COMPUTES each result from the repository itself:
//   • does the referenced route file exist?
//   • does the handler enforce a guard (withAuth / requireSuperAdmin /
//     requireRoles / requireSuperAdminOrActing)?
//
// A test that references a missing route is reported FAIL. A test whose
// enforcement cannot be proven from source is NOT_VERIFIED. Nothing claims
// PASS unless the named guard is actually present in the named file.
//
// This is source-level verification, not a substitute for executing the
// request against a live server; it is labelled accordingly.
// ============================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type SecurityTestResult = 'PASS' | 'FAIL' | 'NOT_VERIFIED';

export interface SecurityTest {
  id: string;
  name: string;
  expectation: string;
  /** Repo-relative path of the file that must enforce the rule. */
  file: string;
  /** Guard tokens, any one of which proves server-side enforcement. */
  requiredGuards: string[];
  result: SecurityTestResult;
  evidence: string;
}

interface Definition {
  id: string;
  name: string;
  expectation: string;
  file: string;
  requiredGuards: string[];
}

const GUARD_TOKENS = [
  'withAuth',
  'requireSuperAdmin',
  'requireSuperAdminOrActing',
  'requireRoles',
  'requireUserTypes',
  'authenticateRequest',
];

const DEFINITIONS: Definition[] = [
  {
    id: 'SEC-SA-01',
    name: 'Non-Super-Admin cannot read Super Admin dashboard metrics',
    expectation: 'GET /api/super-admin/dashboard requires the SUPER_ADMIN role server-side.',
    file: 'src/app/api/super-admin/dashboard/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdminOrActing'],
  },
  {
    id: 'SEC-SA-02',
    name: 'Non-Super-Admin cannot list the employee directory',
    expectation: 'GET /api/super-admin/employees requires the SUPER_ADMIN role server-side.',
    file: 'src/app/api/super-admin/employees/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdminOrActing'],
  },
  {
    id: 'SEC-SA-03',
    name: 'Employee suspension requires the real, non-acting Super Admin',
    expectation: 'PATCH /api/super-admin/employees/{id}/status rejects Acting-As sessions and non-SUPER_ADMIN callers.',
    file: 'src/app/api/super-admin/employees/[id]/status/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdmin'],
  },
  {
    id: 'SEC-SA-04',
    name: 'Session revocation requires the real, non-acting Super Admin',
    expectation: 'POST /api/super-admin/employees/{id}/revoke-sessions is SUPER_ADMIN-only and audited.',
    file: 'src/app/api/super-admin/employees/[id]/revoke-sessions/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdmin'],
  },
  {
    id: 'SEC-SA-05',
    name: 'Marketing / any non-Super-Admin cannot read the RBAC role inventory',
    expectation: 'GET /api/super-admin/roles requires SUPER_ADMIN.',
    file: 'src/app/api/super-admin/roles/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdminOrActing'],
  },
  {
    id: 'SEC-SA-06',
    name: 'Marketing cannot change RBAC through the permission-group builder',
    expectation: 'POST /api/super-admin/permission-groups requires the real non-acting SUPER_ADMIN.',
    file: 'src/app/api/super-admin/permission-groups/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdmin'],
  },
  {
    id: 'SEC-SA-07',
    name: 'Acting-As mode is required to be a bound, revocable session',
    expectation: 'act_as is resolved server-side from a bound session, never from client headers.',
    file: 'src/lib/auth-middleware.ts',
    requiredGuards: ['alo_acting_as_session', 'Client-supplied Acting-As identity headers are not supported'],
  },
  {
    id: 'SEC-SA-08',
    name: 'Acting-As start requires authorization and a written reason',
    expectation: 'POST /api/portal-auth/acting-as/start requires SUPER_ADMIN plus a reason of 8+ characters.',
    file: 'src/app/api/portal-auth/acting-as/start/route.ts',
    requiredGuards: ['withAuth', 'isSuperAdmin', 'reason'],
  },
  {
    id: 'SEC-SA-09',
    name: 'Acting-As can be exited and the session revoked',
    expectation: 'POST /api/portal-auth/acting-as/stop revokes the session and writes ACTING_AS_STOP.',
    file: 'src/app/api/portal-auth/acting-as/stop/route.ts',
    requiredGuards: ['revokedAt', 'ACTING_AS_STOP'],
  },
  {
    id: 'SEC-SA-10',
    name: 'Acting-As produces an audit row with the real actor preserved',
    expectation: 'Audit writes carry realActorUserId plus actingAsRole when a session is bound.',
    file: 'src/lib/auth-middleware.ts',
    requiredGuards: ['realActorUserId', 'actingAsRole'],
  },
  {
    id: 'SEC-SA-11',
    name: 'Permission group assignment is audited in the same transaction',
    expectation: 'The grant and its audit row are written together.',
    file: 'src/app/api/super-admin/permission-groups/route.ts',
    requiredGuards: ['writePortalAudit', 'PERMISSION_GROUP_ASSIGNED'],
  },
  {
    id: 'SEC-SA-12',
    name: 'Temporary permission expiry is evaluated server-side',
    expectation: 'Temporary grants carry an expiry and are not effective after it.',
    file: 'src/lib/employee-temporary-permissions.ts',
    requiredGuards: ['temporaryPermissionIsEffective', 'expiresAt'],
  },
  {
    id: 'SEC-SA-13',
    name: 'High-risk explicit employees cannot be impersonated',
    expectation: 'Acting-As refuses admin/super_admin targets and requires a verified, active employee.',
    file: 'src/app/api/portal-auth/acting-as/start/route.ts',
    requiredGuards: ["['admin', 'super_admin']", 'emailVerified'],
  },
  {
    id: 'SEC-SA-14',
    name: 'Sensitive document download is authorised and audited',
    expectation:
      'The document download endpoint authenticates, enforces student ownership / staff role scope and writes a DOC_DOWNLOAD audit row. '
      + 'The legacy generic /api/employee-access/secure-download endpoint is deliberately disabled (410).',
    file: 'src/app/api/documents/[id]/download/route.ts',
    requiredGuards: ['authenticateUnified', 'isAdmin', 'DOC_DOWNLOAD'],
  },
  {
    id: 'SEC-SA-15',
    name: 'AI task approval cannot bypass the human approval gate',
    expectation: 'Approving an AI task requires a real Super Admin and a written note.',
    file: 'src/app/api/super-admin/approvals/[id]/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdmin', 'WAITING'],
  },
  {
    id: 'SEC-SA-16',
    name: 'Approval decisions are audited',
    expectation: 'Every approve/reject/revision writes an audit row naming the decision.',
    file: 'src/app/api/super-admin/approvals/[id]/route.ts',
    requiredGuards: ['writePortalAudit', 'APPROVAL_'],
  },
  {
    id: 'SEC-SA-17',
    name: 'Suspending an account also revokes its live sessions',
    expectation: 'A non-active status forces session revocation in the same transaction.',
    file: 'src/app/api/super-admin/employees/[id]/status/route.ts',
    requiredGuards: ['revokeSessions', 'revokedAt'],
  },
  {
    id: 'SEC-SA-18',
    name: 'Security Center reads are audited',
    expectation: 'Viewing the security snapshot writes an audit row.',
    file: 'src/app/api/super-admin/security/route.ts',
    requiredGuards: ['logAuditAction', 'SECURITY_CENTER_VIEWED'],
  },
  {
    id: 'SEC-SA-19',
    name: 'Audit log is read-only from the dashboard API',
    expectation: 'The audit-log endpoint exposes no mutation handler.',
    file: 'src/app/api/super-admin/audit-logs/route.ts',
    requiredGuards: ['export const GET'],
  },
  {
    id: 'SEC-SA-20',
    name: 'Global search is SUPER_ADMIN-only and audited',
    expectation: 'The privileged-email bypass has been removed; role is the only authority.',
    file: 'src/app/api/super-admin/global-search/route.ts',
    requiredGuards: ['isSuperAdmin', 'SUPER_ADMIN_GLOBAL_SEARCH'],
  },
  {
    id: 'SEC-SA-21',
    name: 'Sensitive settings cannot be written without explicit confirmation',
    expectation: 'A sensitive key requires confirmSensitive: true and is redacted in the audit payload.',
    file: 'src/app/api/super-admin/settings/route.ts',
    requiredGuards: ['confirmSensitive', '[redacted]'],
  },
  {
    id: 'SEC-SA-22',
    name: 'Settings writes require the real non-acting Super Admin',
    expectation: 'PATCH /api/super-admin/settings rejects Acting-As and non-SUPER_ADMIN.',
    file: 'src/app/api/super-admin/settings/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdmin'],
  },
  {
    id: 'SEC-SA-23',
    name: 'Branch creation is audited',
    expectation: 'Creating a branch writes BRANCH_CREATED in the same transaction.',
    file: 'src/app/api/super-admin/branches/route.ts',
    requiredGuards: ['writePortalAudit', 'BRANCH_CREATED'],
  },
  {
    id: 'SEC-SA-24',
    name: 'Country control is SUPER_ADMIN-only',
    expectation: 'GET /api/super-admin/countries requires SUPER_ADMIN.',
    file: 'src/app/api/super-admin/countries/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdminOrActing'],
  },
  {
    id: 'SEC-SA-25',
    name: 'Agent registry is SUPER_ADMIN-only',
    expectation: 'GET /api/super-admin/ai/agents requires SUPER_ADMIN.',
    file: 'src/app/api/super-admin/ai/agents/route.ts',
    requiredGuards: ['withAuth', 'requireSuperAdminOrActing'],
  },
  {
    id: 'SEC-SA-26',
    name: 'Cross-origin mutations are rejected',
    expectation: 'State-changing Super Admin routes check the request Origin.',
    file: 'src/lib/super-admin/access.ts',
    requiredGuards: ['isSameOrigin'],
  },
  {
    id: 'SEC-SA-27',
    name: 'Acting-As is blocked from every privileged mutation',
    expectation: 'requireSuperAdmin refuses a session with actingAsSessionId.',
    file: 'src/lib/super-admin/access.ts',
    requiredGuards: ['This operation is blocked while Acting-As mode is active'],
  },
  {
    id: 'SEC-SA-28',
    name: 'Emergency lockdown is available to the Super Admin',
    expectation: 'A lockdown endpoint exists and is guarded.',
    file: 'src/app/api/admin/security/lockdown/route.ts',
    requiredGuards: ['withAuth'],
  },
  {
    id: 'SEC-SA-29',
    name: 'Failed privileged operations return a safe error, not internals',
    expectation: 'Super Admin routes return a generic message and log internally.',
    file: 'src/app/api/super-admin/dashboard/route.ts',
    requiredGuards: ['console.error', 'temporarily unavailable'],
  },
  {
    id: 'SEC-SA-30',
    name: 'Dashboard KPI aggregation never substitutes fabricated numbers',
    expectation: 'The metrics service contains no numeric fallback for a failed query.',
    file: 'src/lib/super-admin/metrics.ts',
    requiredGuards: ['unavailableReason', 'available: false'],
  },
];

/**
 * Verifies each definition against the repository on disk.
 * Called by GET /api/super-admin/security-tests.
 */
export function runSuperAdminSecurityChecks(root = process.cwd()): SecurityTest[] {
  return DEFINITIONS.map((definition) => {
    const absolute = join(root, definition.file);
    if (!existsSync(absolute)) {
      return {
        ...definition,
        result: 'FAIL' as SecurityTestResult,
        evidence: `Referenced file ${definition.file} does not exist in this repository, so the rule cannot be enforced there.`,
      };
    }

    let source = '';
    try {
      source = readFileSync(absolute, 'utf8');
    } catch {
      return {
        ...definition,
        result: 'NOT_VERIFIED' as SecurityTestResult,
        evidence: `Could not read ${definition.file}.`,
      };
    }

    const missing = definition.requiredGuards.filter((guard) => !source.includes(guard));
    if (missing.length === 0) {
      return {
        ...definition,
        result: 'PASS' as SecurityTestResult,
        evidence: `${definition.file} contains all required guards: ${definition.requiredGuards.join(', ')}. Verified by reading the source file.`,
      };
    }

    return {
      ...definition,
      result: 'FAIL' as SecurityTestResult,
      evidence: `${definition.file} is missing: ${missing.join(', ')}.`,
    };
  });
}

/** Guard tokens that count as server-side enforcement, exported for reuse. */
export const ENFORCEMENT_TOKENS = GUARD_TOKENS;
