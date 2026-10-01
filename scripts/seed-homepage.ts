import { db } from '../src/lib/db'

/**
 * Helper: safely create records one by one, skipping duplicates when providers
 * or model delegates do not expose bulk duplicate skipping consistently.
 */
async function seedMany<T extends Record<string, unknown>>(
  model: { create: (args: { data: T }) => Promise<unknown> },
  records: T[],
  label: string,
  uniqueField: string = 'slug',
) {
  let count = 0
  for (const record of records) {
    try {
      await model.create({ data: record as Parameters<typeof model.create>[0]['data'] })
      count++
    } catch (err: unknown) {
      // Skip unique constraint violations (duplicate records)
      if (err instanceof Error && (err.message.includes('Unique constraint') || err.message.includes('already exists'))) {
        // Already seeded, skip
      } else {
        throw err
      }
    }
  }
  return count
}

async function seed() {
  console.log('🌱 Seeding ALO Education Homepage Data...')

  const now = new Date()

  // ── 1. Countries ──────────────────────────────────────────────
  console.log('  📍 Seeding Countries...')

  const countries = [
    {
      name: 'United Kingdom',
      slug: 'united-kingdom',
      code: 'GB',
      flag: '🇬🇧',
      accentColor: '#0B5ED7',
      popularCities: JSON.stringify(['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds']),
      popularIntakes: JSON.stringify(['September', 'January', 'May']),
      studyLevels: JSON.stringify(['Foundation', 'Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 42,
      courseCount: 1200,
      scholarshipCount: 35,
      visaType: 'Student Visa (formerly Tier 4)',
      tuitionRange: '£10,000 – £35,000/year',
      livingCost: '£900 – £1,500/month',
      workRights: '20 hrs/week during term, full-time during holidays',
      description: 'The UK is home to world-renowned universities like Oxford, Cambridge, and Imperial College London. With a rich academic heritage and diverse culture, the UK offers outstanding education and post-study work opportunities.',
      heroImage: '/images/hero-banners/UK slide Banner.webp',
      heroCity: 'London',
      heroIntake: 'Sep 2025 / Jan 2026',
      heroSubtitle: 'World-Class Education in the Heart of Europe',
      sortOrder: 1,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'United States',
      slug: 'usa',
      code: 'US',
      flag: '🇺🇸',
      accentColor: '#3B82F6',
      popularCities: JSON.stringify(['New York', 'Los Angeles', 'Boston', 'Chicago', 'Houston']),
      popularIntakes: JSON.stringify(['August', 'January', 'May']),
      studyLevels: JSON.stringify(['Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 50,
      courseCount: 1500,
      scholarshipCount: 40,
      visaType: 'F-1 Visa',
      tuitionRange: '$20,000 – $60,000/year',
      livingCost: '$1,000 – $2,500/month',
      workRights: 'On-campus jobs, OPT/CPT for internships',
      description: 'The US boasts the highest number of top-ranked universities globally. From Ivy League schools to state universities, the US offers unparalleled research facilities, diverse programs, and vibrant campus life.',
      heroImage: '/images/hero-banners/USA slide Banner.webp',
      heroCity: 'New York',
      heroIntake: 'Aug 2025 / Jan 2026',
      heroSubtitle: 'Top Universities & Endless Career Opportunities',
      sortOrder: 2,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'Canada',
      slug: 'canada',
      code: 'CA',
      flag: '🇨🇦',
      accentColor: '#F97316',
      popularCities: JSON.stringify(['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary']),
      popularIntakes: JSON.stringify(['September', 'January', 'May']),
      studyLevels: JSON.stringify(['Diploma', 'Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 35,
      courseCount: 950,
      scholarshipCount: 28,
      visaType: 'Study Permit',
      tuitionRange: 'CAD 15,000 – CAD 35,000/year',
      livingCost: 'CAD 1,000 – CAD 1,800/month',
      workRights: '20 hrs/week during term, full-time during holidays',
      description: 'Canada is a top destination for international students due to its welcoming immigration policies, high-quality education system, and pathways to permanent residency after graduation.',
      heroImage: '/images/hero-banners/Canada slide Banner.webp',
      heroCity: 'Toronto',
      heroIntake: 'Sep 2025 / Jan 2026 / May 2026',
      heroSubtitle: 'Immigration-Friendly Pathways to Your Future',
      sortOrder: 3,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'Australia',
      slug: 'australia',
      code: 'AU',
      flag: '🇦🇺',
      accentColor: '#10B981',
      popularCities: JSON.stringify(['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']),
      popularIntakes: JSON.stringify(['February', 'July', 'November']),
      studyLevels: JSON.stringify(['Foundation', 'Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 30,
      courseCount: 800,
      scholarshipCount: 22,
      visaType: 'Student Visa (Subclass 500)',
      tuitionRange: 'AUD 20,000 – AUD 45,000/year',
      livingCost: 'AUD 1,400 – AUD 2,500/month',
      workRights: '48 hrs/fortnight during term, full-time during holidays',
      description: 'Australia offers world-class education in a stunning natural environment. With its Group of Eight universities, excellent research facilities, and generous post-study work rights, Australia is a favorite among Bangladeshi students.',
      heroImage: '/images/hero-banners/Australia slide Banner.webp',
      heroCity: 'Sydney',
      heroIntake: 'Feb 2026 / Jul 2026',
      heroSubtitle: 'Sunshine, Quality Education & Post-Study Work Rights',
      sortOrder: 4,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'Ireland',
      slug: 'ireland',
      code: 'IE',
      flag: '🇮🇪',
      accentColor: '#10B981',
      popularCities: JSON.stringify(['Dublin', 'Cork', 'Galway', 'Limerick']),
      popularIntakes: JSON.stringify(['September', 'January']),
      studyLevels: JSON.stringify(['Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 20,
      courseCount: 400,
      scholarshipCount: 15,
      visaType: 'Stamp 2',
      tuitionRange: '€10,000 – €25,000/year',
      livingCost: '€800 – €1,500/month',
      workRights: '20 hrs/week during term, full-time during holidays',
      description: 'Ireland is a rapidly growing hub for technology and innovation, home to European headquarters of Google, Facebook, and Apple. With a 2-year stay-back visa, Ireland offers excellent post-graduation opportunities.',
      heroImage: '/images/hero-banners/Europe slide Banner.webp',
      heroCity: 'Dublin',
      heroIntake: 'Sep 2025 / Jan 2026',
      heroSubtitle: 'Stay Back Visa & Growing Tech Hub in Europe',
      sortOrder: 5,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'New Zealand',
      slug: 'new-zealand',
      code: 'NZ',
      flag: '🇳🇿',
      accentColor: '#0EA5E9',
      popularCities: JSON.stringify(['Auckland', 'Wellington', 'Christchurch', 'Hamilton']),
      popularIntakes: JSON.stringify(['February', 'July']),
      studyLevels: JSON.stringify(['Undergraduate', 'Postgraduate', 'PGD', 'PhD']),
      universityCount: 15,
      courseCount: 300,
      scholarshipCount: 12,
      visaType: 'Student Visa',
      tuitionRange: 'NZD 22,000 – NZD 35,000/year',
      livingCost: 'NZD 1,200 – NZD 2,000/month',
      workRights: '20 hrs/week during term, full-time during holidays',
      description: 'New Zealand is known for its safe, peaceful environment and high-quality education. All eight universities are ranked in the QS World University Rankings, offering excellent research opportunities and post-study work pathways.',
      heroImage: '/images/hero-banners/New Zealand slide Banner.webp',
      heroCity: 'Auckland',
      heroIntake: 'Feb 2026 / Jul 2026',
      heroSubtitle: 'Safe, Peaceful & Work While You Study',
      sortOrder: 6,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'Dubai / UAE',
      slug: 'dubai-uae',
      code: 'AE',
      flag: '🇦🇪',
      accentColor: '#F59E0B',
      popularCities: JSON.stringify(['Dubai', 'Abu Dhabi', 'Sharjah']),
      popularIntakes: JSON.stringify(['September', 'January', 'April']),
      studyLevels: JSON.stringify(['Undergraduate', 'Postgraduate', 'Foundation']),
      universityCount: 18,
      courseCount: 250,
      scholarshipCount: 10,
      visaType: 'Student Visa',
      tuitionRange: 'AED 35,000 – AED 80,000/year',
      livingCost: 'AED 3,000 – AED 6,000/month',
      workRights: 'Part-time work permitted with university approval',
      description: 'Dubai and the UAE offer world-class education with branches of top international universities. Students benefit from a tax-free economy, multicultural environment, and growing career opportunities in the Gulf region.',
      heroImage: '/images/hero-banners/Europe slide Banner.webp',
      heroCity: 'Dubai',
      heroIntake: 'Sep 2025 / Jan 2026',
      heroSubtitle: 'Affordable Education & Career Growth in the Gulf',
      sortOrder: 7,
      status: 'active',
      lastVerifiedAt: now,
    },
    {
      name: 'Germany',
      slug: 'germany',
      code: 'DE',
      flag: '🇩🇪',
      accentColor: '#F59E0B',
      popularCities: JSON.stringify(['Berlin', 'Munich', 'Hamburg', 'Frankfurt']),
      popularIntakes: JSON.stringify(['October', 'April']),
      studyLevels: JSON.stringify(['Undergraduate', 'Postgraduate', 'PhD']),
      universityCount: 12,
      courseCount: 200,
      scholarshipCount: 8,
      visaType: 'Student Visa',
      tuitionRange: 'Free – €500/semester (public universities)',
      livingCost: '€700 – €1,100/month',
      workRights: '120 full days or 240 half days per year',
      description: 'Germany is renowned for its tuition-free education at public universities and strong engineering, automotive, and technology programs. With excellent research facilities and a thriving economy, Germany is ideal for students seeking affordable, high-quality education.',
      heroImage: '/images/hero-banners/Europe slide Banner.webp',
      heroCity: 'Berlin',
      heroIntake: 'Oct 2025 / Apr 2026',
      heroSubtitle: 'Tuition-Free Excellence in the Heart of Europe',
      sortOrder: 8,
      status: 'active',
      lastVerifiedAt: now,
    },
  ]

  const countryCount = await seedMany(db.country, countries, 'countries')
  console.log(`    ✓ ${countryCount} countries seeded`)

  // ── 2. Website English Tests ───────────────────────────────────
  console.log('  📝 Seeding English Tests...')

  const englishTests = [
    {
      name: 'IELTS',
      slug: 'ielts',
      shortDescription: 'The world\'s most popular English language proficiency test for study, work, and migration.',
      bestFor: 'UK, Australia, Canada, New Zealand, Ireland universities',
      acceptedDest: 'UK, Australia, Canada, New Zealand, Ireland, USA (some)',
      resultTime: '3-5 days (computer-delivered), 13 days (paper-based)',
      scoreRange: '0-9 band scale',
      format: 'Listening, Reading, Writing, Speaking – 2 hrs 45 min',
      sortOrder: 1,
      status: 'active',
    },
    {
      name: 'IELTS UKVI',
      slug: 'ielts-ukvi',
      shortDescription: 'IELTS test approved by UK Visas and Immigration for UK student visa applications.',
      bestFor: 'UK student visa applications',
      acceptedDest: 'United Kingdom',
      resultTime: '3-5 days (computer-delivered), 13 days (paper-based)',
      scoreRange: '0-9 band scale',
      format: 'Listening, Reading, Writing, Speaking – 2 hrs 45 min',
      sortOrder: 2,
      status: 'active',
    },
    {
      name: 'PTE Academic',
      slug: 'pte-academic',
      shortDescription: 'Fast, fair, and flexible computer-based English test accepted worldwide.',
      bestFor: 'Australia, UK, USA, Canada, New Zealand universities',
      acceptedDest: 'Australia, UK, USA, Canada, New Zealand, Ireland',
      resultTime: '1-5 business days',
      scoreRange: '10-90 score range',
      format: 'Speaking & Writing, Reading, Listening – 2 hours',
      sortOrder: 3,
      status: 'active',
    },
    {
      name: 'TOEFL iBT',
      slug: 'toefl-ibt',
      shortDescription: 'Internet-based Test of English as a Foreign Language, widely accepted in the USA.',
      bestFor: 'USA universities, global institutions',
      acceptedDest: 'USA (primary), UK, Canada, Australia, Germany',
      resultTime: '4-8 days',
      scoreRange: '0-120 total score',
      format: 'Reading, Listening, Speaking, Writing – 3 hours',
      sortOrder: 4,
      status: 'active',
    },
    {
      name: 'Duolingo English Test',
      slug: 'duolingo-english-test',
      shortDescription: 'Affordable, convenient online English test accepted by thousands of universities.',
      bestFor: 'Quick, affordable English proficiency proof',
      acceptedDest: 'USA, UK, Canada, Australia (selective), Ireland',
      resultTime: '48 hours',
      scoreRange: '10-160 score range',
      format: 'Adaptive: Reading, Listening, Writing, Speaking – 1 hour',
      sortOrder: 5,
      status: 'active',
    },
    {
      name: 'OIETC/ELLT',
      slug: 'oietc-ellt',
      shortDescription: 'Online English Language Test for university admission, accepted by UK and partner universities.',
      bestFor: 'UK university admissions, alternative to IELTS',
      acceptedDest: 'United Kingdom, select partner universities',
      resultTime: '3-5 working days',
      scoreRange: 'A2-C2 CEFR levels',
      format: 'Reading, Listening, Writing, Speaking (online proctored)',
      sortOrder: 6,
      status: 'active',
    },
    {
      name: 'Oxford ELLT',
      slug: 'oxford-ellt',
      shortDescription: 'English Language Level Test by Oxford International, designed for UK university entry.',
      bestFor: 'UK university direct entry and pre-sessional placement',
      acceptedDest: 'United Kingdom',
      resultTime: '5-7 working days',
      scoreRange: 'A2-C2 CEFR levels',
      format: 'Reading, Listening, Writing, Speaking – online',
      sortOrder: 7,
      status: 'active',
    },
    {
      name: 'LanguageCert',
      slug: 'languagecert',
      shortDescription: 'Flexible, affordable English language exams recognized internationally.',
      bestFor: 'UK, Ireland, and European university admissions',
      acceptedDest: 'UK, Ireland, Malta, select European countries',
      resultTime: '3-5 business days',
      scoreRange: 'A1-C2 CEFR levels',
      format: 'Written (Reading & Writing) and Spoken (Listening & Speaking)',
      sortOrder: 8,
      status: 'active',
    },
    {
      name: 'Kaplan English Test',
      slug: 'kaplan-english-test',
      shortDescription: 'Online English proficiency test designed for university admissions.',
      bestFor: 'UK and select partner university admissions',
      acceptedDest: 'United Kingdom, select universities',
      resultTime: '48 hours',
      scoreRange: 'CEFR A2-C2 equivalent',
      format: 'Reading, Listening, Writing, Speaking – online adaptive',
      sortOrder: 9,
      status: 'active',
    },
    {
      name: 'OET',
      slug: 'oet',
      shortDescription: 'Occupational English Test for healthcare professionals seeking to work or study abroad.',
      bestFor: 'Healthcare professionals (nurses, doctors, pharmacists)',
      acceptedDest: 'UK, Australia, New Zealand, Ireland, USA, Canada',
      resultTime: '15 business days',
      scoreRange: 'A-D grades (A highest)',
      format: 'Listening, Reading, Writing, Speaking (profession-specific)',
      sortOrder: 10,
      status: 'active',
    },
    {
      name: 'GRE',
      slug: 'gre',
      shortDescription: 'Graduate Record Examination required for many postgraduate programs in the USA.',
      bestFor: 'USA and global postgraduate admissions (non-business)',
      acceptedDest: 'USA (primary), UK, Canada, Australia (selective)',
      resultTime: '8-10 days',
      scoreRange: '130-170 Verbal/Quant, 0-6 Analytical Writing',
      format: 'Verbal Reasoning, Quantitative Reasoning, Analytical Writing',
      sortOrder: 11,
      status: 'active',
    },
    {
      name: 'GMAT',
      slug: 'gmat',
      shortDescription: 'Graduate Management Admission Test for business school applicants worldwide.',
      bestFor: 'MBA and business master\'s programs',
      acceptedDest: 'USA, UK, Canada, Europe, Australia',
      resultTime: '7 business days (unofficial immediate)',
      scoreRange: '200-800 total score',
      format: 'Quantitative, Verbal, Integrated Reasoning, Analytical Writing',
      sortOrder: 12,
      status: 'active',
    },
    {
      name: 'SAT',
      slug: 'sat',
      shortDescription: 'Standardized test for undergraduate college admissions, widely used in the USA.',
      bestFor: 'USA undergraduate university admissions',
      acceptedDest: 'USA (primary), UK, Canada (selective)',
      resultTime: '2-4 weeks',
      scoreRange: '400-1600 total score (Evidence-Based Reading/Writing + Math)',
      format: 'Reading, Writing & Language, Math – 3 hours',
      sortOrder: 13,
      status: 'active',
    },
    {
      name: 'MOI Guidance',
      slug: 'moi-guidance',
      shortDescription: 'Medium of Instruction letter confirming that your previous degree was taught in English.',
      bestFor: 'Students who studied in English but lack formal test scores',
      acceptedDest: 'UK (selective), Canada (selective), Australia (selective)',
      resultTime: 'N/A (issued by previous institution)',
      scoreRange: 'N/A – institution-dependent',
      format: 'Official letter from your previous university',
      sortOrder: 14,
      status: 'active',
    },
  ]

  const testCount = await seedMany(db.websiteEnglishTest, englishTests, 'english tests')
  console.log(`    ✓ ${testCount} english tests seeded`)

  // ── 3. Home Services ──────────────────────────────────────────
  console.log('  🛠️  Seeding Home Services...')

  const services = [
    {
      title: 'Personalized Counseling',
      slug: 'personalized-counseling',
      icon: 'MessageCircle',
      description: 'One-on-one sessions with experienced counselors who understand your goals, budget, and aspirations to create a tailored study abroad roadmap.',
      ctaLabel: 'Book a Session',
      ctaUrl: '/contact',
      sortOrder: 1,
      status: 'active',
    },
    {
      title: 'University Selection',
      slug: 'university-selection',
      icon: 'GraduationCap',
      description: 'Expert guidance to find the best-fit universities based on your academic profile, career goals, financial situation, and preferred destination.',
      ctaLabel: 'Explore Universities',
      ctaUrl: '/universities',
      sortOrder: 2,
      status: 'active',
    },
    {
      title: 'AI Course Matching',
      slug: 'ai-course-matching',
      icon: 'Sparkles',
      description: 'Our intelligent AI analyzes your profile to recommend the most suitable courses and programs across hundreds of universities worldwide.',
      ctaLabel: 'Try AI Match',
      ctaUrl: '/course-finder',
      sortOrder: 3,
      status: 'active',
    },
    {
      title: 'Application Assistance',
      slug: 'application-assistance',
      icon: 'FileText',
      description: 'End-to-end support with your university applications, ensuring all documents are submitted correctly and on time for maximum success.',
      ctaLabel: 'Start Application',
      ctaUrl: '/apply',
      sortOrder: 4,
      status: 'active',
    },
    {
      title: 'SOP and CV Support',
      slug: 'sop-cv-support',
      icon: 'PenTool',
      description: 'Professional guidance on crafting compelling Statements of Purpose and CVs that stand out and effectively showcase your strengths.',
      ctaLabel: 'Get SOP Help',
      ctaUrl: '/sop-studio',
      sortOrder: 5,
      status: 'active',
    },
    {
      title: 'Document Checking',
      slug: 'document-checking',
      icon: 'CheckCircle',
      description: 'Thorough review of all your application documents — transcripts, references, certificates — to ensure they meet university requirements.',
      ctaLabel: 'Upload Documents',
      ctaUrl: '/documents',
      sortOrder: 6,
      status: 'active',
    },
    {
      title: 'Visa Guidance',
      slug: 'visa-guidance',
      icon: 'Plane',
      description: 'Complete visa application support including document preparation, interview coaching, and submission tracking for a stress-free experience.',
      ctaLabel: 'Visa Support',
      ctaUrl: '/visa',
      sortOrder: 7,
      status: 'active',
    },
    {
      title: 'Interview Preparation',
      slug: 'interview-preparation',
      icon: 'Mic',
      description: 'Mock interviews and expert tips to help you confidently face university admission and visa interviews with preparation and poise.',
      ctaLabel: 'Practice Now',
      ctaUrl: '/interview-prep',
      sortOrder: 8,
      status: 'active',
    },
    {
      title: 'English Test Preparation',
      slug: 'english-test-preparation',
      icon: 'BookOpen',
      description: 'Comprehensive preparation resources and expert tutoring for IELTS, PTE, TOEFL, and other English proficiency tests to achieve your target scores.',
      ctaLabel: 'Prepare for Tests',
      ctaUrl: '/english-tests',
      sortOrder: 9,
      status: 'active',
    },
    {
      title: 'Financial Planning',
      slug: 'financial-planning',
      icon: 'Wallet',
      description: 'Guidance on tuition costs, living expenses, scholarships, student loans, and budget planning to make your study abroad dream affordable.',
      ctaLabel: 'Plan Finances',
      ctaUrl: '/financial-planning',
      sortOrder: 10,
      status: 'active',
    },
    {
      title: 'Scholarship Guidance',
      slug: 'scholarship-guidance',
      icon: 'Award',
      description: 'Expert help identifying and applying for scholarships, grants, and bursaries to reduce your financial burden and fund your education.',
      ctaLabel: 'Find Scholarships',
      ctaUrl: '/scholarships',
      sortOrder: 11,
      status: 'active',
    },
    {
      title: 'Pre-Departure Orientation',
      slug: 'pre-departure-orientation',
      icon: 'MapPin',
      description: 'Comprehensive pre-departure briefings covering accommodation, culture, travel, packing, and what to expect in your new country.',
      ctaLabel: 'Get Oriented',
      ctaUrl: '/pre-departure',
      sortOrder: 12,
      status: 'active',
    },
    {
      title: 'Post-Arrival Support',
      slug: 'post-arrival-support',
      icon: 'Home',
      description: 'Ongoing support after you arrive — airport pickup, accommodation setup, bank account opening, SIM cards, and settling-in assistance.',
      ctaLabel: 'Arrival Support',
      ctaUrl: '/post-arrival',
      sortOrder: 13,
      status: 'active',
    },
    {
      title: 'Career Counseling',
      slug: 'career-counseling',
      icon: 'TrendingUp',
      description: 'Career-focused guidance to help you choose the right course and university that aligns with your long-term career aspirations and industry demands.',
      ctaLabel: 'Career Advice',
      ctaUrl: '/career',
      sortOrder: 14,
      status: 'active',
    },
    {
      title: 'Ongoing Mentorship',
      slug: 'ongoing-mentorship',
      icon: 'Users',
      description: 'Dedicated mentorship throughout your study abroad journey — from initial inquiry to graduation and beyond — ensuring you never feel alone.',
      ctaLabel: 'Connect with Mentor',
      ctaUrl: '/mentorship',
      sortOrder: 15,
      status: 'active',
    },
  ]

  const serviceCount = await seedMany(db.homeService, services, 'services')
  console.log(`    ✓ ${serviceCount} services seeded`)

  // ── 4. Success Stories ─────────────────────────────────────────
  console.log('  🎓 Seeding Success Stories...')

  // Get UK country id for linking
  const ukCountry = await db.country.findFirst({ where: { slug: 'united-kingdom' } })

  const successStories = [
    {
      studentName: 'Tushar Imran Nahid',
      homeDistrict: 'Dhaka',
      countryId: ukCountry?.id || '',
      university: 'Ravensbourne University London',
      course: 'BSc Business Management with International Year',
      outcome: 'Received unconditional offer with partial scholarship. Successfully enrolled for September 2025 intake.',
      testimonial: 'ALO Education made my dream of studying in the UK a reality. Their counselors guided me through every step — from choosing the right university to getting my visa approved. I\'m now studying at Ravensbourne University London and loving every moment!',
      photo: '/images/testimonials/Tushar Imran Nahid.png',
      consentStatus: 'verified',
      status: 'approved',
    },
    {
      studentName: 'Ummaye Mayesha Mannan',
      homeDistrict: 'Dhaka',
      countryId: ukCountry?.id || '',
      university: 'University of Derby',
      course: 'MRes Leadership and Management',
      outcome: 'Secured admission with merit-based scholarship. Visa approved within 2 weeks.',
      testimonial: 'I was confused about which university and program to choose, but ALO Education\'s personalized counseling helped me find the perfect fit. The application process was seamless, and I got my offer letter within 3 weeks. Highly recommend their services!',
      photo: '/images/testimonials/Ummaye Mayesha Manna.PNG',
      consentStatus: 'verified',
      status: 'approved',
    },
  ]

  const storyCount = await seedMany(db.successStory, successStories, 'success stories')
  console.log(`    ✓ ${storyCount} success stories seeded`)

  // ── 5. Team Members ────────────────────────────────────────────
  console.log('  👥 Seeding Team Members...')

  const teamMembers = [
    {
      name: 'Taslima Akter',
      role: 'Founder & CEO',
      specialty: 'Strategic Leadership, International Education Consulting',
      bio: 'Taslima Akter founded ALO Education with a vision to make world-class education accessible to every Bangladeshi student. With over a decade of experience in international education consulting, she has helped thousands of students achieve their study abroad dreams. Her leadership and dedication drive the company\'s mission of personalized, student-first guidance.',
      photo: '',
      sortOrder: 1,
      status: 'active',
    },
    {
      name: 'Al Aminn',
      role: 'Chief Operating Officer',
      specialty: 'Operations Management, Process Optimization',
      bio: 'Al Amin brings extensive expertise in operations management and process optimization to ALO Education. As COO, he ensures that every student receives seamless service from their first inquiry to their arrival abroad. His attention to detail and commitment to operational excellence keep ALO running smoothly.',
      photo: '',
      sortOrder: 2,
      status: 'active',
    },
  ]

  const teamCount = await seedMany(db.teamMember, teamMembers, 'team members')
  console.log(`    ✓ ${teamCount} team members seeded`)

  // ── 6. Homepage FAQs ──────────────────────────────────────────
  console.log('  ❓ Seeding FAQs...')

  const faqs = [
    {
      question: 'What services does ALO Education provide?',
      answer: 'ALO Education provides comprehensive study abroad services including personalized counseling, university selection, AI-powered course matching, application assistance, SOP/CV support, document checking, visa guidance, interview preparation, English test preparation, financial planning, scholarship guidance, pre-departure orientation, post-arrival support, career counseling, and ongoing mentorship.',
      sortOrder: 1,
      status: 'active',
    },
    {
      question: 'Which countries does ALO Education help students apply to?',
      answer: 'We help students apply to universities in the United Kingdom, United States, Canada, Australia, Ireland, New Zealand, Dubai/UAE, and Germany. Each destination offers unique advantages in terms of education quality, post-study work opportunities, and immigration pathways.',
      sortOrder: 2,
      status: 'active',
    },
    {
      question: 'How much does it cost to study abroad?',
      answer: 'Costs vary by country and institution. In the UK, tuition ranges from £10,000–£35,000/year. The USA ranges from $20,000–$60,000/year. Canada is CAD 15,000–35,000/year. Australia is AUD 20,000–45,000/year. Germany offers free tuition at public universities. We provide detailed financial planning to help you choose the right option for your budget.',
      sortOrder: 3,
      status: 'active',
    },
    {
      question: 'Do I need IELTS to study abroad?',
      answer: 'Many universities accept IELTS, but alternatives include PTE Academic, TOEFL iBT, Duolingo English Test, OIETC/ELLT, Oxford ELLT, and LanguageCert. Some universities also accept Medium of Instruction (MOI) letters. Our counselors will help you choose the best test based on your target universities.',
      sortOrder: 4,
      status: 'active',
    },
    {
      question: 'What is the application process with ALO Education?',
      answer: 'Our process starts with a free consultation where we understand your goals. Then we help you shortlist universities, prepare documents, craft your SOP/CV, submit applications, assist with visa processing, and provide pre-departure orientation. The entire process typically takes 3-6 months.',
      sortOrder: 5,
      status: 'active',
    },
    {
      question: 'Can I work while studying abroad?',
      answer: 'Yes! Most countries allow international students to work part-time. The UK permits 20 hours/week during term and full-time during holidays. Canada allows 20 hours/week. Australia allows 48 hours per fortnight. New Zealand and Ireland have similar provisions. We guide you on work rights for your destination.',
      sortOrder: 6,
      status: 'active',
    },
    {
      question: 'What are the intakes for studying abroad?',
      answer: 'Intake periods vary by country. The UK, Canada, and Ireland have September, January, and May/February intakes. The USA has August, January, and May intakes. Australia has February, July, and November intakes. New Zealand has February and July intakes. Germany has October and April intakes.',
      sortOrder: 7,
      status: 'active',
    },
    {
      question: 'How long does the visa process take?',
      answer: 'Visa processing times vary: UK Student Visa takes 3-6 weeks, US F-1 Visa takes 2-8 weeks (including interview), Canadian Study Permit takes 4-8 weeks, Australian Student Visa takes 4-6 weeks, and Irish Stamp 2 takes 4-8 weeks. We start visa preparation early to ensure timely submission.',
      sortOrder: 8,
      status: 'active',
    },
    {
      question: 'Does ALO Education help with scholarships?',
      answer: 'Yes! Our scholarship guidance service helps you identify and apply for university-specific scholarships, government grants, and bursaries. We maintain an updated database of scholarship opportunities and our success rate for scholarship applications is above 70%.',
      sortOrder: 9,
      status: 'active',
    },
    {
      question: 'What is AI Course Matching?',
      answer: 'Our AI Course Matching system analyzes your academic profile, interests, budget, and career goals to recommend the most suitable courses and universities. It scans hundreds of programs across multiple countries to find your best-fit options, saving you hours of research.',
      sortOrder: 10,
      status: 'active',
    },
    {
      question: 'Is ALO Education\'s consultation free?',
      answer: 'Yes, your initial consultation with ALO Education is completely free. During this session, our expert counselors will assess your profile, discuss your goals, and outline a personalized study abroad plan. We believe everyone deserves access to quality education guidance.',
      sortOrder: 11,
      status: 'active',
    },
    {
      question: 'What documents do I need to apply to universities?',
      answer: 'Commonly required documents include: academic transcripts, passport copy, CV/resume, Statement of Purpose (SOP), Letters of Recommendation, English proficiency test scores (IELTS/PTE/TOEFL), and financial documents. Specific requirements vary by university and country.',
      sortOrder: 12,
      status: 'active',
    },
    {
      question: 'Can I apply to multiple countries simultaneously?',
      answer: 'Yes, you can apply to universities in multiple countries at the same time. Many students apply to 3-5 universities across different destinations to maximize their chances. Our counselors help you create a balanced application strategy.',
      sortOrder: 13,
      status: 'active',
    },
    {
      question: 'What happens after I receive an offer letter?',
      answer: 'After receiving an offer, we help you evaluate it, accept the offer, arrange deposit payments if required, begin visa preparation, arrange accommodation, and prepare for departure. Our team supports you through every step until you\'re settled in your destination.',
      sortOrder: 14,
      status: 'active',
    },
    {
      question: 'Do you help with accommodation?',
      answer: 'Yes, we assist with finding suitable accommodation — both on-campus university housing and private off-campus options. We guide you through booking procedures, deposits, and what to expect in terms of living arrangements in your destination city.',
      sortOrder: 15,
      status: 'active',
    },
    {
      question: 'What is a Medium of Instruction (MOI) letter?',
      answer: 'An MOI letter is an official document from your previous institution confirming that your degree was taught entirely in English. Some universities accept this as proof of English proficiency instead of IELTS or other test scores. We can guide you on whether this option is available for your target universities.',
      sortOrder: 16,
      status: 'active',
    },
    {
      question: 'How do I prepare for a student visa interview?',
      answer: 'Our interview preparation service includes mock interviews, common question practice, document review, and personalized tips. We simulate real interview conditions to help you build confidence and effectively communicate your study plans and financial readiness.',
      sortOrder: 17,
      status: 'active',
    },
    {
      question: 'What is post-study work rights?',
      answer: 'Post-study work rights allow you to stay and work in your study destination after completing your degree. The UK offers a 2-year Graduate Route visa (3 years for PhD). Canada offers up to 3-year PGWP. Australia provides 2-6 years depending on degree level. Ireland offers 1-3 year Stay Back Visa.',
      sortOrder: 18,
      status: 'active',
    },
    {
      question: 'Can I bring my family while studying abroad?',
      answer: 'This depends on the country. The UK allows dependents for postgraduate students on courses longer than 9 months. Australia allows dependents for masters and PhD students. Canada generally allows dependents to accompany you. The USA allows F-2 visas for spouses and children. We provide detailed guidance on family visa options.',
      sortOrder: 19,
      status: 'active',
    },
    {
      question: 'How do I get started with ALO Education?',
      answer: 'Getting started is easy! Simply fill out our inquiry form on the website, call us, or visit our office. Our team will schedule a free consultation session where we assess your profile, discuss your aspirations, and create a personalized roadmap for your study abroad journey.',
      sortOrder: 20,
      status: 'active',
    },
  ]

  const faqCount = await seedMany(db.homepageFaq, faqs, 'faqs')
  console.log(`    ✓ ${faqCount} FAQs seeded`)

  // ── 7. Home Sections ───────────────────────────────────────────
  console.log('  📋 Seeding Home Sections...')

  const homeSections = [
    {
      sectionKey: 'hero',
      title: 'Your Journey to World-Class Education Starts Here',
      subtitle: 'Trusted by thousands of Bangladeshi students to find the right university, course, and career path abroad.',
      content: '',
      sortOrder: 1,
      status: 'active',
    },
    {
      sectionKey: 'course_finder',
      title: 'Find Your Perfect Course',
      subtitle: 'Use our AI-powered course finder to discover programs matched to your profile, budget, and career goals.',
      content: '',
      sortOrder: 2,
      status: 'active',
    },
    {
      sectionKey: 'destinations',
      title: 'Popular Study Destinations',
      subtitle: 'Explore top destinations trusted by Bangladeshi students for quality education and career growth.',
      content: '',
      sortOrder: 3,
      status: 'active',
    },
    {
      sectionKey: 'services',
      title: 'Our Services',
      subtitle: 'From initial counseling to post-arrival support — we are with you every step of the way.',
      content: '',
      sortOrder: 4,
      status: 'active',
    },
    {
      sectionKey: 'why_choose_us',
      title: 'Why Choose ALO Education?',
      subtitle: 'We are Bangladesh\'s most trusted study abroad consultancy with a student-first approach.',
      content: '',
      sortOrder: 5,
      status: 'active',
    },
    {
      sectionKey: 'success_stories',
      title: 'Student Success Stories',
      subtitle: 'Hear from students who achieved their study abroad dreams with ALO Education.',
      content: '',
      sortOrder: 6,
      status: 'active',
    },
    {
      sectionKey: 'english_tests',
      title: 'Accepted English Tests',
      subtitle: 'We guide you through all major English proficiency tests accepted worldwide.',
      content: '',
      sortOrder: 7,
      status: 'active',
    },
    {
      sectionKey: 'team',
      title: 'Meet Our Team',
      subtitle: 'Our experienced counselors and specialists are here to guide your journey.',
      content: '',
      sortOrder: 8,
      status: 'active',
    },
    {
      sectionKey: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions about studying abroad with ALO Education.',
      content: '',
      sortOrder: 9,
      status: 'active',
    },
    {
      sectionKey: 'cta',
      title: 'Ready to Start Your Study Abroad Journey?',
      subtitle: 'Book a free consultation with our expert counselors today.',
      content: '',
      sortOrder: 10,
      status: 'active',
    },
  ]

  const sectionCount = await seedMany(db.homeSection, homeSections, 'home sections')
  console.log(`    ✓ ${sectionCount} home sections seeded`)

  console.log('\n✅ Homepage data seeded successfully!')
  console.log(`   Countries: ${countries.length}`)
  console.log(`   English Tests: ${englishTests.length}`)
  console.log(`   Services: ${services.length}`)
  console.log(`   Success Stories: ${successStories.length}`)
  console.log(`   Team Members: ${teamMembers.length}`)
  console.log(`   FAQs: ${faqs.length}`)
  console.log(`   Home Sections: ${homeSections.length}`)
}

seed()
  .then(() => {
    console.log('\n🌱 Seed complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
