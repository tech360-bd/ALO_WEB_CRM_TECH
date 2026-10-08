// English exam funnel: destination, placement, same-tab behaviour, analytics privacy.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ENGLISH_EXAM_CTA_EVENT,
  ENGLISH_EXAM_COPY,
  ENGLISH_EXAM_PLATFORM_URL,
  ENGLISH_PROFICIENCY_TEST_SLUGS,
  isEnglishProficiencyTestSlug,
} from '@/lib/english-exam';
import {
  buildEnglishExamCtaPayload,
  sendCtaEvent,
  trackEnglishExamCtaClick,
} from '@/lib/analytics/cta-tracking';
import {
  EnglishExamBanner,
  EnglishExamButton,
  EnglishExamCard,
  PrepVsExamSplit,
} from '@/components/website/EnglishExamCta';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');

describe('English exam destination', () => {
  it('uses exactly the live English Test Platform URL', () => {
    expect(ENGLISH_EXAM_PLATFORM_URL).toBe('https://english.aloeducation.com');
  });

  it('never points the exam CTA at a prep, login, registration or mock-test route', () => {
    for (const forbidden of ['/english-test-prep', '/english-tests', '/login', '/student/register', '/student/mock-tests', 'localhost', '127.0.0.1']) {
      expect(ENGLISH_EXAM_PLATFORM_URL.includes(forbidden), forbidden).toBe(false);
    }
  });

  it('keeps the agreed bilingual labels', () => {
    expect(ENGLISH_EXAM_COPY.bn.question).toBe('আপনি কি ইংরেজি পরীক্ষা দিতে চান?');
    expect(ENGLISH_EXAM_COPY.bn.button).toBe('পরীক্ষা দিন');
    expect(ENGLISH_EXAM_COPY.en.button).toBe('Take the English Test');
    expect(ENGLISH_EXAM_COPY.en.preparationLabel).toBe('PREPARATION');
    expect(ENGLISH_EXAM_COPY.en.realExamLabel).toBe('REAL EXAM');
  });

  it('limits the real-exam CTA to English-proficiency tests', () => {
    expect(isEnglishProficiencyTestSlug('ielts')).toBe(true);
    expect(isEnglishProficiencyTestSlug('PTE-Academic')).toBe(true);
    for (const slug of ['gre', 'gmat', 'sat', 'act', 'kaplan', 'moi', '', undefined, null]) {
      expect(isEnglishProficiencyTestSlug(slug as string | undefined), String(slug)).toBe(false);
    }
    expect(ENGLISH_PROFICIENCY_TEST_SLUGS).toContain('ielts');
  });
});

describe('English exam CTA markup', () => {
  const variants: Array<[string, string]> = [
    ['banner', renderToStaticMarkup(createElement(EnglishExamBanner))],
    ['split', renderToStaticMarkup(createElement(PrepVsExamSplit, { location: 'language_prep_hub', prepHref: '#x', prepTitle: 'Prep', prepCta: 'Go' }))],
    ['card', renderToStaticMarkup(createElement(EnglishExamCard, { location: 'language_prep_detail', testName: 'IELTS' }))],
    ['button', renderToStaticMarkup(createElement(EnglishExamButton, { location: 'navbar', label: 'English Test' }))],
  ];

  it.each(variants)('%s links to the platform in the same tab', (_name, html) => {
    expect(html).toContain(`href="${ENGLISH_EXAM_PLATFORM_URL}"`);
    expect(html).not.toMatch(/target="_blank"/);
    expect(html).not.toMatch(/href="\/student\/register"|href="\/login"|href="\/english-test-prep"/);
  });

  it('banner shows the question and both button labels', () => {
    const html = variants[0][1];
    expect(html).toContain('আপনি কি ইংরেজি পরীক্ষা দিতে চান?');
    expect(html).toContain('পরীক্ষা দিন');
    expect(html).toContain('Take the English Test');
  });

  it('split view separates PREPARATION from REAL EXAM', () => {
    const html = variants[1][1];
    expect(html).toContain('PREPARATION');
    expect(html).toContain('REAL EXAM');
    expect(html.split(ENGLISH_EXAM_PLATFORM_URL).length - 1).toBe(1);
  });

  it('button variant renders the supplied label, not a placeholder', () => {
    expect(variants[3][1]).toContain('English Test');
    expect(variants[3][1]).toContain('data-location="navbar"');
  });
});

describe('English exam CTA analytics', () => {
  it('builds a privacy-safe payload: event name, location and path only', () => {
    const payload = buildEnglishExamCtaPayload('navbar', '/language-prep/ielts?token=secret#x', 'visitor-1');
    expect(payload.eventType).toBe(ENGLISH_EXAM_CTA_EVENT);
    expect(payload.eventType).toBe('english_exam_cta_click');
    expect(payload.pageUrl).toBe('/language-prep/ielts');
    expect(Object.keys(payload).sort()).toEqual(['eventData', 'eventType', 'pageUrl', 'visitorId']);
    expect(payload.eventData).toEqual({ location: 'navbar', destination: 'english_test_platform' });
    expect(JSON.stringify(payload)).not.toMatch(/token|secret|@|phone|email/i);
  });

  it('never throws, even when the transport fails', () => {
    const payload = buildEnglishExamCtaPayload('footer', '/', 'v');
    expect(() => sendCtaEvent(payload, () => { throw new Error('network down'); })).not.toThrow();
    expect(sendCtaEvent(payload, () => { throw new Error('network down'); })).toBe(false);
  });

  it('sends to the existing behavior-tracking endpoint', () => {
    let target = '';
    let body = '';
    sendCtaEvent(buildEnglishExamCtaPayload('homepage_banner', '/', 'v'), (url, b) => { target = url; body = b; return true; });
    expect(target).toBe('/api/behavior/track');
    expect(JSON.parse(body).eventType).toBe('english_exam_cta_click');
  });

  it('click tracking is a safe no-op outside the browser', () => {
    expect(() => trackEnglishExamCtaClick('footer')).not.toThrow();
  });
});

describe('public surface regression guards', () => {
  it('navbar has one English Test entry per breakpoint and no new-tab link', () => {
    const nav = read('src/components/website/PublicNavbar.tsx');
    expect(nav.match(/location="navbar"/g)?.length).toBe(1);
    expect(nav.match(/location="mobile_navbar"/g)?.length).toBe(1);
  });

  it('footer exposes the English Test link once', () => {
    const footer = read('src/components/website/PublicFooter.tsx');
    expect(footer.match(/location="footer"/g)?.length).toBe(1);
  });

  it('homepage promotion uses the shared banner, not the old new-tab block', () => {
    const home = read('src/components/website/HomepagePart1.tsx');
    expect(home).toContain('<EnglishExamBanner');
    expect(home).not.toContain('EnglishTestPromotion');
    expect(home).not.toMatch(/3\s*টি Mock Test FREE/);
  });

  it('no public-facing file still ships disabled "not yet wired" controls or developer copy', () => {
    const files = [
      'src/components/language-prep/PremiumLandingView.tsx',
      'src/components/language-prep/TestDetailView.tsx',
      'src/components/language-prep/ComparisonView.tsx',
      'src/components/website/MasterTestPrepView.tsx',
      'src/components/website/PremiumCountryPage.tsx',
      'src/components/website/TestPreparationMiniCard.tsx',
      'src/components/website/public-pages/PublicPages.tsx',
      'src/components/course-finder/eligibility-checker-enhanced.tsx',
      'src/app/english-test-prep/page.tsx',
      'src/app/events/page.tsx',
      // /visa-support was deleted (it shipped unsourced visa fees, processing
      // times and a visa success percentage). /visa is the public visa surface
      // now, so the guard follows it to the files that actually ship.
      'src/app/visa/page.tsx',
      'src/components/website/VisaSupportHub.tsx',
      'src/app/team/[slug]/page.tsx',
    ];
    const banned = [
      /Not yet wired/,
      /Coming [Ss]oon/,
      /Notify Me/,
      /DB-driven/,
      /No fake /,
      /do not invent/i,
      /Real (Page|Link)/,
      /Link Integrity/,
      /If tool not implemented/,
      /Creates TestSession/,
      /Premium 10x/,
      /consent_status=/,
      /source_url/,
    ];
    for (const file of files) {
      const visible = read(file)
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
        .join('\n');
      for (const pattern of banned) {
        expect(visible, `${file} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('language-prep lead forms never report success on a failed request', () => {
    const route = read('src/app/api/language-prep/leads/route.ts');
    expect(route).toContain("if (!lead) {");
    expect(route).toContain("'Service temporarily unavailable'");
    expect(route).not.toContain("leadId: lead?.id || 'created'");
    for (const file of ['src/components/language-prep/PremiumLandingView.tsx', 'src/components/language-prep/TestDetailView.tsx']) {
      expect(read(file), file).toContain('submitLanguagePrepLead');
      expect(read(file), file).not.toContain("toast.success('Request received!')");
    }
  });

  it('mock-test entry points no longer render simulated exam data', () => {
    const mock = read('src/app/student/mock-tests/page.tsx');
    expect(mock).not.toMatch(/IELTS Mock Test/);
    expect(mock).not.toMatch(/completed/);
    expect(read('src/components/student/EnglishTestNotice.tsx')).toContain('EnglishExamCard');
    expect(read('src/app/student/mock-tests/session/[sessionId]/page.tsx')).toContain("redirect('/student/mock-tests')");
  });
});
