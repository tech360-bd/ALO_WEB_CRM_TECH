'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import ResetPasswordPageComponent from '@/components/auth/ResetPasswordPage';

export default function ResetPasswordPage() {
  const router = useRouter();
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return <ResetPasswordPageComponent />;
}
