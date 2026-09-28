import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Admission Requirements | ALO Education' };

  return {
    title: `Admission Requirements for Bangladeshi Students in ${country.name} | ALO Education`,
    description: `Academic and English entry requirements for Bangladeshi students applying to ${country.name}. HSC, A-Levels, Honours CGPA, IELTS, MOI, and document checklist.`,
  };
}

export default async function CountryAdmissionRequirementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);
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
          <span className="text-slate-800 font-semibold">Admission Requirements</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <GraduationCap className="w-4 h-4" /> Bangladesh Qualifications Standard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Admission Requirements for Bangladeshi Applicants in {countryData.name}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Verified academic thresholds, English language proficiency test cutoffs, and required application documents for Bangladeshi HSC, A-Levels, and Honours graduates.
          </p>
        </div>

        {/* Entry Requirements Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {countryData.entryRequirements.map((req, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                {req.level} Level
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Academic Cutoff:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{req.academic}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">English Proficiency:</span>
                  <p className="font-semibold text-emerald-600 mt-0.5">{req.english}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Document Checklist:</span>
                  <ul className="mt-1 space-y-1">
                    {req.documents.map((doc, d) => (
                      <li key={d} className="flex items-center gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* English Tests Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Accepted English Language Tests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-bold">Test Name</th>
                  <th className="p-3 font-bold">Acceptance Status</th>
                  <th className="p-3 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {countryData.englishTests.map((test, t) => (
                  <tr key={t}>
                    <td className="p-3 font-bold text-slate-900">{test.name}</td>
                    <td className="p-3 text-emerald-600 font-semibold">{test.accepted}</td>
                    <td className="p-3 text-slate-600">{test.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
