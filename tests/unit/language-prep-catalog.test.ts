import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { ENGLISH_PREP_TESTS, ENGLISH_PREP_FAQS, ENGLISH_PREP_ACCEPTANCE, getTestBySlug } from '@/lib/language-prep/data';
import { REQUIRED_TEST_SLUGS, applyReviewedFacts, preparationSteps, reviewedModules, reviewLanguageFaq, makePreparationPlan } from '@/lib/language-prep/editorial';
import { LANGUAGE_PREP_PHOTOS, LanguageTestComparison } from '@/components/language-prep/LanguagePrepVisuals';

describe('language preparation catalogue acceptance', () => {
  it('compares entered scores without inventing preparation weeks across different test scales', () => {
    expect(makePreparationPlan('55', '65', '10')).toMatchObject({ gap: '10.0', hours: 10 });
    expect(makePreparationPlan('6', '6.5', '5')).not.toHaveProperty('weeks');
    expect(makePreparationPlan('6', '6.5', '5')?.note).toContain('same test');
  });
  it('rejects invalid score-planner inputs', () => {
    for (const args of [['', '7', '10'], ['no', '7', '10'], ['6', 'Infinity', '10'], ['-1', '7', '10'], ['6', '7', '0']]) expect(makePreparationPlan(...args as [string, string, string])).toBeNull();
  });
  it('does not publish the closed SDS stream as an active route', () => {
    const faqs = ENGLISH_PREP_FAQS.filter(faq => /SDS/.test(faq.question));
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.every(faq => faq.answer.includes('closed'))).toBe(true);
    expect(ENGLISH_PREP_ACCEPTANCE.every(record => !/all Canadian DLIs|for SDS/.test(record.summary))).toBe(true);
  });
  it('keeps TOEFL FAQ scoring and writing aligned with the 2026 overview', () => {
    expect(ENGLISH_PREP_FAQS.find(faq => faq.id === 'faq-toefl-3')?.answer).toContain('1–6');
    expect(ENGLISH_PREP_FAQS.find(faq => faq.id === 'faq-toefl-ibt-12')?.answer).toContain('Write an Email');
  });
  it('preserves a newer reviewed database FAQ', () => {
    const faq = { question: 'How is TOEFL iBT scored?', answer: 'Newer approved guidance', lastVerifiedAt: '2026-11-01' };
    expect(reviewLanguageFaq(faq, 'toefl-ibt')).toEqual(faq);
  });
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
  it('renders every required test family in one accessible comparison with cost and source links', () => {
    const html = renderToStaticMarkup(createElement(LanguageTestComparison, { tests: ENGLISH_PREP_TESTS }));
    expect(html).toContain('University &amp; visa acceptance');
    expect(html).toContain('Cost');
    for (const slug of REQUIRED_TEST_SLUGS) expect(html).toContain(`href="/language-prep/${slug}"`);
    expect(html.match(/scope="row"/g)).toHaveLength(REQUIRED_TEST_SLUGS.length);
  });
  it('uses existing local photography rather than broken external media placeholders', () => {
    for (const image of LANGUAGE_PREP_PHOTOS) expect(existsSync(`public${image.src}`)).toBe(true);
  });
});

