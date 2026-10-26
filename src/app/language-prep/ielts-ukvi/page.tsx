import { Metadata } from 'next';
import LanguageTestPage from '@/components/language-prep/LanguageTestPage';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('ielts-ukvi');

export const metadata: Metadata = {
  title: test?.seoTitle || 'ielts-ukvi Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for ielts-ukvi with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/ielts-ukvi' },
};

export default function Page() {
  return <LanguageTestPage slug="ielts-ukvi" />;
}
