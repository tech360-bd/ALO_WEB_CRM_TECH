/**
 * Secondary contact phones and merge history — route-level tests (spec §3, §10).
 *
 * Mocked at the module boundary (auth, origin, scope, database); nothing here
 * touches Prisma or a real database.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: null as null | Record<string, unknown>,
  contact: null as null | Record<string, unknown>,
  phones: [] as Array<Record<string, unknown>>,
  audits: [] as Array<Record<string, unknown>>,
  created: [] as Array<Record<string, unknown>>,
  updated: [] as Array<Record<string, unknown>>,
  deleted: [] as string[],
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown, options?: { requirePermissions?: string[] }) => {
    const wrapper = (req: Request, second?: unknown, third?: unknown) => {
      const wrapperContext = third ?? second;
      if (!m.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const permissions = (m.auth.permissions as string[]) || [];
      const missing = (options?.requirePermissions || []).filter((permission) => !permissions.includes(permission));
      if (missing.length > 0) return NextResponse.json({ error: 'Missing required permissions.' }, { status: 403 });
      return handler(req, m.auth, wrapperContext);
    };
    wrapper.requirePermissions = options?.requirePermissions || [];
    return wrapper;
  },
}));

vi.mock('@/lib/request-origin', () => ({ mutationOriginAllowed: () => true }));
vi.mock('@/lib/contacts/access-scope', () => ({
  hasCompanyWideContactAccess: () => true,
  contactScopeWhere: async () => ({}),
  combineContactScopeAndSearch: (scope: unknown, clauses: unknown[]) => ({ OR: clauses }),
}));

vi.mock('@/lib/db', () => {
  const tx = {
    contactPhone: {
      updateMany: async () => ({ count: 0 }),
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        m.updated.push({ where: args.where, data: args.data });
        return { id: args.where.id, ...args.data };
      },
      create: async (args: { data: Record<string, unknown> }) => {
        m.created.push(args.data);
        return { id: `cp-${m.created.length}`, ...args.data };
      },
      delete: async (args: { where: { id: string } }) => {
        m.deleted.push(args.where.id);
        return { id: args.where.id };
      },
    },
    portalAuditLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        m.audits.push(args.data);
        return { id: `audit-${m.audits.length}` };
      },
    },
  };
  return {
    db: {
      ...tx,
      whatsAppContact: {
        findFirst: async () => m.contact,
      },
      contactPhone: {
        findMany: async () => m.phones,
        findUnique: async (args: { where: { contactId_normalizedPhone: { normalizedPhone: string } } }) =>
          m.phones.find((row) => row.normalizedPhone === args.where.contactId_normalizedPhone.normalizedPhone) || null,
        findFirst: async (args: { where: { id: string; contactId?: string } }) =>
          m.phones.find((row) => row.id === args.where.id) || null,
        count: async () => 0,
        groupBy: async () => [],
        ...tx.contactPhone,
      },
      $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
    },
  };
});

const { GET, POST } = await import('@/app/api/crm/contacts/[id]/phones/route');
const { PATCH, DELETE } = await import('@/app/api/crm/contacts/[id]/phones/[phoneId]/route');

function staff(permissions: string[] = ['contacts.view', 'contacts.manage']) {
  return {
    userId: 'user-1',
    actorUserId: 'user-1',
    roles: ['counsellor'],
    permissions,
    userType: 'EMPLOYEE',
    branch: 'Dhaka',
    partnerId: null,
  };
}

function params(id = 'contact-1') {
  return { params: Promise.resolve({ id }) };
}
function phoneParams(id = 'contact-1', phoneId = 'cp-1') {
  return { params: Promise.resolve({ id, phoneId }) };
}
function req(body: unknown) {
  return new Request('https://alo.test/api/crm/contacts/contact-1/phones', {
    method: 'POST',
    headers: { origin: 'https://alo.test', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  m.auth = staff();
  m.contact = { id: 'contact-1', normalizedPhone: '8801712345678', displayName: 'Test Contact' };
  m.phones = [];
  m.audits = [];
  m.created = [];
  m.updated = [];
  m.deleted = [];
});

describe('GET /api/crm/contacts/:id/phones', () => {
  it('returns an empty list when the contact has no secondary numbers', async () => {
    const res = await GET(new Request('https://alo.test/api/crm/contacts/contact-1/phones'), staff() as never, params() as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, phones: [] });
  });

  it('is refused for an out-of-scope contact', async () => {
    m.contact = null;
    const res = await GET(new Request('https://alo.test/api/crm/contacts/contact-1/phones'), staff() as never, params() as never);
    expect(res.status).toBe(404);
  });

  it('requires contacts.view', async () => {
    m.auth = staff([]);
    const res = await GET(new Request('https://alo.test/api/crm/contacts/contact-1/phones'), m.auth as never, params() as never);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/crm/contacts/:id/phones', () => {
  it('rejects a number that fails normalisation', async () => {
    const res = await POST(req({ phone: 'abc' }), staff() as never, params() as never);
    expect(res.status).toBe(400);
    expect(m.created).toHaveLength(0);
  });

  it('rejects an unknown label', async () => {
    const res = await POST(req({ phone: '01712345678', label: 'SPACESHIP' }), staff() as never, params() as never);
    expect(res.status).toBe(400);
  });

  it('refuses to re-add the contact primary number as a secondary row', async () => {
    const res = await POST(req({ phone: '+8801712345678' }), staff() as never, params() as never);
    expect(res.status).toBe(409);
  });

  it('adds a valid secondary number with an audit entry', async () => {
    const res = await POST(req({ phone: '01812345678', label: 'BUSINESS', isWhatsApp: true }), staff() as never, params() as never);
    expect(res.status).toBe(201);
    expect(m.created).toHaveLength(1);
    expect(m.created[0]).toMatchObject({ contactId: 'contact-1', label: 'BUSINESS', isWhatsApp: true, normalizedPhone: '8801812345678' });
    expect(m.audits[0]).toMatchObject({ action: 'CONTACT_PHONE_ADDED', entityId: 'contact-1' });
  });

  it('requires contacts.manage', async () => {
    m.auth = staff(['contacts.view']);
    const res = await POST(req({ phone: '01812345678' }), m.auth as never, params() as never);
    expect(res.status).toBe(403);
    expect(m.created).toHaveLength(0);
  });
});

describe('PATCH/DELETE /api/crm/contacts/:id/phones/:phoneId', () => {
  beforeEach(() => {
    m.phones = [{ id: 'cp-1', contactId: 'contact-1', phone: '01812345678', normalizedPhone: '8801812345678', label: 'PERSONAL', isPrimary: false, isWhatsApp: false }];
  });

  it('marks a number primary inside a transaction with audit', async () => {
    const res = await PATCH(new Request('https://alo.test/api/crm/contacts/contact-1/phones/cp-1', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isPrimary: true }),
    }), staff() as never, phoneParams() as never);
    expect(res.status).toBe(200);
    expect(m.updated[0].data).toMatchObject({ isPrimary: true });
    expect(m.audits[0]).toMatchObject({ action: 'CONTACT_PHONE_UPDATED' });
  });

  it('deletes only after auditing the removal', async () => {
    const res = await DELETE(new Request('https://alo.test/api/crm/contacts/contact-1/phones/cp-1', { method: 'DELETE' }), staff() as never, phoneParams() as never);
    expect(res.status).toBe(200);
    expect(m.audits[0]).toMatchObject({ action: 'CONTACT_PHONE_REMOVED' });
    expect(m.deleted).toEqual(['cp-1']);
  });

  it('404s for a number belonging to another contact', async () => {
    m.phones = [];
    const res = await DELETE(new Request('https://alo.test/api/crm/contacts/contact-1/phones/cp-1', { method: 'DELETE' }), staff() as never, phoneParams() as never);
    expect(res.status).toBe(404);
    expect(m.deleted).toHaveLength(0);
  });
});
