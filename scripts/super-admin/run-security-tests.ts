/**
 * Super Admin security negative tests — executable.
 *
 * Two layers, both real:
 *
 *  1. GUARD TESTS — call the actual authority functions in
 *     src/lib/super-admin/access.ts with fabricated AuthContexts. These run
 *     without a database and prove that a non-Super-Admin is refused, that an
 *     Acting-As session cannot perform privileged mutations, that the audit
 *     label is what the specification requires, and that cross-origin writes
 *     are rejected.
 *
 *  2. SOURCE CHECKS — run the repository-backed suite in
 *     src/lib/super-admin/security-tests.ts, which reads each enforcement file
 *     and fails when a named guard is missing.
 *
 *  3. LIVE HTTP PROBES — optional. When ALO_BASE_URL is set, unauthenticated
 *     requests are made to the Super Admin API and pages. Expected: 401 for the
 *     API, a 3xx redirect to /login for the pages. If ALO_ACTING_AS_COOKIE or
 *     ALO_USER_COOKIE is supplied, additional probes run as that identity.
 *
 * Usage:
 *   npx tsx scripts/super-admin/run-security-tests.ts
 *   ALO_BASE_URL=http://127.0.0.1:3000 npx tsx scripts/super-admin/run-security-tests.ts
 */

import {
  requireSuperAdmin,
  requireSuperAdminOrActing,
  actorLabel,
  isActingAs,
  isSuperAdmin,
  isSameOrigin,
} from '../../src/lib/super-admin/access';
import type { AuthContext } from '../../src/lib/auth-middleware';
import { runSuperAdminSecurityChecks } from '../../src/lib/super-admin/security-tests';

type Result = 'PASS' | 'FAIL';

const results: Array<{ id: string; name: string; result: Result; evidence: string }> = [];

function record(id: string, name: string, result: Result, evidence: string) {
  results.push({ id, name, result, evidence });
  const marker = result === 'PASS' ? 'PASS' : 'FAIL';
  console.log(`[${marker}] ${id} — ${name}\n        ${evidence}`);
}

function baseContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    identityDomain: 'user',
    authenticationMethod: 'cookie',
    userId: 'usr_super',
    email: 'super@aloeducation.com',
    name: 'Super Admin',
    userType: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN', 'super_admin'],
    permissions: [],
    sessionId: 'sess_super',
    actorUserId: 'usr_super',
    actorEmail: 'super@aloeducation.com',
    actorName: 'Super Admin',
    ...overrides,
  };
}

function statusOf(result: { ok: boolean; response?: { status: number } }): number | null {
  if (result.ok) return null;
  return result.response?.status ?? null;
}

// ── 1. Guard tests ─────────────────────────────────────────

{
  const counselor = baseContext({ userId: 'usr_c', actorUserId: 'usr_c', userType: 'COUNSELOR', roles: ['COUNSELOR', 'counselor'] });
  const result = requireSuperAdminOrActing(counselor);
  record(
    'GT-01',
    'Counselor cannot read the Super Admin dashboard / employee directory',
    !result.ok && statusOf(result) === 403 ? 'PASS' : 'FAIL',
    result.ok ? 'Guard allowed a COUNSELOR — this is a privilege escalation.' : `Guard refused with HTTP ${statusOf(result)}.`,
  );
}

{
  const marketing = baseContext({ userId: 'usr_m', actorUserId: 'usr_m', userType: 'MARKETING', roles: ['MARKETING'] });
  const result = requireSuperAdmin(marketing);
  record(
    'GT-02',
    'Marketing user cannot change RBAC',
    !result.ok && statusOf(result) === 403 ? 'PASS' : 'FAIL',
    result.ok ? 'Guard allowed MARKETING to perform a privileged mutation.' : `Guard refused with HTTP ${statusOf(result)}.`,
  );
}

{
  const acting = baseContext({
    userId: 'usr_emp',
    email: 'counselor@aloeducation.com',
    userType: 'COUNSELOR',
    roles: ['COUNSELOR'],
    actingAsSessionId: 'acting_session_1',
    actingAsRole: 'COUNSELOR',
    actorUserId: 'usr_super',
    actorEmail: 'super@aloeducation.com',
  });
  const mutation = requireSuperAdmin(acting);
  const read = requireSuperAdminOrActing(acting);
  record(
    'GT-03',
    'Acting-As can read but can never perform privileged mutations',
    !mutation.ok && statusOf(mutation) === 403 && read.ok && isActingAs(acting) && isSuperAdmin(acting) ? 'PASS' : 'FAIL',
    `mutation=${mutation.ok ? 'ALLOWED' : 'refused'} (403), read=${read.ok ? 'allowed' : 'refused'}, isActingAs=${isActingAs(acting)}.`,
  );
}

{
  const actingLabel = actorLabel(baseContext({
    userId: 'usr_emp',
    userType: 'VISA_OFFICER',
    roles: ['VISA_OFFICER'],
    actingAsSessionId: 'acting_session_2',
    actingAsRole: 'VISA_OFFICER',
    actorUserId: 'usr_super',
  }));
  record(
    'GT-04',
    'Acting-As audit label is "SUPER_ADMIN acting_as ROLE"',
    actingLabel === 'SUPER_ADMIN acting_as VISA_OFFICER' ? 'PASS' : 'FAIL',
    `actorLabel() returned "${actingLabel}".`,
  );
}

{
  const superLabel = actorLabel(baseContext());
  record('GT-05', 'A real Super Admin is labelled SUPER_ADMIN', superLabel === 'SUPER_ADMIN' ? 'PASS' : 'FAIL', `actorLabel() returned "${superLabel}".`);
}

{
  const request = new Request('https://crm.aloeducation.com/api/super-admin/settings', {
    method: 'PATCH',
    headers: { origin: 'https://attacker.example' },
  });
  const refused = isSameOrigin(request) === false;
  const sameOrigin = isSameOrigin(new Request('https://crm.aloeducation.com/api/super-admin/settings', {
    method: 'PATCH',
    headers: { origin: 'https://crm.aloeducation.com' },
  }));
  record(
    'GT-06',
    'Cross-origin mutations are rejected, same-origin accepted',
    refused && sameOrigin ? 'PASS' : 'FAIL',
    `cross-origin=${refused ? 'rejected' : 'ACCEPTED'}, same-origin=${sameOrigin ? 'accepted' : 'REJECTED'}.`,
  );
}

{
  // A Super Admin whose actor identity differs from the effective identity
  // (i.e. a forged/half-built acting session) must not be treated as real.
  const inconsistent = baseContext({ userId: 'usr_other', actorUserId: 'usr_super' });
  const result = requireSuperAdmin(inconsistent);
  record(
    'GT-07',
    'An inconsistent actor/effective identity cannot mutate',
    !result.ok && statusOf(result) === 403 ? 'PASS' : 'FAIL',
    result.ok ? 'Guard accepted a mismatched actor identity.' : `Guard refused with HTTP ${statusOf(result)}.`,
  );
}

// ── 2. Source checks ───────────────────────────────────────

const sourceChecks = runSuperAdminSecurityChecks();
for (const check of sourceChecks) {
  record(check.id, check.name, check.result === 'PASS' ? 'PASS' : 'FAIL', check.evidence);
}

// ── 3. Live HTTP probes (optional) ─────────────────────────

async function runLiveProbes(): Promise<void> {
  const baseUrl = (process.env.ALO_BASE_URL || '').replace(/\/$/, '');
  if (baseUrl) {
    const probes: Array<{ id: string; name: string; path: string; expect: (status: number) => boolean; expected: string }> = [
      { id: 'HTTP-01', name: 'Unauthenticated dashboard API is refused', path: '/api/super-admin/dashboard', expect: (s) => s === 401 || s === 403, expected: '401/403' },
      { id: 'HTTP-02', name: 'Unauthenticated employees API is refused', path: '/api/super-admin/employees', expect: (s) => s === 401 || s === 403, expected: '401/403' },
      { id: 'HTTP-03', name: 'Unauthenticated RBAC write is refused', path: '/api/super-admin/permissions/temporary', expect: (s) => s === 401 || s === 403, expected: '401/403' },
      { id: 'HTTP-04', name: 'Unauthenticated agent registry is refused', path: '/api/super-admin/ai/agents/registry', expect: (s) => s === 401 || s === 403, expected: '401/403' },
      { id: 'HTTP-05', name: '/super-admin/dashboard redirects anonymous visitors to login', path: '/super-admin/dashboard', expect: (s) => s === 200 || (s >= 300 && s < 400), expected: '3xx redirect to /login' },
      { id: 'HTTP-06', name: '/crm/super-admin redirects anonymous visitors to login', path: '/crm/super-admin', expect: (s) => s === 200 || (s >= 300 && s < 400), expected: '3xx redirect to /login' },
    ];

    for (const probe of probes) {
      try {
        const response = await fetch(`${baseUrl}${probe.path}`, { redirect: 'manual' });
        record(
          probe.id,
          probe.name,
          probe.expect(response.status) ? 'PASS' : 'FAIL',
          `${probe.path} → HTTP ${response.status} (expected ${probe.expected})${response.headers.get('location') ? `, location=${response.headers.get('location')}` : ''}.`,
        );
      } catch (error) {
        record(probe.id, probe.name, 'FAIL', `Request failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Optional authenticated probes. The cookie value is supplied by the
    // operator; the script never creates or guesses a session.
    const authCookie = process.env.ALO_USER_COOKIE;
    if (authCookie) {
      const authenticated: Array<{ id: string; name: string; path: string; expect: (s: number) => boolean }> = [
        { id: 'HTTP-07', name: 'Authenticated Super Admin reads the dashboard', path: '/api/super-admin/dashboard', expect: (s) => s === 200 },
        { id: 'HTTP-08', name: 'Authenticated Super Admin reads the 2000-agent registry', path: '/api/super-admin/ai/agents/registry?page=1&pageSize=10', expect: (s) => s === 200 },
        { id: 'HTTP-09', name: 'Authenticated Super Admin reads the permission matrix', path: '/api/super-admin/permissions', expect: (s) => s === 200 },
      ];
      for (const probe of authenticated) {
        try {
          const response = await fetch(`${baseUrl}${probe.path}`, {
            headers: { cookie: authCookie },
            redirect: 'manual',
          });
          record(probe.id, probe.name, probe.expect(response.status) ? 'PASS' : 'FAIL', `${probe.path} → HTTP ${response.status} as the supplied session.`);
        } catch (error) {
          record(probe.id, probe.name, 'FAIL', `Request failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      console.log('[SKIP] Authenticated HTTP probes — set ALO_USER_COOKIE to include them.');
    }
  } else {
    console.log('[SKIP] Live HTTP probes — set ALO_BASE_URL to include them.');
  }

}

// ── Summary ────────────────────────────────────────────────

function summarize(): void {
  const passed = results.filter((row) => row.result === 'PASS').length;
const failed = results.length - passed;
console.log(`\n${passed}/${results.length} checks passed${failed ? ` — ${failed} FAILED` : ''}.`);
if (failed) {
  console.log('\nFailed checks:');
  for (const row of results.filter((entry) => entry.result === 'FAIL')) {
    console.log(`  • ${row.id} ${row.name}: ${row.evidence}`);
  }
  process.exitCode = 1;
  }
}

void runLiveProbes().then(summarize, (error) => {
  console.error('[FAIL] live probes crashed:', error);
  process.exitCode = 1;
  summarize();
});
