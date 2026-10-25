import type { Metadata } from 'next';

import PhdShell from '@/components/phd/PhdShell';

export const metadata: Metadata = {
  title: 'Statement of purpose | ALO Education',
  description:
    'A ten-part statement of purpose built only from your own facts, with content review and human approval before export.',
  robots: { index: false, follow: false },
};

export default function PhdPage() {
  return <PhdShell />;
}
