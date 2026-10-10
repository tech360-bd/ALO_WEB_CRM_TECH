import { describe, expect, it } from 'vitest';
import { matchInboundIdentity, normalizeEmail, normalizePhoneDigits, type MatchCandidate } from '@/lib/identity/match-policy';

const alice: MatchCandidate = {
  studentId: 'AE-202600001',
  email: 'Alice@Example.com',
  emailVerified: true,
  phone: '01712345678',
  phoneVerified: true,
  channelIdentities: ['wa:8801712345678'],
};
const bob: MatchCandidate = {
  studentId: 'AE-202600002',
  email: 'bob@example.com',
  emailVerified: false, // unverified contact must never match
  phone: '01811111111',
  phoneVerified: false,
};

describe('normalisation', () => {
  it('normalises email case and whitespace; rejects malformed addresses', () => {
    expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });

  it('normalises Bangladeshi and international phone numbers to digits', () => {
    expect(normalizePhoneDigits('01712345678')).toBe('8801712345678');
    expect(normalizePhoneDigits('+880 1712-345678')).toBe('8801712345678');
    expect(normalizePhoneDigits('12')).toBeNull();
  });
});

describe('matchInboundIdentity', () => {
  it('matches an exact canonical Student ID', () => {
    expect(matchInboundIdentity({ studentId: 'ae-202600001' }, [alice, bob])).toEqual({
      kind: 'exact_student_id',
      studentId: 'AE-202600001',
    });
  });

  it('reports a typed ID that matches nothing as none instead of falling through to weaker tiers', () => {
    expect(matchInboundIdentity({ studentId: 'AE-202699999', email: 'alice@example.com' }, [alice])).toEqual({ kind: 'none' });
  });

  it('matches a verified email case-insensitively', () => {
    expect(matchInboundIdentity({ email: 'ALICE@example.com' }, [alice, bob])).toEqual({
      kind: 'verified_email',
      studentId: 'AE-202600001',
    });
  });

  it('does not match an unverified email', () => {
    expect(matchInboundIdentity({ email: 'bob@example.com' }, [bob])).toEqual({ kind: 'none' });
  });

  it('matches a verified phone across formats', () => {
    expect(matchInboundIdentity({ phone: '+8801712345678' }, [alice])).toEqual({
      kind: 'verified_phone',
      studentId: 'AE-202600001',
    });
  });

  it('matches a linked channel identity', () => {
    expect(matchInboundIdentity({ channelIdentity: 'wa:8801712345678' }, [alice])).toEqual({
      kind: 'linked_channel',
      studentId: 'AE-202600001',
    });
  });

  it('queues an ambiguous match for review when two candidates share a verified email', () => {
    const duplicate: MatchCandidate = { studentId: 'AE-202600009', email: 'alice@example.com', emailVerified: true };
    expect(matchInboundIdentity({ email: 'alice@example.com' }, [alice, duplicate])).toEqual({
      kind: 'ambiguous',
      tier: 'verified_email',
      studentIds: ['AE-202600001', 'AE-202600009'],
    });
  });

  it('never matches on name alone (no name is accepted as an input at all)', () => {
    const result = matchInboundIdentity({ email: null, phone: null, channelIdentity: null }, [alice]);
    expect(result).toEqual({ kind: 'none' });
  });

  it('uses precedence: a verified email wins over a conflicting linked channel', () => {
    const other: MatchCandidate = { studentId: 'AE-202600005', channelIdentities: ['wa:8801999999999'] };
    expect(matchInboundIdentity({ email: 'alice@example.com', channelIdentity: 'wa:8801999999999' }, [alice, other])).toEqual({
      kind: 'verified_email',
      studentId: 'AE-202600001',
    });
  });

  it('returns none for an empty candidate set', () => {
    expect(matchInboundIdentity({ email: 'alice@example.com' }, [])).toEqual({ kind: 'none' });
  });
});
