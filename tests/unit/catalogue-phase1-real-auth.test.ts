/**
 * Catalogue Phase 1 (2026-10-12): unauthenticated requests against the REAL
 * auth middleware. Only `@/lib/db` and `next-auth` are mocked, so this proves
 * the handlers themselves refuse anonymous and forged-bearer callers before
 * any catalogue read or write, independent of the proxy.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const calls: string[] = [];
  const any = (name: string) => new Proxy({}, {
    get: (_t, op: string) => (..._args: unknown[]) => { calls.push(`${name}.${op}`); return Promise.resolve(op.startsWith('findMany') ? [] : null); },
  });
  const db = new Proxy({}, { get: (_t, model: string) => any(model) });
  return { calls, db };
});

vi.mock('@/lib/db', () => ({ db: h.db }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn(() => Promise.resolve(null)), NextAuth: vi.fn() }));

import { NextRequest } from 'next/server';
import { GET as downloadErrors } from '@/app/api/crm/course-import/download-errors/route';
import { GET as sourceLogsGET, POST as sourceLogsPOST } from '@/app/api/source-logs/route';
import { GET as dataQualityGET, POST as dataQualityPOST } from '@/app/api/data-quality/route';
import { PATCH as importCenterPATCH } from '@/app/api/import-center/route';
import { POST as cfaPOST, PATCH as cfaPATCH } from '@/app/api/course-finder/admin/route';

const CATALOGUE_TABLES = /^(crmImportError|sourceLog|officialSource|dataQualityScore|crmCourse|crmUniversity|coursePage|universityPage|countryPage|examPage|auditLog)\./;

beforeEach(() => { h.calls.length = 0; });

describe('catalogue handlers refuse unauthenticated callers with the real auth middleware', () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    ['download-errors GET', () => downloadErrors(new NextRequest('https://alo.test/api/crm/course-import/download-errors?batchId=b1') as never)],
    ['source-logs GET', () => sourceLogsGET(new NextRequest('https://alo.test/api/source-logs'))],
    ['source-logs POST', () => sourceLogsPOST(new NextRequest('https://alo.test/api/source-logs', { method: 'POST', body: '{"entityType":"course","entityId":"C1","sourceUrl":"https://u.ac.uk"}' }))],
    ['data-quality GET', () => dataQualityGET(new NextRequest('https://alo.test/api/data-quality?entityId=C1'))],
    ['data-quality POST', () => dataQualityPOST(new NextRequest('https://alo.test/api/data-quality', { method: 'POST', body: '{"entityId":"C1"}' }))],
    ['import-center PATCH', () => importCenterPATCH(new NextRequest('https://alo.test/api/import-center', { method: 'PATCH', body: '{"type":"course","slug":"x","action":"publish"}' }))],
    ['course-finder/admin POST', () => cfaPOST(new NextRequest('https://alo.test/api/course-finder/admin', { method: 'POST', body: '{}' }) as never)],
    ['course-finder/admin PATCH', () => cfaPATCH(new NextRequest('https://alo.test/api/course-finder/admin', { method: 'PATCH', body: '{"id":"x"}' }) as never)],
  ];
  for (const [name, call] of cases) {
    it(`${name}: 401 and no catalogue access`, async () => {
      const res = await call();
      expect(res.status).toBe(401);
      expect(h.calls.filter((c) => CATALOGUE_TABLES.test(c))).toEqual([]);
    });
  }

  it('a forged bearer token is also refused before catalogue access', async () => {
    const res = await downloadErrors(new NextRequest('https://alo.test/api/crm/course-import/download-errors?batchId=b1', { headers: { authorization: 'Bearer forged' } }) as never);
    expect(res.status).toBe(401);
    expect(h.calls.filter((c) => CATALOGUE_TABLES.test(c))).toEqual([]);
  });
});
