'use client';

import { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getAvailableCountrySlugs } from '@/lib/country-configs';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface CountryData {
  name: string;
  flag: string;
  image: string;
  universities: string;
  tuition: string;
  slug: string;
}

const ALL_COUNTRIES: CountryData[] = [
  { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', image: '/images/cards/uk.png', universities: '180+ Universities', tuition: '\u00A312K-\u00A335K Avg Tuition', slug: 'uk' },
  { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', image: '/images/cards/usa.png', universities: '150+ Universities', tuition: '$20K-$60K Avg Tuition', slug: 'usa' },
  { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', image: '/images/cards/canada.png', universities: '100+ Universities', tuition: 'C$15K-C$40K Avg Tuition', slug: 'canada' },
  { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', image: '/images/cards/australia.png', universities: '45+ Universities', tuition: 'A$20K-A$45K Avg Tuition', slug: 'australia' },
  { name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', image: '/images/cards/new-zealand.png', universities: '25+ Universities', tuition: 'NZ$22K-NZ$35K Avg Tuition', slug: 'new-zealand' },
  { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', image: '/images/cards/ireland.png', universities: '30+ Universities', tuition: '\u20AC12K-\u20AC25K Avg Tuition', slug: 'ireland' },
  { name: 'Dubai (UAE)', flag: '\u{1F1E6}\u{1F1EA}', image: '/images/cards/dubai.png', universities: '60+ Universities', tuition: 'AED 40K-100K Avg Tuition', slug: 'dubai' },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CountriesSection({ onCountryClick }: { onCountryClick?: (slug: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const availableSlugs = useMemo(() => new Set(getAvailableCountrySlugs()), []);

  return (
    <section id="countries" ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="countries-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">Popular Destinations</span>
          <h2 id="countries-heading" className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl">Where Would You Like to Study?</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">Explore top study destinations trusted by thousands of Bangladeshi students every year.</p>
        </motion.div>

        {/* ── Country Grid ────────────────────────────────────────── */}
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {ALL_COUNTRIES.map((country) => {
            const hasPage = availableSlugs.has(country.slug);
            return (
              <motion.article
                key={country.slug}
                variants={cardVariants}
                className={`group relative overflow-hidden rounded-xl ${hasPage ? 'cursor-pointer' : 'cursor-default opacity-75'}`}
                onClick={() => hasPage && onCountryClick?.(country.slug)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hasPage) onCountryClick?.(country.slug); } }}
                tabIndex={hasPage ? 0 : -1}
                role={hasPage ? 'link' : undefined}
                aria-label={`Study in ${country.name}`}
                whileHover={hasPage ? { y: -4 } : undefined}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={country.image} alt={`${country.name} study destination`} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent transition-colors duration-300 group-hover:from-black/60" />
                  {hasPage && (
                    <div className="country-explore-badge absolute top-3 right-3 rounded-full bg-alo-orange/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">Explore</div>
                  )}
                  {!hasPage && (
                    <div className="absolute top-3 right-3 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">Coming Soon</div>
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                    <span className="text-3xl sm:text-4xl" aria-hidden="true">{country.flag}</span>
                    <h3 className="mt-2 text-base font-bold leading-tight text-white sm:text-lg">{country.name}</h3>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs font-medium text-white/80">{country.universities}</p>
                      <p className="text-xs text-white/70">{country.tuition}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ── Explore All Link ────────────────────────────────────── */}
        <motion.div className="mt-10 text-center" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-alo-blue">
            4 of 14 destinations now available
            <ArrowRight className="h-4 w-4" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
