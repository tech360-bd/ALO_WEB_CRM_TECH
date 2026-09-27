import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Globe, MapPin, Award, ExternalLink, ArrowRight } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Universities | ALO Education' };

  return {
    title: `Top Universities in ${country.name} | ALO Education`,
    description: `Explore top accredited universities in ${country.name} for Bangladeshi applicants. Find rankings, campus locations, tuition fees, and admission requirements.`,
  };
}

export default async function CountryUniversitiesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);
  if (!countryData) notFound();

  const universities = await db.crmUniversity.findMany({
    where: {
      OR: [
        { country: { contains: countryData.name } },
        { country: { contains: countryData.code } },
      ],
    },
    orderBy: { name: 'asc' },
  }).catch(() => []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/destinations" className="hover:text-blue-600">Destinations</Link>
          <span>/</span>
          <Link href={`/destinations/${countryData.slug}`} className="hover:text-blue-600">{countryData.name}</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Universities</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <span>{countryData.flag}</span> Accredited Institutions
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Top Universities in {countryData.name}
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Browse verified universities in {countryData.name} accepting Bangladeshi qualifications (HSC, A-Levels, Bachelor degrees). Explore tuition fee ranges, QS world rankings, and campus details.
          </p>
        </div>

        {/* University Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  {uni.worldRanking > 0 && (
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" /> QS #{uni.worldRanking}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{uni.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{uni.city}, {countryData.name}</span>
                  </div>
                </div>

                {uni.tuitionRange && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-slate-500">Tuition Range:</span>
                    <span className="font-bold text-slate-800">{uni.tuitionRange}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={uni.website || uni.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  Official Site <ExternalLink className="w-3 h-3" />
                </a>
                <Link
                  href={`/destinations/${countryData.slug}/courses?uniId=${uni.id}`}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                >
                  View Courses <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
