import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('gre');

export const metadata: Metadata = {
  title: test?.seoTitle || 'gre Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for gre with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/gre' },
};

export default function Page() {
  return <TestDetailView slug="gre" />;
}
