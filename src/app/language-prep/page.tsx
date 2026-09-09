import React from 'react';
import { Metadata } from 'next';
import MasterLanguagePrepLandingView from '@/components/website/MasterLanguagePrepLandingView';

export const metadata: Metadata = {
  title: 'English Language Preparation | Master IELTS, PTE, Duolingo, TOEFL | ALO Education',
  description: 'Explore English language tests, compare requirements, prepare for university admission, and get expert score guidance from ALO Education.',
  alternates: { canonical: 'https://aloeducation.com/language-prep' },
  openGraph: {
    title: 'English Language Preparation | IELTS, PTE, TOEFL & More | ALO Education',
    description: 'Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning.',
    url: 'https://aloeducation.com/language-prep',
    type: 'website',
  },
};

export default function LanguagePrepPageRoute() {
  return <MasterLanguagePrepLandingView />;
}
