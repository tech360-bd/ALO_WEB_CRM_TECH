export const dynamic = "force-dynamic";
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { PublicUniversityDetail } from '@/components/website/public-pages/PublicPages';
import { getAllUniversitySlugs, getUniversityBySlug } from '@/lib/all-universities';

export async function generateStaticParams() {
  return getAllUniversitySlugs();
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
    description: `Explore ${name} (${country}) courses, entry requirements, tuition fees, scholarships, intakes, and application support from Bangladesh.`,
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
    <div className="min-h-screen bg-slate-50">
      <main className="pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading University Master Profile...</div>}>
          <PublicUniversityDetail slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
