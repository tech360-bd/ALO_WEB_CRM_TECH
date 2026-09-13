import { Metadata } from 'next';
import TestDetailView from '@/components/language-prep/TestDetailView';
import { getTestBySlug } from '@/lib/language-prep/data';

const test = getTestBySlug('ielts-ukvi');

export const metadata: Metadata = {
  title: test?.seoTitle || 'ielts-ukvi Preparation | Requirements, Format & Study Abroad Guidance | ALO Education',
  description: test?.seoDescription || 'Prepare for ielts-ukvi with expert guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/ielts-ukvi' },
};

export default function Page() {
  return <TestDetailView slug="ielts-ukvi" />;
}
