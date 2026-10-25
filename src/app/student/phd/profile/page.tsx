import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Academic profile | ALO Education',
  description: 'Your qualifications and research preferences, used to shape topic and supervisor suggestions.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
