import type { Metadata } from 'next';
import EnglishTestHub from '@/components/website/EnglishTestHub';

export const metadata: Metadata = {
  title: 'English Tests for Study Abroad — IELTS, PTE, TOEFL, Duolingo & More',
  description:
    'Compare IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo, OET, LanguageCert, Oxford ELLT, OIETC, GRE, GMAT and SAT — format, scoring, duration, results and acceptance for Bangladeshi students.',
  alternates: { canonical: '/english-tests' },
  openGraph: {
    title: 'English Tests for Study Abroad | ALO Education',
    description:
      'Compare English proficiency and standardised tests side by side, then check exactly what your destination and university require.',
    url: '/english-tests',
    type: 'website',
  },
};

export default function EnglishTestsPage() {
  return <EnglishTestHub />;
}
