import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

/**
 * Contact Hub API workflow tests: backend permission enforcement, CSV preview
 * (no writes), idempotent commit, consent not being implied by import, and the
 * audited minimum-necessary export.
 */
const m = vi.hoisted(() => ({
  auth: null as Record<string, unknown> | null,
  contacts: [] as Array<Record<string, unknown>>,
  calls: [] as Array<{ model: string; method: string; args: unknown[] }>,
  consentCalls: [] as string[],
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown, options?: { requirePermissions?: string[] }) =>
    (req: Request, context?: unknown) => {
      if (!m.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const permissions = (m.auth.permissions as string[]) || [];
      if ((options?.requirePermissions || []).some((permission) => !permissions.includes(permission))) {
        return NextResponse.json({ error: 'Missing required permissions.' }, { status: 403 });
      }
      return handler(req, m.auth, context);
    },
}));

vi.mock('@/lib/request-origin', () => ({ mutationOriginAllowed: () => true }));

vi.mock('@/lib/communications/consent-management', () => ({
  getContactConsent: vi.fn(async () => null),
  recordConsent: vi.fn(async (input: unknown) => { m.consentCalls.push(`grant:${JSON.stringify(input)}`); return { id: 'consent-1' }; }),
  withdrawConsent: vi.fn(async (input: unknown) => { m.consentCalls.push(`withdraw:${JSON.stringify(input)}`); return { id: 'consent-2' }; }),
  applySuppression: vi.fn(async (input: unknown) => { m.consentCalls.push(`suppress:${JSON.stringify(input)}`); return { id: 'consent-3' }; }),
  isEligibleForMarketing: vi.fn(async () => ({ eligible: false, reason: 'missing_consent' })),
}));

vi.mock('@/lib/db', () => {
  const record = (model: string, method: string, args: unknown[]) => {
    m.calls.push({ model, method, args });
  };
  const phoneValues = (where: Record<string, unknown>): string[] => {
    const values: string[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if ((key === 'normalizedPhone' || key === 'phone') && value && typeof value === 'object' && 'in' in (value as object)) {
          values.push(...((value as { in: string[] }).in || []));
        } else if (typeof value === 'object') walk(value);
      }
    };
    walk(where);
    return values;
  };
  const contactModel = {
    findMany: async (...args: unknown[]) => {
      record('whatsAppContact', 'findMany', args);
      const where = (args[0] as { where?: Record<string, unknown> })?.where || {};
      const phones = phoneValues(where);
      return phones.length ? m.contacts.filter((row) => phones.includes(String(row.normalizedPhone))) : m.contacts;
    },
    findFirst: async (...args: unknown[]) => {
      record('whatsAppContact', 'findFirst', args);
      const where = (args[0] as { where?: Record<string, unknown> })?.where || {};
      const id = (where as { id?: string }).id || ((where as { OR?: Array<{ id?: string }> }).OR || []).find((entry) => entry.id)?.id;
      if (id) return m.contacts.find((row) => row.id === id) || null;
      const phones = phoneValues(where);
      if (phones.length) return m.contacts.find((row) => phones.includes(String(row.normalizedPhone))) || null;
      return null;
    },
    create: async (...args: unknown[]) => {
      record('whatsAppContact', 'create', args);
      const created = { id: `c-${m.contacts.length + 1}`, ...(args[0] as { data: Record<string, unknown> }).data };
      m.contacts.push(created);
      return created;
    },
    update: async (...args: unknown[]) => {
      record('whatsAppContact', 'update', args);
      return { id: 'c1', ...(args[0] as { data: Record<string, unknown> }).data };
    },
  };
  const generic = (model: string) => new Proxy({}, {
    get: (_target, method) => async (...args: unknown[]) => {
      record(model, String(method), args);
      if (String(method) === 'findMany') return [];
      if (String(method) === 'count') return 0;
      return { id: `${model}-1` };
    },
  });
  const base: Record<string, unknown> = {
    whatsAppContact: contactModel,
    $transaction: async (callback: (tx: unknown) => unknown) => callback(db),
  };
  const db: Record<string, unknown> = new Proxy(base, {
    get: (target, model) => {
      if (!target[String(model)]) target[String(model)] = generic(String(model));
      return target[String(model)];
    },
  });
  return { db };
});

import * as contactsApi from '@/app/api/crm/contacts/route';
import * as detailApi from '@/app/api/crm/contacts/[id]/route';
import * as duplicatesApi from '@/app/api/crm/contacts/duplicates/route';
import * as consentApi from '@/app/api/crm/contacts/consent/route';
import * as importApi from '@/app/api/crm/contacts/import/route';
import * as exportApi from '@/app/api/crm/contacts/export/route';

const ORIGIN = 'https://alo.test';
const get = (path: string) => new Request(`${ORIGIN}${path}`, { method: 'GET' });
const post = (path: string, body: unknown) => new Request(`${ORIGIN}${path}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const patch = (path: string, body: unknown) => new Request(`${ORIGIN}${path}`, {
  method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const detailContext = { params: Promise.resolve({ id: 'c1' }) };

const admin = (permissions: string[], overrides: Record<string, unknown> = {}) => ({
  userId: 'staff-1', actorUserId: 'staff-1', email: 'admin@alo.test', name: 'ALO Admin',
  userType: 'EMPLOYEE', roles: ['SUPER_ADMIN'], permissions,
  authenticationMethod: 'bearer', sessionId: 's1', ...overrides,
});

const CSV = [
  'name,phone,email,type,language',
  'Ayesha Rahman,01700000000,ayesha@example.test,PROSPECTIVE_STUDENT,BANGLA',
  'Duplicate Person,01700000000,duplicate@example.test,PROSPECTIVE_STUDENT,ENGLISH',
  'Email Only,,only@example.test,STUDENT,ENGLISH',
].join('\n');

beforeEach(() => {
  m.calls = [];
  m.consentCalls = [];
  m.contacts = [{
    id: 'c1', displayName: 'Existing Contact', phone: '8801600000000', normalizedPhone: '8801600000000',
    email: '', normalizedEmail: '', tags: '[]', source: 'WHATSAPP', isOptedOut: false, isBlocked: false,
    studentId: '', leadId: '', partnerId: '', assignedCounselorId: '', branch: '', createdAt: new Date(), updatedAt: new Date(),
  }];
  m.auth = admin(['contacts.view', 'contacts.manage', 'contacts.import', 'contacts.consent.manage', 'contacts.consent.view', 'contacts.export', 'contacts.merge_review', 'contacts.audit.view']);
});

describe('backend permission enforcement', () => {
  it('refuses a student identity and an identity without contacts.view', async () => {
    m.auth = admin([], { userType: 'STUDENT', roles: ['STUDENT'] });
    expect((await contactsApi.GET(get('/api/crm/contacts')) as Response).status).toBe(403);
    expect((await exportApi.GET(get('/api/crm/contacts/export')) as Response).status).toBe(403);
    expect(m.calls).toHaveLength(0);
  });

  it('refuses an unauthenticated request', async () => {
    m.auth = null;
    expect((await contactsApi.GET(get('/api/crm/contacts')) as Response).status).toBe(401);
  });

  it('returns live scoped contacts with an explicit data-source label for an authorized caller', async () => {
    const response = await contactsApi.GET(get('/api/crm/contacts')) as Response;
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.integrationState).toBe('LIVE_DB');
    expect(body.dataSource).toContain('WhatsAppContact');
    expect(body.contacts).toHaveLength(1);
    expect(body.contacts[0].whatsappVerified).toBe(false);
  });
});

describe('CSV import — preview before commit', () => {
  it('previews validation, in-file duplicates and email-only errors with no writes', async () => {
    const response = await importApi.POST(post('/api/crm/contacts/import', { mode: 'preview', csv: CSV, fileName: 'contacts.csv' })) as Response;
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('preview');
    expect(body.totalRows).toBe(3);
    expect(body.validRows).toBe(1);
    expect(body.duplicateRows).toBe(1);
    expect(body.invalidRows).toBe(1);
    expect(body.consentImported).toBe(false);
    expect(m.calls.some((call) => call.model === 'whatsAppContact' && call.method === 'create')).toBe(false);
    expect(m.calls.some((call) => call.model === 'importBatch' && call.method === 'create')).toBe(false);
  });

  it('refuses a commit without a documented lawful basis', async () => {
    expect((await importApi.POST(post('/api/crm/contacts/import', { mode: 'commit', csv: CSV })) as Response).status).toBe(400);
    expect(m.calls.some((call) => call.model === 'whatsAppContact' && call.method === 'create')).toBe(false);
  });

  it('commits only valid rows, records row errors and never creates consent', async () => {
    const response = await importApi.POST(post('/api/crm/contacts/import', {
      mode: 'commit', csv: CSV, lawfulBasis: 'EXPLICIT_CONSENT', lawfulBasisReference: 'Approved import policy v2 / ticket ALO-42',
    })) as Response;
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.created).toBe(1);
    expect(body.errors).toBe(1);
    expect(body.consentImported).toBe(false);
    expect(m.contacts).toHaveLength(2);
    expect(m.calls.filter((call) => call.model === 'whatsAppContact' && call.method === 'create')).toHaveLength(1);
    expect(m.calls.filter((call) => call.model === 'importError' && call.method === 'create')).toHaveLength(1);
    const audit = m.calls.find((call) => call.model === 'portalAuditLog' && call.method === 'create');
    expect(String(JSON.stringify(audit?.args))).toContain('CONTACT_IMPORT_COMMITTED');
    const auditData = (audit?.args[0] as { data: { metadata: string } })?.data;
    expect(JSON.parse(auditData.metadata).consentImported).toBe(false);
    expect(m.calls.some((call) => call.model === 'consentRecord' && call.method === 'create')).toBe(false);
  });

  it('is retry-safe: a replay finds the existing phone and creates nothing new', async () => {
    const payload = { mode: 'commit', csv: CSV, lawfulBasis: 'EXPLICIT_CONSENT', lawfulBasisReference: 'Approved import policy v2 / ticket ALO-42' };
    await importApi.POST(post('/api/crm/contacts/import', payload));
    const second = await importApi.POST(post('/api/crm/contacts/import', payload)) as Response;
    const body = await second.json();
    expect(body.created).toBe(0);
    expect(m.calls.filter((call) => call.model === 'whatsAppContact' && call.method === 'create')).toHaveLength(1);
  });
});

describe('consent, duplicates and export', () => {
  it('rejects an affirmative opt-in without exact consent wording', async () => {
    const response = await consentApi.POST(post('/api/crm/contacts/consent', { contactId: 'c1', action: 'GRANT' })) as Response;
    expect(response.status).toBe(400);
    expect(m.consentCalls).toHaveLength(0);
  });

  it('records a withdrawal through the shared consent service', async () => {
    const response = await consentApi.POST(post('/api/crm/contacts/consent', {
      contactId: 'c1', action: 'WITHDRAW', channel: 'WHATSAPP', purpose: 'PROMOTIONAL_MARKETING',
      reason: 'STOP', wording: 'STOP',
    })) as Response;
    expect(response.status).toBe(201);
    expect(m.consentCalls.some((call) => call.startsWith('withdraw:'))).toBe(true);
    const body = await response.json();
    expect(body.eligibility.eligible).toBe(false);
  });

  it('creates a review item instead of merging duplicate contacts', async () => {
    m.contacts.push({ ...m.contacts[0], id: 'c2' });
    const response = await duplicatesApi.POST(post('/api/crm/contacts/duplicates', { contactIds: ['c1', 'c2'], reason: 'Shared phone requires review' })) as Response;
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.merged).toBe(false);
    expect(m.calls.some((call) => call.model === 'contactMatchReview' && call.method === 'create')).toBe(true);
  });

  it('blocks direct opt-out edits through the profile API', async () => {
    const response = await detailApi.PATCH(patch('/api/crm/contacts/c1', { isOptedOut: true }), detailContext as never) as Response;
    expect(response.status).toBe(400);
    expect(m.calls.some((call) => call.model === 'whatsAppContact' && call.method === 'update')).toBe(false);
  });

  it('exports minimum fields without PII and writes an audit event', async () => {
    const response = await exportApi.GET(get('/api/crm/contacts/export')) as Response;
    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).toContain('contactId');
    expect(csv).not.toContain('8801600000000');
    expect(csv).not.toContain('@example.test');
    expect(m.calls.some((call) => call.model === 'portalAuditLog' && String(JSON.stringify(call.args)).includes('CONTACT_REGISTRY_EXPORTED'))).toBe(true);
  });
});
