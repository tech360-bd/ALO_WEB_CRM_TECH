'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScholarshipCard, type ScholarshipCardData } from '@/components/alo/cards/scholarship-card';
import { ArrowRight, Award } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Sample Data                                                        */
/* ------------------------------------------------------------------ */

const SCHOLARSHIPS: ScholarshipCardData[] = [
  {
    name: 'Global Excellence Scholarship',
    university: 'University of Birmingham',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£5,000',
    eligibility: ['2:1 Degree', 'IELTS 6.5+'],
    deadline: '2025-06-30',
    degree: 'Masters',
    international: true,
    source: 'University',
  },
  {
    name: 'Business School Excellence Award',
    university: 'Manchester Metropolitan University',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£3,000',
    eligibility: ['GPA 3.0+', 'Work Experience'],
    deadline: '2025-07-15',
    degree: 'MBA',
    international: true,
    source: 'University',
  },
  {
    name: 'Aston Global Scholarship',
    university: 'Aston University',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£4,000',
    eligibility: ['First Class Honours', 'IELTS 6.0+'],
    deadline: '2025-05-31',
    degree: 'Masters',
    international: true,
    source: 'University',
  },
  {
    name: 'Kent Scholarship for International Students',
    university: 'University of Kent',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£3,000',
    eligibility: ['2:1 Degree', 'International Student'],
    deadline: '2025-06-30',
    degree: 'Masters',
    international: true,
    source: 'University',
  },
  {
    name: 'Portsmouth Global Excellence Scholarship',
    university: 'University of Portsmouth',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£2,000',
    eligibility: ['GPA 3.0+', 'Any Degree Level'],
    deadline: '2025-05-31',
    degree: 'Any Degree',
    international: true,
    source: 'University',
  },
  {
    name: 'Hertfordshire International Scholarship',
    university: 'University of Hertfordshire',
    country: 'United Kingdom',
    flag: '🇬🇧',
    amount: '£2,500',
    eligibility: ['2:1 Degree', 'IELTS 6.5+'],
    deadline: '2025-07-15',
    degree: 'Masters/Undergraduate',
    international: true,
    source: 'University',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScholarshipsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      id="scholarships"
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="scholarships-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4ED] border border-[#F37021]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F37021]">
              <Award className="h-3.5 w-3.5" strokeWidth={2.5} />
              Scholarships
            </span>
          </div>
          <h2
            id="scholarships-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Financial Support for Your Education
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            Discover scholarships you are eligible for — our students have won over £2.5 million in funding.
          </p>
        </motion.div>

        {/* ── Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOLARSHIPS.map((scholarship, i) => (
            <motion.div
              key={scholarship.name}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <ScholarshipCard
                scholarship={scholarship}
                onCheckEligibility={() => console.log('Check eligibility:', scholarship.name)}
              />
            </motion.div>
          ))}
        </div>

        {/* ── View All Link ───────────────────────────────────── */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a
            href="/scholarships"
            className="group inline-flex items-center gap-2 rounded-xl border border-alo-orange/20 bg-alo-orange-light px-6 py-3 text-sm font-bold text-alo-orange transition-all duration-200 hover:bg-alo-orange hover:text-white focus-ring"
          >
            Browse All Scholarships
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
