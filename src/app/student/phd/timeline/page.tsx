import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Timeline | ALO Education',
  description: 'A suggested study plan that never replaces official university deadlines.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
