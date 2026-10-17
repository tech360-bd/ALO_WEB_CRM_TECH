'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe2, MapPin, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * Public shape of a Country row passed from the server component. Mirrors the
 * projection in src/app/destinations/page.tsx and the
 * /api/public/countries endpoint.
 */
export interface DestinationsCountry {
  id: string;
  name: string;
  slug: string;
  flagEmoji: string | null;
  description: string | null;
  whyStudy: string | null;
  costOfLiving: string | null;
  visaInfo: string | null;
  workRights: string | null;
  postStudyWork: string | null;
  popular: boolean;
  universityCount: number;
  avgTuition: string | null;
  language: string | null;
  currency: string | null;
  bannerUrl: string | null;
  status: string;
  updatedAt: string;
}

interface DestinationsClientProps {
  countries: DestinationsCountry[];
}

export default function DestinationsClient({
  countries,
}: DestinationsClientProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A]">
      {/* Top navigation strip — minimal so the hero stays prominent */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-lg text-sm font-extrabold text-white"
              style={{
                background: 'linear-gradient(135deg, #0057B8, #E8501A)',
              }}
            >
              ALO
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
              ALO Education
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden h-10 px-4 text-sm font-semibold text-slate-700 hover:text-[#0057B8] sm:inline-flex"
            >
              <Link href="/">Home</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 px-4 text-sm font-semibold text-white"
              style={{ background: '#0057B8' }}
            >
              <Link href="/#consultation">Free Consultation</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — white background, NO dark overlay, brand-styled badge */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        {/* Soft brand-colored decorative blobs (no dark overlay) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle at center, #E8501A 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle at center, #0057B8 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-5 border-[#E8501A]/30 bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#E8501A]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              7 Destinations · Real Data
            </Badge>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-4xl md:text-5xl">
              Study Abroad{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #0057B8, #E8501A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Destinations
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              Compare top study-abroad destinations for Bangladeshi students.
              Real, verified information on universities, tuition fees,
              scholarships, work rights, and visa requirements — backed by ALO
              Education counselors.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="h-12 px-6 text-sm font-semibold text-white shadow-sm"
                style={{ background: '#0057B8' }}
              >
                <Link href="#destinations-grid">
                  Browse Destinations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 border-[#E8501A] px-6 text-sm font-semibold text-[#E8501A] hover:bg-[#FFF7ED] hover:text-[#E8501A]"
              >
                <Link href="/#consultation">Book Free Consultation</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Last verified on the date shown on each country page.
            </p>
          </div>
        </div>
      </section>

      {/* Destinations grid */}
      <main className="flex-1">
        <section
          id="destinations-grid"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
                Choose your destination
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {countries.length} active destinations · Information updated
                regularly from official sources.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Globe2 className="h-4 w-4 text-[#0057B8]" />
              <span>Updated continuously</span>
            </div>
          </div>

          {countries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-base font-semibold text-[#0F172A]">
                No destinations are currently verified.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Please check with an ALO Education counselor for the latest
                information.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => (
                <CountryCard
                  key={country.id}
                  country={country}
                  isHovered={hoveredSlug === country.slug}
                  onHoverChange={(hovered) =>
                    setHoveredSlug(hovered ? country.slug : null)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg text-sm font-extrabold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #0057B8, #E8501A)',
                  }}
                >
                  ALO
                </span>
                <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                  ALO Education
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Your trusted partner for global education. We help Bangladeshi
                students study in the UK, Canada, Australia, USA, Ireland, New
                Zealand, and Dubai.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Destinations</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {countries.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/destinations/${c.slug}`}
                      className="text-slate-600 transition-colors hover:text-[#0057B8]"
                    >
                      {c.flagEmoji} Study in {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Contact</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <a
                    href="https://wa.me/8801805020100"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[#0057B8]"
                  >
                    WhatsApp: 01805020100
                  </a>
                </li>
                <li>
                  <Link
                    href="/#consultation"
                    className="transition-colors hover:text-[#0057B8]"
                  >
                    Book a free consultation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ALO Education. Visa and work
            rules can change — verify with a counselor before applying.
          </div>
        </div>
      </footer>
    </div>
  );
}

function CountryCard({
  country,
  isHovered,
  onHoverChange,
}: {
  country: DestinationsCountry;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const href = `/destinations/${country.slug}`;
  return (
    <Link
      href={href}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      className="group block h-full"
    >
      <Card
        className={
          'h-full overflow-hidden border border-slate-200 py-0 transition-all duration-200 hover:-translate-y-1 hover:border-[#0057B8]/40 hover:shadow-lg'
        }
        style={isHovered ? { boxShadow: '0 12px 30px -10px rgba(0,87,184,0.25)' } : undefined}
      >
        {/* Banner / flag fallback */}
        <div
          className="relative flex h-40 items-center justify-center overflow-hidden"
          style={{
            background: country.bannerUrl
              ? `linear-gradient(135deg, #0057B8 0%, #E8501A 100%)`
              : 'linear-gradient(135deg, #0057B8 0%, #E8501A 100%)',
          }}
        >
          {country.bannerUrl ? (
            <img
              src={country.bannerUrl}
              alt={country.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span
              className="absolute text-7xl opacity-90 drop-shadow-lg"
              style={{ filter: 'saturate(1.1)' }}
            >
              {country.flagEmoji || '🌍'}
            </span>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15,23,42,0.45) 100%)',
            }}
          />
          {country.popular && (
            <Badge
              variant="outline"
              className="absolute left-3 top-3 border-transparent bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#E8501A]"
            >
              Popular
            </Badge>
          )}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
              {country.flagEmoji || '🌍'} {country.name}
            </div>
            <div className="mt-0.5 text-lg font-extrabold leading-tight">
              Study in {country.name}
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="flex h-full flex-col gap-3 p-5">
          <p className="line-clamp-3 text-sm text-slate-600">
            {country.description ||
              'Information not currently verified. Please check with an ALO Education counselor.'}
          </p>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-4 w-4 text-[#0057B8]" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                  Universities
                </div>
                <div className="font-bold text-[#0F172A]">
                  {country.universityCount || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-4 w-4 text-[#E8501A]" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                  Avg Tuition
                </div>
                <div className="font-bold text-[#0F172A]">
                  {country.avgTuition || '—'}
                </div>
              </div>
            </div>
          </div>

          <Button
            tabIndex={-1}
            className="mt-2 h-12 w-full text-sm font-semibold text-white"
            style={{ background: '#0057B8' }}
          >
            Explore {country.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </Link>
  );
}
