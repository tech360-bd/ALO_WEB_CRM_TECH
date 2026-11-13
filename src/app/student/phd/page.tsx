import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'PhD research workspace | ALO Education',
  description: 'Topic discovery, proposal building, supervisor fit, funding and document tracking for UK doctoral applications.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
