import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import AllUniversityInformationPage, { metadata } from '@/app/all-university-information/page';
import { isPublicChromeRoute } from '@/components/website/public-chrome-policy';

describe('standalone All University Information page', () => {
  it('renders the requested title, profile scope and honest coverage notice', () => {
    const html = renderToStaticMarkup(createElement(AllUniversityInformationPage));
    expect(html).toContain('All University Information');
    for (const topic of ['admission requirements', 'scholarships', 'rankings', 'official sources']) expect(html).toContain(topic);
    expect(html).toContain('not a claim that every university worldwide');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/<header\b|<footer\b/);
  });
  it('uses public publication-controlled retrieval, not private CRM data', () => {
    const source = readFileSync('src/components/website/UniversitiesListing.tsx', 'utf8');
    expect(source).toContain('/api/course-finder/universities?');
    expect(source).not.toContain('/api/crm/universities');
    expect(source).toContain('href={`/universities/');
  });
  it('is discoverable and accessible without adding a second public header/footer', () => {
    expect(metadata.alternates?.canonical).toBe('https://aloeducation.com/all-university-information');
    expect(isPublicChromeRoute('/all-university-information')).toBe(true);
    expect(readFileSync('src/proxy.ts', 'utf8')).toContain('"/all-university-information"');
    expect(readFileSync('src/app/sitemap.ts', 'utf8')).toContain("['/all-university-information'");
    expect(readFileSync('src/components/crm/pages/InternationalDataCataloguePage.tsx', 'utf8')).toContain('href="/all-university-information"');
  });
});
