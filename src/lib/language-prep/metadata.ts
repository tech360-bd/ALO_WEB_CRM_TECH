import type { Metadata } from 'next';
import { getEnglishPrepTestBySlugFromDB } from './service';

export async function getLanguagePrepMetadata(slug: string): Promise<Metadata> {
  const test = await getEnglishPrepTestBySlugFromDB(slug);
  if (!test) {
    return {
      title: 'Language Preparation | ALO Education',
      description: 'Explore language-preparation information after current source review.',
      robots: { index: false, follow: true },
    };
  }

  const title = test.seoTitle || `${test.name} Preparation | ALO Education`;
  const description = test.seoDescription || 'Confirm current test requirements with official providers and institutions.';
  const canonical = `https://aloeducation.com/language-prep/${test.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}
