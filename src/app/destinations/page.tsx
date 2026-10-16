import React from 'react';
import Link from 'next/link';
import { Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export const metadata = {
  title: 'Study Abroad Destinations | ALO Education Bangladesh',
  description: 'Explore top study abroad destinations: UK, Canada, Australia, USA, Ireland, New Zealand, and Dubai. Verified visa rules, scholarships & tuition fees.',
};

export default function DestinationsIndexPage() {
  const destinations = Object.values(COUNTRY_DESTINATIONS);

  return (
    <div className="bg-slate-50 min-h-screen py-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#0057B8] font-bold text-xs rounded-full border border-blue-100">
            <Globe className="w-4 h-4" /> Global Study Destinations
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Choose Your Target Country
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Verified official visa rules, 1-year Master’s pathways, work rights, and scholarships tailored for Bangladeshi applicants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest) => (
            <div
              key={dest.slug}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#0057B8] hover:shadow-md transition"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{dest.flag}</span>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ Verified {dest.lastVerifiedAt}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{dest.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{dest.visaType}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {dest.overview}
                </p>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tuition Range:</span>
                    <span className="font-semibold text-slate-800">{dest.tuitionRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Work Rights:</span>
                    <span className="font-semibold text-emerald-600">{dest.workRights}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <Link
                  href={`/destinations/${dest.slug}`}
                  className="w-full h-11 bg-[#0057B8] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
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
