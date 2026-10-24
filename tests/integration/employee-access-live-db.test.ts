import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { testDatabaseUrl } from '../helpers/test-database';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
import { GET as salary } from '@/app/api/employee/salary/route';
import { GET as appointments } from '@/app/api/employee/appointments/route';
import { authenticateRequest } from '@/lib/auth-middleware';
const suite = url ? describe : describe.skip;
const suffix = Date.now().toString(36);
const staff = `employee-live-${suffix}`;
const other = `employee-other-${suffix}`;
const sessionToken = `isolated-employee-session-${suffix}`;
let employeeId = '';
let approvedId = '';
let draftId = '';
let ownStudentId = '';
let otherStudentId = '';
function req(path: string) {
  return new NextRequest(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${path}`, { headers: { cookie: `alo_portal_session=${sessionToken}` } });
}
suite('real MySQL employee session, salary and appointment boundaries', () => {
  beforeAll(async () => {
    for (const id of [staff, other]) await prisma.portalUser.create({ data: { id, email: `${id}@isolated.test`, name: id, userType: 'EMPLOYEE', status: 'active', emailVerified: true } });
    const employee = await prisma.employee.create({ data: { userId: staff, employeeId: staff, status: 'active' } }); employeeId = employee.id;
    await prisma.portalSession.create({ data: { userId: staff, token: sessionToken, expiresAt: new Date(Date.now() + 3600000) } });
    for (const [period, status] of [['2026-01', 'approved'], ['2026-02', 'draft']]) {
      const payroll = await prisma.employeePayroll.create({ data: { employeeId, period, monthYear: period, grossSalary: 1000, netSalary: 900, status } });
      if (status === 'approved') approvedId = payroll.id; else draftId = payroll.id;
    }
    const own = await prisma.student.create({ data: { studentId: `${staff}-student`, counselorId: employeeId } }); ownStudentId = own.id;
    const foreign = await prisma.student.create({ data: { studentId: `${other}-student`, counselorId: other } }); otherStudentId = foreign.id;
    for (const studentId of [ownStudentId, otherStudentId]) await prisma.appointment.create({ data: { studentId, title: 'Isolated acceptance appointment', scheduledAt: new Date() } });
    await prisma.featureAccessRule.create({ data: { ownerType: 'EMPLOYEE', ownerId: employeeId, featureKey: 'employee.appointments.view', isEnabled: true } });
  });
  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { studentId: { in: [ownStudentId, otherStudentId] } } });
    await prisma.student.deleteMany({ where: { id: { in: [ownStudentId, otherStudentId] } } });
    if (employeeId) {
      await prisma.employeePayroll.deleteMany({ where: { employeeId } });
      await prisma.featureAccessRule.deleteMany({ where: { ownerId: employeeId } });
    }
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: staff } });
    await prisma.portalSession.deleteMany({ where: { userId: staff } });
    await prisma.employee.deleteMany({ where: { userId: staff } });
    await prisma.portalUser.deleteMany({ where: { id: { in: [staff, other] } } });
    await prisma.$disconnect();
  });
  it('resolves an actual database-backed employee cookie', async () => {
    expect(await authenticateRequest(req('/api/employee/salary'))).toMatchObject({ userId: staff, identityDomain: 'portal' });
  });
  it('returns only final approved own payroll and persists salary access audit', async () => {
    const response = await salary(req('/api/employee/salary'));
    expect(response.status).toBe(200);
    const body = await response.json(); expect(body.payslips.map(p => p.id)).toEqual([approvedId]);
    expect(await prisma.portalAuditLog.count({ where: { actorUserId: staff, action: 'SALARY_VIEWED' } })).toBeGreaterThan(0);
  });
  it('rejects an actual draft payroll download', async () => {
    expect((await salary(req(`/api/employee/salary?download=${draftId}`))).status).toBe(404);
  });
  it('filters actual appointment rows through assignment and explicit permission', async () => {
    const response = await appointments(req('/api/employee/appointments')); expect(response.status).toBe(200);
    const body = await response.json(); expect(body.appointments.map(a => a.studentId)).toEqual([ownStudentId]);
  });
  it('revoking the actual employee record blocks an existing session immediately', async () => {
    await prisma.employee.update({ where: { id: employeeId }, data: { status: 'suspended' } });
    try { expect((await salary(req('/api/employee/salary'))).status).toBe(403); }
    finally { await prisma.employee.update({ where: { id: employeeId }, data: { status: 'active' } }); }
  });
});
