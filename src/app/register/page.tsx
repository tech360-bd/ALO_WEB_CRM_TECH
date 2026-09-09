'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import RegisterPageComponent from '@/components/auth/RegisterPage';

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return <RegisterPageComponent />;
}
