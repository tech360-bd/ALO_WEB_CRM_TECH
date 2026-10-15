import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Clock, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ALO_CONTACT } from '@/lib/alo-site-info';

/**
 * Global Offices — linked from the footer Company column.
 * Honest scope: ALO Education's office is the Dhaka head office below. We
 * serve students for the listed study destinations online and by phone;
 * we do not claim physical offices in destination countries.
 */
export const metadata: Metadata = {
  title: 'Global Offices | ALO Education',
  description:
    'Visit the ALO Education head office in Panthapath, Dhaka — Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh. Serving students for UK, Australia, Canada, Ireland, New Zealand, USA and Dubai study destinations.',
  alternates: { canonical: 'https://aloeducation.com/global-offices' },
  openGraph: {
    title: 'Global Offices | ALO Education',
    description:
      'ALO Education head office in Dhaka, Bangladesh — contact details, Google location and the study destinations we serve worldwide.',
    url: 'https://aloeducation.com/global-offices',
    type: 'website',
  },
};

const DESTINATIONS_SERVED = [
  { label: 'United Kingdom', href: '/destinations/uk' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'USA', href: '/destinations/usa' },
  { label: 'Dubai', href: '/destinations/dubai' },
];

export default function GlobalOfficesPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <span className="mb-4 inline-block rounded-full bg-[#E6F2FF] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0066CC]">
          Global Offices
        </span>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#0F172A] md:text-5xl">
          Our Office &amp; Global Reach
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[#555555]">
          ALO Education is headquartered in Dhaka, Bangladesh, and guides students online and in
          person for study destinations around the world. Visit us, call us, or start with a free
          online counselling session.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Head office */}
          <section aria-labelledby="head-office-heading" className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0066CC]">
              <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <h2 id="head-office-heading" className="font-heading text-xl font-bold text-[#0F172A]">
              Head Office — Dhaka, Bangladesh
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm text-[#555555]">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">Address: </span>
                  {ALO_CONTACT.address}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">Location (Google): </span>
                  <a
                    href={ALO_CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#0066CC] underline underline-offset-2 hover:text-[#F37021]"
                  >
                    Open in Google Maps
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">WhatsApp: </span>
                  <a href={ALO_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0066CC] hover:text-[#F37021]">
                    {ALO_CONTACT.whatsappDisplay}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">Mobile: </span>
                  <a href={ALO_CONTACT.mobileHref} className="font-medium text-[#0066CC] hover:text-[#F37021]">
                    {ALO_CONTACT.mobileDisplay}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">Email: </span>
                  <a href={ALO_CONTACT.emailHref} className="font-medium text-[#0066CC] hover:text-[#F37021]">
                    {ALO_CONTACT.email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#F37021]" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[#0F172A]">Office hours: </span>
                  {ALO_CONTACT.officeHours}
                </span>
              </li>
            </ul>
            <Link
              href="/book-consultation"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#F37021] px-6 font-heading text-sm font-bold text-white transition-colors hover:bg-[#D95D12]"
            >
              Book Free Counseling
            </Link>
          </section>

          {/* Destinations served */}
          <section aria-labelledby="destinations-served-heading" className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 sm:p-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F37021]">
              <Globe className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <h2 id="destinations-served-heading" className="font-heading text-xl font-bold text-[#0F172A]">
              Study Destinations We Serve
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#555555]">
              Our counsellors in Dhaka support applications to universities and colleges across
              these destinations. We do not operate physical offices in destination countries —
              guidance for every destination is provided from our head office and online, so you
              always know exactly who is handling your application.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DESTINATIONS_SERVED.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className="flex min-h-[44px] items-center rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#0066CC] hover:text-[#0066CC]"
                  >
                    Study in {d.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-[#555555]">
              Not in Dhaka?{' '}
              <Link href="/contact" className="font-semibold text-[#0066CC] underline underline-offset-2">
                Contact us online
              </Link>{' '}
              — counselling is available by phone, WhatsApp and video call across Bangladesh.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
