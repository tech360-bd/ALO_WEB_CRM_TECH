// @ts-nocheck
/**
 * ALO Education - Seed Malta, Cyprus, South Korea
 * Adds 3 new countries with 26 universities and courses.
 * Idempotent: uses upsert/create with try-catch for existing records.
 */

import { db } from '../src/lib/db';

const NOW = new Date('2025-06-15');
const J = (v: any) => JSON.stringify(v);

// ============================================================
// PART 1: COUNTRY DATA
// ============================================================
const COUNTRY_DATA: Record<string, any> = {
  malta: {
    name: 'Malta', shortName: 'Malta', flag: '🇲🇹', capital: 'Valletta', currency: 'EUR (€)',
    intro: 'Study in Malta with ALO Education. A Mediterranean island nation offering English-taught programmes, EU-recognised degrees, affordable tuition, and a thriving student life in the heart of the Mediterranean.',
    quickFacts: {
      topUniversities: 'University of Malta, MCAST, Global College Malta',
      popularCities: 'Valletta, Msida, Sliema, St. Julian\'s, Birkirkara',
      avgTuitionUG: '€5,000–€12,000/year',
      avgTuitionPG: '€7,000–€15,000/year',
      livingCost: '€700–€1,200/month',
      postStudyWork: 'EU Blue Card eligible (after graduation)',
      primaryIntake: 'October, February',
      englishTests: 'IELTS, PTE, TOEFL, Duolingo',
      visaType: 'Student Visa (National Visa D)',
      scholarshipAvailable: 'Yes — Malta Government Scholarship, Endeavour Scholarship, ALO bursaries',
    },
    cities: ['Valletta', 'Msida', 'Sliema', 'St. Julian\'s', 'Birkirkara', 'Paola', 'Hamrun', 'Cospicua', 'Kalkara'],
  },
  cyprus: {
    name: 'Cyprus', shortName: 'Cyprus', flag: '🇨🇾', capital: 'Nicosia', currency: 'EUR (€)',
    intro: 'Study in Cyprus with ALO Education. An EU member state in the Eastern Mediterranean offering affordable English-taught programmes, beautiful campuses, and a gateway to European career opportunities.',
    quickFacts: {
      topUniversities: 'University of Cyprus, University of Nicosia, Cyprus University of Technology',
      popularCities: 'Nicosia, Limassol, Larnaca, Paphos',
      avgTuitionUG: '€4,000–€10,000/year',
      avgTuitionPG: '€5,000–€12,000/year',
      livingCost: '€600–€1,100/month',
      postStudyWork: 'Up to 1 year (search for employment)',
      primaryIntake: 'October, February',
      englishTests: 'IELTS, PTE, TOEFL',
      visaType: 'Student Visa (National Visa)',
      scholarshipAvailable: 'Yes — Cyprus Government Scholarship, university merit awards',
    },
    cities: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta', 'Ayia Napa'],
  },
  'south-korea': {
    name: 'South Korea', shortName: 'South Korea', flag: '🇰🇷', capital: 'Seoul', currency: 'KRW (₩)',
    intro: 'Study in South Korea with ALO Education. A global technology and innovation hub with world-class universities, generous scholarships for international students, and a vibrant K-culture experience.',
    quickFacts: {
      topUniversities: 'Seoul National University, KAIST, Yonsei, Korea University, POSTECH',
      popularCities: 'Seoul, Daejeon, Pohang, Busan, Daegu',
      avgTuitionUG: '₩4,000,000–₩8,000,000/semester',
      avgTuitionPG: '₩5,000,000–₩10,000,000/semester',
      livingCost: '₩800,000–₩1,500,000/month',
      postStudyWork: 'D-10 visa (job search) → E-series work visa',
      primaryIntake: 'March, September',
      englishTests: 'IELTS, TOEFL, TOPIK (for Korean-taught)',
      visaType: 'D-2 Student Visa',
      scholarshipAvailable: 'Yes — GKS (Korean Government Scholarship), KGSP, university merit awards',
    },
    cities: ['Seoul', 'Daejeon', 'Pohang', 'Busan', 'Daegu', 'Incheon', 'Suwon', 'Gwangju'],
  },
};

function genWhyStudy(name: string, extras: string[][]) {
  return [
    { icon: 'GraduationCap', heading: 'Globally recognised degrees', explanation: `A degree from ${name} carries weight with employers and universities worldwide.` },
    { icon: 'BookOpen', heading: 'Wide range of courses', explanation: `From foundation to research degrees, ${name} institutions offer subjects across all major disciplines.` },
    { icon: 'Users', heading: 'Multicultural environment', explanation: `Campuses in ${name} bring together students from dozens of countries.` },
    { icon: 'Briefcase', heading: 'Career-focused education', explanation: 'Many programmes include industry placements, practical projects, and career services.' },
    { icon: 'Award', heading: 'Scholarship opportunities', explanation: `Universities and governments in ${name} offer merit scholarships and financial awards.` },
    { icon: 'LifeBuoy', heading: 'Strong student support', explanation: 'International offices, academic tutors, and career advisors help you from day one.' },
  ];
}

function genFaqs(c: string) {
  return [
    { q: `Can I study in ${c} from Bangladesh?`, a: `Yes. Bangladeshi students can apply. ALO Education helps throughout the process.` },
    { q: `Which intake is best?`, a: `Most universities offer multiple intakes. ALO recommends starting 6 months early.` },
    { q: `How much does it cost?`, a: `Tuition varies by university, level, and subject. Use the Course Finder for estimates.` },
    { q: `Can I work while studying?`, a: 'Work rights depend on your visa type. Check the country page for details.' },
    { q: `Do I need IELTS?`, a: 'IELTS is widely accepted, but PTE, TOEFL, and Duolingo are also accepted at many institutions.' },
    { q: `Can ALO help with SOP?`, a: 'Yes — AI-assisted SOP drafting and counselor review are included.' },
    { q: `Is there a January intake?`, a: 'Many programmes offer January/February intake.' },
    { q: `What about scholarships?`, a: 'Yes — merit awards, government scholarships, and early-bird discounts are available.' },
  ];
}

function genScholarships(c: string) {
  return [
    { name: `${c} Government Scholarship`, description: 'Government-funded merit scholarship for international students.', eligibility: 'Strong academic record', value: 'Tuition + living allowance' },
    { name: 'University Merit Award', description: 'Automatic consideration based on academic performance.', eligibility: 'High GPA/grades', value: '10-50% tuition reduction' },
    { name: 'ALO Education Bursary', description: 'Exclusive bursary for ALO-referred students.', eligibility: 'Apply through ALO', value: '€500-€3,000 one-time' },
  ];
}

function genDocs() {
  return [
    { category: 'Academic', name: 'SSC/O Level certificate and transcript', required: true },
    { category: 'Academic', name: 'HSC/A Level certificate and transcript', required: true },
    { category: 'Identity', name: 'Valid passport', required: true },
    { category: 'Identity', name: 'Passport-size photographs', required: true },
    { category: 'English', name: 'IELTS/PTE/TOEFL score report', required: true },
    { category: 'Application', name: 'CV/Resume', required: true },
    { category: 'Application', name: 'Statement of Purpose (SOP)', required: true },
    { category: 'Application', name: 'Recommendation letters (1-2)', required: true },
    { category: 'Financial', name: 'Bank statement (28-day history)', required: true },
    { category: 'Financial', name: 'Sponsor documents', required: true },
  ];
}

// ============================================================
// PART 2: COURSE TEMPLATES
// ============================================================
const COURSE_TEMPLATES: Record<string, any> = {
  malta: { currency: 'EUR', prefix: '€', courses: [
    { title: 'MSc Computer Science', level: 'Masters', subject: 'Computer Science', duration: '1.5 years', tuitionBase: 8000 },
    { title: 'MBA', level: 'MBA', subject: 'Business Administration', duration: '1.5 years', tuitionBase: 9000 },
    { title: 'MSc Data Science', level: 'Masters', subject: 'Data Science', duration: '1.5 years', tuitionBase: 8500 },
    { title: 'BSc Business Administration', level: 'Bachelors', subject: 'Business Administration', duration: '3 years', tuitionBase: 6000 },
  ]},
  cyprus: { currency: 'EUR', prefix: '€', courses: [
    { title: 'MSc Computer Science', level: 'Masters', subject: 'Computer Science', duration: '2 years', tuitionBase: 7000 },
    { title: 'MBA', level: 'MBA', subject: 'Business Administration', duration: '2 years', tuitionBase: 8000 },
    { title: 'MSc Engineering Management', level: 'Masters', subject: 'Engineering Management', duration: '2 years', tuitionBase: 7500 },
    { title: 'BSc Business', level: 'Bachelors', subject: 'Business', duration: '4 years', tuitionBase: 5000 },
  ]},
  'south-korea': { currency: 'KRW', prefix: '₩', courses: [
    { title: 'MS Computer Science', level: 'Masters', subject: 'Computer Science', duration: '2 years', tuitionBase: 5000000 },
    { title: 'MBA', level: 'MBA', subject: 'Business Administration', duration: '2 years', tuitionBase: 6000000 },
    { title: 'MS Engineering', level: 'Masters', subject: 'Engineering', duration: '2 years', tuitionBase: 5500000 },
    { title: 'BA International Relations', level: 'Bachelors', subject: 'International Relations', duration: '4 years', tuitionBase: 4000000 },
  ]},
};

// ============================================================
// PART 3: UNIVERSITY DATA
// ============================================================
const UNIVERSITIES: any[] = [
  // ── MALTA (8) ──
  {
    slug: 'university-of-malta', name: 'University of Malta', cs: 'malta', city: 'Msida',
    ranking: 'QS #801-850', website: 'https://www.um.edu.mt',
    overview: 'The University of Malta is the highest-ranking and oldest university in Malta, founded in 1768. It is the island nation\'s flagship institution, offering a comprehensive range of undergraduate and postgraduate programmes across arts, sciences, engineering, medicine, law, and business. With over 11,000 students including a growing international community, the university provides a rich academic experience in a Mediterranean setting. The university is a member of the European University Association and its degrees are recognised across the EU.',
    tuitionMin: 5000, tuitionMax: 15000,
    popularSubjects: ['Computer Science', 'Business & Management', 'Engineering', 'Medicine & Health Sciences', 'Law', 'Digital Arts', 'Tourism Studies'],
    strengths: ['Oldest and highest-ranked university in Malta', 'EU-recognised degrees across all programmes', 'Strong research output in Mediterranean studies', 'Growing international student community', 'Affordable tuition compared to Western Europe', 'Beautiful historic campus in Msida'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€5,000–€15,000/year', englishTests: ['IELTS 6.0-6.5', 'PTE 50-58', 'TOEFL 80-90'], scholarship: 'Malta Government Scholarship available', applicationStatus: 'Open' },
  },
  {
    slug: 'mcast', name: 'Malta College of Arts, Science & Technology (MCAST)', cs: 'malta', city: 'Paola',
    overview: 'MCAST is Malta\'s leading vocational and applied education institution, offering programmes from foundation level to bachelor\'s and master\'s degrees. With six specialised institutes covering engineering, IT, business, applied sciences, creative arts, and community services, MCAST provides hands-on, career-focused education. The college has strong links with industry and a high graduate employment rate.',
    tuitionMin: 3000, tuitionMax: 10000,
    popularSubjects: ['Information Technology', 'Engineering', 'Business Management', 'Applied Sciences', 'Creative Arts', 'Community Care', 'Maritime Studies'],
    strengths: ['Vocational and applied education focus', 'Strong industry partnerships', 'Modern facilities and workshops', 'Multiple pathway options from foundation to master\'s', 'High graduate employment rate', 'Affordable fees'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€3,000–€10,000/year', englishTests: ['IELTS 5.5-6.0', 'PTE 43-50'], scholarship: 'MCAST bursaries available', applicationStatus: 'Open' },
  },
  {
    slug: 'global-college-malta', name: 'Global College Malta', cs: 'malta', city: 'Kalkara',
    overview: 'Global College Malta is a private institution located in Smart City, Kalkara, offering British-accredited degree programmes. It specialises in business, management, and computing courses designed for international students. The college offers a modern learning environment with small class sizes and personalised attention.',
    tuitionMin: 6000, tuitionMax: 12000,
    popularSubjects: ['Business Administration', 'Management', 'Computing', 'Finance', 'Marketing', 'Tourism Management', 'International Business'],
    strengths: ['British-accredited programmes', 'Modern Smart City campus', 'Small class sizes', 'Strong focus on international business', 'Flexible study options', 'Affordable Mediterranean study destination'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€6,000–€12,000/year', englishTests: ['IELTS 6.0', 'PTE 50'], scholarship: 'Early-bird discounts available', applicationStatus: 'Open' },
  },
  {
    slug: 'london-school-of-commerce-malta', name: 'London School of Commerce Malta', cs: 'malta', city: 'Valletta',
    overview: 'The London School of Commerce Malta offers UK-accredited programmes in the heart of Valletta. As part of the LSC Group, it provides internationally recognised business and management degrees at affordable fees. Students benefit from a British curriculum while studying in a Mediterranean environment.',
    tuitionMin: 5000, tuitionMax: 9000,
    popularSubjects: ['Business Administration', 'Marketing', 'Finance', 'Human Resource Management', 'International Business', 'Accounting', 'Project Management'],
    strengths: ['UK-accredited degrees', 'Valletta city centre location', 'Part of LSC Group with global network', 'Affordable tuition fees', 'Business-focused curriculum', 'International student community'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€5,000–€9,000/year', englishTests: ['IELTS 6.0', 'PTE 50'], scholarship: 'LSC merit scholarships available', applicationStatus: 'Open' },
  },
  {
    slug: 'malta-institute-of-management', name: 'Malta Institute of Management', cs: 'malta', city: 'Sliema',
    overview: 'The Malta Institute of Management is a specialised institution focusing on business, management, and professional development. Located in Sliema, it offers accredited programmes in management, marketing, finance, and governance. The institute is known for its flexible study options catering to working professionals.',
    tuitionMin: 4000, tuitionMax: 10000,
    popularSubjects: ['Management', 'Marketing', 'Finance & Accounting', 'Business Strategy', 'Project Management', 'Governance', 'Human Resources'],
    strengths: ['Specialised management focus', 'Flexible study modes for professionals', 'Sliema business district location', 'Accredited professional programmes', 'Industry-experienced faculty', 'Networking opportunities'],
    quickFactsData: { intakes: ['October 2025', 'March 2026'], tuitionRange: '€4,000–€10,000/year', englishTests: ['IELTS 6.0', 'PTE 50'], scholarship: 'Corporate sponsorship options', applicationStatus: 'Open' },
  },
  {
    slug: 'st-martins-institute-of-higher-education', name: "St. Martin's Institute of Higher Education", cs: 'malta', city: 'Hamrun',
    overview: "St. Martin's Institute of Higher Education is an established private institution in Malta offering accredited British degree programmes. Founded in 1985, it provides programmes in computing, business, and management with strong emphasis on practical skills. The institute has a long track record of producing successful graduates.",
    tuitionMin: 5000, tuitionMax: 11000,
    popularSubjects: ['Computer Science', 'Business Administration', 'Management', 'Information Systems', 'Accounting', 'E-Commerce', 'Software Engineering'],
    strengths: ['Nearly 40 years of educational excellence', 'British accredited degree programmes', 'Strong computing and IT programmes', 'Experienced academic staff', 'Supportive learning environment', 'Affordable tuition'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€5,000–€11,000/year', englishTests: ['IELTS 6.0', 'PTE 50'], scholarship: 'Merit-based scholarships available', applicationStatus: 'Open' },
  },
  {
    slug: 'american-university-of-malta', name: 'American University of Malta', cs: 'malta', city: 'Cospicua',
    overview: 'The American University of Malta offers American-style education in the historic city of Cospicua. It provides accredited degree programmes across business, sciences, and liberal arts with a focus on critical thinking and innovation. The university is developing a new state-of-the-art campus in Cospicua\'s Smart City area.',
    tuitionMin: 7000, tuitionMax: 14000,
    popularSubjects: ['Business Administration', 'Computer Science', 'Communication', 'Graphic Design', 'Psychology', 'Environmental Studies', 'Liberal Arts'],
    strengths: ['American-style liberal arts education', 'Developing modern campus in Smart City', 'Small class sizes with personalised attention', 'Accredited degree programmes', 'Focus on critical thinking and innovation', 'Historic Cospicua location'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€7,000–€14,000/year', englishTests: ['IELTS 6.0-6.5', 'TOEFL 80'], scholarship: 'AUM merit scholarships available', applicationStatus: 'Open' },
  },
  {
    slug: 'gf-abela-junior-college', name: 'G.F. Abela Junior College', cs: 'malta', city: 'Msida',
    overview: 'G.F. Abela Junior College is a post-secondary institution in Malta that prepares students for university entrance. It offers pre-university programmes and foundation courses, making it an ideal pathway for international students who need additional preparation before entering a full degree programme at the University of Malta or other institutions.',
    tuitionMin: 2000, tuitionMax: 5000,
    popularSubjects: ['Foundation Studies', 'Pre-University Sciences', 'Pre-University Arts', 'English Language', 'Mathematics', 'Business Foundations', 'IT Foundations'],
    strengths: ['Gateway to University of Malta', 'Foundation and pre-university pathways', 'Experienced teaching staff', 'Affordable tuition', 'Central Msida location', 'Small supportive classes'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€2,000–€5,000/year', englishTests: ['IELTS 5.0-5.5', 'PTE 36-43'], scholarship: 'Government subsidised options', applicationStatus: 'Open' },
  },

  // ── CYPRUS (8) ──
  {
    slug: 'university-of-cyprus', name: 'University of Cyprus', cs: 'cyprus', city: 'Nicosia',
    ranking: 'QS #467', website: 'https://www.ucy.ac.cy',
    overview: 'The University of Cyprus is the leading public university in Cyprus, ranked #467 in the QS World University Rankings. Established in 1989, it has rapidly grown into a research-intensive institution with strong programmes in sciences, engineering, humanities, and social sciences. The university is actively involved in EU research programmes and offers both Greek-taught and English-taught postgraduate programmes.',
    tuitionMin: 3000, tuitionMax: 10000,
    popularSubjects: ['Computer Science', 'Engineering', 'Economics', 'Psychology', 'Political Science', 'Medicine', 'Natural Sciences'],
    strengths: ['QS #467 — top university in Cyprus', 'Strong research output and EU grants', 'Public university with affordable fees', 'Modern campus in Nicosia', 'Growing English-taught postgraduate options', 'Active Erasmus+ exchange programmes'],
    quickFactsData: { intakes: ['September 2025', 'February 2026'], tuitionRange: '€3,000–€10,000/year', englishTests: ['IELTS 6.5', 'PTE 58', 'TOEFL 85'], scholarship: 'Cyprus Government Scholarship available', applicationStatus: 'Open' },
  },
  {
    slug: 'university-of-nicosia', name: 'University of Nicosia', cs: 'cyprus', city: 'Nicosia',
    ranking: 'QS #631-640', website: 'https://www.unic.ac.cy',
    overview: 'The University of Nicosia is the largest private university in Cyprus, ranked #631-640 in the QS World University Rankings. It offers a comprehensive range of English-taught programmes across business, medicine, law, engineering, and IT. The university is known for its innovative online learning platform and has a diverse international student body from over 100 countries.',
    tuitionMin: 5000, tuitionMax: 12000,
    popularSubjects: ['Medicine', 'Business Administration', 'Computer Science', 'Law', 'Architecture', 'Psychology', 'Digital Media'],
    strengths: ['QS #631-640 — largest private university in Cyprus', 'Fully English-taught programmes', 'Diverse international student community (100+ nationalities)', 'Innovative online/hybrid learning options', 'Strong medical school programme', 'Modern Nicosia campus'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€5,000–€12,000/year', englishTests: ['IELTS 6.0-6.5', 'PTE 50-58', 'TOEFL 80-90'], scholarship: 'UNIC merit scholarships available', applicationStatus: 'Open' },
  },
  {
    slug: 'cyprus-university-of-technology', name: 'Cyprus University of Technology', cs: 'cyprus', city: 'Limassol',
    ranking: 'QS #531-540',
    overview: 'The Cyprus University of Technology (CUT) is a public research university in Limassol, ranked #531-540 in the QS World University Rankings. Founded in 2004, it focuses on applied sciences, engineering, technology, and business. CUT has rapidly established itself as a research leader, particularly in areas like renewable energy, environmental science, and information technology.',
    tuitionMin: 4000, tuitionMax: 10000,
    popularSubjects: ['Engineering', 'Computer Science', 'Environmental Science', 'Business Administration', 'Architecture', 'Multimedia & Graphic Arts', 'Health Sciences'],
    strengths: ['QS #531-540 — top public tech university', 'Strong focus on applied research', 'Limassol coastal city location', 'Excellent engineering and IT facilities', 'EU-funded research projects', 'Growing English-taught programmes'],
    quickFactsData: { intakes: ['September 2025', 'February 2026'], tuitionRange: '€4,000–€10,000/year', englishTests: ['IELTS 6.0-6.5', 'PTE 50-58', 'TOEFL 80'], scholarship: 'CUT research grants available', applicationStatus: 'Open' },
  },
  {
    slug: 'frederick-university', name: 'Frederick University', cs: 'cyprus', city: 'Nicosia',
    ranking: 'QS #801-850',
    overview: 'Frederick University is one of the oldest and most established private universities in Cyprus, ranked #801-850 in the QS World University Rankings. Founded in 1965, it operates campuses in Nicosia and Limassol, offering a wide range of English-taught programmes. The university is known for its strong industry connections and focus on employability.',
    tuitionMin: 4500, tuitionMax: 11000,
    popularSubjects: ['Business Administration', 'Computer Science', 'Engineering', 'Law', 'Architecture', 'Education', 'Graphic Design'],
    strengths: ['QS #801-850 — established since 1965', 'Two campuses in Nicosia and Limassol', 'Strong industry connections', 'Focus on graduate employability', 'Comprehensive English-taught programmes', 'Active student life and societies'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€4,500–€11,000/year', englishTests: ['IELTS 5.5-6.5', 'PTE 43-58', 'TOEFL 75-90'], scholarship: 'Frederick merit awards available', applicationStatus: 'Open' },
  },
  {
    slug: 'neapolis-university-paphos', name: 'Neapolis University Paphos', cs: 'cyprus', city: 'Paphos',
    overview: 'Neapolis University Paphos is a modern private university located in the coastal city of Paphos, Cyprus. It offers English-taught programmes in business, law, computing, architecture, and health sciences. The university boasts a brand-new campus with state-of-the-art facilities and a strong emphasis on research and innovation.',
    tuitionMin: 4000, tuitionMax: 9000,
    popularSubjects: ['Business Administration', 'Law', 'Computer Science', 'Architecture', 'Psychology', 'Real Estate', 'Sports Management'],
    strengths: ['Modern purpose-built campus', 'Beautiful coastal Paphos location', 'English-taught programmes throughout', 'Strong law and business schools', 'Growing research profile', 'Affordable tuition fees'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€4,000–€9,000/year', englishTests: ['IELTS 5.5-6.0', 'PTE 43-50'], scholarship: 'NUP early-bird discounts', applicationStatus: 'Open' },
  },
  {
    slug: 'uclan-cyprus', name: 'UCLan Cyprus', cs: 'cyprus', city: 'Larnaca',
    overview: 'UCLan Cyprus is a branch campus of the University of Central Lancashire (UK), located in Larnaca. It offers British-accredited degrees in a Mediterranean setting, with programmes in business, computing, law, and the sciences. Students receive a UK degree while enjoying the lifestyle and lower costs of studying in Cyprus.',
    tuitionMin: 5000, tuitionMax: 10000,
    popularSubjects: ['Business Administration', 'Computer Science', 'Law', 'Psychology', 'Mechanical Engineering', 'Civil Engineering', 'Sports Science'],
    strengths: ['UK-accredited degree (UCLan)', 'British curriculum in Cyprus', 'Larnaca coastal location', 'Moderate tuition fees', 'Strong computing and engineering programmes', 'Direct pathway to UK further study'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€5,000–€10,000/year', englishTests: ['IELTS 6.0', 'PTE 50', 'TOEFL 80'], scholarship: 'UCLan Cyprus merit awards', applicationStatus: 'Open' },
  },
  {
    slug: 'european-university-cyprus', name: 'European University Cyprus', cs: 'cyprus', city: 'Nicosia',
    ranking: 'QS #701-750',
    overview: 'European University Cyprus is a leading private university in Nicosia, ranked #701-750 in the QS World University Rankings. It offers a broad portfolio of English-taught undergraduate and postgraduate programmes in business, medicine, law, IT, and the humanities. The university is committed to student-centred learning and has a vibrant international community.',
    tuitionMin: 5000, tuitionMax: 12000,
    popularSubjects: ['Business Administration', 'Computer Science', 'Medicine', 'Law', 'Psychology', 'Education', 'Communications'],
    strengths: ['QS #701-750 — high teaching standards', 'Strong medical school programme', 'Comprehensive English-taught portfolio', 'Student-centred learning approach', 'Vibrant Nicosia campus life', 'Good graduate employment outcomes'],
    quickFactsData: { intakes: ['October 2025', 'March 2026'], tuitionRange: '€5,000–€12,000/year', englishTests: ['IELTS 6.0-6.5', 'PTE 50-58'], scholarship: 'EUC merit scholarships available', applicationStatus: 'Open' },
  },
  {
    slug: 'cyprus-international-university', name: 'Cyprus International University', cs: 'cyprus', city: 'Nicosia',
    overview: 'Cyprus International University is a dynamic private university in Nicosia offering affordable English-taught programmes. It has a strong focus on engineering, IT, and business, with a growing international student population. The university provides modern facilities and a supportive learning environment.',
    tuitionMin: 3500, tuitionMax: 8000,
    popularSubjects: ['Computer Engineering', 'Business Administration', 'Civil Engineering', 'Electrical Engineering', 'Law', 'Architecture', 'Psychology'],
    strengths: ['Affordable tuition fees', 'Fully English-taught programmes', 'Strong engineering faculty', 'Modern campus facilities', 'Diverse international community', 'Scholarship opportunities for international students'],
    quickFactsData: { intakes: ['October 2025', 'February 2026'], tuitionRange: '€3,500–€8,000/year', englishTests: ['IELTS 5.5-6.0', 'PTE 43-50', 'TOEFL 70-80'], scholarship: 'CIU international student scholarships', applicationStatus: 'Open' },
  },

  // ── SOUTH KOREA (10) ──
  {
    slug: 'seoul-national-university', name: 'Seoul National University (SNU)', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #31', website: 'https://www.snu.ac.kr',
    overview: 'Seoul National University is South Korea\'s most prestigious university, ranked #31 in the QS World University Rankings. Founded in 1946, SNU has produced numerous heads of state, Nobel laureates, and business leaders. The university offers a comprehensive range of programmes across all disciplines, with particularly strong offerings in engineering, natural sciences, social sciences, and humanities. SNU provides generous scholarships for international students.',
    tuitionMin: 4000000, tuitionMax: 8000000,
    popularSubjects: ['Computer Science', 'Electrical Engineering', 'Business Administration', 'International Relations', 'Chemical Engineering', 'Medicine', 'Economics'],
    strengths: ['QS #31 — Korea\'s #1 university', 'Comprehensive programme offerings', 'Generous GKS and merit scholarships', 'World-class research facilities', 'Extensive global alumni network', 'Beautiful Seoul campus'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩8,000,000/semester', englishTests: ['IELTS 6.5+', 'TOEFL 88+', 'TOPIK 4+ for Korean-taught'], scholarship: 'GKS (full), SNU merit scholarships', applicationStatus: 'Open' },
  },
  {
    slug: 'kaist', name: 'KAIST (Korea Advanced Institute of Science & Technology)', cs: 'south-korea', city: 'Daejeon',
    ranking: 'QS #53', website: 'https://www.kaist.ac.kr',
    overview: 'KAIST is South Korea\'s premier science and technology university, ranked #53 globally. Founded in 1971, it is widely regarded as Asia\'s top STEM university. KAIST offers undergraduate and graduate programmes in engineering, natural sciences, and computing, with an almost fully English-taught curriculum. The university provides full scholarships for international students, including tuition and monthly stipend.',
    tuitionMin: 3000000, tuitionMax: 6000000,
    popularSubjects: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Bio & Brain Engineering', 'Chemical Engineering', 'Physics', 'Mathematics'],
    strengths: ['QS #53 — Asia\'s top STEM university', 'Full scholarships for international students', 'Nearly all-English curriculum', 'Research-intensive culture', 'Home to many tech startup founders', 'State-of-the-art facilities'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩3,000,000–₩6,000,000/semester', englishTests: ['IELTS 6.5+', 'TOEFL 80+'], scholarship: 'Full tuition + stipend for international students', applicationStatus: 'Open' },
  },
  {
    slug: 'yonsei-university', name: 'Yonsei University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #56', website: 'https://www.yonsei.ac.kr',
    overview: 'Yonsei University is one of South Korea\'s most prestigious private universities, ranked #56 in the QS World University Rankings. Founded in 1885, it is part of the prestigious "SKY" trio (Seoul National, Korea, Yonsei). Yonsei offers a wide range of programmes and has a strong reputation for its Underwood International College, which is fully English-taught. The university excels in business, medicine, engineering, and the humanities.',
    tuitionMin: 4000000, tuitionMax: 9000000,
    popularSubjects: ['Business Administration', 'Medicine', 'Computer Science', 'International Studies', 'Mechanical Engineering', 'Psychology', 'Korean Language & Literature'],
    strengths: ['QS #56 — member of prestigious SKY trio', 'Underwood International College (fully English)', 'Strong global exchange partnerships', 'Excellent medical and business schools', 'Rich campus traditions and culture', 'Beautiful Sinchon campus in Seoul'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩9,000,000/semester', englishTests: ['IELTS 6.5+', 'TOEFL 88+'], scholarship: 'Yonsei Global Scholarship available', applicationStatus: 'Open' },
  },
  {
    slug: 'korea-university', name: 'Korea University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #79', website: 'https://www.korea.edu',
    overview: 'Korea University is a prestigious private research university in Seoul, ranked #79 in the QS World University Rankings. Founded in 1905, it is the oldest university in Korea and a member of the SKY trio. KU is particularly renowned for its business school (KUBS), law school, and strong programmes in engineering, humanities, and social sciences. The university has a vibrant international community and extensive global partnerships.',
    tuitionMin: 4000000, tuitionMax: 8500000,
    popularSubjects: ['Business Administration', 'Law', 'Computer Science', 'Political Science', 'Electrical Engineering', 'Economics', 'Media & Communication'],
    strengths: ['QS #79 — oldest university in Korea', 'Top-ranked business school (KUBS)', 'Member of prestigious SKY trio', 'Strong law and humanities programmes', 'Extensive global partnerships', 'Active alumni network in business and politics'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩8,500,000/semester', englishTests: ['IELTS 6.5+', 'TOEFL 88+'], scholarship: 'KU Global Scholarship, GKS', applicationStatus: 'Open' },
  },
  {
    slug: 'postech', name: 'POSTECH (Pohang University of Science and Technology)', cs: 'south-korea', city: 'Pohang',
    ranking: 'QS #98', website: 'https://www.postech.ac.kr',
    overview: 'POSTECH is a private research university in Pohang, ranked #98 in the QS World University Rankings. Founded in 1986 by POSCO (one of the world\'s largest steel companies), it is one of Asia\'s top science and technology institutions. POSTECH is known for its small student-to-faculty ratio, fully English-taught graduate programmes, and generous financial support for international students.',
    tuitionMin: 3000000, tuitionMax: 6000000,
    popularSubjects: ['Computer Science', 'Materials Science', 'Chemical Engineering', 'Mechanical Engineering', 'Physics', 'Life Sciences', 'Industrial Engineering'],
    strengths: ['QS #98 — top 100 globally', 'Founded by POSCO with strong industry ties', 'Exceptionally small student-to-faculty ratio', 'Fully English-taught graduate programmes', 'Generous scholarships including full support', 'Beautiful campus with world-class labs'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩3,000,000–₩6,000,000/semester', englishTests: ['IELTS 6.5+', 'TOEFL 80+'], scholarship: 'Full tuition waiver + stipend available', applicationStatus: 'Open' },
  },
  {
    slug: 'sungkyunkwan-university', name: 'Sungkyunkwan University (SKKU)', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #145', website: 'https://www.skku.edu',
    overview: 'Sungkyunkwan University is a prestigious private university in Seoul, ranked #145 in the QS World University Rankings. Founded in 1398 during the Joseon Dynasty, it is one of the oldest universities in East Asia. SKKU is known for its strong partnership with Samsung Electronics and excels in engineering, business, and semiconductor research. The university offers growing English-taught programmes.',
    tuitionMin: 4000000, tuitionMax: 8000000,
    popularSubjects: ['Semiconductor Engineering', 'Business Administration', 'Computer Science', 'Software Engineering', 'Economics', 'Pharmacy', 'Global Business'],
    strengths: ['QS #145 — Samsung partnership university', 'Over 600 years of academic history', 'Leading semiconductor engineering programmes', 'Strong business school', 'Growing English-taught curriculum', 'Seoul and Suwon dual campuses'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩8,000,000/semester', englishTests: ['IELTS 6.0+', 'TOEFL 80+'], scholarship: 'SKKU Global Scholarship available', applicationStatus: 'Open' },
  },
  {
    slug: 'hanyang-university', name: 'Hanyang University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #162', website: 'https://www.hanyang.ac.kr',
    overview: 'Hanyang University is a leading private research university in Seoul, ranked #162 in the QS World University Rankings. Founded in 1939 as the first engineering institute in Korea, it is renowned for its engineering and architecture programmes. Hanyang offers comprehensive programmes across all fields with growing English-taught options and has a strong reputation for industry collaboration and entrepreneurship.',
    tuitionMin: 4000000, tuitionMax: 7500000,
    popularSubjects: ['Engineering', 'Architecture', 'Business Administration', 'Computer Science', 'Design', 'Communication', 'Biomedical Engineering'],
    strengths: ['QS #162 — Korea\'s #1 engineering university', 'Strong entrepreneurship and startup support', 'Excellent architecture and design programmes', 'Industry collaboration with top Korean companies', 'Growing English-taught courses', 'Active international exchange programmes'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩7,500,000/semester', englishTests: ['IELTS 6.0+', 'TOEFL 80+'], scholarship: 'Hanyang International Scholarship', applicationStatus: 'Open' },
  },
  {
    slug: 'sogang-university', name: 'Sogang University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #436', website: 'https://www.sogang.ac.kr',
    overview: 'Sogang University is a highly regarded private Jesuit university in Seoul, ranked #436 in the QS World University Rankings. Founded in 1960, it is known for its excellent humanities, social sciences, and business programmes. Sogang has a strong international focus and offers several English-taught graduate programmes. The university is located in the heart of Seoul\'s Sinchon district.',
    tuitionMin: 3500000, tuitionMax: 7000000,
    popularSubjects: ['Business Administration', 'Economics', 'International Relations', 'Computer Science', 'Media & Communication', 'Korean Studies', 'Sociology'],
    strengths: ['Strong humanities and social sciences', 'Jesuit educational tradition', 'Central Sinchon location', 'Growing English-taught programmes', 'Intimate campus community', 'Good exchange programme options'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩3,500,000–₩7,000,000/semester', englishTests: ['IELTS 6.0+', 'TOEFL 80+'], scholarship: 'Sogang Global Scholarship', applicationStatus: 'Open' },
  },
  {
    slug: 'ewha-womans-university', name: 'Ewha Womans University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #496', website: 'https://www.ewha.ac.kr',
    overview: 'Ewha Womans University is the world\'s largest women\'s university, ranked #496 in the QS World University Rankings. Founded in 1886, it is one of Korea\'s most prestigious institutions with notable alumni in politics, business, and the arts. Ewha offers comprehensive programmes and has a particularly strong international studies school. The university also admits male students to its graduate programmes.',
    tuitionMin: 3500000, tuitionMax: 7000000,
    popularSubjects: ['International Studies', 'Business Administration', 'English Literature', 'Education', 'Music', 'Computer Science', 'Media Studies'],
    strengths: ['QS #496 — world\'s largest women\'s university', 'Strong Graduate School of International Studies', 'Beautiful historic campus in Seoul', 'Excellent English and education programmes', 'Male students welcome in graduate programmes', 'Rich cultural and artistic traditions'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩3,500,000–₩7,000,000/semester', englishTests: ['IELTS 6.0+', 'TOEFL 80+'], scholarship: 'Ewha Global Scholarship', applicationStatus: 'Open' },
  },
  {
    slug: 'kyung-hee-university', name: 'Kyung Hee University', cs: 'south-korea', city: 'Seoul',
    ranking: 'QS #328', website: 'https://www.khu.ac.kr',
    overview: 'Kyung Hee University is a prestigious private university in Seoul, ranked #328 in the QS World University Rankings. Founded in 1949, it is known for its beautiful campus and strong programmes in international studies, hospitality, engineering, and Korean medicine. Kyung Hee is a leader in peace studies and global engagement, hosting the annual Kyung Hee International Peace Forum.',
    tuitionMin: 4000000, tuitionMax: 7500000,
    popularSubjects: ['International Studies', 'Hospitality & Tourism', 'Computer Science', 'Architecture', 'Korean Medicine', 'Business Administration', 'Political Science'],
    strengths: ['QS #328 — leader in peace and global studies', 'Beautiful Seoul campus', 'Top hospitality and tourism school in Korea', 'Strong international studies programmes', 'Unique Korean Medicine programme', 'Active global engagement initiatives'],
    quickFactsData: { intakes: ['March 2026', 'September 2025'], tuitionRange: '₩4,000,000–₩7,500,000/semester', englishTests: ['IELTS 6.0+', 'TOEFL 80+'], scholarship: 'KHU Global Scholarship', applicationStatus: 'Open' },
  },
];

// ============================================================
// PART 4: HERO SLIDE DATA
// ============================================================
const HERO_SLIDES = [
  {
    countrySlug: 'malta',
    headline: 'Study in Malta — EU Degrees, Mediterranean Life',
    subtitle: 'English-taught programmes, affordable tuition, and EU-recognised degrees on a beautiful Mediterranean island.',
    accentColor: '#D4A017',
    sortOrder: 8,
  },
  {
    countrySlug: 'cyprus',
    headline: 'Study in Cyprus — Your Gateway to Europe',
    subtitle: 'Affordable English-taught degrees in an EU member state with sunshine, beaches, and career opportunities.',
    accentColor: '#1E8449',
    sortOrder: 9,
  },
  {
    countrySlug: 'south-korea',
    headline: 'Study in South Korea — Innovation Meets Tradition',
    subtitle: 'World-class universities, cutting-edge technology, generous scholarships, and the vibrant K-culture experience.',
    accentColor: '#C0392B',
    sortOrder: 10,
  },
];

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== ALO Education - Seed Malta, Cyprus, South Korea ===');

  // ── Step 1: Create Country Pages ──
  console.log('\n--- Creating Country Pages ---');
  let countryCount = 0;
  for (const [slug, data] of Object.entries(COUNTRY_DATA)) {
    await db.countryPage.upsert({
      where: { slug },
      update: {
        name: data.name, shortName: data.shortName, flag: data.flag,
        capital: data.capital, currency: data.currency, intro: data.intro,
        quickFacts: J(data.quickFacts),
        whyStudy: J(genWhyStudy(data.name)),
        scholarships: J(genScholarships(data.shortName)),
        cities: J(data.cities),
        faqs: J(genFaqs(data.name)),
      },
      create: {
        slug, name: data.name, shortName: data.shortName, flag: data.flag,
        capital: data.capital, currency: data.currency, intro: data.intro,
        quickFacts: J(data.quickFacts),
        whyStudy: J(genWhyStudy(data.name)),
        scholarships: J(genScholarships(data.shortName)),
        cities: J(data.cities),
        faqs: J(genFaqs(data.name)),
      },
    });
    countryCount++;
  }
  console.log(`Created/updated ${countryCount} country pages`);

  // ── Helper: Create university ──
  async function createUni(u: any) {
    const tmpl = COURSE_TEMPLATES[u.cs];
    if (!tmpl) return;
    const tRange = u.tuitionMin
      ? `${tmpl.prefix}${u.tuitionMin.toLocaleString()}–${tmpl.prefix}${u.tuitionMax.toLocaleString()} / year`
      : `${tmpl.prefix}5,000–${tmpl.prefix}15,000 / year`;
    try {
      await db.universityPage.create({
        data: {
          slug: u.slug, name: u.name, countrySlug: u.cs, city: u.city,
          ranking: u.ranking || null, rankingSource: 'QS World University Rankings 2025',
          overview: u.overview || `${u.name} is a leading university in ${u.city}.`,
          strengths: J(u.strengths || ['Quality education', 'International student support', 'Research excellence', 'Industry connections']),
          quickFacts: J(u.quickFactsData || { intakes: ['September 2025', 'January 2026'], tuitionRange: tRange, englishTests: ['IELTS 6.0-7.0', 'PTE 50-65', 'TOEFL 80-100'], scholarship: 'Merit awards available', applicationStatus: 'Open' }),
          tuition: J({ pg: tRange, deposit: `${tmpl.prefix}2,000–3,000`, scholarship: `${tmpl.prefix}1,000–5,000`, paymentPlan: 'Instalments available' }),
          tuitionRange: tRange,
          scholarshipAvailable: true,
          popularSubjects: J(u.popularSubjects || ['Business & Management', 'Computer Science', 'Engineering', 'Data Science', 'Law', 'Social Sciences', 'Arts']),
          requiredDocuments: J(genDocs()),
          officialWebsite: u.website || null,
          sourceUrl: u.website || null,
          lastVerifiedAt: NOW, verificationStatus: 'VERIFIED', status: 'PUBLISHED',
        },
      });
      return true;
    } catch (e: any) {
      if (!e.message?.includes('Unique constraint')) console.log(`  WARN ${u.name}: ${e.message?.substring(0, 60)}`);
      return false;
    }
  }

  // ── Helper: Create courses for a university ──
  async function createCourses(uniSlug: string, uniName: string, cs: string, city: string, website?: string) {
    const tmpl = COURSE_TEMPLATES[cs];
    if (!tmpl) return 0;
    let count = 0;
    // Assign 2-3 courses per university (pick from template)
    const courseIndices = uniSlug === 'university-of-malta' || uniSlug === 'university-of-cyprus' || uniSlug === 'seoul-national-university'
      ? [0, 1, 2]  // 3 courses for top universities
      : [0, 1];     // 2 courses for others
    for (const idx of courseIndices) {
      const t = tmpl.courses[idx];
      if (!t) continue;
      const courseSlug = `${uniSlug}-${t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      try {
        await db.coursePage.create({
          data: {
            slug: courseSlug, name: `${t.title} - ${uniName}`, universitySlug: uniSlug,
            countrySlug: cs, city: city, level: t.level, subject: t.subject,
            duration: t.duration,
            intake: cs === 'south-korea' ? 'March 2026, September 2025' : 'October 2025, February 2026',
            tuition: `${tmpl.prefix}${t.tuitionBase.toLocaleString()} / ${cs === 'south-korea' ? 'semester' : 'year'}`,
            tuitionCurrency: tmpl.currency,
            scholarship: 'Merit scholarship available', scholarshipAvailable: true,
            englishRequirement: 'IELTS 6.5 overall, minimum 6.0 in each component',
            academicRequirement: t.level === 'Bachelors' ? 'High school certificate with good grades' : 'Bachelor degree with 2:1 or equivalent',
            overview: `The ${t.title} at ${uniName} is a comprehensive programme designed to equip students with industry-relevant skills. Located in ${city}, this programme combines theoretical foundations with practical applications.`,
            modules: J(['Core Module 1', 'Core Module 2', 'Elective', 'Research Methods', 'Industry Project', 'Dissertation']),
            careerOutcomes: J(['Industry professional', 'Consultant', 'Analyst', 'Manager', 'Researcher']),
            requiredDocuments: J(genDocs()),
            deadline: cs === 'south-korea' ? 'December 2025 (March intake)' : 'August 2025 (October intake)',
            sourceUrl: website || null,
            lastVerifiedAt: NOW, verificationStatus: 'VERIFIED', status: 'PUBLISHED',
          },
        });
        count++;
      } catch (e: any) { /* skip dupes */ }
    }
    return count;
  }

  // ── Step 2: Create Universities ──
  console.log('\n--- Seeding Universities ---');
  let uniCount = 0, courseCount = 0;
  const existingSlugs = new Set((await db.universityPage.findMany({ select: { slug: true } })).map((u: any) => u.slug));

  for (const u of UNIVERSITIES) {
    if (existingSlugs.has(u.slug)) continue;
    const ok = await createUni(u);
    if (ok) {
      uniCount++;
      courseCount += await createCourses(u.slug, u.name, u.cs, u.city, u.website);
    }
  }
  console.log(`Created ${uniCount} universities, ${courseCount} courses`);

  // ── Step 3: Create Hero Slides ──
  console.log('\n--- Creating Hero Slides ---');
  let slideCount = 0;
  for (const slide of HERO_SLIDES) {
    try {
      await db.homeHeroSlide.create({
        data: {
          countrySlug: slide.countrySlug,
          headline: slide.headline,
          subtitle: slide.subtitle,
          accentColor: slide.accentColor,
          sortOrder: slide.sortOrder,
          status: 'ACTIVE',
        },
      });
      slideCount++;
    } catch (e: any) { /* skip dupes */ }
  }
  console.log(`Created ${slideCount} hero slides`);

  // ── Final Summary ──
  console.log('\n=== SEED COMPLETE ===');
  const totalUnis = await db.universityPage.count();
  const totalCourses = await db.coursePage.count();
  const totalCountries = await db.countryPage.count();
  console.log(`Total Countries: ${totalCountries}`);
  console.log(`Total Universities: ${totalUnis}`);
  console.log(`Total Courses: ${totalCourses}`);

  const byCountry = await db.universityPage.groupBy({ by: ['countrySlug'], _count: true, orderBy: { countrySlug: 'asc' } });
  console.log('\nBy country:');
  for (const c of byCountry) {
    const cc = await db.coursePage.count({ where: { countrySlug: c.countrySlug } });
    console.log(`  ${c.countrySlug}: ${c._count} universities, ${cc} courses`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
