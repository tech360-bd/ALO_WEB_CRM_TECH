import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

/**
 * Regression: partner-packages accepted an arbitrary body into a Prisma
 * create/update, and the communications task/escalation handlers had no
 * route-level authorization at all. Only the global proxy token gate stood
 * between a PARTNER/STUDENT session and B2B package pricing or escalation
 * resolution. These tests exercise the real handlers with an injected identity
 * and a recording database stub.
 */
const m = vi.hoisted(() => ({
  auth: null as Record<string, unknown> | null,
  calls: [] as Array<{ model: string; method: string; args: unknown[] }>,
}));

vi.mock('@/lib/db', () => {
  const db = new Proxy({}, {
    get: (_target, model) => new Proxy({}, {
      get: (_modelTarget, method) => (...args: unknown[]) => {
        m.calls.push({ model: String(model), method: String(method), args });
        if (String(method) === 'findMany') return Promise.resolve([]);
        if (String(method) === 'findUnique') return Promise.resolve({ id: 'existing-1', status: 'OPEN' });
        return Promise.resolve({ id: 'new-1' });
      },
    }),
  });
  return { db };
});

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown) =>
    (req: Request, context?: unknown) => {
      if (!m.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return handler(req, m.auth, context);
    },
}));

import * as partnerPackages from '@/app/api/partner-packages/route';
import * as tasks from '@/app/api/communications/tasks/route';
import * as taskDetail from '@/app/api/communications/tasks/[id]/route';
import * as escalations from '@/app/api/communications/escalations/route';
import * as escalationDetail from '@/app/api/communications/escalations/[id]/route';
import * as slaPolicies from '@/app/api/communications/sla/policies/route';
import * as slaReview from '@/app/api/communications/sla/justifications/[id]/review/route';

const ORIGIN = 'https://alo.test';
const req = (path: string, method: string, body?: unknown, headers: Record<string, string> = {}) => new Request(`${ORIGIN}${path}`, {
  method,
  headers: { 'content-type': 'application/json', ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const context = { params: Promise.resolve({ id: 'existing-1' }) };

const routes: Array<{ name: string; call: () => Promise<Response> }> = [
  { name: 'partner-packages GET', call: () => partnerPackages.GET(req('/api/partner-packages', 'GET')) as Promise<Response> },
  { name: 'partner-packages POST', call: () => partnerPackages.POST(req('/api/partner-packages', 'POST', { name: 'Gold', slug: 'gold', price: 100 })) as Promise<Response> },
  { name: 'partner-packages PATCH', call: () => partnerPackages.PATCH(req('/api/partner-packages', 'PATCH', { id: 'pkg-1', price: 1 })) as Promise<Response> },
  { name: 'tasks GET', call: () => tasks.GET(req('/api/communications/tasks', 'GET')) as Promise<Response> },
  { name: 'tasks POST', call: () => tasks.POST(req('/api/communications/tasks', 'POST', { title: 'Follow up', createdBy: 'attacker' })) as Promise<Response> },
  { name: 'tasks/[id] PATCH', call: () => taskDetail.PATCH(req('/api/communications/tasks/existing-1', 'PATCH', { status: 'RESOLVED' }), context as never) as Promise<Response> },
  { name: 'escalations GET', call: () => escalations.GET(req('/api/communications/escalations', 'GET')) as Promise<Response> },
  { name: 'escalations POST', call: () => escalations.POST(req('/api/communications/escalations', 'POST', { type: 'SLA_WARNING', message: 'Overdue' })) as Promise<Response> },
  { name: 'escalations/[id] PATCH', call: () => escalationDetail.PATCH(req('/api/communications/escalations/existing-1', 'PATCH', { status: 'RESOLVED' }), context as never) as Promise<Response> },
  { name: 'sla/policies GET', call: () => slaPolicies.GET(req('/api/communications/sla/policies', 'GET')) as Promise<Response> },
  { name: 'sla/policies POST', call: () => slaPolicies.POST(req('/api/communications/sla/policies', 'POST', { name: 'Office hours', channel: 'whatsapp' })) as Promise<Response> },
  { name: 'sla/justifications/[id]/review POST', call: () => slaReview.POST(req('/api/communications/sla/justifications/existing-1/review', 'POST', { decision: 'ACCEPTED', reviewedBy: 'attacker' }), context as never) as Promise<Response> },
];

const baseAuth = (overrides: Record<string, unknown> = {}) => ({
  userId: 'staff-1', actorUserId: 'staff-1', email: 'admin@aloeducation.dev', name: 'ALO Admin',
  userType: 'EMPLOYEE', roles: ['SUPER_ADMIN'], permissions: [],
  authenticationMethod: 'bearer', sessionId: 's1', ...overrides,
});

beforeEach(() => { m.calls = []; m.auth = baseAuth(); });

describe('communication and B2B staff endpoint authorization', () => {
  it('returns 401 for every handler without a session and performs no DB work', async () => {
    m.auth = null;
    for (const route of routes) expect((await route.call()).status, route.name).toBe(401);
    expect(m.calls).toHaveLength(0);
  });

  it('denies STUDENT, PARTNER and generic EMPLOYEE identities without DB work', async () => {
    for (const identity of [
      { userType: 'STUDENT', roles: ['STUDENT'] },
      { userType: 'PARTNER', roles: ['PARTNER'] },
      { userType: 'EMPLOYEE', roles: ['EMPLOYEE'], permissions: [] },
    ]) {
      m.auth = baseAuth(identity);
      m.calls = [];
      for (const route of routes) expect((await route.call()).status, `${identity.userType} / ${route.name}`).toBe(403);
      expect(m.calls, identity.userType).toHaveLength(0);
    }
  });

  it('rejects a cross-site write even with a valid session', async () => {
    m.auth = baseAuth({ authenticationMethod: 'cookie' });
    const response = await partnerPackages.POST(req('/api/partner-packages', 'POST', { name: 'Gold', slug: 'gold' }, { origin: 'https://evil.test' })) as Response;
    expect(response.status).toBe(403);
    expect(m.calls).toHaveLength(0);
  });

  it('allows all handlers for Super Admin', async () => {
    for (const route of routes) expect([200, 201].includes((await route.call()).status), route.name).toBe(true);
    expect(m.calls.length).toBeGreaterThan(0);
  });
});

describe('partner package write safety', () => {
  it('never passes a client-supplied id or unknown column into Prisma', async () => {
    await partnerPackages.POST(req('/api/partner-packages', 'POST', { name: 'Gold', slug: 'gold', id: 'forged', createdAt: '2000-01-01', price: 100 }));
    const create = m.calls.find((call) => call.model === 'partnerPackage' && call.method === 'create');
    const data = (create?.args[0] as { data: Record<string, unknown> }).data;
    expect(data).not.toHaveProperty('id');
    expect(data).not.toHaveProperty('createdAt');
    expect(Object.keys(data).sort()).toEqual(['name', 'price', 'slug']);
  });

  it('binds the audit actor to the session for both create and update', async () => {
    await partnerPackages.POST(req('/api/partner-packages', 'POST', { name: 'Gold', slug: 'gold' }));
    await partnerPackages.PATCH(req('/api/partner-packages', 'PATCH', { id: 'pkg-1', price: 12 }));
    const audits = m.calls.filter((call) => call.model === 'portalAuditLog' && call.method === 'create');
    expect(audits).toHaveLength(2);
    for (const audit of audits) expect((audit.args[0] as { data: { actorUserId: string } }).data.actorUserId).toBe('staff-1');
  });
});

describe('task and escalation actor binding', () => {
  it('ignores a client-supplied createdBy and uses the session actor', async () => {
    await tasks.POST(req('/api/communications/tasks', 'POST', { title: 'Call back', createdBy: 'attacker' }));
    const create = m.calls.find((call) => call.model === 'communicationTask' && call.method === 'create');
    expect((create?.args[0] as { data: { createdBy: string } }).data.createdBy).toBe('staff-1');
  });

  it('records an audit event when an escalation is resolved', async () => {
    await escalationDetail.PATCH(req('/api/communications/escalations/existing-1', 'PATCH', { status: 'RESOLVED' }), context as never);
    const audit = m.calls.find((call) => call.model === 'portalAuditLog' && call.method === 'create');
    expect(String(JSON.stringify(audit?.args))).toContain('COMMUNICATION_ESCALATION_UPDATED');
  });

  it('binds the SLA justification reviewer to the session, not the request body', async () => {
    await slaReview.POST(req('/api/communications/sla/justifications/existing-1/review', 'POST', { decision: 'ACCEPTED', reviewedBy: 'attacker' }), context as never);
    const update = m.calls.find((call) => call.model === 'slaJustification' && call.method === 'update');
    expect((update?.args[0] as { data: { reviewedBy: string } }).data.reviewedBy).toBe('staff-1');
    const audit = m.calls.find((call) => call.model === 'portalAuditLog' && call.method === 'create');
    expect((audit?.args[0] as { data: { actorUserId: string } }).data.actorUserId).toBe('staff-1');
  });
});
