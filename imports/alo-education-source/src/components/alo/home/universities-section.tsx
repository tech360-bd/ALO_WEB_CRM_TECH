'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { UniversityCard, type UniversityCardData } from '@/components/alo/cards/university-card';
import { UniversityQuickView, type UniversityData } from '@/components/alo/drawers/university-quick-view';

/* ------------------------------------------------------------------ */
/*  Sample Data                                                        */
/* ------------------------------------------------------------------ */

const UNIVERSITIES: UniversityCardData[] = [
  {
    name: 'University of Birmingham',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '84',
    courses: '350+',
    tuitionRange: '\u00a321K-\u00a335K',
    scholarships: '45+',
    subjects: ['Business', 'Engineering', 'Computer Science'],
    image: '/images/alo/universities/uk-campus-01.webp',
    matchScore: 91,
  },
  {
    name: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: 'Top 60',
    courses: '500+',
    tuitionRange: '\u00a316K-\u00a324K',
    scholarships: '30+',
    subjects: ['MBA', 'Data Science', 'Art & Design'],
    image: '/images/alo/universities/campus-modern.webp',
    matchScore: 89,
  },
  {
    name: 'Aston University',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: 'Top 50',
    courses: '200+',
    tuitionRange: '\u00a318K-\u00a328K',
    scholarships: '25+',
    subjects: ['Business', 'Engineering', 'Optometry'],
    image: '/images/alo/universities/campus-library.webp',
    matchScore: 94,
  },
  {
    name: 'University of Kent',
    city: 'Canterbury',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '347',
    courses: '300+',
    tuitionRange: '\u00a316K-\u00a328K',
    scholarships: '8',
    subjects: ['Business', 'Law', 'Computing'],
    image: '/images/alo/universities/campus-modern.webp',
    matchScore: 87,
  },
  {
    name: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '501',
    courses: '250+',
    tuitionRange: '\u00a315K-\u00a324K',
    scholarships: '6',
    subjects: ['Engineering', 'Biology', 'Criminology'],
    image: '/images/alo/universities/campus-library.webp',
    matchScore: 92,
  },
  {
    name: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '601',
    courses: '200+',
    tuitionRange: '\u00a314K-\u00a322K',
    scholarships: '5',
    subjects: ['Aerospace', 'Pharmacy', 'Animation'],
    image: '/images/alo/universities/manchester-campus.webp',
    matchScore: 86,
  },
];

const UNIVERSITY_DETAILS: Record<string, UniversityData> = {
  'University of Birmingham': {
    name: 'University of Birmingham',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '84',
    rankingSource: 'QS 2025',
    students: '38,000+',
    courses: '350+',
    tuitionRange: '\u00a321,000 \u2013 \u00a335,000',
    scholarships: '45+',
    accommodation: 'Guaranteed first-year accommodation in university halls. Weekly costs range from \u00a3110\u2013\u00a3220 depending on room type and catering options.',
    subjects: ['Business & Management', 'Mechanical Engineering', 'Computer Science', 'Law', 'Medicine', 'Psychology', 'Electrical Engineering', 'Economics'],
    description: 'A Russell Group university founded in 1900, the University of Birmingham is a world-leading research institution consistently ranked in the global top 100.',
    campusImage: '/images/alo/universities/uk-campus-01.webp',
    logo: '/images/partners/university of birmingham.webp',
    featuredCourses: [
      { name: 'MSc Data Science', degree: 'Masters', tuition: '\u00a327,000' },
      { name: 'MBA International Business', degree: 'MBA', tuition: '\u00a332,000' },
      { name: 'MSc Computer Science', degree: 'Masters', tuition: '\u00a326,000' },
    ],
  },
  'Manchester Metropolitan University': {
    name: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: 'Top 60',
    rankingSource: 'Guardian 2025',
    students: '40,000+',
    courses: '500+',
    tuitionRange: '\u00a316,000 \u2013 \u00a324,000',
    scholarships: '30+',
    accommodation: 'Modern halls of residence in the city centre. Prices start from \u00a3105/week.',
    subjects: ['MBA', 'Data Science', 'Art & Design', 'Fashion', 'Architecture', 'Nursing', 'Sport Science', 'Film'],
    description: 'Located in the heart of one of the UK\u0027s most dynamic student cities, Manchester Met offers industry-connected courses and a diverse international community.',
    campusImage: '/images/alo/universities/campus-modern.webp',
    logo: '/images/partners/manchester metropolitan university.webp',
    featuredCourses: [
      { name: 'MBA', degree: 'MBA', tuition: '\u00a320,000' },
      { name: 'MSc Data Science', degree: 'Masters', tuition: '\u00a318,500' },
      { name: 'MA Architecture', degree: 'Masters', tuition: '\u00a317,000' },
    ],
  },
  'Aston University': {
    name: 'Aston University',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: 'Top 50',
    rankingSource: 'Complete Uni 2025',
    students: '15,000+',
    courses: '200+',
    tuitionRange: '\u00a318,000 \u2013 \u00a328,000',
    scholarships: '25+',
    accommodation: 'On-campus accommodation available for all first-year international students.',
    subjects: ['Business Administration', 'Engineering', 'Optometry', 'Pharmacy', 'Languages', 'Psychology'],
    description: 'Aston University is renowned for strong graduate employment rates, consistently ranking in the UK top 20 for employability.',
    campusImage: '/images/alo/universities/campus-library.webp',
    logo: '/images/partners/aston university.webp',
    featuredCourses: [
      { name: 'MSc Business Analytics', degree: 'Masters', tuition: '\u00a322,000' },
      { name: 'MSc Mechanical Engineering', degree: 'Masters', tuition: '\u00a324,000' },
      { name: 'MBA', degree: 'MBA', tuition: '\u00a326,000' },
    ],
  },
  'University of Kent': {
    name: 'University of Kent',
    city: 'Canterbury',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '347',
    rankingSource: 'QS 2025',
    students: '20,000+',
    courses: '300+',
    tuitionRange: '\u00a316,000 \u2013 \u00a328,000',
    scholarships: '8',
    accommodation: 'Guaranteed accommodation for international students in Canterbury. Weekly costs from \u00a395\u2013\u00a3180.',
    subjects: ['Business', 'Law', 'Computing', 'Psychology', 'Politics', 'History'],
    description: 'The University of Kent is a bellettable UK university with a stunning Canterbury campus, known for strong research output and a welcoming international community from over 150 countries.',
    campusImage: '/images/alo/universities/campus-modern.webp',
    logo: '/images/partners/university of kent.webp',
    featuredCourses: [
      { name: 'MSc International Business', degree: 'MBA', tuition: '\u00a318,500' },
      { name: 'LLM International Law', degree: 'Masters', tuition: '\u00a317,800' },
      { name: 'MSc Computer Science', degree: 'Masters', tuition: '\u00a319,200' },
    ],
  },
  'University of Portsmouth': {
    name: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '501',
    rankingSource: 'QS 2025',
    students: '28,000+',
    courses: '250+',
    tuitionRange: '\u00a315,000 \u2013 \u00a324,000',
    scholarships: '6',
    accommodation: 'Wide range of university-managed and private halls. Prices from \u00a390/week within walking distance of campus.',
    subjects: ['Engineering', 'Biology', 'Criminology', 'Data Science', 'Architecture', 'Nursing'],
    description: 'The University of Portsmouth is a modern, research-driven university located on the south coast of England. It is ranked among the top modern universities in the UK for student satisfaction and graduate prospects.',
    campusImage: '/images/alo/universities/campus-library.webp',
    logo: '/images/partners/university of portsmouth.webp',
    featuredCourses: [
      { name: 'MSc Data Analytics', degree: 'Masters', tuition: '\u00a316,200' },
      { name: 'MSc Mechanical Engineering', degree: 'Masters', tuition: '\u00a317,500' },
      { name: 'BSc Criminology & Criminal Justice', degree: 'Bachelors', tuition: '\u00a315,900' },
    ],
  },
  'University of Hertfordshire': {
    name: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'United Kingdom',
    flag: '\ud83c\uddec\ud83c\udde7',
    ranking: '601',
    rankingSource: 'QS 2025',
    students: '25,000+',
    courses: '200+',
    tuitionRange: '\u00a314,000 \u2013 \u00a322,000',
    scholarships: '5',
    accommodation: 'On-campus halls available for all new international students. Weekly costs from \u00a385\u2013\u00a3160.',
    subjects: ['Aerospace Engineering', 'Pharmacy', 'Animation', 'Computer Science', 'Business', 'Law'],
    description: 'The University of Hertfordshire is a forward-thinking university with a strong reputation for aerospace, pharmacy and creative arts. It boasts industry-standard facilities including a flight simulator and professional animation studios.',
    campusImage: '/images/alo/universities/manchester-campus.webp',
    logo: '/images/partners/university of hertfordshire.webp',
    featuredCourses: [
      { name: 'MSc Cyber Security', degree: 'Masters', tuition: '\u00a315,800' },
      { name: 'MPharm Pharmacy', degree: 'Masters', tuition: '\u00a318,400' },
      { name: 'BSc Aerospace Engineering', degree: 'Bachelors', tuition: '\u00a315,200' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UniversitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityData | null>(null);

  const handleQuickView = (uni: UniversityCardData) => {
    setSelectedUniversity(UNIVERSITY_DETAILS[uni.name] || null);
    setDrawerOpen(true);
  };

  return (
    <section
      ref={sectionRef}
      id="universities"
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="universities-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066CC]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0066CC]">
              <Building2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Featured Universities
            </span>
          </div>
          <h2
            id="universities-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Top Universities ALO Students Love
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            Hand-picked universities with high employability, generous scholarships and strong Bangladeshi student communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {UNIVERSITIES.map((uni, i) => (
            <motion.div
              key={uni.name}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <UniversityCard university={uni} onQuickView={() => handleQuickView(uni)} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a
            href="/universities"
            className="group inline-flex items-center gap-2 rounded-xl border border-alo-blue/20 bg-alo-blue-light px-6 py-3 text-sm font-bold text-alo-blue transition-all duration-200 hover:bg-alo-blue hover:scale-105 hover:text-white focus-ring"
          >
            View All Universities
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>

      <UniversityQuickView
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        university={selectedUniversity}
      />
    </section>
  );
}
