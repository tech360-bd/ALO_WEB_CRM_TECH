import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { testDatabaseUrl } from '../helpers/test-database';
import { REQUIRED_TEST_SLUGS } from '@/lib/language-prep/editorial';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
const suite = url ? describe : describe.skip;
suite('migrated real language preparation catalogue', () => {
  afterAll(async () => prisma.$disconnect());
  it('contains every requested test family exactly once after additive migrations', async () => {
    const rows = await prisma.englishPrepTest.findMany({ where: { slug: { in: [...REQUIRED_TEST_SLUGS] } } });
    expect(rows.map(row => row.slug).sort()).toEqual([...REQUIRED_TEST_SLUGS].sort());
    expect(rows.every(row => row.status === 'active' && row.sourceUrl.startsWith('https://'))).toBe(true);
  });
});
