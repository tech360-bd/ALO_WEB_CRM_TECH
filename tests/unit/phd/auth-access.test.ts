import { describe, expect, it } from 'vitest';
import {
  assertProjectAccess,
  canAccessProject,
  canAdminister,
  canAdvise,
  canVerify,
  mapPhdRole,
  type PhdActor,
} from '@/lib/phd/auth';
import { PHD_PERMISSIONS } from '@/lib/phd/constants';

function actor(overrides: Partial<PhdActor> = {}): PhdActor {
  return {
    userId: 'user_applicant',
    email: 'applicant@example.com',
    name: 'Applicant',
    role: 'APPLICANT',
    permissions: [],
    roles: ['student'],
    authentication: 'NEXTAUTH',
    ...overrides,
  };
}

describe('PhD role mapping', () => {
  it('maps administrator roles and permissions', () => {
    expect(mapPhdRole(['admin'], [])).toBe('ADMINISTRATOR');
    expect(mapPhdRole([], [PHD_PERMISSIONS.ADMIN])).toBe('ADMINISTRATOR');
  });

  it('maps verifier roles before adviser roles', () => {
    expect(mapPhdRole(['data_verifier'], [])).toBe('DATA_VERIFIER');
    expect(mapPhdRole(['data_verifier', 'research_adviser'], [])).toBe('DATA_VERIFIER');
    expect(mapPhdRole([], [PHD_PERMISSIONS.VERIFY])).toBe('DATA_VERIFIER');
  });

  it('maps adviser roles', () => {
    expect(mapPhdRole(['research_adviser'], [])).toBe('RESEARCH_ADVISER');
    expect(mapPhdRole([], [PHD_PERMISSIONS.ADVISER])).toBe('RESEARCH_ADVISER');
  });

  it('defaults to applicant for unknown or missing roles (least privilege)', () => {
    expect(mapPhdRole([], [])).toBe('APPLICANT');
    expect(mapPhdRole(['unknown_role'], [])).toBe('APPLICANT');
  });

  it('grants verifier and admin capabilities only to the right roles', () => {
    expect(canVerify(actor({ role: 'DATA_VERIFIER' }))).toBe(true);
    expect(canVerify(actor({ role: 'ADMINISTRATOR' }))).toBe(true);
    expect(canVerify(actor({ role: 'RESEARCH_ADVISER' }))).toBe(false);
    expect(canVerify(actor())).toBe(false);
    expect(canAdminister(actor({ role: 'ADMINISTRATOR' }))).toBe(true);
    expect(canAdminister(actor({ role: 'DATA_VERIFIER' }))).toBe(false);
    expect(canAdvise(actor({ role: 'RESEARCH_ADVISER' }))).toBe(true);
    expect(canAdvise(actor())).toBe(false);
  });
});

describe('Project ownership', () => {
  const project = { userId: 'user_owner', adviserId: 'user_adviser' };

  it('lets the owner read and write', () => {
    const owner = actor({ userId: 'user_owner' });
    expect(canAccessProject(owner, project, 'read')).toBe(true);
    expect(canAccessProject(owner, project, 'write')).toBe(true);
  });

  it('denies another applicant access in both modes', () => {
    const other = actor({ userId: 'user_other' });
    expect(canAccessProject(other, project, 'read')).toBe(false);
    expect(canAccessProject(other, project, 'write')).toBe(false);
  });

  it('gives a research adviser read-only access to assigned projects', () => {
    const adviser = actor({ userId: 'user_adviser', role: 'RESEARCH_ADVISER', roles: ['research_adviser'] });
    expect(canAccessProject(adviser, project, 'read')).toBe(true);
    expect(canAccessProject(adviser, project, 'write')).toBe(false);
  });

  it('does not give an adviser access to an unassigned project', () => {
    const adviser = actor({ userId: 'user_adviser', role: 'RESEARCH_ADVISER' });
    expect(canAccessProject(adviser, { userId: 'user_owner', adviserId: 'someone_else' }, 'read')).toBe(false);
  });

  it('allows an administrator to access any project', () => {
    const admin = actor({ userId: 'user_admin', role: 'ADMINISTRATOR' });
    expect(canAccessProject(admin, { userId: 'someone', adviserId: null }, 'write')).toBe(true);
  });

  it('denies access when the project does not exist', () => {
    expect(() => assertProjectAccess(actor(), null, 'read')).toThrow(/not found/i);
  });
});
