import type { Metadata } from 'next';
import AiCourseMatch from '@/components/website/ai/AiCourseMatch';
import { getComparableCountries } from '@/lib/country-comparison';

export const metadata: Metadata = {
  title: 'AI Course Match — Find Courses You Qualify For',
  description:
    'Match your academic profile against every published, verified course in the ALO database. See match scores, requirement-by-requirement evidence, gaps and alternative routes.',
  alternates: { canonical: '/ai/course-match' },
  openGraph: {
    title: 'AI Course Match | ALO Education',
    description:
      'Evidence-based course matching for Bangladeshi students — which requirements you meet, which you do not, and what to do next.',
    url: '/ai/course-match',
    type: 'website',
  },
};

export default function AiCourseMatchPage() {
  return (
    <AiCourseMatch
      countries={getComparableCountries().map((country) => ({
        slug: country.slug,
        name: country.name,
        flag: country.flag,
      }))}
    />
  );
}
