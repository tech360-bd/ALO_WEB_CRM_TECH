'use client';

import { Suspense } from 'react';
import LoginPage from '@/components/auth/LoginPage';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--alo-text-muted)]">Loading Admin Portal...</div>}>
      <LoginPage initialPortal="admin-login" />
    </Suspense>
  );
}
