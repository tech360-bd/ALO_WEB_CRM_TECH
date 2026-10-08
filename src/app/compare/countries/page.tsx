import type { Metadata } from 'next';
import { Suspense } from 'react';
import CountryComparisonClient from '@/components/website/CountryComparisonClient';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicFrame } from '@/components/website/alo-public-primitives';
import {
  buildComparisonModel,
  getComparableCountries,
  type CountryComparisonModel,
} from '@/lib/country-comparison';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Compare Study Abroad Countries — Tuition, Living Costs, Visa & Work Rights',
  description:
    'Compare up to four study destinations side by side: tuition fees, living costs, student visa type, work rights, post-study options, intakes and English requirements from verified official sources.',
  alternates: { canonical: '/compare/countries' },
  openGraph: {
    title: 'Compare Study Abroad Countries | ALO Education',
    description:
      'Side-by-side destination comparison for Bangladeshi students — costs, visa rules, work rights and English requirements from verified sources.',
    url: '/compare/countries',
    type: 'website',
  },
};

/**
 * Real catalogue depth per country, read from the ALO database. Counts are only
 * attached when the query succeeds and returns a non-zero figure; otherwise the
 * corresponding comparison row is omitted entirely rather than estimated.
 */
async function loadCatalogueCounts(): Promise<Record<string, { universities: number; courses: number }>> {
  try {
    const [universityGroups, courseGroups] = await Promise.all([
      db.crmUniversity.groupBy({ by: ['country'], _count: { _all: true } }),
      db.crmCourse.groupBy({ by: ['country'], _count: { _all: true } }),
    ]);

    const normalise = (value: string) => value.trim().toLowerCase();
    const universities = new Map(universityGroups.map((group) => [normalise(group.country), group._count._all]));
    const courses = new Map(courseGroups.map((group) => [normalise(group.country), group._count._all]));

    const counts: Record<string, { universities: number; courses: number }> = {};
    for (const country of getComparableCountries()) {
      // Country records store the destination either as a full name or a code,
      // so match on both. Anything unmatched stays absent, which hides the row.
      const keys = [normalise(country.name), normalise(country.slug)];
      const universityCount = keys.map((key) => universities.get(key)).find((value) => value !== undefined);
      const courseCount = keys.map((key) => courses.get(key)).find((value) => value !== undefined);
      if (universityCount || courseCount) {
        counts[country.slug] = { universities: universityCount ?? 0, courses: courseCount ?? 0 };
      }
    }
    return counts;
  } catch (error) {
    // A missing or unreachable database must not break the comparison — the
    // affected rows are simply not shown.
    console.error('[compare/countries] catalogue counts unavailable:', error);
    return {};
  }
}

export default async function CompareCountriesPage({
  searchParams,
}: {
  searchParams: Promise<{ countries?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.countries) ? params.countries[0] : params.countries;
  const requested = (raw ?? '').split(',').map((slug) => slug.trim()).filter(Boolean);

  const counts = await loadCatalogueCounts();
  const model: CountryComparisonModel = buildComparisonModel(requested, counts);

  return (
    <Suspense fallback={<ComparisonSkeleton />}>
      <CountryComparisonClient allCountries={getComparableCountries()} model={model} />
    </Suspense>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="min-h-screen bg-alo-page pb-20">
      <PublicFrame className="py-12">
        <Skeleton className="h-4 w-56 rounded-button" />
        <Skeleton className="mt-4 h-11 w-[520px] max-w-full rounded-button" />
        <Skeleton className="mt-3 h-5 w-[640px] max-w-full rounded-button" />
        <Skeleton className="mt-10 h-[320px] w-full rounded-2xl" />
      </PublicFrame>
    </div>
  );
}
