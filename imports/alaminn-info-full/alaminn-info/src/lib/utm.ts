/**
 * UTM parameter capture utility.
 *
 * Reads UTM (and `ref`) parameters from the current URL's query string on the
 * client and returns them in a normalized shape that matches the inquiry /
 * newsletter API payloads. Safe to call during SSR — returns an empty object
 * when `window` is not available (e.g. during Next.js server rendering).
 *
 * Captured params:
 *  - utm_source   → utmSource
 *  - utm_medium   → utmMedium
 *  - utm_campaign → utmCampaign
 *  - utm_content  → utmContent
 *  - utm_term     → utmTerm
 *  - ref          → referralSource
 *
 * Only non-empty values are included in the returned object.
 */

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referralSource?: string;
};

/** Tuple of [queryParam, outputKey] used to drive capture. */
const UTM_KEYS: Array<[string, keyof UtmParams]> = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
  ["ref", "referralSource"],
];

/**
 * Capture UTM + `ref` parameters from the current browser URL.
 * Returns an empty object on the server (no `window`) or when no UTM
 * parameters are present. Values are trimmed; empty strings are dropped.
 */
export function captureUtmParams(): UtmParams {
  // Server-side render or non-browser environment — nothing to capture.
  if (typeof window === "undefined" || !window.location) {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const out: UtmParams = {};

  for (const [queryKey, outputKey] of UTM_KEYS) {
    const raw = params.get(queryKey);
    if (raw !== null) {
      const value = raw.trim();
      if (value) {
        out[outputKey] = value;
      }
    }
  }

  return out;
}

/**
 * Returns `true` when at least one UTM/referral parameter is present on the
 * current URL. Useful for showing a "referral tracked" indicator in the UI.
 */
export function hasUtmParams(): boolean {
  return Object.keys(captureUtmParams()).length > 0;
}
