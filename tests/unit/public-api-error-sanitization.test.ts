/**
 * ALO Education — public API error-sanitization regression tests.
 *
 * 2026-10-08 production verification: public endpoints echoed raw Prisma/MySQL
 * driver messages to anonymous clients, e.g.
 *   GET /api/courses      → "Authentication failed against database server, the
 *                            provided database credentials for `aloeduca_...`
 *                            are not valid."
 *   GET /api/universities → same leak.
 * That discloses internal DB usernames/hosts. Public APIs must log the detail
 * server-side and return a generic message.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    crmCourse: { findMany: vi.fn() },
    crmUniversity: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/db', () => ({ db: dbMock }));

import { GET as coursesGET } from '@/app/api/courses/route';
import { GET as universitiesGET } from '@/app/api/universities/route';

const SECRET_ERROR = Object.assign(
  new Error(
    "Authentication failed against database server, the provided database credentials for `aloeduca_secret_user` are not valid at `mysql.internal.host`"
  ),
  { code: 'P1000' }
);

describe('public API error sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('GET /api/courses returns a generic 500 and never echoes driver details', async () => {
    dbMock.crmCourse.findMany.mockRejectedValue(SECRET_ERROR);

    const res = await coursesGET(new NextRequest('http://localhost/api/courses?limit=1'));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('Failed to load courses');
    expect(text).not.toContain('aloeduca_secret_user');
    expect(text).not.toContain('mysql.internal.host');
    expect(text).not.toContain('P1000');
  });

  it('GET /api/universities returns a generic 500 and never echoes driver details', async () => {
    dbMock.crmUniversity.findMany.mockRejectedValue(SECRET_ERROR);

    const res = await universitiesGET(new NextRequest('http://localhost/api/universities?limit=1'));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('Failed to load universities');
    expect(text).not.toContain('aloeduca_secret_user');
    expect(text).not.toContain('mysql.internal.host');
    expect(text).not.toContain('P1000');
  });
});
