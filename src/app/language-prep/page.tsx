import React from 'react';
import { Metadata } from 'next';
import PremiumLanguagePrepLandingView from '@/components/language-prep/PremiumLandingView';

export const metadata: Metadata = {
  title: 'English Language Preparation | IELTS, PTE, TOEFL & More | ALO Education',
  description: 'Explore English language tests, compare requirements, prepare for university admission, and get expert guidance from ALO Education. Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning.',
  alternates: { canonical: 'https://aloeducation.com/language-prep' },
  openGraph: {
    title: 'English Language Preparation | IELTS, PTE, TOEFL & More | ALO Education',
    description: 'Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning.',
    url: 'https://aloeducation.com/language-prep',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'English Language Preparation | IELTS, PTE, TOEFL & More | ALO Education',
    description: 'Explore English language tests, compare requirements, prepare for university admission, and get expert guidance from ALO Education.',
  },
};

export default function LanguagePrepPageRoute() {
  return <PremiumLanguagePrepLandingView />;
}
