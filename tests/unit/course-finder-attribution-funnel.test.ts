import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COURSE_FINDER_FUNNEL_STORAGE_KEY,
  readCourseFinderTouch,
  recordCourseFinderTouch,
  rememberEntryAttribution,
} from '@/lib/analytics/attribution-payload';
import { buildConversionFunnel } from '@/lib/analytics/conversion-funnel';

function createMemorySessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => [...store.keys()][i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
  };
}

describe('First-Party UTM -> Course Finder -> Registration / Lead Attribution', () => {
  beforeEach(() => {
    const sessionStorage = createMemorySessionStorage();
    const localStorage = createMemorySessionStorage();
    vi.stubGlobal('window', {
      location: {
        href: 'https://aloeducation.com/course-finder?utm_source=facebook&utm_medium=paid_social&utm_campaign=jan_2027_uk&fbclid=FB123',
        pathname: '/course-finder',
        search: '?utm_source=facebook&utm_medium=paid_social&utm_campaign=jan_2027_uk&fbclid=FB123',
      },
      sessionStorage,
      localStorage,
    });
    vi.stubGlobal('document', { referrer: 'https://l.facebook.com/redirect?secret_user_id=999' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('captures Course Finder UTM touch across both apply and student-register storage keys while stripping referrer query PII', () => {
    const touch = recordCourseFinderTouch({
      subject: 'Computer Science',
      country: 'United Kingdom',
      studyLevel: 'Postgraduate',
    });

    expect(touch).not.toBeNull();
    expect(touch?.country).toBe('United Kingdom');
    expect(readCourseFinderTouch()).toMatchObject({
      subject: 'Computer Science',
      country: 'United Kingdom',
      studyLevel: 'Postgraduate',
    });
    expect(window.sessionStorage.getItem(COURSE_FINDER_FUNNEL_STORAGE_KEY)).toBeTruthy();

    // Simulate navigating from /course-finder to /student-register without query params
    (window as any).location.href = 'https://aloeducation.com/student-register';
    (window as any).location.pathname = '/student-register';
    (window as any).location.search = '';

    const regAttr = rememberEntryAttribution('alo.attribution.register.v1');
    const applyFormAttr = rememberEntryAttribution('alo.attribution.apply.v1');
    const applyAttr = rememberEntryAttribution('alo.attribution.entry.v1');

    expect(regAttr?.utmSource).toBe('facebook');
    expect(regAttr?.utmCampaign).toBe('jan_2027_uk');
    expect(regAttr?.landingPage).toContain('/course-finder');
    expect(regAttr?.referrer).toBe('l.facebook.com');
    expect(JSON.stringify(regAttr)).not.toContain('secret_user_id');
    expect(applyFormAttr?.utmSource).toBe('facebook');
    expect(applyFormAttr?.landingPage).toContain('/course-finder');
    expect(applyFormAttr?.fbclid).toBe('FB123');
    expect(applyAttr?.fbclid).toBe('FB123');
  });

  it('aggregates Course Finder landing pages through CRM qualification, application, and enrolment without inventing direct traffic', async () => {
    const stubDb = {
      lead: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'l1',
            source: 'WEBSITE',
            utmSource: 'facebook',
            utmMedium: 'paid_social',
            utmCampaign: 'jan_2027_uk',
            medium: 'paid_social',
            campaign: 'jan_2027_uk',
            gclid: null,
            fbclid: 'FB123',
            landingPage: '/course-finder?utm_source=facebook',
            firstTouchSource: 'facebook',
            status: 'QUALIFIED',
            leadTier: 'HOT',
            studentId: 'stu-1',
          },
          {
            id: 'l2',
            source: 'PHONE',
            utmSource: null,
            utmMedium: null,
            utmCampaign: null,
            medium: null,
            campaign: null,
            gclid: null,
            fbclid: null,
            landingPage: null,
            firstTouchSource: null,
            status: 'NEW',
            leadTier: 'COLD',
            studentId: null,
          },
        ]),
      },
      application: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'app-1', studentId: 'stu-1', stage: 'CAS_RECEIVED' },
        ]),
      },
      student: {
        findMany: vi.fn().mockResolvedValue([{ id: 'stu-1', studentId: 'AE-2026000001' }]),
      },
      portalStudentProfile: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      portalStudentApplication: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;

    const funnel = await buildConversionFunnel(stubDb, {
      from: new Date('2026-10-01T00:00:00Z'),
      to: new Date('2026-10-31T23:59:59Z'),
      groupBy: 'landingPage',
    });

    expect(funnel.totals.leads).toBe(2);
    expect(funnel.totals.qualified).toBe(1);
    expect(funnel.totals.applications).toBe(1);
    expect(funnel.totals.enrolments).toBe(1);
    expect(funnel.totals.leadsWithoutStudentLink).toBe(1);

    const keys = funnel.rows.map((r) => r.key);
    expect(keys).toContain('/course-finder?utm_source=facebook');
    expect(keys).toContain('unknown');
    expect(keys).not.toContain('direct');
  });
});
