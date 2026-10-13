// ═══════════════════════════════════════════════════════════════════════════════
// ALO Education — Country Page Configuration System
// Data-driven country pages: UK, USA, Canada, Australia
// ═══════════════════════════════════════════════════════════════════════════════

import type { CourseCardData } from '@/components/alo/cards/course-card';
import type { UniversityCardData } from '@/components/alo/cards/university-card';
import type { ScholarshipCardData } from '@/components/alo/cards/scholarship-card';
import type { CourseData } from '@/components/alo/drawers/course-quick-view';
import type { UniversityData } from '@/components/alo/drawers/university-quick-view';

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

type LucideIcon = 'Globe' | 'Briefcase' | 'Clock' | 'Award' | 'Users' | 'Shield' | 'GraduationCap' | 'BookOpen' | 'DollarSign' | 'Calendar' | 'Languages' | 'Heart' | 'Fingerprint' | 'Stethoscope' | 'Building2' | 'Bus' | 'ShoppingCart' | 'FileText' | 'Calculator';
type IconColor = 'blue' | 'orange';

export interface IntelligenceCard {
  icon: LucideIcon;
  label: string;
  value: string;
  countUp?: { end: number; format?: boolean };
}

export interface WhyStudyReason {
  title: string;
  shortDesc: string;
  icon: LucideIcon;
  color: IconColor;
  details: string[];
}

export interface CostItem {
  icon: LucideIcon;
  label: string;
  amount: string;
}

export interface VisaStep {
  num: number;
  title: string;
  desc: string;
}

export interface IntakeData {
  name: string;
  type: string;
  badgeColor: string;
  courses: string;
  deadline: string;
  prepStart: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface RelatedCountry {
  name: string;
  flag: string;
  stat: string;
  image: string;
}

export interface CountryPageConfig {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  heroImage: string;

  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustIndicators: string[];
  };

  intelligence: {
    label: string;
    title: string;
    cards: IntelligenceCard[];
  };

  whyStudy: {
    label: string;
    title: string;
    reasons: WhyStudyReason[];
  };

  universities: {
    label: string;
    title: string;
    button: string;
    data: UniversityCardData[];
    drawerData: UniversityData[];
  };

  courses: {
    label: string;
    title: string;
    button: string;
    data: CourseCardData[];
    drawerData: CourseData[];
  };

  scholarships: {
    label: string;
    title: string;
    button: string;
    data: ScholarshipCardData[];
  };

  cost: {
    label: string;
    title: string;
    items: CostItem[];
    summaryLow: string;
    summaryHigh: string;
    currency: string;
  };

  visa: {
    label: string;
    title: string;
    requirements: string[];
    steps: VisaStep[];
  };

  intakes: {
    label: string;
    title: string;
    data: IntakeData[];
  };

  faq: {
    label: string;
    title: string;
    items: FAQItem[];
  };

  relatedCountries: RelatedCountry[];

  cta: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED IMAGE POOL
   ═══════════════════════════════════════════════════════════════════════════════ */
const IMG = {
  campus1: '/images/alo/universities/uk-campus-01.webp',
  campus2: '/images/alo/universities/campus-library.webp',
  campus3: '/images/alo/universities/campus-modern.webp',
  campus4: '/images/alo/universities/manchester-campus.webp',
};

/* ═══════════════════════════════════════════════════════════════════════════════
   UK CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const UK: CountryPageConfig = {
  slug: 'uk',
  name: 'United Kingdom',
  shortName: 'UK',
  flag: '\u{1F1EC}\u{1F1E7}',
  heroImage: '/images/alo/countries/uk-landscape.webp',
  hero: {
    badge: '\u{1F1EC}\u{1F1E7} #1 Study Destination for Bangladeshi Students',
    title: 'Study in the United Kingdom',
    subtitle: 'World-class universities, globally recognized degrees, and post-study work opportunities. Find the right university, course and pathway for your future.',
    ctaPrimary: 'Find My Course',
    ctaSecondary: 'Talk to an Expert',
    trustIndicators: ['500+ Partner Universities', '2-Year Post-Study Visa', '\u00A315K-35K Average Tuition', 'IELTS 6.0+ Required'],
  },
  intelligence: {
    label: 'COUNTRY INTELLIGENCE',
    title: 'The UK at a Glance',
    cards: [
      { icon: 'GraduationCap', label: 'Universities', value: '500+', countUp: { end: 500 } },
      { icon: 'BookOpen', label: 'Courses', value: '15,000+', countUp: { end: 15000, format: true } },
      { icon: 'DollarSign', label: 'Average Tuition', value: '\u00A315,000-35,000/yr' },
      { icon: 'Calendar', label: 'Popular Intakes', value: 'Sep 2025, Jan 2026' },
      { icon: 'Award', label: 'Scholarships', value: '\u00A35,000-20,000' },
      { icon: 'Languages', label: 'English Requirement', value: 'IELTS 6.0-7.0' },
    ],
  },
  whyStudy: {
    label: 'WHY STUDY IN THE UK',
    title: '6 Reasons to Choose UK for Your Degree',
    reasons: [
      { title: 'World-Class Universities', shortDesc: '4 of the top 10 global universities', icon: 'Globe', color: 'blue', details: ['4 UK universities rank in the global top 10 (QS 2025)', 'The Russell Group represents 24 world-leading research universities', 'UK degrees are recognised and respected in over 180 countries', 'Strong emphasis on research-led teaching across all institutions'] },
      { title: 'Post-Study Work Visa', shortDesc: '2-year Graduate Route visa available', icon: 'Briefcase', color: 'orange', details: ['2-year post-study work visa for Masters graduates', '3-year visa for PhD graduates', 'No sponsor required \u2014 work in any role at any skill level', 'Pathway to skilled worker visa and permanent settlement'] },
      { title: 'Shorter Duration', shortDesc: '1-year Masters vs 2 years elsewhere', icon: 'Clock', color: 'blue', details: ['Most UK Masters programmes are only 1 year (full-time)', 'Undergraduate degrees typically 3 years vs 4 elsewhere', 'Save up to \u00A320,000-\u00A340,000 in tuition and living costs', 'Enter the workforce a year earlier than peers from other countries'] },
      { title: 'Scholarships Available', shortDesc: 'Merit, country-specific & university funds', icon: 'Award', color: 'orange', details: ['Chevening Scholarship covers full tuition + living costs', 'Commonwealth Scholarship for students from developing countries', 'Most universities offer country-specific scholarships for Bangladesh', 'ALO Education helps identify and apply for the best scholarships'] },
      { title: 'Multicultural Experience', shortDesc: 'Students from 200+ countries', icon: 'Users', color: 'blue', details: ['UK hosts over 500,000 international students annually', 'Students from 200+ nationalities create a diverse campus culture', 'Large Bangladeshi student communities in Birmingham, London, Manchester', 'Multicultural cities with mosques, halal food, and community events'] },
      { title: 'Quality Assurance', shortDesc: 'QAA & TEF rated, globally recognised', icon: 'Shield', color: 'orange', details: ['Quality Assurance Agency (QAA) maintains rigorous academic standards', 'Teaching Excellence Framework (TEF) rates university teaching quality', 'Regular research assessments ensure cutting-edge curriculum', 'Degree accreditation recognised by professional bodies worldwide'] },
    ],
  },
  universities: {
    label: 'TOP UK UNIVERSITIES',
    title: 'Featured UK Universities',
    button: 'View All UK Universities',
    data: [
      { name: 'University of Birmingham', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#84', courses: '350+', tuitionRange: '\u00A321K-\u00A335K', scholarships: '45+', subjects: ['Business', 'Engineering', 'Computer Science', 'Law', 'Medicine'], matchScore: 92, image: IMG.campus1 },
      { name: 'Manchester Metropolitan University', city: 'Manchester', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#601', courses: '280+', tuitionRange: '\u00A316K-\u00A324K', scholarships: '30+', subjects: ['Business', 'Art & Design', 'Computing', 'Engineering'], matchScore: 88, image: IMG.campus4 },
      { name: 'Aston University', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#425', courses: '200+', tuitionRange: '\u00A318K-\u00A328K', scholarships: '25+', subjects: ['Business', 'Engineering', 'Optometry', 'Languages'], matchScore: 90, image: IMG.campus3 },
      { name: 'University of Kent', city: 'Canterbury', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#376', courses: '250+', tuitionRange: '\u00A317K-\u00A326K', scholarships: '35+', subjects: ['Law', 'Computer Science', 'Business', 'Politics'], matchScore: 86, image: IMG.campus2 },
      { name: 'University of Portsmouth', city: 'Portsmouth', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#501', courses: '220+', tuitionRange: '\u00A315K-\u00A323K', scholarships: '28+', subjects: ['Engineering', 'Business', 'Creative Arts', 'Science'], matchScore: 85, image: IMG.campus1 },
      { name: 'University of Hertfordshire', city: 'Hatfield', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#601', courses: '240+', tuitionRange: '\u00A315K-\u00A322K', scholarships: '20+', subjects: ['Computer Science', 'Business', 'Engineering', 'Pharmacy'], matchScore: 84, image: IMG.campus3 },
    ],
    drawerData: [
      { name: 'University of Birmingham', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#84', rankingSource: 'QS 2025', students: '38,000+', courses: '350+', tuitionRange: '\u00A321,000 - \u00A335,000', scholarships: '45+', accommodation: 'From \u00A36,500/year for university halls. Private rentals available from \u00A3450/month in Selly Oak area near campus.', subjects: ['Business', 'Engineering', 'Computer Science', 'Law', 'Medicine', 'Education'], description: 'A prestigious Russell Group university founded in 1900, known for its research excellence and vibrant multicultural campus in the heart of Birmingham.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MSc Data Science', degree: 'MSc', tuition: '\u00A328,000/yr' }, { name: 'MBA International Business', degree: 'MBA', tuition: '\u00A332,000/yr' }, { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A326,000/yr' }] },
      { name: 'Manchester Metropolitan University', city: 'Manchester', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#601', rankingSource: 'QS 2025', students: '40,000+', courses: '280+', tuitionRange: '\u00A316,000 - \u00A324,000', scholarships: '30+', accommodation: 'From \u00A35,800/year for university accommodation. City centre living from \u00A3500/month.', subjects: ['Business', 'Art & Design', 'Computing', 'Engineering', 'Science'], description: 'One of the largest universities in the UK with a strong focus on employability, industry partnerships, and a vibrant student life in central Manchester.', campusImage: IMG.campus4, logo: '', featuredCourses: [{ name: 'MBA', degree: 'MBA', tuition: '\u00A322,000/yr' }, { name: 'MSc Digital Marketing', degree: 'MSc', tuition: '\u00A318,500/yr' }, { name: 'MSc Artificial Intelligence', degree: 'MSc', tuition: '\u00A321,000/yr' }] },
      { name: 'Aston University', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#425', rankingSource: 'QS 2025', students: '15,000+', courses: '200+', tuitionRange: '\u00A318,000 - \u00A328,000', scholarships: '25+', accommodation: 'From \u00A35,500/year. Located in the city centre with easy access to all amenities.', subjects: ['Business', 'Engineering', 'Optometry', 'Languages', 'Psychology'], description: 'A leading university renowned for its business school (triple-accredited), strong industry links, and high graduate employment rates.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MSc Computing', degree: 'MSc', tuition: '\u00A324,500/yr' }, { name: 'MSc Business Analytics', degree: 'MSc', tuition: '\u00A323,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: '\u00A327,000/yr' }] },
      { name: 'University of Kent', city: 'Canterbury', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#376', rankingSource: 'QS 2025', students: '20,000+', courses: '250+', tuitionRange: '\u00A317,000 - \u00A326,000', scholarships: '35+', accommodation: 'From \u00A35,200/year on the beautiful Canterbury campus. One of the most affordable university cities in the UK.', subjects: ['Law', 'Computer Science', 'Business', 'Politics', 'Biosciences'], description: 'A beloved campus university in the historic city of Canterbury, known for strong research, excellent teaching, and a warm community atmosphere.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MSc International Business', degree: 'MSc', tuition: '\u00A321,000/yr' }, { name: 'LLM International Law', degree: 'LLM', tuition: '\u00A319,500/yr' }, { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A320,000/yr' }] },
      { name: 'University of Portsmouth', city: 'Portsmouth', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#501', rankingSource: 'QS 2025', students: '28,000+', courses: '220+', tuitionRange: '\u00A315,000 - \u00A323,000', scholarships: '28+', accommodation: 'From \u00A34,800/year for halls. Private rentals from \u00A3400/month in the coastal city.', subjects: ['Engineering', 'Business', 'Creative Arts', 'Science', 'Law'], description: 'A modern university on the south coast of England, recognised for teaching excellence, strong industry partnerships, and high student satisfaction.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MSc Data Analytics', degree: 'MSc', tuition: '\u00A319,500/yr' }, { name: 'MSc Mechanical Engineering', degree: 'MSc', tuition: '\u00A321,000/yr' }, { name: 'MSc International Business', degree: 'MSc', tuition: '\u00A318,500/yr' }] },
      { name: 'University of Hertfordshire', city: 'Hatfield', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', ranking: '#601', rankingSource: 'QS 2025', students: '25,000+', courses: '240+', tuitionRange: '\u00A315,000 - \u00A322,000', scholarships: '20+', accommodation: 'From \u00A34,500/year for on-campus halls. Very affordable cost of living near London.', subjects: ['Computer Science', 'Business', 'Engineering', 'Pharmacy', 'Creative Arts'], description: 'A career-focused university just 25 minutes from London, known for its strong computing and business programmes and excellent industry connections.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MSc Cyber Security', degree: 'MSc', tuition: '\u00A318,000/yr' }, { name: 'MSc Computer Science', degree: 'MSc', tuition: '\u00A317,500/yr' }, { name: 'MBA', degree: 'MBA', tuition: '\u00A320,000/yr' }] },
    ],
  },
  courses: {
    label: 'POPULAR COURSES',
    title: 'Top Courses for Bangladeshi Students in the UK',
    button: 'Browse All UK Courses',
    data: [
      { name: 'MSc Data Science', university: 'University of Birmingham', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A328,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '1 Year', scholarship: true, matchScore: 94, image: IMG.campus2 },
      { name: 'MBA (Master of Business Administration)', university: 'Manchester Metropolitan University', city: 'Manchester', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A322,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '1 Year', scholarship: true, matchScore: 91, image: IMG.campus4 },
      { name: 'MSc Computing', university: 'Aston University', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A324,500/yr', intake: 'Sep 2025', ielts: '6.0', duration: '1 Year', scholarship: true, matchScore: 89, image: IMG.campus3 },
      { name: 'MSc International Business', university: 'University of Kent', city: 'Canterbury', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A321,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '1 Year', scholarship: true, matchScore: 87, image: IMG.campus1 },
      { name: 'MSc Data Analytics', university: 'University of Portsmouth', city: 'Portsmouth', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A319,500/yr', intake: 'Jan 2026', ielts: '6.0', duration: '1 Year', scholarship: false, matchScore: 86, image: IMG.campus2 },
      { name: 'MSc Cyber Security', university: 'University of Hertfordshire', city: 'Hatfield', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', tuition: '\u00A318,000/yr', intake: 'Sep 2025', ielts: '6.0', duration: '1 Year', scholarship: true, matchScore: 88, image: IMG.campus3 },
    ],
    drawerData: [
      { name: 'MSc Data Science', university: 'University of Birmingham', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MSc', duration: '1 Year', tuition: '\u00A328,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic', academicReq: '2:1 or equivalent in a relevant subject', scholarship: 'Global Excellence Scholarship', scholarshipAmount: 'Up to \u00A310,000', scholarshipEligible: true, matchScore: 94, careerOutcomes: ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Researcher'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References'], description: 'Gain advanced skills in machine learning, data mining, and statistical modelling.', image: IMG.campus2 },
      { name: 'MBA', university: 'Manchester Metropolitan University', city: 'Manchester', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MBA', duration: '1 Year', tuition: '\u00A322,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 5.5)', ieltsType: 'IELTS Academic', academicReq: '2:2 or equivalent + 2 years work experience', scholarship: 'Manchester MBA Scholarship', scholarshipAmount: 'Up to \u00A35,000', scholarshipEligible: true, matchScore: 91, careerOutcomes: ['Business Consultant', 'Operations Manager', 'Strategy Analyst', 'Entrepreneur'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References'], description: 'Develop strategic leadership and management capabilities with real-world business projects.', image: IMG.campus4 },
      { name: 'MSc Computing', university: 'Aston University', city: 'Birmingham', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MSc', duration: '1 Year', tuition: '\u00A324,500', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.0 (no band below 5.5)', ieltsType: 'IELTS Academic', academicReq: '2:2 or equivalent in any subject (conversion course)', scholarship: 'Aston Global Advantage Scholarship', scholarshipAmount: 'Up to \u00A38,000', scholarshipEligible: true, matchScore: 89, careerOutcomes: ['Software Engineer', 'Full-Stack Developer', 'Systems Architect', 'IT Consultant'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'], description: 'A conversion course designed for graduates from non-computing backgrounds.', image: IMG.campus3 },
      { name: 'MSc International Business', university: 'University of Kent', city: 'Canterbury', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MSc', duration: '1 Year', tuition: '\u00A321,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic', academicReq: '2:2 or equivalent in Business or related subject', scholarship: 'Kent International Scholarship', scholarshipAmount: 'Up to \u00A35,000', scholarshipEligible: true, matchScore: 87, careerOutcomes: ['International Business Manager', 'Trade Analyst', 'Global Operations', 'Management Consultant'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume', 'Two References'], description: 'Explore global business strategy, cross-cultural management, and international trade.', image: IMG.campus1 },
      { name: 'MSc Data Analytics', university: 'University of Portsmouth', city: 'Portsmouth', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MSc', duration: '1 Year', tuition: '\u00A319,500', tuitionPer: 'year', intake: 'Jan 2026', ieltsScore: '6.0 (no band below 5.5)', ieltsType: 'IELTS Academic', academicReq: '2:2 or equivalent in a relevant subject', scholarship: 'Portsmouth Global Scholarship', scholarshipAmount: 'Up to \u00A33,000', scholarshipEligible: false, matchScore: 86, careerOutcomes: ['Data Analyst', 'Business Intelligence Analyst', 'Analytics Manager', 'Data Engineer'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'], description: 'Transform raw data into actionable business insights using statistical analysis and ML.', image: IMG.campus2 },
      { name: 'MSc Cyber Security', university: 'University of Hertfordshire', city: 'Hatfield', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', degree: 'MSc', duration: '1 Year', tuition: '\u00A318,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.0 (no band below 5.5)', ieltsType: 'IELTS Academic', academicReq: '2:2 or equivalent in Computing, IT, or related field', scholarship: 'Hertfordshire International Scholarship', scholarshipAmount: 'Up to \u00A34,000', scholarshipEligible: true, matchScore: 88, careerOutcomes: ['Cyber Security Analyst', 'Penetration Tester', 'Security Consultant', 'SOC Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS Certificate', 'Personal Statement', 'CV/Resume'], description: 'Develop expertise in network security, ethical hacking, and digital forensics.', image: IMG.campus3 },
    ],
  },
  scholarships: {
    label: 'SCHOLARSHIPS IN THE UK',
    title: 'Financial Support for Bangladeshi Students',
    button: 'Browse All UK Scholarships',
    data: [
      { name: 'Global Excellence Scholarship', university: 'University of Birmingham', country: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', amount: '\u00A310,000', eligibility: ['Merit-based', 'Full-time'], deadline: '2025-06-30', degree: 'Masters', international: true, source: 'University' },
      { name: 'Aston Global Advantage Scholarship', university: 'Aston University', country: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', amount: '\u00A38,000', eligibility: ['Bangladeshi', 'PG'], deadline: '2025-07-15', degree: 'Masters', international: true, source: 'University' },
      { name: 'Chevening Scholarship', university: 'Any UK University', country: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', amount: 'Full Tuition', eligibility: ['Leadership', '2yr Exp'], deadline: '2025-11-05', degree: 'Masters', international: true, source: 'UK Government' },
      { name: 'Commonwealth Scholarship', university: 'Any UK University', country: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', amount: 'Full Tuition + Living', eligibility: ['Developing Country', 'Merit'], deadline: '2025-12-15', degree: 'Masters / PhD', international: true, source: 'Commonwealth' },
    ],
  },
  cost: {
    label: 'COST OF LIVING',
    title: 'Estimated Annual Budget for UK Students',
    items: [
      { icon: 'GraduationCap', label: 'Tuition Fees', amount: '\u00A315,000 - \u00A335,000' },
      { icon: 'Building2', label: 'Accommodation', amount: '\u00A36,000 - \u00A312,000' },
      { icon: 'ShoppingCart', label: 'Food & Groceries', amount: '\u00A32,400 - \u00A33,600' },
      { icon: 'Bus', label: 'Transport', amount: '\u00A31,200 - \u00A31,800' },
      { icon: 'Stethoscope', label: 'Health Insurance (NHS)', amount: '\u00A3470 (IVH surcharge)' },
      { icon: 'FileText', label: 'Visa & Application', amount: '\u00A3500 - \u00A31,000' },
      { icon: 'BookOpen', label: 'Books & Materials', amount: '\u00A3300 - \u00A3600' },
      { icon: 'Heart', label: 'Personal Expenses', amount: '\u00A31,800 - \u00A33,000' },
    ],
    summaryLow: '\u00A327,670',
    summaryHigh: '\u00A357,470',
    currency: '\u00A3',
  },
  visa: {
    label: 'VISA INFORMATION',
    title: 'UK Student Visa for Bangladeshi Students',
    requirements: [
      'Valid passport (at least 6 months validity)',
      'CAS (Confirmation of Acceptance for Studies) from UK university',
      'Proof of funds (tuition + \u00A31,023/month for London / \u00A3836/month outside London)',
      'IELTS UKVI score meeting course requirements',
      'TB test certificate from an approved clinic',
      'Academic transcripts and degree certificates',
    ],
    steps: [
      { num: 1, title: 'Get Offer Letter', desc: 'Receive an unconditional offer from a UK university' },
      { num: 2, title: 'Receive CAS', desc: 'University issues your CAS number (usually 2-3 months before start)' },
      { num: 3, title: 'Prepare Documents', desc: 'Gather passport, financial documents, IELTS UKVI, TB certificate' },
      { num: 4, title: 'Apply Online', desc: 'Complete the visa application on GOV.UK and pay the fee' },
      { num: 5, title: 'Biometrics Appointment', desc: 'Attend your appointment for fingerprints and photograph' },
      { num: 6, title: 'Receive Decision', desc: 'Get your visa decision in 3-6 weeks (standard processing)' },
      { num: 7, title: 'Travel to UK', desc: 'Collect your BRP and arrive in the UK before your course start date' },
    ],
  },
  intakes: {
    label: 'INTAKE DATES',
    title: 'UK University Intake Deadlines',
    data: [
      { name: 'September 2025', type: 'Primary', badgeColor: 'bg-alo-blue text-white', courses: 'All 15,000+ courses available', deadline: 'June \u2013 July 2025', prepStart: 'March 2025' },
      { name: 'January 2026', type: 'Secondary', badgeColor: 'bg-alo-orange text-white', courses: 'Limited courses (\u22485,000)', deadline: 'October \u2013 November 2025', prepStart: 'July 2025' },
      { name: 'May 2026', type: 'Summer', badgeColor: 'bg-alo-sunshine text-alo-black', courses: 'Very limited (\u22481,500)', deadline: 'February \u2013 March 2026', prepStart: 'December 2025' },
    ],
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently Asked Questions About Studying in the UK',
    items: [
      { q: 'What is the minimum IELTS score required for UK universities?', a: 'Most UK universities require an overall IELTS score of 6.0 to 7.0 for postgraduate programmes, with no individual band below 5.5 to 6.0. Pre-sessional English courses are available if you need to improve your score.' },
      { q: 'How much does it cost to study in the UK for Bangladeshi students?', a: 'The average annual cost is approximately \u00A327,000-\u00A357,000, including tuition (\u00A315,000-\u00A335,000), accommodation (\u00A36,000-\u00A312,000), living expenses, and visa fees.' },
      { q: 'Can I work while studying in the UK?', a: 'Yes, international students on a Student Visa can work up to 20 hours per week during term time and full-time during holidays. After graduation, the Graduate Route visa allows 2 years of full-time work.' },
      { q: 'What is the post-study work visa (Graduate Route)?', a: 'The Graduate Route allows international students to stay in the UK for 2 years (3 years for PhD) after completing their degree. No employer sponsorship is needed during this period.' },
      { q: 'How long does the UK student visa process take?', a: 'Standard processing takes 3-6 weeks. Priority processing costs \u00A3500 extra for ~5 working days. Super-priority costs \u00A3800 for next-day decisions.' },
      { q: 'Are there scholarships for Bangladeshi students?', a: 'Yes, including Chevening (full tuition + living), Commonwealth Scholarship, and university-specific awards. ALO Education helps identify the best matches for your profile.' },
      { q: 'What documents do I need for a UK student visa?', a: 'Valid passport, CAS, proof of funds (bank statements), IELTS UKVI results, TB certificate, academic transcripts, and degree certificates.' },
      { q: 'Can I stay in the UK after graduation?', a: 'Yes, the Graduate Route visa allows 2 years (3 for PhD) of work. You can switch to a Skilled Worker visa, leading to ILR and eventually British citizenship.' },
    ],
  },
  relatedCountries: [
    { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', stat: '150+ Universities', image: '/images/cards/usa.png' },
    { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', stat: '100+ Universities', image: '/images/cards/canada.png' },
    { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', stat: '45+ Universities', image: '/images/cards/australia.png' },
    { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', stat: '30+ Universities', image: '/images/cards/ireland.png' },
  ],
  cta: {
    title: 'Ready to Study in the UK?',
    subtitle: 'Get personalized guidance from our expert UK counsellors. Free consultation, no obligations.',
    ctaPrimary: 'Find UK Courses',
    ctaSecondary: 'Talk to UK Expert',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   USA CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const USA: CountryPageConfig = {
  slug: 'usa',
  name: 'United States',
  shortName: 'USA',
  flag: '\u{1F1FA}\u{1F1F8}',
  heroImage: '/images/alo/countries/usa-landscape.webp',
  hero: {
    badge: '\u{1F1FA}\u{1F1F8} #1 Research & Innovation Destination',
    title: 'Study in the United States',
    subtitle: 'Home to the world\'s top universities, cutting-edge research, and unmatched career opportunities through OPT. Your American dream starts here.',
    ctaPrimary: 'Find My Course',
    ctaSecondary: 'Talk to an Expert',
    trustIndicators: ['200+ Partner Universities', '3-Year OPT Work Visa', '$25K-$60K Avg Tuition', 'IELTS/TOEFL Accepted'],
  },
  intelligence: {
    label: 'COUNTRY INTELLIGENCE',
    title: 'The USA at a Glance',
    cards: [
      { icon: 'GraduationCap', label: 'Universities', value: '4,000+', countUp: { end: 4000 } },
      { icon: 'BookOpen', label: 'Programmes', value: '50,000+', countUp: { end: 50000, format: true } },
      { icon: 'DollarSign', label: 'Average Tuition', value: '$25,000-60,000/yr' },
      { icon: 'Calendar', label: 'Popular Intakes', value: 'Fall 2025, Spring 2026' },
      { icon: 'Award', label: 'Scholarships', value: '$5,000-30,000' },
      { icon: 'Languages', label: 'English Requirement', value: 'IELTS 6.5-7.5 / TOEFL 80-100' },
    ],
  },
  whyStudy: {
    label: 'WHY STUDY IN THE USA',
    title: '6 Reasons to Choose USA for Your Degree',
    reasons: [
      { title: 'World-Leading Research', shortDesc: '16 of the top 20 global universities', icon: 'Globe', color: 'blue', details: ['US universities dominate global rankings with 16 in the top 20 (QS 2025)', 'Over $80 billion spent annually on university research and development', 'Nobel Prize winners, Turing Award recipients, and Fields Medalists on faculty', 'Access to cutting-edge labs, research centres, and technology incubators'] },
      { title: 'OPT & CPT Work Programs', shortDesc: '3-year OPT for STEM graduates', icon: 'Briefcase', color: 'orange', details: ['Optional Practical Training (OPT) allows 1 year of work after graduation', 'STEM graduates get 24-month extension for a total of 3 years', 'Curricular Practical Training (CPT) enables internships during studies', 'Pathway to H-1B work visa and permanent residency (Green Card)'] },
      { title: 'Unmatched Diversity', shortDesc: 'Students from 200+ countries on campus', icon: 'Users', color: 'blue', details: ['Over 1 million international students study in the US annually', 'Campuses represent 200+ nationalities with dedicated support offices', 'Vibrant Bangladeshi student communities at most major universities', 'Exposure to global perspectives and cross-cultural collaboration'] },
      { title: 'Flexible Education System', shortDesc: 'Choose your major, change freely', icon: 'Clock', color: 'orange', details: ['Undeclared major option lets you explore subjects before committing', 'Wide range of elective courses across departments', 'Transfer-friendly system with credit recognition between institutions', 'Interdisciplinary programmes combining multiple fields of study'] },
      { title: 'Generous Scholarships', shortDesc: 'Merit, need-based & assistantship funding', icon: 'Award', color: 'blue', details: ['Graduate Teaching Assistantships (GTA) and Research Assistantships (GRA) cover tuition + stipend', 'Fulbright Scholarship provides full funding for Bangladeshi students', 'University-specific merit scholarships ranging $5,000-$30,000/year', 'Many universities offer need-based financial aid for international students'] },
      { title: 'Innovation & Entrepreneurship', shortDesc: 'Silicon Valley, tech hubs & startup culture', icon: 'Shield', color: 'orange', details: ['The US is the global hub for technology, finance, and innovation', 'Universities have strong industry partnerships and incubator programmes', 'Access to networking events, career fairs, and alumni networks', 'Strong startup culture with venture capital and mentorship opportunities'] },
    ],
  },
  universities: {
    label: 'TOP USA UNIVERSITIES',
    title: 'Featured USA Universities',
    button: 'View All USA Universities',
    data: [
      { name: 'Massachusetts Institute of Technology', city: 'Cambridge, MA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#1', courses: '200+', tuitionRange: '$55K-$62K', scholarships: '80+', subjects: ['Engineering', 'Computer Science', 'Business', 'Mathematics', 'Physics'], matchScore: 98, image: IMG.campus3 },
      { name: 'Stanford University', city: 'Stanford, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#6', courses: '180+', tuitionRange: '$52K-$60K', scholarships: '70+', subjects: ['Computer Science', 'Business', 'Engineering', 'Medicine', 'Law'], matchScore: 96, image: IMG.campus1 },
      { name: 'Columbia University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#23', courses: '250+', tuitionRange: '$50K-$68K', scholarships: '60+', subjects: ['Business', 'Law', 'Journalism', 'Engineering', 'Medicine'], matchScore: 93, image: IMG.campus2 },
      { name: 'University of California, Berkeley', city: 'Berkeley, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#12', courses: '300+', tuitionRange: '$42K-$50K', scholarships: '50+', subjects: ['Engineering', 'Computer Science', 'Business', 'Natural Sciences', 'Public Policy'], matchScore: 95, image: IMG.campus4 },
      { name: 'New York University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#43', courses: '400+', tuitionRange: '$50K-$62K', scholarships: '45+', subjects: ['Business', 'Arts', 'Engineering', 'Law', 'Medicine'], matchScore: 90, image: IMG.campus3 },
      { name: 'Carnegie Mellon University', city: 'Pittsburgh, PA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#58', courses: '200+', tuitionRange: '$48K-$58K', scholarships: '55+', subjects: ['Computer Science', 'Robotics', 'Engineering', 'Business', 'Fine Arts'], matchScore: 94, image: IMG.campus1 },
    ],
    drawerData: [
      { name: 'Massachusetts Institute of Technology', city: 'Cambridge, MA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#1', rankingSource: 'QS 2025', students: '11,900+', courses: '200+', tuitionRange: '$55,000 - $62,000', scholarships: '80+', accommodation: 'From $10,000/year for university housing. Off-campus apartments from $1,200/month in Cambridge area.', subjects: ['Engineering', 'Computer Science', 'Business', 'Mathematics', 'Physics'], description: 'The world\'s #1 university for engineering and technology, MIT is a powerhouse of innovation, research, and entrepreneurship in the heart of the Boston tech corridor.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$58,000/yr' }, { name: 'MBA (Sloan)', degree: 'MBA', tuition: '$82,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: '$55,000/yr' }] },
      { name: 'Stanford University', city: 'Stanford, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#6', rankingSource: 'QS 2025', students: '17,500+', courses: '180+', tuitionRange: '$52,000 - $60,000', scholarships: '70+', accommodation: 'From $12,000/year on campus. Off-campus shared housing from $1,000/month.', subjects: ['Computer Science', 'Business', 'Engineering', 'Medicine', 'Law'], description: 'Located in Silicon Valley, Stanford is synonymous with innovation, producing founders of Google, Yahoo, and countless other tech giants.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$58,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: '$76,000/yr' }, { name: 'MS Artificial Intelligence', degree: 'MS', tuition: '$60,000/yr' }] },
      { name: 'Columbia University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#23', rankingSource: 'QS 2025', students: '36,000+', courses: '250+', tuitionRange: '$50,000 - $68,000', scholarships: '60+', accommodation: 'From $14,000/year for university housing. Manhattan apartments from $1,500/month.', subjects: ['Business', 'Law', 'Journalism', 'Engineering', 'Medicine'], description: 'An Ivy League institution in the heart of Manhattan, Columbia offers unparalleled access to Wall Street, media, and global policy networks.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$52,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: '$78,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: '$50,000/yr' }] },
      { name: 'University of California, Berkeley', city: 'Berkeley, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#12', rankingSource: 'QS 2025', students: '45,000+', courses: '300+', tuitionRange: '$42,000 - $50,000', scholarships: '50+', accommodation: 'From $10,500/year. Shared housing in Berkeley from $900/month.', subjects: ['Engineering', 'Computer Science', 'Business', 'Natural Sciences', 'Public Policy'], description: 'The top public university in the world, UC Berkeley is renowned for its research output, diverse community, and proximity to the San Francisco Bay Area tech scene.', campusImage: IMG.campus4, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$44,000/yr' }, { name: 'MBA (Haas)', degree: 'MBA', tuition: '$68,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: '$43,000/yr' }] },
      { name: 'New York University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#43', rankingSource: 'QS 2025', students: '58,000+', courses: '400+', tuitionRange: '$50,000 - $62,000', scholarships: '45+', accommodation: 'From $13,000/year. Brooklyn/Queens shared apartments from $1,200/month.', subjects: ['Business', 'Arts', 'Engineering', 'Law', 'Medicine'], description: 'A global university in the heart of NYC, NYU offers unparalleled cultural and professional opportunities with a diverse international student body.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$52,000/yr' }, { name: 'MBA (Stern)', degree: 'MBA', tuition: '$78,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: '$50,000/yr' }] },
      { name: 'Carnegie Mellon University', city: 'Pittsburgh, PA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', ranking: '#58', rankingSource: 'QS 2025', students: '15,800+', courses: '200+', tuitionRange: '$48,000 - $58,000', scholarships: '55+', accommodation: 'From $9,500/year on campus. Pittsburgh apartments from $800/month.', subjects: ['Computer Science', 'Robotics', 'Engineering', 'Business', 'Fine Arts'], description: 'A world leader in computer science, robotics, and artificial intelligence, CMU combines technical excellence with strong industry partnerships.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: '$52,000/yr' }, { name: 'MS Artificial Intelligence', degree: 'MS', tuition: '$54,000/yr' }, { name: 'MBA (Tepper)', degree: 'MBA', tuition: '$70,000/yr' }] },
    ],
  },
  courses: {
    label: 'POPULAR COURSES',
    title: 'Top Courses for Bangladeshi Students in the USA',
    button: 'Browse All USA Courses',
    data: [
      { name: 'MS Computer Science', university: 'Carnegie Mellon University', city: 'Pittsburgh, PA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$52,000/yr', intake: 'Fall 2025', ielts: '7.5', duration: '2 Years', scholarship: true, matchScore: 96, image: IMG.campus1 },
      { name: 'MBA', university: 'Columbia Business School', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$78,000/yr', intake: 'Fall 2025', ielts: '7.5', duration: '2 Years', scholarship: true, matchScore: 93, image: IMG.campus2 },
      { name: 'MS Data Science', university: 'UC Berkeley', city: 'Berkeley, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$43,000/yr', intake: 'Fall 2025', ielts: '7.0', duration: '2 Years', scholarship: true, matchScore: 94, image: IMG.campus4 },
      { name: 'MS Artificial Intelligence', university: 'Stanford University', city: 'Stanford, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$60,000/yr', intake: 'Fall 2025', ielts: '7.5', duration: '2 Years', scholarship: true, matchScore: 95, image: IMG.campus3 },
      { name: 'MS Business Analytics', university: 'New York University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$50,000/yr', intake: 'Fall 2025', ielts: '7.0', duration: '2 Years', scholarship: false, matchScore: 91, image: IMG.campus1 },
      { name: 'MS Engineering Management', university: 'MIT', city: 'Cambridge, MA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', tuition: '$58,000/yr', intake: 'Fall 2025', ielts: '7.5', duration: '2 Years', scholarship: true, matchScore: 97, image: IMG.campus2 },
    ],
    drawerData: [
      { name: 'MS Computer Science', university: 'Carnegie Mellon University', city: 'Pittsburgh, PA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MS', duration: '2 Years', tuition: '$52,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.5 (no band below 7.0)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: 'Bachelor\'s in CS or related with GPA 3.5+; GRE recommended', scholarship: 'CMU International Scholarship', scholarshipAmount: 'Up to $15,000/year', scholarshipEligible: true, matchScore: 96, careerOutcomes: ['Software Engineer', 'ML Engineer', 'Data Scientist', 'Research Scientist'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs', 'GRE Scores'], description: 'One of the world\'s top CS programmes, covering AI, systems, theory, and human-computer interaction with access to world-class research labs.', image: IMG.campus1 },
      { name: 'MBA', university: 'Columbia Business School', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MBA', duration: '2 Years', tuition: '$78,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.5 (no band below 7.0)', ieltsType: 'IELTS Academic / TOEFL 110', academicReq: 'Bachelor\'s + 3-5 years work experience; GMAT/GRE required', scholarship: 'Columbia Fellowship', scholarshipAmount: 'Up to $30,000/year', scholarshipEligible: true, matchScore: 93, careerOutcomes: ['Investment Banker', 'Management Consultant', 'Product Manager', 'Entrepreneur'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs', 'GMAT/GRE'], description: 'An Ivy League MBA in the heart of NYC with unmatched access to Wall Street, consulting firms, and global business networks.', image: IMG.campus2 },
      { name: 'MS Data Science', university: 'UC Berkeley', city: 'Berkeley, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MS', duration: '2 Years', tuition: '$43,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.0 (no band below 6.5)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: 'Bachelor\'s in quantitative field with GPA 3.3+', scholarship: 'Berkeley International Scholarship', scholarshipAmount: 'Up to $10,000/year', scholarshipEligible: true, matchScore: 94, careerOutcomes: ['Data Scientist', 'ML Engineer', 'Analytics Manager', 'Research Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'A rigorous programme combining statistics, machine learning, and domain expertise with real-world projects and industry partnerships.', image: IMG.campus4 },
      { name: 'MS Artificial Intelligence', university: 'Stanford University', city: 'Stanford, CA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MS', duration: '2 Years', tuition: '$60,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.5 (no band below 7.0)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: 'Bachelor\'s in CS or related with GPA 3.5+; GRE recommended', scholarship: 'Stanford Engineering Fellowship', scholarshipAmount: 'Up to $20,000/year', scholarshipEligible: true, matchScore: 95, careerOutcomes: ['AI Researcher', 'ML Engineer', 'Robotics Engineer', 'NLP Scientist'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs', 'GRE'], description: 'Study AI at the birthplace of many AI breakthroughs, with access to SAIL lab and Silicon Valley industry connections.', image: IMG.campus3 },
      { name: 'MS Business Analytics', university: 'New York University', city: 'New York, NY', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MS', duration: '2 Years', tuition: '$50,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.0 (no band below 6.5)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: 'Bachelor\'s with quantitative background; GMAT/GRE recommended', scholarship: 'NYU Wagner Scholarship', scholarshipAmount: 'Up to $12,000/year', scholarshipEligible: false, matchScore: 91, careerOutcomes: ['Business Analyst', 'Data Analyst', 'Consultant', 'Strategy Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs'], description: 'Combines business acumen with data analytics skills, leveraging NYC\'s position as a global business and tech hub.', image: IMG.campus1 },
      { name: 'MS Engineering Management', university: 'MIT', city: 'Cambridge, MA', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', degree: 'MS', duration: '2 Years', tuition: '$58,000', tuitionPer: 'year', intake: 'Fall 2025', ieltsScore: '7.5 (no band below 7.0)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: 'Bachelor\'s in Engineering + 2 years experience; GRE required', scholarship: 'MIT International Fellowship', scholarshipAmount: 'Up to $25,000/year', scholarshipEligible: true, matchScore: 97, careerOutcomes: ['Engineering Manager', 'Technical Lead', 'Product Manager', 'Operations Director'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs', 'GRE'], description: 'A flagship programme at MIT combining engineering expertise with management and leadership skills for technical professionals.', image: IMG.campus2 },
    ],
  },
  scholarships: {
    label: 'SCHOLARSHIPS IN THE USA',
    title: 'Financial Support for Bangladeshi Students',
    button: 'Browse All USA Scholarships',
    data: [
      { name: 'Fulbright Foreign Student Program', university: 'Any US University', country: 'United States', flag: '\u{1F1FA}\u{1F1F8}', amount: 'Full Tuition + Living', eligibility: ['Merit-based', 'Bangladeshi'], deadline: '2025-10-15', degree: 'Masters / PhD', international: true, source: 'US Government' },
      { name: 'Stanford Engineering Fellowship', university: 'Stanford University', country: 'United States', flag: '\u{1F1FA}\u{1F1F8}', amount: '$20,000/yr', eligibility: ['Engineering', 'Research'], deadline: '2025-12-01', degree: 'Masters / PhD', international: true, source: 'University' },
      { name: 'AAUW International Fellowship', university: 'Any US University', country: 'United States', flag: '\u{1F1FA}\u{1F1F8}', amount: '$18,000-$30,000', eligibility: ['Women', 'Full-time'], deadline: '2025-11-15', degree: 'Masters / PhD', international: true, source: 'AAUW' },
      { name: 'AGF Scholarships (Bangladesh)', university: 'Selected US Universities', country: 'United States', flag: '\u{1F1FA}\u{1F1F8}', amount: 'Up to $10,000', eligibility: ['Bangladeshi', 'Undergrad'], deadline: '2025-03-31', degree: 'Masters', international: true, source: 'AGF Foundation' },
    ],
  },
  cost: {
    label: 'COST OF LIVING',
    title: 'Estimated Annual Budget for USA Students',
    items: [
      { icon: 'GraduationCap', label: 'Tuition Fees', amount: '$25,000 - $65,000' },
      { icon: 'Building2', label: 'Accommodation', amount: '$12,000 - $24,000' },
      { icon: 'ShoppingCart', label: 'Food & Groceries', amount: '$4,000 - $6,000' },
      { icon: 'Bus', label: 'Transport', amount: '$1,500 - $3,000' },
      { icon: 'Stethoscope', label: 'Health Insurance', amount: '$2,000 - $4,000' },
      { icon: 'FileText', label: 'Visa & SEVIS', amount: '$500 - $700' },
      { icon: 'BookOpen', label: 'Books & Materials', amount: '$500 - $1,200' },
      { icon: 'Heart', label: 'Personal Expenses', amount: '$3,000 - $6,000' },
    ],
    summaryLow: '$48,500',
    summaryHigh: '$109,900',
    currency: '$',
  },
  visa: {
    label: 'VISA INFORMATION',
    title: 'US Student Visa (F-1) for Bangladeshi Students',
    requirements: [
      'Valid passport (at least 6 months beyond stay period)',
      'Form I-20 issued by your US university',
      'Proof of funds for tuition + living costs (I-20 amount)',
      'IELTS or TOEFL score meeting university requirements',
      'SEVIS fee payment receipt ($350)',
      'DS-160 confirmation page and visa appointment confirmation',
    ],
    steps: [
      { num: 1, title: 'Receive I-20', desc: 'University sends Form I-20 after you accept the offer and pay deposit' },
      { num: 2, title: 'Pay SEVIS Fee', desc: 'Pay the $350 SEVIS I-901 fee online at fmjfee.com' },
      { num: 3, title: 'Complete DS-160', desc: 'Fill out the online DS-160 visa application form and upload photo' },
      { num: 4, title: 'Schedule Interview', desc: 'Book your embassy interview appointment at the US Embassy in Dhaka' },
      { num: 5, title: 'Attend Interview', desc: 'Bring all documents to the embassy interview (be prepared to explain study plans)' },
      { num: 6, title: 'Receive Visa', desc: 'Get your F-1 visa stamped in passport (typically 2-5 business days after approval)' },
      { num: 7, title: 'Travel to USA', desc: 'Enter the US up to 30 days before your programme start date on your I-20' },
    ],
  },
  intakes: {
    label: 'INTAKE DATES',
    title: 'US University Intake Deadlines',
    data: [
      { name: 'Fall 2025 (Aug/Sep)', type: 'Primary', badgeColor: 'bg-alo-blue text-white', courses: 'All 50,000+ programmes', deadline: 'December 2024 – March 2025', prepStart: 'August 2024' },
      { name: 'Spring 2026 (Jan)', type: 'Secondary', badgeColor: 'bg-alo-orange text-white', courses: 'Limited programmes (≈15,000)', deadline: 'September – October 2025', prepStart: 'May 2025' },
      { name: 'Summer 2026 (May)', type: 'Limited', badgeColor: 'bg-alo-sunshine text-alo-black', courses: 'Very limited (≈5,000)', deadline: 'February – March 2026', prepStart: 'December 2025' },
    ],
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently Asked Questions About Studying in the USA',
    items: [
      { q: 'What is the minimum IELTS/TOEFL score for US universities?', a: 'Most top universities require IELTS 6.5-7.5 or TOEFL iBT 80-100. Some programmes may require higher scores. Many universities also accept Duolingo English Test (105-120).' },
      { q: 'How much does it cost to study in the USA for Bangladeshi students?', a: 'Annual costs range from $48,000-$110,000 including tuition ($25K-$65K), accommodation ($12K-$24K), and living expenses. Public universities are more affordable than private ones.' },
      { q: 'Can I work while studying in the USA?', a: 'F-1 students can work on-campus up to 20 hours/week. Off-campus work requires CPT (during studies) or OPT (after graduation). STEM graduates get 3 years of OPT.' },
      { q: 'What is OPT and how does it work?', a: 'Optional Practical Training (OPT) allows F-1 students to work in their field for 12 months after graduation. STEM degree holders can extend by 24 months for a total of 36 months.' },
      { q: 'How long does the US student visa process take?', a: 'After the embassy interview, visa processing typically takes 2-5 business days. However, interview wait times in Dhaka can be 2-8 weeks, so apply early.' },
      { q: 'Are there scholarships for Bangladeshi students in the USA?', a: 'Yes, including Fulbright (full funding), AAUW International Fellowship, university-specific merit awards, and GTA/GRA positions that cover tuition plus stipend.' },
      { q: 'What is the SEVIS fee and how do I pay it?', a: 'The SEVIS I-901 fee is $350 for F-1 students. Pay online at fmjfee.com after receiving your I-20. Keep the receipt for your visa interview.' },
      { q: 'Can I get a Green Card after studying in the USA?', a: 'Yes, the most common pathway is F-1 → OPT → H-1B work visa → Employment-Based Green Card (EB-2/EB-3). The process takes 5-15 years depending on category and country of birth.' },
    ],
  },
  relatedCountries: [
    { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', stat: '180+ Universities', image: '/images/cards/uk.png' },
    { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', stat: '100+ Universities', image: '/images/cards/canada.png' },
    { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', stat: '45+ Universities', image: '/images/cards/australia.png' },
    { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', stat: '30+ Universities', image: '/images/cards/ireland.png' },
  ],
  cta: {
    title: 'Ready to Study in the USA?',
    subtitle: 'Get personalized guidance from our expert US counsellors. Free consultation, no obligations.',
    ctaPrimary: 'Find USA Courses',
    ctaSecondary: 'Talk to US Expert',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   CANADA CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const CANADA: CountryPageConfig = {
  slug: 'canada',
  name: 'Canada',
  shortName: 'Canada',
  flag: '\u{1F1E8}\u{1F1E6}',
  heroImage: '/images/alo/countries/canada-landscape.webp',
  hero: {
    badge: '\u{1F1E8}\u{1F1E6} #1 Immigration-Friendly Study Destination',
    title: 'Study in Canada',
    subtitle: 'Affordable world-class education with a clear pathway to permanent residency through the Post-Graduation Work Permit. Your Canadian journey starts here.',
    ctaPrimary: 'Find My Course',
    ctaSecondary: 'Talk to an Expert',
    trustIndicators: ['100+ Partner Universities', 'PGWP \u2192 PR in 1-2 Years', 'C$15K-40K Average Tuition', 'IELTS 6.0+ Required'],
  },
  intelligence: {
    label: 'COUNTRY INTELLIGENCE',
    title: 'Canada at a Glance',
    cards: [
      { icon: 'GraduationCap', label: 'Universities', value: '100+', countUp: { end: 100 } },
      { icon: 'BookOpen', label: 'Programmes', value: '15,000+', countUp: { end: 15000, format: true } },
      { icon: 'DollarSign', label: 'Average Tuition', value: 'C$15,000-40,000/yr' },
      { icon: 'Calendar', label: 'Popular Intakes', value: 'Sep 2025, Jan 2026' },
      { icon: 'Award', label: 'Scholarships', value: 'C$10,000-50,000' },
      { icon: 'Languages', label: 'English Requirement', value: 'IELTS 6.0-7.0' },
    ],
  },
  whyStudy: {
    label: 'WHY STUDY IN CANADA',
    title: '6 Reasons to Choose Canada for Your Degree',
    reasons: [
      { title: 'Immigration Pathway', shortDesc: 'PGWP \u2192 PR in 1-2 years', icon: 'Globe', color: 'blue', details: ['Post-Graduation Work Permit (PGWP) gives 1-3 years of open work permit after graduation', 'PGWP holders can transition to Permanent Residency via Express Entry or Provincial Nominee Programs', 'Canada aims to welcome over 500,000 new permanent residents annually', 'Spouses can apply for open work permits while you study'] },
      { title: 'Affordable Education', shortDesc: 'Lower tuition than US/UK', icon: 'Briefcase', color: 'orange', details: ['Canadian tuition is 30-50% lower than US universities for comparable programmes', 'Average international tuition ranges C$15,000-C$40,000 per year', 'Lower cost of living compared to major US and UK cities', 'Co-op programmes allow you to earn C$15-25/hr while studying'] },
      { title: 'Safety & Quality of Life', shortDesc: 'Among the safest countries globally', icon: 'Shield', color: 'blue', details: ['Canada consistently ranks in the top 10 safest countries in the world', 'High quality of life with universal healthcare and social services', 'Multicultural and inclusive society with strong anti-discrimination laws', 'Vibrant Bangladeshi communities in Toronto, Vancouver, and Montreal'] },
      { title: 'World-Class Research', shortDesc: 'Top-ranked research universities', icon: 'Award', color: 'orange', details: ['University of Toronto, UBC, and McGill rank in the global top 50 (QS 2025)', 'Canada is a global leader in AI research, with institutes like MILA and Vector Institute', 'Over C$14 billion invested annually in university research and development', 'Strong industry-academic partnerships in tech, natural sciences, and health'] },
      { title: 'Co-op Programs', shortDesc: 'Earn while you learn', icon: 'Clock', color: 'blue', details: ['Many Canadian universities offer integrated co-op (internship) programmes', 'Earn C$15-25/hour during work terms, gaining Canadian work experience', 'Co-op experience significantly improves post-graduation job prospects', 'Universities like Waterloo are world-famous for their co-op programmes'] },
      { title: 'Multiculturalism', shortDesc: 'Students from 200+ countries', icon: 'Users', color: 'orange', details: ['Canada is one of the most multicultural countries in the world', 'Toronto and Vancouver are among the most diverse cities globally', 'Strong support services for international students at every university', 'Easy to find halal food, mosques, and cultural communities'] },
    ],
  },
  universities: {
    label: 'TOP CANADA UNIVERSITIES',
    title: 'Featured Canada Universities',
    button: 'View All Canada Universities',
    data: [
      { name: 'University of Toronto', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#25', courses: '700+', tuitionRange: 'C$45K-$65K', scholarships: '60+', subjects: ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law'], matchScore: 97, image: IMG.campus1 },
      { name: 'University of British Columbia', city: 'Vancouver, BC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#38', courses: '500+', tuitionRange: 'C$40K-$58K', scholarships: '50+', subjects: ['Engineering', 'Computer Science', 'Forestry', 'Sciences', 'Business'], matchScore: 95, image: IMG.campus2 },
      { name: 'McGill University', city: 'Montreal, QC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#29', courses: '400+', tuitionRange: 'C$42K-$60K', scholarships: '55+', subjects: ['Medicine', 'Engineering', 'Law', 'Arts', 'Sciences'], matchScore: 96, image: IMG.campus3 },
      { name: 'University of Waterloo', city: 'Waterloo, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#112', courses: '200+', tuitionRange: 'C$35K-$50K', scholarships: '40+', subjects: ['Computer Science', 'Engineering', 'Mathematics', 'Data Science', 'Co-op'], matchScore: 93, image: IMG.campus4 },
      { name: 'University of Alberta', city: 'Edmonton, AB', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#96', courses: '400+', tuitionRange: 'C$30K-$42K', scholarships: '45+', subjects: ['Engineering', 'Computer Science', 'Energy', 'Sciences', 'Business'], matchScore: 91, image: IMG.campus1 },
      { name: 'York University', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#353', courses: '300+', tuitionRange: 'C$25K-$38K', scholarships: '35+', subjects: ['Business', 'Law', 'Engineering', 'Arts', 'Health'], matchScore: 88, image: IMG.campus2 },
    ],
    drawerData: [
      { name: 'University of Toronto', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#25', rankingSource: 'QS 2025', students: '95,000+', courses: '700+', tuitionRange: 'C$45,000 - C$65,000', scholarships: '60+', accommodation: 'From C$8,000/year for university housing. Off-campus shared apartments from C$800/month in Toronto.', subjects: ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law'], description: 'Canada\'s top-ranked university and a global leader in research, located in the heart of Toronto — one of the world\'s most multicultural cities.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: 'C$45,000/yr' }, { name: 'MBA (Rotman)', degree: 'MBA', tuition: 'C$65,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'C$42,000/yr' }] },
      { name: 'University of British Columbia', city: 'Vancouver, BC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#38', rankingSource: 'QS 2025', students: '67,000+', courses: '500+', tuitionRange: 'C$40,000 - C$58,000', scholarships: '50+', accommodation: 'From C$7,500/year on campus. Off-campus shared housing from C$900/month in Vancouver.', subjects: ['Engineering', 'Computer Science', 'Forestry', 'Sciences', 'Business'], description: 'A top-40 global university on the beautiful Pacific coast, UBC is renowned for its research excellence and stunning campus.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MS Data Science', degree: 'MS', tuition: 'C$40,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'C$42,000/yr' }, { name: 'MBA (Sauder)', degree: 'MBA', tuition: 'C$58,000/yr' }] },
      { name: 'McGill University', city: 'Montreal, QC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#29', rankingSource: 'QS 2025', students: '40,000+', courses: '400+', tuitionRange: 'C$42,000 - C$60,000', scholarships: '55+', accommodation: 'From C$6,500/year on campus. Montreal shared apartments from C$600/month.', subjects: ['Medicine', 'Engineering', 'Law', 'Arts', 'Sciences'], description: 'Canada\'s oldest university and a global top-30 institution, located in the vibrant, bilingual city of Montreal with a very affordable cost of living.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MBA (Desautels)', degree: 'MBA', tuition: 'C$55,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'C$42,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'C$40,000/yr' }] },
      { name: 'University of Waterloo', city: 'Waterloo, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#112', rankingSource: 'QS 2025', students: '42,000+', courses: '200+', tuitionRange: 'C$35,000 - C$50,000', scholarships: '40+', accommodation: 'From C$6,000/year on campus. Waterloo shared apartments from C$650/month.', subjects: ['Computer Science', 'Engineering', 'Mathematics', 'Data Science', 'Co-op'], description: 'World-famous for its co-op programme, Waterloo is Canada\'s top university for computer science and engineering with unmatched industry connections.', campusImage: IMG.campus4, logo: '', featuredCourses: [{ name: 'MS Engineering', degree: 'MS', tuition: 'C$38,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'C$40,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'C$37,000/yr' }] },
      { name: 'University of Alberta', city: 'Edmonton, AB', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#96', rankingSource: 'QS 2025', students: '44,000+', courses: '400+', tuitionRange: 'C$30,000 - C$42,000', scholarships: '45+', accommodation: 'From C$5,500/year on campus. Edmonton shared apartments from C$600/month.', subjects: ['Engineering', 'Computer Science', 'Energy', 'Sciences', 'Business'], description: 'A top-100 global university and Canada\'s leader in AI research, home to the Alberta Machine Intelligence Institute (Amii).', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS AI', degree: 'MS', tuition: 'C$35,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'C$33,000/yr' }, { name: 'MS Engineering', degree: 'MS', tuition: 'C$30,000/yr' }] },
      { name: 'York University', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', ranking: '#353', rankingSource: 'QS 2025', students: '55,000+', courses: '300+', tuitionRange: 'C$25,000 - C$38,000', scholarships: '35+', accommodation: 'From C$7,000/year on campus. Toronto shared apartments from C$800/month.', subjects: ['Business', 'Law', 'Engineering', 'Arts', 'Health'], description: 'One of Canada\'s largest universities located in Toronto, offering affordable programmes with strong industry connections in Canada\'s business capital.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MS Business Analytics', degree: 'MS', tuition: 'C$28,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: 'C$38,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'C$30,000/yr' }] },
    ],
  },
  courses: {
    label: 'POPULAR COURSES',
    title: 'Top Courses for Bangladeshi Students in Canada',
    button: 'Browse All Canada Courses',
    data: [
      { name: 'MS Computer Science', university: 'University of Toronto', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$45,000/yr', intake: 'Sep 2025', ielts: '7.0', duration: '2 Years', scholarship: true, matchScore: 97, image: IMG.campus1 },
      { name: 'MBA', university: 'McGill Desautels', city: 'Montreal, QC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$55,000/yr', intake: 'Sep 2025', ielts: '7.0', duration: '2 Years', scholarship: true, matchScore: 95, image: IMG.campus2 },
      { name: 'MS Data Science', university: 'University of British Columbia', city: 'Vancouver, BC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$40,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 94, image: IMG.campus3 },
      { name: 'MS Engineering', university: 'University of Waterloo', city: 'Waterloo, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$38,000/yr', intake: 'Sep 2025', ielts: '7.0', duration: '2 Years', scholarship: true, matchScore: 93, image: IMG.campus4 },
      { name: 'MS Business Analytics', university: 'York University', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$28,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '2 Years', scholarship: false, matchScore: 89, image: IMG.campus1 },
      { name: 'MS AI', university: 'University of Alberta', city: 'Edmonton, AB', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', tuition: 'C$35,000/yr', intake: 'Sep 2025', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 92, image: IMG.campus2 },
    ],
    drawerData: [
      { name: 'MS Computer Science', university: 'University of Toronto', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MS', duration: '2 Years', tuition: 'C$45,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '7.0 (no band below 6.5)', ieltsType: 'IELTS Academic / TOEFL 93', academicReq: "Bachelor's in CS or related with GPA 3.3+; GRE recommended", scholarship: 'U of Toronto International Scholarship', scholarshipAmount: 'Up to C$20,000/year', scholarshipEligible: true, matchScore: 97, careerOutcomes: ['Software Engineer', 'ML Engineer', 'Data Scientist', 'Research Scientist'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs', 'GRE Scores'], description: 'One of Canada\'s top CS programmes at the country\'s #1 university, offering specialisations in AI, systems, and theory with access to the Vector Institute.', image: IMG.campus1 },
      { name: 'MBA', university: 'McGill Desautels', city: 'Montreal, QC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MBA', duration: '2 Years', tuition: 'C$55,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '7.0 (no band below 6.5)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: "Bachelor's + 2-3 years work experience; GMAT/GRE required", scholarship: 'McGill MBA Scholarship', scholarshipAmount: 'Up to C$25,000/year', scholarshipEligible: true, matchScore: 95, careerOutcomes: ['Management Consultant', 'Investment Banker', 'Product Manager', 'Entrepreneur'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs', 'GMAT/GRE'], description: 'A prestigious MBA in bilingual Montreal, combining rigorous academics with strong alumni networks and international exchange opportunities.', image: IMG.campus2 },
      { name: 'MS Data Science', university: 'University of British Columbia', city: 'Vancouver, BC', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MS', duration: '2 Years', tuition: 'C$40,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: "Bachelor's in quantitative field with GPA 3.0+", scholarship: 'UBC International Scholarship', scholarshipAmount: 'Up to C$15,000/year', scholarshipEligible: true, matchScore: 94, careerOutcomes: ['Data Scientist', 'ML Engineer', 'Analytics Manager', 'Research Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'A comprehensive data science programme at one of Canada\'s top universities, leveraging Vancouver\'s growing tech industry for co-op and career opportunities.', image: IMG.campus3 },
      { name: 'MS Engineering', university: 'University of Waterloo', city: 'Waterloo, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MS', duration: '2 Years', tuition: 'C$38,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '7.0 (no band below 6.5)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: "Bachelor's in Engineering with GPA 3.0+; GRE recommended", scholarship: 'Waterloo Engineering Scholarship', scholarshipAmount: 'Up to C$15,000/year', scholarshipEligible: true, matchScore: 93, careerOutcomes: ['Engineering Manager', 'Systems Engineer', 'Technical Lead', 'R&D Engineer'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs', 'GRE'], description: 'Canada\'s top engineering programme with the world\'s largest co-op programme, giving you up to 2 years of paid work experience before graduating.', image: IMG.campus4 },
      { name: 'MS Business Analytics', university: 'York University', city: 'Toronto, ON', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MS', duration: '2 Years', tuition: 'C$28,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: "Bachelor's with quantitative background; GMAT recommended", scholarship: 'York International Scholarship', scholarshipAmount: 'Up to C$10,000/year', scholarshipEligible: false, matchScore: 89, careerOutcomes: ['Business Analyst', 'Data Analyst', 'Consultant', 'Strategy Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs'], description: 'An affordable analytics programme in Toronto, Canada\'s financial capital, with strong industry connections and practical project-based learning.', image: IMG.campus1 },
      { name: 'MS AI', university: 'University of Alberta', city: 'Edmonton, AB', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', degree: 'MS', duration: '2 Years', tuition: 'C$35,000', tuitionPer: 'year', intake: 'Sep 2025', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: "Bachelor's in CS or related with GPA 3.0+; strong math background", scholarship: 'Alberta AI Scholarship', scholarshipAmount: 'Up to C$20,000/year', scholarshipEligible: true, matchScore: 92, careerOutcomes: ['AI Researcher', 'ML Engineer', 'NLP Scientist', 'Robotics Engineer'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'Study AI at the home of Amii (Alberta Machine Intelligence Institute), one of the world\'s leading AI research centres, founded by reinforcement learning pioneer Rich Sutton.', image: IMG.campus2 },
    ],
  },
  scholarships: {
    label: 'SCHOLARSHIPS IN CANADA',
    title: 'Financial Support for Bangladeshi Students',
    button: 'Browse All Canada Scholarships',
    data: [
      { name: 'Vanier Canada Graduate Scholarship', university: 'Any Canadian University', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', amount: 'C$50,000/yr', eligibility: ['PhD', 'Research'], deadline: '2025-11-01', degree: 'PhD', international: true, source: 'Government of Canada' },
      { name: 'U of Toronto Lester B. Pearson Scholarship', university: 'University of Toronto', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', amount: 'Full Tuition + Books + Residence', eligibility: ['International', 'Merit'], deadline: '2025-11-30', degree: 'Undergraduate', international: true, source: 'University' },
      { name: 'McGill Major Entrance Scholarship', university: 'McGill University', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', amount: 'C$3,000-$12,000/yr', eligibility: ['International', 'Merit'], deadline: '2025-12-01', degree: 'Masters', international: true, source: 'University' },
      { name: 'Canada-ASEAN Scholarships', university: 'Any Canadian University', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', amount: 'Full Tuition + Living', eligibility: ['ASEAN Nationals', 'Bangladeshi'], deadline: '2025-03-31', degree: 'Masters / Short Courses', international: true, source: 'Government of Canada' },
    ],
  },
  cost: {
    label: 'COST OF LIVING',
    title: 'Estimated Annual Budget for Canada Students',
    items: [
      { icon: 'GraduationCap', label: 'Tuition Fees', amount: 'C$15,000 - C$40,000' },
      { icon: 'Building2', label: 'Accommodation', amount: 'C$8,000 - C$16,000' },
      { icon: 'ShoppingCart', label: 'Food & Groceries', amount: 'C$3,600 - C$5,400' },
      { icon: 'Bus', label: 'Transport', amount: 'C$1,200 - C$2,400' },
      { icon: 'Stethoscope', label: 'Health Insurance', amount: 'C$600 - C$900' },
      { icon: 'FileText', label: 'Visa & Study Permit', amount: 'C$235 - C$475' },
      { icon: 'BookOpen', label: 'Books & Materials', amount: 'C$500 - C$1,200' },
      { icon: 'Heart', label: 'Personal Expenses', amount: 'C$2,400 - C$4,800' },
    ],
    summaryLow: 'C$31,535',
    summaryHigh: 'C$71,375',
    currency: 'C$',
  },
  visa: {
    label: 'VISA INFORMATION',
    title: 'Canada Study Permit for Bangladeshi Students',
    requirements: [
      'Valid passport (at least 6 months beyond intended stay)',
      'Letter of Acceptance (LOA) from a Designated Learning Institution (DLI)',
      'Proof of funds for first year tuition + C$20,635 living costs (GIC accepted)',
      'IELTS or TOEFL score meeting university and visa requirements',
      'Statement of Purpose explaining study plans and ties to home country',
      'Medical examination from an IRCC-approved panel physician',
    ],
    steps: [
      { num: 1, title: 'Get LOA', desc: 'Receive your Letter of Acceptance from a Designated Learning Institution (DLI) in Canada' },
      { num: 2, title: 'Prepare Documents', desc: 'Gather passport, LOA, financial proof (GIC or bank statements), IELTS scores, and medical exam results' },
      { num: 3, title: 'Apply Online', desc: 'Submit your study permit application online through the IRCC portal with all required documents' },
      { num: 4, title: 'Biometrics', desc: 'Give biometrics (fingerprints and photo) at the nearest VAC in Dhaka within 30 days of applying' },
      { num: 5, title: 'Submit Passport', desc: 'Submit your passport to the Visa Application Centre after receiving the biometrics instruction letter' },
      { num: 6, title: 'Receive Permit', desc: 'Get your Letter of Introduction (study permit approval) — present it at the port of entry in Canada' },
      { num: 7, title: 'Arrive in Canada', desc: 'Enter Canada and receive your actual study permit at the port of entry from a CBSA officer' },
    ],
  },
  intakes: {
    label: 'INTAKE DATES',
    title: 'Canada University Intake Deadlines',
    data: [
      { name: 'September 2025', type: 'Primary', badgeColor: 'bg-alo-blue text-white', courses: 'All 15,000+ programmes', deadline: 'January – March 2025', prepStart: 'September 2024' },
      { name: 'January 2026', type: 'Secondary', badgeColor: 'bg-alo-orange text-white', courses: 'Limited programmes (\u22488,000)', deadline: 'August – October 2025', prepStart: 'April 2025' },
      { name: 'May 2026', type: 'Limited', badgeColor: 'bg-alo-sunshine text-alo-black', courses: 'Very limited (\u22483,000)', deadline: 'December 2025 – February 2026', prepStart: 'August 2025' },
    ],
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently Asked Questions About Studying in Canada',
    items: [
      { q: 'What is the minimum IELTS score for Canadian universities?', a: 'Most universities require IELTS 6.0-7.0 overall. Top programmes like Computer Science and MBA may require 7.0-7.5. Some universities also accept Duolingo (105-120).' },
      { q: 'How much bank balance do I need for a Canada study permit?', a: 'You need to show proof of funds for first-year tuition plus C$20,635 for living costs. A GIC (Guaranteed Investment Certificate) of C$20,635 is a widely accepted method.' },
      { q: 'What is PGWP and how long is it valid?', a: 'The Post-Graduation Work Permit (PGWP) allows you to work in Canada after graduation. Its length matches your programme duration: 8-12 month programmes get 8-12 months, 2+ year programmes get up to 3 years.' },
      { q: 'Can I get Permanent Residency after studying in Canada?', a: 'Yes, PGWP holders can transition to PR through Express Entry (CEC category) or Provincial Nominee Programs. Most graduates can get PR within 1-2 years of working.' },
      { q: 'Can I work while studying in Canada?', a: 'Yes, international students can work on-campus or off-campus up to 20 hours/week during term time and full-time during scheduled breaks. No separate work permit needed.' },
      { q: 'What is a DLI and why does it matter?', a: 'A Designated Learning Institution (DLI) is a school approved by the Canadian government to host international students. You must attend a DLI to be eligible for a study permit and PGWP.' },
      { q: 'How long does the Canada study permit process take?', a: 'Processing typically takes 4-8 weeks for Bangladeshi applicants. Biometrics and medical exams can add 1-3 weeks. Apply at least 3-4 months before your programme starts.' },
      { q: 'Is it cheaper to study in Canada than the US or UK?', a: 'Yes, Canadian tuition is generally 30-50% lower than US universities and comparable to or lower than the UK. Additionally, the shorter time to PR makes the overall investment very attractive.' },
    ],
  },
  relatedCountries: [
    { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', stat: '500+ Universities', image: '/images/cards/uk.png' },
    { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', stat: '4,000+ Universities', image: '/images/cards/usa.png' },
    { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', stat: '45+ Universities', image: '/images/cards/australia.png' },
    { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', stat: '30+ Universities', image: '/images/cards/ireland.png' },
  ],
  cta: {
    title: 'Ready to Study in Canada?',
    subtitle: 'Get personalized guidance from our expert Canada counsellors. Free consultation, no obligations.',
    ctaPrimary: 'Find Canada Courses',
    ctaSecondary: 'Talk to Canada Expert',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   AUSTRALIA CONFIG
   ═══════════════════════════════════════════════════════════════════════════════ */

const AUSTRALIA: CountryPageConfig = {
  slug: 'australia',
  name: 'Australia',
  shortName: 'Australia',
  flag: '\u{1F1E6}\u{1F1FA}',
  heroImage: '/images/alo/countries/australia-landscape.webp',
  hero: {
    badge: '\u{1F1E6}\u{1F1FA} Top 5 Global Education Destination',
    title: 'Study in Australia',
    subtitle: 'World-class Group of Eight universities, generous post-study work rights, and an unmatched lifestyle. Your Australian adventure starts here.',
    ctaPrimary: 'Find My Course',
    ctaSecondary: 'Talk to an Expert',
    trustIndicators: ['45+ Partner Universities', '2-4 Year Post-Study Visa', 'A$20K-45K Average Tuition', 'IELTS 6.0+ Required'],
  },
  intelligence: {
    label: 'COUNTRY INTELLIGENCE',
    title: 'Australia at a Glance',
    cards: [
      { icon: 'GraduationCap', label: 'Universities', value: '45+', countUp: { end: 45 } },
      { icon: 'BookOpen', label: 'Programmes', value: '22,000+', countUp: { end: 22000, format: true } },
      { icon: 'DollarSign', label: 'Average Tuition', value: 'A$20,000-45,000/yr' },
      { icon: 'Calendar', label: 'Popular Intakes', value: 'Feb/Mar 2026, Jul 2025' },
      { icon: 'Award', label: 'Scholarships', value: 'A$10,000-40,000' },
      { icon: 'Languages', label: 'English Requirement', value: 'IELTS 6.0-7.0' },
    ],
  },
  whyStudy: {
    label: 'WHY STUDY IN AUSTRALIA',
    title: '6 Reasons to Choose Australia for Your Degree',
    reasons: [
      { title: 'Post-Study Rights', shortDesc: 'Temporary Graduate Visa 2-4 years', icon: 'Globe', color: 'blue', details: ['Temporary Graduate Visa (Subclass 485) allows 2-4 years of work after graduation', 'Bachelor\'s graduates get 2 years, Masters by coursework get 2-3 years, Masters by research get 3-4 years', 'No employer sponsorship required — work in any field', 'Clear pathway to employer-sponsored and skilled migration visas'] },
      { title: 'World-Class Quality', shortDesc: 'Group of Eight research-intensive universities', icon: 'Briefcase', color: 'orange', details: ['7 Australian universities rank in the global top 100 (QS 2025)', 'The Group of Eight represents Australia\'s leading research universities', 'Australian qualifications are recognised in over 180 countries', 'Strong focus on practical, industry-relevant education'] },
      { title: 'Amazing Lifestyle', shortDesc: 'Beautiful beaches, cities & climate', icon: 'Shield', color: 'blue', details: ['Australia has 5 of the world\'s most liveable cities (Melbourne, Sydney, Brisbane, Adelaide, Perth)', 'Stunning natural beauty — beaches, rainforests, and the Outback', 'Warm climate year-round with outdoor lifestyle and sports culture', 'Safe, friendly, and welcoming multicultural society'] },
      { title: 'Research Excellence', shortDesc: 'Global leader in many research fields', icon: 'Award', color: 'orange', details: ['Australia produces 3.5% of the world\'s research output with only 0.3% of the population', 'World-leading research in medicine, environmental science, and mining engineering', 'Strong government funding for university research and innovation', '15 Australian researchers have won Nobel Prizes'] },
      { title: 'Scholarships', shortDesc: 'Government & university funding available', icon: 'Clock', color: 'blue', details: ['Australia Awards Scholarship provides full funding for students from developing countries', 'Melbourne Graduate Research Scholarship covers tuition + living stipend', 'Most universities offer international student scholarships of A$5,000-A$30,000/year', 'ALO Education helps identify and apply for the best available scholarships'] },
      { title: 'Work Rights', shortDesc: 'Work 48 hours/fortnight during studies', icon: 'Users', color: 'orange', details: ['International students can work up to 48 hours per fortnight during term time', 'Unlimited work hours during scheduled course breaks', 'Minimum wage of A$24.10/hour ensures fair compensation', 'Many universities offer part-time and casual work opportunities on campus'] },
    ],
  },
  universities: {
    label: 'TOP AUSTRALIA UNIVERSITIES',
    title: 'Featured Australia Universities',
    button: 'View All Australia Universities',
    data: [
      { name: 'University of Melbourne', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#13', courses: '400+', tuitionRange: 'A$38K-$55K', scholarships: '50+', subjects: ['Computer Science', 'Engineering', 'Medicine', 'Law', 'Business'], matchScore: 98, image: IMG.campus1 },
      { name: 'University of Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#18', courses: '450+', tuitionRange: 'A$42K-$56K', scholarships: '45+', subjects: ['Medicine', 'Engineering', 'Business', 'Law', 'Arts'], matchScore: 96, image: IMG.campus2 },
      { name: 'Australian National University', city: 'Canberra, ACT', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#30', courses: '300+', tuitionRange: 'A$40K-$54K', scholarships: '55+', subjects: ['Politics', 'Sciences', 'Engineering', 'Law', 'Arts'], matchScore: 95, image: IMG.campus3 },
      { name: 'UNSW Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#19', courses: '400+', tuitionRange: 'A$40K-$55K', scholarships: '40+', subjects: ['Engineering', 'Computer Science', 'Business', 'Design', 'Sciences'], matchScore: 94, image: IMG.campus4 },
      { name: 'Monash University', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#37', courses: '350+', tuitionRange: 'A$35K-$50K', scholarships: '35+', subjects: ['Medicine', 'Engineering', 'Business', 'Pharmacy', 'Arts'], matchScore: 92, image: IMG.campus1 },
      { name: 'University of Queensland', city: 'Brisbane, QLD', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#40', courses: '400+', tuitionRange: 'A$36K-$50K', scholarships: '40+', subjects: ['Sciences', 'Engineering', 'Medicine', 'Business', 'Biotechnology'], matchScore: 91, image: IMG.campus2 },
    ],
    drawerData: [
      { name: 'University of Melbourne', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#13', rankingSource: 'QS 2025', students: '52,000+', courses: '400+', tuitionRange: 'A$38,000 - A$55,000', scholarships: '50+', accommodation: 'From A$10,000/year for university housing. Off-campus shared apartments from A$180/week in Melbourne.', subjects: ['Computer Science', 'Engineering', 'Medicine', 'Law', 'Business'], description: 'Australia\'s #1 university, located in the world\'s most liveable city. Renowned for research excellence and a vibrant campus life.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS Computer Science', degree: 'MS', tuition: 'A$45,000/yr' }, { name: 'MS Engineering', degree: 'MS', tuition: 'A$44,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'A$43,000/yr' }] },
      { name: 'University of Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#18', rankingSource: 'QS 2025', students: '63,000+', courses: '450+', tuitionRange: 'A$42,000 - A$56,000', scholarships: '45+', accommodation: 'From A$12,000/year on campus. Sydney shared apartments from A$220/week.', subjects: ['Medicine', 'Engineering', 'Business', 'Law', 'Arts'], description: 'Australia\'s oldest university and a member of the Group of Eight, located in the heart of Sydney with iconic harbour views.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MBA', degree: 'MBA', tuition: 'A$56,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'A$48,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'A$46,000/yr' }] },
      { name: 'Australian National University', city: 'Canberra, ACT', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#30', rankingSource: 'QS 2025', students: '26,000+', courses: '300+', tuitionRange: 'A$40,000 - A$54,000', scholarships: '55+', accommodation: 'From A$9,000/year on campus. Canberra shared housing from A$150/week.', subjects: ['Politics', 'Sciences', 'Engineering', 'Law', 'Arts'], description: 'Australia\'s national university, consistently ranked #1 in Australia for research. Located in the capital city with strong government connections.', campusImage: IMG.campus3, logo: '', featuredCourses: [{ name: 'MS Data Science', degree: 'MS', tuition: 'A$42,000/yr' }, { name: 'MS Engineering', degree: 'MS', tuition: 'A$43,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'A$45,000/yr' }] },
      { name: 'UNSW Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#19', rankingSource: 'QS 2025', students: '63,000+', courses: '400+', tuitionRange: 'A$40,000 - A$55,000', scholarships: '40+', accommodation: 'From A$11,000/year on campus. Sydney shared apartments from A$200/week.', subjects: ['Engineering', 'Computer Science', 'Business', 'Design', 'Sciences'], description: 'One of Australia\'s leading research and teaching universities, UNSW is a powerhouse in engineering, computer science, and business.', campusImage: IMG.campus4, logo: '', featuredCourses: [{ name: 'MS Engineering', degree: 'MS', tuition: 'A$48,000/yr' }, { name: 'MS Computer Science', degree: 'MS', tuition: 'A$47,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: 'A$55,000/yr' }] },
      { name: 'Monash University', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#37', rankingSource: 'QS 2025', students: '56,000+', courses: '350+', tuitionRange: 'A$35,000 - A$50,000', scholarships: '35+', accommodation: 'From A$9,500/year on campus. Melbourne shared apartments from A$170/week.', subjects: ['Medicine', 'Engineering', 'Business', 'Pharmacy', 'Arts'], description: 'Australia\'s largest university with a global footprint, Monash is known for its innovative programmes and strong industry partnerships.', campusImage: IMG.campus1, logo: '', featuredCourses: [{ name: 'MS IT', degree: 'MS', tuition: 'A$38,000/yr' }, { name: 'MS Engineering', degree: 'MS', tuition: 'A$40,000/yr' }, { name: 'MBA', degree: 'MBA', tuition: 'A$50,000/yr' }] },
      { name: 'University of Queensland', city: 'Brisbane, QLD', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', ranking: '#40', rankingSource: 'QS 2025', students: '54,000+', courses: '400+', tuitionRange: 'A$36,000 - A$50,000', scholarships: '40+', accommodation: 'From A$8,500/year on campus. Brisbane shared apartments from A$160/week.', subjects: ['Sciences', 'Engineering', 'Medicine', 'Business', 'Biotechnology'], description: 'A Group of Eight university in sunny Brisbane, UQ is a world leader in biotechnology, environmental sciences, and tropical medicine.', campusImage: IMG.campus2, logo: '', featuredCourses: [{ name: 'MS Biotechnology', degree: 'MS', tuition: 'A$40,000/yr' }, { name: 'MS Engineering', degree: 'MS', tuition: 'A$42,000/yr' }, { name: 'MS Data Science', degree: 'MS', tuition: 'A$41,000/yr' }] },
    ],
  },
  courses: {
    label: 'POPULAR COURSES',
    title: 'Top Courses for Bangladeshi Students in Australia',
    button: 'Browse All Australia Courses',
    data: [
      { name: 'MS Computer Science', university: 'University of Melbourne', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$45,000/yr', intake: 'Feb/Mar 2026', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 98, image: IMG.campus1 },
      { name: 'MBA', university: 'University of Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$56,000/yr', intake: 'Feb/Mar 2026', ielts: '7.0', duration: '2 Years', scholarship: true, matchScore: 95, image: IMG.campus2 },
      { name: 'MS Data Science', university: 'Australian National University', city: 'Canberra, ACT', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$42,000/yr', intake: 'Feb/Mar 2026', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 94, image: IMG.campus3 },
      { name: 'MS Engineering', university: 'UNSW Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$48,000/yr', intake: 'Feb/Mar 2026', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 93, image: IMG.campus4 },
      { name: 'MS IT', university: 'Monash University', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$38,000/yr', intake: 'Feb/Mar 2026', ielts: '6.5', duration: '2 Years', scholarship: false, matchScore: 90, image: IMG.campus1 },
      { name: 'MS Biotechnology', university: 'University of Queensland', city: 'Brisbane, QLD', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', tuition: 'A$40,000/yr', intake: 'Feb/Mar 2026', ielts: '6.5', duration: '2 Years', scholarship: true, matchScore: 91, image: IMG.campus2 },
    ],
    drawerData: [
      { name: 'MS Computer Science', university: 'University of Melbourne', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MS', duration: '2 Years', tuition: 'A$45,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 79', academicReq: "Bachelor's in CS or related with GPA 3.0+", scholarship: 'Melbourne Graduate Scholarship', scholarshipAmount: 'Up to A$25,000/year', scholarshipEligible: true, matchScore: 98, careerOutcomes: ['Software Engineer', 'ML Engineer', 'Data Scientist', 'Systems Architect'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'Australia\'s top CS programme at its #1 university, offering specialisations in AI, distributed systems, and human-computer interaction.', image: IMG.campus1 },
      { name: 'MBA', university: 'University of Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MBA', duration: '2 Years', tuition: 'A$56,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '7.0 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 100', academicReq: "Bachelor's + 3 years work experience; GMAT/GRE recommended", scholarship: 'Sydney Scholars MBA Award', scholarshipAmount: 'Up to A$30,000/year', scholarshipEligible: true, matchScore: 95, careerOutcomes: ['Management Consultant', 'Investment Banker', 'Product Manager', 'Entrepreneur'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs', 'GMAT/GRE'], description: 'A prestigious MBA from Australia\'s oldest university, with strong connections to Sydney\'s business and finance industry.', image: IMG.campus2 },
      { name: 'MS Data Science', university: 'Australian National University', city: 'Canberra, ACT', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MS', duration: '2 Years', tuition: 'A$42,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 80', academicReq: "Bachelor's in quantitative field with GPA 3.0+", scholarship: 'ANU Chancellor\'s Scholarship', scholarshipAmount: 'Up to A$25,000/year', scholarshipEligible: true, matchScore: 94, careerOutcomes: ['Data Scientist', 'ML Engineer', 'Analytics Manager', 'Research Analyst'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'A rigorous data science programme at Australia\'s top-ranked research university, combining statistics, machine learning, and data engineering.', image: IMG.campus3 },
      { name: 'MS Engineering', university: 'UNSW Sydney', city: 'Sydney, NSW', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MS', duration: '2 Years', tuition: 'A$48,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 90', academicReq: "Bachelor's in Engineering with GPA 3.0+", scholarship: 'UNSW International Scholarship', scholarshipAmount: 'Up to A$20,000/year', scholarshipEligible: true, matchScore: 93, careerOutcomes: ['Engineering Manager', 'Systems Engineer', 'Technical Lead', 'Project Engineer'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'One of Australia\'s top engineering programmes at a leading Group of Eight university with strong industry partnerships and research facilities.', image: IMG.campus4 },
      { name: 'MS IT', university: 'Monash University', city: 'Melbourne, VIC', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MS', duration: '2 Years', tuition: 'A$38,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 79', academicReq: "Bachelor's in IT or related with GPA 2.8+", scholarship: 'Monash International Merit Scholarship', scholarshipAmount: 'Up to A$10,000/year', scholarshipEligible: false, matchScore: 90, careerOutcomes: ['IT Consultant', 'Systems Analyst', 'Software Developer', 'Network Engineer'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '2 LORs'], description: 'A flexible IT programme at one of Australia\'s largest universities, with specialisations in AI, cybersecurity, and software engineering.', image: IMG.campus1 },
      { name: 'MS Biotechnology', university: 'University of Queensland', city: 'Brisbane, QLD', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', degree: 'MS', duration: '2 Years', tuition: 'A$40,000', tuitionPer: 'year', intake: 'Feb/Mar 2026', ieltsScore: '6.5 (no band below 6.0)', ieltsType: 'IELTS Academic / TOEFL 80', academicReq: "Bachelor's in Science or related with GPA 3.0+", scholarship: 'UQ International Scholarship', scholarshipAmount: 'Up to A$15,000/year', scholarshipEligible: true, matchScore: 91, careerOutcomes: ['Biotech Researcher', 'Clinical Scientist', 'Pharma Analyst', 'Lab Manager'], documents: ['Passport', 'Transcripts', 'Degree Certificate', 'IELTS/TOEFL', 'SOP', 'CV/Resume', '3 LORs'], description: 'A world-class biotechnology programme at Australia\'s leading life sciences university, with access to cutting-edge labs and industry partnerships.', image: IMG.campus2 },
    ],
  },
  scholarships: {
    label: 'SCHOLARSHIPS IN AUSTRALIA',
    title: 'Financial Support for Bangladeshi Students',
    button: 'Browse All Australia Scholarships',
    data: [
      { name: 'Australia Awards Scholarship', university: 'Any Australian University', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', amount: 'Full Tuition + Living + Travel', eligibility: ['Developing Countries', 'Bangladeshi'], deadline: '2025-04-30', degree: 'Masters / PhD', international: true, source: 'Australian Government' },
      { name: 'Melbourne Graduate Research Scholarship', university: 'University of Melbourne', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', amount: 'Full Tuition + A$35,000 Stipend', eligibility: ['Research', 'Merit'], deadline: '2025-10-31', degree: 'Masters / PhD', international: true, source: 'University' },
      { name: 'Sydney Scholars Awards', university: 'University of Sydney', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', amount: 'A$6,000/yr', eligibility: ['International', 'Merit'], deadline: '2025-09-30', degree: 'Masters', international: true, source: 'University' },
      { name: 'Destination Australia Scholarship', university: 'Regional Australian Universities', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', amount: 'A$15,000/yr', eligibility: ['Regional', 'International'], deadline: 'Varies by University', degree: 'Masters / PhD', international: true, source: 'Australian Government' },
    ],
  },
  cost: {
    label: 'COST OF LIVING',
    title: 'Estimated Annual Budget for Australia Students',
    items: [
      { icon: 'GraduationCap', label: 'Tuition Fees', amount: 'A$20,000 - A$45,000' },
      { icon: 'Building2', label: 'Accommodation', amount: 'A$10,000 - A$20,000' },
      { icon: 'ShoppingCart', label: 'Food & Groceries', amount: 'A$5,000 - A$8,000' },
      { icon: 'Bus', label: 'Transport', amount: 'A$1,500 - A$3,000' },
      { icon: 'Stethoscope', label: 'Health Insurance (OSHC)', amount: 'A$600' },
      { icon: 'FileText', label: 'Visa (Subclass 500)', amount: 'A$650' },
      { icon: 'BookOpen', label: 'Books & Materials', amount: 'A$500 - A$1,000' },
      { icon: 'Heart', label: 'Personal Expenses', amount: 'A$3,000 - A$6,000' },
    ],
    summaryLow: 'A$40,750',
    summaryHigh: 'A$84,650',
    currency: 'A$',
  },
  visa: {
    label: 'VISA INFORMATION',
    title: 'Australia Student Visa (Subclass 500) for Bangladeshi Students',
    requirements: [
      'Valid passport (at least 6 months beyond intended stay)',
      'Confirmation of Enrolment (CoE) from an Australian university',
      'Proof of funds for tuition + A$24,505/year living costs (GIC accepted)',
      'IELTS or TOEFL score meeting both university and visa requirements',
      'Overseas Student Health Cover (OSHC) for the duration of your stay',
      'Genuine Temporary Entrant (GTE) statement or Genuine Student (GS) requirement',
    ],
    steps: [
      { num: 1, title: 'Get CoE', desc: 'Receive your Confirmation of Enrolment from the Australian university after accepting your offer and paying deposit' },
      { num: 2, title: 'Buy OSHC', desc: 'Purchase Overseas Student Health Cover from an approved provider (Allianz, Bupa, Medibank, etc.)' },
      { num: 3, title: 'Prepare Documents', desc: 'Gather passport, CoE, OSHC, financial proof, IELTS scores, and GTE/GS statement' },
      { num: 4, title: 'Apply Online', desc: 'Submit your student visa (Subclass 500) application online through ImmiAccount with all documents' },
      { num: 5, title: 'Biometrics', desc: 'Provide biometrics (fingerprints and photo) at the Australian Visa Application Centre in Dhaka' },
      { num: 6, title: 'Health Examination', desc: 'Complete a medical examination with a panel physician approved by the Australian government' },
      { num: 7, title: 'Receive Visa Grant', desc: 'Get your visa grant letter — you can travel to Australia up to 90 days before your course starts' },
    ],
  },
  intakes: {
    label: 'INTAKE DATES',
    title: 'Australia University Intake Deadlines',
    data: [
      { name: 'February/March 2026', type: 'Primary', badgeColor: 'bg-alo-blue text-white', courses: 'All 22,000+ programmes', deadline: 'October – December 2025', prepStart: 'June 2025' },
      { name: 'July 2025', type: 'Secondary', badgeColor: 'bg-alo-orange text-white', courses: 'Limited programmes (\u224812,000)', deadline: 'March – May 2025', prepStart: 'December 2024' },
      { name: 'November 2025', type: 'Limited', badgeColor: 'bg-alo-sunshine text-alo-black', courses: 'Very limited (\u22484,000)', deadline: 'July – September 2025', prepStart: 'April 2025' },
    ],
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently Asked Questions About Studying in Australia',
    items: [
      { q: 'What is the minimum IELTS score for Australian universities?', a: 'Most universities require IELTS 6.0-6.5 overall for Masters. Top programmes and professional degrees (like MBA) may require 7.0. Some accept Duolingo (105-120).' },
      { q: 'How much does it cost to study in Australia for Bangladeshi students?', a: 'Annual costs range from A$40,000-A$85,000 including tuition (A$20K-A$45K), accommodation (A$10K-A$20K), and living expenses. Sydney and Melbourne are more expensive than other cities.' },
      { q: 'What is the Temporary Graduate Visa (Subclass 485)?', a: 'The 485 visa allows you to stay and work in Australia after graduation. Bachelor\'s graduates get 2 years, coursework Masters get 2-3 years, and research Masters/PhD get 3-4 years.' },
      { q: 'Can I work while studying in Australia?', a: 'Yes, international students can work up to 48 hours per fortnight during term time and unlimited hours during scheduled breaks. The minimum wage is A$24.10/hour.' },
      { q: 'What is OSHC and is it mandatory?', a: 'Overseas Student Health Cover (OSHC) is mandatory for all student visa holders. It covers medical and hospital expenses and costs approximately A$500-600/year.' },
      { q: 'How long does the Australia student visa process take?', a: 'Processing typically takes 4-8 weeks for Bangladeshi applicants. The GTE/GS assessment and health examination can add 2-4 weeks. Apply at least 3-4 months before your course starts.' },
      { q: 'Can I get PR after studying in Australia?', a: 'Yes, the pathway is Student Visa \u2192 Temporary Graduate Visa (485) \u2192 Skilled Independent Visa (189) or Employer-Sponsored (186). The process typically takes 2-4 years after graduation.' },
      { q: 'What is the Group of Eight (Go8)?', a: 'The Group of Eight represents Australia\'s eight leading research-intensive universities: Melbourne, Sydney, ANU, UNSW, Queensland, Monash, Western Australia, and Adelaide. They are consistently ranked in the global top 100.' },
    ],
  },
  relatedCountries: [
    { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', stat: '500+ Universities', image: '/images/cards/uk.png' },
    { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', stat: '4,000+ Universities', image: '/images/cards/usa.png' },
    { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', stat: '100+ Universities', image: '/images/cards/canada.png' },
    { name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', stat: '8+ Universities', image: '/images/cards/new-zealand.png' },
  ],
  cta: {
    title: 'Ready to Study in Australia?',
    subtitle: 'Get personalized guidance from our expert Australia counsellors. Free consultation, no obligations.',
    ctaPrimary: 'Find Australia Courses',
    ctaSecondary: 'Talk to Australia Expert',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════════ */

export const COUNTRY_CONFIGS: Record<string, CountryPageConfig> = {
  uk: UK,
  usa: USA,
  canada: CANADA,
  australia: AUSTRALIA,
};

export function getCountryConfig(slug: string): CountryPageConfig | undefined {
  return COUNTRY_CONFIGS[slug];
}

export function getAvailableCountrySlugs(): string[] {
  return Object.keys(COUNTRY_CONFIGS);
}
