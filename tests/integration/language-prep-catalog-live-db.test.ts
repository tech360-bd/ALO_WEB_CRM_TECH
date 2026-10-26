import { afterAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { testDatabaseUrl } from '../helpers/test-database';
import { REQUIRED_TEST_SLUGS } from '@/lib/language-prep/editorial';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
const suite = url ? describe : describe.skip;
suite('migrated real language preparation catalogue', () => {
  const fixtureIds: string[] = [];
  afterAll(async () => {
    if (fixtureIds.length) await prisma.englishPrepRequirement.deleteMany({ where: { id: { in: fixtureIds } } });
    vi.doUnmock('@/lib/db');
    await prisma.$disconnect();
  });
  it('queries and filters real stored requirements through the public API', async () => {
    const test = await prisma.englishPrepTest.findUniqueOrThrow({ where: { slug: 'pte-academic' } });
    const unique = `Disposable integration fixture ${randomUUID()}`;
    const fixture = await prisma.englishPrepRequirement.create({ data: { testId: test.id, universityName: unique, countryName: 'Canada', courseName: 'Integration fixture course', minimumScore: '70', sourceUrl: 'https://example.org/test-fixture-only', status: 'active' } });
    fixtureIds.push(fixture.id);
    // The API receives a real Prisma client pinned to the safety-validated disposable database.
    vi.doMock('@/lib/db', () => ({ db: prisma }));
    const { GET } = await import('@/app/api/language-prep/requirements/route');
    const query = new URLSearchParams({ university: unique, country: 'Canada', test: 'pte-academic' });
    const response = await GET(new Request(`http://localhost/api/language-prep/requirements?${query}`));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.requirements).toHaveLength(1);
    expect(payload.requirements[0]).toMatchObject({ id: fixture.id, minimumScore: '70', testName: test.name });
    query.set('test', 'ielts');
    const other = await GET(new Request(`http://localhost/api/language-prep/requirements?${query}`));
    expect(other.status).toBe(200);
    expect((await other.json()).requirements).toEqual([]);
  });
  it('contains every requested test family exactly once after additive migrations', async () => {
    const rows = await prisma.englishPrepTest.findMany({ where: { slug: { in: [...REQUIRED_TEST_SLUGS] } } });
    expect(rows.map(row => row.slug).sort()).toEqual([...REQUIRED_TEST_SLUGS].sort());
    expect(rows.every(row => row.status === 'active' && row.sourceUrl.startsWith('https://'))).toBe(true);
  });
});
