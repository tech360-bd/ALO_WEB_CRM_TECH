import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('sat');

export const metadata: Metadata = {
  title: test?.seoTitle || 'sat Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for sat with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/sat' },
};

export default function Page() {
  return <TestDetailView slug="sat" />;
}
