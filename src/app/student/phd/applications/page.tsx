import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Applications | ALO Education',
  description: 'Track verified programmes from shortlist to offer, with tasks and document checklists.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
