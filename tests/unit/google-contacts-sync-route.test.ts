/**
 * Google Contacts sync route — failure and recovery tests (spec §7, §21, §24).
 *
 * The planner tests live in google-contacts.test.ts. This file proves the route
 * wrapper: dry-run never writes, a failed Google read is recorded as FAILED and
 * returns 502/504, an apply run records its batch, and a write failure is counted
 * and reported — never silently swallowed and never reported as success.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  denied: false as null | Record<string, unknown>,
  configured: true,
  readResult: {
    status: 'READY',
    reason: null as string | null,
    googleErrorReason: null as string | null,
    data: {
      people: [] as Array<Record<string, unknown>>,
      usedIncremental: false,
      truncated: false,
      pages: 1,
      nextSyncToken: 'token-abc',
    },
  } as Record<string, unknown>,
  importBatchCreate: vi.fn(),
  importBatchUpdate: vi.fn(),
  importErrorCreateMany: vi.fn(),
  contactCreate: vi.fn(),
  contactUpdateMany: vi.fn(),
  reviewFindFirst: vi.fn(),
  reviewCreate: vi.fn(),
  auditCreate: vi.fn(),
  socialFindFirst: vi.fn(),
  socialCreate: vi.fn(),
  socialUpdate: vi.fn(),
}));

vi.mock('@/lib/google/access', () => ({
  requireGoogleAccess: async () =>
    m.denied ? NextResponse.json({ error: 'Missing required permissions.' }, { status: 403 }) : { userId: 'user-1', actorUserId: 'user-1', roles: ['super_admin'] },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimitMiddleware: () => null,
}));

vi.mock('@/lib/google/contacts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/google/contacts')>('@/lib/google/contacts');
  return {
    ...actual,
    describeContactsConfig: () => ({
      configured: m.configured,
      account: 'alo.allcontacts@gmail.com',
      scope: 'https://www.googleapis.com/auth/contacts.readonly',
      authMode: 'oauth-refresh-token',
      note: m.configured ? null : 'No GOOGLE_CONTACTS_REFRESH_TOKEN is set.',
    }),
    listAllConnections: async () => m.readResult,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    socialIntegration: {
      findFirst: (...args: unknown[]) => m.socialFindFirst(...args),
      create: (...args: unknown[]) => m.socialCreate(...args),
      update: (...args: unknown[]) => m.socialUpdate(...args),
    },
    whatsAppContact: {
      findMany: async () => [],
      create: (...args: unknown[]) => m.contactCreate(...args),
      updateMany: (...args: unknown[]) => m.contactUpdateMany(...args),
      count: async () => 0,
    },
    contactMatchReview: {
      findFirst: (...args: unknown[]) => m.reviewFindFirst(...args),
      create: (...args: unknown[]) => m.reviewCreate(...args),
    },
    importBatch: {
      create: (...args: unknown[]) => m.importBatchCreate(...args),
      update: (...args: unknown[]) => m.importBatchUpdate(...args),
      findFirst: async () => null,
    },
    importError: {
      createMany: (...args: unknown[]) => m.importErrorCreateMany(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => m.auditCreate(...args),
    },
    portalAuditLog: {
      create: async () => ({ id: 'portal-audit' }),
    },
  },
}));

const { POST } = await import('@/app/api/google/contacts/sync/route');

const person = {
  resourceName: 'people/c-new-1',
  displayName: 'New Person',
  phones: [{ value: '01712345678', normalized: '8801712345678', type: 'mobile' }],
  emails: ['new.person@example.com'],
  etag: '"etag-1"',
  deleted: false,
};

function req(body: unknown) {
  return new Request('https://alo.test/api/google/contacts/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://alo.test' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.denied = null;
  m.configured = true;
  m.readResult = {
    status: 'READY',
    reason: null,
    data: { people: [person], usedIncremental: false, truncated: false, pages: 1, nextSyncToken: 'token-abc' },
  };
  m.importBatchCreate.mockResolvedValue({ id: 'batch-1' });
  m.importBatchUpdate.mockResolvedValue({});
  m.importErrorCreateMany.mockResolvedValue({ count: 1 });
  m.contactCreate.mockResolvedValue({ id: 'contact-1' });
  m.contactUpdateMany.mockResolvedValue({ count: 1 });
  m.reviewFindFirst.mockResolvedValue(null);
  m.reviewCreate.mockResolvedValue({ id: 'review-1' });
  m.auditCreate.mockResolvedValue({ id: 'audit-1' });
  m.socialFindFirst.mockResolvedValue(null);
  m.socialCreate.mockResolvedValue({ id: 'social-1' });
  m.socialUpdate.mockResolvedValue({ id: 'social-1' });
});

describe('configuration gate', () => {
  it('returns 409 NOT_CONFIGURED and writes nothing when Google OAuth is not set up', async () => {
    m.configured = false;
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, status: 'NOT_CONFIGURED' });
    expect(m.importBatchCreate).not.toHaveBeenCalled();
    expect(m.contactCreate).not.toHaveBeenCalled();
  });

  it('is refused before the body is even read when the caller lacks google.integrations.manage', async () => {
    m.denied = { error: 'nope' };
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(403);
    expect(m.contactCreate).not.toHaveBeenCalled();
  });
});

describe('dry-run is the default and writes nothing', () => {
  it('omitting the body plans without writing', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, mode: 'dry-run', wroteNothing: true });
    expect(m.importBatchCreate).not.toHaveBeenCalled();
    expect(m.contactCreate).not.toHaveBeenCalled();
  });
});

describe('failed Google reads — recorded, never silent', () => {
  it('records the failure in the audit log and returns 502 with wroteNothing', async () => {
    m.readResult = { status: 'FAILED', reason: 'invalid_grant — the refresh token was revoked or expired', googleErrorReason: 'invalid_grant', data: undefined };
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, status: 'FAILED', wroteNothing: true, googleErrorReason: 'invalid_grant' });
    expect(m.importBatchCreate).not.toHaveBeenCalled();
    expect(m.contactCreate).not.toHaveBeenCalled();
    expect(m.auditCreate).toHaveBeenCalledTimes(1);
    expect(String(m.auditCreate.mock.calls[0][0].data.details)).toContain('"outcome":"FAILED"');
  });

  it('returns 504 when Google times out', async () => {
    m.readResult = { status: 'TIMEOUT', reason: 'The People API did not answer in time', data: undefined };
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(504);
    expect(m.importBatchCreate).not.toHaveBeenCalled();
  });
});

describe('apply mode — honest bookkeeping', () => {
  it('creates the new contact and completes the batch', async () => {
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, mode: 'apply', batchId: 'batch-1' });
    expect(m.contactCreate).toHaveBeenCalledTimes(1);
    const createData = m.contactCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(createData).toMatchObject({ source: 'GOOGLE_CONTACTS', externalContactId: 'people/c-new-1' });
    expect(String(createData.tags)).toContain('identity:UNVERIFIED');
    expect(m.importBatchUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'completed', newCount: 1 }),
    }));
    expect(m.auditCreate).toHaveBeenCalledTimes(1);
  });

  it('a write failure is counted, reported and marks the batch completed_with_errors — never hidden', async () => {
    m.contactCreate.mockRejectedValue(Object.assign(new Error('Unique constraint failed on the fields: (`normalizedPhone`)'), { code: 'P2002' }));
    const res = await POST(req({ mode: 'apply' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, mode: 'apply' });
    expect(body.written.errors).toBe(1);
    expect(m.importErrorCreateMany).toHaveBeenCalledTimes(1);
    expect(m.importBatchUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'completed_with_errors', errorCount: 1 }),
    }));
    // The audit trail records the outcome, not just the request.
    expect(String(m.auditCreate.mock.calls[0][0].data.details)).toContain('"outcome":"COMPLETED"');
  });
});
