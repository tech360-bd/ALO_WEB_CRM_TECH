import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding website data (Countries, English Tests, Services, Team, FAQs, Stories)...\n');

  // ────────────────────────────────────────────
  // 1. COUNTRIES (8)
  // ────────────────────────────────────────────
  console.log('  📍 Seeding Countries...');
  await db.country.deleteMany();

  const countries = [
    {
      name: 'United Kingdom',
      slug: 'united-kingdom',
      code: 'GB',
      flag: '🇬🇧',
      status: 'active',
      sortOrder: 1,
      accentColor: '#0B5ED7',
      popularCities: JSON.stringify(['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool']),
      popularIntakes: JSON.stringify(['September 2026', 'January 2027', 'May 2027']),
      studyLevels: JSON.stringify(['Foundation', 'Bachelors', 'Masters', 'MRes', 'PhD']),
      universityCount: 162,
      courseCount: 3847,
      scholarshipCount: 284,
      visaType: 'Student Visa',
      description:
        'World-class universities, rich cultural heritage, and post-study work opportunities. The UK remains a top choice for Bangladeshi students seeking quality education.',
      heroCity: 'London',
      heroIntake: 'September 2026',
      heroSubtitle: 'World-class education in the heart of Europe',
    },
    {
      name: 'Canada',
      slug: 'canada',
      code: 'CA',
      flag: '🇨🇦',
      status: 'active',
      sortOrder: 2,
      accentColor: '#FF0000',
      popularCities: JSON.stringify(['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa']),
      popularIntakes: JSON.stringify(['September 2026', 'January 2027', 'May 2027']),
      studyLevels: JSON.stringify(['Diploma', 'Bachelors', 'Masters', 'PhD']),
      universityCount: 98,
      courseCount: 2156,
      scholarshipCount: 156,
      visaType: 'Study Permit',
      description:
        'Quality education with pathways to permanent residency. Canada offers a welcoming multicultural environment and excellent post-graduation work opportunities.',
      heroCity: 'Toronto',
      heroIntake: 'September 2026',
      heroSubtitle: 'Quality education with pathways to permanent residency',
    },
    {
      name: 'Australia',
      slug: 'australia',
      code: 'AU',
      flag: '🇦🇺',
      status: 'active',
      sortOrder: 3,
      accentColor: '#00008B',
      popularCities: JSON.stringify(['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']),
      popularIntakes: JSON.stringify(['February 2027', 'July 2027', 'November 2026']),
      studyLevels: JSON.stringify(['Foundation', 'Diploma', 'Bachelors', 'Masters', 'PhD']),
      universityCount: 43,
      courseCount: 1834,
      scholarshipCount: 112,
      visaType: 'Subclass 500',
      description:
        'Sunshine, quality education and vibrant student life. Australia is known for its world-leading research institutions and high standard of living.',
      heroCity: 'Sydney',
      heroIntake: 'February 2027',
      heroSubtitle: 'Sunshine, quality education and vibrant student life',
    },
    {
      name: 'USA',
      slug: 'usa',
      code: 'US',
      flag: '🇺🇸',
      status: 'active',
      sortOrder: 4,
      accentColor: '#3C3B6E',
      popularCities: JSON.stringify(['New York', 'California', 'Texas', 'Boston', 'Illinois']),
      popularIntakes: JSON.stringify(['Fall 2026', 'Spring 2027', 'Summer 2027']),
      studyLevels: JSON.stringify(['Bachelors', 'Masters', 'PhD']),
      universityCount: 78,
      courseCount: 1654,
      scholarshipCount: 198,
      visaType: 'F-1 Student Visa',
      description:
        'Diverse programs at world-renowned universities. The USA offers unmatched academic flexibility, cutting-edge research facilities, and a global alumni network.',
      heroCity: 'New York',
      heroIntake: 'Fall 2026',
      heroSubtitle: 'Diverse programs at world-renowned universities',
    },
    {
      name: 'Ireland',
      slug: 'ireland',
      code: 'IE',
      flag: '🇮🇪',
      status: 'active',
      sortOrder: 5,
      accentColor: '#169B62',
      popularCities: JSON.stringify(['Dublin', 'Cork', 'Galway', 'Limerick']),
      popularIntakes: JSON.stringify(['September 2026', 'January 2027']),
      studyLevels: JSON.stringify(['Bachelors', 'Masters', 'PhD']),
      universityCount: 24,
      courseCount: 567,
      scholarshipCount: 45,
      visaType: 'Stamp 2',
      description:
        'Tech hub of Europe with post-study work rights. Ireland offers a booming tech industry, English-speaking environment, and generous stay-back options.',
      heroCity: 'Dublin',
      heroIntake: 'September 2026',
      heroSubtitle: 'Tech hub of Europe with post-study work rights',
    },
    {
      name: 'New Zealand',
      slug: 'new-zealand',
      code: 'NZ',
      flag: '🇳🇿',
      status: 'active',
      sortOrder: 6,
      accentColor: '#00247D',
      popularCities: JSON.stringify(['Auckland', 'Wellington', 'Christchurch', 'Hamilton']),
      popularIntakes: JSON.stringify(['February 2027', 'July 2027']),
      studyLevels: JSON.stringify(['Foundation', 'Diploma', 'Bachelors', 'Masters', 'PhD']),
      universityCount: 18,
      courseCount: 423,
      scholarshipCount: 34,
      visaType: 'Student Visa',
      description:
        'Safe, welcoming and excellent work opportunities. New Zealand is known for its high-quality education system, stunning landscapes, and friendly locals.',
      heroCity: 'Auckland',
      heroIntake: 'February 2027',
      heroSubtitle: 'Safe, welcoming and excellent work opportunities',
    },
    {
      name: 'Dubai/UAE',
      slug: 'dubai-uae',
      code: 'AE',
      flag: '🇦🇪',
      status: 'active',
      sortOrder: 7,
      accentColor: '#009639',
      popularCities: JSON.stringify(['Dubai', 'Abu Dhabi', 'Sharjah']),
      popularIntakes: JSON.stringify(['September 2026', 'January 2027', 'April 2027']),
      studyLevels: JSON.stringify(['Bachelors', 'Masters', 'MBA']),
      universityCount: 32,
      courseCount: 445,
      scholarshipCount: 28,
      visaType: 'Student Visa',
      description:
        'Modern education in a global business hub. Dubai offers tax-free income, world-class infrastructure, and international branch campuses of top universities.',
      heroCity: 'Dubai',
      heroIntake: 'September 2026',
      heroSubtitle: 'Modern education in a global business hub',
    },
  ];

  await db.country.createMany({ data: countries });
  console.log(`     ✅ ${countries.length} countries seeded.\n`);

  // ────────────────────────────────────────────
  // 2. WEBSITE ENGLISH TESTS (17)
  // ────────────────────────────────────────────
  console.log('  📝 Seeding Website English Tests...');
  await db.websiteEnglishTest.deleteMany();

  const englishTests = [
    {
      name: 'IELTS',
      slug: 'ielts',
      shortDescription:
        'The International English Language Testing System is the most widely accepted English proficiency test for study abroad.',
      bestFor: 'UK, Australia, Canada, Ireland, New Zealand admissions',
      acceptedDest: JSON.stringify(['UK', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA']),
      resultTime: '3–5 days (computer) / 13 days (paper)',
      scoreRange: '0–9.0 (band scale)',
      format: 'Listening, Reading, Writing, Speaking',
      status: 'active',
      sortOrder: 1,
    },
    {
      name: 'IELTS UKVI',
      slug: 'ielts-ukvi',
      shortDescription:
        'UK Visas and Immigration approved version of IELTS, required for Tier 4 student visa applications to the UK.',
      bestFor: 'UK Student Visa applications',
      acceptedDest: JSON.stringify(['UK']),
      resultTime: '3–5 days (computer) / 13 days (paper)',
      scoreRange: '0–9.0 (band scale)',
      format: 'Listening, Reading, Writing, Speaking',
      status: 'active',
      sortOrder: 2,
    },
    {
      name: 'PTE Academic',
      slug: 'pte-academic',
      shortDescription:
        'Pearson Test of English — a computer-based English test accepted by thousands of universities worldwide with fast results.',
      bestFor: 'Australia, UK, Canada, USA admissions',
      acceptedDest: JSON.stringify(['Australia', 'UK', 'Canada', 'USA', 'New Zealand']),
      resultTime: '1–2 business days',
      scoreRange: '10–90 (score scale)',
      format: 'Speaking & Writing, Reading, Listening',
      status: 'active',
      sortOrder: 3,
    },
    {
      name: 'TOEFL iBT',
      slug: 'toefl-ibt',
      shortDescription:
        'Test of English as a Foreign Language (Internet-Based Test) — the preferred English test for US university admissions.',
      bestFor: 'USA admissions, also accepted globally',
      acceptedDest: JSON.stringify(['USA', 'Canada', 'UK', 'Australia', 'Germany']),
      resultTime: '3–8 days',
      scoreRange: '0–120 (score scale)',
      format: 'Reading, Listening, Speaking, Writing',
      status: 'active',
      sortOrder: 4,
    },
    {
      name: 'Duolingo English Test',
      slug: 'duolingo-english-test',
      shortDescription:
        'An affordable, convenient online English proficiency test that can be taken from home in under an hour.',
      bestFor: 'Budget-conscious students, fast admissions',
      acceptedDest: JSON.stringify(['USA', 'Canada', 'UK', 'Australia', 'Ireland']),
      resultTime: '48 hours',
      scoreRange: '10–160 (score scale)',
      format: 'Adaptive computer test (Reading, Listening, Writing, Speaking, Video Interview)',
      status: 'active',
      sortOrder: 5,
    },
    {
      name: 'OIETC/ELLT',
      slug: 'oietc-ellt',
      shortDescription:
        'Online International English Language Testing Consortium — an online English test accepted by UK and partner universities.',
      bestFor: 'UK university admissions (alternative to IELTS)',
      acceptedDest: JSON.stringify(['UK']),
      resultTime: '3–5 business days',
      scoreRange: 'B2–C2 (CEFR levels)',
      format: 'Listening, Reading, Writing, Speaking (online proctored)',
      status: 'active',
      sortOrder: 6,
    },
    {
      name: 'Oxford ELLT',
      slug: 'oxford-ellt',
      shortDescription:
        'Oxford English Language Level Test — an online English test developed by Oxford University Press for university admissions.',
      bestFor: 'UK university admissions, fast results',
      acceptedDest: JSON.stringify(['UK']),
      resultTime: '2–3 business days',
      scoreRange: 'B2–C2 (CEFR levels)',
      format: 'Reading, Listening, Writing, Speaking (online)',
      status: 'active',
      sortOrder: 7,
    },
    {
      name: 'LanguageCert',
      slug: 'languagecert',
      shortDescription:
        'LanguageCert International English tests offer flexible, high-stakes English exams recognized by universities and governments.',
      bestFor: 'UK admissions and visa, Malta, Greece',
      acceptedDest: JSON.stringify(['UK', 'Malta', 'Greece']),
      resultTime: '3–10 business days',
      scoreRange: 'B1–C2 (CEFR levels)',
      format: 'Written exam + Spoken exam (separate sessions)',
      status: 'active',
      sortOrder: 8,
    },
    {
      name: 'Kaplan English Test',
      slug: 'kaplan-english-test',
      shortDescription:
        'Kaplan International English Test — an online English proficiency assessment accepted by select UK universities.',
      bestFor: 'UK university admissions via Kaplan pathways',
      acceptedDest: JSON.stringify(['UK']),
      resultTime: '5–7 business days',
      scoreRange: 'B2–C2 (CEFR levels)',
      format: 'Online assessment (Reading, Writing, Listening, Speaking)',
      status: 'active',
      sortOrder: 9,
    },
    {
      name: 'OET',
      slug: 'oet',
      shortDescription:
        'Occupational English Test — an English language test for healthcare professionals who want to work or study in English-speaking countries.',
      bestFor: 'Healthcare professionals (nurses, doctors)',
      acceptedDest: JSON.stringify(['UK', 'Australia', 'New Zealand', 'Ireland', 'USA']),
      resultTime: '10–15 business days',
      scoreRange: 'A–E grades per sub-test',
      format: 'Listening, Reading, Writing, Speaking (profession-specific)',
      status: 'active',
      sortOrder: 10,
    },
    {
      name: 'GRE',
      slug: 'gre',
      shortDescription:
        'Graduate Record Examination — a standardized test required for admission to many graduate programs, especially in the USA.',
      bestFor: 'MS and PhD admissions in USA and global graduate programs',
      acceptedDest: JSON.stringify(['USA', 'Canada', 'UK', 'Germany']),
      resultTime: '8–10 days',
      scoreRange: '130–170 (Verbal & Quant) / 0–6 (AW)',
      format: 'Analytical Writing, Verbal Reasoning, Quantitative Reasoning',
      status: 'active',
      sortOrder: 11,
    },
    {
      name: 'GMAT',
      slug: 'gmat',
      shortDescription:
        'Graduate Management Admission Test — the leading entrance exam for MBA and business school programs worldwide.',
      bestFor: 'MBA and business school admissions',
      acceptedDest: JSON.stringify(['USA', 'UK', 'Canada', 'Australia', 'Singapore']),
      resultTime: '7 business days (official)',
      scoreRange: '200–800 (total score)',
      format: 'Quantitative, Verbal, Integrated Reasoning, Analytical Writing',
      status: 'active',
      sortOrder: 12,
    },
    {
      name: 'SAT',
      slug: 'sat',
      shortDescription:
        'Scholastic Assessment Test — a standardized test widely used for undergraduate college admissions in the United States.',
      bestFor: 'Undergraduate admissions in USA',
      acceptedDest: JSON.stringify(['USA']),
      resultTime: '2–4 weeks',
      scoreRange: '400–1600 (total score)',
      format: 'Reading & Writing, Mathematics',
      status: 'active',
      sortOrder: 13,
    },
    {
      name: 'ACT',
      slug: 'act',
      shortDescription:
        'American College Testing — a standardized test for undergraduate admissions in the USA, covering English, Math, Reading, and Science.',
      bestFor: 'Undergraduate admissions in USA',
      acceptedDest: JSON.stringify(['USA']),
      resultTime: '2–8 weeks',
      scoreRange: '1–36 (composite score)',
      format: 'English, Mathematics, Reading, Science, optional Writing',
      status: 'active',
      sortOrder: 14,
    },
    {
      name: 'MOI Guidance',
      slug: 'moi-guidance',
      shortDescription:
        'Medium of Instruction guidance for students who completed their previous education in English and may qualify for IELTS waivers.',
      bestFor: 'Students seeking English test waivers',
      acceptedDest: JSON.stringify(['UK', 'Canada', 'Australia', 'New Zealand', 'Ireland', 'Malaysia']),
      resultTime: 'N/A (document-based)',
      scoreRange: 'N/A',
      format: 'University letter confirming English was medium of instruction',
      status: 'active',
      sortOrder: 15,
    },
    {
      name: 'English Test Comparison',
      slug: 'english-test-comparison',
      shortDescription:
        'A comprehensive comparison guide to help students choose the right English proficiency test based on their target country and program.',
      bestFor: 'Students deciding which test to take',
      acceptedDest: JSON.stringify(['UK', 'USA', 'Canada', 'Australia', 'Ireland', 'New Zealand']),
      resultTime: 'N/A (informational)',
      scoreRange: 'N/A',
      format: 'Comparison chart and detailed guide',
      status: 'active',
      sortOrder: 16,
    },
    {
      name: 'Free English Placement Test',
      slug: 'free-english-placement-test',
      shortDescription:
        'ALO Education free online English placement test to assess your current English level and get personalized preparation recommendations.',
      bestFor: 'Students unsure of their English level',
      acceptedDest: JSON.stringify(['UK', 'USA', 'Canada', 'Australia', 'Ireland', 'New Zealand']),
      resultTime: 'Instant',
      scoreRange: 'CEFR A1–C2',
      format: 'Online adaptive test (30 minutes)',
      status: 'active',
      sortOrder: 17,
    },
  ];

  await db.websiteEnglishTest.createMany({ data: englishTests });
  console.log(`     ✅ ${englishTests.length} english tests seeded.\n`);

  // ────────────────────────────────────────────
  // 3. HOME SERVICES (15)
  // ────────────────────────────────────────────
  console.log('  🛠️  Seeding Home Services...');
  await db.homeService.deleteMany();

  const services = [
    {
      title: 'Personalized Counseling',
      slug: 'personalized-counseling',
      icon: 'MessageCircle',
      description:
        'One-on-one sessions with experienced counselors to understand your goals, preferences, and create a tailored study abroad plan.',
      ctaLabel: 'Book Free Consultation',
      ctaUrl: '/contact',
      sortOrder: 1,
      status: 'active',
    },
    {
      title: 'University Selection',
      slug: 'university-selection',
      icon: 'GraduationCap',
      description:
        'Expert guidance to find the best-fit universities based on your academic profile, budget, career goals, and preferred destination.',
      ctaLabel: 'Find Universities',
      ctaUrl: '/course-finder',
      sortOrder: 2,
      status: 'active',
    },
    {
      title: 'Course Matching',
      slug: 'course-matching',
      icon: 'BookOpen',
      description:
        'AI-powered and expert-verified course recommendations matched to your academic background, interests, and career aspirations.',
      ctaLabel: 'Match Courses',
      ctaUrl: '/course-finder',
      sortOrder: 3,
      status: 'active',
    },
    {
      title: 'Application Assistance',
      slug: 'application-assistance',
      icon: 'FileText',
      description:
        'End-to-end support with university applications including form filling, document compilation, submission tracking, and offer management.',
      ctaLabel: 'Start Application',
      ctaUrl: '/contact',
      sortOrder: 4,
      status: 'active',
    },
    {
      title: 'SOP and CV Support',
      slug: 'sop-cv-support',
      icon: 'PenTool',
      description:
        'Professional help crafting compelling Statements of Purpose and CVs that highlight your strengths and impress admissions committees.',
      ctaLabel: 'Get SOP Help',
      ctaUrl: '/contact',
      sortOrder: 5,
      status: 'active',
    },
    {
      title: 'Document Checking',
      slug: 'document-checking',
      icon: 'ClipboardCheck',
      description:
        'Thorough review of all your application documents to ensure accuracy, completeness, and compliance with university requirements.',
      ctaLabel: 'Check Documents',
      ctaUrl: '/contact',
      sortOrder: 6,
      status: 'active',
    },
    {
      title: 'Visa Guidance',
      slug: 'visa-guidance',
      icon: 'Plane',
      description:
        'Step-by-step visa application support including document preparation, mock interviews, and submission guidance for your target country.',
      ctaLabel: 'Visa Support',
      ctaUrl: '/contact',
      sortOrder: 7,
      status: 'active',
    },
    {
      title: 'Interview Preparation',
      slug: 'interview-preparation',
      icon: 'Mic',
      description:
        'Mock interviews and coaching for university admissions interviews and visa interviews to build your confidence and communication skills.',
      ctaLabel: 'Prepare Now',
      ctaUrl: '/contact',
      sortOrder: 8,
      status: 'active',
    },
    {
      title: 'English Test Preparation',
      slug: 'english-test-preparation',
      icon: 'Languages',
      description:
        'Comprehensive preparation programs for IELTS, PTE, TOEFL, and Duolingo with expert instructors, practice materials, and mock tests.',
      ctaLabel: 'Prepare for Tests',
      ctaUrl: '/english-tests',
      sortOrder: 9,
      status: 'active',
    },
    {
      title: 'Financial Planning',
      slug: 'financial-planning',
      icon: 'Wallet',
      description:
        'Guidance on tuition costs, living expenses, scholarship opportunities, bank loans, and proof-of-funds documentation for visa applications.',
      ctaLabel: 'Plan Finances',
      ctaUrl: '/contact',
      sortOrder: 10,
      status: 'active',
    },
    {
      title: 'Scholarship Guidance',
      slug: 'scholarship-guidance',
      icon: 'Award',
      description:
        'Identification and application support for scholarships, grants, and bursaries to reduce the financial burden of studying abroad.',
      ctaLabel: 'Find Scholarships',
      ctaUrl: '/scholarships',
      sortOrder: 11,
      status: 'active',
    },
    {
      title: 'Pre-Departure Orientation',
      slug: 'pre-departure-orientation',
      icon: 'Luggage',
      description:
        'Comprehensive pre-departure briefings covering accommodation, banking, healthcare, cultural tips, and what to expect in your new country.',
      ctaLabel: 'Join Orientation',
      ctaUrl: '/contact',
      sortOrder: 12,
      status: 'active',
    },
    {
      title: 'Post-Arrival Support',
      slug: 'post-arrival-support',
      icon: 'MapPin',
      description:
        'On-the-ground assistance in your destination country including airport pickup, accommodation setup, and settling-in support.',
      ctaLabel: 'Get Support',
      ctaUrl: '/contact',
      sortOrder: 13,
      status: 'active',
    },
    {
      title: 'Career Counseling',
      slug: 'career-counseling',
      icon: 'Briefcase',
      description:
        'Professional career advice to help you choose the right course and university that aligns with your long-term career goals and industry demand.',
      ctaLabel: 'Career Advice',
      ctaUrl: '/contact',
      sortOrder: 14,
      status: 'active',
    },
    {
      title: 'Ongoing Mentorship',
      slug: 'ongoing-mentorship',
      icon: 'Users',
      description:
        'Continuous support and mentorship throughout your study abroad journey — from application to graduation and beyond.',
      ctaLabel: 'Connect with Mentor',
      ctaUrl: '/contact',
      sortOrder: 15,
      status: 'active',
    },
  ];

  await db.homeService.createMany({ data: services });
  console.log(`     ✅ ${services.length} services seeded.\n`);

  // ────────────────────────────────────────────
  // 4. TEAM MEMBERS (6)
  // ────────────────────────────────────────────
  console.log('  👥 Seeding Team Members...');
  await db.teamMember.deleteMany();

  const teamMembers = [
    {
      name: 'Taslima Akter',
      role: 'Founder & CEO',
      specialty: 'Strategic Leadership & International Education',
      bio: 'Leading ALO Education\'s mission to make quality global education accessible to Bangladeshi students. With over 18 years in the international education sector, Taslima has helped thousands of students achieve their study abroad dreams.',
      sortOrder: 1,
      status: 'active',
    },
    {
      name: 'Md. Rafiqul Islam',
      role: 'Head of Admissions',
      specialty: 'University Admissions & Placement',
      bio: 'Over 15 years experience in international student admissions across UK, USA, Canada and Australia. Rafiq has built strong relationships with top universities worldwide.',
      sortOrder: 2,
      status: 'active',
    },
    {
      name: 'Farzana Rahman',
      role: 'Senior Visa Officer',
      specialty: 'Student Visa & Immigration',
      bio: 'Specialized in UK, Canada and Australia student visa applications with deep immigration knowledge. Farzana maintains a 98% visa approval rate across all applications.',
      sortOrder: 3,
      status: 'active',
    },
    {
      name: 'Shakib Ahmed',
      role: 'Career Counselor',
      specialty: 'Career Planning & University Matching',
      bio: 'Helping students identify the right career paths and university programs since 2018. Shakib combines data-driven insights with personalized counseling.',
      sortOrder: 4,
      status: 'active',
    },
    {
      name: 'Nadia Islam',
      role: 'English Test Instructor',
      specialty: 'IELTS, PTE & English Language Training',
      bio: 'Certified IELTS and PTE trainer with 10+ years of teaching experience. Nadia has helped hundreds of students achieve target scores for top university admissions.',
      sortOrder: 5,
      status: 'active',
    },
    {
      name: 'Tanvir Hasan',
      role: 'Application Officer',
      specialty: 'Application Processing & Documentation',
      bio: 'Managing end-to-end application processes for 500+ students annually. Tanvir ensures every application is complete, accurate, and submitted on time.',
      sortOrder: 6,
      status: 'active',
    },
  ];

  await db.teamMember.createMany({ data: teamMembers });
  console.log(`     ✅ ${teamMembers.length} team members seeded.\n`);

  // ────────────────────────────────────────────
  // 5. HOMEPAGE FAQs (20)
  // ────────────────────────────────────────────
  console.log('  ❓ Seeding Homepage FAQs...');
  await db.homepageFaq.deleteMany();

  const faqs = [
    {
      question: 'How do I start my study abroad application?',
      answer:
        'Simply book a free consultation with ALO Education. Our counselor will assess your profile, discuss your goals, and create a personalized plan. You can reach us via phone, WhatsApp, or our online booking form.',
      sortOrder: 1,
      status: 'active',
    },
    {
      question: 'Which countries does ALO support?',
      answer:
        'We support students for UK, USA, Canada, Australia, Ireland, New Zealand, Dubai and several other destinations. Our team has expertise across all major study abroad markets.',
      sortOrder: 2,
      status: 'active',
    },
    {
      question: 'Can ALO help me choose a course?',
      answer:
        'Yes! Our expert counselors use AI-powered tools and their deep knowledge of global universities to match you with courses that fit your academic background, career goals, and budget.',
      sortOrder: 3,
      status: 'active',
    },
    {
      question: 'What English tests do I need for studying abroad?',
      answer:
        'The required test depends on your destination and program. Popular tests include IELTS, PTE Academic, TOEFL iBT, and Duolingo. We can also help with MOI-based waivers and university-specific tests like OIETC/ELLT.',
      sortOrder: 4,
      status: 'active',
    },
    {
      question: 'How much does it cost to use ALO Education services?',
      answer:
        'Our initial consultation is completely free. We charge a service fee only after you confirm your application with us. The fee varies based on the number of universities and destinations you apply to.',
      sortOrder: 5,
      status: 'active',
    },
    {
      question: 'Does ALO help with visa applications?',
      answer:
        'Yes, we provide comprehensive visa guidance including document preparation, mock interviews, and step-by-step submission support. Our visa officers specialize in UK, Canada, Australia, USA, and other destinations.',
      sortOrder: 6,
      status: 'active',
    },
    {
      question: 'Can I get a scholarship through ALO Education?',
      answer:
        'We actively identify scholarship opportunities for our students and assist with scholarship applications. Many of our students have received partial and full scholarships from partner universities.',
      sortOrder: 7,
      status: 'active',
    },
    {
      question: 'What is the typical timeline for a study abroad application?',
      answer:
        'The process usually takes 6–12 months from initial consultation to departure. We recommend starting at least 8–10 months before your intended intake to allow sufficient time for applications and visa processing.',
      sortOrder: 8,
      status: 'active',
    },
    {
      question: 'Does ALO provide IELTS preparation?',
      answer:
        'Yes! We offer comprehensive IELTS preparation programs with certified instructors, practice materials, mock tests, and personalized feedback. We also prepare students for PTE, TOEFL, and Duolingo tests.',
      sortOrder: 9,
      status: 'active',
    },
    {
      question: 'What support does ALO provide after I arrive at my destination?',
      answer:
        'We offer post-arrival support including airport pickup coordination, accommodation assistance, opening a bank account, registering with local authorities, and connecting you with our alumni community.',
      sortOrder: 10,
      status: 'active',
    },
    {
      question: 'Can I apply to universities in multiple countries simultaneously?',
      answer:
        'Absolutely! Many of our students apply to multiple countries to maximize their chances. Our counselors can help you manage parallel applications efficiently.',
      sortOrder: 11,
      status: 'active',
    },
    {
      question: 'What documents do I need to apply to universities abroad?',
      answer:
        'Typical documents include academic transcripts, certificates, passport copy, English test scores, SOP, CV, letters of recommendation, and sometimes a portfolio. Our team provides a detailed checklist for each application.',
      sortOrder: 12,
      status: 'active',
    },
    {
      question: 'How does ALO match me with the right university?',
      answer:
        'We use a combination of AI-powered course matching, our extensive university database, and expert counselor knowledge to find universities that match your academic profile, budget, location preferences, and career goals.',
      sortOrder: 13,
      status: 'active',
    },
    {
      question: 'Can ALO help if my visa gets rejected?',
      answer:
        'Yes, our experienced visa officers can help analyze rejection reasons, address concerns, prepare stronger applications for re-submission, and guide you through the appeals process if applicable.',
      sortOrder: 14,
      status: 'active',
    },
    {
      question: 'Are ALO Education services available outside Dhaka?',
      answer:
        'Yes! While our main office is in Dhaka, we serve students across Bangladesh through online consultations, phone support, and our digital platform. We also conduct periodic seminars in major cities.',
      sortOrder: 15,
      status: 'active',
    },
    {
      question: 'What is the success rate of ALO Education students?',
      answer:
        'We have a 95%+ university offer rate and 98% visa approval rate. Over 2,000 students have successfully gone abroad with ALO Education assistance in the past 5 years.',
      sortOrder: 16,
      status: 'active',
    },
    {
      question: 'Does ALO help with part-time job opportunities while studying?',
      answer:
        'Yes, we provide guidance on part-time work rights, job search strategies, and connecting with student communities that share job opportunities in your study destination.',
      sortOrder: 17,
      status: 'active',
    },
    {
      question: 'Can I get admission without IELTS?',
      answer:
        'Many universities accept alternative English tests like PTE, TOEFL, Duolingo, or MOI-based waivers. Some universities also offer pre-sessional English courses. Our counselors can find the best option for your situation.',
      sortOrder: 18,
      status: 'active',
    },
    {
      question: 'How do I track my application progress?',
      answer:
        'Through our student portal, you can track every stage of your application in real-time — from university submission to offer letters, visa processing, and pre-departure preparations.',
      sortOrder: 19,
      status: 'active',
    },
    {
      question: 'Does ALO Education offer services for Masters and PhD applications?',
      answer:
        'Yes, we specialize in all study levels from Foundation and Diploma to Bachelors, Masters, and PhD. Our team includes specialists for postgraduate and research applications.',
      sortOrder: 20,
      status: 'active',
    },
  ];

  await db.homepageFaq.createMany({ data: faqs });
  console.log(`     ✅ ${faqs.length} FAQs seeded.\n`);

  // ────────────────────────────────────────────
  // 6. SUCCESS STORIES (4)
  // ────────────────────────────────────────────
  console.log('  🎓 Seeding Success Stories...');
  await db.successStory.deleteMany();

  const stories = [
    {
      studentName: 'Rahim Uddin',
      homeDistrict: 'Dhaka',
      countryId: 'united-kingdom',
      university: 'University of Manchester',
      course: 'MSc Data Science',
      outcome: 'Received offer with scholarship',
      testimonial:
        'ALO made my dream of studying in the UK a reality. Their guidance from IELTS preparation to visa was exceptional. I received a partial scholarship that significantly reduced my tuition costs.',
      consentStatus: 'verified',
      status: 'published',
    },
    {
      studentName: 'Fatima Akhter',
      homeDistrict: 'Chittagong',
      countryId: 'canada',
      university: 'University of Toronto',
      course: 'BBA',
      outcome: 'Admitted with entrance scholarship',
      testimonial:
        'I was overwhelmed by the application process until I found ALO Education. Their counselors simplified everything and helped me secure admission with an entrance scholarship at one of Canada\'s top universities.',
      consentStatus: 'verified',
      status: 'published',
    },
    {
      studentName: 'Mehedi Hasan',
      homeDistrict: 'Sylhet',
      countryId: 'australia',
      university: 'Monash University',
      course: 'Masters of IT',
      outcome: 'Visa approved first time',
      testimonial:
        'From course selection to visa approval, ALO Education handled everything professionally. My visa was approved on the first attempt thanks to their thorough document preparation and mock interview sessions.',
      consentStatus: 'verified',
      status: 'published',
    },
    {
      studentName: 'Nusrat Jahan',
      homeDistrict: 'Rajshahi',
      countryId: 'usa',
      university: 'Arizona State University',
      course: 'MS Computer Science',
      outcome: 'Received full scholarship',
      testimonial:
        'Getting a full scholarship to study in the USA seemed impossible from Rajshahi. ALO Education believed in my potential and guided me through every step. I\'m now pursuing my dream degree at Arizona State University with full financial support.',
      consentStatus: 'verified',
      status: 'published',
    },
  ];

  await db.successStory.createMany({ data: stories });
  console.log(`     ✅ ${stories.length} success stories seeded.\n`);

  // ────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────
  console.log('════════════════════════════════════════════');
  console.log('  ✅ Website seeding complete!');
  console.log(`     Countries:      ${countries.length}`);
  console.log(`     English Tests:  ${englishTests.length}`);
  console.log(`     Services:       ${services.length}`);
  console.log(`     Team Members:   ${teamMembers.length}`);
  console.log(`     FAQs:           ${faqs.length}`);
  console.log(`     Success Stories:${stories.length}`);
  console.log('════════════════════════════════════════════');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
