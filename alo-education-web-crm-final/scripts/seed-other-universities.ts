import { db } from '../src/lib/db'

// ============================================================
// International Universities & Courses Seed Script
// Countries: Australia, Canada, USA, Germany, New Zealand, Ireland, Malaysia
// Run with: bun run scripts/seed-other-universities.ts
// ============================================================

const BATCH_ID = 'INTL-SEED-2025'
const NOW = new Date().toISOString()

// ============================================================
// University Data
// ============================================================

interface UniversityData {
  universityId: string
  name: string
  country: string
  city: string
  ranking: number
  worldRanking: number
  type: string
  founded: number
  students: string
  intlStudents: string
  ieltsMin: number
  tuitionRange: string
  scholarships: boolean
  description: string
  featured: boolean
  website: string
  officialUrl: string
  currency: string
  tuitionLow: number
  tuitionHigh: number
  isGerman: boolean
}

const universities: UniversityData[] = [
  // ===== AUSTRALIA (5) =====
  {
    universityId: 'AU-MELBOURNE',
    name: 'University of Melbourne',
    country: 'Australia',
    city: 'Melbourne',
    ranking: 1,
    worldRanking: 13,
    type: 'Public',
    founded: 1853,
    students: '52,000',
    intlStudents: '40%',
    ieltsMin: 6.5,
    tuitionRange: 'AUD $42,000-$54,000/yr',
    scholarships: true,
    description: 'The University of Melbourne is Australia\'s leading research university, consistently ranked among the top 20 globally. Known for its excellence in teaching, research, and industry engagement across all major disciplines.',
    featured: true,
    website: 'unimelb.edu.au',
    officialUrl: 'https://www.unimelb.edu.au',
    currency: 'AUD',
    tuitionLow: 42000,
    tuitionHigh: 54000,
    isGerman: false,
  },
  {
    universityId: 'AU-SYDNEY',
    name: 'University of Sydney',
    country: 'Australia',
    city: 'Sydney',
    ranking: 2,
    worldRanking: 19,
    type: 'Public',
    founded: 1850,
    students: '63,000',
    intlStudents: '42%',
    ieltsMin: 6.5,
    tuitionRange: 'AUD $40,000-$56,000/yr',
    scholarships: true,
    description: 'The University of Sydney is one of Australia\'s most prestigious institutions, offering world-class education and research. Its stunning sandstone campus is a landmark in the heart of Sydney.',
    featured: true,
    website: 'sydney.edu.au',
    officialUrl: 'https://www.sydney.edu.au',
    currency: 'AUD',
    tuitionLow: 40000,
    tuitionHigh: 56000,
    isGerman: false,
  },
  {
    universityId: 'AU-UNSW',
    name: 'UNSW Sydney',
    country: 'Australia',
    city: 'Sydney',
    ranking: 3,
    worldRanking: 19,
    type: 'Public',
    founded: 1949,
    students: '56,000',
    intlStudents: '38%',
    ieltsMin: 6.5,
    tuitionRange: 'AUD $39,000-$52,000/yr',
    scholarships: true,
    description: 'UNSW Sydney is a leading research-intensive university and a founding member of the Group of Eight. It is renowned for engineering, business, and science programmes.',
    featured: true,
    website: 'unsw.edu.au',
    officialUrl: 'https://www.unsw.edu.au',
    currency: 'AUD',
    tuitionLow: 39000,
    tuitionHigh: 52000,
    isGerman: false,
  },
  {
    universityId: 'AU-MONASH',
    name: 'Monash University',
    country: 'Australia',
    city: 'Melbourne',
    ranking: 4,
    worldRanking: 37,
    type: 'Public',
    founded: 1958,
    students: '67,000',
    intlStudents: '35%',
    ieltsMin: 6.5,
    tuitionRange: 'AUD $36,000-$50,000/yr',
    scholarships: true,
    description: 'Monash University is Australia\'s largest university with a strong global presence. It has a reputation for innovative research and comprehensive programmes across all disciplines.',
    featured: false,
    website: 'monash.edu',
    officialUrl: 'https://www.monash.edu',
    currency: 'AUD',
    tuitionLow: 36000,
    tuitionHigh: 50000,
    isGerman: false,
  },
  {
    universityId: 'AU-UQ',
    name: 'University of Queensland',
    country: 'Australia',
    city: 'Brisbane',
    ranking: 5,
    worldRanking: 40,
    type: 'Public',
    founded: 1909,
    students: '54,000',
    intlStudents: '33%',
    ieltsMin: 6.5,
    tuitionRange: 'AUD $38,000-$52,000/yr',
    scholarships: true,
    description: 'The University of Queensland is a founding member of the Group of Eight and one of Australia\'s premier research and teaching institutions, known for its strengths in sciences and medicine.',
    featured: false,
    website: 'uq.edu.au',
    officialUrl: 'https://www.uq.edu.au',
    currency: 'AUD',
    tuitionLow: 38000,
    tuitionHigh: 52000,
    isGerman: false,
  },

  // ===== CANADA (4) =====
  {
    universityId: 'CA-TORONTO',
    name: 'University of Toronto',
    country: 'Canada',
    city: 'Toronto',
    ranking: 1,
    worldRanking: 25,
    type: 'Public',
    founded: 1827,
    students: '93,000',
    intlStudents: '25%',
    ieltsMin: 6.5,
    tuitionRange: 'CAD $42,000-$68,000/yr',
    scholarships: true,
    description: 'The University of Toronto is Canada\'s top university and a global leader in research and teaching. It has produced numerous Nobel laureates and is known for its strengths across all academic fields.',
    featured: true,
    website: 'utoronto.ca',
    officialUrl: 'https://www.utoronto.ca',
    currency: 'CAD',
    tuitionLow: 42000,
    tuitionHigh: 68000,
    isGerman: false,
  },
  {
    universityId: 'CA-UBC',
    name: 'University of British Columbia',
    country: 'Canada',
    city: 'Vancouver',
    ranking: 2,
    worldRanking: 38,
    type: 'Public',
    founded: 1908,
    students: '67,000',
    intlStudents: '28%',
    ieltsMin: 6.5,
    tuitionRange: 'CAD $40,000-$60,000/yr',
    scholarships: true,
    description: 'UBC is one of Canada\'s most prestigious universities, consistently ranked among the top 40 globally. Its stunning Vancouver campus and strong research programmes attract students worldwide.',
    featured: true,
    website: 'ubc.ca',
    officialUrl: 'https://www.ubc.ca',
    currency: 'CAD',
    tuitionLow: 40000,
    tuitionHigh: 60000,
    isGerman: false,
  },
  {
    universityId: 'CA-MCGILL',
    name: 'McGill University',
    country: 'Canada',
    city: 'Montreal',
    ranking: 3,
    worldRanking: 29,
    type: 'Public',
    founded: 1821,
    students: '41,000',
    intlStudents: '30%',
    ieltsMin: 6.5,
    tuitionRange: 'CAD $38,000-$62,000/yr',
    scholarships: true,
    description: 'McGill University is one of Canada\'s best-known institutions of higher learning and one of the leading research-intensive universities in the world. Located in vibrant Montreal.',
    featured: true,
    website: 'mcgill.ca',
    officialUrl: 'https://www.mcgill.ca',
    currency: 'CAD',
    tuitionLow: 38000,
    tuitionHigh: 62000,
    isGerman: false,
  },
  {
    universityId: 'CA-WATERLOO',
    name: 'University of Waterloo',
    country: 'Canada',
    city: 'Waterloo',
    ranking: 4,
    worldRanking: 112,
    type: 'Public',
    founded: 1957,
    students: '42,000',
    intlStudents: '22%',
    ieltsMin: 6.5,
    tuitionRange: 'CAD $35,000-$58,000/yr',
    scholarships: true,
    description: 'The University of Waterloo is Canada\'s most innovative university, famous for its co-operative education programme and excellence in engineering, mathematics, and computer science.',
    featured: false,
    website: 'uwaterloo.ca',
    officialUrl: 'https://www.uwaterloo.ca',
    currency: 'CAD',
    tuitionLow: 35000,
    tuitionHigh: 58000,
    isGerman: false,
  },

  // ===== USA (4) =====
  {
    universityId: 'US-MIT',
    name: 'Massachusetts Institute of Technology',
    country: 'United States',
    city: 'Cambridge, MA',
    ranking: 1,
    worldRanking: 1,
    type: 'Private',
    founded: 1861,
    students: '11,900',
    intlStudents: '33%',
    ieltsMin: 7.0,
    tuitionRange: '$55,000-$82,000/yr',
    scholarships: true,
    description: 'MIT is the world\'s leading university for science, technology, engineering, and mathematics. It has an unparalleled reputation for innovation, entrepreneurship, and cutting-edge research.',
    featured: true,
    website: 'mit.edu',
    officialUrl: 'https://www.mit.edu',
    currency: 'USD',
    tuitionLow: 55000,
    tuitionHigh: 82000,
    isGerman: false,
  },
  {
    universityId: 'US-STANFORD',
    name: 'Stanford University',
    country: 'United States',
    city: 'Stanford, CA',
    ranking: 2,
    worldRanking: 6,
    type: 'Private',
    founded: 1885,
    students: '17,500',
    intlStudents: '24%',
    ieltsMin: 7.0,
    tuitionRange: '$54,000-$78,000/yr',
    scholarships: true,
    description: 'Stanford University is one of the world\'s most prestigious institutions, known for its entrepreneurial culture, proximity to Silicon Valley, and excellence across academics and research.',
    featured: true,
    website: 'stanford.edu',
    officialUrl: 'https://www.stanford.edu',
    currency: 'USD',
    tuitionLow: 54000,
    tuitionHigh: 78000,
    isGerman: false,
  },
  {
    universityId: 'US-HARVARD',
    name: 'Harvard University',
    country: 'United States',
    city: 'Cambridge, MA',
    ranking: 3,
    worldRanking: 4,
    type: 'Private',
    founded: 1636,
    students: '23,700',
    intlStudents: '25%',
    ieltsMin: 7.0,
    tuitionRange: '$52,000-$76,000/yr',
    scholarships: true,
    description: 'Harvard University is the oldest institution of higher education in the United States and one of the most prestigious universities in the world, renowned for academic excellence and influential alumni.',
    featured: true,
    website: 'harvard.edu',
    officialUrl: 'https://www.harvard.edu',
    currency: 'USD',
    tuitionLow: 52000,
    tuitionHigh: 76000,
    isGerman: false,
  },
  {
    universityId: 'US-ASU',
    name: 'Arizona State University',
    country: 'United States',
    city: 'Tempe, AZ',
    ranking: 4,
    worldRanking: 192,
    type: 'Public',
    founded: 1885,
    students: '150,000',
    intlStudents: '15%',
    ieltsMin: 6.5,
    tuitionRange: '$28,000-$45,000/yr',
    scholarships: true,
    description: 'Arizona State University is one of the largest public universities in the US, recognised for innovation and offering over 400 undergraduate and graduate programmes across its campuses.',
    featured: false,
    website: 'asu.edu',
    officialUrl: 'https://www.asu.edu',
    currency: 'USD',
    tuitionLow: 28000,
    tuitionHigh: 45000,
    isGerman: false,
  },

  // ===== GERMANY (3) =====
  {
    universityId: 'DE-TUM',
    name: 'Technical University of Munich',
    country: 'Germany',
    city: 'Munich',
    ranking: 1,
    worldRanking: 28,
    type: 'Public',
    founded: 1868,
    students: '50,000',
    intlStudents: '30%',
    ieltsMin: 6.5,
    tuitionRange: 'EUR 0-500/semester',
    scholarships: true,
    description: 'The Technical University of Munich is one of Europe\'s top technical universities and Germany\'s only "University of Excellence." It is renowned for engineering, natural sciences, and technology.',
    featured: true,
    website: 'tum.de',
    officialUrl: 'https://www.tum.de',
    currency: 'EUR',
    tuitionLow: 0,
    tuitionHigh: 500,
    isGerman: true,
  },
  {
    universityId: 'DE-LMU',
    name: 'LMU Munich',
    country: 'Germany',
    city: 'Munich',
    ranking: 2,
    worldRanking: 59,
    type: 'Public',
    founded: 1472,
    students: '52,000',
    intlStudents: '18%',
    ieltsMin: 6.5,
    tuitionRange: 'EUR 0-300/semester',
    scholarships: true,
    description: 'LMU Munich is one of Europe\'s leading research universities with a tradition dating back to 1472. It excels in humanities, social sciences, natural sciences, and medicine.',
    featured: false,
    website: 'lmu.de',
    officialUrl: 'https://www.lmu.de',
    currency: 'EUR',
    tuitionLow: 0,
    tuitionHigh: 300,
    isGerman: true,
  },
  {
    universityId: 'DE-RWTH',
    name: 'RWTH Aachen University',
    country: 'Germany',
    city: 'Aachen',
    ranking: 3,
    worldRanking: 106,
    type: 'Public',
    founded: 1870,
    students: '47,000',
    intlStudents: '25%',
    ieltsMin: 6.5,
    tuitionRange: 'EUR 0-500/semester',
    scholarships: true,
    description: 'RWTH Aachen University is one of Germany\'s premier universities of technology, known for its outstanding engineering programmes and strong industry partnerships.',
    featured: false,
    website: 'rwth-aachen.de',
    officialUrl: 'https://www.rwth-aachen.de',
    currency: 'EUR',
    tuitionLow: 0,
    tuitionHigh: 500,
    isGerman: true,
  },

  // ===== NEW ZEALAND (2) =====
  {
    universityId: 'NZ-AUCKLAND',
    name: 'University of Auckland',
    country: 'New Zealand',
    city: 'Auckland',
    ranking: 1,
    worldRanking: 68,
    type: 'Public',
    founded: 1883,
    students: '44,000',
    intlStudents: '22%',
    ieltsMin: 6.5,
    tuitionRange: 'NZD $32,000-$45,000/yr',
    scholarships: true,
    description: 'The University of Auckland is New Zealand\'s largest and highest-ranked university. It offers world-class education and is known for its research excellence and diverse student community.',
    featured: true,
    website: 'auckland.ac.nz',
    officialUrl: 'https://www.auckland.ac.nz',
    currency: 'NZD',
    tuitionLow: 32000,
    tuitionHigh: 45000,
    isGerman: false,
  },
  {
    universityId: 'NZ-OTAGO',
    name: 'University of Otago',
    country: 'New Zealand',
    city: 'Dunedin',
    ranking: 2,
    worldRanking: 214,
    type: 'Public',
    founded: 1869,
    students: '21,000',
    intlStudents: '20%',
    ieltsMin: 6.0,
    tuitionRange: 'NZD $28,000-$40,000/yr',
    scholarships: true,
    description: 'The University of Otago is New Zealand\'s oldest university, known for its vibrant student life, strong research culture, and excellent programmes in health sciences, humanities, and sciences.',
    featured: false,
    website: 'otago.ac.nz',
    officialUrl: 'https://www.otago.ac.nz',
    currency: 'NZD',
    tuitionLow: 28000,
    tuitionHigh: 40000,
    isGerman: false,
  },

  // ===== IRELAND (2) =====
  {
    universityId: 'IE-TCD',
    name: 'Trinity College Dublin',
    country: 'Ireland',
    city: 'Dublin',
    ranking: 1,
    worldRanking: 87,
    type: 'Public',
    founded: 1592,
    students: '18,500',
    intlStudents: '30%',
    ieltsMin: 6.5,
    tuitionRange: 'EUR 18,000-28,000/yr',
    scholarships: true,
    description: 'Trinity College Dublin is Ireland\'s premier university and one of the oldest in Europe. It is globally recognised for its academic excellence, historic campus, and research output.',
    featured: true,
    website: 'tcd.ie',
    officialUrl: 'https://www.tcd.ie',
    currency: 'EUR',
    tuitionLow: 18000,
    tuitionHigh: 28000,
    isGerman: false,
  },
  {
    universityId: 'IE-UCD',
    name: 'University College Dublin',
    country: 'Ireland',
    city: 'Dublin',
    ranking: 2,
    worldRanking: 171,
    type: 'Public',
    founded: 1854,
    students: '38,000',
    intlStudents: '25%',
    ieltsMin: 6.5,
    tuitionRange: 'EUR 16,000-26,000/yr',
    scholarships: true,
    description: 'University College Dublin is Ireland\'s largest university and a leading research institution. It offers a comprehensive range of programmes and strong industry connections.',
    featured: false,
    website: 'ucd.ie',
    officialUrl: 'https://www.ucd.ie',
    currency: 'EUR',
    tuitionLow: 16000,
    tuitionHigh: 26000,
    isGerman: false,
  },

  // ===== MALAYSIA (2) =====
  {
    universityId: 'MY-UM',
    name: 'University of Malaya',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    ranking: 1,
    worldRanking: 60,
    type: 'Public',
    founded: 1905,
    students: '30,000',
    intlStudents: '15%',
    ieltsMin: 6.0,
    tuitionRange: 'MYR 15,000-50,000/yr',
    scholarships: true,
    description: 'The University of Malaya is Malaysia\'s oldest and highest-ranked university. It is a comprehensive research university known for academic excellence and strong international collaborations.',
    featured: true,
    website: 'um.edu.my',
    officialUrl: 'https://www.um.edu.my',
    currency: 'MYR',
    tuitionLow: 15000,
    tuitionHigh: 50000,
    isGerman: false,
  },
  {
    universityId: 'MY-UTM',
    name: 'Universiti Teknologi Malaysia',
    country: 'Malaysia',
    city: 'Johor Bahru',
    ranking: 2,
    worldRanking: 181,
    type: 'Public',
    founded: 1904,
    students: '28,000',
    intlStudents: '18%',
    ieltsMin: 6.0,
    tuitionRange: 'MYR 12,000-35,000/yr',
    scholarships: true,
    description: 'Universiti Teknologi Malaysia is a leading engineering and technology university in Malaysia. It is known for its strong industry links and practical approach to education.',
    featured: false,
    website: 'utm.my',
    officialUrl: 'https://www.utm.my',
    currency: 'MYR',
    tuitionLow: 12000,
    tuitionHigh: 35000,
    isGerman: false,
  },
]

// ============================================================
// Course Templates per University
// ============================================================

interface CourseTemplate {
  courseId: string
  courseTitle: string
  studyLevel: string
  programLevel: string
  subjectArea: string
  disciplineArea: string
  durationMonths: number
  tuition: number
  ieltsOverall: number
  ieltsMinBand: number
  pteOverall: number
  toeflOverall: number
  appFee: number
}

function getCoursesForUniversity(uni: UniversityData): CourseTemplate[] {
  const prefix = uni.universityId
  const isTopUni = uni.worldRanking <= 30
  const isUSATop = uni.worldRanking <= 6 && uni.country === 'United States'

  // IELTS requirements
  const baseIelts = isUSATop ? 7.0 : isTopUni ? 7.0 : 6.5
  const baseIeltsMin = baseIelts >= 7.0 ? 6.0 : 6.0

  // PTE/TOEFL
  const basePte = isUSATop ? 65 : isTopUni ? 64 : 58
  const baseToefl = isUSATop ? 100 : isTopUni ? 95 : 80

  // Application fee
  const appFee = uni.isGerman ? 0 : uni.currency === 'MYR' ? 500 : 100

  // Tuition scaling
  const { currency, tuitionLow, tuitionHigh, isGerman } = uni

  // For German universities, semester fees are nominal
  const semTuition = isGerman ? 250 : 0

  // Course 1: MSc Computer Science (24 months for AU/CA, 12-24 for others)
  const csDuration = (uni.country === 'Australia' || uni.country === 'Canada') ? 24 :
    (uni.worldRanking <= 6 ? 24 : 18)
  const csTuition = isGerman ? semTuition :
    Math.round((tuitionLow + tuitionHigh) / 2 * 0.55)

  // Course 2: MSc International Business
  const ibDuration = (uni.country === 'Australia' || uni.country === 'Canada') ? 24 : 18
  const ibTuition = isGerman ? semTuition :
    Math.round((tuitionLow + tuitionHigh) / 2 * 0.5)

  // Course 3: MSc Engineering
  const engDuration = (uni.country === 'Australia' || uni.country === 'Canada') ? 24 : 18
  const engTuition = isGerman ? semTuition :
    Math.round((tuitionLow + tuitionHigh) / 2 * 0.48)

  // Course 4: BSc Computer Science or BSc Business (undergrad, 48 months)
  const ugTuition = isGerman ? semTuition :
    Math.round((tuitionLow + tuitionHigh) / 2 * 0.35)

  const courses: CourseTemplate[] = [
    {
      courseId: `${prefix}-MSC-CS`,
      courseTitle: 'MSc Computer Science',
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Computing',
      disciplineArea: 'Computer Science',
      durationMonths: csDuration,
      tuition: csTuition,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIeltsMin,
      pteOverall: basePte,
      toeflOverall: baseToefl,
      appFee,
    },
    {
      courseId: `${prefix}-MSC-IB`,
      courseTitle: 'MSc International Business',
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Business',
      disciplineArea: 'International Business',
      durationMonths: ibDuration,
      tuition: ibTuition,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIeltsMin,
      pteOverall: basePte,
      toeflOverall: baseToefl,
      appFee,
    },
    {
      courseId: `${prefix}-MSC-ENG`,
      courseTitle: 'MSc Mechanical Engineering',
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Engineering',
      disciplineArea: 'Mechanical Engineering',
      durationMonths: engDuration,
      tuition: engTuition,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIeltsMin,
      pteOverall: basePte,
      toeflOverall: baseToefl,
      appFee,
    },
  ]

  // Add 4th course (undergrad) - alternate between BSc CS and BSc Business
  if (prefix.endsWith('MELBOURNE') || prefix.endsWith('SYDNEY') || prefix.endsWith('TORONTO') ||
      prefix.endsWith('MIT') || prefix.endsWith('HARVARD') || prefix.endsWith('TUM') ||
      prefix.endsWith('AUCKLAND') || prefix.endsWith('TCD') || prefix.endsWith('UM')) {
    courses.push({
      courseId: `${prefix}-BSC-CS`,
      courseTitle: 'BSc Computer Science',
      studyLevel: 'Undergraduate',
      programLevel: 'BSc',
      subjectArea: 'Computing',
      disciplineArea: 'Computer Science',
      durationMonths: 48,
      tuition: ugTuition,
      ieltsOverall: baseIelts >= 7.0 ? 6.5 : 6.0,
      ieltsMinBand: 6.0,
      pteOverall: basePte >= 64 ? 58 : 50,
      toeflOverall: baseToefl >= 95 ? 80 : 70,
      appFee,
    })
  } else {
    courses.push({
      courseId: `${prefix}-BSC-BUS`,
      courseTitle: 'BSc Business Administration',
      studyLevel: 'Undergraduate',
      programLevel: 'BSc',
      subjectArea: 'Business',
      disciplineArea: 'Business Administration',
      durationMonths: 48,
      tuition: ugTuition,
      ieltsOverall: baseIelts >= 7.0 ? 6.5 : 6.0,
      ieltsMinBand: 6.0,
      pteOverall: basePte >= 64 ? 58 : 50,
      toeflOverall: baseToefl >= 95 ? 80 : 70,
      appFee,
    })
  }

  return courses
}

// ============================================================
// Intake configuration per country
// ============================================================

function getIntake(uni: UniversityData) {
  const { country, currency, isGerman } = uni

  if (country === 'United States') {
    return {
      intakeYear: 2025,
      intakeMonth: 'September',
      intakeName: 'Fall 2025',
      applicationDeadline: '2025-05-01',
    }
  }

  if (isGerman) {
    return {
      intakeYear: 2025,
      intakeMonth: 'October',
      intakeName: 'Winter Semester 2025/26',
      applicationDeadline: '2025-07-15',
    }
  }

  if (country === 'New Zealand') {
    return {
      intakeYear: 2025,
      intakeMonth: 'February',
      intakeName: 'February 2025',
      applicationDeadline: '2024-12-01',
    }
  }

  if (country === 'Ireland' || country === 'Canada') {
    return {
      intakeYear: 2025,
      intakeMonth: 'September',
      intakeName: 'September 2025',
      applicationDeadline: '2025-06-30',
    }
  }

  if (country === 'Malaysia') {
    return {
      intakeYear: 2025,
      intakeMonth: 'September',
      intakeName: 'September 2025',
      applicationDeadline: '2025-07-31',
    }
  }

  // Australia
  return {
    intakeYear: 2025,
    intakeMonth: 'February',
    intakeName: 'February 2025',
    applicationDeadline: '2024-11-30',
  }
}

// ============================================================
// Scholarship amounts per country
// ============================================================

function getScholarshipAmount(uni: UniversityData): number {
  const { country, currency } = uni
  const amounts: Record<string, Record<string, number>> = {
    Australia: { low: 5000, mid: 8000, high: 10000 },
    Canada: { low: 5000, mid: 7000, high: 10000 },
    'United States': { low: 5000, mid: 8000, high: 10000 },
    Germany: { low: 500, mid: 800, high: 1000 },
    'New Zealand': { low: 3000, mid: 5000, high: 8000 },
    Ireland: { low: 2000, mid: 4000, high: 6000 },
    Malaysia: { low: 2000, mid: 4000, high: 6000 },
  }

  const tier = uni.worldRanking <= 30 ? 'high' : uni.worldRanking <= 100 ? 'mid' : 'low'
  return amounts[country]?.[tier] ?? 5000
}

// ============================================================
// Main Seed Function
// ============================================================

async function main() {
  let universityCount = 0
  let courseCount = 0
  let intakeCount = 0
  let requirementCount = 0
  let scholarshipCount = 0
  let skippedUniversity = 0
  let skippedCourse = 0
  let skippedIntake = 0
  let skippedRequirement = 0
  let skippedScholarship = 0

  console.log('========================================')
  console.log('  INTERNATIONAL UNIVERSITIES SEED')
  console.log('  Countries: AU, CA, US, DE, NZ, IE, MY')
  console.log('  Universities: 22')
  console.log('========================================\n')

  try {
    // ========================================
    // STEP 1: Seed Universities
    // ========================================
    console.log('[1/5] Seeding universities...')

    for (const uni of universities) {
      try {
        const existing = await db.crmUniversity.findFirst({
          where: { universityId: uni.universityId },
        })

        if (existing) {
          skippedUniversity++
          console.log(`  ⊘ ${uni.universityId} — already exists, skipping`)
          continue
        }

        await db.crmUniversity.create({
          data: {
            universityId: uni.universityId,
            name: uni.name,
            country: uni.country,
            city: uni.city,
            campusName: 'Main Campus',
            ranking: uni.ranking,
            worldRanking: uni.worldRanking,
            type: uni.type,
            founded: uni.founded,
            students: uni.students,
            intlStudents: uni.intlStudents,
            ieltsMin: uni.ieltsMin,
            tuitionRange: uni.tuitionRange,
            scholarships: uni.scholarships,
            description: uni.description,
            featured: uni.featured,
            website: uni.website,
            officialUrl: uni.officialUrl,
            sourceUrl: uni.officialUrl + '/study',
            lastVerifiedAt: NOW,
            status: 'active',
          },
        })

        universityCount++
        console.log(`  ✓ ${uni.universityId} — ${uni.name} (${uni.country})`)
      } catch (err) {
        console.error(`  ✗ Failed to create ${uni.universityId}:`, err)
      }
    }

    console.log(`  → Created ${universityCount} new, ${skippedUniversity} skipped\n`)

    // ========================================
    // STEP 2: Seed Courses
    // ========================================
    console.log('[2/5] Seeding courses...')

    for (const uni of universities) {
      const courses = getCoursesForUniversity(uni)

      for (const course of courses) {
        try {
          const existing = await db.crmCourse.findFirst({
            where: {
              universityId: uni.universityId,
              courseId: course.courseId,
            },
          })

          if (existing) {
            skippedCourse++
            continue
          }

          await db.crmCourse.create({
            data: {
              universityId: uni.universityId,
              courseId: course.courseId,
              courseTitle: course.courseTitle,
              studyLevel: course.studyLevel,
              programLevel: course.programLevel,
              subjectArea: course.subjectArea,
              disciplineArea: course.disciplineArea,
              officialUrl: `${uni.officialUrl}/courses/${course.courseId.toLowerCase()}`,
              durationMonths: course.durationMonths,
              publicTags: JSON.stringify([course.subjectArea, course.disciplineArea, course.programLevel, uni.country]),
              sourceUrl: uni.officialUrl + '/study',
              lastVerifiedAt: NOW,
              status: 'active',
            },
          })

          courseCount++
        } catch (err) {
          console.error(`  ✗ Failed to create course ${course.courseId}:`, err)
        }
      }

      console.log(`  ✓ ${uni.universityId} — ${courses.length} courses`)
    }

    console.log(`  → Created ${courseCount} new, ${skippedCourse} skipped\n`)

    // ========================================
    // STEP 3: Seed Intake & Fees
    // ========================================
    console.log('[3/5] Seeding intake & fees...')

    for (const uni of universities) {
      const courses = getCoursesForUniversity(uni)
      const intake = getIntake(uni)
      const { currency, isGerman } = uni

      for (const course of courses) {
        try {
          const existing = await db.crmCourseIntakeFee.findFirst({
            where: {
              universityId: uni.universityId,
              courseId: course.courseId,
              intakeYear: intake.intakeYear,
              intakeMonth: intake.intakeMonth,
            },
          })

          if (existing) {
            skippedIntake++
            continue
          }

          // Calculate tuition values
          const yearlyTuition = course.tuition
          const years = course.durationMonths / 12
          const totalTuition = isGerman
            ? yearlyTuition * course.durationMonths  // semester fee × months
            : course.studyLevel === 'Undergraduate'
              ? yearlyTuition * years
              : yearlyTuition * years

          await db.crmCourseIntakeFee.create({
            data: {
              universityId: uni.universityId,
              courseId: course.courseId,
              intakeYear: intake.intakeYear,
              intakeMonth: intake.intakeMonth,
              intakeName: intake.intakeName,
              applicationDeadline: intake.applicationDeadline,
              appFeeCurrency: currency,
              appFeeAmount: course.appFee,
              tuitionCurrency: currency,
              yearlyTuition,
              totalTuition,
              depositCurrency: currency,
              depositAmount: isGerman ? 0 : Math.round(yearlyTuition * 0.1),
              batchId: BATCH_ID,
              status: 'active',
            },
          })

          intakeCount++
        } catch (err) {
          console.error(`  ✗ Failed to create intake for ${course.courseId}:`, err)
        }
      }

      console.log(`  ✓ ${uni.universityId} — intakes created`)
    }

    console.log(`  → Created ${intakeCount} new, ${skippedIntake} skipped\n`)

    // ========================================
    // STEP 4: Seed Course Requirements
    // ========================================
    console.log('[4/5] Seeding course requirements...')

    for (const uni of universities) {
      const courses = getCoursesForUniversity(uni)

      for (const course of courses) {
        try {
          const existing = await db.crmCourseRequirement.findFirst({
            where: {
              universityId: uni.universityId,
              courseId: course.courseId,
            },
          })

          if (existing) {
            skippedRequirement++
            continue
          }

          const isPostgrad = course.studyLevel === 'Postgraduate'

          await db.crmCourseRequirement.create({
            data: {
              universityId: uni.universityId,
              courseId: course.courseId,
              academicReq: isPostgrad
                ? "Bachelor's degree with a minimum GPA of 3.0/4.0 or equivalent in a relevant discipline"
                : 'Strong academic record in higher secondary education with good grades in relevant subjects',
              gradingSystem: isPostgrad ? 'GPA / Bachelor Degree' : 'High School / A-Levels / IB',
              minScore: isPostgrad
                ? 'GPA 3.0/4.0 or equivalent (60%+)'
                : 'GPA 2.5/4.0 or equivalent',
              ieltsOverall: course.ieltsOverall,
              ieltsMinBand: course.ieltsMinBand,
              pteOverall: course.pteOverall,
              pteMinBand: Math.max(42, course.pteOverall - 10),
              toeflOverall: course.toeflOverall,
              detOverall: course.ieltsOverall >= 7.0 ? 130 : course.ieltsOverall >= 6.5 ? 120 : 110,
              moiAccepted: uni.isGerman || course.ieltsOverall <= 6.5,
              ownEnglishTest: false,
              portfolioRequired: false,
              interviewRequired: course.programLevel === 'MBA',
              batchId: BATCH_ID,
            },
          })

          requirementCount++
        } catch (err) {
          console.error(`  ✗ Failed to create requirement for ${course.courseId}:`, err)
        }
      }

      console.log(`  ✓ ${uni.universityId} — requirements created`)
    }

    console.log(`  → Created ${requirementCount} new, ${skippedRequirement} skipped\n`)

    // ========================================
    // STEP 5: Seed Scholarships
    // ========================================
    console.log('[5/5] Seeding scholarships...')

    for (const uni of universities) {
      const courses = getCoursesForUniversity(uni)
      const scholAmount = getScholarshipAmount(uni)
      const { currency } = uni

      // One scholarship per course
      for (const course of courses) {
        try {
          const existing = await db.crmScholarship.findFirst({
            where: {
              universityId: uni.universityId,
              courseId: course.courseId,
              scholarshipName: `${uni.name} International Student Scholarship`,
            },
          })

          if (existing) {
            skippedScholarship++
            continue
          }

          await db.crmScholarship.create({
            data: {
              universityId: uni.universityId,
              courseId: course.courseId,
              scholarshipName: `${uni.name} International Student Scholarship`,
              scholarshipAmount: scholAmount,
              scholarshipCurrency: currency,
              batchId: BATCH_ID,
              status: 'active',
            },
          })

          scholarshipCount++
        } catch (err) {
          console.error(`  ✗ Failed to create scholarship for ${course.courseId}:`, err)
        }
      }

      console.log(`  ✓ ${uni.universityId} — scholarships created`)
    }

    console.log(`  → Created ${scholarshipCount} new, ${skippedScholarship} skipped\n`)

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('========================================')
    console.log('  SEED COMPLETE — FINAL SUMMARY')
    console.log('========================================')
    console.log(`  Universities:       ${universityCount} new (${skippedUniversity} existing) — ${universities.length} total`)
    console.log(`  Courses:            ${courseCount} new (${skippedCourse} existing)`)
    console.log(`  Intakes & Fees:     ${intakeCount} new (${skippedIntake} existing)`)
    console.log(`  Requirements:       ${requirementCount} new (${skippedRequirement} existing)`)
    console.log(`  Scholarships:       ${scholarshipCount} new (${skippedScholarship} existing)`)
    console.log('========================================')

    // Country breakdown
    console.log('\nCountry breakdown:')
    const countryCounts: Record<string, number> = {}
    for (const uni of universities) {
      countryCounts[uni.country] = (countryCounts[uni.country] || 0) + 1
    }
    for (const [country, count] of Object.entries(countryCounts).sort()) {
      const code = { Australia: 'AU', Canada: 'CA', 'United States': 'US', Germany: 'DE', 'New Zealand': 'NZ', Ireland: 'IE', Malaysia: 'MY' }[country] ?? ''
      console.log(`  ${country.padEnd(20)} (${code}): ${count} universities`)
    }

    console.log('\n✅ Seed script completed successfully!\n')

  } catch (error) {
    console.error('\n❌ SEED FAILED:')
    console.error(error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()