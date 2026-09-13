import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('duolingo');

export const metadata: Metadata = {
  title: test?.seoTitle || 'duolingo Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for duolingo with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/duolingo' },
};

export default function Page() {
  return <TestDetailView slug="duolingo" />;
}
