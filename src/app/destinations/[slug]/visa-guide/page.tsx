import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, FileCheck, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Visa Guide | ALO Education' };

  return {
    title: `${country.name} Student Visa Guide from Bangladesh | ALO Education`,
    description: `Official step-by-step ${country.name} student visa application guide for Bangladeshi students. Proof of funds, TB medical test, CAS/I-20/eVAL, and Embassy interview checklist.`,
  };
}

export default async function CountryVisaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);
  if (!countryData) notFound();

  return (
    <div className="bg-[var(--alo-page)] min-h-screen py-12 text-[var(--alo-text)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)]">
          <Link href="/destinations" className="hover:text-[var(--alo-brand)]">Destinations</Link>
          <span>/</span>
          <Link href={`/destinations/${countryData.slug}`} className="hover:text-[var(--alo-brand)]">{countryData.name}</Link>
          <span>/</span>
          <span className="text-[var(--alo-text)] font-semibold">Visa Guide</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-[var(--alo-border)] shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] text-xs font-bold rounded-full">
            <ShieldCheck className="w-4 h-4" /> Official Immigration & Visa Route
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--alo-text)]">
            {countryData.name} Student Visa Application Guide from Bangladesh
          </h1>
          <p className="text-xs text-[var(--alo-body)] leading-relaxed">
            Visa Type: <strong>{countryData.visaType}</strong> | Last Verified: <strong>{countryData.lastVerifiedAt}</strong>
          </p>
        </div>

        {/* Visa Steps */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] space-y-6">
          <h2 className="text-lg font-bold text-[var(--alo-text)] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[var(--alo-brand)]" /> Step-by-Step Visa Workflow
          </h2>
          <div className="space-y-4">
            {countryData.visaSteps.map((step) => (
              <div key={step.step} className="p-4 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[var(--alo-brand)] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--alo-text)] text-sm">{step.title}</h3>
                  <p className="text-xs text-[var(--alo-body)] mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Rights & Post-Study Route */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] space-y-4">
          <h2 className="text-lg font-bold text-[var(--alo-text)]">Work Rights & Post-Study Career Route</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-800">Term-Time Work Allowance:</span>
              <p className="text-emerald-700">{countryData.workRights}</p>
            </div>
            <div className="p-4 bg-[var(--alo-brand-pale)] rounded-xl border border-[var(--alo-border)] space-y-1">
              <span className="font-bold text-[var(--alo-brand-deep)]">Living Costs & Proof of Funds:</span>
              <p className="text-[var(--alo-brand)]">{countryData.livingCost}</p>
            </div>
          </div>
        </div>

        {/* Official Sources */}
        <div className="space-y-3 rounded-[16px] border border-[var(--alo-brand-border)] bg-[var(--alo-blue-soft)] p-6 text-[var(--alo-text)]">
          <h3 className="font-bold text-sm">Official Government & Immigration Sources</h3>
          <ul className="space-y-2 text-xs text-[var(--alo-body)]">
            {countryData.sources.map((src, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{src.section}: {src.sourceName}</span>
                <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-[var(--alo-brand)] hover:underline">
                  Visit Official Source <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
