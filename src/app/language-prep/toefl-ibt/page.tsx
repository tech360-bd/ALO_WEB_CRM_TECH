import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('toefl-ibt');

export const metadata: Metadata = {
  title: test?.seoTitle || 'toefl-ibt Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for toefl-ibt with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/toefl-ibt' },
};

export default function Page() {
  return <TestDetailView slug="toefl-ibt" />;
}
