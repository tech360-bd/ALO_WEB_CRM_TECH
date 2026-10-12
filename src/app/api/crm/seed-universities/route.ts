import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { syntheticAgentDataAllowed } from '@/lib/ai-agents/synthetic-data-guard';
import { ukUniversitiesPart1 } from '@/lib/university-data-uk';
import { ukUniversitiesPart2 } from '@/lib/university-data-uk2';
import {
  usUniversities,
  canadaUniversities,
  australiaUniversities,
  germanyUniversities,
  malaysiaUniversities,
  newZealandUniversities,
  irelandUniversities,
  netherlandsUniversities,
} from '@/lib/university-data-intl';

// ─── Course Generation Templates ─────────────────────────────────────────────
// Each subject maps to a set of course templates at different study levels

interface CourseTemplate {
  courseTitle: string;
  studyLevel: string;
  programLevel: string;
  disciplineArea: string;
  durationMonths: number;
}

function generateCoursesForSubject(subject: string, universityType: string): CourseTemplate[] {
  const courses: CourseTemplate[] = [];
  const isTopTier = ['Russell Group', 'Ancient', 'Red Brick'].includes(universityType);
  const isSpecialized = ['Specialized', 'Postgraduate'].includes(universityType);

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

  const templates = courseMap[subject];
  if (!templates) return [];

  // Specialized/Postgraduate-only universities only get PG courses
  if (isSpecialized) {
    return templates.filter(t =>
      t.studyLevel === 'Postgraduate' || t.studyLevel === 'Postgraduate Research'
    );
  }

  // Law-only universities (University of Law) only get Law courses
  return templates;
}

// ─── Fee & Requirement Helpers ────────────────────────────────────────────────

function getTuitionInfo(
  studyLevel: string,
  country: string,
  uniType: string,
  tuitionRange: string
): { tuitionCurrency: string; yearlyTuition: number } {
  // Parse the tuition range to get approximate mid value
  const currencyMap: Record<string, string> = {
    'United Kingdom': 'GBP',
    'United States': 'USD',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Germany': 'EUR',
    'Malaysia': 'MYR',
    'New Zealand': 'NZD',
    'Ireland': 'EUR',
    'Netherlands': 'EUR',
  };

  const currency = currencyMap[country] || 'GBP';
  const isTopTier = ['Russell Group', 'Ancient', 'Red Brick'].includes(uniType);
  const isPrivate = uniType === 'Private';

  // Base fees by country and level
  const baseFees: Record<string, Record<string, [number, number]>> = {
    'GBP': {
      'Foundation': [12000, 18000],
      'Undergraduate': [15000, 35000],
      'Postgraduate': [16000, 40000],
      'Postgraduate Research': [16000, 28000],
    },
    'USD': {
      'Foundation': [20000, 35000],
      'Undergraduate': [30000, 65000],
      'Postgraduate': [25000, 70000],
      'Postgraduate Research': [25000, 55000],
    },
    'CAD': {
      'Foundation': [15000, 25000],
      'Undergraduate': [20000, 45000],
      'Postgraduate': [18000, 50000],
      'Postgraduate Research': [15000, 35000],
    },
    'AUD': {
      'Foundation': [18000, 30000],
      'Undergraduate': [25000, 50000],
      'Postgraduate': [22000, 52000],
      'Postgraduate Research': [20000, 40000],
    },
    'EUR': {
      'Foundation': [0, 500],
      'Undergraduate': [0, 3000],
      'Postgraduate': [500, 5000],
      'Postgraduate Research': [0, 3000],
    },
    'MYR': {
      'Foundation': [10000, 25000],
      'Undergraduate': [20000, 60000],
      'Postgraduate': [25000, 80000],
      'Postgraduate Research': [20000, 60000],
    },
    'NZD': {
      'Foundation': [20000, 30000],
      'Undergraduate': [25000, 40000],
      'Postgraduate': [26000, 42000],
      'Postgraduate Research': [6500, 8000],
    },
  };

  const levelMap: Record<string, string> = {
    "Bachelor's": 'Undergraduate',
    'Master\'s': 'Postgraduate',
    'MRes': 'Postgraduate Research',
    'PhD': 'Postgraduate Research',
  };

  const level = levelMap[studyLevel] || studyLevel;
  const range = baseFees[currency]?.[level] || [15000, 30000];

  let mid = (range[0] + range[1]) / 2;
  if (isTopTier) mid = range[1] * 0.9;
  if (isPrivate) mid = range[1] * 0.85;

  return { tuitionCurrency: currency, yearlyTuition: Math.round(mid) };
}

function getRequirements(
  studyLevel: string,
  ieltsMin: number,
  uniType: string
) {
  const isTopTier = ['Russell Group', 'Ancient', 'Red Brick'].includes(uniType);

  // Adjust IELTS by level
  let ieltsOverall = ieltsMin;
  let ieltsMinBand = ieltsMin - 0.5;

  if (studyLevel === "Master's") {
    ieltsOverall = Math.max(ieltsMin, isTopTier ? 6.5 : 6.0);
    ieltsMinBand = ieltsOverall - 0.5;
  } else if (studyLevel === 'MRes' || studyLevel === 'PhD') {
    ieltsOverall = Math.max(ieltsMin, isTopTier ? 7.0 : 6.5);
    ieltsMinBand = ieltsOverall - 1.0;
  }

  const academicReqs: Record<string, string> = {
    "Bachelor's": isTopTier
      ? 'A-Level AAB-AAA or equivalent. IB 34-38 points.'
      : 'A-Level BBC-BBB or equivalent. IB 28-32 points.',
    'Master\'s': isTopTier
      ? 'Upper Second Class Honours (2:1) or equivalent. GPA 3.3+/4.0.'
      : 'Lower Second Class Honours (2:2) or equivalent. GPA 2.8+/4.0.',
    'MRes': isTopTier
      ? 'Upper Second Class Honours (2:1) with research proposal. Strong academic references.'
      : 'Lower Second Class Honours (2:2) with research proposal. Two academic references.',
    'PhD': isTopTier
      ? 'Masters degree with merit/distinction. Research proposal. Publications preferred.'
      : 'Masters degree. Research proposal. Two academic references.',
  };

  return {
    academicReq: academicReqs[studyLevel] || 'Relevant qualification required.',
    gradingSystem: studyLevel === "Bachelor's" ? 'UCAS Tariff / GPA' : 'UK Honours / GPA',
    minScore: studyLevel === "Bachelor's" ? (isTopTier ? 'AAB' : 'BBC') : (isTopTier ? '2:1' : '2:2'),
    ieltsOverall,
    ieltsMinBand: Math.max(5.5, ieltsMinBand),
    pteOverall: ieltsOverall + 2,
    pteMinBand: ieltsMinBand + 2,
    toeflOverall: ieltsOverall * 4 + 40,
    detOverall: ieltsOverall * 15 - 20,
    moiAccepted: false,
    ownEnglishTest: false,
    portfolioRequired: studyLevel === 'MRes' || studyLevel === 'PhD',
    interviewRequired: studyLevel === 'PhD',
  };
}

// ─── Main Seed Function ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Containment (Course Finder final safety review, 2026-10-12): this seeder
  // generates template universities/courses/intakes/fees from hard-coded data
  // and, with { clear: true }, deletes every catalogue row (and commissions)
  // without a transaction or audit. It is disabled unless a developer opts in
  // on a non-production environment; in production it always returns 503
  // before authentication or any database access.
  if (!syntheticAgentDataAllowed()) {
    return NextResponse.json({
      success: false,
      code: 'CATALOGUE_SEEDER_DISABLED',
      error: 'The template catalogue seeder is disabled. It generates unverified catalogue data and can wipe catalogue tables. Use the reviewed CSV import (/admin/data-import).',
    }, { status: 503 });
  }
  return withAuth(async (req, auth) => {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { country } = body as { country?: string };

    // Check existing count
    const existingCount = await db.crmUniversity.count();

    // Clear if requested
    if (body.clear) {
      await db.crmCourseRequirement.deleteMany();
      await db.crmCourseIntakeFee.deleteMany();
      await db.crmCourse.deleteMany();
      await db.crmScholarship.deleteMany();
      await db.crmCommission.deleteMany();
      await db.crmUniversity.deleteMany();
    } else if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${existingCount} universities. Use body { "clear": true } to reseed, or { "country": "Germany" } to add more.`,
        existingUniversities: existingCount,
      });
    }

    // Combine all university data with country tags from source arrays
    type UniData = (typeof ukUniversitiesPart1)[0];
    interface UniWithCountry {
      uni: UniData;
      country: string;
    }

    const allUkUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2].map(u => ({ uni: u, country: 'United Kingdom' }));
    const intlUnis: UniWithCountry[] = [
      ...usUniversities.map(u => ({ uni: u, country: 'United States' })),
      ...canadaUniversities.map(u => ({ uni: u, country: 'Canada' })),
      ...australiaUniversities.map(u => ({ uni: u, country: 'Australia' })),
      ...germanyUniversities.map(u => ({ uni: u, country: 'Germany' })),
      ...malaysiaUniversities.map(u => ({ uni: u, country: 'Malaysia' })),
      ...newZealandUniversities.map(u => ({ uni: u, country: 'New Zealand' })),
      ...irelandUniversities.map(u => ({ uni: u, country: 'Ireland' })),
      ...netherlandsUniversities.map(u => ({ uni: u, country: 'Netherlands' })),
    ];

    let universitiesToSeed = [...allUkUnis, ...intlUnis];

    // Filter by country if specified
    if (country) {
      universitiesToSeed = universitiesToSeed.filter(u =>
        u.country.toLowerCase().includes(country.toLowerCase()) ||
        u.uni.name.toLowerCase().includes(country.toLowerCase()) ||
        u.uni.city.toLowerCase().includes(country.toLowerCase())
      );
    }

    // ─── Build All Data in Memory (fast) ────────────────────────────────────
    const intakes = ['September', 'January', 'May'];
    const years = [2025, 2026];
    const today = new Date().toISOString().split('T')[0];

    const uniBatch: any[] = [];
    const courseBatch: any[] = [];
    const intakeBatch: any[] = [];
    const reqBatch: any[] = [];
    const scholarshipBatch: any[] = [];

    for (let i = 0; i < universitiesToSeed.length; i++) {
      const { uni, country: uniCountry } = universitiesToSeed[i];
      const universityId = `UNI-${uni.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 15).toUpperCase()}-${i.toString().padStart(4, '0')}`;

      // University record
      uniBatch.push({
        universityId, name: uni.name, country: uniCountry, city: uni.city,
        campusName: uni.city + ' Campus', ranking: uni.worldRanking || 0,
        worldRanking: uni.worldRanking || 0, type: uni.type, founded: uni.founded,
        students: uni.totalStudents, intlStudents: uni.intlStudents,
        ieltsMin: uni.ieltsMin, tuitionRange: uni.tuitionRange, scholarships: uni.scholarships,
        description: `${uni.name} is a ${uni.type.toLowerCase()} university located in ${uni.city}. Founded in ${uni.founded}, it is known for excellence in ${uni.subjects.slice(0, 3).join(', ')} and other disciplines.`,
        featured: uni.featured, website: uni.website, officialUrl: uni.website,
        status: 'active', lastVerifiedAt: today,
      });

      // Generate courses for this university
      const uniCourses: CourseTemplate[] = [];
      for (const subject of uni.subjects) {
        uniCourses.push(...generateCoursesForSubject(subject, uni.type));
      }
      const seen = new Set<string>();
      const uniqueCourses = uniCourses.filter(c => {
        if (seen.has(c.courseTitle)) return false;
        seen.add(c.courseTitle);
        return true;
      });
      const coursesToSeed = uniqueCourses.slice(0, 25);

      for (const course of coursesToSeed) {
        const courseId = `${universityId}-${course.courseTitle.replace(/[^A-Za-z0-9]/g, '').substring(0, 20).toUpperCase()}`;
        const { tuitionCurrency, yearlyTuition } = getTuitionInfo(course.studyLevel, uniCountry, uni.type, uni.tuitionRange);

        // Course record
        courseBatch.push({
          universityId, courseId, courseTitle: course.courseTitle,
          studyLevel: course.studyLevel, programLevel: course.programLevel,
          subjectArea: course.disciplineArea, disciplineArea: course.disciplineArea,
          durationMonths: course.durationMonths, status: 'active',
          lastVerifiedAt: today,
          publicTags: [course.studyLevel, course.programLevel, course.disciplineArea].join(','),
        });

        // Intake & Fee records
        for (const year of years) {
          for (const intakeMonth of intakes) {
            if ((course.programLevel === 'PhD' || course.programLevel === 'MRes') && intakeMonth !== 'September') continue;
            if (course.programLevel === "Bachelor's" && course.courseTitle.includes('Foundation') && intakeMonth !== 'September') continue;

            intakeBatch.push({
              universityId, courseId, intakeYear: year, intakeMonth,
              intakeName: `${intakeMonth} ${year}`,
              applicationDeadline: `${intakeMonth === 'September' ? 'July' : intakeMonth === 'January' ? 'November' : 'March'} 1, ${year - 1}`,
              appFeeCurrency: tuitionCurrency, appFeeAmount: uni.type === 'Private' ? 100 : 50,
              tuitionCurrency, yearlyTuition,
              totalTuition: yearlyTuition * (course.durationMonths / 12),
              depositCurrency: tuitionCurrency, depositAmount: Math.round(yearlyTuition * 0.1),
              status: 'active',
            });
          }
        }

        // Requirement record
        const reqs = getRequirements(course.programLevel, uni.ieltsMin, uni.type);
        reqBatch.push({
          universityId, courseId, academicReq: reqs.academicReq,
          gradingSystem: reqs.gradingSystem, minScore: reqs.minScore,
          ieltsOverall: reqs.ieltsOverall, ieltsMinBand: reqs.ieltsMinBand,
          pteOverall: reqs.pteOverall, pteMinBand: reqs.pteMinBand,
          toeflOverall: reqs.toeflOverall, detOverall: Math.max(0, reqs.detOverall),
          moiAccepted: reqs.moiAccepted, ownEnglishTest: reqs.ownEnglishTest,
          portfolioRequired: reqs.portfolioRequired, interviewRequired: reqs.interviewRequired,
        });

        // Scholarship record
        if (uni.scholarships && (course.programLevel === "Master's" || course.programLevel === 'PhD')) {
          scholarshipBatch.push({
            universityId, courseId,
            scholarshipName: course.programLevel === 'PhD'
              ? `${uni.name.split(' ').slice(0, 2).join(' ')} PhD Scholarship`
              : `${uni.name.split(' ').slice(0, 2).join(' ')} International Merit Scholarship`,
            scholarshipAmount: Math.round(course.programLevel === 'PhD' ? yearlyTuition * 0.5 : yearlyTuition * 0.2),
            scholarshipCurrency: tuitionCurrency, status: 'active',
          });
        }
      }
    }

    // ─── Batch Insert into Database (using createMany in chunks) ─────────────
    const CHUNK = 200;

    // Universities
    for (let i = 0; i < uniBatch.length; i += CHUNK) {
      await db.crmUniversity.createMany({ data: uniBatch.slice(i, i + CHUNK) });
    }

    // Courses
    for (let i = 0; i < courseBatch.length; i += CHUNK) {
      await db.crmCourse.createMany({ data: courseBatch.slice(i, i + CHUNK) });
    }

    // Intakes & Fees
    for (let i = 0; i < intakeBatch.length; i += CHUNK) {
      await db.crmCourseIntakeFee.createMany({ data: intakeBatch.slice(i, i + CHUNK) });
    }

    // Requirements
    for (let i = 0; i < reqBatch.length; i += CHUNK) {
      await db.crmCourseRequirement.createMany({ data: reqBatch.slice(i, i + CHUNK) });
    }

    // Scholarships
    for (let i = 0; i < scholarshipBatch.length; i += CHUNK) {
      await db.crmScholarship.createMany({ data: scholarshipBatch.slice(i, i + CHUNK) });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      message: `Database seeded successfully in ${elapsed}s`,
      stats: {
        universities: uniBatch.length,
        courses: courseBatch.length,
        intakesAndFees: intakeBatch.length,
        requirements: reqBatch.length,
        scholarships: scholarshipBatch.length,
      },
      countries: {
        uk: allUkUnis.length,
        international: intlUnis.length,
        total: allUkUnis.length + intlUnis.length,
      },
    });
  } catch (error) {
    console.error('University seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed university data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
  }, { requireUserTypes: ['SUPER_ADMIN'] })(request);
}