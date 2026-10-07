// ============================================================================
// ALO Spec Services Catalog (spec: SERVICES SYSTEM) — the exact 14 services
// and publication slugs. DB is the source of truth when rows exist; this
// catalog guarantees: (1) the directory never shows fewer than the 14 spec
// services, (2) every card links to a working /services/{slug} detail page,
// (3) aliases below redirect old slugs to the canonical spec slugs.
// Content here is ALO editorial guidance — marked `verificationStatus:
// 'pending'` until an admin verifies each record (spec: VERIFICATION SYSTEM).
// Pure data + pure helpers — no db access, fully unit-testable.
// ============================================================================

export interface SpecService {
  slug: string;
  title: string;
  category: string;
  icon: string;
  shortDescription: string;
  whatIs: string;
  whyNeeded: string;
  whoIsFor: string[];
  whatAloDoes: string;
  processSteps: { step: number; title: string; desc: string }[];
  documentsNeeded: string[];
  whoNeedsItCategories: string[]; // subset of §6 categories relevant to service
  hasStartApplication: boolean;
}

const BASE_STEPS = [
  { step: 1, title: 'Initial Consultation', desc: 'Understand your goals, background, timeline and budget.' },
  { step: 2, title: 'Profile Assessment', desc: 'Review academic history, English level, finances and preferences.' },
  { step: 3, title: 'Requirement Review', desc: 'Map your profile against entry and visa requirements.' },
  { step: 4, title: 'Recommendation', desc: 'You receive a written, documented recommendation.' },
  { step: 5, title: 'Document Preparation', desc: 'Build and check the complete document checklist.' },
  { step: 6, title: 'Submission', desc: 'Applications/forms submitted and receipt confirmed.' },
  { step: 7, title: 'Follow-up', desc: 'Track progress, respond to requests, keep you updated.' },
  { step: 8, title: 'Final Review', desc: 'Verify outcomes and plan the next stage with you.' },
];

const STANDARD_DOCS = ['Passport', 'Academic certificates & transcripts', 'English test score (if taken)', 'CV', 'Personal statement / SOP'];

export const SPEC_SERVICES: SpecService[] = [
  {
    slug: 'personalized-counselling', title: 'Personalized Counseling', category: 'Advisory', icon: 'Users',
    shortDescription: 'One-to-one guidance built around your academic profile, budget, and career goals — a personal plan, not a generic brochure.',
    whatIs: 'A structured one-to-one advisory service where an ALO counselor studies your complete profile — education history, English level, finances, preferred destinations, and career aims — and builds an individual study-abroad plan for you.',
    whyNeeded: 'Study-abroad decisions involve hundreds of interacting variables. Personal counselling converts general information into decisions that fit YOUR situation, saving time, money and avoidable mistakes.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'Students changing countries', 'Students with study gaps', 'Students with complex academic profiles'],
    whatAloDoes: 'ALO assigns a dedicated counselor; maps your profile against countries, universities, courses and scholarships; identifies eligibility gaps early; documents every recommendation in writing; and stays with you through each stage.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS,
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students', 'International applicants', 'Students changing countries', 'Students with study gaps', 'Students with complex academic profiles'],
    hasStartApplication: false,
  },
  {
    slug: 'university-selection', title: 'University Selection', category: 'Shortlisting', icon: 'Building2',
    shortDescription: 'Choose universities on suitability, not just rankings — location, tuition, entry requirements, scholarships, employability and intake fit.',
    whatIs: 'A structured shortlisting service that matches your profile to accredited universities using verified data: entry requirements, tuition, location, intakes, scholarship availability and graduate outcomes.',
    whyNeeded: 'Applying to the wrong universities costs application fees, time, and visa credibility. Suitability — entry match, budget match, intake match — matters more for admission odds than rank alone.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    whatAloDoes: 'ALO explains ranking vs suitability; compares universities side-by-side (tuition, entry, English, scholarships, employability, intake availability); checks budget and profile matching; lists common mistakes; and finalizes a written shortlist with you: typically safe, match, and aspirational options.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS,
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'course-matching', title: 'Course Matching', category: 'Shortlisting', icon: 'GraduationCap',
    shortDescription: 'Match the right subject and course structure to your previous education, career goals, English level and budget — connected to the ALO Course Finder.',
    whatIs: 'Evidence-based course selection: we match subject choice, course duration, tuition, intake, English requirements and career outcomes against your academic record and goals, using the ALO Course Finder database.',
    whyNeeded: 'The course — not just the university — determines employability, visa file strength and budget. Wrong course choices cause refusals, transfers and sunk tuition.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    whatAloDoes: 'ALO reviews subject selection against your previous education and career goals; checks academic eligibility, course duration, tuition, intake and English requirement; connects results to the Course Finder; compares courses and maps the application pathway.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS,
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students'],
    hasStartApplication: true,
  },
  {
    slug: 'application-assistance', title: 'Application Assistance', category: 'Applications', icon: 'FileText',
    shortDescription: 'From application form to offer: document verification, university submission, offer monitoring, deadlines and deposit stage handled correctly.',
    whatIs: 'Complete management of your university application: preparing the application form, verifying documents, submitting to universities, monitoring conditional/unconditional offers, managing deadlines and guiding the deposit stage.',
    whyNeeded: 'Most avoidable rejections come from incomplete applications, wrong documents or missed deadlines — not grades. A managed process removes those risks.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    whatAloDoes: 'ALO prepares and verifies your application; verifies every document before submission; submits to your chosen universities; monitors offer status; explains conditional vs unconditional offers; manages deadlines; and guides you through the deposit stage with verified payment instructions.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS,
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    hasStartApplication: true,
  },
  {
    slug: 'sop-cv-support', title: 'SOP & CV Support', category: 'Documents', icon: 'PenSquare',
    shortDescription: 'An honest, original Statement of Purpose and a well-structured academic CV — edited, reviewed and approved by you before submission.',
    whatIs: 'Guided writing and editorial support for your Statement of Purpose and CV: what universities expect, the right structure, and an editing + student-review process that keeps the work genuinely yours.',
    whyNeeded: 'The SOP is often the only narrative the university reads. A generic or copied SOP damages credibility — universities check for originality. We never encourage fabricated experiences or false documents.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    whatAloDoes: 'ALO explains SOP purpose and structure; shows what universities expect and common mistakes; helps you draft from your real experiences; supports academic vs professional CV formats; edits for clarity and correctness; and you review and approve the final text before any submission.',
    processSteps: BASE_STEPS, documentsNeeded: ['Passport', 'Academic transcripts', 'Draft CV (if any)', 'Work/extracurricular details (genuine only)'],
    whoNeedsItCategories: ['Postgraduate students', 'Students with complex academic profiles', 'Students with study gaps'],
    hasStartApplication: false,
  },
  {
    slug: 'document-checking', title: 'Document Checking', category: 'Documents', icon: 'FileCheck',
    shortDescription: 'Passport, certificates, transcripts, financial and sponsor documents — checked for completeness, consistency and translation requirements before submission.',
    whatIs: 'Pre-submission verification of your full document set: passport, academic certificates, transcripts, English test, financial documents, employment documents, sponsor documents — including translation requirements and document consistency.',
    whyNeeded: 'Inconsistent names, dates or financial evidence are leading causes of offer delays and visa refusals. Checking before submission is far cheaper than fixing after.',
    whoIsFor: ['International applicants', 'Students with complex academic profiles'],
    whatAloDoes: 'ALO checks each document against the requirement checklist; verifies name/date consistency across documents; confirms financial and sponsor evidence structure; advises on certified translations; and flags gaps early with a written fix list.',
    processSteps: BASE_STEPS, documentsNeeded: ['Passport', 'Academic certificates', 'Transcripts', 'English test', 'Financial documents', 'Employment documents (if any)', 'Sponsor documents (if sponsored)'],
    whoNeedsItCategories: ['International applicants', 'Students with complex academic profiles'],
    hasStartApplication: false,
  },
  {
    slug: 'visa-guidance', title: 'Visa Guidance', category: 'Visa', icon: 'Globe',
    shortDescription: 'Country-specific student visa preparation: documents, financial evidence, credibility/interview preparation and official-source verification — no outcomes guaranteed.',
    whatIs: 'Preparation support for your student visa application: country-specific requirements, financial documentation, document checklist, application preparation, credibility/interview preparation, and common-error prevention. ALO never fabricates documents and never guarantees a visa decision.',
    whyNeeded: 'Visa rules differ completely by country and change over time. The strongest admission file fails if the visa file is weak or inconsistent.',
    whoIsFor: ['International applicants'],
    whatAloDoes: 'ALO guides your visa preparation end-to-end: country-specific requirements (never mixed between countries), financial documentation structure, document checklist, application preparation, credibility/interview preparation, common errors review, and verification against official government and visa-authority sources.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS.concat(['Financial evidence (bank statements, sponsor finances)', 'CAS / I-20 / COE or country equivalent']),
    whoNeedsItCategories: ['International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'interview-preparation', title: 'Interview Preparation', category: 'Visa', icon: 'MessageSquare',
    shortDescription: 'Mock credibility and university interviews with structured feedback — questions vary, no interview outcome can be guaranteed.',
    whatIs: 'Practice sessions for university and visa credibility interviews: typical question themes, answer structuring, communication coaching and recorded feedback. Interview questions can vary; preparation builds confidence and consistency, not scripts.',
    whyNeeded: 'Credibility interviews test whether you genuinely understand your course, university and financing. Weak, inconsistent answers are a common refusal reason.',
    whoIsFor: ['International applicants', 'Students with study gaps', 'Students with complex academic profiles'],
    whatAloDoes: 'ALO runs research-based mock interviews (themes from verifiable public guidance), gives structured feedback, coaches honest and consistent answers, and repeats practice until you are ready — with clear disclaimers that questions vary and no outcome can be guaranteed.',
    processSteps: BASE_STEPS, documentsNeeded: ['Offer letter / CAS (if issued)', 'SOP / personal statement', 'Financial documents summary'],
    whoNeedsItCategories: ['International applicants', 'Students with study gaps'],
    hasStartApplication: false,
  },
  {
    slug: 'english-test-preparation', title: 'English Test Preparation', category: 'English', icon: 'Languages',
    shortDescription: 'IELTS, IELTS UKVI, PTE, TOEFL, Duolingo, OET and other supported tests — connected to the full ALO Language Preparation system.',
    whatIs: 'Structured preparation for the English test your target university accepts: IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OET and other supported tests — delivered through the ALO Language Preparation platform.',
    whyNeeded: 'English scores gate both admission and visa. Choosing the WRONG test (e.g., non-UKVI where UKVI is required) can invalidate an otherwise good application.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    whatAloDoes: 'ALO maps each target university to accepted tests and scores; diagnoses your current level; builds a study plan; connects you to the Language Preparation system (/language-prep) with practice modules; and reviews readiness before you book an official exam.',
    processSteps: BASE_STEPS, documentsNeeded: ['Passport (for exam registration)', 'Previous English score (if any)'],
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students', 'International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'financial-planning', title: 'Financial Planning', category: 'Finance', icon: 'Banknote',
    shortDescription: 'Realistic budgeting for tuition, deposits, living costs, visa fees and emergency funds — figures shown only when verified with source and date.',
    whatIs: 'Planning the complete cost of studying abroad: tuition, deposit, living costs, accommodation, insurance, visa costs, travel, banking, currency and an emergency fund — with documented budget planning.',
    whyNeeded: 'Under-budgeting is a top cause of visa refusal and mid-course financial stress. Financial evidence must also match visa rules exactly.',
    whoIsFor: ['International applicants', 'Students with complex academic profiles'],
    whatAloDoes: 'ALO builds a verified cost picture for your choices; explains deposit and payment stages; plans financial evidence for the visa file; advises on banking and currency; and documents an emergency-fund plan. Where figures are quoted, the source and last-verified date are shown — ALO never displays fabricated cost figures.',
    processSteps: BASE_STEPS, documentsNeeded: ['University fee letter (if any)', 'Sponsor financial documents', 'Current savings summary'],
    whoNeedsItCategories: ['International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'scholarship-guidance', title: 'Scholarship Guidance', category: 'Finance', icon: 'Award',
    shortDescription: 'Find verified scholarships, assess eligibility, track deadlines and build a strong application — connected to the ALO Scholarships directory.',
    whatIs: 'A guided scholarship search and application service: finding scholarships, eligibility assessment, deadline tracking, required documents, application strategy and scholarship-specific requirements.',
    whyNeeded: 'Real scholarships exist with strict criteria and deadlines; most students either never find them or apply late with weak statements. No scholarship success can be promised — but a correct strategy improves your genuine chances.',
    whoIsFor: ['Undergraduate students', 'Postgraduate students'],
    whatAloDoes: 'ALO searches verified scholarships in the ALO Scholarships directory and official sources; assesses your eligibility; tracks deadlines; prepares required documents; and builds a strategy: stronger statements, demonstrated achievement, and deadline planning.',
    processSteps: BASE_STEPS, documentsNeeded: STANDARD_DOCS,
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students'],
    hasStartApplication: false,
  },
  {
    slug: 'pre-departure-orientation', title: 'Pre-Departure Orientation', category: 'Travel', icon: 'Plane',
    shortDescription: 'Everything before you fly: visa documents, accommodation, flights, insurance, banking, SIM, airport arrival and the first-week checklist.',
    whatIs: 'A structured orientation for the weeks before departure: travel documents, accommodation, flights, insurance, finance, banking, SIM, university documents, airport arrival, local transport, emergency planning and your first-week checklist.',
    whyNeeded: 'Arrivals fail on small things — missing documents, no local currency, no airport plan. Orientation converts anxiety into a checklist.',
    whoIsFor: ['International applicants'],
    whatAloDoes: 'ALO provides a written pre-departure checklist; reviews travel and university documents; advises on accommodation, flights and insurance; plans banking and currency; briefs you on airport arrival and local transport; and sets up an emergency plan for the first week.',
    processSteps: BASE_STEPS, documentsNeeded: ['Passport with visa', 'University offer/CAS or equivalent', 'Accommodation confirmation', 'Travel insurance (if arranged)'],
    whoNeedsItCategories: ['International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'post-arrival-support', title: 'Post-Arrival Support', category: 'Support', icon: 'HeartHandshake',
    shortDescription: 'Support after you land: settling in, university enrollment, local registration, banking and staying on track with your studies.',
    whatIs: 'Continued support after arrival: airport-to-accommodation transition, university enrolment, local registrations where required, banking, and early-semester check-ins.',
    whyNeeded: 'The first month abroad decides whether a student settles or struggles. Most problems are administrative, solvable early, and predictable.',
    whoIsFor: ['International applicants'],
    whatAloDoes: 'ALO confirms safe arrival; guides enrolment and any required local registration; helps with banking and local administration; schedules early-semester check-ins; and remains your contact point for genuine problems.',
    processSteps: BASE_STEPS, documentsNeeded: ['Passport with visa', 'University documents'],
    whoNeedsItCategories: ['International applicants'],
    hasStartApplication: false,
  },
  {
    slug: 'career-counselling', title: 'Career Counseling', category: 'Advisory', icon: 'Briefcase',
    shortDescription: 'Connect your subject choice to employable careers — before you spend on tuition.',
    whatIs: 'Career-focused advisory that connects subject and course choice to realistic employment outcomes: skills demand, graduate roles, and how your study plan feeds a career path.',
    whyNeeded: 'Tuition is an investment; a course without a career purpose wastes it. Career clarity also strengthens SOPs and visa credibility (genuine study intention).',
    whoIsFor: ['Undergraduate students', 'Postgraduate students'],
    whatAloDoes: 'ALO maps your interests and academics to career fields; evaluates employability of proposed courses in destination countries; aligns university/course selection with career goals; and documents a career-linked study plan.',
    processSteps: BASE_STEPS, documentsNeeded: ['Academic transcripts', 'CV (if any)'],
    whoNeedsItCategories: ['Undergraduate students', 'Postgraduate students'],
    hasStartApplication: false,
  },
];

/** Old slugs → canonical spec slugs (kept from the legacy MASTER data). */
export const SERVICE_SLUG_ALIASES: Record<string, string> = {
  'personalized-study-abroad-counseling': 'personalized-counselling',
  'university-course-selection': 'university-selection',
  'scholarship-financial-aid-assistance': 'scholarship-guidance',
  'sop-lor-application-preparation': 'sop-cv-support',
  'university-application-submission-tracking': 'application-assistance',
  'student-visa-guidance-file-processing': 'visa-guidance',
  'bank-solvency-financial-documentation': 'financial-planning',
  'english-language-test-prep-coaching': 'english-test-preparation',
  'pre-departure-briefing-travel-assistance': 'pre-departure-orientation',
  'post-arrival-accommodation-support': 'post-arrival-support',
  'interview-preparation': 'interview-preparation',
  'document-checking': 'document-checking',
  'course-matching': 'course-matching',
  'career-counselling': 'career-counselling',
};

export function getSpecService(slug: string): SpecService | undefined {
  const canonical = SERVICE_SLUG_ALIASES[slug] || slug;
  return SPEC_SERVICES.find((s) => s.slug === canonical);
}

/** Convert a spec record into the ServiceDetailHub-facing payload shape. */
export function specServiceToPayload(s: SpecService) {
  return {
    id: `spec_${s.slug}`,
    slug: s.slug,
    title: s.title,
    category: s.category,
    icon: s.icon,
    shortDescription: s.shortDescription,
    whatIs: s.whatIs,
    whyNeeded: s.whyNeeded,
    whoIsFor: JSON.stringify(s.whoIsFor),
    whatAloDoes: s.whatAloDoes,
    processSteps: JSON.stringify(s.processSteps),
    requiredInfo: JSON.stringify(['Academic transcripts', 'English scores', 'Budget', 'Intake preference', 'Destination preference']),
    documentsNeeded: JSON.stringify(s.documentsNeeded),
    eligibility: '',
    timeline: 'Processing times vary by institution, country, intake and applicant circumstances. Confirm your individual timeline with an ALO counselor.',
    fees: '',
    whatStudentsReceive: JSON.stringify(['A documented personal plan', 'Verified requirement checklists', 'Counselor follow-through at every stage']),
    whatNotGuaranteed: 'ALO does not guarantee university admission, scholarship awards or visa approvals — decisions rest with universities and authorities.',
    commonMistakes: JSON.stringify(['Generic SOPs copied from the internet', 'Incomplete or inconsistent documents', 'Missing deadlines', 'Choosing by ranking alone, not suitability']),
    whoNeedsItCategories: s.whoNeedsItCategories,
    hasStartApplication: s.hasStartApplication,
    heroTitle: `${s.title} — ALO Education`,
    heroSubtitle: s.shortDescription,
    status: 'active',
    verificationStatus: 'pending',
    lastVerifiedAt: null,
    sourceUrl: '',
    sourceName: 'ALO Editorial',
  };
}
