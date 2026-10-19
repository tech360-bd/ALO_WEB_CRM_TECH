// Feature flag service contracts (spec s117).
// Mocked Prisma surface; the flag table itself is exercised against MySQL in CI.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    featureFlagAudit: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  FEATURE_FLAG_DEFAULTS,
  ensureDefaultFlags,
  evaluateFlag,
  evaluateFlags,
  isFeatureEnabled,
  rolloutBucket,
  updateFlag,
} from '@/lib/feature-flags';

const flagMock = db.featureFlag.findUnique as unknown as ReturnType<typeof vi.fn>;
const flagCreate = db.featureFlag.create as unknown as ReturnType<typeof vi.fn>;
const flagUpdate = db.featureFlag.update as unknown as ReturnType<typeof vi.fn>;
const auditCreate = db.featureFlagAudit.create as unknown as ReturnType<typeof vi.fn>;

function baseFlag(overrides: Record<string, unknown> = {}) {
  return {
    id: 'flag-1',
    key: 'AI_VISA_AGENT',
    module: 'AI',
    description: 'test',
    enabled: true,
    rolloutPercent: 100,
    allowRoles: '[]',
    allowUserIds: '[]',
    denyUserIds: '[]',
    environment: 'all',
    config: '{}',
    status: 'ACTIVE',
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Feature flags — fail closed (s117, s93, s94)', () => {
  it('returns disabled with FLAG_NOT_CONFIGURED when no row exists', async () => {
    flagMock.mockResolvedValue(null);
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('FLAG_NOT_CONFIGURED');
    expect(result.source).toBe('disabled-fallback');
  });

  it('returns disabled rather than throwing when the database fails', async () => {
    flagMock.mockRejectedValue(new Error('connection refused'));
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/^EVALUATION_ERROR/);
    expect(result.source).toBe('disabled-fallback');
  });

  it('refuses a non-ACTIVE flag', async () => {
    flagMock.mockResolvedValue(baseFlag({ status: 'RETIRED' }));
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('FLAG_STATUS_RETIRED');
  });

  it('refuses when the environment does not match', async () => {
    flagMock.mockResolvedValue(baseFlag({ environment: 'staging' }));
    const result = await evaluateFlag('AI_VISA_AGENT', {
      userId: 'u1',
      environment: 'production',
    });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('ENVIRONMENT_MISMATCH');
  });

  it('refuses when enabled=false even at 100% rollout', async () => {
    flagMock.mockResolvedValue(baseFlag({ enabled: false, rolloutPercent: 100 }));
    expect(await isFeatureEnabled('AI_VISA_AGENT', { userId: 'u1' })).toBe(false);
  });
});

describe('Feature flags — rollout determinism', () => {
  it('is stable for the same subject and flag', () => {
    const first = rolloutBucket('AI_VISA_AGENT', 'user-42');
    const second = rolloutBucket('AI_VISA_AGENT', 'user-42');
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(100);
  });

  it('gives different subjects different buckets', () => {
    const buckets = new Set(
      Array.from({ length: 50 }, (_, index) => rolloutBucket('AI_VISA_AGENT', `user-${index}`)),
    );
    // A deterministic hash must actually spread subjects; if every user landed
    // in the same bucket a percentage rollout would be all-or-nothing.
    expect(buckets.size).toBeGreaterThan(10);
  });

  it('denies a percentage rollout with no subject rather than guessing', async () => {
    flagMock.mockResolvedValue(baseFlag({ rolloutPercent: 50 }));
    const result = await evaluateFlag('AI_VISA_AGENT', {});
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('ROLLOUT_NEEDS_SUBJECT');
  });

  it('admits everyone at 100% and nobody at 0%', async () => {
    flagMock.mockResolvedValue(baseFlag({ rolloutPercent: 100 }));
    expect((await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' })).enabled).toBe(true);

    flagMock.mockResolvedValue(baseFlag({ rolloutPercent: 0 }));
    const zero = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(zero.enabled).toBe(false);
    expect(zero.reason).toBe('ROLLOUT_0');
  });

  it('honours the deny list over the allow list', async () => {
    flagMock.mockResolvedValue(
      baseFlag({ allowUserIds: '["u1"]', denyUserIds: '["u1"]', rolloutPercent: 100 }),
    );
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('USER_DENYLISTED');
  });

  it('allows an explicitly allow-listed user below the rollout percentage', async () => {
    flagMock.mockResolvedValue(baseFlag({ allowUserIds: '["u9"]', rolloutPercent: 0 }));
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u9' });
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('USER_ALLOWLISTED');
  });

  it('enforces role restrictions when allowRoles is set', async () => {
    flagMock.mockResolvedValue(baseFlag({ allowRoles: '["VISA_MANAGER"]', rolloutPercent: 100 }));
    const denied = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1', roles: ['COUNSELOR'] });
    expect(denied.enabled).toBe(false);
    expect(denied.reason).toBe('ROLE_NOT_ALLOWED');

    const allowed = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1', roles: ['VISA_MANAGER'] });
    expect(allowed.enabled).toBe(true);
  });

  it('survives corrupt JSON in list columns', async () => {
    flagMock.mockResolvedValue(
      baseFlag({ allowRoles: 'not-json', allowUserIds: '{bad', denyUserIds: '[]', rolloutPercent: 100 }),
    );
    const result = await evaluateFlag('AI_VISA_AGENT', { userId: 'u1' });
    expect(result.enabled).toBe(true);
  });
});

describe('Feature flags — batch evaluation', () => {
  it('de-duplicates keys and returns one entry per key', async () => {
    flagMock.mockImplementation(async ({ where }: { where: { key: string } }) =>
      baseFlag({ key: where.key }),
    );
    const result = await evaluateFlags(['A', 'A', 'B'], { userId: 'u1' });
    expect(Object.keys(result).sort()).toEqual(['A', 'B']);
    expect(flagMock).toHaveBeenCalledTimes(2);
  });
});

describe('Feature flags — bootstrap catalogue is safe by default', () => {
  it('ships every canonical flag DISABLED at 0% rollout', () => {
    expect(FEATURE_FLAG_DEFAULTS.length).toBeGreaterThan(0);
    for (const flag of FEATURE_FLAG_DEFAULTS) {
      expect(flag.enabled).toBe(false);
      expect(flag.rolloutPercent).toBe(0);
    }
  });

  it('covers the modules named in the specification', () => {
    const keys = new Set(FEATURE_FLAG_DEFAULTS.map((flag) => flag.key));
    for (const required of [
      'AI_VISA_AGENT',
      'AI_PARTNER_RISK',
      'WHATSAPP_AUTOMATION',
      'B2B_PORTAL',
      'UNIVERSITY_PORTAL',
      'POST_ARRIVAL',
    ]) {
      expect(keys.has(required)).toBe(true);
    }
  });

  it('is idempotent — never overwrites an operator decision', async () => {
    flagMock.mockResolvedValue(baseFlag());
    flagCreate.mockResolvedValue(baseFlag());
    const result = await ensureDefaultFlags();
    expect(result.created).toEqual([]);
    expect(result.skipped.length).toBe(FEATURE_FLAG_DEFAULTS.length);
    expect(flagCreate).not.toHaveBeenCalled();
  });

  it('creates only missing flags', async () => {
    flagMock.mockImplementation(async ({ where }: { where: { key: string } }) =>
      where.key === 'AI_VISA_AGENT' ? baseFlag() : null,
    );
    flagCreate.mockImplementation(async ({ data }: { data: { key: string } }) => baseFlag({ key: data.key }));
    const result = await ensureDefaultFlags();
    expect(result.created).not.toContain('AI_VISA_AGENT');
    expect(result.skipped).toContain('AI_VISA_AGENT');
    expect(result.created.length).toBe(FEATURE_FLAG_DEFAULTS.length - 1);
    // Every created flag must start disabled.
    for (const call of flagCreate.mock.calls) {
      expect(call[0].data.enabled).toBe(false);
      expect(call[0].data.rolloutPercent).toBe(0);
    }
  });
});

describe('Feature flags — mutations are audited (s65)', () => {
  it('records before/after and the actor for an enable', async () => {
    flagMock.mockResolvedValue(baseFlag({ enabled: false }));
    flagUpdate.mockResolvedValue(baseFlag({ enabled: true }));
    auditCreate.mockResolvedValue({ id: 'audit-1' });

    const result = await updateFlag(
      'AI_VISA_AGENT',
      { enabled: true, reason: 'pilot approved by visa manager' },
      { id: 'admin-1', email: 'admin@aloeducation.com' },
    );

    expect(result.action).toBe('ENABLED');
    expect(auditCreate).toHaveBeenCalledTimes(1);
    const audit = auditCreate.mock.calls[0][0].data;
    expect(audit.flagKey).toBe('AI_VISA_AGENT');
    expect(audit.actorId).toBe('admin-1');
    expect(audit.reason).toBe('pilot approved by visa manager');
    expect(JSON.parse(audit.before).enabled).toBe(false);
    expect(audit.action).toContain('ENABLED');
  });

  it('clamps rollout percentage into 0..100', async () => {
    flagMock.mockResolvedValue(baseFlag({ rolloutPercent: 10 }));
    flagUpdate.mockResolvedValue(baseFlag({ rolloutPercent: 100 }));
    auditCreate.mockResolvedValue({ id: 'audit-2' });

    await updateFlag('AI_VISA_AGENT', { rolloutPercent: 999 }, { id: 'a' });
    expect(flagUpdate.mock.calls[0][0].data.rolloutPercent).toBe(100);

    await updateFlag('AI_VISA_AGENT', { rolloutPercent: -50 }, { id: 'a' });
    expect(flagUpdate.mock.calls[1][0].data.rolloutPercent).toBe(0);
  });

  it('writes no audit row when nothing actually changed', async () => {
    flagMock.mockResolvedValue(baseFlag({ enabled: true, rolloutPercent: 100 }));
    const result = await updateFlag('AI_VISA_AGENT', { enabled: true, rolloutPercent: 100 }, { id: 'a' });
    expect(result.action).toBe('NO_CHANGE');
    expect(flagUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('throws for an unknown flag instead of creating one silently', async () => {
    flagMock.mockResolvedValue(null);
    await expect(updateFlag('NOPE', { enabled: true }, { id: 'a' })).rejects.toThrow(/not found/i);
  });
});
