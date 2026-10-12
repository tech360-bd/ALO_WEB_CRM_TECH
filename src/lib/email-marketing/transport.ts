import nodemailer from 'smtp-mailer';
import { classifySmtpFailure } from './failures';
import type { MessageSender, SendResult } from './worker';

/**
 * SMTP adapter, the first provider behind the MessageSender interface.
 * Reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, EMAIL_FROM_NAME.
 * Error text from the server is classified and then discarded; only codes leave this file.
 */

export type SmtpSetupResult =
  | { ok: true; sender: MessageSender; close: () => void }
  | { ok: false; code: 'SMTP_NOT_CONFIGURED' | 'SMTP_INVALID_PORT' };

export function createSmtpSender(env: NodeJS.ProcessEnv = process.env): SmtpSetupResult {
  const host = (env.SMTP_HOST ?? '').trim();
  const user = (env.SMTP_USER ?? '').trim();
  const pass = env.SMTP_PASSWORD ?? '';
  const from = (env.SMTP_FROM ?? '').trim();
  if (!host || !user || !pass || !from) return { ok: false, code: 'SMTP_NOT_CONFIGURED' };

  const port = Number((env.SMTP_PORT ?? '').trim() || '587');
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, code: 'SMTP_INVALID_PORT' };

  const fromName = (env.EMAIL_FROM_NAME ?? '').trim() || 'ALO Education';
  const fromHeader = `"${fromName.replace(/["\\\r\n]/g, '')}" <${from}>`;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  const sender: MessageSender = {
    async send(message): Promise<SendResult> {
      try {
        const info = await transport.sendMail({
          from: fromHeader,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.headers,
        });
        const accepted = Array.isArray(info.accepted) && info.accepted.length > 0;
        const rejected = Array.isArray(info.rejected) && info.rejected.length > 0;
        if (!accepted || rejected || !info.messageId) {
          return { ok: false, kind: 'unknown', code: 'SMTP_NOT_ACCEPTED' };
        }
        return { ok: true, messageId: String(info.messageId) };
      } catch (error) {
        const detail = error as { responseCode?: unknown; code?: unknown; response?: unknown };
        const failure = classifySmtpFailure({
          responseCode: typeof detail.responseCode === 'number' ? detail.responseCode : null,
          code: typeof detail.code === 'string' ? detail.code : null,
          response: typeof detail.response === 'string' ? detail.response : null,
        });
        return { ok: false, kind: failure.kind, code: failure.code };
      }
    },
  };

  return { ok: true, sender, close: () => transport.close() };
}
