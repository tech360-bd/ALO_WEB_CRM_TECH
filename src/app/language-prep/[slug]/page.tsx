import React from 'react';
import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  
  if (!test) {
    return {
      title: 'English Test Preparation | ALO Education',
      description: 'Explore English language tests and preparation guidance.',
    };
  }

  return {
    title: test.seoTitle || `${test.name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
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
  return <TestDetailView slug={slug} />;
}

// Generate static params for 15 tests — dynamic routing by test slug
export async function generateStaticParams() {
  const slugs = [
    'ielts', 'ielts-ukvi', 'pte-academic', 'toefl-ibt', 'duolingo',
    'oietc', 'oxford-ellt', 'languagecert', 'kaplan', 'oet',
    'gre', 'gmat', 'sat', 'act', 'moi'
  ];
  return slugs.map(slug => ({ slug }));
}
