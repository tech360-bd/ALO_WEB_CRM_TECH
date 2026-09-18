/**
 * ALO Education — Broken access control regression tests.
 *
 * These tests import the REAL route handlers (not a re-implementation) and
 * assert that unauthenticated callers cannot read or mutate privileged data.
 *
 * Findings covered (see docs/SECURITY_FINDINGS_2026-09-18.md):
 *   SEC-A  GET/POST/PATCH /api/commissions            — was fully unauthenticated
 *   SEC-B  GET/POST      /api/counselor/students/[id] — was fully unauthenticated
 *   SEC-C  POST          /api/crm/seed                — was unauthenticated, created
 *          privileged accounts from hardcoded weak passwords, leaked the user list
 *
 * Only `@/lib/db` and `next-auth` are mocked. The authorization logic under test
 * (`@/lib/auth-middleware` → `authenticateRequest`) is the real implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks -----------------------------------------------------------------
// Every db call is recorded so a test can prove NO data access happened.
// vi.hoisted() is required: vi.mock factories are hoisted above imports.
const { dbCalls, dbMock } = vi.hoisted(() => {
  const calls: string[] = [];
  const record = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve(null);
  };
  return {
    dbCalls: calls,
    dbMock: {
      commission: {
        findMany: record('commission.findMany'),
        create: record('commission.create'),
        update: record('commission.update'),
      },
      student: { findUnique: record('student.findUnique') },
      application: { findMany: record('application.findMany') },
      visaCase: { findMany: record('visaCase.findMany') },
      timelineEvent: { findMany: record('timelineEvent.findMany'), create: record('timelineEvent.create') },
      internalComment: { findMany: record('internalComment.findMany'), create: record('internalComment.create') },
      studentVisibleComment: { findMany: record('studentVisibleComment.findMany'), create: record('studentVisibleComment.create') },
      sopDraft: { findMany: record('sopDraft.findMany') },
      cvDraft: { findMany: record('cvDraft.findMany') },
      communicationMessage: { findMany: record('communicationMessage.findMany') },
      document: { findMany: record('document.findMany') },
      payment: { findMany: record('payment.findMany') },
      interviewSession: { findMany: record('interviewSession.findMany') },
      auditLog: { create: record('auditLog.create') },
      portalUser: { findUnique: record('portalUser.findUnique'), findMany: record('portalUser.findMany'), create: record('portalUser.create') },
      portalSession: { findUnique: record('portalSession.findUnique') },
      portalStudentProfile: { findFirst: record('portalStudentProfile.findFirst') },
      user: { findUnique: record('user.findUnique') },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: dbMock }));

// No NextAuth session in these tests (unauthenticated caller).
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
  NextAuth: vi.fn(),
}));

// --- handlers under test ----------------------------------------------------
import {
  GET as commissionsGET,
  POST as commissionsPOST,
  PATCH as commissionsPATCH,
} from '@/app/api/commissions/route';
import {
  GET as counselorStudentGET,
  POST as counselorStudentPOST,
} from '@/app/api/counselor/students/[id]/route';
import { POST as crmSeedPOST } from '@/app/api/crm/seed/route';

const req = (init?: RequestInit) => new Request('http://localhost/api/test', init);
const params = (id: string) => ({ params: Promise.resolve({ id }) }) as never;

beforeEach(() => {
  dbCalls.length = 0;
});

describe('SEC-A /api/commissions — must require an authenticated staff session', () => {
  it('rejects unauthenticated GET with 401 and never queries commissions', async () => {
    const res = await commissionsGET(req() as never);
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('commission.findMany');
  });

  it('rejects unauthenticated POST with 401 and never creates a commission', async () => {
    const res = await commissionsPOST(
      req({ method: 'POST', body: JSON.stringify({ type: 'PARTNER_COMMISSION', amount: '99999' }) }) as never
    );
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('commission.create');
  });

  it('rejects unauthenticated PATCH (commission approval) with 401', async () => {
    const res = await commissionsPATCH(
      req({
        method: 'PATCH',
        body: JSON.stringify({ id: 'cm1', status: 'APPROVED', approvedById: 'attacker' }),
      }) as never
    );
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('commission.update');
  });

  it('rejects a forged bearer token with 401 (no session row exists)', async () => {
    const res = await commissionsGET(
      req({ headers: { authorization: 'Bearer forged-token-value' } }) as never
    );
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('commission.findMany');
  });
});

describe('SEC-B /api/counselor/students/[id] — student data must be staff-only', () => {
  it('rejects unauthenticated GET with 401 and never reads the student record', async () => {
    const res = await counselorStudentGET(req() as never, params('student-1'));
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('student.findUnique');
    expect(dbCalls).not.toContain('document.findMany');
    expect(dbCalls).not.toContain('payment.findMany');
  });

  it('rejects unauthenticated POST with 401 and never writes a counselor note', async () => {
    const res = await counselorStudentPOST(
      req({
        method: 'POST',
        body: JSON.stringify({
          type: 'internal',
          body: 'injected note',
          authorId: 'attacker',
          authorRole: 'super_admin',
        }),
      }) as never,
      params('student-1')
    );
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('internalComment.create');
    expect(dbCalls).not.toContain('auditLog.create');
  });
});

describe('SEC-C /api/crm/seed — must not be a public endpoint', () => {
  it('rejects unauthenticated POST with 401/403 and never creates privileged users', async () => {
    const res = await crmSeedPOST();
    expect([401, 403, 404, 405, 410]).toContain(res.status);
    expect(dbCalls).not.toContain('portalUser.create');
  });

  it('does not leak the privileged account roster to an unauthenticated caller', async () => {
    const res = await crmSeedPOST();
    const text = await res.text();
    expect(text).not.toContain('admin@alo.edu.bd');
    expect(text).not.toContain('emailRoleMap');
  });
});

describe('SEC-D no plaintext production credential may be committed', () => {
  it('repository contains no hardcoded production DB password', async () => {
    const { execSync } = await import('node:child_process');
    // Built from char codes so this test file never contains the literal
    // (a hardcoded copy here would make the grep match itself).
    const needle = String.fromCharCode(65, 108, 111, 95, 69, 100, 117, 95, 50, 48, 50, 54, 33);
    const out = execSync(`git grep -I --untracked -c ${JSON.stringify(needle)} -- . || true`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(out.trim()).toBe('');
  });

  it('repository contains no hardcoded default session/JWT secrets', async () => {
    const { execSync } = await import('node:child_process');
    const out = execSync(
      'git grep -I --untracked -nE "alo-edu-(secret|jwt-secret)-change-this" -- . || true',
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    expect(out.trim()).toBe('');
  });

  it('CRM seed route carries no hardcoded plaintext passwords', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/app/api/crm/seed/route.ts', 'utf8');
    expect(src).not.toMatch(/password:\s*['"][^'"]+['"]/);
    expect(src).not.toContain('passwordHash: userData.password');
  });
});
