/**
 * GA4 Analytics Data API + business-lifecycle event tests.
 *
 * These cover the additions made in this pass:
 *
 *   - the Analytics Data API client (reporting reads) — configuration honesty,
 *     request validation and allowlisting, and the NOT_CONFIGURED contract
 *   - the fixed vocabularies for the three lifecycle events, which exist to stop
 *     free text (a document category typed by an operator, a test name) reaching
 *     GA4
 *   - scroll-depth arithmetic, which is pure and therefore testable
 *   - the event catalogue, to prove every event the specification requires is
 *     actually declared
 *
 * No network and no database: `runReport` is exercised on its guard paths only,
 * and the Google transport is never called. A test that "passes" against a
 * mocked Google would prove nothing about the integration, so the assertions are
 * about what the code refuses to do.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  ALLOWED_DIMENSIONS,
  ALLOWED_METRICS,
  REPORT_PRESETS,
  describeAnalyticsDataConfig,
  isReportPreset,
  isValidGa4Date,
  resolvePropertyId,
  runReport,
  validateReportRequest,
  GA4_DATA_API_SCOPE,
} from '@/lib/google/analytics-data';
import {
  documentUploadKind,
  englishTestKind,
} from '@/lib/analytics/application-events';
import { milestonesReached, scrollPercent, SCROLL_MILESTONES } from '@/components/analytics/AnalyticsScrollTracker';
import { ANALYTICS_EVENT_NAMES, isAllowedEventName, scrubEventParams } from '@/lib/analytics/events';
import { GOOGLE_SERVICE_COSTS, getGoogleStackConfig } from '@/lib/google/config';

/** A minimal env with no Google credential of any kind. */
const EMPTY_ENV: NodeJS.ProcessEnv = { NODE_ENV: 'production' };

/** A production env with a numeric GA4 property id but NO credential. */
const PROPERTY_ONLY_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  GA4_PROPERTY_ID: '123456789',
};

describe('GA4 Analytics Data API — configuration', () => {
  it('requests only the read-only analytics scope', () => {
    // A write or admin scope would let a reporting read modify the property.
    expect(GA4_DATA_API_SCOPE).toBe('https://www.googleapis.com/auth/analytics.readonly');
  });

  it('accepts a numeric property id, with or without the properties/ prefix', () => {
    expect(resolvePropertyId({ GA4_PROPERTY_ID: '123456789' } as NodeJS.ProcessEnv)).toBe('123456789');
    expect(resolvePropertyId({ GA4_PROPERTY_ID: 'properties/123456789' } as NodeJS.ProcessEnv)).toBe('123456789');
  });

  it('rejects the measurement id, which is the mistake an operator actually makes', () => {
    // Pasting the G- id produces an opaque 400 from Google; it is rejected here
    // with a reason instead.
    expect(resolvePropertyId({ GA4_PROPERTY_ID: 'G-ABCDE12345' } as NodeJS.ProcessEnv)).toBe('');
    expect(resolvePropertyId({ GA4_PROPERTY_ID: '123' } as NodeJS.ProcessEnv)).toBe('');
    expect(resolvePropertyId({} as NodeJS.ProcessEnv)).toBe('');
  });

  it('is never "configured" on a property id alone — a credential is also required', () => {
    const described = describeAnalyticsDataConfig(PROPERTY_ONLY_ENV);
    expect(described.propertyId).toBe('123456789');
    expect(described.configured).toBe(false);
    expect(described.note).toMatch(/credential/i);
  });

  it('is not configured with no environment at all, and says which variable is missing', () => {
    const described = describeAnalyticsDataConfig(EMPTY_ENV);
    expect(described.configured).toBe(false);
    expect(described.propertyId).toBe('');
    expect(described.note).toMatch(/GA4_PROPERTY_ID|credential/i);
  });

  it('classifies the API as FREE with no billing account in the shared cost table', () => {
    const cost = GOOGLE_SERVICE_COSTS.GA4_DATA_API;
    expect(cost.tier).toBe('FREE');
    expect(cost.billingAccountRequired).toBe(false);
    expect(cost.optional).toBe(false);
  });

  it('exposes the property id through the shared config, not ad-hoc env reads', () => {
    const config = getGoogleStackConfig(PROPERTY_ONLY_ENV);
    expect(config.analyticsData.propertyId).toBe('123456789');
    // Separate from the tag loader: reporting can be configured while tags are
    // not injecting, and the status endpoint must be able to show both.
    expect(config.analyticsData).toHaveProperty('reason');
  });
});

describe('GA4 Analytics Data API — request validation', () => {
  it('accepts the GA4 relative dates ALO uses', () => {
    for (const date of ['today', 'yesterday', '28daysAgo', '7daysAgo', 'startOfMonth', '2026-01-01']) {
      expect(isValidGa4Date(date)).toBe(true);
    }
    for (const date of ['', 'tomorrow', "2026-01-01'; DROP", 'last-tuesday']) {
      expect(isValidGa4Date(date)).toBe(false);
    }
  });

  it('rejects a dimension that is not allowlisted, so the endpoint is not an open query proxy', () => {
    const problems = validateReportRequest({
      startDate: '28daysAgo',
      endDate: 'yesterday',
      dimensions: ['sessionSource', 'userEmail'],
      metrics: ['sessions'],
    });
    expect(problems.join(' ')).toMatch(/userEmail/);
  });

  it('rejects a metric that is not allowlisted', () => {
    const problems = validateReportRequest({
      startDate: '28daysAgo',
      endDate: 'yesterday',
      dimensions: [],
      metrics: ['revenuePerPassportNumber'],
    });
    expect(problems.join(' ')).toMatch(/revenuePerPassportNumber/);
  });

  it('requires at least one metric', () => {
    const problems = validateReportRequest({
      startDate: '28daysAgo',
      endDate: 'yesterday',
      dimensions: ['sessionSource'],
      metrics: [],
    });
    expect(problems.join(' ')).toMatch(/metric/i);
  });

  it('refuses an unbounded row limit', () => {
    const problems = validateReportRequest({
      startDate: '28daysAgo',
      endDate: 'yesterday',
      dimensions: ['sessionSource'],
      metrics: ['sessions'],
      limit: 1_000_000,
    });
    expect(problems.join(' ')).toMatch(/limit/i);
  });

  it('has no PII-shaped field in the dimension or metric allowlists', () => {
    // The allowlists are the wall between an admin query and the property.
    // `sessionCampaignName` is deliberately NOT caught by this screen: a campaign
    // name is marketing metadata that ALO itself authored, not a person's name.
    // Everything that could name or contact an individual is.
    const forbidden = /(email|phone|passport|address|dateofbirth|birth|card|nid|username|firstname|lastname|surname)/i;
    for (const field of [...ALLOWED_DIMENSIONS, ...ALLOWED_METRICS]) {
      expect(forbidden.test(field), `${field} looks like PII`).toBe(false);
    }
    // The single "Name" suffix that is legitimately allowed, spelled out so that
    // widening the allowlist has to confront this assertion.
    expect(ALLOWED_DIMENSIONS).toContain('sessionCampaignName');
  });

  it('defines every dashboard preset only with allowlisted fields', () => {
    for (const [key, preset] of Object.entries(REPORT_PRESETS)) {
      for (const dimension of preset.dimensions) {
        expect(ALLOWED_DIMENSIONS as readonly string[], `${key} dimension ${dimension}`).toContain(dimension);
      }
      for (const metric of preset.metrics) {
        expect(ALLOWED_METRICS as readonly string[], `${key} metric ${metric}`).toContain(metric);
      }
      expect(validateReportRequest({
        startDate: '28daysAgo',
        endDate: 'yesterday',
        dimensions: [...preset.dimensions],
        metrics: [...preset.metrics],
        limit: preset.limit,
      })).toEqual([]);
    }
  });

  it('covers the acquisition reporting the specification requires', () => {
    // Traffic source, campaigns, landing pages, and the organic/referral/direct
    // split are named requirements, not nice-to-haves.
    expect(isReportPreset('acquisition')).toBe(true);
    expect(isReportPreset('channels')).toBe(true);
    expect(isReportPreset('campaigns')).toBe(true);
    expect(isReportPreset('landingPages')).toBe(true);
    expect(REPORT_PRESETS.channels.dimensions).toContain('sessionDefaultChannelGroup');
    expect(REPORT_PRESETS.acquisition.dimensions).toEqual(['sessionSource', 'sessionMedium']);
    expect(isReportPreset('../../secrets')).toBe(false);
  });
});

describe('GA4 Analytics Data API — the NOT_CONFIGURED contract', () => {
  it('returns NOT_CONFIGURED rather than zeroes when no property id exists', async () => {
    const result = await runReport(
      { startDate: '28daysAgo', endDate: 'yesterday', dimensions: ['sessionSource'], metrics: ['sessions'] },
      EMPTY_ENV,
    );
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.data).toBeUndefined();
    expect(result.reason).toBeTruthy();
  });

  it('returns NOT_CONFIGURED when a property id exists but no credential does — without calling Google', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await runReport(
      { startDate: '28daysAgo', endDate: 'yesterday', dimensions: ['sessionSource'], metrics: ['sessions'] },
      PROPERTY_ONLY_ENV,
    );
    expect(result.status).toBe('NOT_CONFIGURED');
    // The important assertion: no outbound request was attempted, so an
    // unconfigured deployment cannot be mistaken for a working one.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects an invalid request before any network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await runReport(
      { startDate: '28daysAgo', endDate: 'yesterday', dimensions: ['userEmail'], metrics: ['sessions'] },
      PROPERTY_ONLY_ENV,
    );
    expect(result.status).not.toBe('READY');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('lifecycle event vocabularies — free text must not reach GA4', () => {
  it('maps a document category to a coarse, fixed upload_kind', () => {
    expect(documentUploadKind('Passport')).toBe('identity');
    expect(documentUploadKind('passport_scan_final_v3.pdf')).toBe('identity');
    expect(documentUploadKind('Academic')).toBe('academic');
    expect(documentUploadKind('transcript')).toBe('academic');
    expect(documentUploadKind('English')).toBe('english');
    expect(documentUploadKind('IELTS TRF')).toBe('english');
    expect(documentUploadKind('Bank Statement')).toBe('financial');
    // Unrecognised free text collapses to `other` instead of being passed through.
    expect(documentUploadKind('customer said call after 5pm')).toBe('other');
    expect(documentUploadKind('')).toBe('other');
    expect(documentUploadKind(null)).toBe('other');
  });

  it('never echoes the operator-typed category', () => {
    const typed = 'Abdul Karim passport scan 01712345678';
    expect(documentUploadKind(typed)).toBe('identity');
    expect(documentUploadKind(typed)).not.toContain('Abdul');
  });

  it('maps a test name to a fixed test_type', () => {
    expect(englishTestKind('IELTS Academic')).toBe('ielts');
    expect(englishTestKind('PTE Academic')).toBe('pte');
    expect(englishTestKind('TOEFL iBT')).toBe('toefl');
    expect(englishTestKind('Duolingo English Test')).toBe('duolingo');
    expect(englishTestKind('ALO English Test')).toBe('alo_english_test');
    expect(englishTestKind('something else')).toBe('other');
    expect(englishTestKind(undefined)).toBe('other');
  });

  it('lets the new lifecycle parameters through the PII screen but still blocks document details', () => {
    const allowed = scrubEventParams('document_upload_completed', {
      upload_kind: 'identity',
      application_reference: 'cm3abc123',
    });
    expect(allowed.params).toEqual({ upload_kind: 'identity', application_reference: 'cm3abc123' });
    expect(allowed.clean).toBe(true);

    const blocked = scrubEventParams('document_upload_completed', {
      upload_kind: 'identity',
      file_name: 'passport_scan.pdf',
      document_id: 'doc_123',
    });
    expect(blocked.params).not.toHaveProperty('file_name');
    expect(blocked.params).not.toHaveProperty('document_id');
    expect(blocked.clean).toBe(false);
  });

  it('lets a stage transition through while rejecting a free-text reason', () => {
    const result = scrubEventParams('application_status_changed', {
      application_stage: 'offer_received',
      stage_from: 'submitted',
      stage_to: 'offer_received',
      // A staff-typed reason can contain anything, so it must be dropped.
      reason: 'called Abdul on 01712345678',
    });
    expect(result.params).toEqual({
      application_stage: 'offer_received',
      stage_from: 'submitted',
      stage_to: 'offer_received',
    });
    expect(result.clean).toBe(false);
  });
});

describe('scroll depth — arithmetic and milestones', () => {
  it('returns 0 for a document that cannot scroll', () => {
    expect(scrollPercent(0, 800, 800)).toBe(0);
    expect(scrollPercent(0, 700, 800)).toBe(0);
    expect(scrollPercent(0, Number.NaN, 800)).toBe(0);
  });

  it('measures the scrollable distance, not the document height', () => {
    // 1000px document in an 800px viewport scrolls 200px. At the bottom the
    // visitor has read 100% — reporting 200/1000 = 20% would be the classic bug.
    expect(scrollPercent(200, 1000, 800)).toBe(100);
    expect(scrollPercent(100, 1000, 800)).toBe(50);
    expect(scrollPercent(0, 1000, 800)).toBe(0);
  });

  it('clamps to 0–100 for elastic overscroll and negative offsets', () => {
    expect(scrollPercent(-40, 1000, 800)).toBe(0);
    expect(scrollPercent(5000, 1000, 800)).toBe(100);
  });

  it('reports each milestone exactly once as depth increases', () => {
    expect(SCROLL_MILESTONES).toEqual([25, 50, 75, 90]);
    expect(milestonesReached(0)).toEqual([]);
    expect(milestonesReached(24)).toEqual([]);
    expect(milestonesReached(25)).toEqual([25]);
    expect(milestonesReached(76)).toEqual([25, 50, 75]);
    expect(milestonesReached(100)).toEqual([25, 50, 75, 90]);
  });
});

describe('event catalogue completeness', () => {
  it('declares every event the specification requires', () => {
    const required = [
      'page_view',
      'page_scroll',
      'course_search',
      'course_view',
      'university_search',
      'university_view',
      'country_page_view',
      'destination_page_view',
      'lead_form_start',
      'lead_form_submit',
      'counselor_request',
      'whatsapp_click',
      'phone_click',
      'email_click',
      'application_start',
      'application_submit',
      'document_upload_completed',
      'application_status_changed',
      'english_test_start',
      'english_test_complete',
      'ielts_page_view',
      'pte_page_view',
      'toefl_page_view',
      'lead_qualified',
      'application_started',
      'application_submitted',
      'enrollment_completed',
    ];
    for (const event of required) {
      expect(ANALYTICS_EVENT_NAMES as readonly string[], event).toContain(event);
    }
  });

  it('still rejects an event name that is not in the catalogue', () => {
    expect(isAllowedEventName('page_scroll')).toBe(true);
    expect(isAllowedEventName('passport_uploaded')).toBe(false);
    expect(isAllowedEventName('')).toBe(false);
  });
});
