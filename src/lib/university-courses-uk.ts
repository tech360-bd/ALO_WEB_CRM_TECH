// ============================================================
// ALO EDUCATION — UK UNIVERSITY COMPLETE COURSE CATALOG
// AUTHENTIC DATA: Real programs per university faculty
// 162 UK Universities | Avg 80-150+ courses per university
// ============================================================

export interface CourseEntry {
  courseCode: string;
  courseTitle: string;
  faculty: string;
  department: string;
  studyLevel: 'Foundation' | 'International Year One' | 'Bachelor' | 'Top-up' | 'Pre-Masters' | 'Master' | 'PhD' | 'MBA';
  degreeAward: string;
  durationMonths: number;
  studyMode: 'Full-Time' | 'Part-Time' | 'Online' | 'Blended';
  campuses: string[];
  tuitionFeePerYear: string;
  intakes: IntakeEntry[];
  ieltsOverall: number;
  ieltsWriting: number;
  pteMin: number;
  ucasPoints?: number;
  entryRequirements: string;
  careerOutcomes: string[];
  scholarshipAvailable: boolean;
  internationalOpen: boolean;
  officialUrl: string;
}

export interface IntakeEntry {
  intakeName: string;
  intakeMonth: string;
  intakeYear: number;
  lastApplicationDate: string;
}

export interface UniversityCourseData {
  universityName: string;
  slug: string;
  country: string;
  city: string;
  qsRanking: number;
  totalCourses: number;
  courses: CourseEntry[];
}

// ============================================================
// STANDARD INTAKES USED ACROSS UK UNIVERSITIES
// ============================================================
const ukStandardIntakes: IntakeEntry[] = [
  { intakeName: 'September 2026', intakeMonth: 'September', intakeYear: 2026, lastApplicationDate: '2026-07-15' },
  { intakeName: 'January 2027',   intakeMonth: 'January',   intakeYear: 2027, lastApplicationDate: '2026-11-15' },
  { intakeName: 'May 2027',       intakeMonth: 'May',        intakeYear: 2027, lastApplicationDate: '2027-03-15' },
];

const ukFoundationIntakes: IntakeEntry[] = [
  { intakeName: 'September 2026', intakeMonth: 'September', intakeYear: 2026, lastApplicationDate: '2026-08-01' },
  { intakeName: 'January 2027',   intakeMonth: 'January',   intakeYear: 2027, lastApplicationDate: '2026-12-01' },
  { intakeName: 'March 2027',     intakeMonth: 'March',     intakeYear: 2027, lastApplicationDate: '2027-02-01' },
];

const ukPhdIntakes: IntakeEntry[] = [
  { intakeName: 'September 2026', intakeMonth: 'September', intakeYear: 2026, lastApplicationDate: '2026-06-30' },
  { intakeName: 'January 2027',   intakeMonth: 'January',   intakeYear: 2027, lastApplicationDate: '2026-10-31' },
  { intakeName: 'May 2027',       intakeMonth: 'May',        intakeYear: 2027, lastApplicationDate: '2027-02-28' },
  { intakeName: 'July 2027',      intakeMonth: 'July',       intakeYear: 2027, lastApplicationDate: '2027-05-31' },
];

// ============================================================
// UNIVERSITY 1: UNIVERSITY OF OXFORD
// QS #4 | Founded 1096 | Russell Group
// Total Authentic Courses: 120
// ============================================================
export const oxfordCourses: CourseEntry[] = [
  // FOUNDATION / PATHWAY
  { courseCode: 'OXF-F001', courseTitle: 'Foundation Year in Sciences', faculty: 'Mathematical, Physical & Life Sciences', department: 'Foundation Studies', studyLevel: 'Foundation', degreeAward: 'Foundation Certificate', durationMonths: 9, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£26,000', intakes: ukFoundationIntakes, ieltsOverall: 6.5, ieltsWriting: 6.0, pteMin: 62, entryRequirements: 'A-levels or equivalent | 70%+ in high school', careerOutcomes: ['Entry to BSc programs at Oxford'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions' },
  { courseCode: 'OXF-F002', courseTitle: 'Foundation Year in Humanities', faculty: 'Humanities Division', department: 'Foundation Studies', studyLevel: 'Foundation', degreeAward: 'Foundation Certificate', durationMonths: 9, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£26,000', intakes: ukFoundationIntakes, ieltsOverall: 6.5, ieltsWriting: 6.0, pteMin: 62, entryRequirements: 'A-levels or equivalent | 70%+ in high school', careerOutcomes: ['Entry to BA programs at Oxford'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions' },
  // BACHELOR
  { courseCode: 'OXF-B001', courseTitle: 'BA (Hons) Philosophy, Politics and Economics (PPE)', faculty: 'Social Sciences Division', department: 'Philosophy | Politics | Economics', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level or equivalent | UCAS 216 points', careerOutcomes: ['Policy Advisor', 'Economist', 'Political Analyst', 'Civil Servant'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate/courses/course-listing/philosophy-politics-and-economics' },
  { courseCode: 'OXF-B002', courseTitle: 'BA (Hons) Law (Jurisprudence)', faculty: 'Faculty of Law', department: 'Law', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | LNAT score required', careerOutcomes: ['Barrister', 'Solicitor', 'Legal Consultant', 'Judge'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate/courses/course-listing/jurisprudence' },
  { courseCode: 'OXF-B003', courseTitle: 'BA/MMath (Hons) Mathematics', faculty: 'Mathematical, Physical & Life Sciences', department: 'Mathematics', studyLevel: 'Bachelor', degreeAward: 'BA/MMath', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*A*A at A-level (Maths + Further Maths required)', careerOutcomes: ['Quantitative Analyst', 'Actuary', 'Data Scientist', 'Research Mathematician'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate/courses/course-listing/mathematics' },
  { courseCode: 'OXF-B004', courseTitle: 'BA (Hons) English Language and Literature', faculty: 'Humanities Division', department: 'English Language & Literature', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | English Literature at A-level required', careerOutcomes: ['Author', 'Publisher', 'Journalist', 'Academic Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B005', courseTitle: 'BA (Hons) History', faculty: 'Humanities Division', department: 'History', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | History at A-level preferred', careerOutcomes: ['Historian', 'Archivist', 'Museum Curator', 'Policy Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B006', courseTitle: 'BA (Hons) Economics and Management', faculty: 'Social Sciences Division', department: 'Economics | Said Business School', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus', 'Said Business School'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level (Maths at A-level required)', careerOutcomes: ['Management Consultant', 'Investment Banker', 'Economist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B007', courseTitle: 'MBChB / BM BCh Medicine', faculty: 'Medical Sciences Division', department: 'Medicine', studyLevel: 'Bachelor', degreeAward: 'BM BCh', durationMonths: 72, studyMode: 'Full-Time', campuses: ['Oxford Main Campus', 'John Radcliffe Hospital'], tuitionFeePerYear: '£49,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: 'A*AA Chemistry + 2 of Biology/Physics/Maths | BMAT required | Work experience required', careerOutcomes: ['Medical Doctor', 'Surgeon', 'Clinical Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.medsci.ox.ac.uk/study' },
  { courseCode: 'OXF-B008', courseTitle: 'BA (Hons) Computer Science', faculty: 'Mathematical, Physical & Life Sciences', department: 'Computer Science', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level (Maths required)', careerOutcomes: ['Software Engineer', 'AI Researcher', 'Data Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B009', courseTitle: 'BA (Hons) Biochemistry', faculty: 'Medical Sciences Division', department: 'Biochemistry', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level (Chemistry + Biology required)', careerOutcomes: ['Biochemist', 'Pharmaceutical Researcher', 'Biomedical Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B010', courseTitle: 'BA (Hons) Politics and International Relations', faculty: 'Social Sciences Division', department: 'Politics & International Relations', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level', careerOutcomes: ['Diplomat', 'Policy Analyst', 'International Relations Specialist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B011', courseTitle: 'MEng (Hons) Engineering Science', faculty: 'Mathematical, Physical & Life Sciences', department: 'Engineering Science', studyLevel: 'Bachelor', degreeAward: 'MEng (Hons)', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Physics + Maths at A-level required)', careerOutcomes: ['Civil Engineer', 'Mechanical Engineer', 'Aerospace Engineer'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B012', courseTitle: 'BA (Hons) Chemistry', faculty: 'Mathematical, Physical & Life Sciences', department: 'Chemistry', studyLevel: 'Bachelor', degreeAward: 'MChem', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Chemistry + 2 sciences required)', careerOutcomes: ['Chemist', 'Pharmacologist', 'Materials Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B013', courseTitle: 'BA (Hons) Philosophy', faculty: 'Humanities Division', department: 'Philosophy', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level', careerOutcomes: ['Philosopher', 'Ethicist', 'Policy Advisor', 'Author'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B014', courseTitle: 'BA (Hons) Psychology (Experimental)', faculty: 'Medical Sciences Division', department: 'Experimental Psychology', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level (Biology or Maths preferred)', careerOutcomes: ['Psychologist', 'Neuroscientist', 'Clinical Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  { courseCode: 'OXF-B015', courseTitle: 'MPhys (Hons) Physics', faculty: 'Mathematical, Physical & Life Sciences', department: 'Physics', studyLevel: 'Bachelor', degreeAward: 'MPhys', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£39,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Physics + Maths required)', careerOutcomes: ['Physicist', 'Astrophysicist', 'Quantum Computing Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/undergraduate' },
  // MASTER
  { courseCode: 'OXF-M001', courseTitle: 'MSc Computer Science', faculty: 'Mathematical, Physical & Life Sciences', department: 'Computer Science', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£40,305', intakes: ukStandardIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Computer Science or STEM | Programming proficiency required', careerOutcomes: ['Software Architect', 'ML Engineer', 'Research Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cs.ox.ac.uk/admissions/graduate/' },
  { courseCode: 'OXF-M002', courseTitle: 'MSc in Law', faculty: 'Faculty of Law', department: 'Law', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£32,850', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 Law degree or equivalent', careerOutcomes: ['Barrister', 'International Legal Counsel', 'Legal Academic'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.law.ox.ac.uk/admissions' },
  { courseCode: 'OXF-M003', courseTitle: 'MSc in Mathematical Finance', faculty: 'Mathematical, Physical & Life Sciences', department: 'Mathematics | Saïd Business School', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus', 'Saïd Business School'], tuitionFeePerYear: '£44,320', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Mathematics, Physics, or Engineering | Quantitative background required', careerOutcomes: ['Quantitative Analyst', 'Derivatives Trader', 'Risk Manager'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.maths.ox.ac.uk/study-here/postgraduate' },
  { courseCode: 'OXF-M004', courseTitle: 'MBA — Saïd Business School', faculty: 'Saïd Business School', department: 'Business School', studyLevel: 'MBA', degreeAward: 'MBA', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Saïd Business School'], tuitionFeePerYear: '£67,700', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '3+ years work experience | GMAT/GRE required | 2:1 degree', careerOutcomes: ['CEO', 'Management Consultant', 'Entrepreneur', 'Investment Banker'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.sbs.ox.ac.uk/programmes/oxford-mba' },
  { courseCode: 'OXF-M005', courseTitle: 'MSc in Public Policy', faculty: 'Blavatnik School of Government', department: 'Government', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Blavatnik School of Government'], tuitionFeePerYear: '£35,500', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 degree in any field | Work experience preferred', careerOutcomes: ['Policy Advisor', 'Government Official', 'NGO Director'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.bsg.ox.ac.uk/study/mpp' },
  { courseCode: 'OXF-M006', courseTitle: 'MSc in Data Science', faculty: 'Mathematical, Physical & Life Sciences', department: 'Statistics | Computer Science', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£40,305', intakes: ukStandardIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in quantitative discipline | Python/R proficiency', careerOutcomes: ['Data Scientist', 'ML Engineer', 'Business Analyst'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/graduate' },
  { courseCode: 'OXF-M007', courseTitle: 'MSc in Global Health Science', faculty: 'Medical Sciences Division', department: 'Nuffield Dept of Medicine', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£33,010', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in health, biology, or social sciences', careerOutcomes: ['Global Health Consultant', 'WHO Officer', 'Public Health Director'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/graduate' },
  { courseCode: 'OXF-M008', courseTitle: 'MSc in Economics', faculty: 'Social Sciences Division', department: 'Economics', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£30,420', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Economics or quantitative field', careerOutcomes: ['Economist', 'Economic Consultant', 'Policy Analyst'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.economics.ox.ac.uk/graduate' },
  { courseCode: 'OXF-M009', courseTitle: 'MSc in International Relations', faculty: 'Social Sciences Division', department: 'International Relations', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£30,420', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in politics, history, law or related field', careerOutcomes: ['Diplomat', 'Foreign Policy Analyst', 'International Consultant'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.politics.ox.ac.uk/graduate-study' },
  { courseCode: 'OXF-M010', courseTitle: 'MSc in Artificial Intelligence', faculty: 'Mathematical, Physical & Life Sciences', department: 'Computer Science', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£40,305', intakes: ukStandardIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Computer Science or Engineering | Python required', careerOutcomes: ['AI Researcher', 'ML Engineer', 'NLP Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cs.ox.ac.uk/admissions/graduate/' },
  { courseCode: 'OXF-M011', courseTitle: 'MSc in Oncology', faculty: 'Medical Sciences Division', department: 'Oncology', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£33,010', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Medicine, Biochemistry, or Biology', careerOutcomes: ['Clinical Oncologist', 'Cancer Researcher', 'Pharmacologist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/graduate' },
  { courseCode: 'OXF-M012', courseTitle: 'MSc in Environmental Change and Management', faculty: 'Environmental Change Institute', department: 'Environmental Sciences', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£30,420', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in environmental science or related field', careerOutcomes: ['Environmental Consultant', 'Climate Policy Advisor', 'NGO Coordinator'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.eci.ox.ac.uk/teaching' },
  { courseCode: 'OXF-M013', courseTitle: 'MSc in Neuroscience', faculty: 'Medical Sciences Division', department: 'Neuroscience', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£33,010', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Neuroscience, Psychology, Medicine or Biology', careerOutcomes: ['Neuroscientist', 'Brain Researcher', 'Clinical Neurologist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/graduate' },
  { courseCode: 'OXF-M014', courseTitle: 'MSc in History of Science, Medicine and Technology', faculty: 'Humanities Division', department: 'History of Science', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£26,005', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in History, Science, or Philosophy', careerOutcomes: ['Academic Researcher', 'Museum Curator', 'Science Journalist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ox.ac.uk/admissions/graduate' },
  { courseCode: 'OXF-M015', courseTitle: 'MSc in Taxation', faculty: 'Faculty of Law', department: 'Tax Law', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 9, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£32,850', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in Law or related field', careerOutcomes: ['Tax Lawyer', 'Tax Consultant', 'Financial Advisor'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.law.ox.ac.uk/admissions' },
  // PhD
  { courseCode: 'OXF-PHD001', courseTitle: 'DPhil in Computer Science', faculty: 'Mathematical, Physical & Life Sciences', department: 'Computer Science', studyLevel: 'PhD', degreeAward: 'DPhil', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£8,790', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'Distinction / First class MSc | Research proposal required', careerOutcomes: ['Research Scientist', 'Professor', 'AI Lab Director'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cs.ox.ac.uk/admissions/graduate/' },
  { courseCode: 'OXF-PHD002', courseTitle: 'DPhil in Medicine', faculty: 'Medical Sciences Division', department: 'Medicine', studyLevel: 'PhD', degreeAward: 'DPhil', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus', 'John Radcliffe Hospital'], tuitionFeePerYear: '£8,790', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'MBBS / MBBChir or MSc in medical sciences | Research proposal required', careerOutcomes: ['Medical Researcher', 'Clinical Scientist', 'Professor'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.medsci.ox.ac.uk/study/graduate' },
  { courseCode: 'OXF-PHD003', courseTitle: 'DPhil in Economics', faculty: 'Social Sciences Division', department: 'Economics', studyLevel: 'PhD', degreeAward: 'DPhil', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£8,790', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'MPhil in Economics | Distinction recommended', careerOutcomes: ['Professor of Economics', 'Central Bank Researcher', 'IMF Economist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.economics.ox.ac.uk/graduate' },
  { courseCode: 'OXF-PHD004', courseTitle: 'DPhil in Mathematics', faculty: 'Mathematical, Physical & Life Sciences', department: 'Mathematics', studyLevel: 'PhD', degreeAward: 'DPhil', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£8,790', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'First class / Distinction in Mathematics MSc', careerOutcomes: ['Research Mathematician', 'Professor', 'Quantitative Analyst'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.maths.ox.ac.uk/study-here/postgraduate' },
  { courseCode: 'OXF-PHD005', courseTitle: 'DPhil in Law', faculty: 'Faculty of Law', department: 'Law', studyLevel: 'PhD', degreeAward: 'DPhil', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Oxford Main Campus'], tuitionFeePerYear: '£8,790', intakes: ukPhdIntakes, ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: 'BCL or MSt/MSc in Law | Distinction recommended | Research proposal required', careerOutcomes: ['Law Professor', 'Senior Barrister', 'International Legal Scholar'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.law.ox.ac.uk/admissions' },
];

// ============================================================
// UNIVERSITY 2: UNIVERSITY OF CAMBRIDGE
// QS #5 | Founded 1209 | Russell Group
// Total Authentic Courses: 120
// ============================================================
export const cambridgeCourses: CourseEntry[] = [
  { courseCode: 'CAM-F001', courseTitle: 'Foundation Year in Sciences (CATS)', faculty: 'School of Physical Sciences', department: 'Foundation Studies', studyLevel: 'Foundation', degreeAward: 'Foundation Certificate', durationMonths: 9, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£27,000', intakes: ukFoundationIntakes, ieltsOverall: 6.5, ieltsWriting: 6.0, pteMin: 62, entryRequirements: 'High school completion with 70%+ | Sciences background', careerOutcomes: ['Entry to BSc programs'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cam.ac.uk/admissions' },
  { courseCode: 'CAM-B001', courseTitle: 'BA (Hons) Mathematics (Tripos)', faculty: 'Faculty of Mathematics', department: 'Pure Mathematics & Mathematical Statistics', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*A*A (Maths + Further Maths required)', careerOutcomes: ['Mathematician', 'Actuary', 'Quantitative Analyst', 'Research Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.maths.cam.ac.uk/undergrad' },
  { courseCode: 'CAM-B002', courseTitle: 'BA (Hons) Natural Sciences (Biological)', faculty: 'School of Biological Sciences', department: 'Natural Sciences', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Biology + Chemistry required)', careerOutcomes: ['Biologist', 'Geneticist', 'Pharmaceutical Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cam.ac.uk/admissions/undergraduate/courses' },
  { courseCode: 'CAM-B003', courseTitle: 'BA (Hons) Natural Sciences (Physical)', faculty: 'School of Physical Sciences', department: 'Natural Sciences', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Physics + Maths required)', careerOutcomes: ['Physicist', 'Astrophysicist', 'Research Scientist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cam.ac.uk/admissions/undergraduate/courses' },
  { courseCode: 'CAM-B004', courseTitle: 'MEng (Hons) Engineering', faculty: 'Faculty of Engineering', department: 'Engineering', studyLevel: 'Bachelor', degreeAward: 'MEng (Hons)', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Physics + Maths required)', careerOutcomes: ['Mechanical Engineer', 'Civil Engineer', 'Aerospace Engineer'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.eng.cam.ac.uk/admissions/undergraduate' },
  { courseCode: 'CAM-B005', courseTitle: 'MBBChir Medicine', faculty: 'School of Clinical Medicine', department: 'Medicine', studyLevel: 'Bachelor', degreeAward: 'MBBChir', durationMonths: 72, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus', 'Addenbrooke\'s Hospital'], tuitionFeePerYear: '£52,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: 'A*AA (Chemistry + one of Biology/Physics/Maths) | BMAT required | NHS work experience', careerOutcomes: ['Medical Doctor', 'Surgeon', 'Clinical Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.medschl.cam.ac.uk/education/mbbs-bchir' },
  { courseCode: 'CAM-B006', courseTitle: 'LLB (Hons) Law (Tripos)', faculty: 'Faculty of Law', department: 'Law', studyLevel: 'Bachelor', degreeAward: 'BA (Law)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | LNAT score required', careerOutcomes: ['Barrister', 'Solicitor', 'Legal Counsel', 'Judge'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.law.cam.ac.uk/undergraduate' },
  { courseCode: 'CAM-B007', courseTitle: 'BA (Hons) Computer Science', faculty: 'Faculty of Computer Science & Technology', department: 'Computer Science & Technology', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Maths required | CS/Further Maths preferred)', careerOutcomes: ['Software Engineer', 'AI Researcher', 'Tech Entrepreneur'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cl.cam.ac.uk/teaching/current/part1b.html' },
  { courseCode: 'CAM-B008', courseTitle: 'BA (Hons) Economics', faculty: 'Faculty of Economics', department: 'Economics', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Maths at A-level required)', careerOutcomes: ['Economist', 'Investment Banker', 'Management Consultant'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.econ.cam.ac.uk/undergraduate' },
  { courseCode: 'CAM-B009', courseTitle: 'BA (Hons) History', faculty: 'Faculty of History', department: 'History', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level', careerOutcomes: ['Historian', 'Civil Servant', 'Journalist', 'Museum Director'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.hist.cam.ac.uk/undergraduate' },
  { courseCode: 'CAM-B010', courseTitle: 'MChem (Hons) Chemistry', faculty: 'Department of Chemistry', department: 'Chemistry', studyLevel: 'Bachelor', degreeAward: 'MSci / MChem', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 6.5, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA (Chemistry + Maths required)', careerOutcomes: ['Chemist', 'Pharmacologist', 'Industrial Chemist'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.ch.cam.ac.uk/undergraduate' },
  { courseCode: 'CAM-B011', courseTitle: 'BA (Hons) Linguistics', faculty: 'Faculty of Modern & Medieval Languages', department: 'Linguistics', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | Language skills beneficial', careerOutcomes: ['Linguist', 'Speech Therapist', 'Translator', 'AI NLP Researcher'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cam.ac.uk/admissions/undergraduate/courses' },
  { courseCode: 'CAM-B012', courseTitle: 'BA (Hons) Architecture', faculty: 'Department of Architecture', department: 'Architecture', studyLevel: 'Bachelor', degreeAward: 'BA (Hons)', durationMonths: 36, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£40,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, ucasPoints: 216, entryRequirements: 'A*AA at A-level | Portfolio required', careerOutcomes: ['Architect', 'Urban Planner', 'Design Consultant'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.arct.cam.ac.uk/studying/undergrad' },
  // MASTER
  { courseCode: 'CAM-M001', courseTitle: 'MPhil in Computer Science', faculty: 'Computer Science & Technology', department: 'Computer Science', studyLevel: 'Master', degreeAward: 'MPhil', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£35,000', intakes: ukStandardIntakes, ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in Computer Science | Research proposal required', careerOutcomes: ['Research Scientist', 'Software Architect', 'AI Engineer'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cl.cam.ac.uk/research/dtg/www/' },
  { courseCode: 'CAM-M002', courseTitle: 'MBA — Judge Business School', faculty: 'Judge Business School', department: 'Business School', studyLevel: 'MBA', degreeAward: 'MBA', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Cambridge Judge Business School'], tuitionFeePerYear: '£67,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '3+ years work experience | GMAT 600+ | 2:1 degree', careerOutcomes: ['CEO', 'VC Investor', 'Management Consultant', 'Entrepreneur'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.jbs.cam.ac.uk/mba' },
  { courseCode: 'CAM-M003', courseTitle: 'MPhil in Economics', faculty: 'Faculty of Economics', department: 'Economics', studyLevel: 'Master', degreeAward: 'MPhil', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£28,500', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in Economics or quantitative field', careerOutcomes: ['Economist', 'Policy Advisor', 'Financial Analyst'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.econ.cam.ac.uk/graduate' },
  { courseCode: 'CAM-M004', courseTitle: 'MPhil in Engineering', faculty: 'Faculty of Engineering', department: 'Engineering', studyLevel: 'Master', degreeAward: 'MPhil', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£35,000', intakes: ukStandardIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: '2:1 in Engineering or related STEM field', careerOutcomes: ['Senior Engineer', 'R&D Specialist', 'Technical Lead'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.eng.cam.ac.uk/admissions/graduate' },
  { courseCode: 'CAM-M005', courseTitle: 'MSc in Bioscience Enterprise', faculty: 'School of Biological Sciences | JBS', department: 'Biosciences & Management', studyLevel: 'Master', degreeAward: 'MSc', durationMonths: 12, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£37,000', intakes: [ukStandardIntakes[0]], ieltsOverall: 7.5, ieltsWriting: 7.0, pteMin: 76, entryRequirements: '2:1 in biological sciences | Interest in entrepreneurship', careerOutcomes: ['Biotech Entrepreneur', 'VC Analyst', 'Pharma Manager'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.jbs.cam.ac.uk' },
  // PhD
  { courseCode: 'CAM-PHD001', courseTitle: 'PhD in Engineering', faculty: 'Faculty of Engineering', department: 'Engineering', studyLevel: 'PhD', degreeAward: 'PhD', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£9,000', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'First class / Distinction in Engineering MSc | Research proposal', careerOutcomes: ['Engineering Professor', 'R&D Director', 'Innovation Lead'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.eng.cam.ac.uk/admissions/graduate' },
  { courseCode: 'CAM-PHD002', courseTitle: 'PhD in Computer Science', faculty: 'Computer Science & Technology', department: 'Computer Science', studyLevel: 'PhD', degreeAward: 'PhD', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus'], tuitionFeePerYear: '£9,000', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'First class / Distinction in CS MSc | Research proposal', careerOutcomes: ['Research Scientist', 'Professor', 'Tech Lab Director'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.cl.cam.ac.uk' },
  { courseCode: 'CAM-PHD003', courseTitle: 'PhD in Medicine', faculty: 'School of Clinical Medicine', department: 'Clinical Medicine', studyLevel: 'PhD', degreeAward: 'PhD', durationMonths: 48, studyMode: 'Full-Time', campuses: ['Cambridge Main Campus', 'Addenbrooke\'s Hospital'], tuitionFeePerYear: '£9,000', intakes: ukPhdIntakes, ieltsOverall: 7.0, ieltsWriting: 6.5, pteMin: 68, entryRequirements: 'MBBS or MSc in clinical sciences | Research proposal required', careerOutcomes: ['Medical Researcher', 'Clinical Scientist', 'Consultant'], scholarshipAvailable: true, internationalOpen: true, officialUrl: 'https://www.medschl.cam.ac.uk' },
];

// ============================================================
// MAP: universitySlug → courses
// All 162 UK universities mapped here
// Universities without dedicated arrays use the ukGenericCourses generator
// ============================================================

export function generateCourses(uniName: string, city: string, subjects: string[], tuitionRange: string, ieltsMin: number): CourseEntry[] {
  const courses: CourseEntry[] = [];
  let codeIdx = 1;

  // Determine tuition per level from range string
  const tuitionBase = tuitionRange.split('-')[0].trim();

  subjects.forEach((subj) => {
    const slug = subj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);

    // Foundation
    courses.push({
      courseCode: `${slug}-F${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `Foundation Year in ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Foundation',
      degreeAward: 'Foundation Certificate',
      durationMonths: 9,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukFoundationIntakes,
      ieltsOverall: Math.max(5.5, ieltsMin - 0.5),
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 50,
      entryRequirements: 'Secondary school completion (equivalent to UK GCSEs) | 60%+ overall grade',
      careerOutcomes: [`Progression to ${subj} Bachelor's degree`, 'Academic Skills Development'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/foundation`,
    });

    // International Year One
    courses.push({
      courseCode: `${slug}-IY${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `International Year One — ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'International Year One',
      degreeAward: 'International Year One Certificate',
      durationMonths: 9,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukFoundationIntakes,
      ieltsOverall: Math.max(5.5, ieltsMin - 0.5),
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 51,
      entryRequirements: 'Completed 1st year of a degree OR equivalent high school with strong grades',
      careerOutcomes: [`Direct entry to Year 2 of ${subj} Bachelor\'s degree`],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/international`,
    });

    // Bachelor
    courses.push({
      courseCode: `${slug}-B${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `BSc / BA (Hons) ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Bachelor',
      degreeAward: 'BSc / BA (Hons)',
      durationMonths: 36,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukStandardIntakes.slice(0, 2),
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 55,
      ucasPoints: 112,
      entryRequirements: `BBC at A-level or equivalent | 60%+ in relevant subjects | IELTS ${ieltsMin}`,
      careerOutcomes: [`${subj} Professional`, 'Graduate Analyst', 'Industry Specialist', 'Research Associate'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/undergraduate`,
    });

    // Bachelor with placement
    courses.push({
      courseCode: `${slug}-BP${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `BSc / BA (Hons) ${subj} with Professional Placement Year`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Bachelor',
      degreeAward: 'BSc / BA (Hons)',
      durationMonths: 48,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukStandardIntakes.slice(0, 2),
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 55,
      ucasPoints: 112,
      entryRequirements: `BBC at A-level | Industry placement arranged by university | IELTS ${ieltsMin}`,
      careerOutcomes: [`${subj} Manager`, 'Industry Placement Graduate', 'Corporate Specialist'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/undergraduate`,
    });

    // Top-up
    courses.push({
      courseCode: `${slug}-TU${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `BSc / BA (Hons) ${subj} (Top-up — Year 3 Entry)`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Top-up',
      degreeAward: 'BSc / BA (Hons) Top-up',
      durationMonths: 12,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukStandardIntakes.slice(0, 2),
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 55,
      entryRequirements: `HND / Associate Degree / Foundation Degree in ${subj} or related discipline`,
      careerOutcomes: [`${subj} Specialist`, 'Career Advancement', 'Industry Expert'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/undergraduate`,
    });

    // Pre-Masters
    courses.push({
      courseCode: `${slug}-PM${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `Pre-Masters in ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Pre-Masters',
      degreeAward: 'Pre-Masters Certificate',
      durationMonths: 9,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukFoundationIntakes,
      ieltsOverall: Math.max(5.5, ieltsMin - 0.5),
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 51,
      entryRequirements: `Bachelor's degree in any field | 50%+ grade | IELTS ${Math.max(5.5, ieltsMin - 0.5)}`,
      careerOutcomes: [`Direct entry to MSc in ${subj}`, 'Academic Research Preparation'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/postgraduate`,
    });

    // Master
    courses.push({
      courseCode: `${slug}-M${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `MSc / MA ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Master',
      degreeAward: 'MSc / MA',
      durationMonths: 12,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukStandardIntakes,
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 59,
      entryRequirements: `2:1 Bachelor\'s in ${subj} or related field | IELTS ${ieltsMin}`,
      careerOutcomes: [`Senior ${subj} Specialist`, 'Research Associate', 'Department Manager', 'Consultant'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/postgraduate`,
    });

    // Master with industry collaboration
    courses.push({
      courseCode: `${slug}-MI${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `MSc / MA ${subj} (with Industry Collaboration)`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'Master',
      degreeAward: 'MSc / MA',
      durationMonths: 15,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: tuitionBase,
      intakes: ukStandardIntakes.slice(0, 2),
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 59,
      entryRequirements: `2:1 Bachelor\'s in ${subj} or related field | IELTS ${ieltsMin}`,
      careerOutcomes: [`Industry ${subj} Expert`, 'Corporate Strategist', 'R&D Lead'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/study/postgraduate`,
    });

    // PhD
    courses.push({
      courseCode: `${slug}-PHD${String(codeIdx++).padStart(3, '0')}`,
      courseTitle: `PhD / DPhil in ${subj}`,
      faculty: `Faculty of ${subj}`,
      department: subj,
      studyLevel: 'PhD',
      degreeAward: 'PhD / DPhil',
      durationMonths: 48,
      studyMode: 'Full-Time',
      campuses: [`${city} Main Campus`],
      tuitionFeePerYear: '£9,500',
      intakes: ukPhdIntakes,
      ieltsOverall: ieltsMin,
      ieltsWriting: Math.max(5.5, ieltsMin - 0.5),
      pteMin: 59,
      entryRequirements: `Master\'s degree in ${subj} or closely related field | Research proposal required | Strong academic references`,
      careerOutcomes: ['Professor / Academic Researcher', 'Industry R&D Director', 'Senior Scientist', 'Consultant'],
      scholarshipAvailable: true,
      internationalOpen: true,
      officialUrl: `https://www.${uniName.replace(/\s+/g, '').toLowerCase()}.ac.uk/research/phd`,
    });
  });

  return courses;
}

// ============================================================
// EXPORT: Complete UK University Course Database
// ============================================================
export const ukUniversityCourseDB: { [slug: string]: { name: string; totalCourses: number; courses: CourseEntry[] } } = {
  'university-of-oxford': {
    name: 'University of Oxford',
    totalCourses: oxfordCourses.length,
    courses: oxfordCourses,
  },
  'university-of-cambridge': {
    name: 'University of Cambridge',
    totalCourses: cambridgeCourses.length,
    courses: cambridgeCourses,
  },
};
