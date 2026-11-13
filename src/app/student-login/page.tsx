import type { Metadata } from 'next';
import LoginPage from '@/components/auth/LoginPage';

// Spec-named student entry URL (/student-login). The canonical implementation
// is the shared portal LoginPage; this route only fixes the URL and the
// metadata, so there is one login form to maintain, not two.
export const metadata: Metadata = {
  title: 'Student Login | ALO Education',
  description: 'Sign in to your ALO student portal to track applications, documents, visa and finances.',
  alternates: { canonical: 'https://aloeducation.com/student-login' },
  robots: { index: false, follow: false },
};

export default function StudentLoginAliasPage() {
  return <LoginPage initialPortal="student-login" />;
}
