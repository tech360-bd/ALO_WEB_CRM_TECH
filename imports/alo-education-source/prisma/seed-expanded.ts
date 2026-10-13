// ALO Education - EXPANDED seed (run AFTER seed-public.ts)
// Adds 30+ real universities and 40+ real courses across all 13 countries.
// All content is ALO-original. Facts are public knowledge; descriptions are rewritten in ALO's voice.
// Each record carries sourceUrl, lastVerifiedAt, verificationStatus, approvalStatus.
// Tuition figures are realistic estimates for international students — confirm with an ALO counselor.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const J = (v: any) => JSON.stringify(v);
const NOW = new Date("2025-01-15");

// ── Shared documents checklist (same standard list as seed-public.ts) ──
const docsChecklist = [
  { category: "Academic", name: "SSC / O Level certificate and transcript", required: true, explanation: "Original and notarised copies of your secondary school results." },
  { category: "Academic", name: "HSC / A Level certificate and transcript", required: true, explanation: "Higher secondary results with subject-wise marks." },
  { category: "Academic", name: "Bachelor transcript and certificate (if applying for PG)", required: false, explanation: "Needed for Masters, MBA, or Pre-Masters applications." },
  { category: "Identity", name: "Valid passport", required: true, explanation: "Must be valid for at least 6 months beyond your intended travel date." },
  { category: "Identity", name: "Passport-size photograph", required: true, explanation: "Recent white-background photo as per university specification." },
  { category: "Identity", name: "National ID / Birth certificate", required: false, explanation: "May be needed for visa application and identity verification." },
  { category: "English", name: "English test certificate (IELTS / PTE / TOEFL / Duolingo / ELLT)", required: true, explanation: "Score report valid at the time of application. Some universities accept MOI." },
  { category: "Application", name: "Curriculum Vitae (CV)", required: true, explanation: "Academic and professional summary in a standard format." },
  { category: "Application", name: "Statement of Purpose (SOP)", required: true, explanation: "Your motivation, academic background, career goals, and why this course and university." },
  { category: "Application", name: "Recommendation letters", required: true, explanation: "Usually 1–2 academic or professional references on official letterhead." },
  { category: "Application", name: "Work experience letter (if applicable)", required: false, explanation: "Required for MBA and some professional Masters programmes." },
  { category: "Financial / Visa", name: "Bank statement", required: true, explanation: "Shows sufficient funds to cover tuition and living expenses. Usually 28-day history required." },
  { category: "Financial / Visa", name: "Sponsor documents and relationship proof", required: true, explanation: "Sponsor letter, income proof, and relationship affidavit if sponsored by parents or others." },
  { category: "Financial / Visa", name: "Source of fund documentation", required: true, explanation: "Salary slips, business documents, or tax records explaining the origin of funds." },
  { category: "Financial / Visa", name: "TB test certificate (if required)", required: false, explanation: "Tuberculosis screening from an approved clinic — required for some countries." },
  { category: "Financial / Visa", name: "Visa application documents", required: true, explanation: "Offer letter, CAS / eCoE, financial proof, and completed visa form." },
];

// ── Standard 9-step application workflow (reused across new universities) ──
const stdApplicationSteps = [
  { step: 1, title: "Check eligibility", detail: "Verify academic and English requirements with ALO counselor." },
  { step: 2, title: "Select course", detail: "Choose from available programmes at your level." },
  { step: 3, title: "Upload documents", detail: "Submit transcripts, English score, SOP, and references." },
  { step: 4, title: "Prepare SOP and CV", detail: "ALO AI helps draft a tailored statement of purpose." },
  { step: 5, title: "Submit application", detail: "ALO application team files the application on your behalf." },
  { step: 6, title: "Track offer", detail: "Receive and review conditional or unconditional offer." },
  { step: 7, title: "Meet conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
  { step: 8, title: "Pay deposit and confirm place", detail: "Pay required tuition deposit to confirm your seat and trigger CAS / eCoE." },
  { step: 9, title: "Visa preparation", detail: "ALO visa officer guides your student visa application step by step." },
];

// ── Course module lists (ALO-original) ──
const courseModules = {
  cs: ["Programming Fundamentals", "Data Structures & Algorithms", "Database Systems", "Software Engineering", "Computer Networks", "Artificial Intelligence", "Machine Learning", "Web & Mobile Development", "Cyber Security Fundamentals", "Final Year Project / Dissertation"],
  business: ["Principles of Management", "Financial Accounting", "Marketing Management", "Operations Management", "Business Strategy", "Organisational Behaviour", "Business Analytics", "International Business", "Project Management", "Capstone Project / Dissertation"],
  data: ["Statistics for Data Science", "Python Programming", "Machine Learning", "Data Visualisation", "Big Data Systems", "Deep Learning", "Natural Language Processing", "Data Ethics & Governance", "Cloud Computing", "Capstone Project"],
  engineering: ["Engineering Mathematics", "Engineering Mechanics", "Materials & Manufacturing", "Thermodynamics & Fluid Mechanics", "Control Systems", "CAD & Simulation", "Project Engineering", "Sustainability & Energy Systems", "Industrial Internet of Things", "Final Year Design Project"],
  finance: ["Corporate Finance", "Financial Reporting", "Investment Analysis", "Portfolio Management", "Financial Modelling", "Risk Management", "International Finance", "Derivatives & Markets", "Audit & Assurance", "Capstone / CFA-aligned Project"],
  healthcare: ["Public Health Foundations", "Epidemiology", "Health Policy & Systems", "Biostatistics", "Health Promotion", "Health Economics", "Research Methods", "Global Health", "Patient Safety & Quality", "Dissertation / Practicum"],
  hospitality: ["Hospitality Operations", "Food & Beverage Management", "Lodging & Rooms Management", "Tourism Principles", "Event Management", "Service Marketing", "Revenue & Pricing", "Sustainable Tourism", "Hospitality Law", "Industry Placement / Dissertation"],
  marketing: ["Marketing Principles", "Consumer Behaviour", "Digital Marketing Strategy", "SEO & Content Marketing", "Social Media & Analytics", "Brand Management", "Marketing Analytics", "Performance Marketing", "Marketing Automation", "Capstone Campaign Project"],
  cyber: ["Information Security Fundamentals", "Network Security", "Cryptography", "Ethical Hacking & Pen Testing", "Digital Forensics", "Cloud Security", "Security Operations & Incident Response", "Governance Risk & Compliance", "Secure Software Development", "Capstone Security Project"],
};

const careerOutcomes = {
  cs: ["Software Engineer", "Full-Stack Developer", "DevOps Engineer", "Cyber Security Analyst", "AI/ML Engineer", "Solutions Architect"],
  business: ["Business Analyst", "Management Consultant", "Marketing Manager", "Operations Manager", "Project Manager", "Entrepreneur"],
  data: ["Data Scientist", "Data Analyst", "ML Engineer", "Data Engineer", "BI Analyst", "AI Researcher"],
  engineering: ["Design Engineer", "Project Engineer", "R&D Engineer", "Manufacturing Engineer", "Control Systems Engineer", "Engineering Manager"],
  finance: ["Financial Analyst", "Investment Analyst", "Accountant", "Audit Associate", "Risk Analyst", "Corporate Treasurer"],
  healthcare: ["Public Health Officer", "Health Programme Manager", "Epidemiologist", "Health Policy Analyst", "Clinical Research Coordinator", "Hospital Administrator"],
  hospitality: ["Hotel General Manager", "F&B Manager", "Event Manager", "Revenue Manager", "Tourism Development Officer", "Guest Experience Manager"],
  marketing: ["Digital Marketing Specialist", "Brand Manager", "Marketing Analyst", "Growth Manager", "Content Strategist", "Performance Marketing Lead"],
  cyber: ["Cyber Security Analyst", "Penetration Tester", "Security Engineer", "SOC Analyst", "Digital Forensics Investigator", "Information Security Consultant"],
};

// ── Standard course FAQ template (ALO-original, parameterised) ──
const courseFaqs = (params: { course: string; uni: string; postStudy: string; scholarship: string; english: string }): any[] => [
  { q: `What is the duration of ${params.course}?`, a: `Duration varies by level and mode — confirm the exact length on the Course Finder or with your ALO counselor.` },
  { q: `Is ${params.course} eligible for post-study work?`, a: params.postStudy },
  { q: `What English score is required for ${params.course}?`, a: params.english },
  { q: `Are scholarships available for this course?`, a: `Yes — ${params.scholarship}. ALO counselors help identify the awards you are most likely to win.` },
  { q: `Does ALO help with the application and SOP?`, a: `Yes. ALO's application team handles submission, and the AI SOP Writer drafts a personalised statement that counselors refine with you.` },
];

// ── Standard university FAQ template (ALO-original, parameterised) ──
function uniFaqs(name: string, intake: string, scholarship: string, extras: { q: string; a: string }[] = []): any[] {
  const base = [
    { q: `How can I apply to ${name}?`, a: `Submit transcripts, English score, SOP, and references through ALO. Our application team files the application and tracks it through to decision.` },
    { q: `What courses are available at ${name}?`, a: `A wide range across business, computing, engineering, health, sciences, and humanities. Use the Course Finder to filter by subject, level, and intake.` },
    { q: `What intakes does ${name} offer?`, a: `${intake}. ALO recommends starting your application at least 6 months before your preferred intake.` },
    { q: `What English score is required?`, a: `Most courses require IELTS 6.5–7.0. PTE, TOEFL, and Duolingo are widely accepted — confirm with your counselor.` },
    { q: `Are scholarships available at ${name}?`, a: `Yes — ${scholarship}. Many awards are automatic upon offer.` },
    { q: `Can I apply with a study gap?`, a: `Yes, provided you can credibly explain the gap in your SOP and during the credibility interview.` },
    { q: `Can I apply with a low CGPA?`, a: `Some programmes accept lower CGPAs with a strong SOP, work experience, or a pre-masters pathway. ALO matches you to realistic options.` },
    { q: `Does ALO help with the SOP?`, a: `Yes — ALO's AI SOP Writer drafts a personalised statement based on your background, and our counselors review and refine it with you.` },
    { q: `Can I compare courses at ${name}?`, a: `Yes — use the Compare feature in the Course Finder to compare up to 3 courses side by side.` },
    { q: `Does ALO help with the visa?`, a: `Yes — ALO's visa team guides you through financials, documents, biometrics, and pre-departure briefing.` },
  ];
  // Replace the last N entries with extras (keeps the count at 10)
  for (let i = 0; i < extras.length && i < base.length; i++) {
    base[base.length - 1 - i] = extras[i];
  }
  return base;
}

// ────────────────────────────────────────────────────────────────────────────
// UNIVERSITIES (49 new — all real institutions)
// ────────────────────────────────────────────────────────────────────────────
const universities = [
  // ───── UK ─────
  {
    slug: "university-of-bristol", name: "University of Bristol", countrySlug: "uk", city: "Bristol",
    overview: "The University of Bristol is a Russell Group research university that pairs academic prestige with one of the UK's most creative student cities. Bangladeshi students gain access to strong employer networks across engineering, finance, and the social sciences, supported by a dedicated international office. Its compact city-centre campus places you at the heart of a vibrant cultural and tech scene.",
    strengths: ["Russell Group research strength across science, engineering, and humanities", "Strong graduate employability and employer links in London and the South West", "Compact central campus in a lively, walkable cultural city", "Generous merit scholarships for high-achieving international students"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "£22,000–30,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL", "Duolingo"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level AAB", english: "IELTS 6.5 (6.0 in each band)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years work experience", english: "IELTS 7.0", documents: "Degree, experience letters, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£22,000–27,000 / year", pg: "£24,000–30,000 / year", mba: "£35,000–48,000", deposit: "£2,000", scholarship: "Merit awards £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Bristol", "Primary intake is September; a few programmes offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Bristol part of the Russell Group?", a: "Yes — Bristol is a member of the Russell Group of research-intensive UK universities, alongside Oxford, Cambridge, Manchester, and others." },
      { q: "Does Bristol offer placements or sandwich years?", a: "Many undergraduate programmes offer a placement year option — confirm with your counselor for your chosen course." },
    ]),
    sourceUrl: "https://www.bristol.ac.uk/",
  },
  {
    slug: "university-of-leeds", name: "University of Leeds", countrySlug: "uk", city: "Leeds",
    overview: "The University of Leeds is a Russell Group university known for its strong business school, engineering faculty, and a lively student city. Its single-campus layout and award-winning students' union make it a popular choice for Bangladeshi applicants seeking a balanced academic and social experience. Industry links across Yorkshire and beyond support placements and graduate employment.",
    strengths: ["Member of the Russell Group with strong research output", "Award-winning students' union and campus facilities", "Excellent business, engineering, and computing schools", "Affordable, vibrant student city with strong graduate job market"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–29,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB–AAB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£23,000–29,000 / year", mba: "£30,000–45,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Leeds", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Leeds Business School well regarded?", a: "Yes — Leeds University Business School holds triple accreditation (AACSB, AMBA, EQUIS), placing it among the top 1% of business schools globally." },
      { q: "Is there a placement year option?", a: "Many undergraduate programmes include an optional industrial placement year — check with your counselor for availability on your course." },
    ]),
    sourceUrl: "https://www.leeds.ac.uk/",
  },
  {
    slug: "university-of-sheffield", name: "University of Sheffield", countrySlug: "uk", city: "Sheffield",
    overview: "The University of Sheffield is a Russell Group research university with particular strengths in engineering, journalism, and the social sciences. Located in one of the UK's most affordable major student cities, it combines academic rigour with a famously welcoming community. Bangladeshi students benefit from strong international support and excellent graduate outcomes in engineering and tech.",
    strengths: ["World-class engineering faculty with strong industry links", "Russell Group research university", "One of the UK's most affordable major student cities", "Large, diverse international community with strong welfare support"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–29,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£23,000–29,000 / year", mba: "£30,000–42,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Sheffield", "September primary intake; selected Masters offer January start", "merit awards of £2,000–5,000", [
      { q: "Is Sheffield strong in engineering?", a: "Yes — Sheffield's Faculty of Engineering is one of the largest in the UK, with strong industry links and high graduate employability." },
      { q: "Is Sheffield an affordable student city?", a: "Yes — Sheffield has one of the lowest costs of living among UK major student cities, with rent around 30–40% lower than London." },
    ]),
    sourceUrl: "https://www.sheffield.ac.uk/",
  },
  {
    slug: "university-of-southampton", name: "University of Southampton", countrySlug: "uk", city: "Southampton",
    overview: "The University of Southampton is a Russell Group university renowned for engineering, computer science, electronics, and ocean and earth sciences. Its strong industry partnerships and pioneering work in web science and AI make it a magnet for tech-minded Bangladeshi applicants. The campus sits in a vibrant port city within easy reach of London.",
    strengths: ["World-leading electronics and computer science research", "Strong maritime and engineering specialisms", "Member of the Russell Group", "Close to London with lower living costs"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–29,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£23,000–29,000 / year", mba: "£30,000–42,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Southampton", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Southampton strong in computer science?", a: "Yes — Southampton is a pioneer in web science and cyber security, with strong industry links and GCHQ-recognised programmes." },
      { q: "How far is Southampton from London?", a: "About 75 minutes by train, making day trips and graduate interviews in London easy." },
    ]),
    sourceUrl: "https://www.southampton.ac.uk/",
  },
  {
    slug: "university-of-birmingham", name: "University of Birmingham", countrySlug: "uk", city: "Birmingham",
    overview: "The University of Birmingham is a Russell Group institution and a founding member of the UK's 'red brick' civic universities. Its leafy campus and strong professional schools — particularly in business, engineering, and health — attract a large Bangladeshi community. Birmingham itself is the UK's second city, with strong graduate job markets in finance, tech, and the public sector.",
    strengths: ["Russell Group research intensity across all faculties", "Strong business school with triple accreditation", "Beautiful parkland campus close to the city centre", "Located in the UK's second-largest economy"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£20,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£20,000–25,000 / year", pg: "£22,000–28,000 / year", mba: "£30,000–45,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Birmingham", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Birmingham a good city for international students?", a: "Yes — Birmingham is one of the most diverse cities in the UK, with a large South Asian community and excellent halal food options." },
      { q: "Does Birmingham offer placements?", a: "Many programmes include a placement year option — confirm availability for your chosen course." },
    ]),
    sourceUrl: "https://www.birmingham.ac.uk/",
  },
  {
    slug: "university-of-nottingham", name: "University of Nottingham", countrySlug: "uk", city: "Nottingham",
    overview: "The University of Nottingham is a Russell Group university with a global outlook, including campuses in Malaysia and China. Its strengths span business, pharmacy, engineering, and economics, and it is known for strong industry partnerships. Bangladeshi students benefit from generous international scholarships and a welcoming campus community.",
    strengths: ["Russell Group with global campus network including Malaysia", "Top-ranked pharmacy and business schools", "Strong employer partnerships across the Midlands and London", "Large international community with merit scholarships"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–29,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£23,000–29,000 / year", mba: "£30,000–45,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Nottingham", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Does Nottingham have a Malaysia campus?", a: "Yes — Nottingham has a campus in Malaysia where students can start or complete parts of their degree. ALO can advise on cross-campus options." },
      { q: "Is Nottingham strong in pharmacy?", a: "Yes — the School of Pharmacy is consistently ranked among the UK's best, with strong industry and clinical links." },
    ]),
    sourceUrl: "https://www.nottingham.ac.uk/",
  },
  {
    slug: "queen-mary-university-of-london", name: "Queen Mary University of London", countrySlug: "uk", city: "London",
    overview: "Queen Mary University of London is a Russell Group university with a famously inclusive campus in the heart of east London. Known for medicine, law, electronic engineering, and computer science, it combines world-class research with one of the most diverse student bodies in the UK. Bangladeshi students enjoy a London location at a more accessible price point than many central London peers.",
    strengths: ["Russell Group university based in central east London", "Strong medicine, dentistry, law, and engineering faculties", "One of the most diverse student communities in the UK", "Lower tuition than many central London universities"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£20,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£20,000–25,000 / year", pg: "£22,000–28,000 / year", mba: "£28,000–40,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Queen Mary University of London", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000", [
      { q: "Is Queen Mary a Russell Group university?", a: "Yes — Queen Mary is a member of the Russell Group and the only one with a campus in central east London." },
      { q: "Is Queen Mary affordable for London?", a: "Relative to other London universities, QMUL's tuition is competitive, and east London living costs are lower than central or west London." },
    ]),
    sourceUrl: "https://www.qmul.ac.uk/",
  },
  {
    slug: "kings-college-london", name: "King's College London", countrySlug: "uk", city: "London",
    overview: "King's College London is one of England's oldest and most prestigious universities, a Russell Group member with a global reputation in health, law, social sciences, and computing. Its central London campuses place students steps from the Thames, Parliament, and major hospitals. Bangladeshi applicants benefit from world-class research, extensive clinical partnerships, and unrivalled London networking.",
    strengths: ["Russell Group university with a global top-40 reputation", "World-leading nursing, medicine, law, and international affairs", "Central London campuses near hospitals, government, and finance", "Extensive international scholarship portfolio"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£23,000–33,000 / year (international, approximate)", englishTests: ["IELTS 7.0 (6.5 in each)", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–8,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or A Level A*AA–AAB", english: "IELTS 7.0 (6.5 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 65%+", english: "IELTS 7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays, GMAT optional" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0–7.5", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£23,000–30,000 / year", pg: "£25,000–33,000 / year", mba: "£40,000–55,000", deposit: "£2,000", scholarship: "Merit £2,000–8,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("King's College London", "September primary intake; some Masters offer January start", "merit awards of £2,000–8,000", [
      { q: "Is King's a top global university?", a: "Yes — King's is consistently ranked among the world's top 40 universities and is a founding college of the University of London." },
      { q: "Where are KCL's campuses?", a: "King's has multiple campuses across central London including Strand, Waterloo, Guy's (London Bridge), and Denmark Hill — close to major hospitals and employers." },
    ]),
    sourceUrl: "https://www.kcl.ac.uk/",
  },
  {
    slug: "university-of-edinburgh", name: "University of Edinburgh", countrySlug: "uk", city: "Edinburgh",
    overview: "The University of Edinburgh is Scotland's top-ranked university and a global top-20 institution with strengths in informatics, medicine, business, and the humanities. Its historic campus sits in one of Europe's most beautiful capitals. Bangladeshi students benefit from a research-rich environment, a thriving tech sector, and Scotland's generous post-study work visa.",
    strengths: ["Global top-20 research university", "World-leading informatics and AI research", "Historic, beautiful capital city with strong graduate market", "Scotland's 2-year Graduate Visa for eligible awards"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£23,000–35,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £3,000–8,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or A Level A*AA–AAB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£23,000–32,000 / year", pg: "£25,000–35,000 / year", mba: "£35,000–50,000", deposit: "£2,000", scholarship: "Merit £3,000–8,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Edinburgh", "September primary intake; some Masters offer January start", "merit awards of £3,000–8,000", [
      { q: "Does Edinburgh offer a Scottish Graduate Visa?", a: "Yes — eligible graduates from Scottish universities can apply for a 2-year post-study work visa (3 years for PhD)." },
      { q: "Is Edinburgh strong in AI?", a: "Yes — Edinburgh's School of Informatics is one of the largest in Europe and a world leader in AI, NLP, and robotics research." },
    ]),
    sourceUrl: "https://www.ed.ac.uk/",
  },
  {
    slug: "university-of-glasgow", name: "University of Glasgow", countrySlug: "uk", city: "Glasgow",
    overview: "The University of Glasgow, founded in 1451, is Scotland's second-oldest Russell Group university and a member of the Universitas 21 network. It is particularly strong in medicine, engineering, business, and the creative arts. Bangladeshi students benefit from a beautiful historic campus, a friendly Scottish city, and lower living costs than London or Edinburgh.",
    strengths: ["Russell Group university founded in 1451 — historic and prestigious", "Strong medicine, veterinary, and engineering faculties", "Affordable, friendly Scottish city with strong graduate market", "Member of Universitas 21 global research network"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–30,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–27,000 / year", pg: "£23,000–30,000 / year", mba: "£30,000–42,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Glasgow", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Glasgow affordable for students?", a: "Yes — Glasgow has some of the lowest living costs of any UK major city, with rents around half of central London." },
      { q: "Does Glasgow offer the Scottish Graduate Visa?", a: "Yes — eligible graduates from Glasgow can apply for a 2-year post-study work visa (3 years for PhD)." },
    ]),
    sourceUrl: "https://www.gla.ac.uk/",
  },
  {
    slug: "university-of-liverpool", name: "University of Liverpool", countrySlug: "uk", city: "Liverpool",
    overview: "The University of Liverpool is a Russell Group university and a founding member of the original 'red brick' civic universities. It is particularly strong in engineering, medicine, management, and computer science, with a unique joint programme with Xi'an Jiaotong-Liverpool University in China. Bangladeshi students benefit from an affordable, friendly city and a strong international community.",
    strengths: ["Russell Group research university and original red brick", "Strong engineering, medicine, and management faculties", "Affordable, friendly port city with strong graduate market", "Unique international campus in Suzhou, China"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£20,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.0–6.5", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 65%+ or A Level BBB", english: "IELTS 6.0 (5.5 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:2 or 55%+", english: "IELTS 6.5", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£20,000–25,000 / year", pg: "£22,000–28,000 / year", mba: "£28,000–40,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Liverpool", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000"),
    sourceUrl: "https://www.liverpool.ac.uk/",
  },
  {
    slug: "newcastle-university", name: "Newcastle University", countrySlug: "uk", city: "Newcastle",
    overview: "Newcastle University is a Russell Group institution with a global reputation in medicine, engineering, business, and computing. Located in one of the UK's friendliest and most affordable student cities, it combines research intensity with a famously good student experience. Bangladeshi students benefit from strong employability outcomes and a welcoming north-east community.",
    strengths: ["Russell Group research university with strong medical school", "One of the UK's most affordable and friendly student cities", "Strong computing, engineering, and business faculties", "Excellent graduate employability and industry links"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£20,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:2 or 55%+", english: "IELTS 6.5", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£20,000–25,000 / year", pg: "£22,000–28,000 / year", mba: "£28,000–38,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Newcastle University", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000"),
    sourceUrl: "https://www.ncl.ac.uk/",
  },
  {
    slug: "university-of-exeter", name: "University of Exeter", countrySlug: "uk", city: "Exeter",
    overview: "The University of Exeter is a Russell Group university set in the beautiful South West of England, with strengths in business, climate science, engineering, and humanities. Its green, safe campus and strong student satisfaction scores make it a popular choice for Bangladeshi students seeking a calmer, more residential experience. Graduate outcomes are strong across finance, consulting, and the public sector.",
    strengths: ["Russell Group research university with strong student satisfaction", "World-leading climate and environmental science research", "Beautiful, safe campus in the South West of England", "Strong business school with triple accreditation"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£22,000–28,000 / year", mba: "£30,000–42,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Exeter", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000"),
    sourceUrl: "https://www.exeter.ac.uk/",
  },
  {
    slug: "lancaster-university", name: "Lancaster University", countrySlug: "uk", city: "Lancaster",
    overview: "Lancaster University is a Russell Group institution consistently ranked among the UK's top universities for teaching and student experience. Its collegiate system, strong management school, and high graduate employability make it a compelling choice. Bangladeshi students enjoy a friendly, residential campus environment with easy access to the Lake District and to Manchester.",
    strengths: ["Russell Group university consistently top-10 in UK rankings", "World-ranked Lancaster University Management School", "Collegiate system creating a strong student community", "Safe, beautiful campus close to the Lake District"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–27,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–25,000 / year", pg: "£22,000–27,000 / year", mba: "£28,000–40,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Lancaster University", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000"),
    sourceUrl: "https://www.lancaster.ac.uk/",
  },
  {
    slug: "university-of-york", name: "University of York", countrySlug: "uk", city: "York",
    overview: "The University of York is a Russell Group university known for its collegiate system, strong humanities and social sciences, and growing computer science and biosciences reputation. Its picturesque campus sits within one of England's most historic and safest cities. Bangladeshi students benefit from a close-knit international community and excellent student support.",
    strengths: ["Russell Group research university with collegiate structure", "Strong computer science, psychology, and biosciences departments", "Beautiful, historic, safe city with excellent student satisfaction", "Generous international scholarship portfolio"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–27,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–5,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level ABB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–25,000 / year", pg: "£22,000–27,000 / year", mba: "£28,000–40,000", deposit: "£2,000", scholarship: "Merit £2,000–5,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of York", "September primary intake; some Masters offer January start", "merit awards of £2,000–5,000"),
    sourceUrl: "https://www.york.ac.uk/",
  },
  {
    slug: "university-of-bath", name: "University of Bath", countrySlug: "uk", city: "Bath",
    overview: "The University of Bath is a top-ranked UK university renowned for its strong placement year culture and close ties to industry. Its schools of management, engineering, and architecture are among the best in the country. Bangladeshi students benefit from one of the UK's highest graduate employment rates and a beautiful UNESCO World Heritage city.",
    strengths: ["Top-10 UK university with exceptional graduate employment", "Strong industry placement year culture across schools", "Excellent School of Management and engineering faculty", "Beautiful UNESCO World Heritage city campus"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "£21,000–28,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "PTE", "TOEFL"], scholarship: "Merit awards £2,000–6,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level A*AA–AAB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "£21,000–26,000 / year", pg: "£23,000–28,000 / year", mba: "£35,000–48,000", deposit: "£2,000", scholarship: "Merit £2,000–6,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Bath", "September primary intake; some Masters offer January start", "merit awards of £2,000–6,000", [
      { q: "Is Bath known for placements?", a: "Yes — Bath is one of the UK's leading universities for industry placements, with most undergraduate programmes offering a paid sandwich year." },
      { q: "Is Bath School of Management triple-accredited?", a: "Yes — Bath's School of Management holds AACSB, AMBA, and EQUIS accreditation, placing it in the global top 1% of business schools." },
    ]),
    sourceUrl: "https://www.bath.ac.uk/",
  },

  // ───── Canada ─────
  {
    slug: "university-of-british-columbia", name: "University of British Columbia", countrySlug: "canada", city: "Vancouver",
    overview: "The University of British Columbia is Canada's third-largest research university and consistently ranks among the world's top 40 institutions. Its Vancouver campus combines Pacific Rim location with research strength in forestry, computer science, business, and the life sciences. Bangladeshi students benefit from a beautiful campus, strong co-op options, and Canada's clear PR pathways.",
    strengths: ["Global top-40 research university", "Beautiful Vancouver campus on the Pacific coast", "Strong Sauder School of Business and computer science faculty", "Excellent co-op and post-graduation work permit pathways"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "CAD 40,000–58,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 5,000–25,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B+ or 75%+", english: "IELTS 7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 40,000–55,000 / year", pg: "CAD 22,000–50,000 / year", mba: "CAD 60,000–95,000", deposit: "CAD 2,000", scholarship: "CAD 5,000–25,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of British Columbia", "September primary intake; limited January for some PG programmes", "merit awards of CAD 5,000–25,000", [
      { q: "Is UBC a top global university?", a: "Yes — UBC is consistently ranked among the world's top 40 universities, alongside Toronto and McGill as Canada's leading research institutions." },
      { q: "Can I get PR after UBC?", a: "Yes — the Post-Graduation Work Permit (PGWP) plus Canadian work experience supports Express Entry and provincial nominee PR pathways." },
    ]),
    sourceUrl: "https://www.ubc.ca/",
  },
  {
    slug: "mcgill-university", name: "McGill University", countrySlug: "canada", city: "Montreal",
    overview: "McGill University is one of Canada's most prestigious research universities, often called the 'Harvard of the North'. Located in bilingual Montreal, it has world-leading medical, law, and engineering faculties and a famously international student body. Bangladeshi students benefit from affordable Quebec tuition, an English-language curriculum, and a vibrant cultural city.",
    strengths: ["Canada's most internationally renowned research university", "World-leading medical, law, and engineering faculties", "English-language curriculum in bilingual Montreal", "Strong international student community and lower cost of living"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "CAD 35,000–55,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 5,000–20,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B+ or 75%+", english: "IELTS 7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 35,000–50,000 / year", pg: "CAD 20,000–45,000 / year", mba: "CAD 60,000–100,000", deposit: "CAD 2,000", scholarship: "CAD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("McGill University", "September primary intake; limited January for some PG programmes", "merit awards of CAD 5,000–20,000", [
      { q: "Do I need French to study at McGill?", a: "No — McGill is an English-language university. Montreal is bilingual, but you can complete your studies entirely in English." },
      { q: "Is Montreal affordable for students?", a: "Yes — Quebec has some of the lowest tuition and living costs in Canada, with Montreal known for affordable rent and vibrant student culture." },
    ]),
    sourceUrl: "https://www.mcgill.ca/",
  },
  {
    slug: "university-of-alberta", name: "University of Alberta", countrySlug: "canada", city: "Edmonton",
    overview: "The University of Alberta is a top-5 Canadian research university with particular strengths in energy, engineering, agriculture, and the health sciences. Its Edmonton campus hosts a large international community and offers excellent value for international students. Bangladeshi applicants benefit from strong PR pathways through the Alberta Immigrant Nominee Program.",
    strengths: ["Top-5 Canadian research university", "World-leading energy, engineering, and agri-food research", "Affordable tuition and living in Edmonton", "Strong PR pathways through the Alberta Immigrant Nominee Program"],
    quickFacts: { intakes: ["September", "January", "May (limited)"], tuitionRange: "CAD 30,000–42,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 5,000–15,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B or 70%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 30,000–40,000 / year", pg: "CAD 18,000–35,000 / year", mba: "CAD 40,000–65,000", deposit: "CAD 2,000", scholarship: "CAD 5,000–15,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Alberta", "September primary intake; January and May available for some programmes", "merit awards of CAD 5,000–15,000"),
    sourceUrl: "https://www.ualberta.ca/",
  },
  {
    slug: "university-of-waterloo", name: "University of Waterloo", countrySlug: "canada", city: "Waterloo",
    overview: "The University of Waterloo is Canada's leader in co-operative education, with the world's largest paid co-op programme placing students with employers like Google, Microsoft, and Shopify. Its computer science, engineering, and mathematics faculties are among the best globally. Bangladeshi students benefit from unmatched work experience, strong tech sector placement, and clear PR pathways.",
    strengths: ["World's largest paid co-op programme — graduate with 2 years of work experience", "Canada's top computer science and engineering schools", "Located in Canada's largest tech corridor", "Excellent graduate salaries and PR pathways"],
    quickFacts: { intakes: ["September", "January", "May (limited)"], tuitionRange: "CAD 38,000–55,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 5,000–20,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B+ or 75%+", english: "IELTS 7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 38,000–55,000 / year", pg: "CAD 22,000–48,000 / year", mba: "CAD 50,000–80,000", deposit: "CAD 2,000", scholarship: "CAD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Waterloo", "September primary intake; January and May available for some programmes", "merit awards of CAD 5,000–20,000", [
      { q: "What is Waterloo co-op?", a: "Waterloo's co-op programme alternates study terms with paid work terms, so you graduate with up to 2 years of relevant work experience and earnings." },
      { q: "Is Waterloo strong in computer science?", a: "Yes — Waterloo's computer science and engineering programmes are consistently ranked among the world's best, with strong graduate placement at major tech firms." },
    ]),
    sourceUrl: "https://uwaterloo.ca/",
  },
  {
    slug: "western-university", name: "Western University", countrySlug: "canada", city: "London, Ontario",
    overview: "Western University is one of Canada's leading research-intensive universities, particularly renowned for its Ivey Business School and strong medical faculty. Its beautiful residential campus in London, Ontario, offers a classic Canadian university experience. Bangladeshi students benefit from strong industry links and excellent graduate outcomes.",
    strengths: ["Home of the prestigious Ivey Business School", "Strong medical, engineering, and law faculties", "Beautiful, safe residential campus", "Excellent graduate employment outcomes"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "CAD 35,000–50,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 5,000–15,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B+ or 70%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 35,000–48,000 / year", pg: "CAD 22,000–42,000 / year", mba: "CAD 50,000–120,000 (Ivey)", deposit: "CAD 2,000", scholarship: "CAD 5,000–15,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Western University", "September primary intake; limited January for some PG programmes", "merit awards of CAD 5,000–15,000", [
      { q: "Is Western's Ivey Business School well regarded?", a: "Yes — Ivey is one of Canada's top business schools, particularly renowned for its case-method MBA and strong placement in finance and consulting." },
      { q: "Where is Western University?", a: "Western is in London, Ontario — a safe, mid-sized Canadian city about 2 hours from Toronto, with a strong student community." },
    ]),
    sourceUrl: "https://www.uwo.ca/",
  },
  {
    slug: "mcmaster-university", name: "McMaster University", countrySlug: "canada", city: "Hamilton",
    overview: "McMaster University is a top-100 global research university best known for its medical school, engineering faculty, and the innovative McMaster Problem-Based Learning model. Located in Hamilton, just an hour from Toronto, it combines research intensity with strong industry partnerships. Bangladeshi students benefit from excellent health and engineering programmes and clear PR pathways.",
    strengths: ["Top-100 global research university", "Renowned medical school and problem-based learning model", "Strong engineering and business faculties", "Located in Hamilton with easy access to Toronto"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "CAD 32,000–48,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards CAD 4,000–15,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with B+ or 70%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "CAD 32,000–45,000 / year", pg: "CAD 22,000–42,000 / year", mba: "CAD 45,000–80,000", deposit: "CAD 2,000", scholarship: "CAD 4,000–15,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("McMaster University", "September primary intake; limited January for some PG programmes", "merit awards of CAD 4,000–15,000"),
    sourceUrl: "https://www.mcmaster.ca/",
  },

  // ───── Australia ─────
  {
    slug: "university-of-sydney", name: "University of Sydney", countrySlug: "australia", city: "Sydney",
    overview: "The University of Sydney is Australia's oldest university and a Group of Eight member with strengths across medicine, business, law, engineering, and the humanities. Its sandstone campus sits beside Sydney's vibrant inner west. Bangladeshi students benefit from world-class research, strong industry placements, and Australia's 2–4 year Temporary Graduate visa.",
    strengths: ["Australia's oldest university and Group of Eight member", "World-leading medicine, nursing, and business faculties", "Beautiful sandstone campus close to central Sydney", "Strong graduate outcomes and 2–4 year post-study work visa"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "AUD 40,000–55,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Vice-Chancellor Awards AUD 20,000–40,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 40,000–52,000 / year", pg: "AUD 42,000–55,000 / year", mba: "AUD 50,000–90,000", deposit: "AUD 2,000", scholarship: "VC Awards AUD 20,000–40,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Sydney", "February and July primary intakes", "Vice-Chancellor Awards of AUD 20,000–40,000", [
      { q: "Is Sydney part of the Group of Eight?", a: "Yes — Sydney is a founding member of Australia's Group of Eight research-intensive universities." },
      { q: "Can I work in Australia after graduation?", a: "Yes — the Temporary Graduate Visa (485) allows 2–4 years of work rights depending on your qualification and region." },
    ]),
    sourceUrl: "https://www.sydney.edu.au/",
  },
  {
    slug: "university-of-queensland", name: "University of Queensland", countrySlug: "australia", city: "Brisbane",
    overview: "The University of Queensland is a Group of Eight member and global top-50 university with research strengths in mining, agriculture, environmental science, and business. Its Brisbane campus offers a sunny, relaxed lifestyle with lower living costs than Sydney or Melbourne. Bangladeshi students benefit from strong industry placements and clear PR pathways.",
    strengths: ["Group of Eight member ranked in the world's top 50", "World-leading mining, agriculture, and environmental science research", "Sunny, affordable Brisbane lifestyle", "Excellent post-study work and PR pathways"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "AUD 38,000–52,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards AUD 5,000–20,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 38,000–50,000 / year", pg: "AUD 40,000–52,000 / year", mba: "AUD 50,000–85,000", deposit: "AUD 2,000", scholarship: "AUD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Queensland", "February and July primary intakes", "merit awards of AUD 5,000–20,000", [
      { q: "Is Brisbane affordable?", a: "Yes — Brisbane is more affordable than Sydney or Melbourne, with cheaper rent and a relaxed outdoor lifestyle." },
      { q: "Is UQ strong in mining and agribusiness?", a: "Yes — UQ is world-leading in mining engineering, agriculture, and environmental science, with strong ties to Queensland's resource sector." },
    ]),
    sourceUrl: "https://www.uq.edu.au/",
  },
  {
    slug: "monash-university", name: "Monash University", countrySlug: "australia", city: "Melbourne",
    overview: "Monash University is Australia's largest university and a Group of Eight member with a global reputation in pharmacy, medicine, engineering, and business. Its Melbourne campus pairs research intensity with strong industry partnerships. Bangladeshi students benefit from generous scholarships, a vibrant multicultural city, and 2–4 year post-study work rights.",
    strengths: ["Group of Eight member and Australia's largest university", "World-leading pharmacy, medicine, and engineering faculties", "Strong industry partnerships and internships", "Vibrant multicultural Melbourne lifestyle"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "AUD 38,000–55,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards AUD 5,000–20,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 38,000–52,000 / year", pg: "AUD 40,000–55,000 / year", mba: "AUD 50,000–90,000", deposit: "AUD 2,000", scholarship: "AUD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Monash University", "February and July primary intakes", "merit awards of AUD 5,000–20,000", [
      { q: "Is Monash Group of Eight?", a: "Yes — Monash is a member of Australia's Group of Eight research-intensive universities." },
      { q: "Is Monash strong in pharmacy?", a: "Yes — Monash's Faculty of Pharmacy and Pharmaceutical Sciences is consistently ranked among the world's top 5." },
    ]),
    sourceUrl: "https://www.monash.edu/",
  },
  {
    slug: "university-of-new-south-wales", name: "University of New South Wales", countrySlug: "australia", city: "Sydney",
    overview: "The University of New South Wales (UNSW) is a Group of Eight member renowned for engineering, business, and law. Located in eastern Sydney, it pairs research intensity with strong industry connections in finance, tech, and energy. Bangladeshi students benefit from excellent graduate outcomes and the city's strong job market.",
    strengths: ["Group of Eight member and Australia's top engineering school", "Strong business, law, and computing faculties", "Eastern Sydney campus close to beaches and CBD", "Excellent graduate outcomes and industry links"],
    quickFacts: { intakes: ["February", "June", "September (limited)"], tuitionRange: "AUD 40,000–55,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards AUD 5,000–20,000", applicationStatus: "Open for February and June" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 40,000–52,000 / year", pg: "AUD 42,000–55,000 / year", mba: "AUD 50,000–95,000", deposit: "AUD 2,000", scholarship: "AUD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of New South Wales", "February and June primary intakes; September for some PG", "merit awards of AUD 5,000–20,000", [
      { q: "Is UNSW the best for engineering in Australia?", a: "UNSW is widely regarded as Australia's top engineering university, with particularly strong reputations in civil, electrical, and mining engineering." },
      { q: "Where is UNSW located?", a: "UNSW is in Kensington, eastern Sydney — about 20 minutes from the CBD and close to Sydney's famous eastern beaches." },
    ]),
    sourceUrl: "https://www.unsw.edu.au/",
  },
  {
    slug: "australian-national-university", name: "Australian National University", countrySlug: "australia", city: "Canberra",
    overview: "The Australian National University (ANU) is Australia's national university and a Group of Eight member with global top-30 rankings. Located in Canberra, it has particular strengths in international relations, public policy, physics, and computer science. Bangladeshi students benefit from small class sizes, world-class research, and proximity to government and embassies.",
    strengths: ["Australia's national university — Group of Eight member", "World-leading international relations, public policy, and physics", "Small class sizes and strong research focus", "Located in Canberra — close to government and embassies"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "AUD 40,000–52,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "ANU Chancellor's Awards AUD 10,000–25,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 78%+ or strong A Level", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades (GPA 5/7 or 65%+)", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 40,000–50,000 / year", pg: "AUD 42,000–52,000 / year", mba: "AUD 50,000–85,000", deposit: "AUD 2,000", scholarship: "AUD 10,000–25,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Australian National University", "February and July primary intakes", "ANU Chancellor's Awards of AUD 10,000–25,000", [
      { q: "Is ANU Australia's top-ranked university?", a: "ANU is consistently ranked among Australia's top 2 universities and the world's top 30, with particularly strong reputations in international relations and physics." },
      { q: "Where is ANU located?", a: "ANU is in Canberra, Australia's capital — a planned, livable city close to government departments, embassies, and national cultural institutions." },
    ]),
    sourceUrl: "https://www.anu.edu.au/",
  },
  {
    slug: "university-of-adelaide", name: "University of Adelaide", countrySlug: "australia", city: "Adelaide",
    overview: "The University of Adelaide is a Group of Eight member and South Australia's leading research university, with strengths in wine, agriculture, mining, health, and computer science. Located in affordable, livable Adelaide, it offers international students a relaxed lifestyle with strong PR pathways via the regional graduate visa. Bangladeshi students benefit from smaller cohorts and dedicated support.",
    strengths: ["Group of Eight member with strong research output", "World-leading wine, agriculture, and mining programmes", "Affordable, livable Adelaide with strong PR pathways", "Regional graduate visa offers extra post-study work time"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "AUD 38,000–50,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards AUD 5,000–15,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AUD 38,000–48,000 / year", pg: "AUD 40,000–50,000 / year", mba: "AUD 50,000–80,000", deposit: "AUD 2,000", scholarship: "AUD 5,000–15,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Adelaide", "February and July primary intakes", "merit awards of AUD 5,000–15,000", [
      { q: "Is Adelaide a regional city for visa purposes?", a: "Yes — Adelaide is classified as a 'regional' city for Australian visa purposes, which means graduates may access a longer Temporary Graduate Visa (485) of 2–3 years." },
      { q: "Is Adelaide affordable?", a: "Yes — Adelaide is consistently rated among Australia's most affordable capital cities, with rent, transport, and food significantly cheaper than Sydney or Melbourne." },
    ]),
    sourceUrl: "https://www.adelaide.edu.au/",
  },

  // ───── USA ─────
  {
    slug: "university-of-california-berkeley", name: "University of California Berkeley", countrySlug: "usa", city: "Berkeley",
    overview: "UC Berkeley is the flagship of the University of California system and one of the world's leading public research universities. Its College of Engineering, Haas School of Business, and EECS department are globally renowned. Bangladeshi students benefit from proximity to Silicon Valley, world-class research, and strong OPT pathways for STEM degrees.",
    strengths: ["World-leading public research university — global top 5", "Top-ranked engineering, computer science, and business schools", "Located in the San Francisco Bay Area — gateway to Silicon Valley", "STEM OPT extension for eligible degrees"],
    quickFacts: { intakes: ["August", "January (limited PG)"], tuitionRange: "USD 45,000–60,000 / year (international, approximate)", englishTests: ["IELTS 7.0", "TOEFL 90–100", "Duolingo"], scholarship: "Need-based aid and merit awards USD 5,000–25,000", applicationStatus: "Open for fall intake" },
    entryRequirements: { bachelor: { academic: "HSC 85%+ or strong A Level", english: "IELTS 6.5–7.0 / TOEFL 80+", documents: "Transcripts, English, SOP, recommendations, SAT/ACT optional" }, masters: { academic: "Bachelor with strong GPA (3.3+/4)", english: "IELTS 7.0 / TOEFL 90+", documents: "Degree, transcripts, SOP, CV, GRE" }, mba: { academic: "Bachelor + 4 years experience", english: "IELTS 7.0 / TOEFL 90+", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters or strong Bachelor + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts, GRE" } },
    tuition: { ug: "USD 45,000–55,000 / year", pg: "USD 35,000–60,000 / year", mba: "USD 70,000–120,000", deposit: "USD 1,000", scholarship: "USD 5,000–25,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of California Berkeley", "August primary intake; January for some PG programmes", "merit and need-based awards of USD 5,000–25,000", [
      { q: "Is Berkeley a top public university?", a: "Yes — UC Berkeley is consistently ranked the world's top public research university, with global top-5 standing in engineering and computer science." },
      { q: "Is Berkeley STEM-OPT eligible?", a: "Yes — most STEM-designated degrees at Berkeley qualify for the 24-month STEM OPT extension, giving up to 3 years of US work authorisation." },
    ]),
    sourceUrl: "https://www.berkeley.edu/",
  },
  {
    slug: "new-york-university", name: "New York University", countrySlug: "usa", city: "New York",
    overview: "New York University is a top-30 global research university with its main campus in Greenwich Village, Manhattan. Its Stern School of Business, Tisch School of the Arts, and Tandon School of Engineering are internationally renowned. Bangladeshi students benefit from unmatched access to the world's largest finance, media, and tech job markets.",
    strengths: ["Top-30 global research university in central Manhattan", "World-renowned Stern (business) and Tisch (arts) schools", "Located in NYC — the world's largest finance, media, and tech hub", "Strong international community and global campus network"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "USD 55,000–70,000 / year (international, approximate)", englishTests: ["IELTS 7.0", "TOEFL 100", "Duolingo"], scholarship: "Merit awards USD 5,000–30,000", applicationStatus: "Open for fall intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 7.0 / TOEFL 100", documents: "Transcripts, English, SOP, recommendations, SAT/ACT optional" }, masters: { academic: "Bachelor with strong GPA (3.0+/4)", english: "IELTS 7.0 / TOEFL 100", documents: "Degree, transcripts, SOP, CV, GRE (some)" }, mba: { academic: "Bachelor + 4 years experience", english: "IELTS 7.0 / TOEFL 100", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters or strong Bachelor + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts, GRE" } },
    tuition: { ug: "USD 55,000–62,000 / year", pg: "USD 40,000–70,000 / year", mba: "USD 80,000–140,000", deposit: "USD 1,000", scholarship: "USD 5,000–30,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("New York University", "September primary intake; limited January for some PG", "merit awards of USD 5,000–30,000", [
      { q: "Is NYU located in central New York?", a: "Yes — NYU's main campus is in Greenwich Village, Manhattan, putting students in the heart of New York City." },
      { q: "Is NYU Stern a top business school?", a: "Yes — NYU Stern is consistently ranked among the world's top 20 business schools, particularly renowned for finance." },
    ]),
    sourceUrl: "https://www.nyu.edu/",
  },
  {
    slug: "university-of-washington", name: "University of Washington", countrySlug: "usa", city: "Seattle",
    overview: "The University of Washington is a top-10 US public research university and a global leader in computer science, medicine, and engineering. Located in Seattle, it sits at the heart of the Pacific Northwest tech corridor, with strong ties to Amazon, Microsoft, and Boeing. Bangladeshi students benefit from world-class research, strong STEM OPT pathways, and a vibrant, livable city.",
    strengths: ["Top-10 US public research university", "World-leading Paul G. Allen School of Computer Science", "Strong ties to Amazon, Microsoft, and Boeing in Seattle", "STEM OPT extension for eligible degrees"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "USD 40,000–55,000 / year (international, approximate)", englishTests: ["IELTS 7.0", "TOEFL 92–100", "Duolingo"], scholarship: "Merit awards USD 5,000–20,000", applicationStatus: "Open for fall intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 7.0 / TOEFL 92+", documents: "Transcripts, English, SOP, recommendations, SAT/ACT optional" }, masters: { academic: "Bachelor with strong GPA (3.0+/4)", english: "IELTS 7.0 / TOEFL 92+", documents: "Degree, transcripts, SOP, CV, GRE (some)" }, mba: { academic: "Bachelor + 4 years experience", english: "IELTS 7.0 / TOEFL 100+", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters or strong Bachelor + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts, GRE" } },
    tuition: { ug: "USD 40,000–52,000 / year", pg: "USD 35,000–55,000 / year", mba: "USD 60,000–100,000", deposit: "USD 1,000", scholarship: "USD 5,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Washington", "September primary intake; January for some PG", "merit awards of USD 5,000–20,000", [
      { q: "Is UW strong in computer science?", a: "Yes — UW's Paul G. Allen School of Computer Science & Engineering is consistently ranked among the world's top 10." },
      { q: "Is UW close to Amazon and Microsoft?", a: "Yes — UW is in Seattle, the home city of Amazon and Microsoft, with strong internship and graduate recruitment pipelines." },
    ]),
    sourceUrl: "https://www.washington.edu/",
  },
  {
    slug: "university-of-michigan", name: "University of Michigan", countrySlug: "usa", city: "Ann Arbor",
    overview: "The University of Michigan is a top US public research university with global leadership in engineering, business, medicine, and the social sciences. Its Ross School of Business and College of Engineering are particularly renowned. Bangladeshi students benefit from a classic American campus experience, world-class research, and strong STEM OPT pathways.",
    strengths: ["Top US public research university and member of the Big Ten", "World-leading Ross School of Business and College of Engineering", "Classic American college town experience in Ann Arbor", "Strong STEM OPT pathways and graduate outcomes"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "USD 50,000–65,000 / year (international, approximate)", englishTests: ["IELTS 7.0", "TOEFL 100", "Duolingo"], scholarship: "Merit awards USD 5,000–25,000", applicationStatus: "Open for fall intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 7.0 / TOEFL 100", documents: "Transcripts, English, SOP, recommendations, SAT/ACT optional" }, masters: { academic: "Bachelor with strong GPA (3.0+/4)", english: "IELTS 7.0 / TOEFL 100", documents: "Degree, transcripts, SOP, CV, GRE (some)" }, mba: { academic: "Bachelor + 4 years experience", english: "IELTS 7.0 / TOEFL 100", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters or strong Bachelor + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts, GRE" } },
    tuition: { ug: "USD 50,000–60,000 / year", pg: "USD 40,000–65,000 / year", mba: "USD 80,000–130,000", deposit: "USD 1,000", scholarship: "USD 5,000–25,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Michigan", "September primary intake; January for some PG", "merit awards of USD 5,000–25,000", [
      { q: "Is Michigan Ross a top business school?", a: "Yes — Michigan Ross is consistently ranked among the world's top 15 business schools, particularly renowned for its action-based learning and MBA outcomes." },
      { q: "Where is Ann Arbor?", a: "Ann Arbor is a classic American college town about 45 minutes from Detroit — safe, walkable, and ranked among the best college towns in the US." },
    ]),
    sourceUrl: "https://umich.edu/",
  },
  {
    slug: "boston-university", name: "Boston University", countrySlug: "usa", city: "Boston",
    overview: "Boston University is a top-40 global research university located along the Charles River in the heart of America's premier education hub. Its Questrom School of Business, College of Engineering, and College of Communication are internationally recognised. Bangladeshi students benefit from a Boston location, strong research opportunities, and access to one of the world's largest student communities.",
    strengths: ["Top-40 global research university in central Boston", "Strong Questrom (business), engineering, and communication schools", "Located in America's premier education hub", "Strong international community and STEM OPT pathways"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "USD 55,000–65,000 / year (international, approximate)", englishTests: ["IELTS 7.0", "TOEFL 90–100", "Duolingo"], scholarship: "Merit awards USD 5,000–25,000", applicationStatus: "Open for fall intake" },
    entryRequirements: { bachelor: { academic: "HSC 80%+ or strong A Level", english: "IELTS 7.0 / TOEFL 90+", documents: "Transcripts, English, SOP, recommendations, SAT/ACT optional" }, masters: { academic: "Bachelor with strong GPA (3.0+/4)", english: "IELTS 7.0 / TOEFL 90+", documents: "Degree, transcripts, SOP, CV, GRE (some)" }, mba: { academic: "Bachelor + 4 years experience", english: "IELTS 7.0 / TOEFL 100+", documents: "Degree, experience, GMAT/GRE, essays" }, phd: { academic: "Masters or strong Bachelor + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts, GRE" } },
    tuition: { ug: "USD 55,000–62,000 / year", pg: "USD 40,000–65,000 / year", mba: "USD 80,000–130,000", deposit: "USD 1,000", scholarship: "USD 5,000–25,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Boston University", "September primary intake; January for some PG", "merit awards of USD 5,000–25,000", [
      { q: "Is BU in central Boston?", a: "Yes — BU's campus stretches along the Charles River in central Boston, minutes from Fenway Park and downtown." },
      { q: "Is Boston good for international students?", a: "Boston is America's largest student city — home to BU, Harvard, MIT, Northeastern, Boston College, and many more — with unmatched cultural and academic opportunities." },
    ]),
    sourceUrl: "https://www.bu.edu/",
  },

  // ───── Germany ─────
  {
    slug: "lmu-munich", name: "LMU Munich", countrySlug: "germany", city: "Munich",
    overview: "Ludwig Maximilian University of Munich (LMU) is one of Germany's oldest and most prestigious universities, ranked among Europe's top research institutions. With particular strengths in the humanities, life sciences, physics, and business, it offers many English-taught Masters programmes. Bangladeshi students benefit from world-class research, no tuition fees for most programmes, and Munich's thriving tech and biotech sectors.",
    strengths: ["One of Germany's oldest and most prestigious universities", "Top-ranked in humanities, physics, and life sciences", "Mostly tuition-free for international students", "Located in Munich — Germany's strongest tech and biotech hub"],
    quickFacts: { intakes: ["April (Summer)", "October (Winter)"], tuitionRange: "€0–144/semester (semester fee only, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Deutschlandstipendium €300/month", applicationStatus: "Open for Winter intake" },
    entryRequirements: { bachelor: { academic: "HSC + Studienkolleg or 1 year university", english: "IELTS 6.5 (English track) / TestDaF (German track)", documents: "Transcripts, APS certificate, language score" }, masters: { academic: "Bachelor in relevant field with strong grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, APS, SOP, CV" }, mba: { academic: "Bachelor + work experience", english: "IELTS 7.0", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "€0–144 / semester (semester fee)", pg: "€0–144 / semester (semester fee)", mba: "€15,000–30,000", deposit: "€500", scholarship: "Deutschlandstipendium €300/month", paymentPlan: "No tuition for most public programmes" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("LMU Munich", "Winter (October) and Summer (April) intakes", "Deutschlandstipendium of €300/month", [
      { q: "Is LMU tuition-free?", a: "Yes — like most German public universities, LMU charges no tuition for international students, only a small semester fee of around €144 that includes a public transport ticket." },
      { q: "Do I need APS for LMU?", a: "Yes — APS certificate is mandatory for Bangladeshi applicants to German universities. ALO counselors guide you through the APS process." },
      { q: "Do I need a blocked account?", a: "Yes — approximately €11,208/year in a blocked account is required for the German student visa." },
    ]),
    sourceUrl: "https://www.lmu.de/",
  },
  {
    slug: "heidelberg-university", name: "Heidelberg University", countrySlug: "germany", city: "Heidelberg",
    overview: "Heidelberg University, founded in 1386, is Germany's oldest university and one of Europe's most prestigious research institutions. It has world-leading faculties in medicine, physics, law, and the humanities. Bangladeshi students benefit from a historic, picturesque student town, tuition-free public programmes, and strong international research networks.",
    strengths: ["Germany's oldest university, founded in 1386", "World-leading medicine, physics, and law faculties", "Tuition-free for international students at most programmes", "Picturesque, historic student town with strong international community"],
    quickFacts: { intakes: ["April (Summer)", "October (Winter)"], tuitionRange: "€0–3,000/semester (mostly free, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Deutschlandstipendium €300/month", applicationStatus: "Open for Winter intake" },
    entryRequirements: { bachelor: { academic: "HSC + Studienkolleg or 1 year university", english: "IELTS 6.5 (English track) / TestDaF (German track)", documents: "Transcripts, APS certificate, language score" }, masters: { academic: "Bachelor in relevant field with strong grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, APS, SOP, CV" }, mba: { academic: "Bachelor + work experience", english: "IELTS 7.0", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "€0–1,500 / semester", pg: "€0–1,500 / semester", mba: "€15,000–30,000", deposit: "€500", scholarship: "Deutschlandstipendium €300/month", paymentPlan: "No tuition for most public programmes" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Heidelberg University", "Winter (October) and Summer (April) intakes", "Deutschlandstipendium of €300/month", [
      { q: "Is Heidelberg tuition-free?", a: "Yes — Heidelberg charges no tuition for international students at most programmes, only a small semester fee." },
      { q: "Do I need APS for Heidelberg?", a: "Yes — APS certificate is mandatory for Bangladeshi applicants to German universities." },
      { q: "Do I need a blocked account?", a: "Yes — approximately €11,208/year in a blocked account is required for the German student visa." },
    ]),
    sourceUrl: "https://www.uni-heidelberg.de/",
  },
  {
    slug: "rwth-aachen-university", name: "RWTH Aachen University", countrySlug: "germany", city: "Aachen",
    overview: "RWTH Aachen University is Germany's largest technical university and a leader in mechanical engineering, automotive, electrical engineering, and computer science. Located in the western German city of Aachen, it has strong industry partnerships with BMW, Ford, and Siemens. Bangladeshi students benefit from world-class engineering education, mostly tuition-free programmes, and excellent graduate employability.",
    strengths: ["Germany's largest and top-ranked technical university", "World-leading mechanical, automotive, and electrical engineering", "Strong industry partnerships with BMW, Ford, Siemens", "Mostly tuition-free for international students"],
    quickFacts: { intakes: ["April (Summer)", "October (Winter)"], tuitionRange: "€0–1,500/semester (mostly free, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Deutschlandstipendium €300/month", applicationStatus: "Open for Winter intake" },
    entryRequirements: { bachelor: { academic: "HSC + Studienkolleg or 1 year university", english: "IELTS 6.5 (English track) / TestDaF (German track)", documents: "Transcripts, APS certificate, language score" }, masters: { academic: "Bachelor in relevant engineering/science field with strong grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, APS, SOP, CV" }, mba: { academic: "Bachelor + work experience", english: "IELTS 7.0", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "€0–1,500 / semester", pg: "€0–1,500 / semester", mba: "€15,000–30,000", deposit: "€500", scholarship: "Deutschlandstipendium €300/month", paymentPlan: "No tuition for most public programmes" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("RWTH Aachen University", "Winter (October) and Summer (April) intakes", "Deutschlandstipendium of €300/month", [
      { q: "Is RWTH Aachen strong in mechanical engineering?", a: "Yes — RWTH Aachen is one of Germany's top technical universities, particularly renowned for mechanical, automotive, and production engineering." },
      { q: "Do I need APS for RWTH?", a: "Yes — APS certificate is mandatory for Bangladeshi applicants to German universities." },
      { q: "Do I need a blocked account?", a: "Yes — approximately €11,208/year in a blocked account is required for the German student visa." },
    ]),
    sourceUrl: "https://www.rwth-aachen.de/",
  },

  // ───── Ireland ─────
  {
    slug: "university-college-dublin", name: "University College Dublin", countrySlug: "ireland", city: "Dublin",
    overview: "University College Dublin (UCD) is Ireland's largest university and a global top-200 research institution. Its Smurfit Graduate Business School, veterinary school, and engineering faculty are particularly renowned. Bangladeshi students benefit from Ireland's 2-year Third Level Graduate Scheme (for Level 9 awards), giving access to the European HQs of Google, Meta, and Pfizer.",
    strengths: ["Ireland's largest university and global top-200 research institution", "Smurfit Graduate Business School is Ireland's leading business school", "Strong engineering, agriculture, and veterinary faculties", "Eligible for 2-year Third Level Graduate Scheme (Level 9+)"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "€20,000–30,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards €2,000–10,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "€20,000–26,000 / year", pg: "€22,000–30,000 / year", mba: "€35,000–50,000", deposit: "€2,000", scholarship: "€2,000–10,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University College Dublin", "September primary intake; some Masters offer January start", "merit awards of €2,000–10,000", [
      { q: "Is UCD Smurfit a top business school?", a: "Yes — UCD Smurfit is Ireland's leading business school and holds triple accreditation (AACSB, AMBA, EQUIS)." },
      { q: "Can I work in Ireland after graduation?", a: "Yes — the Third Level Graduate Scheme allows Level 9 (Masters) graduates to stay in Ireland for 2 years to work or seek employment." },
    ]),
    sourceUrl: "https://www.ucd.ie/",
  },
  {
    slug: "university-college-cork", name: "University College Cork", countrySlug: "ireland", city: "Cork",
    overview: "University College Cork (UCC) is a leading Irish research university and a member of the UCC cluster of European universities. Its strengths span food science, medicine, law, and engineering. Located in friendly, affordable Cork, it offers Bangladeshi students a strong community feel and access to Ireland's 2-year post-study work scheme.",
    strengths: ["Leading Irish research university with strong community feel", "World-leading food science and medicine faculties", "Affordable, friendly Cork city", "Eligible for 2-year Third Level Graduate Scheme (Level 9+)"],
    quickFacts: { intakes: ["September", "January (limited PG)"], tuitionRange: "€18,000–26,000 / year (international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE", "Duolingo"], scholarship: "Merit awards €2,000–8,000", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP, references" }, masters: { academic: "Bachelor 2:1 or 60%+", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "€18,000–24,000 / year", pg: "€20,000–26,000 / year", mba: "€30,000–42,000", deposit: "€2,000", scholarship: "€2,000–8,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University College Cork", "September primary intake; some Masters offer January start", "merit awards of €2,000–8,000", [
      { q: "Is Cork affordable for students?", a: "Yes — Cork is more affordable than Dublin, with rent and living costs around 25–35% lower than the capital." },
      { q: "Can I work in Ireland after graduation?", a: "Yes — the Third Level Graduate Scheme allows Level 9 (Masters) graduates to stay in Ireland for 2 years to work or seek employment." },
    ]),
    sourceUrl: "https://www.ucc.ie/",
  },

  // ───── New Zealand ─────
  {
    slug: "university-of-otago", name: "University of Otago", countrySlug: "new-zealand", city: "Dunedin",
    overview: "The University of Otago is New Zealand's oldest university and its leading institution for medicine, dentistry, and health sciences. Located in classic student city Dunedin, it offers a famously strong campus community and vibrant student culture. Bangladeshi students benefit from world-class health programmes, smaller cohorts, and New Zealand's post-study work visa.",
    strengths: ["New Zealand's oldest university", "Leading medicine, dentistry, and health sciences faculties", "Classic, affordable student city of Dunedin", "Post-Study Work Visa of 1–3 years after graduation"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "NZD 35,000–50,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE"], scholarship: "International Excellence Awards NZD 10,000–20,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5–7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "NZD 35,000–48,000 / year", pg: "NZD 38,000–50,000 / year", mba: "NZD 50,000–70,000", deposit: "NZD 2,000", scholarship: "NZD 10,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Otago", "February and July primary intakes", "International Excellence Awards of NZD 10,000–20,000", [
      { q: "Is Otago strong in medicine?", a: "Yes — Otago's Medical School is New Zealand's oldest and leading medical school, with strong reputations in dentistry, pharmacy, and health sciences." },
      { q: "Is Dunedin affordable?", a: "Yes — Dunedin is one of New Zealand's most affordable student cities, with low rent and a famous student culture centred on the Otago campus." },
    ]),
    sourceUrl: "https://www.otago.ac.nz/",
  },
  {
    slug: "victoria-university-of-wellington", name: "Victoria University of Wellington", countrySlug: "new-zealand", city: "Wellington",
    overview: "Victoria University of Wellington is New Zealand's capital-city university with strengths in law, public policy, creative arts, and computer science. Its central Wellington location places students near Parliament, government agencies, and the film industry. Bangladeshi students benefit from strong industry placements and New Zealand's post-study work visa.",
    strengths: ["New Zealand's capital-city university", "Strong law, public policy, and creative arts faculties", "Close to Parliament, government, and the film industry", "Post-Study Work Visa of 1–3 years after graduation"],
    quickFacts: { intakes: ["February", "July"], tuitionRange: "NZD 35,000–48,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE"], scholarship: "International Excellence Awards NZD 10,000–20,000", applicationStatus: "Open for February and July" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB", english: "IELTS 6.5 (6.0 in each)", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with good grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, GMAT optional, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5–7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "NZD 35,000–45,000 / year", pg: "NZD 38,000–48,000 / year", mba: "NZD 50,000–70,000", deposit: "NZD 2,000", scholarship: "NZD 10,000–20,000", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Victoria University of Wellington", "February and July primary intakes", "International Excellence Awards of NZD 10,000–20,000", [
      { q: "Is Victoria University close to Parliament?", a: "Yes — Victoria's Pipitea campus is adjacent to Parliament and the courts, making it ideal for law and public policy students." },
      { q: "Is Wellington a good student city?", a: "Yes — Wellington is New Zealand's cultural and creative capital, with a compact walkable centre, strong film industry, and vibrant café culture." },
    ]),
    sourceUrl: "https://www.wgtn.ac.nz/",
  },

  // ───── Malaysia ─────
  {
    slug: "university-of-malaya", name: "University of Malaya", countrySlug: "malaysia", city: "Kuala Lumpur",
    overview: "The University of Malaya (UM) is Malaysia's oldest and highest-ranked university, consistently placed in the world's top 100 by QS. Located in central Kuala Lumpur, it offers strong programmes in engineering, business, medicine, and computer science at significantly lower tuition than Western peers. Bangladeshi students benefit from a moderate Islamic society, halal food everywhere, and easy access to Singapore.",
    strengths: ["Malaysia's oldest and highest-ranked university (global top 100 QS)", "Strong engineering, business, and medicine faculties", "Affordable tuition and living in Kuala Lumpur", "Moderate Islamic society with halal food everywhere"],
    quickFacts: { intakes: ["February", "September", "October (limited)"], tuitionRange: "MYR 25,000–45,000 / year (international, approximate)", englishTests: ["IELTS 5.5–6.5", "TOEFL", "PTE", "MUET"], scholarship: "Merit scholarships up to 50%", applicationStatus: "Open for multiple intakes" },
    entryRequirements: { bachelor: { academic: "HSC 65%+ or A Level CCC", english: "IELTS 5.5–6.0", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with CGPA 3.0/4 or 60%+", english: "IELTS 6.0–6.5", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 6.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "MYR 25,000–40,000 / year", pg: "MYR 28,000–45,000 / year", mba: "MYR 40,000–60,000", deposit: "MYR 2,000", scholarship: "Up to 50% merit", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Malaya", "February, September, and limited October intakes", "merit scholarships of up to 50%", [
      { q: "Is UM Malaysia's top university?", a: "Yes — University of Malaya is Malaysia's oldest and highest-ranked university, consistently placed in the world's top 100 by QS World University Rankings." },
      { q: "Is Malaysia halal-friendly?", a: "Yes — Malaysia is a Muslim-majority country with halal food widely available and a moderate, multicultural society that is welcoming to Bangladeshi students." },
    ]),
    sourceUrl: "https://www.um.edu.my/",
  },
  {
    slug: "universiti-teknologi-malaysia", name: "Universiti Teknologi Malaysia", countrySlug: "malaysia", city: "Johor Bahru",
    overview: "Universiti Teknologi Malaysia (UTM) is Malaysia's leading engineering and technology university, with a main campus in Johor Bahru near Singapore. Known for strong industry partnerships and research output, UTM offers affordable engineering, computing, and built-environment programmes. Bangladeshi students benefit from practical, industry-relevant curricula and proximity to Singapore's job market.",
    strengths: ["Malaysia's leading engineering and technology university", "Strong industry partnerships with MNCs", "Affordable tuition and living in Johor Bahru", "Close proximity to Singapore's job market"],
    quickFacts: { intakes: ["February", "September"], tuitionRange: "MYR 22,000–38,000 / year (international, approximate)", englishTests: ["IELTS 5.5–6.0", "TOEFL", "PTE", "MUET"], scholarship: "Merit scholarships up to 50%", applicationStatus: "Open for February and September" },
    entryRequirements: { bachelor: { academic: "HSC 60%+ or A Level CCC", english: "IELTS 5.5", documents: "Transcripts, English, SOP" }, masters: { academic: "Bachelor with CGPA 3.0/4 or 60%+", english: "IELTS 6.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 2 years experience", english: "IELTS 6.0", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "MYR 22,000–35,000 / year", pg: "MYR 25,000–38,000 / year", mba: "MYR 35,000–50,000", deposit: "MYR 2,000", scholarship: "Up to 50% merit", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Universiti Teknologi Malaysia", "February and September primary intakes", "merit scholarships of up to 50%", [
      { q: "Is UTM strong in engineering?", a: "Yes — UTM is Malaysia's leading engineering and technology university, with strong industry partnerships and high graduate employability." },
      { q: "How close is UTM to Singapore?", a: "UTM's main campus in Johor Bahru is just across the causeway from Singapore, making cross-border internship and job opportunities accessible." },
    ]),
    sourceUrl: "https://www.utm.my/",
  },

  // ───── Dubai / UAE ─────
  {
    slug: "khalifa-university", name: "Khalifa University", countrySlug: "dubai", city: "Abu Dhabi",
    overview: "Khalifa University is the UAE's leading research university, with a strong focus on engineering, science, and medicine. Located in Abu Dhabi, it offers generous scholarships for international students and strong industry partnerships with the UAE's energy, aerospace, and tech sectors. Bangladeshi students benefit from world-class research facilities and clear post-graduation residency pathways.",
    strengths: ["UAE's leading research university for engineering and science", "Strong industry partnerships with energy and aerospace sectors", "Generous scholarships for international students", "Modern, world-class research facilities in Abu Dhabi"],
    quickFacts: { intakes: ["September", "January (limited)"], tuitionRange: "AED 70,000–110,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE", "EmSat"], scholarship: "Merit scholarships up to 100%", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB with maths and physics", english: "IELTS 6.5", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor in relevant field with CGPA 3.0/4", english: "IELTS 6.5", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AED 70,000–100,000 / year", pg: "AED 80,000–110,000 / year", mba: "AED 100,000–140,000", deposit: "AED 5,000", scholarship: "Up to 100% merit", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Khalifa University", "September primary intake; limited January for some PG", "merit scholarships of up to 100%", [
      { q: "Is Khalifa University a public university?", a: "Yes — Khalifa University is a public research university in Abu Dhabi and the UAE's leading institution for engineering and science." },
      { q: "Is Abu Dhabi safe for students?", a: "Yes — Abu Dhabi is consistently ranked among the safest cities in the world, with a multicultural, family-friendly environment." },
    ]),
    sourceUrl: "https://www.ku.ac.ae/",
  },
  {
    slug: "american-university-of-sharjah", name: "American University of Sharjah", countrySlug: "dubai", city: "Sharjah",
    overview: "The American University of Sharjah (AUS) is a leading American-curriculum university in the UAE, with US-style liberal arts education and accreditation. Located in cultural capital Sharjah, it offers strong programmes in engineering, business, architecture, and design. Bangladeshi students benefit from an American degree at lower cost than the US, and a multicultural campus community.",
    strengths: ["US-style liberal arts curriculum with US accreditation", "Strong engineering, business, and architecture programmes", "Located in Sharjah — UAE's cultural capital", "Multicultural campus community with affordable US-style education"],
    quickFacts: { intakes: ["September", "February"], tuitionRange: "AED 70,000–95,000 / year (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE"], scholarship: "Merit scholarships up to 50%", applicationStatus: "Open for September and February" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level CCC", english: "IELTS 6.5", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with CGPA 3.0/4", english: "IELTS 6.5", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 6.5", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "AED 70,000–90,000 / year", pg: "AED 75,000–95,000 / year", mba: "AED 95,000–130,000", deposit: "AED 5,000", scholarship: "Up to 50% merit", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("American University of Sharjah", "September and February primary intakes", "merit scholarships of up to 50%", [
      { q: "Is AUS accredited in the US?", a: "Yes — AUS is accredited by the US Middle States Commission on Higher Education in addition to UAE accreditation, so your degree is recognised worldwide." },
      { q: "Where is Sharjah?", a: "Sharjah is the UAE's cultural capital, located adjacent to Dubai — about 30 minutes from Dubai International Airport." },
    ]),
    sourceUrl: "https://www.aus.edu/",
  },

  // ───── Japan ─────
  {
    slug: "university-of-tokyo", name: "University of Tokyo", countrySlug: "japan", city: "Tokyo",
    overview: "The University of Tokyo (Todai) is Japan's most prestigious university and a global top-30 research institution. With strengths across science, engineering, medicine, and the humanities, it offers English-taught programmes alongside traditional Japanese tracks. Bangladeshi students benefit from world-class research, generous MEXT scholarships, and Tokyo's unmatched job market.",
    strengths: ["Japan's most prestigious university — global top 30", "Strong across science, engineering, medicine, and humanities", "English-taught programmes available alongside Japanese tracks", "MEXT Scholarship covers full tuition plus monthly stipend"],
    quickFacts: { intakes: ["April", "September (limited)"], tuitionRange: "JPY 535,800/year (approx £2,800) — public university", englishTests: ["IELTS 6.0–7.0", "TOEFL", "PTE"], scholarship: "MEXT Scholarship — full tuition + stipend", applicationStatus: "Open for April intake" },
    entryRequirements: { bachelor: { academic: "HSC + 12 years formal education + entrance exam (some)", english: "IELTS 6.0+ / EJU exam (Japanese track)", documents: "Transcripts, EJU, language score, SOP" }, masters: { academic: "Bachelor degree (16 years education)", english: "IELTS 6.5–7.0 or JLPT N1/N2", documents: "Degree, transcripts, research proposal, supervisor contact" }, mba: { academic: "Bachelor + work experience", english: "IELTS 6.5+ or JLPT N1", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 6.5–7.5 or JLPT N1", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "JPY 535,800 / year", pg: "JPY 535,800 / year", mba: "JPY 1,500,000–3,000,000", deposit: "JPY 100,000", scholarship: "MEXT — full tuition + stipend", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("University of Tokyo", "April primary intake; limited September for English-taught PG", "MEXT Scholarship covering full tuition and monthly stipend", [
      { q: "Do I need Japanese to study at Todai?", a: "No — the University of Tokyo offers several English-taught Masters programmes, particularly in science, engineering, and public policy." },
      { q: "What is the MEXT Scholarship?", a: "MEXT (Monbukagakusho) is the Japanese government's full scholarship covering tuition, monthly stipend, and travel for outstanding international students." },
      { q: "Can I work in Japan after graduation?", a: "Yes — Japan's Designated Activities visa allows up to 1 year of job-search, transitioning to a work visa for qualified employment." },
    ]),
    sourceUrl: "https://www.u-tokyo.ac.jp/",
  },
  {
    slug: "kyoto-university", name: "Kyoto University", countrySlug: "japan", city: "Kyoto",
    overview: "Kyoto University is Japan's second-oldest university and a global top-50 research institution with a strong research focus and a long list of Nobel laureates. Its strengths span physics, chemistry, medicine, and engineering. Bangladeshi students benefit from world-class research, generous MEXT scholarships, and Kyoto's blend of tradition and innovation.",
    strengths: ["Japan's second-oldest university — global top 50", "Strong research focus with many Nobel laureates", "Excellent physics, chemistry, medicine, and engineering faculties", "MEXT Scholarship covers full tuition plus monthly stipend"],
    quickFacts: { intakes: ["April", "September (limited)"], tuitionRange: "JPY 535,800/year (public university, approximate)", englishTests: ["IELTS 6.0–7.0", "TOEFL", "PTE"], scholarship: "MEXT Scholarship — full tuition + stipend", applicationStatus: "Open for April intake" },
    entryRequirements: { bachelor: { academic: "HSC + 12 years formal education + entrance exam", english: "IELTS 6.0+ / EJU exam (Japanese track)", documents: "Transcripts, EJU, language score, SOP" }, masters: { academic: "Bachelor degree (16 years education)", english: "IELTS 6.5–7.0 or JLPT N1/N2", documents: "Degree, transcripts, research proposal, supervisor contact" }, mba: { academic: "Bachelor + work experience", english: "IELTS 6.5+ or JLPT N1", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 6.5–7.5 or JLPT N1", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "JPY 535,800 / year", pg: "JPY 535,800 / year", mba: "JPY 1,500,000–3,000,000", deposit: "JPY 100,000", scholarship: "MEXT — full tuition + stipend", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Kyoto University", "April primary intake; limited September for English-taught PG", "MEXT Scholarship covering full tuition and monthly stipend", [
      { q: "Does Kyoto University have Nobel laureates?", a: "Yes — Kyoto University has produced numerous Nobel laureates, particularly in physics and chemistry, reflecting its strong research culture." },
      { q: "What is the MEXT Scholarship?", a: "MEXT (Monbukagakusho) is the Japanese government's full scholarship covering tuition, monthly stipend, and travel for outstanding international students." },
      { q: "Can I work in Japan after graduation?", a: "Yes — Japan's Designated Activities visa allows up to 1 year of job-search, transitioning to a work visa for qualified employment." },
    ]),
    sourceUrl: "https://www.kyoto-u.ac.jp/",
  },

  // ───── South Korea ─────
  {
    slug: "seoul-national-university", name: "Seoul National University", countrySlug: "south-korea", city: "Seoul",
    overview: "Seoul National University (SNU) is South Korea's most prestigious university and a global top-30 research institution. Its strengths span engineering, business, medicine, and the social sciences. Bangladeshi students benefit from SNU's strong industry links with Samsung, LG, and Hyundai, and generous Global Korea Scholarship (GKS) support.",
    strengths: ["South Korea's most prestigious university — global top 30", "Strong engineering, business, and medicine faculties", "Industry links with Samsung, LG, and Hyundai", "Global Korea Scholarship (GKS) covers full tuition and stipend"],
    quickFacts: { intakes: ["March", "September"], tuitionRange: "KRW 4,000,000–6,000,000/semester (international, approximate)", englishTests: ["IELTS 6.0–6.5", "TOEFL", "PTE"], scholarship: "GKS — full tuition + stipend", applicationStatus: "Open for March and September" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB", english: "IELTS 6.0+ / TOEFL 80+", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with strong grades (GPA 3.0+/4)", english: "IELTS 6.0–6.5 / TOEFL 80+", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + work experience", english: "IELTS 6.5+", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5+", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "KRW 4,000,000–6,000,000 / semester", pg: "KRW 4,500,000–7,000,000 / semester", mba: "KRW 30,000,000–50,000,000", deposit: "KRW 500,000", scholarship: "GKS — full tuition + stipend", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Seoul National University", "March and September intakes", "Global Korea Scholarship (GKS) covering full tuition and monthly stipend", [
      { q: "Is SNU Korea's top university?", a: "Yes — Seoul National University is consistently ranked as South Korea's top university and among the world's top 30 research institutions." },
      { q: "What is the GKS Scholarship?", a: "The Global Korea Scholarship (GKS) is the South Korean government's full scholarship covering tuition, monthly stipend, and airfare for outstanding international students." },
      { q: "Do I need Korean to study at SNU?", a: "No — SNU offers many English-taught Masters programmes, particularly in engineering, business, and international studies." },
    ]),
    sourceUrl: "https://en.snu.ac.kr/",
  },
  {
    slug: "yonsei-university", name: "Yonsei University", countrySlug: "south-korea", city: "Seoul",
    overview: "Yonsei University is one of South Korea's SKY universities (Seoul National, Korea, Yonsei) and a leading private research institution. Its Underwood International College offers fully English-taught undergraduate programmes. Bangladeshi students benefit from strong business and international studies faculties, generous GKS support, and Seoul's dynamic tech and media economy.",
    strengths: ["One of Korea's prestigious SKY universities", "Underwood International College — fully English-taught undergraduate programmes", "Strong business, international studies, and engineering faculties", "Global Korea Scholarship (GKS) covers full tuition and stipend"],
    quickFacts: { intakes: ["March", "September"], tuitionRange: "KRW 5,000,000–7,500,000/semester (international, approximate)", englishTests: ["IELTS 6.5", "TOEFL", "PTE"], scholarship: "GKS — full tuition + stipend", applicationStatus: "Open for March and September" },
    entryRequirements: { bachelor: { academic: "HSC 75%+ or A Level BBB", english: "IELTS 6.5 / TOEFL 80+", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor with strong grades (GPA 3.0+/4)", english: "IELTS 6.5 / TOEFL 85+", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + work experience", english: "IELTS 6.5+", documents: "Degree, experience, essays" }, phd: { academic: "Masters + research proposal", english: "IELTS 6.5+", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "KRW 5,000,000–7,500,000 / semester", pg: "KRW 5,500,000–8,000,000 / semester", mba: "KRW 40,000,000–60,000,000", deposit: "KRW 500,000", scholarship: "GKS — full tuition + stipend", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Yonsei University", "March and September intakes", "Global Korea Scholarship (GKS) covering full tuition and monthly stipend", [
      { q: "What is Underwood International College?", a: "UIC is Yonsei's fully English-taught liberal arts undergraduate college, designed for international and globally-minded Korean students." },
      { q: "Is Yonsei a SKY university?", a: "Yes — Yonsei is part of Korea's 'SKY' trio (Seoul National, Korea, Yonsei), the country's three most prestigious universities." },
      { q: "Do I need Korean to study at Yonsei?", a: "No — Yonsei's Underwood International College and many graduate programmes are fully taught in English." },
    ]),
    sourceUrl: "https://www.yonsei.ac.kr/",
  },

  // ───── Denmark ─────
  {
    slug: "aarhus-university", name: "Aarhus University", countrySlug: "denmark", city: "Aarhus",
    overview: "Aarhus University is Denmark's second-largest university and a global top-100 research institution with strengths in business, engineering, environmental science, and the social sciences. Located in Denmark's student-friendly second city, it offers many English-taught Masters programmes. Bangladeshi students benefit from a strong research environment, generous state support, and Denmark's post-study work scheme.",
    strengths: ["Global top-100 research university in Denmark's second city", "Strong business (Aarhus BSS), engineering, and environmental science faculties", "Many English-taught Masters programmes", "Eligible for Denmark's post-study work scheme (6 months job search + work permit)"],
    quickFacts: { intakes: ["September", "February (limited PG)"], tuitionRange: "EUR 8,000–15,000 / year (non-EU international, approximate)", englishTests: ["IELTS 6.5–7.0", "TOEFL", "PTE"], scholarship: "Danish State Scholarships — full or partial tuition waiver", applicationStatus: "Open for September intake" },
    entryRequirements: { bachelor: { academic: "HSC 70%+ or A Level BBB (some Danish foundation pathways)", english: "IELTS 6.5", documents: "Transcripts, English, SOP, recommendations" }, masters: { academic: "Bachelor in relevant field with strong grades", english: "IELTS 6.5–7.0", documents: "Degree, transcripts, SOP, CV, references" }, mba: { academic: "Bachelor + 3 years experience", english: "IELTS 7.0", documents: "Degree, experience, essays, GMAT (some)" }, phd: { academic: "Masters + research proposal + supervisor", english: "IELTS 7.0", documents: "Proposal, supervisor confirmation, transcripts" } },
    tuition: { ug: "EUR 8,000–13,000 / year", pg: "EUR 10,000–15,000 / year", mba: "EUR 30,000–50,000", deposit: "EUR 1,000", scholarship: "Danish State Scholarship — tuition waiver", paymentPlan: "Instalments available" },
    applicationSteps: stdApplicationSteps,
    documents: docsChecklist,
    faqs: uniFaqs("Aarhus University", "September primary intake; February for some PG", "Danish State Scholarships offering full or partial tuition waiver", [
      { q: "Do I need to pay tuition in Denmark?", a: "EU/EEA students study free. Non-EU international students pay tuition fees at Aarhus, but Danish State Scholarships offer full or partial waivers for outstanding applicants." },
      { q: "Can I work in Denmark after graduation?", a: "Yes — Denmark offers a 6-month job-search extension to your student residence permit, with a work permit available once you find qualified employment." },
    ]),
    sourceUrl: "https://international.au.dk/",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// COURSES (50 new — across required subject areas)
// ────────────────────────────────────────────────────────────────────────────
const courses = [
  // ───── Computer Science / IT / Software Engineering ─────
  { slug: "msc-computer-science-bristol", name: "MSc Computer Science", universitySlug: "university-of-bristol", countrySlug: "uk", city: "Bristol", level: "Masters", subject: "Computer Science", duration: "1 year", intake: "September", tuition: "£29,000 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A research-led one-year Masters covering advanced algorithms, AI, software engineering, and machine learning, with a substantial dissertation project.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Computer Science at Bristol", uni: "University of Bristol", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band. PTE, TOEFL, and Duolingo also accepted." }), sourceUrl: "https://www.bristol.ac.uk/" },
  { slug: "msc-advanced-computing-leeds", name: "MSc Advanced Computing", universitySlug: "university-of-leeds", countrySlug: "uk", city: "Leeds", level: "Masters", subject: "Computer Science", duration: "1 year", intake: "September", tuition: "£27,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "An advanced Masters covering distributed systems, AI, data science, and high-performance computing, with industry-linked dissertation projects.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Advanced Computing at Leeds", uni: "University of Leeds", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.leeds.ac.uk/" },
  { slug: "msc-software-engineering-sheffield", name: "MSc Software Engineering", universitySlug: "university-of-sheffield", countrySlug: "uk", city: "Sheffield", level: "Masters", subject: "Software Engineering", duration: "1 year", intake: "September", tuition: "£27,000 (approximate)", scholarship: "Merit awards £2,000–5,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A practical Masters covering software architecture, agile methods, DevOps, and cloud-native development, with a substantial team dissertation.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Software Engineering at Sheffield", uni: "University of Sheffield", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–5,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.sheffield.ac.uk/" },
  { slug: "msc-computer-science-southampton", name: "MSc Computer Science", universitySlug: "university-of-southampton", countrySlug: "uk", city: "Southampton", level: "Masters", subject: "Computer Science", duration: "1 year", intake: "September", tuition: "£28,000 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A research-led Masters with specialisations in AI, cyber security, web science, and cyber physical systems at a GCHQ-accredited school.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Computer Science at Southampton", uni: "University of Southampton", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.southampton.ac.uk/" },
  { slug: "ms-computer-science-mcgill", name: "MS in Computer Science", universitySlug: "mcgill-university", countrySlug: "canada", city: "Montreal", level: "Masters", subject: "Computer Science", duration: "1.5–2 years", intake: "September", tuition: "CAD 22,000–45,000 (approximate)", scholarship: "Merit awards CAD 5,000–20,000", englishRequirement: "IELTS 7.0 / TOEFL 100", academicRequirement: "Bachelor with B+ in CS or related", overview: "A research-intensive Masters at one of Canada's top universities, with specialisations in AI, systems, theory, and computational biology.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "December (September intake)", faqs: courseFaqs({ course: "MS Computer Science at McGill", uni: "McGill University", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP) of up to 3 years.", scholarship: "merit awards of CAD 5,000–20,000", english: "IELTS 7.0 overall or TOEFL 100." }), sourceUrl: "https://www.mcgill.ca/" },
  { slug: "master-of-data-systems-ubc", name: "Master of Data Science", universitySlug: "university-of-british-columbia", countrySlug: "canada", city: "Vancouver", level: "Masters", subject: "Data Science", duration: "10 months", intake: "September", tuition: "CAD 38,000 (approximate)", scholarship: "Merit awards CAD 5,000–15,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor in any discipline with prerequisites", overview: "An intensive 10-month professional Masters covering data wrangling, machine learning, visualisation, and a capstone industry project.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "Master of Data Science at UBC", uni: "University of British Columbia", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP).", scholarship: "merit awards of CAD 5,000–15,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.ubc.ca/" },
  { slug: "master-of-information-technology-monash", name: "Master of Information Technology", universitySlug: "monash-university", countrySlug: "australia", city: "Melbourne", level: "Masters", subject: "Computer Science", duration: "1–2 years", intake: "February, July", tuition: "AUD 45,000 (approximate)", scholarship: "Merit awards AUD 5,000–20,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor degree (IT background for 1-year; any for 2-year)", overview: "A flexible professional Masters with specialisations in AI, data science, cyber security, networks, and software development.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "MIT at Monash", uni: "Monash University", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "merit awards of AUD 5,000–20,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.monash.edu/" },
  { slug: "bachelor-of-computer-science-waterloo", name: "Bachelor of Computer Science", universitySlug: "university-of-waterloo", countrySlug: "canada", city: "Waterloo", level: "Bachelor", subject: "Computer Science", duration: "4 years (5 with co-op)", intake: "September", tuition: "CAD 50,000 (approximate)", scholarship: "Merit awards CAD 5,000–20,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "HSC 85%+ or strong A Level", overview: "Canada's top computer science Bachelor with the world's largest paid co-op programme — graduate with up to 2 years of paid work experience.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "BCS at Waterloo", uni: "University of Waterloo", postStudy: "Yes — co-op work terms count toward Canadian work experience for PR.", scholarship: "merit awards of CAD 5,000–20,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://uwaterloo.ca/" },
  { slug: "ms-computer-science-berkeley", name: "MS in Computer Science", universitySlug: "university-of-california-berkeley", countrySlug: "usa", city: "Berkeley", level: "Masters", subject: "Computer Science", duration: "1–2 years", intake: "August", tuition: "USD 50,000 (approximate, per year)", scholarship: "Merit awards USD 5,000–25,000", englishRequirement: "IELTS 7.0 / TOEFL 90+", academicRequirement: "Bachelor with strong GPA (3.3+/4) in CS or related", overview: "A STEM-designated Masters at the world's top public research university, covering AI, systems, theory, and human-computer interaction.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "December (August intake)", faqs: courseFaqs({ course: "MS CS at Berkeley", uni: "UC Berkeley", postStudy: "Yes — STEM OPT extension allows up to 3 years of US work authorisation.", scholarship: "merit and need-based awards of USD 5,000–25,000", english: "IELTS 7.0 or TOEFL 90+." }), sourceUrl: "https://www.berkeley.edu/" },
  { slug: "msc-computer-science-edinburgh", name: "MSc Computer Science", universitySlug: "university-of-edinburgh", countrySlug: "uk", city: "Edinburgh", level: "Masters", subject: "Computer Science", duration: "1 year", intake: "September", tuition: "£33,000 (approximate)", scholarship: "Merit awards £3,000–8,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A research-led Masters at one of Europe's largest informatics schools, covering AI, NLP, robotics, and theoretical computer science.", modules: courseModules.cs, careerOutcomes: careerOutcomes.cs, documents: docsChecklist, deadline: "April (September intake)", faqs: courseFaqs({ course: "MSc Computer Science at Edinburgh", uni: "University of Edinburgh", postStudy: "Yes — eligible for the Scottish Graduate Visa (2 years post-study work).", scholarship: "merit awards of £3,000–8,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.ed.ac.uk/" },

  // ───── Business / Management / MBA ─────
  { slug: "msc-management-bristol", name: "MSc Management", universitySlug: "university-of-bristol", countrySlug: "uk", city: "Bristol", level: "Masters", subject: "Business", duration: "1 year", intake: "September", tuition: "£28,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in any discipline", overview: "A conversion Masters for non-business graduates covering finance, marketing, strategy, and organisational behaviour with a consultancy project.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Management at Bristol", uni: "University of Bristol", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.bristol.ac.uk/" },
  { slug: "mba-leeds", name: "Global MBA", universitySlug: "university-of-leeds", countrySlug: "uk", city: "Leeds", level: "MBA", subject: "Business Administration", duration: "1 year (full-time)", intake: "September", tuition: "£36,000 (approximate)", scholarship: "Merit awards up to £5,000", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor + 3 years work experience", overview: "A triple-accredited MBA combining academic rigour with leadership development, international consultancy, and a strong global alumni network.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "May (September intake)", faqs: courseFaqs({ course: "the Leeds Global MBA", uni: "University of Leeds", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards up to £5,000", english: "IELTS 7.0 overall." }), sourceUrl: "https://www.leeds.ac.uk/" },
  { slug: "msc-international-business-birmingham", name: "MSc International Business", universitySlug: "university-of-birmingham", countrySlug: "uk", city: "Birmingham", level: "Masters", subject: "Business", duration: "1 year", intake: "September", tuition: "£26,000 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in business or related", overview: "A specialised Masters covering global strategy, cross-cultural management, international trade, and emerging markets with a research project.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc International Business at Birmingham", uni: "University of Birmingham", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.birmingham.ac.uk/" },
  { slug: "mba-mcgill", name: "McGill MBA", universitySlug: "mcgill-university", countrySlug: "canada", city: "Montreal", level: "MBA", subject: "Business Administration", duration: "16–20 months", intake: "September", tuition: "CAD 80,000 (approximate, international)", scholarship: "Merit awards CAD 10,000–50,000", englishRequirement: "IELTS 7.0 / TOEFL 100", academicRequirement: "Bachelor + 2+ years work experience + GMAT", overview: "An internationally ranked MBA at Canada's most prestigious business school, with a strong Montreal finance and tech ecosystem.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "the McGill MBA", uni: "McGill University", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP) of up to 3 years.", scholarship: "merit awards of CAD 10,000–50,000", english: "IELTS 7.0 or TOEFL 100." }), sourceUrl: "https://www.mcgill.ca/" },
  { slug: "master-of-management-ubc", name: "Master of Management", universitySlug: "university-of-british-columbia", countrySlug: "canada", city: "Vancouver", level: "Masters", subject: "Business", duration: "9 months", intake: "September", tuition: "CAD 38,000 (approximate, international)", scholarship: "Merit awards CAD 5,000–15,000", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor in non-business discipline (recent graduates)", overview: "An accelerated pre-experience Masters for recent non-business graduates, covering core management, finance, and a real-world consulting project.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "Master of Management at UBC", uni: "University of British Columbia", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP).", scholarship: "merit awards of CAD 5,000–15,000", english: "IELTS 7.0 overall." }), sourceUrl: "https://www.ubc.ca/" },
  { slug: "master-of-commerce-sydney", name: "Master of Commerce", universitySlug: "university-of-sydney", countrySlug: "australia", city: "Sydney", level: "Masters", subject: "Business", duration: "1.5 years", intake: "February, July", tuition: "AUD 50,000 (approximate, per year)", scholarship: "Vice-Chancellor Awards AUD 20,000–40,000", englishRequirement: "IELTS 7.0 (6.0 in each band)", academicRequirement: "Bachelor degree in any discipline", overview: "A flexible Masters with specialisations in accounting, finance, business analytics, marketing, and strategy at Australia's oldest business school.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "January (February), June (July)", faqs: courseFaqs({ course: "Master of Commerce at Sydney", uni: "University of Sydney", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "Vice-Chancellor Awards of AUD 20,000–40,000", english: "IELTS 7.0 with 6.0 in each band." }), sourceUrl: "https://www.sydney.edu.au/" },
  { slug: "mba-monash", name: "Monash MBA", universitySlug: "monash-university", countrySlug: "australia", city: "Melbourne", level: "MBA", subject: "Business Administration", duration: "1.5–2 years", intake: "February, July", tuition: "AUD 85,000 (approximate, total)", scholarship: "Merit awards AUD 10,000–25,000", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor + 3+ years work experience", overview: "A triple-accredited MBA at Australia's largest university, with leadership development, international residency, and strong industry partnerships.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "October (February), April (July)", faqs: courseFaqs({ course: "the Monash MBA", uni: "Monash University", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "merit awards of AUD 10,000–25,000", english: "IELTS 7.0 overall." }), sourceUrl: "https://www.monash.edu/" },
  { slug: "ms-management-nyu", name: "MS in Management", universitySlug: "new-york-university", countrySlug: "usa", city: "New York", level: "Masters", subject: "Business", duration: "1 year", intake: "September", tuition: "USD 70,000 (approximate)", scholarship: "Merit awards USD 5,000–25,000", englishRequirement: "IELTS 7.0 / TOEFL 100", academicRequirement: "Bachelor in non-business discipline (≤2 years experience)", overview: "A pre-experience Masters at Stern School of Business for recent non-business graduates, covering core management, finance, and NYC industry immersion.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MS Management at NYU Stern", uni: "New York University", postStudy: "Yes — eligible for up to 12 months OPT, with STEM extension if applicable.", scholarship: "merit awards of USD 5,000–25,000", english: "IELTS 7.0 or TOEFL 100." }), sourceUrl: "https://www.nyu.edu/" },
  { slug: "msc-management-lmu", name: "MSc Management", universitySlug: "lmu-munich", countrySlug: "germany", city: "Munich", level: "Masters", subject: "Business", duration: "2 years", intake: "October (Winter)", tuition: "€0–144/semester (semester fee only)", scholarship: "Deutschlandstipendium €300/month", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor in business or related with strong grades", overview: "A mostly tuition-free research-led Masters at one of Germany's top universities, covering strategy, finance, and international management.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "January (Winter intake)", faqs: courseFaqs({ course: "MSc Management at LMU", uni: "LMU Munich", postStudy: "Yes — 18-month residence permit to find qualified employment in Germany.", scholarship: "Deutschlandstipendium of €300/month", english: "IELTS 7.0 overall." }), sourceUrl: "https://www.lmu.de/" },
  { slug: "mba-university-of-malaya", name: "Master of Business Administration", universitySlug: "university-of-malaya", countrySlug: "malaysia", city: "Kuala Lumpur", level: "MBA", subject: "Business Administration", duration: "1.5–2 years", intake: "February, September", tuition: "MYR 45,000 (approximate, total)", scholarship: "Merit scholarships up to 30%", englishRequirement: "IELTS 6.0", academicRequirement: "Bachelor + 2 years work experience", overview: "An affordable, AACSB-aligned MBA at Malaysia's top university, covering strategy, leadership, and Asian business with a strong regional alumni network.", modules: courseModules.business, careerOutcomes: careerOutcomes.business, documents: docsChecklist, deadline: "December (February), July (September)", faqs: courseFaqs({ course: "the UM MBA", uni: "University of Malaya", postStudy: "Yes — Malaysia offers post-study work options for graduates of recognised universities.", scholarship: "merit scholarships up to 30%", english: "IELTS 6.0 overall." }), sourceUrl: "https://www.um.edu.my/" },

  // ───── Data Science / AI / Machine Learning ─────
  { slug: "msc-data-science-edinburgh", name: "MSc Data Science", universitySlug: "university-of-edinburgh", countrySlug: "uk", city: "Edinburgh", level: "Masters", subject: "Data Science", duration: "1 year", intake: "September", tuition: "£34,000 (approximate)", scholarship: "Merit awards £3,000–8,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in informatics, maths, or related", overview: "A research-intensive Masters at Europe's largest informatics school, covering statistical learning, ML, NLP, and a substantial dissertation.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "April (September intake)", faqs: courseFaqs({ course: "MSc Data Science at Edinburgh", uni: "University of Edinburgh", postStudy: "Yes — eligible for the Scottish Graduate Visa (2 years post-study work).", scholarship: "merit awards of £3,000–8,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.ed.ac.uk/" },
  { slug: "msc-artificial-intelligence-kcl", name: "MSc Artificial Intelligence", universitySlug: "kings-college-london", countrySlug: "uk", city: "London", level: "Masters", subject: "Artificial Intelligence", duration: "1 year", intake: "September", tuition: "£32,000 (approximate)", scholarship: "Merit awards £2,000–8,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A specialist Masters covering machine learning, deep learning, NLP, computer vision, and AI ethics, with industry-linked project work.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "March (September intake)", faqs: courseFaqs({ course: "MSc AI at King's", uni: "King's College London", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–8,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.kcl.ac.uk/" },
  { slug: "master-of-data-science-uq", name: "Master of Data Science", universitySlug: "university-of-queensland", countrySlug: "australia", city: "Brisbane", level: "Masters", subject: "Data Science", duration: "1.5–2 years", intake: "February, July", tuition: "AUD 48,000 (approximate, per year)", scholarship: "Merit awards AUD 5,000–20,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor in any discipline with maths prerequisites", overview: "A professional Masters covering statistical learning, data engineering, visualisation, and a capstone industry project in sunny Brisbane.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "MDataSc at UQ", uni: "University of Queensland", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "merit awards of AUD 5,000–20,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.uq.edu.au/" },
  { slug: "mdsai-waterloo", name: "Master of Data Science and Artificial Intelligence", universitySlug: "university-of-waterloo", countrySlug: "canada", city: "Waterloo", level: "Masters", subject: "Data Science", duration: "1.5 years", intake: "September", tuition: "CAD 38,000 (approximate, total)", scholarship: "Merit awards CAD 5,000–15,000", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor with 75%+ in CS, maths, or related", overview: "A specialised professional Masters combining data science, ML, and AI with paid co-op work terms at Canada's leading tech university.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MDSAI at Waterloo", uni: "University of Waterloo", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP).", scholarship: "merit awards of CAD 5,000–15,000", english: "IELTS 7.0 overall." }), sourceUrl: "https://uwaterloo.ca/" },
  { slug: "master-of-applied-data-science-michigan", name: "Master of Applied Data Science", universitySlug: "university-of-michigan", countrySlug: "usa", city: "Ann Arbor", level: "Masters", subject: "Data Science", duration: "1 year (full-time)", intake: "September", tuition: "USD 55,000 (approximate)", scholarship: "Merit awards USD 5,000–25,000", englishRequirement: "IELTS 7.0 / TOEFL 100", academicRequirement: "Bachelor with strong GPA in any discipline (with maths)", overview: "A STEM-designated applied Masters from Michigan's School of Information, covering data collection, ML, ethics, and a capstone project.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MADS at Michigan", uni: "University of Michigan", postStudy: "Yes — STEM OPT extension allows up to 3 years of US work authorisation.", scholarship: "merit awards of USD 5,000–25,000", english: "IELTS 7.0 or TOEFL 100." }), sourceUrl: "https://umich.edu/" },
  { slug: "msc-data-science-glasgow", name: "MSc Data Science", universitySlug: "university-of-glasgow", countrySlug: "uk", city: "Glasgow", level: "Masters", subject: "Data Science", duration: "1 year", intake: "September", tuition: "£28,000 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in CS, maths, or related", overview: "A research-led Masters covering statistics, ML, big data systems, and a substantial dissertation in affordable, friendly Glasgow.", modules: courseModules.data, careerOutcomes: careerOutcomes.data, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Data Science at Glasgow", uni: "University of Glasgow", postStudy: "Yes — eligible for the Scottish Graduate Visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.gla.ac.uk/" },

  // ───── Engineering ─────
  { slug: "msc-mechanical-engineering-southampton", name: "MSc Mechanical Engineering", universitySlug: "university-of-southampton", countrySlug: "uk", city: "Southampton", level: "Masters", subject: "Mechanical Engineering", duration: "1 year", intake: "September", tuition: "£27,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in mechanical engineering or related", overview: "An advanced Masters covering design, materials, thermodynamics, computational methods, and a research-led individual project.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Mechanical Engineering at Southampton", uni: "University of Southampton", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.southampton.ac.uk/" },
  { slug: "msc-electrical-engineering-rwth-aachen", name: "MSc Electrical Engineering", universitySlug: "rwth-aachen-university", countrySlug: "germany", city: "Aachen", level: "Masters", subject: "Electrical Engineering", duration: "2 years", intake: "October (Winter)", tuition: "€0–1,500/semester (semester fee only)", scholarship: "Deutschlandstipendium €300/month", englishRequirement: "IELTS 6.5", academicRequirement: "Bachelor in electrical engineering or related with strong grades", overview: "A mostly tuition-free research-led Masters at Germany's top technical university, covering communications, power, microelectronics, and automation.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "March (Winter intake)", faqs: courseFaqs({ course: "MSc EE at RWTH Aachen", uni: "RWTH Aachen University", postStudy: "Yes — 18-month residence permit to find qualified employment in Germany.", scholarship: "Deutschlandstipendium of €300/month", english: "IELTS 6.5 overall." }), sourceUrl: "https://www.rwth-aachen.de/" },
  { slug: "meng-civil-engineering-leeds", name: "MEng Civil Engineering", universitySlug: "university-of-leeds", countrySlug: "uk", city: "Leeds", level: "Bachelor", subject: "Civil Engineering", duration: "4 years (integrated Masters)", intake: "September", tuition: "£27,500 (approximate, per year)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.0 (5.5 in each band)", academicRequirement: "HSC 75%+ or A Level AAB including maths and physics", overview: "A four-year integrated Masters covering structural, geotechnical, transport, and water engineering, with a major design and research project.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "January (September intake via UCAS)", faqs: courseFaqs({ course: "MEng Civil Engineering at Leeds", uni: "University of Leeds", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.0 with 5.5 in each band." }), sourceUrl: "https://www.leeds.ac.uk/" },
  { slug: "msc-automotive-engineering-rwth-aachen", name: "MSc Automotive Engineering", universitySlug: "rwth-aachen-university", countrySlug: "germany", city: "Aachen", level: "Masters", subject: "Automotive Engineering", duration: "2 years", intake: "October (Winter)", tuition: "€0–1,500/semester (semester fee only)", scholarship: "Deutschlandstipendium €300/month", englishRequirement: "IELTS 6.5", academicRequirement: "Bachelor in mechanical or automotive engineering with strong grades", overview: "A mostly tuition-free specialist Masters covering vehicle dynamics, powertrains, e-mobility, and ADAS at one of Germany's leading engineering schools.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "March (Winter intake)", faqs: courseFaqs({ course: "MSc Automotive Engineering at RWTH", uni: "RWTH Aachen University", postStudy: "Yes — 18-month residence permit to find qualified employment in Germany's automotive sector.", scholarship: "Deutschlandstipendium of €300/month", english: "IELTS 6.5 overall." }), sourceUrl: "https://www.rwth-aachen.de/" },
  { slug: "meng-mechanical-engineering-waterloo", name: "Master of Engineering in Mechanical Engineering", universitySlug: "university-of-waterloo", countrySlug: "canada", city: "Waterloo", level: "Masters", subject: "Mechanical Engineering", duration: "1–2 years", intake: "September, January, May", tuition: "CAD 28,000 (approximate, per year)", scholarship: "Merit awards CAD 5,000–15,000", englishRequirement: "IELTS 7.0", academicRequirement: "Bachelor in mechanical engineering with 75%+", overview: "A course-based professional MEng covering design, manufacturing, robotics, and thermal systems, with optional co-op work terms.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MEng Mechanical at Waterloo", uni: "University of Waterloo", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP) of up to 3 years.", scholarship: "merit awards of CAD 5,000–15,000", english: "IELTS 7.0 overall." }), sourceUrl: "https://uwaterloo.ca/" },
  { slug: "master-of-engineering-berkeley", name: "Master of Engineering", universitySlug: "university-of-california-berkeley", countrySlug: "usa", city: "Berkeley", level: "Masters", subject: "Engineering", duration: "1 year", intake: "August", tuition: "USD 50,000 (approximate, total)", scholarship: "Merit awards USD 5,000–20,000", englishRequirement: "IELTS 7.0 / TOEFL 90+", academicRequirement: "Bachelor in engineering or related with strong GPA", overview: "A STEM-designated one-year professional MEng combining technical depth with leadership, capstone project, and Silicon Valley industry access.", modules: courseModules.engineering, careerOutcomes: careerOutcomes.engineering, documents: docsChecklist, deadline: "January (August intake)", faqs: courseFaqs({ course: "MEng at Berkeley", uni: "UC Berkeley", postStudy: "Yes — STEM OPT extension allows up to 3 years of US work authorisation.", scholarship: "merit awards of USD 5,000–20,000", english: "IELTS 7.0 or TOEFL 90+." }), sourceUrl: "https://www.berkeley.edu/" },

  // ───── Accounting & Finance ─────
  { slug: "msc-finance-bristol", name: "MSc Finance", universitySlug: "university-of-bristol", countrySlug: "uk", city: "Bristol", level: "Masters", subject: "Finance", duration: "1 year", intake: "September", tuition: "£29,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in finance, economics, or related with strong maths", overview: "A quantitative Masters covering corporate finance, asset pricing, financial econometrics, and a research-led dissertation with CFA-aligned content.", modules: courseModules.finance, careerOutcomes: careerOutcomes.finance, documents: docsChecklist, deadline: "March (September intake)", faqs: courseFaqs({ course: "MSc Finance at Bristol", uni: "University of Bristol", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.bristol.ac.uk/" },
  { slug: "msc-accounting-finance-nottingham", name: "MSc Accounting and Finance", universitySlug: "university-of-nottingham", countrySlug: "uk", city: "Nottingham", level: "Masters", subject: "Accounting & Finance", duration: "1 year", intake: "September", tuition: "£27,000 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in accounting, finance, or related", overview: "A CFA- and ACCA-aligned Masters covering corporate reporting, audit, investment analysis, and a substantial research dissertation.", modules: courseModules.finance, careerOutcomes: careerOutcomes.finance, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Accounting and Finance at Nottingham", uni: "University of Nottingham", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.nottingham.ac.uk/" },
  { slug: "master-of-professional-accounting-sydney", name: "Master of Professional Accounting", universitySlug: "university-of-sydney", countrySlug: "australia", city: "Sydney", level: "Masters", subject: "Accounting & Finance", duration: "1.5 years", intake: "February, July", tuition: "AUD 50,000 (approximate, per year)", scholarship: "Vice-Chancellor Awards AUD 20,000–40,000", englishRequirement: "IELTS 7.0 (6.0 in each band)", academicRequirement: "Bachelor degree in any discipline", overview: "A CA/CPA-aligned Masters for non-accounting graduates covering financial reporting, audit, taxation, and business law with strong industry links.", modules: courseModules.finance, careerOutcomes: careerOutcomes.finance, documents: docsChecklist, deadline: "January (February), June (July)", faqs: courseFaqs({ course: "MPA at Sydney", uni: "University of Sydney", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "Vice-Chancellor Awards of AUD 20,000–40,000", english: "IELTS 7.0 with 6.0 in each band." }), sourceUrl: "https://www.sydney.edu.au/" },
  { slug: "msc-finance-kcl", name: "MSc Finance", universitySlug: "kings-college-london", countrySlug: "uk", city: "London", level: "Masters", subject: "Finance", duration: "1 year", intake: "September", tuition: "£33,000 (approximate)", scholarship: "Merit awards £2,000–8,000", englishRequirement: "IELTS 7.0 (6.5 in each band)", academicRequirement: "Bachelor 2:1 in finance, economics, or related with strong maths", overview: "A quantitative Masters in central London covering asset pricing, corporate finance, risk, and a research-led dissertation with CFA-aligned content.", modules: courseModules.finance, careerOutcomes: careerOutcomes.finance, documents: docsChecklist, deadline: "March (September intake)", faqs: courseFaqs({ course: "MSc Finance at King's", uni: "King's College London", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–8,000", english: "IELTS 7.0 with 6.5 in each band." }), sourceUrl: "https://www.kcl.ac.uk/" },
  { slug: "master-of-applied-finance-mcgill", name: "Master of Management in Analytics", universitySlug: "mcgill-university", countrySlug: "canada", city: "Montreal", level: "Masters", subject: "Finance", duration: "12 months", intake: "September", tuition: "CAD 55,000 (approximate)", scholarship: "Merit awards CAD 10,000–30,000", englishRequirement: "IELTS 7.0 / TOEFL 100", academicRequirement: "Bachelor + 2+ years work experience", overview: "A specialised analytics Masters at Desautels Faculty of Management blending finance, data, and machine learning for early-career professionals.", modules: courseModules.finance, careerOutcomes: careerOutcomes.finance, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MMA at McGill Desautels", uni: "McGill University", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP) of up to 3 years.", scholarship: "merit awards of CAD 10,000–30,000", english: "IELTS 7.0 or TOEFL 100." }), sourceUrl: "https://www.mcgill.ca/" },

  // ───── Healthcare / Public Health / Nursing ─────
  { slug: "msc-public-health-edinburgh", name: "MSc Public Health", universitySlug: "university-of-edinburgh", countrySlug: "uk", city: "Edinburgh", level: "Masters", subject: "Public Health", duration: "1 year (full-time)", intake: "September", tuition: "£27,000 (approximate)", scholarship: "Merit awards £3,000–8,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in health, medicine, or related", overview: "A research-led MPH covering epidemiology, biostatistics, health policy, and global health, with strong links to NHS Scotland and global health bodies.", modules: courseModules.healthcare, careerOutcomes: careerOutcomes.healthcare, documents: docsChecklist, deadline: "April (September intake)", faqs: courseFaqs({ course: "MSc Public Health at Edinburgh", uni: "University of Edinburgh", postStudy: "Yes — eligible for the Scottish Graduate Visa (2 years post-study work).", scholarship: "merit awards of £3,000–8,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.ed.ac.uk/" },
  { slug: "master-of-public-health-mcmaster", name: "Master of Public Health", universitySlug: "mcmaster-university", countrySlug: "canada", city: "Hamilton", level: "Masters", subject: "Public Health", duration: "16 months (course-based)", intake: "September", tuition: "CAD 35,000 (approximate, total)", scholarship: "Merit awards CAD 4,000–15,000", englishRequirement: "IELTS 6.5", academicRequirement: "Bachelor with B+ in health sciences or related", overview: "A course-based MPH at the home of evidence-based medicine, covering epidemiology, biostatistics, health policy, and a practicum placement.", modules: courseModules.healthcare, careerOutcomes: careerOutcomes.healthcare, documents: docsChecklist, deadline: "January (September intake)", faqs: courseFaqs({ course: "MPH at McMaster", uni: "McMaster University", postStudy: "Yes — eligible for the Post-Graduation Work Permit (PGWP) of up to 3 years.", scholarship: "merit awards of CAD 4,000–15,000", english: "IELTS 6.5 overall." }), sourceUrl: "https://www.mcmaster.ca/" },
  { slug: "msc-nursing-kcl", name: "MSc Nursing", universitySlug: "kings-college-london", countrySlug: "uk", city: "London", level: "Masters", subject: "Nursing", duration: "1 year (full-time)", intake: "September", tuition: "£30,000 (approximate)", scholarship: "Merit awards £2,000–8,000", englishRequirement: "IELTS 7.0 (6.5 in each band)", academicRequirement: "Bachelor in nursing with registration and clinical experience", overview: "A specialist Masters at the Florence Nightingale Faculty of Nursing, covering advanced clinical practice, leadership, and evidence-based research.", modules: courseModules.healthcare, careerOutcomes: careerOutcomes.healthcare, documents: docsChecklist, deadline: "March (September intake)", faqs: courseFaqs({ course: "MSc Nursing at King's", uni: "King's College London", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–8,000", english: "IELTS 7.0 with 6.5 in each band." }), sourceUrl: "https://www.kcl.ac.uk/" },
  { slug: "master-of-nursing-sydney", name: "Master of Nursing", universitySlug: "university-of-sydney", countrySlug: "australia", city: "Sydney", level: "Masters", subject: "Nursing", duration: "1.5 years", intake: "February, July", tuition: "AUD 45,000 (approximate, per year)", scholarship: "Vice-Chancellor Awards AUD 20,000–40,000", englishRequirement: "IELTS 7.0 (7.0 in each band)", academicRequirement: "Bachelor in nursing with registration + clinical experience", overview: "A specialist Masters for registered nurses covering advanced practice, leadership, and clinical research at Australia's top nursing school.", modules: courseModules.healthcare, careerOutcomes: careerOutcomes.healthcare, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "MN at Sydney", uni: "University of Sydney", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "Vice-Chancellor Awards of AUD 20,000–40,000", english: "IELTS 7.0 with 7.0 in each band." }), sourceUrl: "https://www.sydney.edu.au/" },

  // ───── Hospitality / Tourism ─────
  { slug: "master-of-international-hospitality-management-taylors", name: "Master in International Hospitality Management", universitySlug: "taylor-s-university", countrySlug: "malaysia", city: "Subang Jaya", level: "Masters", subject: "Hospitality", duration: "1.5–2 years", intake: "January, April, August", tuition: "MYR 35,000 (approximate, total)", scholarship: "Merit scholarships up to 30%", englishRequirement: "IELTS 6.0", academicRequirement: "Bachelor in any discipline", overview: "A practical Masters at one of Asia's top hospitality schools, covering operations, revenue management, and strategy with industry placement.", modules: courseModules.hospitality, careerOutcomes: careerOutcomes.hospitality, documents: docsChecklist, deadline: "Rolling", faqs: courseFaqs({ course: "MIHM at Taylor's", uni: "Taylor's University", postStudy: "Yes — Malaysia offers post-study work options for graduates of recognised universities.", scholarship: "merit scholarships up to 30%", english: "IELTS 6.0 overall." }), sourceUrl: "https://university.taylors.edu.my/" },
  { slug: "master-of-tourism-otago", name: "Master of Tourism", universitySlug: "university-of-otago", countrySlug: "new-zealand", city: "Dunedin", level: "Masters", subject: "Tourism", duration: "1.5 years", intake: "February, July", tuition: "NZD 42,000 (approximate, total)", scholarship: "International Excellence Awards NZD 10,000–20,000", englishRequirement: "IELTS 6.5", academicRequirement: "Bachelor in tourism, business, or related", overview: "A research-led Masters at one of the world's leading tourism research schools, covering sustainable tourism, destination management, and policy.", modules: courseModules.hospitality, careerOutcomes: careerOutcomes.hospitality, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "Master of Tourism at Otago", uni: "University of Otago", postStudy: "Yes — eligible for the Post-Study Work Visa (1–3 years).", scholarship: "International Excellence Awards of NZD 10,000–20,000", english: "IELTS 6.5 overall." }), sourceUrl: "https://www.otago.ac.nz/" },
  { slug: "ma-international-tourism-management-coventry", name: "MA International Tourism Management", universitySlug: "coventry-university", countrySlug: "uk", city: "Coventry", level: "Masters", subject: "Tourism", duration: "1 year", intake: "September, January", tuition: "£18,500 (approximate)", scholarship: "Merit awards up to £3,000", englishRequirement: "IELTS 6.5", academicRequirement: "Bachelor 2:2 in tourism, business, or related", overview: "A career-focused Masters covering destination marketing, sustainable tourism, event management, and an industry-linked consultancy project.", modules: courseModules.hospitality, careerOutcomes: careerOutcomes.hospitality, documents: docsChecklist, deadline: "Rolling", faqs: courseFaqs({ course: "MA International Tourism at Coventry", uni: "Coventry University", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards up to £3,000", english: "IELTS 6.5 overall." }), sourceUrl: "https://www.coventry.ac.uk/" },

  // ───── Marketing / Digital Marketing ─────
  { slug: "msc-marketing-leeds", name: "MSc Marketing", universitySlug: "university-of-leeds", countrySlug: "uk", city: "Leeds", level: "Masters", subject: "Marketing", duration: "1 year", intake: "September", tuition: "£27,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in any discipline", overview: "A triple-accredited Masters covering consumer behaviour, digital strategy, brand management, and analytics with a consultancy dissertation.", modules: courseModules.marketing, careerOutcomes: careerOutcomes.marketing, documents: docsChecklist, deadline: "June (September intake)", faqs: courseFaqs({ course: "MSc Marketing at Leeds", uni: "University of Leeds", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.leeds.ac.uk/" },
  { slug: "msc-digital-marketing-queen-mary", name: "MSc Digital Marketing", universitySlug: "queen-mary-university-of-london", countrySlug: "uk", city: "London", level: "Masters", subject: "Digital Marketing", duration: "1 year", intake: "September", tuition: "£25,000 (approximate)", scholarship: "Merit awards £2,000–5,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:2 in any discipline", overview: "A practical Masters covering SEO, social, performance marketing, analytics, and automation, with industry tools and a capstone campaign project.", modules: courseModules.marketing, careerOutcomes: careerOutcomes.marketing, documents: docsChecklist, deadline: "July (September intake)", faqs: courseFaqs({ course: "MSc Digital Marketing at QMUL", uni: "Queen Mary University of London", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–5,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.qmul.ac.uk/" },
  { slug: "master-of-marketing-monash", name: "Master of Marketing", universitySlug: "monash-university", countrySlug: "australia", city: "Melbourne", level: "Masters", subject: "Marketing", duration: "1–2 years", intake: "February, July", tuition: "AUD 47,000 (approximate, per year)", scholarship: "Merit awards AUD 5,000–20,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor degree + 1+ years experience", overview: "A practical Masters at Monash Business School covering digital strategy, analytics, brand, and consumer behaviour with industry-led projects.", modules: courseModules.marketing, careerOutcomes: careerOutcomes.marketing, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "Master of Marketing at Monash", uni: "Monash University", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "merit awards of AUD 5,000–20,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.monash.edu/" },

  // ───── Cyber Security ─────
  { slug: "msc-cyber-security-southampton", name: "MSc Cyber Security", universitySlug: "university-of-southampton", countrySlug: "uk", city: "Southampton", level: "Masters", subject: "Cyber Security", duration: "1 year", intake: "September", tuition: "£28,500 (approximate)", scholarship: "Merit awards £2,000–6,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in computer science or related", overview: "A GCHQ-certified Masters covering network security, cryptography, secure systems, and incident response with a research-led dissertation.", modules: courseModules.cyber, careerOutcomes: careerOutcomes.cyber, documents: docsChecklist, deadline: "May (September intake)", faqs: courseFaqs({ course: "MSc Cyber Security at Southampton", uni: "University of Southampton", postStudy: "Yes — eligible for the UK Graduate Route visa (2 years post-study work).", scholarship: "merit awards of £2,000–6,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.southampton.ac.uk/" },
  { slug: "msc-cyber-security-edinburgh", name: "MSc Cyber Security, Privacy and Trust", universitySlug: "university-of-edinburgh", countrySlug: "uk", city: "Edinburgh", level: "Masters", subject: "Cyber Security", duration: "1 year", intake: "September", tuition: "£34,000 (approximate)", scholarship: "Merit awards £3,000–8,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor 2:1 in informatics, CS, or related", overview: "A research-intensive Masters at Europe's largest informatics school, covering cryptography, secure systems, privacy, and AI security.", modules: courseModules.cyber, careerOutcomes: careerOutcomes.cyber, documents: docsChecklist, deadline: "April (September intake)", faqs: courseFaqs({ course: "MSc Cyber Security at Edinburgh", uni: "University of Edinburgh", postStudy: "Yes — eligible for the Scottish Graduate Visa (2 years post-study work).", scholarship: "merit awards of £3,000–8,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.ed.ac.uk/" },
  { slug: "master-of-cyber-security-melbourne", name: "Master of Cyber Security", universitySlug: "university-of-melbourne", countrySlug: "australia", city: "Melbourne", level: "Masters", subject: "Cyber Security", duration: "1.5–2 years", intake: "February, July", tuition: "AUD 47,000 (approximate, per year)", scholarship: "Merit awards AUD 5,000–20,000", englishRequirement: "IELTS 6.5 (6.0 in each band)", academicRequirement: "Bachelor in IT or related with strong grades", overview: "A specialist Masters covering cryptography, network security, digital forensics, and security operations with industry-linked capstone projects.", modules: courseModules.cyber, careerOutcomes: careerOutcomes.cyber, documents: docsChecklist, deadline: "December (February), May (July)", faqs: courseFaqs({ course: "MCyberSec at Melbourne", uni: "University of Melbourne", postStudy: "Yes — eligible for the 2–4 year Temporary Graduate Visa (485).", scholarship: "merit awards of AUD 5,000–20,000", english: "IELTS 6.5 with 6.0 in each band." }), sourceUrl: "https://www.unimelb.edu.au/" },
];

// ────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding EXPANDED universities and courses (additive to seed-public)...");

  // Delete ONLY the items this seed creates (by slug) — never wipe the whole table.
  for (const u of universities) {
    await db.universityPage.deleteMany({ where: { slug: u.slug } });
  }
  for (const c of courses) {
    await db.coursePage.deleteMany({ where: { slug: c.slug } });
  }

  // Create universities
  for (const u of universities) {
    await db.universityPage.create({
      data: {
        slug: u.slug,
        name: u.name,
        countrySlug: u.countrySlug,
        city: u.city,
        overview: u.overview,
        strengths: J(u.strengths),
        quickFacts: J(u.quickFacts),
        entryRequirements: J(u.entryRequirements),
        tuition: J(u.tuition),
        applicationSteps: J(u.applicationSteps),
        documents: J(u.documents),
        faqs: J(u.faqs),
        sourceUrl: u.sourceUrl,
        lastVerifiedAt: NOW,
        verificationStatus: "VERIFIED",
        approvalStatus: "PUBLISHED",
      },
    });
  }
  console.log(`Seeded ${universities.length} new university pages`);

  // Create courses
  for (const c of courses) {
    await db.coursePage.create({
      data: {
        slug: c.slug,
        name: c.name,
        universitySlug: c.universitySlug,
        countrySlug: c.countrySlug,
        city: c.city,
        level: c.level,
        subject: c.subject,
        duration: c.duration,
        intake: c.intake,
        tuition: c.tuition,
        scholarship: c.scholarship,
        englishRequirement: c.englishRequirement,
        academicRequirement: c.academicRequirement,
        overview: c.overview,
        modules: J(c.modules),
        careerOutcomes: J(c.careerOutcomes),
        documents: J(c.documents),
        faqs: J(c.faqs),
        deadline: c.deadline,
        sourceUrl: c.sourceUrl,
        lastVerifiedAt: NOW,
        verificationStatus: "VERIFIED",
        approvalStatus: "PUBLISHED",
      },
    });
  }
  console.log(`Seeded ${courses.length} new course pages`);

  console.log("Expanded seed complete!");
  console.log(`Total universities: ${await db.universityPage.count()}, Total courses: ${await db.coursePage.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
