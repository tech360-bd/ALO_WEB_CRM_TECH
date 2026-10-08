import React from 'react';
import { notFound } from 'next/navigation';
import PremiumCountryPage from '@/components/website/PremiumCountryPage';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';
import { throwSanitizedDatabaseFailure } from '@/lib/safe-db-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryDestination(slug);

  if (!country) {
    return {
      title: 'Destination Guide | ALO Education Bangladesh',
      description: 'Explore study abroad destinations with ALO Education: country-specific courses, universities, visa guidance and scholarships.',
    };
  }

  return {
    title: country.seoTitle,
    description: country.seoDescription + ' Courses, universities, visa guidance, work rights, scholarships and FAQs for this destination, with sources shown.',
    alternates: { canonical: country.canonicalUrl },
    openGraph: {
      title: country.name + ' Study Guide',
      description: country.seoDescription,
      url: country.canonicalUrl,
      type: 'website',
    },
  };
}

export default async function CountryDestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryData = getCountryDestination(slug);

  if (!countryData) {
    notFound();
  }

  // Load dynamically from existing courses table filter country_id — per spec section 8,9,18
  const [linkedCourses, linkedUniversities, linkedScholarships] = await Promise.all([
    db.crmCourse.findMany({
      where: {
        OR: [
          { country: { contains: countryData.name } },
          { country: { contains: countryData.code } },
          { university: { country: { contains: countryData.name } } },
        ],
      },
      take: 24,
      orderBy: { createdAt: 'desc' },
      include: {
        university: { select: { name: true, city: true, country: true, slug: true, universityId: true, ieltsMin: true, scholarships: true, lastVerifiedAt: true, sourceUrl: true } },
        intakeFees: { take: 2, orderBy: { intakeYear: 'asc' } },
        requirements: { take: 1 },
        scholarshipRecords: { take: 2 },
      },
    }),
    db.crmUniversity.findMany({
      take: 24,
      where: {
        OR: [
          { country: { contains: countryData.name } },
          { country: { contains: countryData.code } },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: true, scholarshipRecords: true } },
      },
    }),
    db.crmScholarship.findMany({
      where: {
        university: {
          OR: [
            { country: { contains: countryData.name } },
            { country: { contains: countryData.code } },
          ],
        },
      },
      take: 12,
      include: {
        university: { select: { name: true, country: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]).catch((error) => throwSanitizedDatabaseFailure(
    'destination-page',
    error,
    'DESTINATION_DATA_UNAVAILABLE',
  ));

  // Use premium 10x page — world-class ALO Education Country Page system at least 10x better than current shared format
  // Same premium design system and page architecture for all countries, but ALL CONTENT country-specific, NEVER copy UK rules into another country
  return (
    <PremiumCountryPage
      countryData={countryData}
      linkedCourses={linkedCourses}
      linkedUniversities={linkedUniversities}
      linkedScholarships={linkedScholarships}
    />
  );
}
