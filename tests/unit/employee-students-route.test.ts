import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), employeeFindUnique: vi.fn(), studentsFindMany: vi.fn(), studentsCount: vi.fn() }));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findUnique: (...args: unknown[]) => mocks.employeeFindUnique(...args) },
    portalStudentProfile: { findMany: (...args: unknown[]) => mocks.studentsFindMany(...args), count: (...args: unknown[]) => mocks.studentsCount(...args) },
  },
}));

import { GET } from '@/app/api/employee/students/route';

const activeEmployee = { id: 'emp-db', userId: 'user-1', employeeId: 'ALO-EMP-1', status: 'active' };
const counselorAuth = { userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], permissions: ['s1'] };
const request = (query = '') => new Request(`https://alo.test/api/employee/students${query}`);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(counselorAuth);
  mocks.employeeFindUnique.mockResolvedValue(activeEmployee);
  mocks.studentsFindMany.mockResolvedValue([{ id: 'profile-1', studentId: 'AE-20260001', fullName: 'Test Student', preferredCountry: 'UK' }]);
  mocks.studentsCount.mockResolvedValue(1);
});

describe('employee assigned-students API', () => {
  it('requires an active employee and assigned-student permission', async () => {
    mocks.employeeFindUnique.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(mocks.studentsFindMany).not.toHaveBeenCalled();

    mocks.employeeFindUnique.mockResolvedValue(activeEmployee);
    mocks.auth.mockReturnValue({ ...counselorAuth, permissions: [] });
    const noPermission = await GET(request());
    expect(noPermission.status).toBe(403);
    expect(mocks.studentsFindMany).not.toHaveBeenCalled();
  });

  it('scopes reads to authenticated employee ID aliases and returns only permitted fields', async () => {
    const response = await GET(request('?search=computer&page=2&limit=999&sortBy=guardianPhone&sortOrder=ASC'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.studentsFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        counselorId: { in: ['emp-db', 'user-1', 'ALO-EMP-1'] },
        OR: [
          { fullName: { contains: 'computer' } },
          { studentId: { contains: 'computer' } },
          { preferredCountry: { contains: 'computer' } },
          { preferredSubject: { contains: 'computer' } },
        ],
      },
      take: 100,
      skip: 100,
      orderBy: { createdAt: 'asc' },
    }));
    expect(body.data[0]).not.toHaveProperty('guardianPhone');
    expect(body.data[0]).not.toHaveProperty('userId');
    expect(body.pagination).toMatchObject({ page: 2, limit: 100, total: 1 });
  });

  it('denies student and partner identities even if they have the permission string', async () => {
    mocks.auth.mockReturnValue({ ...counselorAuth, userType: 'PARTNER' });
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(mocks.employeeFindUnique).not.toHaveBeenCalled();
  });
});
