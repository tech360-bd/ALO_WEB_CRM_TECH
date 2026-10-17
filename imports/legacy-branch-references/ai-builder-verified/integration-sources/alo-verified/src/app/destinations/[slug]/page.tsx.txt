export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import CountryPageView, {
  type CountryPageData,
  type CountryUniversity,
  type CountryCourse,
  type CountryScholarship,
  type CountryFaq,
} from './CountryPageView';

/**
 * Generate SEO-friendly metadata per country.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = await db.country.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      flagEmoji: true,
      currency: true,
      language: true,
      visaInfo: true,
    },
  });

  if (!country) {
    return {
      title: 'Country not found | ALO Education',
      description: 'The requested country page could not be found.',
    };
  }

  const title = `Study in ${country.name} from Bangladesh | ALO Education`;
  const description =
    country.description ||
    `Complete guide for Bangladeshi students to study in ${country.name}: universities, courses, tuition fees, scholarships, visa requirements, work rights, and post-study options.`;

  return {
    title,
    description,
    keywords: [
      `study in ${country.name}`,
      `${country.name} student visa`,
      `${country.name} universities`,
      `study abroad ${country.name}`,
      'ALO Education',
    ],
    openGraph: {
      title,
      description,
      siteName: 'ALO Education',
      type: 'website',
    },
    alternates: {
      canonical: `/destinations/${country.slug}`,
    },
  };
}

/**
 * Server component for /destinations/[slug].
 *
 * - Fetches the country by slug directly from the DB (fast + crawlable).
 * - Returns 404 if the country does not exist or is not active.
 * - Fetches related public data (universities, courses, scholarships, FAQs)
 *   in parallel — these are computed by matching University.country to the
 *   country name (DB stores "UK", "Canada", "Australia" — human-readable).
 * - Passes everything to the client CountryPageView component which handles
 *   interactive sections (Tabs, Accordion, consultation form).
 */
export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const country = await db.country.findUnique({
    where: { slug },
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

  if (!country || country.status !== 'active') {
    notFound();
  }

  // Match University.country by either slug or human-readable name. SQLite
  // (dev DB) does not support Prisma's `mode: 'insensitive'` option, so we
  // pre-compute several case variants and use plain `equals` queries.
  const countryVariants = Array.from(
    new Set([
      slug,
      country.name,
      slug.toLowerCase(),
      slug.toUpperCase(),
      country.name.toLowerCase(),
      country.name.toUpperCase(),
    ])
  ).filter(Boolean);
  const countryMatch = countryVariants.map((v) => ({ country: { equals: v } }));

  const [universities, courses, scholarships, faqs] = await Promise.all([
    db.university.findMany({
      where: { status: 'active', OR: countryMatch },
      orderBy: [{ ranking: 'asc' }, { name: 'asc' }],
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        city: true,
        website: true,
        logoUrl: true,
        bannerUrl: true,
        ranking: true,
        type: true,
        description: true,
        fees: true,
        scholarshipAvailable: true,
      },
    }) as Promise<CountryUniversity[]>,
    db.course.findMany({
      where: {
        status: 'active',
        university: { OR: countryMatch },
      },
      orderBy: { name: 'asc' },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        field: true,
        duration: true,
        tuitionFee: true,
        currency: true,
        entryRequirements: true,
        englishRequirement: true,
        scholarshipAvailable: true,
        description: true,
        university: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
          },
        },
      },
    }) as Promise<CountryCourse[]>,
    db.scholarship.findMany({
      where: {
        AND: [
          {
            OR: [{ status: 'active' }, { status: 'published' }],
          },
          {
            OR: countryMatch,
          },
        ],
      },
      orderBy: [{ deadline: 'asc' }, { name: 'asc' }],
      take: 6,
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        eligibility: true,
        deadline: true,
        type: true,
        country: true,
        university: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            city: true,
          },
        },
      },
    }) as Promise<CountryScholarship[]>,
    db.faq
      .findMany({
        where: {
          OR: [{ status: 'active' }, { status: 'published' }],
        },
        orderBy: { orderNum: 'asc' },
        take: 50,
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
        },
      })
      .then((allFaqs) => {
        // Filter FAQs to those mentioning the country (case-insensitive
        // contains on question or answer). Tries both the slug ("uk") and
        // the human-readable name ("United Kingdom"). Falls back to visa /
        // admission / general category FAQs if no country-specific match.
        const aliases = Array.from(
          new Set([
            country.name.toLowerCase(),
            country.slug.toLowerCase(),
            country.name.toUpperCase(),
            country.slug.toUpperCase(),
          ])
        ).filter(Boolean);
        const matched = allFaqs.filter((f) => {
          const q = (f.question || '').toLowerCase();
          const a = (f.answer || '').toLowerCase();
          return aliases.some((alias) => q.includes(alias) || a.includes(alias));
        }) as CountryFaq[];
        if (matched.length > 0) return matched;
        // Fallback: general visa/admission FAQs (no country-specific data).
        return allFaqs.filter((f) =>
          ['visa', 'admission', 'general'].includes(
            (f.category || '').toLowerCase()
          )
        ) as CountryFaq[];
      }),
  ]);

  // Compute live counts for the Quick Facts section.
  const liveUniCount = universities.length;
  const liveCourseCount = courses.length;
  const liveScholarshipCount = scholarships.length;

  // Extract popular cities from universities
  const popularCities = Array.from(
    new Set(
      universities
        .map((u) => u.city)
        .filter((c): c is string => Boolean(c && c.trim().length > 0))
    )
  );

  // Extract study levels from courses
  const studyLevels = Array.from(
    new Set(
      courses
        .map((c) => c.level)
        .filter((l): l is string => Boolean(l && l.trim().length > 0))
    )
  );

  const data: CountryPageData = {
    country: {
      ...country,
      // ISO date string for the client
      updatedAt: country.updatedAt.toISOString(),
    },
    universities,
    courses,
    scholarships,
    faqs,
    counts: {
      universities: Math.max(country.universityCount || 0, liveUniCount),
      courses: liveCourseCount,
      scholarships: liveScholarshipCount,
    },
    popularCities,
    studyLevels,
  };

  return <CountryPageView data={data} />;
}
