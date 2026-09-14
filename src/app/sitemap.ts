import { MetadataRoute } from 'next';
import { ukUniversitiesPart1 } from '@/lib/university-data-uk';
import { ukUniversitiesPart2 } from '@/lib/university-data-uk2';
import { allIntlUniversities } from '@/lib/university-data-intl';
import { slugify } from '@/lib/all-universities';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/universities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/course-finder`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/scholarships`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/eligibility-check`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/uk`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/destinations/usa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/destinations/canada`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/destinations/australia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/destinations/germany`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/destinations/ireland`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/destinations/new-zealand`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/book-consultation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const allUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...allIntlUniversities];
  const universityRoutes: MetadataRoute.Sitemap = allUnis.map((uni) => ({
    url: `${baseUrl}/universities/${slugify(uni.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic routes from DB (blogs, courses, scholarships, resources) — best-effort, sandbox-safe
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    // Lazy import to avoid build-time DB requirement in sandbox without DATABASE_URL
    const { db } = await import('@/lib/db');
    const [blogs, courses, scholarships] = await Promise.all([
      db.blogPost.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 5000 }).catch(() => [] as any[]),
      db.coursePage.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 5000 }).catch(() => [] as any[]),
      db.scholarship.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 2000 }).catch(() => [] as any[]),
    ]);
    const map = (rows: any[], prefix: string, weekly = true): MetadataRoute.Sitemap =>
      rows.filter((r: any) => r?.slug).map((r: any) => ({
        url: `${baseUrl}${prefix}/${r.slug}`,
        lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        changeFrequency: weekly ? 'weekly' : 'daily',
        priority: 0.7,
      }));
    dynamicRoutes = [
      ...map(blogs as any, '/blog'),
      ...map(courses as any, '/courses'),
      ...map(scholarships as any, '/scholarships'),
    ];
  } catch {
    // DB unavailable during static build — keep static + university routes only (no crash)
  }

  return [...staticRoutes, ...universityRoutes, ...dynamicRoutes];
}
