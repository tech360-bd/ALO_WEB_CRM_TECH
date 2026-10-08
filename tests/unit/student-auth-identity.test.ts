import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn() },
    student: { findFirst: vi.fn(), update: vi.fn() },
    loginAttempt: { count: vi.fn(), create: vi.fn() },
  },
  bcrypt: { hash: vi.fn(), compare: vi.fn() },
  encode: vi.fn(),
  createStudentSession: vi.fn(),
  consumeEmailOtp: vi.fn(),
  issueEmailOtp: vi.fn(),
  getRequestIp: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('bcryptjs', () => ({ default: mocks.bcrypt }));
vi.mock('next-auth/jwt', () => ({ encode: mocks.encode }));
vi.mock('@/lib/student-auth', () => ({ createStudentSession: mocks.createStudentSession }));
vi.mock('@/lib/auth/email-otp', () => ({
  consumeEmailOtp: mocks.consumeEmailOtp,
  issueEmailOtp: mocks.issueEmailOtp,
  getRequestIp: mocks.getRequestIp,
}));

import { registerStudentAtomically } from '@/lib/student/canonical-student';
import { POST as studentLogin } from '@/app/api/student/auth/login/route';
import { POST as requestStudentOtp } from '@/app/api/student/auth/otp/route';

const student = {
  id: 'student-db-id',
  studentId: 'ALO-S-12345',
  userId: 'user-id',
  name: 'Existing Student',
  email: 'student@example.com',
  phone: '+8801700000000',
  password: '',
  status: 'active',
  suspended: false,
  profileComplete: 80,
  journeyStage: 'application',
};

function post(body: unknown) {
  return new Request('https://alo.example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'unit-test' },
    body: JSON.stringify(body),
  });
}

describe('student identity and credential compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret-with-at-least-32-characters';
    mocks.db.loginAttempt.count.mockResolvedValue(0);
    mocks.db.loginAttempt.create.mockResolvedValue({});
    mocks.db.student.findFirst.mockResolvedValue(student);
    mocks.db.student.update.mockResolvedValue({});
    mocks.db.user.findUnique.mockResolvedValue({
      email: student.email,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      passwordHash: 'canonical-user-hash',
    });
    mocks.bcrypt.compare.mockResolvedValue(true);
    mocks.bcrypt.hash.mockResolvedValue('hashed-password');
    mocks.encode.mockResolvedValue('page-session-cookie');
    mocks.createStudentSession.mockResolvedValue('opaque-student-session');
    mocks.getRequestIp.mockReturnValue('203.0.113.10');
    mocks.issueEmailOtp.mockResolvedValue({ ok: true, expiresAt: new Date('2026-10-08T12:10:00.000Z') });
  });

  it('links a legacy Student row without deleting its business identity or history', async () => {
    const legacyStudent = { ...student, userId: null, leadId: 'existing-lead' };
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'new-user-id' }),
      },
      student: {
        findFirst: vi.fn().mockResolvedValue(legacyStudent),
        update: vi.fn().mockResolvedValue({ id: legacyStudent.id, studentId: legacyStudent.studentId }),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };
    mocks.db.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

    const result = await registerStudentAtomically({
      name: 'Claimed Name',
      email: 'student@example.com',
      password: 'StrongPass1',
      pendingVerification: true,
    });

    expect(result).toMatchObject({
      success: true,
      userId: 'new-user-id',
      studentId: legacyStudent.studentId,
      studentDbId: legacyStudent.id,
    });
    expect(tx.student.update).toHaveBeenCalledWith({
      where: { id: legacyStudent.id },
      data: { userId: 'new-user-id', status: 'pending_verification' },
      select: { id: true, studentId: true },
    });
    expect(tx.student.create).not.toHaveBeenCalled();
    expect(tx.student.delete).not.toHaveBeenCalled();
  });

  it('requires supplied email and phone to identify the same student in password login', async () => {
    const response = await studentLogin(post({
      email: 'student@example.com',
      phone: '+8801700000000',
      password: 'StrongPass1',
      loginMethod: 'password',
    }));

    expect(response.status).toBe(200);
    expect(mocks.db.student.findFirst).toHaveBeenCalledWith({
      where: { email: 'student@example.com', phone: '+8801700000000' },
    });
    expect(mocks.bcrypt.compare).toHaveBeenCalledWith('StrongPass1', 'canonical-user-hash');
  });

  it('does not turn a missing email or phone filter into a match-all OTP lookup', async () => {
    const response = await requestStudentOtp(post({ email: 'student@example.com' }));

    expect(response.status).toBe(200);
    expect(mocks.db.student.findFirst).toHaveBeenCalledWith({ where: { email: 'student@example.com' } });
    expect(mocks.issueEmailOtp).toHaveBeenCalledWith({
      userId: 'student-db-id',
      email: 'student@example.com',
      purpose: 'account_activation',
      ipAddress: '203.0.113.10',
    });
  });
});
