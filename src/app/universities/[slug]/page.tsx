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
  return {
    title: `${name} University Information and Courses | ALO Education`,
    description: `Review university details and courses with listed intakes from January 2027 through January 2028. International eligibility, codes, source evidence, and verification status are shown only where recorded.`,
    alternates: {
      canonical: `https://aloeducation.com/universities/${slug}`,
    },
    openGraph: {
      title: `${name} University Information and Courses | ALO Education`,
      description: `University and course records, upcoming intake information, and source/verification details where available.`,
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
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading university information and intake-window course records…</div>}>
          <UniversityHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
