'use client';

import { usePortalStore } from '@/lib/stores/portal-store';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  return (
    <>
      {!isAuthenticated && <PublicNavbar />}
      {children}
      {!isAuthenticated && <PublicFooter />}
    </>
  );
}
