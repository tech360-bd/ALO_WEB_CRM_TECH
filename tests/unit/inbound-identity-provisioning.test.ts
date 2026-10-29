import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POLICY,
  decideInboundIdentity,
  describeDecision,
  type ChannelBinding,
  type InboundContact,
} from '@/lib/identity/inbound-provisioning';
import type { MatchCandidate } from '@/lib/identity/match-policy';

const contact: InboundContact = {
  channel: 'WHATSAPP',
  channelAccountId: 'pn-1234',
  externalUserId: '8801712345678',
  phone: '8801712345678',
};

const studentA: MatchCandidate = {
  studentId: 'AE-20260001',
  email: 'a@example.com',
  emailVerified: true,
  phone: '8801712345678',
  phoneVerified: true,
  channelIdentities: [],
};

const studentB: MatchCandidate = {
  studentId: 'AE-20260002',
  email: 'b@example.com',
  emailVerified: true,
  phone: '8801999999999',
  phoneVerified: true,
};

const binding = (overrides: Partial<ChannelBinding> = {}): ChannelBinding => ({
  channel: 'WHATSAPP',
  channelAccountId: 'pn-1234',
  externalUserId: '8801712345678',
  studentId: 'AE-20260001',
  active: true,
  ...overrides,
});

describe('inbound identity provisioning — decision table', () => {
  it('an active channel binding wins over every other signal', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [studentB],
      bindings: [binding({ studentId: 'AE-20260009' })],
    });
    expect(decision).toEqual({ kind: 'LINK_EXISTING', studentId: 'AE-20260009', reason: 'BOUND_CHANNEL' });
  });

  it('replaying the same event yields an identical decision (no second student)', () => {
    const input = { contact, candidates: [studentA], bindings: [binding()] };
    expect(decideInboundIdentity(input)).toEqual(decideInboundIdentity(input));
  });

  it('a binding for a different provider account is not reused', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, channelAccountId: 'pn-OTHER' },
      candidates: [],
      bindings: [binding()],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('CREATE_STUDENT');
  });

  it('a binding for a different sender on the same account is not reused', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, externalUserId: '8801700000000' },
      candidates: [],
      bindings: [binding()],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('CREATE_STUDENT');
  });

  it('matches an exact supplied Student ID', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, suppliedStudentId: 'AE-20260001' },
      candidates: [studentA],
      policy: DEFAULT_POLICY,
    });
    expect(decision).toEqual({ kind: 'LINK_EXISTING', studentId: 'AE-20260001', reason: 'MATCHED_STUDENT_ID' });
  });

  it('matches a verified email, case-insensitively', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, email: 'A@Example.COM', phone: null },
      candidates: [studentA],
      policy: DEFAULT_POLICY,
    });
    expect(decision).toEqual({ kind: 'LINK_EXISTING', studentId: 'AE-20260001', reason: 'MATCHED_VERIFIED_EMAIL' });
  });

  it('matches a verified phone after Bangladesh local-format normalisation', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, phone: '01712345678', email: null },
      candidates: [studentA],
      policy: DEFAULT_POLICY,
    });
    expect(decision).toEqual({ kind: 'LINK_EXISTING', studentId: 'AE-20260001', reason: 'MATCHED_VERIFIED_PHONE' });
  });

  it('never matches on an unverified phone', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, phone: '8801712345678' },
      candidates: [{ ...studentA, phoneVerified: false }],
      policy: DEFAULT_POLICY,
    });
    expect(decision.kind).toBe('CREATE_LEAD');
  });

  it('never matches on a name (no name field is even consulted)', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, phone: null, email: null },
      candidates: [{ studentId: 'AE-20260001' }],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('CREATE_STUDENT');
  });

  it('routes two candidates at the same tier to review', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, phone: null, email: 'shared@example.com' },
      candidates: [
        { studentId: 'AE-20260001', email: 'shared@example.com', emailVerified: true },
        { studentId: 'AE-20260002', email: 'shared@example.com', emailVerified: true },
      ],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('REVIEW');
    if (decision.kind === 'REVIEW') {
      expect(decision.reason).toBe('AMBIGUOUS_MATCH');
      expect(decision.candidateStudentIds.sort()).toEqual(['AE-20260001', 'AE-20260002']);
    }
  });

  it('does not auto-resolve ambiguity even when auto-provisioning is on', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [
        { studentId: 'AE-20260001', phone: '8801712345678', phoneVerified: true },
        { studentId: 'AE-20260003', phone: '01712345678', phoneVerified: true },
      ],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('REVIEW');
  });

  it('flags a channel identity actively bound to two students', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [studentA],
      bindings: [binding({ studentId: 'AE-20260001' }), binding({ studentId: 'AE-20260002' })],
    });
    expect(decision.kind).toBe('REVIEW');
    if (decision.kind === 'REVIEW') expect(decision.reason).toBe('CONFLICTING_BINDING');
  });

  it('refuses to recreate a student whose channel was explicitly unlinked', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [],
      bindings: [binding({ studentId: 'AE-20260001', active: false })],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('REVIEW');
    if (decision.kind === 'REVIEW') {
      expect(decision.reason).toBe('CONFLICTING_BINDING');
      expect(decision.candidateStudentIds).toEqual(['AE-20260001']);
    }
  });

  it('stops on a supplied Student ID that matches nothing and does not fall through to email', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, suppliedStudentId: 'AE-20990001', email: 'a@example.com' },
      candidates: [studentA],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('REVIEW');
    if (decision.kind === 'REVIEW') expect(decision.reason).toBe('SUPPLIED_ID_UNKNOWN');
  });

  it('files a clearly new contact as a lead when student provisioning is disabled', () => {
    const decision = decideInboundIdentity({ contact, candidates: [], policy: DEFAULT_POLICY });
    expect(decision).toEqual(
      expect.objectContaining({ kind: 'CREATE_LEAD', reason: 'NEW_CONTACT_STUDENT_BLOCKED' }),
    );
  });

  it('creates a student for a clearly new contact when policy permits it', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision).toEqual(expect.objectContaining({ kind: 'CREATE_STUDENT', reason: 'NEW_CONTACT_STUDENT_ALLOWED' }));
  });

  it('refuses to create anything when the event carries no sender identity', () => {
    const decision = decideInboundIdentity({
      contact: { channel: 'WEB_CHAT', channelAccountId: 'site', externalUserId: '', phone: null, email: null },
      candidates: [],
      policy: { ...DEFAULT_POLICY, autoCreateStudent: true },
    });
    expect(decision.kind).toBe('REVIEW');
  });

  it('sends everything to review when both auto-create switches are off', () => {
    const decision = decideInboundIdentity({
      contact,
      candidates: [],
      policy: { autoCreateStudent: false, autoCreateLead: false, requireVerifiedContactForLink: false },
    });
    expect(decision.kind).toBe('REVIEW');
  });

  it('requireVerifiedContactForLink does not weaken verified email or phone tiers', () => {
    const policy = { ...DEFAULT_POLICY, requireVerifiedContactForLink: true };
    expect(decideInboundIdentity({ contact, candidates: [studentA], policy }).kind).toBe('LINK_EXISTING');
    expect(decideInboundIdentity({
      contact: { ...contact, email: 'a@example.com', phone: null },
      candidates: [studentA],
      policy,
    }).kind).toBe('LINK_EXISTING');
  });

  it('requireVerifiedContactForLink defers a channel-identity-only match to review', () => {
    const decision = decideInboundIdentity({
      contact: { ...contact, phone: null, email: null },
      candidates: [{ studentId: 'AE-20260001', channelIdentities: [] }],
      policy: { ...DEFAULT_POLICY, requireVerifiedContactForLink: true },
    });
    expect(decision.kind).toBe('CREATE_LEAD');
  });

  it('produces an audit-safe description without message content', () => {
    const description = describeDecision({ kind: 'LINK_EXISTING', studentId: 'AE-20260001', reason: 'BOUND_CHANNEL' });
    expect(description).toBe('LINK_EXISTING AE-20260001 (BOUND_CHANNEL)');
  });
});
