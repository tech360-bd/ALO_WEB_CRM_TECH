import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Topic discovery | ALO Education',
  description: 'Business and Engineering research topic candidates with provisional gap statements and evidence tracking.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
