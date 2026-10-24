import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/access-control/central-security-engine', () => ({
  validateRequestAccess: vi.fn(),
  canViewField: vi.fn(),
}));

import { canPerformAction } from '@/lib/employee-access-engine';

describe('employee designation defaults follow least privilege', () => {
  it.each(['Chairman', 'CEO', 'Director'])(
    '%s designation alone does not grant Super Admin or unrestricted capabilities',
    (designation) => {
      expect(canPerformAction(designation, 'RBAC', 'MANAGE')).toBe(false);
      expect(canPerformAction(designation, 'PAYROLL', 'APPROVE')).toBe(false);
      expect(canPerformAction(designation, 'STUDENT', 'DELETE')).toBe(false);
    },
  );

  it('keeps Viewer read-only and Counselor unable to delete official documents', () => {
    expect(canPerformAction('Viewer', 'STUDENT', 'VIEW')).toBe(true);
    expect(canPerformAction('Viewer', 'STUDENT', 'EDIT')).toBe(false);
    expect(canPerformAction('Counselor', 'DOCUMENT', 'DELETE')).toBe(false);
  });
});
