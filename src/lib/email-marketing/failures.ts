/**
 * Maps SMTP/transport errors onto delivery decisions.
 *
 *   hard    – the mailbox is invalid (5.1.x / 550, 551, 553). Suppress; never retry.
 *   soft    – temporary (4xx, mailbox full, connection trouble). Retry with backoff.
 *   auth    – our credentials are rejected. Stop the campaign; retrying could lock the account.
 *   unknown – any other 5xx, including policy rejections (5.7.x). Retry up to the
 *             attempt limit, then fail. Never suppress on an unclassified error.
 *
 * Only machine codes leave this module. Raw SMTP text is never stored or logged.
 */

export type FailureKind = 'hard' | 'soft' | 'auth' | 'unknown';

export interface ClassifiedFailure {
  kind: FailureKind;
  code: string;
}

export interface SmtpErrorInput {
  responseCode?: number | null;
  code?: string | null;
  /** Server reply text, used only to read the enhanced status code. Never stored. */
  response?: string | null;
}

const AUTH_STATUS_CODES = new Set([530, 534, 535]);
const HARD_RECIPIENT_STATUS_CODES = new Set([550, 551, 553]);
const CONNECTION_ERROR_CODES = new Set(['ECONNECTION', 'ECONNRESET', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ENOTFOUND', 'ECONNREFUSED']);
const POLICY_ENHANCED_CODE = /\b5\.7\.\d{1,3}\b/;

export function classifySmtpFailure(input: SmtpErrorInput): ClassifiedFailure {
  const status = typeof input.responseCode === 'number' ? input.responseCode : null;
  const transportCode = input.code ?? '';

  if (transportCode === 'EAUTH' || (status !== null && AUTH_STATUS_CODES.has(status))) {
    return { kind: 'auth', code: 'SMTP_AUTH_FAILED' };
  }
  if (status !== null && HARD_RECIPIENT_STATUS_CODES.has(status)) {
    if (POLICY_ENHANCED_CODE.test(input.response ?? '')) {
      return { kind: 'unknown', code: 'SMTP_POLICY_REJECTED' };
    }
    return { kind: 'hard', code: 'SMTP_RECIPIENT_REJECTED' };
  }
  if (status === 552) return { kind: 'soft', code: 'SMTP_MAILBOX_FULL' };
  if (status !== null && status >= 400 && status < 500) return { kind: 'soft', code: 'SMTP_TEMPORARY_FAILURE' };
  if (CONNECTION_ERROR_CODES.has(transportCode)) return { kind: 'soft', code: 'SMTP_CONNECTION_FAILED' };
  if (status !== null && status >= 500 && status < 600) return { kind: 'unknown', code: 'SMTP_PERMANENT_UNCLASSIFIED' };
  return { kind: 'unknown', code: 'SMTP_UNKNOWN_ERROR' };
}
