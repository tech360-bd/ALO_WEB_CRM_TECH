/**
 * B2B prospect validation — the executable form of the Google data-policy
 * rules in the prospect-import spec (§ Google prospect sourcing, Import Center).
 *
 * These tests are the guard rail: if anyone weakens the Maps restriction,
 * these fail.
 */

import { describe, expect, it } from 'vitest';
import {
  buildImportSummary,
  normalizePhone,
  prospectDedupeKey,
  validateProspectRow,
  websiteDomain,
} from '@/lib/prospects/prospect-validation';

const validRow = {
  organizationName: 'Dhaka Study Abroad Agency',
  contactPerson: 'Amina Rahman',
  businessEmail: 'Info@ExampleAgency.com ',
  businessPhone: '+880 1712-345678',
  officialWebsite: 'https://www.exampleagency.com/',
  country: 'Bangladesh',
  city: 'Dhaka',
  organizationType: 'agency',
  sourceType: 'HUMAN_GOOGLE_SEARCH',
  sourceUrl: 'https://www.exampleagency.com/contact',
  researchDate: '2026-11-10',
  notes: 'Verified from official website; published contact page.',
};

describe('validateProspectRow', () => {
  it('accepts a fully-sourced human-verified row and normalizes it', () => {
    const result = validateProspectRow(validRow, 1);
    expect(result.ok).toBe(true);
    expect(result.value?.normalizedEmail).toBe('info@exampleagency.com');
    expect(result.value?.normalizedPhone).toBe('+8801712345678');
    expect(result.value?.organizationType).toBe('AGENCY');
    expect(result.value?.dedupeKey).toBe('domain:exampleagency.com');
    expect(result.value?.researchDate?.toISOString().slice(0, 10)).toBe('2026-11-10');
  });

  it('rejects a row with no organization name', () => {
    const result = validateProspectRow({ ...validRow, organizationName: '' }, 2);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch('organizationName is required');
  });

  it('rejects malformed email and phone', () => {
    const email = validateProspectRow({ ...validRow, businessEmail: 'not-an-email' }, 3);
    expect(email.ok).toBe(false);
    expect(email.reasons.join(' ')).toMatch('businessEmail');
    const phone = validateProspectRow({ ...validRow, businessPhone: '123' }, 4);
    expect(phone.ok).toBe(false);
    expect(phone.reasons.join(' ')).toMatch('businessPhone');
  });

  it('requires an https source or official website for every row', () => {
    const result = validateProspectRow(
      { ...validRow, officialWebsite: '', sourceUrl: '' },
      5,
    );
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch('officialWebsite or sourceUrl');
  });

  it('enforces the Google Maps data restriction: phone/email/contactPerson rejected', () => {
    const row = {
      ...validRow,
      sourceType: 'GOOGLE_MAPS',
      officialWebsite: 'https://www.exampleagency.com',
    };
    const result = validateProspectRow(row, 6);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch('GOOGLE_MAPS rows must not carry businessPhone');
    expect(result.reasons.join(' ')).toMatch('GOOGLE_MAPS rows must not carry businessEmail');
    expect(result.reasons.join(' ')).toMatch('GOOGLE_MAPS rows must not carry contactPerson');
  });

  it('allows a Maps-origin row carrying only the official website', () => {
    const result = validateProspectRow(
      {
        ...validRow,
        contactPerson: '',
        businessEmail: '',
        businessPhone: '',
        sourceType: 'GOOGLE_MAPS',
        officialWebsite: 'https://www.exampleagency.com',
        sourceUrl: 'https://www.google.com/maps/place/x',
      },
      7,
    );
    expect(result.ok).toBe(true);
  });

  it('rejects unknown organizationType / sourceType values', () => {
    const type = validateProspectRow({ ...validRow, organizationType: 'SPACE_STATION' }, 8);
    expect(type.ok).toBe(false);
    const source = validateProspectRow({ ...validRow, sourceType: 'DARK_WEB' }, 9);
    expect(source.ok).toBe(false);
  });
});

describe('prospectDedupeKey / normalizePhone / websiteDomain', () => {
  it('dedupes on normalized website domain first, then email, then phone', () => {
    expect(prospectDedupeKey({ officialWebsite: 'https://example.com/a' })).toBe('domain:example.com');
    expect(prospectDedupeKey({ officialWebsite: 'https://www.example.com' })).toBe('domain:example.com');
    expect(prospectDedupeKey({ businessEmail: 'A@b.com', businessPhone: '' })).toBe('email:a@b.com');
    expect(prospectDedupeKey({ businessPhone: '+880 171 2345678' })).toBe('phone:+8801712345678');
    expect(prospectDedupeKey({ organizationName: 'Acme  Inc', country: 'BD' })).toBe('org:acme inc|bd');
  });

  it('normalizePhone keeps a leading plus and strips separators', () => {
    expect(normalizePhone('+880 1712-345678')).toBe('+8801712345678');
    expect(normalizePhone('8801712345678')).toBe('8801712345678');
    expect(normalizePhone('')).toBe('');
  });

  it('websiteDomain rejects non-https URLs', () => {
    expect(websiteDomain('http://example.com')).toBe('');
    expect(websiteDomain('https://example.com')).toBe('example.com');
    expect(websiteDomain('not a url')).toBe('');
  });
});

describe('buildImportSummary', () => {
  it('flags duplicates inside the file and against the database, never both', () => {
    const a = validateProspectRow(validRow, 1);
    const b = validateProspectRow({ ...validRow }, 2); // identical -> file duplicate
    const c = validateProspectRow({ ...validRow, officialWebsite: 'https://www.otheragency.com', sourceUrl: 'https://www.otheragency.com' }, 3);
    const existing = new Set(['domain:otheragency.com']); // c -> db duplicate
    const summary = buildImportSummary([a, b, c], existing);
    expect(summary.received).toBe(3);
    expect(summary.valid).toBe(1);
    expect(summary.duplicatesInFile).toBe(1);
    expect(summary.duplicatesInDb).toBe(1);
    expect(summary.rows[1].duplicateOf).toBe('file');
    expect(summary.rows[2].duplicateOf).toBe('database');
  });

  it('a fully valid batch reports all rows valid', () => {
    const a = validateProspectRow(validRow, 1);
    const summary = buildImportSummary([a], new Set());
    expect(summary.valid).toBe(1);
    expect(summary.invalid).toBe(0);
  });
});
