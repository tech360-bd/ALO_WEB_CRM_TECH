import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('oietc');

export const metadata: Metadata = {
  title: test?.seoTitle || 'oietc Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for oietc with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/oietc' },
};

export default function Page() {
  return <TestDetailView slug="oietc" />;
}
