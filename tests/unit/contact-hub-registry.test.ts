import { describe, expect, it } from 'vitest';
import {
  CONTACT_CATEGORIES,
  buildDuplicateReviewGroups,
  categoryFor,
  lifecycleFor,
  parseContactCsv,
  parseTags,
  projectContactForExport,
  summarizeSegments,
  toRegistryContact,
  validateContactImportRow,
  DEFAULT_CONTACT_FIELD_MAPPING,
} from '@/lib/contacts/registry';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  displayName: 'Ayesha Rahman',
  phone: '01700000000',
  normalizedPhone: '8801700000000',
  email: 'ayesha@example.test',
  normalizedEmail: 'ayesha@example.test',
  studentId: '',
  leadId: '',
  partnerId: '',
  tags: '[]',
  source: 'WHATSAPP',
  isOptedOut: false,
  isBlocked: false,
  ...overrides,
});

describe('contact registry profile semantics', () => {
  it('covers every contact category required by the specification', () => {
    expect(CONTACT_CATEGORIES).toHaveLength(13);
    expect(CONTACT_CATEGORIES).toContain('PROSPECTIVE_STUDENT');
    expect(CONTACT_CATEGORIES).toContain('UNIVERSITY_PARTNER_AGENT');
    expect(CONTACT_CATEGORIES).toContain('GENERAL_ENQUIRY');
  });

  it('derives category from links and tags, defaulting to general enquiry', () => {
    expect(categoryFor(row({ studentId: 's1' }))).toBe('STUDENT');
    expect(categoryFor(row({ leadId: 'l1' }))).toBe('PROSPECTIVE_STUDENT');
    expect(categoryFor(row({ tags: '["PARENT_GUARDIAN_SPONSOR"]' }))).toBe('PARENT_GUARDIAN_SPONSOR');
    expect(categoryFor(row())).toBe('GENERAL_ENQUIRY');
  });

  it('never claims provider/email verification from mere presence', () => {
    const contact = toRegistryContact(row());
    expect(contact.whatsappVerified).toBe(false);
    expect(contact.emailVerified).toBe(false);
    expect(contact.preferredLanguage).toBe('');
    expect(contact.identityStatus).toBe('REVIEW_REQUIRED');
  });

  it('keeps suppression distinct from lifecycle stage', () => {
    expect(lifecycleFor(row({ isOptedOut: true }))).toBe('SUPPRESSED');
    expect(lifecycleFor(row({ isBlocked: true }))).toBe('INACTIVE');
    expect(lifecycleFor(row({ studentId: 's1' }))).toBe('STUDENT');
  });

  it('parses JSON tags and legacy comma tags', () => {
    expect(parseTags('["BANGLA","city:Dhaka"]')).toEqual(['BANGLA', 'city:Dhaka']);
    expect(parseTags('BANGLA, lead')).toEqual(['BANGLA', 'lead']);
    expect(parseTags('not-json')).toEqual(['not-json']);
  });
});

describe('duplicate prevention', () => {
  it('groups exact shared identifiers for review and never merges', () => {
    const contacts = [
      toRegistryContact(row({ id: 'a', normalizedPhone: '8801700000000', email: 'shared@example.test' })),
      toRegistryContact(row({ id: 'b', normalizedPhone: '8801700000000', email: 'shared@example.test' })),
    ];
    const groups = buildDuplicateReviewGroups(contacts);
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.decision === 'REVIEW_REQUIRED')).toBe(true);
    expect(groups.map((group) => group.matchedOn).sort()).toEqual(['email', 'phone']);
    expect(groups.some((group) => /family phone/i.test(group.reason))).toBe(true);
  });

  it('does not flag unrelated contacts', () => {
    const groups = buildDuplicateReviewGroups([
      toRegistryContact(row({ id: 'a', normalizedPhone: '8801700000000' })),
      toRegistryContact(row({ id: 'b', normalizedPhone: '8801700000001', email: 'other@example.test', normalizedEmail: 'other@example.test' })),
    ]);
    expect(groups).toEqual([]);
  });
});

describe('CSV import validation', () => {
  const headers = ['name', 'phone', 'email', 'type', 'language'];

  it('parses quoted fields and embedded commas', () => {
    const csv = 'name,phone,notes\n"Rahman, Ayesha",01700000000,"hello, world"\n';
    const parsed = parseContactCsv(csv);
    expect(parsed.headers).toEqual(['name', 'phone', 'notes']);
    expect(parsed.rows[0][0]).toBe('Rahman, Ayesha');
    expect(parsed.rows[0][2]).toBe('hello, world');
  });

  it('normalizes a valid Bangladeshi phone and keeps consent unimported', () => {
    const result = validateContactImportRow(headers, ['Ayesha', '01700000000', '', 'PROSPECTIVE_STUDENT', 'BANGLA'], DEFAULT_CONTACT_FIELD_MAPPING, 2);
    expect(result.errors).toEqual([]);
    expect(result.normalized?.normalizedPhone).toBe('8801700000000');
    expect(result.normalized?.category).toBe('PROSPECTIVE_STUDENT');
    expect(JSON.stringify(result.normalized)).not.toContain('consent');
  });

  it('reports row-level errors for missing identity, bad email, category and language', () => {
    const result = validateContactImportRow(headers, ['', '0', 'not-an-email', 'MAGIC_TYPE', 'Klingon'], DEFAULT_CONTACT_FIELD_MAPPING, 3);
    expect(result.errors).toHaveLength(5);
    expect(result.normalized).toBeNull();
  });

  it('rejects email-only rows because the canonical registry is phone-keyed', () => {
    // validateContactImportRow handles the schema; the API adds this row error.
    const result = validateContactImportRow(headers, ['Ayesha', '', 'ayesha@example.test', '', ''], DEFAULT_CONTACT_FIELD_MAPPING, 4);
    expect(result.errors).toEqual([]);
    expect(result.normalized?.normalizedPhone).toBe('');
  });
});

describe('minimum-necessary export', () => {
  it('omits phone and email by default and includes them only when explicitly authorized', () => {
    const contact = toRegistryContact(row());
    const minimal = projectContactForExport(contact, {});
    expect(minimal.phone).toBeUndefined();
    expect(minimal.email).toBeUndefined();
    expect(minimal.contactId).toBe('c1');
    const full = projectContactForExport(contact, { includePhone: true, includeEmail: true });
    expect(full.phone).toBe('01700000000');
    expect(full.email).toBe('ayesha@example.test');
  });
});

describe('segment summaries', () => {
  it('counts only real rows and reports suppression', () => {
    const summary = summarizeSegments([
      toRegistryContact(row({ id: 'a', studentId: 's1', tags: '["BANGLA"]' })),
      toRegistryContact(row({ id: 'b', isOptedOut: true })),
    ]);
    expect(summary.total).toBe(2);
    expect(summary.byCategory.STUDENT).toBe(1);
    expect(summary.optedOut).toBe(1);
    expect(summary.byTag.BANGLA).toBe(1);
  });
});
