// ============================================================
// ALO Education — Monitoring RBAC / authentication tests
// ============================================================
//
// These exercise the REAL guard implementation in
// src/lib/university-monitoring-auth.ts against real session rows in the
// database, because the vulnerability being regression-tested was precisely
// that these endpoints had no guard at all:
//
//   • anonymous callers could APPROVE a change into production data
//   • the acting user came from a client-supplied `performedBy` body field,
//     so every action could be attributed to the Super Admin
//
// Assertions below prove: anonymous denied, student denied, partner denied,
// employee read-only, super admin allowed, and that the actor identity is
// taken from the session rather than the request body.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextResponse } from 'next/server';

// These tests use real sessions and database-backed authorization. Skip before
// importing the DB client when no disposable test database was requested.
const integrationDescribe = process.env.TEST_DATABASE_URL ? describe : describe.skip;
if (!process.env.TEST_DATABASE_URL) {
  console.warn('[integration] university-monitoring RBAC tests skipped: TEST_DATABASE_URL is not set.');
}
const testModules = process.env.TEST_DATABASE_URL
  ? await Promise.all([import('@/lib/db'), import('@/lib/university-monitoring-auth')])
  : [];
const db = testModules[0]?.db as typeof import('@/lib/db').db;
const monitoringAuth = (testModules[1] ?? {}) as typeof import('@/lib/university-monitoring-auth');
const { authorizeMonitoringAdmin, authorizeMonitoringViewer } = monitoringAuth;

const SUFFIX = `rbac-${Date.now().toString(36)}`;

interface Fixture {
  userId: string;
  token: string;
  email: string;
}

const made: string[] = [];
const tokens: string[] = [];
const roleIds: string[] = [];

/**
 * Create a PortalUser + a named PortalRole + a live PortalSession.
 * This mirrors exactly what a real portal login produces, so the guard is
 * exercised through its real database lookups rather than a stub.
 */
async function makeUser(userType: string, roleName: string, label: string): Promise<Fixture> {
  const email = `itest-${label}-${SUFFIX}@aloedu.test`;
  const user = await db.portalUser.create({
    data: { email, name: `Test ${label}`, userType, status: 'active', passwordHash: 'x' },
  });
  made.push(user.id);

  const role = await db.portalRole.create({
    data: { name: `${roleName}-${SUFFIX}-${label}`, label: roleName },
  });
  roleIds.push(role.id);
  await db.portalUserRole.create({ data: { userId: user.id, roleId: role.id } });

  const token = `itest-token-${label}-${SUFFIX}`;
  await db.portalSession.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  tokens.push(token);

  return { userId: user.id, token, email };
}

/** Build a Request carrying the portal session cookie the middleware expects. */
function reqWithSession(token: string): Request {
  return new Request('https://alo.test/api/university-monitoring/changes/abc', {
    method: 'PATCH',
    headers: { cookie: `alo_portal_session=${encodeURIComponent(token)}` },
  });
}

function anonymousReq(): Request {
  return new Request('https://alo.test/api/university-monitoring/changes/abc', { method: 'PATCH' });
}

let superAdmin: Fixture;
let employee: Fixture;
let student: Fixture;
let partner: Fixture;

beforeAll(async () => {
  superAdmin = await makeUser('SUPER_ADMIN', 'super_admin', 'superadmin');
  employee = await makeUser('EMPLOYEE', 'employee', 'employee');
  student = await makeUser('STUDENT', 'student', 'student');
  partner = await makeUser('PARTNER', 'partner', 'partner');
});

afterAll(async () => {
  await db.portalSession.deleteMany({ where: { token: { in: tokens } } }).catch(() => undefined);
  await db.portalUserRole.deleteMany({ where: { userId: { in: made } } }).catch(() => undefined);
  await db.portalRole.deleteMany({ where: { id: { in: roleIds } } }).catch(() => undefined);
  await db.portalUser.deleteMany({ where: { id: { in: made } } }).catch(() => undefined);
});

integrationDescribe('Authentication: anonymous access is rejected', () => {
  it('denies an unauthenticated caller the Super Admin actions', async () => {
    const result = await authorizeMonitoringAdmin(anonymousReq());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response).toBeInstanceOf(NextResponse);
      expect(result.response.status).toBe(401);
    }
  });

  it('denies an unauthenticated caller read access to the queue', async () => {
    const result = await authorizeMonitoringViewer(anonymousReq());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });
});

integrationDescribe('RBAC: privileged monitoring actions are Super Admin only', () => {
  it('allows SUPER_ADMIN and returns the session-derived actor', async () => {
    const result = await authorizeMonitoringAdmin(reqWithSession(superAdmin.token));
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Identity comes from the session, never from the request body.
      expect(result.actor.userId).toBe(superAdmin.userId);
      expect(result.actor.email).toBe(superAdmin.email);
    }
  });

  it('denies EMPLOYEE the approve/reject/trigger actions (403, not 401)', async () => {
    const result = await authorizeMonitoringAdmin(reqWithSession(employee.token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('denies STUDENT privileged actions', async () => {
    const result = await authorizeMonitoringAdmin(reqWithSession(student.token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('denies PARTNER privileged actions', async () => {
    const result = await authorizeMonitoringAdmin(reqWithSession(partner.token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});

integrationDescribe('RBAC: read access is staff-only (queue exposes unapproved data)', () => {
  it('allows EMPLOYEE to view monitoring data', async () => {
    const result = await authorizeMonitoringViewer(reqWithSession(employee.token));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.actor.userId).toBe(employee.userId);
  });

  it('allows SUPER_ADMIN to view monitoring data', async () => {
    const result = await authorizeMonitoringViewer(reqWithSession(superAdmin.token));
    expect(result.ok).toBe(true);
  });

  it('denies STUDENT — students must never see unapproved detected changes', async () => {
    const result = await authorizeMonitoringViewer(reqWithSession(student.token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('denies PARTNER read access to the verification queue', async () => {
    const result = await authorizeMonitoringViewer(reqWithSession(partner.token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});

integrationDescribe('Session integrity', () => {
  it('rejects a revoked session', async () => {
    const victim = await makeUser('SUPER_ADMIN', 'super_admin', 'revoked');
    await db.portalSession.update({
      where: { token: victim.token },
      data: { revokedAt: new Date() },
    });

    const result = await authorizeMonitoringAdmin(reqWithSession(victim.token));
    expect(result.ok).toBe(false);
  });

  it('rejects a forged/unknown token', async () => {
    const result = await authorizeMonitoringAdmin(reqWithSession('totally-made-up-token'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('a client-supplied performedBy in the body cannot grant privileges', async () => {
    // The old vulnerable contract: body carried the identity.
    const req = new Request('https://alo.test/api/university-monitoring/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performedBy: 'superadmin@aloedu.com', scope: 'all' }),
    });

    const result = await authorizeMonitoringAdmin(req);
    // No session => denied, regardless of what the body claims.
    expect(result.ok).toBe(false);
  });
});
