import React from 'react';
import { Metadata } from 'next';
import ComparisonView from '@/components/language-prep/ComparisonView';

export const metadata: Metadata = {
  title: 'English Test Comparison | IELTS vs PTE vs TOEFL vs Duolingo | ALO Education',
  description: 'Compare IELTS, PTE Academic, TOEFL, Duolingo English Test requirements, scores, costs and acceptance for UK, Canada, Australia, USA universities. Verified sources.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/comparison' },
  openGraph: {
    title: 'English Test Comparison | ALO Education',
    description: 'Side-by-side comparison of IELTS, PTE, TOEFL, Duolingo, OIETC, Oxford ELLT — duration, format, scoring, results, acceptance, best for.',
    url: 'https://aloeducation.com/language-prep/comparison',
    type: 'website',
  },
};

export default function LanguagePrepComparisonPage() {
  return <ComparisonView />;
}
