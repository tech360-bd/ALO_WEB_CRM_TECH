'use client';

import { usePathname } from 'next/navigation';
import PartnerPortalShell from '@/components/partner/PartnerPortalShell';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't wrap login page in shell
  if (pathname === '/partner/login') {
    return <>{children}</>;
  }

  return <PartnerPortalShell>{children}</PartnerPortalShell>;
}
