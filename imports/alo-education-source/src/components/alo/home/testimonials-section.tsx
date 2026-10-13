'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Testimonial {
  name: string;
  course: string;
  university: string;
  image: string;
  quote: string;
  rating: number;
  outcome?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Tahmid Rahman',
    course: 'MSc Data Science',
    university: 'University of Birmingham',
    image: '/images/alo/testimonials/student-01.webp',
    quote: 'ALO Education made the entire application process seamless. Their AI course finder matched me with Birmingham, and I received a £5,000 scholarship I would have never found on my own. The counsellors were available 24/7 on WhatsApp — truly exceptional support.',
    rating: 5,
  },
  {
    name: 'Nusrat Jahan Mim',
    course: 'MBA International Business',
    university: 'Manchester Metropolitan University',
    image: '/images/alo/testimonials/student-02.webp',
    quote: 'I was overwhelmed by the UK visa process until ALO stepped in. They prepared every document perfectly and even helped me with mock interview practice. I got my visa on the first attempt. Highly recommend to any Bangladeshi student dreaming of studying abroad.',
    rating: 5,
  },
  {
    name: 'Rafiq Hasan',
    course: 'MSc Computer Science',
    university: 'University of Birmingham, UK',
    image: '/images/alo/testimonials/student-03.webp',
    quote: "ALO's AI Course Finder matched me with Birmingham's MSc Computer Science program which was perfect for my background. The entire application process was handled seamlessly, and I got my offer letter within 4 weeks. I'm now in my second semester and loving every moment.",
    rating: 5,
    outcome: 'Studying at University of Birmingham',
  },
  {
    name: 'Farhana Islam',
    course: 'MBA International Business',
    university: 'Manchester Metropolitan University, UK',
    image: '/images/alo/testimonials/student-04.webp',
    quote: 'I was confused about which MBA program to choose. ALO\'s counsellor helped me understand my options and the scholarship opportunities. I received a £5,000 scholarship that I wouldn\'t have found on my own. The visa process was also handled perfectly.',
    rating: 5,
    outcome: 'Received £5,000 Scholarship',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mb-3 inline-flex items-center justify-center rounded-full border border-amber-200/50 bg-amber-50 p-1.5">
            <Quote className="h-3.5 w-3.5 text-amber-600" />
          </span>
          <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">
            Student Stories
          </span>
          <h2
            id="testimonials-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Hear From Our Successful Students
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            Real stories from Bangladeshi students who achieved their study abroad dream with ALO.
          </p>
        </motion.div>

        {/* ── Testimonial Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              className="flex flex-col gap-5 rounded-xl border border-alo-gray-medium/60 bg-alo-white p-6 shadow-sm"
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.15 + i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Student info + image */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-alo-blue/10">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-alo-black">{t.name}</h3>
                  <p className="text-sm font-medium text-alo-blue">{t.course}</p>
                  <p className="text-xs text-alo-gray">{t.university}</p>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="flex-1 text-sm leading-relaxed italic text-alo-gray">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Star rating + Outcome */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < t.rating ? 'fill-[#FFB347] text-[#FFB347]' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                {t.outcome && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {t.outcome}
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
