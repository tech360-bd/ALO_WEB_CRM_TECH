import type { MetadataRoute } from 'next';

// Sitemap data is requested at runtime so published CMS records appear without
// a rebuild. If MySQL is temporarily unavailable, public static routes are
// still returned as valid XML; the server logs only a sanitized diagnostic.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SitemapRow = { slug: string; updatedAt: Date | null };
type DatabaseEntries = {
  blogs: SitemapRow[];
  courses: SitemapRow[];
  scholarships: SitemapRow[];
  universities: SitemapRow[];
};

async function getDatabaseSitemapEntries(): Promise<DatabaseEntries | null> {
  const { db } = await import('@/lib/db');
  try {
    const [blogs, courses, scholarships, universities] = await Promise.all([
      db.blogPost.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 5000 }),
      db.coursePage.findMany({ select: { slug: true, updatedAt: true }, where: { approvalStatus: 'PUBLISHED' }, take: 5000 }),
      db.scholarship.findMany({ select: { slug: true, updatedAt: true }, where: { status: 'PUBLISHED' as any }, take: 2000 }),
      db.universityPage.findMany({ select: { slug: true, updatedAt: true }, where: { approvalStatus: 'PUBLISHED' }, take: 5000 }),
    ]);
    return { blogs, courses, scholarships, universities };
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
    console.error('[sitemap] Database operation failed; serving static fallback.', { code });
    return null;
  }
}

const STATIC_PATHS: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['', 'daily', 1.0],
  ['/about', 'monthly', 0.6], ['/contact', 'monthly', 0.6],
  ['/universities', 'daily', 0.9], ['/courses', 'daily', 0.9], ['/course-finder', 'daily', 0.9],
  ['/destinations', 'weekly', 0.8], ['/scholarships', 'weekly', 0.8], ['/services', 'weekly', 0.8],
  ['/resources', 'weekly', 0.8], ['/blog', 'daily', 0.9], ['/language-prep', 'weekly', 0.8],
  ['/language-prep/comparison', 'weekly', 0.7], ['/eligibility-check', 'weekly', 0.8],
  ['/compare', 'weekly', 0.7], ['/book-consultation', 'weekly', 0.7], ['/visa-support', 'weekly', 0.7],
  ['/application-guide', 'monthly', 0.6], ['/application-process', 'monthly', 0.6],
  ['/admission-requirements', 'monthly', 0.6], ['/english-test-prep', 'weekly', 0.7],
  ['/english-tests', 'weekly', 0.7], ['/news', 'daily', 0.6], ['/events', 'daily', 0.6],
  ['/success-stories', 'monthly', 0.6], ['/team', 'monthly', 0.5], ['/faqs', 'monthly', 0.5],
  ['/privacy-policy', 'monthly', 0.3], ['/terms', 'monthly', 0.3], ['/cookies', 'monthly', 0.3],
  ['/communication-policy', 'monthly', 0.3], ['/lead-data-usage-policy', 'monthly', 0.3],
  ['/user-guide', 'monthly', 0.3], ['/accessibility', 'monthly', 0.3],
];

const DESTINATION_SLUGS = [
  'uk', 'canada', 'australia', 'usa', 'ireland', 'new-zealand', 'dubai', 'germany', 'malaysia',
  'netherlands', 'cyprus', 'sweden', 'south-korea', 'malta', 'brazil', 'russia', 'india', 'china', 'south-africa',
];
const LANGUAGE_PREP_SLUGS = [
  'ielts', 'ielts-ukvi', 'pte-academic', 'toefl-ibt', 'duolingo', 'oietc', 'oxford-ellt',
  'languagecert', 'kaplan', 'oet', 'gre', 'gmat', 'sat', 'act', 'moi',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    ...STATIC_PATHS.map(([path, changeFrequency, priority]) => ({
      url: `${baseUrl}${path}`, lastModified: now, changeFrequency, priority,
    })),
    ...DESTINATION_SLUGS.map((slug) => ({
      url: `${baseUrl}/destinations/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
    })),
    ...LANGUAGE_PREP_SLUGS.map((slug) => ({
      url: `${baseUrl}/language-prep/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
    })),
  ];

  const databaseEntries = await getDatabaseSitemapEntries();
  const mapRows = (rows: SitemapRow[], prefix: string): MetadataRoute.Sitemap => rows
    .filter((row) => Boolean(row.slug))
    .map((row) => ({
      url: `${baseUrl}${prefix}/${encodeURIComponent(row.slug)}`,
      lastModified: row.updatedAt ? new Date(row.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  const dynamicEntries = databaseEntries ? [
    ...mapRows(databaseEntries.blogs, '/blog'),
    ...mapRows(databaseEntries.courses, '/courses'),
    ...mapRows(databaseEntries.scholarships, '/scholarships'),
    ...mapRows(databaseEntries.universities, '/universities'),
  ] : [];

  // CMS datasets can contain duplicate slugs or collide with a static route.
  // Deduplicate by canonical URL so crawlers receive one entry per page.
  return [...new Map([...staticEntries, ...dynamicEntries].map((entry) => [entry.url, entry])).values()];
}
