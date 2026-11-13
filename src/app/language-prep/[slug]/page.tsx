import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getEnglishPrepTestBySlugFromDB } from '@/lib/language-prep/service';
import TestDetailView from '@/components/language-prep/TestDetailView';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const test = await getEnglishPrepTestBySlugFromDB(slug);
  if (!test) {
    return {
      title: 'Language Preparation | ALO Education',
      description: 'Explore language-preparation information after current source review.',
      robots: { index: false, follow: true },
    };
  }

  return {
    title: test.seoTitle || `${test.name} Preparation | ALO Education`,
    description: test.seoDescription,
    alternates: { canonical: `https://aloeducation.com/language-prep/${test.slug}` },
    openGraph: {
      title: test.seoTitle,
      description: test.seoDescription,
      url: `https://aloeducation.com/language-prep/${test.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: test.seoTitle,
      description: test.seoDescription,
    },
  };
}

export default async function LanguagePrepDetailPage({ params }: Props) {
  const { slug } = await params;
  const test = await getEnglishPrepTestBySlugFromDB(slug);
  if (!test) notFound();
  return <TestDetailView slug={test.slug} initialTest={test} />;
}

/** DB-managed catalogue entries are rendered dynamically, never seeded from hard-coded fallback data. */
export async function generateStaticParams() {
  return [];
}
