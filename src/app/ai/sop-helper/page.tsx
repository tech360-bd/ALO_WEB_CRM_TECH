import type { Metadata } from 'next';
import AiSopHelper from '@/components/website/ai/AiSopHelper';

export const metadata: Metadata = {
  title: 'AI SOP Helper — Statement of Purpose Writing & Review',
  description:
    'Structure your statement of purpose around your programme, background and career goal, then get a structural review covering length, argument, clichés and missing specifics — with local version history and export.',
  alternates: { canonical: '/ai/sop-helper' },
  openGraph: {
    title: 'AI SOP Helper | ALO Education',
    description: 'Draft, review and version your statement of purpose before you submit.',
    url: '/ai/sop-helper',
    type: 'website',
  },
};

export default function AiSopHelperPage() {
  return <AiSopHelper />;
}
