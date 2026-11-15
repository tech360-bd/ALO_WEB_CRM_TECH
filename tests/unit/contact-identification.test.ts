/**
 * Live student identification — decision-layer unit tests.
 *
 * The rules that matter are not visual: they decide whether the right person's file
 * is opened in front of a caller. Specifically:
 *
 *   - a name alone never identifies anyone
 *   - two matching records never produce a single confident answer
 *   - a guardian's number is never reported as the student's own number
 *   - an unknown number creates nothing, and says so
 *   - the feature never describes itself as real-time
 *
 * No database: `buildIdentificationCard` is pure, and the matching it consumes is the
 * repository's existing `resolveContactIdentity`.
 */

import { describe, expect, it } from 'vitest';
import {
  buildIdentificationCard,
  normalizeIdentificationInput,
  rejectNameOnlyIdentification,
  type PrimaryIdentity,
} from '@/lib/contacts/identification-card';
import { resolveContactIdentity, type ContactCandidate } from '@/lib/communications/contact-identity';

const STUDENT_PHONE = '8801712345678';
const OTHER_PHONE = '8801812345678';

function studentCandidate(overrides: Partial<ContactCandidate> = {}): ContactCandidate {
  return {
    kind: 'student',
    id: 'stu_1',
    reference: 'AE-2026000001',
    name: 'Rakib Hasan',
    phone: STUDENT_PHONE,
    email: 'rakib@example.com',
    matchedOn: 'phone',
    ...overrides,
  };
}

function studentProfile(overrides: Partial<PrimaryIdentity> = {}): PrimaryIdentity {
  return {
    kind: 'student',
    recordId: 'stu_1',
    publicId: 'AE-2026000001',
    name: 'Rakib Hasan',
    lifecycleStage: 'application_submitted',
    status: 'active',
    phones: [{ value: STUDENT_PHONE, normalized: STUDENT_PHONE, source: 'student.phone' }],
    email: 'rakib@example.com',
    photoUrl: null,
    photoReason: 'No photo column exists.',
    parentGuardian: [],
    counselor: { id: 'emp_9', name: 'Nusrat Jahan' },
    application: { university: 'Deakin University', course: 'Master of IT', stage: 'SUBMITTED', status: 'active' },
    lastConversation: { channel: 'whatsapp', at: '2026-11-14T09:00:00.000Z', preview: 'Sent documents', direction: 'inbound' },
    openFollowUps: [],
    historyCount: 12,
    profileHref: '/crm/students/stu_1',
    scopeNotice: null,
    ...overrides,
  };
}

function card(input: {
  phone: string;
  candidates: ContactCandidate[];
  profiles?: Map<string, PrimaryIdentity>;
  guardians?: Parameters<typeof buildIdentificationCard>[0]['guardians'];
}) {
  // Mirrors `identifyByPhone`: the digits are offered as primary and alternate so a
  // lead found through `altPhone` resolves as a possible match.
  const match = resolveContactIdentity({ phone: input.phone, altPhone: input.phone }, input.candidates);
  return buildIdentificationCard({
    phone: input.phone,
    match,
    guardians: input.guardians ?? [],
    profiles: input.profiles ?? new Map(),
    registryContactId: 'reg_1',
    startedAt: performance.now(),
  });
}

describe('name-only identification is refused', () => {
  it('does not normalise a name into a number', () => {
    expect(normalizeIdentificationInput('Rakib Hasan')).toBeNull();
    expect(normalizeIdentificationInput('')).toBeNull();
    expect(normalizeIdentificationInput('N/A')).toBeNull();
  });

  it('returns an explicit refusal code rather than a vague error', () => {
    const refusal = rejectNameOnlyIdentification();
    expect(refusal.code).toBe('NAME_ONLY_NOT_ALLOWED');
    expect(refusal.error).toMatch(/phone number/i);
  });
});

describe('IDENTIFIED — exactly one record on its own number', () => {
  it('returns the full card, without asking for confirmation', () => {
    const profiles = new Map<string, PrimaryIdentity>([['student:stu_1', studentProfile()]]);
    const result = card({ phone: '01712345678', candidates: [studentCandidate()], profiles });

    expect(result.state).toBe('IDENTIFIED');
    expect(result.requiresConfirmation).toBe(false);
    expect(result.restricted).toBe(false);
    expect(result.primary?.publicId).toBe('AE-2026000001');
    expect(result.primary?.application).toMatchObject({ university: 'Deakin University', course: 'Master of IT' });
    expect(result.primary?.counselor?.name).toBe('Nusrat Jahan');
    expect(result.primary?.lastConversation?.preview).toBe('Sent documents');
    expect(result.primary?.profileHref).toBe('/crm/students/stu_1');
    expect(result.registryContactId).toBe('reg_1');
  });

  it('echoes the normalised number so a mis-keyed number is visible', () => {
    const result = card({ phone: '01712345678', candidates: [studentCandidate()] });
    expect(result.queriedPhone).toBe(STUDENT_PHONE);
    expect(result.matchedOn).toBe('phone');
  });
});

describe('POSSIBLE_MATCHES — ambiguity is never resolved automatically', () => {
  it('lists two students sharing a number instead of choosing one', () => {
    const profiles = new Map<string, PrimaryIdentity>([
      ['student:stu_1', studentProfile()],
      ['student:stu_2', studentProfile({ recordId: 'stu_2', publicId: 'AE-2026000002', name: 'Rakib Hasan (brother)' })],
    ]);
    const result = card({
      phone: '01712345678',
      candidates: [
        studentCandidate(),
        studentCandidate({ id: 'stu_2', reference: 'AE-2026000002', name: 'Rakib Hasan (brother)' }),
      ],
      profiles,
    });

    expect(result.state).toBe('POSSIBLE_MATCHES');
    expect(result.primary).toBeNull();
    expect(result.requiresConfirmation).toBe(true);
    expect(result.possible).toHaveLength(2);
    expect(result.possible.map((entry) => entry.publicId).sort()).toEqual(['AE-2026000001', 'AE-2026000002']);
    // Each option carries the facts needed to choose correctly.
    expect(result.possible[0].distinguishing.join(' ')).toMatch(/matched on phone/);
    expect(result.notice).toMatch(/never merges records automatically/i);
  });

  it('treats a secondary-field-only match as a possible match, not an identification', () => {
    const result = card({
      phone: '01799999999',
      candidates: [studentCandidate({ phone: OTHER_PHONE, altPhone: '01799999999', matchedOn: 'alt_phone' })],
    });
    expect(result.state).toBe('POSSIBLE_MATCHES');
    expect(result.matchedOn).toBe('alt_phone');
    expect(result.primary).toBeNull();
    expect(result.requiresConfirmation).toBe(true);
  });

  it('includes the guardian as an option when the number is both known and a guardian line', () => {
    const result = card({
      phone: '01712345678',
      candidates: [studentCandidate(), studentCandidate({ id: 'stu_2', reference: 'AE-2026000002' })],
      guardians: [
        {
          studentRecordId: 'stu_2',
          studentPublicId: 'AE-2026000002',
          studentName: 'Sadia Akter',
          guardianName: 'Kamal Uddin',
          relationship: 'FATHER',
          guardianId: 'pg_1',
          isPrimaryContact: true,
          isFinancialSponsor: true,
          status: 'ACTIVE',
          profileHref: '/crm/students/stu_2',
        },
      ],
    });
    expect(result.state).toBe('POSSIBLE_MATCHES');
    expect(result.possible.some((entry) => entry.kind === 'guardian')).toBe(true);
  });
});

describe('GUARDIAN_NUMBER — a parent’s line is not the student’s line', () => {
  it('resolves to the guardians and names the students they belong to', () => {
    const result = card({
      phone: '01712345678',
      candidates: [],
      guardians: [
        {
          studentRecordId: 'stu_2',
          studentPublicId: 'AE-2026000002',
          studentName: 'Sadia Akter',
          guardianName: 'Kamal Uddin',
          relationship: 'FATHER',
          guardianId: 'pg_1',
          isPrimaryContact: true,
          isFinancialSponsor: false,
          status: 'ACTIVE',
          profileHref: '/crm/students/stu_2',
        },
      ],
    });
    expect(result.state).toBe('GUARDIAN_NUMBER');
    expect(result.primary).toBeNull();
    expect(result.guardians).toHaveLength(1);
    expect(result.notice).toMatch(/not to a student/i);
    expect(result.notice).toContain('Sadia Akter (AE-2026000002)');
  });
});

describe('UNKNOWN — nothing is created', () => {
  it('returns the number with the allowed next actions and no identity', () => {
    const result = card({ phone: '01999999999', candidates: [] });
    expect(result.state).toBe('UNKNOWN');
    expect(result.primary).toBeNull();
    expect(result.requiresConfirmation).toBe(false);
    expect(result.unknown?.number).toBe('8801999999999');
    expect(result.unknown?.suggestedActions).toContain('create_lead');
    expect(result.unknown?.suggestedActions).toContain('create_unverified_contact');
    expect(result.unknown?.notice).toMatch(/Student ID can only be created by approving a registration/i);
  });
});

describe('honesty about timing', () => {
  it('never claims real-time, and reports a measured duration instead', () => {
    const result = card({ phone: '01712345678', candidates: [studentCandidate()] });
    expect(result.meta.realTimeVerified).toBe(false);
    expect(result.meta.realTimeNote).toMatch(/has not been measured/i);
    expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(Date.parse(result.meta.resolvedAt))).toBe(true);
  });
});
