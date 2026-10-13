'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { CourseCard, type CourseCardData } from '@/components/alo/cards/course-card';
import { CourseQuickView, type CourseData } from '@/components/alo/drawers/course-quick-view';

/* ------------------------------------------------------------------ */
/*  Sample Data                                                        */
/* ------------------------------------------------------------------ */

const COURSES: CourseCardData[] = [
  {
    name: 'MSc Data Science',
    university: 'University of Birmingham',
    city: 'Birmingham',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£27,000/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 year',
    scholarship: true,
    matchScore: 92,
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  {
    name: 'MBA International Business',
    university: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£20,000/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 year',
    scholarship: true,
    matchScore: 87,
    image: '/images/alo/universities/campus-modern.webp',
  },
  {
    name: 'MSc Computer Science',
    university: 'Aston University',
    city: 'Birmingham',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£22,000/yr',
    intake: 'Sep 2025',
    ielts: '6.0',
    duration: '1 year',
    scholarship: false,
    matchScore: 85,
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MSc International Business',
    university: 'University of Kent',
    city: 'Canterbury',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£18,500/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 year',
    scholarship: true,
    matchScore: 93,
    image: '/images/alo/universities/campus-modern.webp',
  },
  {
    name: 'MSc Data Analytics',
    university: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£16,200/yr',
    intake: 'Jan 2026',
    ielts: '6.0',
    duration: '1 year',
    scholarship: true,
    matchScore: 88,
    image: '/images/alo/universities/campus-library.webp',
  },
  {
    name: 'MSc Cyber Security',
    university: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'UK',
    flag: '🇬🇧',
    tuition: '£15,800/yr',
    intake: 'Sep 2025',
    ielts: '6.5',
    duration: '1 year',
    scholarship: true,
    matchScore: 91,
    image: '/images/alo/universities/manchester-campus.webp',
  },
];

const COURSE_DETAILS: Record<string, CourseData> = {
  'MSc Data Science': {
    name: 'MSc Data Science',
    university: 'University of Birmingham',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'Masters (MSc)',
    duration: '1 Year Full-Time',
    tuition: '£27,000',
    tuitionPer: 'year',
    intake: 'September 2025',
    ieltsScore: '6.5 (no band below 6.0)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:1 honours degree in a relevant subject (Computing, Maths, Engineering, or Science)',
    scholarship: 'Global Masters Scholarship',
    scholarshipAmount: '£5,000',
    scholarshipEligible: true,
    matchScore: 92,
    careerOutcomes: ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Researcher', 'Business Analyst'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy'],
    description: 'This accredited MSc Data Science programme equips you with the technical skills and theoretical knowledge to extract insights from complex data. You will work on real-world datasets and projects with industry partners, preparing you for high-demand roles in data science and AI.',
    image: '/images/alo/universities/uk-campus-01.webp',
  },
  'MBA International Business': {
    name: 'MBA International Business',
    university: 'Manchester Metropolitan University',
    city: 'Manchester',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'MBA',
    duration: '1 Year Full-Time',
    tuition: '£20,000',
    tuitionPer: 'year',
    intake: 'September 2025',
    ieltsScore: '6.5 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 honours degree + minimum 2 years professional work experience',
    scholarship: 'Business School Excellence Award',
    scholarshipAmount: '£3,000',
    scholarshipEligible: true,
    matchScore: 87,
    careerOutcomes: ['Business Consultant', 'Operations Manager', 'Strategy Analyst', 'International Business Director', 'Project Manager'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy', 'Work Experience Letter'],
    description: 'The MBA International Business at Manchester Met is AMBA-accredited and designed for ambitious professionals looking to lead in global markets. The programme combines rigorous academic theory with practical consultancy projects.',
    image: '/images/alo/universities/campus-modern.webp',
  },
  'MSc Computer Science': {
    name: 'MSc Computer Science',
    university: 'Aston University',
    city: 'Birmingham',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'Masters (MSc)',
    duration: '1 Year Full-Time',
    tuition: '£22,000',
    tuitionPer: 'year',
    intake: 'September 2025',
    ieltsScore: '6.0 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 honours degree in any discipline (some modules require programming experience)',
    scholarship: 'Aston Global Scholarship',
    scholarshipAmount: '£4,000',
    scholarshipEligible: false,
    matchScore: 85,
    careerOutcomes: ['Software Engineer', 'Full-Stack Developer', 'DevOps Engineer', 'Systems Architect', 'Technical Lead'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy'],
    description: 'Aston\'s MSc Computer Science is ideal for graduates looking to pivot into tech or deepen their software engineering expertise. The programme offers specialist pathways in AI, Cyber Security and Software Engineering.',
    image: '/images/alo/universities/campus-library.webp',
  },
  'MSc International Business': {
    name: 'MSc International Business',
    university: 'University of Kent',
    city: 'Canterbury',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'MBA',
    duration: '1 Year Full-Time',
    tuition: '£18,500',
    tuitionPer: 'year',
    intake: 'September 2025',
    ieltsScore: '6.5 (no band below 6.0)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:1 honours degree in Business, Management or a related discipline',
    scholarship: 'Kent Scholarship for International Students',
    scholarshipAmount: '£3,000',
    scholarshipEligible: true,
    matchScore: 93,
    careerOutcomes: ['Business Consultant', 'International Manager', 'Supply Chain Manager', 'Export Manager', 'Trade Analyst'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy'],
    description: 'Kent\'s MSc International Business prepares you for leadership in global markets. With a focus on cross-cultural management, international strategy, and emerging markets, this programme is ideal for aspiring global business professionals.',
    image: '/images/alo/universities/campus-modern.webp',
  },
  'MSc Data Analytics': {
    name: 'MSc Data Analytics',
    university: 'University of Portsmouth',
    city: 'Portsmouth',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'Masters (MSc)',
    duration: '1 Year Full-Time',
    tuition: '£16,200',
    tuitionPer: 'year',
    intake: 'January 2026',
    ieltsScore: '6.0 (no band below 5.5)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 honours degree in a STEM or quantitative discipline',
    scholarship: 'Portsmouth Global Excellence Award',
    scholarshipAmount: '£2,000',
    scholarshipEligible: true,
    matchScore: 88,
    careerOutcomes: ['Data Analyst', 'Business Intelligence Analyst', 'Data Engineer', 'Analytics Manager', 'Insights Consultant'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy'],
    description: 'The MSc Data Analytics at Portsmouth equips you with practical skills in data mining, statistical modelling and visualisation. You will work on real-world data projects with industry partners, gaining experience that directly translates to the workplace.',
    image: '/images/alo/universities/campus-library.webp',
  },
  'MSc Cyber Security': {
    name: 'MSc Cyber Security',
    university: 'University of Hertfordshire',
    city: 'Hatfield',
    country: 'United Kingdom',
    flag: '🇬🇧',
    degree: 'Masters (MSc)',
    duration: '1 Year Full-Time',
    tuition: '£15,800',
    tuitionPer: 'year',
    intake: 'September 2025',
    ieltsScore: '6.5 (no band below 6.0)',
    ieltsType: 'IELTS Academic',
    academicReq: '2:2 honours degree in Computing, IT or a related technical discipline',
    scholarship: 'Hertfordshire Merit Scholarship',
    scholarshipAmount: '£2,500',
    scholarshipEligible: true,
    matchScore: 91,
    careerOutcomes: ['Security Analyst', 'Penetration Tester', 'Cyber Security Consultant', 'SOC Analyst', 'Incident Responder'],
    documents: ['Academic Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References', 'Passport Copy'],
    description: 'Hertfordshire\'s MSc Cyber Security is designed to address the global shortage of cybersecurity professionals. The programme covers ethical hacking, digital forensics, network security and risk management, with hands-on lab work in dedicated security labs.',
    image: '/images/alo/universities/manchester-campus.webp',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CoursesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  const handleQuickView = (course: CourseCardData) => {
    setSelectedCourse(COURSE_DETAILS[course.name] || null);
    setDrawerOpen(true);
  };

  return (
    <section
      ref={sectionRef}
      id="courses"
      className="w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="courses-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mb-3 inline-flex items-center justify-center rounded-full border border-orange-200/50 bg-orange-50 p-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#F37021]" />
          </span>
          <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">
            Featured Courses
          </span>
          <h2
            id="courses-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Popular Courses Among Bangladeshi Students
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            High-demand courses with excellent graduate outcomes and scholarship opportunities.
          </p>
        </motion.div>

        {/* ── Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course, i) => (
            <motion.div
              key={course.name}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <CourseCard
                course={course}
                onQuickView={() => handleQuickView(course)}
                onSave={() => console.log('Save course:', course.name)}
                onCompare={() => console.log('Compare course:', course.name)}
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
            href="/courses"
            className="group inline-flex items-center gap-2 rounded-xl border border-alo-blue/20 bg-alo-blue-light px-6 py-3 text-sm font-bold text-alo-blue transition-all duration-200 hover:bg-alo-blue hover:text-white focus-ring"
          >
            Browse All Courses
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>

      {/* ── Course Quick View Drawer ──────────────────────────── */}
      <CourseQuickView
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        course={selectedCourse}
      />
    </section>
  );
}
