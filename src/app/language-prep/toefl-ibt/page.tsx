import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('toefl-ibt');

export const metadata: Metadata = {
  title: test?.seoTitle || 'toefl-ibt Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for toefl-ibt with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/toefl-ibt' },
};

export default function Page() {
  return <LanguageTestPage slug="toefl-ibt" />;
}
