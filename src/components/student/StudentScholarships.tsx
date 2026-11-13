'use client';

import Link from 'next/link';
import ScholarshipsListing from '@/components/website/ScholarshipsListing';
import { Button } from '@/components/ui/button';

/**
 * Student portal scholarship discovery reuses the public, database-backed
 * directory instead of maintaining a separate sample-data catalog.
 */
export default function StudentScholarships() {
  return (
    <div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6 lg:px-8">
        <p className="max-w-2xl text-sm text-[var(--alo-body)]">
          Browse published scholarship records. Eligibility matching is a profile-to-published-criteria comparison, not a prediction of award success.
        </p>
        <Button asChild variant="outline" className="border-[var(--alo-border)] bg-white">
          <Link href="/ai/scholarship-match">Compare my profile with eligibility criteria</Link>
        </Button>
      </div>
      <ScholarshipsListing />
    </div>
  );
}
