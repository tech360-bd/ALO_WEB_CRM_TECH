/**
 * Contact merge — policy unit tests (Phase 2 §4).
 *
 * A merge rewrites the registry, so these tests are written as refusals first:
 * what the plan must never allow is more important than what it produces.
 *
 * No database: `planContactMerge` is pure, and the route is a thin executor of it.
 */

import { describe, expect, it } from 'vitest';
import {
  googleAliases,
  mergeConfirmationToken,
  mergedInto,
  parseTags,
  planContactMerge,
  serializeTags,
  summarizeMergePlan,
  type MergeContactRow,
} from '@/lib/contacts/merge';
import { planContactImport } from '@/lib/google/contacts';

function row(overrides: Partial<MergeContactRow> = {}): MergeContactRow {
  return {
    id: 'dest',
    phone: '01712345678',
    normalizedPhone: '8801712345678',
    displayName: 'Rakib Hasan',
    profileName: '',
    email: 'rakib@example.com',
    normalizedEmail: 'rakib@example.com',
    countryCode: '880',
    externalContactId: 'people/c1',
    studentId: 'stu_1',
    leadId: '',
    partnerId: '',
    assignedCounselorId: 'emp_9',
    branch: 'Dhaka',
    source: 'WHATSAPP',
    isBlocked: false,
    isOptedOut: false,
    optedOutAt: null,
    tags: [],
    updatedAt: '2026-11-15T10:00:00.000Z',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('tag helpers', () => {
  it('parses JSON arrays, arrays and comma strings without losing data', () => {
    expect(parseTags('["a","b"]')).toEqual(['a', 'b']);
    expect(parseTags(['a', ' b '])).toEqual(['a', 'b']);
    expect(parseTags('a, b')).toEqual(['a', 'b']);
    expect(parseTags('')).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });

  it('serialises without duplicates', () => {
    expect(serializeTags(['a', 'a', 'b'])).toBe('["a","b"]');
  });

  it('reads the merged_into and google_alias markers', () => {
    expect(mergedInto(['merged_into:abc'])).toBe('abc');
    expect(mergedInto(['source:CSV'])).toBeNull();
    expect(googleAliases(['google_alias:people/c7', 'x'])).toEqual(['people/c7']);
  });
});

describe('refusals — the plan must block these', () => {
  it('refuses to merge a contact into itself', () => {
    const plan = planContactMerge({ destination: row(), sources: [row()] });
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/into itself/i);
  });

  it('refuses when two different students would be conflated', () => {
    const plan = planContactMerge({
      destination: row(),
      sources: [row({ id: 'src', normalizedPhone: '8801812345678', studentId: 'stu_2' })],
    });
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/rewrite a student identity/i);
  });

  it('refuses when two different leads or partners would be conflated', () => {
    const leadPlan = planContactMerge({
      destination: row({ studentId: '', leadId: 'lead_1' }),
      sources: [row({ id: 'src', studentId: '', leadId: 'lead_2' })],
    });
    expect(leadPlan.ok).toBe(false);
    expect(leadPlan.blockers.join(' ')).toMatch(/lead identity/i);

    const partnerPlan = planContactMerge({
      destination: row({ studentId: '', partnerId: 'p_1' }),
      sources: [row({ id: 'src', studentId: '', partnerId: 'p_2' })],
    });
    expect(partnerPlan.ok).toBe(false);
    expect(partnerPlan.blockers.join(' ')).toMatch(/partner boundary/i);
  });

  it('refuses a source that is already an alias of another contact', () => {
    const plan = planContactMerge({
      destination: row(),
      sources: [row({ id: 'src', tags: ['merged_into:other'] })],
    });
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/already merged into another contact/i);
  });

  it('refuses to merge into a contact that is itself an alias', () => {
    const plan = planContactMerge({
      destination: row({ tags: ['merged_into:primary'] }),
      sources: [row({ id: 'src' })],
    });
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/merge into the primary/i);
  });

  it('refuses an empty or oversized source list', () => {
    expect(planContactMerge({ destination: row(), sources: [] }).ok).toBe(false);
    const many = Array.from({ length: 6 }, (_, index) => row({ id: `s${index}`, studentId: '', normalizedPhone: `88019123456${index}0` }));
    expect(planContactMerge({ destination: row({ studentId: '' }), sources: many }).ok).toBe(false);
  });

  it('refuses the same source twice', () => {
    const plan = planContactMerge({ destination: row(), sources: [row({ id: 'src' }), row({ id: 'src' })] });
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/selected twice/i);
  });
});

describe('field resolution — the destination keeps its own truth', () => {
  it('keeps populated destination values and only fills gaps from the source', () => {
    const plan = planContactMerge({
      destination: row({ profileName: '', countryCode: '' }),
      sources: [row({ id: 'src', displayName: 'Rakib H.', profileName: 'Rakib WhatsApp', countryCode: '880' })],
    });
    expect(plan.ok).toBe(true);
    expect(plan.destinationUpdate.displayName).toBe('Rakib Hasan');
    expect(plan.destinationUpdate.profileName).toBe('Rakib WhatsApp');
    expect(plan.destinationUpdate.countryCode).toBe('880');
    const nameResolution = plan.resolutions.find((entry) => entry.field === 'displayName');
    expect(nameResolution?.from).toBe('destination');
    expect(nameResolution?.note).toMatch(/recorded in the audit trail/i);
  });

  it('takes the source identity when the destination has none', () => {
    const plan = planContactMerge({
      destination: row({ studentId: '', email: '', normalizedEmail: '' }),
      sources: [row({ id: 'src' })],
    });
    expect(plan.destinationUpdate.studentId).toBe('stu_1');
    expect(plan.destinationUpdate.email).toBe('rakib@example.com');
    expect(plan.resolutions.find((entry) => entry.field === 'studentId')?.from).toBe('source');
  });

  it('unions opt-out and block so a merge never makes a contact more reachable', () => {
    const plan = planContactMerge({
      destination: row(),
      sources: [row({ id: 'src', isOptedOut: true, optedOutAt: '2026-11-02T00:00:00.000Z', isBlocked: true })],
    });
    expect(plan.destinationUpdate.isOptedOut).toBe(true);
    expect(plan.destinationUpdate.isBlocked).toBe(true);
    expect(plan.destinationUpdate.optedOutAt).toBe('2026-11-02T00:00:00.000Z');
    expect(plan.warnings.join(' ')).toMatch(/opt-out is inherited/i);
    // The alias inherits the merged state too.
    expect(plan.aliasUpdates[0].isOptedOut).toBe(true);
  });

  it('preserves every number and both Google resource names', () => {
    const plan = planContactMerge({
      destination: row(),
      sources: [row({ id: 'src', normalizedPhone: '8801812345678', phone: '01812345678', externalContactId: 'people/c2' })],
    });
    expect(plan.preserved.numbers).toEqual(['8801712345678', '8801812345678']);
    expect(plan.preserved.externalContactIds).toEqual(['people/c1', 'people/c2']);
    // Only one name fits in the column; the other becomes an alias tag.
    expect(plan.destinationUpdate.externalContactId).toBe('people/c1');
    expect(googleAliases(plan.destinationUpdate.tags)).toContain('people/c2');
  });

  it('adopts the source resource name when the destination has none', () => {
    const plan = planContactMerge({
      destination: row({ externalContactId: '' }),
      sources: [row({ id: 'src', externalContactId: 'people/c2' })],
    });
    expect(plan.destinationUpdate.externalContactId).toBe('people/c2');
    expect(googleAliases(plan.destinationUpdate.tags)).toEqual([]);
  });

  it('marks the source as an alias pointing at the destination and mirrors person links', () => {
    const plan = planContactMerge({ destination: row(), sources: [row({ id: 'src' })] });
    expect(plan.aliasUpdates).toHaveLength(1);
    expect(mergedInto(plan.aliasUpdates[0].tags)).toBe('dest');
    expect(plan.aliasUpdates[0].studentId).toBe('stu_1');
    expect(plan.aliasUpdates[0].branch).toBe('Dhaka');
  });

  it('merges tag sets without duplicating or dropping provenance', () => {
    const plan = planContactMerge({
      destination: row({ tags: ['source:WHATSAPP', 'preferred:raki'] }),
      sources: [row({ id: 'src', tags: ['source:GOOGLE_CONTACTS', 'preferred:raki', 'city:Dhaka'] })],
    });
    expect(plan.destinationUpdate.tags).toContain('source:WHATSAPP');
    expect(plan.destinationUpdate.tags).toContain('source:GOOGLE_CONTACTS');
    expect(plan.destinationUpdate.tags).toContain('city:Dhaka');
    expect(plan.destinationUpdate.tags.filter((tag) => tag === 'preferred:raki')).toHaveLength(1);
  });

  it('treats an already-aliased source as a warning, not a second merge', () => {
    const plan = planContactMerge({
      destination: row(),
      sources: [row({ id: 'src', tags: ['merged_into:dest'] })],
    });
    expect(plan.ok).toBe(true);
    expect(plan.aliasUpdates).toHaveLength(0);
    expect(plan.warnings.join(' ')).toMatch(/already an alias/i);
  });
});

describe('confirmation token — anti-TOCTOU', () => {
  it('is deterministic for the same state and set of ids', () => {
    const first = mergeConfirmationToken({ destinationId: 'd', sourceIds: ['a', 'b'], destinationUpdatedAt: 't1', sourceUpdatedAt: ['t2', 't3'] });
    const second = mergeConfirmationToken({ destinationId: 'd', sourceIds: ['b', 'a'], destinationUpdatedAt: 't1', sourceUpdatedAt: ['t3', 't2'] });
    expect(first).toBe(second);
  });

  it('changes when any row is modified, so a stale preview cannot be applied', () => {
    const base = { destinationId: 'd', sourceIds: ['a'], destinationUpdatedAt: 't1', sourceUpdatedAt: ['t2'] };
    expect(mergeConfirmationToken(base)).not.toBe(mergeConfirmationToken({ ...base, destinationUpdatedAt: 't9' }));
    expect(mergeConfirmationToken(base)).not.toBe(mergeConfirmationToken({ ...base, sourceUpdatedAt: ['t9'] }));
    expect(mergeConfirmationToken(base)).not.toBe(mergeConfirmationToken({ ...base, sourceIds: ['a', 'b'] }));
  });

  it('is the token the plan carries', () => {
    const destination = row();
    const source = row({ id: 'src', normalizedPhone: '8801812345678' });
    const plan = planContactMerge({ destination, sources: [source] });
    expect(plan.confirmationToken).toBe(
      mergeConfirmationToken({
        destinationId: destination.id,
        sourceIds: [source.id],
        destinationUpdatedAt: destination.updatedAt,
        sourceUpdatedAt: [source.updatedAt],
      }),
    );
  });
});

describe('summary and policy text', () => {
  it('states that nothing is deleted', () => {
    const plan = planContactMerge({ destination: row(), sources: [row({ id: 'src' })] });
    expect(summarizeMergePlan(plan)).toMatch(/nothing deleted/i);
    expect(plan.policy).toMatch(/never rewritten/i);
  });

  it('surfaces the refusal in the summary when blocked', () => {
    const plan = planContactMerge({ destination: row(), sources: [row()] });
    expect(summarizeMergePlan(plan)).toMatch(/^Merge refused/);
  });
});

describe('integration with the Google Contacts planner', () => {
  it('does not re-create a contact whose resource name survived a merge as an alias tag', () => {
    // A merged pair: the destination holds people/c2 as an alias tag after the merge.
    const existing = {
      id: 'dest',
      normalizedPhone: '8801712345678',
      displayName: 'Rakib Hasan',
      email: '',
      source: 'WHATSAPP',
      externalContactId: 'people/c1',
      studentId: 'stu_1',
      leadId: '',
      isBlocked: false,
      isOptedOut: false,
      tags: ['google_alias:people/c2'],
    };

    const result = planContactImport({
      people: [{
        resourceName: 'people/c2',
        displayName: 'Rakib Hasan',
        phones: [{ value: '01712345678', normalized: '8801712345678', type: 'mobile' }],
        emails: [],
        etag: 'e',
        deleted: false,
      }],
      existing: [existing],
    });

    expect(result.decisions[0].action).toBe('SKIP_ALREADY_LINKED');
    expect(result.counters.create).toBe(0);
  });
});
