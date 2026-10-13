'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { CourseCard, CourseCardData } from '@/components/alo/cards/course-card';
import {
  UniversityCard,
  UniversityCardData,
} from '@/components/alo/cards/university-card';
import {
  ScholarshipCard,
  ScholarshipCardData,
} from '@/components/alo/cards/scholarship-card';
import {
  CourseQuickView,
  CourseData,
} from '@/components/alo/drawers/course-quick-view';
import {
  UniversityQuickView,
  UniversityData,
} from '@/components/alo/drawers/university-quick-view';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  MessageCircle,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Award,
  Languages,
  Globe,
  Briefcase,
  Clock,
  Users,
  Shield,
  CheckCircle,
  MapPin,
  Phone,
  Calculator,
  FileText,
  Plane,
  Fingerprint,
  Stethoscope,
  Heart,
  Bookmark,
  ChevronRight,
  Building2,
  Bus,
  ShoppingCart,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface UKCountryPageProps {
  onBack: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOCAL useCountUp HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useCountUp(
  end: number,
  duration: number = 2000,
  startOnView: boolean = true
) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  // Start animation whenInView triggers (derived state, no setState in effect)
  const shouldStart = startOnView ? isInView : true;

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;

    let startTime: number | null = null;
    let rafId: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [shouldStart, end, duration]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION HEADER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="mb-10 text-center sm:mb-12"
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
    >
      <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">
        {label}
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl">
        {title}
      </h2>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SAMPLE DATA — UNIVERSITIES
   ═══════════════════════════════════════════════════════════════════════════════ */

const UNIVERSITIES: UniversityCardData[] = [
  {
    name: 'University of Birmingham',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#84',
    courses: '350+',
    tuitionRange: '\u00A321K-\u00A335K',
    scholarships: '45+',
    subjects: ['Business', 'Engineering', 'Computer Science', 'Law', 'Medicine'],
    matchScore: 92,
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  {
    name: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#601',
    courses: '280+',
    tuitionRange: '\u00A316K-\u00A324K',
    scholarships: '30+',
    subjects: ['Business', 'Art & Design', 'Computing', 'Engineering'],
    matchScore: 88,
    image: '/images/alo/universities/manchester-campus.webp',
  },
  {
    name: 'Aston University',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#425',
    courses: '200+',
    tuitionRange: '\u00A318K-\u00A328K',
    scholarships: '25+',
    subjects: ['Business', 'Engineering', 'Optometry', 'Languages'],
    matchScore: 90,
    image: '/images/alo/universities/campus-modern.webp',
  },
  {
    name: 'University of Kent',
    city: 'Canterbury',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#376',
    courses: '250+',
    tuitionRange: '\u00A317K-\u00A326K',
    scholarships: '35+',
    subjects: ['Law', 'Computer Science', 'Business', 'Politics'],
    matchScore: 86,
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#501',
    courses: '220+',
    tuitionRange: '\u00A315K-\u00A323K',
    scholarships: '28+',
    subjects: ['Engineering', 'Business', 'Creative Arts', 'Science'],
    matchScore: 85,
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  {
    name: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#601',
    courses: '240+',
    tuitionRange: '\u00A315K-\u00A322K',
    scholarships: '20+',
    subjects: ['Computer Science', 'Business', 'Engineering', 'Pharmacy'],
    matchScore: 84,
    image: '/images/alo/universities/campus-modern.webp',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   SAMPLE DATA — COURSES
   ═══════════════════════════════════════════════════════════════════════════════ */

const COURSES: CourseCardData[] = [
  {
    name: 'MSc Data Science',
    university: 'University of Birmingham',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A328,000/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 Year',
    scholarship: true,
    matchScore: 94,
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MBA (Master of Business Administration)',
    university: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A322,000/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 Year',
    scholarship: true,
    matchScore: 91,
    image: '/images/alo/universities/manchester-campus.webp',
  },
  {
    name: 'MSc Computing',
    university: 'Aston University',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A324,500/yr',
    intake: 'Sep 2025',
    ielts: '6.0',
    duration: '1 Year',
    scholarship: true,
    matchScore: 89,
    image: '/images/alo/universities/campus-modern.webp',
  },
  {
    name: 'MSc International Business',
    university: 'University of Kent',
    city: 'Canterbury',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A321,000/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 Year',
    scholarship: true,
    matchScore: 87,
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  {
    name: 'MSc Data Analytics',
    university: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A319,500/yr',
    intake: 'Jan 2026',
    ielts: '6.0',
    duration: '1 Year',
    scholarship: false,
    matchScore: 86,
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MSc Cyber Security',
    university: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    tuition: '\u00A318,000/yr',
    intake: 'Sep 2025',
    ielts: '6.0',
    duration: '1 Year',
    scholarship: true,
    matchScore: 88,
    image: '/images/alo/universities/campus-modern.webp',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   SAMPLE DATA — SCHOLARSHIPS
   ═══════════════════════════════════════════════════════════════════════════════ */

const SCHOLARSHIPS: ScholarshipCardData[] = [
  {
    name: 'Global Excellence Scholarship',
    university: 'University of Birmingham',
    country: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    amount: '\u00A310,000',
    eligibility: ['Merit-based', 'Full-time'],
    deadline: '2025-06-30',
    degree: 'Masters',
    international: true,
    source: 'University',
  },
  {
    name: 'Aston Global Advantage Scholarship',
    university: 'Aston University',
    country: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    amount: '\u00A38,000',
    eligibility: ['Bangladeshi', 'PG'],
    deadline: '2025-07-15',
    degree: 'Masters',
    international: true,
    source: 'University',
  },
  {
    name: 'Chevening Scholarship',
    university: 'Any UK University',
    country: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    amount: 'Full Tuition',
    eligibility: ['Leadership', '2yr Exp'],
    deadline: '2025-11-05',
    degree: 'Masters',
    international: true,
    source: 'UK Government',
  },
  {
    name: 'Commonwealth Scholarship',
    university: 'Any UK University',
    country: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    amount: 'Full Tuition + Living',
    eligibility: ['Developing Country', 'Merit'],
    deadline: '2025-12-15',
    degree: 'Masters / PhD',
    international: true,
    source: 'Commonwealth',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DRAWER DATA — COURSE QUICK VIEW
   ═══════════════════════════════════════════════════════════════════════════════ */

const COURSE_DRAWER_DATA: CourseData[] = [
  {
    name: 'MSc Data Science',
    university: 'University of Birmingham',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MSc',
    duration: '1 Year',
    tuition: '\u00A328,000',
    tuitionPer: 'year',
    intake: 'Sep 2025',
    ieltsScore: '6.5 (no band below 6.0)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:1 or equivalent in a relevant subject',
    scholarship: 'Global Excellence Scholarship',
    scholarshipAmount: 'Up to \u00A310,000',
    scholarshipEligible: true,
    matchScore: 94,
    careerOutcomes: ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Researcher'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References'],
    description: 'Gain advanced skills in machine learning, data mining, and statistical modelling. This programme prepares you for high-demand data science roles across industries.',
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MBA (Master of Business Administration)',
    university: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MBA',
    duration: '1 Year',
    tuition: '\u00A322,000',
    tuitionPer: 'year',
    intake: 'Sep 2025',
    ieltsScore: '6.5 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 or equivalent + 2 years work experience',
    scholarship: 'Manchester MBA Scholarship',
    scholarshipAmount: 'Up to \u00A35,000',
    scholarshipEligible: true,
    matchScore: 91,
    careerOutcomes: ['Business Consultant', 'Operations Manager', 'Strategy Analyst', 'Entrepreneur'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'GMAT (optional)'],
    description: 'Develop strategic leadership and management capabilities with real-world business projects and industry connections in the heart of Manchester.',
    image: '/images/alo/universities/manchester-campus.webp',
  },
  {
    name: 'MSc Computing',
    university: 'Aston University',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MSc',
    duration: '1 Year',
    tuition: '\u00A324,500',
    tuitionPer: 'year',
    intake: 'Sep 2025',
    ieltsScore: '6.0 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 or equivalent in any subject (conversion course)',
    scholarship: 'Aston Global Advantage Scholarship',
    scholarshipAmount: 'Up to \u00A38,000',
    scholarshipEligible: true,
    matchScore: 89,
    careerOutcomes: ['Software Engineer', 'Full-Stack Developer', 'Systems Architect', 'IT Consultant'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'],
    description: 'A conversion course designed for graduates from non-computing backgrounds who want to transition into the tech industry. Covers programming, databases, AI, and software engineering.',
    image: '/images/alo/universities/campus-modern.webp',
  },
  {
    name: 'MSc International Business',
    university: 'University of Kent',
    city: 'Canterbury',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MSc',
    duration: '1 Year',
    tuition: '\u00A321,000',
    tuitionPer: 'year',
    intake: 'Sep 2025',
    ieltsScore: '6.5 (no band below 6.0)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 or equivalent in Business or related subject',
    scholarship: 'Kent International Scholarship',
    scholarshipAmount: 'Up to \u00A35,000',
    scholarshipEligible: true,
    matchScore: 87,
    careerOutcomes: ['International Business Manager', 'Trade Analyst', 'Global Operations', 'Management Consultant'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References'],
    description: 'Explore global business strategy, cross-cultural management, and international trade with a focus on real-world case studies and a global perspective.',
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  {
    name: 'MSc Data Analytics',
    university: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MSc',
    duration: '1 Year',
    tuition: '\u00A319,500',
    tuitionPer: 'year',
    intake: 'Jan 2026',
    ieltsScore: '6.0 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 or equivalent in a relevant subject',
    scholarship: 'Portsmouth Global Scholarship',
    scholarshipAmount: 'Up to \u00A33,000',
    scholarshipEligible: false,
    matchScore: 86,
    careerOutcomes: ['Data Analyst', 'Business Intelligence Analyst', 'Analytics Manager', 'Data Engineer'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'],
    description: 'Learn to transform raw data into actionable business insights using statistical analysis, machine learning, and data visualisation tools.',
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MSc Cyber Security',
    university: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    degree: 'MSc',
    duration: '1 Year',
    tuition: '\u00A318,000',
    tuitionPer: 'year',
    intake: 'Sep 2025',
    ieltsScore: '6.0 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 or equivalent in Computing, IT, or related field',
    scholarship: 'Hertfordshire International Scholarship',
    scholarshipAmount: 'Up to \u00A34,000',
    scholarshipEligible: true,
    matchScore: 88,
    careerOutcomes: ['Cyber Security Analyst', 'Penetration Tester', 'Security Consultant', 'SOC Analyst'],
    documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'],
    description: 'Develop expertise in network security, ethical hacking, digital forensics, and information security management with hands-on lab work.',
    image: '/images/alo/universities/campus-modern.webp',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DRAWER DATA — UNIVERSITY QUICK VIEW
   ═══════════════════════════════════════════════════════════════════════════════ */

const UNIVERSITY_DRAWER_DATA: UniversityData[] = [
  {
    name: 'University of Birmingham',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#84',
    rankingSource: 'QS 2025',
    students: '38,000+',
    courses: '350+',
    tuitionRange: '\u00A321,000 - \u00A335,000',
    scholarships: '45+',
    accommodation: 'From \u00A36,500/year for university halls. Private rentals available from \u00A3450/month in Selly Oak area near campus.',
    subjects: ['Business', 'Engineering', 'Computer Science', 'Law', 'Medicine', 'Education'],
    description: 'A prestigious Russell Group university founded in 1900, known for its research excellence and vibrant multicultural campus in the heart of Birmingham.',
    campusImage: '/images/alo/universities/uk-campus-01.webp',
    logo: '',
    featuredCourses: [
      { name: 'MSc Data Science', degree: 'MSc', tuition: '\u00A328,000/yr' },
      { name: 'MBA International Business', degree: 'MBA', tuition: '\u00A332,000/yr' },
      { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A326,000/yr' },
    ],
  },
  {
    name: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#601',
    rankingSource: 'QS 2025',
    students: '40,000+',
    courses: '280+',
    tuitionRange: '\u00A316,000 - \u00A324,000',
    scholarships: '30+',
    accommodation: 'From \u00A35,800/year for university accommodation. City centre living from \u00A3500/month.',
    subjects: ['Business', 'Art & Design', 'Computing', 'Engineering', 'Science'],
    description: 'One of the largest universities in the UK with a strong focus on employability, industry partnerships, and a vibrant student life in central Manchester.',
    campusImage: '/images/alo/universities/manchester-campus.webp',
    logo: '',
    featuredCourses: [
      { name: 'MBA', degree: 'MBA', tuition: '\u00A322,000/yr' },
      { name: 'MSc Digital Marketing', degree: 'MSc', tuition: '\u00A318,500/yr' },
      { name: 'MSc Artificial Intelligence', degree: 'MSc', tuition: '\u00A321,000/yr' },
    ],
  },
  {
    name: 'Aston University',
    city: 'Birmingham',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#425',
    rankingSource: 'QS 2025',
    students: '15,000+',
    courses: '200+',
    tuitionRange: '\u00A318,000 - \u00A328,000',
    scholarships: '25+',
    accommodation: 'From \u00A35,500/year. Located in the city centre with easy access to all amenities.',
    subjects: ['Business', 'Engineering', 'Optometry', 'Languages', 'Psychology'],
    description: 'A leading university renowned for its business school (triple-accredited), strong industry links, and high graduate employment rates.',
    campusImage: '/images/alo/universities/campus-modern.webp',
    logo: '',
    featuredCourses: [
      { name: 'MSc Computing', degree: 'MSc', tuition: '\u00A324,500/yr' },
      { name: 'MSc Business Analytics', degree: 'MSc', tuition: '\u00A323,000/yr' },
      { name: 'MBA', degree: 'MBA', tuition: '\u00A327,000/yr' },
    ],
  },
  {
    name: 'University of Kent',
    city: 'Canterbury',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#376',
    rankingSource: 'QS 2025',
    students: '20,000+',
    courses: '250+',
    tuitionRange: '\u00A317,000 - \u00A326,000',
    scholarships: '35+',
    accommodation: 'From \u00A35,200/year on the beautiful Canterbury campus. One of the most affordable university cities in the UK.',
    subjects: ['Law', 'Computer Science', 'Business', 'Politics', 'Biosciences'],
    description: 'A beloved campus university in the historic city of Canterbury, known for strong research, excellent teaching, and a warm community atmosphere.',
    campusImage: '/images/alo/universities/campus-library.webp',
    logo: '',
    featuredCourses: [
      { name: 'MSc International Business', degree: 'MSc', tuition: '\u00A321,000/yr' },
      { name: 'LLM International Law', degree: 'LLM', tuition: '\u00A319,500/yr' },
      { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A320,000/yr' },
    ],
  },
  {
    name: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#501',
    rankingSource: 'QS 2025',
    students: '28,000+',
    courses: '220+',
    tuitionRange: '\u00A315,000 - \u00A323,000',
    scholarships: '28+',
    accommodation: 'From \u00A34,800/year for halls. Private rentals from \u00A3400/month in the coastal city.',
    subjects: ['Engineering', 'Business', 'Creative Arts', 'Science', 'Law'],
    description: 'A modern university on the south coast of England, recognised for teaching excellence, strong industry partnerships, and high student satisfaction.',
    campusImage: '/images/alo/universities/uk-campus-01.webp',
    logo: '',
    featuredCourses: [
      { name: 'MSc Data Analytics', degree: 'MSc', tuition: '\u00A319,500/yr' },
      { name: 'MSc Mechanical Engineering', degree: 'MSc', tuition: '\u00A321,000/yr' },
      { name: 'MSc International Business', degree: 'MSc', tuition: '\u00A318,500/yr' },
    ],
  },
  {
    name: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    ranking: '#601',
    rankingSource: 'QS 2025',
    students: '25,000+',
    courses: '240+',
    tuitionRange: '\u00A315,000 - \u00A322,000',
    scholarships: '20+',
    accommodation: 'From \u00A34,500/year for on-campus halls. Very affordable cost of living near London.',
    subjects: ['Computer Science', 'Business', 'Engineering', 'Pharmacy', 'Creative Arts'],
    description: 'A career-focused university just 25 minutes from London, known for its strong computing and business programmes and excellent industry connections.',
    campusImage: '/images/alo/universities/campus-modern.webp',
    logo: '',
    featuredCourses: [
      { name: 'MSc Cyber Security', degree: 'MSc', tuition: '\u00A318,000/yr' },
      { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A317,500/yr' },
      { name: 'MBA', degree: 'MBA', tuition: '\u00A320,000/yr' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   WHY STUDY DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const WHY_STUDY_REASONS = [
  {
    title: 'World-Class Universities',
    shortDesc: '4 of the top 10 global universities',
    icon: Globe,
    color: 'blue' as const,
    details: [
      '4 UK universities rank in the global top 10 (QS 2025)',
      'The Russell Group represents 24 world-leading research universities',
      'UK degrees are recognised and respected in over 180 countries',
      'Strong emphasis on research-led teaching across all institutions',
    ],
  },
  {
    title: 'Post-Study Work Visa',
    shortDesc: '2-year Graduate Route visa available',
    icon: Briefcase,
    color: 'orange' as const,
    details: [
      '2-year post-study work visa for Masters graduates',
      '3-year visa for PhD graduates',
      'No sponsor required \u2014 work in any role at any skill level',
      'Pathway to skilled worker visa and permanent settlement',
    ],
  },
  {
    title: 'Shorter Duration',
    shortDesc: '1-year Masters vs 2 years elsewhere',
    icon: Clock,
    color: 'blue' as const,
    details: [
      'Most UK Masters programmes are only 1 year (full-time)',
      'Undergraduate degrees typically 3 years vs 4 elsewhere',
      'Save up to \u00A320,000-\u00A340,000 in tuition and living costs',
      'Enter the workforce a year earlier than peers from other countries',
    ],
  },
  {
    title: 'Scholarships Available',
    shortDesc: 'Merit, country-specific & university funds',
    icon: Award,
    color: 'orange' as const,
    details: [
      'Chevening Scholarship covers full tuition + living costs',
      'Commonwealth Scholarship for students from developing countries',
      'Most universities offer country-specific scholarships for Bangladesh',
      'ALO Education helps identify and apply for the best scholarships',
    ],
  },
  {
    title: 'Multicultural Experience',
    shortDesc: 'Students from 200+ countries',
    icon: Users,
    color: 'blue' as const,
    details: [
      'UK hosts over 500,000 international students annually',
      'Students from 200+ nationalities create a diverse campus culture',
      'Large Bangladeshi student communities in Birmingham, London, Manchester',
      'Multicultural cities with mosques, halal food, and community events',
    ],
  },
  {
    title: 'Quality Assurance',
    shortDesc: 'QAA & TEF rated, globally recognised',
    icon: Shield,
    color: 'orange' as const,
    details: [
      'Quality Assurance Agency (QAA) maintains rigorous academic standards',
      'Teaching Excellence Framework (TEF) rates university teaching quality',
      'Regular research assessments ensure cutting-edge curriculum',
      'Degree accreditation recognised by professional bodies worldwide',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   COST DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const COST_ITEMS = [
  { icon: GraduationCap, label: 'Tuition Fees', amount: '\u00A315,000 - \u00A335,000' },
  { icon: Building2, label: 'Accommodation', amount: '\u00A36,000 - \u00A312,000' },
  { icon: ShoppingCart, label: 'Food & Groceries', amount: '\u00A32,400 - \u00A33,600' },
  { icon: Bus, label: 'Transport', amount: '\u00A31,200 - \u00A31,800' },
  { icon: Stethoscope, label: 'Health Insurance (NHS)', amount: '\u00A3470 (IVH surcharge)' },
  { icon: FileText, label: 'Visa & Application', amount: '\u00A3500 - \u00A31,000' },
  { icon: BookOpen, label: 'Books & Materials', amount: '\u00A3300 - \u00A3600' },
  { icon: Heart, label: 'Personal Expenses', amount: '\u00A31,800 - \u00A33,000' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   VISA DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const VISA_REQUIREMENTS = [
  'Valid passport (at least 6 months validity)',
  'CAS (Confirmation of Acceptance for Studies) from UK university',
  'Proof of funds (tuition + \u00A31,023/month for London / \u00A3836/month outside London)',
  'IELTS UKVI score meeting course requirements',
  'TB test certificate from an approved clinic',
  'Academic transcripts and degree certificates',
];

const VISA_STEPS = [
  { num: 1, title: 'Get Offer Letter', desc: 'Receive an unconditional offer from a UK university' },
  { num: 2, title: 'Receive CAS', desc: 'University issues your CAS number (usually 2-3 months before start)' },
  { num: 3, title: 'Prepare Documents', desc: 'Gather passport, financial documents, IELTS UKVI, TB certificate' },
  { num: 4, title: 'Apply Online', desc: 'Complete the visa application on GOV.UK and pay the fee' },
  { num: 5, title: 'Biometrics Appointment', desc: 'Attend your appointment for fingerprints and photograph' },
  { num: 6, title: 'Receive Decision', desc: 'Get your visa decision in 3-6 weeks (standard processing)' },
  { num: 7, title: 'Travel to UK', desc: 'Collect your BRP and arrive in the UK before your course start date' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   INTAKE DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const INTAKES = [
  {
    name: 'September 2025',
    type: 'Primary',
    badgeColor: 'bg-alo-blue text-white',
    courses: 'All 15,000+ courses available',
    deadline: 'June \u2013 July 2025',
    prepStart: 'March 2025',
  },
  {
    name: 'January 2026',
    type: 'Secondary',
    badgeColor: 'bg-alo-orange text-white',
    courses: 'Limited courses (\u22485,000)',
    deadline: 'October \u2013 November 2025',
    prepStart: 'July 2025',
  },
  {
    name: 'May 2026',
    type: 'Summer',
    badgeColor: 'bg-alo-sunshine text-alo-black',
    courses: 'Very limited (\u22481,500)',
    deadline: 'February \u2013 March 2026',
    prepStart: 'December 2025',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const FAQS = [
  {
    q: 'What is the minimum IELTS score required for UK universities?',
    a: 'Most UK universities require an overall IELTS score of 6.0 to 7.0 for postgraduate programmes, with no individual band below 5.5 to 6.0. Some competitive programmes like Medicine or Law may require 7.0 or higher. Pre-sessional English courses are available if you need to improve your score before starting.',
  },
  {
    q: 'How much does it cost to study in the UK for Bangladeshi students?',
    a: 'The average annual cost for Bangladeshi students is approximately \u00A327,000-\u00A357,000, including tuition (\u00A315,000-\u00A335,000), accommodation (\u00A36,000-\u00A312,000), living expenses, and visa fees. Costs vary significantly by city \u2014 London and the South East are the most expensive, while cities in the North of England offer more affordable options.',
  },
  {
    q: 'Can I work while studying in the UK?',
    a: 'Yes, international students on a Student Visa can work up to 20 hours per week during term time and full-time during holidays. You cannot work as a professional sportsperson, entertainer, or self-employed. After graduation, the Graduate Route visa allows you to work full-time for 2 years (3 years for PhD graduates) in any role.',
  },
  {
    q: 'What is the post-study work visa (Graduate Route)?',
    a: 'The Graduate Route is a post-study work visa that allows international students who have successfully completed a degree at undergraduate level or above to stay in the UK for 2 years (3 years for PhD graduates). You can work flexibly, look for employment, and switch to a Skilled Worker visa when you find a suitable job. No employer sponsorship is needed during the Graduate Route period.',
  },
  {
    q: 'How long does the UK student visa process take?',
    a: 'Standard UK student visa processing takes 3-6 weeks from the date of your biometrics appointment. You can opt for priority processing (\u00A3500 extra) for a decision in about 5 working days, or super-priority (\u00A3800 extra) for next-day decisions. It is recommended to apply at least 3 months before your course start date.',
  },
  {
    q: 'Are there scholarships for Bangladeshi students?',
    a: 'Yes, several scholarships are available for Bangladeshi students including the Chevening Scholarship (full tuition + living costs), Commonwealth Scholarship, and university-specific scholarships like the Global Excellence Scholarship at Birmingham. ALO Education helps identify the best scholarships based on your academic profile and assists with the application process.',
  },
  {
    q: 'What documents do I need for a UK student visa?',
    a: 'You need a valid passport, CAS from your university, proof of financial support (bank statements showing tuition fees + living costs for up to 9 months), IELTS UKVI test results, TB test certificate, academic transcripts, and degree certificates. Additional documents may include a personal statement and ATAS certificate for certain sensitive courses.',
  },
  {
    q: 'Can I stay in the UK after graduation?',
    a: 'Yes, the Graduate Route visa allows you to stay and work in the UK for 2 years after completing a Masters degree (3 years for PhD). During this time you can build your career, gain UK work experience, and switch to a Skilled Worker visa if you find a job that meets the salary and skill requirements. This can eventually lead to Indefinite Leave to Remain (ILR) and British citizenship.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   RELATED COUNTRIES
   ═══════════════════════════════════════════════════════════════════════════════ */

const RELATED_COUNTRIES = [
  { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', stat: '150+ Universities', image: '/images/cards/usa.png' },
  { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', stat: '100+ Universities', image: '/images/cards/canada.png' },
  { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', stat: '45+ Universities', image: '/images/cards/australia.png' },
  { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', stat: '30+ Universities', image: '/images/cards/ireland.png' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export function UKCountryPage({ onBack }: UKCountryPageProps) {
  /* ── Drawer State ────────────────────────────────────────────────────────── */
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [uniDrawerOpen, setUniDrawerOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<UniversityData | null>(null);
  const [expandedReason, setExpandedReason] = useState<number | null>(null);

  const handleCourseClick = useCallback((index: number) => {
    setSelectedCourse(COURSE_DRAWER_DATA[index]);
    setCourseDrawerOpen(true);
  }, []);

  const handleUniClick = useCallback((index: number) => {
    setSelectedUni(UNIVERSITY_DRAWER_DATA[index]);
    setUniDrawerOpen(true);
  }, []);

  const handleScholarshipClick = useCallback(() => {
    // Placeholder for scholarship action
  }, []);

  /* ── CountUp hooks for Section 02 ───────────────────────────────────────── */
  const count500 = useCountUp(500, 2000);
  const count15k = useCountUp(15000, 2500);

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════════ */
  return (
    <>
    <div className="min-h-screen-flex">
      {/* SECTION 01 - HERO */}
      <section
        className="relative flex min-h-[70vh] items-center justify-center overflow-hidden sm:min-h-[80vh] lg:min-h-[85vh]"
        aria-labelledby="uk-hero-heading"
      >
          {/* Background Image */}
          <Image
            src="/images/alo/countries/uk-landscape.webp"
            alt="London cityscape"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

          {/* Back Button */}
          <motion.button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-ring sm:top-6 sm:left-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </motion.button>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="mb-6 border-0 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {'\u{1F1EC}\u{1F1E7}'} #1 Study Destination for Bangladeshi Students
              </Badge>
            </motion.div>

            <motion.h1
              id="uk-hero-heading"
              className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Study in the United Kingdom
            </motion.h1>

            <motion.p
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              World-class universities, globally recognized degrees, and post-study
              work opportunities. Find the right university, course and pathway for
              your future.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button
                size="lg"
                className="h-12 gap-2 rounded-xl bg-alo-orange px-8 text-base font-bold text-white hover:bg-alo-orange-dark"
              >
                <Search className="h-5 w-5" />
                Find My Course
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-xl border-white/40 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <MessageCircle className="h-5 w-5" />
                Talk to an Expert
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {[
                '500+ Partner Universities',
                '2-Year Post-Study Visa',
                '\u00A315K-35K Average Tuition',
                'IELTS 6.0+ Required',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs font-medium text-white/70 sm:text-sm"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-alo-orange" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <main>
          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 02 — QUICK COUNTRY INTELLIGENCE
             ═══════════════════════════════════════════════════════════════════ */}
          <QuickCountryIntelligence count500={count500} count15k={count15k} />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 03 — WHY STUDY IN THE UK
             ═══════════════════════════════════════════════════════════════════ */}
          <WhyStudySection expandedReason={expandedReason} setExpandedReason={setExpandedReason} />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 04 — TOP UK UNIVERSITIES
             ═══════════════════════════════════════════════════════════════════ */}
          <TopUniversitiesSection onUniClick={handleUniClick} />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 05 — POPULAR COURSES
             ═══════════════════════════════════════════════════════════════════ */}
          <PopularCoursesSection onCourseClick={handleCourseClick} />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 06 — UK SCHOLARSHIPS
             ═══════════════════════════════════════════════════════════════════ */}
          <ScholarshipsSection onScholarshipClick={handleScholarshipClick} />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 07 — COST OF STUDYING
             ═══════════════════════════════════════════════════════════════════ */}
          <CostSection />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 08 — UK STUDENT VISA
             ═══════════════════════════════════════════════════════════════════ */}
          <VisaSection />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 09 — UK INTAKES
             ═══════════════════════════════════════════════════════════════════ */}
          <IntakesSection />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 10 — UK FAQ
             ═══════════════════════════════════════════════════════════════════ */}
          <FAQSection />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 11 — RELATED COUNTRIES
             ═══════════════════════════════════════════════════════════════════ */}
          <RelatedCountriesSection />

          {/* ═══════════════════════════════════════════════════════════════════
             SECTION 12 — CTA
             ═══════════════════════════════════════════════════════════════════ */}
          <CTASection />
        </main>
      </div>
      <CourseQuickView
        open={courseDrawerOpen}
        onOpenChange={setCourseDrawerOpen}
        course={selectedCourse}
      />
      <UniversityQuickView
        open={uniDrawerOpen}
        onOpenChange={setUniDrawerOpen}
        university={selectedUni}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 02 — QUICK COUNTRY INTELLIGENCE
   ═══════════════════════════════════════════════════════════════════════════════ */

function QuickCountryIntelligence({
  count500,
  count15k,
}: {
  count500: { count: number; ref: React.RefObject<HTMLSpanElement | null> };
  count15k: { count: number; ref: React.RefObject<HTMLSpanElement | null> };
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  const cards = [
    { icon: GraduationCap, label: 'Universities', value: '500+', countRef: count500.ref, countVal: count500.count, suffix: '+' },
    { icon: BookOpen, label: 'Courses', value: '15,000+', countRef: count15k.ref, countVal: count15k.count, suffix: '+', format: true },
    { icon: DollarSign, label: 'Average Tuition', value: '\u00A315,000-35,000/yr' },
    { icon: Calendar, label: 'Popular Intakes', value: 'Sep 2025, Jan 2026' },
    { icon: Award, label: 'Scholarships', value: '\u00A35,000-20,000' },
    { icon: Languages, label: 'English Requirement', value: 'IELTS 6.0-7.0' },
  ];

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-label="Quick country intelligence"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {cards.map((card) => (
            <motion.div
              key={card.label}
              variants={cardVariants}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-alo-gray-medium/60 bg-alo-white p-4 text-center shadow-sm sm:p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-alo-blue-light">
                <card.icon className="h-5 w-5 text-alo-blue" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-alo-gray">
                {card.label}
              </p>
              {card.countRef ? (
                <span ref={card.countRef} className="text-lg font-extrabold text-alo-black sm:text-xl">
                  {card.format ? card.countVal.toLocaleString() : card.countVal}{card.suffix}
                </span>
              ) : (
                <span className="text-lg font-extrabold text-alo-black sm:text-xl">
                  {card.value}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 03 — WHY STUDY IN THE UK
   ═══════════════════════════════════════════════════════════════════════════════ */

function WhyStudySection({
  expandedReason,
  setExpandedReason,
}: {
  expandedReason: number | null;
  setExpandedReason: (i: number | null) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="why-study-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label="WHY STUDY IN THE UK" title="6 Reasons to Choose UK for Your Degree" />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {WHY_STUDY_REASONS.map((reason, idx) => {
            const isExpanded = expandedReason === idx;
            return (
              <motion.button
                type="button"
                key={reason.title}
                variants={cardVariants}
                onClick={() =>
                  setExpandedReason(isExpanded ? null : idx)
                }
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-alo-white p-5 text-left transition-all duration-300 focus-ring ${
                  isExpanded
                    ? 'border-alo-blue/30 shadow-lg ring-1 ring-alo-blue/10'
                    : 'border-alo-gray-medium/60 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      reason.color === 'blue'
                        ? 'bg-alo-blue-light'
                        : 'bg-alo-orange-light'
                    }`}
                  >
                    <reason.icon
                      className={`h-5 w-5 ${
                        reason.color === 'blue'
                          ? 'text-alo-blue'
                          : 'text-alo-orange'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-alo-black sm:text-base">
                      {reason.title}
                    </h3>
                    <p className="mt-1 text-xs text-alo-gray sm:text-sm">
                      {reason.shortDesc}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <Separator className="my-3" />
                      <ul className="space-y-2">
                        {reason.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex items-start gap-2 text-xs leading-relaxed text-alo-gray sm:text-sm"
                          >
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alo-blue" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 04 — TOP UK UNIVERSITIES
   ═══════════════════════════════════════════════════════════════════════════════ */

function TopUniversitiesSection({
  onUniClick,
}: {
  onUniClick: (index: number) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="top-unis-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="TOP UK UNIVERSITIES"
          title="Featured UK Universities"
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {UNIVERSITIES.map((uni, idx) => (
            <motion.div key={uni.name} variants={cardVariants}>
              <UniversityCard
                university={uni}
                onQuickView={() => onUniClick(idx)}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            variant="outline"
            className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light"
          >
            View All UK Universities
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 05 — POPULAR COURSES
   ═══════════════════════════════════════════════════════════════════════════════ */

function PopularCoursesSection({
  onCourseClick,
}: {
  onCourseClick: (index: number) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="popular-courses-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="POPULAR COURSES"
          title="Top Courses for Bangladeshi Students in the UK"
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {COURSES.map((course, idx) => (
            <motion.div key={course.name} variants={cardVariants}>
              <CourseCard
                course={course}
                onQuickView={() => onCourseClick(idx)}
                onSave={() => {}}
                onCompare={() => {}}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            variant="outline"
            className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light"
          >
            Browse All UK Courses
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 06 — UK SCHOLARSHIPS
   ═══════════════════════════════════════════════════════════════════════════════ */

function ScholarshipsSection({
  onScholarshipClick,
}: {
  onScholarshipClick: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="scholarships-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="SCHOLARSHIPS IN THE UK"
          title="Financial Support for Bangladeshi Students"
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {SCHOLARSHIPS.map((sch) => (
            <motion.div key={sch.name} variants={cardVariants}>
              <ScholarshipCard
                scholarship={sch}
                onCheckEligibility={onScholarshipClick}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            variant="outline"
            className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light"
          >
            Browse All UK Scholarships
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 07 — COST OF STUDYING
   ═══════════════════════════════════════════════════════════════════════════════ */

function CostSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="cost-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="COST OF LIVING"
          title="Estimated Annual Budget for UK Students"
        />

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {/* Cost categories — left 2 cols on desktop */}
          <motion.div
            className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm lg:col-span-2 sm:p-6"
            variants={cardVariants}
          >
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-alo-gray">
              Cost Breakdown
            </h3>
            <div className="space-y-0">
              {COST_ITEMS.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 py-3.5 ${
                    idx < COST_ITEMS.length - 1
                      ? 'border-b border-alo-gray-medium/40'
                      : ''
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-alo-gray-light">
                    <item.icon className="h-4.5 w-4.5 text-alo-blue" />
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-alo-black">
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Summary card — right col on desktop */}
          <motion.div
            className="flex flex-col items-center justify-center rounded-xl gradient-blue p-6 text-center text-white shadow-lg sm:p-8"
            variants={cardVariants}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Calculator className="h-7 w-7" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              Estimated Annual Budget
            </p>
            <p className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
              {'\u00A3'}27,670 - {'\u00A3'}57,470
            </p>
            <p className="mt-2 text-sm text-white/70">
              Varies by city and lifestyle
            </p>
            <Button className="mt-6 gap-2 bg-alo-orange px-6 font-bold text-white hover:bg-alo-orange-dark">
              <Calculator className="h-4 w-4" />
              Calculate My Budget
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 08 — UK STUDENT VISA
   ═══════════════════════════════════════════════════════════════════════════════ */

function VisaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="visa-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="VISA INFORMATION"
          title="UK Student Visa for Bangladeshi Students"
        />

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {/* Left — Visa Requirements */}
          <motion.div
            className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6"
            variants={cardVariants}
          >
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-alo-black">
              <FileText className="h-5 w-5 text-alo-blue" />
              Visa Requirements
            </h3>
            <ul className="space-y-3.5">
              {VISA_REQUIREMENTS.map((req) => (
                <li
                  key={req}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                  {req}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Visa Process Timeline */}
          <motion.div
            className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6"
            variants={cardVariants}
          >
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-alo-black">
              <Plane className="h-5 w-5 text-alo-blue" />
              Visa Process Timeline
            </h3>
            <div className="relative space-y-0">
              {VISA_STEPS.map((step, idx) => (
                <div key={step.num} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Vertical line */}
                  {idx < VISA_STEPS.length - 1 && (
                    <div className="absolute top-9 left-[18px] h-[calc(100%-20px)] w-0.5 bg-alo-gray-medium" />
                  )}
                  {/* Number circle */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-alo-blue text-sm font-bold text-white">
                    {step.num}
                  </div>
                  {/* Content */}
                  <div className="pt-0.5">
                    <p className="text-sm font-bold text-alo-black">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-alo-gray">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 09 — UK INTAKES
   ═══════════════════════════════════════════════════════════════════════════════ */

function IntakesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="intakes-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="INTAKE DATES"
          title="UK University Intake Deadlines"
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {INTAKES.map((intake) => (
            <motion.div
              key={intake.name}
              variants={cardVariants}
              className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-lg font-bold text-alo-black sm:text-xl">
                  {intake.name}
                </h3>
              </div>
              <Badge className={`mb-4 border-0 text-xs font-semibold ${intake.badgeColor}`}>
                {intake.type}
              </Badge>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                  <div>
                    <p className="font-medium text-alo-gray">Available Courses</p>
                    <p className="font-semibold text-foreground">
                      {intake.courses}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-alo-orange" />
                  <div>
                    <p className="font-medium text-alo-gray">
                      Application Deadline
                    </p>
                    <p className="font-semibold text-foreground">
                      {intake.deadline}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                  <div>
                    <p className="font-medium text-alo-gray">
                      Start Preparation By
                    </p>
                    <p className="font-semibold text-foreground">
                      {intake.prepStart}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 10 — UK FAQ
   ═══════════════════════════════════════════════════════════════════════════════ */

function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="FAQ"
          title="Frequently Asked Questions About Studying in the UK"
        />

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, idx) => (
              <motion.div key={idx} variants={cardVariants}>
                <AccordionItem
                  value={`faq-${idx}`}
                  className="mb-2 rounded-xl border border-alo-gray-medium/60 bg-alo-white px-1 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-4 text-left text-sm font-semibold text-foreground hover:no-underline sm:px-5 sm:text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-alo-gray sm:px-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 11 — RELATED COUNTRIES
   ═══════════════════════════════════════════════════════════════════════════════ */

function RelatedCountriesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-alo-white py-16 sm:py-20"
      aria-labelledby="related-countries-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="EXPLORE MORE"
          title="Other Popular Study Destinations"
        />

        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {RELATED_COUNTRIES.map((country) => (
            <motion.article
              key={country.name}
              variants={cardVariants}
              className="group relative cursor-pointer overflow-hidden rounded-xl"
              whileHover={{ y: -4 }}
              tabIndex={0}
              role="link"
              aria-label={`Study in ${country.name}`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={country.image}
                  alt={`${country.name} study destination`}
                  fill
                  className="img-zoom object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-colors duration-300 group-hover:from-black/55" />
                <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4">
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">
                    {country.flag}
                  </span>
                  <h3 className="mt-1.5 text-sm font-bold leading-tight text-white sm:text-base">
                    {country.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/75">{country.stat}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION 12 — CTA
   ═════════════════════════════════════════════════════════════════════════════ */

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden gradient-blue py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
        >
          <h2
            id="cta-heading"
            className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl"
          >
            Ready to Study in the UK?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Get personalized guidance from our expert UK counsellors. Free
            consultation, no obligations.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-xl bg-alo-orange px-8 text-base font-bold text-white hover:bg-alo-orange-dark"
            >
              <Search className="h-5 w-5" />
              Find UK Courses
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/40 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Phone className="h-5 w-5" />
              Talk to UK Expert
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
