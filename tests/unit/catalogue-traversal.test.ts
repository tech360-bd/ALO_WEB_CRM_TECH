import { describe, expect, it } from 'vitest';
import { canonicalCatalogueUrl, discoverCatalogueLinks, traverseCatalogue } from '@/lib/official-crawlers/catalogue-traversal';

const root = 'https://synthetic-university.edu/courses';
const html = (links: string) => `<html><title>Synthetic test catalogue</title>${links}</html>`;
const a = (href: string, label: string) => `<a href="${href}">${label}</a>`;

describe('bounded official catalogue link traversal (synthetic fixtures; no live research)', () => {
  it('does not treat data-href values as actual navigable anchor links', () => {
    const links = discoverCatalogueLinks('<a data-href="/courses/not-a-real-link">Not navigable</a><a data-href="/courses/wrong" href="/courses/real">Real course</a>', root, root);
    expect(links.links.map((link) => link.url)).toEqual([`${root}/real`]);
  });
  it('preserves pagination and official course identifiers while removing only tracking', () => {
    expect(canonicalCatalogueUrl(`${root}?page=2&code=CS101&utm_source=test#fees`)).toBe(`${root}?code=CS101&page=2`);
  });
  it('discovers faculty, departments, programme candidates, pagination and PDFs', () => {
    const result = discoverCatalogueLinks(html(a('/faculties/science', 'Science faculty') + a('/departments/computing', 'Computing department') + a('/courses/mres-computing', 'MRes Computing') + a('?page=2', 'Next') + a('/guide.pdf', 'Admissions guide')), root, root);
    expect(result.links.map((link) => link.kind)).toEqual(['FACULTY', 'DEPARTMENT', 'PROGRAMME_CANDIDATE', 'CATALOGUE', 'DOCUMENT']);
  });
  it('rejects private, non-HTTPS, script and external candidates without fetching them', () => {
    const result = discoverCatalogueLinks(html(a('https://127.0.0.1/courses', 'Courses') + a('http://synthetic-university.edu/courses', 'Courses') + a('javascript:alert(1)', 'Courses') + a('https://third-party.edu/courses', 'Courses')), root, root);
    expect(result.links).toEqual([]); expect(result.excluded).toBe(1);
  });
  it('follows pagination until the linked frontier is exhausted, without asserting catalogue verification', async () => {
    const pages: Record<string, string> = {
      [root]: html(a('?page=2', 'Next') + a('/courses/mres', 'MRes Computing')),
      [`${root}?page=2`]: html(a('?page=3', 'Next')),
      [`${root}?page=3`]: html(a('/courses/top-up', 'Degree Top-up')),
      [`${root}/mres`]: html('Synthetic MRes course page'),
      [`${root}/top-up`]: html('Synthetic top-up course page'),
    };
    const state = await traverseCatalogue(root, async (url) => ({ ok: true, text: pages[url], finalUrl: url, contentType: 'text/html' }), null, 20);
    expect(state.visited).toHaveLength(5);
    expect(state.frontier).toEqual([]);
    expect(state.status).toBe('LINK_GRAPH_EXHAUSTED');
    expect(state.catalogueVerified).toBe(false);
    expect(state.specialProgrammeCandidates.MRES).toContain(`${root}/mres`);
    expect(state.specialProgrammeCandidates.TOP_UP).toContain(`${root}/top-up`);
  });
  it('resumes its exact frontier after restart without revisiting already captured pages', async () => {
    const calls: string[] = [];
    const fetchPage = async (url: string) => { calls.push(url); return { ok: true, text: html(url === root ? a('?page=2', 'Next') : 'Synthetic last page') }; };
    const first = await traverseCatalogue(root, fetchPage, null, 1);
    expect(first.status).toBe('IN_PROGRESS');
    const resumed = await traverseCatalogue(root, fetchPage, JSON.parse(JSON.stringify(first)), 1);
    expect(calls).toEqual([root, `${root}?page=2`]);
    expect(resumed.status).toBe('LINK_GRAPH_EXHAUSTED');
    expect(first.frontier).toHaveLength(1);
  });
  it('deduplicates cycles and fragment variations rather than manufacturing programme counts', async () => {
    const state = await traverseCatalogue(root, async () => ({ ok: true, text: html(a(root, 'Courses') + a('/courses/mphil#fees', 'MPhil') + a('/courses/mphil#entry', 'MPhil')) }));
    expect(state.visited).toHaveLength(2); expect(state.discovered).toHaveLength(1); expect(state.catalogueVerified).toBe(false);
  });
  it('reports official PDF links for review and does not pretend they were parsed', async () => {
    const calls: string[] = [];
    const state = await traverseCatalogue(root, async (url) => { calls.push(url); return { ok: true, text: html(a('/handbook.pdf', 'Programme handbook')) }; });
    expect(calls).toEqual([root]); expect(state.status).toBe('NEEDS_MANUAL_REVIEW'); expect(state.discovered[0].kind).toBe('DOCUMENT');
  });
  it('does not equate a JS/filter page or unavailable page with complete coverage', async () => {
    const dynamic = await traverseCatalogue(root, async () => ({ ok: true, text: html('<button>Load more</button>') }));
    expect(dynamic.status).toBe('NEEDS_MANUAL_REVIEW');
    const failed = await traverseCatalogue(root, async () => ({ ok: false, error: 'HTTP 503' }));
    expect(failed.visited).toHaveLength(0); expect(failed.failures[0].reason).toBe('HTTP 503'); expect(failed.catalogueVerified).toBe(false);
  });
  it('never parses a redirect onto an unapproved third-party host', async () => {
    const state = await traverseCatalogue(root, async () => ({ ok: true, finalUrl: 'https://third-party.edu/courses', text: html(a('/courses/fake', 'MRes Fake')) }));
    expect(state.discovered).toEqual([]); expect(state.failures).toHaveLength(1);
  });
  it('revalidates persisted frontier entries before invoking a fetcher', async () => {
    const first = await traverseCatalogue(root, async () => ({ ok: true, text: html(a('?page=2', 'Next')) }), null, 1);
    first.frontier = [{ url: 'https://127.0.0.1/courses', label: 'Unsafe', kind: 'CATALOGUE', discoveredFrom: root }];
    let calls = 0;
    const state = await traverseCatalogue(root, async () => { calls++; return { ok: false }; }, first);
    expect(calls).toBe(0); expect(state.status).toBe('NEEDS_MANUAL_REVIEW');
  });
});
