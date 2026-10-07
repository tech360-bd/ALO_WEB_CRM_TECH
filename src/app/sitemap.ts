import type { MetadataRoute } from 'next';
import { ALL_400_UNIVERSITIES, slugify } from '@/lib/all-universities';
import { throwSanitizedDatabaseFailure } from '@/lib/safe-db-error';

// The sitemap contains live CMS/CRM records. Serve it at request time rather
// than querying production MySQL during `next build` or silently omitting rows.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SitemapRow = { slug: string; updatedAt: Date | null };

async function getDatabaseSitemapEntries() {
  const { db } = await import('@/lib/db');
  try {
    return await Promise.all([
      db.blogPost.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 5000 }),
      db.coursePage.findMany({ select: { slug: true, updatedAt: true }, where: { approvalStatus: 'PUBLISHED' }, take: 5000 }),
      db.scholarship.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 2000 }),
    ]);
  } catch (error) {
    throwSanitizedDatabaseFailure('sitemap', error, 'SITEMAP_DATABASE_UNAVAILABLE');
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

  const legalRoutes = ['/privacy-policy','/terms','/cookies','/communication-policy','/lead-data-usage-policy','/user-guide','/accessibility'].map(p=>({ url: `${baseUrl}${p}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 }));
  const infoRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...legalRoutes,
  ];
  const destSlugs = ['uk','canada','australia','usa','ireland','new-zealand','dubai','germany','malaysia','netherlands','cyprus','sweden','south-korea','malta','brazil','russia','india','china','south-africa'];
  const destinationRoutes: MetadataRoute.Sitemap = destSlugs.map((s)=>({ url: `${baseUrl}/destinations/${s}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 }));
  const langPrepSlugs = ['ielts','ielts-ukvi','pte-academic','toefl-ibt','duolingo','oietc','oxford-ellt','languagecert','kaplan','oet','gre','gmat','sat','act','moi'];
  const languagePrepRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/language-prep`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/language-prep/comparison`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    ...langPrepSlugs.map((s)=>({ url: `${baseUrl}/language-prep/${s}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/universities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/course-finder`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/scholarships`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/eligibility-check`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/eligibility-checker`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...destinationRoutes,
    ...languagePrepRoutes,
    { url: `${baseUrl}/book-consultation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...infoRoutes,
  ];

  const universityRoutes: MetadataRoute.Sitemap = ALL_400_UNIVERSITIES.map((uni) => ({
    url: `${baseUrl}/universities/${slugify(uni.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Query only on request. On failure, emit a sanitized server diagnostic and
  // fail the sitemap request instead of omitting database-backed entries.
  const [blogs, courses, scholarships] = await getDatabaseSitemapEntries();

  const map = (rows: SitemapRow[], prefix: string): MetadataRoute.Sitemap => rows
    .filter((row) => Boolean(row.slug))
    .map((row) => ({
      url: `${baseUrl}${prefix}/${row.slug}`,
      lastModified: row.updatedAt ? new Date(row.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  const dynamicRoutes = [
    ...map(blogs, '/blog'),
    ...map(courses, '/courses'),
    ...map(scholarships, '/scholarships'),
  ];

  return [...staticRoutes, ...universityRoutes, ...dynamicRoutes];
}
