import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { testDatabaseUrl } from '../helpers/test-database';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
import { GET as salary } from '@/app/api/employee/salary/route';
import { GET as appointments } from '@/app/api/employee/appointments/route';
import { GET as diagramList, POST as diagramSave } from '@/app/api/employee/diagram-drafts/route';
import { POST as packageSave, PATCH as packageAssign } from '@/app/api/employee-access/permission-packages/route';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { authenticateRequest } from '@/lib/auth-middleware';
const suite = url ? describe : describe.skip;
const suffix = Date.now().toString(36);
const staff = `employee-live-${suffix}`;
const other = `employee-other-${suffix}`;
const master = `employee-master-${suffix}`;
const masterToken = `isolated-master-session-${suffix}`;
let packageId = ''; let assignmentId = '';
const sessionToken = `isolated-employee-session-${suffix}`;
let employeeId = '';
let approvedId = '';
let draftId = '';
let ownStudentId = '';
let otherStudentId = '';
function req(path: string, body?: unknown, token = sessionToken, method = 'POST') {
  return new NextRequest(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${path}`, { ...(body ? { method, body: JSON.stringify(body) } : {}), headers: { cookie: `alo_portal_session=${token}`, 'Content-Type': 'application/json' } });
}
suite('real MySQL employee session, salary and appointment boundaries', () => {
  beforeAll(async () => {
    for (const id of [staff, other]) await prisma.portalUser.create({ data: { id, email: `${id}@isolated.test`, name: id, userType: 'EMPLOYEE', status: 'active', emailVerified: true } });
    await prisma.portalUser.create({ data: { id: master, email: `${master}@isolated.test`, name: master, userType: 'SUPER_ADMIN', status: 'active', emailVerified: true } });
    await prisma.portalSession.create({ data: { userId: master, token: masterToken, expiresAt: new Date(Date.now() + 3600000) } });
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
    await prisma.marketingTemplate.deleteMany({ where: { createdById: staff } });
    await prisma.employeePermissionPackageAssignment.deleteMany({ where: { employeeId } });
    if (packageId) await prisma.permissionPackage.deleteMany({ where: { id: packageId } });
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: { in: [staff, master] } } });
    await prisma.portalSession.deleteMany({ where: { userId: { in: [staff, master] } } });
    await prisma.employee.deleteMany({ where: { userId: staff } });
    await prisma.portalUser.deleteMany({ where: { id: { in: [staff, other, master] } } });
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
  it('saves and reloads a real authorized diagram with its audit record', async () => {
    const draft = { title: 'Isolated diagram', type: 'bar', rows: [{ label: 'Verified input', group: '', value: 2, end: 0 }] };
    expect((await diagramSave(req('/api/employee/diagram-drafts', { draft }))).status).toBe(403);
    for (const action of ['create', 'view']) await prisma.featureAccessRule.create({ data: { ownerType: 'EMPLOYEE', ownerId: employeeId, featureKey: `employee.diagrams.${action}`, isEnabled: true } });
    const response = await diagramSave(req('/api/employee/diagram-drafts', { draft })); expect(response.status).toBe(201);
    const saved = (await response.json()).data;
    expect(JSON.parse((await prisma.marketingTemplate.findUniqueOrThrow({ where: { id: saved.id } })).content)).toEqual(draft);
    const listing = await diagramList(req('/api/employee/diagram-drafts')); expect((await listing.json()).drafts.map(item => item.id)).toContain(saved.id);
    expect(await prisma.portalAuditLog.count({ where: { actorUserId: staff, action: 'DIAGRAM_DRAFT_CREATED', entityId: saved.id } })).toBe(1);
  });
  it('creates, assigns and revokes an actual scoped package without deleting history', async () => {
    const permissions = [{ featureKey: 'isolated.records', action: 'view', scopeType: 'ASSIGNED', scopeId: '' }];
    const response = await packageSave(req('/api/employee-access/permission-packages', { name: `Isolated ${suffix}`, permissions, reason: 'Isolated acceptance verification' }, masterToken)); expect(response.status).toBe(201);
    packageId = (await response.json()).data.id;
    const assignment = await packageAssign(req('/api/employee-access/permission-packages', { operation: 'assign', employeeId, packageId, startsAt: new Date(Date.now() - 1000).toISOString(), expiresAt: null, reason: 'Isolated assignment verification' }, masterToken, 'PATCH')); expect(assignment.status).toBe(200);
    assignmentId = (await assignment.json()).data.id;
    expect((await validateRequestAccess({ userId: staff }, 'isolated.records', 'view', { assigneeId: staff })).allowed).toBe(true);
    expect((await validateRequestAccess({ userId: staff }, 'isolated.records', 'view', { assigneeId: other })).allowed).toBe(false);
    expect((await packageAssign(req('/api/employee-access/permission-packages', { operation: 'revoke', assignmentId, reason: 'Isolated revocation verification' }, masterToken, 'PATCH'))).status).toBe(200);
    expect((await validateRequestAccess({ userId: staff }, 'isolated.records', 'view', { assigneeId: staff })).allowed).toBe(false);
    expect((await prisma.employeePermissionPackageAssignment.findUniqueOrThrow({ where: { id: assignmentId } })).status).toBe('revoked');
  });
  it('revoking the actual employee record blocks an existing session immediately', async () => {
    await prisma.employee.update({ where: { id: employeeId }, data: { status: 'suspended' } });
    try { expect((await salary(req('/api/employee/salary'))).status).toBe(403); }
    finally { await prisma.employee.update({ where: { id: employeeId }, data: { status: 'active' } }); }
  });
});
