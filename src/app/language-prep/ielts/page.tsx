import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('ielts');

export const metadata: Metadata = {
  title: test?.seoTitle || 'ielts Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for ielts with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/ielts' },
};

export default function Page() {
  return <LanguageTestPage slug="ielts" />;
}
