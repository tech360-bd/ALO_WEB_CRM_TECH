'use client';

import { useEffect } from 'react';
import RegisterPage from '@/components/auth/RegisterPage';
import { usePortalStore } from '@/lib/stores/portal-store';

/**
 * Renders the shared registration form with the student portal pre-selected.
 *
 * Both /student/register and /student-register use this component, so the two
 * URLs behave identically. The portal selection happens in an effect because
 * the store is client-only; until it runs, RegisterPage keeps whatever portal
 * it last had, which is why the effect is not deferred behind any loading gate.
 */
export default function StudentRegisterView() {
  const setSelectedPortal = usePortalStore((state) => state.setSelectedPortal);
  useEffect(() => setSelectedPortal('student'), [setSelectedPortal]);
  return <RegisterPage />;
}
