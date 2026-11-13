'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EnglishExamCard } from '@/components/website/EnglishExamCta';

/**
 * Student-portal entry point for English tests. English tests are taken on the
 * English Test Platform, so this portal page links there instead of simulating
 * an exam.
 */
export default function EnglishTestNotice() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">English Tests</h1>
        <p className="text-sm text-[var(--alo-body)]">
          English tests are taken on the English Test Platform. Your preparation progress is kept in your
          student profile.
        </p>
      </header>

      <EnglishExamCard location="student_portal" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/student/english-prep"
          className="flex min-h-11 items-center justify-between rounded-2xl border border-[var(--alo-border)] bg-white p-5 text-sm font-semibold text-[var(--alo-text)] hover:border-[var(--alo-brand)]"
        >
          My English preparation profile
          <ArrowRight className="h-4 w-4 text-[var(--alo-brand)]" aria-hidden="true" />
        </Link>
        <Link
          href="/english-test-prep"
          className="flex min-h-11 items-center justify-between rounded-2xl border border-[var(--alo-border)] bg-white p-5 text-sm font-semibold text-[var(--alo-text)] hover:border-[var(--alo-brand)]"
        >
          Preparation guides
          <ArrowRight className="h-4 w-4 text-[var(--alo-brand)]" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
