import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('gmat');

export const metadata: Metadata = {
  title: test?.seoTitle || 'gmat Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for gmat with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/gmat' },
};

export default function Page() {
  return <LanguageTestPage slug="gmat" />;
}
