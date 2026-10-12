import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function worker() {
  const handlers = {};
  const cache = { match: vi.fn().mockResolvedValue(undefined), put: vi.fn(), add: vi.fn() };
  const caches = { open: vi.fn().mockResolvedValue(cache), match: vi.fn(), keys: vi.fn(), delete: vi.fn() };
  const fetch = vi.fn().mockResolvedValue(new Response('network response'));
  const self = { location: { origin: 'https://aloeducation.com' }, addEventListener: (type, fn) => { handlers[type] = fn; }, clients: { claim: vi.fn() } };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, caches, fetch, URL, Request, Response });
  return { handlers, cache, caches, fetch };
}

describe('public-asset-only service worker', () => {
  it.each(['/api/student/documents', '/api/portal-auth/me', '/api/course-finder'])('does not intercept or cache API request %s', path => {
    const { handlers, caches } = worker();
    const respondWith = vi.fn();
    handlers.fetch({ request: { url: 'https://aloeducation.com' + path, method: 'GET', mode: 'cors' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });
  it('never serves cached student portal HTML', async () => {
    const { handlers, cache, fetch } = worker();
    let pending;
    handlers.fetch({ request: { url: 'https://aloeducation.com/student', method: 'GET', mode: 'navigate' }, respondWith: promise => { pending = promise; } });
    expect(await (await pending).text()).toBe('network response');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(cache.match).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });
  it('does not cache assets marked private by the server', async () => {
    const { handlers, cache, fetch } = worker();
    fetch.mockResolvedValue(new Response('private bytes', { headers: { 'Cache-Control': 'private, no-store' } }));
    let pending;
    handlers.fetch({ request: { url: 'https://aloeducation.com/images/hero.png', method: 'GET', mode: 'cors' }, respondWith: promise => { pending = promise; } });
    await pending;
    expect(cache.put).not.toHaveBeenCalled();
  });
  it('purges obsolete ALO caches while leaving unrelated caches alone', async () => {
    const { handlers, caches } = worker();
    caches.keys.mockResolvedValue(['alo-education-v1-api', 'alo-education-v1-dynamic', 'alo-education-v2-20261009-static', 'other-app']);
    let pending;
    handlers.activate({ waitUntil: promise => { pending = promise; } });
    await pending;
    expect(caches.delete.mock.calls.map(([key]) => key)).toEqual(['alo-education-v1-api', 'alo-education-v1-dynamic']);
  });
});
