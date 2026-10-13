/**
 * Privacy-friendly first-party analytics — client utilities.
 * ----------------------------------------------------------------
 * Cookie-less, server-owned, do-not-track-respecting analytics.
 *
 * What this module does (and does NOT do):
 *   ✓ Reads `utm_*` params from the URL and stores them in
 *     `sessionStorage` so they persist across in-page navigation.
 *   ✓ Generates a daily-rotating anonymous session ID stored in
 *     `localStorage` (NOT a cookie). Format: `YYYY-MM-DD-<8 hex chars>`.
 *     The date prefix lets the server roll up sessions by day without
 *     ever knowing who the visitor is.
 *   ✓ Sends events to `/api/v1/analytics/track` via `navigator.sendBeacon`
 *     when available (fire-and-forget, survives page unload).
 *   ✗ Never sets a cookie.
 *   ✗ Never reads or stores the raw IP address.
 *   ✗ Never stores an email, user ID, or any personal identifier.
 *   ✓ Respects `navigator.doNotTrack` — if DNT is "1" (or "yes"),
 *     `trackEvent` becomes a no-op and no request is sent.
 *
 * Public API:
 *   - captureUtmParams()  — read URL → sessionStorage
 *   - getStoredUtm()      — read sessionStorage
 *   - generateSessionId() — read/refresh localStorage session ID
 *   - trackEvent(name, meta?)  — POST to /api/v1/analytics/track
 *   - isDoNotTrack()      — boolean DNT check (exported for the init component)
 */

export type AnalyticsUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const UTM_KEYS: Array<["utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", keyof AnalyticsUtm]> = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
];

const SESSION_STORAGE_KEY = "alaminn:utm";
const LOCAL_STORAGE_SESSION_KEY = "alaminn:analytics-session";
const TRACK_ENDPOINT = "/api/v1/analytics/track";

/** Allowlist of event names the client is allowed to send. */
export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "inquiry_submitted",
  "newsletter_signup",
  "meeting_requested",
  "resource_download",
  "cta_click",
  "scroll_depth",
  "outbound_click",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/**
 * Returns `true` when the visitor has requested not to be tracked.
 * Honours `navigator.doNotTrack` (standard) and the legacy
 * `window.doNotTrack` / `navigator.msDoNotTrack` shapes used by
 * older IE / Edge versions.
 */
export function isDoNotTrack(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const dnt =
    navigator.doNotTrack ||
    (window as unknown as { doNotTrack?: string }).doNotTrack ||
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;
  if (!dnt) return false;
  return dnt === "1" || dnt === "yes" || dnt === "Yes";
}

/**
 * Read utm_* parameters from the current URL and merge them into
 * the values already in sessionStorage (so the first-touch UTM is
 * preserved when a visitor navigates within the same session).
 *
 * Returns the merged stored UTM params so callers can use them
 * without a second storage read.
 */
export function captureUtmParams(): AnalyticsUtm {
  if (typeof window === "undefined") return {};

  // Read existing stored UTMs first (preserve first-touch).
  const stored = readStoredUtm();

  // Read fresh UTMs from the URL (last-touch wins on conflict, but
  // missing keys don't overwrite existing ones).
  const urlParams = new URLSearchParams(window.location.search);
  const fresh: AnalyticsUtm = {};
  for (const [queryKey, outputKey] of UTM_KEYS) {
    const raw = urlParams.get(queryKey);
    if (raw !== null) {
      const value = raw.trim();
      if (value) fresh[outputKey] = value;
    }
  }

  const merged: AnalyticsUtm = { ...stored, ...fresh };
  if (Object.keys(merged).length > 0) {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // sessionStorage may be unavailable (private mode, disabled) —
      // fail silently, analytics is best-effort.
    }
  }
  return merged;
}

/** Read the UTM params currently stored in sessionStorage. */
export function getStoredUtm(): AnalyticsUtm {
  if (typeof window === "undefined") return {};
  return readStoredUtm();
}

function readStoredUtm(): AnalyticsUtm {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const out: AnalyticsUtm = {};
      for (const [, outputKey] of UTM_KEYS) {
        const v = (parsed as Record<string, unknown>)[outputKey];
        if (typeof v === "string" && v.trim()) {
          out[outputKey] = v.trim();
        }
      }
      return out;
    }
  } catch {
    // ignore parse errors
  }
  return {};
}

/**
 * Generate (or refresh) a daily-rotating anonymous session ID.
 *
 * The ID format is `YYYY-MM-DD-<8 hex chars>` where the date is the
 * visitor's local date. If the stored ID's date prefix matches today,
 * the stored ID is reused (so a single visit on the same day = one
 * session). If the date differs — or there's no stored ID — a new
 * random suffix is generated. The ID is stored in `localStorage`,
 * NOT in a cookie.
 *
 * Returns `null` when DNT is enabled or storage is unavailable.
 */
export function generateSessionId(): string | null {
  if (typeof window === "undefined") return null;
  if (isDoNotTrack()) return null;

  const today = new Date();
  const datePrefix = formatDatePrefix(today);

  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (existing && existing.startsWith(datePrefix + "-")) {
      return existing;
    }
    // Either no existing ID, or it's from a previous day → rotate.
    const suffix = randomHex(8);
    const id = `${datePrefix}-${suffix}`;
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, id);
    return id;
  } catch {
    // localStorage may be unavailable — degrade gracefully.
    return null;
  }
}

function formatDatePrefix(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for very old environments.
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Send an analytics event to the server. Fire-and-forget — uses
 * `navigator.sendBeacon` when available so the request survives
 * page unload. Falls back to `fetch(..., { keepalive: true })`.
 *
 * Respects Do Not Track — no-op when DNT is enabled.
 * Never throws — every error is swallowed.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  meta?: Record<string, unknown>,
): void {
  try {
    if (typeof window === "undefined") return;
    if (isDoNotTrack()) return;

    const utm = getStoredUtm();
    const sessionId = generateSessionId();
    const payload = {
      eventName,
      page: safePagePath(),
      referrer: safeReferrer(),
      sessionId,
      utm,
      meta: meta ?? {},
    };

    const body = JSON.stringify(payload);

    // Prefer sendBeacon for fire-and-forget (survives unload).
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      // sendBeacon returns false when the queue is full or the URL is
      // invalid — fall back to fetch in that case.
      if (navigator.sendBeacon(TRACK_ENDPOINT, blob)) {
        return;
      }
    }

    // Fallback: fetch with keepalive so it survives navigation.
    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      // Use 'same-origin' credentials to avoid sending third-party cookies
      // (we don't use any cookies, but this is the safest mode).
      credentials: "same-origin",
    }).catch(() => {
      /* swallow — analytics must never break UX */
    });
  } catch {
    /* swallow — analytics must never break UX */
  }
}

function safePagePath(): string {
  try {
    if (typeof window === "undefined" || !window.location) return "/";
    return window.location.pathname + window.location.search + window.location.hash;
  } catch {
    return "/";
  }
}

function safeReferrer(): string | undefined {
  try {
    if (typeof document === "undefined") return undefined;
    // Strip the referrer to origin+path to avoid leaking query params
    // (which could contain personal data from other sites).
    const r = document.referrer;
    if (!r) return undefined;
    try {
      const u = new URL(r);
      return u.origin + u.pathname;
    } catch {
      return r;
    }
  } catch {
    return undefined;
  }
}
