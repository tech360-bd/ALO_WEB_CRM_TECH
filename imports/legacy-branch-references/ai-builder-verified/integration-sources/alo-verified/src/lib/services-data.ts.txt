/**
 * ALO Education — Service Catalogue
 *
 * Static content for the /services listing and /services/[slug] detail pages.
 * 14 premium services. No fabricated claims — every guarantee statement is
 * explicitly framed as "support" / "guidance" rather than a promise.
 *
 * Visa Guidance specifically avoids any visa-approval promises and includes
 * an official-source disclaimer.
 */

import {
  Users, Globe, BookOpen, FileText, FileCheck2, Plane, ShieldCheck,
  Mic, Languages, Wallet, Award, PackageCheck, LifeBuoy, Briefcase,
  type LucideIcon,
} from 'lucide-react'

export interface ServiceDetail {
  slug: string
  title: string
  shortDescription: string
  icon: LucideIcon
  color: string // hex used for accent
  whatItIs: string
  whyNeeded: string[]
  whoItsFor: string[]
  whatAloDoes: string[]
  process: string[]
  requiredInfo: string[]
  documentsNeeded: string[]
  timeline: string
  studentsReceive: string[]
  notGuaranteed: string[]
  commonMistakes: string[]
  faq: Array<{ q: string; a: string }>
  relatedSlugs: string[]
}

export const SERVICES: ServiceDetail[] = [
  {
    slug: 'personalized-counseling',
    title: 'Personalized Counseling',
    shortDescription: 'One-to-one guidance from a certified counselor who maps your goals to the right universities and courses.',
    icon: Users,
    color: '#0057B8',
    whatItIs:
      'A one-to-one session with an ALO Education counselor to understand your academic background, career goals, budget, and personal preferences. The counselor documents your profile, explains your study-abroad options across destinations, and recommends a realistic roadmap.',
    whyNeeded: [
      'Each student has a unique academic and financial profile — there is no one-size-fits-all answer.',
      'Choosing the wrong destination, level, or course can cost you a year and significant money.',
      'A counselor translates your profile into the eligibility language used by universities and visa officers.',
      'You avoid relying on rumor or hearsay from friends or social media.',
    ],
    whoItsFor: [
      'Students who are early in their research and want direction.',
      'Students choosing between multiple destinations or courses.',
      'Students with gaps, low scores, or unusual academic backgrounds.',
      'Parents who want an independent professional opinion before committing.',
    ],
    whatAloDoes: [
      'Conduct a structured discovery session (in-person, phone, or video).',
      'Build a written profile document covering academics, English level, budget, and timeline.',
      'Recommend a destination shortlist with reasoning.',
      'Highlight realistic vs. aspirational universities for your profile.',
      'Flag any red flags (gaps, low IELTS, missing prerequisites) early.',
    ],
    process: [
      'Book a free consultation slot via the website, phone, or WhatsApp.',
      'Attend the 30–45 minute session and share your transcripts and English scores if available.',
      'Receive a written summary and shortlist within 2 working days.',
      'Decide which path to pursue and proceed to University Selection or Course Matching.',
    ],
    requiredInfo: [
      'Full name and contact number.',
      'Current academic level and results (or expected results).',
      'English test status (taken / planned / not yet started).',
      'Preferred destination(s), if any.',
      'Approximate budget (tuition + living).',
      'Preferred intake (Spring / Fall / Winter).',
    ],
    documentsNeeded: [
      'Academic transcripts (most recent 2 years).',
      'Passport copy (first and last page) — if available.',
      'English test score report — if available.',
      'CV or résumé — optional but useful for postgraduate applicants.',
    ],
    timeline: '1 session (30–45 minutes) + written summary within 2 working days.',
    studentsReceive: [
      'A documented profile and shortlist of destinations/universities.',
      'A clear next-step action plan.',
      'Honest assessment of strengths and gaps.',
      'A dedicated counselor contact for follow-up questions.',
    ],
    notGuaranteed: [
      'A guaranteed admission offer — admission is the university\'s decision, not ALO\'s.',
      'A guaranteed scholarship — scholarships depend on the university and applicant pool.',
      'A guaranteed visa — visa decisions are made by the destination country\'s immigration authority.',
    ],
    commonMistakes: [
      'Treating the consultation as a sales pitch — it is a discovery session, not a commitment to enroll.',
      'Hiding low scores or gaps; these almost always surface later and are easier to address upfront.',
      'Skipping the session because "I already know what I want" — most students revise their shortlist after one session.',
    ],
    faq: [
      {
        q: 'Is the first consultation really free?',
        a: 'Yes. Your first consultation is free. We are funded by partner universities, so you do not pay for discovery or application support.',
      },
      {
        q: 'Can parents attend the session?',
        a: 'Yes — we encourage parents to attend. The decision is usually a family decision, and having everyone hear the same information avoids confusion later.',
      },
      {
        q: 'What if I am undecided between undergraduate and postgraduate?',
        a: 'Tell your counselor. We map both pathways and let you compare directly before committing.',
      },
    ],
    relatedSlugs: ['university-selection', 'course-matching', 'financial-planning'],
  },
  {
    slug: 'university-selection',
    title: 'University Selection',
    shortDescription: 'A shortlist of 5–8 universities matched to your profile, budget, and career goals.',
    icon: Globe,
    color: '#0057B8',
    whatItIs:
      'A structured shortlisting exercise where your counselor builds a list of 5–8 universities matching your profile, budget, and timeline. Each university is labeled realistic, ambitious, or safety so you understand your odds before applying.',
    whyNeeded: [
      'Applying to the wrong universities wastes application fees and time.',
      'A balanced shortlist dramatically improves the chance of at least one offer.',
      'University rankings are not the only factor — employability, location, scholarships, and visa post-study rules matter equally.',
      'Each university has different English and academic prerequisites; your counselor checks these against your profile.',
    ],
    whoItsFor: [
      'Students who have completed Personalized Counseling and know their destination.',
      'Students applying to multiple universities and unsure how to balance the list.',
      'Students who want a "second opinion" on a list they have built themselves.',
    ],
    whatAloDoes: [
      'Pull university data from ALO\'s admissions database (real courses, real fees, real deadlines).',
      'Categorize each option as realistic, ambitious, or safety based on your profile.',
      'Check scholarship availability per university.',
      'Cross-check English requirements against your current or planned test.',
      'Deliver a written shortlist with rationale per option.',
    ],
    process: [
      'Hand over your profile (transcripts, English score if any, budget).',
      'Counselor runs the shortlist exercise (1–2 working days).',
      'Review session: you and your counselor walk through each option.',
      'Finalize the apply list (typically 4–6 universities).',
    ],
    requiredInfo: [
      'Completed Personalized Counseling profile.',
      'English test status.',
      'Budget per year (tuition + living).',
      'Preferred destination(s).',
      'Preferred intake.',
    ],
    documentsNeeded: [
      'Academic transcripts.',
      'English test score report (if available).',
      'Passport copy (optional at this stage).',
    ],
    timeline: '1–2 working days for the shortlist; review session is 30 minutes.',
    studentsReceive: [
      'A written shortlist of 5–8 universities with categorization.',
      'Per-university rationale (why each option was chosen).',
      'Scholarship availability flag per university.',
      'A clear apply list of 4–6 universities.',
    ],
    notGuaranteed: [
      'Admission to any specific university — admission is the university\'s decision.',
      'A specific ranking or "top 10" placement — shortlisting is based on fit, not rankings alone.',
    ],
    commonMistakes: [
      'Insisting only on "top 10" universities when your profile fits mid-tier better.',
      'Ignoring safety options — a balanced list always has at least 2 safety universities.',
      'Selecting by city reputation instead of course quality.',
    ],
    faq: [
      {
        q: 'Can I add my own preferred university to the shortlist?',
        a: 'Yes. Bring your preferences and your counselor will add them — they will then assess each one as realistic, ambitious, or safety for your profile.',
      },
      {
        q: 'How many universities should I apply to?',
        a: 'Typically 4–6 — a balanced mix of ambitious, realistic, and safety options. More than 6 rarely improves outcomes and adds cost.',
      },
    ],
    relatedSlugs: ['personalized-counseling', 'course-matching', 'scholarship-guidance'],
  },
  {
    slug: 'course-matching',
    title: 'Course Matching',
    shortDescription: 'Find the right course for your career goal — by field, level, duration, and tuition.',
    icon: BookOpen,
    color: '#0057B8',
    whatItIs:
      'Course matching narrows the university shortlist to specific courses that fit your career goal and budget. We use the ALO admissions database — real course names, durations, tuition fees, and entry requirements — so the comparison is grounded in current data, not guesses.',
    whyNeeded: [
      'Course names vary widely between universities; "MSc Data Science" at one university is not the same as "MSc Data Science" at another.',
      'Some courses have hidden prerequisites (e.g. a quantitative background) that exclude applicants.',
      'Tuition, duration, and scholarship eligibility differ per course, not just per university.',
      'Course choice affects post-study work visa eligibility in most destinations.',
    ],
    whoItsFor: [
      'Students who know their destination but not the exact course.',
      'Students choosing between similar-sounding courses at different universities.',
      'Students with a specific career goal (e.g. Data Analyst, Civil Engineer) who need to know which course leads there.',
    ],
    whatAloDoes: [
      'Pull the full course catalogue for each shortlisted university.',
      'Filter by field, level, duration, and tuition.',
      'Cross-check entry requirements (academic + English) against your profile.',
      'Flag courses that match your career goal and budget.',
      'Present a comparison table with 3–5 courses to choose from.',
    ],
    process: [
      'Confirm career goal and preferred level (UG / PG / PhD).',
      'Counselor pulls the course catalogue and filters (1–2 working days).',
      'Review the comparison table and pick 2–3 courses per university.',
      'Proceed to Application Assistance for those courses.',
    ],
    requiredInfo: [
      'Completed University Selection shortlist.',
      'Career goal (job role or industry).',
      'Preferred level (UG / PG / PhD / Foundation).',
      'Tuition ceiling per year.',
    ],
    documentsNeeded: [
      'Same as University Selection — transcripts, English score (if any).',
    ],
    timeline: '1–2 working days for the comparison; review session is 30 minutes.',
    studentsReceive: [
      'A comparison table of 3–5 matching courses per university.',
      'Per-course entry requirements and English requirements.',
      'Tuition, duration, and scholarship availability per course.',
      'Career-path notes per course.',
    ],
    notGuaranteed: [
      'A guaranteed offer for any specific course — admission is the university\'s decision.',
      'A guaranteed job after graduation — that depends on the destination\'s job market and your own performance.',
    ],
    commonMistakes: [
      'Choosing by course title alone without reading the syllabus.',
      'Ignoring hidden prerequisites (e.g. a quantitative background for some business analytics courses).',
      'Overlooking foundation or pathway options when direct entry is not realistic.',
    ],
    faq: [
      {
        q: 'Can I change my mind after course matching?',
        a: 'Yes — you can revise the course list at any time before applications are submitted. After submission, changes depend on the university\'s policy.',
      },
      {
        q: 'Do you have the latest syllabus for each course?',
        a: 'We share what is in our admissions database. For the most current syllabus, your counselor will direct you to the official university course page.',
      },
    ],
    relatedSlugs: ['university-selection', 'application-assistance', 'career-counseling'],
  },
  {
    slug: 'application-assistance',
    title: 'Application Assistance',
    shortDescription: 'End-to-end support filling out applications, attaching documents, and tracking submissions.',
    icon: FileText,
    color: '#0057B8',
    whatItIs:
      'We prepare, review, and submit each university application on your behalf. This includes completing application forms, organizing documents in the format each university requires, paying any application fee, and tracking submission status to offer letter.',
    whyNeeded: [
      'Each university has its own application portal, deadlines, and document naming conventions.',
      'Small errors (wrong file format, missing translations, expired passport) cause delays or rejections.',
      'Following up with universities is time-sensitive; missing a follow-up can cost you the seat.',
      'A single counselor relationship across multiple applications keeps everything consistent.',
    ],
    whoItsFor: [
      'Any student who has completed Course Matching and has a confirmed apply list.',
      'Students applying to multiple universities and struggling to track everything.',
      'Students who want professional review of their SOP and CV before submission.',
    ],
    whatAloDoes: [
      'Set up each university application portal account on your behalf.',
      'Complete application forms accurately.',
      'Compile, format, and upload documents per each university\'s requirements.',
      'Pay application fee on your behalf (the fee itself is your cost; we handle the transaction).',
      'Track submission → acknowledgment → offer letter.',
      'Coordinate with the university\'s admissions team on any clarification requests.',
    ],
    process: [
      'Confirm the apply list (4–6 universities × 2–3 courses each).',
      'Collect documents (see Document Checking service).',
      'Counselor prepares applications and shares drafts for your review.',
      'You approve → we submit → we track.',
      'On offer letter, we coordinate conditional vs. unconditional status.',
    ],
    requiredInfo: [
      'Confirmed apply list (universities + courses).',
      'All academic transcripts (scanned).',
      'Passport (scanned, valid ≥ 6 months).',
      'English test score report (or planned test date).',
      'SOP / Personal Statement (see SOP & CV Support service).',
      'CV (see SOP & CV Support service).',
      'Letters of recommendation, if required.',
      'Application fee payment (we will share the amount per university).',
    ],
    documentsNeeded: [
      'Academic transcripts (10th, 12th, and any degree).',
      'Passport copy.',
      'English test score report.',
      'SOP / Personal Statement (reviewed).',
      'CV / résumé.',
      'Letters of recommendation (if required by the university).',
      'Portfolio (for design / architecture / arts courses).',
    ],
    timeline: '5–10 working days to prepare; submission windows depend on each university\'s deadlines.',
    studentsReceive: [
      'Accurately completed application forms per university.',
      'Document upload in the correct format per university.',
      'A single status dashboard across all applications.',
      'Conditional vs. unconditional offer coordination.',
    ],
    notGuaranteed: [
      'An offer from any specific university — admission is the university\'s decision.',
      'A specific scholarship — scholarships depend on the university and applicant pool.',
      'A specific intake — if deadlines pass, your counselor will discuss next intake options.',
    ],
    commonMistakes: [
      'Submitting applications without document-checking — small format errors cause rejections.',
      'Using the same SOP for every university without tailoring it.',
      'Missing follow-up emails from the university because the student did not check email regularly.',
    ],
    faq: [
      {
        q: 'Do you charge for application assistance?',
        a: 'For our partner universities, application assistance is free. You only pay the official university application fee where applicable.',
      },
      {
        q: 'Can I apply to non-partner universities through ALO?',
        a: 'Yes, where the university accepts agent-submitted applications. Your counselor will confirm case by case.',
      },
    ],
    relatedSlugs: ['document-checking', 'sop-cv-support', 'university-selection'],
  },
  {
    slug: 'sop-cv-support',
    title: 'SOP & CV Support',
    shortDescription: 'Statement of Purpose and CV review, with structured feedback and AI-assisted drafting for your voice.',
    icon: FileText,
    color: '#0057B8',
    whatItIs:
      'A structured review of your Statement of Purpose (SOP) and CV / résumé for university applications. We provide line-level feedback on clarity, structure, and fit; we can also use ALO\'s AI-assisted drafting tooling to produce a first draft in your voice, which you then edit and approve.',
    whyNeeded: [
      'The SOP is often the deciding factor when academic scores are similar.',
      'Most SOPs fail because they read as generic — admission officers want a clear motivation and a specific reason this course at this university.',
      'CVs for international applications follow a different format than local CVs — formatting and length matter.',
      'AI tools produce mediocre first drafts without human review; ALO combines AI speed with human editing.',
    ],
    whoItsFor: [
      'Any applicant who needs an SOP for a university application.',
      'Students who have written an SOP and want professional review.',
      'Students who have not started and want a structured approach.',
      'Applicants who need a CV formatted for international university admissions.',
    ],
    whatAloDoes: [
      'Provide a structured SOP worksheet (motivation, fit, career goal).',
      'Offer AI-assisted first-draft generation (you provide the inputs, the tool drafts).',
      'Line-level human review by an ALO counselor (clarity, structure, tone).',
      'CV formatting to international standards (1–2 pages, reverse-chronological).',
      'Final proof-read before submission.',
    ],
    process: [
      'Complete the SOP worksheet (1 hour).',
      'Counselor runs AI-assisted draft (same day).',
      'You edit the draft in your own voice (1–2 days).',
      'Counselor does line-level review (1 working day).',
      'Finalize and submit per university (tailor the last paragraph per university).',
    ],
    requiredInfo: [
      'Confirmed apply list (universities + courses).',
      'Academic background summary.',
      'Career goal.',
      'Specific reasons for choosing each course and university (the worksheet helps you extract these).',
    ],
    documentsNeeded: [
      'Academic transcripts.',
      'CV / résumé (current or rough).',
      'Any past projects, internships, or work experience notes.',
    ],
    timeline: 'First draft in 1 working day; 2–3 review rounds before submission (typically 4–5 working days total).',
    studentsReceive: [
      'A structured SOP worksheet.',
      'AI-assisted first draft in your voice.',
      'Line-level human review and edit suggestions.',
      'A formatted international-standard CV.',
      'Final proof-read SOP and CV ready for submission.',
    ],
    notGuaranteed: [
      'A guaranteed admission offer — the SOP is one factor; admission depends on the full profile.',
      'A specific scholarship — SOP quality affects scholarship chances but does not guarantee one.',
    ],
    commonMistakes: [
      'Submitting a generic SOP — admission officers read thousands of these and spot generic ones instantly.',
      'Copying an SOP from a friend or the internet — universities use plagiarism detection.',
      'Listing achievements without explaining motivation — the "why" matters more than the "what".',
    ],
    faq: [
      {
        q: 'Will the SOP be in my own voice?',
        a: 'Yes. The AI-assisted draft uses your worksheet inputs to write in your voice. You then edit it so the final version is unmistakably yours.',
      },
      {
        q: 'How long should an SOP be?',
        a: 'Typically 500–1000 words, depending on the university\'s specification. Some universities cap at 1 page; some allow 2 pages. We follow each university\'s instructions.',
      },
      {
        q: 'Can you write the SOP for me entirely?',
        a: 'No — and you should be wary of any agency that offers to. Universities want your authentic voice; a counselor-written SOP reads as such and is increasingly detectable. We assist, review, and edit — you write the final version.',
      },
    ],
    relatedSlugs: ['application-assistance', 'document-checking', 'personalized-counseling'],
  },
  {
    slug: 'document-checking',
    title: 'Document Checking',
    shortDescription: 'A structured review of every document before submission — format, validity, translation, attestation.',
    icon: FileCheck2,
    color: '#0057B8',
    whatItIs:
      'A document officer at ALO reviews every document you plan to submit (academic transcripts, passport, English test scores, SOP, CV, recommendation letters, financial documents) against each university\'s specification. The goal: catch format errors, missing translations, expired documents, and naming issues before submission.',
    whyNeeded: [
      'Universities reject applications for format errors (wrong file type, low resolution, missing attestation).',
      'Expired passports or English tests cause automatic rejections.',
      'Some universities require certified translations; others do not — getting this wrong wastes a week.',
      'Document names and labels must match what the portal expects; mismatched labels cause confusion.',
    ],
    whoItsFor: [
      'Any applicant before submission — every application benefits from a check.',
      'Students with non-English documents that may need translation or attestation.',
      'Students who have gathered documents from multiple sources (school, college, test provider).',
    ],
    whatAloDoes: [
      'Build a document checklist per university (different universities need different sets).',
      'Verify each document for: validity, format, file size, naming, attestation if required, translation if required.',
      'Flag missing or expired items with a clear to-do list.',
      'Re-check after corrections before final submission.',
    ],
    process: [
      'Receive your document set (uploaded to your ALO student portal).',
      'Document officer runs the check (1–2 working days).',
      'Receive a to-do list of fixes.',
      'Upload corrected documents; officer re-checks.',
      'Officer approves for submission; counselor submits.',
    ],
    requiredInfo: [
      'Apply list (universities + courses).',
      'Document checklist per university (we generate this for you).',
    ],
    documentsNeeded: [
      'Academic transcripts (10th, 12th, degree).',
      'Passport (valid ≥ 6 months beyond intake).',
      'English test score report.',
      'SOP and CV.',
      'Letters of recommendation.',
      'Financial / bank statement (where required for visa-stage documents).',
      'Photo (passport-size, where required).',
    ],
    timeline: '1–2 working days per check round; 2 rounds typically needed.',
    studentsReceive: [
      'A document checklist per university.',
      'A clear to-do list of fixes per round.',
      'Final approval before submission.',
      'A clean document set ready for current and future applications.',
    ],
    notGuaranteed: [
      'University acceptance — the check prevents format rejections, not academic ones.',
      'Visa approval — visa-stage documents are checked separately (see Visa Guidance).',
    ],
    commonMistakes: [
      'Submitting phone-photographed documents when scanned copies are required.',
      'Forgetting to attest / notarize when the university requires it.',
      'Using a passport with less than 6 months validity at intake date.',
    ],
    faq: [
      {
        q: 'Do I need to translate my documents into English?',
        a: 'If your documents are in a language other than English, most universities require a certified English translation. Your counselor will confirm per university.',
      },
      {
        q: 'How recent must my bank statement be?',
        a: 'For visa-stage documents, most embassies require a bank statement no older than 28 days at the date of application. Your visa officer will time this for you.',
      },
    ],
    relatedSlugs: ['application-assistance', 'sop-cv-support', 'visa-guidance'],
  },
  {
    slug: 'visa-guidance',
    title: 'Visa Guidance',
    shortDescription: 'Document preparation, checklists, refusal-risk preparation, and interview practice — no visa approval promises.',
    icon: Plane,
    color: '#0057B8',
    whatItIs:
      'Visa guidance from ALO covers document preparation, the official checklist for your destination, refusal-risk preparation, and visa interview practice (where applicable). We do not, and cannot, guarantee visa approval — visa decisions are made solely by the destination country\'s immigration authority. Our role is to prepare you as strongly and accurately as possible using publicly available official-source requirements.',
    whyNeeded: [
      'Visa applications are refused for preventable reasons: missing documents, low funds shown, unclear source of funds, weak interview answers, or evidence the applicant does not intend to return home.',
      'Each destination (UK, USA, Canada, Australia, Ireland, Schengen, Malaysia) has different rules — what worked for a friend going to the UK does not apply to your Canada application.',
      'Rules change frequently; ALO counselors track current rules but always direct you to the official source for confirmation.',
      'Refusal-risk preparation helps you address weak points before submission, not after.',
    ],
    whoItsFor: [
      'Any student with an unconditional offer (or CAS-equivalent) ready to apply for a student visa.',
      'Students who have been refused before and are reapplying.',
      'Students called for a visa credibility interview.',
      'Students unsure whether their financial evidence is sufficient.',
    ],
    whatAloDoes: [
      'Provide the official-source checklist for your destination (we link you to the government immigration website; we do not paraphrase rules in place of the official source).',
      'Review your document set against the checklist (validity, format, fund evidence, source of funds).',
      'Run a refusal-risk review — identify weak points in your application before submission.',
      'Conduct visa interview practice (mock sessions) for destinations that interview (e.g. USA).',
      'Coordinate biometrics appointment scheduling where the embassy requires it.',
      'Guide you through the visa application form step by step.',
    ],
    process: [
      'Confirm your offer / CAS-equivalent.',
      'Counselor sends the official-source checklist for your destination.',
      'You assemble documents per the checklist.',
      'Document officer runs the refusal-risk review.',
      'Fix weak points (e.g. add more fund evidence, clarify source of funds).',
      'Visa officer runs mock interview (where applicable).',
      'Counselor walks you through the application form.',
      'You submit and attend biometrics; we track outcome.',
    ],
    requiredInfo: [
      'Unconditional offer letter or CAS-equivalent.',
      'Passport (valid ≥ 6 months beyond expected travel date).',
      'Tuition deposit receipt.',
      'Bank statement with sufficient funds (varies by destination — your counselor confirms).',
      'Source-of-funds explanation (where required).',
      'Tuberculosis test certificate (where required, e.g. UK for Bangladesh).',
      'Photograph in the destination\'s specified format.',
    ],
    documentsNeeded: [
      'Passport (valid ≥ 6 months).',
      'Offer / CAS letter.',
      'Financial evidence (bank statements, sponsor letter, scholarship letter if applicable).',
      'Academic transcripts (as required).',
      'English test score report.',
      'Tuberculosis test certificate (for UK-bound applicants from listed countries).',
      'Photograph.',
      'Visa fee payment receipt (we will guide you through this).',
    ],
    timeline: 'Document preparation: 1–2 weeks. Submission to decision: depends on destination (typically 3 working weeks for UK Student Route; varies for others). Priority services may be available at extra cost — your counselor will explain official priority service options.',
    studentsReceive: [
      'The official-source checklist for your destination.',
      'Document review against the checklist.',
      'A refusal-risk review with specific fixes.',
      'Mock visa interview sessions (where applicable).',
      'Step-by-step guidance on the visa application form.',
      'Coordination of biometrics appointment.',
      'Honest feedback — if your profile has weak points, we tell you before you submit.',
    ],
    notGuaranteed: [
      'Visa approval — ALO Education does not, and cannot, guarantee any visa outcome. Visa decisions are made solely by the destination country\'s immigration authority. Any agency that guarantees a visa is being dishonest; do not trust such promises.',
      'A specific processing timeline — processing times are estimates published by the immigration authority and may change.',
      'A specific interview outcome — interview performance depends on your preparation and the interviewer\'s assessment.',
      'An appeal win — appeals depend on the destination\'s law and the specific refusal grounds.',
    ],
    commonMistakes: [
      'Submitting with insufficient funds shown — each destination has a published minimum; we use the official figure.',
      'Inconsistent source of funds (e.g. large unexplained deposit before the application).',
      'Holding a passport with less than 6 months validity.',
      'Forgetting the tuberculosis test certificate for UK applications (required from listed countries).',
      'Practicing the visa interview only once — mock interviews need multiple rounds.',
      'Trusting agencies that promise "100% visa success" — these claims are false and a red flag.',
    ],
    faq: [
      {
        q: 'Does ALO guarantee my visa will be approved?',
        a: 'No. No agency can guarantee a visa outcome. Visa decisions are made solely by the destination country\'s immigration authority. ALO prepares your application accurately and runs refusal-risk review and mock interviews to give you the strongest possible application — but the decision is the embassy\'s, not ours.',
      },
      {
        q: 'Where can I find the official visa requirements?',
        a: 'We will direct you to the official immigration website for your destination (e.g. gov.uk for the UK Student Route, travel.state.gov for US F-1, IRCC for Canada, homeaffairs.gov.au for Australia). We use these as our source of truth; we never paraphrase rules in place of the official source.',
      },
      {
        q: 'What happens if my visa is refused?',
        a: 'We review the refusal notice with you, identify the grounds, and advise on the next step (appeal, re-application with corrections, or alternative destination). We do not guarantee a reversal — appeals and re-applications depend on the destination\'s law and the specific refusal grounds.',
      },
      {
        q: 'Do you write the visa application form for me?',
        a: 'No — the form must be completed by you, the applicant, because the data is yours. We guide you field by field and review the form before submission.',
      },
    ],
    relatedSlugs: ['interview-preparation', 'pre-departure-orientation', 'document-checking'],
  },
  {
    slug: 'interview-preparation',
    title: 'Interview Preparation',
    shortDescription: 'Mock interviews for university admission and visa credibility interviews — recorded, reviewed, repeated.',
    icon: Mic,
    color: '#0057B8',
    whatItIs:
      'Mock interview sessions for university admission interviews and visa credibility interviews (where the destination\'s embassy interviews applicants). Each session is recorded (with your consent), reviewed, and repeated until your answers are clear, specific, and confident.',
    whyNeeded: [
      'Some universities (especially for medicine, business, and PhD programs) conduct admission interviews.',
      'The US F-1 visa process almost always involves an interview; other destinations may interview if the application has weak points.',
      'Nervous or unclear answers are the most common preventable reason for refusal.',
      'Practicing alone is not the same as practicing with a counselor who role-plays as the visa officer.',
    ],
    whoItsFor: [
      'Students applying to courses with admission interviews.',
      'Students applying for US F-1 visas.',
      'Students applying for any destination where the embassy may interview.',
      'Students who have been refused a visa before and need to prepare for a re-interview.',
    ],
    whatAloDoes: [
      'Conduct an initial mock interview (recorded with consent).',
      'Review the recording with you — body language, clarity, specificity, confidence.',
      'Drill weak answers (e.g. "Why this course?" / "Why this university?" / "What will you do after graduation?").',
      'Repeat the mock until your answers are crisp and specific.',
      'For visa interviews, role-play the embassy officer\'s tone and questioning style.',
    ],
    process: [
      'Book a mock interview slot (in-person or video).',
      'Attend the first mock (30 minutes).',
      'Receive recorded feedback and a list of weak answers.',
      'Practice the weak answers at home (1–2 days).',
      'Attend a second mock (30 minutes) — usually 2–3 rounds are needed.',
      'Final mock passes → ready for the real interview.',
    ],
    requiredInfo: [
      'Confirmed apply list and intake.',
      'SOP and CV (already reviewed).',
      'For visa interviews: confirmed interview date at the embassy.',
    ],
    documentsNeeded: [
      'Your SOP (for admission interview practice).',
      'Your CV.',
      'A list of your achievements, projects, and internships (for admission interviews).',
    ],
    timeline: 'Each mock is 30 minutes; typically 2–3 rounds over 5–7 days before the real interview.',
    studentsReceive: [
      'Recorded mock interview sessions.',
      'Specific feedback on weak answers.',
      'A list of high-probability questions with model answer structures (not scripts).',
      'Confidence and body language coaching.',
    ],
    notGuaranteed: [
      'A guaranteed interview outcome — the real interviewer makes the decision, not us.',
      'A specific set of questions — we prepare for high-probability questions, but real interviews can diverge.',
    ],
    commonMistakes: [
      'Memorizing scripted answers — interviewers can tell, and follow-up questions break scripts.',
      'Practicing only once — most students need 2–3 rounds.',
      'Underestimating body language — eye contact, posture, and tone matter as much as the words.',
    ],
    faq: [
      {
        q: 'Will the real interview have the same questions as the mock?',
        a: 'No — we prepare for high-probability questions, but real interviews can ask anything. The goal is to be ready to think on your feet, not to memorize scripts.',
      },
      {
        q: 'Are the mock interviews recorded?',
        a: 'Only with your explicit consent. The recording is shared with you and used only for review; it is deleted after the engagement unless you ask us to keep it.',
      },
    ],
    relatedSlugs: ['visa-guidance', 'sop-cv-support', 'english-test-preparation'],
  },
  {
    slug: 'english-test-preparation',
    title: 'English Test Preparation',
    shortDescription: 'Preparation support for IELTS, PTE, TOEFL, Duolingo, and more — materials, mock tests, and expert support.',
    icon: Languages,
    color: '#0057B8',
    whatItIs:
      'Preparation support for English-language proficiency tests (IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OIETC / ELLT, Oxford ELLT, LanguageCert, OET) and standardized tests (GRE, GMAT, SAT, ACT). Includes study materials, mock tests, score planning, and expert support — not a guaranteed score.',
    whyNeeded: [
      'Most universities and visa applications require a recent English test score.',
      'Choosing the right test (IELTS Academic vs. IELTS UKVI vs. PTE) depends on the destination and university — getting this wrong wastes the fee and the time.',
      'Test-day strategy (especially for Speaking and Writing) can move your score by 0.5–1.0 band.',
      'Standardized tests (GRE, GMAT, SAT, ACT) are required by some US universities and programs.',
    ],
    whoItsFor: [
      'Students who need an English test score for admission or visa.',
      'Students who have taken a test and want to improve their score.',
      'Students preparing for GRE / GMAT / SAT / ACT for US universities.',
      'Students who want free assessment before committing to a test.',
    ],
    whatAloDoes: [
      'Help you select the right test for your destination and university (see Language Prep page).',
      'Provide study materials (official past papers where available, structured practice sets).',
      'Run free English placement tests to estimate your starting level.',
      'Build a score plan (target band → weekly study hours → test date).',
      'Conduct mock speaking sessions and review mock writing samples.',
      'Connect you with certified trainers for group or one-to-one coaching (where available).',
    ],
    process: [
      'Take the free English placement test.',
      'Receive a starting-level estimate and target-band recommendation.',
      'Confirm test choice (e.g. IELTS Academic vs. UKVI vs. PTE).',
      'Receive study materials and a weekly study plan.',
      'Attend mock sessions and submit writing samples for review.',
      'Register for the test (we guide you through registration; the test fee is your cost).',
    ],
    requiredInfo: [
      'Target destination(s) and university shortlist.',
      'English test status (taken / planned / not started).',
      'Available study hours per week.',
      'Target test date (if known).',
    ],
    documentsNeeded: [
      'No documents required for preparation support.',
    ],
    timeline: 'Preparation support typically runs 4–12 weeks depending on your starting level and target band.',
    studentsReceive: [
      'Test-selection guidance (which test to take for which destination).',
      'A free English placement test and starting-level estimate.',
      'A score plan (target band → study hours → test date).',
      'Study materials (practice sets, official past papers where available).',
      'Mock speaking sessions and writing sample reviews.',
      'Coordination with certified trainers for group / one-to-one coaching (where available).',
    ],
    notGuaranteed: [
      'A guaranteed score — test performance depends on your preparation, language level, and test-day conditions. ALO does not guarantee any specific band or score.',
      'A specific test date — test dates depend on the test provider\'s availability and your registration timing.',
    ],
    commonMistakes: [
      'Choosing IELTS UKVI when IELTS Academic is accepted (UKVI is more expensive and only needed for some foundation / pre-sessional courses).',
      'Skipping the Speaking mock — most Bangladeshi students lose marks on fluency, not vocabulary.',
      'Memorizing writing templates — examiners penalize memorized responses.',
    ],
    faq: [
      {
        q: 'Do you guarantee a specific IELTS band?',
        a: 'No. ALO does not guarantee any specific band or score. We provide preparation support, study materials, and mock sessions — your final score depends on your preparation and test-day performance.',
      },
      {
        q: 'Should I take IELTS Academic or IELTS UKVI?',
        a: 'If you are applying to a UK degree course directly and your university accepts IELTS Academic, take Academic. IELTS UKVI is only needed for some foundation, pre-sessional, or pathway programs. Your counselor confirms per university.',
      },
      {
        q: 'Can I take Duolingo instead of IELTS?',
        a: 'Many universities accept Duolingo English Test for admission, but most embassies do NOT accept Duolingo for visa decisions. Your counselor confirms whether Duolingo is sufficient for both admission and visa for your specific destination.',
      },
    ],
    relatedSlugs: ['interview-preparation', 'scholarship-guidance', 'personalized-counseling'],
  },
  {
    slug: 'financial-planning',
    title: 'Financial Planning',
    shortDescription: 'A clear view of total cost (tuition + living + visa + travel) and how to fund it — family, loans, scholarships.',
    icon: Wallet,
    color: '#0057B8',
    whatItIs:
      'A structured financial planning session that maps the total cost of studying abroad for your chosen destination and course (tuition, living, visa, travel, health insurance, test fees) and outlines how to fund it — family contribution, education loans, scholarships, and part-time work eligibility.',
    whyNeeded: [
      'Most students under-budget — they plan for tuition only and forget visa fees, travel, deposit, and 6 months of living expenses (often required for visa).',
      'Embassies require proof of funds; if your evidence does not match the published minimum, your visa can be refused.',
      'Education loans have different processes and timelines in Bangladesh; planning early is essential.',
      'Scholarship deadlines often precede admission deadlines — financial planning must start early.',
    ],
    whoItsFor: [
      'Students early in the process who need a budget before choosing a destination.',
      'Students preparing visa-stage financial evidence.',
      'Parents planning how to fund their child\'s education abroad.',
      'Students considering an education loan.',
    ],
    whatAloDoes: [
      'Build a cost breakdown per destination (tuition, living, visa, travel, insurance, test fees).',
      'Estimate the embassy-required minimum fund evidence for your destination.',
      'Outline funding options: family contribution, education loans, scholarships, part-time work.',
      'Coordinate with partner banks for education loan processing (where available).',
      'Flag timing: when each payment is due (deposit, tuition installments, visa fee, travel).',
    ],
    process: [
      'Confirm destination and course.',
      'Counselor builds the cost breakdown (1–2 working days).',
      'Review session: walk through cost and funding options.',
      'Decide funding mix (family + loan + scholarship).',
      'Plan timeline for payments and loan processing.',
    ],
    requiredInfo: [
      'Destination and course.',
      'Family contribution available.',
      'Existing financial commitments (other loans, siblings\' education).',
      'Scholarship status (applied / not / received).',
    ],
    documentsNeeded: [
      'Bank statements (last 6 months) — for fund-source assessment.',
      'Sponsor details (parent / guardian / self).',
      'Income proof (sponsor\'s salary / business income).',
    ],
    timeline: 'Cost breakdown in 1–2 working days; loan processing (if applicable) typically takes 1–3 weeks.',
    studentsReceive: [
      'A written cost breakdown per destination.',
      'Funding options outlined with pros and cons.',
      'Bank loan coordination (where partner banks are available).',
      'A payment timeline mapped to your intake.',
    ],
    notGuaranteed: [
      'A guaranteed loan approval — loan decisions depend on the bank, your sponsor\'s income, and credit history.',
      'A guaranteed scholarship — see Scholarship Guidance for what we can and cannot guarantee.',
    ],
    commonMistakes: [
      'Showing funds only at the last minute — embassies look for steady fund history, not last-minute deposits.',
      'Underestimating living costs — London / Sydney / Toronto are expensive; budget the embassy minimum, not the bare minimum.',
      'Forgetting health insurance — most destinations require it; it adds to the cost.',
    ],
    faq: [
      {
        q: 'How much money do I need to show for the visa?',
        a: 'Each destination publishes its own minimum. For the UK Student Route, it is currently tuition for the first year plus £1,334 per month for living (London) or £1,023 (outside London), for up to 9 months. We use the official gov.uk figure at the time of your application — your counselor confirms the current number.',
      },
      {
        q: 'Can ALO arrange an education loan?',
        a: 'We coordinate with partner banks that offer education loans to Bangladeshi students. Loan approval is the bank\'s decision, based on your sponsor\'s income and credit history — we cannot guarantee approval.',
      },
    ],
    relatedSlugs: ['scholarship-guidance', 'personalized-counseling', 'visa-guidance'],
  },
  {
    slug: 'scholarship-guidance',
    title: 'Scholarship Guidance',
    shortDescription: 'Find, match, and apply for university, government, and external scholarships.',
    icon: Award,
    color: '#0057B8',
    whatItIs:
      'Scholarship guidance covers: identifying scholarships you are eligible for, matching you to them based on profile and course, reviewing your scholarship application (essay, recommendation letters, evidence), and tracking deadlines.',
    whyNeeded: [
      'Scholarships are scattered across university websites, government portals, and external foundations — students miss deadlines simply because they did not know.',
      'Each scholarship has its own eligibility (academic merit, country, course, financial need, gender, leadership) — applying blindly is wasted effort.',
      'Scholarship essays differ from SOPs — they ask "why you, why this scholarship" rather than "why this course".',
      'Some scholarships require interview preparation; we coordinate with our Interview Preparation service.',
    ],
    whoItsFor: [
      'Students looking for funding to reduce tuition or living cost.',
      'Students with strong academic records applying for merit-based scholarships.',
      'Students from low-income backgrounds applying for need-based scholarships.',
      'Students with leadership / community experience applying for leadership scholarships.',
    ],
    whatAloDoes: [
      'Match your profile to university, government, and external scholarships in our database.',
      'Provide a written shortlist with eligibility, amount, deadline, and required documents.',
      'Review scholarship essays (different from SOPs).',
      'Coordinate recommendation letters for scholarship applications.',
      'Track deadlines and remind you of upcoming dates.',
    ],
    process: [
      'Receive profile (transcripts, English score, apply list, financial need).',
      'Counselor runs the scholarship match (2–3 working days).',
      'Review session: walk through the shortlist.',
      'Pick 3–5 scholarships to apply for.',
      'Counselor reviews your scholarship essays.',
      'Submit; counselor tracks deadlines and outcomes.',
    ],
    requiredInfo: [
      'Academic transcripts.',
      'English test score (if available).',
      'Apply list (universities + courses).',
      'Financial need statement (for need-based scholarships).',
      'Leadership / community experience (for leadership scholarships).',
    ],
    documentsNeeded: [
      'Academic transcripts.',
      'English test score.',
      'CV / résumé.',
      'Letters of recommendation.',
      'Financial documents (for need-based scholarships).',
    ],
    timeline: 'Match in 2–3 working days; essay review 1–2 working days per round.',
    studentsReceive: [
      'A scholarship shortlist with eligibility, amount, and deadline.',
      'Scholarship essay review.',
      'Recommendation letter coordination.',
      'Deadline tracking and reminders.',
    ],
    notGuaranteed: [
      'A guaranteed scholarship — scholarships are competitive and decided by the scholarship provider, not ALO.',
      'A specific amount — scholarship amounts vary by provider and year.',
      'A specific outcome — applying does not guarantee selection.',
    ],
    commonMistakes: [
      'Applying only to university scholarships — many government and external options exist with fewer applicants.',
      'Writing the same essay for every scholarship — each scholarship has its own motivation question.',
      'Missing deadlines — late applications are almost never accepted.',
    ],
    faq: [
      {
        q: 'Can ALO guarantee I get a scholarship?',
        a: 'No. Scholarships are competitive and decided by the scholarship provider (university, government, or foundation). ALO helps you find, match, and apply — but the decision is the provider\'s, not ours.',
      },
      {
        q: 'Are full scholarships available for Bangladeshi students?',
        a: 'A small number of full scholarships exist (e.g. Chevening, Commonwealth). They are highly competitive. Most students receive partial scholarships — these still significantly reduce the cost.',
      },
    ],
    relatedSlugs: ['financial-planning', 'application-assistance', 'sop-cv-support'],
  },
  {
    slug: 'pre-departure-orientation',
    title: 'Pre-Departure Orientation',
    shortDescription: 'A structured briefing on culture, banking, SIM, packing, and what to do in your first week.',
    icon: PackageCheck,
    color: '#0057B8',
    whatItIs:
      'A pre-departure orientation session that prepares you for life in your destination before you fly. Covers: culture and etiquette, banking and money transfer, SIM card and phone setup, accommodation confirmation, health insurance, packing list, airport pickup, and what to do in your first week.',
    whyNeeded: [
      'Most refused-entry cases at the border come from unprepared students (no accommodation proof, no university contact, no clear answers to border officer questions).',
      'Banking setup takes 1–2 weeks; planning before departure avoids being cash-only for weeks.',
      'Cultural differences (punctuality, communication style, food, weather) surprise students who have not prepared.',
      'Packing right (vs. over-packing) saves money on excess baggage and avoids bringing prohibited items.',
    ],
    whoItsFor: [
      'Students with a visa approved and a confirmed travel date.',
      'Students travelling abroad for the first time.',
      'Students whose families want a structured briefing before they fly.',
    ],
    whatAloDoes: [
      'Run a 60–90 minute orientation session (in-person or video).',
      'Cover culture, etiquette, and common scenarios.',
      'Walk through banking setup (which banks accept international students, what documents to bring).',
      'Provide a SIM card setup plan (which provider, where to buy, eSIM options).',
      'Review accommodation confirmation and airport pickup arrangement.',
      'Share a destination-specific packing list.',
      'Walk through the first-week to-do list (university enrollment, police registration where required, bank appointment, GP / health registration).',
    ],
    process: [
      'Confirm visa approval and travel date.',
      'Book an orientation session (in-person or video).',
      'Attend the 60–90 minute session.',
      'Receive the destination-specific checklist and packing list.',
      'Coordinate airport pickup (where the university or our partner offers it).',
      'Fly on the confirmed date.',
    ],
    requiredInfo: [
      'Visa approval notice.',
      'Travel date.',
      'Accommodation confirmation.',
      'University contact (admissions office email / phone).',
    ],
    documentsNeeded: [
      'Passport (with visa vignette where applicable).',
      'University offer / CAS letter.',
      'Accommodation confirmation.',
      'Travel insurance.',
    ],
    timeline: '1 session (60–90 minutes), typically 1–2 weeks before travel.',
    studentsReceive: [
      'A destination-specific orientation briefing.',
      'A packing list.',
      'A first-week to-do list.',
      'Banking and SIM setup plan.',
      'Airport pickup coordination (where available).',
    ],
    notGuaranteed: [
      'Airport pickup — depends on the university or partner availability.',
      'Bank account approval — depends on the bank\'s process and your documents.',
      'GP registration — depends on the local health system\'s process.',
    ],
    commonMistakes: [
      'Over-packing — most things are available locally; carry documents, medication, and a few comfort items only.',
      'Bringing prohibited items (e.g. certain food items, large cash amounts without declaration).',
      'Arriving without printed copies of key documents (offer, CAS, accommodation, visa).',
    ],
    faq: [
      {
        q: 'Should I carry cash or a card?',
        a: 'Carry a small amount of local currency for the first 48 hours and a debit / credit card for the rest. Avoid carrying large amounts of cash. Your counselor explains the official cash declaration limit for your destination.',
      },
      {
        q: 'What is the maximum baggage allowance?',
        a: 'It depends on the airline. Your counselor will tell you to confirm directly with your airline and not to rely on hearsay.',
      },
    ],
    relatedSlugs: ['post-arrival-support', 'visa-guidance', 'financial-planning'],
  },
  {
    slug: 'post-arrival-support',
    title: 'Post-Arrival Support',
    shortDescription: 'Help in your first 30 days — university enrollment, bank account, SIM, GP, and emergency contacts.',
    icon: LifeBuoy,
    color: '#0057B8',
    whatItIs:
      'Post-arrival support covers the first 30 days after you land. ALO coordinates with the university\'s international office and our local partners (where available) to help you complete: university enrollment, bank account opening, SIM card activation, GP / health registration, police registration (where required), and connecting with student communities.',
    whyNeeded: [
      'The first 30 days are when most "I want to go home" feelings happen — having a known support contact helps students settle.',
      'University enrollment deadlines are strict; missing them can defer your admission.',
      'Bank account opening in the UK / Canada / Australia takes 2–3 weeks; starting early is essential.',
      'Police registration (where required) and GP registration have specific timelines.',
    ],
    whoItsFor: [
      'Any student who has just arrived in their destination.',
      'Students travelling alone for the first time.',
      'Students whose families want a known contact in case of emergency.',
    ],
    whatAloDoes: [
      'Connect you with the university\'s international office on arrival.',
      'Coordinate with our local partners (where available) for bank account, SIM, GP setup.',
      'Provide an emergency contact number for the first 30 days.',
      'Run a 7-day, 14-day, and 30-day check-in call.',
      'Help troubleshoot common first-week issues (lost luggage, late enrollment, missing documents).',
    ],
    process: [
      'Land at the destination.',
      'Attend first-week university enrollment.',
      'Open bank account (typically week 1–2).',
      'Activate SIM card.',
      'Register with GP / health service.',
      'Register with police (where required).',
      '7-day, 14-day, 30-day check-in calls with ALO.',
    ],
    requiredInfo: [
      'Arrival date and flight number.',
      'Accommodation address.',
      'University international office contact.',
      'Emergency contact in Bangladesh (parent / guardian).',
    ],
    documentsNeeded: [
      'Passport (with visa vignette).',
      'University offer / CAS letter.',
      'Accommodation confirmation.',
      'Passport-size photographs (multiple).',
    ],
    timeline: '30 days of structured support after arrival.',
    studentsReceive: [
      'A known emergency contact for 30 days.',
      'Coordination with the university international office.',
      'Coordination with local partners (where available) for bank, SIM, GP setup.',
      'Three check-in calls (7-day, 14-day, 30-day).',
    ],
    notGuaranteed: [
      'A guaranteed bank account — depends on the bank\'s process and your documents.',
      'A guaranteed GP registration — depends on the local health system\'s process.',
      'Local partner availability — depends on the destination; not all destinations have a local ALO partner.',
    ],
    commonMistakes: [
      'Delaying bank account opening — most banks require a university enrollment letter; get that first.',
      'Skipping the GP registration — you only need it when you fall ill, and at that point it is too late to register.',
      'Not replying to the ALO check-in calls — we cannot help if we do not hear from you.',
    ],
    faq: [
      {
        q: 'Is post-arrival support available in every country?',
        a: 'We coordinate with the university\'s international office in all destinations. We have local partners in some destinations; in others, support is remote (phone / video). Your counselor confirms what is available for your destination.',
      },
      {
        q: 'What should I do in an emergency?',
        a: 'In a life-threatening emergency, call the local emergency number (e.g. 999 in the UK, 911 in the US). For ALO-related support, call the post-arrival number we share with you before departure.',
      },
    ],
    relatedSlugs: ['pre-departure-orientation', 'visa-guidance', 'career-counseling'],
  },
  {
    slug: 'career-counseling',
    title: 'Career Counseling',
    shortDescription: 'Map your course to a career goal, with post-study work visa rules and job-search pointers.',
    icon: Briefcase,
    color: '#0057B8',
    whatItIs:
      'Career counseling maps your chosen course to realistic career outcomes, post-study work visa eligibility, and job-search pointers. It does not guarantee a job — but it ensures you choose a course that genuinely leads somewhere you want to go.',
    whyNeeded: [
      'Many students choose a course because of reputation, then discover post-graduation that the destination does not offer a post-study work visa for that field.',
      'Job markets differ — what works in Dhaka may not work in London, Sydney, or Toronto.',
      'Some courses require professional accreditation (medicine, law, accounting) that may not transfer to your home country.',
      'Career goals shift as students learn more; counseling early prevents wasted applications.',
    ],
    whoItsFor: [
      'Students early in their journey who want to align course with career.',
      'Students who plan to stay and work in their destination after graduation.',
      'Students who plan to return home and want their degree to be recognized.',
      'Students considering multiple courses and unsure which leads where.',
    ],
    whatAloDoes: [
      'Map your course to typical career outcomes in your destination and at home.',
      'Explain post-study work visa rules for your destination (using official-source info).',
      'Highlight professional accreditation requirements where relevant.',
      'Provide job-search pointers (which job boards, which networking events, which LinkedIn profile tips).',
      'Coordinate with our alumni network where available for mentorship.',
    ],
    process: [
      'Receive your chosen course and destination.',
      'Counselor runs the career-mapping exercise (1–2 working days).',
      'Review session: walk through career outcomes, visa rules, and accreditation.',
      'Adjust course choice if needed (return to Course Matching if career outcomes are unappealing).',
    ],
    requiredInfo: [
      'Chosen course and destination.',
      'Long-term goal (work abroad / return home / start business).',
      'Industry of interest.',
    ],
    documentsNeeded: [
      'No documents required for career counseling.',
    ],
    timeline: '1–2 working days for the mapping; review session is 30 minutes.',
    studentsReceive: [
      'A career-outcome map per course.',
      'Post-study work visa rule summary (with links to the official source).',
      'Accreditation flag (if the course has accreditation requirements).',
      'Job-search pointers (boards, events, LinkedIn tips).',
    ],
    notGuaranteed: [
      'A guaranteed job after graduation — job outcomes depend on you, the destination\'s job market, and the economy.',
      'Post-study work visa approval — visa decisions are made by the destination\'s immigration authority.',
      'Accreditation transfer — depends on your home country\'s professional body.',
    ],
    commonMistakes: [
      'Choosing a course without researching post-study work visa rules.',
      'Assuming a foreign degree automatically qualifies you to practice a regulated profession at home.',
      'Relying on "everyone says" — job markets change quickly; use current official data.',
    ],
    faq: [
      {
        q: 'Will I get a job after graduation?',
        a: 'ALO does not guarantee job outcomes. Job outcomes depend on your academic performance, networking, and the destination\'s job market and economy. We help you choose a course with strong career outcomes and explain the post-study work visa rules.',
      },
      {
        q: 'Can I stay and work after graduation?',
        a: 'Most destinations offer a post-study work visa (e.g. UK Graduate Route, US OPT, Canada PGWP, Australia 485). Eligibility and duration vary by destination and course. Your counselor confirms using the official immigration source.',
      },
    ],
    relatedSlugs: ['course-matching', 'personalized-counseling', 'post-arrival-support'],
  },
]

export function getServiceBySlug(slug: string): ServiceDetail | undefined {
  return SERVICES.find((s) => s.slug === slug)
}

export function getRelatedServices(slugs: string[]): ServiceDetail[] {
  return slugs
    .map((slug) => SERVICES.find((s) => s.slug === slug))
    .filter((s): s is ServiceDetail => Boolean(s))
}
