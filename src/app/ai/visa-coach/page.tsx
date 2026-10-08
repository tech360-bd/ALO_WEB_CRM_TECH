import type { Metadata } from 'next';
import AiVisaCoach from '@/components/website/ai/AiVisaCoach';
import { getAllCountrySlugs } from '@/lib/country-destinations-data';

export const metadata: Metadata = {
  title: 'AI Visa Coach — Practise Your Visa Credibility Interview',
  description:
    'Practise visa credibility interview questions and get a structural review of your answer — length, specificity, funding and post-study plans — with verified visa steps for your destination.',
  alternates: { canonical: '/ai/visa-coach' },
  openGraph: {
    title: 'AI Visa Coach | ALO Education',
    description:
      'Interview practice with explainable answer review and verified destination visa steps.',
    url: '/ai/visa-coach',
    type: 'website',
  },
};

export default function AiVisaCoachPage() {
  return <AiVisaCoach countrySlugs={getAllCountrySlugs().map((entry) => entry.slug)} />;
}
