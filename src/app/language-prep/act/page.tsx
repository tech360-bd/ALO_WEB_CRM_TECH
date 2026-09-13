import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('act');

export const metadata: Metadata = {
  title: test?.seoTitle || 'act Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for act with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/act' },
};

export default function Page() {
  return <TestDetailView slug="act" />;
}
