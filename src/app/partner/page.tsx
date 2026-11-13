'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('partner_token') : null;
    if (token) {
      router.replace('/partner/dashboard');
    } else {
      router.replace('/partner/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--alo-brand)]" />
    </div>
  );
}
