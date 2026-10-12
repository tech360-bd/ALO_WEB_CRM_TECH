// Pure evaluators behind scripts/audit/public-route-matrix.mjs.
import { describe, expect, it } from 'vitest';
import {
  evaluateApi,
  evaluatePage,
  evaluateSitemap,
  PUBLIC_PAGES,
  PROTECTED_PAGES,
} from '../../scripts/audit/public-route-matrix.mjs';

const htmlPage = (extra = '') => `<!doctype html><html><head><title>About | ALO Education</title><meta name="description" content="Study abroad guidance."><link rel="canonical" href="https://aloeducation.com/about"></head><body>${extra}</body></html>`;

describe('evaluatePage', () => {
  it('passes a healthy public page', () => {
    const { findings, facts } = evaluatePage({ path: '/about', status: 200, location: null, contentType: 'text/html; charset=utf-8', body: htmlPage('<p>Hello</p>') });
    expect(findings.filter((f) => f.level === 'FAIL')).toEqual([]);
    expect(facts.hasDescription).toBe(true);
    expect(facts.canonical).toBe('https://aloeducation.com/about');
  });

  it('fails a public page that redirects to login', () => {
    const { findings } = evaluatePage({ path: '/language-prep', status: 307, location: 'https://aloeducation.com/login?callbackUrl=%2Flanguage-prep', contentType: null, body: '' });
    expect(findings.map((f) => f.check)).toContain('public page redirects to login');
  });

  it('warns on a non-login redirect', () => {
    const { findings } = evaluatePage({ path: '/x', status: 308, location: '/y', contentType: null, body: '' });
    expect(findings[0].level).toBe('WARN');
  });

  it('fails a 500 and a non-HTML response', () => {
    expect(evaluatePage({ path: '/a', status: 500, location: null, contentType: 'text/html', body: '' }).findings[0].level).toBe('FAIL');
    expect(evaluatePage({ path: '/a', status: 200, location: null, contentType: 'application/json', body: '{}' }).findings[0].level).toBe('FAIL');
  });

  it('flags placeholder and developer copy', () => {
    const body = htmlPage('<p>Not yet wired — disabled</p><span>Coming Soon</span><p>DB-driven results</p>');
    const checks = evaluatePage({ path: '/language-prep', status: 200, location: null, contentType: 'text/html', body }).findings.map((f) => f.check);
    expect(checks.join(' ')).toMatch(/disabled placeholder control/);
    expect(checks.join(' ')).toMatch(/coming-soon placeholder/);
    expect(checks.join(' ')).toMatch(/spec copy/);
  });

  it('flags leaked database URLs, Prisma errors and stack traces', () => {
    const leaky = htmlPage('<pre>mysql://root:secret@db/alo</pre><pre>PrismaClientKnownRequestError: P1001</pre>');
    const checks = evaluatePage({ path: '/', status: 200, location: null, contentType: 'text/html', body: leaky }).findings.map((f) => f.check).join(' ');
    expect(checks).toMatch(/database URL/);
    expect(checks).toMatch(/raw Prisma error/);
  });

  it('fails a new-tab English exam CTA and counts same-tab ones', () => {
    const sameTab = htmlPage('<a href="https://english.aloeducation.com" class="x">Take</a>');
    expect(evaluatePage({ path: '/', status: 200, location: null, contentType: 'text/html', body: sameTab }).facts.englishCtaLinks).toBe(1);
    const newTab = htmlPage('<a href="https://english.aloeducation.com" target="_blank" rel="noopener noreferrer">Take</a>');
    expect(evaluatePage({ path: '/', status: 200, location: null, contentType: 'text/html', body: newTab }).findings.map((f) => f.check)).toContain('English exam CTA opens a new tab');
  });
});

describe('evaluateApi', () => {
  it('accepts a sanitized 503', () => {
    expect(evaluateApi({ path: '/api/countries', status: 503, body: '{"error":"Service temporarily unavailable"}' }).findings).toEqual([]);
  });
  it('fails a 500 and any leaked connection string', () => {
    expect(evaluateApi({ path: '/api/x', status: 500, body: '{}' }).findings[0].level).toBe('FAIL');
    expect(evaluateApi({ path: '/api/x', status: 200, body: '{"url":"mysql://u:' + 'p@h/db"}' }).findings[0].check).toMatch(/database URL/);
  });
});

describe('evaluateSitemap', () => {
  const base = 'https://aloeducation.com';
  const good = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url><url><loc>${base}/about</loc></url></urlset>`;
  it('passes valid, unique, same-host XML', () => {
    expect(evaluateSitemap(good, base)).toEqual({ findings: [], count: 2 });
  });
  it('fails duplicates, off-host entries and the retired /english-tests URL', () => {
    const bad = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/a</loc></url><url><loc>${base}/a</loc></url><url><loc>https://evil.example/x</loc></url><url><loc>${base}/english-tests</loc></url></urlset>`;
    const checks = evaluateSitemap(bad, base).findings.map((f) => f.check);
    expect(checks).toEqual(expect.arrayContaining(['sitemap duplicates', 'sitemap host', 'sitemap redirect target']));
  });
  it('fails when the document is not XML', () => {
    expect(evaluateSitemap('<html></html>', base).findings[0].check).toBe('sitemap XML declaration');
  });
});

describe('matrix route lists', () => {
  it('covers the English funnel and the offline fallback as public pages', () => {
    for (const p of ['/english-test-prep', '/language-prep', '/offline', '/student/register']) expect(PUBLIC_PAGES).toContain(p);
  });
  it('treats portal pages as protected', () => {
    expect(PROTECTED_PAGES).toEqual(expect.arrayContaining(['/student/mock-tests', '/crm/dashboard']));
  });
});
