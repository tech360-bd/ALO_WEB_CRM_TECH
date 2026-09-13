import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ScholarshipDetailHub from '@/components/website/ScholarshipDetailHub';
import { MASTER_SCHOLARSHIPS_DATA, getScholarshipBySlug } from '@/lib/scholarships-data';

export async function generateStaticParams() {
  return MASTER_SCHOLARSHIPS_DATA.slice(0, 20).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = getScholarshipBySlug(slug);

  if (!scholarship) {
    return {
      title: 'Scholarship Details | ALO Education',
      description: 'Explore global study abroad scholarships and funding opportunities. Complete scholarship detail with 29 sections — DB-driven, verified, actionable.',
    };
  }

  return {
    title: `${scholarship.title} | How, When, What & Benefits | ALO Education`,
    description: scholarship.description + ' Complete scholarship detail page with 29 sections per spec — DB-driven, related content, FAQ, source verification.',
    alternates: {
      canonical: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    openGraph: {
      title: scholarship.title,
      description: scholarship.description,
      url: `https://aloeducation.com/scholarships/${scholarship.slug}`,
      type: 'website',
    },
  };
}

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-20">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Scholarship Detail — DB-driven with 29 sections...</div>}>
          <ScholarshipDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
