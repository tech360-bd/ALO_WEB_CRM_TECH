'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  Partner Logos (first 10)                                            */
/* ------------------------------------------------------------------ */

const PARTNER_LOGOS = [
  { src: '/images/partners/aston university.webp', alt: 'Aston University' },
  { src: '/images/partners/university of kent.webp', alt: 'University of Kent' },
  { src: '/images/partners/university of lincoln.webp', alt: 'University of Lincoln' },
  { src: '/images/partners/university of portsmouth.webp', alt: 'University of Portsmouth' },
  { src: '/images/partners/university of hertfordshire.webp', alt: 'University of Hertfordshire' },
  { src: '/images/partners/university of dundee.webp', alt: 'University of Dundee' },
  { src: '/images/partners/university of aberdeen.webp', alt: 'University of Aberdeen' },
  { src: '/images/partners/university of greenwich.webp', alt: 'University of Greenwich' },
  { src: '/images/partners/birmingham city university .webp', alt: 'Birmingham City University' },
  { src: '/images/partners/university of sunderland.webp', alt: 'University of Sunderland' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  return (
    <section
      ref={sectionRef}
      className="w-full border-y border-alo-gray-medium/60 bg-alo-white py-6"
      aria-label="Trusted partner universities"
    >
      <motion.div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-5 text-center text-sm font-medium text-alo-gray">
          Trusted by students from <span className="font-bold text-alo-black">15+ countries</span> · Partnered with leading universities
        </p>

        {/* Scrolling logos — hidden on small screens, visible lg+ */}
        <div className="relative hidden lg:block overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-alo-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-alo-white to-transparent" />

          <div className="flex w-max gap-12 scroll-x-animation">
            {/* Duplicate for seamless loop */}
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
              <div
                key={`${logo.alt}-${i}`}
                className="flex h-10 w-auto shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fallback grid on mobile/tablet */}
        <div className="grid grid-cols-3 gap-6 lg:hidden max-w-md mx-auto">
          {PARTNER_LOGOS.slice(0, 6).map((logo) => (
            <div
              key={logo.alt}
              className="flex h-9 items-center justify-center opacity-40 grayscale"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
