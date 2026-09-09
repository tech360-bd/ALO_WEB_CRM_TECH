'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import LoginPageComponent from '@/components/auth/LoginPage';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return <LoginPageComponent />;
}
