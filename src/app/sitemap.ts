import { MetadataRoute } from 'next';
import { ukUniversitiesPart1 } from '@/lib/university-data-uk';
import { ukUniversitiesPart2 } from '@/lib/university-data-uk2';
import { allIntlUniversities } from '@/lib/university-data-intl';
import { slugify } from '@/lib/all-universities';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/universities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/course-finder`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/eligibility-check`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/scholarships`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/uk`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/usa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/canada`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/australia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/germany`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/ireland`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/destinations/new-zealand`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const allUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...allIntlUniversities];
  const universityRoutes: MetadataRoute.Sitemap = allUnis.map((uni) => ({
    url: `${baseUrl}/universities/${slugify(uni.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...universityRoutes];
}
