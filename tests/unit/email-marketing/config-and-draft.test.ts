// Environment config and campaign draft validation (src/lib/email-marketing/config.ts, draft-input.ts).
import { describe, expect, it } from 'vitest';
import { EmailConfigError, publicEmailConfigSummary, readEmailMarketingConfig } from '@/lib/email-marketing/config';
import { parseDraftInput } from '@/lib/email-marketing/draft-input';

const SECRET = 'z'.repeat(40);

describe('readEmailMarketingConfig', () => {
  it('defaults to sending OFF and test mode ON', () => {
    const config = readEmailMarketingConfig({});
    expect(config).toMatchObject({
      sendingEnabled: false,
      testMode: true,
      testRecipients: [],
      hourlyCap: 50,
      dailyCap: 300,
      batchSize: 20,
      maxAttempts: 5,
      unsubscribeSecret: null,
      appBaseUrl: null,
      fromName: 'ALO Education',
      fromAddress: null,
    });
  });

  it('turns sending on only when explicitly asked', () => {
    expect(readEmailMarketingConfig({ EMAIL_SENDING_ENABLED: 'true' }).sendingEnabled).toBe(true);
    expect(readEmailMarketingConfig({ EMAIL_SENDING_ENABLED: 'false' }).sendingEnabled).toBe(false);
    expect(readEmailMarketingConfig({}).sendingEnabled).toBe(false);
  });

  it('rejects unrecognised booleans instead of guessing', () => {
    expect(() => readEmailMarketingConfig({ EMAIL_TEST_MODE: 'maybe' })).toThrow(EmailConfigError);
    try {
      readEmailMarketingConfig({ EMAIL_TEST_MODE: 'maybe' });
    } catch (error) {
      expect((error as EmailConfigError).variable).toBe('EMAIL_TEST_MODE');
    }
  });

  it.each(['abc', '0', '-5', '1.5'])('rejects the cap value %j', (value) => {
    expect(() => readEmailMarketingConfig({ EMAIL_DAILY_CAP: value })).toThrow(EmailConfigError);
  });

  it('uses the default when a cap is set to an empty string', () => {
    expect(readEmailMarketingConfig({ EMAIL_DAILY_CAP: '' }).dailyCap).toBe(300);
  });

  it('rejects a set unsubscribe secret shorter than 32 characters and accepts a long one', () => {
    expect(() => readEmailMarketingConfig({ EMAIL_UNSUBSCRIBE_SECRET: 'too-short' })).toThrow(EmailConfigError);
    expect(readEmailMarketingConfig({ EMAIL_UNSUBSCRIBE_SECRET: SECRET }).unsubscribeSecret).toBe(SECRET);
  });

  it('normalizes the public base URL and refuses plain HTTP in production', () => {
    expect(readEmailMarketingConfig({ APP_URL: 'https://aloeducation.com/' }).appBaseUrl).toBe('https://aloeducation.com');
    expect(readEmailMarketingConfig({ NEXT_PUBLIC_APP_URL: 'https://fallback.example/base/' }).appBaseUrl).toBe(
      'https://fallback.example/base'
    );
    expect(() => readEmailMarketingConfig({ APP_URL: 'http://aloeducation.com', NODE_ENV: 'production' })).toThrow(EmailConfigError);
    expect(readEmailMarketingConfig({ APP_URL: 'http://localhost:3000', NODE_ENV: 'development' }).appBaseUrl).toBe('http://localhost:3000');
    expect(() => readEmailMarketingConfig({ APP_URL: 'not a url' })).toThrow(EmailConfigError);
  });

  it('keeps only valid, normalized test recipients', () => {
    expect(readEmailMarketingConfig({ EMAIL_TEST_RECIPIENTS: 'QA@Example.com, bad, qa@example.com' }).testRecipients).toEqual([
      'qa@example.com',
    ]);
  });

  it('never returns secret values in the admin summary', () => {
    const env = {
      EMAIL_UNSUBSCRIBE_SECRET: SECRET,
      SMTP_HOST: 'smtp.example',
      SMTP_USER: 'u',
      SMTP_PASSWORD: 'super-secret-pass',
      SMTP_FROM: 'noreply@example.com',
      APP_URL: 'https://aloeducation.com',
    };
    const summary = publicEmailConfigSummary(readEmailMarketingConfig(env), env);
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain('super-secret-pass');
    expect(summary).toMatchObject({ unsubscribeConfigured: true, publicLinksConfigured: true, smtpConfigured: true });
  });
});

describe('parseDraftInput', () => {
  const valid = {
    name: 'Spring intake',
    subject: 'Hello {{first_name}}',
    html: '<p>Hi</p><a href="{{unsubscribe_url}}">Unsubscribe</a>',
    consentConfirmed: true,
    consentBasis: 'Opt-in form on the website, 2026',
    recipients: [{ email: 'ann@example.com', first_name: 'Ann' }, { email: 'bob@example.com' }],
  };

  it('accepts a complete draft and defaults testMode to true', () => {
    const parsed = parseDraftInput(valid);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.testMode).toBe(true);
      expect(parsed.value.recipients).toHaveLength(2);
      expect(parsed.value.text).toBeNull();
    }
  });

  it('refuses a draft without an explicit consent attestation', () => {
    expect(parseDraftInput({ ...valid, consentConfirmed: false })).toMatchObject({ ok: false, status: 400, error: 'CONSENT_ATTESTATION_REQUIRED' });
    expect(parseDraftInput({ ...valid, consentConfirmed: 'yes' })).toMatchObject({ ok: false, error: 'CONSENT_ATTESTATION_REQUIRED' });
  });

  it('requires a meaningful consent basis', () => {
    expect(parseDraftInput({ ...valid, consentBasis: 'trust me' })).toMatchObject({ ok: false, error: 'CONSENT_BASIS_REQUIRED' });
    expect(parseDraftInput({ ...valid, consentBasis: '   ' })).toMatchObject({ ok: false, error: 'CONSENT_BASIS_REQUIRED' });
  });

  it('rejects a non-boolean testMode rather than coercing it', () => {
    expect(parseDraftInput({ ...valid, testMode: 'false' })).toMatchObject({ ok: false, error: 'TEST_MODE_INVALID' });
  });

  it('requires at least one recipient and bounds the list size', () => {
    expect(parseDraftInput({ ...valid, recipients: [] })).toMatchObject({ ok: false, error: 'RECIPIENTS_REQUIRED' });
    expect(parseDraftInput({ ...valid, recipients: 'a@b.c' })).toMatchObject({ ok: false, error: 'RECIPIENTS_REQUIRED' });
    const tooMany = Array.from({ length: 20001 }, (_, i) => ({ email: `u${i}@example.com` }));
    expect(parseDraftInput({ ...valid, recipients: tooMany })).toMatchObject({ ok: false, error: 'TOO_MANY_RECIPIENTS' });
  });

  it('ignores malformed recipient entries instead of failing the whole request', () => {
    const parsed = parseDraftInput({ ...valid, recipients: [null, 'x', { email: 7 }, { email: 'ok@example.com' }] });
    expect(parsed.ok && parsed.value.recipients.map((row) => row.email)).toEqual(['ok@example.com']);
  });

  it('rejects a body that is not an object', () => {
    expect(parseDraftInput(null)).toMatchObject({ ok: false, error: 'BODY_REQUIRED' });
    expect(parseDraftInput([])).toMatchObject({ ok: false, error: 'BODY_REQUIRED' });
  });
});
