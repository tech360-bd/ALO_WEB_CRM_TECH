import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  marketingAccessFindUnique: vi.fn(),
  portalSessionFindUnique: vi.fn(),
  portalSessionUpdate: vi.fn(),
  portalAuditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
  withAuth: (handler: any) => async (req: Request, ctx?: any) => {
    const auth = await mocks.authenticateRequest(req);
    if (auth instanceof Response) return auth;
    return handler(req, auth, ctx);
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    marketingUserAccess: {
      findUnique: mocks.marketingAccessFindUnique,
    },
    portalSession: {
      findUnique: mocks.portalSessionFindUnique,
      update: mocks.portalSessionUpdate,
    },
    portalAuditLog: {
      create: mocks.portalAuditCreate,
    },
    $transaction: mocks.transaction,
  },
}));

import { isPublicApiRequest } from '@/proxy';
import { GET as facebookAuthGET } from '@/app/api/facebook/auth/route';
import { GET as socialAuthGET } from '@/app/api/social/[provider]/auth/route';
import { POST as socialPublishPOST } from '@/app/api/marketing/social/publish/route';
import { POST as seoAuditPOST } from '@/app/api/seo/audit/route';
import { POST as revokeSessionPOST } from '@/app/api/super-admin/security/revoke-session/route';

beforeEach(() => {
  mocks.marketingAccessFindUnique.mockReset().mockResolvedValue(null);
  mocks.portalSessionFindUnique.mockReset().mockResolvedValue({
    id: 'sess-99',
    userId: 'user-99',
    revokedAt: null,
  });
  mocks.portalSessionUpdate.mockReset().mockResolvedValue({ id: 'sess-99' });
  mocks.portalAuditCreate.mockReset().mockResolvedValue({ id: 'aud-1' });
  mocks.transaction.mockReset().mockImplementation((fn) =>
    fn({
      portalSession: {
        update: mocks.portalSessionUpdate,
      },
      portalAuditLog: {
        create: mocks.portalAuditCreate,
      },
    }),
  );
});

describe('Proxy Public vs Protected API Boundary (src/proxy.ts)', () => {
  it('allows signed OpenSMS and Facebook webhooks while keeping OAuth, SEO, Marketing, and Super Admin behind auth', () => {
    expect(isPublicApiRequest('/api/integrations/opensms/webhook', 'POST')).toBe(true);
    expect(isPublicApiRequest('/api/integrations/opensms/webhook', 'GET')).toBe(false);

    expect(isPublicApiRequest('/api/facebook/webhook', 'GET')).toBe(true);
    expect(isPublicApiRequest('/api/facebook/webhook', 'POST')).toBe(true);
    expect(isPublicApiRequest('/api/facebook/auth', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/facebook/callback', 'GET')).toBe(false);

    expect(isPublicApiRequest('/api/social/instagram/auth', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/social/instagram/callback', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/marketing/social/publish', 'POST')).toBe(false);
    expect(isPublicApiRequest('/api/seo/audit', 'POST')).toBe(false);
    expect(isPublicApiRequest('/api/super-admin/reports/generate', 'POST')).toBe(false);
    expect(isPublicApiRequest('/api/super-admin/security/revoke-session', 'POST')).toBe(false);
  });
});

describe('Authentication, RBAC & Acting-As Negative Tests', () => {
  it('returns 401 when unauthenticated and 403 when STUDENT or COUNSELOR calls privileged endpoints', async () => {
    mocks.authenticateRequest.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );
    const unauthSeo = await seoAuditPOST(
      new Request('https://alo.test/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({ entityType: 'destination', slug: 'uk' }),
      }),
    );
    expect(unauthSeo.status).toBe(401);

    for (const forbiddenRole of ['STUDENT', 'COUNSELOR', 'PARTNER']) {
      mocks.authenticateRequest.mockResolvedValue({
        userId: `u-${forbiddenRole}`,
        actorUserId: `u-${forbiddenRole}`,
        userType: forbiddenRole,
        roles: [forbiddenRole],
        permissions: [],
      });

      const fbRes = await facebookAuthGET(new Request('https://alo.test/api/facebook/auth'));
      expect(fbRes.status).toBe(403);

      const igRes = await socialAuthGET(new Request('https://alo.test/api/social/instagram/auth'), {
        params: Promise.resolve({ provider: 'instagram' }),
      });
      expect(igRes.status).toBe(403);

      const pubRes = await socialPublishPOST(
        new Request('https://alo.test/api/marketing/social/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
          body: JSON.stringify({ platform: 'linkedin', text: 'Unauthorized attempt' }),
        }),
      );
      expect(pubRes.status).toBe(403);

      const seoRes = await seoAuditPOST(
        new Request('https://alo.test/api/seo/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
          body: JSON.stringify({ entityType: 'destination', slug: 'uk' }),
        }),
      );
      expect(seoRes.status).toBe(403);

      const saRes = await revokeSessionPOST(
        new Request('https://alo.test/api/super-admin/security/revoke-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
          body: JSON.stringify({ sessionId: 'sess-99', reason: 'Attempted unauthorized revoke' }),
        }),
      );
      expect(saRes.status).toBe(403);
    }
  });

  it('blocks SUPER_ADMIN in an Acting-As session from OAuth credential mutation, social publishing, and session revocation', async () => {
    mocks.authenticateRequest.mockResolvedValue({
      userId: 'emp-7',
      actorUserId: 'sa-1',
      userType: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      permissions: [],
      actingAsSessionId: 'act-1',
      actingAsRole: 'COUNSELOR',
    });

    const fbRes = await facebookAuthGET(new Request('https://alo.test/api/facebook/auth'));
    expect(fbRes.status).toBe(403);

    const igRes = await socialAuthGET(new Request('https://alo.test/api/social/instagram/auth'), {
      params: Promise.resolve({ provider: 'instagram' }),
    });
    expect(igRes.status).toBe(403);

    const pubRes = await socialPublishPOST(
      new Request('https://alo.test/api/marketing/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({ platform: 'linkedin', text: 'Acting-as attempt' }),
      }),
    );
    expect(pubRes.status).toBe(403);

    const saRes = await revokeSessionPOST(
      new Request('https://alo.test/api/super-admin/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({ sessionId: 'sess-99', reason: 'Acting-as session revoke attempt' }),
      }),
    );
    expect(saRes.status).toBe(403);
  });
});

describe('Transactional Audit & Live Destination SEO Audit', () => {
  it('aborts Super Admin session revocation if transactional audit log creation fails', async () => {
    mocks.authenticateRequest.mockResolvedValue({
      userId: 'sa-1',
      actorUserId: 'sa-1',
      userType: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      permissions: [],
      isSuperAdmin: true,
    });
    mocks.portalAuditCreate.mockRejectedValueOnce(new Error('audit db failure'));

    const res = await revokeSessionPOST(
      new Request('https://alo.test/api/super-admin/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({
          sessionId: 'sess-99',
          reason: 'Suspicious IP spike detected in 24h window',
        }),
      }),
    );
    expect(res.status).toBe(503);
  });

  it('audits a real ALO destination guide with structured data and explicit non-indexation boundary', async () => {
    mocks.authenticateRequest.mockResolvedValue({
      userId: 'mkt-1',
      actorUserId: 'mkt-1',
      userType: 'MARKETING_MANAGER',
      roles: ['MARKETING_MANAGER'],
      permissions: [],
    });

    const res = await seoAuditPOST(
      new Request('https://alo.test/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
        body: JSON.stringify({ entityType: 'destination', slug: 'uk' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verification).toBe('deterministic_content_audit_not_search_engine_indexation');
    expect(body.report.jsonLd.detectedTypes).toEqual(
      expect.arrayContaining(['EducationalOrganization', 'BreadcrumbList']),
    );
  });
});

describe('Responsive Layout, Accessibility & CSV Formula-Injection Invariants', () => {
  it('enforces accessible dialog/form semantics, responsive tables, CSV formula defense, and single-footer policy across modified UIs', () => {
    const uiFiles = [
      'src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx',
      'src/components/admin/super-admin-operating/SuperAdminExtendedPanels.tsx',
      'src/components/marketing/hub/IntegrationsView.tsx',
      'src/components/marketing/hub/SEOBlogManagerView.tsx',
      'src/components/marketing/hub/LeadGenerationView.tsx',
    ];

    for (const relPath of uiFiles) {
      const content = readFileSync(join(process.cwd(), relPath), 'utf8');
      expect(content, `${relPath} must not introduce a duplicate <footer> landmark`).not.toMatch(
        /<footer\b/,
      );
      expect(content, `${relPath} must use responsive grid classes`).toMatch(/grid-cols-1/);
    }

    const dashboardSrc = readFileSync(
      join(
        process.cwd(),
        'src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx',
      ),
      'utf8',
    );
    expect(dashboardSrc).toContain('role="dialog"');
    expect(dashboardSrc).toContain('aria-modal="true"');

    const leadGenSrc = readFileSync(
      join(process.cwd(), 'src/components/marketing/hub/LeadGenerationView.tsx'),
      'utf8',
    );
    // Formula-injection neutralization prefix for =, +, -, @
    expect(leadGenSrc).toContain('/^[=+\\-@]/');
  });
});
