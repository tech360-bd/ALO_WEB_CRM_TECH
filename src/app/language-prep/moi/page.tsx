import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('moi');

export const metadata: Metadata = {
  title: test?.seoTitle || 'moi Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for moi with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/moi' },
};

export default function Page() {
  return <TestDetailView slug="moi" />;
}
