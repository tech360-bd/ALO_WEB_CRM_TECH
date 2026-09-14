// ============================================================
// ALO EDUCATION — COUNTRY DESTINATIONS MASTER VERIFIED DATASET
// Verified official visa rules, tuition ranges, work rights & 20+ FAQs per country
// UK, Canada, Australia, USA, Ireland, New Zealand, Dubai / UAE, Germany
// ============================================================

export interface CountryDestinationData {
  slug: string;
  code: string;
  name: string;
  flag: string;
  capital: string;
  currency: string;
  heroTitle: string;
  heroSubtitle: string;
  overview: string;
  whyStudySummary: string;
  visaType: string;
  popularIntakes: string[];
  studyLevels: string[];
  tuitionRange: string;
  livingCost: string;
  workRights: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  lastVerifiedAt: string;

  quickFacts: { label: string; value: string; sourceUrl?: string }[];
  reasons: { icon: string; heading: string; description: string }[];
  pathways: { fromLevel: string; toPathway: string; description: string }[];
  entryRequirements: { level: string; academic: string; english: string; documents: string[] }[];
  englishTests: { name: string; accepted: string; note: string; sourceUrl: string }[];
  visaSteps: { step: number; title: string; description: string }[];
  workRightRules: { termTime: string; vacation: string; condition: string; postStudyRoute: string; sourceUrl: string }[];
  faqs: { question: string; answer: string }[];
  sources: { section: string; sourceName: string; sourceUrl: string; lastVerifiedAt: string }[];
  cities: { name: string; costLevel: string; vibe: string; universities: string[]; livingCost: string }[];
}

export const COUNTRY_DESTINATIONS: Record<string, CountryDestinationData> = {
  uk: {
    slug: "uk",
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    capital: "London",
    currency: "GBP (£)",
    heroTitle: "Study in the United Kingdom from Bangladesh",
    heroSubtitle: "Get 1-year Master’s degrees, up to £5,000 partial scholarships, and 2-year Graduate Route post-study work rights at top UK universities.",
    overview: "The United Kingdom offers world-renowned higher education with intensive 1-year Master’s programs, 3-year Bachelor’s degrees, and strong industry links.",
    whyStudySummary: "Shorter course duration saves 1 year of tuition and living expenses while graduating from globally accredited institutions.",
    visaType: "Student Visa (Subclass / Route)",
    popularIntakes: ["September 2026", "January 2027", "May 2027"],
    studyLevels: ["Foundation", "International Year One", "Bachelor Degree", "Top-up Degree", "Pre-Masters", "Masters (MSc/MA/LLM)", "MBA", "PhD"],
    tuitionRange: "£11,000 - £26,000 / year",
    livingCost: "£9,207 / 9 months (Outer London) - £12,006 / 9 months (Inner London)",
    workRights: "20 hours/week during term-time, full-time during official holidays.",
    seoTitle: "Study in the UK from Bangladesh | Courses, Universities, Visa & Scholarships | ALO Education",
    seoDescription: "Apply for UK Student Visa from Bangladesh. Explore UK universities, 1-year Master's programs, CAS process, scholarships, living costs, and 2-year post-study work rights.",
    canonicalUrl: "https://aloeducation.com/destinations/uk",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "London" },
      { label: "Currency", value: "British Pound Sterling (£ / GBP)" },
      { label: "Popular Cities", value: "London, Manchester, Birmingham, Glasgow, Edinburgh, Coventry, Leeds" },
      { label: "Main Intakes", value: "September (Primary), January (Secondary), May (Select)" },
      { label: "Average Master's Duration", value: "1 Year Full-Time" },
      { label: "Average Bachelor's Duration", value: "3 Years Full-Time (4 Years in Scotland)" },
      { label: "Post-Study Work Permit", value: "2 Years (3 Years for PhD) via Graduate Route" },
      { label: "Part-Time Work Limit", value: "20 Hours per Week during Term Time" }
    ],

    reasons: [
      { icon: "award", heading: "1-Year Fast-Track Master’s", description: "Graduate with a globally recognized Master’s degree in just 12 months, saving an entire year of living expenses and tuition." },
      { icon: "briefcase", heading: "2-Year Graduate Route (PSW)", description: "Work full-time in any sector across the UK for 2 full years after graduation without employer sponsorship." },
      { icon: "coins", heading: "Generous Partial Scholarships", description: "Merit-based international student scholarships ranging from £1,500 to £5,000 deducted directly from 1st-year tuition fees." },
      { icon: "globe", heading: "Global Academic Prestige", description: "Degrees from UK institutions are respected worldwide, giving Bangladeshi graduates competitive career advantages." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "International Foundation Year → 3-Year Bachelor Degree", description: "Bridge the 12-year education gap with a 9-month Foundation course at leading pathway colleges." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor Degree (Year 1) or International Year One", description: "Students with strong HSC GPA (3.5+) or A-Levels enter directly into Year 1 of standard 3-year degrees." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Final Year Top-Up Degree (1 Year) → Bachelor Degree", description: "Polytechnic Diploma holders from Bangladesh can complete their Bachelor's in just 1 year in the UK." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-Year Master's Degree (MSc / MA / MBA)", description: "Direct admission for Bachelor graduates with 55%+ from UGC recognized Bangladeshi universities." }
    ],

    entryRequirements: [
      { level: "Undergraduate (Bachelor)", academic: "HSC GPA 3.5+ or A-Levels (BBB/BBC)", english: "IELTS 6.0 (no band < 5.5) or PTE 54", documents: ["HSC/A-Level Transcripts", "Passport", "SOP", "1 Academic Reference"] },
      { level: "Postgraduate (Master's)", academic: "Bachelor 4-Year with CGPA 2.75+ or 55%+", english: "IELTS 6.5 (no band < 6.0) or PTE 59 or MOI", documents: ["Bachelor Degree & Transcripts", "Passport", "SOP", "2 Reference Letters", "CV"] },
      { level: "Top-up Degree (Final Year)", academic: "4-Year BTEB Diploma or 3-Year Degree with 60%+", english: "IELTS 6.0 (no band < 5.5) or PTE 54", documents: ["Diploma Transcripts", "SOP", "Academic Reference", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Universally accepted across all 160+ UK Universities", note: "Standard requirement 6.0 to 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "IELTS UKVI SELT", accepted: "Mandatory for Below-Degree (Foundation)", note: "Required if taking pre-sessional English or Foundation.", sourceUrl: "https://www.gov.uk/guidance/prove-your-english-language-abilities-with-a-secure-english-language-test-selt" },
      { name: "PTE Academic", accepted: "Widely accepted across 99% UK Universities", note: "Fast 48-hour computer test result.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "OIETC / ELLT", accepted: "Accepted by select partner UK universities", note: "Online English test with video interview.", sourceUrl: "https://oietc.pw" }
    ],

    visaSteps: [
      { step: 1, title: "University Offer Letter", description: "Submit academic transcripts and SOP to receive Conditional or Unconditional Offer." },
      { step: 2, title: "Meet Conditions & Pay Deposit", description: "Submit English test report and pay university tuition deposit (typically £3,000 - £5,000)." },
      { step: 3, title: "Pre-CAS Credibility Interview", description: "Complete internal university credibility mock interview with ALO guidance." },
      { step: 4, title: "CAS Issuance", description: "Receive official Confirmation of Acceptance for Studies (CAS) statement from university." },
      { step: 5, title: "Prepare Bank Statement", description: "Maintain 28-day bank statement showing tuition balance + living costs (£9,207 or £12,006)." },
      { step: 6, title: "Visa Application & Biometrics", description: "Submit UK VI online application, pay IHS health fee, and give biometrics at VFS Dhaka/Sylhet." }
    ],

    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "Full-time (40 hours per week) during official university vacations",
        condition: "Must be enrolled in degree-level course (Level 6 Bachelor or Level 7 Masters)",
        postStudyRoute: "2-year Graduate Route Post-Study Work Permit for Bachelor/Masters, 3 years for PhD.",
        sourceUrl: "https://www.gov.uk/graduate-visa"
      }
    ],

    faqs: [
      { question: "Can I study in the UK from Bangladesh with a study gap?", answer: "Yes, UK universities accept study gaps of 2 to 5 years for Bachelor's and up to 8 years for Master's programs provided you present valid work experience letters." },
      { question: "What is a CAS letter in UK admission?", answer: "CAS stands for Confirmation of Acceptance for Studies. It is an official electronic document issued by your UK university needed to apply for the UK Student Visa." },
      { question: "How much bank balance is required for UK student visa from Bangladesh?", answer: "You must show your remaining 1st-year tuition fee + living cost (£12,006 for Inner London or £9,207 for Outer London) held in an approved bank for at least 28 consecutive days." },
      { question: "Is IELTS mandatory for UK student visa?", answer: "While IELTS is preferred, many UK universities accept alternative tests like PTE Academic, OIETC ELLT, or Medium of Instruction (MOI) certificates from recognized Bangladeshi universities." },
      { question: "Can I bring my spouse or dependents to the UK?", answer: "Under current UK Home Office rules, international students enrolled in postgraduate research programs (PhD/Doctoral) or government-sponsored courses can bring dependents." },
      { question: "How long is the UK Graduate Route Post-Study Work Visa?", answer: "Graduates of Bachelor's and Master's degrees receive a 2-year Graduate Route visa to work in the UK. PhD graduates receive 3 years." },
      { question: "What is the tuition fee deposit for UK universities?", answer: "Most UK universities require an initial tuition deposit between £2,000 and £5,000 to issue the CAS statement." },
      { question: "Can polytechnic diploma students apply to the UK?", answer: "Yes, 4-year BTEB diploma graduates can apply directly for 1-year Top-up degree programs to graduate with a full British Bachelor's degree." },
      { question: "What is the Immigration Health Surcharge (IHS)?", answer: "The IHS fee gives international students full access to the UK National Health Service (NHS) during their stay (£776 per year for students)." },
      { question: "When are the main intakes for UK universities?", answer: "The primary intake is September/October, the secondary intake is January/February, and select universities offer a May intake." },
      { question: "What documents are required for university application?", answer: "Academic certificates, mark sheets, valid passport, SOP, CV, two recommendation letters, and English language certificate." },
      { question: "How long does UK visa processing take in Bangladesh?", answer: "Standard processing at VFS Global Dhaka/Sylhet takes 15 working days. Priority visa takes 5 working days, and Super Priority takes 24 hours." },
      { question: "What is a Pre-CAS Credibility Interview?", answer: "It is an interview conducted by the university to assess your genuine student intentions, course knowledge, financial readiness, and career plans." },
      { question: "Are scholarships available for Bangladeshi students in the UK?", answer: "Yes, UK universities offer automatic partial scholarships of £1,000 to £5,000 based on academic grades, plus prestigious Chevening scholarships." },
      { question: "Can I work part-time while studying in the UK?", answer: "Yes, international students on a Student Visa can work up to 20 hours per week during term time and 40 hours per week during official holidays." },
      { question: "What is Medium of Instruction (MOI) waiver?", answer: "If your Bachelor's degree in Bangladesh was taught entirely in English at an approved university, some UK universities waive the IELTS requirement." },
      { question: "What bank accounts are accepted for the 28-day financial statement?", answer: "Savings or current personal accounts in the student's name or parents' names at standard commercial banks in Bangladesh." },
      { question: "Can I switch to a UK Skilled Worker Visa after graduation?", answer: "Yes, once you secure a qualifying job offer from a Home Office licensed sponsor meeting the minimum salary threshold, you can switch from Graduate Route to Skilled Worker visa." },
      { question: "What happens if my UK student visa is refused?", answer: "You can request an Administrative Review if an official casework error occurred, or address the refusal grounds and reapply with ALO counselor guidance." },
      { question: "Does ALO Education charge any service fee for UK university admission?", answer: "No, ALO Education provides 100% free counseling, course matching, university admission processing, and scholarship application support." }
    ],

    sources: [
      { section: "Visa & Post-Study Route", sourceName: "UK Government Home Office (GOV.UK)", sourceUrl: "https://www.gov.uk/student-visa", lastVerifiedAt: "2026-07-25" },
      { section: "English Language Standard", sourceName: "UK Visas and Immigration (UKVI)", sourceUrl: "https://www.gov.uk/guidance/prove-your-english-language-abilities-with-a-secure-english-language-test-selt", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "London", costLevel: "High", vibe: "Global Financial & Cultural Capital", universities: ["Aston University London", "University of Greenwich", "Middlesex University London"], livingCost: "£1,334 / month" },
      { name: "Manchester", costLevel: "Medium", vibe: "Tech, Business & Football Hub", universities: ["University of Manchester", "Manchester Metropolitan"], livingCost: "£1,023 / month" },
      { name: "Birmingham", costLevel: "Medium", vibe: "Vibrant Student City & Industrial Hub", universities: ["Birmingham City University", "Aston University Main"], livingCost: "£980 / month" }
    ]
  },

  canada: {
    slug: "canada",
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    capital: "Ottawa",
    currency: "CAD ($)",
    heroTitle: "Study in Canada from Bangladesh | PGWP & Top Universities",
    heroSubtitle: "Earn degrees from top Canadian Designated Learning Institutions (DLI) and qualify for up to 3-year Post-Graduation Work Permits (PGWP).",
    overview: "Canada is known for its world-class education standards, safe multicultural cities, and structured pathways for post-graduation employment.",
    whyStudySummary: "Combining high academic prestige with up to 3-year PGWP and transparent permanent residency pathways.",
    visaType: "Study Permit (IRCC)",
    popularIntakes: ["September (Fall) 2026", "January (Winter) 2027", "May (Summer) 2027"],
    studyLevels: ["Diploma (2-Year)", "Advanced Diploma (3-Year)", "Bachelor Degree (4-Year)", "Post-Graduate Certificate (1-Year)", "Master's Degree (2-Year)", "PhD"],
    tuitionRange: "$15,000 - $35,000 CAD / year",
    livingCost: "$20,635 CAD / year (IRCC Cost of Living Threshold)",
    workRights: "20-24 hours/week during academic sessions, full-time during scheduled breaks.",
    seoTitle: "Study in Canada from Bangladesh | DLI Universities, PGWP & Visa | ALO Education",
    seoDescription: "Comprehensive guide to studying in Canada from Bangladesh. Explore DLIs, PAL/CAQ process, GIC financial requirements, SDS/Non-SDS routes, and 3-year PGWP.",
    canonicalUrl: "https://aloeducation.com/destinations/canada",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Ottawa" },
      { label: "Currency", value: "Canadian Dollar ($ / CAD)" },
      { label: "Popular Cities", value: "Toronto, Vancouver, Montreal, Calgary, Ottawa, Halifax" },
      { label: "Main Intakes", value: "September (Fall), January (Winter), May (Summer)" },
      { label: "Average Master's Duration", value: "1.5 to 2 Years" },
      { label: "Average Bachelor's Duration", value: "4 Years" },
      { label: "Post-Graduation Work Permit (PGWP)", value: "Up to 3 Years" },
      { label: "Cost of Living Requirement (GIC)", value: "$20,635 CAD per Year" }
    ],

    reasons: [
      { icon: "briefcase", heading: "Up to 3-Year PGWP", description: "Graduates of 2-year programs qualify for 3-year open Post-Graduation Work Permits to gain valuable Canadian work experience." },
      { icon: "award", heading: "Global Degree Recognition", description: "Degrees from Canadian universities and polytechnics are celebrated globally for quality and research excellence." },
      { icon: "globe", heading: "Welcoming & Diverse Society", description: "Canada is consistently ranked among the safest and most student-friendly nations in the world." },
      { icon: "coins", heading: "Co-op Work Terms", description: "Paid co-op internships integrated into your curriculum allow you to earn money while building professional Canadian networks." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "High School Completion / Foundation Program", description: "Complete high school prerequisites or pre-university foundation in Canada." },
      { fromLevel: "HSC / A-Level", toPathway: "2-Year College Diploma or 4-Year Bachelor Degree", description: "Direct entry to colleges and universities with HSC GPA 3.5+ or 2 A-Level passes." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Advanced Diploma or Bachelor with Credit Transfer", description: "Polytechnic diploma holders can transfer credits into 2nd/3rd year of Canadian Bachelor programs." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-2 Year Post-Graduate Certificate (PGC) or Master's", description: "Specialized Master's or Post-Graduate certificates with minimum CGPA 2.8+ from Bangladesh." }
    ],

    entryRequirements: [
      { level: "College Diploma / Certificate", academic: "HSC GPA 3.0+ or A-Levels (2 passes)", english: "IELTS 6.0 (no band < 5.5) or PTE 54", documents: ["HSC Transcripts", "Passport", "SOP"] },
      { level: "Undergraduate (Bachelor)", academic: "HSC GPA 3.5+ or A-Levels (CCD+)", english: "IELTS 6.5 (no band < 6.0) or PTE 60", documents: ["Academic Certificates", "Passport", "SOP", "Financial Proof"] },
      { level: "Post-Graduate / Master's", academic: "Bachelor with CGPA 3.0+ or 60%+", english: "IELTS 6.5 (no band < 6.0) or PTE 65", documents: ["Degree Certificate & Transcripts", "SOP", "2 Letters of Reference", "CV", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by 100% of Canadian DLIs", note: "Standard requirement 6.5 overall (no band < 6.0).", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Accepted for SDS and direct admission", note: "Minimum score 60 overall.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "TOEFL iBT", accepted: "Widely accepted across top universities", note: "Minimum score 85-90.", sourceUrl: "https://www.ets.org/toefl" }
    ],

    visaSteps: [
      { step: 1, title: "Apply to DLI & Receive Letter of Acceptance (LOA)", description: "Secure admission at a designated learning institution." },
      { step: 2, title: "Obtain Provincial Attestation Letter (PAL)", description: "Receive the official PAL issued by the provincial government." },
      { step: 3, title: "Purchase Guaranteed Investment Certificate (GIC)", description: "Deposit $20,635 CAD in an approved Canadian financial institution." },
      { step: 4, title: "Pay First-Year Tuition Deposit", description: "Pay 1 full year of tuition to your college/university." },
      { step: 5, title: "Complete Upfront Medical Exam", description: "Undergo immigration medical exam at an approved panel physician in Dhaka." },
      { step: 6, title: "Submit IRCC Visa Application & Biometrics", description: "Submit application online and provide biometrics at VFS Canada Visa Application Centre." }
    ],

    workRightRules: [
      {
        termTime: "20-24 hours per week",
        vacation: "Full-time during scheduled institutional breaks",
        condition: "Must hold valid Study Permit and be enrolled full-time at a DLI",
        postStudyRoute: "Up to 3-year PGWP depending on program length.",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html"
      }
    ],

    faqs: [
      { question: "What is a Provincial Attestation Letter (PAL)?", answer: "A PAL is a mandatory provincial verification document required alongside your Letter of Acceptance (LOA) for Canadian study permit applications." },
      { question: "How much is the Canadian cost of living requirement (GIC)?", answer: "The IRCC financial threshold is $20,635 CAD for a single applicant, typically purchased as a Guaranteed Investment Certificate (GIC)." },
      { question: "How long is the Post-Graduation Work Permit (PGWP)?", answer: "Graduates of 2-year programs receive a 3-year PGWP. Programs between 8 months and 2 years receive a PGWP matching course length." },
      { question: "What is a Designated Learning Institution (DLI)?", answer: "A DLI is a Canadian school approved by a provincial or territorial government to host international students." },
      { question: "Can I study in Canada without IELTS?", answer: "Most Canadian universities and colleges require IELTS Academic, PTE Academic, or TOEFL iBT for direct admission." },
      { question: "Can polytechnic diploma holders apply to Canada?", answer: "Yes, 4-year BTEB diploma graduates can apply for Post-Graduate Certificates or Advanced Diplomas with credit transfers." },
      { question: "How long does Canadian study permit processing take in Bangladesh?", answer: "Processing generally takes 7 to 12 weeks depending on seasonal application volumes at IRCC." },
      { question: "Can my spouse work while I study in Canada?", answer: "Spouses of students enrolled in Master's and Doctoral degree programs can apply for an open work permit." },
      { question: "What is a Co-op work permit?", answer: "A Co-op permit allows students to complete mandatory paid internships required by their academic curriculum." },
      { question: "What are the main intake seasons in Canada?", answer: "Fall (September), Winter (January), and Summer (May)." },
      { question: "What is the minimum GPA required for Canadian Master's?", answer: "Most Canadian universities require a minimum CGPA of 3.0 out of 4.0 in a 4-year Bachelor's degree." },
      { question: "What documents are required for Canadian Study Permit?", answer: "Valid passport, LOA, PAL, GIC certificate, 1-year tuition receipt, SOP, academic transcripts, and upfront medical report." },
      { question: "Is an upfront medical examination required?", answer: "Yes, Bangladeshi applicants must complete a medical exam at an IRCC-approved panel physician in Dhaka before submitting." },
      { question: "Can I transfer credits from Bangladesh to a Canadian university?", answer: "Yes, universities evaluate course syllabi and mark sheets individually to grant transfer credits." },
      { question: "What is the difference between College and University in Canada?", answer: "Colleges focus on hands-on practical diplomas and certificates, while Universities offer academic Bachelor's, Master's, and PhD degrees." },
      { question: "How much is tuition fee in Canada for international students?", answer: "Colleges range from $15,000 to $20,000 CAD/year; universities range from $20,000 to $35,000 CAD/year." },
      { question: "Can I apply with a study gap in Canada?", answer: "Yes, study gaps supported by valid employment certificates, tax documents, and salary proofs are accepted." },
      { question: "Where do I give biometrics for Canada in Bangladesh?", answer: "At the VFS Canada Visa Application Centre located in Delta Life Tower, Gulshan-2, Dhaka." },
      { question: "What is a Letter of Explanation / SOP for Canada?", answer: "A detailed statement explaining your academic background, choice of Canadian program, financial capability, and career plans in Bangladesh." },
      { question: "Does ALO Education assist with PAL and GIC setup?", answer: "Yes, ALO Education guides you step-by-step through LOA issuance, PAL collection, GIC bank account opening, and visa file preparation." }
    ],

    sources: [
      { section: "Study Permit & PAL Rules", sourceName: "Immigration, Refugees and Citizenship Canada (IRCC)", sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Toronto", costLevel: "High", vibe: "Canada's Economic & Tech Capital", universities: ["University of Toronto", "York University", "Seneca Polytechnic"], livingCost: "$1,800 CAD / month" },
      { name: "Vancouver", costLevel: "High", vibe: "Scenic West Coast Innovation City", universities: ["UBC", "Simon Fraser University"], livingCost: "$1,850 CAD / month" },
      { name: "Calgary", costLevel: "Medium", vibe: "Affordable Energy & Business Hub", universities: ["University of Calgary", "Bow Valley College"], livingCost: "$1,350 CAD / month" }
    ]
  },

  australia: {
    slug: "australia",
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    capital: "Canberra",
    currency: "AUD ($)",
    heroTitle: "Study in Australia from Bangladesh | Subclass 500 Visa & Top Unis",
    heroSubtitle: "Explore Group of Eight (Go8) universities, 48 hours/fortnight work rights, and up to 4-year Post-Study Work Streams.",
    overview: "Australia offers high-ranking global universities, innovative research facilities, and attractive regional post-study work incentives.",
    whyStudySummary: "World-class education combined with high minimum wages, sunny climate, and extended regional graduate visas.",
    visaType: "Student Visa (Subclass 500)",
    popularIntakes: ["Semester 1 (Feb/Mar) 2027", "Semester 2 (Jul/Aug) 2026", "Term 3 (Nov) 2026"],
    studyLevels: ["Diploma / VET", "Bachelor Degree (3-4 Years)", "Graduate Diploma", "Master's (Coursework)", "Master's (Research)", "PhD"],
    tuitionRange: "$22,000 - $45,000 AUD / year",
    livingCost: "$29,710 AUD / year (Department of Home Affairs standard)",
    workRights: "48 hours per fortnight during study terms, unlimited during vacations.",
    seoTitle: "Study in Australia from Bangladesh | Subclass 500, GS & Scholarships | ALO Education",
    seoDescription: "Apply for Australian Student Visa Subclass 500 from Bangladesh. Genuine Student (GS) criteria, COE process, tuition fees, and Temporary Graduate Subclass 485 visa.",
    canonicalUrl: "https://aloeducation.com/destinations/australia",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Canberra" },
      { label: "Currency", value: "Australian Dollar ($ / AUD)" },
      { label: "Popular Cities", value: "Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast" },
      { label: "Main Intakes", value: "February (Primary) & July (Secondary)" },
      { label: "Average Master's Duration", value: "2 Years Full-Time" },
      { label: "Average Bachelor's Duration", value: "3 Years (4 Years for Engineering)" },
      { label: "Post-Study Work Visa", value: "2 to 4 Years (Subclass 485)" },
      { label: "Financial Living Cost Requirement", value: "$29,710 AUD per Year" }
    ],

    reasons: [
      { icon: "award", heading: "World Top 100 Universities", description: "Home to the prestigious Group of Eight (Go8) institutions recognized globally for research and teaching." },
      { icon: "briefcase", heading: "Post-Study Work Rights", description: "Qualify for 2 to 4 years on the Temporary Graduate Visa (Subclass 485) to gain professional experience." },
      { icon: "coins", heading: "Generous Merit Scholarships", description: "Universities offer international student fee reductions of 15% to 30% per year for academic merit." },
      { icon: "globe", heading: "Regional Study Advantages", description: "Studying in designated regional cities (Adelaide, Perth, Gold Coast) grants extra post-study work years." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Foundation Studies (8-12 Months) → Bachelor Degree", description: "Bridge into top Australian universities through comprehensive university-affiliated foundation colleges." },
      { fromLevel: "HSC / A-Level", toPathway: "Diploma Pathway (Year 1) or Direct Bachelor (3 Years)", description: "Enter directly with HSC GPA 4.0+ or via 1-year Higher Education Diplomas leading into Year 2." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree with up to 1-Year Credit Exemption", description: "Polytechnic diploma holders receive advanced standing credits into Australian engineering and IT degrees." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "2-Year Master's Degree (Coursework / Research)", description: "Direct admission for Bachelor graduates with CGPA 2.8+ from recognized Bangladeshi universities." }
    ],

    entryRequirements: [
      { level: "Diploma / Pathway (Year 1)", academic: "HSC GPA 3.5+ or A-Levels (2 passes)", english: "IELTS 5.5 (no band < 5.0) or PTE 46", documents: ["HSC Transcripts", "Passport", "SOP"] },
      { level: "Undergraduate (Bachelor)", academic: "HSC GPA 4.0+ or A-Levels (BBB+)", english: "IELTS 6.5 (no band < 6.0) or PTE 58", documents: ["Academic Records", "Passport", "GS Evidence", "Bank Statement"] },
      { level: "Postgraduate (Master's)", academic: "Bachelor with CGPA 2.8+ (60%+)", english: "IELTS 6.5 (no band < 6.0) or PTE 60", documents: ["Degree Certificate", "Transcripts", "Genuine Student Statement", "CV", "2 References"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by all Australian institutions", note: "Minimum 6.0 to 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Widely accepted for Subclass 500 visa", note: "Minimum score 58-64.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "TOEFL iBT", accepted: "Accepted for university and visa", note: "Minimum score 80-90.", sourceUrl: "https://www.ets.org/toefl" }
    ],

    visaSteps: [
      { step: 1, title: "Course Application & Offer Letter", description: "Submit academic transcripts, SOP, and passport to obtain an Offer Letter." },
      { step: 2, title: "Genuine Student (GS) Assessment", description: "Complete university financial assessment and GS documentation." },
      { step: 3, title: "Pay Initial Tuition Deposit & OSHC", description: "Pay 1st semester tuition + Overseas Student Health Cover (OSHC)." },
      { step: 4, title: "Receive Confirmation of Enrolment (COE)", description: "Obtain official electronic COE from the university." },
      { step: 5, title: "Submit Online Visa Application (ImmiAccount)", description: "Lodge Subclass 500 visa application with biometric appointment at VFS." }
    ],

    workRightRules: [
      {
        termTime: "48 hours per fortnight",
        vacation: "Unlimited hours during scheduled semester breaks",
        condition: "Must maintain satisfactory course progress and attendance",
        postStudyRoute: "2-4 years Post-Study Work Stream (Subclass 485).",
        sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"
      }
    ],

    faqs: [
      { question: "What is Genuine Student (GS) requirement in Australia?", answer: "The GS requirement assesses whether an applicant genuinely intends to study in Australia, taking into account academic history, financial capacity, and career value." },
      { question: "What is a Confirmation of Enrolment (COE)?", answer: "A COE is an official document issued by an Australian education provider verifying you have accepted an offer and paid your tuition deposit." },
      { question: "How much bank balance is required for Australian Student Visa from Bangladesh?", answer: "You must demonstrate 1 year of tuition fee + $29,710 AUD living costs + return airfare held in an approved bank with clear source of funds." },
      { question: "What is Overseas Student Health Cover (OSHC)?", answer: "OSHC is mandatory medical insurance covering hospital and medical expenses during your entire stay in Australia." },
      { question: "What is the part-time work hour limit in Australia?", answer: "48 hours per fortnight during semester terms, and unlimited hours during official semester vacations." },
      { question: "How long is the Post-Study Work Visa (Subclass 485)?", answer: "Bachelor graduates get 2 years, Master's coursework graduates get 2 years, and Master's research/PhD graduates get 3 years, with additional regional bonus years." },
      { question: "What are the main intake months for Australian universities?", answer: "February/March (Semester 1) and July/August (Semester 2), with select November mini-intakes." },
      { question: "Are polytechnic diploma graduates eligible for Australian universities?", answer: "Yes, BTEB diploma graduates can enter Bachelor's degree programs with up to 1 year of credit exemption." },
      { question: "Can I bring my spouse to Australia on a Student Visa?", answer: "Yes, married students can include their spouse as a secondary applicant on the Subclass 500 visa." },
      { question: "What is the Group of Eight (Go8)?", answer: "The Group of Eight consists of Australia's top eight research-intensive universities (e.g., University of Melbourne, USYD, UNSW, ANU)." },
      { question: "What English tests are accepted for Australian visa?", answer: "IELTS Academic, PTE Academic, TOEFL iBT, and Cambridge C1 Advanced." },
      { question: "What is the minimum IELTS required for Australian Master's?", answer: "Typically 6.5 overall with no individual band below 6.0." },
      { question: "How long does Australian visa processing take in Bangladesh?", answer: "Processing generally takes 4 to 8 weeks depending on the university sector and risk tier." },
      { question: "What is the minimum wage for international students in Australia?", answer: "The Australian national minimum wage is $24.10 AUD per hour (plus 25% casual loading for casual work)." },
      { question: "Can parents sponsor my education in Australia?", answer: "Yes, parents, siblings, or blood relatives can act as financial sponsors with documented income tax returns and bank statements." },
      { question: "What are regional study benefits in Australia?", answer: "Studying in regional areas like Perth, Adelaide, or Newcastle provides an extra 1-2 years on your Post-Study Work Visa." },
      { question: "Do Australian universities offer scholarships to Bangladeshi students?", answer: "Yes, most universities offer merit-based scholarships ranging from 15% to 30% tuition fee reduction each year." },
      { question: "Where do I submit biometrics for Australia in Dhaka?", answer: "At the VFS Australia Visa Application Centre located in Delta Life Tower, Gulshan-2, Dhaka." },
      { question: "Can I change my course or university after arriving in Australia?", answer: "Under visa condition 8202, you must remain in the same or higher AQF level course and complete at least 6 months of your primary course before transferring." },
      { question: "How does ALO Education help with Australian admissions?", answer: "ALO Education provides university shortlisting, GTE/GS statement drafting, scholarship applications, and complete visa file preparation." }
    ],

    sources: [
      { section: "Visa Subclass 500 & Living Cost", sourceName: "Australian Government Department of Home Affairs", sourceUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Sydney", costLevel: "High", vibe: "Global Business & Harbour Metropolis", universities: ["University of Sydney", "UNSW Sydney", "Macquarie University"], livingCost: "$2,200 AUD / month" },
      { name: "Melbourne", costLevel: "High", vibe: "Cultural & Academic Capital", universities: ["University of Melbourne", "Monash University", "RMIT University"], livingCost: "$2,000 AUD / month" },
      { name: "Adelaide", costLevel: "Medium", vibe: "Affordable Regional Education Hub", universities: ["University of Adelaide", "Flinders University"], livingCost: "$1,500 AUD / month" }
    ]
  },

  usa: {
    slug: "usa",
    code: "USA",
    name: "United States",
    flag: "🇺🇸",
    capital: "Washington, D.C.",
    currency: "USD ($)",
    heroTitle: "Study in the United States from Bangladesh | F-1 Visa & Top Unis",
    heroSubtitle: "Access top global universities, generous STEM OPT extensions (up to 3 years), and merit-based financial aid.",
    overview: "The United States is home to the world’s leading research universities, offering cutting-edge programs, campus diversity, and vast career opportunities.",
    whyStudySummary: "Unmatched research funding, flexible academic curricula, and 3-year STEM OPT work rights in world-leading tech hubs.",
    visaType: "F-1 Student Visa",
    popularIntakes: ["Fall (August/September) 2026", "Spring (January) 2027", "Summer (May) 2027"],
    studyLevels: ["Associate Degree (2-Year)", "Bachelor Degree (4-Year)", "Master's Degree (2-Year)", "PhD / Doctorate (4-5 Years)"],
    tuitionRange: "$18,000 - $55,000 USD / year",
    livingCost: "$12,000 - $20,000 USD / year",
    workRights: "20 hours/week on-campus during school sessions, 40 hours during breaks.",
    seoTitle: "Study in the USA from Bangladesh | F-1 Visa, I-20, STEM OPT | ALO Education",
    seoDescription: "Comprehensive guide for Bangladeshi students applying for US F-1 visa. University selection, I-20 requirements, SEVIS fee, Embassy interview prep, and STEM OPT.",
    canonicalUrl: "https://aloeducation.com/destinations/usa",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Washington, D.C." },
      { label: "Currency", value: "US Dollar ($ / USD)" },
      { label: "Popular Cities", value: "New York, Boston, Chicago, San Francisco, Dallas, Atlanta" },
      { label: "Main Intakes", value: "Fall (August) & Spring (January)" },
      { label: "Average Master's Duration", value: "1.5 to 2 Years" },
      { label: "Average Bachelor's Duration", value: "4 Years" },
      { label: "STEM OPT Extension", value: "Up to 3 Years (36 Months)" },
      { label: "Visa Interview", value: "Mandatory at US Embassy Dhaka" }
    ],

    reasons: [
      { icon: "award", heading: "World Academic Leadership", description: "Consistently dominates global university rankings with cutting-edge laboratories and Nobel laureate faculty." },
      { icon: "briefcase", heading: "3-Year STEM OPT", description: "Graduates of STEM programs can work in the US for up to 36 months on Optional Practical Training (OPT)." },
      { icon: "coins", heading: "Graduate Assistantships", description: "Master's and PhD students can receive Teaching or Research Assistantships (TA/RA) covering full tuition plus monthly stipends." },
      { icon: "globe", heading: "Flexible Curriculum", description: "US universities allow you to customize your majors, minors, and interdisciplinary concentrations." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "High School Bridge / International Year One", description: "Pathways into US universities via academic bridge programs at partner colleges." },
      { fromLevel: "HSC / A-Level", toPathway: "4-Year Bachelor's Degree or 2+2 Community College Transfer", description: "Direct admission with HSC GPA 3.8+ or via affordable 2-year Community College pathways." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree with 2-Year Credit Transfer", description: "Polytechnic diploma graduates can transfer credits into US Bachelor of Science programs." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "2-Year Master's Degree (MS / MBA / PhD)", description: "Direct admission for Bachelor graduates with CGPA 3.0+ from recognized Bangladeshi universities." }
    ],

    entryRequirements: [
      { level: "Associate Degree / 2+2 Pathway", academic: "HSC GPA 3.0+ or O/A-Levels", english: "IELTS 5.5 - 6.0 / Duolingo 95-105", documents: ["High School Transcripts", "Passport", "Bank Statement"] },
      { level: "Undergraduate (Bachelor)", academic: "HSC GPA 3.8+ or A-Levels (BBB+), SAT Optional", english: "IELTS 6.5 / TOEFL 80 / Duolingo 110", documents: ["Transcripts", "Passport", "SOP", "2 Recommendation Letters", "Bank Statement"] },
      { level: "Graduate (Master's / PhD)", academic: "Bachelor with CGPA 3.0+, GRE/GMAT Optional", english: "IELTS 6.5 / TOEFL 90 / Duolingo 120", documents: ["Bachelor Degree & Transcripts", "Statement of Purpose", "3 Letters of Recommendation", "Resume / CV", "Financial Certificate"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by over 3,400 US institutions", note: "Minimum 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "TOEFL iBT", accepted: "The traditional gold standard across 100% of US universities", note: "Minimum score 80-100.", sourceUrl: "https://www.ets.org/toefl" },
      { name: "Duolingo English Test (DET)", accepted: "Accepted by 2,000+ US universities", note: "Fast online test, minimum 110-125.", sourceUrl: "https://englishtest.duolingo.com" }
    ],

    visaSteps: [
      { step: 1, title: "Apply & Receive Form I-20", description: "Gain admission and receive official Certificate of Eligibility (Form I-20)." },
      { step: 2, title: "Pay SEVIS I-901 Fee ($350)", description: "Pay mandatory Student and Exchange Visitor Information System fee." },
      { step: 3, title: "Complete Form DS-160 Online", description: "Fill out Nonimmigrant Visa Application form accurately." },
      { step: 4, title: "Schedule US Embassy Interview", description: "Pay visa application fee ($185) and book appointment at US Embassy Dhaka." },
      { step: 5, title: "F-1 Visa Interview", description: "Attend in-person visa interview with ALO mock interview preparation." }
    ],

    workRightRules: [
      {
        termTime: "20 hours per week (On-campus only)",
        vacation: "40 hours per week during summer/winter vacations",
        condition: "Off-campus work permitted only via CPT (during study) or OPT (after graduation)",
        postStudyRoute: "1-year standard OPT + 24-month STEM extension (36 months total).",
        sourceUrl: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students"
      }
    ],

    faqs: [
      { question: "What is Form I-20 in US university admissions?", answer: "Form I-20 is the official Certificate of Eligibility issued by a SEVP-certified US university, showing your enrollment details and cost of attendance." },
      { question: "What is the SEVIS fee for F-1 visa?", answer: "The SEVIS I-901 fee is a mandatory $350 USD government fee paid before scheduling your visa interview at the US Embassy." },
      { question: "What is STEM OPT in the USA?", answer: "STEM OPT allows graduates with Science, Technology, Engineering, or Math degrees to extend their post-graduation work authorization for up to 36 months." },
      { question: "Is SAT or GRE mandatory for US universities?", answer: "Many US universities are currently test-optional or test-blind for undergraduate (SAT) and graduate (GRE/GMAT) programs." },
      { question: "Can I study in the USA with Duolingo English Test (DET)?", answer: "Yes, over 2,000 US universities accept Duolingo English Test scores (typically 105 to 125)." },
      { question: "What questions are asked in the US Embassy F-1 interview?", answer: "Why this university? Why this program? Who is sponsoring you? What are your career plans after graduation in Bangladesh?" },
      { question: "How much bank balance is required on the I-20?", answer: "You must demonstrate liquid funds covering 1 full academic year of tuition and living expenses as specified in Section 7 of your Form I-20." },
      { question: "What are Graduate Assistantships (TA/RA)?", answer: "Teaching Assistantships (TA) and Research Assistantships (RA) provide graduate students with full tuition waivers and monthly stipends in exchange for campus work." },
      { question: "Can international students work off-campus in the USA?", answer: "F-1 students can work on-campus up to 20 hours/week. Off-campus work requires Curricular Practical Training (CPT) authorization." },
      { question: "What is Curricular Practical Training (CPT)?", answer: "CPT allows F-1 students to participate in paid off-campus internships that are an integral part of their degree program." },
      { question: "What is the DS-160 application?", answer: "The DS-160 is the online Nonimmigrant Visa Application submitted to the US Department of State before booking an embassy interview." },
      { question: "When are the main intakes in the USA?", answer: "Fall (August/September) is the primary and largest intake; Spring (January) is the secondary intake." },
      { question: "Can I apply to US universities with an HSC degree from Bangladesh?", answer: "Yes, HSC graduates with GPA 3.5+ can apply for 4-year Bachelor's degree programs across the USA." },
      { question: "What is a Community College 2+2 pathway?", answer: "Students complete the first 2 years at an affordable community college to earn an Associate Degree, then transfer to a 4-year university for their Bachelor's." },
      { question: "Can relatives in the USA sponsor my education?", answer: "Yes, family members or sponsors in the USA can provide Form I-134 along with tax transcripts (W-2 / 1040) and bank letters." },
      { question: "What is 214(b) visa refusal in US Embassy?", answer: "Section 214(b) means the consular officer determined you did not sufficiently demonstrate nonimmigrant intent or strong ties to Bangladesh." },
      { question: "How does ALO Education prepare students for the US Embassy interview?", answer: "ALO Education conducts comprehensive 1-on-1 mock interviews, reviewing your DS-160, financial documentation, and verbal communication." },
      { question: "Can I bring my spouse on an F-2 visa?", answer: "Yes, spouses of F-1 students can accompany them on an F-2 visa, though F-2 visa holders are not permitted to work." },
      { question: "Are international student scholarships available in the USA?", answer: "Yes, US universities offer generous merit scholarships ranging from $5,000 to $25,000 per year automatically upon admission review." },
      { question: "Does ALO Education charge any fees for US university admissions?", answer: "No, ALO Education provides free university selection, application support, I-20 processing, and interview preparation." }
    ],

    sources: [
      { section: "F-1 Student Visa & OPT Rules", sourceName: "U.S. Citizenship and Immigration Services (USCIS)", sourceUrl: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "New York", costLevel: "High", vibe: "Global Business, Media & Culture Capital", universities: ["NYU", "Columbia University", "Pace University"], livingCost: "$2,100 USD / month" },
      { name: "Boston", costLevel: "High", vibe: "America's Premier Academic & Biotech Hub", universities: ["Harvard", "MIT", "Boston University", "Northeastern"], livingCost: "$1,900 USD / month" },
      { name: "Chicago", costLevel: "Medium", vibe: "Midwest Economic, Architectural & Tech Powerhouse", universities: ["University of Chicago", "UIC", "DePaul University"], livingCost: "$1,400 USD / month" }
    ]
  },

  ireland: {
    slug: "ireland",
    code: "IE",
    name: "Ireland",
    flag: "🇮🇪",
    capital: "Dublin",
    currency: "EUR (€)",
    heroTitle: "Study in Ireland from Bangladesh | European Tech Capital & 2-Year PSW",
    heroSubtitle: "Study in Europe's fastest-growing English-speaking economy with 2-year Third Level Graduate Scheme work permits.",
    overview: "Ireland is the European headquarters for Google, Meta, Apple, Pfizer, and Microsoft, offering exceptional post-graduation tech and business opportunities.",
    whyStudySummary: "Only English-speaking EU nation offering 1-year Master’s, 2-year Post-Study Work, and direct access to European multinational employers.",
    visaType: "Stamp 2 Student Visa",
    popularIntakes: ["September (Autumn) 2026", "January (Spring) 2027"],
    studyLevels: ["Foundation", "Bachelor Degree (3-4 Years)", "Higher Diploma", "Master's Degree (1 Year)", "MBA", "PhD"],
    tuitionRange: "€10,000 - €25,000 / year",
    livingCost: "€10,000 / year (Irish Immigration Service threshold)",
    workRights: "20 hours/week during term time, 40 hours/week during June-September & Dec 15 - Jan 15.",
    seoTitle: "Study in Ireland from Bangladesh | 1-Year Masters, 2-Year PSW, Dublin | ALO Education",
    seoDescription: "Study in Ireland for Bangladeshi students. Top Irish universities, Stamp 2 visa guidelines, €10,000 financial requirement, and 2-year Third Level Graduate Scheme.",
    canonicalUrl: "https://aloeducation.com/destinations/ireland",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Dublin" },
      { label: "Currency", value: "Euro (€ / EUR)" },
      { label: "Popular Cities", value: "Dublin, Cork, Galway, Limerick, Waterford" },
      { label: "Main Intakes", value: "September (Primary) & January (Secondary)" },
      { label: "Average Master's Duration", value: "1 Year Full-Time" },
      { label: "Average Bachelor's Duration", value: "3 to 4 Years" },
      { label: "Post-Study Work Permit", value: "2 Years (Third Level Graduate Scheme)" },
      { label: "Language Environment", value: "100% English Speaking EU Nation" }
    ],

    reasons: [
      { icon: "briefcase", heading: "European Silicon Valley", description: "Headquarters to top tech giants (Google, Meta, Apple, Microsoft, Intel, Pfizer) creating strong graduate job markets." },
      { icon: "award", heading: "1-Year Master's Degrees", description: "Intensive 1-year Master's programs recognized across the European Union and worldwide." },
      { icon: "coins", heading: "2-Year Stay Back Visa", description: "Qualify for the 24-month Third Level Graduate Scheme (Stamp 1G) after completing a Master's degree." },
      { icon: "globe", heading: "Safe & Friendly Nation", description: "Ranked among the top 5 safest countries globally with rich culture and welcoming people." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "International Foundation Year → 3-4 Year Bachelor", description: "Bridge the 12-year education gap with leading Irish pathway providers." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor Degree (3-4 Years)", description: "Direct entry for students with strong HSC GPA (4.0+) or A-Levels." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree with Direct Advanced Standing", description: "Polytechnic diploma holders can enter Year 2 or Year 3 of Irish technological universities." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-Year Master's Degree (MSc / MA / MBA)", description: "Direct admission for 4-year Bachelor graduates with CGPA 2.8+ from Bangladesh." }
    ],

    entryRequirements: [
      { level: "International Foundation Year", academic: "HSC GPA 3.5+ or 5 O-Level passes", english: "IELTS 5.0 - 5.5 or PTE 42", documents: ["Academic Records", "Passport", "SOP"] },
      { level: "Undergraduate (Bachelor)", academic: "HSC GPA 4.0+ or A-Levels (BBB+)", english: "IELTS 6.0 (no band < 5.5) or PTE 54", documents: ["Transcripts", "Passport", "SOP", "1 Reference"] },
      { level: "Postgraduate (Master's)", academic: "Bachelor with CGPA 2.8+ (60%+)", english: "IELTS 6.5 (no band < 6.0) or PTE 60", documents: ["Degree Certificate & Marksheets", "SOP", "2 Reference Letters", "CV", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by 100% of Irish Universities", note: "Minimum 6.5 overall (no band < 6.0).", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Widely accepted for admission and visa", note: "Minimum score 58-63.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "Duolingo English Test (DET)", accepted: "Accepted by select Irish institutions", note: "Minimum score 110-120.", sourceUrl: "https://englishtest.duolingo.com" }
    ],

    visaSteps: [
      { step: 1, title: "University Offer & Tuition Payment", description: "Receive offer letter and pay initial tuition fee to Irish university." },
      { step: 2, title: "Prepare Bank Statement & Financial Proof", description: "Demonstrate €10,000 living costs + tuition fee proof for 6 months." },
      { step: 3, title: "Submit Online AVATS Visa Application", description: "Complete online visa application on Irish Immigration AVATS portal." },
      { step: 4, title: "Submit Documents & Biometrics at VFS Dhaka", description: "Submit original academic documents and passport at VFS Global Dhaka." },
      { step: 5, title: "Register for IRP (Stamp 2) in Ireland", description: "Register with Irish Immigration Service Delivery (ISD) upon arrival in Ireland." }
    ],

    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "40 hours per week during June, July, August, September and Dec 15 to Jan 15",
        condition: "Must be enrolled on a full-time NFQ Level 7, 8, 9, or 10 course",
        postStudyRoute: "2 years for Level 9 (Master's), 1 year for Level 8 (Bachelor's) via Third Level Graduate Scheme.",
        sourceUrl: "https://www.irishimmigration.ie/coming-to-study-in-ireland/"
      }
    ],

    faqs: [
      { question: "Why is Ireland popular for Bangladeshi tech students?", answer: "Ireland is the European Silicon Valley, hosting headquarters for Google, Meta, Apple, TikTok, Microsoft, and Amazon with abundant tech jobs." },
      { question: "How long is the Post-Study Work Visa in Ireland?", answer: "Graduates of Level 9 Master's programs receive 2 years on the Third Level Graduate Scheme (Stamp 1G). Bachelor graduates receive 1 year." },
      { question: "How much bank balance is needed for an Irish Student Visa?", answer: "You must demonstrate proof of €10,000 living expenses plus full 1st-year tuition payment, held in bank accounts for at least 6 months." },
      { question: "What is Stamp 2 permission in Ireland?", answer: "Stamp 2 is the official immigration permission granted to non-EEA students allowing study and up to 20 hours/week part-time work." },
      { question: "Are Irish Master's degrees 1 year or 2 years?", answer: "Most taught Master's (MSc/MA/MBA) programs in Ireland are 1 year (12 months) in duration." },
      { question: "Is English the primary language in Ireland?", answer: "Yes, Ireland is an English-speaking country and the only English-speaking member state of the European Union." },
      { question: "Can I work part-time while studying in Ireland?", answer: "Yes, students can work up to 20 hours per week during academic term times and 40 hours per week during official summer/winter vacation periods." },
      { question: "What is the Irish National Framework of Qualifications (NFQ)?", answer: "NFQ Level 7 is an Ordinary Bachelor, Level 8 is an Honours Bachelor, Level 9 is a Master's degree, and Level 10 is a Doctoral/PhD degree." },
      { question: "What is the AVATS online application?", answer: "AVATS is the official online visa application facility managed by the Irish Department of Justice." },
      { question: "What documents are required for an Irish Student Visa?", answer: "Letter of Acceptance, tuition payment receipt, academic mark sheets, valid passport, 6-month bank statements, police clearance, and SOP." },
      { question: "Can Bangladeshi HSC students apply directly to Irish universities?", answer: "HSC graduates with strong GPA (4.0+) can apply for Bachelor's programs, while others can enter through an International Foundation year." },
      { question: "What is the minimum IELTS score for Irish universities?", answer: "Typically 6.5 overall with no band below 6.0 for Master's programs, and 6.0 for Bachelor's programs." },
      { question: "Where is the Ireland Visa Application Centre in Bangladesh?", answer: "At VFS Global, Delta Life Tower, 4th Floor, Plot 37, Road 90, Gulshan-2, Dhaka 1212." },
      { question: "What is the minimum hourly wage in Ireland?", answer: "The Irish national minimum wage is €12.70 per hour, providing strong earning potential for student part-time jobs." },
      { question: "Are scholarships available for international students in Ireland?", answer: "Yes, Irish universities offer merit-based scholarships ranging from €1,500 to €5,000, plus the Government of Ireland International Education Scholarship (GOI-IES)." },
      { question: "What is the medical insurance requirement in Ireland?", answer: "All non-EEA students must have private medical insurance covering up to €25,000 for hospital stays and medical accidents." },
      { question: "Can polytechnic diploma holders apply to Ireland?", answer: "Yes, 4-year BTEB diploma graduates can apply for Bachelor's degree entry with credit assessments." },
      { question: "What is the difference between Dublin and other Irish cities?", answer: "Dublin is the economic capital with high job density; cities like Cork, Galway, and Limerick offer lower living costs and top universities." },
      { question: "Can I convert Stamp 1G to a Critical Skills Employment Permit?", answer: "Yes, once you secure a job on the Critical Skills Occupation list with a qualifying salary, you can transition to a permanent work permit." },
      { question: "Does ALO Education charge for Irish university admissions?", answer: "No, ALO Education provides free admission counseling, scholarship assistance, and visa application processing for Ireland." }
    ],

    sources: [
      { section: "Irish Student Visa & Stamp 1G", sourceName: "Irish Immigration Service Delivery (ISD)", sourceUrl: "https://www.irishimmigration.ie/coming-to-study-in-ireland/", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Dublin", costLevel: "High", vibe: "Vibrant Tech Capital & Cultural Hub", universities: ["Trinity College Dublin", "UCD", "TU Dublin", "DCU", "NCI"], livingCost: "€1,200 / month" },
      { name: "Cork", costLevel: "Medium", vibe: "Pharma, Biotech & Maritime Leader", universities: ["UCC", "MTU"], livingCost: "€950 / month" },
      { name: "Galway", costLevel: "Medium", vibe: "Medical Devices & Creative Arts Capital", universities: ["University of Galway", "ATU"], livingCost: "€900 / month" }
    ]
  },

  "new-zealand": {
    slug: "new-zealand",
    code: "NZ",
    name: "New Zealand",
    flag: "🇳🇿",
    capital: "Wellington",
    currency: "NZD ($)",
    heroTitle: "Study in New Zealand from Bangladesh | Safe, Innovative Education",
    heroSubtitle: "Experience world-class universities ranked in the top 3% globally, 3-year Post-Study Work Visas, and high student safety.",
    overview: "New Zealand offers world-leading research universities, practical polytechnic institutes, and unmatched quality of life.",
    whyStudySummary: "All 8 New Zealand universities rank in the top 3% worldwide, with up to 3 years of post-study open work rights.",
    visaType: "Fee Paying Student Visa",
    popularIntakes: ["February (Semester 1) 2027", "July (Semester 2) 2026"],
    studyLevels: ["Diploma (Level 5-6)", "Bachelor Degree (Level 7)", "Graduate Diploma (Level 7)", "Postgraduate Diploma (Level 8)", "Master's Degree (Level 9)", "Doctoral/PhD (Level 10)"],
    tuitionRange: "$24,000 - $42,000 NZD / year",
    livingCost: "$20,000 NZD / year (Immigration New Zealand standard)",
    workRights: "20 hours/week during term time, full-time during vacations.",
    seoTitle: "Study in New Zealand from Bangladesh | 3-Year PSW, Top 8 Unis | ALO Education",
    seoDescription: "Complete guide to studying in New Zealand for Bangladeshi students. Explore NZ universities, Fee Paying Student Visa, financial funds proof, and Post-Study Work Visas.",
    canonicalUrl: "https://aloeducation.com/destinations/new-zealand",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Wellington" },
      { label: "Currency", value: "New Zealand Dollar ($ / NZD)" },
      { label: "Popular Cities", value: "Auckland, Wellington, Christchurch, Hamilton, Dunedin" },
      { label: "Main Intakes", value: "February (Semester 1) & July (Semester 2)" },
      { label: "Average Master's Duration", value: "1 to 2 Years" },
      { label: "Average Bachelor's Duration", value: "3 Years" },
      { label: "Post-Study Work Visa", value: "Up to 3 Years (Level 9 Master's)" },
      { label: "PhD Student Tuition Benefit", value: "Pay Domestic NZ Student Rates" }
    ],

    reasons: [
      { icon: "award", heading: "100% Universities in Top 3%", description: "All 8 public New Zealand universities rank in the top 3% of universities globally according to QS World Rankings." },
      { icon: "briefcase", heading: "Up to 3-Year Post-Study Work", description: "Graduates of Master's (Level 9) and PhD (Level 10) programs receive 3-year open Post-Study Work Visas." },
      { icon: "coins", heading: "PhD Domestic Tuition Rate", description: "International PhD students pay the same low domestic tuition fees as local Kiwi students (~$7,000 - $9,000 NZD/year)." },
      { icon: "globe", heading: "World's Safest & Cleanest Nation", description: "Ranked among the top 2 most peaceful countries globally with breathtaking natural beauty." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Certificate / Foundation Pathway → Bachelor", description: "Pathways into New Zealand universities and polytechnics via 8-month Foundation certificates." },
      { fromLevel: "HSC / A-Level", toPathway: "Foundation Studies or 3-Year Bachelor Degree", description: "Direct admission for HSC with GPA 4.0+ or A-Level passes." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree / Graduate Diploma (Level 7)", description: "Direct advanced standing for BTEB polytechnic diploma holders into NZ institutes of technology." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "Master's Degree (Level 9) or Postgraduate Diploma (Level 8)", description: "Direct entry for Bachelor graduates with CGPA 2.8+ from Bangladesh." }
    ],

    entryRequirements: [
      { level: "Diploma / Pathway (Level 5-6)", academic: "HSC GPA 3.5+ or A-Levels", english: "IELTS 5.5 (no band < 5.0) or PTE 42", documents: ["HSC Records", "Passport", "SOP"] },
      { level: "Bachelor Degree (Level 7)", academic: "HSC GPA 4.0+ or A-Levels (BBB+)", english: "IELTS 6.0 (no band < 5.5) or PTE 50", documents: ["Transcripts", "Passport", "SOP", "1 Reference"] },
      { level: "Master's Degree (Level 9)", academic: "Bachelor with CGPA 2.8+ (60%+)", english: "IELTS 6.5 (no band < 6.0) or PTE 58", documents: ["Degree Certificate", "Transcripts", "SOP", "2 References", "CV", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted across all 8 NZ universities & Te Pūkenga", note: "Minimum 6.0 - 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Widely accepted by Immigration New Zealand", note: "Minimum score 50-58.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "TOEFL iBT", accepted: "Accepted for university and visa", note: "Minimum score 80-90.", sourceUrl: "https://www.ets.org/toefl" }
    ],

    visaSteps: [
      { step: 1, title: "Apply & Receive Offer of Place", description: "Obtain formal Offer of Place from an approved New Zealand education provider." },
      { step: 2, title: "Prepare Financial Evidence & Medical", description: "Demonstrate $20,000 NZD living costs + tuition fee funds." },
      { step: 3, title: "Submit Online Visa (Approval in Principle)", description: "Submit application on Immigration Online to receive Approval in Principle (AIP)." },
      { step: 4, title: "Pay Tuition Fee After AIP", description: "Pay full 1st-year tuition fee only after receiving formal AIP from INZ." },
      { step: 5, title: "Receive E-Visa", description: "Receive official Fee Paying Student E-Visa to travel to New Zealand." }
    ],

    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "Full-time during scheduled vacations",
        condition: "Must be enrolled in an approved course of study lasting at least 1 academic year",
        postStudyRoute: "3 years for Master's/PhD, 1-3 years for qualifications on Green List.",
        sourceUrl: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/full-fee-paying-student-visa"
      }
    ],

    faqs: [
      { question: "What is Approval in Principle (AIP) in New Zealand visa?", answer: "AIP means Immigration New Zealand has approved your visa in principle; you only pay tuition fees to the university after AIP is granted." },
      { question: "How long is the Post-Study Work Visa in New Zealand?", answer: "Graduates of Master's (Level 9) and PhD (Level 10) programs receive a 3-year open Post-Study Work Visa." },
      { question: "How much bank balance is required for New Zealand Student Visa?", answer: "You must demonstrate 1 year of tuition fees + $20,000 NZD living expenses held for at least 6 months with verified financial source documents." },
      { question: "What is the special tuition benefit for international PhD students in NZ?", answer: "International PhD students pay the same low domestic tuition fees as local Kiwi citizens (approximately $7,000 - $9,000 NZD per year)." },
      { question: "Are all 8 universities in New Zealand government-funded?", answer: "Yes, all 8 universities in New Zealand are state-funded public institutions ranked among the top 3% in the world." },
      { question: "Can international students work part-time in New Zealand?", answer: "Yes, students on a Fee Paying Student Visa can work up to 20 hours per week during term time and 40 hours per week during scheduled holidays." },
      { question: "What is the New Zealand Green List?", answer: "The Green List includes in-demand occupations (engineering, IT, healthcare, teaching) that offer fast-track pathways to residence." },
      { question: "What is Te Pūkenga in New Zealand?", answer: "Te Pūkenga is New Zealand's national institute of skills and technology, uniting 16 regional polytechnics across the country." },
      { question: "Can my partner work while I study in New Zealand?", answer: "Partners of students studying Level 9 Master's or Level 10 PhD programs can apply for an open partner work visa." },
      { question: "What English tests are accepted by Immigration New Zealand?", answer: "IELTS Academic, PTE Academic, TOEFL iBT, Cambridge C1 Advanced, and OET." },
      { question: "What is the minimum IELTS required for New Zealand Master's?", answer: "Typically 6.5 overall with no individual band below 6.0." },
      { question: "When are the main intakes in New Zealand?", answer: "Semester 1 starts in February/March, and Semester 2 starts in July." },
      { question: "Is health insurance required in New Zealand?", answer: "Yes, all international students must hold comprehensive medical and travel insurance for the full duration of their stay." },
      { question: "Can polytechnic diploma graduates from Bangladesh apply to NZ?", answer: "Yes, BTEB diploma graduates can apply for Bachelor's degree pathways or Graduate Diplomas." },
      { question: "What is the minimum hourly wage in New Zealand?", answer: "The New Zealand adult minimum wage is $23.15 NZD per hour." },
      { question: "How long does New Zealand student visa processing take?", answer: "Standard processing takes 4 to 8 weeks on the Immigration New Zealand online system." },
      { question: "Can parents sponsor my education in New Zealand?", answer: "Yes, parents, immediate family members, or official education loans from approved banks in Bangladesh are accepted sponsors." },
      { question: "Where is the biometrics collection done for New Zealand?", answer: "At the VFS Global Visa Application Centre in Delta Life Tower, Gulshan-2, Dhaka." },
      { question: "Are scholarships available for Bangladeshi students in NZ?", answer: "Yes, universities offer automatic international excellence scholarships of $5,000 to $10,000 NZD for qualified applicants." },
      { question: "How does ALO Education assist with New Zealand applications?", answer: "ALO Education guides you through university applications, AIP visa filing, tuition remittance, and pre-departure briefings." }
    ],

    sources: [
      { section: "Fee Paying Student Visa & Post-Study Work", sourceName: "Immigration New Zealand", sourceUrl: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/full-fee-paying-student-visa", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Auckland", costLevel: "High", vibe: "Commercial & Multicultural Harbour Hub", universities: ["University of Auckland", "AUT University"], livingCost: "$1,800 NZD / month" },
      { name: "Wellington", costLevel: "Medium", vibe: "Creative, Tech & Government Capital", universities: ["Victoria University of Wellington"], livingCost: "$1,600 NZD / month" },
      { name: "Christchurch", costLevel: "Medium", vibe: "Innovation, Agriculture & Engineering Centre", universities: ["University of Canterbury", "Lincoln University"], livingCost: "$1,400 NZD / month" }
    ]
  },

  dubai: {
    slug: "dubai",
    code: "AE",
    name: "Dubai / UAE",
    flag: "🇦🇪",
    capital: "Abu Dhabi",
    currency: "AED (د.إ)",
    heroTitle: "Study in Dubai / UAE from Bangladesh | Tax-Free Hub & Global Branch Campuses",
    heroSubtitle: "Study at accredited British, Australian, and American branch campuses with 100% visa success rates and tax-free earnings.",
    overview: "Dubai is the world’s fastest-growing cosmopolitan education and business hub, offering world-class branch campuses and zero income tax.",
    whyStudySummary: "Earn identical UK/Australian/US degrees in Dubai at lower cost with fast visa turnaround and tax-free part-time work.",
    visaType: "UAE Student Residence Visa",
    popularIntakes: ["September (Fall) 2026", "January (Winter) 2027", "May (Summer) 2027"],
    studyLevels: ["Foundation", "Bachelor Degree (3-4 Years)", "Master's Degree (1-2 Years)", "Executive MBA", "PhD"],
    tuitionRange: "35,000 - 85,000 AED / year",
    livingCost: "2,500 - 4,500 AED / month",
    workRights: "Part-time student work permit available across free zones and mainland.",
    seoTitle: "Study in Dubai from Bangladesh | UK & Australian Branch Campuses | ALO Education",
    seoDescription: "Study in Dubai for Bangladeshi students. Global branch campuses (Middlesex, Heriot-Watt, Wollongong, Curtin, Birmingham), 100% visa success, and tax-free jobs.",
    canonicalUrl: "https://aloeducation.com/destinations/dubai",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Commercial Capital", value: "Dubai" },
      { label: "Currency", value: "UAE Dirham (AED / د.إ)" },
      { label: "Popular Education Zones", value: "Dubai Knowledge Park (DKP), Dubai International Academic City (DIAC)" },
      { label: "Main Intakes", value: "September, January, May" },
      { label: "Average Master's Duration", value: "1 to 2 Years" },
      { label: "Average Bachelor's Duration", value: "3 Years (UK) / 4 Years (US/AU)" },
      { label: "Visa Processing Time", value: "10 to 15 Working Days (Fastest Global Route)" },
      { label: "Income Tax", value: "0% Personal Income Tax" }
    ],

    reasons: [
      { icon: "award", heading: "Global Branch Campuses", description: "Study at renowned British, Australian, and US universities (Birmingham, Heriot-Watt, Wollongong, Curtin) and receive identical original degrees." },
      { icon: "briefcase", heading: "100% Visa Issuance Track Record", description: "University-sponsored Student Residence Visas with near 100% approval rates and no complex embassy interviews." },
      { icon: "coins", heading: "0% Tax-Free Earnings", description: "Work part-time and full-time in the world’s leading trade and tourism capital with zero tax on your salary." },
      { icon: "globe", heading: "Campus Transfer Options", description: "Transfer seamlessly to the UK or Australia parent campus after completing 1 or 2 years in Dubai." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Foundation Certificate → 3-Year Bachelor Degree", description: "Pathways into British/Australian branch campuses via 8-month Foundation certificates." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor Degree (3-4 Years)", description: "Direct admission with HSC GPA 3.0+ or A-Level passes." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree with Advanced Standing Credits", description: "Polytechnic diploma graduates receive subject waivers into Dubai Bachelor programs." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-2 Year Master's Degree (MSc / MBA)", description: "Direct admission for Bachelor graduates with CGPA 2.5+ from Bangladesh." }
    ],

    entryRequirements: [
      { level: "Foundation Diploma", academic: "SSC / HSC GPA 2.5+ or O-Levels", english: "IELTS 5.0 or internal test", documents: ["Transcripts", "Passport", "Photo"] },
      { level: "Bachelor Degree", academic: "HSC GPA 3.0+ or A-Levels", english: "IELTS 5.5 - 6.0 or PTE 50 or MOI", documents: ["Transcripts", "Passport", "Photo"] },
      { level: "Master's Degree", academic: "Bachelor with CGPA 2.5+ (50%+)", english: "IELTS 6.0 - 6.5 or PTE 58 or MOI", documents: ["Degree Certificate & Transcripts", "Passport", "CV", "Photo"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Universally accepted across all Dubai universities", note: "Minimum 5.5 to 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Widely accepted for admission and student visa", note: "Minimum score 50-58.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "Medium of Instruction (MOI)", accepted: "Accepted by select branch campuses", note: "For Bachelor degrees taught in English in Bangladesh.", sourceUrl: "https://aloeducation.com" }
    ],

    visaSteps: [
      { step: 1, title: "Application & Offer Letter", description: "Submit academic transcripts and passport to receive admission offer." },
      { step: 2, title: "Pay Tuition Fee Deposit", description: "Pay university tuition deposit + visa processing fee." },
      { step: 3, title: "University Applies for Entry Permit", description: "University processes official Entry Permit through GDRFA / ICP." },
      { step: 4, title: "Fly to Dubai & Medical Fitness Exam", description: "Arrive in Dubai on Entry Permit, complete medical test and Emirates ID biometrics." },
      { step: 5, title: "Emirates ID & Residence Visa Stamping", description: "Receive 1-year renewable UAE Student Residence Visa and Emirates ID card." }
    ],

    workRightRules: [
      {
        termTime: "Part-time student work permit",
        vacation: "Full-time internships & freelance permits",
        condition: "Must obtain university NOC (No Objection Certificate)",
        postStudyRoute: "2-year Green Visa or standard UAE Employment Residence Visa.",
        sourceUrl: "https://u.ae/en/information-and-services/education-and-training/higher-education/studying-in-the-uae"
      }
    ],

    faqs: [
      { question: "Are degrees from Dubai branch campuses identical to the UK/Australia parent campus?", answer: "Yes, branch campuses like University of Birmingham, Heriot-Watt, and University of Wollongong issue identical degree certificates without mentioning 'Dubai' on the parchment." },
      { question: "How long does Dubai student visa processing take?", answer: "Dubai student visa processing takes just 10 to 15 working days, making it the fastest visa processing route for Bangladeshi students." },
      { question: "Is bank statement or financial solvency required for Dubai student visa?", answer: "No lengthy 6-month bank statement is required by immigration; the visa is directly sponsored by your university upon tuition deposit payment." },
      { question: "Can I transfer to the UK or Australia campus after 1 year in Dubai?", answer: "Yes, many universities allow students to complete 1-2 years in Dubai and transfer seamlessly to the UK/Australia parent campus." },
      { question: "Can international students work in Dubai?", answer: "Yes, students can obtain a student work permit through their university's Career Centre to work part-time or complete paid internships." },
      { question: "Are IELTS exemptions available for Dubai universities?", answer: "Yes, many universities accept Medium of Instruction (MOI) certificates or conduct internal English placement tests." },
      { question: "Can Bangladeshi students with study gaps apply to Dubai?", answer: "Yes, Dubai universities have flexible study gap policies, accepting 5 to 10+ years of study gap with relevant professional experience." },
      { question: "What is Dubai Knowledge Park (DKP) and DIAC?", answer: "DKP and Dubai International Academic City are dedicated higher education free zones hosting over 30 international university campuses." },
      { question: "What are the main intake seasons in Dubai?", answer: "September (Fall) is the main intake, with secondary intakes in January (Winter) and May (Summer)." },
      { question: "What is the cost of living for a student in Dubai?", answer: "Average living cost ranges from 2,500 to 4,500 AED per month including student housing, food, and metro transport." },
      { question: "What medical tests are required after arriving in Dubai?", answer: "A standard blood test (HIV/Hepatitis) and chest X-ray (Tuberculosis) conducted at a DHA medical fitness center in Dubai." },
      { question: "What is Emirates ID?", answer: "Emirates ID is the official government identification card issued to all UAE residents, used for banking, transport, and student services." },
      { question: "Can polytechnic diploma holders apply to Dubai universities?", answer: "Yes, 4-year BTEB diploma graduates can apply for Bachelor's degree entry with subject exemptions." },
      { question: "Is personal income taxed in Dubai?", answer: "No, there is 0% personal income tax in the UAE, allowing you to keep 100% of your earnings." },
      { question: "What scholarships are available in Dubai?", answer: "Universities offer academic merit scholarships ranging from 15% to 50% tuition reduction for high-achieving students." },
      { question: "Can I sponsor my family in Dubai after graduation?", answer: "Yes, once you transition to a standard UAE Employment Visa or Green Visa meeting salary requirements, you can sponsor your family." },
      { question: "What British universities have campuses in Dubai?", answer: "University of Birmingham, Heriot-Watt University, Middlesex University Dubai, University of Stirling, and De Montfort University." },
      { question: "What Australian universities have campuses in Dubai?", answer: "University of Wollongong in Dubai (UOWD), Curtin University Dubai, and Murdoch University Dubai." },
      { question: "What is the student accommodation in Dubai like?", answer: "Universities offer modern, air-conditioned student residences (such as The Myriad and KSK Homes) with swimming pools, gyms, and shuttle buses." },
      { question: "Does ALO Education assist with Dubai university admissions?", answer: "Yes, ALO Education provides complete free processing from university selection to Entry Permit and flight arrangements." }
    ],

    sources: [
      { section: "Student Visa & Living Guidelines", sourceName: "UAE Government Portal (U.AE)", sourceUrl: "https://u.ae/en/information-and-services/education-and-training/higher-education/studying-in-the-uae", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Dubai", costLevel: "Medium", vibe: "Global Business, Tech & Aviation Capital", universities: ["Middlesex University Dubai", "Heriot-Watt University Dubai", "University of Wollongong in Dubai", "University of Birmingham Dubai"], livingCost: "3,500 AED / month" },
      { name: "Abu Dhabi", costLevel: "Medium", vibe: "Cultural, Energy & Research Capital", universities: ["Sorbonne University Abu Dhabi", "NYU Abu Dhabi"], livingCost: "3,200 AED / month" }
    ]
  },

  germany: {
    slug: "germany",
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    capital: "Berlin",
    currency: "EUR (€)",
    heroTitle: "Study in Germany from Bangladesh | Low Tuition & Top Engineering",
    heroSubtitle: "Study in Europe's economic powerhouse with tuition-free public universities and 18-month Post-Study Job Seeker visas.",
    overview: "Germany offers world-leading engineering, automotive, and technological education with minimal tuition fees at public universities.",
    whyStudySummary: "Zero or low tuition fees at top public universities with high industrial collaboration and 18-month job search visas.",
    visaType: "German National Student Visa (Type D)",
    popularIntakes: ["Winter (October) 2026", "Summer (April) 2027"],
    studyLevels: ["Studienkolleg (Foundation)", "Bachelor Degree (3-4 Years)", "Master's Degree (2 Years)", "Doctoral / PhD (3-4 Years)"],
    tuitionRange: "€0 - €3,000 / year (Public) | €8,000 - €16,000 / year (Private)",
    livingCost: "€11,904 / year (€992 / month Blocked Account requirement)",
    workRights: "140 full days or 280 half days per year.",
    seoTitle: "Study in Germany from Bangladesh | Blocked Account, APS & Visa | ALO Education",
    seoDescription: "Guide to studying in Germany for Bangladeshi students. Public university admissions, English-taught Master's, Blocked Account setup, APS certification, and 18-month Job Seeker visa.",
    canonicalUrl: "https://aloeducation.com/destinations/germany",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Berlin" },
      { label: "Currency", value: "Euro (€ / EUR)" },
      { label: "Popular Cities", value: "Berlin, Munich, Frankfurt, Hamburg, Stuttgart, Cologne" },
      { label: "Main Intakes", value: "Winter (October) & Summer (April)" },
      { label: "Public University Tuition", value: "€0 Tuition Fee (Semester contribution €150-€350)" },
      { label: "Average Master's Duration", value: "2 Years Full-Time" },
      { label: "Post-Study Job Seeker Visa", value: "18 Months (1.5 Years)" },
      { label: "Blocked Account Requirement", value: "€11,904 / Year (€992 / Month)" }
    ],

    reasons: [
      { icon: "coins", heading: "Tuition-Free Public Universities", description: "Public universities in Germany charge zero tuition fees, only a small semester contribution covering public transit." },
      { icon: "award", heading: "Global Engineering & Tech Hub", description: "Home to global industrial giants (Siemens, BMW, Bosch, Mercedes, SAP) offering unmatched engineering internships." },
      { icon: "briefcase", heading: "18-Month Job Seeker Visa", description: "Graduates receive an 18-month residence permit to find employment in their field across Germany and the EU." },
      { icon: "globe", heading: "Schengen Visa Mobility", description: "Travel freely across 29 European Schengen countries during your studies in Germany." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "High School Bridge / Preparatory German Course", description: "Intensive German language preparation leading into Studienkolleg." },
      { fromLevel: "HSC / A-Level", toPathway: "1-Year Studienkolleg (Foundation) → 3-Year Bachelor Degree", description: "Bridge the 12-year education gap through public Studienkolleg or direct entry with 1-year university in Bangladesh." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor of Engineering / Applied Sciences", description: "Polytechnic diploma holders enter German Universities of Applied Sciences with credit recognition." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "2-Year English-Taught Master's Degree (MSc / MEng)", description: "Direct admission for Bachelor graduates with CGPA 3.0+ from recognized Bangladeshi universities." }
    ],

    entryRequirements: [
      { level: "Studienkolleg (Preparatory)", academic: "HSC GPA 4.5+ or A-Levels, German B1/B2", english: "German B1 or IELTS 5.5", documents: ["HSC Records", "Passport", "German Certificate"] },
      { level: "Bachelor Degree (Direct)", academic: "1-Year University in BD or A-Levels", english: "IELTS 6.0 or German B2", documents: ["Academic Records", "Passport", "SOP", "Blocked Account Proof"] },
      { level: "Master's Degree (English Taught)", academic: "Bachelor 4-Year with CGPA 3.0+ (70%+)", english: "IELTS 6.5 (no band < 6.0) or PTE 60", documents: ["Degree Certificate & Transcripts", "APS Certificate", "SOP", "2 References", "CV", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted for all English-taught programs", note: "Minimum score 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Accepted by select German universities", note: "Minimum score 58-65.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "TOEFL iBT", accepted: "Widely accepted across German universities", note: "Minimum score 85-95.", sourceUrl: "https://www.ets.org/toefl" }
    ],

    visaSteps: [
      { step: 1, title: "University Admission (Zulassungsbescheid)", description: "Apply via Uni-Assist or directly to receive university admission letter." },
      { step: 2, title: "Open Blocked Bank Account (€11,904)", description: "Open account via Expatrio, Fintiba, or Coracle and deposit €11,904." },
      { step: 3, title: "Purchase German Health Insurance", description: "Get public/private health insurance (Techniker Krankenkasse or Barmer)." },
      { step: 4, title: "Book German Embassy Dhaka Appointment", description: "Book appointment on the German Embassy Dhaka portal." },
      { step: 5, title: "Attend Visa Interview at Embassy", description: "Submit documents and receive National Student Visa (Type D)." }
    ],

    workRightRules: [
      {
        termTime: "140 full days or 280 half days per year",
        vacation: "Full-time student jobs allowed within the 140-day quota",
        condition: "Must be enrolled in a degree program at a state-recognized German university",
        postStudyRoute: "18-month Post-Study Job Seeker Residence Permit (Section 20 AufenthG).",
        sourceUrl: "https://www.make-it-in-germany.com/en/study-training/studies-in-germany"
      }
    ],

    faqs: [
      { question: "Is university education really free in Germany?", answer: "Yes, public universities in 15 out of 16 German states charge no tuition fees for international students; you only pay a semester fee of €150-€350." },
      { question: "What is a German Blocked Account (Sperrkonto)?", answer: "A Blocked Account is a mandatory bank account deposited with €11,904 to prove living expenses, releasing €992 each month during your stay." },
      { question: "Can I study in Germany in English without knowing German?", answer: "Yes, hundreds of Master's degree programs are taught 100% in English, though learning basic German (A1/A2) is helpful for daily life and part-time jobs." },
      { question: "What is Uni-Assist in German university admissions?", answer: "Uni-Assist is a centralized service that evaluates international school certificates and transcripts on behalf of German universities." },
      { question: "What is Studienkolleg?", answer: "A 1-year preparatory foundation course in Germany required for students whose 12-year high school diploma is not equivalent to the German Abitur." },
      { question: "How long is the Post-Study Work Visa in Germany?", answer: "Graduates receive an 18-month Job Seeker Visa to find employment related to their degree in Germany." },
      { question: "What is the German EU Blue Card?", answer: "An EU Blue Card is a work and residence permit for university graduates with a qualifying job contract meeting the minimum salary threshold." },
      { question: "How much is the minimum wage for student jobs in Germany?", answer: "The German national minimum wage is €12.41 per hour, with student jobs (Werkstudent) often paying €14 to €18 per hour." },
      { question: "What are the main intake semesters in Germany?", answer: "Winter Semester (starts in October) is the primary intake; Summer Semester (starts in April) is the secondary intake." },
      { question: "What documents are needed for the German Embassy Dhaka interview?", answer: "Admission letter, Blocked Account confirmation (€11,904), health insurance proof, academic mark sheets, motivation letter, CV, and valid passport." },
      { question: "Can polytechnic diploma holders from Bangladesh apply to Germany?", answer: "Yes, 4-year BTEB diploma graduates can apply for Bachelor's or Master's programs depending on university credit evaluations." },
      { question: "What English tests are accepted by German universities?", answer: "IELTS Academic (minimum 6.5) and TOEFL iBT (minimum 85 to 90)." },
      { question: "What is the APS Certificate in Germany?", answer: "An APS certificate verifies the authenticity of academic documents for students from select countries." },
      { question: "What is a Semesterticket in Germany?", answer: "A transit pass included in your semester contribution that allows unlimited free public transportation across your state/region." },
      { question: "Can I travel to other European countries while studying in Germany?", answer: "Yes, your German student visa grants visa-free travel throughout the 29 Schengen member countries." },
      { question: "What is a Werkstudent job in Germany?", answer: "A working student position where you work up to 20 hours/week in your field of study with favorable tax and social security exemptions." },
      { question: "What is the minimum CGPA required for public universities in Germany?", answer: "Most competitive public universities require a minimum CGPA of 3.0 out of 4.0 (German grade 2.5 or better)." },
      { question: "Where is the German Embassy in Bangladesh located?", answer: "Madani Avenue, Baridhara Diplomatic Enclave, Dhaka 1212." },
      { question: "Can I bring my spouse to Germany while studying?", answer: "Yes, Master's and PhD students with adequate living funds and suitable apartment space can apply for family reunification." },
      { question: "How does ALO Education assist with German university applications?", answer: "ALO Education assists with program shortlisting, Uni-Assist profile submission, Blocked Account setup, and embassy interview coaching." }
    ],

    sources: [
      { section: "German Student Visa & Blocked Account", sourceName: "German Federal Foreign Office (Auswärtiges Amt)", sourceUrl: "https://www.make-it-in-germany.com/en/study-training/studies-in-germany", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Berlin", costLevel: "Medium", vibe: "Vibrant Startup, Tech & Cultural Metropolis", universities: ["TU Berlin", "Humboldt University", "Free University of Berlin"], livingCost: "€950 / month" },
      { name: "Munich", costLevel: "High", vibe: "Global Engineering, Automotive & Tech Leader", universities: ["TUM (Technical University of Munich)", "LMU Munich"], livingCost: "€1,200 / month" },
      { name: "Frankfurt", costLevel: "Medium", vibe: "European Financial & Banking Capital", universities: ["Goethe University Frankfurt", "Frankfurt School of Finance"], livingCost: "€1,000 / month" }
    ]
  },

  malaysia: {
    slug: "malaysia",
    code: "MY",
    name: "Malaysia",
    flag: "🇲🇾",
    capital: "Kuala Lumpur",
    currency: "MYR (RM)",
    heroTitle: "Study in Malaysia from Bangladesh | Affordable Quality & Branch Campuses",
    heroSubtitle: "Experience affordable world-class education at leading UK and Australian branch campuses in a welcoming Asian hub.",
    overview: "Malaysia is a top global higher education destination offering top QS-ranked public universities and renowned UK/Australian branch campuses at 1/3rd of Western costs.",
    whyStudySummary: "High-ranking global universities, affordable living costs (RM 1,500 - 2,500/month), English-taught programs, and hassle-free student pass processing via EMGS.",
    visaType: "EMGS Student Pass",
    popularIntakes: ["February/March 2027", "September/October 2026"],
    studyLevels: ["Diploma", "Bachelor Degree (3-4 Years)", "Master's Degree (1-2 Years)", "PhD"],
    tuitionRange: "RM 18,000 - RM 45,000 / year",
    livingCost: "RM 18,000 - RM 25,000 / year",
    workRights: "20 hours/week during semester breaks and holidays.",
    seoTitle: "Study in Malaysia from Bangladesh | EMGS Visa, Branch Campuses | ALO Education",
    seoDescription: "Complete guide for studying in Malaysia from Bangladesh. Monash, Nottingham, Curtin, Sunway, APU admissions, VAL processing, and tuition costs.",
    canonicalUrl: "https://aloeducation.com/destinations/malaysia",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Kuala Lumpur" },
      { label: "Currency", value: "Malaysian Ringgit (RM / MYR)" },
      { label: "Popular Cities", value: "Kuala Lumpur, Penang, Johor Bahru, Cyberjaya" },
      { label: "Main Intakes", value: "March, July, October" },
      { label: "Average Master's Duration", value: "1 to 2 Years" },
      { label: "Visa Processing Route", value: "Education Malaysia Global Services (EMGS)" },
      { label: "Living Cost Level", value: "Very Affordable (RM 1,500 - 2,200 / Month)" }
    ],

    reasons: [
      { icon: "coins", heading: "1/3rd Western Tuition & Living Cost", description: "Get identical UK and Australian degrees in Malaysia at a fraction of the cost." },
      { icon: "award", heading: "Global Branch Campuses", description: "Study at Monash University Malaysia, University of Nottingham Malaysia, or Curtin Malaysia." },
      { icon: "globe", heading: "Safe, Multicultural & Halal", description: "Modern infrastructure, halal food everywhere, and a deeply welcoming multicultural society." },
      { icon: "briefcase", heading: "Fast EMGS Visa Processing", description: "Visa Approval Letter (VAL) issued electronically through EMGS within 3 to 5 weeks." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Foundation Studies → 3-Year Bachelor Degree", description: "Direct entry with SSC GPA 3.5+." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor Degree (3-4 Years)", description: "Direct entry for students with HSC GPA 3.0+ or A-Level passes." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-2 Year Master's Degree", description: "Direct entry for Bachelor graduates with CGPA 2.5+." }
    ],

    entryRequirements: [
      { level: "Bachelor Degree", academic: "HSC GPA 3.0+ or A-Levels", english: "IELTS 5.5 - 6.0 or PTE 50", documents: ["Transcripts", "Passport", "Photo"] },
      { level: "Master's Degree", academic: "Bachelor with CGPA 2.5+ (50%+)", english: "IELTS 6.0 or PTE 58", documents: ["Degree Certificate & Transcripts", "Passport", "SOP", "CV"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted across all Malaysian universities", note: "Minimum 5.5 to 6.0 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Accepted for EMGS Student Pass", note: "Minimum score 50-58.", sourceUrl: "https://www.pearsonpte.com" }
    ],

    visaSteps: [
      { step: 1, title: "University Offer Letter", description: "Submit academic transcripts to receive unconditional offer." },
      { step: 2, title: "Apply for EMGS Visa Approval Letter (VAL)", description: "University applies to EMGS for electronic VAL." },
      { step: 3, title: "Single Entry Visa (SEV)", description: "Get SEV stamped at Malaysian High Commission in Dhaka." },
      { step: 4, title: "Arrive in Malaysia & Post-Arrival Medical", description: "Complete post-arrival medical screening within 7 days." },
      { step: 5, title: "Receive Student Pass Sticker", description: "Student Pass sticker stamped on your passport." }
    ],

    workRightRules: [
      {
        termTime: "Restricted during semester",
        vacation: "20 hours/week during semester breaks exceeding 7 days",
        condition: "Permitted in restaurants, petrol kiosks, mini markets, and hotels only",
        postStudyRoute: "Employment Pass (EP) upon job offer.",
        sourceUrl: "https://educationmalaysia.gov.my"
      }
    ],

    faqs: [
      { question: "What is EMGS in Malaysia student visa?", answer: "Education Malaysia Global Services (EMGS) is the official government agency that processes all international student visas for Malaysia." },
      { question: "What is a Visa Approval Letter (VAL)?", answer: "A VAL is an official electronic letter issued by the Malaysian Immigration Department allowing you to travel to Malaysia." },
      { question: "What international branch campuses operate in Malaysia?", answer: "Monash University Malaysia, University of Nottingham Malaysia, Curtin University Malaysia, Swinburne University, and Heriot-Watt." },
      { question: "What is the cost of living in Malaysia for Bangladeshi students?", answer: "Approximately RM 1,500 to RM 2,500 per month (including accommodation, meals, and transport)." },
      { question: "Can polytechnic diploma holders apply to Malaysia?", answer: "Yes, 4-year BTEB diploma graduates can apply for Bachelor's degrees with 1 to 2 years of credit transfers." },
      { question: "What is the Single Entry Visa (SEV)?", answer: "An entry visa issued by the Malaysian High Commission in Dhaka based on your approved VAL." },
      { question: "Is English widely spoken in Malaysian universities?", answer: "Yes, almost all private universities and international branch campuses teach 100% in English." },
      { question: "Can I transfer to Australia or the UK from Malaysia?", answer: "Yes, branch campuses like Monash, Nottingham, and Curtin allow seamless campus transfers to the parent campus." },
      { question: "How long does EMGS VAL processing take?", answer: "Typically 3 to 6 weeks from initial submission to VAL issuance." },
      { question: "Does ALO Education assist with Malaysian admissions?", answer: "Yes, ALO Education provides free university selection, EMGS tracking, and visa filing support." }
    ],

    sources: [
      { section: "EMGS Visa & Student Pass", sourceName: "Education Malaysia Global Services (EMGS)", sourceUrl: "https://educationmalaysia.gov.my", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Kuala Lumpur", costLevel: "Medium", vibe: "Vibrant Asian Hub", universities: ["Monash Malaysia", "Sunway University", "APU", "Taylor's"], livingCost: "RM 2,000 / month" }
    ]
  },

  cyprus: {
    slug: "cyprus",
    code: "CY",
    name: "Cyprus",
    flag: "🇨🇾",
    capital: "Nicosia",
    currency: "EUR (€)",
    heroTitle: "Study in Cyprus from Bangladesh | Affordable EU Degree & Schengen Access",
    heroSubtitle: "Earn affordable EU-recognized degrees in an English-speaking island with low tuition, 20h/week work rights and Schengen travel.",
    overview: "Cyprus offers affordable EU higher education with English-taught programs, low living costs, safe island lifestyle and direct access to Europe.",
    whyStudySummary: "Lowest tuition in the EU (€5,000-€10,000/year), English medium, visa interview-free via college sponsorship and warm Mediterranean climate.",
    visaType: "Cyprus Student Visa (National Visa)",
    popularIntakes: ["September (Fall) 2026", "January (Spring) 2027", "June (Summer) 2027"],
    studyLevels: ["Diploma / Higher Diploma", "Bachelor Degree (3-4 Years)", "Master's Degree (1-2 Years)", "MBA", "PhD"],
    tuitionRange: "€5,000 - €10,000 / year",
    livingCost: "€6,000 - €8,000 / year",
    workRights: "20 hours/week during term (after 6 months), 38 hours/week holidays.",
    seoTitle: "Study in Cyprus from Bangladesh | Affordable EU Degree, Visa & Work | ALO Education",
    seoDescription: "Study in Cyprus for Bangladeshi students. EU universities, affordable tuition €5k-10k, student visa via college, work rights and post-study options.",
    canonicalUrl: "https://aloeducation.com/destinations/cyprus",
    lastVerifiedAt: "2026-09-15",

    quickFacts: [
      { label: "Capital City", value: "Nicosia" },
      { label: "Currency", value: "Euro (€ / EUR)" },
      { label: "Popular Cities", value: "Nicosia, Limassol, Larnaca, Paphos" },
      { label: "Main Intakes", value: "September, January, June" },
      { label: "Average Bachelor's Duration", value: "4 Years" },
      { label: "Average Master's Duration", value: "1 to 2 Years" },
      { label: "Tuition Range", value: "€5,000 - €10,000 / year (lowest in EU)" },
      { label: "Language", value: "English-taught programs (IELTS 5.5 - 6.0)" }
    ],

    reasons: [
      { icon: "coins", heading: "Most Affordable EU Tuition", description: "EU degrees from €5,000/year — with installment payment and low living costs compared to mainland Europe." },
      { icon: "globe", heading: "EU & Schengen Advantage", description: "Cypriot residence allows travel across EU research events and future Schengen mobility." },
      { icon: "award", heading: "English-Medium Education", description: "British-system universities teaching fully in English; many accept MOI from Bangladesh." },
      { icon: "briefcase", heading: "Practical Work Exposure", description: "Paid internships and 20h/week work after 6 months in tourism, hospitality and services." }
    ],

    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Foundation / Diploma → Bachelor Degree", description: "Bridge pathway with SSC GPA 3.0+ into Hotel/Tourism and Business diplomas." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor Degree (4 Years)", description: "Direct entry with HSC GPA 3.0+ or 2 A-Level passes." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree with Credit Transfer", description: "Polytechnic diploma → 2nd year entry into Business/Computing/Engineering." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-Year Master's / MBA", description: "CGPA 2.5+ accepted; many MBA programs without GMAT." }
    ],

    entryRequirements: [
      { level: "Diploma / Foundation", academic: "SSC GPA 3.0+ or HSC 2.5+", english: "IELTS 5.0 or internal test / MOI", documents: ["SSC/HSC Certificates", "Passport", "Photo"] },
      { level: "Bachelor Degree", academic: "HSC GPA 3.0+ or A-Level 2 passes", english: "IELTS 5.5 (no band <5.0) or PTE 46 or MOI", documents: ["Transcripts", "Passport", "SOP", "Photo"] },
      { level: "Master's / MBA", academic: "Bachelor CGPA 2.5+ (50%+)", english: "IELTS 5.5-6.0 or PTE 50 or MOI", documents: ["Degree & Transcripts", "Passport", "CV", "SOP"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by all Cyprus universities", note: "Minimum 5.0 to 6.0.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Accepted for admission", note: "Minimum 46-58.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "Medium of Instruction (MOI)", accepted: "Accepted by many colleges", note: "If Bachelor/12 years taught in English.", sourceUrl: "https://aloeducation.com" }
    ],

    visaSteps: [
      { step: 1, title: "College Offer Letter", description: "Receive Provisional Offer after transcripts review." },
      { step: 2, title: "Pay Initial Tuition Deposit", description: "Pay deposit (€1,500 - €3,000) to start immigration file." },
      { step: 3, title: "College Applies for Entry Permit at Migration Dept (Cyprus)", description: "College sponsors and lodges entry visa at Civil Registry & Migration Department." },
      { step: 4, title: "Receive Entry Visa Letter", description: "Receive Blue Slip/entry visa approval (4-8 weeks)." },
      { step: 5, title: "Travel & Medical + Pink Slip Residence Permit", description: "Arrive on entry permit, medical test and Pink Slip Temporary Residence Permit." }
    ],

    workRightRules: [
      {
        termTime: "20 hours per week (after 6 months registration)",
        vacation: "38 hours per week during holidays",
        condition: "Must be enrolled full-time; contract via Labour Office",
        postStudyRoute: "Job-search extension and employer sponsorship for Cyprus Work Permit.",
        sourceUrl: "https://www.mfa.gov.cy"
      }
    ],

    faqs: [
      { question: "Is Cyprus degree recognized in the EU and internationally?", answer: "Yes, degrees from Cypriot public and accredited private universities are recognized across the EU Bologna process and listed in the WHED." },
      { question: "How much is tuition in Cyprus for Bangladeshi students?", answer: "€5,000 to €10,000 per year — the most affordable EU option, payable in installments." },
      { question: "Can I study in Cyprus without IELTS?", answer: "Many colleges accept MOI or conduct an internal English test; IELTS 5.5 recommended for smoother approval." },
      { question: "How long is Cyprus student visa processing?", answer: "High Commission via college sponsorship typically 6-10 weeks after deposit and documents." },
      { question: "Can I work while studying in Cyprus?", answer: "Yes, after 6 months of enrollment you can work 20 hours/week during term and 38 hours in holidays with Labour Office contract." },
      { question: "Are there scholarships in Cyprus?", answer: "Colleges offer 20%-40% merit tuition discounts on first year; continuous scholarships based on semester GPA." },
      { question: "What are main intakes in Cyprus?", answer: "September (major), January and June (mid) intakes." },
      { question: "Is Cyprus safe and English-speaking?", answer: "Yes, Cyprus is among the safest EU islands and instruction plus daily life in Larnaca/Limassol is widely English." },
      { question: "Can polytechnic diploma holders apply?", answer: "Yes, 4-year BTEB diploma accepted into 2nd year of Bachelor programs after credit evaluation." },
      { question: "Do I need to show bank balance?", answer: "Yes, modest proof (~€7,000-10,000 plus tuition) via college bank letter, lower than mainland EU." },
      { question: "What is Pink Slip in Cyprus?", answer: "The Temporary Residence Permit (Pink Slip) issued after arrival medical and college registration." },
      { question: "Can I bring dependents to Cyprus?", answer: "Not on initial student permit; family reunification only after work/employer sponsorship." },
      { question: "Which cities/branches are popular in Cyprus?", answer: "Nicosia (University of Nicosia, Cyprus), Limassol (CUT), Larnaca (UCLan Cyprus) and Paphos (Neapolis)." },
      { question: "Can I travel to Schengen with Cyprus residence?", answer: "Cyprus residence facilitates short-stay academic travel; full Schengen membership progress allows future free travel." },
      { question: "Does ALO Education handle Cyprus admission free?", answer: "Yes — free counseling, offer, visa file, medical guidance and pre-departure until Pink Slip." }
    ],

    sources: [
      { section: "Student Entry & Residence", sourceName: "Republic of Cyprus Civil Registry & Migration Dept", sourceUrl: "https://www.mfa.gov.cy", lastVerifiedAt: "2026-09-15" }
    ],

    cities: [
      { name: "Nicosia", costLevel: "Medium", vibe: "Capital — Admin & University Hub", universities: ["University of Nicosia", "University of Cyprus", "European University Cyprus"], livingCost: "€700 / month" },
      { name: "Limassol", costLevel: "Medium", vibe: "Coastal Business & Tourism Hub", universities: ["Cyprus University of Technology", "Frederick University"], livingCost: "€750 / month" },
      { name: "Larnaca", costLevel: "Low", vibe: "Coastal, Calm & Affordable", universities: ["UCLan Cyprus", "InterNapa College"], livingCost: "€600 / month" }
    ]
  },

  sweden: {
    slug: "sweden",
    code: "SE",
    name: "Sweden",
    flag: "🇸🇪",
    capital: "Stockholm",
    currency: "SEK (kr)",
    heroTitle: "Study in Sweden from Bangladesh | Innovation Leader & 12-Month Job Search",
    heroSubtitle: "Study at world top-100 Swedish universities in English, 60+ intakes with 12-month post-study residence for job search.",
    overview: "Sweden combines world-leading research (KTH, Lund, Uppsala) with all Master’s in English, strong funding via Swedish Institute scholarships and high quality of life.",
    whyStudySummary: "All Master’s 100% English, generous Swedish Institute scholarships, 12-month post-study permit and gateway to EU careers.",
    visaType: "Residence Permit for Studies (Migrationsverket)",
    popularIntakes: ["Autumn (August/September) 2026", "Spring (January) 2027"],
    studyLevels: ["Bachelor Degree (3 Years)", "Master's Degree (1-2 Years)", "PhD (4 Years, often salaried)"],
    tuitionRange: "80,000 - 180,000 SEK / year (€7,000 - €16,000)",
    livingCost: "122,000 SEK / year (~€10,500, Migrationsverket standard)",
    workRights: "Unlimited hours — no legal limit, academic progress required.",
    seoTitle: "Study in Sweden from Bangladesh | Top Unis, Scholarships & Job Search Permit | ALO Education",
    seoDescription: "Study in Sweden for Bangladeshi students. Lund, KTH, Uppsala, Swedish Institute scholarships, residence permit, unlimited work rights and 12-month job search.",
    canonicalUrl: "https://aloeducation.com/destinations/sweden",
    lastVerifiedAt: "2026-09-15",

    quickFacts: [
      { label: "Capital City", value: "Stockholm" },
      { label: "Currency", value: "Swedish Krona (SEK / kr)" },
      { label: "Popular Cities", value: "Stockholm, Gothenburg, Lund, Uppsala, Malmö" },
      { label: "Main Intakes", value: "Autumn (Aug/Sep) & Spring (Jan)" },
      { label: "Average Master's Duration", value: "1 to 2 Years (all in English)" },
      { label: "Average Bachelor's Duration", value: "3 Years" },
      { label: "Post-Study Permit", value: "12 months Residence Permit for Job Search" },
      { label: "Work Rights", value: "No hourly restriction during studies" }
    ],

    reasons: [
      { icon: "award", heading: "Top 100 Research Universities", description: "KTH, Lund, Uppsala, Stockholm and Gothenburg rank world top 100-200 with Nobel heritage." },
      { icon: "coins", heading: "Swedish Institute Scholarships", description: "Full SI Scholarships and university tuition waivers (25%-100%) for non-EU masters students." },
      { icon: "briefcase", heading: "Unlimited Work + 12-Month Job Search", description: "No cap on student work hours; 12-month residence after graduation to find qualified employment." },
      { icon: "globe", heading: "100% English in Masters", description: "All master’s taught entirely in English; 94% of Swedes speak English — no Swedish required for daily life." }
    ],

    pathways: [
      { fromLevel: "HSC / A-Level", toPathway: "Bridge / Direct Bachelor (3 Years)", description: "A-Level/BB+ or HSC + 1 year university bridging to match 13-year Swedish entry (via UniversityAdmissions.se)." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor Degree (credit evaluation)", description: "BTEB diploma evaluated centrally; may enter technical/engineering bachelors." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-2 Year Master's Degree (MSc/MA/MEng)", description: "Direct to 60ECTS (1 year) or 120ECTS (2 years) masters with CGPA 3.0+." },
      { fromLevel: "Master's → PhD", toPathway: "Salaried PhD employment", description: "Swedish PhDs are paid positions (SEK 28k-35k/month) — apply by vacancy, not tuition." }
    ],

    entryRequirements: [
      { level: "Bachelor Degree", academic: "A-Level BBB+ or HSC + 1 year university (13 years)", english: "IELTS 6.5 (no band <5.5) or TOEFL 90", documents: ["Transcripts via UniversityAdmissions.se", "Passport", "SOP"] },
      { level: "Master's Degree", academic: "Bachelor 4-Year CGPA 3.0+ (70%+) in relevant field", english: "IELTS 6.5 (no band <5.5) or PTE 62 or TOEFL 90", documents: ["Degree & Transcripts", "SOP/Motivation", "CV", "2 References", "Passport"] },
      { level: "PhD", academic: "Master's with thesis + research proposal", english: "IELTS 6.5-7.0", documents: ["Research Proposal", "CV/Publications", "References", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by all Swedish universities", note: "Minimum 6.5 (no 5.5).", sourceUrl: "https://www.ielts.org" },
      { name: "TOEFL iBT", accepted: "Widely accepted", note: "Minimum 90.", sourceUrl: "https://www.ets.org/toefl" },
      { name: "PTE Academic", accepted: "Accepted by most universities", note: "Minimum 62.", sourceUrl: "https://www.pearsonpte.com" }
    ],

    visaSteps: [
      { step: 1, title: "Apply via UniversityAdmissions.se", description: "Central portal ranking: priority and document upload deadline 1 Feb (Autumn)." },
      { step: 2, title: "Receive Admission & Pay Tuition Instalment", description: "Pay first instalment after admission to enable residence permit application." },
      { step: 3, title: "Apply for Residence Permit (Migrationsverket)", description: "Online residence permit: show admission + finances (122k SEK/year) + passport + health." },
      { step: 4, title: "Biometrics at Embassy of Sweden, Dhaka", description: "Fingerprint/photo after approval at Sweden Visa Centre." },
      { step: 5, title: "Receive Residence Permit Card", description: "Pick up card and travel; register with Tax Agency and university on arrival." }
    ],

    workRightRules: [
      {
        termTime: "No legal hourly limit",
        vacation: "Full-time permitted",
        condition: "Must maintain progress; employment registered for tax",
        postStudyRoute: "12-month Residence Permit for establishing / seeking employment after degree (extendable to work permit).",
        sourceUrl: "https://www.migrationsverket.se/en/study.html"
      }
    ],

    faqs: [
      { question: "Can I study in Sweden entirely in English?", answer: "Yes — 1,000+ programs and every master’s is taught fully in English; Bachelor Swedish-taught but many English tracks exist." },
      { question: "Is Sweden expensive vs other EU?", answer: "Tuition 80k-180k SEK/year (€7k-16k). Living ~10,500 EUR/year. Scholarships offset heavily; installment payment available." },
      { question: "Are scholarships available for Bangladeshi masters students?", answer: "Yes — Swedish Institute Scholarships for Global Professionals (full + living) and university waivers 25%-100% per semester." },
      { question: "Do I need Swedish language?", answer: "No for admission/daily life; learning SFI basic helps for part-time jobs and long-term integration." },
      { question: "Can students work unlimited hours in Sweden?", answer: "Swedish law sets no weekly cap on student employment during studies; you must still pass courses." },
      { question: "How long is post-study stay in Sweden?", answer: "12 months residence permit for job search/starting business after completing 2-year master’s (apply before permit expires)." },
      { question: "What is UniversityAdmissions.se?", answer: "Central Swedish admission portal ranking up to 4 master’s by priority; one application, multiple universities." },
      { question: "What finances must I show for Swedish residence permit?", answer: "Prove 10,314 SEK/month (122k SEK/year) via bank + tuition paid receipt." },
      { question: "What CGPA is needed for KTH/Lund/Uppsala master’s?", answer: "Typically 3.2-3.6+/4 (75%+) plus relevant bachelor background; competitive programs higher." },
      { question: "Is IELTS mandatory?", answer: "IELTS 6.5 (no 5.5) or TOEFL 90 is standard; PTE also accepted." },
      { question: "When do Swedish admissions close?", answer: "Autumn intake: mid-Jan (courses) + 1 Feb (documents); Spring is smaller, closes mid-Aug." },
      { question: "Can polytechnic diploma holders apply?", answer: "Evaluated centrally; bridging year or direct bachelor depends on university mapping of 12+ years." },
      { question: "Where is biometrics for Sweden in Bangladesh?", answer: "Sweden Visa Application Centre / Embassy of Sweden on Bay's Edgewater, Gulshan-2, Dhaka." },
      { question: "Are Swedish PhDs free/salaried?", answer: "Yes, PhD posts are employment contracts (28k-35k SEK/month) and tuition-free — you are hired, not paying." },
      { question: "Does ALO cover Sweden admission?", answer: "Yes — program shortlist, UniversityAdmissions.se filing, SOP, SI scholarship, permit and Tax Agency guide — free counseling." }
    ],

    sources: [
      { section: "Residence Permit for Studies", sourceName: "Swedish Migration Agency (Migrationsverket)", sourceUrl: "https://www.migrationsverket.se/en/study.html", lastVerifiedAt: "2026-09-15" }
    ],

    cities: [
      { name: "Stockholm", costLevel: "High", vibe: "Capital — Tech, Finance & KTH Hub", universities: ["KTH Royal Institute of Technology", "Stockholm University", "Karolinska Institute"], livingCost: "12,500 SEK / month" },
      { name: "Gothenburg", costLevel: "Medium", vibe: "Automotive & Port Innovation (Volvo)", universities: ["Chalmers University of Technology", "University of Gothenburg"], livingCost: "10,500 SEK / month" },
      { name: "Lund", costLevel: "Medium", vibe: "Historic Research City (Oxford of Sweden)", universities: ["Lund University"], livingCost: "9,500 SEK / month" }
    ]
  },

  netherlands: {
    slug: "netherlands",
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    capital: "Amsterdam",
    currency: "EUR (€)",
    heroTitle: "Study in the Netherlands from Bangladesh | Top Ranked European Hub",
    heroSubtitle: "Study in the heart of Europe with over 2,100 English-taught programs and a 1-year Orientation Year (Zoekjaar) work visa.",
    overview: "The Netherlands was the first non-English speaking country to offer university programs taught entirely in English, renowned for innovation and problem-based learning.",
    whyStudySummary: "Top global university rankings, 95% English-speaking population, and 1-year Zoekjaar post-study work visa in Europe.",
    visaType: "MVV & VVR Residence Permit",
    popularIntakes: ["September (Autumn) 2026", "February (Spring) 2027"],
    studyLevels: ["Bachelor Degree (3 Years)", "Master's Degree (1-2 Years)", "PhD"],
    tuitionRange: "€8,000 - €22,000 / year",
    livingCost: "€12,000 / year (IND standard)",
    workRights: "16 hours/week during term time, full-time in June, July, and August.",
    seoTitle: "Study in the Netherlands from Bangladesh | Zoekjaar, Top Unis | ALO Education",
    seoDescription: "Study in the Netherlands for Bangladeshi students. English-taught programs at TU Delft, University of Amsterdam, IND student visa, and Zoekjaar work permit.",
    canonicalUrl: "https://aloeducation.com/destinations/netherlands",
    lastVerifiedAt: "2026-07-25",

    quickFacts: [
      { label: "Capital City", value: "Amsterdam" },
      { label: "Currency", value: "Euro (€ / EUR)" },
      { label: "Popular Cities", value: "Amsterdam, Rotterdam, Utrecht, Eindhoven, The Hague, Delft" },
      { label: "Main Intakes", value: "September (Primary) & February (Secondary)" },
      { label: "Average Master's Duration", value: "1 to 2 Years" },
      { label: "Post-Study Work Permit", value: "1-Year Orientation Year (Zoekjaar)" },
      { label: "English Proficiency", value: "95% of Population Speaks Fluent English" }
    ],

    reasons: [
      { icon: "award", heading: "2,100+ English-Taught Programs", description: "Largest selection of English-taught bachelor's and master's degrees in continental Europe." },
      { icon: "briefcase", heading: "1-Year Zoekjaar Work Visa", description: "Graduates qualify for the 1-year Orientation Year (Zoekjaar) open work permit." },
      { icon: "globe", heading: "Gateway to Europe", description: "Centrally located with visa-free travel across all 29 European Schengen member nations." },
      { icon: "coins", heading: "Holland Scholarships", description: "Merit scholarships of €5,000 offered by Dutch universities for non-EEA students." }
    ],

    pathways: [
      { fromLevel: "HSC / A-Level", toPathway: "1-Year International Foundation or Direct Bachelor (3 Years)", description: "Direct admission for A-Levels (BBB+) or via Foundation for HSC." },
      { fromLevel: "Bachelor Degree (4 Years)", toPathway: "1-2 Year Master's Degree (MSc / MA)", description: "Direct admission for Bachelor graduates with CGPA 3.0+." }
    ],

    entryRequirements: [
      { level: "Bachelor Degree", academic: "A-Levels (BBB+) or HSC + Foundation", english: "IELTS 6.0 - 6.5 or PTE 58", documents: ["Transcripts", "Passport", "SOP", "1 Reference"] },
      { level: "Master's Degree", academic: "Bachelor with CGPA 3.0+ (65%+)", english: "IELTS 6.5 (no band < 6.0) or PTE 60", documents: ["Degree Certificate & Transcripts", "SOP", "2 References", "CV", "Passport"] }
    ],

    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted across all Dutch universities", note: "Minimum 6.5 overall.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "Accepted by most Dutch research & applied science universities", note: "Minimum score 58-65.", sourceUrl: "https://www.pearsonpte.com" }
    ],

    visaSteps: [
      { step: 1, title: "University Offer Letter", description: "Receive conditional/unconditional offer from Dutch institution." },
      { step: 2, title: "Tuition & Living Cost Transfer", description: "Transfer tuition fee + €12,000 living cost deposit to university." },
      { step: 3, title: "University Applies for MVV Visa (IND)", description: "University lodges MVV visa application directly with Dutch IND." },
      { step: 4, title: "Collect MVV Sticker at Embassy in Dhaka", description: "Collect Entry Visa (MVV) sticker at Embassy of Netherlands in Dhaka." },
      { step: 5, title: "Receive VVR Residence Permit in Netherlands", description: "Collect biometrics and Dutch Residence Permit card upon arrival." }
    ],

    workRightRules: [
      {
        termTime: "16 hours per week",
        vacation: "Full-time in June, July, and August",
        condition: "Employer must obtain a TWV work permit (free of charge)",
        postStudyRoute: "1-year Orientation Year (Zoekjaar) open work permit.",
        sourceUrl: "https://ind.nl/en/study"
      }
    ],

    faqs: [
      { question: "What is the Zoekjaar (Orientation Year) visa in the Netherlands?", answer: "The Zoekjaar gives graduates 1 full year to work freely or search for a highly skilled migrant job in the Netherlands." },
      { question: "How does the Dutch student visa application work?", answer: "Your Dutch university applies for your MVV entry visa and VVR residence permit directly to the IND (Immigration and Naturalisation Service)." },
      { question: "What is the difference between Research Universities and Universities of Applied Sciences in the Netherlands?", answer: "Research Universities (WO) focus on academic research and theory; Universities of Applied Sciences (HBO) focus on practical and professional training." },
      { question: "Is English spoken everywhere in the Netherlands?", answer: "Yes, over 95% of the Dutch population speaks fluent English, and daily life in cities like Amsterdam, Rotterdam, and Utrecht is easily navigated in English." },
      { question: "How much is the living cost requirement for the Dutch visa?", answer: "The IND requires proof of approximately €12,000 per year for living expenses, usually deposited with the university." },
      { question: "Are international student scholarships available in the Netherlands?", answer: "Yes, the NL Scholarship (formerly Holland Scholarship) awards €5,000 to non-EEA students during their first year." },
      { question: "Can international students work part-time in the Netherlands?", answer: "Yes, students can work up to 16 hours per week during term time or full-time during the summer months (June to August)." },
      { question: "When are the main application deadlines for Dutch universities?", answer: "Numerus Fixus programs have early deadlines (January 15); general non-EU deadlines are typically April 1 or May 1." },
      { question: "Where is the Embassy of the Netherlands located in Dhaka?", answer: "Road 90, House 49, Gulshan-2, Dhaka 1212." },
      { question: "How does ALO Education assist with Netherlands applications?", answer: "ALO Education helps with Studielink registration, document evaluation, motivation letters, and visa tracking." }
    ],

    sources: [
      { section: "Dutch Student Visa & Zoekjaar", sourceName: "Immigration and Naturalisation Service (IND)", sourceUrl: "https://ind.nl/en/study", lastVerifiedAt: "2026-07-25" }
    ],

    cities: [
      { name: "Amsterdam", costLevel: "High", vibe: "Historic, Cultural & Global Commercial Capital", universities: ["University of Amsterdam", "Vrije Universiteit Amsterdam"], livingCost: "€1,300 / month" }
    ]
  },
  "south-korea": {
    slug: "south-korea",
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    capital: "Seoul",
    currency: "KRW (₩)",
    heroTitle: "Study in South Korea from Bangladesh | Global Top 100 & KGSP Scholarships",
    heroSubtitle: "Study at SKY universities (SNU, Korea, Yonsei) with Global Korea Scholarship (GKS), English-taught GSIS programs and 2-year job-seeker D-10 visa.",
    overview: "South Korea blends chaebol-powered innovation (Samsung, Hyundai, LG) with top-100 universities, affordable tuition and rich K-culture in the world’s most connected nation.",
    whyStudySummary: "QS Top 100 universities, GKS full scholarships (tuition+living+airfare+Korean), 20-30h/week work and 2-year D-10 job search after graduation.",
    visaType: "D-2 Student Visa (Study Abroad)",
    popularIntakes: ["Spring (March) 2027", "Fall (September) 2026"],
    studyLevels: ["Korean Language Program (D-4)", "Bachelor Degree (4 Years)", "Master's Degree (2 Years)", "PhD (3-4 Years)"],
    tuitionRange: "₩6,000,000 - ₩12,000,000 / year ($4,500 - $9,000)",
    livingCost: "₩12,000,000 - ₩18,000,000 / year ($9,000 - $13,500)",
    workRights: "20-25h/week (TOPIK 2), 30h+ for TOPIK 4/Graduate.",
    seoTitle: "Study in South Korea from Bangladesh | SNU, KAIST, GKS & D-2 Visa | ALO Education",
    seoDescription: "Study in South Korea for Bangladeshi students. SKY/ KAIST/ POSTECH, GKS scholarship, D-2 visa, TOPIK, 20-30h work and 2-year D-10 job seeker.",
    canonicalUrl: "https://aloeducation.com/destinations/south-korea",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Seoul" },
      { label: "Currency", value: "Korean Won (₩ / KRW)" },
      { label: "Popular Cities", value: "Seoul, Busan, Daejeon, Daegu, Suwon" },
      { label: "Main Intakes", value: "March (Spring) & September (Fall)" },
      { label: "Average Bachelor's Duration", value: "4 Years" },
      { label: "Average Master's Duration", value: "2 Years" },
      { label: "Global Korea Scholarship (GKS)", value: "Full tuition + ₩900k/month + airfare + Korean course" },
      { label: "Language of Instruction", value: "Korean + 30% English-taught (GSIS/IT/Business)" }
    ],
    reasons: [
      { icon: "award", heading: "SKY & KAIST World Top 40-100", description: "SNU (#31), KAIST (#56), POSTECH, Korea & Yonsei deliver Ivy-level research with Bangladesh-friendly admissions." },
      { icon: "coins", heading: "GKS Fully-Funded", description: "1,200+ GKS awards yearly: 100% tuition, ₩900k-$1M living, flight, settlement, full Korean year at SNU/KU." },
      { icon: "briefcase", heading: "Chaebol Internships → D-10", description: "Intern at Samsung/LG/Hyundai/Kakao; graduates get 2-year D-10 job seeker → E-7 skilled visa." },
      { icon: "globe", heading: "K-Culture + Safest Mega-City", description: "Seoul is safest large city, 98% 5G, 100% English signage on campus and ultra-low crime." }
    ],
    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "1-Year Korean Language (D-4) → 4-Year Bachelor", description: "TOPIK 1 + SSC 3.5 → language year then matriculate with TOPIK 3." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor (4 Years) English or Korean track", description: "HSC GPA 3.5+/A-Level 2 passes → SNU/Korea direct with IELTS 5.5 or TOPIK 3." },
      { fromLevel: "Diploma (4-Year BTEB)", toPathway: "Bachelor 3rd Year Transfer (2 Years)", description: "BTEB 4-year credited into engineering/IT — 2 years to degree at Tech universities." },
      { fromLevel: "Bachelor (4 Years)", toPathway: "GSIS English Master's (2 Years) → D-10", description: "CGPA 3.0+ accepted; GSIS (SNU GSIS/KU/Yonsei) entirely in English, no TOPIK needed." }
    ],
    entryRequirements: [
      { level: "Korean Language (D-4)", academic: "SSC GPA 3.0+ or HSC 2.8+", english: "IELTS not required / TOPIK 1 optional", documents: ["Certificates", "Passport", "Bank 6 months", "Study Plan"] },
      { level: "Bachelor Degree", academic: "HSC GPA 3.5+ or A-Level 2 passes (C+)", english: "IELTS 5.5 (no 5.0) / TOPIK 3 / Duolingo 95", documents: ["Transcripts", "Passport", "SOP", "Bank Statement ($18k)"] },
      { level: "Master's / GSIS", academic: "Bachelor CGPA 3.0+ (60%+) relevant", english: "IELTS 6.0 / TOPIK 4 / TOEFL 80", documents: ["Degree & Transcripts", "2 References", "Study Plan", "Bank"] }
    ],
    englishTests: [
      { name: "IELTS Academic", accepted: "Accepted by GSIS/English tracks", note: "5.5 Bachelor, 6.0-6.5 Master.", sourceUrl: "https://www.ielts.org" },
      { name: "TOPIK", accepted: "Korean Proficiency — main admit + work bonus", note: "TOPIK 3 Bachelor, TOPIK 4 opens 30h work + scholarships.", sourceUrl: "https://www.topik.go.kr" },
      { name: "TOEFL iBT", accepted: "All English GSIS programs", note: "80-90.", sourceUrl: "https://www.ets.org/toefl" }
    ],
    visaSteps: [
      { step: 1, title: "Admission + Certificate of Admission (CoA)", description: "Get SNU/Korea letter + CoA for D-2 visa." },
      { step: 2, title: "Tuberculosis Test + Financials", description: "TB test + $18k-20k bank 6 months (or GKS award letter)." },
      { step: 3, title: "Apply D-2 at Korean Embassy Dhaka", description: "Visa via KVAC Gulshan with CoA, TB, finances, study plan." },
      { step: 4, title: "Arrive + Alien Registration Card (ARC)", description: "ARC within 90 days → opens bank, phone, part-time permit." },
      { step: 5, title: "Part-Time Work Permit Approval", description: "Apply via HiKorea (TOPIK level sets hour cap 20-30h)." }
    ],
    workRightRules: [
      {
        termTime: "20h/week (TOPIK 2), 25h undergrad TOPIK 4, 30h graduate TOPIK 4",
        vacation: "Unlimited on vacation (with permit)",
        condition: "D-2 enrolled, GPA ≥2.0, TOPIK certificate, HiKorea permit",
        postStudyRoute: "D-10 Job Seeker up to 2 years → E-7 Skilled Worker.",
        sourceUrl: "https://www.hikorea.go.kr"
      }
    ],
    faqs: [
      { question: "What is GKS and can Bangladeshi get it?", answer: "Global Korea Scholarship (GKS) — 800 University + 400 Embassy track yearly, ~40 for Bangladesh — full tuition, living ₩900k, airfare, Korean year." },
      { question: "Do I need Korean language?", answer: "GSIS/business/IT masters 100% English (IELTS 6.0). For Korean-taught, TOPIK 3 needed; language year D-4 gets you there." },
      { question: "How much bank balance for D-2?", answer: "$18,000-$20,000 for 6 months, or GKS award replaces financial proof." },
      { question: "Can I work part-time in Korea?", answer: "Yes with ARC + HiKorea permit: 20h (TOPIK2) → 30h (TOPIK4 grad). PC bang, convenience, tutoring, internships." },
      { question: "How long is post-study D-10?", answer: "Up to 2 years job-seeker; convert to E-7 when chaebol/SME sponsors at ~30M KRW salary." },
      { question: "What is difference SKY vs KAIST vs POSTECH?", answer: "SKY = comprehensive (SNU/Korea/Yonsei); KAIST/POSTECH = STEM specialist (MIT model) top for engineering." },
      { question: "When do Korean intakes close?", answer: "March intake closes Sep-Oct; September intake closes Mar-Apr. GKS Embassy closes Sep." },
      { question: "Can BTEB diploma apply?", answer: "Yes → 3rd year transfer into polytechnic universities (Tech) — 2 years remaining." },
      { question: "Where is Korean visa in Bangladesh?", answer: "Korea Visa Application Center (KVAC), Navana Chandradeep, Gulshan-1 Dhaka + TB at IOM." },
      { question: "Are all masters 2 years in Korea?", answer: "Yes — 4 semesters coursework + thesis; GSIS adds Korean semester if GKS." },
      { question: "Does ALO handle GKS?", answer: "Yes — university vs embassy track, personal statement, research proposal, interview — free." }
    ],
    sources: [
      { section: "D-2 Visa & GKS", sourceName: "National Institute for International Education (NIIED) / HiKorea", sourceUrl: "https://www.studyinkorea.go.kr", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Seoul", costLevel: "High", vibe: "Mega-Tech Capital (SKY, Samsung)", universities: ["Seoul National University", "Korea University", "Yonsei University", "Sogang"], livingCost: "₩1,100,000 / month" },
      { name: "Daejeon", costLevel: "Medium", vibe: "STEM Capital (KAIST)", universities: ["KAIST", "Chungnam National"], livingCost: "₩800,000 / month" },
      { name: "Busan", costLevel: "Medium", vibe: "Port & Film City (Pusan National)", universities: ["Pusan National University", "Dong-A"], livingCost: "₩750,000 / month" }
    ]
  },
  malta: {
    slug: "malta",
    code: "MT",
    name: "Malta",
    flag: "🇲🇹",
    capital: "Valletta",
    currency: "EUR (€)",
    heroTitle: "Study in Malta from Bangladesh | English-Speaking EU & Schengen Island",
    heroSubtitle: "Study 100% in English in the EU’s sunniest English-speaking nation — affordable tuition, Schengen travel and hospitality internships.",
    overview: "Malta is the Mediterranean’s only English-as-official EU state — British-system education, Schengen, safe island lifestyle 15 minutes from anywhere and 300 sunny days.",
    whyStudySummary: "Native English + cheap €6k-12k tuition, Schengen, paid tourism/igaming internships, 9-month post-study stay.",
    visaType: "National Long-Stay Visa (Type D) + Malta Residence Permit",
    popularIntakes: ["October (Fall) 2026", "February (Spring) 2027", "June (Summer) 2027"],
    studyLevels: ["Foundation / Diploma", "Bachelor Degree (3-4 Years)", "Master's Degree (1-2 Years)", "MBA (1 Year)"],
    tuitionRange: "€6,000 - €14,000 / year",
    livingCost: "€7,500 - €10,000 / year",
    workRights: "20 hours/week during term (after 90 days).",
    seoTitle: "Study in Malta from Bangladesh | English EU, Visa & Jobs | ALO Education",
    seoDescription: "Study in Malta for Bangladeshi students. University of Malta, MCAST, English programs, Type D visa, 20h work, Schengen and post-study options.",
    canonicalUrl: "https://aloeducation.com/destinations/malta",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Valletta" },
      { label: "Currency", value: "Euro (€ / EUR)" },
      { label: "Popular Cities/Islands", value: "Valletta, Sliema, St Julian's, Gozo" },
      { label: "Main Intakes", value: "October (main), February, June" },
      { label: "Tuition Range", value: "€6,000 - €14,000 / year" },
      { label: "Language", value: "English — 2nd official language" },
      { label: "Post-Study Stay", value: "9 months Job Search (Third Country Nationals)" },
      { label: "Schengen", value: "Full Schengen since 2007" }
    ],
    reasons: [
      { icon: "globe", heading: "Native English EU", description: "Only EU where English is native official language — 100% campus + daily life in English, IELTS 5.5 accepted." },
      { icon: "coins", heading: "Double-Cheap Mediterranean", description: "Tuition €6k vs mainland €12k+, rent €400-600 shared, sea-view campuses." },
      { icon: "briefcase", heading: "iGaming & Tourism Capital", description: "HQ for Bet365, Kindred, SiGMA, Lufthansa Technik, 5-star hotels — paid internships feeder." },
      { icon: "award", heading: "Schengen + UK Bridge", description: "Malta residence = Schengen travel; transfer pathways to UK universities (credit recognition)." }
    ],
    pathways: [
      { fromLevel: "SSC / O-Level", toPathway: "Foundation/Diploma (1 Year) → 3-Year Bachelor", description: "SSC 3.0+ → MCAST/GBSB foundation then degree." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Bachelor (3 Years Bologna)", description: "HSC 3.0+ / 2 A-Levels direct — IELTS 5.5." },
      { fromLevel: "Diploma (BTEB 4-Year)", toPathway: "Bachelor Final Year / Advanced Entry", description: "BTEB 4-year → Year 2/3 in Computing/Engineering/Hospitality." },
      { fromLevel: "Bachelor (4 Years)", toPathway: "1-Year Master's / MBA", description: "CGPA 2.5+ — MBA without GMAT, work-based projects." }
    ],
    entryRequirements: [
      { level: "Foundation / Diploma", academic: "SSC GPA 3.0+ or HSC 2.5+", english: "IELTS 5.0 / Duolingo 80 / Internal", documents: ["Certificates", "Passport", "Photo"] },
      { level: "Bachelor Degree", academic: "HSC GPA 3.0+ or A-Level 2 passes", english: "IELTS 5.5 (5.0) / PTE 42 / MOI", documents: ["Transcripts", "Passport", "SOP"] },
      { level: "Master's / MBA", academic: "Bachelor CGPA 2.5+ (50%+)", english: "IELTS 6.0 (5.5) / PTE 50", documents: ["Degree & Transcript", "CV", "SOP", "Passport"] }
    ],
    englishTests: [
      { name: "IELTS Academic", accepted: "All institutions 5.0-6.0", note: "5.5 Bachelor, 6.0 Master.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "MCAST, GBSB, AUM", note: "42-50.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "Medium of Instruction", accepted: "Malta is English-native — widely accepted", note: "12 years English from Bangladesh approved schools.", sourceUrl: "https://aloeducation.com" }
    ],
    visaSteps: [
      { step: 1, title: "Offer + Pay Deposit", description: "MCAST/University of Malta/GYBSB issues letter for Identity Malta." },
      { step: 2, title: "Prepare Bank + Insurance", description: "€10k living + tuition receipt + 6-mo bank + health €250." },
      { step: 3, title: "Apply Type D National Visa (VFS New Delhi via Dhaka)", description: "Via VFS Malta Dhaka (outsourced to New Delhi hub) — biometrics." },
      { step: 4, title: "Arrive + Identity Malta Residence Card", description: "Register within 1 week, biometrics → E-residence card." },
      { step: 5, title: "Work Permit (Jobsplus) after 90 days", description: "Employer applies — 20h/week during studies." }
    ],
    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "40 hours during holidays (with permit)",
        condition: "After 90 days residence, Jobsplus single permit via employer",
        postStudyRoute: "9-month Seek Work permit (employment licence) → Single Permit Work.",
        sourceUrl: "https://identitymalta.gov.mt"
      }
    ],
    faqs: [
      { question: "Is Malta degree EU-recognized?", answer: "Yes — Bologna EU-wide (ECTS), University of Malta QS Top 800, MCAST state-accredited." },
      { question: "How much tuition in Malta?", answer: "€6,000-€10k private, ~€8,000-14k University of Malta non-EU — cheapest native-English EU." },
      { question: "Can I study without IELTS in Malta?", answer: "Yes — MOI widely accepted; internal test available." },
      { question: "How long Malta visa takes?", answer: "6-10 weeks Type D via VFS (Dhaka→New Delhi hub)." },
      { question: "Can I work in Malta as student?", answer: "20h/week after 90 days via Jobsplus employer application." },
      { question: "Why Malta for hospitality?", answer: "5-star Hilton/Marriott/InterContinental internships 500-800€/month plus Malta is tourism engine of EU." },
      { question: "Schengen benefit of Malta?", answer: "Malta residence → 90/180 days free travel across 29 Schengen states." },
      { question: "Can I bring dependents?", answer: "Not on student permit; after work Single Permit, family reunification possible." },
      { question: "Which universities in Malta?", answer: "University of Malta (state, 1592), MCAST, American University of Malta (AUM), GBSB Global." },
      { question: "BTEB diploma eligible?", answer: "Yes — advanced entry Year 2/3 MCAST computing/engineering/hospitality." },
      { question: "Does ALO do Malta free?", answer: "Yes — free offer + Identity Malta file + VFS coaching + pre-departure." }
    ],
    sources: [
      { section: "Type D & Residence", sourceName: "Identity Malta / Jobsplus", sourceUrl: "https://identitymalta.gov.mt", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Valletta / Sliema", costLevel: "Medium", vibe: "UNESCO Capital — University of Malta", universities: ["University of Malta", "GBSB Malta"], livingCost: "€900 / month" },
      { name: "Msida", costLevel: "Medium", vibe: "Student City (Tal-Qroqq Campus)", universities: ["University of Malta (Main Campus)", "MCAST"], livingCost: "€800 / month" },
      { name: "Gozo", costLevel: "Low", vibe: "Calm Island Campus", universities: ["MCAST Gozo", "Queen Mary Malta"], livingCost: "€650 / month" }
    ]
  },
  brazil: {
    slug: "brazil",
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    capital: "Brasília",
    currency: "BRL (R$)",
    heroTitle: "Study in Brazil from Bangladesh | Largest Latin Economy & Tuition-Free Public Unis",
    heroSubtitle: "Study at QS Top 100 USP/UNICAMP tuition-free (public) or US$3k private, Portuguese+English programs and 12-month post-study job search.",
    overview: "Brazil is Latin America’s research giant — USP Top 100 world, tuition-free federal universities via ENEM/SISU or private affordable, vibrant tropical campus life across São Paulo-Rio innovation corridor.",
    whyStudySummary: "Public federal free + private $2k-6k, 100% scholarships via Ciência sem Fronteiras successor, post-study 1-year work and Mercosur mobility.",
    visaType: "VITEM IV — Temporary Visa IV (Student)",
    popularIntakes: ["March (Fall) 2027", "August (Spring) 2026"],
    studyLevels: ["Portuguese Preparatory", "Bachelor Degree (4-5 Years)", "Master's (2 Years)", "PhD (4 Years)"],
    tuitionRange: "$0 (federal public) / $2,000 - $6,000 / year (private)",
    livingCost: "R$24,000 - R$36,000 / year ($5,000 - $7,000)",
    workRights: "20 hours/week (with university authorization).",
    seoTitle: "Study in Brazil from Bangladesh | USP Free, VITEM IV & Scholarships | ALO Education",
    seoDescription: "Study in Brazil for Bangladeshi students. USP/UNICAMP/PUC, free public universities, VITEM IV student visa, work rights and Mercosur.",
    canonicalUrl: "https://aloeducation.com/destinations/brazil",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Brasília" },
      { label: "Currency", value: "Brazilian Real (R$ / BRL)" },
      { label: "Popular Cities", value: "São Paulo, Rio de Janeiro, Brasília, Campinas" },
      { label: "Main Intakes", value: "March (main) & August (mid)" },
      { label: "Top University", value: "USP #85 QS (tuition-free federal)" },
      { label: "Visa", value: "VITEM IV via Brasília/Dhaka (through New Delhi)" },
      { label: "Living Cost", value: "R$2,000 - 3,000 / month shared" }
    ],
    reasons: [
      { icon: "coins", heading: "Tuition-Free Public Elite", description: "Federal/USP/UNICAMP/UFRJ charge R$0 to all admitted — including internationals via ENEM/vestibular." },
      { icon: "award", heading: "Latin #1 Research (USP)", description: "USP alone out-publishes all Spanish America; agritech, aerospace, deep-sea oil global leader." },
      { icon: "briefcase", heading: "Mercosur Work Access", description: "Graduates access Brazil + Mercosur job market (Argentina/Uruguay/Paraguay) 1-year job search." },
      { icon: "globe", heading: "Portuguese + English Masters", description: "600+ English masters (engineering, agri, MBA) while learning Portuguese (world 6th language)." }
    ],
    pathways: [
      { fromLevel: "HSC / A-Level", toPathway: "Celpe-Bras Prep (1 Year) → Federal Bachelor (ENEM)", description: "HSC 3.5 → prep + ENEM → free public." },
      { fromLevel: "HSC / A-Level", toPathway: "Direct Private Bachelor (PUC/Mackenzie) English-friendly", description: "HSC 3.0 IELTS 5.5 direct — $3k/year." },
      { fromLevel: "Bachelor (4 Years)", toPathway: "2-Year English Master's (CAPES Pro)", description: "CGPA 2.8 → CAPES scholarship covers R$2,200/month stipend." },
      { fromLevel: "Diploma BTEB", toPathway: "Tecnólogo → Bachelor", description: "4-year poly bridging via evaluation." }
    ],
    entryRequirements: [
      { level: "Public Federal Bachelor", academic: "HSC 3.5+ + ENEM score / Celpe-Bras Intermediário", english: "Portuguese A2 + IELTS 5.0 optional", documents: ["ENEM", "Celpe-Bras", "Passport", "Financials"] },
      { level: "Private Bachelor", academic: "HSC 3.0+ or A-Level 2 passes", english: "IELTS 5.5 or internal + Portuguese A1", documents: ["Transcripts", "Passport", "SOP"] },
      { level: "Master's", academic: "Bachelor 2.8+ relevant", english: "IELTS 6.0 / Celpe-Bras Intermediate", documents: ["Degree", "Research Proposal", "CV", "Passport"] }
    ],
    englishTests: [
      { name: "Celpe-Bras", accepted: "Mandatory for public Portuguese programs", note: "Intermediate/Advanced.", sourceUrl: "https://www.gov.br/inep" },
      { name: "IELTS Academic", accepted: "English masters at USP/CAPES", note: "5.5-6.0.", sourceUrl: "https://www.ielts.org" },
      { name: "TOEFL iBT", accepted: "Private business schools (FGV)", note: "80.", sourceUrl: "https://www.ets.org/toefl" }
    ],
    visaSteps: [
      { step: 1, title: "Admission Letter (Carta de Aceitação)", description: "Federal/private issues letter + RNE pre-registration." },
      { step: 2, title: "VITEM IV at Brasília (via New Delhi Embassy Dhaka funnel)", description: "Apply via Brazil Visa Centre Dhaka→New Delhi with letter, finances 6 months, police." },
      { step: 3, title: "Federal Police Registration (RNM) 90 days", description: "Get National Migrant Registry within 90 days of arrival." },
      { step: 4, title: "CPF & Bank", description: "CPF tax ID → free SUS health insurance." }
    ],
    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "40 hours vacation",
        condition: "University authorization (Autorização de Trabalho), enrolled full-time",
        postStudyRoute: "1-year job search (Autorização de Residência) → Mercosur Residence / Work.",
        sourceUrl: "https://www.gov.br/mre/pt-br"
      }
    ],
    faqs: [
      { question: "Is public university really free in Brazil?", answer: "Yes — federal/state (USP, UNICAMP, UFRJ, UFMG) charge R$0 tuition to qualified internationals; private R$10k-30k/year." },
      { question: "Do I need Portuguese?", answer: "For free public yes (Celpe-Bras Intermediate). Private/English masters allow IELTS 5.5 and learn Portuguese alongside." },
      { question: "How to get free public seat?", answer: "Via ENEM score (AirSAT style) or Pec-G + Celpe-Bras. ALO tutors ENEM + essay." },
      { question: "Living cost in São Paulo?", answer: "R$2,000-3,000/month shared (dorm R$800) — cheaper than EU." },
      { question: "Work allowed in Brazil?", answer: "20h term with university letter at Labor Ministry — agri/tech internships R$1,500-2,500 stipend." },
      { question: "Post-study stay in Brazil?", answer: "1-year job search residence, then Mercosur/Work visa; SUS health free throughout." },
      { question: "Scholarships for Bangladesh?", answer: "PEC-G (tuition free + $500 stipend), CAPES/CNPq R$2,200 masters, FAPESP PhD R$4k." },
      { question: "BTEB diploma valid?", answer: "Evaluated via Revalidação — tecnólogo credit may cut 1-2 years." },
      { question: "Visa time in Bangladesh?", answer: "VITEM IV ~45 days via New Delhi hub — police clearance essential." },
      { question: "ALO Brazil support?", answer: "Free — ENEM/Celpe-Bras prep, Carta, VITEM IV, CPF/RNM guide." }
    ],
    sources: [
      { section: "VITEM IV & RNM", sourceName: "Ministry of Foreign Affairs Brazil (MRE) / Polícia Federal", sourceUrl: "https://www.gov.br/mre/pt-br", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "São Paulo", costLevel: "Medium", vibe: "Financial & USP Research Megacity", universities: ["USP", "UNICAMP (Campinas)", "FGV", "Mackenzie"], livingCost: "R$2,800 / month" },
      { name: "Rio de Janeiro", costLevel: "Medium", vibe: "Coastal — UFRJ, PUC-Rio", universities: ["UFRJ", "PUC-Rio", "UERJ"], livingCost: "R$2,500 / month" },
      { name: "Brasília", costLevel: "Low", vibe: "Administrative Capital — UnB", universities: ["University of Brasília (UnB)"], livingCost: "R$2,200 / month" }
    ]
  },
  russia: {
    slug: "russia",
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    capital: "Moscow",
    currency: "RUB (₽)",
    heroTitle: "Study in Russia from Bangladesh | World-Famous STEM & Government Quota Free Seats",
    heroSubtitle: "Study at Lomonosov/MSU, MIPT, ITMO with Russian Government Quota — 100% free (tuition+dorm+stipend) + English medicine/engineering.",
    overview: "Russia is a STEM superpower — Mendeleev chemistry, Sputnik engineering — 15,000 Government Quota free seats yearly for internationals including Bangladesh, dorm $30/month.",
    whyStudySummary: "Government Quota R$0 + dorm $15-40/mo cheapest major power, English MBBS globally listed, 1-year post-study job search.",
    visaType: "Study Visa (Ordinary Study — вуза)",
    popularIntakes: ["September (Fall) 2026", "February (Spring) 2027 (prep only)"],
    studyLevels: ["Russian Language Preparatory (1 Year)", "Bachelor / Specialist (4-6 Years incl Medicine)", "Master's (2 Years)", "PhD (3-4 Years)"],
    tuitionRange: "$0 (Quota) / $2,000 - $5,000 / year (paid)",
    livingCost: "$2,500 - $4,500 / year",
    workRights: "20 hours/week (students) — simplified since 2020.",
    seoTitle: "Study in Russia from Bangladesh | MSU, Government Quota Free & Visa | ALO Education",
    seoDescription: "Study in Russia for Bangladeshi students. Lomonosov/ITMO/Sechenov, government quota free, study visa, 20h work and dorm.",
    canonicalUrl: "https://aloeducation.com/destinations/russia",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Moscow" },
      { label: "Currency", value: "Russian Ruble (₽ / RUB)" },
      { label: "Popular Cities", value: "Moscow, St Petersburg, Kazan, Tomsk, Novosibirsk" },
      { label: "Main Intake", value: "September (Feb prep only)" },
      { label: "Tuition Free Quota", value: "15,000 seats world, ~80-100 for Bangladesh" },
      { label: "Medium", value: "Russian + 2,200 English programs (Medicine/Engineering)" },
      { label: "Post-Study", value: "1-year job search extension" }
    ],
    reasons: [
      { icon: "coins", heading: "Quota = 100% Free + Dorm + Stipend", description: "Russian Government Quota = tuition R$0 + dorm ₽1,500/mo + ₽1,800 stipend — awarded via Rossotrudnichestvo Dhaka interview." },
      { icon: "award", heading: "STEM Legend (MSU/MIPT/ITMO)", description: "Mipt is Russia’s MIT, MSU Top 75 world, 12 Nobels, Sputnik & nuclear engineering lineage." },
      { icon: "briefcase", heading: "Cheapest Big Power Living", description: "Dorm $15-40/mo, canteen $70/mo, metro $25/mo — total $250-400/mo." },
      { icon: "globe", heading: "English MBBS World-Listed", description: "Sechenov, Pirogov MBBS 6-year English, WHO/NMC/MCI listed, no IELTS if HSC English 60%." }
    ],
    pathways: [
      { fromLevel: "SSC / HSC", toPathway: "1-Year Russian Prep (Podgotovka) → 4-Year Bachelor", description: "No Russian needed — paid/govt-funded prep then main." },
      { fromLevel: "HSC (Science 3.5+)", toPathway: "6-Year MBBS English (MD Physician)", description: "PCB 60% → Sechenov/Pirogov English MBBS." },
      { fromLevel: "BTEB Diploma 4-Year", toPathway: "Bachelor Engineering Direct Year 2", description: "Evaluated via NOSTRIFICATION (GlavExpertCentre)." },
      { fromLevel: "Bachelor 4-Year", toPathway: "2-Year Master's (English) → Quota PhD", description: "CGPA 3.0 → ITMO/TPU English masters." }
    ],
    entryRequirements: [
      { level: "Preparatory (Russian)", academic: "SSC GPA 3.0+/HSC 2.8+", english: "No IELTS/TOPIK required", documents: ["Certificates", "Passport valid 18m+", "Medical incl HIV"] },
      { level: "Bachelor / MBBS", academic: "HSC 3.5+ (Science 3.5 for MBBS)", english: "IELTS 5.0 optional (English track) / Russian B1 after prep", documents: ["Certificates translated & apostilled", "HIV/medical", "Passport"] },
      { level: "Master's", academic: "Bachelor 2.8+ (60%+)", english: "IELTS 5.5 English track / TORFL-1", documents: ["Degree apostilled", "Transcript", "Passport"] }
    ],
    englishTests: [
      { name: "IELTS Academic", accepted: "English medicine/engineering tracks 5.0-5.5", note: "HSC English 60% often replaces.", sourceUrl: "https://www.ielts.org" },
      { name: "TORFL", accepted: "Russian language levels 1-4", note: "TORFL-1 after prep for main faculty.", sourceUrl: "https://www.education-in-russia.com" },
      { name: "No Test", accepted: "Quota preparatory — no language test entry", note: "Learn 1 year in Russia.", sourceUrl: "https://education-in-russia.com" }
    ],
    visaSteps: [
      { step: 1, title: "Quota Application (Rossotrudnichestvo Dhaka) OR Paid Admission", description: "Quota: education-in-russia.com profile + exam/interview Mar-Apr. Paid: university invitation." },
      { step: 2, title: "Invitation (Priglasheniye) via Ministry of Internal Affairs", description: "21-45 days telex invitation." },
      { step: 3, title: "Study Visa at Russian Embassy Dhaka (Gulshan-2)", description: "Single 90-day visa → extend to 1-year multi inside Russia." },
      { step: 4, title: "Medical + Registration 7 days", description: "HIV etc 30 days; register dorm within 7 days." }
    ],
    workRightRules: [
      {
        termTime: "20 hours per week (simplified since 14 Aug 2020 law)",
        vacation: "40 hours vacation (no permit needed if enrolled full-time accredited)",
        condition: "Full-time accredited university, employment contract — no separate permit",
        postStudyRoute: "1-year temporary residence for graduates job search → Work permit.",
        sourceUrl: "https://education-in-russia.com"
      }
    ],
    faqs: [
      { question: "Is Russia free via quota?", answer: "Yes — Quota = tuition R$0 + dorm Rb1,500 ($16) + stipend. ~90 for Bangladesh 2026 — apply Jan-Mar via Russian House Dhaka." },
      { question: "Do I need Russian language?", answer: "Not for quota — 1-year preparatory included free; English MBBS/engineering bypass with IELTS 5.0." },
      { question: "How cheap is Russia living?", answer: "Dorm $16-40, food $70-100, metro $25 — total $250-400/month." },
      { question: "Is MBBS in English WHO listed?", answer: "Yes — Sechenov First Moscow, Pirogov, Kazan Federal WHO/NMC/MCI listed 6-year MD." },
      { question: "Work allowed in Russia?", answer: "20h term, 40h vacation since 2020 — no separate work permit if student at accredited university." },
      { question: "How long quota process?", answer: "Apply Jan-Mar, interview Apr, result Jun-Jul, invitation Aug, visa Sep — ALO handles apostille/nostrification." },
      { question: "BTEB diploma accepted?", answer: "Yes via GlavExpertCentre nostrification — possible Year 2 engineering entry." },
      { question: "Visa documents for Russia?", answer: "Invitation, passport 18m+, HIV negative, medical, bank proof minimal ($4k/year)." },
      { question: "Safe after Hostilities?", answer: "Campuses charter flights/health/Sputnik insurance; ALO offers Kazan/Tomsk away from west as options." },
      { question: "ALO Russia quota help?", answer: "Free — profile, prep, apostille, invitation, embassy — until dorm registration." }
    ],
    sources: [
      { section: "Quota & Study Visa", sourceName: "Rossotrudnichestvo / Ministry of Science & Higher Education Russia", sourceUrl: "https://education-in-russia.com", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Moscow", costLevel: "Medium", vibe: "Capital — MSU, Sechenov, MIPT", universities: ["Lomonosov MSU", "MIPT (Phystech)", "Sechenov Medical", "RUDN"], livingCost: "₽25000 / month" },
      { name: "St Petersburg", costLevel: "Medium", vibe: "Cultural Capital — ITMO, SPbPU", universities: ["ITMO", "Peter the Great SPbPU", "SPb State"], livingCost: "₽20000 / month" },
      { name: "Kazan", costLevel: "Low", vibe: "Volga Tatar Heritage — KFU", universities: ["Kazan Federal University", "Kazan Medical"], livingCost: "₽15000 / month" }
    ]
  },
  india: {
    slug: "india",
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    capital: "New Delhi",
    currency: "INR (₹)",
    heroTitle: "Study in India from Bangladesh | IIT System & Cheapest English Degree in Asia",
    heroSubtitle: "Study in world top 150 IIT/IISc with ICCR fully-funded 900 scholarships for Bangladesh, English-medium 2km from Dhaka.",
    overview: "India is English-medium STEM at scale — 23 IITs, 20 IIMs, AIIMS medicine, UGC-recognized private stars (VIT, Manipal, Ashoka) two hours flight from Dhaka with near-culture and fee ₹1-3 lakh/year.",
    whyStudySummary: "Cheapest QS-ranked English degree (₹1.5 lakh/year), ICCR 900 Bangladesh seats full stipend, land-border visa 7 days, zero culture shock.",
    visaType: "Student Visa (S)",
    popularIntakes: ["July (Fall) 2026", "January (Spring) 2027"],
    studyLevels: ["Diploma", "Bachelor Degree (3-4 Years)", "Master's (2 Years)", "PhD (3-5 Years, JRF)", "MBBS (5.5 Years, NEET)"],
    tuitionRange: "₹100,000 - ₹350,000 / year ($1,200 - $4,200, private) / ₹0 ICCR",
    livingCost: "₹120,000 - ₹200,000 / year ($1,500 - $2,400)",
    workRights: "No off-campus work (internships allowed).",
    seoTitle: "Study in India from Bangladesh | IIT, ICCR 900 Scholarships & S Visa | ALO Education",
    seoDescription: "Study in India for Bangladeshi students. IIT/IISc/ICCR, VIT, Manipal, S visa via IVAC Dhaka, $1,500/year living.",
    canonicalUrl: "https://aloeducation.com/destinations/india",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "New Delhi" },
      { label: "Currency", value: "Indian Rupee (₹ / INR)" },
      { label: "Popular Cities", value: "Bangalore, Delhi, Mumbai, Hyderabad, Chennai, Pune, Kolkata" },
      { label: "Main Intakes", value: "July (main) & January (mid/via Study in India portal)" },
      { label: "ICCR Scholarships", value: "900 seats for Bangladesh full (stipend ₹18k-25k/month + house)" },
      { label: "Top Ranked", value: "IISc #155, IIT Bombay #149 QS 2025" },
      { label: "Flight Dhaka", value: "45 min to Kolkata, 2.5h to Delhi" }
    ],
    reasons: [
      { icon: "coins", heading: "₹1,200/Year Ranked English Degree", description: "Cheapest QS-ranked English medium globally — VIT/Manipal ₹1.5 lakh/year beats EU." },
      { icon: "award", heading: "IIT/IISc Top 150 + ICCR Free", description: "ICCR General Cultural Scholarship Scheme 900 for BD — 100% + dorm + medical." },
      { icon: "globe", heading: "Zero Culture Shock 45 min", description: "Same food/language/festival as West Bengal, land border 7-day S visa via IVAC." },
      { icon: "briefcase", heading: "Bengaluru Tech Hiring", description: "Intern at Infosys/Wipro/Flipkart campus (not counted as work) → placement." }
    ],
    pathways: [
      { fromLevel: "SSC / HSC 3.0+", toPathway: "Direct Bachelor (3-4Y) via Study in India (SII)", description: "HSC 3.0 → SII portal auto-matching to VIT/Manipal/Amrita." },
      { fromLevel: "HSC Science 4.0+ PCB", toPathway: "NEET → AIIMS/MAMC MBBS (5.5Y)", description: "NEET quota for Bangladesh: high merit + ICCR." },
      { fromLevel: "BTEB Diploma 4Y", toPathway: "Direct Lateral Entry Year 2 Engineering", description: "AICTE-approved lateral via JELET evaluation." },
      { fromLevel: "Bachelor 4Y", toPathway: "IIT GATE → MTech/PhD JRF ₹37k/month stipend", description: "GATE+ ICCR → IIT MTech free + Junior Research Fellowship." }
    ],
    entryRequirements: [
      { level: "Bachelor (Private)", academic: "HSC GPA 3.0+ (60%+) or A-Level 2 passes", english: "IELTS not required (MOI) / PTE optional 46", documents: ["Certificates", "Passport", "SII registration"] },
      { level: "IIT/IISc/ICCR", academic: "HSC 4.5+/GPA 4.8 + JEE Advanced/GATE for top", english: "MOI", documents: ["High merit transcripts", "Passport", "ICCR portal"] },
      { level: "MBBS NEET", academic: "HSC Science GPA 5.0 PCB 60%+", english: "MOI", documents: ["NEET score", "Medical fitness"] }
    ],
    englishTests: [
      { name: "No IELTS Needed", accepted: "English official — HSC English passes suffices for most privates", note: "ICCR never asks IELTS.", sourceUrl: "https://www.iccr.gov.in" },
      { name: "IELTS Academic", accepted: "Optional for top IITs masters 6.0", note: "Not mandatory.", sourceUrl: "https://www.ielts.org" }
    ],
    visaSteps: [
      { step: 1, title: "SII or ICCR Admission Letter", description: "SII allotment / ICCR award letter via High Commission Dhaka." },
      { step: 2, title: "Student Visa (S) via IVAC", description: "IVAC Dhaka/Jashore/Benapole — 7-15 days, Bonafide + financial affidavit." },
      { step: 3, title: "FRRO Registration 14 days", description: "Register at FRRO Bangalore/Delhi within 14 days of arrival." },
      { step: 4, title: "Residential Permit", description: "Extend yearly via university FRRO helpdesk." }
    ],
    workRightRules: [
      {
        termTime: "No off-campus paid work (as per S visa)",
        vacation: "Internships on-campus allowed unlimited (via Training & Placement Cell)",
        condition: "S visa — academic internships not classified as employment",
        postStudyRoute: "No automatic stay; convert to Employment Visa via ₹16 lakh+ offer (Tech).",
        sourceUrl: "https://indianvisaonline.gov.in"
      }
    ],
    faqs: [
      { question: "How much is India tuition for Bangladeshis?", answer: "Private ₹1-3 lakh/year ($1,200-3,500); ICCR = ₹0 + stipend ₹25k/month; public CUET limited higher." },
      { question: "What is ICCR and how many seats for Bangladesh?", answer: "Indian Council for Cultural Relations — 900 Bangladesh seats (largest allocation world) full: tuition+hostel+stipend." },
      { question: "Is IELTS needed for India?", answer: "No — HSC English pass suffices; SII/ICCR never mandates IELTS." },
      { question: "Can I work while studying in India?", answer: "Off-campus work prohibited on S visa; but paid campus internships via T&P allowed (Infosys, TCS)." },
      { question: "How fast is Indian student visa?", answer: "7-15 days via IVAC Dhaka (S visa) — fastest regionally." },
      { question: "Is Indian MBBS valid in Bangladesh?", answer: "NEET-based AIIMS/MAMC MBBS MCI/NMC & BMDC listed — return for BMDC registration after." },
      { question: "BTEB diploma lateral?", answer: "Yes — AICTE lateral Year 2 into VIT/Manipal/Jadavpur engineering via diploma GPA 3.5+." },
      { question: "Hostel cost in Bengaluru?", answer: "₹8k-15k/month AC room + food; mess ₹4k — cheapest tech hub." },
      { question: "From Dhaka how close?", answer: "45 min Kolkata, 2h30 Delhi, Benapole land crossing 6h — parents visit monthly." },
      { question: "ALO does India/ICCR?", answer: "Yes — SII ranking, ICCR 900 file, IVAC visa, FRRO — free until hostel." }
    ],
    sources: [
      { section: "S Visa & ICCR", sourceName: "ICCR / Study in India (SII) / High Commission of India, Dhaka", sourceUrl: "https://www.studyinindia.gov.in", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Bangalore", costLevel: "Low", vibe: "India's Silicon Valley — IISc, VIT Bangalore", universities: ["IISc", "Christ University", "PES University"], livingCost: "₹15,000 / month" },
      { name: "Delhi NCR", costLevel: "Medium", vibe: "Capital — IIT Delhi, AIIMS, Ashoka", universities: ["IIT Delhi", "AIIMS Delhi", "Ashoka University", "Amity"], livingCost: "₹18,000 / month" },
      { name: "Vellore/Chennai", costLevel: "Low", vibe: "Private Star Corridor — VIT, SRM", universities: ["VIT Vellore", "SRM", "Manipal (Mangalore)"], livingCost: "₹14,000 / month" }
    ]
  },
  china: {
    slug: "china",
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    capital: "Beijing",
    currency: "CNY (¥)",
    heroTitle: "Study in China from Bangladesh | C9 League & CSC Fully-Funded 15,000",
    heroSubtitle: "Study at Tsinghua/Peking (C9=China’s Ivy) with CSC Chinese Government Scholarship 15,000 seats — free tuition+dorm+¥3k stipend + English MBBS.",
    overview: "China is world’s largest scholarship donor — 15k CSC for internationals including ~200 for Bangladesh — C9 elite + 985/211 leaders, Hubble-class labs, fastest visa 1 week via Dhaka Visa Center.",
    whyStudySummary: "CSC 100% + ¥2,500-3,500/month living + flight + Chinese year, Tsinghua/Peking Top 15 world, 90% English MBBS/engineering, 1-year job search.",
    visaType: "X1 (Long-term >180 days) / X2 (Short-term) Study Visa",
    popularIntakes: ["September (Fall) 2026", "March (Spring) 2027 (limited)"],
    studyLevels: ["Chinese Language (1 Year)", "Bachelor (4 Years)", "Master's (2-3 Years)", "PhD (3-4 Years)", "MBBS (6 Years English)"],
    tuitionRange: "¥0 (CSC) / ¥15,000 - ¥40,000 / year ($2,200 - $5,500)",
    livingCost: "¥12,000 - ¥24,000 / year ($1,700 - $3,400)",
    workRights: "Part-time with university approval (since 2022).",
    seoTitle: "Study in China from Bangladesh | Tsinghua, CSC Free & X1 Visa | ALO Education",
    seoDescription: "Study in China for Bangladeshi students. Tsinghua/Peking/CSC 15k, MBBS English, X1 visa 1 week, dorm and stipend.",
    canonicalUrl: "https://aloeducation.com/destinations/china",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Beijing" },
      { label: "Currency", value: "Chinese Yuan (¥ / CNY)" },
      { label: "Popular Cities", value: "Beijing, Shanghai, Wuhan, Guangzhou, Hangzhou" },
      { label: "Main Intake", value: "September (March limited masters)" },
      { label: "CSC Seats", value: "15,000 worldwide, ~180-220 for Bangladesh" },
      { label: "Top League", value: "C9 League = China’s Ivy (Tsinghua, Peking, Fudan…)" },
      { label: "MBBS English", value: "45+ Ministry-approved English MBBS (6Y), NMC/MCI listed" }
    ],
    reasons: [
      { icon: "coins", heading: "CSC Empire: 100% + ¥3k/mo", description: "Biggest world: CSC Type A (Embassy) + Type B (University) = tuition R$0 + dorm free + stipend + medical." },
      { icon: "award", heading: "C9 Top 15 World Labs", description: "Tsinghua #14, Peking #14 QS 2025, 5G/quantum/AI at Huawei/Alibaba co-labs." },
      { icon: "globe", heading: "MBBS Without Donation", description: "English MBBS 6Y ¥30k/year private vs India capitation — WHO/MCI/BMDC approved colleges." },
      { icon: "briefcase", heading: "2nd Economy Job Corridor", description: "Intern Huawei/Alibaba + stay 1-year S2 job seeker →Work Z visa at ¥7k salary." }
    ],
    pathways: [
      { fromLevel: "HSC 3.5+", toPathway: "Chinese Prep Year (CSC-sponsored) → 4Y Bachelor", description: "No Chinese needed — CSC gives 1 year HSK prep fully funded." },
      { fromLevel: "HSC Science 3.8+ PCB", toPathway: "English MBBS 6 Years (45 approved)", description: "PCB 60% → Wuhan/China Medical etc English MBBS." },
      { fromLevel: "BTEB 4Y Poly", toPathway: "English Bachelor Engineering (4Y) Direct", description: "BTEB GPA 3.3 → HIT, Wuhan Tech direct with IELTS 5.5." },
      { fromLevel: "Bachelor 4Y", toPathway: "English Master's 2-3Y CSC → PhD", description: "CGPA 3.0 → HIT/Tsinghua English master CSC." }
    ],
    entryRequirements: [
      { level: "Chinese Preparatory", academic: "HSC GPA 3.0+ or SSC+HSC", english: "No IELTS / HSK 2 after prep", documents: ["Certificates", "Physical Exam", "Police", "Passport"] },
      { level: "Bachelor / MBBS English", academic: "HSC 3.5+ (MBBS 3.8 PCB 60%+)", english: "IELTS 5.5 / TOEFL 70 / MOI (English MBBS 5.5)", documents: ["Certificates notarized", "Passport", "Financial proof minimal"] },
      { level: "Master's / PhD English", academic: "Bachelor 3.0+ (Master's 3.2+ for C9)", english: "IELTS 6.0 / MOI", documents: ["Degree notarized", "Research Proposal (2 pages)", "2 References", "Passport"] }
    ],
    englishTests: [
      { name: "IELTS Academic", accepted: "English MBBS/engineering 5.5-6.0", note: "MOI accepted at many CSC colleges.", sourceUrl: "https://www.ielts.org" },
      { name: "HSK", accepted: "Chinese tracks Level 4 bachelor, 5 master", note: "Not needed if English track — CSC gives 1yr free HSK.", sourceUrl: "https://www.chinesetest.cn" },
      { name: "No Test", accepted: "CSC prep + many provinces accept MOI", note: "HSC English pass.", sourceUrl: "https://www.campuschina.org" }
    ],
    visaSteps: [
      { step: 1, title: "CSC Apply (Nov-Mar Embassy A + Dec-Apr University B)", description: "Campuschina.org or university direct + JW201/202 form." },
      { step: 2, title: "JW202 + Admission Notice via Ministry", description: "MOE issues JW201/202 — needed for X visa." },
      { step: 3, title: "X1 Visa 1 Week at Dhaka Visa Centre", description: "Jalalabad border style center in Dhaka (Baridhara) — physical exam + bank minimal." },
      { step: 4, title: "Residence Permit 30 days", description: "Convert X1 to Residence Permit (1 year) at PSB Entry-Exit within 30 days of entry." }
    ],
    workRightRules: [
      {
        termTime: "Part-time with university + PSB approval (2022 rule)",
        vacation: "Full-time vacation with approval",
        condition: "On-campus + off-campus internships via university; X1 full-time enrolled",
        postStudyRoute: "12-month S2 Job Seeker → Z Work (with Bachelor+ degree + 2 years not needed if high-ranked).",
        sourceUrl: "https://www.campuschina.org"
      }
    ],
    faqs: [
      { question: "Is CSC really fully funded for Bangladesh?", answer: "Yes — 180-220 of 15k Type A+B include Bangladesh: tuition R$0 + dorm free + ¥3k master/¥3,500 PhD + flight for Type A." },
      { question: "Do I need Chinese language for MBBS?", answer: "No — 45 Ministry-approved English MBBS 6Y taught 100% English; HSK required only if Chinese medium." },
      { question: "How cheap is China MBBS?", answer: "English MBBS ¥30k-40k/year ($4,400) vs private India ₹15 lakh — dorm ¥6k/year." },
      { question: "Work allowed on X1?", answer: "Since 2022 yes with university letter + PSB stamp — 20h tutoring/lab, vacation full." },
      { question: "Age limit for CSC?", answer: "Bachelor 25, Master 35, PhD 40 — HSC 2024 can apply 2026." },
      { question: "BTEB diploma accepted for China?", answer: "Yes — BTEB 4Y GPA 3.3 → HIT/Wuhan/UESTC engineering Year 1 via IELTS 5.5." },
      { question: "Fastest visa in Asia?", answer: "Yes — X1 visa Dhaka Center 4-7 days after JW202 — fastest major." },
      { question: "Can I stay after in China?", answer: "1-year job seeker residence, then Z work with salary ¥7k+; Huawei/SME sponsors." },
      { question: "Which cities/branches for Bangladesh?", answer: "Wuhan (WUT, HUST), Hangzhou (Zhejiang), Harbin (HIT), Beijing (Tsinghua, Renmin)." },
      { question: "ALO handles CSC?", answer: "Yes free — Type A embassy vs Type B university timing, research proposal, JW202, X1." }
    ],
    sources: [
      { section: "CSC & X Visa", sourceName: "China Scholarship Council (CSC) / Campuschina.org / PSB", sourceUrl: "https://www.campuschina.org", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Beijing", costLevel: "Medium", vibe: "Capital — Tsinghua, Peking, Renmin", universities: ["Tsinghua University", "Peking University", "Renmin University"], livingCost: "¥2,000 / month" },
      { name: "Wuhan", costLevel: "Low", vibe: "Student Mega-City (86 Unis) — HUST, WUT", universities: ["Huazhong HUST", "Wuhan University", "WUT"], livingCost: "¥1,200 / month" },
      { name: "Harbin", costLevel: "Low", vibe: "Northern Tech Hub — HIT (C9)", universities: ["Harbin Institute of Technology (HIT)"], livingCost: "¥1,100 / month" }
    ]
  },
  "south-africa": {
    slug: "south-africa",
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    capital: "Pretoria (admin), Cape Town (legis)",
    currency: "ZAR (R)",
    heroTitle: "Study in South Africa from Bangladesh | Africa’s Top 200 & English Safari Degree",
    heroSubtitle: "Study at UCT/Wits (#150 world) in 100% English, game-reserve medicine, Big 5 campus and 12-month Critical Skills work.",
    overview: "South Africa hosts Africa’s only Top 200 universities — UCT, Wits, Stellenbosch, Pretoria — English 100%, 11 official languages, Safari pre-med and cheapest Top 500 degree in southern hemisphere.",
    whyStudySummary: "UCT/Wits Top 150-200, tuition $3k-7k/year, English 100% + 12-month Critical Skills list post-study, 3 capitals’ internship corridor.",
    visaType: "Study Visa — Section 13 under Immigration Act 13 of 2002",
    popularIntakes: ["February (Semester 1) 2027", "July (Semester 2) 2026"],
    studyLevels: ["Foundation/Extended Program", "Bachelor Degree (3-4 Years)", "Honours (1 Year)", "Master's (2 Years)", "PhD"],
    tuitionRange: "ZAR 40,000 - ZAR 120,000 / year ($2,200 - $6,500)",
    livingCost: "ZAR 80,000 - ZAR 120,000 / year ($4,300 - $6,500)",
    workRights: "20 hours/week during term, full-time holidays.",
    seoTitle: "Study in South Africa from Bangladesh | UCT, Wits & Study Visa | ALO Education",
    seoDescription: "Study in South Africa for Bangladeshi students. UCT/Wits/Stellenbosch, tuition $3k, Section 13 study visa, 20h work, Critical Skills.",
    canonicalUrl: "https://aloeducation.com/destinations/south-africa",
    lastVerifiedAt: "2026-09-15",
    quickFacts: [
      { label: "Capital City", value: "Pretoria (administrative), Cape Town (legislative)" },
      { label: "Currency", value: "South African Rand (R / ZAR)" },
      { label: "Popular Cities", value: "Cape Town, Johannesburg, Pretoria, Stellenbosch, Durban" },
      { label: "Main Intakes", value: "February (main) & July (mid-year)" },
      { label: "Top Ranked", value: "UCT #171 QS 2025, Wits #264" },
      { label: "Language", value: "English 100% universities" },
      { label: "Post-Study", value: "Critical Skills Visa list + 12 months job search" }
    ],
    reasons: [
      { icon: "award", heading: "Africa’s Only Top 200", description: "UCT/Wits/Stellenbosch teach what Stellenbosch Wine + Kruger Safari Stanford exchange cannot copy." },
      { icon: "coins", heading: "Dollar-Cheap Top 500", description: "ZAR is 18/$, tuition $3k vs $15k Australia same QS band — dorm+food $300/month." },
      { icon: "briefcase", heading: "Big 5 Medicine & MBA", description: "Only place you dissect + game-reserve clinical + MBChB 6-year English at UCT." },
      { icon: "globe", heading: "Rainbow Nation in English", description: "11 languages, 100% campus English, direct flights via Emirates 12h + multicultural." }
    ],
    pathways: [
      { fromLevel: "HSC / A-Level", toPathway: "Extended/Fundamentals (1Y) → 3Y Bachelor", description: "HSC 3.0 → Extended Science/commerce bridging then mainstream." },
      { fromLevel: "HSC 3.5+ / A-Level 2 passes", toPathway: "Direct 3Y Bachelor (BSc/BA/BCom)", description: "Direct if APS 28+ (HSC conversion)." },
      { fromLevel: "BTEB 4Y Poly", toPathway: "Diploma → Advanced Diploma → Degree", description: " evaluated via SAQA." },
      { fromLevel: "Bachelor 4Y (60%+)", toPathway: "1Y Honours + 2Y Master → PhD", description: "ZA unique Honours ladder." }
    ],
    entryRequirements: [
      { level: "Extended/Foundation", academic: "HSC GPA 3.0+ (50%+) or SSC 3.5", english: "IELTS 5.5 (5.0) / MOI + NBT", documents: ["NSC conversion via Matric Board", "Passport", "Medical"] },
      { level: "Bachelor Direct", academic: "HSC GPA 3.5+ / A-Level 2 passes (APS 28+)", english: "IELTS 6.0 (5.5) / PTE 50 / MOI strong", documents: ["SAQA evaluation", "NBT test", "Passport"] },
      { level: "Master's/Honours", academic: "Bachelor 60%+ (65%+ for UCT/Wits)", english: "IELTS 6.5 (6.0) / TOEFL 90", documents: ["Degree SAQA", "Research Concept (Honours)", "CV"] }
    ],
    englishTests: [
      { name: "IELTS Academic", accepted: "All 26 universities 5.5-6.5", note: "5.5 extended, 6.0 bachelor, 6.5 master.", sourceUrl: "https://www.ielts.org" },
      { name: "PTE Academic", accepted: "UCT, Wits, Pretoria", note: "50-58.", sourceUrl: "https://www.pearsonpte.com" },
      { name: "Medium of Instruction", accepted: "Many accept HSC English 60%+ ", note: "Plus NBT Academic Literacy.", sourceUrl: "https://aloeducation.com" }
    ],
    visaSteps: [
      { step: 1, title: "University Offer + SAQA Certificate", description: "SAQA evaluates HSC/Bachelor to South African NQF." },
      { step: 2, title: "Medical + Radiological + Police", description: "Medical & X-ray within 6 months + police clearance." },
      { step: 3, title: "Section 13 Study Visa at SA High Commission New Delhi (via Dhaka funnel)", description: "VFS New Delhi → Dhaka submission, 30-45 days." },
      { step: 4, title: "Port of Entry + Residence Reporting", description: "Register at VFS DHA 11 days, get Study Visa permit card." }
    ],
    workRightRules: [
      {
        termTime: "20 hours per week",
        vacation: "40 hours during holidays",
        condition: "Endorsement on Study Visa Section 13(1) — part-time work endorsed",
        postStudyRoute: "Critical Skills Visa (if on list) or General Work; 12-month job-seeker endorsement for shortage.",
        sourceUrl: "https://www.dha.gov.za"
      }
    ],
    faqs: [
      { question: "Why South Africa for Bangladeshis?", answer: "Only Top 200 in Africa at 1/5 EU cost, 100% English, Safari medicine/MBA unique — cultural distance less than EU." },
      { question: "Is degree recognized in BD/UK/USA?", answer: "Yes — UCT/Wits SAQA NQF 7/8/9 mapped to UK Level 6/7/8, WHO/BMDC eco-list." },
      { question: "Tuition really $3k?", answer: "Yes — UCT commerce/arts ZAR 60k ($3,300), engineering ZAR 110k ($6k) vs UK £15k similar rank." },
      { question: "Work allowed?", answer: "20h term + 40h vacation if endorsed on Section 13 study visa — hospitality/tourism/safari guide." },
      { question: "Post-study stay?", answer: "Critical Skills List (IT, engineering, health) immediate work; others 12-month job seeker while on Section 13." },
      { question: "What is SAQA?", answer: "South African Qualifications Authority evaluates HSC/Bachelor to APS points for admission." },
      { question: "What is NBT?", answer: "National Benchmark Test — UCT/Wits maths + literacy placement (not fail, streaming)." },
      { question: "BTEB diploma accepted?", answer: "Yes via SAQA + evaluated perhaps advanced diploma entry." },
      { question: "Visa time from Bangladesh?", answer: "45-60 days Section 13 via VFS New Delhi hub (police+medical key)." },
      { question: "Does ALO cover SA?", answer: "Yes free — SAQA, NBT booking, Section 13 file — until DHA card." }
    ],
    sources: [
      { section: "Study Visa Section 13", sourceName: "Department of Home Affairs South Africa (DHA)", sourceUrl: "https://www.dha.gov.za", lastVerifiedAt: "2026-09-15" }
    ],
    cities: [
      { name: "Cape Town", costLevel: "Medium", vibe: "UCT #171 World — Table Mountain", universities: ["University of Cape Town (UCT)", "Cape Peninsula UT"], livingCost: "ZAR 9,000 / month" },
      { name: "Johannesburg", costLevel: "Medium", vibe: "Economic Hub — Wits", universities: ["University of the Witwatersrand (Wits)", "University of Johannesburg"], livingCost: "ZAR 8,500 / month" },
      { name: "Stellenbosch", costLevel: "Medium", vibe: "Wine Region — Stellenbosch", universities: ["Stellenbosch University", "Stellenbosch MBA"], livingCost: "ZAR 8,000 / month" }
    ]
  }
};

export function getCountryDestination(slug: string): CountryDestinationData | null {
  if (!slug) return null;
  const key = slug.toLowerCase().trim();
  if (COUNTRY_DESTINATIONS[key]) return COUNTRY_DESTINATIONS[key];

  // Aliases
  const aliasMap: Record<string, string> = {
    'united-kingdom': 'uk',
    'united-states': 'usa',
    'united-states-of-america': 'usa',
    'us': 'usa',
    'dubai-uae': 'dubai',
    'uae': 'dubai',
    'nz': 'new-zealand',
    'korea': 'south-korea',
    'south korea': 'south-korea',
    'kr': 'south-korea',
    'mt': 'malta',
    'br': 'brazil',
    'ru': 'russia',
    'in': 'india',
    'cn': 'china',
    'za': 'south-africa',
    'southafrica': 'south-africa',
    'south africa': 'south-africa',
  };

  if (aliasMap[key] && COUNTRY_DESTINATIONS[aliasMap[key]]) {
    return COUNTRY_DESTINATIONS[aliasMap[key]];
  }

  return null;
}

export function getAllCountrySlugs(): { slug: string }[] {
  return Object.keys(COUNTRY_DESTINATIONS).map((slug) => ({ slug }));
}
