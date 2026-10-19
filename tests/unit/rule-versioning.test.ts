// Regulatory rule versioning + policy change monitoring contracts (s106, s64, s105, s116).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    regulatoryRuleVersion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    policyChangeAlert: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  APPROVAL_REQUIRED_RULE_TYPES,
  actorLabel,
  approveRuleVersion,
  detectPolicyChange,
  dismissPolicyChange,
  expireOverdueRules,
  isAuthoritative,
  isVersionActiveAt,
  listOpenPolicyChanges,
  listStaleRules,
  nextVersionNumber,
  normalizeAlertStatus,
  normalizeRuleStatus,
  normalizeRuleType,
  normalizeSeverity,
  normalizeSourceType,
  normalizeVerificationStatus,
  pickActiveVersion,
  proposeRuleVersion,
  recordRuleVerification,
  rejectRuleVersion,
  requiresHumanApproval,
  resolveActiveRule,
  ruleHistory,
  ruleKeyFor,
  sourceTrustWeight,
  triagePolicyChange,
} from '@/lib/rules/rule-versioning';

const versionCreate = db.regulatoryRuleVersion.create as unknown as ReturnType<typeof vi.fn>;
const versionFindUnique = db.regulatoryRuleVersion.findUnique as unknown as ReturnType<typeof vi.fn>;
const versionFindFirst = db.regulatoryRuleVersion.findFirst as unknown as ReturnType<typeof vi.fn>;
const versionFindMany = db.regulatoryRuleVersion.findMany as unknown as ReturnType<typeof vi.fn>;
const versionUpdate = db.regulatoryRuleVersion.update as unknown as ReturnType<typeof vi.fn>;
const alertCreate = db.policyChangeAlert.create as unknown as ReturnType<typeof vi.fn>;
const alertFindUnique = db.policyChangeAlert.findUnique as unknown as ReturnType<typeof vi.fn>;
const alertFindMany = db.policyChangeAlert.findMany as unknown as ReturnType<typeof vi.fn>;
const alertUpdate = db.policyChangeAlert.update as unknown as ReturnType<typeof vi.fn>;

const ACTOR = { id: 'user-admin', email: 'admin@aloeducation.com' };
const JAN = new Date('2026-01-01T00:00:00.000Z');
const JUN = new Date('2026-06-01T00:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
  versionFindMany.mockResolvedValue([]);
  versionFindUnique.mockResolvedValue(null);
  versionFindFirst.mockResolvedValue(null);
  alertFindUnique.mockResolvedValue(null);
  alertFindMany.mockResolvedValue([]);
  versionCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'v-new',
    ...data,
  }));
  versionUpdate.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
    id: where.id,
    ...data,
  }));
  alertCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'alert-1', ...data }));
  alertUpdate.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
    id: where.id,
    ...data,
  }));
});

describe('Vocabulary normalisation fails closed', () => {
  it('falls back to a safe default for unknown values', () => {
    expect(normalizeRuleType('VISA_REQUIREMENT')).toBe('VISA_REQUIREMENT');
    expect(normalizeRuleType('visa_requirement')).toBe('VISA_REQUIREMENT');
    expect(normalizeRuleType('MADE_UP_RULE')).toBe('OTHER');
    expect(normalizeRuleType(null)).toBe('OTHER');
    expect(normalizeRuleType(undefined)).toBe('OTHER');
  });

  it('treats an unknown source as UNVERIFIED, never as official', () => {
    expect(normalizeSourceType('OFFICIAL_GOVERNMENT')).toBe('OFFICIAL_GOVERNMENT');
    expect(normalizeSourceType('SOME_BLOG')).toBe('UNVERIFIED');
    expect(normalizeSourceType('')).toBe('UNVERIFIED');
    expect(normalizeSourceType(null)).toBe('UNVERIFIED');
  });

  it('treats an unknown verification status as NEEDS_REVIEW', () => {
    expect(normalizeVerificationStatus('VERIFIED')).toBe('VERIFIED');
    expect(normalizeVerificationStatus('TRUST_ME')).toBe('NEEDS_REVIEW');
    expect(normalizeVerificationStatus(undefined)).toBe('NEEDS_REVIEW');
  });

  it('treats an unknown lifecycle status as DRAFT', () => {
    expect(normalizeRuleStatus('ACTIVE')).toBe('ACTIVE');
    expect(normalizeRuleStatus('LIVE')).toBe('DRAFT');
  });

  it('treats an unknown alert status as DETECTED and severity as INFO', () => {
    expect(normalizeAlertStatus('TRIAGED')).toBe('TRIAGED');
    expect(normalizeAlertStatus('IGNORED')).toBe('DETECTED');
    expect(normalizeSeverity('CRITICAL')).toBe('CRITICAL');
    expect(normalizeSeverity('WHATEVER')).toBe('INFO');
  });
});

describe('Canonical rule keys are deterministic', () => {
  it('builds country, university and global keys', () => {
    expect(ruleKeyFor({ countryId: 'GBR', ruleType: 'VISA_REQUIREMENT', scope: 'masters' })).toBe(
      'country:GBR:VISA_REQUIREMENT:MASTERS',
    );
    expect(ruleKeyFor({ universityId: 'uni-aston', ruleType: 'APPLICATION_DEADLINE' })).toBe(
      'university:uni-aston:APPLICATION_DEADLINE',
    );
    expect(ruleKeyFor({ ruleType: 'POLICY' })).toBe('global:POLICY');
  });

  it('prefers the university scope over the country scope', () => {
    expect(ruleKeyFor({ countryId: 'GBR', universityId: 'uni-1', ruleType: 'ENTRY_REQUIREMENT' })).toBe(
      'university:uni-1:ENTRY_REQUIREMENT',
    );
  });

  it('is stable across surrounding whitespace', () => {
    const a = ruleKeyFor({ countryId: ' gbr ', ruleType: 'visa_requirement', scope: ' MSc ' });
    const b = ruleKeyFor({ countryId: 'gbr', ruleType: 'VISA_REQUIREMENT', scope: 'MSC' });
    expect(a).toBe(b);
  });

  it('upper-cases ruleType and scope, which are controlled labels', () => {
    expect(ruleKeyFor({ countryId: 'x', ruleType: 'work_right', scope: 'post_study' })).toBe(
      'country:x:WORK_RIGHT:POST_STUDY',
    );
  });

  it('does NOT case-fold the id segments — they are cuids and must stay matchable', () => {
    // Country.id and CrmUniversity.id are @default(cuid()), which is
    // case-sensitive. Folding their case here would make the key segment stop
    // matching the real row, splitting one rule into two chains that no longer
    // resolve to a country. Deliberate: do not "fix" this by upper-casing ids.
    expect(ruleKeyFor({ countryId: 'ckAbC123', ruleType: 'POLICY' })).toBe('country:ckAbC123:POLICY');
    expect(ruleKeyFor({ countryId: 'CKABC123', ruleType: 'POLICY' })).not.toBe(
      ruleKeyFor({ countryId: 'ckAbC123', ruleType: 'POLICY' }),
    );
  });

  it('normalises an unknown rule type into the key rather than dropping it', () => {
    expect(ruleKeyFor({ countryId: 'GBR', ruleType: 'BOGUS' })).toBe('country:GBR:OTHER');
  });
});

describe('Version numbering is monotonic and never reused', () => {
  it('starts at 1 for a new chain', () => {
    expect(nextVersionNumber([])).toBe(1);
  });

  it('continues from the highest existing version, not the row count', () => {
    expect(nextVersionNumber([{ versionNumber: 1 }, { versionNumber: 7 }, { versionNumber: 3 }])).toBe(8);
  });

  it('ignores corrupt version numbers', () => {
    expect(nextVersionNumber([{ versionNumber: Number.NaN }, { versionNumber: 2 }])).toBe(3);
  });

  it('never returns a number below 1', () => {
    expect(nextVersionNumber([{ versionNumber: -5 }, { versionNumber: 0 }])).toBe(1);
  });
});

describe('Effective windows are half-open (s106)', () => {
  const active = (from: Date, until: Date | null) => ({
    status: 'ACTIVE',
    effectiveFrom: from,
    effectiveUntil: until,
  });

  it('is in force from its effective date', () => {
    expect(isVersionActiveAt(active(JAN, null), JAN)).toBe(true);
  });

  it('is not in force before its effective date', () => {
    expect(isVersionActiveAt(active(JUN, null), JAN)).toBe(false);
  });

  it('stops at effectiveUntil — the boundary belongs to the NEXT version', () => {
    expect(isVersionActiveAt(active(JAN, JUN), new Date('2026-05-31T23:59:59Z'))).toBe(true);
    expect(isVersionActiveAt(active(JAN, JUN), JUN)).toBe(false);
  });

  it('is open-ended when effectiveUntil is null', () => {
    expect(isVersionActiveAt(active(JAN, null), new Date('2099-01-01'))).toBe(true);
  });

  it('is not in force unless its status is ACTIVE', () => {
    expect(isVersionActiveAt({ status: 'SUPERSEDED', effectiveFrom: JAN, effectiveUntil: null }, JUN)).toBe(false);
    expect(isVersionActiveAt({ status: 'DRAFT', effectiveFrom: JAN, effectiveUntil: null }, JUN)).toBe(false);
    expect(isVersionActiveAt({ status: 'PENDING_APPROVAL', effectiveFrom: JAN, effectiveUntil: null }, JUN)).toBe(false);
  });

  it('accepts ISO strings as well as Date objects', () => {
    expect(isVersionActiveAt(active(JAN.toISOString(), null), JUN)).toBe(true);
  });

  it('treats an unparseable date as not in force rather than always in force', () => {
    expect(isVersionActiveAt({ status: 'ACTIVE', effectiveFrom: 'garbage', effectiveUntil: null }, JUN)).toBe(false);
    expect(isVersionActiveAt({ status: 'ACTIVE', effectiveFrom: '', effectiveUntil: null }, JUN)).toBe(false);
  });

  it('picks the highest version number when two ACTIVE windows overlap', () => {
    const overlap = [
      { status: 'ACTIVE', effectiveFrom: JAN, effectiveUntil: null, versionNumber: 1 },
      { status: 'ACTIVE', effectiveFrom: JAN, effectiveUntil: null, versionNumber: 2 },
    ];
    // Deterministic regardless of input order.
    expect(pickActiveVersion(overlap, JUN)!.versionNumber).toBe(2);
    expect(pickActiveVersion([...overlap].reverse(), JUN)!.versionNumber).toBe(2);
  });

  it('returns null when no version covers the date', () => {
    expect(pickActiveVersion([{ status: 'ACTIVE', effectiveFrom: JUN, effectiveUntil: null, versionNumber: 1 }], JAN)).toBeNull();
    expect(pickActiveVersion([], JUN)).toBeNull();
  });
});

describe('Provenance and trust (s105)', () => {
  it('ranks an official verified source above an unverified one', () => {
    expect(sourceTrustWeight('OFFICIAL_GOVERNMENT', 'VERIFIED')).toBe(1);
    expect(sourceTrustWeight('UNVERIFIED', 'NEEDS_REVIEW')).toBeLessThan(0.5);
    expect(sourceTrustWeight('OFFICIAL_GOVERNMENT', 'DISPUTED')).toBeLessThan(
      sourceTrustWeight('APPROVED_PARTNER', 'VERIFIED'),
    );
  });

  it('never lets an unverified source count as authoritative', () => {
    expect(isAuthoritative({ sourceType: 'UNVERIFIED', verificationStatus: 'VERIFIED' })).toBe(false);
    expect(isAuthoritative({ sourceType: 'OFFICIAL_GOVERNMENT', verificationStatus: 'VERIFIED' })).toBe(true);
  });

  it('does not treat a disputed official source as authoritative', () => {
    expect(isAuthoritative({ sourceType: 'OFFICIAL_GOVERNMENT', verificationStatus: 'DISPUTED' })).toBe(false);
  });

  it('treats a missing source as unverified', () => {
    expect(isAuthoritative({})).toBe(false);
  });
});

describe('Human-in-the-loop approval (s116)', () => {
  it('requires approval for every high-risk regulatory rule type', () => {
    for (const ruleType of APPROVAL_REQUIRED_RULE_TYPES) {
      expect(requiresHumanApproval(ruleType)).toBe(true);
    }
    expect(requiresHumanApproval('VISA_REQUIREMENT')).toBe(true);
  });

  it('does not gate an application deadline tweak behind the same approval', () => {
    expect(requiresHumanApproval('APPLICATION_DEADLINE')).toBe(false);
    expect(requiresHumanApproval('OTHER')).toBe(false);
  });

  it('identifies an actor by id, then email, then nothing', () => {
    expect(actorLabel({ id: 'u1', email: 'a@b.c' })).toBe('u1');
    expect(actorLabel({ id: '', email: 'a@b.c' })).toBe('a@b.c');
    expect(actorLabel({})).toBe('');
    expect(actorLabel(null)).toBe('');
    expect(actorLabel(undefined)).toBe('');
  });
});

describe('proposeRuleVersion is append-only (s106)', () => {
  const base = {
    ruleType: 'VISA_REQUIREMENT',
    countryId: 'GBR',
    payload: { fundsRequired: 1486 },
    changeReason: 'UKVI updated the maintenance requirement',
    effectiveFrom: JUN,
  };

  it('refuses an anonymous proposal', async () => {
    await expect(proposeRuleVersion(base, {})).rejects.toThrow('ACTOR_REQUIRED');
    await expect(proposeRuleVersion(base, { id: '', email: '  ' })).rejects.toThrow('ACTOR_REQUIRED');
    expect(versionCreate).not.toHaveBeenCalled();
  });

  it('refuses a change with no stated reason', async () => {
    await expect(proposeRuleVersion({ ...base, changeReason: '   ' }, ACTOR)).rejects.toThrow(
      'CHANGE_REASON_REQUIRED',
    );
  });

  it('refuses a version with no real effective date', async () => {
    await expect(proposeRuleVersion({ ...base, effectiveFrom: new Date('garbage') }, ACTOR)).rejects.toThrow(
      'EFFECTIVE_FROM_REQUIRED',
    );
  });

  it('refuses an effective window that closes before it opens', async () => {
    await expect(
      proposeRuleVersion({ ...base, effectiveUntil: JAN }, ACTOR),
    ).rejects.toThrow('EFFECTIVE_UNTIL_MUST_FOLLOW_EFFECTIVE_FROM');
    await expect(
      proposeRuleVersion({ ...base, effectiveUntil: JUN }, ACTOR),
    ).rejects.toThrow('EFFECTIVE_UNTIL_MUST_FOLLOW_EFFECTIVE_FROM');
  });

  it('refuses a non-object payload', async () => {
    await expect(proposeRuleVersion({ ...base, payload: null as never }, ACTOR)).rejects.toThrow('PAYLOAD_REQUIRED');
    await expect(proposeRuleVersion({ ...base, payload: 'text' as never }, ACTOR)).rejects.toThrow('PAYLOAD_REQUIRED');
  });

  it('does NOT touch the currently active version', async () => {
    versionFindMany.mockResolvedValue([{ versionNumber: 1 }]);
    await proposeRuleVersion(base, ACTOR);
    // Only a create; no update to any existing row.
    expect(versionCreate).toHaveBeenCalledTimes(1);
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('assigns the next version number in the chain', async () => {
    versionFindMany.mockResolvedValue([{ versionNumber: 1 }, { versionNumber: 2 }]);
    const result = await proposeRuleVersion(base, ACTOR);
    expect(result.versionNumber).toBe(3);
    expect(result.ruleKey).toBe('country:GBR:VISA_REQUIREMENT');
  });

  it('forces a high-risk rule straight to PENDING_APPROVAL, never DRAFT', async () => {
    const result = await proposeRuleVersion(base, ACTOR);
    expect(result.status).toBe('PENDING_APPROVAL');
    expect(versionCreate.mock.calls[0][0].data.status).toBe('PENDING_APPROVAL');
  });

  it('lets a low-risk rule stay a DRAFT unless submitted', async () => {
    const result = await proposeRuleVersion(
      { ...base, ruleType: 'APPLICATION_DEADLINE', changeReason: 'intake date moved' },
      ACTOR,
    );
    expect(result.status).toBe('DRAFT');

    const submitted = await proposeRuleVersion(
      { ...base, ruleType: 'APPLICATION_DEADLINE', changeReason: 'intake date moved', submitForApproval: true },
      ACTOR,
    );
    expect(submitted.status).toBe('PENDING_APPROVAL');
  });

  it('persists provenance and the actor', async () => {
    await proposeRuleVersion(
      { ...base, sourceType: 'OFFICIAL_GOVERNMENT', sourceUrl: 'https://gov.uk/xxx', sourceName: 'UKVI' },
      ACTOR,
    );
    const data = versionCreate.mock.calls[0][0].data;
    expect(data.createdBy).toBe('user-admin');
    expect(data.sourceType).toBe('OFFICIAL_GOVERNMENT');
    expect(data.sourceUrl).toBe('https://gov.uk/xxx');
    expect(data.verificationStatus).toBe('NEEDS_REVIEW');
    expect(JSON.parse(data.payload)).toEqual({ fundsRequired: 1486 });
  });

  it('downgrades an unknown source type to UNVERIFIED rather than storing it', async () => {
    await proposeRuleVersion({ ...base, sourceType: 'A_FRIEND_TOLD_ME' }, ACTOR);
    expect(versionCreate.mock.calls[0][0].data.sourceType).toBe('UNVERIFIED');
  });
});

describe('approveRuleVersion closes the previous window exactly (s106)', () => {
  it('refuses an anonymous approver — no self-approval', async () => {
    await expect(approveRuleVersion('v1', {})).rejects.toThrow('ACTOR_REQUIRED');
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('refuses an unknown version', async () => {
    await expect(approveRuleVersion('ghost', ACTOR)).rejects.toThrow('RULE_VERSION_NOT_FOUND');
  });

  it('activates a pending version and stamps the approver', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v2', ruleKey: 'k', status: 'PENDING_APPROVAL', effectiveFrom: JUN });
    const result = await approveRuleVersion('v2', ACTOR, { now: JUN });
    expect(result.action).toBe('APPROVED');
    expect(versionUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'ACTIVE',
      approvedBy: 'user-admin',
    });
    expect(versionUpdate.mock.calls[0][0].data.approvedAt).toBeInstanceOf(Date);
  });

  it('supersedes the prior ACTIVE version and RETAINS it', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v2', ruleKey: 'k', status: 'PENDING_APPROVAL', effectiveFrom: JUN });
    versionFindFirst.mockResolvedValue({ id: 'v1', ruleKey: 'k', status: 'ACTIVE', effectiveFrom: JAN });

    const result = await approveRuleVersion('v2', ACTOR, { now: JUN });
    expect(result.superseded).toBe('v1');

    const supersedeCall = versionUpdate.mock.calls[1][0];
    expect(supersedeCall.where).toEqual({ id: 'v1' });
    // Retained, not deleted: status changes but the row survives.
    expect(supersedeCall.data).toMatchObject({ status: 'SUPERSEDED', supersededById: 'v2' });
    // Window closes exactly where the new one opens — no gap, no overlap.
    expect(supersedeCall.data.effectiveUntil).toEqual(JUN);
  });

  it('never produces an inverted window if the new version starts earlier', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v2', ruleKey: 'k', status: 'PENDING_APPROVAL', effectiveFrom: JAN });
    versionFindFirst.mockResolvedValue({ id: 'v1', ruleKey: 'k', status: 'ACTIVE', effectiveFrom: JUN });

    await approveRuleVersion('v2', ACTOR, { now: JAN });
    const supersedeCall = versionUpdate.mock.calls[1][0];
    // Closes at the previous start, not before it.
    expect(supersedeCall.data.effectiveUntil).toEqual(JUN);
  });

  it('is idempotent for an already-active version', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', ruleKey: 'k', status: 'ACTIVE', effectiveFrom: JAN });
    const result = await approveRuleVersion('v1', ACTOR);
    expect(result.action).toBe('ALREADY_ACTIVE');
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('refuses to resurrect superseded, rejected or expired history', async () => {
    for (const status of ['SUPERSEDED', 'REJECTED', 'EXPIRED']) {
      versionFindUnique.mockResolvedValue({ id: 'v1', ruleKey: 'k', status, effectiveFrom: JAN });
      await expect(approveRuleVersion('v1', ACTOR)).rejects.toThrow(`CANNOT_APPROVE_${status}`);
    }
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('does not supersede anything when there is no prior active version', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', ruleKey: 'k', status: 'DRAFT', effectiveFrom: JAN });
    versionFindFirst.mockResolvedValue(null);
    const result = await approveRuleVersion('v1', ACTOR, { now: JAN });
    expect(result.superseded).toBeNull();
    expect(versionUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('rejectRuleVersion needs a reason', () => {
  it('refuses an empty or trivial reason', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', status: 'PENDING_APPROVAL' });
    await expect(rejectRuleVersion('v1', ACTOR, '')).rejects.toThrow('REJECTION_REASON_REQUIRED');
    await expect(rejectRuleVersion('v1', ACTOR, '  no ')).rejects.toThrow('REJECTION_REASON_REQUIRED');
  });

  it('refuses an anonymous rejection', async () => {
    await expect(rejectRuleVersion('v1', {}, 'not accurate')).rejects.toThrow('ACTOR_REQUIRED');
  });

  it('records the rejection', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', status: 'PENDING_APPROVAL' });
    const result = await rejectRuleVersion('v1', ACTOR, 'Source does not support this figure');
    expect(result.action).toBe('REJECTED');
    expect(versionUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'Source does not support this figure',
      approvedBy: 'user-admin',
    });
  });

  it('cannot reject an ACTIVE rule — history must not be rewritten', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', status: 'ACTIVE' });
    await expect(rejectRuleVersion('v1', ACTOR, 'changed our minds')).rejects.toThrow('CANNOT_REJECT_ACTIVE');
  });

  it('cannot reject a SUPERSEDED rule', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', status: 'SUPERSEDED' });
    await expect(rejectRuleVersion('v1', ACTOR, 'too late')).rejects.toThrow('CANNOT_REJECT_SUPERSEDED');
  });
});

describe('Reading a rule resolves the right version', () => {
  it('returns the version in force at the requested date', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v2', ruleKey: 'k', versionNumber: 2, status: 'ACTIVE', effectiveFrom: JUN, effectiveUntil: null, payload: '{"funds":1486}', sourceType: 'OFFICIAL_GOVERNMENT', verificationStatus: 'VERIFIED' },
      { id: 'v1', ruleKey: 'k', versionNumber: 1, status: 'ACTIVE', effectiveFrom: JAN, effectiveUntil: JUN, payload: '{"funds":1350}', sourceType: 'OFFICIAL_GOVERNMENT', verificationStatus: 'VERIFIED' },
    ]);
    const earlier = await resolveActiveRule('k', new Date('2026-03-01'));
    expect(earlier!.id).toBe('v1');
    expect(earlier!.payload).toEqual({ funds: 1350 });

    const later = await resolveActiveRule('k', new Date('2026-09-01'));
    expect(later!.id).toBe('v2');
    expect(later!.payload).toEqual({ funds: 1486 });
  });

  it('returns null when no version was in force on that date', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', versionNumber: 1, status: 'ACTIVE', effectiveFrom: JUN, effectiveUntil: null, payload: '{}' },
    ]);
    expect(await resolveActiveRule('k', JAN)).toBeNull();
  });

  it('flags whether the resolved rule may be presented as authoritative', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', versionNumber: 1, status: 'ACTIVE', effectiveFrom: JAN, effectiveUntil: null, payload: '{}', sourceType: 'UNVERIFIED', verificationStatus: 'NEEDS_REVIEW' },
    ]);
    const resolved = await resolveActiveRule('k', JUN);
    expect(resolved!.authoritative).toBe(false);
    expect(resolved!.trustWeight).toBeLessThan(0.5);
  });

  it('survives corrupt stored payload JSON', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', versionNumber: 1, status: 'ACTIVE', effectiveFrom: JAN, effectiveUntil: null, payload: '{broken', sourceType: 'UNVERIFIED', verificationStatus: 'NEEDS_REVIEW' },
    ]);
    const resolved = await resolveActiveRule('k', JUN);
    expect(resolved!.payload).toEqual({});
  });

  it('returns full history oldest first, including superseded versions', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', versionNumber: 1, status: 'SUPERSEDED', payload: '{"a":1}' },
      { id: 'v2', versionNumber: 2, status: 'ACTIVE', payload: '{"a":2}' },
    ]);
    const history = await ruleHistory('k');
    expect(history.map((row) => row.versionNumber)).toEqual([1, 2]);
    expect(versionFindMany.mock.calls[0][0].orderBy).toEqual({ versionNumber: 'asc' });
    // Superseded rows are still present — history is never pruned.
    expect(history.some((row) => row.status === 'SUPERSEDED')).toBe(true);
  });
});

describe('Verification is separate from approval (s105)', () => {
  it('refuses to mark a rule VERIFIED with no source to check', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', sourceUrl: '', sourceName: '', sourceType: 'UNVERIFIED' });
    const result = await recordRuleVerification('v1', ACTOR, { verificationStatus: 'VERIFIED' });
    expect(result.verificationStatus).toBe('NEEDS_REVIEW');
    expect(result.downgraded).toBe(true);
  });

  it('accepts VERIFIED when a source URL is supplied', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', sourceUrl: '', sourceName: '', sourceType: 'UNVERIFIED' });
    const result = await recordRuleVerification('v1', ACTOR, {
      verificationStatus: 'VERIFIED',
      sourceUrl: 'https://www.gov.uk/student-visa',
      sourceType: 'OFFICIAL_GOVERNMENT',
    });
    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.downgraded).toBe(false);
  });

  it('accepts a source name in place of a URL', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', sourceUrl: '', sourceName: '', sourceType: 'UNVERIFIED' });
    const result = await recordRuleVerification('v1', ACTOR, {
      verificationStatus: 'VERIFIED',
      sourceName: 'UKVI guidance 10/2026',
    });
    expect(result.verificationStatus).toBe('VERIFIED');
  });

  it('records who verified and when', async () => {
    versionFindUnique.mockResolvedValue({ id: 'v1', sourceUrl: 'https://gov.uk', sourceName: '', sourceType: 'OFFICIAL_GOVERNMENT' });
    await recordRuleVerification('v1', ACTOR, { verificationStatus: 'VERIFIED' });
    const data = versionUpdate.mock.calls[0][0].data;
    expect(data.verifiedBy).toBe('user-admin');
    expect(data.verifiedAt).toBeInstanceOf(Date);
  });

  it('refuses an anonymous verification', async () => {
    await expect(recordRuleVerification('v1', {}, { verificationStatus: 'VERIFIED' })).rejects.toThrow('ACTOR_REQUIRED');
  });

  it('refuses an unknown version', async () => {
    await expect(recordRuleVerification('ghost', ACTOR, {})).rejects.toThrow('RULE_VERSION_NOT_FOUND');
  });
});

describe('Expiry sweep is idempotent (s89)', () => {
  it('expires only ACTIVE versions whose window has closed', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', ruleKey: 'k', versionNumber: 1 },
      { id: 'v2', ruleKey: 'k2', versionNumber: 1 },
    ]);
    const result = await expireOverdueRules({ now: JUN });
    expect(result.expired).toBe(2);
    expect(result.ids).toEqual(['v1', 'v2']);
    expect(versionUpdate).toHaveBeenCalledTimes(2);
    expect(versionUpdate.mock.calls[0][0].data).toEqual({ status: 'EXPIRED' });

    const where = versionFindMany.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVE');
    expect(where.effectiveUntil.lt).toEqual(JUN);
    expect(where.effectiveUntil.not).toBe(null);
  });

  it('does nothing when no version is overdue', async () => {
    const result = await expireOverdueRules({ now: JUN });
    expect(result.expired).toBe(0);
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('bounds the sweep', async () => {
    await expireOverdueRules({ now: JUN, limit: 100000 });
    expect(versionFindMany.mock.calls[0][0].take).toBe(1000);
  });
});

describe('Policy change detection never applies the change (s64, s116)', () => {
  it('requires a title', async () => {
    await expect(detectPolicyChange({ title: '  ' }, ACTOR)).rejects.toThrow('TITLE_REQUIRED');
  });

  it('creates an alert in DETECTED state and writes no rule version', async () => {
    const alert = await detectPolicyChange(
      { title: 'UKVI raises maintenance funds', countryId: 'GBR', ruleType: 'VISA_REQUIREMENT' },
      ACTOR,
    );
    expect(alert.status).toBe('DETECTED');
    expect(alert.ruleKey).toBe('country:GBR:VISA_REQUIREMENT');
    expect(versionCreate).not.toHaveBeenCalled();
    expect(versionUpdate).not.toHaveBeenCalled();
  });

  it('forces requiresApproval for high-risk rule types even if asked otherwise', async () => {
    const alert = await detectPolicyChange(
      { title: 'Visa rule change', ruleType: 'VISA_REQUIREMENT', requiresApproval: false },
      ACTOR,
    );
    expect(alert.requiresApproval).toBe(true);
  });

  it('lets a low-risk alert opt out of approval', async () => {
    const alert = await detectPolicyChange(
      { title: 'Deadline moved', ruleType: 'APPLICATION_DEADLINE', requiresApproval: false },
      ACTOR,
    );
    expect(alert.requiresApproval).toBe(false);
  });

  it('defaults a low-risk alert to requiring approval', async () => {
    const alert = await detectPolicyChange({ title: 'Deadline moved', ruleType: 'APPLICATION_DEADLINE' }, ACTOR);
    expect(alert.requiresApproval).toBe(true);
  });

  it('records the blast radius explicitly rather than assuming it', async () => {
    const alert = await detectPolicyChange(
      {
        title: 'Funds requirement up',
        ruleType: 'FINANCIAL_REQUIREMENT',
        affectedStudentIds: ['s1', 's2'],
        affectedApplicationIds: ['a1'],
        affectedWorkflows: ['visa_preparation'],
        affectedCountryIds: ['GBR'],
      },
      ACTOR,
    );
    expect(JSON.parse(alert.affectedStudentIds)).toEqual(['s1', 's2']);
    expect(JSON.parse(alert.affectedApplicationIds)).toEqual(['a1']);
    expect(alert.impactCount).toBe(3);
  });

  it('reports a zero impact honestly instead of inventing affected records', async () => {
    const alert = await detectPolicyChange({ title: 'Minor update', ruleType: 'POLICY' }, ACTOR);
    expect(alert.impactCount).toBe(0);
    expect(JSON.parse(alert.affectedStudentIds)).toEqual([]);
  });

  it('attributes detection to the monitor when no actor is supplied', async () => {
    const alert = await detectPolicyChange({ title: 'Crawled change' });
    expect(alert.createdBy).toBe('MONITOR');
  });
});

describe('Alert triage links detection to a proposed version (s64)', () => {
  it('refuses anonymous triage', async () => {
    await expect(triagePolicyChange('a1', {}, {})).rejects.toThrow('ACTOR_REQUIRED');
  });

  it('refuses an unknown alert', async () => {
    await expect(triagePolicyChange('ghost', ACTOR, {})).rejects.toThrow('POLICY_ALERT_NOT_FOUND');
  });

  it('moves to PROPOSED once a rule version is attached', async () => {
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'DETECTED', severity: 'INFO', proposedRuleVersionId: '', reviewTaskId: '' });
    const result = await triagePolicyChange('a1', ACTOR, { proposedRuleVersionId: 'v9', reviewTaskId: 't1' });
    expect(result.action).toBe('PROPOSED');
    expect(alertUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'PROPOSED',
      proposedRuleVersionId: 'v9',
      reviewTaskId: 't1',
      triagedBy: 'user-admin',
    });
  });

  it('moves to TRIAGED when no version has been drafted yet', async () => {
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'DETECTED', severity: 'INFO', proposedRuleVersionId: '', reviewTaskId: '' });
    const result = await triagePolicyChange('a1', ACTOR, { severity: 'URGENT' });
    expect(result.action).toBe('TRIAGED');
    expect(alertUpdate.mock.calls[0][0].data.severity).toBe('URGENT');
  });

  it('refuses to re-triage a dismissed or approved alert', async () => {
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'DISMISSED' });
    await expect(triagePolicyChange('a1', ACTOR, {})).rejects.toThrow('CANNOT_TRIAGE_DISMISSED');
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'APPROVED' });
    await expect(triagePolicyChange('a1', ACTOR, {})).rejects.toThrow('CANNOT_TRIAGE_APPROVED');
  });

  it('requires a reason to dismiss, and cannot dismiss an approved change', async () => {
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'DETECTED' });
    await expect(dismissPolicyChange('a1', ACTOR, '')).rejects.toThrow('DISMISS_REASON_REQUIRED');

    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'APPROVED' });
    await expect(dismissPolicyChange('a1', ACTOR, 'not real')).rejects.toThrow('CANNOT_DISMISS_APPROVED');
  });

  it('records a dismissal with its reason', async () => {
    alertFindUnique.mockResolvedValue({ id: 'a1', status: 'DETECTED' });
    const result = await dismissPolicyChange('a1', ACTOR, 'Already reflected in version 3');
    expect(result.action).toBe('DISMISSED');
    expect(alertUpdate.mock.calls[0][0].data).toMatchObject({
      status: 'DISMISSED',
      dismissedReason: 'Already reflected in version 3',
    });
  });
});

describe('Open-alert listing is severity ordered (s85, s107)', () => {
  it('returns the most severe alert first regardless of detection order', async () => {
    alertFindMany.mockResolvedValue([
      { id: 'a1', severity: 'INFO', detectedAt: new Date('2026-10-01'), status: 'DETECTED', affectedWorkflows: '[]', affectedStudentIds: '[]', affectedApplicationIds: '[]', affectedCountryIds: '[]' },
      { id: 'a2', severity: 'CRITICAL', detectedAt: new Date('2026-09-01'), status: 'DETECTED', affectedWorkflows: '[]', affectedStudentIds: '[]', affectedApplicationIds: '[]', affectedCountryIds: '[]' },
      { id: 'a3', severity: 'WARNING', detectedAt: new Date('2026-10-05'), status: 'DETECTED', affectedWorkflows: '[]', affectedStudentIds: '[]', affectedApplicationIds: '[]', affectedCountryIds: '[]' },
    ]);
    const alerts = await listOpenPolicyChanges();
    expect(alerts.map((alert) => alert.severity)).toEqual(['CRITICAL', 'WARNING', 'INFO']);
  });

  it('only asks for unresolved alerts', async () => {
    await listOpenPolicyChanges();
    expect(alertFindMany.mock.calls[0][0].where.status.in).toEqual(['DETECTED', 'TRIAGED', 'PROPOSED']);
  });

  it('parses the impact arrays back into lists', async () => {
    alertFindMany.mockResolvedValue([
      { id: 'a1', severity: 'INFO', affectedWorkflows: '["visa"]', affectedStudentIds: '["s1","s2"]', affectedApplicationIds: '[]', affectedCountryIds: '["GBR"]' },
    ]);
    const [alert] = await listOpenPolicyChanges();
    expect(alert.affectedStudentIds).toEqual(['s1', 's2']);
    expect(alert.affectedWorkflows).toEqual(['visa']);
  });

  it('tolerates corrupt impact JSON', async () => {
    alertFindMany.mockResolvedValue([
      { id: 'a1', severity: 'INFO', affectedWorkflows: '{broken', affectedStudentIds: null, affectedApplicationIds: '', affectedCountryIds: '[]' },
    ]);
    const [alert] = await listOpenPolicyChanges();
    expect(alert.affectedWorkflows).toEqual([]);
    expect(alert.affectedStudentIds).toEqual([]);
  });

  it('bounds the result set', async () => {
    await listOpenPolicyChanges({ limit: 100000 });
    expect(alertFindMany.mock.calls[0][0].take).toBe(200);
  });
});

describe('Stale-rule reporting (s43, s108)', () => {
  it('finds ACTIVE rules that were never verified or verified too long ago', async () => {
    await listStaleRules({ olderThanDays: 180 });
    const where = versionFindMany.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVE');
    expect(where.OR).toEqual([{ verifiedAt: null }, { verifiedAt: { lt: expect.any(Date) } }]);
  });

  it('reports days since verification, and null when never verified', async () => {
    versionFindMany.mockResolvedValue([
      { id: 'v1', verifiedAt: new Date(Date.now() - 10 * 86_400_000), sourceType: 'OFFICIAL_GOVERNMENT', verificationStatus: 'VERIFIED', payload: '{}' },
      { id: 'v2', verifiedAt: null, sourceType: 'UNVERIFIED', verificationStatus: 'NEEDS_REVIEW', payload: '{}' },
    ]);
    const stale = await listStaleRules();
    expect(stale[0].daysSinceVerified).toBe(10);
    expect(stale[1].daysSinceVerified).toBeNull();
    expect(stale[0].authoritative).toBe(true);
    expect(stale[1].authoritative).toBe(false);
  });

  it('clamps an absurd lookback window', async () => {
    await listStaleRules({ olderThanDays: 999999, limit: 999999 });
    expect(versionFindMany.mock.calls[0][0].take).toBe(500);
  });
});
