/**
 * Google Free Stack — unit tests.
 *
 * Concentrated on the places where getting it wrong is expensive and invisible:
 *
 *   - PII screening (a leak to GA4 cannot be undone)
 *   - attribution first-touch immutability (a later direct visit must not erase
 *     the campaign that actually produced the lead)
 *   - tag-loader mutual exclusion (two loaders means every page_view counted
 *     twice, which silently halves every conversion rate)
 *   - NOT_CONFIGURED honesty (an integration that reports success without
 *     credentials is worse than no integration, because someone will act on it)
 *   - funnel joins (a broken join looks exactly like a bad conversion rate)
 *
 * No database and no network: `buildConversionFunnel` receives a stub client and
 * the conversion sender is exercised only on its guard paths.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  ALLOWED_EVENT_PARAMS,
  ANALYTICS_EVENT_NAMES,
  FORBIDDEN_PARAM_PATTERNS,
  detectPageType,
  extractDetailSlug,
  isForbiddenKey,
  pageViewEventsFor,
  referrerDomain,
  scrubEventParams,
} from '@/lib/analytics/events';
import {
  captureAttribution,
  describeAttribution,
  emptyLeadAttribution,
  mergeAttribution,
  newLeadAttribution,
  toLeadColumns,
  toLeadFormColumns,
} from '@/lib/attribution/lead-attribution';
import { classifyContactHref } from '@/components/analytics/AnalyticsClickTracker';
import {
  GOOGLE_SERVICE_COSTS,
  getGoogleStackConfig,
  isPlaceholderTagId,
  resolveTagLoader,
} from '@/lib/google/config';
import { deriveClientId, sendServerEvent } from '@/lib/analytics/server-conversions';
import {
  ENROLLED_APPLICATION_STAGES,
  buildConversionFunnel,
  groupKeyFor,
} from '@/lib/analytics/conversion-funnel';
import { describeGoogleCredential, resolveGoogleCredential } from '@/lib/google/oauth';
import { describeCredential, encodeSiteUrl } from '@/lib/seo/search-console-client';
import { summarizeHours } from '@/lib/google/business-profile';
import { isValidVideoId, thumbnailUrl } from '@/components/website/YouTubeEmbed';

/** An environment with no Google configuration at all. */
const BARE_ENV = { NODE_ENV: 'production' } as unknown as NodeJS.ProcessEnv;

const FULL_URL =
  'https://aloeducation.com/destinations/uk?utm_source=google&utm_medium=cpc&utm_campaign=uk_fall_2026' +
  '&utm_content=hero_banner&utm_term=study+abroad+uk&gclid=CLIP123&fbclid=FBC456';

// ─────────────────────────────────────────────────────────────
// 1. Page-type detection against the REAL route tree
// ─────────────────────────────────────────────────────────────

describe('detectPageType — real ALO routes', () => {
  it('classifies the public marketing pages', () => {
    expect(detectPageType('/')).toBe('home');
    expect(detectPageType('/contact')).toBe('contact');
    expect(detectPageType('/faqs')).toBe('contact');
    expect(detectPageType('/apply')).toBe('apply');
    expect(detectPageType('/course-finder')).toBe('course_list');
    expect(detectPageType('/courses')).toBe('course_list');
    expect(detectPageType('/compare')).toBe('course_list');
    expect(detectPageType('/eligibility-check')).toBe('course_list');
    expect(detectPageType('/universities')).toBe('university_list');
    expect(detectPageType('/scholarships')).toBe('scholarship_list');
    expect(detectPageType('/destinations')).toBe('country');
    expect(detectPageType('/blog')).toBe('blog');
    expect(detectPageType('/guides')).toBe('guide');
    expect(detectPageType('/global-offices')).toBe('office');
    expect(detectPageType('/book-consultation')).toBe('consultation');
    expect(detectPageType('/login')).toBe('auth');
    expect(detectPageType('/register')).toBe('auth');
    expect(detectPageType('/privacy-policy')).toBe('legal');
  });

  it('classifies detail pages by their real, inconsistent slugs', () => {
    // /course is singular but /universities is plural — a guessed taxonomy would
    // have silently reported every university page as something else.
    expect(detectPageType('/course/computer-science-manchester')).toBe('course_detail');
    expect(detectPageType('/universities/university-of-manchester')).toBe('university_detail');
    expect(detectPageType('/scholarships/chevening')).toBe('scholarship_detail');
  });

  it('classifies destination pages and their sub-pages as country pages', () => {
    expect(detectPageType('/destinations/uk')).toBe('country');
    expect(detectPageType('/destinations/uk/courses')).toBe('country');
    expect(detectPageType('/destinations/uk/visa-guide')).toBe('country');
    expect(detectPageType('/destinations/uk/scholarships')).toBe('country');
  });

  it('classifies visa and language-test pages', () => {
    expect(detectPageType('/visa')).toBe('visa');
    expect(detectPageType('/language-prep')).toBe('english_test');
    expect(detectPageType('/language-prep/ielts')).toBe('ielts');
    expect(detectPageType('/language-prep/ielts-ukvi')).toBe('ielts');
    expect(detectPageType('/english-test-prep')).toBe('english_test');
    expect(detectPageType('/english-tests')).toBe('english_test');
    // Every language-prep sub-page is an English-test page. PTE, TOEFL, Duolingo
    // and the rest share the /language-prep parent, and only IELTS is broken out
    // separately because the specification asks for its own event.
    expect(detectPageType('/language-prep/pte-academic')).toBe('english_test');
    expect(detectPageType('/language-prep/toefl-ibt')).toBe('english_test');
    expect(detectPageType('/language-prep/comparison')).toBe('english_test');
  });

  it('does not mistake a prefix for a page', () => {
    expect(detectPageType('/coursework')).toBe('other');
    expect(detectPageType('/apply-now-somewhere')).toBe('other');
    expect(detectPageType('/blogging-tips')).toBe('other');
  });

  it('separates staff and tenant portals from public marketing pages', () => {
    // /counselor is a STAFF portal, not a public "counselor request" page.
    expect(detectPageType('/counselor/dashboard')).toBe('staff_portal');
    expect(detectPageType('/super-admin/dashboard')).toBe('staff_portal');
    expect(detectPageType('/dashboard')).toBe('staff_portal');
    expect(detectPageType('/application-manager/queue')).toBe('staff_portal');
    expect(detectPageType('/review/sometoken')).toBe('staff_portal');
    expect(detectPageType('/student')).toBe('student_portal');
    expect(detectPageType('/parent-portal')).toBe('student_portal');
    expect(detectPageType('/partner')).toBe('partner_portal');
    expect(detectPageType('/admin/google-stack')).toBe('admin');
    expect(detectPageType('/crm/seo-manager')).toBe('admin');
  });

  it('ignores query strings and fragments', () => {
    expect(detectPageType('/destinations/uk?utm_source=google')).toBe('country');
    expect(detectPageType('/course/x#fees')).toBe('course_detail');
  });
});

describe('extractDetailSlug', () => {
  it('returns the slug for the requested kind only', () => {
    expect(extractDetailSlug('/course/computer-science-manchester', 'course')).toBe('computer-science-manchester');
    expect(extractDetailSlug('/universities/university-of-manchester', 'university')).toBe('university-of-manchester');
    expect(extractDetailSlug('/scholarships/chevening', 'scholarship')).toBe('chevening');
  });

  it('returns an empty string for a mismatched kind, so a course_slug can never be attached to a university view', () => {
    expect(extractDetailSlug('/universities/manchester', 'course')).toBe('');
    expect(extractDetailSlug('/course/manchester', 'university')).toBe('');
    expect(extractDetailSlug('/courses', 'course')).toBe('');
    expect(extractDetailSlug('/', 'course')).toBe('');
  });

  it('decodes the slug and stops at the first segment', () => {
    expect(extractDetailSlug('/course/computer%20science', 'course')).toBe('computer science');
    expect(extractDetailSlug('/universities/manchester/fees', 'university')).toBe('manchester');
  });
});

describe('pageViewEventsFor — route-derived events cannot be forgotten or doubled', () => {
  it('emits course_view / university_view from the route alone', () => {
    expect(pageViewEventsFor('/course/x')).toContain('course_view');
    expect(pageViewEventsFor('/universities/x')).toContain('university_view');
    expect(pageViewEventsFor('/scholarships/x')).toContain('scholarship_view');
  });

  it('emits visa_page_view for a visa page AND for a country page that carries a visa guide', () => {
    expect(pageViewEventsFor('/visa')).toContain('visa_page_view');
    expect(pageViewEventsFor('/destinations/uk/visa-guide')).toContain('visa_page_view');
    expect(pageViewEventsFor('/destinations/uk')).not.toContain('visa_page_view');
  });

  it('emits ielts_page_view for IELTS and language-prep pages', () => {
    expect(pageViewEventsFor('/language-prep/ielts')).toContain('ielts_page_view');
    expect(pageViewEventsFor('/language-prep/ielts-ukvi')).toContain('ielts_page_view');
    expect(pageViewEventsFor('/english-tests')).toContain('ielts_page_view');
  });

  it('emits nothing for a page that implies no service event', () => {
    expect(pageViewEventsFor('/')).toEqual([]);
    expect(pageViewEventsFor('/admin/google-stack')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. PII screening — the rule that cannot be violated
// ─────────────────────────────────────────────────────────────

describe('scrubEventParams — no PII ever reaches GA4', () => {
  it('passes allowed params through unchanged', () => {
    const result = scrubEventParams('course_view', {
      course_slug: 'computer-science',
      destination: 'United Kingdom',
      page_type: 'course_detail',
    });
    expect(result.params).toEqual({
      course_slug: 'computer-science',
      destination: 'United Kingdom',
      page_type: 'course_detail',
    });
    expect(result.clean).toBe(true);
  });

  it('drops every forbidden personal identifier by key', () => {
    const forbidden: Record<string, string> = {
      passport_number: 'A1234567',
      passport: 'A1234567',
      nid: '1990123456789',
      national_id: '9876543210',
      password: 'hunter2',
      credit_card: '4111111111111111',
      card_number: '5500000000000004',
      bank_account: '12345',
      dob: '1998-04-01',
      date_of_birth: '1998-04-01',
      mother_name: 'Ayesha',
      father_name: 'Karim',
      address_line: '68/69 Green Road',
      document_url: 'https://cdn.example/passport.pdf',
      transcript: 'text',
      cv_file: 'binary',
      secret_key: 'abc',
      api_key: 'def',
      access_token: 'ghi',
    };
    for (const key of Object.keys(forbidden)) {
      expect(isForbiddenKey(key), `${key} must be blocked`).toBe(true);
    }
    const result = scrubEventParams('lead_form_submit', { course_slug: 'ok', ...forbidden });
    expect(Object.keys(result.params)).toEqual(['course_slug']);
    expect(result.droppedForbiddenKeys).toHaveLength(Object.keys(forbidden).length);
    expect(result.clean).toBe(false);
  });

  it('the forbidden pattern list covers the identifiers the specification names', () => {
    const sources = FORBIDDEN_PARAM_PATTERNS.map((pattern) => pattern.source).join('|');
    for (const needle of ['passport', 'nid', 'national', 'password', 'card', 'bank', 'birth', 'document', 'transcript', 'cv', 'token', 'secret']) {
      expect(sources, `blocklist must cover ${needle}`).toContain(needle);
    }
  });

  it('drops any param outside the allowlist', () => {
    const result = scrubEventParams('page_view', { page_type: 'home', something_invented: 'value' });
    expect(result.params).toEqual({ page_type: 'home' });
    expect(result.droppedUnknownKeys).toEqual(['something_invented']);
  });

  it('drops non-primitive values so an object can never be serialised into a param', () => {
    const result = scrubEventParams('course_view', {
      course_slug: 'ok',
      items_count: 3,
      nested: { passport: 'A1234567' },
      list: ['a', 'b'],
    });
    expect(result.params).toEqual({ course_slug: 'ok', items_count: 3 });
    expect(result.droppedUnknownKeys.sort()).toEqual(['list', 'nested']);
  });

  it('rejects an over-long free-text value rather than truncating it', () => {
    // Truncating would keep 200 characters of whatever the visitor typed into a
    // search box. Rejecting the value entirely is the safer behaviour.
    const result = scrubEventParams('course_view', { course_slug: 'x'.repeat(500) });
    expect(result.params).toEqual({});
    expect(result.droppedForbiddenValues).toEqual([{ key: 'course_slug', label: 'over-long free text' }]);
  });

  it('rejects a value that looks like an email or phone number even under an allowed key', () => {
    const email = scrubEventParams('course_view', { course_slug: 'student@aloeducation.com' });
    expect(email.params).toEqual({});
    expect(email.droppedForbiddenValues.length).toBe(1);
    const phone = scrubEventParams('course_view', { destination: '+8801700000000' });
    expect(phone.params).toEqual({});
  });

  it('ignores null, undefined and empty-string values instead of sending them', () => {
    const result = scrubEventParams('course_view', {
      course_slug: 'ok',
      destination: null,
      country: undefined,
      page_type: '',
    });
    expect(result.params).toEqual({ course_slug: 'ok' });
    expect(result.clean).toBe(true);
  });

  it('never throws on hostile input', () => {
    expect(() => scrubEventParams('page_view', null)).not.toThrow();
    expect(() => scrubEventParams('page_view', undefined)).not.toThrow();
    expect(scrubEventParams('page_view', null).params).toEqual({});
  });

  it('every required event in the specification is in the catalogue', () => {
    const required = [
      'page_view', 'course_search', 'course_view', 'university_search', 'university_view',
      'lead_form_start', 'lead_form_submit', 'whatsapp_click', 'phone_click', 'email_click',
      'counselor_request', 'application_start', 'application_submit', 'student_registration',
      'student_login', 'visa_page_view', 'ielts_page_view', 'english_test_start',
      'english_test_complete',
    ];
    for (const event of required) {
      expect(ANALYTICS_EVENT_NAMES, `missing required event ${event}`).toContain(event);
    }
  });

  it('the business conversion events are in the catalogue too', () => {
    for (const event of ['generate_lead', 'lead_qualified', 'application_started', 'application_submitted', 'enrollment_completed']) {
      expect(ANALYTICS_EVENT_NAMES, `missing ${event}`).toContain(event);
    }
  });

  it('every required parameter is in the allowlist', () => {
    const required = [
      'course_id', 'course_slug', 'university_id', 'university_slug', 'country',
      'destination', 'page_type', 'lead_source', 'campaign',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'landing_page',
    ];
    const result = scrubEventParams('page_view', Object.fromEntries(required.map((key) => [key, 'v'])));
    expect(Object.keys(result.params).sort()).toEqual([...required].sort());
    expect(result.droppedUnknownKeys).toEqual([]);
    for (const key of required) {
      expect(ALLOWED_EVENT_PARAMS, `missing param ${key}`).toContain(key);
    }
  });
});

describe('referrerDomain', () => {
  it('reduces a referrer to its hostname', () => {
    expect(referrerDomain('https://www.google.com/search?q=study+abroad&safe=off')).toBe('www.google.com');
    expect(referrerDomain('https://mail.google.com/mail/u/0/#inbox?token=secret')).toBe('mail.google.com');
  });

  it('returns an empty string for anything unparseable rather than passing it through', () => {
    expect(referrerDomain('')).toBe('');
    expect(referrerDomain(null)).toBe('');
    expect(referrerDomain(undefined)).toBe('');
    expect(referrerDomain('not a url')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Contact-click classification
// ─────────────────────────────────────────────────────────────

describe('classifyContactHref', () => {
  it('classifies the three contact channels', () => {
    expect(classifyContactHref('https://wa.me/8801805020100?text=Hi')?.event).toBe('whatsapp_click');
    expect(classifyContactHref('https://api.whatsapp.com/send?phone=8801805020100')?.event).toBe('whatsapp_click');
    expect(classifyContactHref('tel:+8801327189194')?.event).toBe('phone_click');
    expect(classifyContactHref('mailto:info@aloeducation.com?subject=Hi')?.event).toBe('email_click');
  });

  it('returns null for anything that is not a contact link', () => {
    expect(classifyContactHref('https://example.com/contact')).toBeNull();
    expect(classifyContactHref('/contact')).toBeNull();
    expect(classifyContactHref('')).toBeNull();
    expect(classifyContactHref(null)).toBeNull();
    expect(classifyContactHref(undefined)).toBeNull();
    expect(classifyContactHref('#section')).toBeNull();
    expect(classifyContactHref('javascript:void(0)')).toBeNull();
  });

  it('does not treat a look-alike host as WhatsApp', () => {
    expect(classifyContactHref('https://evil.com/wa.me')).toBeNull();
    expect(classifyContactHref('https://wa.me.evil.com/1234')).toBeNull();
    expect(classifyContactHref('https://notwa.me/1234')).toBeNull();
  });

  it('is case-insensitive about the scheme and host', () => {
    expect(classifyContactHref('TEL:+8801327189194')?.event).toBe('phone_click');
    expect(classifyContactHref('MAILTO:info@aloeducation.com')?.event).toBe('email_click');
    expect(classifyContactHref('HTTPS://WA.ME/8801805020100')?.event).toBe('whatsapp_click');
  });

  it('never exposes the WhatsApp pre-filled message, which can contain the visitor\u2019s own words', () => {
    const result = classifyContactHref(
      'https://wa.me/8801805020100?text=My%20name%20is%20Rahim%20and%20my%20passport%20is%20A1234567',
    );
    expect(result?.event).toBe('whatsapp_click');
    expect(JSON.stringify(result)).not.toContain('Rahim');
    expect(JSON.stringify(result)).not.toContain('A1234567');
  });

  it('never exposes the email address or the phone number', () => {
    const email = classifyContactHref('mailto:admissions@aloeducation.com');
    expect(JSON.stringify(email)).not.toContain('admissions@');
    const phone = classifyContactHref('tel:+8801327189194');
    expect(JSON.stringify(phone)).not.toContain('8801327189194');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Attribution capture and merge
// ─────────────────────────────────────────────────────────────

describe('captureAttribution', () => {
  it('captures every utm field plus the click identifiers', () => {
    const record = captureAttribution({ url: FULL_URL });
    expect(record).toMatchObject({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'uk_fall_2026',
      utmContent: 'hero_banner',
      utmTerm: 'study abroad uk',
      gclid: 'CLIP123',
      fbclid: 'FBC456',
      paidClick: true,
      captured: true,
    });
  });

  it('records the landing page as path plus query, so the campaign survives with it', () => {
    const record = captureAttribution({ url: FULL_URL });
    expect(record.landingPage).toBe('/destinations/uk?utm_source=google&utm_medium=cpc&utm_campaign=uk_fall_2026&utm_content=hero_banner&utm_term=study+abroad+uk&gclid=CLIP123&fbclid=FBC456');
  });

  it('reduces the referrer to a hostname so no path or query leaks', () => {
    const record = captureAttribution({
      url: 'https://aloeducation.com/',
      referer: 'https://mail.google.com/mail/u/0/#inbox?private=token',
    });
    expect(record.referrer).toBe('mail.google.com');
    expect(record.referrer).not.toContain('token');
    expect(record.referrer).not.toContain('inbox');
  });

  it('does NOT invent a source or medium from a paid-click identifier', () => {
    // A gclid proves a Google Ads click, but writing source='google' would put a
    // derived guess into a column that ALO reserves for its own acquisition
    // channel. The fact is recorded as paidClick instead.
    const record = captureAttribution({ url: 'https://aloeducation.com/?gclid=ABC' });
    expect(record.paidClick).toBe(true);
    expect(record.source).toBeNull();
    expect(record.medium).toBeNull();
    expect(record.utmSource).toBeNull();
  });

  it('takes source, content and term only from an explicit body field, never from utm', () => {
    const record = captureAttribution({
      url: 'https://aloeducation.com/?utm_source=google&utm_term=keyword',
      body: { lead_source: 'WEBSITE', content: 'hero', term: 'body-term' },
    });
    expect(record.source).toBe('WEBSITE');
    expect(record.content).toBe('hero');
    expect(record.term).toBe('body-term');
    expect(record.utmSource).toBe('google');
    expect(record.utmTerm).toBe('keyword');
  });

  it('marks nothing captured when there is no signal at all', () => {
    const record = captureAttribution({});
    expect(record.captured).toBe(false);
    expect(record).toEqual(emptyLeadAttribution());
  });

  it('treats a bare path with no attribution as captured, because the landing page is itself a signal', () => {
    expect(captureAttribution({ url: 'https://aloeducation.com/destinations/uk' }).captured).toBe(true);
    expect(captureAttribution({ url: 'https://aloeducation.com/destinations/uk' }).landingPage).toBe('/destinations/uk');
  });

  it('strips control characters and bounds every value to VARCHAR(191)', () => {
    const dirty = captureAttribution({ url: 'https://aloeducation.com/?utm_source=bad%00value%0A%07' });
    expect(dirty.utmSource).not.toMatch(/[\u0000-\u001f\u007f]/);
    const long = captureAttribution({ url: `https://aloeducation.com/?utm_campaign=${'a'.repeat(400)}` });
    expect(long.utmCampaign?.length).toBeLessThanOrEqual(191);
    expect(long.landingPage?.length).toBeLessThanOrEqual(191);
  });

  it('an unparseable URL contributes nothing rather than throwing', () => {
    expect(() => captureAttribution({ url: 'http://[' })).not.toThrow();
    expect(captureAttribution({ url: 'http://[' }).captured).toBe(false);
  });

  it('carries the visitor id through as the GA4-session to CRM-lead join key', () => {
    const record = captureAttribution({ url: 'https://aloeducation.com/?utm_source=google', visitorId: 'alo_v_abc123' });
    expect(record.visitorId).toBe('alo_v_abc123');
  });

  it('URL values beat posted body values, because a form field is trivially forgeable', () => {
    const record = captureAttribution({
      url: 'https://aloeducation.com/?utm_source=google',
      body: { utmSource: 'facebook', utm_source: 'facebook', utmCampaign: 'from-form' },
    });
    expect(record.utmSource).toBe('google');
    // A field absent from the URL still comes from the body.
    expect(record.utmCampaign).toBe('from-form');
  });
});

describe('mergeAttribution — first touch is immutable, last touch advances', () => {
  const googleVisit = captureAttribution({ url: 'https://aloeducation.com/?utm_source=google&utm_medium=organic' });
  const facebookVisit = captureAttribution({ url: 'https://aloeducation.com/?utm_source=facebook&utm_medium=cpc' });

  it('seeds both touches on a lead with no attribution', () => {
    const merged = newLeadAttribution(googleVisit, new Date('2026-02-01T00:00:00Z'));
    expect(merged).toMatchObject({
      utmSource: 'google',
      firstTouchSource: 'google',
      firstTouchMedium: 'organic',
      lastTouchSource: 'google',
      lastTouchMedium: 'organic',
    });
    expect(merged.firstTouchAt).toEqual(new Date('2026-02-01T00:00:00Z'));
    expect(merged.lastTouchAt).toEqual(new Date('2026-02-01T00:00:00Z'));
  });

  it('never overwrites an existing first touch', () => {
    const merged = mergeAttribution(facebookVisit, {
      firstTouchSource: 'google',
      firstTouchAt: new Date('2026-01-01T00:00:00Z'),
      lastTouchSource: 'google',
      lastTouchAt: new Date('2026-01-01T00:00:00Z'),
    }, new Date('2026-03-01T00:00:00Z'));

    // The columns that would rewrite first touch are simply absent, so a Prisma
    // update cannot touch them at all.
    expect(merged).not.toHaveProperty('firstTouchSource');
    expect(merged).not.toHaveProperty('firstTouchAt');
    // Last touch DOES advance — that is the point of keeping both.
    expect(merged.lastTouchSource).toBe('facebook');
    expect(merged.lastTouchAt).toEqual(new Date('2026-03-01T00:00:00Z'));
    expect(merged.utmSource).toBe('facebook');
  });

  it('advances last touch to the new campaign while first touch stays put', () => {
    const spring = captureAttribution({ url: 'https://aloeducation.com/?utm_source=google&utm_campaign=spring' });
    const merged = mergeAttribution(spring, {
      firstTouchSource: 'google',
      firstTouchAt: new Date('2026-01-01'),
      lastTouchSource: 'google',
      lastTouchAt: new Date('2026-01-01'),
    });
    expect(merged.utmCampaign).toBe('spring');
    expect(merged.lastTouchSource).toBe('google');
    expect(merged).not.toHaveProperty('firstTouchCampaign');
  });

  it('returns an empty object when nothing new was captured, so a returning direct visitor cannot blank existing attribution', () => {
    const nothing = captureAttribution({});
    expect(nothing.captured).toBe(false);
    expect(
      mergeAttribution(nothing, {
        firstTouchSource: 'google',
        firstTouchAt: new Date('2026-01-01'),
        lastTouchSource: 'google',
        lastTouchAt: new Date('2026-01-01'),
      }),
    ).toEqual({});
  });

  it('seeds first touch when the lead exists but has no first-touch columns yet', () => {
    const merged = mergeAttribution(googleVisit, {});
    expect(merged.firstTouchSource).toBe('google');
    expect(merged.firstTouchAt).toBeInstanceOf(Date);
  });
});

describe('attribution projections', () => {
  const captured = captureAttribution({
    url: 'https://aloeducation.com/destinations/uk?utm_source=google&utm_medium=cpc&utm_campaign=uk_fall',
    referer: 'https://www.google.com/',
    visitorId: 'alo_v_123',
  });

  it('emptyLeadAttribution is all nulls and not captured', () => {
    const empty = emptyLeadAttribution();
    expect(empty.captured).toBe(false);
    expect(empty.paidClick).toBe(false);
    expect(empty.utmSource).toBeNull();
    expect(empty.landingPage).toBeNull();
  });

  it('toLeadColumns maps every captured value onto Lead columns', () => {
    const columns = toLeadColumns(captured);
    expect(columns).toMatchObject({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'uk_fall',
      referrer: 'www.google.com',
      visitorId: 'alo_v_123',
      gclid: null,
    });
    expect(columns.landingPage).toContain('/destinations/uk');
  });

  it('toLeadColumns yields nulls, not empty strings, when nothing was captured', () => {
    const columns = toLeadColumns(emptyLeadAttribution());
    expect(columns.utmSource).toBeNull();
    expect(columns.visitorId).toBeNull();
    expect(columns.firstTouchSource ?? null).toBeNull();
  });

  it('toLeadFormColumns defaults to empty strings for the VARCHAR columns, never null', () => {
    const columns = toLeadFormColumns(emptyLeadAttribution());
    expect(columns.utmSource).toBe('');
    expect(columns.landingPage).toBe('');
    expect(Object.values(columns).every((value) => value === '')).toBe(true);
    const filled = toLeadFormColumns(captured);
    expect(filled).toMatchObject({ utmSource: 'google', utmMedium: 'cpc', referrer: 'www.google.com' });
  });

  it('describeAttribution is log-safe and says so when nothing was captured', () => {
    expect(describeAttribution(emptyLeadAttribution())).toBe('no attribution captured');
    const described = describeAttribution(captured);
    expect(described).toContain('google');
    expect(described).toContain('uk_fall');
    // The visitor token is an internal join key and must not appear in an audit
    // string that is rendered in an admin UI.
    expect(described).not.toContain('alo_v_123');
    expect(described.length).toBeLessThan(400);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Tag loader — the double-counting guard
// ─────────────────────────────────────────────────────────────

describe('resolveTagLoader — GTM and gtag are mutually exclusive', () => {
  it('prefers GTM when both are configured, so page_view can never double-fire', () => {
    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234',
      GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never);
    const loader = resolveTagLoader(config);
    expect(loader.loader).toBe('gtm');
    expect(loader.id).toBe('GTM-ABC1234');
    expect(config.ga4.injectTags).toBe(false);
    expect(config.gtm.injectTags).toBe(true);
    expect(loader.reason).toMatch(/NOT injected/i);
  });

  it('falls back to gtag when only GA4 is configured', () => {
    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never);
    const loader = resolveTagLoader(config);
    expect(loader.loader).toBe('gtag');
    expect(loader.id).toBe('G-AB12CD34EF');
  });

  it('injects nothing when neither is configured', () => {
    const config = getGoogleStackConfig(BARE_ENV);
    expect(resolveTagLoader(config).loader).toBe('none');
  });

  it('injects nothing in development or test, even when fully configured', () => {
    for (const environment of ['development', 'test']) {
      const config = getGoogleStackConfig({
        NODE_ENV: environment,
        NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234',
        GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
        NEXT_PUBLIC_GA4_ENABLED: 'true',
      } as never);
      expect(resolveTagLoader(config).loader).toBe('none');
      expect(config.ga4.injectTags).toBe(false);
      expect(config.gtm.injectTags).toBe(false);
      expect(config.ga4.reason).toMatch(/SUPPRESSED|NOT CONFIGURED|DISABLED/);
    }
  });

  it('refuses a non-production deployment unless explicitly opted in', () => {
    const env = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never;
    expect(resolveTagLoader(getGoogleStackConfig(env)).loader).toBe('none');
    const optedIn = { ...env, ANALYTICS_ALLOW_NON_PRODUCTION: 'true' } as never;
    expect(resolveTagLoader(getGoogleStackConfig(optedIn)).loader).toBe('gtag');
  });

  it('honours NEXT_PUBLIC_GTM_ENABLED=false while keeping the id configured', () => {
    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234',
      NEXT_PUBLIC_GTM_ENABLED: 'false',
      GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never);
    expect(config.gtm.injectTags).toBe(false);
    // With GTM disabled the loader must fall through to gtag, not to nothing.
    expect(resolveTagLoader(config).loader).toBe('gtag');
  });

  it('ignores a malformed id rather than emitting it to the page', () => {
    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_GTM_ID: 'GTM-short',
      GA4_MEASUREMENT_ID: 'not-an-id',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never);
    expect(config.gtm.enabled).toBe(false);
    expect(config.ga4.enabled).toBe(false);
    expect(resolveTagLoader(config).loader).toBe('none');
  });

  it('rejects the documentation placeholder ids, which would inject a container that does not exist', () => {
    expect(isPlaceholderTagId('GTM-XXXXXXX')).toBe(true);
    expect(isPlaceholderTagId('G-XXXXXXXXXX')).toBe(true);
    expect(isPlaceholderTagId('GTM-ABC1234')).toBe(false);
    expect(isPlaceholderTagId('G-AB12CD34EF')).toBe(false);

    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_GTM_ID: 'GTM-XXXXXXX',
      GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',
      NEXT_PUBLIC_GA4_ENABLED: 'true',
    } as never);
    expect(config.gtm.enabled).toBe(false);
    expect(config.ga4.enabled).toBe(false);
    expect(resolveTagLoader(config).loader).toBe('none');
    expect(config.gtm.reason).toContain('placeholder');
    expect(config.ga4.reason).toContain('placeholder');
  });

  it('classifies every cost tier correctly, and nothing ALO uses is PAID', () => {
    expect(GOOGLE_SERVICE_COSTS.GA4.tier).toBe('FREE');
    expect(GOOGLE_SERVICE_COSTS.GTM.tier).toBe('FREE');
    expect(GOOGLE_SERVICE_COSTS.SEARCH_CONSOLE.tier).toBe('FREE');
    expect(GOOGLE_SERVICE_COSTS.BUSINESS_PROFILE.tier).toBe('FREE');
    expect(GOOGLE_SERVICE_COSTS.YOUTUBE.tier).toBe('FREE');
    expect(GOOGLE_SERVICE_COSTS.MAPS.tier).toBe('PAID');
    expect(GOOGLE_SERVICE_COSTS.MAPS.billingAccountRequired).toBe(true);
    expect(GOOGLE_SERVICE_COSTS.CLOUD_RUN.tier).toBe('FREE_TIER');
    expect(GOOGLE_SERVICE_COSTS.CLOUD_RUN.billingAccountRequired).toBe(true);
    // The free-first mandate: both paid services are optional.
    expect(GOOGLE_SERVICE_COSTS.MAPS.optional).toBe(true);
    expect(GOOGLE_SERVICE_COSTS.CLOUD_RUN.optional).toBe(true);
    for (const service of ['GA4', 'GTM', 'SEARCH_CONSOLE', 'BUSINESS_PROFILE', 'YOUTUBE'] as const) {
      expect(GOOGLE_SERVICE_COSTS[service].billingAccountRequired, `${service} must not need billing`).toBe(false);
    }
  });

  it('reports the organisation schema and site verification configuration without echoing secrets', () => {
    const config = getGoogleStackConfig({
      NODE_ENV: 'production',
      GOOGLE_SITE_VERIFICATION_TOKEN: 'verify-token-123',
    } as never);
    expect(config.siteVerificationToken).toBe('verify-token-123');
    expect(getGoogleStackConfig(BARE_ENV).siteVerificationToken).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Credential resolution — NOT_CONFIGURED honesty
// ─────────────────────────────────────────────────────────────

describe('Google credential resolution', () => {
  it('reports none when nothing is configured', () => {
    expect(resolveGoogleCredential(BARE_ENV).mode).toBe('none');
    expect(describeGoogleCredential(BARE_ENV).configured).toBe(false);
    expect(describeGoogleCredential(BARE_ENV).reason).toContain('NOT CONFIGURED');
  });

  it('parses an inline service-account JSON', () => {
    const key = JSON.stringify({
      type: 'service_account',
      client_email: 'alo@project.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n',
    });
    const credential = resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: key } as never);
    expect(credential.mode).toBe('service_account');
    expect(credential.serviceAccount?.client_email).toBe('alo@project.iam.gserviceaccount.com');
  });

  it('normalises the escaped newlines Google puts in an exported key', () => {
    const key = JSON.stringify({
      client_email: 'alo@p.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nMIIE\\n-----END PRIVATE KEY-----\\n',
    });
    const credential = resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: key } as never);
    expect(credential.serviceAccount?.private_key).toContain('\n');
    expect(credential.serviceAccount?.private_key).not.toContain('\\n');
  });

  it('parses a base64-wrapped service-account JSON', () => {
    const key = Buffer.from(
      JSON.stringify({ client_email: 'alo@p.iam.gserviceaccount.com', private_key: 'KEY' }),
    ).toString('base64');
    expect(resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: key } as never).mode).toBe('service_account');
  });

  it('prefers the Search Console credential variable when both are set', () => {
    const scKey = JSON.stringify({ client_email: 'sc@p.iam.gserviceaccount.com', private_key: 'A' });
    const otherKey = JSON.stringify({ client_email: 'other@p.iam.gserviceaccount.com', private_key: 'B' });
    const credential = resolveGoogleCredential({
      GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON: scKey,
      GOOGLE_SERVICE_ACCOUNT_JSON: otherKey,
    } as never);
    expect(credential.serviceAccount?.client_email).toBe('sc@p.iam.gserviceaccount.com');
  });

  it('falls back to a refresh token when there is no service account', () => {
    const credential = resolveGoogleCredential({
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_OAUTH_REFRESH_TOKEN: 'refresh',
    } as never);
    expect(credential.mode).toBe('oauth_refresh_token');
  });

  it('needs all three OAuth parts — a partial set is NOT_CONFIGURED, not a broken call', () => {
    expect(resolveGoogleCredential({ GOOGLE_CLIENT_ID: 'id' } as never).mode).toBe('none');
    expect(resolveGoogleCredential({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's' } as never).mode).toBe('none');
    expect(resolveGoogleCredential({ GOOGLE_OAUTH_REFRESH_TOKEN: 'r' } as never).mode).toBe('none');
  });

  it('ignores malformed JSON instead of throwing at import time', () => {
    expect(resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: '{not json' } as never).mode).toBe('none');
    expect(resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: '{"client_email":"a"}' } as never).mode).toBe('none');
    expect(resolveGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: 'null' } as never).mode).toBe('none');
  });

  it('describeCredential never returns the private key', () => {
    const key = JSON.stringify({
      client_email: 'alo@p.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nSUPERSECRET\n-----END PRIVATE KEY-----\n',
    });
    const described = describeGoogleCredential({ GOOGLE_SERVICE_ACCOUNT_JSON: key } as never);
    expect(JSON.stringify(described)).not.toContain('SUPERSECRET');
    expect(described.serviceAccountEmail).toBe('alo@p.iam.gserviceaccount.com');
    expect(described.reason).toContain('must be granted access');
  });
});

describe('Search Console credential description', () => {
  it('reports the configured property and says NOT CONFIGURED when absent', () => {
    const described = describeCredential(BARE_ENV);
    expect(described.configured).toBe(false);
    expect(described.mode).toBe('none');
    expect(described.note).toContain('NOT CONFIGURED');
    expect(described.siteUrl).toContain('aloeducation.com');
  });

  it('never returns the private key', () => {
    const key = JSON.stringify({ client_email: 'sc@p.iam.gserviceaccount.com', private_key: 'TOPSECRET' });
    const described = describeCredential({
      GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON: key,
      GOOGLE_SEARCH_CONSOLE_SITE_URL: 'https://aloeducation.com',
    } as never);
    expect(JSON.stringify(described)).not.toContain('TOPSECRET');
    expect(described.serviceAccountEmail).toBe('sc@p.iam.gserviceaccount.com');
    expect(described.siteUrl).toBe('https://aloeducation.com');
  });

  it('encodes the property URL with the trailing slash the API requires', () => {
    expect(encodeSiteUrl('https://aloeducation.com')).toBe('https%3A%2F%2Faloeducation.com%2F');
    expect(encodeSiteUrl('https://aloeducation.com/')).toBe('https%3A%2F%2Faloeducation.com%2F');
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Server-side conversions — no fabricated success
// ─────────────────────────────────────────────────────────────

describe('sendServerEvent — never reports a conversion that was not measured', () => {
  it('returns NOT_CONFIGURED and makes no request when GA4 is absent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendServerEvent({ event: 'lead_qualified', reference: 'lead-1', env: BARE_ENV });
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.reason).toContain('GA4_MEASUREMENT_ID');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns NOT_CONFIGURED when the measurement ID is set but the API secret is not', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendServerEvent({
      event: 'enrollment_completed',
      reference: 'app-1',
      env: { NODE_ENV: 'production', GA4_MEASUREMENT_ID: 'G-AB12CD34EF' } as never,
    });
    // A measurement ID alone cannot post to the Measurement Protocol. Reporting
    // SENT here would be exactly the fabricated success the spec forbids.
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('sends nothing from a non-production environment', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await sendServerEvent({
      event: 'lead_qualified',
      reference: 'lead-1',
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        GA4_MEASUREMENT_ID: 'G-AB12CD34EF',
        GA4_API_SECRET: 'secret',
      } as never,
    });
    expect(result.status).toBe('DISABLED_BY_ENVIRONMENT');
    expect(result.reason).toContain('DebugView');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('deriveClientId — opaque and free of personal data', () => {
  it('uses the anonymous visitor token verbatim when present', () => {
    expect(deriveClientId({ visitorId: 'alo_v_abc123' })).toBe('alo_v_abc123');
  });

  it('hashes an internal reference so the raw id never reaches Google', () => {
    const derived = deriveClientId({ reference: 'ALO-L-5f0e8b2a' });
    expect(derived).toMatch(/^alo_[0-9a-f]{32}$/);
    expect(derived).not.toContain('ALO-L-5f0e8b2a');
  });

  it('is stable for the same reference and different for a different one', () => {
    expect(deriveClientId({ reference: 'lead-1' })).toBe(deriveClientId({ reference: 'lead-1' }));
    expect(deriveClientId({ reference: 'lead-1' })).not.toBe(deriveClientId({ reference: 'lead-2' }));
  });

  it('prefers the visitor token over a reference so the browser-session join survives', () => {
    expect(deriveClientId({ visitorId: 'alo_v_abc', reference: 'lead-1' })).toBe('alo_v_abc');
  });

  it('produces a one-off anonymous id when there is no identity at all', () => {
    const first = deriveClientId({});
    const second = deriveClientId({});
    expect(first).toMatch(/^alo_anon_[0-9a-f]{24}$/);
    expect(first).not.toBe(second);
  });

  it('bounds a very long visitor token', () => {
    expect(deriveClientId({ visitorId: 'v'.repeat(500) }).length).toBeLessThanOrEqual(191);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. YouTube embed helpers
// ─────────────────────────────────────────────────────────────

describe('YouTubeEmbed helpers', () => {
  it('accepts only well-formed 11-character video ids', () => {
    expect(isValidVideoId('dQw4w9WgXcQ')).toBe(true);
    expect(isValidVideoId('abc_def-123')).toBe(true);
    expect(isValidVideoId('short')).toBe(false);
    expect(isValidVideoId('toolongvideoidentifier')).toBe(false);
    expect(isValidVideoId('')).toBe(false);
  });

  it('rejects a crafted id that could break out of the embed URL', () => {
    expect(isValidVideoId('dQw4w9WgXcQ/../../evil')).toBe(false);
    expect(isValidVideoId('dQw4w9WgXcQ?autoplay=1')).toBe(false);
    expect(isValidVideoId('dQw4w9WgXcQ" onload="x')).toBe(false);
    expect(thumbnailUrl('dQw4w9WgXcQ')).not.toContain('..');
  });

  it('builds a CDN thumbnail URL that sets no cookies', () => {
    expect(thumbnailUrl('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(thumbnailUrl('dQw4w9WgXcQ', 'mq')).toContain('mqdefault');
    expect(thumbnailUrl('dQw4w9WgXcQ', 'max')).toContain('maxresdefault');
  });
});

describe('Business Profile hours summary', () => {
  it('prefers the human-readable weekday text Google provides', () => {
    expect(
      summarizeHours({ regularHours: { weekdayText: ['Monday: 9 am – 6 pm', 'Tuesday: 9 am – 6 pm'] } }),
    ).toBe('Monday: 9 am – 6 pm; Tuesday: 9 am – 6 pm');
  });

  it('falls back to periods, then to 24-hour, then to an empty string', () => {
    expect(
      summarizeHours({ regularHours: { periods: [{ openDay: 'MONDAY', openTime: '09:00', closeDay: 'MONDAY', closeTime: '18:00' }] } }),
    ).toBe('MONDAY 09:00–MONDAY 18:00');
    expect(summarizeHours({ regularHours: { openInfo: 'OPEN_24_7' } })).toBe('Open 24 hours');
    expect(summarizeHours({})).toBe('');
    expect(summarizeHours({ regularHours: { periods: [] } })).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 9. Conversion funnel — grouping and the join
// ─────────────────────────────────────────────────────────────

describe('groupKeyFor', () => {
  const lead = {
    id: 'l1', studentId: null, status: 'NEW', leadTier: '',
    source: 'WEBSITE', medium: null,
    utmSource: 'google', utmMedium: 'organic', utmCampaign: 'uk_fall',
    landingPage: '/destinations/uk',
    firstTouchSource: 'facebook', firstTouchMedium: 'cpc',
    firstTouchCampaign: null, firstTouchLandingPage: null,
  };

  it('builds channel as source / medium so paid and organic stay separate', () => {
    expect(groupKeyFor(lead, 'channel')).toBe('google / organic');
    expect(groupKeyFor({ ...lead, utmMedium: 'cpc' }, 'channel')).toBe('google / cpc');
  });

  it('falls back to the lead source column when no utm was captured', () => {
    expect(groupKeyFor({ ...lead, utmSource: null, utmMedium: null }, 'channel')).toBe('WEBSITE / unknown');
  });

  it('reports unknown rather than direct when there is nothing at all', () => {
    // An unattributed lead is not evidence of direct traffic, and labelling it
    // "direct" would put a made-up number into a marketing report.
    expect(groupKeyFor({ ...lead, source: null, utmSource: null, utmMedium: null }, 'channel')).toBe('unknown');
    expect(groupKeyFor(lead, 'campaign')).toBe('uk_fall');
    expect(groupKeyFor({ ...lead, utmCampaign: null }, 'campaign')).toBe('unknown');
    expect(groupKeyFor(lead, 'firstTouchSource')).toBe('facebook');
    expect(groupKeyFor(lead, 'landingPage')).toBe('/destinations/uk');
    expect(groupKeyFor(lead, 'source')).toBe('google');
    expect(groupKeyFor(lead, 'medium')).toBe('organic');
  });

  it('trims whitespace so " google " and "google" are the same channel', () => {
    expect(groupKeyFor({ ...lead, utmSource: '  google  ' }, 'source')).toBe('google');
  });
});

interface StubLead {
  id: string;
  studentId: string | null;
  status: string;
  leadTier: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  source: string | null;
  medium: string | null;
  landingPage: string | null;
}

function makeStubDb(options: {
  leads: StubLead[];
  applications?: { studentId: string; stage: string }[];
  portalProfiles?: { id: string; studentId: string }[];
  portalApplications?: { studentProfileId: string; stage: string }[];
}) {
  return {
    lead: {
      findMany: vi.fn(async () =>
        options.leads.map((lead) => ({
          ...lead,
          firstTouchSource: null,
          firstTouchMedium: null,
          firstTouchCampaign: null,
          firstTouchLandingPage: null,
        })),
      ),
    },
    application: { findMany: vi.fn(async () => options.applications ?? []) },
    portalStudentProfile: { findMany: vi.fn(async () => options.portalProfiles ?? []) },
    portalStudentApplication: { findMany: vi.fn(async () => options.portalApplications ?? []) },
  };
}

const WINDOW = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

describe('buildConversionFunnel', () => {
  it('counts the full funnel for an attributed lead that enrolled', async () => {
    const db = makeStubDb({
      leads: [
        { id: 'l1', studentId: 'STU-1', status: 'QUALIFIED', leadTier: 'HOT', utmSource: 'google', utmMedium: 'organic', utmCampaign: 'uk_fall', source: 'WEBSITE', medium: null, landingPage: '/destinations/uk' },
      ],
      applications: [{ studentId: 'STU-1', stage: 'CAS_RECEIVED' }],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.rows).toHaveLength(1);
    expect(funnel.rows[0]).toMatchObject({
      key: 'google / organic',
      leads: 1,
      qualified: 1,
      qualifiedByStatus: 1,
      crmApplications: 1,
      applications: 1,
      crmEnrolments: 1,
      enrolments: 1,
    });
    expect(funnel.rows[0].conversionRates).toEqual({
      leadToQualified: 1,
      qualifiedToApplication: 1,
      applicationToEnrolment: 1,
      leadToEnrolment: 1,
    });
  });

  it('separates a qualified-by-score lead from a status change', async () => {
    const db = makeStubDb({
      leads: [
        { id: 'l1', studentId: 'STU-1', status: 'NEW', leadTier: 'HOT', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null },
        { id: 'l2', studentId: 'STU-2', status: 'QUALIFIED', leadTier: 'COLD', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null },
      ],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals.qualified).toBe(2);
    expect(funnel.totals.qualifiedByStatus).toBe(1);
    expect(funnel.totals.qualifiedByScore).toBe(1);
  });

  it('does not count a COLD/NEW lead as qualified', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: 'STU-1', status: 'NEW', leadTier: 'COLD', utmSource: 'google', utmMedium: 'cpc', utmCampaign: null, source: null, medium: null, landingPage: null }],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals.qualified).toBe(0);
    expect(funnel.totals.leads).toBe(1);
  });

  it('counts portal applications and enrolments through the profile join', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: 'STU-1', status: 'CONVERTED', leadTier: '', utmSource: 'facebook', utmMedium: 'cpc', utmCampaign: 'fb_uk', source: null, medium: null, landingPage: '/destinations/uk' }],
      portalProfiles: [{ id: 'PROF-1', studentId: 'STU-1' }],
      portalApplications: [
        { studentProfileId: 'PROF-1', stage: 'submitted' },
        { studentProfileId: 'PROF-1', stage: 'enrolled' },
      ],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals).toMatchObject({ portalApplications: 2, portalEnrolments: 1, enrolments: 1, crmApplications: 0 });
  });

  it('does not count a non-enrolment stage as an enrolment', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: 'STU-1', status: 'QUALIFIED', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null }],
      applications: [{ studentId: 'STU-1', stage: 'DOCUMENT_REVIEW' }],
      portalProfiles: [{ id: 'PROF-1', studentId: 'STU-1' }],
      portalApplications: [{ studentProfileId: 'PROF-1', stage: 'under_review' }],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals.applications).toBe(2);
    expect(funnel.totals.enrolments).toBe(0);
  });

  it('does not credit an application to a different student', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: 'STU-1', status: 'QUALIFIED', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null }],
      applications: [{ studentId: 'STU-999', stage: 'CAS_RECEIVED' }],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals.applications).toBe(0);
    expect(funnel.totals.enrolments).toBe(0);
  });

  it('reports an unjoinable lead explicitly instead of implying zero applications', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null }],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.totals.leadsWithoutStudentLink).toBe(1);
    expect(funnel.totals.applications).toBe(0);
    // Without this caveat a 0% conversion rate looks like a real result.
    expect(funnel.caveats.join(' ')).toContain('cannot be joined');
  });

  it('groups unattributed leads under unknown and reports the count', async () => {
    const db = makeStubDb({
      leads: [
        { id: 'l1', studentId: null, status: 'NEW', leadTier: '', utmSource: null, utmMedium: null, utmCampaign: null, source: null, medium: null, landingPage: null },
        { id: 'l2', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null },
      ],
    });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.unattributedLeads).toBe(1);
    expect(funnel.rows.map((row) => row.key).sort()).toEqual(['google / organic', 'unknown']);
    expect(funnel.caveats.join(' ')).toContain('never as "direct"');
  });

  it('returns null rates rather than dividing by zero', async () => {
    const db = makeStubDb({ leads: [] });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.rows).toEqual([]);
    expect(funnel.totals.leads).toBe(0);
    expect(funnel.totals.enrolments).toBe(0);
  });

  it('returns the enrolment definition so the number cannot be misread', async () => {
    const db = makeStubDb({ leads: [] });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.enrolmentDefinition.applicationStages).toEqual(ENROLLED_APPLICATION_STAGES);
    expect(funnel.enrolmentDefinition.portalStage).toBe('enrolled');
    expect(funnel.enrolmentDefinition.applicationStages).toContain('CAS_RECEIVED');
    expect(funnel.enrolmentDefinition.applicationStages).toContain('I20_RECEIVED');
    expect(funnel.enrolmentDefinition.applicationStages).toContain('COE_RECEIVED');
  });

  it('states that the funnel is built from the database, not from GA4', async () => {
    const db = makeStubDb({ leads: [] });
    const funnel = await buildConversionFunnel(db as never, WINDOW);
    expect(funnel.caveats.join(' ')).toContain('not from GA4');
  });

  it('groups by landing page when asked, ordered by lead volume', async () => {
    const db = makeStubDb({
      leads: [
        { id: 'l1', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: '/destinations/uk' },
        { id: 'l2', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: '/destinations/canada' },
        { id: 'l3', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: '/destinations/uk' },
      ],
    });
    const funnel = await buildConversionFunnel(db as never, { ...WINDOW, groupBy: 'landingPage' });
    expect(funnel.rows[0]).toMatchObject({ key: '/destinations/uk', leads: 2 });
    expect(funnel.rows[1]).toMatchObject({ key: '/destinations/canada', leads: 1 });
    const limited = await buildConversionFunnel(db as never, { ...WINDOW, groupBy: 'landingPage', limit: 1 });
    expect(limited.rows).toHaveLength(1);
    expect(limited.rows[0].key).toBe('/destinations/uk');
  });

  it('does not query the application stores when no lead has a student link', async () => {
    const db = makeStubDb({
      leads: [{ id: 'l1', studentId: null, status: 'NEW', leadTier: '', utmSource: 'google', utmMedium: 'organic', utmCampaign: null, source: null, medium: null, landingPage: null }],
    });
    await buildConversionFunnel(db as never, WINDOW);
    expect(db.application.findMany).not.toHaveBeenCalled();
    expect(db.portalStudentProfile.findMany).not.toHaveBeenCalled();
  });

  it('passes the window through to the lead query', async () => {
    const db = makeStubDb({ leads: [] });
    await buildConversionFunnel(db as never, WINDOW);
    expect(db.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdAt: { gte: WINDOW.from, lte: WINDOW.to } }),
      }),
    );
  });
});
