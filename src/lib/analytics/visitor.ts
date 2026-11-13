/**
 * Anonymous visitor + session identifiers for analytics.
 *
 * ALO needs to join a website visit to a CRM lead without ever sending an
 * email address, phone number or student identity to a third-party analytics
 * product. These identifiers are the mechanism:
 *
 *   - `visitor_id`  — a random opaque token persisted in `localStorage`. It is
 *     not derived from anything identifying, it is not the CRM student id, and
 *     it carries no personal data. The same token is stored on the lead when the
 *     visitor submits a form, which is what makes
 *     "Google Organic → landing page → lead → application" traceable.
 *   - `session_id`  — a random token rotated after 30 minutes of inactivity.
 *
 * Neither identifier is sent to Google by default. They are attached only to
 * ALO's own server-side Measurement Protocol calls and to the CRM record, and
 * are available to client events through `getAnalyticsIdentity()` where a funnel
 * genuinely needs them.
 */

const VISITOR_KEY = 'alo.analytics.visitor.v1';
const SESSION_KEY = 'alo.analytics.session.v1';
/** Google Analytics' own session timeout, so the two agree. */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export interface AnalyticsIdentity {
  visitorId: string;
  sessionId: string;
  /** True when the session token was rotated on this call. */
  sessionRotated: boolean;
}

function randomToken(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random}`;
}

function read(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked — identifiers stay in-memory for this page only */
  }
}

interface StoredSession {
  id: string;
  touchedAt: number;
}

/**
 * Return (creating if necessary) the visitor and session identifiers.
 *
 * Returns empty strings during SSR so callers can render deterministically.
 */
export function getAnalyticsIdentity(): AnalyticsIdentity {
  if (typeof window === 'undefined') {
    return { visitorId: '', sessionId: '', sessionRotated: false };
  }

  let visitorId = read(VISITOR_KEY);
  if (!visitorId) {
    visitorId = randomToken('v');
    write(VISITOR_KEY, visitorId);
  }

  const now = Date.now();
  let sessionRotated = false;
  let sessionId = '';
  const rawSession = read(SESSION_KEY);
  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as Partial<StoredSession>;
      if (typeof parsed.id === 'string' && typeof parsed.touchedAt === 'number') {
        if (now - parsed.touchedAt <= SESSION_TIMEOUT_MS) {
          sessionId = parsed.id;
          write(SESSION_KEY, JSON.stringify({ id: parsed.id, touchedAt: now } satisfies StoredSession));
        }
      }
    } catch {
      /* corrupt value — rotate below */
    }
  }
  if (!sessionId) {
    sessionId = randomToken('s');
    sessionRotated = true;
    write(SESSION_KEY, JSON.stringify({ id: sessionId, touchedAt: now } satisfies StoredSession));
  }

  return { visitorId, sessionId, sessionRotated };
}

/** Forget both identifiers. Used when a visitor revokes analytics consent. */
export function clearAnalyticsIdentity(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(VISITOR_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}
