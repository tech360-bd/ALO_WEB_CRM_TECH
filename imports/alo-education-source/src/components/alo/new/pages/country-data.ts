// ─── Country Data Type ─────────────────────────────────────────────────────────
// This file exports the CountryData interface and a generator function
// that returns country-specific data. Add new countries by adding entries
// to the `countries` record in getCountryData().

export interface CountryData {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  capital: string;
  currency: string;
  heroImage: string;
  intro: string;
  stats: {
    universities: number;
    courses: number;
    scholarships: number;
    avgTuition: string;
    popularIntakes: string[];
    englishReq: string;
  };
  whyStudy: { title: string; description: string; icon: string }[];
  universities: {
    slug: string;
    name: string;
    city: string;
    ranking?: string;
    tuitionRange?: string;
    logo?: string;
    campusImage?: string;
    scholarshipAvailable: boolean;
    matchScore: number;
  }[];
  courses: {
    slug: string;
    name: string;
    universitySlug: string;
    universityName: string;
    city: string;
    level: string;
    subject: string;
    duration: string;
    tuition: string;
    tuitionCurrency: string;
    englishRequirement: string;
    scholarship?: string;
    scholarshipAvailable: boolean;
    matchScore: number;
  }[];
  scholarships: {
    slug: string;
    name: string;
    universityName?: string;
    amount: string;
    currency: string;
    eligibility?: string;
    deadline?: string;
    fundingType?: string;
  }[];
  cities: { name: string; universities: number; description: string }[];
  faqs: { question: string; answer: string }[];
  costs: {
    tuition: string;
    accommodation: string;
    food: string;
    transport: string;
    insurance: string;
    visa: string;
    application: string;
    other: string;
  };
}

// ─── UK Data ──────────────────────────────────────────────────────────────────

function ukData(): CountryData {
  return {
    slug: 'uk',
    name: 'United Kingdom',
    shortName: 'UK',
    flag: '🇬🇧',
    capital: 'London',
    currency: 'GBP (£)',
    heroImage:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
    intro:
      'Home to world-class universities, rich cultural heritage, and a diverse international student community. The UK offers globally recognised degrees, post-study work visas, and a welcoming environment for students from over 200 countries.',

    stats: {
      universities: 130,
      courses: 2500,
      scholarships: 350,
      avgTuition: '£13,000 – £35,000/yr',
      popularIntakes: ['September', 'January', 'May'],
      englishReq: 'IELTS 6.0 – 7.0',
    },

    whyStudy: [
      {
        title: 'World-Class Universities',
        description:
          'The UK is home to four of the world\'s top ten universities and over 130 institutions recognised globally for academic excellence and research output. Degrees are respected by employers worldwide.',
        icon: 'GraduationCap',
      },
      {
        title: 'Shorter Programmes',
        description:
          'Most UK undergraduate degrees take three years (versus four in many countries), and master\'s programmes typically last one year. This means lower tuition costs and an earlier start to your career.',
        icon: 'Clock',
      },
      {
        title: 'Post-Study Work Visa',
        description:
          'The UK Graduate Route allows international students to stay and work (or look for work) in the UK for up to two years after completing a degree — three years for PhD graduates.',
        icon: 'Briefcase',
      },
      {
        title: 'Cultural Diversity',
        description:
          'With students from over 200 countries, the UK offers a truly multicultural experience. You\'ll build a global network and gain perspectives that prepare you for an international career.',
        icon: 'Globe',
      },
      {
        title: 'Research & Innovation',
        description:
          'The UK produces 15% of the world\'s most cited research papers. Universities work closely with industry on cutting-edge projects in AI, biotech, engineering, and more.',
        icon: 'FlaskConical',
      },
      {
        title: 'Scholarship Opportunities',
        description:
          'Numerous government and university scholarships are available, including Chevening, Commonwealth Scholarships, and institution-specific awards for international students.',
        icon: 'Award',
      },
    ],

    universities: [
      {
        slug: 'university-of-birmingham',
        name: 'University of Birmingham',
        city: 'Birmingham',
        ranking: 'Top 100',
        tuitionRange: '£20,000 – £28,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 92,
      },
      {
        slug: 'aston-university',
        name: 'Aston University',
        city: 'Birmingham',
        ranking: 'Top 50 (young)',
        tuitionRange: '£16,000 – £22,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 85,
      },
      {
        slug: 'university-of-kent',
        name: 'University of Kent',
        city: 'Canterbury',
        ranking: 'Top 40 (UK)',
        tuitionRange: '£17,000 – £24,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 83,
      },
      {
        slug: 'university-of-portsmouth',
        name: 'University of Portsmouth',
        city: 'Portsmouth',
        ranking: 'Top 50 (young)',
        tuitionRange: '£15,000 – £21,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
        scholarshipAvailable: false,
        matchScore: 80,
      },
      {
        slug: 'university-of-sunderland',
        name: 'University of Sunderland',
        city: 'Sunderland',
        ranking: 'Top 60 (young)',
        tuitionRange: '£13,000 – £18,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 78,
      },
      {
        slug: 'university-of-derby',
        name: 'University of Derby',
        city: 'Derby',
        tuitionRange: '£14,000 – £19,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
        scholarshipAvailable: false,
        matchScore: 75,
      },
      {
        slug: 'university-of-hertfordshire',
        name: 'University of Hertfordshire',
        city: 'Hatfield',
        ranking: 'Top 60 (young)',
        tuitionRange: '£14,500 – £20,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 82,
      },
      {
        slug: 'university-of-greenwich',
        name: 'University of Greenwich',
        city: 'London',
        ranking: 'Top 70 (UK)',
        tuitionRange: '£15,000 – £22,000/yr',
        campusImage:
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
        scholarshipAvailable: true,
        matchScore: 79,
      },
    ],

    courses: [
      {
        slug: 'msc-data-science-birmingham',
        name: 'MSc Data Science',
        universitySlug: 'university-of-birmingham',
        universityName: 'University of Birmingham',
        city: 'Birmingham',
        level: 'Masters',
        subject: 'Computer Science',
        duration: '1 year',
        tuition: '£27,000',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 6.5 (no band below 6.0)',
        scholarship: 'Global Masters Scholarship (up to £5,000)',
        scholarshipAvailable: true,
        matchScore: 91,
      },
      {
        slug: 'mba-aston',
        name: 'MBA (Full-time)',
        universitySlug: 'aston-university',
        universityName: 'Aston University',
        city: 'Birmingham',
        level: 'Masters',
        subject: 'Business',
        duration: '1 year',
        tuition: '£22,500',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 6.5 (no band below 5.5)',
        scholarship: 'Aston Global Advantage Scholarship (up to £4,000)',
        scholarshipAvailable: true,
        matchScore: 88,
      },
      {
        slug: 'bsc-computer-science-kent',
        name: 'BSc Computer Science',
        universitySlug: 'university-of-kent',
        universityName: 'University of Kent',
        city: 'Canterbury',
        level: 'Bachelors',
        subject: 'Computer Science',
        duration: '3 years',
        tuition: '£20,500',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 6.0 (no band below 5.5)',
        scholarshipAvailable: false,
        matchScore: 84,
      },
      {
        slug: 'msc-international-business-portsmouth',
        name: 'MSc International Business',
        universitySlug: 'university-of-portsmouth',
        universityName: 'University of Portsmouth',
        city: 'Portsmouth',
        level: 'Masters',
        subject: 'Business',
        duration: '1 year',
        tuition: '£17,200',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 6.5 (no band below 6.0)',
        scholarshipAvailable: false,
        matchScore: 80,
      },
      {
        slug: 'ba-nursing-sunderland',
        name: 'BSc Nursing (Adult)',
        universitySlug: 'university-of-sunderland',
        universityName: 'University of Sunderland',
        city: 'Sunderland',
        level: 'Bachelors',
        subject: 'Health & Medicine',
        duration: '3 years',
        tuition: '£15,500',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 7.0 (no band below 6.5)',
        scholarship: 'Vice-Chancellor Scholarship (up to £2,500)',
        scholarshipAvailable: true,
        matchScore: 76,
      },
      {
        slug: 'msc-engineering-hertfordshire',
        name: 'MSc Mechanical Engineering',
        universitySlug: 'university-of-hertfordshire',
        universityName: 'University of Hertfordshire',
        city: 'Hatfield',
        level: 'Masters',
        subject: 'Engineering',
        duration: '1 year',
        tuition: '£17,000',
        tuitionCurrency: 'GBP',
        englishRequirement: 'IELTS 6.5 (no band below 6.0)',
        scholarshipAvailable: true,
        matchScore: 81,
      },
    ],

    scholarships: [
      {
        slug: 'chevening-scholarship',
        name: 'Chevening Scholarship',
        amount: 'Full tuition + living expenses',
        currency: 'GBP',
        eligibility:
          'Citizens of Chevening-eligible countries with at least 2 years work experience and a bachelor\'s degree.',
        deadline: 'Early November (annual)',
        fundingType: 'Government',
      },
      {
        slug: 'commonwealth-scholarship',
        name: 'Commonwealth Scholarship',
        amount: 'Full tuition + travel + living',
        currency: 'GBP',
        eligibility:
          'Citizens of Commonwealth countries applying for a master\'s or PhD in the UK.',
        deadline: 'December (annual)',
        fundingType: 'Government',
      },
      {
        slug: 'birmingham-global-masters',
        name: 'Birmingham Global Masters Scholarship',
        universityName: 'University of Birmingham',
        amount: 'Up to £5,000',
        currency: 'GBP',
        eligibility:
          'International applicants with a conditional offer for a taught master\'s programme.',
        deadline: 'March (annual)',
        fundingType: 'University',
      },
      {
        slug: 'aston-global-advantage',
        name: 'Aston Global Advantage Scholarship',
        universityName: 'Aston University',
        amount: 'Up to £4,000',
        currency: 'GBP',
        eligibility:
          'Self-funded international students applying for selected postgraduate programmes.',
        deadline: 'Rolling',
        fundingType: 'University',
      },
      {
        slug: 'greenwich-international-scholarship',
        name: 'University of Greenwich International Scholarship',
        universityName: 'University of Greenwich',
        amount: 'Up to £3,000',
        currency: 'GBP',
        eligibility:
          'International fee-paying students with strong academic records applying for undergraduate or postgraduate programmes.',
        deadline: 'Rolling',
        fundingType: 'University',
      },
      {
        slug: 'hertfordshire-international',
        name: 'Hertfordshire International Scholarship',
        universityName: 'University of Hertfordshire',
        amount: '£2,000 – £4,000',
        currency: 'GBP',
        eligibility:
          'Self-funded international students meeting academic thresholds for selected programmes.',
        deadline: 'Rolling',
        fundingType: 'University',
      },
    ],

    cities: [
      {
        name: 'London',
        universities: 40,
        description:
          'The capital city and a global hub for finance, culture, and education. Home to institutions like UCL, Imperial, LSE, and King\'s College.',
      },
      {
        name: 'Birmingham',
        universities: 8,
        description:
          'The UK\'s second-largest city with a thriving student community, excellent transport links, and a lower cost of living than London.',
      },
      {
        name: 'Manchester',
        universities: 6,
        description:
          'A vibrant northern city known for its music scene, tech industry, and two major universities with strong research profiles.',
      },
      {
        name: 'Leeds',
        universities: 5,
        description:
          'A fast-growing city with a large student population, excellent nightlife, and strong graduate employment rates.',
      },
      {
        name: 'Bristol',
        universities: 4,
        description:
          'A creative and tech-forward city with one of the UK\'s highest graduate employment rates and a high quality of life.',
      },
      {
        name: 'Cardiff',
        universities: 4,
        description:
          'The capital of Wales, offering a mix of cultural heritage, affordable living, and respected universities.',
      },
      {
        name: 'Edinburgh',
        universities: 5,
        description:
          'Scotland\'s capital, famous for its festivals, history, and the prestigious University of Edinburgh. A compact city ideal for students.',
      },
    ],

    faqs: [
      {
        question: 'What are the entry requirements for UK universities?',
        answer:
          'Most UK universities require equivalent qualifications such as A-Levels or international qualifications like the IB. For postgraduate study, a relevant bachelor\'s degree with a minimum 2:2 or 2:1 classification is typically required. English language requirements (IELTS 6.0–7.0 or equivalent) also apply. Specific requirements vary by institution and programme.',
      },
      {
        question: 'How much does it cost to study in the UK as an international student?',
        answer:
          'Tuition fees for international undergraduate students typically range from £13,000 to £35,000 per year depending on the institution and subject. Postgraduate fees are often similar. Living costs add approximately £1,000–£1,800 per month depending on the city. London is generally more expensive than other UK cities.',
      },
      {
        question: 'Can I work while studying in the UK?',
        answer:
          'Yes. International students on a Student Visa can work up to 20 hours per week during term time and full-time during holidays. Some courses (e.g., full-time foundation programmes) may have restrictions. Work must not be your primary purpose for being in the UK.',
      },
      {
        question: 'What is the Graduate Route visa?',
        answer:
          'The Graduate Route is a post-study work visa that allows international students who have successfully completed a degree at a UK higher education provider to stay in the UK for up to two years (three years for PhD graduates) to work, look for work, or start a business. No employer sponsorship is required.',
      },
      {
        question: 'When are the main intakes for UK universities?',
        answer:
          'The primary intake is September/October, which is the start of the UK academic year. A secondary intake in January is available at many institutions, particularly for postgraduate taught programmes. Some universities also offer a May intake for selected courses.',
      },
      {
        question: 'Do I need a Tier 4 or Student Visa to study in the UK?',
        answer:
          'Yes, most international students need a Student Visa (formerly Tier 4) to study in the UK for more than six months. You must have an offer from a licensed sponsor (your university), prove your English ability, and show you have enough funds for tuition and living costs.',
      },
      {
        question: 'How do I apply to UK universities?',
        answer:
          'For undergraduate programmes, most applications go through UCAS. For postgraduate programmes, applications are usually made directly to the university. The process typically involves submitting academic transcripts, a personal statement, references, and proof of English proficiency. ALO Education can guide you through every step.',
      },
      {
        question: 'Is it safe to study in the UK?',
        answer:
          'The UK is generally considered a safe country for international students. University campuses typically have robust security, and most cities have lower crime rates than major global cities. It is always recommended to follow standard personal safety practices.',
      },
      {
        question: 'What English language tests are accepted by UK universities?',
        answer:
          'IELTS Academic is the most widely accepted test. Many universities also accept PTE Academic, TOEFL iBT, and some accept LanguageCert or Duolingo English Test. Requirements vary by programme, typically ranging from IELTS 6.0 to 7.5.',
      },
      {
        question: 'Can I bring my family with me to the UK?',
        answer:
          'Yes, if you are studying a postgraduate programme at a UK university (master\'s or PhD) lasting 9 months or more, you can usually bring your partner and children as dependants. For most undergraduate programmes, bringing dependants is not permitted under the Student Visa rules.',
      },
    ],

    costs: {
      tuition: '£13,000 – £35,000/yr',
      accommodation: '£500 – £1,200/mo',
      food: '£150 – £250/mo',
      transport: '£50 – £100/mo',
      insurance: '£300 – £600/yr',
      visa: '£490 (application fee)',
      application: '£0 – £100',
      other: '£50 – £150/mo',
    },
  };
}

// ─── Generator ─────────────────────────────────────────────────────────────────

export function getCountryData(slug: string): CountryData | null {
  const countries: Record<string, () => CountryData> = {
    uk: ukData,
  };
  return countries[slug]?.() ?? null;
}
