import { db } from '../src/lib/db'

// ============================================================
// UK Universities & Courses Seed Script
// Run with: bun run scripts/seed-uk-universities.ts
// ============================================================

const BATCH_ID = 'UK-SEED-2025'
const NOW = new Date().toISOString()

// ============================================================
// University Data
// ============================================================

interface UniversityData {
  universityId: string
  name: string
  country: string
  city: string
  campusName: string
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
  sourceUrl: string
}

const universities: UniversityData[] = [
  // ===== RUSSELL GROUP (1-24) =====
  {
    universityId: 'UK-OXFORD',
    name: 'University of Oxford',
    country: 'United Kingdom',
    city: 'Oxford',
    campusName: 'Main Campus',
    ranking: 1,
    worldRanking: 3,
    type: 'Public',
    founded: 1096,
    students: '26,815',
    intlStudents: '45%',
    ieltsMin: 7.0,
    tuitionRange: '£28,000-£42,000',
    scholarships: true,
    description: 'The University of Oxford is the oldest university in the English-speaking world and one of the most prestigious globally. It comprises 39 colleges and offers a world-class education across all major disciplines.',
    featured: true,
    website: 'ox.ac.uk',
    officialUrl: 'https://www.ox.ac.uk',
    sourceUrl: 'https://www.ox.ac.uk/admissions/graduate',
  },
  {
    universityId: 'UK-CAMBRIDGE',
    name: 'University of Cambridge',
    country: 'United Kingdom',
    city: 'Cambridge',
    campusName: 'Main Campus',
    ranking: 2,
    worldRanking: 5,
    type: 'Public',
    founded: 1209,
    students: '24,450',
    intlStudents: '42%',
    ieltsMin: 7.0,
    tuitionRange: '£27,000-£40,000',
    scholarships: true,
    description: 'The University of Cambridge is one of the world\'s oldest and most prestigious universities, known for its academic excellence and groundbreaking research across science, humanities, and social sciences.',
    featured: true,
    website: 'cam.ac.uk',
    officialUrl: 'https://www.cam.ac.uk',
    sourceUrl: 'https://www.postgraduate.study.cam.ac.uk',
  },
  {
    universityId: 'UK-ICL',
    name: 'Imperial College London',
    country: 'United Kingdom',
    city: 'London',
    campusName: 'South Kensington Campus',
    ranking: 3,
    worldRanking: 6,
    type: 'Public',
    founded: 1907,
    students: '22,650',
    intlStudents: '60%',
    ieltsMin: 6.5,
    tuitionRange: '£32,000-£45,000',
    scholarships: true,
    description: 'Imperial College London is a world-leading university specialising in science, engineering, medicine, and business. Consistently ranked among the top universities globally for STEM subjects.',
    featured: true,
    website: 'imperial.ac.uk',
    officialUrl: 'https://www.imperial.ac.uk',
    sourceUrl: 'https://www.imperial.ac.uk/study/courses/',
  },
  {
    universityId: 'UK-UCL',
    name: 'University College London',
    country: 'United Kingdom',
    city: 'London',
    campusName: 'Bloomsbury Campus',
    ranking: 4,
    worldRanking: 9,
    type: 'Public',
    founded: 1826,
    students: '46,000',
    intlStudents: '55%',
    ieltsMin: 6.5,
    tuitionRange: '£26,000-£38,000',
    scholarships: true,
    description: 'UCL is London\'s leading multidisciplinary university with a global reputation for research and teaching excellence. It was the first university in England to admit students regardless of religion or gender.',
    featured: true,
    website: 'ucl.ac.uk',
    officialUrl: 'https://www.ucl.ac.uk',
    sourceUrl: 'https://www.ucl.ac.uk/prospective-students/graduate',
  },
  {
    universityId: 'UK-LSE',
    name: 'London School of Economics and Political Science',
    country: 'United Kingdom',
    city: 'London',
    campusName: 'Houghton Street Campus',
    ranking: 5,
    worldRanking: 56,
    type: 'Public',
    founded: 1895,
    students: '12,000',
    intlStudents: '70%',
    ieltsMin: 7.0,
    tuitionRange: '£26,000-£34,000',
    scholarships: true,
    description: 'LSE is a world-leading specialist social science university, renowned for its research in economics, politics, law, and sociology. Located in the heart of London.',
    featured: true,
    website: 'lse.ac.uk',
    officialUrl: 'https://www.lse.ac.uk',
    sourceUrl: 'https://www.lse.ac.uk/study-at-lse/Graduate',
  },
  {
    universityId: 'UK-EDINBURGH',
    name: 'University of Edinburgh',
    country: 'United Kingdom',
    city: 'Edinburgh',
    campusName: 'Central Campus',
    ranking: 6,
    worldRanking: 27,
    type: 'Public',
    founded: 1583,
    students: '44,500',
    intlStudents: '45%',
    ieltsMin: 6.5,
    tuitionRange: '£24,000-£36,000',
    scholarships: true,
    description: 'The University of Edinburgh is one of the world\'s most prestigious research universities. It is consistently ranked among the top 30 universities globally and is known for its strength in medicine, science, and humanities.',
    featured: true,
    website: 'ed.ac.uk',
    officialUrl: 'https://www.ed.ac.uk',
    sourceUrl: 'https://www.ed.ac.uk/studying/postgraduate',
  },
  {
    universityId: 'UK-MANCHESTER',
    name: 'University of Manchester',
    country: 'United Kingdom',
    city: 'Manchester',
    campusName: 'Oxford Road Campus',
    ranking: 7,
    worldRanking: 32,
    type: 'Public',
    founded: 1824,
    students: '44,000',
    intlStudents: '40%',
    ieltsMin: 6.0,
    tuitionRange: '£22,000-£35,000',
    scholarships: true,
    description: 'The University of Manchester is the largest single-site university in the UK and a member of the prestigious Russell Group. It has a rich heritage of innovation and is known for its research excellence.',
    featured: true,
    website: 'manchester.ac.uk',
    officialUrl: 'https://www.manchester.ac.uk',
    sourceUrl: 'https://www.manchester.ac.uk/study/masters/',
  },
  {
    universityId: 'UK-KCL',
    name: "King's College London",
    country: 'United Kingdom',
    city: 'London',
    campusName: 'Strand Campus',
    ranking: 8,
    worldRanking: 40,
    type: 'Public',
    founded: 1829,
    students: '35,500',
    intlStudents: '48%',
    ieltsMin: 6.5,
    tuitionRange: '£23,000-£37,000',
    scholarships: true,
    description: "King's College London is one of the oldest and most prestigious universities in England, known for its world-class research and teaching in health, law, and the arts & sciences.",
    featured: true,
    website: 'kcl.ac.uk',
    officialUrl: 'https://www.kcl.ac.uk',
    sourceUrl: 'https://www.kcl.ac.uk/study/postgraduate-taught',
  },
  {
    universityId: 'UK-BRISTOL',
    name: 'University of Bristol',
    country: 'United Kingdom',
    city: 'Bristol',
    campusName: 'Clifton Campus',
    ranking: 9,
    worldRanking: 55,
    type: 'Public',
    founded: 1876,
    students: '29,200',
    intlStudents: '30%',
    ieltsMin: 6.5,
    tuitionRange: '£22,000-£33,000',
    scholarships: true,
    description: 'The University of Bristol is a red brick research university known for its academic excellence and vibrant student life. It ranks consistently among the top UK universities.',
    featured: false,
    website: 'bristol.ac.uk',
    officialUrl: 'https://www.bristol.ac.uk',
    sourceUrl: 'https://www.bristol.ac.uk/study/postgraduate/',
  },
  {
    universityId: 'UK-WARWICK',
    name: 'University of Warwick',
    country: 'United Kingdom',
    city: 'Coventry',
    campusName: 'Main Campus',
    ranking: 10,
    worldRanking: 64,
    type: 'Public',
    founded: 1965,
    students: '28,500',
    intlStudents: '40%',
    ieltsMin: 6.0,
    tuitionRange: '£21,000-£33,000',
    scholarships: true,
    description: 'The University of Warwick is a world-class research university known for its strong connections with industry, particularly in business, engineering, and mathematics. Home to the renowned Warwick Business School.',
    featured: false,
    website: 'warwick.ac.uk',
    officialUrl: 'https://warwick.ac.uk',
    sourceUrl: 'https://warwick.ac.uk/study/postgraduate/',
  },
  {
    universityId: 'UK-GLASGOW',
    name: 'University of Glasgow',
    country: 'United Kingdom',
    city: 'Glasgow',
    campusName: 'Gilmorehill Campus',
    ranking: 11,
    worldRanking: 78,
    type: 'Public',
    founded: 1451,
    students: '35,500',
    intlStudents: '35%',
    ieltsMin: 6.5,
    tuitionRange: '£20,000-£32,000',
    scholarships: true,
    description: 'The University of Glasgow is the fourth oldest university in the English-speaking world and a member of the Russell Group. It is renowned for its research contributions and diverse academic programmes.',
    featured: false,
    website: 'gla.ac.uk',
    officialUrl: 'https://www.gla.ac.uk',
    sourceUrl: 'https://www.gla.ac.uk/postgraduate/taught/',
  },
  {
    universityId: 'UK-SOUTHAMPTON',
    name: 'University of Southampton',
    country: 'United Kingdom',
    city: 'Southampton',
    campusName: 'Highfield Campus',
    ranking: 12,
    worldRanking: 80,
    type: 'Public',
    founded: 1862,
    students: '25,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£20,000-£30,000',
    scholarships: true,
    description: 'The University of Southampton is a research-intensive university known for its strengths in engineering, computer science, and oceanography. A founding member of the Russell Group.',
    featured: false,
    website: 'soton.ac.uk',
    officialUrl: 'https://www.southampton.ac.uk',
    sourceUrl: 'https://www.southampton.ac.uk/courses/postgraduate-taught',
  },
  {
    universityId: 'UK-LEEDS',
    name: 'University of Leeds',
    country: 'United Kingdom',
    city: 'Leeds',
    campusName: 'Main Campus',
    ranking: 13,
    worldRanking: 82,
    type: 'Public',
    founded: 1904,
    students: '38,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£20,000-£31,000',
    scholarships: true,
    description: 'The University of Leeds is a Russell Group university known for its research excellence and strong industry connections. It offers a wide range of programmes and has one of the largest student bodies in the UK.',
    featured: false,
    website: 'leeds.ac.uk',
    officialUrl: 'https://www.leeds.ac.uk',
    sourceUrl: 'https://courses.leeds.ac.uk/',
  },
  {
    universityId: 'UK-BIRMINGHAM',
    name: 'University of Birmingham',
    country: 'United Kingdom',
    city: 'Birmingham',
    campusName: 'Edgbaston Campus',
    ranking: 14,
    worldRanking: 84,
    type: 'Public',
    founded: 1900,
    students: '36,000',
    intlStudents: '32%',
    ieltsMin: 6.0,
    tuitionRange: '£20,000-£30,000',
    scholarships: true,
    description: 'The University of Birmingham is a founding member of the Russell Group and a leading research university. Its beautiful campus is home to world-class facilities and a vibrant international community.',
    featured: false,
    website: 'birmingham.ac.uk',
    officialUrl: 'https://www.birmingham.ac.uk',
    sourceUrl: 'https://www.birmingham.ac.uk/postgraduate/courses',
  },
  {
    universityId: 'UK-NOTTINGHAM',
    name: 'University of Nottingham',
    country: 'United Kingdom',
    city: 'Nottingham',
    campusName: 'University Park Campus',
    ranking: 15,
    worldRanking: 108,
    type: 'Public',
    founded: 1881,
    students: '35,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£20,000-£30,000',
    scholarships: true,
    description: 'The University of Nottingham is a research-intensive university and a member of the Russell Group. It has a global reputation for teaching excellence and strong links with industry.',
    featured: false,
    website: 'nottingham.ac.uk',
    officialUrl: 'https://www.nottingham.ac.uk',
    sourceUrl: 'https://www.nottingham.ac.uk/studywithus/postgraduate-taught.aspx',
  },
  {
    universityId: 'UK-SHEFFIELD',
    name: 'University of Sheffield',
    country: 'United Kingdom',
    city: 'Sheffield',
    campusName: 'Western Bank Campus',
    ranking: 16,
    worldRanking: 105,
    type: 'Public',
    founded: 1905,
    students: '30,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£19,000-£29,000',
    scholarships: true,
    description: 'The University of Sheffield is a leading Russell Group university known for its world-class research, particularly in engineering, science, and social sciences. It has a strong reputation for student satisfaction.',
    featured: false,
    website: 'sheffield.ac.uk',
    officialUrl: 'https://www.sheffield.ac.uk',
    sourceUrl: 'https://www.sheffield.ac.uk/postgraduate/taught/courses',
  },
  {
    universityId: 'UK-STANDREWS',
    name: 'University of St Andrews',
    country: 'United Kingdom',
    city: 'St Andrews',
    campusName: 'North Haugh Campus',
    ranking: 17,
    worldRanking: 95,
    type: 'Public',
    founded: 1413,
    students: '11,500',
    intlStudents: '45%',
    ieltsMin: 6.5,
    tuitionRange: '£21,000-£30,000',
    scholarships: true,
    description: 'The University of St Andrews is the oldest university in Scotland and the third oldest in the English-speaking world. It is renowned for its academic excellence and is consistently ranked among the top UK universities.',
    featured: false,
    website: 'st-andrews.ac.uk',
    officialUrl: 'https://www.st-andrews.ac.uk',
    sourceUrl: 'https://www.st-andrews.ac.uk/study/postgraduate/',
  },
  {
    universityId: 'UK-LIVERPOOL',
    name: 'University of Liverpool',
    country: 'United Kingdom',
    city: 'Liverpool',
    campusName: 'Liverpool City Campus',
    ranking: 18,
    worldRanking: 178,
    type: 'Public',
    founded: 1881,
    students: '30,000',
    intlStudents: '28%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£28,000',
    scholarships: true,
    description: 'The University of Liverpool is a Russell Group university known for its research excellence, particularly in health sciences, engineering, and social sciences. It is located in the vibrant city of Liverpool.',
    featured: false,
    website: 'liverpool.ac.uk',
    officialUrl: 'https://www.liverpool.ac.uk',
    sourceUrl: 'https://www.liverpool.ac.uk/study/postgraduate-taught/',
  },
  {
    universityId: 'UK-EXETER',
    name: 'University of Exeter',
    country: 'United Kingdom',
    city: 'Exeter',
    campusName: 'Streatham Campus',
    ranking: 19,
    worldRanking: 169,
    type: 'Public',
    founded: 1955,
    students: '30,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£19,000-£29,000',
    scholarships: true,
    description: 'The University of Exeter is a Russell Group university known for its beautiful campuses and academic excellence. It has strong programmes in business, environmental science, and medicine.',
    featured: false,
    website: 'exeter.ac.uk',
    officialUrl: 'https://www.exeter.ac.uk',
    sourceUrl: 'https://www.exeter.ac.uk/postgraduate/taught/',
  },
  {
    universityId: 'UK-DURHAM',
    name: 'Durham University',
    country: 'United Kingdom',
    city: 'Durham',
    campusName: 'Durham City Campus',
    ranking: 20,
    worldRanking: 89,
    type: 'Public',
    founded: 1832,
    students: '18,500',
    intlStudents: '33%',
    ieltsMin: 6.5,
    tuitionRange: '£20,000-£30,000',
    scholarships: true,
    description: 'Durham University is a collegiate research university and a member of the Russell Group. It is known for its academic excellence, historic cathedral, and beautiful setting.',
    featured: false,
    website: 'durham.ac.uk',
    officialUrl: 'https://www.durham.ac.uk',
    sourceUrl: 'https://www.durham.ac.uk/study/postgraduate/taught/',
  },
  {
    universityId: 'UK-YORK',
    name: 'University of York',
    country: 'United Kingdom',
    city: 'York',
    campusName: 'Heslington West Campus',
    ranking: 21,
    worldRanking: 167,
    type: 'Public',
    founded: 1963,
    students: '20,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£19,000-£28,000',
    scholarships: true,
    description: 'The University of York is a collegiate research university known for its strengths in biosciences, computer science, and humanities. It is a member of the Russell Group.',
    featured: false,
    website: 'york.ac.uk',
    officialUrl: 'https://www.york.ac.uk',
    sourceUrl: 'https://www.york.ac.uk/study/postgraduate-taught/',
  },
  {
    universityId: 'UK-CARDIFF',
    name: 'Cardiff University',
    country: 'United Kingdom',
    city: 'Cardiff',
    campusName: 'Cathays Park Campus',
    ranking: 22,
    worldRanking: 186,
    type: 'Public',
    founded: 1883,
    students: '33,000',
    intlStudents: '25%',
    ieltsMin: 6.5,
    tuitionRange: '£18,000-£28,000',
    scholarships: true,
    description: 'Cardiff University is the only Russell Group university in Wales. It is known for its research excellence, particularly in journalism, architecture, and medicine.',
    featured: false,
    website: 'cardiff.ac.uk',
    officialUrl: 'https://www.cardiff.ac.uk',
    sourceUrl: 'https://www.cardiff.ac.uk/study/postgraduate/taught',
  },
  {
    universityId: 'UK-QMUL',
    name: 'Queen Mary University of London',
    country: 'United Kingdom',
    city: 'London',
    campusName: 'Mile End Campus',
    ranking: 23,
    worldRanking: 145,
    type: 'Public',
    founded: 1785,
    students: '28,000',
    intlStudents: '45%',
    ieltsMin: 6.5,
    tuitionRange: '£20,000-£30,000',
    scholarships: true,
    description: 'Queen Mary University of London is a Russell Group university located in the heart of London\'s East End. It is known for its strong research in medicine, law, and engineering.',
    featured: false,
    website: 'qmul.ac.uk',
    officialUrl: 'https://www.qmul.ac.uk',
    sourceUrl: 'https://www.qmul.ac.uk/postgraduate/taught/',
  },
  {
    universityId: 'UK-NEWCASTLE',
    name: 'Newcastle University',
    country: 'United Kingdom',
    city: 'Newcastle upon Tyne',
    campusName: 'Newcastle City Campus',
    ranking: 24,
    worldRanking: 129,
    type: 'Public',
    founded: 1834,
    students: '28,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£19,000-£29,000',
    scholarships: true,
    description: 'Newcastle University is a Russell Group university known for its world-class research and teaching. It has strong programmes in medicine, engineering, and business.',
    featured: false,
    website: 'ncl.ac.uk',
    officialUrl: 'https://www.ncl.ac.uk',
    sourceUrl: 'https://www.ncl.ac.uk/postgraduate/taught/',
  },

  // ===== OTHER MAJOR UK UNIVERSITIES (25-50) =====
  {
    universityId: 'UK-BATH',
    name: 'University of Bath',
    country: 'United Kingdom',
    city: 'Bath',
    campusName: 'Claverton Down Campus',
    ranking: 25,
    worldRanking: 164,
    type: 'Public',
    founded: 1966,
    students: '19,500',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£20,000-£28,000',
    scholarships: true,
    description: 'The University of Bath is known for its excellence in engineering, management, and social sciences. It consistently ranks highly for student satisfaction and graduate employment.',
    featured: false,
    website: 'bath.ac.uk',
    officialUrl: 'https://www.bath.ac.uk',
    sourceUrl: 'https://www.bath.ac.uk/courses/',
  },
  {
    universityId: 'UK-READING',
    name: 'University of Reading',
    country: 'United Kingdom',
    city: 'Reading',
    campusName: 'Whiteknights Campus',
    ranking: 26,
    worldRanking: 229,
    type: 'Public',
    founded: 1892,
    students: '23,000',
    intlStudents: '25%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£27,000',
    scholarships: true,
    description: 'The University of Reading is known for its strengths in agriculture, food science, and business. It has a beautiful campus and strong international connections.',
    featured: false,
    website: 'reading.ac.uk',
    officialUrl: 'https://www.reading.ac.uk',
    sourceUrl: 'https://www.reading.ac.uk/ready-to-study/',
  },
  {
    universityId: 'UK-SURREY',
    name: 'University of Surrey',
    country: 'United Kingdom',
    city: 'Guildford',
    campusName: 'Stag Hill Campus',
    ranking: 27,
    worldRanking: 244,
    type: 'Public',
    founded: 1966,
    students: '16,500',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£26,000',
    scholarships: true,
    description: 'The University of Surrey is known for its excellence in engineering, computing, and health sciences. It has strong industry partnerships and a high graduate employment rate.',
    featured: false,
    website: 'surrey.ac.uk',
    officialUrl: 'https://www.surrey.ac.uk',
    sourceUrl: 'https://www.surrey.ac.uk/postgraduate-taught-courses',
  },
  {
    universityId: 'UK-LOUGHBOROUGH',
    name: 'Loughborough University',
    country: 'United Kingdom',
    city: 'Loughborough',
    campusName: 'Main Campus',
    ranking: 28,
    worldRanking: 224,
    type: 'Public',
    founded: 1909,
    students: '20,000',
    intlStudents: '25%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£27,000',
    scholarships: true,
    description: 'Loughborough University is renowned for its sports science and engineering programmes. It has been named the UK\'s best sporting university for multiple years running.',
    featured: false,
    website: 'lboro.ac.uk',
    officialUrl: 'https://www.lboro.ac.uk',
    sourceUrl: 'https://www.lboro.ac.uk/study/postgraduate/',
  },
  {
    universityId: 'UK-ABERDEEN',
    name: 'University of Aberdeen',
    country: 'United Kingdom',
    city: 'Aberdeen',
    campusName: 'Old Aberdeen Campus',
    ranking: 29,
    worldRanking: 208,
    type: 'Public',
    founded: 1495,
    students: '16,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£26,000',
    scholarships: true,
    description: 'The University of Aberdeen is the fifth oldest university in the English-speaking world. It is known for its strengths in energy, medicine, and law.',
    featured: false,
    website: 'abdn.ac.uk',
    officialUrl: 'https://www.abdn.ac.uk',
    sourceUrl: 'https://www.abdn.ac.uk/study/postgraduate-taught/',
  },
  {
    universityId: 'UK-ASTON',
    name: 'Aston University',
    country: 'United Kingdom',
    city: 'Birmingham',
    campusName: 'Aston Triangle Campus',
    ranking: 30,
    worldRanking: 425,
    type: 'Public',
    founded: 1895,
    students: '15,000',
    intlStudents: '40%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£25,000',
    scholarships: true,
    description: 'Aston University is known for its strong business school, engineering, and pharmacy programmes. It has excellent industry connections and high graduate employability.',
    featured: false,
    website: 'aston.ac.uk',
    officialUrl: 'https://www.aston.ac.uk',
    sourceUrl: 'https://www.aston.ac.uk/study/postgraduate-taught-courses',
  },
  {
    universityId: 'UK-ESSEX',
    name: 'University of Essex',
    country: 'United Kingdom',
    city: 'Colchester',
    campusName: 'Wivenhoe Park Campus',
    ranking: 31,
    worldRanking: 359,
    type: 'Public',
    founded: 1964,
    students: '17,000',
    intlStudents: '40%',
    ieltsMin: 6.0,
    tuitionRange: '£16,000-£24,000',
    scholarships: true,
    description: 'The University of Essex is known for its strengths in social sciences, politics, and human rights. It has a strong international focus and diverse student community.',
    featured: false,
    website: 'essex.ac.uk',
    officialUrl: 'https://www.essex.ac.uk',
    sourceUrl: 'https://www.essex.ac.uk/courses/',
  },
  {
    universityId: 'UK-SUSSEX',
    name: 'University of Sussex',
    country: 'United Kingdom',
    city: 'Brighton',
    campusName: 'Falmer Campus',
    ranking: 32,
    worldRanking: 247,
    type: 'Public',
    founded: 1961,
    students: '17,500',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£18,000-£26,000',
    scholarships: true,
    description: 'The University of Sussex is known for its innovative approach to education and research. It has strong programmes in development studies, business, and science.',
    featured: false,
    website: 'sussex.ac.uk',
    officialUrl: 'https://www.sussex.ac.uk',
    sourceUrl: 'https://www.sussex.ac.uk/study/masters/',
  },
  {
    universityId: 'UK-RHUL',
    name: 'Royal Holloway, University of London',
    country: 'United Kingdom',
    city: 'Egham',
    campusName: 'Egham Campus',
    ranking: 33,
    worldRanking: 276,
    type: 'Public',
    founded: 1879,
    students: '12,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£25,000',
    scholarships: true,
    description: 'Royal Holloway is a constituent college of the University of London, known for its stunning Founder\'s Building and strengths in arts, humanities, and sciences.',
    featured: false,
    website: 'rhul.ac.uk',
    officialUrl: 'https://www.royalholloway.ac.uk',
    sourceUrl: 'https://www.royalholloway.ac.uk/studying-here/postgraduate/',
  },
  {
    universityId: 'UK-KENT',
    name: 'University of Kent',
    country: 'United Kingdom',
    city: 'Canterbury',
    campusName: 'Canterbury Campus',
    ranking: 34,
    worldRanking: 322,
    type: 'Public',
    founded: 1965,
    students: '19,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£16,000-£24,000',
    scholarships: true,
    description: 'The University of Kent is known as the UK\'s European university, with strong international connections. It offers excellent programmes in business, computing, and social sciences.',
    featured: false,
    website: 'kent.ac.uk',
    officialUrl: 'https://www.kent.ac.uk',
    sourceUrl: 'https://www.kent.ac.uk/courses/postgraduate',
  },
  {
    universityId: 'UK-LEICESTER',
    name: 'University of Leicester',
    country: 'United Kingdom',
    city: 'Leicester',
    campusName: 'Main Campus',
    ranking: 35,
    worldRanking: 285,
    type: 'Public',
    founded: 1921,
    students: '20,000',
    intlStudents: '28%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£25,000',
    scholarships: true,
    description: 'The University of Leicester is known for the discovery of DNA genetic fingerprinting and its strengths in space science, medicine, and history.',
    featured: false,
    website: 'le.ac.uk',
    officialUrl: 'https://www.le.ac.uk',
    sourceUrl: 'https://le.ac.uk/study/courses',
  },
  {
    universityId: 'UK-STRATHCLYDE',
    name: 'University of Strathclyde',
    country: 'United Kingdom',
    city: 'Glasgow',
    campusName: 'John Anderson Campus',
    ranking: 36,
    worldRanking: 269,
    type: 'Public',
    founded: 1796,
    students: '30,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£26,000',
    scholarships: true,
    description: 'The University of Strathclyde is a leading technological university located in the heart of Glasgow. It is known for its engineering, business, and pharmacy programmes.',
    featured: false,
    website: 'strath.ac.uk',
    officialUrl: 'https://www.strath.ac.uk',
    sourceUrl: 'https://www.strath.ac.uk/study/postgraduate/taught/',
  },
  {
    universityId: 'UK-HERIOTWATT',
    name: 'Heriot-Watt University',
    country: 'United Kingdom',
    city: 'Edinburgh',
    campusName: 'Riccarton Campus',
    ranking: 37,
    worldRanking: 316,
    type: 'Public',
    founded: 1821,
    students: '14,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£25,000',
    scholarships: true,
    description: 'Heriot-Watt University is known for its strengths in engineering, business, and design. It has a strong focus on industry-relevant education and global campuses.',
    featured: false,
    website: 'hw.ac.uk',
    officialUrl: 'https://www.hw.ac.uk',
    sourceUrl: 'https://www.hw.ac.uk/study/taught-postgraduate.htm',
  },
  {
    universityId: 'UK-UEA',
    name: 'University of East Anglia',
    country: 'United Kingdom',
    city: 'Norwich',
    campusName: 'Norwich Research Park Campus',
    ranking: 38,
    worldRanking: 295,
    type: 'Public',
    founded: 1963,
    students: '17,000',
    intlStudents: '25%',
    ieltsMin: 6.0,
    tuitionRange: '£17,000-£25,000',
    scholarships: true,
    description: 'UEA is known for its creative writing programme and strengths in environmental science, medicine, and international development. It is located on a beautiful campus in Norwich.',
    featured: false,
    website: 'uea.ac.uk',
    officialUrl: 'https://www.uea.ac.uk',
    sourceUrl: 'https://www.uea.ac.uk/study/postgraduate-taught',
  },
  {
    universityId: 'UK-BRUNEL',
    name: 'Brunel University London',
    country: 'United Kingdom',
    city: 'Uxbridge',
    campusName: 'Uxbridge Campus',
    ranking: 39,
    worldRanking: 343,
    type: 'Public',
    founded: 1966,
    students: '16,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£16,000-£24,000',
    scholarships: true,
    description: 'Brunel University London is known for its practical, career-focused approach to education. It has strong programmes in engineering, business, and design.',
    featured: false,
    website: 'brunel.ac.uk',
    officialUrl: 'https://www.brunel.ac.uk',
    sourceUrl: 'https://www.brunel.ac.uk/study/postgraduate-taught',
  },
  {
    universityId: 'UK-BOURNEMOUTH',
    name: 'Bournemouth University',
    country: 'United Kingdom',
    city: 'Bournemouth',
    campusName: 'Talbot Campus',
    ranking: 40,
    worldRanking: 376,
    type: 'Public',
    founded: 1992,
    students: '19,000',
    intlStudents: '25%',
    ieltsMin: 6.0,
    tuitionRange: '£16,000-£23,000',
    scholarships: true,
    description: 'Bournemouth University is known for its strengths in media, tourism, and computing. It has strong industry connections and excellent placement opportunities.',
    featured: false,
    website: 'bournemouth.ac.uk',
    officialUrl: 'https://www.bournemouth.ac.uk',
    sourceUrl: 'https://www.bournemouth.ac.uk/study/courses',
  },
  {
    universityId: 'UK-HERTFORDSHIRE',
    name: 'University of Hertfordshire',
    country: 'United Kingdom',
    city: 'Hatfield',
    campusName: 'College Lane Campus',
    ranking: 41,
    worldRanking: 601,
    type: 'Public',
    founded: 1992,
    students: '25,000',
    intlStudents: '20%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£22,000',
    scholarships: true,
    description: 'The University of Hertfordshire is known for its business, engineering, and creative arts programmes. It has strong industry partnerships and a focus on employability.',
    featured: false,
    website: 'herts.ac.uk',
    officialUrl: 'https://www.herts.ac.uk',
    sourceUrl: 'https://www.herts.ac.uk/courses',
  },
  {
    universityId: 'UK-COVENTRY',
    name: 'Coventry University',
    country: 'United Kingdom',
    city: 'Coventry',
    campusName: 'Coventry City Campus',
    ranking: 42,
    worldRanking: 531,
    type: 'Public',
    founded: 1992,
    students: '30,000',
    intlStudents: '35%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£22,000',
    scholarships: true,
    description: 'Coventry University is a modern, forward-thinking university known for its business, engineering, and health programmes. It has a strong international presence and innovative approach to teaching.',
    featured: false,
    website: 'coventry.ac.uk',
    officialUrl: 'https://www.coventry.ac.uk',
    sourceUrl: 'https://www.coventry.ac.uk/study-at-coventry/',
  },
  {
    universityId: 'UK-DEMONTFORT',
    name: 'De Montfort University',
    country: 'United Kingdom',
    city: 'Leicester',
    campusName: 'Leicester City Campus',
    ranking: 43,
    worldRanking: 541,
    type: 'Public',
    founded: 1992,
    students: '22,000',
    intlStudents: '25%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£21,000',
    scholarships: true,
    description: 'De Montfort University is known for its business school, art and design, and engineering programmes. It has excellent facilities and strong industry connections.',
    featured: false,
    website: 'dmu.ac.uk',
    officialUrl: 'https://www.dmu.ac.uk',
    sourceUrl: 'https://www.dmu.ac.uk/study/courses',
  },
  {
    universityId: 'UK-PORTSMOUTH',
    name: 'University of Portsmouth',
    country: 'United Kingdom',
    city: 'Portsmouth',
    campusName: 'Portsmouth City Campus',
    ranking: 44,
    worldRanking: 502,
    type: 'Public',
    founded: 1992,
    students: '25,000',
    intlStudents: '23%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£21,000',
    scholarships: true,
    description: 'The University of Portsmouth is known for its strengths in engineering, business, and creative technologies. It has excellent student satisfaction ratings and a coastal city location.',
    featured: false,
    website: 'port.ac.uk',
    officialUrl: 'https://www.port.ac.uk',
    sourceUrl: 'https://www.port.ac.uk/study/courses',
  },
  {
    universityId: 'UK-UWE',
    name: 'University of the West of England, Bristol',
    country: 'United Kingdom',
    city: 'Bristol',
    campusName: 'Frenchay Campus',
    ranking: 45,
    worldRanking: 531,
    type: 'Public',
    founded: 1992,
    students: '30,000',
    intlStudents: '15%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£21,000',
    scholarships: true,
    description: 'UWE Bristol is a modern university known for its practical, career-focused programmes. It has strong links with industry and excellent facilities.',
    featured: false,
    website: 'uwe.ac.uk',
    officialUrl: 'https://www.uwe.ac.uk',
    sourceUrl: 'https://www.uwe.ac.uk/course/search',
  },
  {
    universityId: 'UK-NTU',
    name: 'Nottingham Trent University',
    country: 'United Kingdom',
    city: 'Nottingham',
    campusName: 'City Campus',
    ranking: 46,
    worldRanking: 541,
    type: 'Public',
    founded: 1992,
    students: '35,000',
    intlStudents: '20%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£21,000',
    scholarships: true,
    description: 'Nottingham Trent University is one of the largest universities in the UK, known for its business, design, and science programmes. It has high student satisfaction and graduate employment rates.',
    featured: false,
    website: 'ntu.ac.uk',
    officialUrl: 'https://www.ntu.ac.uk',
    sourceUrl: 'https://www.ntu.ac.uk/study/courses',
  },
  {
    universityId: 'UK-LINCOLN',
    name: 'University of Lincoln',
    country: 'United Kingdom',
    city: 'Lincoln',
    campusName: 'Brayford Pool Campus',
    ranking: 47,
    worldRanking: 541,
    type: 'Public',
    founded: 1992,
    students: '16,000',
    intlStudents: '15%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£20,000',
    scholarships: true,
    description: 'The University of Lincoln is known for its student satisfaction and innovative approach to teaching. It has strengths in engineering, business, and computer science.',
    featured: false,
    website: 'lincoln.ac.uk',
    officialUrl: 'https://www.lincoln.ac.uk',
    sourceUrl: 'https://www.lincoln.ac.uk/home/study/courses/',
  },
  {
    universityId: 'UK-DUNDEE',
    name: 'University of Dundee',
    country: 'United Kingdom',
    city: 'Dundee',
    campusName: 'City Campus',
    ranking: 48,
    worldRanking: 361,
    type: 'Public',
    founded: 1967,
    students: '16,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£16,000-£24,000',
    scholarships: true,
    description: 'The University of Dundee is known for its strengths in life sciences, medicine, and creative arts. It has a compact, friendly campus and strong research credentials.',
    featured: false,
    website: 'dundee.ac.uk',
    officialUrl: 'https://www.dundee.ac.uk',
    sourceUrl: 'https://www.dundee.ac.uk/study/postgraduate',
  },
  {
    universityId: 'UK-STIRLING',
    name: 'University of Stirling',
    country: 'United Kingdom',
    city: 'Stirling',
    campusName: 'Stirling Campus',
    ranking: 49,
    worldRanking: 387,
    type: 'Public',
    founded: 1967,
    students: '14,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£15,000-£22,000',
    scholarships: true,
    description: 'The University of Stirling is known for its beautiful campus, strong sports programmes, and strengths in business, education, and environmental science.',
    featured: false,
    website: 'stir.ac.uk',
    officialUrl: 'https://www.stir.ac.uk',
    sourceUrl: 'https://www.stir.ac.uk/study/',
  },
  {
    universityId: 'UK-BRADFORD',
    name: 'University of Bradford',
    country: 'United Kingdom',
    city: 'Bradford',
    campusName: 'City Campus',
    ranking: 50,
    worldRanking: 451,
    type: 'Public',
    founded: 1966,
    students: '13,000',
    intlStudents: '30%',
    ieltsMin: 6.0,
    tuitionRange: '£14,000-£21,000',
    scholarships: true,
    description: 'The University of Bradford is known for its strengths in peace studies, engineering, and health studies. It has a diverse, multicultural campus community.',
    featured: false,
    website: 'bradford.ac.uk',
    officialUrl: 'https://www.bradford.ac.uk',
    sourceUrl: 'https://www.bradford.ac.uk/courses/',
  },
]

// ============================================================
// Course Data Generator
// ============================================================

interface CourseTemplate {
  courseCode: string
  courseTitle: string
  studyLevel: string
  programLevel: string
  subjectArea: string
  disciplineArea: string
  durationMonths: number
  tuitionLow: number
  tuitionHigh: number
  ieltsOverall: number
  ieltsMinBand: number
  pteOverall: number
  toeflOverall: number
  appFee: number
}

function generateCourses(uni: UniversityData): CourseTemplate[] {
  const isTop10 = uni.ranking <= 10
  const isRussell = uni.ranking <= 24
  const code = uni.universityId.replace('UK-', '')

  const premium = isTop10 ? 1.4 : isRussell ? 1.0 : 0.75
  const baseIelts = isTop10 ? 6.5 : isRussell ? 6.5 : 6.0
  const topIelts = isTop10 ? 7.5 : isRussell ? 7.0 : 6.5
  const appFee = isTop10 ? 75 : isRussell ? 60 : 50

  const courses: CourseTemplate[] = [
    // 1. MSc Computer Science / Data Science / AI
    {
      courseCode: `${code}-MSC-CS`,
      courseTitle: `MSc Computer Science`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Computing',
      disciplineArea: 'Computer Science',
      durationMonths: 12,
      tuitionLow: Math.round(26000 * premium / 100) * 100,
      tuitionHigh: Math.round(36000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 2. MSc Data Science & AI
    {
      courseCode: `${code}-MSC-DAI`,
      courseTitle: `MSc Data Science and Artificial Intelligence`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Computing',
      disciplineArea: 'Data Science',
      durationMonths: 12,
      tuitionLow: Math.round(27000 * premium / 100) * 100,
      tuitionHigh: Math.round(38000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 3. MSc International Business / MBA
    {
      courseCode: `${code}-MSC-IB`,
      courseTitle: `MSc International Business`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Business',
      disciplineArea: 'International Business',
      durationMonths: 12,
      tuitionLow: Math.round(22000 * premium / 100) * 100,
      tuitionHigh: Math.round(34000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 4. MSc Engineering (Mechanical)
    {
      courseCode: `${code}-MSC-ENG`,
      courseTitle: `MSc Mechanical Engineering`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Engineering',
      disciplineArea: 'Mechanical Engineering',
      durationMonths: 12,
      tuitionLow: Math.round(23000 * premium / 100) * 100,
      tuitionHigh: Math.round(32000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 5. MSc Biomedical Science
    {
      courseCode: `${code}-MSC-BMS`,
      courseTitle: `MSc Biomedical Science`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Health & Medicine',
      disciplineArea: 'Biomedical Science',
      durationMonths: 12,
      tuitionLow: Math.round(22000 * premium / 100) * 100,
      tuitionHigh: Math.round(30000 * premium / 100) * 100,
      ieltsOverall: topIelts,
      ieltsMinBand: topIelts - 0.5,
      pteOverall: 65,
      toeflOverall: 92,
      appFee,
    },
    // 6. MBA
    {
      courseCode: `${code}-MBA`,
      courseTitle: `Master of Business Administration (MBA)`,
      studyLevel: 'Postgraduate',
      programLevel: 'MBA',
      subjectArea: 'Business',
      disciplineArea: 'Business Administration',
      durationMonths: 12,
      tuitionLow: Math.round(28000 * premium / 100) * 100,
      tuitionHigh: Math.round(42000 * premium / 100) * 100,
      ieltsOverall: topIelts,
      ieltsMinBand: topIelts - 1.0,
      pteOverall: 65,
      toeflOverall: 92,
      appFee,
    },
    // 7. BSc Computer Science (undergrad)
    {
      courseCode: `${code}-BSC-CS`,
      courseTitle: `BSc (Hons) Computer Science`,
      studyLevel: 'Undergraduate',
      programLevel: 'BSc',
      subjectArea: 'Computing',
      disciplineArea: 'Computer Science',
      durationMonths: 36,
      tuitionLow: Math.round(18000 * premium / 100) * 100,
      tuitionHigh: Math.round(28000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 8. BSc Business Management (undergrad)
    {
      courseCode: `${code}-BSC-BM`,
      courseTitle: `BSc (Hons) Business Management`,
      studyLevel: 'Undergraduate',
      programLevel: 'BSc',
      subjectArea: 'Business',
      disciplineArea: 'Business Management',
      durationMonths: 36,
      tuitionLow: Math.round(16000 * premium / 100) * 100,
      tuitionHigh: Math.round(26000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 9. MSc Finance
    {
      courseCode: `${code}-MSC-FIN`,
      courseTitle: `MSc Finance`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Business',
      disciplineArea: 'Finance',
      durationMonths: 12,
      tuitionLow: Math.round(24000 * premium / 100) * 100,
      tuitionHigh: Math.round(36000 * premium / 100) * 100,
      ieltsOverall: topIelts,
      ieltsMinBand: topIelts - 1.0,
      pteOverall: 65,
      toeflOverall: 92,
      appFee,
    },
    // 10. MSc Electrical/Electronic Engineering
    {
      courseCode: `${code}-MSC-EEE`,
      courseTitle: `MSc Electrical and Electronic Engineering`,
      studyLevel: 'Postgraduate',
      programLevel: 'MSc',
      subjectArea: 'Engineering',
      disciplineArea: 'Electrical Engineering',
      durationMonths: 12,
      tuitionLow: Math.round(23000 * premium / 100) * 100,
      tuitionHigh: Math.round(32000 * premium / 100) * 100,
      ieltsOverall: baseIelts,
      ieltsMinBand: baseIelts - 0.5,
      pteOverall: 62,
      toeflOverall: 88,
      appFee,
    },
    // 11. Foundation Year in Business
    {
      courseCode: `${code}-FND-BUS`,
      courseTitle: `International Foundation Year in Business`,
      studyLevel: 'Foundation',
      programLevel: 'Foundation',
      subjectArea: 'Business',
      disciplineArea: 'Business Foundation',
      durationMonths: 9,
      tuitionLow: Math.round(12000 * premium / 100) * 100,
      tuitionHigh: Math.round(18000 * premium / 100) * 100,
      ieltsOverall: 5.5,
      ieltsMinBand: 5.0,
      pteOverall: 50,
      toeflOverall: 72,
      appFee,
    },
    // 12. Pre-Masters in Engineering
    {
      courseCode: `${code}-PRE-ENG`,
      courseTitle: `Pre-Masters Programme in Engineering`,
      studyLevel: 'Pre-Masters',
      programLevel: 'Pre-Masters',
      subjectArea: 'Engineering',
      disciplineArea: 'Engineering Preparation',
      durationMonths: 6,
      tuitionLow: Math.round(10000 * premium / 100) * 100,
      tuitionHigh: Math.round(16000 * premium / 100) * 100,
      ieltsOverall: 5.5,
      ieltsMinBand: 5.0,
      pteOverall: 50,
      toeflOverall: 72,
      appFee,
    },
  ]

  // Select 4-5 courses per university based on profile
  if (isTop10) {
    // Top 10: more diverse, include MBA, Finance, more postgrad
    return [
      courses[0], courses[1], courses[2], courses[3], courses[4], courses[5],
      courses[6], courses[8], courses[9], courses[10],
    ]
  } else if (isRussell) {
    // Russell Group: balanced mix
    return [
      courses[0], courses[1], courses[2], courses[3], courses[4], courses[6],
      courses[7], courses[8], courses[9], courses[10],
    ]
  } else {
    // Other: practical focus, foundation/pre-masters
    return [
      courses[0], courses[1], courses[2], courses[3], courses[4], courses[5],
      courses[6], courses[7], courses[10], courses[11],
    ]
  }
}

// ============================================================
// Main Seed Function
// ============================================================

async function main() {
  console.log('========================================')
  console.log('  UK Universities Seed Script')
  console.log('========================================\n')

  let universityCount = 0
  let courseCount = 0
  let intakeCount = 0
  let requirementCount = 0
  let scholarshipCount = 0
  let commissionCount = 0

  try {
    // ========================================
    // STEP 1: Create Universities
    // ========================================
    console.log('[1/6] Seeding universities...')

    const existingUnis = await db.crmUniversity.findMany({
      select: { universityId: true },
      where: { universityId: { in: universities.map(u => u.universityId) } },
    })
    const existingUniIds = new Set(existingUnis.map(u => u.universityId))

    const newUnis = universities.filter(u => !existingUniIds.has(u.universityId))

    if (newUnis.length > 0) {
      const result = await db.crmUniversity.createMany({
        data: newUnis.map(u => ({
          universityId: u.universityId,
          name: u.name,
          country: u.country,
          city: u.city,
          campusName: u.campusName,
          ranking: u.ranking,
          worldRanking: u.worldRanking,
          type: u.type,
          founded: u.founded,
          students: u.students,
          intlStudents: u.intlStudents,
          ieltsMin: u.ieltsMin,
          tuitionRange: u.tuitionRange,
          scholarships: u.scholarships,
          description: u.description,
          featured: u.featured,
          website: u.website,
          officialUrl: u.officialUrl,
          sourceUrl: u.sourceUrl,
          lastVerifiedAt: NOW,
          status: 'active',
        })),
      })
      universityCount = result.count
      console.log(`  ✓ Created ${result.count} universities (${newUnis.length - result.count} already existed)`)
    } else {
      console.log('  ✓ All universities already exist, skipping')
      universityCount = 0
    }

    // ========================================
    // STEP 2: Create Courses
    // ========================================
    console.log('\n[2/6] Seeding courses...')

    const allCourses: Array<{
      universityId: string
      courseId: string
      courseTitle: string
      studyLevel: string
      programLevel: string
      subjectArea: string
      disciplineArea: string
      officialUrl: string
      durationMonths: number
      publicTags: string
      sourceUrl: string
      lastVerifiedAt: string
      status: string
    }> = []

    const allIntakes: Array<{
      universityId: string
      courseId: string
      intakeYear: number
      intakeMonth: string
      intakeName: string
      applicationDeadline: string
      appFeeCurrency: string
      appFeeAmount: number
      tuitionCurrency: string
      yearlyTuition: number
      totalTuition: number
      depositCurrency: string
      depositAmount: number
      batchId: string
      status: string
    }> = []

    const allRequirements: Array<{
      universityId: string
      courseId: string
      academicReq: string
      gradingSystem: string
      minScore: string
      ieltsOverall: number
      ieltsMinBand: number
      pteOverall: number
      pteMinBand: number
      toeflOverall: number
      detOverall: number
      moiAccepted: boolean
      ownEnglishTest: boolean
      portfolioRequired: boolean
      interviewRequired: boolean
      batchId: string
    }> = []

    const allScholarships: Array<{
      universityId: string
      courseId: string
      scholarshipName: string
      scholarshipAmount: number
      scholarshipCurrency: string
      batchId: string
      status: string
    }> = []

    const allCommissions: Array<{
      universityId: string
      courseId: string
      intakeYear: number
      intakeMonth: string
      internalExpected: number
      internalIncreased: number
      partnerCommission: number
      internalNotes: string
      batchId: string
    }> = []

    for (const uni of universities) {
      const courseTemplates = generateCourses(uni)

      for (const ct of courseTemplates) {
        const courseId = `UK-${ct.courseCode}`

        allCourses.push({
          universityId: uni.universityId,
          courseId,
          courseTitle: ct.courseTitle,
          studyLevel: ct.studyLevel,
          programLevel: ct.programLevel,
          subjectArea: ct.subjectArea,
          disciplineArea: ct.disciplineArea,
          officialUrl: `${uni.officialUrl}/courses/${ct.courseCode.toLowerCase()}`,
          durationMonths: ct.durationMonths,
          publicTags: JSON.stringify([ct.subjectArea, ct.disciplineArea, ct.programLevel, 'UK']),
          sourceUrl: uni.sourceUrl,
          lastVerifiedAt: NOW,
          status: 'active',
        })

        // September 2025 Intake
        const sepTuition = ct.tuitionLow
        allIntakes.push({
          universityId: uni.universityId,
          courseId,
          intakeYear: 2025,
          intakeMonth: 'September',
          intakeName: 'September 2025',
          applicationDeadline: '2025-07-31',
          appFeeCurrency: 'GBP',
          appFeeAmount: ct.appFee,
          tuitionCurrency: 'GBP',
          yearlyTuition: sepTuition,
          totalTuition: ct.studyLevel === 'Undergraduate' ? sepTuition * 3 : sepTuition,
          depositCurrency: 'GBP',
          depositAmount: Math.round(sepTuition * 0.1),
          batchId: BATCH_ID,
          status: 'active',
        })

        // January 2026 Intake
        const janTuition = ct.tuitionHigh
        allIntakes.push({
          universityId: uni.universityId,
          courseId,
          intakeYear: 2026,
          intakeMonth: 'January',
          intakeName: 'January 2026',
          applicationDeadline: '2025-11-30',
          appFeeCurrency: 'GBP',
          appFeeAmount: ct.appFee,
          tuitionCurrency: 'GBP',
          yearlyTuition: janTuition,
          totalTuition: ct.studyLevel === 'Undergraduate' ? janTuition * 3 : janTuition,
          depositCurrency: 'GBP',
          depositAmount: Math.round(janTuition * 0.1),
          batchId: BATCH_ID,
          status: 'active',
        })

        // Requirements
        const isPostgrad = ct.studyLevel === 'Postgraduate'
        allRequirements.push({
          universityId: uni.universityId,
          courseId,
          academicReq: isPostgrad
            ? 'Bachelor\'s degree with minimum 2:1 (Upper Second Class Honours) or equivalent in a relevant subject'
            : ct.studyLevel === 'Foundation'
              ? 'Completion of higher secondary education (HSC) with good grades'
              : 'Strong academic record in higher secondary education (HSC/A-Levels)',
          gradingSystem: ct.studyLevel === 'Foundation' || ct.studyLevel === 'Pre-Masters' ? 'GPA / HSC' : 'UK Honours Degree Classification',
          minScore: isPostgrad
            ? '2:1 or equivalent (GPA 3.0/4.0 or 60%)'
            : ct.studyLevel === 'Foundation'
              ? 'GPA 2.5/4.0 or equivalent'
              : 'GPA 2.8/4.0 or equivalent',
          ieltsOverall: ct.ieltsOverall,
          ieltsMinBand: ct.ieltsMinBand,
          pteOverall: ct.pteOverall,
          pteMinBand: Math.max(50, ct.pteOverall - 10),
          toeflOverall: ct.toeflOverall,
          detOverall: ct.ieltsOverall >= 7.0 ? 130 : ct.ieltsOverall >= 6.5 ? 120 : 110,
          moiAccepted: ct.ieltsOverall <= 6.5,
          ownEnglishTest: false,
          portfolioRequired: ct.subjectArea === 'Computing' && ct.programLevel === 'MSc' ? false : false,
          interviewRequired: ct.programLevel === 'MBA',
          batchId: BATCH_ID,
        })

        // Scholarship (1-2 per university, attach to the first 2 courses)
        if (allScholarships.filter(s => s.universityId === uni.universityId).length < 2) {
          const scholarshipAmounts = [3000, 5000, 4000, 2500, 6000, 3500]
          const amount = scholarshipAmounts[uni.ranking % scholarshipAmounts.length]

          allScholarships.push({
            universityId: uni.universityId,
            courseId,
            scholarshipName: `${uni.name.split(' ').slice(-2).join(' ')} International Excellence Scholarship`,
            scholarshipAmount: amount,
            scholarshipCurrency: 'GBP',
            batchId: BATCH_ID,
            status: 'active',
          })

          // Second scholarship for PhD/higher value courses
          if (ct.programLevel === 'MBA' || ct.programLevel === 'MSc') {
            allScholarships.push({
              universityId: uni.universityId,
              courseId,
              scholarshipName: `${uni.name.split(' ').slice(-2).join(' ')} Merit Scholarship`,
              scholarshipAmount: Math.round(amount * 0.6),
              scholarshipCurrency: 'GBP',
              batchId: BATCH_ID,
              status: 'active',
            })
          }
        }

        // Commission data (for internal tracking)
        const commissionRate = uni.ranking <= 10 ? 12 : uni.ranking <= 24 ? 15 : 18
        allCommissions.push({
          universityId: uni.universityId,
          courseId,
          intakeYear: 2025,
          intakeMonth: 'September',
          internalExpected: commissionRate,
          internalIncreased: commissionRate + 3,
          partnerCommission: commissionRate,
          internalNotes: `Standard commission for ${uni.name}`,
          batchId: BATCH_ID,
        })
        allCommissions.push({
          universityId: uni.universityId,
          courseId,
          intakeYear: 2026,
          intakeMonth: 'January',
          internalExpected: commissionRate,
          internalIncreased: commissionRate + 3,
          partnerCommission: commissionRate,
          internalNotes: `Standard commission for ${uni.name}`,
          batchId: BATCH_ID,
        })
      }
    }

    // Insert courses in batches to avoid issues
    const existingCourses = await db.crmCourse.findMany({
      select: { courseId: true },
      where: { courseId: { in: allCourses.map(c => c.courseId) } },
    })
    const existingCourseIds = new Set(existingCourses.map(c => c.courseId))
    const newCourses = allCourses.filter(c => !existingCourseIds.has(c.courseId))

    if (newCourses.length > 0) {
      const batchSize = 100
      for (let i = 0; i < newCourses.length; i += batchSize) {
        const batch = newCourses.slice(i, i + batchSize)
        const result = await db.crmCourse.createMany({ data: batch })
        courseCount += result.count
      }
      console.log(`  ✓ Created ${courseCount} courses (${newCourses.length - courseCount} duplicates skipped)`)
    } else {
      console.log('  ✓ All courses already exist, skipping')
    }

    // ========================================
    // STEP 3: Create Intakes & Fees
    // ========================================
    console.log('\n[3/6] Seeding intakes & fees...')

    const existingIntakes = await db.crmCourseIntakeFee.findMany({
      select: { courseId: true, intakeYear: true, intakeMonth: true },
    })
    const existingIntakeKeys = new Set(
      existingIntakes.map(i => `${i.courseId}-${i.intakeYear}-${i.intakeMonth}`)
    )
    const newIntakes = allIntakes.filter(
      i => !existingIntakeKeys.has(`${i.courseId}-${i.intakeYear}-${i.intakeMonth}`)
    )

    if (newIntakes.length > 0) {
      const batchSize = 200
      for (let i = 0; i < newIntakes.length; i += batchSize) {
        const batch = newIntakes.slice(i, i + batchSize)
        const result = await db.crmCourseIntakeFee.createMany({ data: batch })
        intakeCount += result.count
      }
      console.log(`  ✓ Created ${intakeCount} intake records`)
    } else {
      console.log('  ✓ All intake records already exist, skipping')
    }

    // ========================================
    // STEP 4: Create Requirements
    // ========================================
    console.log('\n[4/6] Seeding course requirements...')

    const existingReqs = await db.crmCourseRequirement.findMany({
      select: { courseId: true },
    })
    const existingReqCourseIds = new Set(existingReqs.map(r => r.courseId))
    const newReqs = allRequirements.filter(r => !existingReqCourseIds.has(r.courseId))

    if (newReqs.length > 0) {
      const batchSize = 200
      for (let i = 0; i < newReqs.length; i += batchSize) {
        const batch = newReqs.slice(i, i + batchSize)
        const result = await db.crmCourseRequirement.createMany({ data: batch })
        requirementCount += result.count
      }
      console.log(`  ✓ Created ${requirementCount} requirement records`)
    } else {
      console.log('  ✓ All requirement records already exist, skipping')
    }

    // ========================================
    // STEP 5: Create Scholarships
    // ========================================
    console.log('\n[5/6] Seeding scholarships...')

    const existingScholarships = await db.crmScholarship.findMany({
      select: { id: true, universityId: true, courseId: true, scholarshipName: true },
    })
    const existingScholKeys = new Set(
      existingScholarships.map(s => `${s.universityId}-${s.courseId}-${s.scholarshipName}`)
    )
    const newScholarships = allScholarships.filter(
      s => !existingScholKeys.has(`${s.universityId}-${s.courseId}-${s.scholarshipName}`)
    )

    if (newScholarships.length > 0) {
      const batchSize = 200
      for (let i = 0; i < newScholarships.length; i += batchSize) {
        const batch = newScholarships.slice(i, i + batchSize)
        const result = await db.crmScholarship.createMany({ data: batch })
        scholarshipCount += result.count
      }
      console.log(`  ✓ Created ${scholarshipCount} scholarship records`)
    } else {
      console.log('  ✓ All scholarship records already exist, skipping')
    }

    // ========================================
    // STEP 6: Create Commissions
    // ========================================
    console.log('\n[6/6] Seeding commissions...')

    const existingComms = await db.crmCommission.findMany({
      select: { id: true, universityId: true, courseId: true, intakeYear: true, intakeMonth: true },
    })
    const existingCommKeys = new Set(
      existingComms.map(c => `${c.universityId}-${c.courseId}-${c.intakeYear}-${c.intakeMonth}`)
    )
    const newComms = allCommissions.filter(
      c => !existingCommKeys.has(`${c.universityId}-${c.courseId}-${c.intakeYear}-${c.intakeMonth}`)
    )

    if (newComms.length > 0) {
      const batchSize = 200
      for (let i = 0; i < newComms.length; i += batchSize) {
        const batch = newComms.slice(i, i + batchSize)
        const result = await db.crmCommission.createMany({ data: batch })
        commissionCount += result.count
      }
      console.log(`  ✓ Created ${commissionCount} commission records`)
    } else {
      console.log('  ✓ All commission records already exist, skipping')
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n========================================')
    console.log('  SEED COMPLETE — SUMMARY')
    console.log('========================================')
    console.log(`  Universities:      ${universityCount} new (${universities.length} total)`)
    console.log(`  Courses:           ${courseCount} new (${allCourses.length} total)`)
    console.log(`  Intakes & Fees:    ${intakeCount} new (${allIntakes.length} total)`)
    console.log(`  Requirements:      ${requirementCount} new (${allRequirements.length} total)`)
    console.log(`  Scholarships:      ${scholarshipCount} new (${allScholarships.length} total)`)
    console.log(`  Commissions:       ${commissionCount} new (${allCommissions.length} total)`)
    console.log('========================================\n')

    // Print university breakdown
    console.log('University breakdown:')
    const unisByGroup = {
      'Russell Group (Top 10)': universities.filter(u => u.ranking <= 10).length,
      'Russell Group (11-24)': universities.filter(u => u.ranking > 10 && u.ranking <= 24).length,
      'Other Major (25-50)': universities.filter(u => u.ranking > 24).length,
    }
    for (const [group, count] of Object.entries(unisByGroup)) {
      console.log(`  ${group}: ${count} universities`)
    }

  } catch (error) {
    console.error('\n❌ SEED FAILED:')
    console.error(error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()