import type { Metadata } from 'next';
import Link from 'next/link';

import SopPanel from '@/components/phd/panels/SopPanel';

export const metadata: Metadata = {
  title: 'Statement of purpose | ALO Education',
  description:
    'Build a ten-part statement of purpose from your own facts, review it against evidence and export only after human approval.',
  robots: { index: false, follow: false },
};

/**
 * Statement-of-purpose builder for every student.
 *
 * It reuses the same service, checks and review trail as the PhD workspace, so
 * there is exactly one implementation of the rules and one place where the
 * "no invented achievements, no detector score" guarantees are enforced.
 */
export default function StudentSopPage() {
  return (
    <div className="w-full pb-10">
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">
          Statement of purpose
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)]">Your personal statement</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--alo-body)]">
          Write one statement per programme. The builder only uses facts you supply or records from your
          workspace — it never invents achievements, and it will not promise an AI-detector score.
        </p>
        <p className="mt-2 text-xs text-[var(--alo-text-muted)]">
          Working on a doctorate? The same statements appear inside your{' '}
          <Link href="/student/phd" className="font-semibold text-[var(--alo-brand)] underline">
            research workspace
          </Link>
          .
        </p>
      </header>
      <SopPanel />
    </div>
  );
}
