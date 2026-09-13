import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('oet');

export const metadata: Metadata = {
  title: test?.seoTitle || 'oet Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for oet with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/oet' },
};

export default function Page() {
  return <TestDetailView slug="oet" />;
}
