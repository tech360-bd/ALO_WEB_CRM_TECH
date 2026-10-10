'use client';

import { useEffect } from 'react';
import RegisterPage from '@/components/auth/RegisterPage';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function StudentRegisterPage() {
  const setSelectedPortal = usePortalStore((state) => state.setSelectedPortal);
  useEffect(() => setSelectedPortal('student'), [setSelectedPortal]);
  return <RegisterPage />;
}
