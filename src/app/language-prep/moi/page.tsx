import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('moi');

export const metadata: Metadata = {
  title: test?.seoTitle || 'moi Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for moi with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/moi' },
};

export default function Page() {
  return <LanguageTestPage slug="moi" />;
}
