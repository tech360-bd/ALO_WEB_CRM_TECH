import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('pte-academic');

export const metadata: Metadata = {
  title: test?.seoTitle || 'pte-academic Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for pte-academic with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/pte-academic' },
};

export default function Page() {
  return <TestDetailView slug="pte-academic" />;
}
