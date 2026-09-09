'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import ForgotPasswordPageComponent from '@/components/auth/ForgotPasswordPage';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return <ForgotPasswordPageComponent />;
}
