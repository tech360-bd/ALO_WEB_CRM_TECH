import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('oxford-ellt');

export const metadata: Metadata = {
  title: test?.seoTitle || 'oxford-ellt Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for oxford-ellt with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/oxford-ellt' },
};

export default function Page() {
  return <TestDetailView slug="oxford-ellt" />;
}
