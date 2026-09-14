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
  const currentView = usePortalStore((s) => s.currentView);
  // HomepagePart4 already includes its own FooterSection to avoid duplicate footer on the homepage.
  const isHomepage = currentView === 'website';
  return (
    <>
      {!isAuthenticated && <PublicNavbar />}
      {children}
      {!isAuthenticated && !isHomepage && <PublicFooter />}
    </>
  );
}
