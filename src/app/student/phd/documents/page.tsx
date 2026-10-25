import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Documents | ALO Education',
  description: 'Private document store with retention windows and audit-logged downloads.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
