import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Verification centre | ALO Education',
  description: 'Verifier-only queue of institutional claims with their exact source and evidence.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
