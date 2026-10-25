import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Supervisors | ALO Education',
  description: 'Recorded-evidence supervisor matching, availability status and manual outreach drafts.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
