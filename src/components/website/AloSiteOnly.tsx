'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Keep ALO-specific chrome and instrumentation off the standalone demo. */
export default function AloSiteOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/dreamframe' || pathname?.startsWith('/dreamframe/')) return null;
  return children;
}
