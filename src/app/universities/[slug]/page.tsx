import React, { Suspense } from 'react';
import { Metadata } from 'next';
import UniversityHub from '@/components/website/UniversityHub';
import { getAllUniversitySlugs, getUniversityBySlug } from '@/lib/all-universities';

export async function generateStaticParams() {
  return getAllUniversitySlugs().slice(0, 50); // Limit static gen for performance
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const uni = getUniversityBySlug(slug);
  const name = uni ? uni.name : slug.replace(/-/g, ' ').toUpperCase();
  const country = uni?.country || 'UK';

  return {
    title: `${name} Courses, Fees & Admission | ALO Education`,
    description: `Explore ${name} (${country}) courses, entry requirements, tuition fees, scholarships, intakes, and application support from Bangladesh. Complete university information hub with 28 sections — DB-driven, verified, actionable.`,
    alternates: {
      canonical: `https://aloeducation.com/universities/${slug}`,
    },
    openGraph: {
      title: `${name} Courses, Fees & Admission | ALO Education`,
      description: `Official admissions guidance, available degree levels, QS World University Ranking #${uni?.worldRanking || 'Top 200'}, and scholarship guidance for international students.`,
      url: `https://aloeducation.com/universities/${slug}`,
      type: 'website',
    },
  };
}

export default async function UniversityDetailPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading University Master Profile — DB-driven with 28 sections...</div>}>
          <UniversityHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
