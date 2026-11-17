/**
 * /api/admin/prospects — B2B prospect research queue contract tests.
 *
 * Pins the Phase-6/7 guarantees:
 *   - dry-run never writes; apply creates only valid non-duplicate rows
 *   - GOOGLE_MAPS rows carrying restricted business contact details are refused
 *   - partner approval (APPROVED_PARTNER) is ADMIN/SUPER_ADMIN only
 *   - illegal lifecycle transitions are rejected with 409
 *   - DO_NOT_CONTACT sticks and cannot be transitioned out of
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => {
  const auth = {
    userId: 'user-1',
    userType: 'ADMIN',
    roles: ['admin'],
    authenticated: true,
  } as Record<string, unknown>;
  return {
    auth,
    auditCreate: vi.fn().mockResolvedValue(true),
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'bp-1' }),
    update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'bp-1', ...data })),
    originAllowed: true,
    rateLimitAllowed: true,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    b2bProspect: {
      findMany: (...args: unknown[]) => m.findMany(...args),
      findUnique: (...args: unknown[]) => m.findUnique(...args),
      create: (...args: unknown[]) => m.create(...args),
      update: (...args: unknown[]) => m.update(...args),
    },
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (req: NextRequest, auth: Record<string, unknown>) => Promise<Response>) =>
    async (request: NextRequest) => handler(request, m.auth),
  logAuditAction: (...args: unknown[]) => m.auditCreate(...args),
}));

vi.mock('@/lib/request-origin', () => ({
  mutationOriginAllowed: () => m.originAllowed,
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: () => ({ allowed: m.rateLimitAllowed, resetAt: Date.now() + 60_000 }),
}));

const { GET, POST, PATCH } = await import('@/app/api/admin/prospects/route');

function req(url: string, init?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: { 'content-type': 'application/json', origin: 'https://alo.test' },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

const goodRow = {
  organizationName: 'Dhaka Study Abroad Agency',
  contactPerson: 'Amina Rahman',
  businessEmail: 'info@exampleagency.com',
  businessPhone: '+8801712345678',
  officialWebsite: 'https://www.exampleagency.com',
  country: 'Bangladesh',
  city: 'Dhaka',
  organizationType: 'AGENCY',
  sourceType: 'HUMAN_GOOGLE_SEARCH',
  sourceUrl: 'https://www.exampleagency.com/contact',
  researchDate: '2026-11-10',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.auth.userType = 'ADMIN';
  m.auth.roles = ['admin'];
  m.originAllowed = true;
  m.rateLimitAllowed = true;
  m.findMany.mockResolvedValue([]);
  m.findUnique.mockResolvedValue(null);
  m.create.mockResolvedValue({ id: 'bp-1' });
  m.auditCreate.mockResolvedValue(true);
});

describe('GET /api/admin/prospects', () => {
  it('rejects non-admin roles (edge RBAC parity: /api/admin is ADMIN/SUPER_ADMIN)', async () => {
    m.auth.userType = 'COUNSELOR';
    expect((await GET(req('https://alo.test/api/admin/prospects'))).status).toBe(403);
    m.auth.userType = 'BRANCH_MANAGER';
    expect((await GET(req('https://alo.test/api/admin/prospects'))).status).toBe(403);
  });
});

describe('POST /api/admin/prospects — import', () => {
  it('dry-run is the default and writes nothing', async () => {
    const res = await POST(req('https://alo.test/api/admin/prospects', {
      method: 'POST',
      body: { rows: [goodRow] }, // no dryRun flag at all
    }));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.dryRun).toBe(true);
    expect(json.summary.valid).toBe(1);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('refuses Maps rows carrying business contact details even on apply', async () => {
    const mapsRow = { ...goodRow, sourceType: 'GOOGLE_MAPS' };
    const res = await POST(req('https://alo.test/api/admin/prospects', {
      method: 'POST',
      body: { rows: [mapsRow], dryRun: false },
    }));
    const json = await res.json();
    expect(json.created).toBe(0);
    expect(m.create).not.toHaveBeenCalled();
    expect(json.summary.invalid).toBe(1);
  });

  it('apply creates only valid, non-duplicate rows and keeps the audit trail', async () => {
    m.findMany.mockResolvedValue([{ dedupeKey: 'domain:exampleagency.com' }]); // everything dedupes in DB
    const res = await POST(req('https://alo.test/api/admin/prospects', {
      method: 'POST',
      body: { rows: [goodRow], dryRun: false },
    }));
    const json = await res.json();
    expect(json.created).toBe(0);
    expect(json.summary.duplicatesInDb).toBe(1);
    m.findMany.mockResolvedValue([]);
    const res2 = await POST(req('https://alo.test/api/admin/prospects', {
      method: 'POST',
      body: { rows: [goodRow], dryRun: false },
    }));
    const json2 = await res2.json();
    expect(json2.created).toBe(1);
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(m.auditCreate).toHaveBeenCalledWith(expect.anything(), 'B2B_PROSPECT_IMPORT', 'b2b_prospects', 'created', expect.objectContaining({ created: 1 }));
  });

  it('rejects cross-site apply attempts', async () => {
    m.originAllowed = false;
    const res = await POST(req('https://alo.test/api/admin/prospects', {
      method: 'POST',
      body: { rows: [goodRow], dryRun: false },
    }));
    expect(res.status).toBe(403);
    expect(m.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/admin/prospects — lifecycle approval authority', () => {
  it('blocks partner approval for any non-ADMIN/SUPER_ADMIN actor', async () => {
    // The edge RBAC blocks non-admins before the handler; the handler re-checks.
    // Either way, a non-admin can never approve a partner.
    m.auth.userType = 'BRANCH_MANAGER';
    m.findUnique.mockResolvedValue({ id: 'bp-1', relationshipStatus: 'NEGOTIATION', verificationStatus: 'DISCOVERED', doNotContact: false });
    const res = await PATCH(req('https://alo.test/api/admin/prospects', {
      method: 'PATCH',
      body: { id: 'bp-1', relationshipStatus: 'APPROVED_PARTNER' },
    }));
    expect(res.status).toBe(403);
    expect(m.update).not.toHaveBeenCalled();
  });

  it('allows a SUPER_ADMIN to approve a partner from NEGOTIATION', async () => {
    m.auth.userType = 'SUPER_ADMIN';
    m.auth.roles = ['super_admin'];
    m.findUnique.mockResolvedValue({ id: 'bp-1', relationshipStatus: 'NEGOTIATION', verificationStatus: 'DISCOVERED', doNotContact: false });
    const res = await PATCH(req('https://alo.test/api/admin/prospects', {
      method: 'PATCH',
      body: { id: 'bp-1', relationshipStatus: 'APPROVED_PARTNER' },
    }));
    expect(res.status).toBe(200);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ relationshipStatus: 'APPROVED_PARTNER', verificationStatus: 'APPROVED' }),
    }));
  });

  it('rejects illegal transitions with 409', async () => {
    m.auth.userType = 'ADMIN';
    m.auth.roles = ['admin'];
    m.findUnique.mockResolvedValue({ id: 'bp-1', relationshipStatus: 'DISCOVERED', verificationStatus: 'DISCOVERED', doNotContact: false });
    const res = await PATCH(req('https://alo.test/api/admin/prospects', {
      method: 'PATCH',
      body: { id: 'bp-1', relationshipStatus: 'NEGOTIATION' },
    }));
    expect(res.status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
  });

  it('DO_NOT_CONTACT is terminal and sticks', async () => {
    m.auth.userType = 'ADMIN';
    m.auth.roles = ['admin'];
    m.findUnique.mockResolvedValue({ id: 'bp-1', relationshipStatus: 'DO_NOT_CONTACT', verificationStatus: 'DISCOVERED', doNotContact: true });
    const res = await PATCH(req('https://alo.test/api/admin/prospects', {
      method: 'PATCH',
      body: { id: 'bp-1', relationshipStatus: 'CONTACTED' },
    }));
    expect(res.status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
  });
});
