import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seed() {
  console.log('Seeding homepage data...')

  // ─── HERO SLIDES ────────────────────────────────────────
  const heroSlides = [
    {
      countrySlug: 'uk',
      headline: 'Study in the United Kingdom',
      subtitle: 'World-class education at historic universities with post-study work visa. Your journey to a UK degree starts here.',
      accentColor: '#1E40AF',
      bannerImage: '/images/hero/UK slide Banner.webp',
      popularCity: 'London',
      popularIntake: 'September 2025',
      universityCountLabel: '150+ Universities',
      courseCountLabel: '12,000+ Courses',
      scholarshipLabel: '£5,000+ Scholarships',
      ctaPrimaryLabel: 'Book Free Consultation',
      ctaSecondaryLabel: 'Explore UK Courses',
      sortOrder: 0,
    },
    {
      countrySlug: 'canada',
      headline: 'Your Canadian Dream Starts Here',
      subtitle: 'Immigration-friendly policies, affordable tuition, and globally recognized degrees. Build your future in Canada.',
      accentColor: '#DC2626',
      bannerImage: '/images/hero/Canada slide Banner.webp',
      popularCity: 'Toronto',
      popularIntake: 'January 2026',
      universityCountLabel: '100+ Universities',
      courseCountLabel: '8,000+ Programs',
      scholarshipLabel: 'CAD 10,000+ Awards',
      ctaPrimaryLabel: 'Get Started',
      ctaSecondaryLabel: 'Find Canadian Courses',
      sortOrder: 1,
    },
    {
      countrySlug: 'australia',
      headline: 'Study in Australia',
      subtitle: 'Top QS-ranked universities, vibrant student cities, and excellent post-study work opportunities await you.',
      accentColor: '#F59E0B',
      bannerImage: '/images/hero/Australia slide Banner.webp',
      popularCity: 'Melbourne',
      popularIntake: 'February 2026',
      universityCountLabel: '43 Universities',
      courseCountLabel: '6,000+ Courses',
      scholarshipLabel: 'AUD 15,000+ Available',
      ctaPrimaryLabel: 'Start Your Journey',
      ctaSecondaryLabel: 'Browse Australia',
      sortOrder: 2,
    },
    {
      countrySlug: 'usa',
      headline: 'Pursue Your American Dream',
      subtitle: 'From Ivy League to state universities, the USA offers unparalleled academic excellence and career opportunities.',
      accentColor: '#1D4ED8',
      bannerImage: '/images/hero/USA slide Banner.webp',
      popularCity: 'New York',
      popularIntake: 'Fall 2025',
      universityCountLabel: '200+ Universities',
      courseCountLabel: '15,000+ Programs',
      scholarshipLabel: '$20,000+ in Aid',
      ctaPrimaryLabel: 'Apply Now',
      ctaSecondaryLabel: 'Explore USA',
      sortOrder: 3,
    },
    {
      countrySlug: 'new-zealand',
      headline: 'Discover New Zealand',
      subtitle: 'Safe, welcoming, and academically excellent. New Zealand offers a perfect balance of study and adventure.',
      accentColor: '#059669',
      bannerImage: '/images/hero/New Zealand slide Banner.webp',
      popularCity: 'Auckland',
      popularIntake: 'March 2026',
      universityCountLabel: '8 Universities',
      courseCountLabel: '1,500+ Programs',
      scholarshipLabel: 'NZD 10,000+ Scholarships',
      ctaPrimaryLabel: 'Learn More',
      ctaSecondaryLabel: 'View Programs',
      sortOrder: 4,
    },
    {
      countrySlug: 'europe',
      headline: 'Study in Europe',
      subtitle: 'Tuition-free and low-cost education in Germany, Ireland, Netherlands, and more. Experience diverse European culture.',
      accentColor: '#7C3AED',
      bannerImage: '/images/hero/Europe slide Banner.webp',
      popularCity: 'Dublin',
      popularIntake: 'September 2025',
      universityCountLabel: '500+ Institutions',
      courseCountLabel: '20,000+ Programs',
      scholarshipLabel: '€5,000+ Erasmus+ Grants',
      ctaPrimaryLabel: 'Explore Europe',
      ctaSecondaryLabel: 'Find Courses',
      sortOrder: 5,
    },
  ]

  for (const s of heroSlides) {
    await db.homeHeroSlide.upsert({ where: { id: `${s.countrySlug}-hero` }, update: s, create: { id: `${s.countrySlug}-hero`, ...s } })
  }
  console.log(`✓ Hero slides: ${heroSlides.length}`)

  // ─── COUNTRIES ────────────────────────────────────────
  const countries = [
    { slug: 'uk', name: 'United Kingdom', shortName: 'UK', flag: '🇬🇧', capital: 'London', currency: 'GBP (£)', intro: 'The UK is home to four of the world\'s top ten universities and offers a rich academic heritage combined with modern innovation.', quickFacts: JSON.stringify({ tuitionRange: '£10,000–£35,000/yr', livingCost: '£1,000–£1,800/mo', workRights: '20 hrs/week term-time', postStudy: '2-year Graduate Route visa', englishTests: 'IELTS, PTE, TOEFL' }) },
    { slug: 'canada', name: 'Canada', shortName: 'Canada', flag: '🇨🇦', capital: 'Ottawa', currency: 'CAD ($)', intro: 'Canada consistently ranks among the best countries for international students, with welcoming immigration policies.', quickFacts: JSON.stringify({ tuitionRange: 'CAD 15,000–CAD 35,000/yr', livingCost: 'CAD 1,000–CAD 1,800/mo', workRights: '20 hrs/week off-campus', postStudy: '3-year PGWP', englishTests: 'IELTS, PTE, TOEFL, DET' }) },
    { slug: 'australia', name: 'Australia', shortName: 'Australia', flag: '🇦🇺', capital: 'Canberra', currency: 'AUD ($)', intro: 'Australia offers world-class education in a stunning natural environment with vibrant multicultural cities.', quickFacts: JSON.stringify({ tuitionRange: 'AUD 20,000–AUD 45,000/yr', livingCost: 'AUD 1,400–AUD 2,500/mo', workRights: '48 hrs/fortnight', postStudy: '2–6 year PSW visa', englishTests: 'IELTS, PTE, TOEFL' }) },
    { slug: 'usa', name: 'United States', shortName: 'USA', flag: '🇺🇸', capital: 'Washington D.C.', currency: 'USD ($)', intro: 'The US remains the world\'s leading destination for international education with unparalleled research opportunities.', quickFacts: JSON.stringify({ tuitionRange: '$20,000–$60,000/yr', livingCost: '$1,200–$2,500/mo', workRights: 'On-campus (F-1 OPT)', postStudy: '1–3 year OPT', englishTests: 'IELTS, TOEFL, DET, SAT/ACT' }) },
    { slug: 'new-zealand', name: 'New Zealand', shortName: 'New Zealand', flag: '🇳🇿', capital: 'Wellington', currency: 'NZD ($)', intro: 'New Zealand provides a safe, inclusive environment with high-quality education and stunning landscapes.', quickFacts: JSON.stringify({ tuitionRange: 'NZD 22,000–NZD 35,000/yr', livingCost: 'NZD 1,200–NZD 2,000/mo', workRights: '20 hrs/week', postStudy: '1–3 year PSW visa', englishTests: 'IELTS, PTE, TOEFL' }) },
    { slug: 'ireland', name: 'Ireland', shortName: 'Ireland', flag: '🇮🇪', capital: 'Dublin', currency: 'EUR (€)', intro: 'Ireland is a hub for tech and pharmaceutical companies, offering excellent post-study employment.', quickFacts: JSON.stringify({ tuitionRange: '€10,000–€25,000/yr', livingCost: '€1,000–€1,800/mo', workRights: '20 hrs/week', postStudy: '2-year Stay Back visa', englishTests: 'IELTS, PTE, TOEFL, DET' }) },
    { slug: 'germany', name: 'Germany', shortName: 'Germany', flag: '🇩🇪', capital: 'Berlin', currency: 'EUR (€)', intro: 'Germany offers tuition-free education at public universities for international students in most states.', quickFacts: JSON.stringify({ tuitionRange: '€0–€20,000/yr (varies by state)', livingCost: '€800–€1,200/mo', workRights: '120 full days/year', postStudy: '18-month job seeker visa', englishTests: 'IELTS, TestDaF, DSH' }) },
    { slug: 'malaysia', name: 'Malaysia', shortName: 'Malaysia', flag: '🇲🇾', capital: 'Kuala Lumpur', currency: 'MYR (RM)', intro: 'Malaysia offers affordable quality education with branch campuses of top UK and Australian universities.', quickFacts: JSON.stringify({ tuitionRange: 'RM 15,000–RM 50,000/yr', livingCost: 'RM 1,500–RM 3,000/mo', workRights: '20 hrs/week', postStudy: 'Work pass available', englishTests: 'IELTS, PTE, MUET' }) },
  ]

  for (const c of countries) {
    await db.countryPage.upsert({ where: { slug: c.slug }, update: c, create: c })
  }
  console.log(`✓ Countries: ${countries.length}`)

  // ─── UNIVERSITIES ──────────────────────────────────────
  const universities = [
    { slug: 'university-of-birmingham', name: 'University of Birmingham', countrySlug: 'uk', city: 'Birmingham', ranking: 'QS 84', studentsCount: '38,000+', logo: '/images/partners/university of birmingham .webp', campusImage: '/images/blogs/Copy of pexels-rdne-7683897.webp', overview: 'A founding member of the Russell Group, the University of Birmingham is a prestigious research-intensive institution known for its innovation and academic excellence.', strengths: JSON.stringify(['Research Excellence', 'Industry Connections', 'Global Community']), quickFacts: JSON.stringify({ founded: 1900, campusSize: '276 acres', internationalStudents: '30%' }), tuitionRange: '£21,000–£32,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business & Management', 'Computer Science', 'Engineering', 'Law', 'Medicine']) },
    { slug: 'university-of-hertfordshire', name: 'University of Hertfordshire', countrySlug: 'uk', city: 'Hatfield', ranking: 'QS 801–850', studentsCount: '25,000+', logo: '/images/partners/university of hertfordshire.webp', campusImage: '/images/blogs/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp', overview: 'Known as the UK\'s leading business-facing university, UH offers career-focused education with strong industry links.', strengths: JSON.stringify(['Industry-Focused', 'Employability', 'Modern Campus']), quickFacts: JSON.stringify({ founded: 1952, campusSize: '330 acres', internationalStudents: '25%' }), tuitionRange: '£14,000–£20,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Computer Science', 'Engineering', 'Creative Arts', 'Law']) },
    { slug: 'university-of-portsmouth', name: 'University of Portsmouth', countrySlug: 'uk', city: 'Portsmouth', ranking: 'QS 571–580', studentsCount: '28,000+', logo: '/images/partners/university of portsmouth.webp', campusImage: '/images/blogs/Copy of pexels-rdne-7092503.webp', overview: 'Located on the south coast of England, Portsmouth is known for its high student satisfaction and excellent teaching quality.', strengths: JSON.stringify(['Student Satisfaction', 'Teaching Excellence', 'Coastal Location']), quickFacts: JSON.stringify({ founded: 1992, campusSize: 'City campus', internationalStudents: '23%' }), tuitionRange: '£15,000–£22,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Engineering', 'Law', 'Psychology', 'Creative Technologies']) },
    { slug: 'university-of-sunderland', name: 'University of Sunderland', countrySlug: 'uk', city: 'Sunderland', ranking: 'QS 801–850', studentsCount: '20,000+', logo: '/images/partners/university of sunderland.webp', campusImage: '/images/blogs/Copy of pexels-rdne-7092364.webp', overview: 'Sunderland is a modern, student-focused university with excellent facilities and a welcoming international community.', strengths: JSON.stringify(['Affordable', 'Student Support', 'Modern Facilities']), quickFacts: JSON.stringify({ founded: 1992, campusSize: 'Multiple campuses', internationalStudents: '30%' }), tuitionRange: '£13,000–£18,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Computing', 'Tourism', 'Health', 'Education']) },
    { slug: 'university-of-greenwich', name: 'University of Greenwich', countrySlug: 'uk', city: 'London', ranking: 'QS 851–900', studentsCount: '22,000+', logo: '/images/partners/university of greenwich.webp', campusImage: '/images/blogs/Copy of pexels-jaksonmartins-3101504.webp', overview: 'Situated in the historic Royal Borough of Greenwich, London, the university combines heritage with modern education.', strengths: JSON.stringify(['London Location', 'Heritage Campus', 'Diverse Community']), quickFacts: JSON.stringify({ founded: 1890, campusSize: '3 campuses', internationalStudents: '28%' }), tuitionRange: '£14,000–£20,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Computing', 'Engineering', 'Law', 'Architecture']) },
    { slug: 'university-of-lincoln', name: 'University of Lincoln', countrySlug: 'uk', city: 'Lincoln', ranking: 'QS 601–650', studentsCount: '16,000+', logo: '/images/partners/university of lincoln.webp', campusImage: '/images/blogs/Copy of pexels-george-pak-7972967.webp', overview: 'A modern university with a historic city setting, Lincoln is known for its high-quality teaching and research.', strengths: JSON.stringify(['Teaching Excellence', 'Student Experience', 'Research Quality']), quickFacts: JSON.stringify({ founded: 1861, campusSize: 'City centre', internationalStudents: '15%' }), tuitionRange: '£14,000–£19,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Engineering', 'Computer Science', 'Psychology', 'Journalism']) },
    { slug: 'birmingham-city-university', name: 'Birmingham City University', countrySlug: 'uk', city: 'Birmingham', ranking: 'QS 1001–1200', studentsCount: '24,000+', logo: '/images/partners/birmingham city university .webp', campusImage: '/images/blogs/Copy of 50830.webp', overview: 'BCU is a vibrant, multicultural university in the heart of Birmingham, offering practice-based learning.', strengths: JSON.stringify(['Creative Arts', 'Business Connections', 'Urban Campus']), quickFacts: JSON.stringify({ founded: 1843, campusSize: 'City centre', internationalStudents: '22%' }), tuitionRange: '£14,000–£20,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Art & Design', 'Computing', 'Law', 'Health']) },
    { slug: 'university-of-wolverhampton', name: 'University of Wolverhampton', countrySlug: 'uk', city: 'Wolverhampton', ranking: 'QS 1001–1200', studentsCount: '20,000+', logo: '/images/partners/university of wolverhampton.webp', campusImage: '/images/blogs/Copy of 3117.webp', overview: 'With a strong focus on employability and inclusive education, Wolverhampton provides accessible pathways to success.', strengths: JSON.stringify(['Employability Focus', 'Inclusive Education', 'Industry Partnerships']), quickFacts: JSON.stringify({ founded: 1827, campusSize: 'Multiple campuses', internationalStudents: '25%' }), tuitionRange: '£13,000–£17,000/yr', scholarshipAvailable: true, popularSubjects: JSON.stringify(['Business', 'Computing', 'Engineering', 'Health', 'Education']) },
  ]

  for (const u of universities) {
    await db.universityPage.upsert({ where: { slug: u.slug }, update: u, create: u })
  }
  console.log(`✓ Universities: ${universities.length}`)

  // ─── COURSES ───────────────────────────────────────────
  const courses = [
    { slug: 'msc-data-science-birmingham', name: 'MSc Data Science', universitySlug: 'university-of-birmingham', countrySlug: 'uk', city: 'Birmingham', level: 'Masters', subject: 'Data Science & AI', duration: '1 Year', intake: 'Sep 2025, Jan 2026', tuition: '28,000', tuitionCurrency: 'GBP', scholarship: 'Up to £5,000', scholarshipAvailable: true, englishRequirement: 'IELTS 6.5 (no band < 6.0)', academicRequirement: '2:1 in relevant degree', overview: 'This programme equips students with advanced skills in data analytics, machine learning, and statistical modelling.', modules: JSON.stringify(['Machine Learning', 'Big Data Systems', 'Statistical Modelling', 'Data Visualisation', 'Research Methods']), careerOutcomes: JSON.stringify(['Data Scientist', 'ML Engineer', 'Analytics Consultant', 'Research Scientist']), deadline: '15 July 2025', matchScore: 96 },
    { slug: 'mba-international-business-hertfordshire', name: 'MBA International Business', universitySlug: 'university-of-hertfordshire', countrySlug: 'uk', city: 'Hatfield', level: 'MBA', subject: 'Business & Management', duration: '1 Year', intake: 'Sep 2025, Jan 2026', tuition: '19,500', tuitionCurrency: 'GBP', scholarship: '£2,000 merit-based', scholarshipAvailable: true, englishRequirement: 'IELTS 6.5 (no band < 5.5)', academicRequirement: '2:2 + 2 years work exp', overview: 'Develop strategic leadership skills with a global perspective in this AMBA-accredited MBA programme.', modules: JSON.stringify(['Strategic Management', 'Global Marketing', 'Financial Management', 'Leadership', 'Business Project']), careerOutcomes: JSON.stringify(['Business Consultant', 'Strategy Manager', 'International Director']), deadline: '1 August 2025', matchScore: 88 },
    { slug: 'msc-computer-science-portsmouth', name: 'MSc Computer Science', universitySlug: 'university-of-portsmouth', countrySlug: 'uk', city: 'Portsmouth', level: 'Masters', subject: 'Computer Science', duration: '1–2 Years', intake: 'Sep 2025, Feb 2026', tuition: '20,400', tuitionCurrency: 'GBP', scholarship: '£1,500 international', scholarshipAvailable: true, englishRequirement: 'IELTS 6.5 (no band < 6.0)', academicRequirement: '2:2 in Computing/related', overview: 'A conversion course designed for graduates from non-computing backgrounds wanting to enter the tech industry.', modules: JSON.stringify(['Software Engineering', 'Database Systems', 'Network Security', 'AI & ML', 'Project Management']), careerOutcomes: JSON.stringify(['Software Engineer', 'Systems Analyst', 'IT Consultant', 'DevOps Engineer']), deadline: '15 August 2025', matchScore: 92 },
    { slug: 'minternational-business-admin-sunderland', name: 'MSc International Business Administration', universitySlug: 'university-of-sunderland', countrySlug: 'uk', city: 'Sunderland', level: 'Masters', subject: 'Business & Management', duration: '1 Year', intake: 'Sep 2025, Jan 2026', tuition: '16,500', tuitionCurrency: 'GBP', scholarship: '£1,500–£3,000', scholarshipAvailable: true, englishRequirement: 'IELTS 6.0 (no band < 5.5)', academicRequirement: '2:2 in any discipline', overview: 'Gain a global business perspective with practical skills in management, marketing, and finance.', modules: JSON.stringify(['Global Business Environment', 'Marketing Management', 'Corporate Finance', 'Supply Chain', 'Dissertation']), careerOutcomes: JSON.stringify(['Business Analyst', 'Marketing Manager', 'Operations Manager']), deadline: '1 August 2025', matchScore: 85 },
    { slug: 'msc-cyber-security-greenwich', name: 'MSc Cyber Security', universitySlug: 'university-of-greenwich', countrySlug: 'uk', city: 'London', level: 'Masters', subject: 'Cyber Security', duration: '1–2 Years', intake: 'Sep 2025, Jan 2026', tuition: '17,000', tuitionCurrency: 'GBP', scholarship: '£2,000 excellence', scholarshipAvailable: true, englishRequirement: 'IELTS 6.5 (no band < 5.5)', academicRequirement: '2:2 in Computing/IT', overview: 'Learn to protect digital assets with cutting-edge cyber security techniques and ethical hacking skills.', modules: JSON.stringify(['Network Security', 'Cryptography', 'Digital Forensics', 'Ethical Hacking', 'Security Management']), careerOutcomes: JSON.stringify(['Security Analyst', 'Penetration Tester', 'Security Consultant']), deadline: '15 July 2025', matchScore: 91 },
    { slug: 'ba-business-management-lincoln', name: 'BA (Hons) Business Management', universitySlug: 'university-of-lincoln', countrySlug: 'uk', city: 'Lincoln', level: 'Bachelor', subject: 'Business & Management', duration: '3 Years', intake: 'Sep 2025, Jan 2026', tuition: '15,500', tuitionCurrency: 'GBP', scholarship: '£1,000–£2,500', scholarshipAvailable: true, englishRequirement: 'IELTS 6.0 (no band < 5.5)', academicRequirement: 'High school + foundation', overview: 'A comprehensive business degree covering management, marketing, finance, and entrepreneurship.', modules: JSON.stringify(['Organisational Behaviour', 'Marketing Principles', 'Financial Accounting', 'HR Management', 'Business Strategy']), careerOutcomes: JSON.stringify(['Business Analyst', 'Marketing Executive', 'HR Coordinator', 'Entrepreneur']), deadline: '15 January 2025', matchScore: 78 },
    { slug: 'msc-project-management-bcu', name: 'MSc Project Management', universitySlug: 'birmingham-city-university', countrySlug: 'uk', city: 'Birmingham', level: 'Masters', subject: 'Project Management', duration: '1 Year', intake: 'Sep 2025', tuition: '16,800', tuitionCurrency: 'GBP', scholarship: '£1,500 merit', scholarshipAvailable: true, englishRequirement: 'IELTS 6.0 (no band < 5.5)', academicRequirement: '2:2 + relevant experience', overview: 'APM-accredited programme preparing students for senior project management roles across industries.', modules: JSON.stringify(['Project Planning', 'Risk Management', 'Agile Methods', 'Budgeting & Finance', 'Research Project']), careerOutcomes: JSON.stringify(['Project Manager', 'Programme Manager', 'PMO Analyst']), deadline: '1 August 2025', matchScore: 83 },
    { slug: 'msc-accounting-finance-wolverhampton', name: 'MSc Accounting & Finance', universitySlug: 'university-of-wolverhampton', countrySlug: 'uk', city: 'Wolverhampton', level: 'Masters', subject: 'Accounting & Finance', duration: '1 Year', intake: 'Sep 2025, Jan 2026', tuition: '14,500', tuitionCurrency: 'GBP', scholarship: '£1,000–£2,000', scholarshipAvailable: true, englishRequirement: 'IELTS 6.0 (no band < 5.5)', academicRequirement: '2:2 in Accounting/Finance/Business', overview: 'Develop advanced financial expertise with ACCA/CIMA accreditation pathways.', modules: JSON.stringify(['Financial Reporting', 'Corporate Finance', 'Audit & Assurance', 'Taxation', 'Dissertation']), careerOutcomes: JSON.stringify(['Financial Analyst', 'Accountant', 'Audit Manager', 'Investment Analyst']), deadline: '15 August 2025', matchScore: 80 },
  ]

  for (const c of courses) {
    await db.coursePage.upsert({ where: { slug: c.slug }, update: c, create: c })
  }
  console.log(`✓ Courses: ${courses.length}`)

  // ─── SCHOLARSHIPS ───────────────────────────────────────
  const scholarships = [
    { scholarshipCode: 'SCH-UK-001', name: 'GREAT Scholarship 2025', slug: 'great-scholarship-2025', countrySlug: 'uk', universitySlug: 'university-of-birmingham', amount: '£10,000', amountType: 'FIXED', currency: 'GBP', fundingType: 'Tuition fee reduction', eligibility: 'Bangladeshi students with IELTS 6.5+ and 2:1 equivalent', courseEligibility: 'Full-time Masters programmes', deadline: '30 June 2025', description: 'Funded by the British Council and the University of Birmingham for outstanding Bangladeshi students.', overview: 'Funded by the British Council and the University of Birmingham for outstanding Bangladeshi students.', covers: '£10,000 tuition fee reduction', doesNotCover: 'Living expenses, travel, accommodation', whoCanApply: 'Bangladeshi nationals holding an offer for an eligible Masters programme with IELTS 6.5+ and equivalent 2:1 degree.', howToApply: 'Apply through the GREAT Scholarships website after receiving a course offer from the University of Birmingham.', selectionProcess: 'Academic merit and potential to contribute to the home country.', whatALOdoes: 'ALO Education identifies eligible candidates and supports the GREAT Scholarship application process.', internationalStudents: true },
    { scholarshipCode: 'SCH-UK-002', name: 'International Excellence Award', slug: 'international-excellence-award-hertfordshire', countrySlug: 'uk', universitySlug: 'university-of-hertfordshire', amount: '£4,000', amountType: 'FIXED', currency: 'GBP', fundingType: 'Tuition fee reduction', eligibility: 'International students with strong academic records', courseEligibility: 'Full-time postgraduate programmes', academicReq: 'Equivalent UK 2:1 or above', deadline: '31 July 2025', description: 'Merit-based award for high-achieving international applicants.', overview: 'Merit-based award for high-achieving international applicants at the University of Hertfordshire.', covers: '£4,000 tuition fee reduction', doesNotCover: 'Living expenses, accommodation, travel', whoCanApply: 'International fee-paying students with a strong academic record applying for eligible programmes.', howToApply: 'Automatically considered with your course application. No separate application form required.', selectionProcess: 'Based on academic qualifications in previous degree.', whatALOdoes: 'ALO ensures your application highlights your academic strengths to maximise scholarship consideration.', internationalStudents: true },
    { scholarshipCode: 'SCH-UK-003', name: 'Portsmouth Global Scholarship', slug: 'portsmouth-global-scholarship', countrySlug: 'uk', universitySlug: 'university-of-portsmouth', amount: '£1,500', amountType: 'FIXED', currency: 'GBP', fundingType: 'Tuition fee reduction', eligibility: 'All international students applying for PG programmes', courseEligibility: 'Full-time postgraduate programmes', deadline: 'Rolling', description: 'Automatic scholarship for eligible international students. No separate application needed.', overview: 'Automatic scholarship for eligible international students at the University of Portsmouth.', covers: '£1,500 tuition fee reduction', doesNotCover: 'Living expenses, accommodation, travel', whoCanApply: 'All self-funded international students applying for full-time postgraduate programmes.', howToApply: 'No separate application needed. Automatically applied when you receive an offer.', selectionProcess: 'Automatic based on international fee status.', whatALOdoes: 'ALO Education confirms your eligibility and ensures the scholarship is applied to your offer.', internationalStudents: true },
    { scholarshipCode: 'SCH-UK-004', name: 'Sunderland International Scholarship', slug: 'sunderland-international-scholarship', countrySlug: 'uk', universitySlug: 'university-of-sunderland', amount: '£1,500 – £3,000', amountType: 'RANGE', currency: 'GBP', fundingType: 'Tuition fee reduction (tiered)', eligibility: 'Self-funded international students from Bangladesh, India, Pakistan, Nepal', courseEligibility: 'Full-time programmes', nationalityReq: 'Bangladesh, India, Pakistan, Nepal', deadline: '1 August 2025', description: 'Tiered scholarship based on academic merit. Higher awards for first-class degree holders.', overview: 'Tiered scholarship for South Asian students at the University of Sunderland based on academic merit.', covers: '£1,500 (2:2) to £3,000 (1st class) tuition fee reduction', doesNotCover: 'Living expenses, accommodation, travel', whoCanApply: 'Self-funded international students from eligible South Asian countries.', howToApply: 'Automatically assessed based on your application and previous degree classification.', selectionProcess: 'Tiered based on degree classification: First class £3,000, Upper second £2,500, Lower second £1,500.', whatALOdoes: 'ALO helps you understand the tier you qualify for and ensures your documents support the highest tier.', internationalStudents: true },
    { scholarshipCode: 'SCH-UK-005', name: 'Greenwich Future Leaders Award', slug: 'greenwich-future-leaders-award', countrySlug: 'uk', universitySlug: 'university-of-greenwich', amount: '£2,000', amountType: 'FIXED', currency: 'GBP', fundingType: 'Tuition fee reduction', eligibility: 'Students demonstrating leadership potential and community involvement', courseEligibility: 'Full-time programmes', deadline: '15 July 2025', description: 'For students who have shown leadership in academic or community settings.', overview: 'For students who have shown leadership in academic or community settings at the University of Greenwich.', covers: '£2,000 tuition fee reduction', doesNotCover: 'Living expenses, accommodation, travel', whoCanApply: 'Students who can demonstrate leadership experience in academic, professional, or community settings.', howToApply: 'Submit a brief leadership statement with your course application.', selectionProcess: 'Based on demonstrated leadership experience and potential.', whatALOdoes: 'ALO helps you articulate your leadership experience effectively in your scholarship statement.', internationalStudents: true },
    { scholarshipCode: 'SCH-UK-006', name: 'Chevening Scholarship (UK Government)', slug: 'chevening-scholarship', countrySlug: 'uk', amount: 'Full tuition + living', amountType: 'FIXED', currency: 'GBP', fundingType: 'Fully funded', eligibility: 'Bangladeshi professionals with 2+ years work experience and leadership potential', courseEligibility: 'Full-time Masters programmes at any UK university', academicReq: 'Equivalent UK 2:1 or above', deadline: '5 November 2025', description: 'UK Government\'s global scholarship programme covering full tuition, living expenses, and travel.', overview: 'The UK Government\'s flagship global scholarship programme for future leaders.', covers: 'Full tuition fees, monthly stipend, travel to and from the UK, arrival allowance, thesis grant.', doesNotCover: 'Family member costs, private healthcare beyond NHS.', whoCanApply: 'Citizens of Chevening-eligible countries with 2+ years of work experience and leadership potential.', howToApply: 'Apply online at chevening.org between August and November each year.', selectionProcess: 'Multi-stage: application, interview at British Embassy/high commission, conditional offer.', whatALOdoes: 'ALO Education provides Chevening application workshops, interview coaching, and university shortlisting support.', internationalStudents: true },
    { scholarshipCode: 'SCH-CAN-001', name: 'Vanier Canada Graduate Scholarship', slug: 'vanier-canada-graduate-scholarship', countrySlug: 'canada', amount: 'CAD 50,000/year', amountType: 'FIXED', currency: 'CAD', fundingType: 'Fully funded (stipend)', eligibility: 'PhD students with strong research potential', courseEligibility: 'PhD programmes at eligible Canadian universities', deadline: '1 November 2025', description: 'Canadian Government scholarship for doctoral students at Canadian universities.', overview: 'Canadian Government scholarship to attract and retain world-class doctoral students.', covers: 'CAD 50,000 per year for up to 3 years.', doesNotCover: 'Tuition fees (separate funding may be needed).', whoCanApply: 'PhD students at Canadian universities with leadership skills and high standard of scholarly achievement.', howToApply: 'Nominated by the Canadian university. Apply through the university\'s graduate studies office.', selectionProcess: 'University nomination followed by federal review by the three granting agencies.', whatALOdoes: 'ALO helps identify Vanier-eligible PhD programmes and supports the university nomination process.', internationalStudents: true },
    { scholarshipCode: 'SCH-AU-001', name: 'Australia Awards Scholarship', slug: 'australia-awards-scholarship', countrySlug: 'australia', amount: 'Full tuition + travel + living', amountType: 'FIXED', currency: 'AUD', fundingType: 'Fully funded', eligibility: 'Citizens of eligible developing countries including Bangladesh', courseEligibility: 'Full-time undergraduate or postgraduate programmes', nationalityReq: 'Citizens of eligible developing countries', deadline: '1 May 2025', description: 'Australian Government funded scholarships for long-term study in Australia.', overview: 'Australian Government scholarships that aim to contribute to the development needs of Australia\'s partner countries.', covers: 'Full tuition, return air travel, establishment allowance, contribution to living expenses, Overseas Student Health Cover.', doesNotCover: 'Family reunion costs, personal travel within Australia.', whoCanApply: 'Citizens of eligible developing countries (including Bangladesh) who meet academic and English requirements.', howToApply: 'Apply online through the Australia Awards website in your home country.', selectionProcess: 'Competitive process including academic assessment, interview, and English language evaluation.', whatALOdoes: 'ALO provides guidance on eligible programmes, application preparation, and pre-departure support.', internationalStudents: true },
  ]

  for (const s of scholarships) {
    await db.scholarship.upsert({ where: { scholarshipCode: s.scholarshipCode }, update: s, create: s })
  }
  console.log(`✓ Scholarships: ${scholarships.length}`)

  // ─── EXAMS ──────────────────────────────────────────────
  const exams = [
    { slug: 'ielts', name: 'IELTS', fullName: 'International English Language Testing System', intro: 'The world\'s most popular English language test for study, work, and migration.', modules: JSON.stringify(['Listening (30 min)', 'Reading (60 min)', 'Writing (60 min)', 'Speaking (11–14 min)']) },
    { slug: 'pte', name: 'PTE Academic', fullName: 'Pearson Test of English Academic', intro: 'Fast, fair, and flexible computer-based English test accepted by universities worldwide.', modules: JSON.stringify(['Speaking & Writing (77–93 min)', 'Reading (32–41 min)', 'Listening (45–57 min)']) },
    { slug: 'toefl', name: 'TOEFL iBT', fullName: 'Test of English as a Foreign Language', intro: 'Widely accepted by US and global universities for admissions.', modules: JSON.stringify(['Reading (54–72 min)', 'Listening (41–57 min)', 'Speaking (17 min)', 'Writing (50 min)']) },
    { slug: 'duolingo', name: 'Duolingo English Test', fullName: 'Duolingo English Test', intro: 'Convenient online English test accepted by thousands of institutions worldwide.', modules: JSON.stringify(['Adaptive Test (45 min)', 'Video Interview & Writing (10 min)']) },
  ]

  for (const e of exams) {
    await db.examPage.upsert({ where: { slug: e.slug }, update: e, create: e })
  }
  console.log(`✓ Exams: ${exams.length}`)

  // ─── SERVICES ───────────────────────────────────────────
  const services = [
    { title: 'Course Finder', slug: 'course-finder', icon: 'Search', description: 'AI-powered course matching based on your profile, preferences, and eligibility. Find your perfect programme in minutes.', image: '/images/services/counseling.png', ctaLabel: 'Find Courses', ctaUrl: '#course-finder', sortOrder: 0 },
    { title: 'Visa Guidance', slug: 'visa-guidance', icon: 'Shield', description: 'End-to-end visa support including document preparation, application review, and interview coaching.', image: '/images/services/visa.png', ctaLabel: 'Get Visa Help', ctaUrl: '#visa', sortOrder: 1 },
    { title: 'English Test Prep', slug: 'english-test', icon: 'BookOpen', description: 'Free mock tests for IELTS, PTE, TOEFL with AI-powered scoring and detailed performance feedback.', image: '/images/services/english-test.png', ctaLabel: 'Take Free Test', ctaUrl: '#english-test', sortOrder: 2 },
    { title: 'Scholarship Finder', slug: 'scholarship-finder', icon: 'Award', description: 'Discover scholarships matching your profile. We help you apply and maximise your funding.', image: '/images/services/success.png', ctaLabel: 'Find Scholarships', ctaUrl: '#scholarships', sortOrder: 3 },
    { title: 'Application Support', slug: 'application-support', icon: 'FileText', description: 'Complete application management from shortlisting to enrolment. Expert guidance at every step.', image: '/images/services/counseling.png', ctaLabel: 'Start Application', ctaUrl: '#apply', sortOrder: 4 },
    { title: 'AI Interview Coach', slug: 'ai-interview', icon: 'Mic', description: 'Practice university credibility and visa interviews with our AI coach. Get instant feedback.', image: '/images/services/english-test.png', ctaLabel: 'Practice Now', ctaUrl: '#interview', sortOrder: 5 },
  ]

  for (const s of services) {
    await db.service.upsert({ where: { slug: s.slug }, update: s, create: s })
  }
  console.log(`✓ Services: ${services.length}`)

  // ─── STUDENT STORIES ────────────────────────────────────
  const stories = [
    { studentName: 'Tushar Imran Nahid', homeDistrict: 'Dhaka', countrySlug: 'uk', countryFlag: '🇬🇧', universityName: 'University of Hertfordshire', courseName: 'MSc Data Science', outcome: 'Visa Approved · September 2024 Intake', testimonial: 'ALO made the entire process seamless — from course selection to visa approval. Their AI-powered course finder matched me with the perfect programme, and the mock tests helped me achieve IELTS 7.0.', photo: '/images/team/Tushar Imran Nahid.png', sortOrder: 0 },
    { studentName: 'Ummaye Mayesha Manna', homeDistrict: 'Chittagong', countrySlug: 'uk', countryFlag: '🇬🇧', universityName: 'University of Portsmouth', courseName: 'MSc Cyber Security', outcome: 'Visa Approved · January 2025 Intake', testimonial: 'The scholarship finder saved me £2,000! The counsellors were available 24/7 on WhatsApp, and the AI interview coach prepared me perfectly for my credibility interview.', photo: '/images/team/Ummaye Mayesha Manna.PNG', sortOrder: 1 },
    { studentName: 'Rafiq Hasan', homeDistrict: 'Sylhet', countrySlug: 'canada', countryFlag: '🇨🇦', universityName: 'University of Toronto', courseName: 'MBA International Business', outcome: 'Offer Received · September 2025', testimonial: 'I was confused between UK and Canada. ALO\'s comparison tool helped me decide. Their document hub kept everything organised, and I never missed a deadline.', photo: null, sortOrder: 2 },
    { studentName: 'Fatima Akter', homeDistrict: 'Dhaka', countrySlug: 'australia', countryFlag: '🇦🇺', universityName: 'Monash University', courseName: 'MSc Data Science & AI', outcome: 'Enrolled · February 2025', testimonial: 'From IELTS preparation to visa approval, ALO was my one-stop solution. The free mock tests were incredibly accurate — my actual score matched my practice score!', photo: null, sortOrder: 3 },
  ]

  for (const s of stories) {
    await db.successStory.upsert({ where: { id: `story-${s.sortOrder}` }, update: s, create: { id: `story-${s.sortOrder}`, ...s } })
  }
  console.log(`✓ Stories: ${stories.length}`)

  // ─── TEAM MEMBERS ───────────────────────────────────────
  const team = [
    { name: 'Tushar Imran Nahid', role: 'Founder & CEO', specialty: 'International Education Strategy', bio: 'Over 8 years of experience in international student recruitment and counselling.', photo: '/images/team/Tushar Imran Nahid.png', sortOrder: 0 },
    { name: 'Ummaye Mayesha Manna', role: 'Head of Student Services', specialty: 'Visa & Documentation', bio: 'Specialist in UK, Canada, and Australia visa processes with a 98% approval rate.', photo: '/images/team/Ummaye Mayesha Manna.PNG', sortOrder: 1 },
    { name: 'Arif Rahman', role: 'Lead Counsellor', specialty: 'Course Matching & Applications', bio: 'Helped 500+ students find their ideal programmes across 6 countries.', photo: null, sortOrder: 2 },
  ]

  for (const t of team) {
    await db.teamMember.upsert({ where: { id: `team-${t.sortOrder}` }, update: t, create: { id: `team-${t.sortOrder}`, ...t } })
  }
  console.log(`✓ Team: ${team.length}`)

  // ─── FAQs ───────────────────────────────────────────────
  const faqs = [
    { question: 'How much does it cost to study in the UK from Bangladesh?', answer: 'Tuition fees range from £13,000 to £35,000 per year depending on the university and programme. Living costs average £1,000–£1,800/month. Total annual cost is approximately £20,000–£45,000 including tuition and living.', sortOrder: 0 },
    { question: 'What IELTS score do I need for a UK Masters degree?', answer: 'Most UK universities require IELTS 6.5 overall with no band below 6.0 for Masters programmes. Some universities accept 6.0, and top universities may require 7.0+. We offer free mock tests to help you prepare.', sortOrder: 1 },
    { question: 'Can I work while studying in the UK?', answer: 'Yes! International students on a Student Visa can work up to 20 hours per week during term-time and full-time during holidays. After graduation, the Graduate Route visa allows you to work in the UK for 2 years (3 years for PhD).', sortOrder: 2 },
    { question: 'What is the Graduate Route visa?', answer: 'The Graduate Route (formerly PSW) allows international students who have completed a degree in the UK to stay and work (or look for work) for 2 years after graduation (3 years for PhD holders). No sponsor is required.', sortOrder: 3 },
    { question: 'How do ALO\'s services work?', answer: 'Step 1: Free consultation to understand your goals. Step 2: AI-powered course matching. Step 3: Application support with document hub. Step 4: Visa preparation with AI interview coaching. Step 5: Pre-departure briefing. All services are free for students — we are funded by university commissions.', sortOrder: 4 },
    { question: 'Are there scholarships for Bangladeshi students?', answer: 'Yes! There are numerous scholarships including GREAT Scholarships (£10,000), Chevening (fully funded), Commonwealth Scholarships, and university-specific awards. Our scholarship finder can match you with eligible opportunities.', sortOrder: 5 },
    { question: 'What documents do I need to apply?', answer: 'Typical documents include: passport, academic transcripts & certificates, IELTS/PTE score, CV, personal statement/SOP, reference letters, and financial documents. Our document hub helps you track and upload everything securely.', sortOrder: 6 },
    { question: 'How long does the UK visa process take?', answer: 'Standard Student Visa processing is typically 3–6 weeks. Priority service (additional fee) can reduce this to 5 working days. We recommend applying at least 2 months before your course start date.', sortOrder: 7 },
  ]

  for (const f of faqs) {
    await db.homepageFaq.upsert({ where: { id: `faq-${f.sortOrder}` }, update: f, create: { id: `faq-${f.sortOrder}`, ...f } })
  }
  console.log(`✓ FAQs: ${faqs.length}`)

  // ─── BLOG POSTS ─────────────────────────────────────────
  const blogs = [
    { slug: 'complete-guide-uk-student-visa-2025', title: 'Complete Guide to UK Student Visa 2025', category: 'Visa Guide', summary: 'Everything you need to know about the UK Student Visa process, from requirements to post-study work rights.', heroImage: '/images/blogs/Copy of vecteezy_extraordinary-traditional-online-learning-platform-interface_57149920.webp', author: 'ALO Team', readingTime: 12 },
    { slug: 'ielts-vs-pte-vs-toefl-comparison', title: 'IELTS vs PTE vs TOEFL: Which Test Should You Take?', category: 'English Tests', summary: 'A detailed comparison of the three most popular English proficiency tests accepted by universities worldwide.', heroImage: '/images/blogs/Copy of 167794.webp', author: 'Tushar Imran Nahid', readingTime: 8 },
    { slug: 'top-10-uk-universities-bangladeshi-students', title: 'Top 10 UK Universities for Bangladeshi Students in 2025', category: 'University Guide', summary: 'Our curated list of UK universities offering the best value, scholarships, and career outcomes for Bangladeshi students.', heroImage: '/images/blogs/Copy of 2148431342.webp', author: 'ALO Team', readingTime: 10 },
    { slug: 'how-to-write-winning-personal-statement', title: 'How to Write a Winning Personal Statement for UK Universities', category: 'Application Tips', summary: 'Step-by-step guide with examples to craft a personal statement that gets you admitted to top UK universities.', heroImage: '/images/blogs/Copy of pexels-otherme-583475.webp', author: 'Ummaye Mayesha Manna', readingTime: 9 },
    { slug: 'scholarship-guide-bangladeshi-students', title: 'Scholarship Guide: Funding Your UK Education from Bangladesh', category: 'Scholarships', summary: 'Comprehensive guide to scholarships available for Bangladeshi students including application tips and deadlines.', heroImage: '/images/blogs/Copy of pexels-yankrukov-8199166.webp', author: 'ALO Team', readingTime: 11 },
    { slug: 'student-life-uk-expect-reality', title: 'Student Life in the UK: What to Expect vs Reality', category: 'Student Life', summary: 'Real insights from current Bangladeshi students studying in the UK about accommodation, culture, and daily life.', heroImage: '/images/blogs/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp', author: 'ALO Team', readingTime: 7 },
  ]

  for (const b of blogs) {
    await db.blogPost.upsert({ where: { slug: b.slug }, update: b, create: b })
  }
  console.log(`✓ Blog posts: ${blogs.length}`)

  // ─── LEADS (CRM Sample Data) ─────────────────────────────
  const leads = [
    { leadId: 'ALO-L-00001', fullName: 'Rahim Uddin', email: 'rahim@email.com', phone: '+8801712345678', source: 'WEBSITE', preferredCountry: 'UK', preferredCourse: 'MSc Data Science', status: 'QUALIFIED', aiScore: 82, leadScore: 85, notes: 'Strong academic background, IELTS 7.0 planned for March' },
    { leadId: 'ALO-L-00002', fullName: 'Nusrat Jahan', email: 'nusrat@email.com', phone: '+8801898765432', source: 'FACEBOOK', preferredCountry: 'Canada', preferredCourse: 'MBA', status: 'CONTACTED', aiScore: 75, leadScore: 70, notes: 'Interested in January 2026 intake, needs IELTS prep' },
    { leadId: 'ALO-L-00003', fullName: 'Kamal Hossain', email: 'kamal@email.com', phone: '+8801654321098', source: 'WHATSAPP', preferredCountry: 'Australia', preferredCourse: 'MSc Computer Science', status: 'NEW', aiScore: 60, leadScore: 55, notes: 'Inquired about scholarship options' },
    { leadId: 'ALO-L-00004', fullName: 'Sumaiya Akter', email: 'sumaiya@email.com', phone: '+8801598761234', source: 'REFERRAL', preferredCountry: 'UK', preferredCourse: 'MSc Cyber Security', status: 'CONVERTED', aiScore: 95, leadScore: 92, notes: 'Converted to student. Application submitted to Portsmouth.' },
    { leadId: 'ALO-L-00005', fullName: 'Imran Sheikh', email: 'imran@email.com', phone: '+8801811122233', source: 'WEBSITE', preferredCountry: 'USA', preferredCourse: 'MS Computer Science', status: 'NEW', aiScore: 45, leadScore: 40, notes: 'Initial inquiry, needs more info on costs' },
  ]

  for (const l of leads) {
    await db.lead.upsert({ where: { leadId: l.leadId }, update: l, create: l })
  }
  console.log(`✓ Leads: ${leads.length}`)

  // ─── STUDENTS ───────────────────────────────────────────
  const students = [
    { studentId: 'ALO-S-00001', firstName: 'Sumaiya', lastName: 'Akter', fullName: 'Sumaiya Akter', email: 'sumaiya@email.com', mobile: '+8801598761234', studyDestination: 'UK', programTitle: 'MSc Cyber Security', studyLevel: 'Masters', studyArea: 'Computer Science', intake: 'September 2025', profileCompletion: 85 },
    { studentId: 'ALO-S-00002', firstName: 'Tushar', lastName: 'Nahid', fullName: 'Tushar Imran Nahid', email: 'tushar@email.com', mobile: '+8801712345678', studyDestination: 'UK', programTitle: 'MSc Data Science', studyLevel: 'Masters', studyArea: 'Data Science', intake: 'September 2024', profileCompletion: 100 },
  ]

  for (const s of students) {
    await db.student.upsert({ where: { studentId: s.studentId }, update: s, create: s })
  }
  console.log(`✓ Students: ${students.length}`)

  console.log('\n✅ Homepage seed complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
