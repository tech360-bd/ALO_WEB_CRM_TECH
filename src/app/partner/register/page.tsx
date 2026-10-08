'use client';

import { useEffect } from 'react';
import RegisterPage from '@/components/auth/RegisterPage';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function PartnerRegisterPage() {
  const setSelectedPortal = usePortalStore((state) => state.setSelectedPortal);
  useEffect(() => setSelectedPortal('partner'), [setSelectedPortal]);
  return <RegisterPage />;
}
