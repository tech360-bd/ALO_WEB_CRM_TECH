/**
 * Contact security — route-level tests (Phase 2 §7).
 *
 * The earlier suites prove the *policy* functions behave. This file proves the HTTP
 * routes actually call them, in the right order, and that the observable failure
 * modes are the intended ones: a portal session is refused before any database read,
 * a reviewer cannot execute a merge, a stale preview cannot be applied, and a failed
 * audit is reported rather than swallowed.
 *
 * Everything is mocked at the module boundary (auth, database, scope), so nothing
 * here touches Prisma or a real database.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: null as null | Record<string, unknown>,
  /** Rows the mocked database returns. */
  contacts: [] as Array<Record<string, unknown>>,
  audits: [] as Array<Record<string, unknown>>,
  reviews: [] as Array<Record<string, unknown>>,
  updates: [] as Array<{ where: Record<string, unknown>; data: Record<string, unknown> }>,
  reads: [] as string[],
  auditShouldFail: false,
  identifyFactory: null as null | ((phone: string) => unknown),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: Request, auth: unknown, context?: unknown) => unknown, options?: { requirePermissions?: string[] }) =>
    (req: Request, context?: unknown) => {
      if (!m.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const permissions = (m.auth.permissions as string[]) || [];
      const missing = (options?.requirePermissions || []).filter((permission) => !permissions.includes(permission));
      if (missing.length > 0) return NextResponse.json({ error: 'Missing required permissions.' }, { status: 403 });
      return handler(req, m.auth, context);
    },
}));

vi.mock('@/lib/request-origin', () => ({ mutationOriginAllowed: () => true }));

vi.mock('@/lib/contacts/access-scope', () => ({
  hasCompanyWideContactAccess: (auth: { roles: string[]; permissions: string[] }) =>
    auth.roles.map((role) => role.toLowerCase()).includes('super_admin') || auth.permissions.includes('data.view_all'),
  contactScopeWhere: async () => ({}),
}));

// The identification module is database-backed; keep the pure card implementation and
// swap only the read.
vi.mock('@/lib/contacts/identification', async () => {
  const card = await vi.importActual<typeof import('@/lib/contacts/identification-card')>('@/lib/contacts/identification-card');
  return {
    rejectNameOnlyIdentification: card.rejectNameOnlyIdentification,
    identifyByPhone: (phone: string) => {
      m.reads.push(`identify:${phone}`);
      return m.identifyFactory ? m.identifyFactory(phone) : null;
    },
  };
});

vi.mock('@/lib/db', () => {
  const whatsAppContact = {
    findMany: async (args: { where?: { id?: { in?: string[] } } }) => {
      m.reads.push('whatsAppContact.findMany');
      const ids = args?.where?.id?.in;
      return ids ? m.contacts.filter((row) => ids.includes(String(row.id))) : m.contacts;
    },
    updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      m.updates.push(args);
      const ids = [args.where.id];
      const matched = m.contacts.filter((row) => ids.includes(row.id));
      const stampMatches = matched.every((row) => !args.where.updatedAt || new Date(String(row.updatedAt)).getTime() === new Date(args.where.updatedAt as string).getTime());
      return { count: matched.length > 0 && stampMatches ? matched.length : 0 };
    },
    update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      m.updates.push(args);
      return { ...(m.contacts.find((row) => row.id === args.where.id) || {}), ...args.data };
    },
    count: async () => 0,
  };
  const tx = {
    whatsAppContact,
    portalAuditLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        if (m.auditShouldFail) throw new Error('audit table unavailable');
        m.audits.push(args.data);
        return { id: `audit-${m.audits.length}` };
      },
    },
    contactMatchReview: {
      create: async (args: { data: Record<string, unknown> }) => {
        m.reviews.push(args.data);
        return { id: `review-${m.reviews.length}` };
      },
    },
  };
  return {
    db: {
      ...tx,
      $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
      auditLog: { create: async (args: { data: Record<string, unknown> }) => {
        if (m.auditShouldFail) throw new Error('audit table unavailable');
        m.audits.push(args.data);
        return { id: `audit-${m.audits.length}` };
      } },
      communicationConsent: { count: async () => 0 },
      whatsAppFollowUpSchedule: { count: async () => 0 },
      uccConversation: { count: async () => 0 },
      whatsAppMessageArchive: { count: async () => 0 },
      communicationMessage: { count: async () => 0 },
      contactMatchReview: { findFirst: async () => null, create: async () => ({ id: 'review' }) },
    },
  };
});

const { GET: identifyGet, POST: identifyPost } = await import('@/app/api/crm/contacts/identify/route');
const { POST: mergePost } = await import('@/app/api/crm/contacts/merge/route');
const { buildIdentificationCard } = await import('@/lib/contacts/identification-card');
const { resolveContactIdentity } = await import('@/lib/communications/contact-identity');

const STAFF_PERMISSIONS = ['contacts.view', 'contacts.merge_review'];

function staff(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-1',
    actorUserId: 'user-1',
    roles: ['counselor'],
    permissions: STAFF_PERMISSIONS,
    userType: 'EMPLOYEE',
    branch: 'Dhaka',
    partnerId: null,
    ...overrides,
  };
}

function identifyUrl(phone?: string, name?: string) {
  const params = new URLSearchParams();
  if (phone) params.set('phone', phone);
  if (name) params.set('name', name);
  return new Request(`https://crm.alo.test/api/crm/contacts/identify?${params.toString()}`);
}

function contactRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    phone: '01712345678',
    normalizedPhone: '8801712345678',
    displayName: 'Rakib Hasan',
    profileName: '',
    email: '',
    normalizedEmail: '',
    countryCode: '880',
    externalContactId: '',
    studentId: '',
    leadId: '',
    partnerId: '',
    assignedCounselorId: '',
    branch: 'Dhaka',
    source: 'WHATSAPP',
    isBlocked: false,
    isOptedOut: false,
    optedOutAt: null,
    tags: '[]',
    updatedAt: new Date('2026-11-15T10:00:00.000Z'),
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    ...overrides,
  };
}

/** A real card built by the real builder, so scope assertions test real logic. */
function cardFor(input: { phone: string; kind?: 'student' | 'lead'; counselorId?: string }) {
  const candidate = {
    kind: input.kind || 'student',
    id: 'stu_1',
    reference: 'AE-2026000001',
    name: 'Rakib Hasan',
    phone: '8801712345678',
    email: '',
    matchedOn: 'phone' as const,
  };
  const match = resolveContactIdentity({ phone: input.phone, altPhone: input.phone }, [candidate]);
  return buildIdentificationCard({
    phone: input.phone,
    match,
    guardians: [],
    profiles: new Map([[
      `${candidate.kind}:stu_1`,
      {
        kind: candidate.kind as 'student' | 'lead',
        recordId: 'stu_1',
        publicId: 'AE-2026000001',
        name: 'Rakib Hasan',
        lifecycleStage: 'lead_created',
        status: 'active',
        phones: [{ value: '8801712345678', normalized: '8801712345678', source: 'student.phone' as const }],
        email: '',
        photoUrl: null,
        photoReason: 'none',
        parentGuardian: [],
        counselor: input.counselorId ? { id: input.counselorId, name: 'Counsellor' } : null,
        application: null,
        lastConversation: null,
        openFollowUps: [],
        historyCount: 0,
        profileHref: '/crm/students/stu_1',
        scopeNotice: null,
      },
    ]]),
    registryContactId: 'reg_1',
    startedAt: performance.now(),
  });
}

beforeEach(() => {
  m.contacts = [];
  m.audits = [];
  m.reviews = [];
  m.updates = [];
  m.reads = [];
  m.auditShouldFail = false;
  m.identifyFactory = null;
  m.auth = staff();
});

describe('identification — who may ask', () => {
  it('refuses a portal session before any database read', async () => {
    m.auth = staff({ userType: 'STUDENT', roles: ['student'], permissions: [] });
    const response = await identifyGet(identifyUrl('01712345678'));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe('STAFF_ONLY');
    expect(m.reads).toHaveLength(0);
  });

  it('refuses a partner portal session the same way', async () => {
    m.auth = staff({ userType: 'PARTNER', roles: ['partner'], permissions: [] });
    const response = await identifyGet(identifyUrl('01712345678'));
    expect(response.status).toBe(403);
    expect(m.reads).toHaveLength(0);
  });

  it('refuses name-only identification with an explicit code', async () => {
    const response = await identifyGet(identifyUrl(undefined, 'Rakib Hasan'));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('NAME_ONLY_NOT_ALLOWED');
    expect(m.reads).toHaveLength(0);
  });

  it('refuses a POST without a phone number', async () => {
    const request = new Request('https://crm.alo.test/api/crm/contacts/identify', {
      method: 'POST',
      body: JSON.stringify({ name: 'Rakib Hasan' }),
    });
    const response = await identifyPost(request);
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('NAME_ONLY_NOT_ALLOWED');
  });

  it('refuses a role with no contact scope', async () => {
    m.auth = staff({ roles: ['vendor'], permissions: ['contacts.view'] });
    const response = await identifyGet(identifyUrl('01712345678'));
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('SCOPE_NONE');
  });
});

describe('identification — scope and audit', () => {
  it('withholds another counsellor’s record from an assigned-scope viewer', async () => {
    m.auth = staff({ roles: ['counselor'], branch: null });
    m.identifyFactory = () => cardFor({ phone: '01712345678', counselorId: 'someone-else' });
    const response = await identifyGet(identifyUrl('01712345678'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.restricted).toBe(true);
    expect(body.primary).toBeNull();
    expect(body.possible).toEqual([]);
    expect(body.notice).toMatch(/withheld/i);
  });

  it('returns the full card to the owning counsellor', async () => {
    m.auth = staff({ roles: ['counselor'], branch: null });
    m.identifyFactory = () => cardFor({ phone: '01712345678', counselorId: 'user-1' });
    const response = await identifyGet(identifyUrl('01712345678'));
    const body = await response.json();
    expect(body.restricted).toBe(false);
    expect(body.primary.publicId).toBe('AE-2026000001');
  });

  it('returns the full card to a company-wide role', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view'] });
    m.identifyFactory = () => cardFor({ phone: '01712345678', counselorId: 'someone-else' });
    const response = await identifyGet(identifyUrl('01712345678'));
    const body = await response.json();
    expect(body.restricted).toBe(false);
  });

  it('records the lookup in the audit log', async () => {
    m.identifyFactory = () => cardFor({ phone: '01712345678', counselorId: 'user-1' });
    await identifyGet(identifyUrl('01712345678'));
    expect(m.audits).toHaveLength(1);
    expect(m.audits[0].action).toBe('contacts.identify');
    // The number is masked in the audit trail.
    expect(String(m.audits[0].details)).not.toContain('01712345678');
  });

  it('reports an audit failure instead of hiding it', async () => {
    m.auditShouldFail = true;
    m.identifyFactory = () => cardFor({ phone: '01712345678', counselorId: 'user-1' });
    const response = await identifyGet(identifyUrl('01712345678'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.audit.recorded).toBe(false);
    expect(body.audit.note).toMatch(/could not be written/i);
  });
});

describe('merge — authorisation and confirmation', () => {
  function mergeRequest(body: Record<string, unknown>) {
    return new Request('https://crm.alo.test/api/crm/contacts/merge', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  it('refuses a preview to a caller without the review permission', async () => {
    m.auth = staff({ roles: ['counselor'], permissions: ['contacts.view'] });
    const response = await mergePost(mergeRequest({ mode: 'preview', destinationId: 'dest', sourceIds: ['src'] }));
    expect(response.status).toBe(403);
  });

  it('refuses execution to a reviewer who lacks contacts.merge_execute', async () => {
    m.contacts = [contactRow('dest'), contactRow('src', { normalizedPhone: '8801812345678', phone: '01812345678' })];
    const response = await mergePost(mergeRequest({
      mode: 'execute', destinationId: 'dest', sourceIds: ['src'], reason: 'Same person, two numbers', confirmationToken: 'x',
    }));
    expect(response.status).toBe(403);
    expect(m.updates).toHaveLength(0);
  });

  it('previews without writing anything', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review', 'contacts.merge_execute'] });
    m.contacts = [contactRow('dest'), contactRow('src', { normalizedPhone: '8801812345678', phone: '01812345678' })];
    const response = await mergePost(mergeRequest({ mode: 'preview', destinationId: 'dest', sourceIds: ['src'] }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.plan.ok).toBe(true);
    expect(body.wroteNothing).toBe(true);
    expect(body.plan.confirmationToken).toHaveLength(32);
    expect(m.updates).toHaveLength(0);
    expect(m.audits).toHaveLength(0);
  });

  it('refuses a source outside the caller’s scope', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review'] });
    m.contacts = [contactRow('dest')];
    const response = await mergePost(mergeRequest({ mode: 'preview', destinationId: 'dest', sourceIds: ['missing'] }));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.missing).toEqual(['missing']);
  });

  it('refuses to merge two different students', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review'] });
    m.contacts = [contactRow('dest', { studentId: 'stu_1' }), contactRow('src', { studentId: 'stu_2' })];
    const response = await mergePost(mergeRequest({ mode: 'preview', destinationId: 'dest', sourceIds: ['src'] }));
    const body = await response.json();
    expect(body.plan.ok).toBe(false);
    expect(body.plan.blockers.join(' ')).toMatch(/rewrite a student identity/i);
  });

  it('refuses execution without a written reason', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review', 'contacts.merge_execute'] });
    m.contacts = [contactRow('dest'), contactRow('src', { normalizedPhone: '8801812345678' })];
    const response = await mergePost(mergeRequest({ mode: 'execute', destinationId: 'dest', sourceIds: ['src'], reason: 'short', confirmationToken: 'x' }));
    expect(response.status).toBe(400);
    expect(m.updates).toHaveLength(0);
  });

  it('refuses a stale preview token', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review', 'contacts.merge_execute'] });
    m.contacts = [contactRow('dest'), contactRow('src', { normalizedPhone: '8801812345678' })];
    const response = await mergePost(mergeRequest({
      mode: 'execute', destinationId: 'dest', sourceIds: ['src'], reason: 'Same person, two numbers', confirmationToken: 'deadbeefdeadbeefdeadbeefdeadbeef',
    }));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('STALE_PREVIEW');
    expect(m.updates).toHaveLength(0);
  });

  it('executes a confirmed merge transactionally and records it', async () => {
    m.auth = staff({ roles: ['super_admin'], permissions: ['contacts.view', 'contacts.merge_review', 'contacts.merge_execute'] });
    m.contacts = [contactRow('dest'), contactRow('src', { normalizedPhone: '8801812345678', phone: '01812345678' })];

    const preview = await (await mergePost(mergeRequest({ mode: 'preview', destinationId: 'dest', sourceIds: ['src'] }))).json();
    const token = preview.plan.confirmationToken;

    const response = await mergePost(mergeRequest({
      mode: 'execute', destinationId: 'dest', sourceIds: ['src'], reason: 'Same person, two numbers', confirmationToken: token,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.merged).toBe(true);
    // Destination and alias were both written, each guarded by its own updatedAt.
    expect(m.updates).toHaveLength(2);
    expect(m.updates[0].where.updatedAt).toBeDefined();
    // The source is kept as an alias, never deleted.
    expect(String(m.updates[1].data.tags)).toContain('merged_into:dest');
    // Full snapshot for recovery, plus one decision record.
    expect(m.audits).toHaveLength(1);
    expect(m.audits[0].action).toBe('CONTACT_MERGED');
    expect(String(m.audits[0].metadata)).toContain('"before"');
    expect(m.reviews).toHaveLength(1);
    expect(m.reviews[0].status).toBe('MERGED');
  });
});
