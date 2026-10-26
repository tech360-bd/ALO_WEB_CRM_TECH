import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('oietc');

export const metadata: Metadata = {
  title: test?.seoTitle || 'oietc Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for oietc with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/oietc' },
};

export default function Page() {
  return <LanguageTestPage slug="oietc" />;
}
