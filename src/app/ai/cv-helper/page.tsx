import type { Metadata } from 'next';
import AiCvHelper from '@/components/website/ai/AiCvHelper';

export const metadata: Metadata = {
  title: 'AI CV Helper — Build an Application-Ready CV',
  description:
    'Build a study-abroad CV section by section — personal details, education, experience, skills, achievements and languages — with a live completeness review, print-ready preview and export.',
  alternates: { canonical: '/ai/cv-helper' },
  openGraph: {
    title: 'AI CV Helper | ALO Education',
    description: 'Structured CV builder with completeness review for study-abroad applications.',
    url: '/ai/cv-helper',
    type: 'website',
  },
};

export default function AiCvHelperPage() {
  return <AiCvHelper />;
}
