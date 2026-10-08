import { parseAddressList } from './addresses';
import { isUsableUnsubscribeSecret } from './unsubscribe-token';

/**
 * Environment-driven settings for the email marketing engine.
 *
 * Safe defaults: sending is OFF and test mode is ON. Production sending needs
 * EMAIL_SENDING_ENABLED=true AND EMAIL_TEST_MODE=false. Invalid values throw, so
 * the worker fails closed instead of guessing.
 */

export interface EmailMarketingConfig {
  /** EMAIL_SENDING_ENABLED. Master switch for the outbox worker. */
  sendingEnabled: boolean;
  /** EMAIL_TEST_MODE. When true, only EMAIL_TEST_RECIPIENTS can receive mail. Default true. */
  testMode: boolean;
  /** EMAIL_TEST_RECIPIENTS. Comma-separated allowlist used in test mode. */
  testRecipients: string[];
  /** EMAIL_HOURLY_CAP. Configured ceiling on SMTP attempts per rolling hour. */
  hourlyCap: number;
  /** EMAIL_DAILY_CAP. Configured ceiling on SMTP attempts per rolling 24 hours. */
  dailyCap: number;
  /** EMAIL_BATCH_SIZE. Items claimed per worker run. */
  batchSize: number;
  /** EMAIL_MAX_ATTEMPTS. Soft failures are retried until this many attempts, then marked failed. */
  maxAttempts: number;
  /** EMAIL_UNSUBSCRIBE_SECRET. At least 32 characters. Null when unset. */
  unsubscribeSecret: string | null;
  /** APP_URL (or NEXT_PUBLIC_APP_URL). Origin for unsubscribe links. Null when unset. */
  appBaseUrl: string | null;
  /** EMAIL_FROM_NAME. Display name shown with SMTP_FROM. */
  fromName: string;
  /** SMTP_FROM. Sender address. Null when unset. */
  fromAddress: string | null;
}

export class EmailConfigError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`EMAIL_CONFIG_INVALID:${variable}`);
    this.name = 'EmailConfigError';
    this.variable = variable;
  }
}

function integerSetting(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = (env[name] ?? '').trim();
  if (raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new EmailConfigError(name);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new EmailConfigError(name);
  return value;
}

function booleanSetting(env: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean {
  const raw = (env[name] ?? '').trim().toLowerCase();
  if (raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new EmailConfigError(name);
}

function baseUrlSetting(env: NodeJS.ProcessEnv): string | null {
  const raw = (env.APP_URL ?? '').trim() || (env.NEXT_PUBLIC_APP_URL ?? '').trim();
  if (raw === '') return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EmailConfigError('APP_URL');
  }
  const isProduction = env.NODE_ENV === 'production';
  const schemeOk = url.protocol === 'https:' || (url.protocol === 'http:' && !isProduction);
  if (!schemeOk) throw new EmailConfigError('APP_URL');
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

export function readEmailMarketingConfig(env: NodeJS.ProcessEnv = process.env): EmailMarketingConfig {
  const secret = (env.EMAIL_UNSUBSCRIBE_SECRET ?? '').trim();
  if (secret.length > 0 && !isUsableUnsubscribeSecret(secret)) {
    throw new EmailConfigError('EMAIL_UNSUBSCRIBE_SECRET');
  }

  return {
    sendingEnabled: booleanSetting(env, 'EMAIL_SENDING_ENABLED', false),
    testMode: booleanSetting(env, 'EMAIL_TEST_MODE', true),
    testRecipients: parseAddressList(env.EMAIL_TEST_RECIPIENTS),
    hourlyCap: integerSetting(env, 'EMAIL_HOURLY_CAP', 50, 1, 100000),
    dailyCap: integerSetting(env, 'EMAIL_DAILY_CAP', 300, 1, 1000000),
    batchSize: integerSetting(env, 'EMAIL_BATCH_SIZE', 20, 1, 200),
    maxAttempts: integerSetting(env, 'EMAIL_MAX_ATTEMPTS', 5, 1, 20),
    unsubscribeSecret: isUsableUnsubscribeSecret(secret) ? secret : null,
    appBaseUrl: baseUrlSetting(env),
    fromName: (env.EMAIL_FROM_NAME ?? '').trim() || 'ALO Education',
    fromAddress: (env.SMTP_FROM ?? '').trim() || null,
  };
}

/** Booleans and numbers only, with no secret values. Safe to return to the admin UI. */
export function publicEmailConfigSummary(config: EmailMarketingConfig, env: NodeJS.ProcessEnv = process.env): {
  sendingEnabled: boolean;
  testMode: boolean;
  testRecipientCount: number;
  hourlyCap: number;
  dailyCap: number;
  batchSize: number;
  maxAttempts: number;
  unsubscribeConfigured: boolean;
  publicLinksConfigured: boolean;
  smtpConfigured: boolean;
} {
  return {
    sendingEnabled: config.sendingEnabled,
    testMode: config.testMode,
    testRecipientCount: config.testRecipients.length,
    hourlyCap: config.hourlyCap,
    dailyCap: config.dailyCap,
    batchSize: config.batchSize,
    maxAttempts: config.maxAttempts,
    unsubscribeConfigured: config.unsubscribeSecret !== null,
    publicLinksConfigured: config.appBaseUrl !== null,
    smtpConfigured: Boolean(
      (env.SMTP_HOST ?? '').trim() && (env.SMTP_USER ?? '').trim() && (env.SMTP_PASSWORD ?? '').trim() && config.fromAddress
    ),
  };
}
