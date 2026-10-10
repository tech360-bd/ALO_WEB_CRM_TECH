import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const { sendMail, close, createTransport } = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock('smtp-mailer', () => ({ default: { createTransport } }));
import { sendEmail } from '@/lib/email-service';
const mail = { to: 'recipient@example.com', subject: 'Test', html: '<p>Test</p>' };
describe('honest SMTP submission', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const [name, value] of Object.entries({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'sender', SMTP_PASSWORD: 'test-only', SMTP_FROM: 'sender@example.com', SMTP_PORT: '587' })) vi.stubEnv(name, value);
    createTransport.mockReturnValue({ sendMail, close });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('returns only the transport ID after acceptance', async () => {
    sendMail.mockResolvedValue({ accepted: [mail.to], rejected: [], messageId: '<transport-id>' });
    expect(await sendEmail(mail)).toEqual({ success: true, messageId: '<transport-id>' });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining(mail));
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ requireTLS: true, disableFileAccess: true, disableUrlAccess: true }));
    expect(close).toHaveBeenCalled();
  });
  it('fails without credentials and never attempts a send', async () => {
    vi.stubEnv('SMTP_PASSWORD', '');
    expect(await sendEmail(mail)).toEqual({ success: false, error: 'SMTP_NOT_CONFIGURED' });
    expect(sendMail).not.toHaveBeenCalled();
  });
  it('returns explicit failure on provider exception without leaking details', async () => {
    sendMail.mockRejectedValue(new Error('sensitive provider detail'));
    expect(await sendEmail(mail)).toEqual({ success: false, error: 'SMTP_SEND_FAILED' });
    expect(close).toHaveBeenCalled();
  });
  it.each([
    { accepted: [], rejected: [mail.to], messageId: '<id>' },
    { accepted: [mail.to], rejected: [] },
  ])('does not fabricate success or an ID for %o', async result => {
    sendMail.mockResolvedValue(result);
    expect(await sendEmail(mail)).toEqual({ success: false, error: 'SMTP_NOT_ACCEPTED' });
  });
  it('returns failure when transport configuration throws', async () => {
    createTransport.mockImplementation(() => { throw new Error('invalid provider configuration'); });
    expect(await sendEmail(mail)).toEqual({ success: false, error: 'SMTP_SEND_FAILED' });
  });
  it('rejects invalid port configuration', async () => {
    vi.stubEnv('SMTP_PORT', 'invalid');
    expect(await sendEmail(mail)).toEqual({ success: false, error: 'SMTP_INVALID_PORT' });
    expect(createTransport).not.toHaveBeenCalled();
  });
});
