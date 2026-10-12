/** Mock transaction contract tests. NOT MySQL rollback/concurrency evidence. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ db: { $transaction: vi.fn() }, hash: vi.fn(), allocate: vi.fn(), issue: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('bcryptjs', () => ({ default: { hash: m.hash } }));
vi.mock('@/lib/identity/student-id', () => ({ allocateIdentifier: m.allocate }));
vi.mock('@/lib/auth/email-otp', () => ({ issueEmailOtp: m.issue, getRequestIp: () => '192.0.2.1' }));
import { registerStudentAtomically } from '@/lib/student/canonical-student';
import { POST as portalRegister } from '@/app/api/portal-auth/register/route';
const input = { name: 'Synthetic Student', email: 'synthetic@example.test', phone: '01700000000', password: 'Test-only-password', pendingVerification: true };
let tx: any;
let committed: boolean;
function request(body: unknown) { return new Request('https://alo.example.test/api/portal-auth/register', { method: 'POST', body: JSON.stringify(body) }); }
const portalInput = { name: input.name, email: input.email, password: input.password, phone: input.phone, portalType: 'student' };
beforeEach(() => {
  vi.resetAllMocks(); committed = false;
  tx = {
    user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'user-synthetic' }) },
    portalUser: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'portal-synthetic', status: 'pending_verification' }) },
    student: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: 'student-row', studentId: 'AE-2026000001' }), update: vi.fn() },
    portalStudentProfile: { create: vi.fn().mockResolvedValue({ id: 'portal-profile' }) },
    partnerProfile: { create: vi.fn() },
    lead: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: 'lead-row' }), update: vi.fn() },
    portalAuditLog: { create: vi.fn() }, studentNotification: { create: vi.fn() }, portalNotification: { create: vi.fn() },
  };
  m.hash.mockResolvedValue('synthetic-hash'); m.allocate.mockResolvedValue('AE-202600001'); m.issue.mockResolvedValue({ ok: true });
  m.db.$transaction.mockImplementation(async cb => { const value = await cb(tx); committed = true; return value; });
});
describe('canonical registration acquisition contract', () => {
  it('creates pending account, Student, NEW Lead, identity audit, link and notification in one transaction', async () => {
    expect(await registerStudentAtomically(input)).toMatchObject({ success: true, studentDbId: 'student-row' });
    expect(committed).toBe(true);
    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', emailVerified: false }) }));
    expect(tx.lead.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: 'AE-2026000001', source: 'USER_STUDENT_REGISTRATION', status: 'NEW', welcomeSent: false }) });
    expect(tx.student.update).toHaveBeenCalledWith({ where: { id: 'student-row' }, data: { leadId: 'lead-row', counselorId: null, journeyStage: 'lead_created' } });
    expect(tx.studentNotification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: 'student-row' }) });
    expect(tx.lead.update).not.toHaveBeenCalled(); expect(m.issue).not.toHaveBeenCalled();
  });
  it('does not claim an email-matched legacy Student through public registration', async () => {
    tx.student.findFirst.mockResolvedValue({ id: 'victim-student', userId: null });
    expect(await registerStudentAtomically(input)).toMatchObject({ success: false, errorCode: 'STUDENT_EXISTS_DIFFERENT_OWNER' });
    expect(committed).toBe(false); expect(tx.user.create).not.toHaveBeenCalled(); expect(tx.student.update).not.toHaveBeenCalled();
  });
  it('contact overlap is an internal review hint, not automatic merging or ownership', async () => {
    tx.lead.findMany.mockResolvedValue([{ id: 'victim-lead' }]);
    expect(await registerStudentAtomically(input)).toMatchObject({ success: true });
    expect(tx.lead.update).not.toHaveBeenCalled();
    expect(JSON.parse(tx.portalAuditLog.create.mock.calls[0][0].data.metadata)).toMatchObject({ duplicateReviewRequired: true, identityDomain: 'user' });
    expect(tx.student.update.mock.calls[0][0].data.leadId).toBe('lead-row');
  });
  it.each(['lead', 'portalAuditLog', 'studentNotification'])('propagates %s failure out of transaction instead of returning account success', async delegate => {
    tx[delegate].create.mockRejectedValue(new Error('synthetic write failure'));
    expect(await registerStudentAtomically(input)).toMatchObject({ success: false }); expect(committed).toBe(false);
  });
});
describe('portal registration route contract', () => {
  it('creates allocated pending identity/profile/Lead/notification without crossing counselor namespaces', async () => {
    const res = await portalRegister(request({ ...portalInput, email: ' SYNTHETIC@EXAMPLE.TEST ' }));
    expect(res.status).toBe(201); expect(await res.json()).toMatchObject({ requireVerification: true, counselorAssigned: false, portalCounselorMapped: false });
    expect(m.allocate).toHaveBeenCalledWith(tx, 'AE');
    expect(tx.portalStudentProfile.create.mock.calls[0][0].data).not.toHaveProperty('counselorId');
    expect(tx.lead.create.mock.calls[0][0].data.source).toBe('PORTAL_STUDENT_REGISTRATION');
    expect(m.issue).toHaveBeenCalledWith(expect.objectContaining({ userId: 'portal-synthetic', email: input.email }));
  });
  it.each(['user','portalUser'])('rejects an existing %s identity', async delegate => {
    tx[delegate].findUnique.mockResolvedValue({ id: 'existing' });
    expect((await portalRegister(request(portalInput))).status).toBe(409); expect(tx.portalUser.create).not.toHaveBeenCalled();
  });
  it.each(['portalStudentProfile','lead','portalNotification'])('does not commit or send OTP if %s write fails', async delegate => {
    tx[delegate].create.mockRejectedValue(new Error('synthetic write failure'));
    expect((await portalRegister(request(portalInput))).status).toBe(503); expect(committed).toBe(false); expect(m.issue).not.toHaveBeenCalled();
  });
  it.each(['return','throw'])('accurately reports postcommit OTP %s failure', async mode => {
    if (mode === 'throw') m.issue.mockRejectedValue(new Error('synthetic transport failure'));
    else m.issue.mockResolvedValue({ ok: false, reason: 'delivery_failed' });
    const res = await portalRegister(request(portalInput)); expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ accountCreated: true }); expect(committed).toBe(true);
  });
  it('partner remains pending approval and creates no student Lead', async () => {
    const res = await portalRegister(request({ ...portalInput, portalType: 'partner' }));
    expect(res.status).toBe(201); expect(tx.portalUser.create.mock.calls[0][0].data.status).toBe('pending');
    expect(m.allocate).toHaveBeenCalledWith(tx, 'AEP'); expect(tx.partnerProfile.create).toHaveBeenCalled(); expect(tx.lead.create).not.toHaveBeenCalled();
  });
  it.each([{ ...portalInput, role: 'ADMIN' }, { ...portalInput, password: 'short' }, { ...portalInput, email: 'invalid' }])('rejects invalid/privileged input without writes', async payload => {
    expect((await portalRegister(request(payload))).status).toBe(400); expect(m.db.$transaction).not.toHaveBeenCalled();
  });
});
