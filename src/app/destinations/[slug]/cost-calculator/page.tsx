import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, Calculator, Wallet, ArrowRight } from 'lucide-react';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = COUNTRY_DESTINATIONS[slug.toLowerCase().trim()];
  if (!country) return { title: 'Cost Calculator | ALO Education' };

  return {
    title: `Tuition & Living Cost Calculator for ${country.name} | ALO Education`,
    description: `Estimate tuition fees, monthly accommodation, food, transport, and visa proof of funds for studying in ${country.name} from Bangladesh.`,
  };
}

export default async function CountryCostCalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = COUNTRY_DESTINATIONS[slug.toLowerCase().trim()];
  if (!countryData) notFound();

  return (
    <div className="bg-slate-50 min-h-screen py-12 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/destinations" className="hover:text-blue-600">Destinations</Link>
          <span>/</span>
          <Link href={`/destinations/${countryData.slug}`} className="hover:text-blue-600">{countryData.name}</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Cost Calculator</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <Calculator className="w-4 h-4" /> Financial Planning & Budget Guide
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Cost of Studying & Living in {countryData.name}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Estimate your annual expenses for studying in {countryData.name}, including tuition fee ranges, living costs by city, and mandatory visa proof-of-funds requirements.
          </p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Annual Tuition Range</span>
            <p className="text-xl font-bold text-slate-900">{countryData.tuitionRange}</p>
            <span className="text-[11px] text-slate-400">Varies by degree level & university</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Living Expenses</span>
            <p className="text-xl font-bold text-emerald-600">{countryData.livingCost}</p>
            <span className="text-[11px] text-slate-400">Accommodation, food & transit</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500">Currency</span>
            <p className="text-xl font-bold text-blue-600">{countryData.currency}</p>
            <span className="text-[11px] text-slate-400">Official local currency</span>
          </div>
        </div>

        {/* City Living Costs Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" /> City Living Cost Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countryData.cities.map((city, c) => (
              <div key={c} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{city.name}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-md">{city.costLevel} Cost</span>
                </div>
                <p className="text-slate-600">Vibe: <strong>{city.vibe}</strong></p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Estimated Monthly Cost:</span>
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
