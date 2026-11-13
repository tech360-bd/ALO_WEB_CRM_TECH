/**
 * Server-side business conversions via the GA4 Measurement Protocol.
 *
 * Why these are server-side: a conversion that matters to the business
 * (a lead was qualified, an application was submitted, a student enrolled)
 * happens inside ALO's own API, often long after the visitor's browser session
 * ended. Measuring it client-side would lose most of them. The Measurement
 * Protocol posts the event from the server instead.
 *
 * Hard rules this module enforces:
 *
 *   - **No fabricated success.** When GA4 is not configured the call returns
 *     `{ status: 'NOT_CONFIGURED' }`. It never returns ok:true, never logs a
 *     success, and never silently pretends the conversion was measured. This is
 *     the single most important behaviour in the file: an operator reading a
 *     dashboard must be able to trust that a counted conversion was counted by
 *     Google.
 *   - **Environment gated.** Outside production nothing is sent at all, unless
 *     `ANALYTICS_ALLOW_NON_PRODUCTION=true` is set, in which case the event is
 *     sent with `debug_mode: true` so it lands in GA4 DebugView and never in
 *     reporting. Development traffic can therefore not pollute the property.
 *   - **No PII.** Parameters go through the same `scrubEventParams` screen as
 *     client events. The Measurement Protocol `client_id` is an opaque token —
 *     the ALO visitor id, or a SHA-256 of an internal reference — never an
 *     email, phone number or name.
 *   - **Cannot break the business flow.** Every failure is caught and returned
 *     as a status. A lead qualification must not fail because Google is down.
 *   - **Bounded.** Requests time out, and the event batch is capped, so a
 *     unreachable Google endpoint cannot stall a request handler.
 */

import { createHash } from 'node:crypto';
import { getGoogleStackConfig } from '@/lib/google/config';
import { scrubEventParams, type AnalyticsEventName } from './events';

export type ServerEventStatus =
  | 'SENT'
  | 'NOT_CONFIGURED'
  | 'DISABLED_BY_ENVIRONMENT'
  | 'REJECTED'
  | 'FAILED';

export interface ServerEventResult {
  status: ServerEventStatus;
  event: string;
  /** HTTP status from Google, when a request was actually made. */
  httpStatus?: number;
  /** Present when the call was refused or failed. Safe to log — never a secret. */
  reason?: string;
  /** Parameter keys removed by the PII screen, for development visibility. */
  dropped?: string[];
}

/** Events that represent a real business conversion and are worth a value. */
export const BUSINESS_CONVERSION_EVENTS = [
  'generate_lead',
  'lead_qualified',
  'application_started',
  'application_submitted',
  'enrollment_completed',
  'english_test_complete',
] as const;

export type BusinessConversionEvent = (typeof BUSINESS_CONVERSION_EVENTS)[number];

const DEFAULT_TIMEOUT_MS = 4000;
const MAX_EVENTS_PER_CALL = 20;

/**
 * Derive an opaque Measurement Protocol `client_id`.
 *
 * GA4 requires this field and uses it to group events into a user. ALO passes
 * either the anonymous visitor token captured on the website (which joins a
 * server conversion back to the browser session that produced it) or, when that
 * is unavailable, a salted hash of an internal reference. The hash is one-way:
 * Google receives a stable opaque string and cannot recover the lead id.
 */
export function deriveClientId(input: {
  visitorId?: string | null;
  reference?: string | null;
}): string {
  if (input.visitorId && input.visitorId.trim() !== '') {
    return input.visitorId.trim().slice(0, 191);
  }
  if (input.reference && input.reference.trim() !== '') {
    // Salted so the same reference does not produce a recognisable constant
    // across properties, and one-way so the reference itself is not disclosed.
    const salt = process.env.ANALYTICS_CLIENT_ID_SALT || 'alo-education';
    return `alo_${createHash('sha256').update(`${salt}:${input.reference.trim()}`).digest('hex').slice(0, 32)}`;
  }
  // No identity at all: a per-call random id still satisfies the protocol, and
  // the event is counted once. It cannot be joined to a session, which is the
  // honest outcome rather than inventing a join.
  return `alo_anon_${createHash('sha256').update(`${Date.now()}:${Math.random()}`).digest('hex').slice(0, 24)}`;
}

export interface SendServerEventInput {
  event: AnalyticsEventName | string;
  clientId?: string | null;
  /** Internal ALO reference used to derive a client id when no visitor token exists. */
  reference?: string | null;
  params?: Record<string, unknown> | null;
  /** Monetary value of the conversion, when the business defines one. */
  value?: number;
  currency?: string;
  /** Override the request timeout. */
  timeoutMs?: number;
  /**
   * Environment to resolve configuration from. Defaults to `process.env`.
   * Injectable so the NOT_CONFIGURED and environment-gate behaviour can be
   * tested without mutating the real process environment.
   */
  env?: NodeJS.ProcessEnv;
}

/**
 * Send one event (or a small batch) to the GA4 Measurement Protocol endpoint.
 *
 * Never throws.
 */
export async function sendServerEvent(input: SendServerEventInput): Promise<ServerEventResult> {
  const env = input.env ?? process.env;
  const config = getGoogleStackConfig(env);
  const event = input.event;

  if (!config.ga4.measurementId || !config.ga4.apiSecretConfigured) {
    return {
      status: 'NOT_CONFIGURED',
      event,
      reason:
        'GA4 Measurement Protocol requires GA4_MEASUREMENT_ID and GA4_API_SECRET. Neither a conversion nor a failure is being reported to Google.',
    };
  }

  const isProduction = config.environment === 'production';
  const nonProdAllowed = env.ANALYTICS_ALLOW_NON_PRODUCTION === 'true';
  if (!isProduction && !nonProdAllowed) {
    return {
      status: 'DISABLED_BY_ENVIRONMENT',
      event,
      reason: `Server conversions are not sent from ${config.environment}. Set ANALYTICS_ALLOW_NON_PRODUCTION=true to route them to GA4 DebugView instead.`,
    };
  }

  const clientId = deriveClientId({ visitorId: input.clientId, reference: input.reference });

  const rawParams: Record<string, unknown> = { ...(input.params ?? {}) };
  if (typeof input.value === 'number' && Number.isFinite(input.value)) {
    rawParams.value = input.value;
    rawParams.currency = input.currency || 'BDT';
  }
  // In non-production the event goes to DebugView only, so it can never appear
  // in a report alongside real conversions.
  if (!isProduction) rawParams.debug_mode = true;

  const scrubbed = scrubEventParams(event, rawParams);
  // `debug_mode` is a protocol control field, not a reportable parameter, so it
  // is re-attached after screening rather than added to the public allowlist.
  const params: Record<string, unknown> = { ...scrubbed.params };
  if (!isProduction) params.debug_mode = 1;

  const url =
    `https://www.google-analytics.com/mp/collect` +
    `?measurement_id=${encodeURIComponent(config.ga4.measurementId)}` +
    `&api_secret=${encodeURIComponent(env.GA4_API_SECRET || env.GA4_MEASUREMENT_PROTOCOL_SECRET || '')}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, events: [{ name: event, params }] }),
      signal: controller.signal,
      // Never let an analytics call be cached or retried by an intermediary.
      cache: 'no-store',
    });
    // The Measurement Protocol returns 204 No Content on success. 4xx means the
    // payload was rejected and is a real integration bug worth surfacing.
    if (!response.ok) {
      return {
        status: 'FAILED',
        event,
        httpStatus: response.status,
        reason: `Measurement Protocol rejected the event (HTTP ${response.status}).`,
        dropped: scrubbed.droppedForbiddenKeys.concat(scrubbed.droppedUnknownKeys),
      };
    }
    return {
      status: 'SENT',
      event,
      httpStatus: response.status,
      dropped: scrubbed.droppedForbiddenKeys.concat(scrubbed.droppedUnknownKeys),
    };
  } catch (error) {
    return {
      status: 'FAILED',
      event,
      // The message can contain the request URL, which carries the API secret,
      // so it is reduced to a fixed string and the error class only.
      reason: `Measurement Protocol request failed (${error instanceof Error ? error.name : 'unknown error'}). The secret is never logged.`,
      dropped: scrubbed.droppedForbiddenKeys.concat(scrubbed.droppedUnknownKeys),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Send several events in one request. Bounded to `MAX_EVENTS_PER_CALL`. */
export async function sendServerEvents(inputs: SendServerEventInput[]): Promise<ServerEventResult[]> {
  const batch = inputs.slice(0, MAX_EVENTS_PER_CALL);
  // Sequential on purpose: these calls happen at the end of a business
  // transaction, and a burst of parallel requests to one endpoint is more
  // likely to be rate-limited than to be faster.
  const results: ServerEventResult[] = [];
  for (const input of batch) {
    results.push(await sendServerEvent(input));
  }
  return results;
}

/**
 * Fire-and-forget helper for use at the end of a business transaction.
 *
 * Logs a single structured line so integration failures are visible in the
 * server log (the spec requires logging integration failures) without ever
 * including the API secret or the event payload.
 */
export function reportServerEvent(input: SendServerEventInput): void {
  void sendServerEvent(input)
    .then((result) => {
      if (result.status === 'SENT' || result.status === 'DISABLED_BY_ENVIRONMENT') return;
      if (result.status === 'NOT_CONFIGURED') {
        // Expected on any deployment without GA4 credentials. Logged at info,
        // not error, so it does not look like an incident.
        console.info(`[analytics] server conversion "${result.event}" not sent: ${result.reason}`);
        return;
      }
      console.error(`[analytics] server conversion "${result.event}" ${result.status}: ${result.reason ?? ''}`);
    })
    .catch((error) => {
      console.error('[analytics] server conversion could not be reported', {
        error: error instanceof Error ? error.name : 'unknown',
      });
    });
}
