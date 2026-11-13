import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export const metadata = {
  title: 'Study Abroad Destinations | ALO Education Bangladesh',
  description: 'Explore top study abroad destinations: UK, Canada, Australia, USA, Ireland, New Zealand, and Dubai. Verified visa rules, scholarships & tuition fees.',
};

export default function DestinationsIndexPage() {
  const destinations = Object.values(COUNTRY_DESTINATIONS);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] text-[var(--alo-text)]">
      {/* Hero Variant C — destination-led: the countries carry the composition,
          so the band is a media strip rather than a centred text block. */}
      <header className="border-b border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-secondary)] ring-1 ring-inset ring-[var(--alo-border)]">
                <span className="size-1.5 rounded-full bg-[var(--alo-brand)]" aria-hidden="true" />
                <span className="text-[var(--alo-brand)]">Global study destinations</span>
              </span>
              <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--alo-text)] sm:text-[36px] lg:text-[42px]">
                Choose Your Target Country
              </h1>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-[var(--alo-body)]">
                Verified official visa rules, 1-year Master’s pathways, work rights, and scholarships tailored for Bangladeshi applicants.
              </p>
            </div>
            <nav aria-label="Jump to a destination" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3">
              {destinations.map((dest, index) => (
                <Link
                  key={dest.slug}
                  href={`/destinations/${dest.slug}`}
                  className="group flex min-h-12 items-center gap-2 rounded-[14px] border border-[var(--alo-border)] bg-card px-3 py-2.5 text-[13px] font-semibold text-[var(--alo-text)] transition-colors hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2"
                >
                  <span aria-hidden="true" className="text-base leading-none">{dest.flag}</span>
                  <span className="truncate">{dest.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest, index) => (
            <div
              key={dest.slug}
              className={`bg-card rounded-[20px] border border-[var(--alo-border)] overflow-hidden flex flex-col justify-between transition-colors hover:border-[var(--alo-brand)] ${index === 0 ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr]' : 'lg:col-span-1'}`}
            >
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span aria-hidden="true" className="text-4xl leading-none">{dest.flag}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--alo-success)]/25 bg-[var(--alo-success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--alo-success-dark)]">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified {dest.lastVerifiedAt}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[var(--alo-text)]">{dest.name}</h3>
                  <p className="text-xs text-[var(--alo-text-muted)] font-medium">{dest.visaType}</p>
                </div>

                <p className="text-xs text-[var(--alo-body)] leading-relaxed line-clamp-3">
                  {dest.overview}
                </p>

                <div className="space-y-2 text-xs border-t border-[var(--alo-border)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--alo-text-muted)]">Tuition Range:</span>
                    <span className="font-semibold text-[var(--alo-text)]">{dest.tuitionRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--alo-text-muted)]">Work Rights:</span>
                    <span className="font-semibold text-[var(--alo-success-dark)]">{dest.workRights}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--alo-page)] border-t border-[var(--alo-border)]">
                <Link
                  href={`/destinations/${dest.slug}`}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--alo-brand)] text-sm font-bold text-white transition-colors hover:bg-[var(--alo-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2"
                >
                  Explore {dest.name} Guide <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
