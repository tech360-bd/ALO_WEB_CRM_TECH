import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
import { authorizeMonitoringAdmin, authorizeMonitoringViewer } from '@/lib/university-monitoring-auth';
const request = new Request('https://alo.test/api/university-monitoring');
const identity = { userId: 'synthetic-user', actorUserId: 'synthetic-user', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], email: 'synthetic@example.test' };
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue(identity); });
describe('monitoring access policy', () => {
  it('permits an authenticated Super Admin', async () => { expect((await authorizeMonitoringAdmin(request)).ok).toBe(true); });
  it.each(['EMPLOYEE', 'COUNSELOR', 'ADMIN', 'PARTNER', 'STUDENT'])('does not permit %s mutations', async (userType) => {
    m.auth.mockResolvedValue({ ...identity, userType, roles: [userType] });
    const result = await authorizeMonitoringAdmin(request); expect(result.ok).toBe(false); if (!result.ok) expect(result.response.status).toBe(403);
  });
  it('denies student/partner identities even with contradictory privileged role labels', async () => {
    for (const userType of ['STUDENT', 'PARTNER']) {
      m.auth.mockResolvedValue({ ...identity, userType }); expect((await authorizeMonitoringAdmin(request)).ok).toBe(false);
    }
  });
  it('denies approvals while impersonating another user', async () => {
    m.auth.mockResolvedValue({ ...identity, actorUserId: 'different-actor' }); expect((await authorizeMonitoringAdmin(request)).ok).toBe(false);
  });
  it('fails closed on authentication exceptions and missing sessions', async () => {
    m.auth.mockRejectedValue(new Error('Synthetic authentication failure'));
    const result = await authorizeMonitoringAdmin(request); expect(result.ok).toBe(false); if (!result.ok) expect(result.response.status).toBe(401);
    m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 })); expect((await authorizeMonitoringViewer(request)).ok).toBe(false);
  });
  it('permits staff reads but excludes student/partner reads of pending evidence', async () => {
    m.auth.mockResolvedValue({ ...identity, userType: 'EMPLOYEE', roles: ['EMPLOYEE'] }); expect((await authorizeMonitoringViewer(request)).ok).toBe(true);
    for (const userType of ['STUDENT', 'PARTNER']) {
      m.auth.mockResolvedValue({ ...identity, userType }); expect((await authorizeMonitoringViewer(request)).ok).toBe(false);
    }
  });
});
