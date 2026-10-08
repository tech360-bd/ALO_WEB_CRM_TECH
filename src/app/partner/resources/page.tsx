'use client';

import { useEffect } from 'react';
import PartnerResourcesPage from '@/components/partner/PartnerResourcesPage';
import { usePortalStore } from '@/lib/stores/portal-store';

/**
 * /partner/resources — direct URL for the resource library.
 *
 * The partner shell drives its content from the portal store rather than the
 * URL, so a deep link has to put the store on the right view; otherwise the
 * sidebar highlight and the rendered panel disagree.
 */
export default function PartnerResourcesRoute() {
  const setView = usePortalStore((state) => state.setView);

  useEffect(() => {
    setView('partner-resources');
  }, [setView]);

  return <PartnerResourcesPage />;
}
