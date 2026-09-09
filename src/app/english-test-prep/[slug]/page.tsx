import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTestPrepBySlug, MASTER_TEST_PREP_DATA } from '@/lib/test-prep-data';
import MasterTestPrepView from '@/components/website/MasterTestPrepView';

export async function generateStaticParams() {
  return Object.keys(MASTER_TEST_PREP_DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestPrepBySlug(slug);

  if (!test) {
    return {
      title: 'English Test Preparation | ALO Education Bangladesh',
      description: 'Master IELTS, PTE, TOEFL, and Duolingo with ALO Education test prep coaches.',
    };
  }

  return {
    title: `${test.name} Preparation & University Score Planning | ALO Education`,
    description: test.heroSubtitle,
    alternates: {
      canonical: `https://aloeducation.com/english-test-prep/${test.slug}`,
    },
    openGraph: {
      title: test.name,
      description: test.heroSubtitle,
      url: `https://aloeducation.com/english-test-prep/${test.slug}`,
      type: 'website',
    },
  };
}

export default async function TestPrepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getTestPrepBySlug(slug);

  if (!test) {
    notFound();
  }

  return <MasterTestPrepView test={test} />;
}
