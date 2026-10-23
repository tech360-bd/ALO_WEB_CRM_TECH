import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, Calculator, Wallet, ArrowRight } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Cost Calculator | ALO Education' };

  return {
    title: `Tuition & Living Cost Calculator for ${country.name} | ALO Education`,
    description: `Estimate tuition fees, monthly accommodation, food, transport, and visa proof of funds for studying in ${country.name} from Bangladesh.`,
  };
}

export default async function CountryCostCalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
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
          <span className="text-[var(--alo-text)] font-semibold">Cost Calculator</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-[var(--alo-border)] shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <Calculator className="w-4 h-4" /> Financial Planning & Budget Guide
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--alo-text)]">
            Cost of Studying & Living in {countryData.name}
          </h1>
          <p className="text-xs text-[var(--alo-body)] leading-relaxed max-w-3xl">
            Estimate your annual expenses for studying in {countryData.name}, including tuition fee ranges, living costs by city, and mandatory visa proof-of-funds requirements.
          </p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-[var(--alo-border)] p-6 space-y-2">
            <span className="text-xs font-semibold text-[var(--alo-text-muted)]">Annual Tuition Range</span>
            <p className="text-xl font-bold text-[var(--alo-text)]">{countryData.tuitionRange}</p>
            <span className="text-[11px] text-[var(--alo-text-muted)]">Varies by degree level & university</span>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--alo-border)] p-6 space-y-2">
            <span className="text-xs font-semibold text-[var(--alo-text-muted)]">Living Expenses</span>
            <p className="text-xl font-bold text-emerald-600">{countryData.livingCost}</p>
            <span className="text-[11px] text-[var(--alo-text-muted)]">Accommodation, food & transit</span>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--alo-border)] p-6 space-y-2">
            <span className="text-xs font-semibold text-[var(--alo-text-muted)]">Currency</span>
            <p className="text-xl font-bold text-[var(--alo-brand)]">{countryData.currency}</p>
            <span className="text-[11px] text-[var(--alo-text-muted)]">Official local currency</span>
          </div>
        </div>

        {/* City Living Costs Table */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] space-y-4">
          <h2 className="text-lg font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[var(--alo-brand)]" /> City Living Cost Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countryData.cities.map((city, c) => (
              <div key={c} className="p-4 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--alo-text)] text-sm">{city.name}</h3>
                  <span className="px-2 py-0.5 bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold rounded-md">{city.costLevel} Cost</span>
                </div>
                <p className="text-[var(--alo-body)]">Vibe: <strong>{city.vibe}</strong></p>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--alo-border)]">
                  <span className="text-[var(--alo-text-muted)]">Estimated Monthly Cost:</span>
                  <span className="font-bold text-emerald-600">{city.livingCost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
