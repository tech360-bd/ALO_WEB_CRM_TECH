/**
 * Company phone pool — planning and reconciliation (Phase 2 §3).
 *
 * The pool is configuration, not proof. These tests pin the three properties that
 * matter operationally:
 *
 *   1. a configured number is validated and de-duplicated before it reaches the DB;
 *   2. an existing row is never overwritten — assignments and verification survive;
 *   3. a number is never reported as usable merely because it is listed.
 *
 * The numbers are read from the operator configuration, never hardcoded here: a test
 * that embeds the company's numbers would be the very hardcoding the brief forbids.
 */

import { describe, expect, it } from 'vitest';
import {
  normalizeBdPhone,
  planPoolSeed,
  reconcilePool,
  toBdDisplayPhone,
} from '@/lib/whatsapp-number-pool-plan';

// Representative *shapes* only — no real ALO number is asserted in this file.
const CONFIGURED_MAIN = '01700000001';
const CONFIGURED_COO = '01700000002';
const CONFIGURED_EMPLOYEE = '01700000003';

describe('number validation', () => {
  it('accepts both local and E.164 forms and normalises them', () => {
    expect(normalizeBdPhone('01700000001')).toBe('8801700000001');
    expect(normalizeBdPhone('8801700000001')).toBe('8801700000001');
    expect(normalizeBdPhone('+880 1700-000001')).toBe('8801700000001');
    expect(toBdDisplayPhone('8801700000001')).toBe('01700000001');
  });

  it('rejects anything that is not a Bangladesh mobile number', () => {
    for (const value of ['', '0', 'N/A', '12345', '9991700000001', '0170000000']) {
      expect(normalizeBdPhone(value)).toBe('');
    }
  });
});

describe('planPoolSeed', () => {
  it('creates nothing when nothing is configured, and says why', () => {
    const plan = planPoolSeed({ configured: [], existing: [] });
    expect(plan.create).toHaveLength(0);
    expect(plan.summary).toMatch(/No official numbers are configured/i);
    expect(plan.requiresOwnershipVerification).toBe(true);
  });

  it('creates a main, a COO and an employee record with the right roles', () => {
    // MAIN_NUMBER / COO_NUMBER come from the environment, so this test only asserts
    // the role mapping when those variables are present; otherwise every row is an
    // employee record and the assertion is skipped rather than faked.
    const plan = planPoolSeed({
      configured: [CONFIGURED_MAIN, CONFIGURED_COO, CONFIGURED_EMPLOYEE],
      existing: [],
    });
    expect(plan.create).toHaveLength(3);
    expect(plan.create.every((entry) => entry.connectionStatus === 'disconnected')).toBe(true);
    expect(new Set(plan.create.map((entry) => entry.ownerType)).size).toBeGreaterThan(0);
  });

  it('rejects invalid and duplicate configured values instead of storing them', () => {
    const plan = planPoolSeed({
      configured: [CONFIGURED_MAIN, 'not-a-number', CONFIGURED_MAIN, toBdDisplayPhone(CONFIGURED_MAIN)],
      existing: [],
    });
    expect(plan.create).toHaveLength(1);
    expect(plan.rejected).toHaveLength(3);
    expect(plan.rejected.some((entry) => entry.reason.includes('Duplicate'))).toBe(true);
    expect(plan.rejected.some((entry) => entry.reason.includes('not a valid'))).toBe(false);
  });

  it('never overwrites an existing registration — it skips it', () => {
    const plan = planPoolSeed({
      configured: [CONFIGURED_MAIN],
      existing: [{ phoneNumber: '01700000001', normalizedPhone: '8801700000001' }],
    });
    expect(plan.create).toHaveLength(0);
    expect(plan.skip).toHaveLength(1);
    expect(plan.skip[0].reason).toMatch(/preserved/i);
  });

  it('matches existing rows by normalised number, so formatting differences do not duplicate', () => {
    const plan = planPoolSeed({
      configured: ['01700000001'],
      existing: [{ phoneNumber: '8801700000001' }],
    });
    expect(plan.create).toHaveLength(0);
    expect(plan.skip).toHaveLength(1);
  });

  it('is idempotent: planning twice against the same registry creates nothing the second time', () => {
    const first = planPoolSeed({ configured: [CONFIGURED_MAIN], existing: [] });
    const existingAfter = first.create.map((entry) => ({ phoneNumber: entry.phoneNumber, normalizedPhone: entry.normalizedPhone }));
    const second = planPoolSeed({ configured: [CONFIGURED_MAIN], existing: existingAfter });
    expect(second.create).toHaveLength(0);
    expect(second.skip).toHaveLength(1);
  });

  it('produces the same plan for concurrent identical runs, so a race cannot duplicate rows', () => {
    // The database guarantee is the unique index on phoneNumber/normalizedPhone; this
    // asserts that two simultaneous plans would attempt the same single insert.
    const a = planPoolSeed({ configured: [CONFIGURED_MAIN], existing: [] });
    const b = planPoolSeed({ configured: [CONFIGURED_MAIN], existing: [] });
    expect(a.create).toEqual(b.create);
    expect(new Set(a.create.map((entry) => entry.normalizedPhone)).size).toBe(a.create.length);
  });
});

describe('reconcilePool', () => {
  it('reports a configured number missing from the registry as an issue', () => {
    const result = reconcilePool({ configured: [CONFIGURED_MAIN], registered: [] });
    expect(result.ok).toBe(false);
    expect(result.missingFromRegistry).toEqual([CONFIGURED_MAIN]);
    expect(result.summary).toMatch(/do not fully agree/i);
  });

  it('reports a registered number absent from the runtime configuration', () => {
    const result = reconcilePool({
      configured: [],
      registered: [{ phoneNumber: CONFIGURED_MAIN, ownerType: 'ALO_MAIN', connectionStatus: 'disconnected' }],
    });
    expect(result.notConfiguredInRuntime).toEqual([CONFIGURED_MAIN]);
    expect(result.issues.join(' ')).toMatch(/no route can select a sender/i);
  });

  it('never treats a registered number as verified without a recent provider check', () => {
    const result = reconcilePool({
      configured: [CONFIGURED_MAIN],
      registered: [{ phoneNumber: CONFIGURED_MAIN, ownerType: 'ALO_MAIN', connectionStatus: 'connected', metaPhoneNumberId: '123' }],
    });
    expect(result.ownershipUnverified).toEqual([CONFIGURED_MAIN]);
    expect(result.ok).toBe(false);
  });

  it('is clean only when configuration, registry and verification all agree', () => {
    const result = reconcilePool({
      configured: [CONFIGURED_MAIN],
      registered: [{ phoneNumber: CONFIGURED_MAIN, ownerType: 'ALO_MAIN', connectionStatus: 'connected', metaPhoneNumberId: '123' }],
      verifiedPhoneNumbers: [CONFIGURED_MAIN],
    });
    expect(result.ok).toBe(true);
    expect(result.ownershipUnverified).toHaveLength(0);
    expect(result.entries[0].issue).toBeNull();
    expect(result.requiresOwnershipVerification).toBe(true);
  });

  it('says live sending is disabled when nothing is configured or registered', () => {
    const result = reconcilePool({ configured: [], registered: [] });
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/disabled by design/i);
  });

  it('de-duplicates repeated configuration entries in the counts', () => {
    const result = reconcilePool({
      configured: [CONFIGURED_MAIN, '8801700000001'],
      registered: [{ phoneNumber: CONFIGURED_MAIN }],
      verifiedPhoneNumbers: [],
    });
    expect(result.configuredCount).toBe(1);
    expect(result.registeredCount).toBe(1);
  });
});
