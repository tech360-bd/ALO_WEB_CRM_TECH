import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, FileCheck, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = COUNTRY_DESTINATIONS[slug.toLowerCase().trim()];
  if (!country) return { title: 'Visa Guide | ALO Education' };

  return {
    title: `${country.name} Student Visa Guide from Bangladesh | ALO Education`,
    description: `Official step-by-step ${country.name} student visa application guide for Bangladeshi students. Proof of funds, TB medical test, CAS/I-20/eVAL, and Embassy interview checklist.`,
  };
}

export default async function CountryVisaGuidePage({ params }: { params: Promise<{ slug: string }> }) {
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
          <span className="text-slate-800 font-semibold">Visa Guide</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <ShieldCheck className="w-4 h-4" /> Official Immigration & Visa Route
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {countryData.name} Student Visa Application Guide from Bangladesh
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visa Type: <strong>{countryData.visaType}</strong> | Last Verified: <strong>{countryData.lastVerifiedAt}</strong>
          </p>
        </div>

        {/* Visa Steps */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" /> Step-by-Step Visa Workflow
          </h2>
          <div className="space-y-4">
            {countryData.visaSteps.map((step) => (
              <div key={step.step} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Rights & Post-Study Route */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Work Rights & Post-Study Career Route</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-800">Term-Time Work Allowance:</span>
              <p className="text-emerald-700">{countryData.workRights}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
              <span className="font-bold text-blue-800">Living Costs & Proof of Funds:</span>
              <p className="text-blue-700">{countryData.livingCost}</p>
            </div>
          </div>
        </div>

        {/* Official Sources */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3">
          <h3 className="font-bold text-sm">Official Government & Immigration Sources</h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {countryData.sources.map((src, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{src.section}: {src.sourceName}</span>
                <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold flex items-center gap-1 hover:underline">
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
