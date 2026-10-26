import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { ENGLISH_PREP_TESTS, getTestBySlug } from '@/lib/language-prep/data';
import { REQUIRED_TEST_SLUGS, applyReviewedFacts, preparationSteps, reviewedModules } from '@/lib/language-prep/editorial';
import { LANGUAGE_PREP_PHOTOS, LanguageTestComparison } from '@/components/language-prep/LanguagePrepVisuals';

describe('language preparation catalogue acceptance', () => {
  it.each(REQUIRED_TEST_SLUGS)('%s has a dedicated, source-backed preparation record', slug => {
    const test = getTestBySlug(slug)!;
    expect(test.slug).toBe(slug);
    expect(test.name).toBeTruthy();
    for (const value of [test.longDescription, test.durationDisplay, test.resultTimeline, test.scoringSystem, test.costSummary]) expect(value.length).toBeGreaterThan(3);
    expect(new URL(test.sourceUrl).protocol).toBe('https:');
    expect(preparationSteps(test)).toHaveLength(5);
  });
  it('keeps extras and unique records rather than slicing the catalogue to twelve', () => {
    expect(getTestBySlug('moi')?.testType).toBe('moi_guidance');
    expect(getTestBySlug('oxford-ellt')).toBeDefined();
    expect(new Set(ENGLISH_PREP_TESTS.map(t => t.slug)).size).toBe(ENGLISH_PREP_TESTS.length);
  });
  it.each(['cae', 'cpe', 'cambridge'])('normalises %s to Cambridge English without duplicate records', slug => expect(getTestBySlug(slug)?.slug).toBe('cambridge-english'));
  it('corrects dated TOEFL facts but preserves a newer reviewed DB record', () => {
    const current = getTestBySlug('toefl-ibt')!;
    expect(current.scoringSystem).toContain('1–6');
    expect(current.durationDisplay).toContain('2 hours');
    expect(applyReviewedFacts({ ...current, lastVerifiedAt: '2026-11-01', scoringSystem: 'Newer reviewed provider record' }).scoringSystem).toBe('Newer reviewed provider record');
    expect(reviewedModules('toefl-ibt', 'db-id')?.map(m => m.moduleName)).toEqual(['Reading', 'Listening', 'Writing', 'Speaking']);
    expect(reviewedModules('toefl-ibt', 'db-id', '2026-11-01')).toBeNull();
  });
  it('renders all fourteen test families in one accessible comparison with cost and source links', () => {
    const html = renderToStaticMarkup(createElement(LanguageTestComparison, { tests: ENGLISH_PREP_TESTS }));
    expect(html).toContain('University &amp; visa acceptance');
    expect(html).toContain('Cost');
    for (const slug of REQUIRED_TEST_SLUGS) expect(html).toContain(`href="/language-prep/${slug}"`);
    expect(html.match(/scope="row"/g)).toHaveLength(14);
  });
  it('uses existing local photography rather than broken external media placeholders', () => {
    for (const image of LANGUAGE_PREP_PHOTOS) expect(existsSync(`public${image.src}`)).toBe(true);
  });
});
