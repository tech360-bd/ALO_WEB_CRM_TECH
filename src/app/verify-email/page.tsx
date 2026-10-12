'use client';
import { AuthVerifyOtp } from '@/components/alo/views/auth-verify-otp';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
/** Dedicated public verification route: verification is not password reset. */
export default function VerifyEmailPage() {
  const router = useRouter();
  return <AuthVerifyOtp onNavigate={view => {
    if (view === 'auth-login') {
      const portal = usePortalStore.getState().selectedPortal;
      router.push(portal === 'student' ? '/student/login' : portal === 'partner' ? '/partner/login' : '/login');
    } else router.push('/');
  }} />;
}
