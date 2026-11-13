import type { Metadata } from 'next';
import Link from 'next/link';
import LoginPage from '@/components/auth/LoginPage';

// ALO English Test candidate sign-in.
//
// A test candidate is a student account: `alo_english_tests.studentId` points at
// a Student row, so there is no second credential store to maintain (and no
// second place to get authentication wrong). This route adds the test-specific
// framing around the one shared login form.
export const metadata: Metadata = {
  title: 'ALO English Test — Candidate Login | ALO Education',
  description: 'Sign in to take or review your ALO English Test (listening, reading, writing, speaking).',
  alternates: { canonical: 'https://aloeducation.com/english-test-login' },
  robots: { index: false, follow: false },
};

export default function EnglishTestLoginPage() {
  return (
    <div className="min-h-screen bg-[var(--alo-page)] text-[var(--alo-text)]">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">ALO Language Preparation Centre</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">ALO English Test — candidate sign-in</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--alo-body)]">
            Use the same account you use for your application. Your test attempts, band scores and
            section breakdown are stored against that student account; there is no separate test login.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/english-test-register" className="font-semibold text-[var(--alo-brand)] underline underline-offset-4">
              New candidate? Create an account
            </Link>
            <Link href="/english-test-prep" className="font-semibold text-[var(--alo-brand)] underline underline-offset-4">
              Preparation guides
            </Link>
          </div>
        </div>
      </div>
      <LoginPage initialPortal="student-login" />
    </div>
  );
}
