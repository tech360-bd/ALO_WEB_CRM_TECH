import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Proposal builder | ALO Education',
  description: 'The 20-section research proposal with per-university requirements, quality checks and version history.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
