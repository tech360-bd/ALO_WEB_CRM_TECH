import { describe, expect, it } from 'vitest';
import {
  isPlausiblePhone,
  normalizeEmail,
  phoneVariants,
  resolveContactIdentity,
  shouldAutoCreateLead,
  shouldAutoCreateStudent,
} from '@/lib/communications/contact-identity';

describe('shared contact identity resolution', () => {
  it('normalizes local and international Bangladesh numbers to overlapping exact variants', () => {
    const local = phoneVariants('01805020100');
    const international = phoneVariants('+8801805020100');
    expect(local).toContain('8801805020100');
    expect(international).toContain('8801805020100');
    expect(local.some((value) => international.includes(value))).toBe(true);
  });

  it('accepts plausible phones but rejects short and overlong values', () => {
    expect(isPlausiblePhone('01805020100')).toBe(true);
    expect(isPlausiblePhone('0')).toBe(false);
    expect(isPlausiblePhone('123456789012345678')).toBe(false);
  });

  it('matches a single exact student but does not create a Student automatically', () => {
    const result = resolveContactIdentity({ phone: '+8801805020100' }, [
      { kind: 'student', id: 'student-1', reference: 'AE-2026-00001', name: 'Asha Rahman', phone: '01805020100' },
    ]);
    expect(result.confidence).toBe('exact');
    expect(result.candidate?.id).toBe('student-1');
    expect(result.actions).toContain('open_existing');
    expect(shouldAutoCreateLead(result)).toBe(false);
    expect(shouldAutoCreateStudent()).toBe(false);
  });

  it('marks competing exact candidates as requiring authorized human review', () => {
    const result = resolveContactIdentity({ phone: '01805020100' }, [
      { kind: 'student', id: 'student-1', phone: '01805020100' },
      { kind: 'lead', id: 'lead-1', phone: '8801805020100' },
    ]);
    expect(result.confidence).toBe('exact');
    expect(result.candidates).toHaveLength(2);
    expect(result.requiresAuthorizedRole).toBe(true);
    expect(result.actions).toContain('merge_request');
    expect(result.actions).toContain('create_new');
  });

  it('treats email-only matches as possible and never silently merges', () => {
    const result = resolveContactIdentity({ email: '  Asha@Example.com ' }, [
      { kind: 'lead', id: 'lead-1', email: 'asha@example.com' },
    ]);
    expect(normalizeEmail('  Asha@Example.com ')).toBe('asha@example.com');
    expect(result.confidence).toBe('possible');
    expect(result.actions).toContain('merge_request');
    expect(result.requiresAuthorizedRole).toBe(true);
  });

  it('returns no match when there is no exact identifier overlap', () => {
    const result = resolveContactIdentity({ phone: '01805020100' }, [
      { kind: 'student', id: 'student-2', phone: '01805020101' },
    ]);
    expect(result.confidence).toBe('none');
    expect(result.candidate).toBeNull();
    expect(shouldAutoCreateLead(result)).toBe(true);
    expect(shouldAutoCreateStudent()).toBe(false);
  });
});
