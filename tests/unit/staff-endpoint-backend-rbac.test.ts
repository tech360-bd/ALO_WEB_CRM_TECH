import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

/**
 * Regression: seven legacy staff endpoints (plus the template detail handler)
 * relied only on the global proxy session gate. Any authenticated STUDENT or
 * PARTNER identity could therefore read HR leave records, B2B contacts or
 * templates and, worse, approve leave/agreements or lock templates using a
 * client-supplied `approvedBy`. The master specification requires the decision
 * in the backend handler. These tests exercise the real route handlers with an
 * injected identity and a recording database stub.
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
        // A new template code must not look like an existing duplicate.
        if (String(method) === 'findFirst') return Promise.resolve(null);
        if (String(method) === 'findUnique') return Promise.resolve({ id: 'existing-1', status: 'APPROVED', isLocked: false, body: 'old' });
        return Promise.resolve({ id: 'new-1' });
      },
    }),
  });
  return { db };
});

vi.mock('@/lib/auth-middleware', () => ({
  // Mirrors the real wrapper: no session -> 401, otherwise inject identity.
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown) =>
    (req: Request, context?: unknown) => {
      if (!m.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return handler(req, m.auth, context);
    },
}));

import * as hrLeave from '@/app/api/hr/leave/route';
import * as hrDevices from '@/app/api/hr/devices/route';
import * as officialEmails from '@/app/api/official-emails/route';
import * as universityAgreements from '@/app/api/university-agreements/route';
import * as b2bContacts from '@/app/api/b2b-contacts/route';
import * as templates from '@/app/api/communications/templates/route';
import * as templateDetail from '@/app/api/communications/templates/[id]/route';
import * as interviewQuestions from '@/app/api/interview-questions/route';

const ORIGIN = 'https://alo.test';
const get = (path: string) => new Request(`${ORIGIN}${path}`, { method: 'GET' });
const post = (path: string, body: unknown = {}, init: RequestInit = {}) => new Request(`${ORIGIN}${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
  ...init,
});
const patch = (path: string, body: unknown) => new Request(`${ORIGIN}${path}`, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const del = (path: string) => new Request(`${ORIGIN}${path}`, { method: 'DELETE' });
const templateContext = { params: Promise.resolve({ id: 'existing-1' }) };

const routes: Array<{ name: string; call: () => Promise<Response>; write: boolean }> = [
  { name: 'hr/leave GET', call: () => hrLeave.GET(get('/api/hr/leave')) as Promise<Response>, write: false },
  { name: 'hr/leave POST', call: () => hrLeave.POST(post('/api/hr/leave', { employeeId: 'e1', leaveType: 'CASUAL', startDate: '2026-11-01', endDate: '2026-11-02', days: 2 })) as Promise<Response>, write: true },
  { name: 'hr/leave PATCH', call: () => hrLeave.PATCH(patch('/api/hr/leave', { id: 'l1', status: 'APPROVED', approvedBy: 'attacker' })) as Promise<Response>, write: true },
  { name: 'hr/devices GET', call: () => hrDevices.GET(get('/api/hr/devices')) as Promise<Response>, write: false },
  { name: 'hr/devices POST', call: () => hrDevices.POST(post('/api/hr/devices', { employeeId: 'e1', deviceName: 'Laptop', serialNumber: 'SN1', assignedDate: '2026-11-01', id: 'forged' })) as Promise<Response>, write: true },
  { name: 'official-emails GET', call: () => officialEmails.GET(get('/api/official-emails')) as Promise<Response>, write: false },
  { name: 'official-emails POST', call: () => officialEmails.POST(post('/api/official-emails', { recipient: 'a@example.test', subject: 'Hello' })) as Promise<Response>, write: true },
  { name: 'university-agreements GET', call: () => universityAgreements.GET(get('/api/university-agreements')) as Promise<Response>, write: false },
  { name: 'university-agreements POST', call: () => universityAgreements.POST(post('/api/university-agreements', { universitySlug: 'u', universityName: 'U', requestedById: 'attacker' })) as Promise<Response>, write: true },
  { name: 'b2b-contacts GET', call: () => b2bContacts.GET(get('/api/b2b-contacts')) as Promise<Response>, write: false },
  { name: 'b2b-contacts POST', call: () => b2bContacts.POST(post('/api/b2b-contacts', { name: 'N', organization: 'O' })) as Promise<Response>, write: true },
  { name: 'templates GET', call: () => templates.GET(get('/api/communications/templates')) as Promise<Response>, write: false },
  { name: 'templates POST', call: () => templates.POST(post('/api/communications/templates', { templateId: 't1', name: 'N', category: 'C', channel: 'whatsapp', body: 'B', createdBy: 'attacker' })) as Promise<Response>, write: true },
  { name: 'templates/[id] PATCH', call: () => templateDetail.PATCH(patch('/api/communications/templates/existing-1', { body: 'updated' }), templateContext as never) as Promise<Response>, write: true },
  { name: 'templates/[id] DELETE', call: () => templateDetail.DELETE(del('/api/communications/templates/existing-1'), templateContext as never) as Promise<Response>, write: true },
  { name: 'interview-questions GET', call: () => interviewQuestions.GET(get('/api/interview-questions')) as Promise<Response>, write: false },
  { name: 'interview-questions POST', call: () => interviewQuestions.POST(post('/api/interview-questions', { category: 'COURSE', question: 'Why?' })) as Promise<Response>, write: true },
];

const baseAuth = (overrides: Record<string, unknown> = {}) => ({
  userId: 'staff-1',
  email: 'admin@aloeducation.dev',
  name: 'ALO Admin',
  userType: 'EMPLOYEE',
  roles: ['SUPER_ADMIN'],
  permissions: [],
  authenticationMethod: 'bearer',
  sessionId: 's1',
  ...overrides,
});

beforeEach(() => {
  m.calls = [];
  m.auth = baseAuth();
});

describe('legacy staff endpoint authentication', () => {
  it('returns 401 for an unauthenticated request on every handler', async () => {
    m.auth = null;
    for (const route of routes) {
      const response = await route.call();
      expect(response.status, route.name).toBe(401);
    }
    expect(m.calls).toHaveLength(0);
  });

  it('denies a student identity on every handler without querying the database', async () => {
    m.auth = baseAuth({ userType: 'STUDENT', roles: ['STUDENT'] });
    for (const route of routes) {
      const response = await route.call();
      expect(response.status, route.name).toBe(403);
    }
    expect(m.calls).toHaveLength(0);
  });

  it('denies a partner identity on every handler', async () => {
    m.auth = baseAuth({ userType: 'PARTNER', roles: ['PARTNER'] });
    for (const route of routes) {
      expect((await route.call()).status, route.name).toBe(403);
    }
    expect(m.calls).toHaveLength(0);
  });

  it('denies a generic authenticated employee without the required role', async () => {
    m.auth = baseAuth({ userType: 'EMPLOYEE', roles: ['EMPLOYEE'], permissions: [] });
    for (const route of routes) {
      expect((await route.call()).status, route.name).toBe(403);
    }
    expect(m.calls).toHaveLength(0);
  });
});

describe('authorized staff behaviour', () => {
  it('allows a Super Admin on every handler', async () => {
    for (const route of routes) {
      const response = await route.call();
      expect([200, 201].includes(response.status), `${route.name} -> ${response.status}`).toBe(true);
    }
    expect(m.calls.length).toBeGreaterThan(0);
  });

  it('binds the approval actor to the session, not the request body', async () => {
    await hrLeave.PATCH(patch('/api/hr/leave', { id: 'l1', status: 'APPROVED', approvedBy: 'attacker' }));
    const update = m.calls.find((call) => call.model === 'leaveRequest' && call.method === 'update');
    expect(update).toBeDefined();
    expect((update?.args[0] as { data: { approvedBy: string } }).data.approvedBy).toBe('staff-1');
    const audit = m.calls.find((call) => call.model === 'auditLog' && call.method === 'create');
    expect((audit?.args[0] as { data: { userId: string } }).data.userId).toBe('staff-1');
  });

  it('does not mass-assign device fields from the request body', async () => {
    await hrDevices.POST(post('/api/hr/devices', { employeeId: 'e1', deviceName: 'Laptop', serialNumber: 'SN1', assignedDate: '2026-11-01', id: 'forged' }));
    const create = m.calls.find((call) => call.model === 'deviceManagement' && call.method === 'create');
    const data = (create?.args[0] as { data: Record<string, unknown> }).data;
    expect(data.id).toBeUndefined();
    expect(data.status).toBe('ASSIGNED');
    expect(data.employeeId).toBe('e1');
  });

  it('applies template body edits without the legacy dangling-subject bug', async () => {
    await templateDetail.PATCH(patch('/api/communications/templates/existing-1', { body: 'updated' }), templateContext as never);
    const update = m.calls.find((call) => call.model === 'communicationTemplate' && call.method === 'update');
    expect((update?.args[0] as { data: { body: string } }).data.body).toBe('updated');
  });

  it('archives (soft delete) rather than hard-deleting a template', async () => {
    await templateDetail.DELETE(del('/api/communications/templates/existing-1'), templateContext as never);
    expect(m.calls.some((call) => call.model === 'communicationTemplate' && call.method === 'delete')).toBe(false);
    const update = m.calls.find((call) => call.model === 'communicationTemplate' && call.method === 'update');
    expect((update?.args[0] as { data: { status: string } }).data.status).toBe('ARCHIVED');
  });

  it('rejects a cross-site write even for a Super Admin (CSRF)', async () => {
    const response = await b2bContacts.POST(post('/api/b2b-contacts', { name: 'N', organization: 'O' }, {
      headers: { 'content-type': 'application/json', origin: 'https://attacker.invalid', 'sec-fetch-site': 'cross-site' },
    }));
    expect(response.status).toBe(403);
    expect(m.calls.some((call) => call.model === 'b2BContact')).toBe(false);
  });
});
