/**
 * Catalogue Phase 1 (2026-10-12), K4: the proxy's static-asset bypass must
 * not apply to API routes or role-gated portal pages just because the path
 * contains a dot. Pure policy-function tests (no running server).
 */
import { describe, expect, it } from 'vitest';
import { isStaticAssetBypass, isPublicApiRequest } from '@/proxy';

describe('K4 dotted-path bypass', () => {
  it('never bypasses authentication for catalogue API paths with a dot or extension', () => {
    for (const path of [
      '/api/university-monitoring/changes/abc.json',
      '/api/admin/universities/u1.json',
      '/api/admin/courses/c.1',
      '/api/admin/import/batches/b1.csv/preview',
      '/api/crm/course-import/download-errors.csv',
      '/api/source-logs.js',
      '/api/data-quality.png',
      '/api/import-center/x.css',
      '/api/course-finder/admin.woff2',
      '/api/official-sources/s.svg',
      '/API/admin/universities/u1.json',
      '/api/%61dmin/universities/u1.json',
      '/api%2Fadmin/universities/u1.json',
      '/api/%252e%252e/admin.json',
      '/api',
    ]) {
      expect(isStaticAssetBypass(path), path).toBe(false);
    }
  });

  it('never bypasses role-gated catalogue admin and CRM pages', () => {
    for (const path of [
      '/admin/universities/edit/a.b',
      '/admin/courses/edit/x.json',
      '/admin/data-import/batch.1',
      '/crm/university/u.1',
      '/crm/course/c.json',
      '/super-admin/x.js',
      '/partner-admin/report.csv',
      '/student/documents/file.pdf',
      '/%61dmin/universities/edit/a.b',
    ]) {
      expect(isStaticAssetBypass(path), path).toBe(false);
    }
  });

  it('still bypasses real public static files and Next internals', () => {
    for (const path of [
      '/logo.svg',
      '/manifest.json',
      '/sw.js',
      '/robots.txt',
      '/sitemap.xml',
      '/icons/icon-192.png',
      '/images/hero.jpg',
      '/docs/guide.pdf',
      '/_next/static/chunks/main.js',
      '/_next/image',
      '/public/x.png',
      '/favicon.ico',
    ]) {
      expect(isStaticAssetBypass(path), path).toBe(true);
    }
  });

  it('dotted catalogue API paths fall through to the normal public/protected API policy', () => {
    // Not public: these now reach the 401/403 gate instead of the bypass.
    expect(isPublicApiRequest('/api/university-monitoring/changes/abc.json', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/admin/universities/u1.json', 'GET')).toBe(false);
  });
});
