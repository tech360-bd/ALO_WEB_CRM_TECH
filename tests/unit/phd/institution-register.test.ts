import { describe, expect, it } from 'vitest';
import {
  REGISTER_RETRIEVAL_DATE,
  TARGET_INSTITUTIONS,
  assertRegisterIntegrity,
} from '@/lib/phd/data/institutions';

describe('27-institution target register', () => {
  it('contains exactly 27 entries with stable register ids', () => {
    expect(TARGET_INSTITUTIONS).toHaveLength(27);
    const ids = TARGET_INSTITUTIONS.map((entry) => entry.registerId);
    expect(new Set(ids).size).toBe(27);
    expect(ids[0]).toBe('UK-PHD-001');
    expect(ids[26]).toBe('UK-PHD-027');
    expect(() => assertRegisterIntegrity()).not.toThrow();
  });

  it('records an official domain, HTTPS research-degree URL and retrieval date for every entry', () => {
    for (const entry of TARGET_INSTITUTIONS) {
      expect(entry.officialDomain.length).toBeGreaterThan(4);
      expect(entry.officialDomain).not.toMatch(/^https?:|www\./);
      expect(entry.researchDegreesUrl.startsWith('https://')).toBe(true);
      expect(entry.researchDegreesUrl).toContain(entry.officialDomain);
      expect(entry.rank).toBeGreaterThanOrEqual(1);
      expect(entry.rank).toBeLessThanOrEqual(27);
      expect(entry.researchDegreesPageTitle.length).toBeGreaterThan(5);
    }
    expect(REGISTER_RETRIEVAL_DATE).toBe('2026-10-25');
  });

  it('keeps the required institutions and never includes Regent’s University London', () => {
    const names = TARGET_INSTITUTIONS.map((entry) => entry.name.toLowerCase());
    for (const required of [
      'leicester', 'east london', 'aston', 'edinburgh napier', 'swansea', 'teesside',
      'nottingham trent', 'liverpool hope', 'bangor', 'hull', 'abertay', 'cardiff metropolitan',
      'gloucestershire', 'west of scotland', 'portsmouth', 'liverpool', 'plymouth', 'bradford',
      'salford', 'lincoln', 'derby', 'goldsmiths', 'queen mary', 'bath', 'anglia ruskin',
      'heriot-watt', 'bath spa',
    ]) {
      expect(names.some((name) => name.includes(required)), `missing ${required}`).toBe(true);
    }
    expect(names.some((name) => name.includes('regent'))).toBe(false);
  });

  it('rejects a register with a duplicate id, domain or a 28th entry', () => {
    const clone = TARGET_INSTITUTIONS.map((entry) => ({ ...entry }));
    clone[1] = { ...clone[1], registerId: clone[0].registerId };
    expect(() => assertRegisterIntegrity(clone)).toThrow(/duplicate register id/i);

    const duplicateDomain = TARGET_INSTITUTIONS.map((entry) => ({ ...entry }));
    duplicateDomain[1] = { ...duplicateDomain[1], officialDomain: duplicateDomain[0].officialDomain };
    expect(() => assertRegisterIntegrity(duplicateDomain)).toThrow(/duplicate domain/i);

    expect(() => assertRegisterIntegrity([...TARGET_INSTITUTIONS, { ...TARGET_INSTITUTIONS[0], registerId: 'UK-PHD-028', rank: 28 }])).toThrow(/27/);
  });

  it('does not claim formal verification or invent programme/supervisor data', () => {
    const serialised = JSON.stringify(TARGET_INSTITUTIONS);
    expect(serialised).not.toMatch(/VERIFIED_OFFICIAL/);
    expect(serialised.toLowerCase()).not.toContain('accepting students');
    expect(serialised).not.toMatch(/10\.\d{4,9}\//);
  });
});
