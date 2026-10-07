import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Calendar, DollarSign, Clock, Search, ArrowRight } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';
import { throwSanitizedDatabaseFailure } from '@/lib/safe-db-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);
  if (!country) return { title: 'Courses | ALO Education' };

  return {
    title: `Study Courses in ${country.name} | ALO Education`,
    description: `Find undergraduate and postgraduate courses in ${country.name} for Bangladeshi students. Filter by tuition fee, intake, award, and study level.`,
  };
}

export default async function CountryCoursesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);
  if (!countryData) notFound();

  const courses = await db.crmCourse.findMany({
    where: {
      OR: [
        { country: { contains: countryData.name } },
        { country: { contains: countryData.code } },
        { university: { country: { contains: countryData.name } } },
        { university: { country: { contains: countryData.code } } },
      ],
    },
    take: 30,
    orderBy: { courseTitle: 'asc' },
    include: {
      university: true,
      intakeFees: true,
      requirements: true,
    },
  }).catch((error) => throwSanitizedDatabaseFailure(
    'destination-courses',
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
          <span className="text-slate-800 font-semibold">Courses</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <span>{countryData.flag}</span> Degree Programs
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Available Courses in {countryData.name}
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Search verified Foundation, Bachelor’s, Master’s, and PhD programs offered by top universities in {countryData.name}.
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const primaryIntake = course.intakeFees && course.intakeFees.length > 0 ? course.intakeFees[0] : null;
            const primaryReq = course.requirements && course.requirements.length > 0 ? course.requirements[0] : null;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {course.qualification || 'Degree'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {course.studyLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{course.courseTitle}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{course.university?.name || 'Partner University'}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Duration:
                      </span>
                      <span className="font-semibold text-slate-800">{course.durationMonths > 0 ? `${course.durationMonths} Months` : '1-3 Years'}</span>
                    </div>
                    {primaryIntake && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Tuition Fee:
                        </span>
                        <span className="font-bold text-emerald-600">
                          {primaryIntake.tuitionCurrency} {primaryIntake.yearlyTuition?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {primaryReq && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IELTS Min:</span>
                        <span className="font-semibold text-slate-800">{primaryReq.ieltsOverall || 6.5}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Intake: {primaryIntake?.intakeMonth || 'Sept / Jan'}</span>
                  <Link
                    href={`/eligibility-check?courseId=${course.id}`}
                    className="text-xs bg-[#0B5ED7] hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1"
                  >
                    Check Eligibility <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
