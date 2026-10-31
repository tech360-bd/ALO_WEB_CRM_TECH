import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Award, Calendar, DollarSign, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';
import { throwSanitizedDatabaseFailure } from '@/lib/safe-db-error';
import { publicScholarshipsInCountryWhere, stripInternalFields } from '@/lib/public-catalog';

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

  const scholarships = stripInternalFields(await db.crmScholarship.findMany({
    where: publicScholarshipsInCountryWhere(countryData.name, countryData.code),
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      university: true,
    },
  }).catch((error) => throwSanitizedDatabaseFailure(
    'destination-scholarships',
    error,
    'DESTINATION_DATA_UNAVAILABLE',
  )));

  return (
    <div className="bg-[var(--alo-page)] min-h-screen py-12 text-[var(--alo-text)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)]">
          <Link href="/destinations" className="hover:text-[var(--alo-brand)]">Destinations</Link>
          <span>/</span>
          <Link href={`/destinations/${countryData.slug}`} className="hover:text-[var(--alo-brand)]">{countryData.name}</Link>
          <span>/</span>
          <span className="text-[var(--alo-text)] font-semibold">Scholarships</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-[var(--alo-border)] shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-crm-success-bg text-crm-success-text text-xs font-bold rounded-full border border-crm-success-border">
            <Award className="w-4 h-4" /> <span>{countryData.flag}</span> Verified Financial Aid Grants
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--alo-text)]">
            Scholarships in {countryData.name} for Bangladeshi Students
          </h1>
          <p className="text-xs text-[var(--alo-body)] max-w-3xl leading-relaxed">
            Discover partial tuition fee waivers, merit-based grants, and automatic awards available for Bangladeshi applicants studying in {countryData.name}.
          </p>
        </div>

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((sch) => (
            <div
              key={sch.id}
              className="bg-white rounded-2xl border border-[var(--alo-border)] p-6 flex flex-col justify-between hover:border-crm-success-border hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 bg-crm-success-bg text-crm-success-text rounded-full border border-crm-success-border">
                    {sch.coverageType || 'Tuition Reduction'}
                  </span>
                  <span className="text-xs text-[var(--alo-text-muted)] font-semibold">
                    {sch.scholarshipCurrency} {sch.scholarshipAmount?.toLocaleString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-[var(--alo-text)] text-base">{sch.scholarshipName}</h3>
                  <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{sch.university?.name || sch.provider || countryData.name}</p>
                </div>

                <div className="space-y-1.5 text-xs text-[var(--alo-body)] border-t border-[var(--alo-border)] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alo-text-muted)]">Eligible Levels:</span>
                    <span className="font-semibold text-[var(--alo-text)]">{sch.eligibleLevels || 'UG / PG'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--alo-text-muted)] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Deadline:
                    </span>
                    <span className="font-bold text-crm-warning-text">{sch.deadline ? String(sch.deadline).substring(0, 10) : 'Rolling Admission'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--alo-border)] flex items-center justify-between">
                <a
                  href={sch.officialScholarshipUrl || countryData.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-crm-success-text font-semibold flex items-center gap-1 hover:underline"
                >
                  Official Details <ExternalLink className="w-3 h-3" />
                </a>
                <Link
                  href="/book-consultation"
                  className="text-xs bg-[var(--alo-success-dark)] hover:bg-[var(--alo-success-dark)] text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1"
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
