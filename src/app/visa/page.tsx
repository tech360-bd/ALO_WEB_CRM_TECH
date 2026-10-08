import type { Metadata } from 'next';
import VisaSupportHub from '@/components/website/VisaSupportHub';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

export const metadata: Metadata = {
  title: 'Student Visa Support — Process, Documents, Work Rights & Sources',
  description:
    'Verified student visa guidance by destination: application steps, document requirements, financial evidence, work rights and post-study options — each with the official source and last verification date.',
  alternates: { canonical: '/visa' },
  openGraph: {
    title: 'Student Visa Support | ALO Education',
    description:
      'Step-by-step student visa guidance for Bangladeshi students, sourced from official government pages.',
    url: '/visa',
    type: 'website',
  },
};

export default function VisaPage() {
  const countries = Object.values(COUNTRY_DESTINATIONS)
    .map((country) => ({
      slug: country.slug,
      name: country.name,
      flag: country.flag,
      visaType: country.visaType,
      lastVerifiedAt: country.lastVerifiedAt ?? null,
      // A destination is only selectable as "verified" when it carries an
      // actual visa process record. The hub renders an explicit
      // "currently being verified" state for anything else.
      hasVisaRecord: Array.isArray(country.visaSteps) && country.visaSteps.length > 0,
    }))
    // Verified destinations first, then alphabetical.
    .sort((a, b) => Number(b.hasVisaRecord) - Number(a.hasVisaRecord) || a.name.localeCompare(b.name));

  return <VisaSupportHub countries={countries} />;
}
