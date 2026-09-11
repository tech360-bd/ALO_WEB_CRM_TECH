export const dynamic = "force-dynamic";
import React from 'react';
import { notFound } from 'next/navigation';
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
      description: 'Explore study abroad destinations with ALO Education.',
    };
  }

  return {
    title: country.seoTitle,
    description: country.seoDescription,
    alternates: { canonical: country.canonicalUrl },
    openGraph: {
      title: country.name,
      description: country.seoDescription,
      url: country.canonicalUrl,
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

  const [linkedCourses, linkedUniversities, linkedScholarships] = await Promise.all([
    db.crmCourse.findMany({
      take: 12,
      orderBy: { createdAt: 'desc' },
    }),
    db.crmUniversity.findMany({
      take: 8,
      where: {
        OR: [
          { country: { contains: countryData.name } },
          { country: { contains: countryData.code } },
        ],
      },
      orderBy: { name: 'asc' },
    }),
    db.crmScholarship.findMany({
      take: 6,
    }),
  ]);

  return (
    <MasterCountryDestinationView
      countryData={countryData}
      linkedCourses={linkedCourses}
      linkedUniversities={linkedUniversities}
      linkedScholarships={linkedScholarships}
    />
  );
}
