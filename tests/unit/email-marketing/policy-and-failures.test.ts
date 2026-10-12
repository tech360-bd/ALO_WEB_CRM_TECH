// SMTP failure classification and sending policy (src/lib/email-marketing/failures.ts, policy.ts).
import { describe, expect, it } from 'vitest';
import { classifySmtpFailure } from '@/lib/email-marketing/failures';
import { remainingBudget, retryDelayMs, RETRY_MAX_DELAY_MS } from '@/lib/email-marketing/policy';

describe('classifySmtpFailure', () => {
  it.each([
    [{ code: 'EAUTH' }, 'auth', 'SMTP_AUTH_FAILED'],
    [{ responseCode: 535 }, 'auth', 'SMTP_AUTH_FAILED'],
    [{ responseCode: 534 }, 'auth', 'SMTP_AUTH_FAILED'],
    [{ responseCode: 550, response: '550 5.1.1 The email account does not exist.' }, 'hard', 'SMTP_RECIPIENT_REJECTED'],
    [{ responseCode: 550, response: '550 no such user here' }, 'hard', 'SMTP_RECIPIENT_REJECTED'],
    [{ responseCode: 551 }, 'hard', 'SMTP_RECIPIENT_REJECTED'],
    [{ responseCode: 553 }, 'hard', 'SMTP_RECIPIENT_REJECTED'],
    [{ responseCode: 550, response: '550 5.7.1 Message rejected by policy' }, 'unknown', 'SMTP_POLICY_REJECTED'],
    [{ responseCode: 552 }, 'soft', 'SMTP_MAILBOX_FULL'],
    [{ responseCode: 451 }, 'soft', 'SMTP_TEMPORARY_FAILURE'],
    [{ responseCode: 421 }, 'soft', 'SMTP_TEMPORARY_FAILURE'],
    [{ code: 'ECONNECTION' }, 'soft', 'SMTP_CONNECTION_FAILED'],
    [{ code: 'ETIMEDOUT' }, 'soft', 'SMTP_CONNECTION_FAILED'],
    [{ responseCode: 554 }, 'unknown', 'SMTP_PERMANENT_UNCLASSIFIED'],
    [{ code: 'SOMETHING_NEW' }, 'unknown', 'SMTP_UNKNOWN_ERROR'],
    [{}, 'unknown', 'SMTP_UNKNOWN_ERROR'],
  ])('classifies %j as %s / %s', (input, kind, code) => {
    expect(classifySmtpFailure(input)).toEqual({ kind, code });
  });

  it('never hard-suppresses a 5xx that is not a recipient rejection', () => {
    expect(classifySmtpFailure({ responseCode: 554 }).kind).not.toBe('hard');
    expect(classifySmtpFailure({ responseCode: 550, response: '550 5.7.1 blocked' }).kind).not.toBe('hard');
  });
});

describe('retryDelayMs', () => {
  it('doubles from 5 minutes and caps at 6 hours', () => {
    expect(retryDelayMs(1)).toBe(5 * 60 * 1000);
    expect(retryDelayMs(2)).toBe(10 * 60 * 1000);
    expect(retryDelayMs(3)).toBe(20 * 60 * 1000);
    expect(retryDelayMs(30)).toBe(RETRY_MAX_DELAY_MS);
  });

  it('treats zero or negative attempts as the first attempt', () => {
    expect(retryDelayMs(0)).toBe(5 * 60 * 1000);
    expect(retryDelayMs(-4)).toBe(5 * 60 * 1000);
  });
});

describe('remainingBudget', () => {
  it('returns the tighter of the hourly and daily allowance', () => {
    expect(remainingBudget({ hourlyCap: 50, dailyCap: 300 }, 10, 20)).toBe(40);
    expect(remainingBudget({ hourlyCap: 50, dailyCap: 300 }, 0, 290)).toBe(10);
  });

  it('never goes negative when usage already exceeds a cap', () => {
    expect(remainingBudget({ hourlyCap: 5, dailyCap: 300 }, 9, 9)).toBe(0);
  });
});
