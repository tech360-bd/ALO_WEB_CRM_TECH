import { beforeEach, describe, expect, it, vi } from 'vitest';
const { db, sendActivationEmail, sendPasswordResetEmail } = vi.hoisted(() => ({
  db: { portalAuditLog: { create: vi.fn() }, portalUser: { findUnique: vi.fn(), update: vi.fn() }, otpCode: { count: vi.fn(), create: vi.fn() }, passwordResetToken: { create: vi.fn(), count: vi.fn(), updateMany: vi.fn() }, employeeActivationToken: { updateMany: vi.fn(), create: vi.fn() }, $transaction: vi.fn() },
  sendActivationEmail: vi.fn(), sendPasswordResetEmail: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db }));
// These tests isolate response semantics, not authorization (covered separately).
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (req: Request, auth: { name: string }) => Promise<Response>) => (req: Request) => handler(req, { name: 'Test operator' }), logAuditAction: vi.fn() }));
vi.mock('@/lib/email-service', () => ({ sendActivationEmail, sendPasswordResetEmail }));
import { POST as resend } from '@/app/api/admin/employees/resend-activation/route';
import { POST as forgot } from '@/app/api/portal-auth/forgot-password/route';
const request = (body: unknown) => new Request('https://example.com/api', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  db.portalUser.findUnique.mockResolvedValue({
    id: 'employee', userType: 'EMPLOYEE', status: 'pending_activation',
    firstLoginRequired: true, name: 'Employee', email: 'employee@example.com',
    employeeProfile: { employeeId: 'ALO-EMP-TEST-1', designation: 'Counselor' },
  });
  db.$transaction.mockImplementation(async callback => callback(Object.fromEntries(Object.entries(db).filter(([key]) => key !== '$transaction'))));
  db.employeeActivationToken.updateMany.mockResolvedValue({ count: 1 });
  db.employeeActivationToken.create.mockResolvedValue({ id: 'activation' });
  db.otpCode.count.mockResolvedValue(0);
  db.passwordResetToken.count.mockResolvedValue(0);
  db.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
  db.passwordResetToken.create.mockResolvedValue({ id: 'reset' });
});
describe('email consumer responses', () => {
  it('resend reports failure, not delivery, when submission fails', async () => {
    sendActivationEmail.mockResolvedValue({ success: false, error: 'SMTP_SEND_FAILED' });
    const response = await resend(request({ employeeId: 'employee' }));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ success: false, error: 'SMTP_SEND_FAILED' });
  });
  it('does not send or report success when transactional audit fails', async () => {
    db.portalAuditLog.create.mockRejectedValue(new Error('audit unavailable'));
    const response = await resend(request({ employeeId: 'employee' }));
    expect(response.status).toBe(503);
    expect(sendActivationEmail).not.toHaveBeenCalled();
  });
  it('resend reports success only after successful submission', async () => {
    sendActivationEmail.mockResolvedValue({ success: true, messageId: '<transport-id>' });
    expect((await resend(request({ employeeId: 'employee' }))).status).toBe(200);
  });
  it('reset response makes no delivery claim and matches unknown-account response', async () => {
    sendPasswordResetEmail.mockResolvedValue({ success: false, error: 'SMTP_NOT_CONFIGURED' });
    const failure = await (await forgot(request({ email: 'employee@example.com' }))).json();
    db.portalUser.findUnique.mockResolvedValue(null);
    const unknown = await (await forgot(request({ email: 'unknown@example.com' }))).json();
    expect(failure).toEqual(unknown);
    expect(failure.message).not.toMatch(/has been sent/);
    expect(failure).not.toHaveProperty('messageId');
  });
});
