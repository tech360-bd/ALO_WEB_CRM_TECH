import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Award, Calendar, DollarSign, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';
import { throwSanitizedDatabaseFailure } from '@/lib/safe-db-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Scholarships | ALO Education' };

  return {
    title: `Scholarships in ${country.name} for Bangladeshi Students | ALO Education`,
    description: `Explore partial and full tuition scholarships in ${country.name} for Bangladeshi applicants. Check eligibility, award amounts, and deadlines.`,
  };
}

export default async function CountryScholarshipsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);
  if (!countryData) notFound();

  const scholarships = await db.crmScholarship.findMany({
    where: {
      university: {
        OR: [
          { country: { contains: countryData.name } },
          { country: { contains: countryData.code } },
        ],
      },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      university: true,
    },
  }).catch((error) => throwSanitizedDatabaseFailure(
    'destination-scholarships',
    error,
    'DESTINATION_DATA_UNAVAILABLE',
  ));

  return (
    <div className="bg-slate-50 min-h-screen py-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/destinations" className="hover:text-blue-600">Destinations</Link>
          <span>/</span>
          <Link href={`/destinations/${countryData.slug}`} className="hover:text-blue-600">{countryData.name}</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Scholarships</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <Award className="w-4 h-4" /> <span>{countryData.flag}</span> Verified Financial Aid Grants
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Scholarships in {countryData.name} for Bangladeshi Students
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Discover partial tuition fee waivers, merit-based grants, and automatic awards available for Bangladeshi applicants studying in {countryData.name}.
          </p>
        </div>

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((sch) => (
            <div
              key={sch.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {sch.coverageType || 'Tuition Reduction'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {sch.scholarshipCurrency} {sch.scholarshipAmount?.toLocaleString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{sch.scholarshipName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{sch.university?.name || sch.provider || countryData.name}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Eligible Levels:</span>
                    <span className="font-semibold text-slate-800">{sch.eligibleLevels || 'UG / PG'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Deadline:
                    </span>
                    <span className="font-bold text-amber-700">{sch.deadline ? String(sch.deadline).substring(0, 10) : 'Rolling Admission'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={sch.officialScholarshipUrl || countryData.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  Official Details <ExternalLink className="w-3 h-3" />
                </a>
                <Link
                  href="/book-consultation"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1"
                >
                  Apply For Grant <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
