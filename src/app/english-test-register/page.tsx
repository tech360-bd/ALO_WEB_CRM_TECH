import type { Metadata } from 'next';
import Link from 'next/link';
import StudentRegisterView from '@/components/auth/StudentRegisterView';

// ALO English Test candidate registration. Registers a normal student account;
// test slots and payments are then attached to that account (mock_test_credits /
// mock_test_payments), so candidate identity is never duplicated.
export const metadata: Metadata = {
  title: 'ALO English Test — Candidate Registration | ALO Education',
  description: 'Register as an ALO English Test candidate and book your listening, reading, writing and speaking sections.',
  alternates: { canonical: 'https://aloeducation.com/english-test-register' },
  robots: { index: false, follow: false },
};

export default function EnglishTestRegisterPage() {
  return (
    <div className="min-h-screen bg-[var(--alo-page)] text-[var(--alo-text)]">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">ALO Language Preparation Centre</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Register as an ALO English Test candidate</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--alo-body)]">
            Registration creates a student account. After your account is active you choose a test
            slot from the student portal; nothing is charged at this step.
          </p>
          <Link href="/english-test-login" className="mt-4 inline-block text-sm font-semibold text-[var(--alo-brand)] underline underline-offset-4">
            Already registered? Sign in
          </Link>
        </div>
      </div>
      <StudentRegisterView />
    </div>
  );
}
