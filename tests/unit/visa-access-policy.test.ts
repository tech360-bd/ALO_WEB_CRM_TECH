import { describe, expect, it } from 'vitest';
import { canManageVisaPermission, canViewVisaSensitive, visaCaseViewScope } from '@/lib/visa/access';
import type { AuthContext } from '@/lib/auth-middleware';

const visaCase = {
  id: 'case-1',
  studentId: 'student-1',
  visaOfficerId: 'officer-1',
  counselorId: 'counselor-1',
  applicationOfficerId: 'application-1',
};

function auth(userId: string, roles: string[], permissions: string[]): AuthContext {
  return {
    userId,
    actorUserId: userId,
    userType: roles[0] || 'EMPLOYEE',
    roles,
    permissions,
  } as AuthContext;
}

describe('Visa case permission policy', () => {
  it('allows an assigned Visa Officer only when both case scope and the action permission are present', () => {
    const assigned = auth('officer-1', ['VISA_OFFICER'], ['visa.cases.view', 'visa.interviews.view', 'visa.interviews.update']);
    expect(visaCaseViewScope(assigned, visaCase)).toBe('full');
    expect(canManageVisaPermission(assigned, 'visa.interviews.update', visaCase)).toBe(true);
    expect(canManageVisaPermission(assigned, 'visa.interviews.finish', visaCase)).toBe(false);
  });

  it('denies unassigned Visa Officers even when they have the requested action permission', () => {
    const unassigned = auth('officer-2', ['VISA_OFFICER'], ['visa.cases.view', 'visa.interviews.view', 'visa.interviews.update']);
    expect(visaCaseViewScope(unassigned, visaCase)).toBeNull();
    expect(canManageVisaPermission(unassigned, 'visa.interviews.update', visaCase)).toBe(false);
  });

  it('requires view-all permission for Admin case access', () => {
    const admin = auth('admin-1', ['ADMIN'], ['visa.cases.view_all', 'visa.risk.update']);
    const limitedAdmin = auth('admin-2', ['ADMIN'], ['visa.risk.update']);
    expect(canManageVisaPermission(admin, 'visa.risk.update', visaCase)).toBe(true);
    expect(canManageVisaPermission(limitedAdmin, 'visa.risk.update', visaCase)).toBe(false);
  });

  it('does not grant internal Visa workflow access to counselor, partner, student, or marketing roles', () => {
    for (const role of ['COUNSELOR', 'PARTNER', 'STUDENT', 'MARKETING']) {
      const actor = auth(`${role.toLowerCase()}-1`, [role], ['visa.risk.view', 'visa.interviews.view']);
      expect(canManageVisaPermission(actor, 'visa.risk.view', visaCase)).toBe(false);
    }
  });

  it('requires explicit sensitive-view permission for an assigned Visa Officer', () => {
    const ordinary = auth('officer-1', ['VISA_OFFICER'], ['visa.cases.view', 'visa.risk.view']);
    const sensitive = auth('officer-1', ['VISA_OFFICER'], ['visa.cases.view', 'visa.sensitive.view']);
    expect(canViewVisaSensitive(ordinary, visaCase)).toBe(false);
    expect(canViewVisaSensitive(sensitive, visaCase)).toBe(true);
  });

  it('grants SUPER_ADMIN the explicit override and does not expose partner scope', () => {
    const superAdmin = auth('root-1', ['SUPER_ADMIN'], []);
    const partner = auth('partner-1', ['PARTNER'], ['visa.cases.view_all', 'visa.risk.view']);
    expect(visaCaseViewScope(superAdmin, visaCase)).toBe('full');
    expect(canViewVisaSensitive(superAdmin, visaCase)).toBe(true);
    expect(visaCaseViewScope(partner, visaCase)).toBeNull();
  });
});
