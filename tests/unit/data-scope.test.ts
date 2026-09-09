// Unit tests for the DataScope helper.
// Verifies that scope determination and filter building work correctly.

import { describe, it, expect } from 'vitest';
import { getScopeForAuth, buildScopeFilter, canAccessRecord, type DataScope } from '@/lib/data-scope';

describe('getScopeForAuth', () => {
  it('returns ALL for super_admin', () => {
    expect(getScopeForAuth({ roles: ['super_admin'] })).toBe('ALL');
  });

  it('returns ALL for admin', () => {
    expect(getScopeForAuth({ roles: ['admin'] })).toBe('ALL');
  });

  it('returns BRANCH for branch_manager', () => {
    expect(getScopeForAuth({ roles: ['branch_manager'] })).toBe('BRANCH');
  });

  it('returns ASSIGNED for counselor', () => {
    expect(getScopeForAuth({ roles: ['counselor'] })).toBe('ASSIGNED');
  });

  it('returns the most permissive scope across multiple roles', () => {
    expect(getScopeForAuth({ roles: ['counselor', 'branch_manager'] })).toBe('BRANCH');
    expect(getScopeForAuth({ roles: ['counselor', 'super_admin'] })).toBe('ALL');
  });

  it('returns NONE for unknown roles', () => {
    expect(getScopeForAuth({ roles: ['unknown_role'] })).toBe('NONE');
  });

  it('returns NONE for empty roles', () => {
    expect(getScopeForAuth({ roles: [] })).toBe('NONE');
  });
});

describe('buildScopeFilter', () => {
  const auth = { userId: 'user-123', roles: ['counselor'] };

  it('returns empty filter for ALL scope', () => {
    const filter = buildScopeFilter('ALL', auth);
    expect(filter).toEqual({});
  });

  it('returns OR clause for ASSIGNED scope', () => {
    const filter = buildScopeFilter('ASSIGNED', auth, { assignedField: 'assignedCounselorId' });
    expect(filter).toEqual({ assignedCounselorId: 'user-123' });
  });

  it('returns branch filter for BRANCH scope', () => {
    const filter = buildScopeFilter('BRANCH', { ...auth, branch: 'dhaka' }, { branchField: 'branch' });
    expect(filter).toEqual({ branch: 'dhaka' });
  });

  it('falls back to assigned when branch is missing', () => {
    const filter = buildScopeFilter('BRANCH', auth, { assignedField: 'assignedToId' });
    expect(filter).toEqual({ assignedToId: 'user-123' });
  });

  it('returns impossible filter for NONE scope', () => {
    const filter = buildScopeFilter('NONE', auth);
    expect(filter).toEqual({ id: '__NONE__' });
  });
});

describe('canAccessRecord', () => {
  const auth = { userId: 'user-123', roles: ['counselor'] };

  it('allows ALL scope to access any record', () => {
    expect(canAccessRecord({ ...auth, roles: ['super_admin'] }, {})).toBe(true);
  });

  it('denies NONE scope', () => {
    expect(canAccessRecord({ ...auth, roles: ['unknown'] }, { assignedToId: 'user-123' })).toBe(false);
  });

  it('allows ASSIGNED scope when record is assigned to user', () => {
    expect(canAccessRecord(auth, { assignedToId: 'user-123' })).toBe(true);
  });

  it('denies ASSIGNED scope when record is assigned to someone else', () => {
    expect(canAccessRecord(auth, { assignedToId: 'other-user' })).toBe(false);
  });

  it('allows BRANCH scope when branches match', () => {
    expect(canAccessRecord({ ...auth, roles: ['branch_manager'], branch: 'dhaka' }, { branch: 'dhaka' })).toBe(true);
  });

  it('denies BRANCH scope when branches differ', () => {
    expect(canAccessRecord({ ...auth, roles: ['branch_manager'], branch: 'dhaka' }, { branch: 'chittagong' })).toBe(false);
  });
});
