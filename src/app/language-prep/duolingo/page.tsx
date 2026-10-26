import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('duolingo');

export const metadata: Metadata = {
  title: test?.seoTitle || 'duolingo Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for duolingo with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/duolingo' },
};

export default function Page() {
  return <LanguageTestPage slug="duolingo" />;
}
