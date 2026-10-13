import type { Metadata } from 'next';
import { db } from '@/lib/db';
import DestinationsClient, { type DestinationsCountry } from './DestinationsClient';

export const metadata: Metadata = {
  title: 'Study Abroad Destinations | ALO Education',
  description:
    'Explore top study-abroad destinations for Bangladeshi students — UK, Canada, Australia, USA, Ireland, New Zealand, and Dubai. Compare universities, tuition, scholarships, and visa requirements with ALO Education.',
  keywords: [
    'study abroad',
    'study destinations',
    'study in UK',
    'study in Canada',
    'study in Australia',
    'study in USA',
    'study in Ireland',
    'study in New Zealand',
    'study in Dubai',
    'ALO Education',
  ],
  openGraph: {
    title: 'Study Abroad Destinations | ALO Education',
    description:
      'Compare 7 top study-abroad destinations for Bangladeshi students. Real data on universities, tuition, scholarships, and visa rules — only on ALO Education.',
    siteName: 'ALO Education',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

/**
 * Server component — renders the public /destinations landing page.
 *
 * Countries are fetched directly from the DB on the server so the HTML is
 * pre-rendered (fast first paint + crawlable by search engines). The
 * interactive grid (hover states, mobile menu) is delegated to a client
 * component.
 */
export default async function DestinationsPage() {
  let countries: DestinationsCountry[] = [];

  try {
    const rows = await db.country.findMany({
      where: { status: 'active' },
      orderBy: [{ popular: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        flagEmoji: true,
        description: true,
        whyStudy: true,
        costOfLiving: true,
        visaInfo: true,
        workRights: true,
        postStudyWork: true,
        popular: true,
        universityCount: true,
        avgTuition: true,
        language: true,
        currency: true,
        bannerUrl: true,
        status: true,
        updatedAt: true,
      },
    });
    // Serialize Date fields → ISO strings for the client component.
    countries = rows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString(),
    })) as DestinationsCountry[];
  } catch (error) {
    console.error('destinations/page fetch error:', error);
    countries = [];
  }

  return <DestinationsClient countries={countries} />;
}
