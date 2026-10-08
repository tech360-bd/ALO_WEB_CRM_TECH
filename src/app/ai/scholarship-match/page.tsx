import type { Metadata } from 'next';
import AiScholarshipMatch from '@/components/website/ai/AiScholarshipMatch';
import { getComparableCountries } from '@/lib/country-comparison';

export const metadata: Metadata = {
  title: 'AI Scholarship Match — Find Funding You Are Eligible For',
  description:
    'Search the verified scholarship database against your study level, subject, destination and nationality. See which published eligibility criteria you meet, which you do not, and which awards are still open.',
  alternates: { canonical: '/ai/scholarship-match' },
  openGraph: {
    title: 'AI Scholarship Match | ALO Education',
    description:
      'Evidence-based scholarship matching for Bangladeshi students — published eligibility checked field by field.',
    url: '/ai/scholarship-match',
    type: 'website',
  },
};

export default function AiScholarshipMatchPage() {
  return (
    <AiScholarshipMatch
      countries={getComparableCountries().map((country) => ({
        slug: country.slug,
        name: country.name,
        flag: country.flag,
      }))}
    />
  );
}
