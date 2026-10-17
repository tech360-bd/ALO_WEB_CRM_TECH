export interface ServiceRecord {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  longDescription: string;
  heroImage: string;
  iconName: string;
  seoTitle: string;
  seoDescription: string;
  benefits: string[];
  processSteps: { step: number; title: string; desc: string }[];
  whoIsItFor: string[];
  requiredDocuments: string[];
  faqs: { question: string; answer: string }[];
}

export function slugifyService(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const MASTER_SERVICES_DATA: ServiceRecord[] = [
  {
    id: "srv-01",
    slug: "personalized-study-abroad-counseling",
    title: "Personalized Study Abroad Counseling",
    shortDesc: "One-to-one expert guidance to evaluate your academic profile, budget, and long-term career aspirations across top destinations.",
    longDescription: "Our senior education advisors conduct in-depth, one-on-one counseling sessions to assess your academic background, English proficiency, financial capacity, and career goals. We guide you toward the ideal study destination, university, and degree program.",
    heroImage: "/images/services/counseling.png",
    iconName: "GraduationCap",
    seoTitle: "Personalized Study Abroad Counseling | ALO Education Bangladesh",
    seoDescription: "Get 1-on-1 expert study abroad counseling in Bangladesh for UK, USA, Australia, Canada, Germany & Ireland universities. Book free consultation today.",
    benefits: [
      "Individual 1-on-1 consultation with certified senior study abroad advisors.",
      "Comprehensive evaluation of academic transcripts, CGPA, and English scores.",
      "Personalized destination roadmap matching budget, intakes, and career goals.",
      "Direct university partner scholarship eligibility assessment."
    ],
    processSteps: [
      { step: 1, title: "Initial Profile Audit", desc: "Evaluate HSC/A-Level or Bachelor's CGPA, English test scores, and financial budget." },
      { step: 2, title: "Destination & Goal Matching", desc: "Select target countries (UK, USA, Canada, Australia, Germany, Ireland) based on post-study work rights." },
      { step: 3, title: "University Shortlisting", desc: "Narrow down top 3 to 5 university options offering maximum scholarship and visa success." },
      { step: 4, title: "Action Plan & Timeline", desc: "Create a customized application checklist and key deadline schedule." }
    ],
    whoIsItFor: [
      "HSC / A-Level graduates aiming for international Bachelor's degrees.",
      "Bachelor's degree holders planning for Master's, MBA, or PhD programs abroad.",
      "Students seeking guidance on country selection and post-study work rights."
    ],
    requiredDocuments: [
      "All Academic Transcripts & Certificates (SSC/HSC or Bachelor's degree).",
      "Valid Passport copy (if available).",
      "IELTS / PTE / Duolingo scorecard (if completed).",
      "Updated Curriculum Vitae (CV) / Resume."
    ],
    faqs: [
      { question: "Is the initial counseling session at ALO Education free?", answer: "Yes! ALO Education provides 100% free personalized study abroad counseling for all students." },
      { question: "Can I bring my parents to the counseling session?", answer: "Absolutely. Parents are warmly welcomed to join and discuss tuition fees, living expenses, bank solvency, and student safety." }
    ]
  },
  {
    id: "srv-02",
    slug: "university-course-selection",
    title: "University & Course Selection",
    shortDesc: "Course and university shortlisting based on your profile, using official university information and counsellor review.",
    longDescription: "Choosing the right university and course is critical for your future employability and visa success. We analyze global university rankings, course modules, tuition fees, location advantages, and industry links to ensure the perfect academic match.",
    heroImage: "/images/landing/Copy of 2148431342.webp",
    iconName: "Building2",
    seoTitle: "University & Course Selection Guidance | ALO Education",
    seoDescription: "Data-driven university and course selection across our global partner university network in UK, USA, Canada, Australia, Germany, and Ireland.",
    benefits: [
      "Guidance on international universities and degree programmes, based on official university information.",
      "Detailed tuition fee, living cost, and location comparison.",
      "Matching entry requirements (GPA, IELTS/PTE, work experience).",
      "High offer acceptance and scholarship probability matching."
    ],
    processSteps: [
      { step: 1, title: "Course Curriculum Analysis", desc: "Compare subject modules, specialization tracks, and practical internship opportunities." },
      { step: 2, title: "Entry Requirement Verification", desc: "Ensure your GPA and English scores fulfill official university thresholds." },
      { step: 3, title: "Tuition & Scholarship Comparison", desc: "Identify universities offering maximum tuition discounts (£1,000 to 100% full funding)." },
      { step: 4, title: "Final Program Lock-in", desc: "Select 3 priority universities for immediate application processing." }
    ],
    whoIsItFor: [
      "Students overwhelmed by thousands of university choices online.",
      "Applicants needing precise entry requirement matching to avoid rejections."
    ],
    requiredDocuments: [
      "Academic Transcripts & Certificates.",
      "Detailed Course Preferences or Subject Interest List."
    ],
    faqs: [
      { question: "How many universities can I apply to through ALO Education?", answer: "You can apply to up to 3 to 5 partner universities to maximize your offer letter and scholarship prospects." }
    ]
  },
  {
    id: "srv-03",
    slug: "scholarship-financial-aid-assistance",
    title: "Scholarship & Financial Aid Assistance",
    shortDesc: "Maximize your funding through government scholarships (Chevening, Commonwealth, Australia Awards) and ALO Merit Grants.",
    longDescription: "We assist Bangladeshi students in identifying, preparing, and applying for government fully-funded scholarships as well as institutional merit tuition fee discounts ranging from £1,000 to 50% tuition waivers.",
    heroImage: "/images/services/success.png",
    iconName: "Award",
    seoTitle: "Scholarship & Financial Aid Assistance | ALO Education Funding Hub",
    seoDescription: "Secure fully-funded scholarships (Chevening, Commonwealth, Australia Awards) and institutional merit grants with ALO Education expert application support.",
    benefits: [
      "Comprehensive database of global government & university scholarship schemes.",
      "Expert essay review for Chevening, Commonwealth, and Australia Awards.",
      "Automatic evaluation for ALO South Asia Merit Grants (£1,000 – £5,000).",
      "Financial planning for tuition deposits and living expenses."
    ],
    processSteps: [
      { step: 1, title: "Scholarship Audit", desc: "Identify all eligible funding schemes matching your CGPA and achievements." },
      { step: 2, title: "Essay & Statement Review", desc: "Structure and refine leadership, networking, and development impact essays." },
      { step: 3, title: "Application Submission", desc: "Submit scholarship forms prior to university hard deadlines." }
    ],
    whoIsItFor: [
      "High-achieving students seeking 100% fully-funded Master's or PhD awards.",
      "Applicants needing partial tuition fee reductions to fit their study budget."
    ],
    requiredDocuments: [
      "Academic Transcripts.",
      "Scholarship Essays & Statement of Purpose.",
      "Two Academic or Professional Reference Letters."
    ],
    faqs: [
      { question: "Are ALO Education partner scholarships guaranteed?", answer: "Eligible Bangladeshi students meeting CGPA criteria automatically receive tuition discounts upon offer letter issuance." }
    ]
  },
  {
    id: "srv-04",
    slug: "sop-lor-application-preparation",
    title: "SOP, LOR & Application Document Preparation",
    shortDesc: "Professional structural editing for Statements of Purpose, Recommendation Letters, and Academic CVs to ensure offer letters.",
    longDescription: "Your Statement of Purpose (SOP) and Letters of Recommendation (LOR) are key factors in university admissions decisions. Our editorial team provides structural feedback, plagiarism checking, and formatting guidance to present your academic story effectively.",
    heroImage: "/images/landing/Copy of pexels-yankrukov-8199166.webp",
    iconName: "FileText",
    seoTitle: "SOP & LOR Writing Guidance | Professional Editing | ALO Education",
    seoDescription: "Get expert structural editing for Statement of Purpose (SOP), Letters of Recommendation (LOR), and CVs to secure university offer letters.",
    benefits: [
      "Structural SOP outline aligned with university expectations.",
      "Academic LOR drafting advice for professors and employers.",
      "Europass & International Academic CV formatting.",
      "100% plagiarism-free content review."
    ],
    processSteps: [
      { step: 1, title: "SOP Questionnaire", desc: "Complete our guided SOP framework outlining academic milestones and goals." },
      { step: 2, title: "Drafting & Structural Editing", desc: "Refine paragraph flow, eliminate clichés, and highlight academic strengths." },
      { step: 3, title: "Final Polish", desc: "Proofread for grammar, academic tone, and word count compliance." }
    ],
    whoIsItFor: [
      "Students writing an SOP for the first time.",
      "Applicants aiming for competitive Go8, Russell Group, or Ivy League admissions."
    ],
    requiredDocuments: [
      "Draft SOP or completed SOP Questionnaire.",
      "Transcripts & Work Experience details."
    ],
    faqs: [
      { question: "Does ALO Education write SOPs from scratch?", answer: "No, we guide you to write your authentic story and provide expert structural editing and proofreading to meet university standards." }
    ]
  },
  {
    id: "srv-05",
    slug: "university-application-submission-tracking",
    title: "University Application Submission & Tracking",
    shortDesc: "Fast, error-free university portal submissions and real-time offer letter tracking through ALO CRM.",
    longDescription: "We handle the entire university application submission process across official university portals (UCAS, Studielink, Uni-Assist, Direct Portals). Our team tracks your application status daily and ensures prompt offer letter processing.",
    heroImage: "/images/landing/Copy of pexels-george-pak-7972967.webp",
    iconName: "Layers",
    seoTitle: "University Application Submission & Tracking | ALO Education Portal",
    seoDescription: "Fast, error-free application submission and real-time tracking across our partner universities in UK, USA, Canada, Australia, and Europe.",
    benefits: [
      "Direct portal application submission via authorized partner channels.",
      "Application fee waivers at participating universities.",
      "Real-time status updates via ALO Web_CRM SMS and email alerts.",
      "Fast conditional & unconditional offer letter retrieval."
    ],
    processSteps: [
      { step: 1, title: "Document Verification", desc: "Audit all uploaded transcripts, certificates, SOP, and LORs for compliance." },
      { step: 2, title: "Portal Submission", desc: "Submit complete application packages directly to university admission boards." },
      { step: 3, title: "Offer Tracking", desc: "Follow up with admissions officers and retrieve conditional/unconditional offers." }
    ],
    whoIsItFor: [
      "Students wanting fast 48-72 hour application processing.",
      "Applicants needing application fee waivers."
    ],
    requiredDocuments: [
      "All Academic Transcripts & Diplomas.",
      "Passport, SOP, 2 LORs, CV, and English Test Result."
    ],
    faqs: [
      { question: "How long does it take to receive an offer letter?", answer: "Partner universities typically issue conditional offer letters within 3 to 10 working days." }
    ]
  },
  {
    id: "srv-06",
    slug: "student-visa-guidance-file-processing",
    title: "Student Visa Guidance & File Processing",
    shortDesc: "99% visa success rate for UK Student Visas (CAS), Australia Subclass 500, Canada Study Permits, and US F-1 Visas.",
    longDescription: "Navigating student visa requirements is the most critical phase of studying abroad. Our dedicated visa compliance team assists with online visa form filing, health surcharges (IHS), biometrics scheduling at VFS/TLS, and interview prep.",
    heroImage: "/images/services/visa.png",
    iconName: "Shield",
    seoTitle: "Student Visa Processing & Guidance Bangladesh | 99% Success | ALO Education",
    seoDescription: "Expert student visa guidance for UK, Australia, Canada, USA, Germany, and Ireland. 99% visa success rate, VFS booking, and mock interview preparation.",
    benefits: [
      "Comprehensive visa document checklist tailored to embassy rules.",
      "Online visa application filling (UKVI, DHA Australia, IRCC Canada, US DS-160).",
      "VFS / TLS / Embassy appointment scheduling in Dhaka & Sylhet.",
      "Mock visa credibility interview preparation sessions."
    ],
    processSteps: [
      { step: 1, title: "Unconditional Offer & CAS / I-20 / LOA", desc: "Secure official university clearance documents." },
      { step: 2, title: "Financial Audit", desc: "Verify 28-day bank balance rules, GIC accounts, or blocked accounts." },
      { step: 3, title: "Online Visa Filing & Fee Payment", desc: "Complete official embassy application and pay IHS/Visa fees." },
      { step: 4, title: "Biometrics & Mock Interview", desc: "Attend VFS biometrics and complete mock interview practice." }
    ],
    whoIsItFor: [
      "Offer letter holders preparing for visa submission.",
      "Students needing expert financial solvency verification."
    ],
    requiredDocuments: [
      "CAS / I-20 / LOA / COE document.",
      "Bank Solvency Certificate & 28-Day Statement.",
      "TB Test Certificate, Academic Papers, Passport."
    ],
    faqs: [
      { question: "What is ALO Education's student visa success rate?", answer: "ALO Education maintains a 99%+ student visa approval rate across UK, Australia, Canada, and USA." }
    ]
  },
  {
    id: "srv-07",
    slug: "bank-solvency-financial-documentation",
    title: "Bank Solvency & Financial Documentation",
    shortDesc: "Guidance on 28-day bank statement rules, sponsor affidavits, Canadian GIC accounts, and German Blocked Accounts.",
    longDescription: "Proper financial proof is essential for visa approval. We guide you and your family sponsors through exact embassy bank solvency rules, 28-day balance maintenance, source of funds documentation, and international money transfers.",
    heroImage: "/images/services/visa.png",
    iconName: "DollarSign",
    seoTitle: "Bank Solvency & Financial Guidance for Student Visa | ALO Education",
    seoDescription: "Expert guidance on 28-day bank statement rules, sponsor affidavit formatting, GIC account setup, and German blocked accounts for student visas.",
    benefits: [
      "Exact calculation of required embassy bank solvency amounts.",
      "Review of approved Bangladeshi bank statement formats.",
      "Sponsor Affidavit & Relationship Deed formatting guidance.",
      "Setup assistance for Scotiabank/CIBC GIC (Canada) and Fintiba/Expatrio Blocked Accounts (Germany)."
    ],
    processSteps: [
      { step: 1, title: "Financial Requirement Calculation", desc: "Calculate tuition balance plus living expenses per embassy rules." },
      { step: 2, title: "Bank Statement Audit", desc: "Verify 28-day continuous holding period and approved bank status." },
      { step: 3, title: "Sponsorship Documentation", desc: "Draft legal affidavits and source of income documentation." }
    ],
    whoIsItFor: [
      "Students preparing bank financial proof for UK, Australia, Canada, or USA visas."
    ],
    requiredDocuments: [
      "Bank Solvency Certificate & 6-Month Bank Statement.",
      "Sponsor Tax Return, Trade License, or Salary Certificate."
    ],
    faqs: [
      { question: "Which Bangladeshi banks are accepted for UK Student Visas?", answer: "UKVI accepts major Bangladesh Scheduled Banks that provide verifiable electronic audit trails." }
    ]
  },
  {
    id: "srv-08",
    slug: "english-language-test-prep-coaching",
    title: "English Language & Test Preparation Coaching",
    shortDesc: "Certified test preparation coaching for IELTS Academic, PTE Academic, Duolingo English Test (DET), TOEFL iBT, and OIETC.",
    longDescription: "Achieving your target English test score is the first step to study abroad success. ALO Education provides structured test preparation, small-group coaching, practice materials, and mock exam evaluations.",
    heroImage: "/images/services/english-test.png",
    iconName: "BookOpen",
    seoTitle: "English Test Prep Coaching | IELTS, PTE, Duolingo | ALO Education",
    seoDescription: "Certified coaching for IELTS Academic, PTE, Duolingo (DET), and TOEFL iBT. Small batch classes, mock exams, and score improvement plans.",
    benefits: [
      "Classes led by certified IELTS & PTE coaches.",
      "Comprehensive module practice for Listening, Reading, Writing, and Speaking.",
      "Full-length computer mock exams with teacher feedback.",
      "Direct official exam registration booking assistance."
    ],
    processSteps: [
      { step: 1, title: "Diagnostic Assessment", desc: "Take a baseline test to measure current English band level." },
      { step: 2, title: "Custom Study Plan", desc: "Enroll in 1-month or 2-month intensive module coaching." },
      { step: 3, title: "Mock Exam & Feedback", desc: "Complete timed mock exams and refine weak areas." }
    ],
    whoIsItFor: [
      "Students aiming for IELTS Band 6.5 - 7.5+, PTE 65+, or Duolingo 120+."
    ],
    requiredDocuments: ["Passport Copy for Official Exam Registration"],
    faqs: [
      { question: "Does ALO Education help book the official IELTS exam?", answer: "Yes! We are an official registration partner for IDP IELTS Bangladesh." }
    ]
  },
  {
    id: "srv-09",
    slug: "pre-departure-briefing-travel-assistance",
    title: "Pre-Departure Briefing & Travel Assistance",
    shortDesc: "Comprehensive pre-departure guidance on air ticketing, luggage rules, airport customs, foreign currency endorsement, and student travel.",
    longDescription: "Before you fly, we ensure you are fully prepared for your international journey. Our pre-departure briefing covers student flights, baggage allowances, customs regulations, Forex student cards, and transit procedures.",
    heroImage: "/images/landing/Copy of 20250902_1607_Joyful Park Conversation_remix_01k44y8qqzf1fak3kphqyhmj6w.webp",
    iconName: "Globe",
    seoTitle: "Pre-Departure Briefing & Student Travel Assistance | ALO Education",
    seoDescription: "Complete pre-departure orientation for Bangladeshi students heading to UK, Australia, Canada, USA & Europe. Airline discounts, Forex, and airport customs guidance.",
    benefits: [
      "Pre-departure orientation session for students and parents.",
      "Discounted student air tickets & extra luggage allowance guidance.",
      "Foreign currency endorsement & Student Forex Card guidance.",
      "Airport arrival and border control clearance instructions."
    ],
    processSteps: [
      { step: 1, title: "Pre-Departure Briefing", desc: "Attend group or individual pre-departure orientation." },
      { step: 2, title: "Student Flight Booking", desc: "Secure discounted student fares with extra luggage weight." },
      { step: 3, title: "Currency & Forex Endorsement", desc: "Endorse USD on passport and activate international student debit card." }
    ],
    whoIsItFor: [
      "Visa-approved students preparing to travel for their upcoming intake."
    ],
    requiredDocuments: [
      "Granted Student Visa & Passport.",
      "University Enrolment / Arrival Letters."
    ],
    faqs: [
      { question: "Can I get extra baggage allowance on student flights?", answer: "Yes! Many partner airlines (Emirates, Qatar Airways, Biman) offer up to 40kg baggage allowance for international students." }
    ]
  },
  {
    id: "srv-10",
    slug: "post-arrival-accommodation-support",
    title: "Post-Arrival Support & Accommodation Guidance",
    shortDesc: "Assistance with airport pickup, safe student housing booking, bank account opening, SIM card activation, and community networking.",
    longDescription: "Our commitment to your success extends beyond visa approval. We help arrange safe, verified student accommodation (on-campus halls or private student apartments), airport pickups, and local orientation.",
    heroImage: "/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp",
    iconName: "Users",
    seoTitle: "Post-Arrival Support & Student Accommodation Guidance | ALO Education",
    seoDescription: "Safe student housing booking, airport pickup coordination, local bank account setup, and community orientation in London, Sydney, Toronto & Berlin.",
    benefits: [
      "Verified student housing booking near university campuses.",
      "Airport pickup coordination upon landing.",
      "Guidance on opening local student bank accounts (Monzo, Barclays, ANZ, RBC).",
      "Connection with ALO Bangladeshi student alumni networks abroad."
    ],
    processSteps: [
      { step: 1, title: "Housing Search & Booking", desc: "Select safe student halls or private shared apartments." },
      { step: 2, title: "Arrival Coordination", desc: "Confirm airport pickup and temporary accommodation check-in." },
      { step: 3, title: "Local Orientation", desc: "Complete university registration, SIM card setup, and bank account setup." }
    ],
    whoIsItFor: [
      "First-time international travelers needing safe housing and arrival support."
    ],
    requiredDocuments: [
      "Tenancy Agreement / Accommodation Voucher.",
      "University Arrival & Key Handover Letters."
    ],
    faqs: [
      { question: "When should I start booking my student accommodation?", answer: "We recommend booking accommodation 2 to 3 months before your course start date to secure prime locations at budget prices." }
    ]
  }
];

export function getServiceBySlug(slug: string): ServiceRecord | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return MASTER_SERVICES_DATA.find((s) => s.slug === clean || slugifyService(s.title) === clean);
}
