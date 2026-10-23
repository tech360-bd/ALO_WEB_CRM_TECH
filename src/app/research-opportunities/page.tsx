import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Postgraduate Research Guidance | ALO Education',
  description: 'Explore research programmes and request guidance on official requirements, funding and supervisor applications.',
};

export default function ResearchOpportunitiesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-24">
      <h1 className="text-3xl font-bold text-[var(--alo-text)]">Postgraduate Research Guidance</h1>
      <p className="mt-4 text-[var(--alo-body)]">Explore MRes, MPhil and PhD programmes through our course finder, then request help reviewing your research interests and application requirements.</p>
      <section className="mt-8 rounded-2xl border border-[var(--alo-border)] p-6">
        <h2 className="text-xl font-semibold">Check each opportunity at its official source</h2>
        <p className="mt-3 text-[var(--alo-body)]">Project availability, supervisor vacancies, funding and deadlines must be confirmed with the university. This page does not list unverified projects or promise funding.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link href="/course-finder">Search research programmes</Link></Button>
          <Button asChild variant="outline"><Link href="/book-consultation?service=research">Request research guidance</Link></Button>
        </div>
      </section>
    </main>
  );
}
