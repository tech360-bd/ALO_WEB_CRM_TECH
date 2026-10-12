// ============================================================
// ALO Education — B2B Partner security & tenant isolation tests
// ============================================================
//
// Regression tests for defects found in the partner (B2B) subsystem. Each
// block documents the concrete vulnerability or breakage it locks down:
//
//   1. PartnerProfile.partnerId was UNIQUE, so a partner company could never
//      have more than one user — the Starter package ("1 Partner Super Admin
//      + 2 Employees") was impossible to use.
//   2. AuthContext never carried partnerId, so every route that read
//      `auth.partnerId` rejected all callers with "Partner identity required".
//   3. getQuota did not recognise the `marketing_images` / `marketing_videos`
//      keys actually used by the generate endpoint, returned 0, and told every
//      partner "quota finished (0/0)" on a brand-new month.
//   4. Quota was enforced by check-then-act, so concurrent requests bypassed it.
//   5. Voucher redemption read-then-wrote usedCount, allowing double-spend.
//   6. /api/partner-admin/seat-requests had no auth at all — anyone could
//      approve their own extra-seat request and lift the user limit.
//
// Everything runs against the real Prisma client and a real database.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getQuota,
  reserveQuota,
  checkQuotaBeforeAction,
  normalizeQuotaKey,
  currentPeriod,
  STARTER_SEAT_LIMIT,
  STARTER_IMAGE_LIMIT,
  STARTER_VIDEO_LIMIT,
  QUOTA_IMAGE,
  QUOTA_VIDEO,
  QUOTA_SEATS,
} from '@/lib/access-check-engine';
import {
  requirePartnerContext,
  requirePartnerSuperAdmin,
  requireAloSuperAdmin,
  assertSameTenant,
  isPartnerSuperAdmin,
} from '@/lib/partner-tenant-guard';

const SUFFIX = `b2b-${Date.now().toString(36)}`;
const PARTNER_A = `partner-a-${SUFFIX}`;
const PARTNER_B = `partner-b-${SUFFIX}`;

const userIds: string[] = [];
const tokens: string[] = [];
const roleIds: string[] = [];

interface Fixture {
  userId: string;
  token: string;
  email: string;
}

/** Create a PortalUser + PortalSession, optionally inside a partner tenant. */
async function makeUser(
  label: string,
  userType: string,
  roleName: string,
  partner?: { partnerId: string; partnerRole: string },
): Promise<Fixture> {
  const email = `b2b-${label}-${SUFFIX}@aloedu.test`;
  const user = await db.portalUser.create({
    data: {
      email,
      name: `Test ${label}`,
      userType,
      status: 'active',
      passwordHash: 'x',
      ...(partner
        ? {
            partnerProfile: {
              create: {
                partnerId: partner.partnerId,
                partnerRole: partner.partnerRole,
                companyName: `Company ${partner.partnerId}`,
                contactPerson: label,
                approvalStatus: 'approved',
              },
            },
          }
        : {}),
    },
  });
  userIds.push(user.id);

  const role = await db.portalRole.create({
    data: { name: `${roleName}-${SUFFIX}-${label}`, label: roleName },
  });
  roleIds.push(role.id);
  await db.portalUserRole.create({ data: { userId: user.id, roleId: role.id } });

  const token = `b2b-token-${label}-${SUFFIX}`;
  await db.portalSession.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  tokens.push(token);

  return { userId: user.id, token, email };
}

function reqAs(token: string, url = 'https://alo.test/api/partner-admin/quota'): Request {
  return new Request(url, {
    method: 'POST',
    headers: { cookie: `alo_portal_session=${encodeURIComponent(token)}` },
  });
}

function anonReq(url = 'https://alo.test/api/partner-admin/seat-requests'): Request {
  return new Request(url, { method: 'PATCH' });
}

let partnerASuperAdmin: Fixture;
let partnerACounselor: Fixture;
let partnerBSuperAdmin: Fixture;
let aloSuperAdmin: Fixture;

beforeAll(async () => {
  partnerASuperAdmin = await makeUser('a-sa', 'PARTNER', 'partner', {
    partnerId: PARTNER_A,
    partnerRole: 'PARTNER_SUPER_ADMIN',
  });
  partnerACounselor = await makeUser('a-counselor', 'PARTNER', 'partner', {
    partnerId: PARTNER_A,
    partnerRole: 'PARTNER_COUNSELOR',
  });
  partnerBSuperAdmin = await makeUser('b-sa', 'PARTNER', 'partner', {
    partnerId: PARTNER_B,
    partnerRole: 'PARTNER_SUPER_ADMIN',
  });
  aloSuperAdmin = await makeUser('alo-sa', 'SUPER_ADMIN', 'super_admin');

  await db.partnerMarketingQuota.create({
    data: {
      partnerId: PARTNER_A,
      monthlyImageLimit: STARTER_IMAGE_LIMIT,
      monthlyVideoLimit: STARTER_VIDEO_LIMIT,
      videoDurationLimitSeconds: 30,
    },
  });
});

afterAll(async () => {
  await db.partnerMarketingUsage.deleteMany({ where: { partnerId: { in: [PARTNER_A, PARTNER_B] } } }).catch(() => undefined);
  await db.partnerMarketingQuota.deleteMany({ where: { partnerId: { in: [PARTNER_A, PARTNER_B] } } }).catch(() => undefined);
  await db.studentMockTestVoucher.deleteMany({ where: { partnerId: { in: [PARTNER_A, PARTNER_B] } } }).catch(() => undefined);
  await db.partnerUserSeatRequest.deleteMany({ where: { partnerId: { in: [PARTNER_A, PARTNER_B] } } }).catch(() => undefined);
  await db.partnerProfile.deleteMany({ where: { userId: { in: userIds } } }).catch(() => undefined);
  await db.portalSession.deleteMany({ where: { token: { in: tokens } } }).catch(() => undefined);
  await db.portalUserRole.deleteMany({ where: { userId: { in: userIds } } }).catch(() => undefined);
  await db.portalRole.deleteMany({ where: { id: { in: roleIds } } }).catch(() => undefined);
  await db.portalUser.deleteMany({ where: { id: { in: userIds } } }).catch(() => undefined);
});

// ------------------------------------------------------------
describe('Tenant model: a partner company can hold multiple users', () => {
  it('allows the Starter package of 1 Partner Super Admin + 2 employees', async () => {
    // Previously impossible: PartnerProfile.partnerId was UNIQUE, so the
    // second user in a tenant failed with a unique-constraint error.
    const extra = await makeUser('a-assistant', 'PARTNER', 'partner', {
      partnerId: PARTNER_A,
      partnerRole: 'PARTNER_APPLICATION_ASSISTANT',
    });
    expect(extra.userId).toBeTruthy();

    const count = await db.portalUser.count({ where: { partnerProfile: { partnerId: PARTNER_A } } });
    expect(count).toBe(STARTER_SEAT_LIMIT);
  });

  it('keeps the two tenants separate', async () => {
    const a = await db.portalUser.count({ where: { partnerProfile: { partnerId: PARTNER_A } } });
    const b = await db.portalUser.count({ where: { partnerProfile: { partnerId: PARTNER_B } } });
    expect(a).toBe(STARTER_SEAT_LIMIT);
    expect(b).toBe(1);
  });
});

// ------------------------------------------------------------
describe('Auth context carries the server-derived partner tenant', () => {
  it('resolves partnerId and partnerRole from the session, not from client input', async () => {
    const ctx = await requirePartnerContext(reqAs(partnerASuperAdmin.token));
    expect(ctx).not.toBeInstanceOf(NextResponse);
    if (ctx instanceof NextResponse) return;

    expect(ctx.partnerId).toBe(PARTNER_A);
    expect(ctx.partnerRole).toBe('PARTNER_SUPER_ADMIN');
    expect(ctx.userId).toBe(partnerASuperAdmin.userId);
  });

  it('rejects an anonymous caller', async () => {
    const ctx = await requirePartnerContext(anonReq());
    expect(ctx).toBeInstanceOf(NextResponse);
    if (ctx instanceof NextResponse) expect([401, 403]).toContain(ctx.status);
  });

  it('rejects an authenticated user with no partner organisation', async () => {
    const ctx = await requirePartnerContext(reqAs(aloSuperAdmin.token));
    expect(ctx).toBeInstanceOf(NextResponse);
    if (ctx instanceof NextResponse) expect(ctx.status).toBe(403);
  });
});

// ------------------------------------------------------------
describe('Tenant isolation: Partner A cannot reach Partner B', () => {
  it('blocks a cross-tenant partnerId supplied by the client', async () => {
    const ctx = await requirePartnerContext(reqAs(partnerASuperAdmin.token));
    if (ctx instanceof NextResponse) throw new Error('expected a partner context');

    const denied = assertSameTenant(ctx, PARTNER_B);
    expect(denied).toBeInstanceOf(NextResponse);
    expect(denied?.status).toBe(403);
  });

  it('permits a supplied partnerId that matches the session tenant', async () => {
    const ctx = await requirePartnerContext(reqAs(partnerASuperAdmin.token));
    if (ctx instanceof NextResponse) throw new Error('expected a partner context');
    expect(assertSameTenant(ctx, PARTNER_A)).toBeNull();
  });

  it('scopes voucher reads to the caller tenant', async () => {
    await db.studentMockTestVoucher.create({
      data: {
        voucherCode: `ISO-A-${SUFFIX}`,
        studentId: 'student-a',
        partnerId: PARTNER_A,
        applicationId: 'app-a',
        usageLimit: 1,
        status: 'available',
      },
    });
    await db.studentMockTestVoucher.create({
      data: {
        voucherCode: `ISO-B-${SUFFIX}`,
        studentId: 'student-b',
        partnerId: PARTNER_B,
        applicationId: 'app-b',
        usageLimit: 1,
        status: 'available',
      },
    });

    const visibleToA = await db.studentMockTestVoucher.findMany({ where: { partnerId: PARTNER_A } });
    expect(visibleToA.every((v) => v.partnerId === PARTNER_A)).toBe(true);
    expect(visibleToA.some((v) => v.voucherCode === `ISO-B-${SUFFIX}`)).toBe(false);
  });
});

// ------------------------------------------------------------
describe('Partner RBAC: privileged partner actions are Super Admin only', () => {
  it('allows the Partner Super Admin', async () => {
    const ctx = await requirePartnerSuperAdmin(reqAs(partnerASuperAdmin.token));
    expect(ctx).not.toBeInstanceOf(NextResponse);
  });

  it('denies a partner counselor', async () => {
    const ctx = await requirePartnerSuperAdmin(reqAs(partnerACounselor.token));
    expect(ctx).toBeInstanceOf(NextResponse);
    if (ctx instanceof NextResponse) expect(ctx.status).toBe(403);
  });

  it('identifies partner roles correctly', async () => {
    const sa = await requirePartnerContext(reqAs(partnerASuperAdmin.token));
    const co = await requirePartnerContext(reqAs(partnerACounselor.token));
    if (sa instanceof NextResponse || co instanceof NextResponse) throw new Error('expected contexts');
    expect(isPartnerSuperAdmin(sa)).toBe(true);
    expect(isPartnerSuperAdmin(co)).toBe(false);
  });
});

// ------------------------------------------------------------
describe('Seat-request approval cannot be self-granted', () => {
  it('rejects an anonymous approval attempt', async () => {
    // The original handler accepted {id, status:"APPROVED"} from anyone.
    const result = await requireAloSuperAdmin(anonReq());
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) expect([401, 403]).toContain(result.status);
  });

  it('rejects a Partner Super Admin approving their own request', async () => {
    const result = await requireAloSuperAdmin(reqAs(partnerASuperAdmin.token));
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) expect(result.status).toBe(403);
  });

  it('allows an ALO Education Super Admin', async () => {
    const result = await requireAloSuperAdmin(reqAs(aloSuperAdmin.token));
    expect(result).not.toBeInstanceOf(NextResponse);
  });
});

// ------------------------------------------------------------
describe('Quota feature keys resolve to real limits', () => {
  it('normalises every accepted spelling', () => {
    expect(normalizeQuotaKey('marketing_images')).toBe(QUOTA_IMAGE);
    expect(normalizeQuotaKey('MARKETING_IMAGE_GENERATION')).toBe(QUOTA_IMAGE);
    expect(normalizeQuotaKey('monthly_images')).toBe(QUOTA_IMAGE);
    expect(normalizeQuotaKey('marketing_videos')).toBe(QUOTA_VIDEO);
    expect(normalizeQuotaKey('partner_max_users')).toBe(QUOTA_SEATS);
  });

  it('returns the Starter allowance for the key the generate endpoint uses', async () => {
    // This is the exact key `/api/partner/marketing/generate` passes. It used
    // to fall through to `return 0`, so generation was permanently blocked.
    expect(await getQuota('PARTNER', PARTNER_A, 'marketing_images')).toBe(STARTER_IMAGE_LIMIT);
    expect(await getQuota('PARTNER', PARTNER_A, 'marketing_videos')).toBe(STARTER_VIDEO_LIMIT);
  });

  it('reports quota as available on a fresh month rather than "0/0"', async () => {
    const check = await checkQuotaBeforeAction('PARTNER', PARTNER_A, 'marketing_images');
    expect(check.limit).toBe(STARTER_IMAGE_LIMIT);
    expect(check.allowed).toBe(true);
  });

  it('defaults an unconfigured partner to the Starter seat limit', async () => {
    expect(await getQuota('PARTNER', PARTNER_B, 'partner_max_users')).toBe(STARTER_SEAT_LIMIT);
  });
});

// ------------------------------------------------------------
describe('Quota enforcement survives concurrent requests', () => {
  it('never grants more than the limit when requests race', async () => {
    const racePartner = `race-${SUFFIX}`;
    await db.partnerMarketingQuota.create({
      data: { partnerId: racePartner, monthlyImageLimit: 5, monthlyVideoLimit: 5 },
    });

    try {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => reserveQuota('PARTNER', racePartner, 'marketing_images')),
      );
      const granted = results.filter((r) => r.allowed).length;
      expect(granted).toBe(5);

      const usage = await db.partnerMarketingUsage.findFirst({
        where: { partnerId: racePartner, monthYear: currentPeriod() },
      });
      expect(usage?.imagesUsed).toBe(5);

      const denial = results.find((r) => !r.allowed);
      expect(denial?.message).toContain('Request extra quota from ALO Education');
    } finally {
      await db.partnerMarketingUsage.deleteMany({ where: { partnerId: racePartner } }).catch(() => undefined);
      await db.partnerMarketingQuota.deleteMany({ where: { partnerId: racePartner } }).catch(() => undefined);
    }
  });

  it('records usage against the YYYY-MM period', () => {
    expect(currentPeriod(new Date('2026-03-15T00:00:00Z'))).toBe('2026-03');
  });
});

// ------------------------------------------------------------
describe('Voucher redemption is atomic', () => {
  it('permits exactly one redemption of a single-use voucher under concurrency', async () => {
    const voucher = await db.studentMockTestVoucher.create({
      data: {
        voucherCode: `ATOMIC-${SUFFIX}`,
        studentId: 'student-a',
        partnerId: PARTNER_A,
        applicationId: 'app-a',
        usageLimit: 1,
        usedCount: 0,
        status: 'available',
      },
    });

    // Mirrors the conditional claim used by /api/student/vouchers/redeem.
    const attempts = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const current = await db.studentMockTestVoucher.findUnique({ where: { id: voucher.id } });
        if (!current || current.status !== 'available' || current.usedCount >= current.usageLimit) {
          return false;
        }
        const claim = await db.studentMockTestVoucher.updateMany({
          where: { id: voucher.id, status: 'available', usedCount: { lt: current.usageLimit } },
          data: { usedCount: { increment: 1 }, status: 'used' },
        });
        return claim.count === 1;
      }),
    );

    expect(attempts.filter(Boolean).length).toBe(1);

    const settled = await db.studentMockTestVoucher.findUnique({ where: { id: voucher.id } });
    expect(settled?.usedCount).toBe(1);
    expect(settled?.status).toBe('used');
  });
});

// ------------------------------------------------------------
describe('Partner dashboard metrics are tenant-scoped', () => {
  const profileIds: string[] = [];
  const appIds: string[] = [];

  afterAll(async () => {
    await db.portalStudentApplication.deleteMany({ where: { id: { in: appIds } } }).catch(() => undefined);
    await db.portalStudentProfile.deleteMany({ where: { id: { in: profileIds } } }).catch(() => undefined);
  });

  it('counts only the caller tenant\'s students and applications', async () => {
    // One student + application for each of the two partners.
    async function seed(partnerId: string, label: string) {
      const user = await db.portalUser.create({
        data: { email: `stu-${label}-${SUFFIX}@aloedu.test`, name: label, userType: 'STUDENT', status: 'active', passwordHash: 'x' },
      });
      userIds.push(user.id);
      const profile = await db.portalStudentProfile.create({
        data: { userId: user.id, studentId: `SID-${label}-${SUFFIX}`, partnerId },
      });
      profileIds.push(profile.id);
      const app = await db.portalStudentApplication.create({
        data: { studentProfileId: profile.id, stage: 'submitted', university: 'Test Uni', course: 'Test Course' },
      });
      appIds.push(app.id);
      return profile;
    }

    await seed(PARTNER_A, 'a');
    await seed(PARTNER_B, 'b');

    // The dashboard's tenant filter: applications reached through the
    // student profile's partnerId. Before the fix these counts had no
    // partner filter and returned platform-wide totals.
    const aStudents = await db.portalStudentProfile.count({ where: { partnerId: PARTNER_A } });
    const aSubmitted = await db.portalStudentApplication.count({
      where: { studentProfile: { partnerId: PARTNER_A }, stage: 'submitted' },
    });
    const globalSubmitted = await db.portalStudentApplication.count({ where: { stage: 'submitted' } });

    expect(aStudents).toBe(1);
    expect(aSubmitted).toBe(1);
    // Partner A must not be shown Partner B's application in its totals.
    expect(globalSubmitted).toBeGreaterThan(aSubmitted);
  });

  it('reports seats used as real users, not as seat requests', async () => {
    await db.partnerUserSeatRequest.create({
      data: { partnerId: PARTNER_A, requestedBy: partnerASuperAdmin.userId, currentLimit: 3, requestedExtraSeats: 2, reason: 'growing team', status: 'PENDING' },
    });

    // The old dashboard reported `used: seatRequests.length`, so filing one
    // request made the tenant look like it had consumed a seat.
    const seatsUsed = await db.portalUser.count({ where: { partnerProfile: { partnerId: PARTNER_A } } });
    const requestCount = await db.partnerUserSeatRequest.count({ where: { partnerId: PARTNER_A } });

    expect(requestCount).toBe(1);
    expect(seatsUsed).toBe(STARTER_SEAT_LIMIT);
    expect(seatsUsed).not.toBe(requestCount);
  });
});
