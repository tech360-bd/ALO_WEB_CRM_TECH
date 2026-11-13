import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Funding and deadlines | ALO Education',
  description: 'Verified funding calls, official deadlines and tuition fees — home and international kept separate.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
