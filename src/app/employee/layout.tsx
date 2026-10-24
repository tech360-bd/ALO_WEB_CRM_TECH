'use client';

import { usePathname } from 'next/navigation';
import EmployeePortalShell from '@/components/employee/EmployeePortalShell';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't wrap login page in shell
  if (pathname === '/employee/login' || pathname === '/employee/activate') {
    return <>{children}</>;
  }

  return <EmployeePortalShell>{children}</EmployeePortalShell>;
}
