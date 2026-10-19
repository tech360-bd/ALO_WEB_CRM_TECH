/**
 * GA4 / GTM analytics event catalogue for ALO Education.
 *
 * This module is the single definition of what may be sent to Google Analytics.
 * It exists for two reasons:
 *
 *   1. **A closed event vocabulary.** Only events declared in `ANALYTICS_EVENTS`
 *      can be emitted. A typo'd or invented event name is rejected rather than
 *      silently creating a junk dimension in the property.
 *   2. **A hard privacy wall.** Personally identifying and sensitive student
 *      data must never leave ALO's own database for an analytics vendor.
 *      `scrubEventParams` drops forbidden keys and forbidden value shapes
 *      *before* anything reaches `dataLayer`, and reports what it dropped so a
 *      developer sees the mistake in the console instead of in a compliance
 *      incident.
 *
 * The CRM keeps the sensitive record; analytics receives only an opaque,
 * non-reversible internal reference where a join is genuinely needed.
 */

/** Deployment environments in which analytics tags are permitted. */
export const ANALYTICS_EVENT_NAMES = [
  // Navigation / measurement baseline
  'page_view',
  // Catalogue discovery
  'course_search',
  'course_view',
  'university_search',
  'university_view',
  'scholarship_view',
  // Lead funnel
  'lead_form_start',
  'lead_form_submit',
  'counselor_request',
  // Direct contact
  'whatsapp_click',
  'phone_click',
  'email_click',
  // Application funnel
  'application_start',
  'application_submit',
  // Account
  'student_registration',
  'student_login',
  // Service pages
  'visa_page_view',
  'ielts_page_view',
  'english_test_start',
  'english_test_complete',
  // Business conversions (server-side Measurement Protocol)
  'lead_qualified',
  'application_submitted',
  'enrollment_completed',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/**
 * Allowed parameter keys. Anything not in this list is dropped, because an
 * open-ended parameter object is how PII leaks into a third-party analytics
 * product in the first place.
 */
export const ALLOWED_EVENT_PARAMS = [
  // Catalogue identity
  'course_id',
  'course_slug',
  'university_id',
  'university_slug',
  'scholarship_id',
  'scholarship_slug',
  // Geography / intent
  'country',
  'destination',
  'study_level',
  'intake',
  'english_test',
  // Page context
  'page_type',
  'page_path',
  'landing_page',
  'lead_source',
  'form_id',
  'form_step',
  // Campaign / attribution
  'campaign',
  'campaign_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'referrer_domain',
  'first_touch_source',
  'last_touch_source',
  // Opaque internal joins — reference codes only, never names or contacts
  'lead_reference',
  'application_reference',
  'student_reference',
  'visitor_id',
  'session_id',
  // Test / outcome
  'test_type',
  'test_result_band',
  'score_band',
  'result',
  'success',
  'error_code',
  'value',
  'currency',
  'items_count',
  'search_term_category',
] as const;

export type AllowedEventParam = (typeof ALLOWED_EVENT_PARAMS)[number];

export type AnalyticsEventParams = Partial<Record<AllowedEventParam, string | number | boolean | null | undefined>>;

/**
 * Keys that must never be transmitted, matched case-insensitively and on
 * substrings so that `studentPassportNumber` is caught as well as `passport`.
 *
 * Derived directly from the prohibition list: passport number, NID, passport
 * scans, passwords, payment card data, private application documents, sensitive
 * personal records — plus the contact identifiers GA4 policy itself forbids.
 */
export const FORBIDDEN_PARAM_PATTERNS: RegExp[] = [
  /passport/i,
  /\bnid\b/i,
  /national[_-]?id/i,
  /birth[_-]?certificate/i,
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /card[_-]?number/i,
  /cardnumber/i,
  /\bcvv\b/i,
  /\bcvc\b/i,
  /expiry/i,
  /iban/i,
  /\bbank\b/i,
  /account[_-]?number/i,
  /routing[_-]?number/i,
  /payment/i,
  /\bemail\b/i,
  /\bphone\b/i,
  /mobile/i,
  /\bname\b/i,
  /full[_-]?name/i,
  /first[_-]?name/i,
  /last[_-]?name/i,
  /address/i,
  /date[_-]?of[_-]?birth/i,
  /\bdob\b/i,
  /\bdocument\b/i,
  /file[_-]?name/i,
  /file[_-]?path/i,
  /attachment/i,
  /scan/i,
  /\bcgpa\b/i,
  /transcript/i,
  /\bfee[_-]?amount\b/i,
  /commission/i,
  /salary/i,
  /\bnote\b/i,
  /internal[_-]?note/i,
  /medical/i,
  /disabilit/i,
  /religion/i,
  /\brace\b/i,
  /political/i,
  /biometric/i,
  /fingerprint/i,
  /ip[_-]?address/i,
  /user[_-]?agent/i,
];

/**
 * Value shapes that are rejected regardless of the key they arrive under,
 * because a developer can always pick an innocent-looking key name.
 */
const FORBIDDEN_VALUE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, label: 'email address' },
  // Bangladeshi mobile with or without country code, with separators.
  { pattern: /(?:\+?88)?01[3-9][\d\s-]{8,9}$/, label: 'Bangladeshi mobile number' },
  { pattern: /^\+?\d[\d\s()-]{9,17}$/, label: 'phone number' },
  // Passport-style: 1-2 letters followed by 6-8 digits (BD passports are A/B + 7 digits).
  { pattern: /^[A-Za-z]{1,2}\d{6,8}$/, label: 'passport / national id pattern' },
  { pattern: /\b(?:\d[ -]?){13,19}\b/, label: 'payment card number pattern' },
  { pattern: /^\d{10,17}$/, label: 'long numeric identifier (NID / card / passport)' },
];

export interface ScrubResult {
  /** Parameters that survived screening and may be pushed to dataLayer. */
  params: Record<string, string | number | boolean>;
  /** Keys removed because they are not in the allowlist. */
  droppedUnknownKeys: string[];
  /** Keys removed because they matched a forbidden pattern. */
  droppedForbiddenKeys: string[];
  /** Keys kept but whose value was rejected as PII-shaped. */
  droppedForbiddenValues: { key: string; label: string }[];
  /** True when nothing was removed. */
  clean: boolean;
}

function isPlainValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/** True when a key must never be sent, whatever its value. */
export function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_PARAM_PATTERNS.some((pattern) => pattern.test(key));
}

/** Identify a PII-shaped value. Returns the human-readable reason, or null. */
export function detectForbiddenValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  // Long free text is never a legitimate analytics parameter.
  if (trimmed.length > 200) return 'over-long free text';
  for (const entry of FORBIDDEN_VALUE_PATTERNS) {
    if (entry.pattern.test(trimmed)) return entry.label;
  }
  return null;
}

/**
 * Screen an event's parameters against the allowlist and the PII patterns.
 *
 * Never throws: an analytics call must not be able to break a user-facing flow.
 * Rejections are reported in the returned object so the caller can surface them
 * during development.
 */
export function scrubEventParams(
  eventName: AnalyticsEventName | string,
  input: Record<string, unknown> | null | undefined,
): ScrubResult {
  const result: ScrubResult = {
    params: {},
    droppedUnknownKeys: [],
    droppedForbiddenKeys: [],
    droppedForbiddenValues: [],
    clean: true,
  };
  if (!input) return result;

  for (const [rawKey, rawValue] of Object.entries(input)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;

    if (isForbiddenKey(rawKey)) {
      result.droppedForbiddenKeys.push(rawKey);
      result.clean = false;
      continue;
    }
    if (!isPlainValue(rawValue)) {
      // Objects/arrays (e.g. an items array) are flattened away rather than
      // JSON-serialised, because serialisation is how nested PII escapes.
      result.droppedUnknownKeys.push(rawKey);
      result.clean = false;
      continue;
    }
    if (!(ALLOWED_EVENT_PARAMS as readonly string[]).includes(rawKey)) {
      result.droppedUnknownKeys.push(rawKey);
      result.clean = false;
      continue;
    }
    const violation = detectForbiddenValue(rawValue);
    if (violation) {
      result.droppedForbiddenValues.push({ key: rawKey, label: violation });
      result.clean = false;
      continue;
    }
    // Normalise the key to snake_case-consistent allowlist spelling.
    result.params[rawKey] = typeof rawValue === 'string' ? rawValue.slice(0, 200) : rawValue;
  }

  if (!result.clean && typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[analytics] "${eventName}" had parameters removed before transmission:`,
      {
        unknownKeys: result.droppedUnknownKeys,
        forbiddenKeys: result.droppedForbiddenKeys,
        forbiddenValues: result.droppedForbiddenValues,
      },
    );
  }
  return result;
}

/** True when the name is part of the closed event vocabulary. */
export function isAllowedEventName(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}

/**
 * Page-type classification used for the `page_type` parameter and for
 * `visa_page_view` / `ielts_page_view` derivation. Kept explicit rather than
 * guessed so reporting groups match ALO's own IA.
 */
export type PageType =
  | 'home'
  | 'course_list'
  | 'course_detail'
  | 'university_list'
  | 'university_detail'
  | 'country'
  | 'destination'
  | 'visa'
  | 'english_test'
  | 'ielts'
  | 'scholarship'
  | 'blog'
  | 'contact'
  | 'office'
  | 'student_portal'
  | 'partner_portal'
  | 'admin'
  | 'legal'
  | 'other';

const PAGE_TYPE_RULES: { pattern: RegExp; type: PageType }[] = [
  { pattern: /^\/$/, type: 'home' },
  { pattern: /^\/course-finder/, type: 'course_list' },
  { pattern: /^\/courses?$/, type: 'course_list' },
  { pattern: /^\/course\//, type: 'course_detail' },
  { pattern: /^\/universities$/, type: 'university_list' },
  { pattern: /^\/university\//, type: 'university_detail' },
  { pattern: /^\/scholarship/, type: 'scholarship' },
  { pattern: /^\/(?:uk|usa|canada|australia|ireland|new-zealand|nz|dubai|uae|europe|germany|malaysia|singapore)(?:\/|$)/, type: 'country' },
  { pattern: /^\/destinations?(?:\/|$)/, type: 'destination' },
  { pattern: /visa/, type: 'visa' },
  { pattern: /ielts/, type: 'ielts' },
  { pattern: /^\/english-test/, type: 'english_test' },
  { pattern: /^\/language-prep/, type: 'english_test' },
  { pattern: /^\/blog/, type: 'blog' },
  { pattern: /^\/contact/, type: 'contact' },
  { pattern: /^\/global-offices/, type: 'office' },
  { pattern: /^\/student/, type: 'student_portal' },
  { pattern: /^\/parent-portal/, type: 'student_portal' },
  { pattern: /^\/partner/, type: 'partner_portal' },
  { pattern: /^\/(?:admin|crm|employee|hr|hrm)/, type: 'admin' },
  { pattern: /^\/(?:privacy|terms|refund|accessibility|disclaimer|cookie)/, type: 'legal' },
];

/** Classify a pathname into ALO's page-type taxonomy. */
export function detectPageType(pathname: string): PageType {
  const path = (pathname || '/').split('?')[0].split('#')[0];
  for (const rule of PAGE_TYPE_RULES) {
    if (rule.pattern.test(path)) return rule.type;
  }
  return 'other';
}

/**
 * Events that are implied purely by the page a visitor landed on. Used by the
 * route-level emitter so `/uk/student-visa` reports `visa_page_view` without
 * every page component needing its own instrumentation call.
 */
export function pageViewEventsFor(pathname: string): AnalyticsEventName[] {
  const type = detectPageType(pathname);
  const events: AnalyticsEventName[] = [];
  if (type === 'visa') events.push('visa_page_view');
  if (type === 'ielts' || type === 'english_test') events.push('ielts_page_view');
  return events;
}

/** Extract only the referrer's origin — never a full referrer URL with query strings. */
export function referrerDomain(referrer: string | null | undefined): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    // A bare hostname or an unparseable value contributes nothing safe.
    return '';
  }
}
