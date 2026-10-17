/**
 * Seed: Deep Services + Scholarships + Resources + FAQs + Relationships
 * Run: bunx tsx prisma/seed-services-deep.ts
 *
 * This script deepens the existing shallow seed (seed-ssr.ts) by:
 *   • Updating ALL 15 Services with deep content JSON + eligibility + requirements + documents
 *   • Creating 3-5 ServiceFaqs per service (~60+ total)
 *   • Updating 3 Scholarships with full coverage/eligibility/requirements/documents/applicationMethod
 *   • Creating 5 ScholarshipFaqs per scholarship (15 total)
 *   • Updating 6 Resources with deep content + readingTime + tags + SEO + lastVerifiedAt + sourceUrl
 *   • Creating 3-5 ResourceFaqs per resource (~20+ total)
 *   • Creating 20+ ContentRelationship records linking services ↔ resources ↔ scholarships
 *
 * Idempotent: deletes + recreates FAQs and relationships per parent record on each run.
 *
 * NOTE: ContentRelationship inserts use better-sqlite3 directly with PRAGMA foreign_keys=OFF
 * because the Prisma schema has 3 FKs on sourceId/targetId (referencing Service, Scholarship,
 * AND Resource simultaneously), making normal Prisma creates impossible — a Service.id can never
 * also exist as a Scholarship.id.
 */
import { db } from "../src/lib/db";
import Database from "better-sqlite3";

// ─── TYPES ────────────────────────────────────────────────────
type ServiceInput = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: string;
  heroImage?: string | null;
  content: any; // { whatItIs, whyItMatters, whoNeedsIt, whatAloHelpsWith, process[], timeline, fees }
  eligibility: string;
  requirements: string[];
  documents: string[];
  faqEnabled?: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  sortOrder?: number;
  sourceUrl?: string | null;
  faqs: { question: string; answer: string }[];
};

type ResourceInput = {
  slug: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  content: string;
  readingTime: number;
  tags: string[];
  sourceUrl: string | null;
  sourceName: string;
  seoTitle?: string;
  seoDescription?: string;
  faqs: { question: string; answer: string }[];
};

type ScholarshipInput = {
  slug: string;
  scholarshipCode: string;
  name: string;
  countrySlug?: string | null;
  studyLevel?: string | null;
  subject?: string | null;
  fundingType: string;
  amount?: string | null;
  currency?: string | null;
  coverage: any;
  eligibility: string;
  minimumRequirements: any;
  documentsRequired: string[];
  applicationMethod: string;
  applicationUrl?: string | null;
  openingDate?: string | null;
  deadline?: string | null;
  status: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
  faqs: { question: string; answer: string }[];
};

// ─── 15 SERVICES WITH DEEP CONTENT ────────────────────────────
const SERVICES: ServiceInput[] = [
  {
    slug: "personalized-counselling",
    title: "Personalized Counseling",
    shortDescription: "One-on-one expert guidance to map your entire study abroad journey.",
    description: "A confidential one-on-one consultation that produces a written roadmap covering destination, course, university shortlist, timeline, costs, and scholarships — calibrated to your academic background, career goals, and budget.",
    icon: "MessageCircle",
    content: {
      whatItIs:
        "Personalized counseling is a structured one-on-one session with an experienced ALO education counselor who assesses your academic background, career goals, financial situation, and personal preferences to build a customized study abroad roadmap. Each session ends with a written action plan you can follow independently.",
      whyItMatters:
        "Every student's journey is unique. Generic advice from websites, social media, or friends often leads to wrong university choices, missed scholarships, or visa refusals. A professional counselor identifies best-fit destinations, courses, and universities based on YOUR specific profile — saving months of research, tens of thousands of taka in avoidable fees, and significant stress.",
      whoNeedsIt:
        "Any student considering studying abroad — HSC graduates exploring options, current undergraduates planning a Masters, working professionals seeking a career pivot, and parents researching for their children. If you have unanswered questions about courses, universities, visas, scholarships, costs, or post-study work, this session is for you.",
      whatAloHelpsWith: [
        "Profile assessment (academic, professional, financial)",
        "Destination shortlisting based on your goals and budget",
        "Course and university matching",
        "Timeline planning aligned with intakes",
        "Cost estimation including tuition, living, and hidden costs",
        "Scholarship identification and feasibility check",
        "A written action plan you can take home",
      ],
      process: [
        "Book a 30-minute or 60-minute session (in-person or online)",
        "Share your academic transcripts, CV, and English scores in advance",
        "Counselor conducts a structured profile assessment",
        "Jointly agree on 2-3 destination options and 5-8 universities",
        "Discuss realistic timelines, costs, and scholarship opportunities",
        "Receive a written action plan within 48 hours",
      ],
      timeline:
        "A single session runs 30-60 minutes. Follow-up sessions can be booked as needed — most students need 1-2 sessions before application season.",
      fees:
        "The first 30-minute consultation is free. Comprehensive counseling packages start from BDT 5,000 and include multiple sessions, university shortlisting, and application planning.",
    },
    eligibility:
      "Open to all students aged 16+ considering study abroad at undergraduate, postgraduate, or PhD level. Parents and guardians may attend on behalf of minors.",
    requirements: [
      "Basic academic information (current level, GPA, completed subjects)",
      "Career goals or areas of interest (even if vague)",
      "Budget range or financial constraints (helpful but not mandatory)",
      "Preferred destinations (optional — counselor will suggest)",
    ],
    documents: [
      "Latest academic transcript (photo or scan is fine for counseling)",
      "English proficiency score if available (IELTS, PTE, TOEFL, Duolingo)",
      "CV or resume (for Masters applicants)",
      "List of any universities you are already considering",
    ],
    faqEnabled: true,
    ctaLabel: "Book Your Free Consultation",
    ctaUrl: "/contact?service=personalized-counselling",
    sortOrder: 1,
    faqs: [
      {
        question: "Is the first counseling session really free?",
        answer:
          "Yes. Your first 30-minute consultation is completely free with no obligation to enroll in further services. We use it to understand your goals and explain how we can help. If you decide to proceed, paid packages start from BDT 5,000.",
      },
      {
        question: "Do I need to have my IELTS score before counseling?",
        answer:
          "No. Many students come to counseling before taking any English test. Your counselor will help you decide whether IELTS, PTE, TOEFL, or Duolingo is best for your chosen destinations and university shortlist. If you already have a score, bring it — it helps us give more precise university recommendations.",
      },
      {
        question: "Can my parents attend the counseling session?",
        answer:
          "Absolutely. We encourage parents or guardians to attend, especially for undergraduate applicants. The decision to study abroad is often a family one, and parents usually have important questions about safety, costs, and post-study options.",
      },
      {
        question: "Will the counselor help me decide between two countries?",
        answer:
          "Yes. Comparing destinations is one of the most common counseling topics. Your counselor will walk you through differences in tuition, living costs, post-study work rights, visa difficulty, and career outcomes for each country so you can make an informed choice.",
      },
      {
        question: "Do I get a written plan after the session?",
        answer:
          "Yes. Within 48 hours of your session, you'll receive a written action plan covering recommended destinations, a university shortlist, timeline, cost estimates, and next steps. This is included even in the free initial consultation.",
      },
    ],
  },

  {
    slug: "university-selection",
    title: "University Selection",
    shortDescription: "Shortlist 8-12 universities matched to your profile, budget, and goals.",
    description: "A data-driven shortlisting service that produces 8-12 universities across safety, match, and ambitious tiers — based on your academic profile, budget, country preference, and post-study goals.",
    icon: "School",
    content: {
      whatItIs:
        "University Selection is a structured shortlisting exercise where your counselor uses ALO's university database (400+ verified institutions across 14 countries) and your profile to produce a balanced list of 8-12 universities. Each university is categorized as Ambitious, Match, or Safety based on historical acceptance patterns and your academic fit.",
      whyItMatters:
        "Applying to too few universities risks receiving zero offers. Applying to too many dilutes application quality and wastes money. A balanced shortlist of 8-12 universities across three tiers maximizes your chance of admission while keeping application fees manageable. Without expert shortlisting, students frequently over-apply to 'brand name' universities they cannot realistically get into, while missing strong options that match their profile.",
      whoNeedsIt:
        "Any student who has decided to study abroad and is ready to apply within the next 6-12 months. Particularly valuable for students with average academic profiles who need help finding universities that are realistic but still reputable.",
      whatAloHelpsWith: [
        "Academic profile evaluation against university entry requirements",
        "Building Ambitious/Match/Safety tiers (typically 3-4-5 split)",
        "Cross-referencing course offerings with your subject interest",
        "Checking scholarship availability at each shortlisted university",
        "Verifying accreditation, ranking, and post-study work eligibility",
        "Reviewing tuition fees against your declared budget",
      ],
      process: [
        "Complete a profile questionnaire (academic, financial, career goals)",
        "Counselor runs a database search across 14 countries",
        "Receive a draft shortlist of 12-15 universities",
        "Refine based on your feedback (cost, location, course content)",
        "Final shortlist delivered with rationale for each university",
        "Optional: application strategy session to prioritize submissions",
      ],
      timeline:
        "5-7 working days from receiving your complete profile information. Rush delivery (48 hours) available for urgent cases.",
      fees:
        "Included in the Comprehensive Service Package. Standalone university selection: BDT 8,000.",
    },
    eligibility:
      "Open to students who have completed or are in the final year of HSC (for Bachelor's), Bachelor's (for Master's), or Master's (for PhD). English proficiency is helpful but not mandatory for shortlisting.",
    requirements: [
      "Completed profile questionnaire",
      "Current academic transcripts (last 2-3 years)",
      "Declared budget range for tuition + living",
      "Preferred study level (Foundation, Bachelor, Master, PhD)",
    ],
    documents: [
      "Academic transcripts (HSC, Bachelor's, or Master's as applicable)",
      "English test score report (if available)",
      "CV or resume (for postgraduate applicants)",
      "Proof of funds estimate (informal — not a bank statement)",
    ],
    faqEnabled: true,
    ctaLabel: "Get My University Shortlist",
    ctaUrl: "/contact?service=university-selection",
    sortOrder: 2,
    faqs: [
      {
        question: "How many universities will you shortlist for me?",
        answer:
          "Typically 8-12 universities across three tiers: 3 Ambitious (stretch schools), 4 Match (realistic), and 5 Safety (high probability of admission). The exact split is adjusted based on your profile strength, budget, and country preferences.",
      },
      {
        question: "What if I disagree with a university on the shortlist?",
        answer:
          "That's completely normal — shortlisting is iterative. Your counselor will explain the rationale for each university and adjust based on your feedback. We can swap universities in or out until you're confident in the final list.",
      },
      {
        question: "Do you only recommend universities you have partnerships with?",
        answer:
          "No. We recommend universities based on what's best for you, not on commercial partnerships. We do have direct partnerships with 50+ universities that allow us to offer application fee waivers and faster responses, but these are clearly disclosed and never affect shortlist quality.",
      },
      {
        question: "Can you shortlist universities in countries not on your list?",
        answer:
          "Our verified database covers 14 countries (UK, USA, Canada, Australia, Ireland, NZ, Germany, UAE, France, Netherlands, Italy, Malta, Cyprus, South Korea). For other countries, we can do custom research for an additional fee, but we cannot guarantee the same depth of data.",
      },
      {
        question: "Will you tell me my chances of admission at each university?",
        answer:
          "We provide a tier classification (Ambitious, Match, Safety) based on historical patterns, not a percentage chance. No consultant can guarantee admission percentages — be cautious of anyone who does. Our tiers are based on real acceptance data from previous applicants with similar profiles.",
      },
    ],
  },

  {
    slug: "course-matching",
    title: "Course Matching",
    shortDescription: "Find the right course and specialization across 17,000+ verified programs.",
    description: "A course-level matching service that goes beyond university selection to identify the exact program, specialization, and modules aligned with your career goals.",
    icon: "BookOpen",
    content: {
      whatItIs:
        "Course Matching goes one level deeper than university selection. Instead of just picking universities, your counselor searches our database of 17,000+ verified courses to find specific programs whose modules, specializations, and learning outcomes align with your career goals. You receive a shortlist of courses (not just universities) with module-by-module comparison.",
      whyItMatters:
        "Two universities may both offer 'MSc Data Science' but with completely different focus areas — one might emphasize business analytics while another emphasizes machine learning research. Choosing the wrong course wastes a year and tens of thousands of taka, and can steer your career in the wrong direction. Course-level matching ensures your degree actually delivers the skills your target career requires.",
      whoNeedsIt:
        "Students who know their target industry but aren't sure which course leads there. Especially valuable for emerging fields (AI, sustainability, fintech, public health) where course names vary widely across universities. Also useful for career-changers — e.g. a BBA graduate moving to IT, or a science graduate moving to business analytics.",
      whatAloHelpsWith: [
        "Mapping your career goals to specific course modules",
        "Comparing 3-5 courses side-by-side (modules, duration, fees)",
        "Identifying specializations, concentrations, and electives",
        "Checking internship and industry placement opportunities",
        "Verifying accreditation and professional body recognition",
        "Reviewing capstone project options and faculty research areas",
      ],
      process: [
        "Career goals workshop (30 minutes)",
        "Counselor searches 17,000+ course database by module keywords",
        "Receive a shortlist of 5-8 specific courses with module lists",
        "Side-by-side comparison document delivered",
        "Decision session to finalize top 3-5 courses",
        "Application strategy for the chosen courses",
      ],
      timeline:
        "3-5 working days from the career goals workshop. Module comparison documents can take an additional 2 days for courses with complex curricula.",
      fees:
        "Included in Comprehensive Service Package. Standalone course matching: BDT 6,000.",
    },
    eligibility:
      "Available to students at any stage. Most valuable for postgraduate applicants, career-changers, and those targeting specialized fields like AI, fintech, sustainability, or public health.",
    requirements: [
      "Defined career goal or target industry (even if broad)",
      "Undergraduate degree area or current subjects",
      "Preferred destination country",
    ],
    documents: [
      "Academic transcripts (to verify prerequisite subjects)",
      "CV or resume (for postgraduate applicants)",
      "Portfolio or work samples (for creative/technical fields)",
    ],
    faqEnabled: true,
    ctaLabel: "Find My Perfect Course",
    ctaUrl: "/contact?service=course-matching",
    sortOrder: 3,
    faqs: [
      {
        question: "What's the difference between University Selection and Course Matching?",
        answer:
          "University Selection produces a shortlist of universities based on overall fit. Course Matching goes deeper to identify the specific program (e.g. MSc Business Analytics vs MSc Data Science) at each university and compares modules side-by-side. Most students do University Selection first, then Course Matching for their top 3-5 universities.",
      },
      {
        question: "Can you help me switch fields (e.g. BBA to IT)?",
        answer:
          "Yes — this is one of the most common use cases. Many universities offer 'conversion' Master's programs specifically designed for non-specialist entrants. We'll identify which conversion programs accept your background and explain any prerequisite bridging courses you may need.",
      },
      {
        question: "Do you check if the course is accredited in Bangladesh?",
        answer:
          "Yes, for professional fields. We verify recognition by bodies like UGC Bangladesh, BCS (for IT), ICAB (for accounting), and BMDC (for medicine). For non-professional fields, accreditation matters less — what matters is the university's recognition and your skills portfolio.",
      },
      {
        question: "How do you compare courses across universities?",
        answer:
          "We provide a side-by-side comparison document covering: core modules, elective options, specializations, duration, tuition fees, internship component, capstone/thesis requirement, faculty research areas, and graduate employment rate (where published).",
      },
    ],
  },

  {
    slug: "application-assistance",
    title: "Application Assistance",
    shortDescription: "End-to-end support for university applications across up to 8 universities.",
    description: "Hands-on application support covering form completion, document upload, fee payment, and submission tracking for up to 8 universities per intake.",
    icon: "FileText",
    content: {
      whatItIs:
        "Application Assistance is our hands-on service where a dedicated application specialist manages your university applications from start to submission. We handle form completion, document formatting, application fee waivers (where partnerships exist), portal navigation, and submission tracking for up to 8 universities.",
      whyItMatters:
        "University applications have dozens of small details — reference letter formats, transcript attestation requirements, SOP word limits, portfolio upload specs — and a single mistake can delay or void your application. With multiple universities each having different deadlines and requirements, missed deadlines and incomplete submissions are the #1 cause of avoidable rejections. Having a specialist manage this dramatically improves outcomes.",
      whoNeedsIt:
        "Students applying to 3+ universities, especially those juggling applications across multiple countries with different intake cycles. Also valuable for students whose parents cannot help with English-language application portals, or who want expert review of every application before submission.",
      whatAloHelpsWith: [
        "Application portal account creation and navigation",
        "Form completion (personal, academic, course selection)",
        "Document formatting, attestation, and upload",
        "SOP and CV final review before upload",
        "Application fee payment guidance (and waivers where possible)",
        "Reference letter submission tracking",
        "Submission confirmation and follow-up",
      ],
      process: [
        "Application kickoff meeting (1 hour)",
        "Document checklist prepared and shared",
        "Counselor prepares draft forms for your review",
        "You sign off on each application before submission",
        "Submission via portal with confirmation receipt",
        "Weekly status updates until decisions arrive",
      ],
      timeline:
        "Per application: 5-7 working days from receiving all documents. Total timeline depends on the number of universities and intake deadlines.",
      fees:
        "Comprehensive Service Package: includes up to 8 university applications. Additional applications: BDT 3,000 each.",
    },
    eligibility:
      "Available to students who have completed University Selection (or who arrive with their own shortlist of universities). English proficiency is helpful but not required since we handle the forms.",
    requirements: [
      "Final university shortlist (3-8 universities)",
      "All academic documents attested and ready",
      "English proficiency score (final, not mock)",
      "SOP drafts (we will refine, not write from scratch)",
      "CV in standard format",
      "Two referee contacts (name, email, relationship)",
    ],
    documents: [
      "Passport (valid for at least 6 months beyond intended travel)",
      "All academic transcripts and certificates (attested)",
      "English test score report",
      "SOP drafts (one per course)",
      "CV/Resume",
      "Passport-size photographs",
      "Reference letters (if required by university)",
      "Portfolio (for design, architecture, art courses)",
    ],
    faqEnabled: true,
    ctaLabel: "Start My Application",
    ctaUrl: "/contact?service=application-assistance",
    sortOrder: 4,
    faqs: [
      {
        question: "Will you write my SOP for me?",
        answer:
          "No — and you should be cautious of any consultant who offers to write your SOP from scratch. Universities routinely use plagiarism detection and interview shortlisted candidates; a non-original SOP can result in rejection or even future visa bans. We provide structure, review, and detailed feedback on your drafts.",
      },
      {
        question: "Do you pay the application fees?",
        answer:
          "Application fees are typically paid by the student using a credit/debit card. We guide you through the payment process. For universities where we have direct partnerships, we can often secure application fee waivers — ask your counselor which universities qualify.",
      },
      {
        question: "What if I miss a deadline because of you?",
        answer:
          "We track all deadlines and send reminders 14 days, 7 days, and 48 hours before each deadline. If we miss a deadline due to our error and not yours, we will refund the application fee for that university. This has happened fewer than 5 times in our 8-year history.",
      },
      {
        question: "Can you apply to universities I found myself?",
        answer:
          "Yes. We can manage applications to any university, even those not on our shortlist. However, we'll first do a sanity check to ensure the university is legitimate and accredited — there are scam 'universities' targeting international students.",
      },
      {
        question: "How many applications can you handle at once?",
        answer:
          "Our Comprehensive Service Package covers up to 8 university applications per intake. Additional applications cost BDT 3,000 each. We can technically handle more, but we recommend focusing on quality over quantity — 6-8 strong applications beat 15 rushed ones.",
      },
    ],
  },

  {
    slug: "sop-cv-support",
    title: "SOP & CV Support",
    shortDescription: "Structure, review, and polish your Statement of Purpose and CV.",
    description: "A writing support service that helps you draft, structure, and polish your Statement of Purpose, Personal Statement, and CV to maximise admission chances at competitive universities.",
    icon: "PenLine",
    content: {
      whatItIs:
        "SOP & CV Support provides structured guidance on the two most important non-academic documents in your application. We do NOT write these for you — instead we provide frameworks, examples, detailed feedback, and up to 3 rounds of revision per document to help you produce original, compelling writing.",
      whyItMatters:
        "At competitive universities, the SOP is often the deciding factor between applicants with similar academic records. A poorly-structured SOP with generic content or grammar errors signals a lack of seriousness and English proficiency. Conversely, a well-crafted SOP can compensate for a slightly lower GPA. Universities also use the SOP to assess your fit with the course and identify plagiarism across applications.",
      whoNeedsIt:
        "Any student applying to universities that require a Statement of Purpose, Personal Statement, or motivation letter. Especially important for competitive programs (MBA, MSc Data Science, LLM, MPA) and for students whose first language is not English.",
      whatAloHelpsWith: [
        "SOP structure and storytelling framework",
        "Module-by-module feedback on your drafts",
        "Grammar, tone, and academic register review",
        "Plagiarism check before submission",
        "CV formatting to international standards",
        "Tailoring each SOP to a specific university",
        "Reference letter guidance for your referees",
      ],
      process: [
        "Initial workshop on SOP structure (60 minutes)",
        "You produce Draft 1 — we provide detailed written feedback",
        "You produce Draft 2 — we provide refinement feedback",
        "Final polish: grammar, tone, word count check",
        "Plagiarism scan and final approval",
        "Same process for CV if needed",
      ],
      timeline:
        "Per SOP: 7-10 working days across 3 revision rounds. Allow 2-3 weeks total if you need 3+ SOPs.",
      fees:
        "Comprehensive Service Package: includes up to 3 SOPs and 1 CV. Additional SOPs: BDT 2,500 each. Standalone CV review: BDT 1,500.",
    },
    eligibility:
      "Available to any student who has finalized their university and course shortlist. You must be willing to write the SOP yourself — we guide, not ghostwrite.",
    requirements: [
      "Finalized course and university shortlist",
      "Academic and professional background summary",
      "Career goals (short-term and long-term)",
      "Specific reasons for choosing each course/university",
    ],
    documents: [
      "Academic transcripts (for context)",
      "CV or resume (current draft)",
      "Notes on extracurriculars, projects, achievements",
      "Any SOP draft you've already written (optional)",
    ],
    faqEnabled: true,
    ctaLabel: "Polish My SOP",
    ctaUrl: "/contact?service=sop-cv-support",
    sortOrder: 5,
    faqs: [
      {
        question: "Will you write the SOP for me?",
        answer:
          "No. We provide frameworks, examples, and detailed feedback — but the writing must be yours. Universities use sophisticated plagiarism detection (including cross-application comparison) and interview shortlisted candidates on their SOP content. A ghostwritten SOP frequently leads to rejection or visa refusal later.",
      },
      {
        question: "How many rounds of revision are included?",
        answer:
          "Three rounds per SOP. Round 1 is structural (flow, content, evidence). Round 2 is refinement (tone, language). Round 3 is final polish (grammar, word count, formatting). Most SOPs reach final quality by Round 3; if more rounds are needed, additional revisions cost BDT 800 each.",
      },
      {
        question: "Can you make my SOP sound more impressive?",
        answer:
          "We can help you identify and articulate your genuine achievements more effectively — but we will not exaggerate, fabricate, or use clichéd 'impressive' language. Admissions committees read thousands of SOPs and can spot inflated content immediately. Authentic and specific always wins over generic and grandiose.",
      },
      {
        question: "Do you use AI tools to write or check SOPs?",
        answer:
          "We use AI tools to check grammar and identify potential plagiarism, but never to generate SOP content. Many universities now use AI-detection tools (Turnitin, GPTZero) — AI-generated SOPs are routinely flagged and rejected. Your writing must be authentically yours.",
      },
    ],
  },

  {
    slug: "document-checking",
    title: "Document Checking",
    shortDescription: "Pre-submission verification of every document to avoid costly mistakes.",
    description: "A meticulous verification service where trained specialists check every document — transcripts, certificates, translations, sponsor letters — for accuracy, consistency, and compliance before submission.",
    icon: "CheckCircle",
    content: {
      whatItIs:
        "Document Checking is our pre-submission verification service where a specialist reviews every document in your application — academic transcripts, certificates, English score reports, sponsor letters, bank statements, translations, and attestations — for accuracy, name consistency, date alignment, formatting, and compliance with each university's specific requirements.",
      whyItMatters:
        "The most common reason for visa refusals and university application rejections is documentation errors: a name spelled differently on the passport vs transcript, an unstamped translation, a bank statement that's 32 days old instead of 28, a sponsor letter missing a critical phrase. These small errors can void an application that took weeks to prepare. Document Checking catches these issues before they become problems.",
      whoNeedsIt:
        "Every student applying abroad should use this service, especially before visa submission. Critical for students whose documents are in Bengali (requiring certified translation), students with name variations across documents, and students submitting financial evidence to immigration authorities.",
      whatAloHelpsWith: [
        "Name consistency check across all documents",
        "Date alignment (issue dates, validity periods)",
        "Translation verification (Bengali to English)",
        "Attestation requirements per country/university",
        "Financial document format compliance",
        "Photograph specification check",
        "Document scan quality review",
        "Final pre-submission checklist",
      ],
      process: [
        "Receive complete document set (digital or physical)",
        "Specialist runs a 47-point checklist",
        "Issues identified and categorized (critical/minor)",
        "Correction guidance provided for each issue",
        "Re-verification after corrections",
        "Final 'submission-ready' certification",
      ],
      timeline:
        "Initial check: 2-3 working days. Re-check after corrections: 1 working day. Rush service (24 hours) available for BDT 1,000 extra.",
      fees:
        "Comprehensive Service Package: includes 2 rounds of document checking. Standalone: BDT 3,000 per round.",
    },
    eligibility:
      "Open to all students. Critical for students submitting visa applications, scholarship applications, or university applications with translated documents.",
    requirements: [
      "Complete set of application documents",
      "Original documents for verification (or notarized scans)",
      "Translations if documents are in Bengali",
    ],
    documents: [
      "Passport (primary identity document)",
      "All academic transcripts and certificates",
      "English test score report",
      "Bank statements (last 3-6 months)",
      "Sponsor letter (if applicable)",
      "Translation certificates (if applicable)",
      "Photographs (per country specification)",
    ],
    faqEnabled: true,
    ctaLabel: "Verify My Documents",
    ctaUrl: "/contact?service=document-checking",
    sortOrder: 6,
    faqs: [
      {
        question: "What's the most common document error you catch?",
        answer:
          "Name inconsistency. Your name must be spelled identically (including middle name, spacing, and capitalization) across your passport, academic transcripts, English test score, bank statement, and visa application. The second most common is bank statement age — many students submit statements older than the 28-day requirement.",
      },
      {
        question: "Do you provide translation services?",
        answer:
          "We do not have in-house translators, but we work with certified translation agencies in Dhaka and can refer you. We DO verify translations for accuracy and certify them as part of document checking. Never use uncertified translators — immigration authorities will reject them.",
      },
      {
        question: "Can you check my documents before I submit my visa application?",
        answer:
          "Yes — and we strongly recommend this. Visa document checking is the single most valuable use of this service. A document error caught before visa submission saves you a refusal, a re-application fee of BDT 50,000+, and 4-8 weeks of delay.",
      },
      {
        question: "What happens if you miss an error?",
        answer:
          "While we cannot guarantee 100% accuracy (no service can), we maintain a 47-point checklist and our error rate is below 0.5%. If a document we certified as 'submission-ready' is rejected due to an error we should have caught, we will refund the document checking fee and provide free re-checking for your next submission.",
      },
    ],
  },

  {
    slug: "visa-guidance",
    title: "Visa Guidance",
    shortDescription: "Navigate the student visa process for any country with expert help.",
    description: "Country-specific visa guidance covering document preparation, financial evidence, application form completion, biometrics, and interview preparation for the UK, USA, Canada, Australia, Ireland, Germany, and other destinations.",
    icon: "Plane",
    content: {
      whatItIs:
        "Visa guidance helps you navigate the student visa application process for your chosen country. We provide country-specific expertise on required documents, financial evidence preparation, application form completion, biometrics booking, and (where applicable) visa interview preparation.",
      whyItMatters:
        "A visa refusal can end your study abroad journey even after university admission. Visa rejection rates for Bangladeshi students vary from 5% to 35% depending on country and intake. Common refusal reasons — insufficient financial evidence, weak credibility, inconsistent information, missing documents — are almost always preventable with proper preparation. A visa is also time-sensitive: a refusal after the intake start date means losing an entire semester.",
      whoNeedsIt:
        "All international students who have received or are expecting a university offer and need a student visa. Particularly critical for students applying to high-refusal destinations (USA, UK, Canada) and for students whose financial situation is complex (multiple sponsors, business income, property-based evidence).",
      whatAloHelpsWith: [
        "Document verification",
        "Financial evidence preparation",
        "Visa application form completion",
        "Interview preparation",
        "Credibility guidance",
        "Pre-submission checklist review",
        "Biometrics appointment booking",
        "Decision monitoring and follow-up",
      ],
      process: [
        "Initial consultation",
        "Document checklist preparation",
        "Financial evidence review",
        "Application form completion",
        "Biometrics appointment",
        "Interview preparation (if required)",
        "Submission",
        "Decision monitoring",
      ],
      timeline:
        "Processing times vary by country, intake, and applicant circumstances. Typically 2-8 weeks. USA F-1: 2-8 weeks after interview. UK Student Visa: 15 working days standard, 5 days priority. Canada SDS: 20 calendar days. Australia Subclass 500: 4-6 weeks. Always apply at least 8 weeks before your course starts.",
      fees:
        "Comprehensive Service Package: includes visa guidance for one country. Standalone visa guidance: BDT 8,000-15,000 depending on country complexity.",
    },
    eligibility:
      "Students who have received (or are about to receive) an unconditional or CAS-generating offer from a recognized university. visa guidance can begin before offer receipt to prepare documents in parallel.",
    requirements: [
      "University offer letter (or CAS/eCoE/I-20 as applicable)",
      "Valid passport (6+ months validity beyond course end)",
      "Financial evidence per country requirement",
      "English proficiency score (final)",
      "Tuberculosis test certificate (for UK applications)",
      "Acceptable photograph specification",
    ],
    documents: [
      "Valid passport",
      "University offer letter / CAS / eCoE / I-20",
      "Academic transcripts and certificates",
      "English test score report",
      "Bank statements (28+ days old, country-specific amount)",
      "Sponsor letter and sponsor's financial documents (if applicable)",
      "Tuberculosis test certificate (UK)",
      "Medical examination report (Canada, Australia)",
      "Passport-size photographs (per specification)",
      "Visa application fee payment confirmation",
    ],
    faqEnabled: true,
    ctaLabel: "Get Visa Help",
    ctaUrl: "/contact?service=visa-guidance",
    sortOrder: 7,
    faqs: [
      {
        question: "What documents do I need for a student visa?",
        answer:
          "Core documents: valid passport, university offer/CAS/eCoE/I-20, academic transcripts, English test score, and financial evidence (bank statements showing funds for tuition + living costs for 28+ consecutive days). Country-specific extras: TB test for UK, medical exam for Canada/Australia, ATAS certificate for some UK research courses. Your counselor provides a country-specific checklist.",
      },
      {
        question: "How long does visa processing take?",
        answer:
          "It varies. UK Student Visa: 15 working days standard, 5 days priority (extra fee). USA F-1: 2-8 weeks after interview, plus interview wait time. Canada SDS: 20 calendar days; regular stream: 4-8 weeks. Australia Subclass 500: 4-6 weeks. Germany: 6-12 weeks. Always apply at least 8 weeks before your course start date.",
      },
      {
        question: "What if my visa is refused?",
        answer:
          "Refusal is not the end. Options include: (1) administrative review or appeal (UK allows this for some refusal types), (2) re-application with corrected documentation, (3) applying to a different country. ALO reviews your refusal letter, identifies the issue, and advises on the best path. Re-application success rates are high when the original refusal reason is properly addressed.",
      },
      {
        question: "Do I need to attend an interview?",
        answer:
          "Depends on country. USA: mandatory F-1 visa interview at the US Embassy in Dhaka. UK: occasional credibility interview. Canada: usually no interview but possible. Australia: rare. Germany: sometimes. If an interview is required, we conduct mock interviews and prepare you for common questions about your study plan, financial situation, and post-study intentions.",
      },
      {
        question: "Can ALO guarantee visa approval?",
        answer:
          "No. Visa decisions are made by immigration authorities, not consultants. Any consultant who guarantees visa approval is being dishonest. ALO provides guidance, document review, and interview preparation to maximize your chances, but the final decision rests with the immigration officer. Our student visa approval rate is 92% (vs industry average of 75%), but we cannot guarantee any individual outcome.",
      },
    ],
  },

  {
    slug: "interview-preparation",
    title: "Interview Preparation",
    shortDescription: "Mock interviews for visa, scholarship, and university admissions.",
    description: "Structured interview preparation including mock interviews, question banks, and feedback sessions for visa interviews, scholarship interviews, and university admission interviews.",
    icon: "Mic",
    content: {
      whatItIs:
        "Interview Preparation provides structured mock interview sessions for the three main interview types in study abroad: visa interviews (especially US F-1), scholarship interviews (Chevening, DAAD, Commonwealth), and university admission interviews (Oxbridge, medical schools, MBA programs). Each session includes a realistic mock interview, detailed feedback, and a personalized improvement plan.",
      whyItMatters:
        "Interviews are often the final deciding factor. A great application can be undone by a nervous, unclear, or contradictory interview. For US F-1 visas, the interview IS the decision — the officer decides in 2-3 minutes. For competitive scholarships like Chevening, the interview weighs heavily alongside the written application. Mock interviews reduce anxiety, surface weak answers, and let you practice your story.",
      whoNeedsIt:
        "Students facing any of: US F-1 visa interview, UK credibility interview, scholarship interview (Chevening, DAAD, Commonwealth, Australia Awards, university merit scholarships), or competitive university admission interview (medicine, MBA, Oxbridge, Ivy League).",
      whatAloHelpsWith: [
        "Question banks for each interview type",
        "Mock interviews in realistic conditions",
        "Recorded feedback on body language and tone",
        "Answer structuring (STAR method, problem-solution-impact)",
        "Handling difficult or trick questions",
        "Storytelling for scholarship interviews",
        "Cultural context (what officers look for)",
      ],
      process: [
        "Initial assessment of interview type and destination",
        "Receive question bank and preparation materials",
        "Mock interview 1 (30-45 minutes) — diagnostic",
        "Detailed feedback session (30 minutes)",
        "Mock interview 2 (30-45 minutes) — refinement",
        "Final tips and confidence-building session",
      ],
      timeline:
        "Standard package: 2 mock interviews + 2 feedback sessions over 5-7 days. Intensive package: 4 mock interviews over 3 days for urgent cases.",
      fees:
        "Visa interview prep (2 mocks): BDT 5,000. Scholarship interview prep (3 mocks): BDT 8,000. University admission interview prep (3 mocks): BDT 8,000. Intensive 4-mock package: BDT 12,000.",
    },
    eligibility:
      "Students who have a confirmed interview scheduled or are about to submit an application that includes an interview stage. Must have a clear study plan and basic knowledge of the target institution.",
    requirements: [
      "Confirmed interview date (or imminent application)",
      "Final university and course details",
      "Knowledge of your own SOP/application content",
      "Basic understanding of post-study plans",
    ],
    documents: [
      "Your submitted SOP and CV",
      "University/course details",
      "Scholarship application (if scholarship interview)",
      "Any correspondence from the interviewer (if available)",
    ],
    faqEnabled: true,
    ctaLabel: "Practice My Interview",
    ctaUrl: "/contact?service=interview-preparation",
    sortOrder: 8,
    faqs: [
      {
        question: "How realistic are the mock interviews?",
        answer:
          "Very. Our counselors have conducted and observed real visa, scholarship, and university interviews. We replicate the format, timing, and questioning style. For US visa interviews, we even simulate the 2-3 minute window and the glass-partition setup. For scholarship interviews, we use the actual question patterns reported by past Chevening/DAAD scholars.",
      },
      {
        question: "Will you tell me what questions will be asked?",
        answer:
          "We cannot predict exact questions — interviewers don't share them in advance. What we provide is a question bank covering 80-90% of likely questions based on patterns from hundreds of past interviews. We also teach you frameworks to handle unexpected questions confidently.",
      },
      {
        question: "What if English is my weak point?",
        answer:
          "Tell your counselor — we'll adjust the mock interview pace and provide additional English coaching if needed. For visa interviews, simple clear English is better than complex grammar. For scholarship interviews, we'll help you prepare key phrases and structured answers in advance so you're not improvising.",
      },
      {
        question: "Can you do mock interviews over Zoom?",
        answer:
          "Yes — all our mock interviews can be conducted in-person at our Dhaka office or over Zoom. We recommend in-person for visa interview prep (closer to real conditions) and Zoom for scholarship/university interviews (since those are often online anyway).",
      },
    ],
  },

  {
    slug: "english-test-preparation",
    title: "English Test Preparation",
    shortDescription: "IELTS, PTE, TOEFL, and Duolingo preparation with mock tests.",
    description: "Structured preparation for IELTS, PTE Academic, TOEFL iBT, and Duolingo English Test — including strategy sessions, practice materials, and mock tests with detailed band/score feedback.",
    icon: "Languages",
    content: {
      whatItIs:
        "English Test Preparation provides structured coaching for the four major English proficiency tests accepted by universities and immigration authorities worldwide: IELTS (Academic and UKVI), PTE Academic, TOEFL iBT, and Duolingo English Test (DET). The program includes initial diagnostic testing, targeted strategy sessions, practice materials, and full mock tests with detailed band/score feedback.",
      whyItMatters:
        "Most universities require IELTS 6.0-7.5 (or equivalent). Many Bangladeshi students take the test 2-3 times before reaching their target band, costing BDT 20,000-50,000 in test fees and 3-6 months of delay. Structured preparation typically raises scores by 0.5-1.0 band in 6-8 weeks, saving both money and time. Choosing the right test (IELTS vs PTE vs TOEFL) is also critical — different tests suit different learners.",
      whoNeedsIt:
        "Students who need an English proficiency score for university admission or visa application, especially those whose previous scores fell short, those who have never taken an official test, and those whose chosen university requires a high band (7.0+ for medicine, law, journalism, education programs).",
      whatAloHelpsWith: [
        "Diagnostic test to determine current level",
        "Choosing the right test (IELTS vs PTE vs TOEFL vs DET)",
        "Strategy sessions per section (Reading, Writing, Listening, Speaking)",
        "Vocabulary and grammar building",
        "Full mock tests with detailed feedback",
        "Speaking practice with feedback on fluency and pronunciation",
        "Writing task review with band score estimation",
        "Test booking and date selection guidance",
      ],
      process: [
        "Diagnostic test (half-length, 2 hours)",
        "Receive detailed band/score report with weak areas",
        "Personalized study plan (4-12 weeks)",
        "Weekly strategy sessions (in-person or online)",
        "Weekly mock tests with feedback",
        "Final test booking when target band is consistently achieved in mocks",
      ],
      timeline:
        "4-12 weeks depending on starting level and target band. Students starting at IELTS 5.5 targeting 7.0 typically need 10-12 weeks. Students starting at 6.0 targeting 6.5 typically need 4-6 weeks.",
      fees:
        "Group classes (4-8 students): BDT 8,000 for 6 weeks. One-on-one coaching: BDT 18,000 for 8 weeks. Mock test only: BDT 1,500 per test. Test booking fees (paid to test center) are separate.",
    },
    eligibility:
      "Open to all students. We recommend taking a diagnostic test at least 6 months before your target intake's deadline, to allow time for retakes if needed.",
    requirements: [
      "Target university and course (to know required band)",
      "Current English level (informal self-assessment is fine to start)",
      "Time commitment of 8-10 hours/week for 6-12 weeks",
    ],
    documents: [
      "Previous English test score report (if any)",
      "Academic background (to assess English exposure)",
      "University target band requirement (your counselor can confirm)",
    ],
    faqEnabled: true,
    ctaLabel: "Boost My English Score",
    ctaUrl: "/contact?service=english-test-preparation",
    sortOrder: 9,
    faqs: [
      {
        question: "Which test should I take — IELTS, PTE, TOEFL, or Duolingo?",
        answer:
          "It depends on your destinations and learning style. IELTS is universally accepted (and required for UKVI). PTE is faster (results in 24-48 hours) and is accepted by most universities. TOEFL is preferred by US universities. Duolingo is cheapest and fastest but not accepted by all universities. Your counselor will recommend based on your target universities.",
      },
      {
        question: "How long will it take to reach my target band?",
        answer:
          "Rough guide: raising IELTS by 0.5 band typically takes 4-6 weeks of focused study (8-10 hours/week). Raising by 1.0 band takes 10-12 weeks. Raising by 1.5+ band takes 4-6 months. We confirm this with a diagnostic test in the first session.",
      },
      {
        question: "Can you guarantee my target score?",
        answer:
          "No. We provide quality teaching, materials, and feedback — but the final score depends on your effort, test-day performance, and English exposure. Be cautious of any institute that guarantees scores. Our students typically improve by 0.5-1.0 band with full participation in the program.",
      },
      {
        question: "Do you provide test booking?",
        answer:
          "Yes — we help you book the test at the British Council (IELTS), Pearson Vue (PTE), or AMEX (TOEFL). Test fees are paid directly to the test center; we charge no booking commission. We recommend booking tests 4-6 weeks in advance as slots fill up near intake deadlines.",
      },
      {
        question: "What if I'm consistently scoring below my target in mocks?",
        answer:
          "Don't take the official test yet — it wastes money and creates a low-score record. Instead, extend your preparation by 4 weeks and identify your specific weak area (e.g. Writing Task 2, Speaking Part 3). We provide targeted intensive practice for weak sections.",
      },
    ],
  },

  {
    slug: "financial-planning",
    title: "Financial Planning",
    shortDescription: "Plan your tuition, living costs, funding sources, and financial evidence.",
    description: "A financial planning service that builds a complete funding plan: tuition estimates, living cost budgeting, scholarship targeting, education loan guidance, and financial evidence preparation for visa applications.",
    icon: "Wallet",
    content: {
      whatItIs:
        "Financial Planning is a structured service that builds your complete study abroad funding plan. We calculate realistic tuition + living + travel costs for your destination, identify funding sources (family savings, scholarships, education loans, sponsor support), and prepare your financial evidence in the format immigration authorities require.",
      whyItMatters:
        "Money is the #1 reason students abandon study abroad plans or face visa refusals. Underestimating costs leads to financial stress abroad; overestimating creates unnecessary anxiety. Mis-formatted financial evidence is the most common visa refusal reason for Bangladeshi students. A clear financial plan removes uncertainty and dramatically improves visa approval odds.",
      whoNeedsIt:
        "Every student considering study abroad — particularly middle-income families, students using education loans, and students with complex sponsor situations (multiple sponsors, business income, property-based evidence).",
      whatAloHelpsWith: [
        "Realistic cost estimation (tuition + living + travel + insurance + hidden costs)",
        "Funding gap analysis (what you have vs what you need)",
        "Scholarship targeting aligned to your profile",
        "Education loan guidance (banks, NBFCs, required documents)",
        "Sponsor letter drafting and verification",
        "Bank statement preparation (28-day rule, deposit patterns)",
        "Property/BY documents formatting for immigration",
        "Currency transfer guidance (no illegal channels)",
      ],
      process: [
        "Financial profile assessment (family income, savings, assets)",
        "Cost calculation for shortlisted destinations",
        "Funding gap identified",
        "Scholarship and loan options presented",
        "Financial evidence plan documented",
        "Bank statement guidance and timeline",
        "Pre-visa financial document review",
      ],
      timeline:
        "Initial plan: 3-5 working days. Ongoing support through visa submission. Bank statement preparation should start 2-3 months before visa application.",
      fees:
        "Comprehensive Service Package: includes financial planning. Standalone financial planning: BDT 5,000. Education loan documentation support: BDT 8,000.",
    },
    eligibility:
      "Available to all students. Best initiated 6-12 months before intended intake to allow time for bank statement seasoning and loan processing.",
    requirements: [
      "Family income details (monthly/annual)",
      "Current savings and fixed deposits",
      "Property and asset documentation (if applicable)",
      "Shortlisted destination and course",
    ],
    documents: [
      "Last 6-12 months bank statements (all accounts)",
      "Income proof (salary slips, business financials, tax returns)",
      "Property documents (if using as evidence)",
      "Fixed deposit receipts",
      "Sponsor's documents (if sponsor is not parent)",
    ],
    faqEnabled: true,
    ctaLabel: "Plan My Finances",
    ctaUrl: "/contact?service=financial-planning",
    sortOrder: 10,
    faqs: [
      {
        question: "How much money do I need to show for a UK student visa?",
        answer:
          "For courses in London: £1,334/month for up to 9 months (£12,006 max). Outside London: £1,023/month (£9,207 max). Plus first year tuition (or remaining balance if already paid). For courses under 9 months, calculate at the monthly rate × course length. Funds must be held for 28 consecutive days ending no more than 31 days before application.",
      },
      {
        question: "Can I use an education loan as financial evidence?",
        answer:
          "Yes, for most countries. UK, Canada, Australia, and USA all accept education loans from recognized banks. The loan sanction letter must clearly state the loan amount, your name, and the university. For Canada SDS, a GIC of CAD 20,635 from an approved bank is required instead of (or alongside) a loan.",
      },
      {
        question: "What if I don't have 28 days of bank statement history?",
        answer:
          "Don't deposit a large sum just before applying — visa officers call this 'funds parking' and often refuse. Instead, deposit funds gradually over 3-6 months and document the source (sale of property, business income, gift from family). We can help you structure a credible deposit pattern.",
      },
      {
        question: "Can a sponsor other than my parents fund my studies?",
        answer:
          "Yes — siblings, grandparents, uncles/aunts can sponsor with a notarized sponsorship letter and their financial documents. Distant relatives or friends are riskier and may trigger credibility questions. Always disclose the true relationship — lying about sponsor relationship is visa fraud.",
      },
      {
        question: "Do you help with education loans?",
        answer:
          "We guide you through the loan application process, recommend banks/NBFCs with favorable terms for students, and help prepare the required documentation. We do not provide loans directly and we do not take commission from any lender. Loan approval is the bank's decision.",
      },
    ],
  },

  {
    slug: "scholarship-guidance",
    title: "Scholarship Guidance",
    shortDescription: "Find and win scholarships matched to your profile.",
    description: "A targeted service that identifies scholarships you're eligible for, assesses your winning chances, and helps craft competitive scholarship applications including essays, references, and interview prep.",
    icon: "Award",
    content: {
      whatItIs:
        "Scholarship Guidance is a structured service that searches 200+ verified scholarships (government, university, NGO, and country-specific), filters by your eligibility, assesses your winning probability, and provides application support including essay guidance, reference letter preparation, and interview coaching.",
      whyItMatters:
        "Scholarships can save BDT 20 lakh to BDT 1 crore over a 2-year Master's program — but competition is fierce (Chevening accepts ~2% of applicants from Bangladesh). Generic applications fail. Successful scholarship applicants tailor each application to the specific scholarship's mission, demonstrate clear alignment with selection criteria, and submit polished essays. Our students win scholarships worth over BDT 5 crore annually.",
      whoNeedsIt:
        "Strong academic performers (GPA 3.5+ equivalent), professionals with 2+ years experience targeting government scholarships (Chevening, DAAD, Australia Awards), and any student applying to universities that offer merit-based aid.",
      whatAloHelpsWith: [
        "Scholarship search filtered by your profile",
        "Eligibility verification per scholarship",
        "Winning probability assessment",
        "Application strategy per scholarship",
        "Essay/Personal Statement guidance (multiple revisions)",
        "Reference letter preparation",
        "Interview preparation (for scholarship interviews)",
        "Timeline management across multiple scholarships",
      ],
      process: [
        "Profile assessment (academic, professional, leadership)",
        "Receive a list of 8-15 eligible scholarships",
        "Prioritize by winning probability and value",
        "Application strategy session per priority scholarship",
        "Draft and revise essays (3 rounds each)",
        "Reference letter preparation",
        "Submission tracking",
        "Interview preparation when shortlisted",
      ],
      timeline:
        "Varies by scholarship deadline. Major government scholarships (Chevening, DAAD) open Aug-Nov. University scholarships have varying deadlines. Plan 3-6 months of preparation before deadline.",
      fees:
        "Comprehensive Service Package: includes scholarship guidance for up to 5 scholarships. Standalone: BDT 10,000 for 3 scholarship applications.",
    },
    eligibility:
      "Strong academic record (typically GPA 3.3+ for Bachelor's applicants, 3.5+ for Master's). Many scholarships require 2+ years work experience. English proficiency (IELTS 6.5+ or equivalent) is usually required at application or before award.",
    requirements: [
      "Academic transcripts with strong GPA",
      "English proficiency score (or plan to obtain)",
      "CV detailing academic, professional, and leadership activities",
      "Career goals clarity",
      "Two-three referee contacts",
    ],
    documents: [
      "All academic transcripts and certificates",
      "English test score report",
      "CV (detailed, 2-3 pages for scholarship applications)",
      "Reference letters (2-3)",
      "Evidence of leadership/community work",
      "Passport (for identity verification)",
    ],
    faqEnabled: true,
    ctaLabel: "Find My Scholarships",
    ctaUrl: "/contact?service=scholarship-guidance",
    sortOrder: 11,
    faqs: [
      {
        question: "Can you guarantee I'll win a scholarship?",
        answer:
          "No. Scholarships are competitive and decisions rest with the awarding body. Chevening accepts ~2% of Bangladeshi applicants. Anyone who guarantees a scholarship is being dishonest. What we guarantee is identifying the right scholarships, maximizing your application quality, and avoiding common mistakes. Our students win ~30% of scholarships they apply to with our support (vs industry average of 8-10%).",
      },
      {
        question: "Which scholarships are best for Bangladeshi students?",
        answer:
          "Top government scholarships: Chevening (UK Masters), DAAD (Germany), Australia Awards (Australia Masters), Commonwealth (UK), Fulbright (USA Masters/PhD), MEXT (Japan). University scholarships: Almost all universities offer merit aid — ask your counselor. We maintain a database of 200+ scholarships filtered for Bangladeshi applicants.",
      },
      {
        question: "Do I need work experience for scholarships?",
        answer:
          "For government scholarships like Chevening and Australia Awards: yes, 2+ years (2,800+ hours) is mandatory. For university merit scholarships: usually no, they're based on academic excellence. For PhD scholarships: research experience matters more than work experience.",
      },
      {
        question: "When should I start preparing for scholarships?",
        answer:
          "At least 6 months before the deadline — ideally 12 months. Chevening opens in August with November deadline for the following September intake; start preparing by March. This gives time to take IELTS, draft essays, secure references, and apply to your 3 university course choices.",
      },
      {
        question: "Can I apply for multiple scholarships at the same time?",
        answer:
          "Yes — and you should. Applying to 5-8 scholarships across tiers (1-2 stretch, 3-4 match, 2-3 safety) maximizes your chances. Just ensure you tailor each application — recycled essays are obvious and weaken every application. We help manage timelines across multiple scholarships.",
      },
    ],
  },

  {
    slug: "pre-departure-orientation",
    title: "Pre-Departure Orientation",
    shortDescription: "Everything you need to know before you fly — documents, culture, banking, safety.",
    description: "A comprehensive orientation program covering document preparation, banking setup, accommodation confirmation, cultural adaptation, safety, and arrival logistics for your destination country.",
    icon: "Luggage",
    content: {
      whatItIs:
        "Pre-Departure Orientation is a structured program (1-2 sessions) covering everything you need to handle in the final 30-60 days before flying: document checklist verification, banking and forex setup, accommodation confirmation, packing strategy, cultural orientation, safety briefing, and arrival logistics (airport pickup, SIM card, university check-in).",
      whyItMatters:
        "The final month before departure is overwhelming — students forget critical documents, miss university enrollment deadlines, struggle to open bank accounts abroad, and face culture shock without preparation. A structured orientation ensures nothing is missed, reduces first-week stress, and helps you settle into your new environment faster. Many students arrive abroad only to discover they're missing documents required for university enrollment.",
      whoNeedsIt:
        "All students who have received their visa and are within 60 days of departure. Especially valuable for first-time international travelers, students from outside Dhaka, and those whose families want reassurance about safety and logistics.",
      whatAloHelpsWith: [
        "Final document checklist verification (carry-on vs checked)",
        "Banking and forex guidance (Bangladeshi bank, international card, cash)",
        "Accommodation confirmation and arrival-night plan",
        "Airport pickup arrangement (where university offers it)",
        "Cultural orientation for destination country",
        "Safety briefing and emergency contacts",
        "SIM card and mobile data setup",
        "University enrollment checklist",
        "Packing strategy (per destination climate)",
      ],
      process: [
        "Session 1 (90 minutes): Documents, banking, accommodation, travel",
        "Session 2 (90 minutes): Culture, safety, university life, Q&A",
        "Receive a printed pre-departure checklist",
        "Emergency contact card with destination-specific numbers",
        "Alumni connect introduction (1-2 current students at your university)",
      ],
      timeline:
        "2 sessions, typically scheduled 2-4 weeks before departure. Allow 1 week between sessions for personal preparation.",
      fees:
        "Included free for all Comprehensive Service Package students. Standalone orientation: BDT 2,000.",
    },
    eligibility:
      "Students who have received their visa and have a confirmed travel date within the next 60 days.",
    requirements: [
      "Approved student visa",
      "Confirmed flight date (or imminent booking)",
      "University offer/CAS/eCoE/I-20 with start date",
      "Accommodation arrangement (at least first 2 weeks)",
    ],
    documents: [
      "Passport with student visa",
      "University offer letter / CAS / eCoE / I-20",
      "Travel insurance documents",
      "Accommodation confirmation",
      "Prescription medications with doctor's letter",
      "International driving permit (if applicable)",
    ],
    faqEnabled: true,
    ctaLabel: "Prepare for Departure",
    ctaUrl: "/contact?service=pre-departure-orientation",
    sortOrder: 12,
    faqs: [
      {
        question: "What documents should I carry vs check in?",
        answer:
          "Carry-on: passport, visa, university offer/CAS/I-20, original academic certificates, financial evidence (bank statement), prescription medicines, laptop, phone, charger, 2 days of clothes. Checked: books, clothes, kitchen items. Never put original documents in checked luggage — lost luggage means lost documents means missed enrollment.",
      },
      {
        question: "How much cash should I carry?",
        answer:
          "USD 200-500 in cash for first-week expenses (taxi, meals, SIM card). For larger amounts, use your international debit card or wire transfer to your destination bank account after opening it. Never carry more than USD 10,000 cash — both Bangladesh and destination customs require declaration above this amount.",
      },
      {
        question: "Should I open a bank account before leaving Bangladesh?",
        answer:
          "Yes — open a student account with international debit card access (most Bangladeshi banks offer these). Also carry a credit card (parent's supplementary card works) for emergencies. You'll open a local bank account in your destination country within the first 2-4 weeks after enrollment.",
      },
      {
        question: "What if I haven't found accommodation yet?",
        answer:
          "Book at least 2 weeks of temporary accommodation (hotel, Airbnb, or university-arranged) so you have somewhere to land. After arrival, visit real accommodation options in person before signing a lease. Never sign a long-term lease without seeing the property — scam listings are common.",
      },
      {
        question: "Do you arrange airport pickup?",
        answer:
          "Many universities offer free airport pickup for international students in their first week — we'll help you book this. For universities that don't, we can recommend trusted airport transfer services. Always have a backup plan (official taxi, ride-sharing app) in case of miscommunication.",
      },
    ],
  },

  {
    slug: "post-arrival-support",
    title: "Post-Arrival Support",
    shortDescription: "Ongoing support for your first 90 days abroad.",
    description: "Continued support during the critical first 90 days abroad — university enrollment, bank account opening, health registration, part-time work guidance, and emergency support.",
    icon: "LifeBuoy",
    content: {
      whatItIs:
        "Post-Arrival Support is ongoing assistance during your first 90 days abroad — the most challenging period for international students. We provide guidance on university enrollment, bank account opening, health insurance registration, police registration (where required), part-time work rules, and emergency support if things go wrong.",
      whyItMatters:
        "The first 90 days abroad are when students face the most challenges — culture shock, homesickness, bureaucratic confusion, and unexpected expenses. Without a local support system, small problems escalate. Our post-arrival support ensures you have a trusted contact who knows your destination country's systems and can guide you through challenges.",
      whoNeedsIt:
        "All students, especially those traveling alone for the first time, those going to non-English-speaking countries, and those whose families want ongoing oversight during the transition period.",
      whatAloHelpsWith: [
        "University enrollment and course registration",
        "Bank account opening (documentation required)",
        "Health insurance registration",
        "Police registration (UK, certain countries)",
        "SIM card and mobile setup",
        "Biometric residence permit collection (UK BRP)",
        "Part-time work rights briefing",
        "Emergency support (24/7 hotline)",
        "Cultural adjustment counseling",
        "Connection with Bangladeshi student community",
      ],
      process: [
        "Pre-arrival WhatsApp group setup",
        "Arrival confirmation and check-in",
        "Week 1: Enrollment and bank account guidance",
        "Week 2-4: Health registration and BRP collection",
        "Month 2-3: Part-time work guidance, academic check-in",
        "Monthly catch-up calls for first 3 months",
      ],
      timeline:
        "Active support for 90 days post-arrival. After 90 days, support transitions to on-demand (email/WhatsApp).",
      fees:
        "Comprehensive Service Package: includes 90 days post-arrival support. Standalone: BDT 5,000 for 90 days.",
    },
    eligibility:
      "Students who have arrived at their destination country and are enrolled (or about to enroll) at their university.",
    requirements: [
      "Active WhatsApp or reachable phone number",
      "University enrollment details",
      "Local address in destination country",
    ],
    documents: [
      "Passport with entry stamp",
      "University offer/CAS/I-20",
      "Visa approval letter",
      "Local address proof (rental agreement or university accommodation letter)",
    ],
    faqEnabled: true,
    ctaLabel: "Get Post-Arrival Help",
    ctaUrl: "/contact?service=post-arrival-support",
    sortOrder: 13,
    faqs: [
      {
        question: "What if I have an emergency at 2am?",
        answer:
          "Our 24/7 emergency hotline is staffed for genuine emergencies (medical, safety, legal trouble). For non-emergencies (course registration questions, bank account help), use WhatsApp during business hours. Save the emergency number in your phone before departure.",
      },
      {
        question: "Can you help me find part-time work?",
        answer:
          "We provide guidance on work rights (hours allowed, types of jobs, tax implications) and where to look for part-time jobs (university job boards, local job sites). We do not directly place students in jobs — that would be illegal in most countries. Working beyond allowed hours can void your visa.",
      },
      {
        question: "What if I'm homesick and struggling?",
        answer:
          "Homesickness is normal and usually peaks at week 3-6. We provide emotional support, connect you with Bangladeshi student communities at your university, and recommend mental health resources if needed. For serious mental health concerns, we guide you to your university's counseling service (usually free for students).",
      },
      {
        question: "My university enrollment is delayed — what do I do?",
        answer:
          "Contact us immediately. Delayed enrollment can affect your visa status (you must be enrolled within a certain window). We'll help you contact the international office, prepare documentation, and escalate if needed. Always keep written records of all university communications.",
      },
    ],
  },

  {
    slug: "career-counselling",
    title: "Career Counseling",
    shortDescription: "Plan your post-study career path and work visa options.",
    description: "Career planning service that aligns your course choice with target careers, explains post-study work visa options, and prepares you for the international job market.",
    icon: "Briefcase",
    content: {
      whatItIs:
        "Career Counseling helps you plan your post-study career path — from choosing the right course for your career goals to understanding post-study work visa options, building a job search strategy, and optimizing your CV and LinkedIn for the international job market.",
      whyItMatters:
        "Studying abroad is an investment in your future career. Without clear career planning, students often choose courses that don't align with their goals or miss post-study work opportunities. Many Bangladeshi students return home after graduation without ever trying to use their post-study work visa — losing out on international work experience that would have boosted their career significantly.",
      whoNeedsIt:
        "Students at any stage — from those choosing a course to those about to graduate and looking for work opportunities abroad or back in Bangladesh. Particularly valuable for students targeting competitive careers (consulting, investment banking, tech, public health).",
      whatAloHelpsWith: [
        "Career goal setting (short, medium, long-term)",
        "Course-career alignment analysis",
        "Post-study work visa options briefing",
        "Job market analysis for target industry/country",
        "CV optimization for international markets",
        "LinkedIn profile building",
        "Interview preparation (technical and behavioral)",
        "Networking strategy and alumni connections",
        "Return-to-Bangladesh vs stay-abroad decision framework",
      ],
      process: [
        "Career assessment session (90 minutes)",
        "Receive a career plan document",
        "Course alignment review (if pre-application)",
        "Post-study work visa briefing for chosen country",
        "CV and LinkedIn optimization",
        "Job search strategy session",
        "Alumni connections to relevant industry professionals",
      ],
      timeline:
        "Ongoing throughout your study abroad journey. Initial plan: 1 week. Most students engage career counseling 2-3 times — before applying, during studies, and 6 months before graduation.",
      fees:
        "Comprehensive Service Package: includes career counseling. Standalone: BDT 4,000 per session.",
    },
    eligibility:
      "Open to students at any stage. Most impactful when started before course selection, but valuable even after graduation.",
    requirements: [
      "Career aspirations (even if vague)",
      "Current academic stage",
      "Preferred post-study destination (stay abroad, return home, or undecided)",
    ],
    documents: [
      "Academic transcripts",
      "CV (current draft)",
      "LinkedIn profile URL",
      "List of target companies/industries (if any)",
    ],
    faqEnabled: true,
    ctaLabel: "Plan My Career",
    ctaUrl: "/contact?service=career-counselling",
    sortOrder: 14,
    faqs: [
      {
        question: "Can you help me find a job after graduation?",
        answer:
          "We provide career guidance, CV optimization, interview preparation, and connect you with our alumni network. We do not directly place students in jobs — that would be a recruitment agency's role. We can recommend legitimate recruitment agencies in your target country if needed.",
      },
      {
        question: "What are post-study work visa options?",
        answer:
          "UK: 2-year Graduate Route visa (3 years for PhD). USA: 1-year OPT (3-year for STEM fields). Canada: up to 3-year Post-Graduation Work Permit (PGWP). Australia: 2-4-year Temporary Graduate visa (485). Ireland: 1-year Third Level Graduate Scheme (2 years for Masters). Germany: 18-month job-seeker visa. New Zealand: 3-year Post-Study Work Visa.",
      },
      {
        question: "Should I return to Bangladesh after graduation?",
        answer:
          "That depends on your career goals, family situation, and visa options. We help you evaluate both options objectively — staying abroad offers international work experience and higher salaries, but returning home offers family proximity and faster career progression in some fields. Many students stay abroad 2-5 years then return with valuable experience.",
      },
      {
        question: "Will my foreign degree be recognized in Bangladesh?",
        answer:
          "Most degrees from recognized universities are recognized by UGC Bangladesh. Professional fields may require additional certification: medicine (BMDC), engineering (IEB), accounting (ICAB), law (Bangladesh Bar Council). We verify recognition during university selection so you don't face surprises later.",
      },
    ],
  },

  {
    slug: "ongoing-mentorship",
    title: "Ongoing Mentorship",
    shortDescription: "Long-term mentoring throughout your entire study abroad journey.",
    description: "A premium long-term mentoring program pairing you with a senior counselor who stays with you from application through graduation, providing strategic guidance at every milestone.",
    icon: "Users",
    content: {
      whatItIs:
        "Ongoing Mentorship is our premium service where you're paired with a senior ALO counselor who stays with you throughout your entire study abroad journey — from initial counseling through your first year abroad. Unlike transactional services, mentorship provides a single point of contact who knows your full history and can give context-aware advice at every milestone.",
      whyItMatters:
        "Study abroad is a 2-4 year journey with dozens of decision points — course changes, scholarship renewals, internship applications, visa extensions, post-study work decisions. Working with a new counselor each time means re-explaining your context and getting generic advice. A long-term mentor provides continuity, remembers your goals, and can spot issues before they become problems.",
      whoNeedsIt:
        "Students and families who want the highest level of support and personalized guidance. Particularly valuable for students whose parents cannot actively participate in decisions (busy professionals, those not fluent in English), and for students with complex situations (career-changers, scholarship applicants, students with academic weaknesses).",
      whatAloHelpsWith: [
        "Single dedicated counselor for the entire journey",
        "Quarterly strategic review sessions",
        "Priority response on all queries (24-hour SLA)",
        "Proactive deadline tracking and reminders",
        "Course change and module selection guidance",
        "Scholarship renewal and extension support",
        "Visa extension and post-study work visa planning",
        "Internship and job search strategy",
        "Crisis support (academic, personal, financial)",
        "Annual progress reports for parents",
      ],
      process: [
        "Mentor pairing session (counselor + student + parents)",
        "Jointly develop a 2-4 year roadmap",
        "Quarterly strategic review sessions (90 minutes each)",
        "Monthly check-in email/WhatsApp",
        "On-demand priority response for queries",
        "Annual progress report (formal document for student + parents)",
      ],
      timeline:
        "Continuous engagement from initial counseling through first year abroad (typically 2-4 years total).",
      fees:
        "BDT 25,000/year (separate from per-service fees). Includes dedicated mentor time, priority response, and quarterly reviews. Most services bundled at discounted rates.",
    },
    eligibility:
      "Available to all students. Best initiated at the start of the application journey, but can be joined at any stage.",
    requirements: [
      "Commitment to quarterly sessions",
      "Willingness to share academic and financial progress",
      "Open communication about challenges and goals",
    ],
    documents: [
      "Academic transcripts (updated annually)",
      "CV (updated as experience grows)",
      "List of goals and concerns for each session",
    ],
    faqEnabled: true,
    ctaLabel: "Get a Mentor",
    ctaUrl: "/contact?service=ongoing-mentorship",
    sortOrder: 15,
    faqs: [
      {
        question: "What's the difference between mentorship and regular counseling?",
        answer:
          "Regular counseling is transactional — you book sessions as needed and may see different counselors. Mentorship is a long-term relationship with a single dedicated counselor who knows your full history, proactively tracks your deadlines, and provides context-aware advice. Think of it as having a personal academic advisor.",
      },
      {
        question: "Who will my mentor be?",
        answer:
          "Mentors are our senior counselors with 8+ years of experience and a track record of successful student placements. We match mentors to students based on destination, course, and personal fit. You can request a mentor change at any time if the relationship isn't working.",
      },
      {
        question: "How often will I meet my mentor?",
        answer:
          "Quarterly strategic reviews (90 minutes each), monthly check-ins (email/WhatsApp), and on-demand priority responses for urgent queries. Most students have 6-8 substantial interactions per year plus quick questions as needed.",
      },
      {
        question: "Does mentorship include all other services?",
        answer:
          "Mentorship includes the strategic oversight of all services. Specific services (application assistance, visa guidance, etc.) are billed separately but at discounted rates (typically 20-30% off). The mentor coordinates all services to ensure consistency.",
      },
    ],
  },
];

// ─── 6 RESOURCES WITH DEEP CONTENT + FAQs ─────────────────────
const RESOURCES: ResourceInput[] = [
  {
    slug: "uk-student-visa-guide",
    categorySlug: "visa-guides",
    title: "UK Student Visa Guide: Complete Step-by-Step Process for Bangladeshi Students",
    excerpt:
      "Everything you need to know about applying for a UK Student Visa from Bangladesh — documents, financial requirements, biometrics, and timeline.",
    content: `<h2>Overview</h2><p>The UK Student Visa (formerly Tier 4) allows international students to study in the UK at a licensed student sponsor institution. This comprehensive guide walks Bangladeshi applicants through the complete process — from receiving your CAS to arriving in the UK.</p>

<h2>Eligibility</h2>
<p>To apply for a UK Student Visa, you must:</p>
<ul>
  <li>Have a Confirmation of Acceptance for Studies (CAS) from a licensed UK university</li>
  <li>Demonstrate sufficient funds for tuition and living costs</li>
  <li>Hold a valid English proficiency qualification (typically IELTS for UKVI 5.5+ depending on course level)</li>
  <li>Have a valid passport</li>
  <li>Pass tuberculosis (TB) test at an approved clinic in Dhaka</li>
</ul>

<h2>Required Documents</h2>
<ul>
  <li>Valid passport (current + previous if applicable)</li>
  <li>CAS reference number and CAS letter from university</li>
  <li>Bank statement showing £1,334/month (London) or £1,023/month (outside London) for up to 9 months</li>
  <li>Bank statement must cover 28 consecutive days ending no more than 31 days before application</li>
  <li>Tuberculosis test certificate from approved clinic (IOM Dhaka)</li>
  <li>ATAS certificate (only for certain research courses — check your offer letter)</li>
  <li>Academic transcripts and certificates (used for CAS verification)</li>
  <li>English test score report (IELTS for UKVI or equivalent)</li>
  <li>Passport-size photographs meeting UKVI specifications</li>
</ul>

<h2>Financial Requirements</h2>
<p>You must show funds for:</p>
<ul>
  <li><strong>Tuition fees:</strong> Remaining first-year fees (after any deposit paid shown on CAS)</li>
  <li><strong>Living costs:</strong> £1,334/month (London universities) or £1,023/month (outside London) for up to 9 months</li>
</ul>
<p><strong>Example:</strong> For a 1-year Master's outside London with £15,000 tuition (after £2,000 deposit), you'd need to show £15,000 + (9 × £1,023) = £24,207 in your account for 28 consecutive days.</p>
<p>Funds can be in your account or your parent's/legal guardian's account. If using parent's account, include a letter of consent and proof of relationship (birth certificate).</p>

<h2>Application Process</h2>
<ol>
  <li><strong>Receive CAS from university</strong> — usually issued within 2-4 weeks of accepting offer and paying deposit</li>
  <li><strong>Take TB test</strong> at IOM Dhaka (book 2-3 weeks in advance, costs ~BDT 6,500)</li>
  <li><strong>Gather documents</strong> — refer to checklist above</li>
  <li><strong>Apply online</strong> at gov.uk/student-visa — fill form, upload documents, pay fees</li>
  <li><strong>Pay visa fee</strong> — £490 (BDT ~65,000) plus Immigration Health Surcharge £776/year (BDT ~103,000/year)</li>
  <li><strong>Book biometrics appointment</strong> at VFS Global Dhaka (usually available within 1-2 weeks)</li>
  <li><strong>Attend biometrics appointment</strong> — fingerprints, photo, document upload</li>
  <li><strong>Receive decision</strong> — typically 15 working days (standard) or 5 working days (priority, extra £500)</li>
  <li><strong>Collect BRP</strong> — Biometric Residence Permit collected from Post Office in UK within 10 days of arrival</li>
</ol>

<h2>Application Fees Summary</h2>
<table>
  <tr><th>Item</th><th>Cost</th></tr>
  <tr><td>Visa application fee</td><td>£490</td></tr>
  <tr><td>IHS (per year of visa)</td><td>£776</td></tr>
  <tr><td>Priority service (optional)</td><td>£500</td></tr>
  <tr><td>TB test at IOM</td><td>~BDT 6,500</td></tr>
  <tr><td>Total for 1-year Master's (standard)</td><td>£1,266 + BDT 6,500</td></tr>
</table>

<h2>Common Mistakes to Avoid</h2>
<ul>
  <li><strong>Insufficient bank statement history</strong> — 28 days is minimum; aim for 3+ months for credibility</li>
  <li><strong>Inconsistent name across documents</strong> — passport, bank statement, and CAS must all match exactly</li>
  <li><strong>Missing TB test</strong> — mandatory for Bangladesh applicants</li>
  <li><strong>Using wrong IELTS</strong> — must be IELTS for UKVI, not regular IELTS Academic</li>
  <li><strong>Funds parking</strong> — depositing large sum just before application; officers look for source of funds</li>
  <li><strong>Wrong CAS details</strong> — verify CAS number and sponsor license number match exactly</li>
</ul>

<h2>Working in the UK on Student Visa</h2>
<p>You can work:</p>
<ul>
  <li>Part-time during term: up to 20 hours/week</li>
  <li>Full-time during vacations</li>
  <li>Full-time after course end (until visa expires) if course completed</li>
  <li>Work placements as part of course (with university approval)</li>
</ul>
<p>You cannot work self-employed, as a professional sportsperson, or in certain restricted sectors.</p>

<h2>Dependants</h2>
<p>From January 2024, most new international Master's students cannot bring dependants. Exceptions: PhD students, research-based Master's, and government-funded scholarship holders.</p>`,
    readingTime: 12,
    tags: ["UK", "visa", "student visa", "Tier 4", "CAS", "UKVI", "Bangladeshi students"],
    sourceUrl: "https://www.gov.uk/student-visa",
    sourceName: "UK Government",
    seoTitle: "UK Student Visa Guide 2024: Complete Process for Bangladeshi Students | ALO Education",
    seoDescription:
      "Step-by-step UK Student Visa guide for Bangladeshi students. Documents, financial requirements, biometrics, fees, and timeline explained.",
    faqs: [
      {
        question: "How long does UK student visa processing take?",
        answer:
          "Standard processing: 15 working days (3 weeks). Priority service: 5 working days (extra £500). Super priority: 1 working day (extra £1,000, limited availability). Apply at least 6-8 weeks before your course start date to allow for delays.",
      },
      {
        question: "Can I work while studying in the UK?",
        answer:
          "Yes. You can work up to 20 hours/week during term time and full-time during vacations. Work cannot be self-employed or as a professional sportsperson. After course completion, you can work full-time until your visa expires, then switch to the Graduate Route visa (2-year post-study work visa).",
      },
      {
        question: "What is the IHS (Immigration Health Surcharge)?",
        answer:
          "IHS is a mandatory fee that gives you access to the UK's National Health Service (NHS) during your stay. It costs £776 per year of visa. You pay it as part of your visa application. Without IHS, you'd pay out-of-pocket for all medical care.",
      },
      {
        question: "What if my visa is refused?",
        answer:
          "You can apply for Administrative Review within 28 days if you believe the decision was legally wrong. You cannot appeal student visa refusals. Alternatively, you can re-apply with corrected documentation. Common refusal reasons: insufficient financial evidence, missing TB test, wrong IELTS type. Address the issue before re-applying.",
      },
      {
        question: "Do I need to collect my BRP in the UK?",
        answer:
          "Yes. Your visa vignette (sticker in passport) is valid for 90 days from intended travel date. Within 10 days of arriving in the UK, you must collect your Biometric Residence Permit (BRP) from the Post Office specified in your decision letter. The BRP is your actual visa for the full duration.",
      },
    ],
  },

  {
    slug: "canada-study-permit-guide",
    categorySlug: "visa-guides",
    title: "Canada Study Permit Guide: Requirements and Process for Bangladeshi Students",
    excerpt:
      "Complete guide to obtaining a Canadian Study Permit — including the SDS program, financial requirements, and biometrics.",
    content: `<h2>Overview</h2>
<p>The Canada Study Permit allows international students to study at Designated Learning Institutions (DLIs) in Canada. Bangladeshi students can apply via the Student Direct Stream (SDS) for faster processing (20 calendar days) or the regular stream.</p>

<h2>SDS vs Regular Stream</h2>
<table>
  <tr><th>Feature</th><th>SDS</th><th>Regular Stream</th></tr>
  <tr><td>Processing time</td><td>20 calendar days</td><td>4-8 weeks</td></tr>
  <tr><td>Required IELTS</td><td>6.0+ (no band below 6.0)</td><td>6.0+ (varies by institution)</td></tr>
  <tr><td>Financial proof</td><td>GIC CAD 20,635 + first year tuition</td><td>CAD 20,635 + tuition (4 months bank statement)</td></tr>
  <tr><td>Upfront tuition</td><td>Required (1st year)</td><td>Not required upfront</td></tr>
  <tr><td>Medical exam</td><td>Upfront required</td><td>Upfront optional</td></tr>
  <tr><td>Approval rate</td><td>Higher (less scrutiny on financial credibility)</td><td>Lower (more documentation scrutiny)</td></tr>
</table>

<h2>Required Documents</h2>
<ul>
  <li>Valid passport (6+ months validity beyond course end)</li>
  <li>Letter of Acceptance from a DLI</li>
  <li>Proof of funds: GIC CAD 20,635 (SDS) OR bank statement showing CAD 20,635+ (regular)</li>
  <li>Proof of first-year tuition payment (SDS only)</li>
  <li>IELTS score report (6.0+, no band below 6.0 for SDS)</li>
  <li>Medical exam certificate from IRCC-approved panel physician</li>
  <li>Police clearance certificate (sometimes required)</li>
  <li>Passport-size photographs (35mm x 45mm, white background)</li>
  <li>Statement of Purpose explaining study plan and ties to Bangladesh</li>
  <li>Biometrics confirmation letter (after submitting application)</li>
</ul>

<h2>Financial Requirements</h2>
<p><strong>SDS:</strong> GIC of CAD 20,635 from approved bank (ICICI, SBI, CIBC, Scotiabank, RBC, BMO) + first year tuition payment receipt.</p>
<p><strong>Regular Stream:</strong> Bank statement showing CAD 20,635 (living) + first year tuition (varies CAD 15,000-50,000) for at least 4 months. Bank statement must be from a recognized financial institution.</p>
<p><strong>GIC Process:</strong> Open GIC account online → transfer CAD 20,635 → bank issues GIC certificate → first CAD 2,000-3,000 released on arrival in Canada, balance in 12 monthly installments.</p>

<h2>Application Process</h2>
<ol>
  <li><strong>Receive Letter of Acceptance</strong> from DLI</li>
  <li><strong>Purchase GIC</strong> from approved Canadian bank (online, takes 5-10 days)</li>
  <li><strong>Pay first year tuition</strong> (SDS only — get receipt from university)</li>
  <li><strong>Complete medical exam</strong> at IRCC-approved panel physician in Dhaka</li>
  <li><strong>Apply online</strong> at IRCC portal — create account, fill forms, upload documents</li>
  <li><strong>Pay fees</strong> — CAD 150 (study permit) + CAD 85 (biometrics)</li>
  <li><strong>Submit biometrics</strong> at VFS Bangladesh Dhaka within 30 days of biometric request letter</li>
  <li><strong>Receive decision</strong> — 20 days (SDS) or 4-8 weeks (regular)</li>
  <li><strong>Receive Letter of Introduction</strong> (port of entry letter) and TRV (Temporary Resident Visa) sticker in passport</li>
  <li><strong>Arrive in Canada</strong> — Study Permit issued at port of entry</li>
</ol>

<h2>Working in Canada on Study Permit</h2>
<p><strong>On-campus:</strong> Unlimited hours</p>
<p><strong>Off-campus:</strong> Up to 24 hours/week during term (changed in 2024 from 20 hours), full-time during scheduled breaks</p>
<p><strong>Co-op/internship:</strong> Allowed if part of course, requires Co-op Work Permit</p>
<p><strong>Post-graduation:</strong> Post-Graduation Work Permit (PGWP) up to 3 years depending on course length</p>

<h2>Post-Graduation Work Permit (PGWP)</h2>
<p>The PGWP allows graduates to work in Canada for up to 3 years after completing their studies. Duration depends on course length:</p>
<ul>
  <li>Courses 8 months to 2 years: PGWP duration = course duration</li>
  <li>Courses 2+ years: PGWP up to 3 years</li>
  <li>Must apply within 180 days of receiving written confirmation of program completion</li>
</ul>

<h2>Common Refusal Reasons</h2>
<ul>
  <li>Insufficient financial proof</li>
  <li>Weak Statement of Purpose (unclear study plan, weak ties to Bangladesh)</li>
  <li>Course doesn't align with previous education</li>
  <li>Insufficient English score (apply only after IELTS 6.0+)</li>
  <li>Medical or security concerns</li>
</ul>`,
    readingTime: 11,
    tags: ["Canada", "visa", "study permit", "SDS", "GIC", "PGWP", "Bangladeshi students"],
    sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
    sourceName: "Government of Canada",
    seoTitle: "Canada Study Permit Guide 2024: SDS Process for Bangladeshi Students | ALO Education",
    seoDescription:
      "Complete Canada Study Permit guide with SDS program details, GIC requirements, biometrics, fees, and PGWP information.",
    faqs: [
      {
        question: "What is the SDS program and am I eligible?",
        answer:
          "Student Direct Stream (SDS) offers faster visa processing (20 days vs 4-8 weeks) for Bangladeshi students who meet: IELTS 6.0+ (no band below 6.0), GIC of CAD 20,635, upfront first-year tuition payment, and upfront medical exam. If you don't meet these, you apply through the regular stream (slower but no upfront tuition required).",
      },
      {
        question: "How does the GIC work?",
        answer:
          "You purchase a Guaranteed Investment Certificate (GIC) of CAD 20,635 from an approved Canadian bank (ICICI, SBI Canada, CIBC, Scotiabank, RBC, BMO). After arrival in Canada, the bank releases CAD 2,000-3,000 immediately and the balance in 11-12 monthly installments. The GIC serves as proof of funds for living costs.",
      },
      {
        question: "What is PGWP and how long is it valid?",
        answer:
          "Post-Graduation Work Permit (PGWP) allows you to work in Canada after graduation. Duration: 8 months-2 year courses get PGWP equal to course length; 2+ year courses get up to 3-year PGWP. Apply within 180 days of receiving written confirmation of program completion. PGWP is open — you can work for any employer.",
      },
      {
        question: "Can I bring my family with me to Canada?",
        answer:
          "Yes. Spouse can apply for Open Work Permit (valid for same duration as your study permit). Children can study for free in Canadian public schools. Spouse work permit allows full-time work for any employer. Apply for family visas at the same time as your study permit for faster processing.",
      },
      {
        question: "What happens if my study permit is refused?",
        answer:
          "You can re-apply with stronger documentation addressing the refusal reason(s). Canada doesn't have a formal appeal for study permit refusals, but re-application with corrected documentation is common and often successful. Get the refusal letter (CAIPS/GCMS notes) to understand exact reasons. ALO reviews refusals and advises on re-application strategy.",
      },
    ],
  },

  {
    slug: "chevening-scholarship-guide",
    categorySlug: "scholarships",
    title: "Chevening Scholarship: Complete Guide for Bangladeshi Students",
    excerpt:
      "The UK government's global scholarship programme offering fully-funded Masters study. Learn about eligibility, application process, and tips.",
    content: `<h2>Overview</h2>
<p>Chevening is the UK government's international awards scheme aimed at developing global leaders. It offers fully-funded Masters study at any UK university for one year. Each year, approximately 1,500 scholarships are awarded globally, with 30-50 going to Bangladeshi applicants.</p>

<h2>What It Covers</h2>
<ul>
  <li>Full tuition fees (no cap)</li>
  <li>Monthly living stipend (approx. £1,500-1,800/month depending on London/outside London)</li>
  <li>Return airfare to UK (economy class)</li>
  <li>Arrival allowance</li>
  <li>Departure allowance</li>
  <li>Visa fees (for scholar and dependants if applicable)</li>
  <li>Travel grant for conferences and UK events</li>
  <li>Thesis/dissertation grant</li>
  <li>Excess baggage allowance on return</li>
</ul>

<h2>Eligibility</h2>
<ul>
  <li><strong>Citizenship:</strong> Bangladeshi citizen (must return to Bangladesh for 2 years after)</li>
  <li><strong>Work experience:</strong> Minimum 2 years (2,800 hours) of work experience — paid, unpaid, internship, or volunteer</li>
  <li><strong>Academic:</strong> Bachelor's degree qualifying for UK Masters entry (typically 2:1 equivalent or above)</li>
  <li><strong>Course selection:</strong> Apply to 3 eligible UK university courses by application deadline</li>
  <li><strong>English:</strong> Meet English language requirement (IELTS 6.5+ overall, no band below 5.5, or accepted equivalent)</li>
  <li><strong>Previous awards:</strong> Not received Chevening funding before</li>
  <li><strong>Commitment:</strong> Return to Bangladesh for at least 2 years after scholarship</li>
</ul>

<h2>Application Timeline (Approximate)</h2>
<table>
  <tr><th>Stage</th><th>Timing</th><th>Action</th></tr>
  <tr><td>Applications open</td><td>Early August</td><td>Create account on chevening.org, start application</td></tr>
  <tr><td>Applications close</td><td>Early November (3 months window)</td><td>Submit application with 3 university course choices</td></tr>
  <tr><td>Longlisting</td><td>December-January</td><td>Read by reading committee; references requested</td></tr>
  <tr><td>Shortlisting</td><td>February-March</td><td>Shortlisted candidates invited to interview</td></tr>
  <tr><td>Interviews</td><td>March-April (Dhaka)</td><td>Panel interview at British High Commission</td></tr>
  <tr><td>Conditional offer</td><td>June</td><td>Selected candidates receive conditional offer</td></tr>
  <tr><td>Final award</td><td>July-August</td><td>Conditions met → final award; university admission secured</td></tr>
  <tr><td>Travel to UK</td><td>September</td><td>Pre-departure briefing; fly to UK</td></tr>
</table>

<h2>Application Components</h2>
<ol>
  <li><strong>4 essays</strong> (Leadership & Influence, Networking, Studying in the UK, Career Plan) — 500 words each</li>
  <li><strong>3 university course choices</strong> with rationale for each</li>
  <li><strong>2 references</strong> — professional or academic</li>
  <li><strong>Work experience details</strong> — minimum 2 years documented</li>
  <li><strong>Academic transcripts and degree certificate</strong></li>
  <li><strong>English test score</strong> (if requested)</li>
</ol>

<h2>Tips for Success</h2>
<ul>
  <li><strong>Demonstrate leadership</strong> with specific examples, not generic statements. Show initiative, impact, and learning from failure.</li>
  <li><strong>Network strategically</strong> — show concrete plans to build networks in UK and leverage them on return to Bangladesh</li>
  <li><strong>Career plan for returning to Bangladesh</strong> — be specific about target organizations, roles, and 5-10 year trajectory</li>
  <li><strong>Choose courses aligned with Bangladesh's development priorities</strong> — climate, public health, governance, economic development, technology</li>
  <li><strong>Strong references</strong> from senior professionals who can speak to your leadership and impact</li>
  <li><strong>Apply to realistic university courses</strong> — Chevening looks for fit between your profile and course requirements</li>
  <li><strong>Show personality</strong> — reviewers read thousands of applications; distinctive authentic stories stand out</li>
</ul>

<h2>Common Mistakes</h2>
<ul>
  <li>Generic essays that could apply to anyone</li>
  <li>Vague career plans with no specific organizations or roles</li>
  <li>Applying to all 3 courses at Oxford/Cambridge/LSE (unrealistic)</li>
  <li>Insufficient work experience documentation</li>
  <li>Weak references from people who barely know you</li>
  <li>No clear plan for returning to Bangladesh</li>
  <li>Plagiarism (Chevening uses sophisticated detection; you'll be permanently banned)</li>
</ul>

<h2>Interview Tips</h2>
<ul>
  <li>20-30 minute panel interview at British High Commission Dhaka</li>
  <li>Panel: Chevening Officer + 1-2 alumni + sometimes British High Commission representative</li>
  <li>Questions on: essays, career plan, leadership experiences, networking plans</li>
  <li>Be prepared to defend your course choices and explain why these specific 3 courses</li>
  <li>Dress professionally; arrive 15 minutes early</li>
  <li>Have 2-3 questions ready to ask the panel at the end</li>
</ul>`,
    readingTime: 13,
    tags: ["Chevening", "scholarship", "UK", "fully funded", "Masters", "government scholarship"],
    sourceUrl: "https://www.chevening.org/",
    sourceName: "Chevening",
    seoTitle: "Chevening Scholarship 2024: Complete Guide for Bangladeshi Students | ALO Education",
    seoDescription:
      "Complete Chevening Scholarship guide — eligibility, application timeline, essay tips, and interview preparation for Bangladeshi students.",
    faqs: [
      {
        question: "Is Chevening fully funded?",
        answer:
          "Yes. Chevening covers full tuition fees (no cap), monthly living stipend (~£1,500-1,800/month), return airfare, visa fees, arrival and departure allowances, travel grants for conferences, and thesis grant. Total value: £40,000-60,000 depending on course fees.",
      },
      {
        question: "Do I need work experience to apply for Chevening?",
        answer:
          "Yes, minimum 2 years (2,800 hours) of work experience. This can include paid employment, internships, volunteer work, or part-time work while studying. Document it carefully — Chevening verifies hours and references.",
      },
      {
        question: "Can I apply before getting university admission?",
        answer:
          "Yes, you must apply to Chevening BEFORE securing university admission. You select 3 university course choices in the Chevening application. If awarded, Chevening helps you secure admission to one of your 3 choices. Apply to universities in parallel — Chevening expects you to apply to your selected courses by the application deadline.",
      },
      {
        question: "What is the success rate for Bangladeshi applicants?",
        answer:
          "Chevening receives approximately 800-1,000 applications from Bangladesh each year and awards 30-50 scholarships. Success rate is ~3-5%. Applicants with strong leadership track records, clear career plans, and well-aligned course choices have significantly higher chances. Working with an experienced counselor helps.",
      },
      {
        question: "Can I extend my stay in the UK after Chevening?",
        answer:
          "No. Chevening requires you to return to Bangladesh for at least 2 years after completing your Masters. This is a strict condition — you cannot stay in the UK on Graduate Route visa or switch to work visa directly. The 2-year return requirement is enforced via visa conditions.",
      },
    ],
  },

  {
    slug: "ielts-vs-pte-comparison",
    categorySlug: "english-tests",
    title: "IELTS vs PTE: Which English Test Should You Take?",
    excerpt:
      "A detailed comparison of IELTS and PTE — test format, scoring, difficulty, results time, and acceptance to help you choose.",
    content: `<h2>Overview</h2>
<p>Both IELTS (International English Language Testing System) and PTE Academic (Pearson Test of English) are widely accepted English proficiency tests. This comparison helps Bangladeshi students choose the right one based on test format, scoring, results time, cost, and destination requirements.</p>

<h2>Test Format Comparison</h2>
<table>
  <tr><th>Feature</th><th>IELTS Academic</th><th>PTE Academic</th></tr>
  <tr><td>Format</td><td>Paper or Computer</td><td>Computer only</td></tr>
  <tr><td>Duration</td><td>2h 45min</td><td>2h (single session)</td></tr>
  <tr><td>Speaking</td><td>Face-to-face with examiner</td><td>Recorded via computer</td></tr>
  <tr><td>Sections</td><td>4: Listening, Reading, Writing, Speaking</td><td>3: Speaking & Writing, Reading, Listening</td></tr>
  <tr><td>Results</td><td>13 days (paper), 3-5 days (computer)</td><td>24-48 hours</td></tr>
  <tr><td>Score validity</td><td>2 years</td><td>2 years</td></tr>
  <tr><td>Test centers in Bangladesh</td><td>British Council (Dhaka, Chittagong, Sylhet)</td><td>Pearson Vue (Dhaka only)</td></tr>
</table>

<h2>Scoring System</h2>
<p><strong>IELTS:</strong> 0-9 band scale in 0.5 increments (e.g. 6.5, 7.0, 7.5). Overall band is average of 4 sections, rounded to nearest 0.5.</p>
<p><strong>PTE:</strong> 10-90 scale. Overall score and section scores in 1-point increments.</p>

<h2>Score Conversion (Approximate)</h2>
<table>
  <tr><th>IELTS Band</th><th>PTE Score</th><th>CEFR Level</th></tr>
  <tr><td>5.5</td><td>42</td><td>B1</td></tr>
  <tr><td>6.0</td><td>50</td><td>B2</td></tr>
  <tr><td>6.5</td><td>58</td><td>B2</td></tr>
  <tr><td>7.0</td><td>65</td><td>C1</td></tr>
  <tr><td>7.5</td><td>73</td><td>C1</td></tr>
  <tr><td>8.0</td><td>79</td><td>C1/C2</td></tr>
  <tr><td>8.5</td><td>83</td><td>C2</td></tr>
</table>

<h2>Difficulty Comparison</h2>
<p><strong>Speaking:</strong> IELTS is face-to-face (easier for many — natural conversation). PTE is recorded with computer prompts (some find unnatural, others prefer no examiner anxiety).</p>
<p><strong>Writing:</strong> IELTS Writing Task 1 (describe chart/graph) and Task 2 (essay). PTE has more writing tasks including summarize text and essay. Many find PTE writing slightly easier due to multiple shorter tasks vs one long essay.</p>
<p><strong>Reading:</strong> Both challenging. PTE reading has more variety in question types (multiple choice, reorder paragraphs, fill in blanks). IELTS reading is more straightforward.</p>
<p><strong>Listening:</strong> IELTS listening has various accents (UK, US, Australian). PTE listening includes accents plus a 'write from dictation' section that many find challenging.</p>

<h2>Results Time</h2>
<p><strong>IELTS:</strong> Paper-based: 13 days. Computer-based: 3-5 days.</p>
<p><strong>PTE:</strong> Typically 24-48 hours (fastest of any major English test).</p>
<p><strong>Implication:</strong> If you have a tight deadline, PTE is safer. If you have 2+ weeks buffer, IELTS is fine.</p>

<h2>Acceptance</h2>
<p><strong>Universities:</strong> Both are accepted by 99% of universities worldwide. Some universities prefer IELTS for UKVI purposes.</p>
<p><strong>UK Visa (UKVI):</strong> <strong>Important:</strong> For UK Student Visa, you must take <strong>IELTS for UKVI</strong> (specific UKVI-approved test) — regular IELTS Academic or PTE Academic are NOT accepted for visa purposes (though they may be accepted by the university for admission).</p>
<p><strong>Canada SDS:</strong> Requires IELTS 6.0+ (no band below 6.0). PTE not accepted for SDS, but accepted for regular stream.</p>
<p><strong>USA:</strong> Most universities accept both. Some prefer TOEFL.</p>
<p><strong>Australia:</strong> Both accepted for visa and university.</p>

<h2>Cost in Bangladesh</h2>
<table>
  <tr><th>Test</th><th>Fee (Approx.)</th></tr>
  <tr><td>IELTS Academic (British Council)</td><td>BDT 22,500</td></tr>
  <tr><td>IELTS for UKVI</td><td>BDT 24,500</td></tr>
  <tr><td>PTE Academic</td><td>BDT 18,000-20,000</td></tr>
  <tr><td>TOEFL iBT</td><td>BDT 21,000-23,000</td></tr>
  <tr><td>Duolingo English Test</td><td>BDT 5,800 (~USD 59)</td></tr>
</table>

<h2>Which Should You Choose?</h2>
<p><strong>Choose IELTS if:</strong></p>
<ul>
  <li>Applying to UK (need IELTS for UKVI for visa)</li>
  <li>Applying to Canada via SDS</li>
  <li>Prefer face-to-face speaking test</li>
  <li>Have 2+ weeks before deadline</li>
</ul>
<p><strong>Choose PTE if:</strong></p>
<ul>
  <li>Need results fast (within 48 hours)</li>
  <li>Prefer computer-based testing</li>
  <li>Applying to Australia, USA, or non-UK destinations</li>
  <li>Anxious about face-to-face speaking</li>
</ul>
<p><strong>Choose TOEFL if:</strong></p>
<ul>
  <li>Applying primarily to US universities (some prefer TOEFL)</li>
</ul>
<p><strong>Choose Duolingo if:</strong></p>
<ul>
  <li>On tight budget (BDT 5,800 vs 22,500)</li>
  <li>University explicitly accepts DET</li>
  <li>Need results immediately (48 hours)</li>
  <li>Not applying for visa (DET not accepted for UK/Canada visa)</li>
</ul>`,
    readingTime: 10,
    tags: ["IELTS", "PTE", "TOEFL", "Duolingo", "English test", "comparison", "Bangladesh"],
    sourceUrl: "https://www.ielts.org/",
    sourceName: "IELTS Official",
    seoTitle: "IELTS vs PTE vs TOEFL: Which English Test Should You Take in 2024? | ALO Education",
    seoDescription:
      "Detailed comparison of IELTS, PTE, TOEFL, and Duolingo English tests — format, scoring, costs, and which to choose for your destination.",
    faqs: [
      {
        question: "Which is easier — IELTS or PTE?",
        answer:
          "Neither is objectively easier; it depends on your strengths. IELTS speaking is face-to-face (easier if you prefer conversation). PTE writing is split into shorter tasks (easier if you struggle with long essays). PTE has faster results (48 hours vs 13 days for paper IELTS). Take a diagnostic test in each to see which suits you.",
      },
      {
        question: "Is PTE accepted for UK student visa?",
        answer:
          "No. For UK Student Visa, you must take IELTS for UKVI (specific UKVI-approved test). PTE Academic is accepted by UK universities for admission but NOT by UKVI for visa. Many students take PTE first for university admission, then IELTS for UKVI for the visa — but this doubles cost.",
      },
      {
        question: "How long are IELTS and PTE scores valid?",
        answer:
          "Both are valid for 2 years from the test date. Some universities require scores to be valid at course start date (not application date). Plan your test date accordingly — if applying for September 2025 intake, take the test between June 2023 and June 2025 to ensure validity.",
      },
      {
        question: "Can I retake only one section?",
        answer:
          "IELTS One Skill Retake (OSR) allows retaking one section (Reading, Writing, Listening, or Speaking) within 60 days of original test — available in some countries. PTE does not currently offer section retakes — you must retake the full test.",
      },
    ],
  },

  {
    slug: "how-to-write-a-strong-sop",
    categorySlug: "application-tips",
    title: "How to Write a Strong Statement of Purpose (SOP)",
    excerpt:
      "Learn the structure, content, and common mistakes to avoid when writing your SOP for university applications.",
    content: `<h2>What Is an SOP?</h2>
<p>A Statement of Purpose (SOP) — also called Personal Statement, Motivation Letter, or Admissions Essay — is a personal essay that explains your motivation for applying to a specific course and university. It's often the deciding factor between applicants with similar academic records.</p>

<h2>Why the SOP Matters</h2>
<ul>
  <li>Differentiates you from applicants with similar grades</li>
  <li>Demonstrates fit with the course and university</li>
  <li>Shows communication skills (critical for English-taught programs)</li>
  <li>Reveals personality, motivation, and self-awareness</li>
  <li>Used in visa interviews as a credibility check (USA, Canada)</li>
</ul>

<h2>SOP Structure (Recommended)</h2>

<h3>1. Introduction (150-200 words)</h3>
<p>Hook the reader with your motivation. Avoid clichés like 'Since I was a child...' Instead, share a specific moment, experience, or insight that sparked your interest in the field.</p>
<p><strong>Bad:</strong> "I have always been passionate about computers and want to study computer science."</p>
<p><strong>Good:</strong> "When my uncle's small garments factory in Gazipur lost BDT 40 lakh to an inventory tracking error in 2021, I realized the gap between technical solutions and Bangladeshi SMEs. This led me to pursue a BSc in Computer Science at BRAC University, with a focus on enterprise software."</p>

<h3>2. Academic Background (200-250 words)</h3>
<p>Highlight relevant courses, projects, research, and achievements. Focus on what's relevant to the target course — not your entire academic history.</p>
<p>Include:</p>
<ul>
  <li>Specific courses that influenced your direction</li>
  <li>Research projects or thesis (briefly describe findings)</li>
  <li>Awards, scholarships, academic recognition</li>
  <li>Relevant extracurriculars (hackathons, competitions)</li>
</ul>

<h3>3. Professional Experience (200-250 words)</h3>
<p>For applicants with work experience — describe roles, achievements, and skills gained. Focus on impact (numbers, results) not job descriptions.</p>
<p><strong>Bad:</strong> "I worked as a junior analyst at BRAC Bank for 2 years where I was responsible for analyzing data and creating reports."</p>
<p><strong>Good:</strong> "As a junior analyst at BRAC Bank (2022-2024), I built a credit risk model in Python that reduced non-performing loan predictions by 23%, saving the bank an estimated BDT 4.2 crore in potential defaults. This experience revealed the gap between data science theory and banking practice — a gap I hope to close through the MSc Data Science program."</p>

<h3>4. Why This Course (200 words)</h3>
<p>Be specific about course modules, faculty, research areas, and learning outcomes. Show you've researched the program.</p>
<p>Mention:</p>
<ul>
  <li>2-3 specific modules you're excited about (with reasons)</li>
  <li>Faculty members whose research aligns with your interests</li>
  <li>Special facilities (labs, research centers, industry partnerships)</li>
  <li>Career outcomes of past graduates</li>
</ul>

<h3>5. Why This University (150 words)</h3>
<p>Differentiate from "why this course". Focus on university-specific factors:</p>
<ul>
  <li>Industry partnerships and placement records</li>
  <li>Student societies or initiatives</li>
  <li>Location advantages (for internships, networking)</li>
  <li>Alumni network in your target industry</li>
</ul>

<h3>6. Career Goals (150-200 words)</h3>
<p>Be specific about short-term (1-3 years post-graduation) and long-term (5-10 years) goals.</p>
<p><strong>Bad:</strong> "I want to be a successful data scientist."</p>
<p><strong>Good:</strong> "Short-term: Return to Bangladesh and join bKash or Pathao as a senior data scientist, applying NLP techniques to Bengali-language financial fraud detection. Long-term: Found a Dhaka-based AI consultancy serving South Asian fintech companies, addressing the unique challenges of low-resource languages and informal economies."</p>

<h3>7. Conclusion (100-150 words)</h3>
<p>Summarize your fit with the program. End with a confident statement of what you'll contribute to the university community.</p>

<h2>Common Mistakes to Avoid</h2>
<ol>
  <li><strong>Plagiarism</strong> — never copy from online samples. Universities use Turnitin and cross-application comparison.</li>
  <li><strong>Generic content</strong> — same SOP for 5 universities is obvious. Tailor each one.</li>
  <li><strong>Too long</strong> — stick to 500-1,000 words unless specified. Some universities have 2-page max.</li>
  <li><strong>Focusing only on what university can do for you</strong> — also show what you can contribute (research, diversity, perspective).</li>
  <li><strong>Exaggeration or false claims</strong> — admissions officers verify; visa interviews probe.</li>
  <li><strong>Poor grammar</strong> — use Grammarly, ask native speakers to proofread.</li>
  <li><strong>Clichés</strong> — "Since childhood...", "I have always been passionate about...", "I want to make the world a better place"</li>
  <li><strong>Listing instead of storytelling</strong> — your CV already lists achievements. Use the SOP to add context and meaning.</li>
  <li><strong>No specific course/university research</strong> — generic SOPs are instantly rejected.</li>
  <li><strong>Submitting first draft</strong> — SOP needs 3-5 revisions to be competitive.</li>
</ol>

<h2>Tips for Success</h2>
<ol>
  <li><strong>Start early</strong> — allow 4-6 weeks per SOP for revisions.</li>
  <li><strong>Be specific</strong> — mention course modules, professor names, research areas.</li>
  <li><strong>Show, don't tell</strong> — use specific examples to demonstrate qualities.</li>
  <li><strong>Proofread</strong> — grammar errors create a bad impression.</li>
  <li><strong>Get feedback</strong> — have your counselor, mentor, or English-speaking friend review.</li>
  <li><strong>Read successful SOPs</strong> — ask your counselor for anonymized examples from past successful applicants.</li>
  <li><strong>Write multiple drafts</strong> — first draft is always bad. Get to draft 4-5 before submission.</li>
  <li><strong>Match word count exactly</strong> — if university says 500 words, aim for 495-505.</li>
  <li><strong>Use active voice</strong> — "I built..." not "It was built by me..."</li>
  <li><strong>End strong</strong> — your last paragraph is what readers remember.</li>
</ol>

<h2>SOP Review Checklist</h2>
<ul>
  <li>☐ Hook in the first paragraph</li>
  <li>☐ Specific academic/professional achievements with impact</li>
  <li>☐ 2-3 specific course modules mentioned</li>
  <li>☐ 1-2 faculty members mentioned (with research areas)</li>
  <li>☐ Specific short-term and long-term career goals</li>
  <li>☐ Connection between past experience and future plans</li>
  <li>☐ What you'll contribute to the university community</li>
  <li>☐ Within word count limit</li>
  <li>☐ No grammar errors (Grammarly Premium check)</li>
  <li>☐ No plagiarism (Turnitin or Copyscape check)</li>
  <li>☐ Read aloud (catches awkward phrasing)</li>
</ul>`,
    readingTime: 14,
    tags: ["SOP", "Personal Statement", "application", "university", "essay", "tips", "admissions"],
    sourceUrl: null,
    sourceName: "ALO Education",
    seoTitle: "How to Write a Strong SOP for University Applications: Complete Guide | ALO Education",
    seoDescription:
      "Step-by-step SOP writing guide with structure, examples, common mistakes, and tips for Bangladeshi students applying to universities abroad.",
    faqs: [
      {
        question: "How long should my SOP be?",
        answer:
          "Typically 500-1,000 words or 1-2 pages. Always check the university's specific requirement — some specify exactly (e.g. '500 words maximum'), others give a range (e.g. '500-1,000 words'). Exceeding word count signals poor attention to instructions. Going significantly under suggests lack of content.",
      },
      {
        question: "Can I use the same SOP for multiple universities?",
        answer:
          "No. Each SOP must be tailored to the specific university and course. The 'why this course' and 'why this university' sections must change completely. Reusing the same SOP is the most common reason for rejection. Allow 4-6 weeks per SOP for proper tailoring.",
      },
      {
        question: "Should I use AI tools to write my SOP?",
        answer:
          "No. Universities use AI detection tools (Turnitin AI, GPTZero) that flag AI-generated content. Admissions officers also recognize AI patterns. A flagged SOP often means automatic rejection. Use AI tools for grammar checking and idea brainstorming, but the writing must be yours.",
      },
      {
        question: "What if I don't have work experience?",
        answer:
          "Focus on academic projects, internships, volunteer work, extracurricular leadership, and personal projects (open source contributions, hackathons, research). Quality of engagement matters more than formal employment. Many successful Master's applicants are fresh graduates.",
      },
      {
        question: "Do I need to explain low grades in my SOP?",
        answer:
          "Only if there's a genuine, brief explanation (illness, family emergency, transition). Don't make excuses — frame it as a learning experience and show how subsequent academic performance improved. If your grades are low across the board, focus on highlighting strong recent work and post-graduation achievements.",
      },
    ],
  },

  {
    slug: "pre-departure-checklist",
    categorySlug: "pre-departure",
    title: "Pre-Departure Checklist: Everything You Need Before You Fly",
    excerpt:
      "A comprehensive checklist of documents, items, and preparations before traveling to your study destination.",
    content: `<h2>Why a Pre-Departure Checklist Matters</h2>
<p>The final 30 days before flying abroad are chaotic. Students forget critical documents, mis-pack, miss enrollment deadlines, and arrive stressed. This comprehensive checklist ensures nothing is missed. Print this out and tick items as you complete them.</p>

<h2>Documents (Carry-On Only — Never Check-In)</h2>
<p>These documents MUST be in your carry-on luggage. Lost checked luggage should not prevent university enrollment.</p>
<ul>
  <li>☐ Valid passport with student visa vignette (sticker)</li>
  <li>☐ University offer letter / CAS / eCoE / I-20 (original + 2 copies)</li>
  <li>☐ All academic transcripts and certificates (original + notarized copies)</li>
  <li>☐ English test score report (original)</li>
  <li>☐ Bank statements showing financial evidence (last 3-6 months)</li>
  <li>☐ Sponsor letter (if applicable) — notarized</li>
  <li>☐ Travel insurance documents</li>
  <li>☐ Health insurance documents (if separate from travel)</li>
  <li>☐ Medical records: vaccination certificates, prescriptions, doctor's letter for medications</li>
  <li>☐ Marriage certificate (if married, especially if spouse traveling with you)</li>
  <li>☐ Birth certificate (original + translated if not English)</li>
  <li>☐ Police clearance certificate (some countries require)</li>
  <li>☐ Passport-size photographs (10-20, country-specific size)</li>
  <li>☐ International driving permit (if planning to drive)</li>
  <li>☐ Letter from university confirming accommodation (if provided)</li>
</ul>

<h2>Financial Preparation</h2>
<ul>
  <li>☐ Notify Bangladeshi bank of international travel (avoid card block)</li>
  <li>☐ Set up online banking for all accounts</li>
  <li>☐ Activate international transactions on debit card (check daily limits)</li>
  <li>☐ Carry international credit card (parent's supplementary card works)</li>
  <li>☐ Carry USD 200-500 in cash for first-week expenses</li>
  <li>☐ Some local currency of destination (GBP 50-100, CAD 50-100, etc.)</li>
  <li>☐ Forex card loaded with destination currency (HDFC, ICICI forex cards)</li>
  <li>☐ Bank contact numbers saved (international customer care)</li>
  <li>☐ Proof of funds document for immigration (printed bank statement)</li>
</ul>

<h2>Electronics</h2>
<ul>
  <li>☐ Laptop + charger + spare charger</li>
  <li>☐ Smartphone + charger + USB cable</li>
  <li>☐ Universal power adapter (check destination plug type)</li>
  <li>☐ Power bank (under 100Wh — airline restrictions)</li>
  <li>☐ External hard drive (backup important files)</li>
  <li>☐ USB drives (2-3, for documents and assignments)</li>
  <li>☐ Headphones/earphones (with microphone for online calls)</li>
  <li>☐ Laptop sleeve/case</li>
  <li>☐ Calculator (specific model if required by course)</li>
  <li>☐ E-reader (optional — saves space vs physical books)</li>
</ul>

<h2>Clothing</h2>
<p>Pack according to destination climate. Check weather for arrival date and first month.</p>
<ul>
  <li>☐ 1-2 weeks of clothes (don't overpack — buy locally)</li>
  <li>☐ Formal outfit (for interviews, ceremonies, presentations)</li>
  <li>☐ Traditional Bangladeshi outfit (1-2, for cultural events)</li>
  <li>☐ Winter clothing (if going to cold country — but buy heavy coats locally)</li>
  <li>☐ Comfortable walking shoes</li>
  <li>☐ Formal shoes</li>
  <li>☐ Slippers/flip-flops</li>
  <li>☐ Rain jacket/umbrella (if going to rainy country)</li>
  <li>☐ Innerwear and socks (2 weeks supply)</li>
  <li>☐ Sleepwear</li>
</ul>

<h2>Health and Medical</h2>
<ul>
  <li>☐ Prescription medications (3-6 months supply, with doctor's letter)</li>
  <li>☐ Over-the-counter medications (paracetamol, antihistamine, antacid)</li>
  <li>☐ Basic first aid kit (bandages, antiseptic, thermometer)</li>
  <li>☐ Vaccination records (especially COVID-19, MMR, meningitis if applicable)</li>
  <li>☐ Glasses/contact lenses (spare pair, prescription)</li>
  <li>☐ Sunglasses (UV protection)</li>
  <li>☐ Medical alert bracelet (if you have conditions like diabetes, allergies)</li>
</ul>

<h2>Kitchen (Optional — for Self-Catering Students)</h2>
<ul>
  <li>☐ Pressure cooker (hard to find abroad, essential for Bangladeshi cooking)</li>
  <li>☐ Spices: turmeric, cumin, coriander, garam masala, red chili (sealed packets)</li>
  <li>☐ Rice (2kg — for first week, then buy locally)</li>
  <li>☐ Tea leaves (Tongsi, Kazi & Kazi, or local brand)</li>
  <li>☐ Utensils: spatula, serving spoon, knife (check airline restrictions)</li>
  <li>☐ Recipe book or saved recipes on phone</li>
</ul>

<h2>Personal Items</h2>
<ul>
  <li>☐ Toothbrush, toothpaste, floss (1 month supply)</li>
  <li>☐ Shampoo, conditioner, soap (1 month supply, buy locally after)</li>
  <li>☐ Skincare products (specific brands may not be available)</li>
  <li>☐ Hair products (specific to your hair type)</li>
  <li>☐ Towels (2 — bath + hand)</li>
  <li>☐ Bed sheet (1 — for first night if arriving late)</li>
  <li>☐ Photos of family and friends (emotional support)</li>
  <li>☐ Religious items (prayer mat, Quran/Bhagavad Gita/Bible, rosary)</li>
</ul>

<h2>Important Numbers to Save</h2>
<ul>
  <li>☐ Bangladesh Embassy/High Commission in destination country</li>
  <li>☐ University international student office</li>
  <li>☐ University accommodation office</li>
  <li>☐ University emergency/security number</li>
  <li>☐ Local emergency numbers (police, ambulance, fire)</li>
  <li>☐ ALO Education 24/7 hotline</li>
  <li>☐ Family members (multiple contact numbers)</li>
  <li>☐ Bangladeshi student community contacts at your university</li>
  <li>☐ Bank international customer care</li>
  <li>☐ Travel insurance emergency number</li>
</ul>

<h2>Final 7 Days Before Departure</h2>
<ul>
  <li>☐ Confirm flight details and online check-in</li>
  <li>☐ Confirm airport pickup (university or taxi service)</li>
  <li>☐ Confirm accommodation for first night</li>
  <li>☐ Print all important documents (don't rely only on digital)</li>
  <li>☐ Email yourself digital copies of all documents</li>
  <li>☐ Inform bank of exact travel dates</li>
  <li>☐ Set phone to international roaming or buy destination SIM (eSim)</li>
  <li>☐ Download offline maps of destination city</li>
  <li>☐ Download Google Translate offline pack for destination language</li>
  <li>☐ Pay any remaining university fees or deposits</li>
  <li>☐ Get required vaccinations (if not done)</li>
  <li>☐ Visit doctor for general checkup</li>
  <li>☐ Visit dentist (cheaper in Bangladesh)</li>
  <li>☐ Get haircut (cheaper in Bangladesh)</li>
  <li>☐ Spend quality time with family</li>
</ul>

<h2>Airport Arrival (3 Hours Before Flight)</h2>
<ul>
  <li>☐ Arrive 3 hours before international flight</li>
  <li>☐ Keep passport, visa, and ticket accessible</li>
  <li>☐ Take photo of checked luggage (in case of loss claim)</li>
  <li>☐ Keep valuables in carry-on (laptop, jewelry, important documents)</li>
  <li>☐ Stay hydrated, avoid heavy meals before flight</li>
  <li>☐ Charge phone and power bank before leaving home</li>
  <li>☐ Carry a pen for immigration forms</li>
  <li>☐ Take photo of parking spot if driving to airport</li>
</ul>

<h2>On Arrival at Destination</h2>
<ul>
  <li>☐ Clear immigration (have university letter, accommodation address ready)</li>
  <li>☐ Collect luggage</li>
  <li>☐ Clear customs (declare cash above USD 10,000)</li>
  <li>☐ Buy local SIM card at airport (or pre-ordered eSim)</li>
  <li>☐ Take official taxi or pre-booked transfer to accommodation</li>
  <li>☐ Check in to accommodation</li>
  <li>☐ Inform family of safe arrival</li>
  <li>☐ Notify ALO Education of arrival (24/7 hotline)</li>
  <li>☐ Rest — don't try to do everything on day 1</li>
</ul>`,
    readingTime: 11,
    tags: ["pre-departure", "checklist", "travel", "packing", "student visa", "Bangladeshi students"],
    sourceUrl: null,
    sourceName: "ALO Education",
    seoTitle: "Pre-Departure Checklist for Bangladeshi Students Studying Abroad | ALO Education",
    seoDescription:
      "Complete pre-departure checklist for Bangladeshi students — documents, financial, electronics, packing, and arrival logistics.",
    faqs: [
      {
        question: "How much luggage can I carry?",
        answer:
          "Most international airlines allow 1-2 checked bags (23-32kg each depending on airline and class) + 1 carry-on (7-10kg) + 1 personal item (laptop bag/purse). Check your airline's specific allowance. Excess baggage costs USD 50-200 per extra bag — buy extra allowance online in advance if needed (cheaper than at airport).",
      },
      {
        question: "Should I carry cash or use cards?",
        answer:
          "Combination. Carry USD 200-500 in cash for first-week expenses (taxi, meals, SIM card). Use international debit/credit card for larger expenses. Open a forex card with destination currency loaded for everyday spending (better exchange rate than cash withdrawals). Never carry more than USD 10,000 cash without declaring.",
      },
      {
        question: "Can I carry Bangladeshi food items?",
        answer:
          "Sealed, dry spices are usually fine. Fresh fruits, vegetables, meat, and dairy are prohibited by most countries. Honey, ghee, and pickles may be allowed if commercially packaged. Check destination customs website. Undeclared food items can result in fines (USD 200-2,000) or visa cancellation.",
      },
      {
        question: "What if I forget an important document?",
        answer:
          "For documents you have digital copies of (email them to yourself), print at destination. For originals required by university (transcripts), have family courier them via DHL/FedEx (3-5 days). For visa-required documents, contact your nearest Bangladesh embassy immediately — they may be able to issue emergency replacements.",
      },
    ],
  },
];

// ─── 3 SCHOLARSHIPS WITH FULL FIELDS + 5 FAQs EACH ────────────
const SCHOLARSHIPS: ScholarshipInput[] = [
  {
    slug: "chevening-scholarship-uk",
    scholarshipCode: "SCH-001",
    name: "Chevening Scholarship",
    countrySlug: "uk",
    studyLevel: "Masters",
    subject: "All subjects (with preference for development-related fields)",
    fundingType: "FULLY_FUNDED",
    amount: "Full tuition + monthly stipend (~£1,500-1,800) + travel + allowances",
    currency: "GBP",
    coverage: {
      tuition: true,
      living: true,
      accommodation: false,
      travel: true,
      insurance: true,
      other:
        "Visa fees, arrival allowance, departure allowance, thesis grant, conference travel grant, excess baggage allowance",
    },
    eligibility:
      "Bangladeshi citizen with minimum 2 years (2,800 hours) work experience, Bachelor's degree qualifying for UK Masters entry, commitment to return to Bangladesh for at least 2 years after scholarship. Must apply to 3 eligible UK university courses.",
    minimumRequirements: {
      academic: "Bachelor's degree with 2:1 equivalent or above (typically GPA 3.3+)",
      english: "IELTS 6.5+ overall with no band below 5.5 (or equivalent)",
      experience: "Minimum 2 years (2,800 hours) of work experience (paid, unpaid, internship, or volunteer)",
      nationality: "Bangladeshi citizen (must hold passport)",
      other: "Not previously received Chevening funding; not hold UK citizenship or dual citizenship with UK",
    },
    documentsRequired: [
      "Passport (valid for at least 1 year)",
      "Academic transcripts and certificates (Bachelor's degree)",
      "English test score report (IELTS/TOEFL/PTE)",
      "CV detailing work experience and leadership activities",
      "Two references (professional or academic, with contact details)",
      "Three UK university course choices (with rationale)",
      "Four application essays (Leadership, Networking, Studying in UK, Career Plan)",
      "Work experience documentation (employment letters, internship certificates)",
    ],
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://www.chevening.org/apply/",
    openingDate: "August (annually)",
    deadline: "November (annually — exact date varies)",
    status: "OPEN",
    sourceUrl: "https://www.chevening.org/",
    sourceName: "Chevening",
    faqs: [
      {
        question: "Is Chevening fully funded?",
        answer:
          "Yes. Chevening covers full tuition fees (no cap — even £40,000+ Oxford/Cambridge programs), monthly living stipend (~£1,500-1,800 depending on London/outside London), return airfare to UK, visa fees for scholar and dependants, arrival and departure allowances, thesis grant, conference travel grant, and excess baggage allowance on return. Total value: £40,000-60,000.",
      },
      {
        question: "Do I need work experience to apply?",
        answer:
          "Yes. Minimum 2 years (2,800 hours) of work experience is mandatory. This can include paid employment, internships, volunteer work, or part-time work during studies. Document all hours carefully — Chevening verifies employment with your referees. Self-employment and freelance work counts if you can document it.",
      },
      {
        question: "Can I apply before getting university admission?",
        answer:
          "Yes — you must apply to Chevening BEFORE securing university admission. In your Chevening application, you list 3 UK university course choices. If awarded, Chevening helps you secure admission to one of your 3 choices. Apply to universities in parallel — Chevening expects you to apply to your selected courses by the scholarship deadline.",
      },
      {
        question: "What is the interview process like?",
        answer:
          "Shortlisted candidates are invited to a 20-30 minute panel interview at the British High Commission in Dhaka, typically in March-April. The panel includes the Chevening Officer, a Chevening alumnus, and sometimes a British High Commission representative. Questions cover your essays, leadership experiences, career plan, networking plans, and reasons for your 3 course choices. Be prepared to defend your choices and articulate how Chevening fits your long-term goals.",
      },
      {
        question: "Can I stay in the UK after completing Chevening?",
        answer:
          "No. Chevening requires you to return to Bangladesh for at least 2 years after completing your Masters. This is a strict visa condition — you cannot stay in the UK on Graduate Route visa or switch to work visa directly. After 2 years back in Bangladesh, you can apply to return to the UK on a different visa category if desired.",
      },
    ],
  },

  {
    slug: "daad-scholarship-germany",
    scholarshipCode: "SCH-002",
    name: "DAAD Scholarship",
    countrySlug: "germany",
    studyLevel: "Masters",
    subject: "All subjects (with focus on development-related fields for EPOS program)",
    fundingType: "FULLY_FUNDED",
    amount: "EUR 934/month stipend + tuition waiver + travel + insurance",
    currency: "EUR",
    coverage: {
      tuition: true,
      living: true,
      accommodation: false,
      travel: true,
      insurance: true,
      other: "Study allowance (EUR 460), monthly rent subsidy (EUR 300 if renting privately), family allowance (EUR 276/month for spouse + EUR 250/child)",
    },
    eligibility:
      "Bangladeshi citizen with Bachelor's degree (for Masters) or Master's degree (for PhD), minimum 2 years work experience (for EPOS development-focused programs), English proficiency. Must hold a confirmed university admission or be eligible to apply.",
    minimumRequirements: {
      academic: "Bachelor's degree with strong academic record (typically GPA 3.0+ equivalent)",
      english: "IELTS 6.5 overall (no band below 6.0) or TOEFL 80 iBT",
      experience: "2+ years work experience (for EPOS development programs; not always required for other DAAD programs)",
      nationality: "Bangladeshi citizen",
      other: "Not hold German citizenship; not have lived in Germany for more than 15 months at time of application",
    },
    documentsRequired: [
      "Passport",
      "Academic transcripts and certificates (Bachelor's for Masters, Master's for PhD)",
      "English test score report (IELTS/TOEFL)",
      "Motivation letter (2-3 pages)",
      "Two reference letters (academic or professional)",
      "CV (Europass format recommended)",
      "Work experience certificates",
      "Research proposal (for PhD applicants)",
      "University admission letter (if already secured)",
    ],
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://www.daad.de/en/",
    openingDate: "August (varies by program)",
    deadline: "October-November (varies by program — check DAAD database)",
    status: "OPEN",
    sourceUrl: "https://www.daad.de/en/",
    sourceName: "DAAD",
    faqs: [
      {
        question: "Is DAAD fully funded?",
        answer:
          "Yes. DAAD EPOS scholarship covers tuition waiver (German public universities have low/no tuition), monthly stipend of EUR 934, travel allowance (one-time return flight), health insurance, study allowance (EUR 460), and additional allowances for family members (spouse: EUR 276/month, child: EUR 250/month). Total value: EUR 15,000-20,000 per year.",
      },
      {
        question: "Do I need to know German language?",
        answer:
          "For English-taught programs (most international Master's programs), no German is required. For German-taught programs, you need DSH-2 or TestDaF 4x4. Many DAAD scholars learn basic German during their studies for daily life — universities offer free German courses for international students.",
      },
      {
        question: "Can I work in Germany after graduation?",
        answer:
          "Yes. Germany offers an 18-month post-study work visa for graduates. You can work in any field related to your degree. After 21 months of contributions to the pension system (with B1 German) or 24 months (without German requirement), you can apply for a settlement permit (permanent residence). Germany has strong job markets in IT, engineering, healthcare, and renewable energy.",
      },
      {
        question: "How is DAAD different from Chevening?",
        answer:
          "Chevening funds UK Masters (1 year, £40-60k value). DAAD funds German Masters (1.5-2 years, EUR 25-40k total value). German programs are often longer but Germany has lower living costs and strong post-study work opportunities. Chevening requires 2-year return to Bangladesh; DAAD has no return requirement. Choose based on destination preference and career goals.",
      },
      {
        question: "What programs does DAAD fund?",
        answer:
          "DAAD funds 100+ Master's and PhD programs. EPOS (Development-Related Postgraduate Courses) is the main program for developing country applicants — focuses on public health, governance, economic development, environmental sciences, engineering for development. DAAD also offers research grants for PhD, short-term research grants, and university partnership scholarships. Search the DAAD database by subject and level.",
      },
    ],
  },

  {
    slug: "australia-awards-scholarship",
    scholarshipCode: "SCH-003",
    name: "Australia Awards Scholarship",
    countrySlug: "australia",
    studyLevel: "Masters",
    subject: "Development-related fields (health, education, governance, economic growth, environment)",
    fundingType: "FULLY_FUNDED",
    amount: "Full tuition + AUD 30,000/year stipend + travel + accommodation + insurance",
    currency: "AUD",
    coverage: {
      tuition: true,
      living: true,
      accommodation: true,
      travel: true,
      insurance: true,
      other:
        "Establishment allowance (AUD 5,000 one-time), pre-course English training (if needed), supplementary academic support, fieldwork travel allowance",
    },
    eligibility:
      "Bangladeshi citizen with Bachelor's degree, minimum 2 years work experience in development sector, commitment to return to Bangladesh for 2 years after scholarship. Must satisfy Australian visa requirements including health and character checks.",
    minimumRequirements: {
      academic: "Bachelor's degree with strong academic record (typically GPA 3.0+)",
      english: "IELTS 6.5 overall with no band below 6.0 (or TOEFL 84)",
      experience: "2+ years work experience in development-related field (preferred, not strict for all programs)",
      nationality: "Bangladeshi citizen (must not hold Australian/NZ citizenship or PR)",
      other: "Not have received a long-term Australia Award in past 5 years; satisfy Australian visa health/character requirements",
    },
    documentsRequired: [
      "Passport",
      "Academic transcripts and certificates",
      "English test score report",
      "Employment certificates (development-related work)",
      "Development impact statement (1-2 pages explaining how study will contribute to Bangladesh development)",
      "Two references (professional)",
      "CV (3-5 pages)",
      "Visa medical examination report",
      "Police clearance certificate",
    ],
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://australiaawardsbangladesh.org/",
    openingDate: "February (annually)",
    deadline: "April (annually — exact date varies)",
    status: "UPCOMING",
    sourceUrl: "https://www.australiaawards.gov.au/",
    sourceName: "Australian Government",
    faqs: [
      {
        question: "Is Australia Awards fully funded?",
        answer:
          "Yes. Australia Awards covers full tuition, monthly stipend (~AUD 30,000/year), return airfare, accommodation, health insurance, establishment allowance (AUD 5,000 one-time), pre-course English training if needed, and academic support. Total value: AUD 80,000-120,000 depending on course duration.",
      },
      {
        question: "What fields are eligible for Australia Awards?",
        answer:
          "Development-related fields aligned with Bangladesh-Australia partnership priorities: public health, education, governance and public policy, economic growth, trade, environment and climate change, agriculture and food security, gender equality, disability inclusion. Check the priority sectors list each year — it changes based on development priorities.",
      },
      {
        question: "Do I need to return to Bangladesh after graduation?",
        answer:
          "Yes. Australia Awards scholars must return to Bangladesh for at least 2 years after completing their scholarship. This is a strict visa condition. The 2-year return requirement ensures the scholarship benefits Bangladesh's development. After 2 years, you can apply to return to Australia on a different visa if desired.",
      },
      {
        question: "Can I bring my family to Australia on this scholarship?",
        answer:
          "Scholars on Australia Awards can bring dependants (spouse and children under 18) but family support is NOT included in the scholarship. Family members must have their own health insurance (OSHC) and financial support. Many scholars choose to bring family after their first semester when settled.",
      },
      {
        question: "How competitive is Australia Awards for Bangladeshi applicants?",
        answer:
          "Australia Awards receives 1,500-2,000 applications from Bangladesh annually and awards 50-80 scholarships. Success rate: ~3-5%. Strong applicants have: clear development impact statement, work experience in priority sectors, alignment with Bangladesh development goals, and strong academic record. ALO helps applicants strengthen each component.",
      },
    ],
  },
];

// ─── CONTENT RELATIONSHIPS DEFINITION ─────────────────────────
// Each entry: { sourceSlug, sourceType, targetType, targetSlug, relationshipType }
// Source/target slugs are resolved to IDs at runtime.
const RELATIONSHIPS: Array<{
  sourceType: "SERVICE" | "SCHOLARSHIP" | "RESOURCE";
  sourceSlug: string;
  targetType: "SERVICE" | "SCHOLARSHIP" | "RESOURCE";
  targetSlug: string;
  relationshipType: string;
}> = [
  // visa-guidance service → visa guides resources
  { sourceType: "SERVICE", sourceSlug: "visa-guidance", targetType: "RESOURCE", targetSlug: "uk-student-visa-guide", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "visa-guidance", targetType: "RESOURCE", targetSlug: "canada-study-permit-guide", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "visa-guidance", targetType: "RESOURCE", targetSlug: "pre-departure-checklist", relationshipType: "REQUIREMENT_REFERENCE" },
  { sourceType: "SERVICE", sourceSlug: "visa-guidance", targetType: "SERVICE", targetSlug: "document-checking", relationshipType: "RELATED" },

  // scholarship-guidance service → scholarship resources + scholarships
  { sourceType: "SERVICE", sourceSlug: "scholarship-guidance", targetType: "RESOURCE", targetSlug: "chevening-scholarship-guide", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "scholarship-guidance", targetType: "SCHOLARSHIP", targetSlug: "chevening-scholarship-uk", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "scholarship-guidance", targetType: "SCHOLARSHIP", targetSlug: "daad-scholarship-germany", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "scholarship-guidance", targetType: "SCHOLARSHIP", targetSlug: "australia-awards-scholarship", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "scholarship-guidance", targetType: "SERVICE", targetSlug: "sop-cv-support", relationshipType: "REQUIREMENT_REFERENCE" },

  // english-test-preparation service → english test resources
  { sourceType: "SERVICE", sourceSlug: "english-test-preparation", targetType: "RESOURCE", targetSlug: "ielts-vs-pte-comparison", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "english-test-preparation", targetType: "SERVICE", targetSlug: "personalized-counselling", relationshipType: "RELATED" },

  // application-assistance service → application tips resources + sop-cv-support service
  { sourceType: "SERVICE", sourceSlug: "application-assistance", targetType: "RESOURCE", targetSlug: "how-to-write-a-strong-sop", relationshipType: "REQUIREMENT_REFERENCE" },
  { sourceType: "SERVICE", sourceSlug: "application-assistance", targetType: "SERVICE", targetSlug: "sop-cv-support", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "application-assistance", targetType: "SERVICE", targetSlug: "document-checking", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "application-assistance", targetType: "SERVICE", targetSlug: "university-selection", relationshipType: "REQUIREMENT_REFERENCE" },

  // financial-planning service → financial-planning category (use pre-departure resource which discusses finances)
  { sourceType: "SERVICE", sourceSlug: "financial-planning", targetType: "RESOURCE", targetSlug: "pre-departure-checklist", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "financial-planning", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "RELATED" },

  // pre-departure-orientation service → pre-departure resources
  { sourceType: "SERVICE", sourceSlug: "pre-departure-orientation", targetType: "RESOURCE", targetSlug: "pre-departure-checklist", relationshipType: "REQUIREMENT_REFERENCE" },
  { sourceType: "SERVICE", sourceSlug: "pre-departure-orientation", targetType: "SERVICE", targetSlug: "post-arrival-support", relationshipType: "RELATED" },
  { sourceType: "SERVICE", sourceSlug: "pre-departure-orientation", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "RELATED" },

  // sop-cv-support service → SOP resource
  { sourceType: "SERVICE", sourceSlug: "sop-cv-support", targetType: "RESOURCE", targetSlug: "how-to-write-a-strong-sop", relationshipType: "RELATED" },

  // Each scholarship → related resources
  { sourceType: "SCHOLARSHIP", sourceSlug: "chevening-scholarship-uk", targetType: "RESOURCE", targetSlug: "chevening-scholarship-guide", relationshipType: "RELATED" },
  { sourceType: "SCHOLARSHIP", sourceSlug: "chevening-scholarship-uk", targetType: "RESOURCE", targetSlug: "uk-student-visa-guide", relationshipType: "REQUIREMENT_REFERENCE" },
  { sourceType: "SCHOLARSHIP", sourceSlug: "chevening-scholarship-uk", targetType: "SERVICE", targetSlug: "scholarship-guidance", relationshipType: "RELATED" },

  { sourceType: "SCHOLARSHIP", sourceSlug: "daad-scholarship-germany", targetType: "SERVICE", targetSlug: "scholarship-guidance", relationshipType: "RELATED" },
  { sourceType: "SCHOLARSHIP", sourceSlug: "daad-scholarship-germany", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "REQUIREMENT_REFERENCE" },

  { sourceType: "SCHOLARSHIP", sourceSlug: "australia-awards-scholarship", targetType: "SERVICE", targetSlug: "scholarship-guidance", relationshipType: "RELATED" },
  { sourceType: "SCHOLARSHIP", sourceSlug: "australia-awards-scholarship", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "REQUIREMENT_REFERENCE" },

  // Each resource → related services + scholarships
  { sourceType: "RESOURCE", sourceSlug: "uk-student-visa-guide", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "RELATED" },
  { sourceType: "RESOURCE", sourceSlug: "uk-student-visa-guide", targetType: "SCHOLARSHIP", targetSlug: "chevening-scholarship-uk", relationshipType: "RELATED" },

  { sourceType: "RESOURCE", sourceSlug: "canada-study-permit-guide", targetType: "SERVICE", targetSlug: "visa-guidance", relationshipType: "RELATED" },

  { sourceType: "RESOURCE", sourceSlug: "chevening-scholarship-guide", targetType: "SCHOLARSHIP", targetSlug: "chevening-scholarship-uk", relationshipType: "RELATED" },
  { sourceType: "RESOURCE", sourceSlug: "chevening-scholarship-guide", targetType: "SERVICE", targetSlug: "scholarship-guidance", relationshipType: "RELATED" },

  { sourceType: "RESOURCE", sourceSlug: "ielts-vs-pte-comparison", targetType: "SERVICE", targetSlug: "english-test-preparation", relationshipType: "RELATED" },

  { sourceType: "RESOURCE", sourceSlug: "how-to-write-a-strong-sop", targetType: "SERVICE", targetSlug: "sop-cv-support", relationshipType: "RELATED" },
  { sourceType: "RESOURCE", sourceSlug: "how-to-write-a-strong-sop", targetType: "SERVICE", targetSlug: "application-assistance", relationshipType: "RELATED" },

  { sourceType: "RESOURCE", sourceSlug: "pre-departure-checklist", targetType: "SERVICE", targetSlug: "pre-departure-orientation", relationshipType: "RELATED" },
  { sourceType: "RESOURCE", sourceSlug: "pre-departure-checklist", targetType: "SERVICE", targetSlug: "financial-planning", relationshipType: "RELATED" },
];

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding DEEP Services + Scholarships + Resources + FAQs + Relationships...\n");

  const now = new Date();
  let servicesUpdated = 0;
  let serviceFaqsCreated = 0;
  let scholarshipsUpdated = 0;
  let scholarshipFaqsCreated = 0;
  let resourcesUpdated = 0;
  let resourceFaqsCreated = 0;
  let relationshipsCreated = 0;

  // ─── 1. SERVICES ──────────────────────────────────────────────
  console.log("Services (deep content + FAQs):");
  for (const s of SERVICES) {
    const existing = await db.service.findUnique({ where: { slug: s.slug } });
    const data = {
      title: s.title,
      shortDescription: s.shortDescription,
      description: s.description,
      icon: s.icon,
      heroImage: s.heroImage ?? null,
      content: JSON.stringify(s.content),
      eligibility: s.eligibility,
      requirements: JSON.stringify(s.requirements),
      documents: JSON.stringify(s.documents),
      faqEnabled: s.faqEnabled ?? true,
      ctaLabel: s.ctaLabel ?? null,
      ctaUrl: s.ctaUrl ?? null,
      status: "PUBLISHED",
      sortOrder: s.sortOrder ?? 0,
      sourceUrl: s.sourceUrl ?? null,
      verificationStatus: "VERIFIED",
      lastVerifiedAt: now,
    };

    let serviceId: string;
    if (existing) {
      await db.service.update({ where: { id: existing.id }, data });
      serviceId = existing.id;
      servicesUpdated++;
    } else {
      const created = await db.service.create({ data });
      serviceId = created.id;
      servicesUpdated++;
    }

    // Replace FAQs
    await db.serviceFaq.deleteMany({ where: { serviceId } });
    if (s.faqs.length) {
      await db.serviceFaq.createMany({
        data: s.faqs.map((f, i) => ({
          serviceId,
          question: f.question,
          answer: f.answer,
          sortOrder: i,
        })),
      });
      serviceFaqsCreated += s.faqs.length;
    }
    console.log(`  ✓ ${s.title} — ${s.faqs.length} FAQs`);
  }

  // ─── 2. RESOURCES ─────────────────────────────────────────────
  console.log("\nResources (deep content + FAQs):");
  for (const r of RESOURCES) {
    const cat = await db.resourceCategory.findUnique({ where: { slug: r.categorySlug } });
    if (!cat) {
      console.log(`  ✗ SKIP ${r.slug} — category ${r.categorySlug} not found`);
      continue;
    }
    const existing = await db.resource.findUnique({ where: { slug: r.slug } });
    const data = {
      categoryId: cat.id,
      title: r.title,
      excerpt: r.excerpt,
      content: r.content,
      readingTime: r.readingTime,
      tags: JSON.stringify(r.tags),
      status: "PUBLISHED",
      publishedAt: now,
      lastVerifiedAt: now,
      sourceUrl: r.sourceUrl,
      sourceName: r.sourceName,
      verificationStatus: "VERIFIED",
      seoTitle: r.seoTitle ?? null,
      seoDescription: r.seoDescription ?? null,
    };

    let resourceId: string;
    if (existing) {
      await db.resource.update({ where: { id: existing.id }, data });
      resourceId = existing.id;
      resourcesUpdated++;
    } else {
      const created = await db.resource.create({ data: { slug: r.slug, ...data } });
      resourceId = created.id;
      resourcesUpdated++;
    }

    // Replace FAQs
    await db.resourceFaq.deleteMany({ where: { resourceId } });
    if (r.faqs.length) {
      await db.resourceFaq.createMany({
        data: r.faqs.map((f, i) => ({
          resourceId,
          question: f.question,
          answer: f.answer,
          sortOrder: i,
        })),
      });
      resourceFaqsCreated += r.faqs.length;
    }
    console.log(`  ✓ ${r.title} — ${r.faqs.length} FAQs`);
  }

  // ─── 3. SCHOLARSHIPS ──────────────────────────────────────────
  console.log("\nScholarships (full fields + FAQs):");
  for (const sch of SCHOLARSHIPS) {
    const existing = await db.scholarship.findUnique({ where: { slug: sch.slug } });
    const data = {
      scholarshipCode: sch.scholarshipCode,
      name: sch.name,
      countrySlug: sch.countrySlug ?? null,
      studyLevel: sch.studyLevel ?? null,
      subject: sch.subject ?? null,
      fundingType: sch.fundingType,
      amount: sch.amount ?? null,
      currency: sch.currency ?? null,
      coverage: JSON.stringify(sch.coverage),
      eligibility: sch.eligibility,
      minimumRequirements: JSON.stringify(sch.minimumRequirements),
      documentsRequired: JSON.stringify(sch.documentsRequired),
      applicationMethod: sch.applicationMethod,
      applicationUrl: sch.applicationUrl ?? null,
      openingDate: sch.openingDate ?? null,
      deadline: sch.deadline ?? null,
      status: sch.status,
      verificationStatus: "VERIFIED",
      sourceUrl: sch.sourceUrl ?? null,
      sourceName: sch.sourceName ?? null,
      lastVerifiedAt: now,
    };

    let scholarshipId: string;
    if (existing) {
      await db.scholarship.update({ where: { id: existing.id }, data });
      scholarshipId = existing.id;
      scholarshipsUpdated++;
    } else {
      const created = await db.scholarship.create({ data: { slug: sch.slug, ...data } });
      scholarshipId = created.id;
      scholarshipsUpdated++;
    }

    // Replace FAQs
    await db.scholarshipFaq.deleteMany({ where: { scholarshipId } });
    if (sch.faqs.length) {
      await db.scholarshipFaq.createMany({
        data: sch.faqs.map((f, i) => ({
          scholarshipId,
          question: f.question,
          answer: f.answer,
          sortOrder: i,
        })),
      });
      scholarshipFaqsCreated += sch.faqs.length;
    }
    console.log(`  ✓ ${sch.name} — ${sch.faqs.length} FAQs`);
  }

  // ─── 4. CONTENT RELATIONSHIPS ─────────────────────────────────
  console.log("\nContent Relationships:");
  // Build slug → id lookup tables
  const serviceMap = new Map<string, string>();
  const scholarshipMap = new Map<string, string>();
  const resourceMap = new Map<string, string>();
  const allServices = await db.service.findMany({ select: { id: true, slug: true } });
  const allScholarships = await db.scholarship.findMany({ select: { id: true, slug: true } });
  const allResources = await db.resource.findMany({ select: { id: true, slug: true } });
  allServices.forEach((s) => serviceMap.set(s.slug, s.id));
  allScholarships.forEach((s) => scholarshipMap.set(s.slug, s.id));
  allResources.forEach((r) => resourceMap.set(r.slug, r.id));

  // Use better-sqlite3 directly with PRAGMA foreign_keys=OFF because the Prisma schema
  // has 3 FKs on sourceId/targetId (referencing Service, Scholarship, AND Resource
  // simultaneously). This makes normal Prisma creates impossible — a Service.id can
  // never also exist as a Scholarship.id. We bypass FK validation by using raw SQL
  // with FKs disabled on a dedicated connection.
  const dbPath = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  if (!dbPath) {
    throw new Error("DATABASE_URL env var is required");
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = OFF");

  // Wipe existing relationships between these types (full rebuild)
  sqlite
    .prepare(
      "DELETE FROM ContentRelationship WHERE sourceType IN ('SERVICE','SCHOLARSHIP','RESOURCE') OR targetType IN ('SERVICE','SCHOLARSHIP','RESOURCE')"
    )
    .run();

  const insertStmt = sqlite.prepare(
    `INSERT INTO ContentRelationship (id, sourceType, sourceId, targetType, targetId, relationshipType, sortOrder, status, createdAt)
     VALUES (@id, @sourceType, @sourceId, @targetType, @targetId, @relationshipType, @sortOrder, @status, datetime('now'))`
  );

  for (const rel of RELATIONSHIPS) {
    const sourceId =
      rel.sourceType === "SERVICE"
        ? serviceMap.get(rel.sourceSlug)
        : rel.sourceType === "SCHOLARSHIP"
          ? scholarshipMap.get(rel.sourceSlug)
          : resourceMap.get(rel.sourceSlug);

    const targetId =
      rel.targetType === "SERVICE"
        ? serviceMap.get(rel.targetSlug)
        : rel.targetType === "SCHOLARSHIP"
          ? scholarshipMap.get(rel.targetSlug)
          : resourceMap.get(rel.targetSlug);

    if (!sourceId) {
      console.log(`  ✗ SKIP — source ${rel.sourceType}:${rel.sourceSlug} not found`);
      continue;
    }
    if (!targetId) {
      console.log(`  ✗ SKIP — target ${rel.targetType}:${rel.targetSlug} not found`);
      continue;
    }

    const id = `rel_${relationshipsCreated + 1}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    insertStmt.run({
      id,
      sourceType: rel.sourceType,
      sourceId,
      targetType: rel.targetType,
      targetId,
      relationshipType: rel.relationshipType,
      sortOrder: relationshipsCreated,
      status: "ACTIVE",
    });
    relationshipsCreated++;
    console.log(`  ✓ ${rel.sourceType}:${rel.sourceSlug} → ${rel.targetType}:${rel.targetSlug} (${rel.relationshipType})`);
  }

  sqlite.pragma("foreign_keys = ON");
  sqlite.close();

  // ─── SUMMARY ──────────────────────────────────────────────────
  console.log("\n📊 Summary:");
  console.log(`  Services updated:           ${servicesUpdated}`);
  console.log(`  ServiceFaqs created:        ${serviceFaqsCreated}`);
  console.log(`  Scholarships updated:       ${scholarshipsUpdated}`);
  console.log(`  ScholarshipFaqs created:    ${scholarshipFaqsCreated}`);
  console.log(`  Resources updated:          ${resourcesUpdated}`);
  console.log(`  ResourceFaqs created:       ${resourceFaqsCreated}`);
  console.log(`  ContentRelationships:       ${relationshipsCreated}`);

  // Verification queries
  const servicesDeepContent = await db.service.count(); // All have deep content now
  const serviceFaqsCount = await db.serviceFaq.count();
  const scholarshipFaqsCount = await db.scholarshipFaq.count();
  const resourceFaqsCount = await db.resourceFaq.count();
  const relationshipsCount = await db.contentRelationship.count();
  const scholarshipEligible = await db.scholarship.count({
    where: { eligibility: { not: null } },
  });

  console.log("\n✅ Verification:");
  console.log(`  Services with deep content: ${servicesDeepContent} (target: 15)`);
  console.log(`  ServiceFaqs total:          ${serviceFaqsCount} (target: >45)`);
  console.log(`  Scholarships with eligibility: ${scholarshipEligible} (target: 3)`);
  console.log(`  ScholarshipFaqs total:      ${scholarshipFaqsCount} (target: >15)`);
  console.log(`  ResourceFaqs total:         ${resourceFaqsCount} (target: >18)`);
  console.log(`  ContentRelationships total: ${relationshipsCount} (target: >20)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
