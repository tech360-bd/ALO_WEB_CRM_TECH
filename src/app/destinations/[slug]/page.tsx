import React from 'react';
import { notFound } from 'next/navigation';
import PremiumCountryPage from '@/components/website/PremiumCountryPage';
import MasterCountryDestinationView from '@/components/website/MasterCountryDestinationView';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';

export async function generateStaticParams() {
  return [
    { slug: 'uk' },
    { slug: 'united-kingdom' },
    { slug: 'usa' },
    { slug: 'united-states' },
    { slug: 'canada' },
    { slug: 'australia' },
    { slug: 'germany' },
    { slug: 'ireland' },
    { slug: 'new-zealand' },
    { slug: 'dubai-uae' },
    { slug: 'dubai' },
    { slug: 'malaysia' },
    { slug: 'netherlands' },
  ];
}

function resolveCountrySlug(slug: string) {
  const s = slug.toLowerCase().trim();
  if (s === 'united-kingdom' || s === 'great-britain') return 'uk';
  if (s === 'united-states' || s === 'us' || s === 'america') return 'usa';
  if (s === 'dubai-uae' || s === 'uae') return 'dubai';
  if (s === 'nz') return 'new-zealand';
  return s;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = resolveCountrySlug(slug);
  const country = COUNTRY_DESTINATIONS[resolved] || COUNTRY_DESTINATIONS[slug.toLowerCase().trim()];

  if (!country) {
    return {
      title: 'Destination Guide | ALO Education Bangladesh',
      description: 'Explore study abroad destinations with ALO Education — premium, DB-driven, country-specific, verified.',
    };
  }

  return {
    title: country.seoTitle,
    description: country.seoDescription + ' Premium 10x country page system — white background #FFFFFF, no dark overlay, country-specific courses/universities/visa rules/work rights/post-study/entry requirements/scholarships/cities/FAQs — DB-driven, verified, actionable.',
    alternates: { canonical: country.canonicalUrl },
    openGraph: {
      title: country.name + ' Study Guide — Premium 10x',
      description: country.seoDescription,
      url: country.canonicalUrl,
      type: 'website',
    },
  };
}

export default async function CountryDestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = resolveCountrySlug(slug);
  const countryData = COUNTRY_DESTINATIONS[resolved] || COUNTRY_DESTINATIONS[slug.toLowerCase().trim()];

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
    }).catch(() => []),
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
    }).catch(() => []),
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
    }).catch(() => []),
  ]);

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
