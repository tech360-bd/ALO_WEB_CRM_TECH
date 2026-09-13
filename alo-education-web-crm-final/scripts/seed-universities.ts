// Standalone seed script — run with: npx tsx scripts/seed-universities.ts
import { PrismaClient } from '@prisma/client';
import { ukUniversitiesPart1 } from '../src/lib/university-data-uk';
import { ukUniversitiesPart2 } from '../src/lib/university-data-uk2';
import {
  usUniversities, canadaUniversities, australiaUniversities,
  germanyUniversities, malaysiaUniversities, newZealandUniversities,
  irelandUniversities, netherlandsUniversities,
} from '../src/lib/university-data-intl';

const db = new PrismaClient();

interface CourseTemplate {
  courseTitle: string; studyLevel: string; programLevel: string;
  disciplineArea: string; durationMonths: number;
}

const courseMap: Record<string, CourseTemplate[]> = {
  'Computer Science': [
    { courseTitle: 'BSc (Hons) Computer Science', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Computing', durationMonths: 36 },
    { courseTitle: 'MSc Computer Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MSc Advanced Computer Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MRes Computer Science', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Computing', durationMonths: 24 },
    { courseTitle: 'PhD Computer Science', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Computing', durationMonths: 48 },
  ],
  'Data Science': [
    { courseTitle: 'BSc (Hons) Data Science', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Computing', durationMonths: 36 },
    { courseTitle: 'MSc Data Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MSc Big Data Analytics', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MRes Data Science', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Computing', durationMonths: 24 },
    { courseTitle: 'PhD Data Science and AI', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Computing', durationMonths: 48 },
  ],
  'Artificial Intelligence': [
    { courseTitle: 'BSc (Hons) Artificial Intelligence', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Computing', durationMonths: 36 },
    { courseTitle: 'MSc Artificial Intelligence', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MSc Machine Learning', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Computing', durationMonths: 12 },
    { courseTitle: 'MRes Artificial Intelligence', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Computing', durationMonths: 24 },
    { courseTitle: 'PhD Artificial Intelligence', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Computing', durationMonths: 48 },
  ],
  'Business & Management': [
    { courseTitle: 'BA (Hons) Business Management', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Business', durationMonths: 36 },
    { courseTitle: 'BSc (Hons) Business Administration', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Business', durationMonths: 36 },
    { courseTitle: 'MBA', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MSc Management', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MSc International Business', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MRes Business and Management', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Business', durationMonths: 24 },
    { courseTitle: 'PhD Business Administration', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Business', durationMonths: 48 },
    { courseTitle: 'PhD Management', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Business', durationMonths: 48 },
  ],
  'Engineering': [
    { courseTitle: 'BEng (Hons) Engineering', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Engineering', durationMonths: 36 },
    { courseTitle: 'MEng (Hons) Engineering', studyLevel: 'Undergraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 48 },
    { courseTitle: 'MSc Engineering', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 12 },
    { courseTitle: 'MRes Engineering', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Engineering', durationMonths: 24 },
    { courseTitle: 'PhD Engineering', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Engineering', durationMonths: 48 },
  ],
  'Mechanical Engineering': [
    { courseTitle: 'BEng (Hons) Mechanical Engineering', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Engineering', durationMonths: 36 },
    { courseTitle: 'MEng (Hons) Mechanical Engineering', studyLevel: 'Undergraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 48 },
    { courseTitle: 'MSc Mechanical Engineering', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 12 },
    { courseTitle: 'MRes Mechanical Engineering', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Engineering', durationMonths: 24 },
    { courseTitle: 'PhD Mechanical Engineering', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Engineering', durationMonths: 48 },
  ],
  'Electrical Engineering': [
    { courseTitle: 'BEng (Hons) Electrical Engineering', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Engineering', durationMonths: 36 },
    { courseTitle: 'MEng (Hons) Electrical Engineering', studyLevel: 'Undergraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 48 },
    { courseTitle: 'MSc Electrical Engineering', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 12 },
    { courseTitle: 'MRes Electrical Engineering', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Engineering', durationMonths: 24 },
    { courseTitle: 'PhD Electrical Engineering', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Engineering', durationMonths: 48 },
  ],
  'Civil Engineering': [
    { courseTitle: 'BEng (Hons) Civil Engineering', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Engineering', durationMonths: 36 },
    { courseTitle: 'MEng (Hons) Civil Engineering', studyLevel: 'Undergraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 48 },
    { courseTitle: 'MSc Civil Engineering', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Engineering', durationMonths: 12 },
    { courseTitle: 'MRes Civil Engineering', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Engineering', durationMonths: 24 },
    { courseTitle: 'PhD Civil Engineering', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Engineering', durationMonths: 48 },
  ],
  'Medicine': [
    { courseTitle: 'MBBS Medicine', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Medicine & Health', durationMonths: 60 },
    { courseTitle: 'MSc Medical Sciences', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Medicine & Health', durationMonths: 12 },
    { courseTitle: 'MRes Medical Research', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Medicine & Health', durationMonths: 24 },
    { courseTitle: 'PhD Medical Sciences', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Medicine & Health', durationMonths: 48 },
  ],
  'Nursing': [
    { courseTitle: 'BSc (Hons) Nursing', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Medicine & Health', durationMonths: 36 },
    { courseTitle: 'MSc Nursing', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Medicine & Health', durationMonths: 12 },
    { courseTitle: 'MRes Nursing', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Medicine & Health', durationMonths: 24 },
    { courseTitle: 'PhD Nursing', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Medicine & Health', durationMonths: 48 },
  ],
  'Pharmacy': [
    { courseTitle: 'MPharm Pharmacy', studyLevel: 'Undergraduate', programLevel: "Master's", disciplineArea: 'Medicine & Health', durationMonths: 48 },
    { courseTitle: 'MSc Pharmacy', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Medicine & Health', durationMonths: 12 },
    { courseTitle: 'MRes Pharmacy', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Medicine & Health', durationMonths: 24 },
    { courseTitle: 'PhD Pharmacy', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Medicine & Health', durationMonths: 48 },
  ],
  'Law': [
    { courseTitle: 'LLB (Hons) Law', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Law', durationMonths: 36 },
    { courseTitle: 'LLM International Law', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Law', durationMonths: 12 },
    { courseTitle: 'LLM Commercial Law', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Law', durationMonths: 12 },
    { courseTitle: 'MRes Law', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Law', durationMonths: 24 },
    { courseTitle: 'PhD Law', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Law', durationMonths: 48 },
  ],
  'Finance & Accounting': [
    { courseTitle: 'BSc (Hons) Accounting and Finance', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Business', durationMonths: 36 },
    { courseTitle: 'MSc Finance', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MSc Accounting and Finance', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MRes Finance', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Business', durationMonths: 24 },
    { courseTitle: 'PhD Finance', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Business', durationMonths: 48 },
  ],
  'Economics': [
    { courseTitle: 'BSc (Hons) Economics', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Social Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Economics', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Economics', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Social Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Economics', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Social Sciences', durationMonths: 48 },
  ],
  'Psychology': [
    { courseTitle: 'BSc (Hons) Psychology', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Social Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Psychology', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MSc Clinical Psychology', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Psychology', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Social Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Psychology', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Social Sciences', durationMonths: 48 },
  ],
  'Architecture': [
    { courseTitle: 'BArch Architecture', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Architecture & Design', durationMonths: 36 },
    { courseTitle: 'MArch Architecture', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Architecture & Design', durationMonths: 24 },
    { courseTitle: 'MRes Architecture', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Architecture & Design', durationMonths: 24 },
    { courseTitle: 'PhD Architecture', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Architecture & Design', durationMonths: 48 },
  ],
  'Biology': [
    { courseTitle: 'BSc (Hons) Biology', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Life Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Biology', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Life Sciences', durationMonths: 12 },
    { courseTitle: 'MSc Biotechnology', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Life Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Biology', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Life Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Biology', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Life Sciences', durationMonths: 48 },
  ],
  'Chemistry': [
    { courseTitle: 'BSc (Hons) Chemistry', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Physical Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Chemistry', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Physical Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Chemistry', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Physical Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Chemistry', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Physical Sciences', durationMonths: 48 },
  ],
  'Physics': [
    { courseTitle: 'BSc (Hons) Physics', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Physical Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Physics', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Physical Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Physics', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Physical Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Physics', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Physical Sciences', durationMonths: 48 },
  ],
  'Mathematics': [
    { courseTitle: 'BSc (Hons) Mathematics', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Physical Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Mathematics', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Physical Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Mathematics', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Physical Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Mathematics', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Physical Sciences', durationMonths: 48 },
  ],
  'Political Science': [
    { courseTitle: 'BA (Hons) Political Science', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Social Sciences', durationMonths: 36 },
    { courseTitle: 'MA Political Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Political Science', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Social Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Political Science', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Social Sciences', durationMonths: 48 },
  ],
  'International Relations': [
    { courseTitle: 'BA (Hons) International Relations', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Social Sciences', durationMonths: 36 },
    { courseTitle: 'MA International Relations', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MRes International Relations', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Social Sciences', durationMonths: 24 },
    { courseTitle: 'PhD International Relations', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Social Sciences', durationMonths: 48 },
  ],
  'Sociology': [
    { courseTitle: 'BA (Hons) Sociology', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Social Sciences', durationMonths: 36 },
    { courseTitle: 'MA Sociology', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Social Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Sociology', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Social Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Sociology', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Social Sciences', durationMonths: 48 },
  ],
  'Media & Communications': [
    { courseTitle: 'BA (Hons) Media and Communications', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Media & Humanities', durationMonths: 36 },
    { courseTitle: 'MA Media and Communications', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Media & Humanities', durationMonths: 12 },
    { courseTitle: 'MRes Media Studies', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Media & Humanities', durationMonths: 24 },
    { courseTitle: 'PhD Media and Communications', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Media & Humanities', durationMonths: 48 },
  ],
  'Art & Design': [
    { courseTitle: 'BA (Hons) Fine Art', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Architecture & Design', durationMonths: 36 },
    { courseTitle: 'BA (Hons) Graphic Design', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Architecture & Design', durationMonths: 36 },
    { courseTitle: 'MA Fine Art', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Architecture & Design', durationMonths: 12 },
    { courseTitle: 'MRes Art and Design', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Architecture & Design', durationMonths: 24 },
    { courseTitle: 'PhD Art and Design', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Architecture & Design', durationMonths: 48 },
  ],
  'Education': [
    { courseTitle: 'BA (Hons) Education', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Education', durationMonths: 36 },
    { courseTitle: 'PGCE Education', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Education', durationMonths: 12 },
    { courseTitle: 'MSc Education', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Education', durationMonths: 12 },
    { courseTitle: 'MRes Education', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Education', durationMonths: 24 },
    { courseTitle: 'PhD Education', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Education', durationMonths: 48 },
  ],
  'Environmental Science': [
    { courseTitle: 'BSc (Hons) Environmental Science', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Life Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Environmental Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Life Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Environmental Science', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Life Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Environmental Science', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Life Sciences', durationMonths: 48 },
  ],
  'English Literature': [
    { courseTitle: 'BA (Hons) English Literature', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Media & Humanities', durationMonths: 36 },
    { courseTitle: 'MA English Literature', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Media & Humanities', durationMonths: 12 },
    { courseTitle: 'MRes English Literature', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Media & Humanities', durationMonths: 24 },
    { courseTitle: 'PhD English Literature', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Media & Humanities', durationMonths: 48 },
  ],
  'History': [
    { courseTitle: 'BA (Hons) History', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Media & Humanities', durationMonths: 36 },
    { courseTitle: 'MA History', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Media & Humanities', durationMonths: 12 },
    { courseTitle: 'MRes History', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Media & Humanities', durationMonths: 24 },
    { courseTitle: 'PhD History', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Media & Humanities', durationMonths: 48 },
  ],
  'Music': [
    { courseTitle: 'BA (Hons) Music', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Media & Humanities', durationMonths: 36 },
    { courseTitle: 'MA Music', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Media & Humanities', durationMonths: 12 },
    { courseTitle: 'MRes Music', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Media & Humanities', durationMonths: 24 },
    { courseTitle: 'PhD Music', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Media & Humanities', durationMonths: 48 },
  ],
  'Sports Science': [
    { courseTitle: 'BSc (Hons) Sports Science', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Life Sciences', durationMonths: 36 },
    { courseTitle: 'MSc Sports Science', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Life Sciences', durationMonths: 12 },
    { courseTitle: 'MRes Sports Science', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Life Sciences', durationMonths: 24 },
    { courseTitle: 'PhD Sports Science', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Life Sciences', durationMonths: 48 },
  ],
  'Hospitality & Tourism': [
    { courseTitle: 'BSc (Hons) Hospitality and Tourism Management', studyLevel: 'Undergraduate', programLevel: "Bachelor's", disciplineArea: 'Business', durationMonths: 36 },
    { courseTitle: 'MSc Hospitality and Tourism Management', studyLevel: 'Postgraduate', programLevel: "Master's", disciplineArea: 'Business', durationMonths: 12 },
    { courseTitle: 'MRes Tourism and Hospitality', studyLevel: 'Postgraduate Research', programLevel: 'MRes', disciplineArea: 'Business', durationMonths: 24 },
    { courseTitle: 'PhD Tourism Management', studyLevel: 'Postgraduate Research', programLevel: 'PhD', disciplineArea: 'Business', durationMonths: 48 },
  ],
};

function getCourses(subject: string, uniType: string): CourseTemplate[] {
  const templates = courseMap[subject];
  if (!templates) return [];
  if (['Specialized', 'Postgraduate'].includes(uniType)) {
    return templates.filter(t => t.studyLevel === 'Postgraduate' || t.studyLevel === 'Postgraduate Research');
  }
  return templates;
}

function getTuition(studyLevel: string, country: string, uniType: string): { cur: string; fee: number } {
  const curMap: Record<string, string> = {
    'United Kingdom': 'GBP', 'United States': 'USD', 'Canada': 'CAD',
    'Australia': 'AUD', 'Germany': 'EUR', 'Malaysia': 'MYR',
    'New Zealand': 'NZD', 'Ireland': 'EUR', 'Netherlands': 'EUR',
  };
  const cur = curMap[country] || 'GBP';
  const isTop = ['Russell Group', 'Ancient', 'Red Brick'].includes(uniType);
  const fees: Record<string, Record<string, [number, number]>> = {
    GBP: { UG: [15000, 35000], PG: [16000, 40000], PGR: [16000, 28000] },
    USD: { UG: [30000, 65000], PG: [25000, 70000], PGR: [25000, 55000] },
    CAD: { UG: [20000, 45000], PG: [18000, 50000], PGR: [15000, 35000] },
    AUD: { UG: [25000, 50000], PG: [22000, 52000], PGR: [20000, 40000] },
    EUR: { UG: [0, 3000], PG: [500, 5000], PGR: [0, 3000] },
    MYR: { UG: [20000, 60000], PG: [25000, 80000], PGR: [20000, 60000] },
    NZD: { UG: [25000, 40000], PG: [26000, 42000], PGR: [6500, 8000] },
  };
  const levelKey = studyLevel === 'Undergraduate' ? 'UG' : studyLevel === 'Postgraduate' ? 'PG' : 'PGR';
  const range = fees[cur]?.[levelKey] || [15000, 30000];
  let mid = (range[0] + range[1]) / 2;
  if (isTop) mid = range[1] * 0.9;
  return { cur, fee: Math.round(mid) };
}

function getReqs(programLevel: string, ieltsMin: number, uniType: string) {
  const isTop = ['Russell Group', 'Ancient', 'Red Brick'].includes(uniType);
  let ieltsOverall = ieltsMin;
  if (programLevel === "Master's") ieltsOverall = Math.max(ieltsMin, isTop ? 6.5 : 6.0);
  else if (programLevel === 'MRes' || programLevel === 'PhD') ieltsOverall = Math.max(ieltsMin, isTop ? 7.0 : 6.5);
  return {
    academicReq: programLevel === "Bachelor's"
      ? (isTop ? 'A-Level AAB-AAA or equivalent. IB 34-38 points.' : 'A-Level BBC-BBB or equivalent. IB 28-32 points.')
      : programLevel === 'PhD'
      ? (isTop ? 'Masters with merit/distinction. Research proposal. Publications preferred.' : 'Masters degree. Research proposal. Two academic references.')
      : (isTop ? 'Upper Second Class Honours (2:1) or equivalent. GPA 3.3+/4.0.' : 'Lower Second Class Honours (2:2) or equivalent. GPA 2.8+/4.0.'),
    gradingSystem: programLevel === "Bachelor's" ? 'UCAS Tariff / GPA' : 'UK Honours / GPA',
    minScore: programLevel === "Bachelor's" ? (isTop ? 'AAB' : 'BBC') : (isTop ? '2:1' : '2:2'),
    ieltsOverall,
    ieltsMinBand: Math.max(5.5, ieltsOverall - 0.5),
    pteOverall: ieltsOverall + 2,
    pteMinBand: Math.max(5.0, ieltsOverall - 1.5 + 2),
    toeflOverall: ieltsOverall * 4 + 40,
    detOverall: Math.max(0, ieltsOverall * 15 - 20),
    portfolioRequired: programLevel === 'MRes' || programLevel === 'PhD',
    interviewRequired: programLevel === 'PhD',
  };
}

async function main() {
  const start = Date.now();
  console.log('Clearing existing data...');

  await db.crmCourseRequirement.deleteMany();
  await db.crmCourseIntakeFee.deleteMany();
  await db.crmCourse.deleteMany();
  await db.crmScholarship.deleteMany();
  await db.crmCommission.deleteMany();
  await db.crmUniversity.deleteMany();

  console.log('Building data in memory...');

  type UD = (typeof ukUniversitiesPart1)[0];
  interface UWC { uni: UD; country: string; }

  const allUk = [...ukUniversitiesPart1, ...ukUniversitiesPart2].map(u => ({ uni: u, country: 'United Kingdom' }));
  const intl: UWC[] = [
    ...usUniversities.map(u => ({ uni: u, country: 'United States' })),
    ...canadaUniversities.map(u => ({ uni: u, country: 'Canada' })),
    ...australiaUniversities.map(u => ({ uni: u, country: 'Australia' })),
    ...germanyUniversities.map(u => ({ uni: u, country: 'Germany' })),
    ...malaysiaUniversities.map(u => ({ uni: u, country: 'Malaysia' })),
    ...newZealandUniversities.map(u => ({ uni: u, country: 'New Zealand' })),
    ...irelandUniversities.map(u => ({ uni: u, country: 'Ireland' })),
    ...netherlandsUniversities.map(u => ({ uni: u, country: 'Netherlands' })),
  ];
  const allUnis = [...allUk, ...intl];

  const today = new Date().toISOString().split('T')[0];
  const uniBatch: any[] = [];
  const courseBatch: any[] = [];
  const intakeBatch: any[] = [];
  const reqBatch: any[] = [];
  const schBatch: any[] = [];

  for (let i = 0; i < allUnis.length; i++) {
    const { uni, country: c } = allUnis[i];
    const uid = `UNI-${uni.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 15).toUpperCase()}-${i.toString().padStart(4, '0')}`;

    uniBatch.push({
      universityId: uid, name: uni.name, country: c, city: uni.city,
      campusName: uni.city + ' Campus', ranking: uni.worldRanking || 0,
      worldRanking: uni.worldRanking || 0, type: uni.type, founded: uni.founded,
      students: uni.totalStudents, intlStudents: uni.intlStudents,
      ieltsMin: uni.ieltsMin, tuitionRange: uni.tuitionRange, scholarships: uni.scholarships,
      description: `${uni.name} is a ${uni.type.toLowerCase()} university located in ${uni.city}. Founded in ${uni.founded}, it is known for excellence in ${uni.subjects.slice(0, 3).join(', ')} and other disciplines.`,
      featured: uni.featured, website: uni.website, officialUrl: uni.website,
      status: 'active', lastVerifiedAt: today,
    });

    const courses: CourseTemplate[] = [];
    const seen = new Set<string>();
    for (const s of uni.subjects) {
      for (const ct of getCourses(s, uni.type)) {
        if (!seen.has(ct.courseTitle)) { seen.add(ct.courseTitle); courses.push(ct); }
      }
    }
    const toSeed = courses.slice(0, 25);

    for (const crs of toSeed) {
      const cid = `${uid}-${crs.courseTitle.replace(/[^A-Za-z0-9]/g, '').substring(0, 20).toUpperCase()}`;
      const { cur, fee } = getTuition(crs.studyLevel, c, uni.type);

      courseBatch.push({
        universityId: uid, courseId: cid, courseTitle: crs.courseTitle,
        studyLevel: crs.studyLevel, programLevel: crs.programLevel,
        subjectArea: crs.disciplineArea, disciplineArea: crs.disciplineArea,
        durationMonths: crs.durationMonths, status: 'active', lastVerifiedAt: today,
        publicTags: [crs.studyLevel, crs.programLevel, crs.disciplineArea].join(','),
      });

      for (const yr of [2025, 2026]) {
        for (const im of ['September', 'January', 'May']) {
          if ((crs.programLevel === 'PhD' || crs.programLevel === 'MRes') && im !== 'September') continue;
          intakeBatch.push({
            universityId: uid, courseId: cid, intakeYear: yr, intakeMonth: im,
            intakeName: `${im} ${yr}`,
            applicationDeadline: `${im === 'September' ? 'July' : im === 'January' ? 'November' : 'March'} 1, ${yr - 1}`,
            appFeeCurrency: cur, appFeeAmount: uni.type === 'Private' ? 100 : 50,
            tuitionCurrency: cur, yearlyTuition: fee, totalTuition: fee * (crs.durationMonths / 12),
            depositCurrency: cur, depositAmount: Math.round(fee * 0.1), status: 'active',
          });
        }
      }

      const rq = getReqs(crs.programLevel, uni.ieltsMin, uni.type);
      reqBatch.push({
        universityId: uid, courseId: cid, academicReq: rq.academicReq,
        gradingSystem: rq.gradingSystem, minScore: rq.minScore,
        ieltsOverall: rq.ieltsOverall, ieltsMinBand: rq.ieltsMinBand,
        pteOverall: rq.pteOverall, pteMinBand: rq.pteMinBand,
        toeflOverall: rq.toeflOverall, detOverall: rq.detOverall,
        moiAccepted: false, ownEnglishTest: false,
        portfolioRequired: rq.portfolioRequired, interviewRequired: rq.interviewRequired,
      });

      if (uni.scholarships && (crs.programLevel === "Master's" || crs.programLevel === 'PhD')) {
        schBatch.push({
          universityId: uid, courseId: cid,
          scholarshipName: crs.programLevel === 'PhD'
            ? `${uni.name.split(' ').slice(0, 2).join(' ')} PhD Scholarship`
            : `${uni.name.split(' ').slice(0, 2).join(' ')} International Merit Scholarship`,
          scholarshipAmount: Math.round(crs.programLevel === 'PhD' ? fee * 0.5 : fee * 0.2),
          scholarshipCurrency: cur, status: 'active',
        });
      }
    }

    if ((i + 1) % 50 === 0) console.log(`  Prepared ${i + 1}/${allUnis.length} universities...`);
  }

  console.log(`\nData prepared. Inserting...\n`);
  console.log(`  Universities: ${uniBatch.length}`);
  console.log(`  Courses: ${courseBatch.length}`);
  console.log(`  Intakes: ${intakeBatch.length}`);
  console.log(`  Requirements: ${reqBatch.length}`);
  console.log(`  Scholarships: ${schBatch.length}`);
  console.log(`  Total records: ${uniBatch.length + courseBatch.length + intakeBatch.length + reqBatch.length + schBatch.length}\n`);

  const CHUNK = 500;

  // Batch insert
  for (let i = 0; i < uniBatch.length; i += CHUNK) {
    await db.crmUniversity.createMany({ data: uniBatch.slice(i, i + CHUNK) });
    console.log(`  Universities: ${Math.min(i + CHUNK, uniBatch.length)}/${uniBatch.length}`);
  }
  for (let i = 0; i < courseBatch.length; i += CHUNK) {
    await db.crmCourse.createMany({ data: courseBatch.slice(i, i + CHUNK) });
    if ((i + CHUNK) % 5000 === 0 || i + CHUNK >= courseBatch.length) {
      console.log(`  Courses: ${Math.min(i + CHUNK, courseBatch.length)}/${courseBatch.length}`);
    }
  }
  for (let i = 0; i < intakeBatch.length; i += CHUNK) {
    await db.crmCourseIntakeFee.createMany({ data: intakeBatch.slice(i, i + CHUNK) });
    if ((i + CHUNK) % 10000 === 0 || i + CHUNK >= intakeBatch.length) {
      console.log(`  Intakes: ${Math.min(i + CHUNK, intakeBatch.length)}/${intakeBatch.length}`);
    }
  }
  for (let i = 0; i < reqBatch.length; i += CHUNK) {
    await db.crmCourseRequirement.createMany({ data: reqBatch.slice(i, i + CHUNK) });
    if ((i + CHUNK) % 5000 === 0 || i + CHUNK >= reqBatch.length) {
      console.log(`  Requirements: ${Math.min(i + CHUNK, reqBatch.length)}/${reqBatch.length}`);
    }
  }
  for (let i = 0; i < schBatch.length; i += CHUNK) {
    await db.crmScholarship.createMany({ data: schBatch.slice(i, i + CHUNK) });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s!`);
  console.log(`UK: ${allUk.length} universities`);
  console.log(`International: ${intl.length} universities`);
  console.log(`Total: ${allUnis.length} universities`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());