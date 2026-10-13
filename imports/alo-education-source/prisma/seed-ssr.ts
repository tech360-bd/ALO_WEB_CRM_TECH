/**
 * Seed: Services + Scholarships + Resources
 * Run: bun run prisma/seed-ssr.ts
 */
import { db } from "../src/lib/db";

// ─── 14 SERVICES ──────────────────────────────────────────────
const SERVICES = [
  {
    slug: "personalized-counselling",
    title: "Personalized Counseling",
    shortDescription: "One-on-one expert guidance to map your entire study abroad journey.",
    icon: "MessageCircle",
    content: JSON.stringify({
      whatItIs: "Personalized counseling is a one-on-one session with an experienced ALO education counselor who assesses your academic background, career goals, financial situation, and personal preferences to create a customized study abroad roadmap.",
      whyItMatters: "Every student's journey is unique. Generic advice from websites or friends often leads to wrong choices. A professional counselor identifies the best-fit universities, courses, and destinations based on YOUR specific profile — saving time, money, and heartache.",
      whoNeedsIt: "Any student considering studying abroad — whether you're an HSC graduate exploring options, a working professional seeking a Masters, or a parent researching for your child. If you have questions about courses, universities, visas, scholarships, or costs, you need this session.",
      whatAloHelpsWith: "Profile assessment, destination selection, course matching, university shortlisting, timeline planning, cost estimation, scholarship identification, and a clear step-by-step action plan.",
      process: ["Book a free 30-minute session", "Share your academic background and goals", "Receive a personalized assessment", "Get a recommended destination and course list", "Discuss timeline, costs, and scholarships", "Receive a written action plan"],
      timeline: "1 session (30-60 minutes). Follow-up sessions available as needed.",
      fees: "First session is FREE. No obligation to continue.",
    }),
    faqs: [
      { question: "How long is the counseling session?", answer: "The first session is 30-60 minutes, conducted in person at our Dhaka office or via Zoom/WhatsApp video call." },
      { question: "Is the first session really free?", answer: "Yes, your first counseling session is completely free with no obligation to enroll in any paid services." },
      { question: "What should I bring to the session?", answer: "Bring your academic transcripts, English test scores (if available), passport copy (if available), and a list of your goals and questions." },
      { question: "Can I bring my parents?", answer: "Absolutely. We encourage parents to join the session, especially for undergraduate applications, as they play a key role in the decision-making process." },
      { question: "Do you provide counseling in Bangla?", answer: "Yes, our counselors are fluent in both English and Bangla. Sessions can be conducted in whichever language you're most comfortable with." },
    ],
  },
  {
    slug: "university-selection",
    title: "University Selection",
    shortDescription: "Shortlist universities based on ranking, tuition, location, and acceptance likelihood.",
    icon: "Building2",
    content: JSON.stringify({
      whatItIs: "University selection is the process of identifying and shortlisting 5-10 universities that best match your academic profile, budget, career goals, and personal preferences — balancing ambition with realism.",
      whyItMatters: "Applying to the wrong universities wastes time and money. Selecting universities that are too competitive leads to rejections; selecting ones that are too easy undervalues your potential. The right shortlist maximizes your chances of admission to a quality institution.",
      whoNeedsIt: "Students who have completed their counseling session and have a clear destination and course in mind, but need help narrowing down from hundreds of universities to a manageable shortlist.",
      whatAloHelpsWith: "Ranking analysis, tuition comparison, location assessment, entry requirement matching, scholarship availability, employability prospects, intake availability, and budget alignment.",
      process: ["Review your profile and preferences", "Analyze university rankings vs suitability", "Compare tuition and living costs", "Check entry and English requirements", "Assess scholarship opportunities", "Evaluate employability and post-study options", "Create a final shortlist of 5-10 universities"],
      timeline: "3-5 working days after receiving your complete profile.",
      fees: "Included in the comprehensive service package. Contact ALO for pricing.",
    }),
    faqs: [
      { question: "How many universities should I apply to?", answer: "We typically recommend 5-8 universities: 2 ambitious, 3-4 match, and 1-2 safety options. This maximizes your chances while keeping application costs reasonable." },
      { question: "Do you only recommend universities you have partnerships with?", answer: "No. We recommend universities based on YOUR best fit — ranking, tuition, requirements, and your preferences. We work with 239+ universities across 13 countries." },
      { question: "Can ALO compare universities side by side?", answer: "Yes. We provide a detailed comparison table covering ranking, tuition, location, courses, English requirements, scholarships, and post-study work rights." },
      { question: "What if I want to change my university shortlist later?", answer: "You can revise your shortlist at any time before applications are submitted. We understand preferences evolve as you learn more." },
    ],
  },
  {
    slug: "course-matching",
    title: "Course Matching",
    shortDescription: "Find the perfect course from 467+ programs matched to your profile and budget.",
    icon: "Search",
    content: JSON.stringify({
      whatItIs: "Course matching uses your academic background, career goals, budget, and English score to identify the best courses from our database of 467+ verified programs across 239 universities in 13 countries.",
      whyItMatters: "Choosing the wrong course wastes years of your life and thousands of dollars. The right course aligns with your career goals, academic strengths, budget, and timeline — setting you up for long-term success.",
      whoNeedsIt: "Students who know they want to study abroad but aren't sure which specific course or program to pursue. Also useful for students deciding between multiple course options.",
      whatAloHelpsWith: "Subject selection guidance, career goal alignment, academic eligibility assessment, course duration analysis, tuition comparison, intake availability, English requirement matching, career outcome analysis.",
      process: ["Share your academic background and career goals", "Use our AI Course Finder to get initial matches", "Counselor reviews and refines matches", "Compare top courses side by side", "Check English and academic requirements", "Select your preferred courses"],
      timeline: "1-2 sessions. AI matches are instant; counselor review takes 1-2 days.",
      fees: "AI Course Finder is FREE. Counselor-guided matching is included in the service package.",
    }),
    faqs: [
      { question: "Can I use the Course Finder without registering?", answer: "Yes, the public Course Finder is available without login. You only need to register when you're ready to save or apply to courses." },
      { question: "How accurate is the AI matching?", answer: "Our AI matches based on your inputs (destination, level, subject, budget, English score). It provides a strong starting point, but a counselor review ensures the best fit." },
      { question: "What if no courses match my criteria?", answer: "If no matches appear, try broadening your filters (e.g., wider budget range, more destinations). You can also book a counseling session for personalized guidance." },
    ],
  },
  {
    slug: "application-assistance",
    title: "Application Assistance",
    shortDescription: "Complete application filing — from form filling to document submission.",
    icon: "FileText",
    content: JSON.stringify({
      whatItIs: "Application assistance covers the entire university application process — from filling out application forms correctly to submitting all required documents before deadlines.",
      whyItMatters: "A single mistake on an application form — a wrong date, a missing document, an inconsistent name — can lead to rejection or weeks of delay. Professional assistance ensures every application is complete, accurate, and submitted on time.",
      whoNeedsIt: "Students who have selected their universities and courses and are ready to apply. Particularly valuable for students applying to multiple universities with different application systems and deadlines.",
      whatAloHelpsWith: "Application form completion, document verification, university portal submission, offer monitoring, conditional/unconditional offer management, deadline tracking, deposit stage management.",
      process: ["Gather all required documents", "Complete application forms with counselor", "Verify all information is consistent", "Submit applications through university portals", "Monitor application status daily", "Receive and review offers", "Pay deposit to confirm seat", "Receive CAS/eCoE/I-20"],
      timeline: "2-6 weeks from application to offer, depending on university and intake.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "How long does the application process take?", answer: "Typically 2-6 weeks from submission to offer. Some universities respond faster (1-2 weeks), others take longer (4-8 weeks). We track every application daily." },
      { question: "What if I miss a deadline?", answer: "We track all deadlines and send reminders well in advance. If you miss a deadline, we help you find the next available intake or alternative universities." },
      { question: "Can I apply to multiple universities at once?", answer: "Yes. We typically submit 5-8 applications simultaneously to maximize your chances of receiving offers." },
    ],
  },
  {
    slug: "sop-cv-support",
    title: "SOP & CV Support",
    shortDescription: "AI-assisted Statement of Purpose and CV building with counselor review.",
    icon: "PenLine",
    content: JSON.stringify({
      whatItIs: "SOP (Statement of Purpose) and CV support helps you craft compelling, authentic, and university-specific documents that showcase your strengths and motivations.",
      whyItMatters: "The SOP is often the deciding factor between two academically similar applicants. A weak, generic, or plagiarized SOP leads to rejection. A strong, personalized SOP demonstrates your fit and motivation.",
      whoNeedsIt: "Students applying to any university that requires a Statement of Purpose, personal statement, or CV. Most postgraduate programmes require both.",
      whatAloHelpsWith: "SOP structure guidance, AI-powered first draft, counselor review and refinement, university-specific customization, CV formatting and content optimization.",
      process: ["Share your background and goals", "AI generates a first draft SOP", "Counselor reviews and provides feedback", "You revise based on feedback", "Final review and university-specific tailoring", "CV formatting and optimization"],
      timeline: "3-5 working days for the first draft. Revisions take 1-2 days each.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "Will the SOP be original?", answer: "Yes. We use AI to generate a first draft based on YOUR unique background. Our counselors then review and refine it to ensure it's authentic and personalized. We never use templates or plagiarized content." },
      { question: "Can you write the SOP for me?", answer: "We guide and assist, but the SOP must be YOUR story. We help structure it, identify key points, and polish the language — but the content comes from you." },
      { question: "How many revisions are included?", answer: "Unlimited revisions until you and your counselor are satisfied with the final version." },
    ],
  },
  {
    slug: "document-checking",
    title: "Document Checking",
    shortDescription: "Thorough verification of all your documents before submission.",
    icon: "FolderCheck",
    content: JSON.stringify({
      whatItIs: "Document checking is a comprehensive review of every document you plan to submit with your university and visa applications — verifying authenticity, consistency, formatting, and completeness.",
      whyItMatters: "Inconsistent documents (e.g., name spelled differently on passport vs. transcript) are the #1 cause of visa refusals. Missing or expired documents cause application delays or rejections.",
      whoNeedsIt: "Every student submitting a university or visa application. Particularly important for students with complex document histories (name changes, gap years, multiple qualifications).",
      whatAloHelpsWith: "Passport verification, academic certificate authentication, transcript review, English test validation, financial document consistency, employment verification, sponsor document review, translation requirements.",
      process: ["Submit all documents via secure portal", "Counselor reviews each document", "Check for name/date consistency", "Verify document authenticity", "Identify missing or expired documents", "Flag potential issues", "Provide checklist of corrections needed"],
      timeline: "1-2 working days.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "What documents do you check?", answer: "Passport, academic certificates (SSC, HSC, Bachelor), transcripts, English test scores, bank statements, sponsor documents, employment letters, and any other documents required for your application." },
      { question: "Do you help with document translation?", answer: "Yes. If your documents are not in English, we help arrange certified translations from approved translators." },
      { question: "What if my documents have errors?", answer: "We flag all errors and inconsistencies, then guide you on how to correct them before submission. This prevents application rejection." },
    ],
  },
  {
    slug: "visa-guidance",
    title: "Visa Guidance",
    shortDescription: "Complete visa application guidance — checklist, financials, and interview prep.",
    icon: "Plane",
    content: JSON.stringify({
      whatItIs: "Visa guidance covers the entire student visa application process — from gathering the correct documents to preparing for the visa interview (if required) and submitting a strong, refusal-proof application.",
      whyItMatters: "A university offer is only half the journey. Without a visa, you cannot travel. Visa refusal means lost time, lost money, and potentially a wasted university offer. Professional guidance dramatically reduces refusal risk.",
      whoNeedsIt: "Students who have received (or are about to receive) a university offer and need to apply for a student visa. Each country has different visa requirements, financial evidence rules, and interview processes.",
      whatAloHelpsWith: "Country-specific visa checklist, financial documentation preparation, bank statement formatting, sponsor document organization, visa application form completion, interview preparation, refusal prevention.",
      process: ["Receive university offer/CAS/eCoE", "Gather visa checklist documents", "Prepare financial evidence", "Complete visa application form", "Schedule biometrics appointment", "Attend visa interview (if required)", "Submit application", "Receive visa decision"],
      timeline: "2-4 weeks for most countries. UK: 15 working days. USA: 3-5 days. Canada: 4-8 weeks. Australia: 2-4 weeks.",
      fees: "Included in the comprehensive service package. Visa application fees are paid directly to the embassy/government.",
    }),
    faqs: [
      { question: "What is the visa success rate?", answer: "We do not guarantee visa success — no legitimate consultant can. However, our thorough preparation significantly reduces common refusal reasons. Each case is assessed individually." },
      { question: "Do you help with the visa interview?", answer: "Yes. We conduct mock interviews, provide question banks, and coach you on how to present your case confidently and credibly." },
      { question: "What if my visa is refused?", answer: "We review the refusal reasons, help you decide whether to reapply or appeal, and strengthen your application for the next submission." },
      { question: "Can you guarantee visa approval?", answer: "No. Visa decisions are made by immigration authorities, not by ALO Education. We prepare you thoroughly, but the final decision is theirs." },
    ],
  },
  {
    slug: "interview-preparation",
    title: "Interview Preparation",
    shortDescription: "Mock visa and university interviews with detailed scoring and feedback.",
    icon: "Users",
    content: JSON.stringify({
      whatItIs: "Interview preparation includes mock interviews that simulate real visa and university credibility interviews, with AI-powered scoring and human counselor feedback.",
      whyItMatters: "The visa interview (or credibility interview) is often the final hurdle. Nervousness, unclear answers, or inconsistent information can lead to refusal despite having all documents in order.",
      whoNeedsIt: "Students applying to countries that require visa interviews (UK, USA, Canada) or universities that require credibility interviews. Also valuable for scholarship interviews.",
      whatAloHelpsWith: "Mock interview sessions, common question practice, AI scoring on communication/clarity/confidence, counselor feedback, body language coaching, answer refinement.",
      process: ["Review your application and background", "Complete a mock interview (AI or counselor)", "Receive detailed scoring and feedback", "Practice weak areas", "Complete a second mock interview", "Receive final readiness assessment"],
      timeline: "2-3 sessions over 1-2 weeks.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "How many mock interviews are included?", answer: "Typically 2-3 mock interviews, depending on your readiness. Additional sessions can be arranged if needed." },
      { question: "Is the AI interview free?", answer: "The AI interview practice tool is available through the Student Portal. Counselor-led mock interviews are part of the service package." },
      { question: "What questions are asked in the interview?", answer: "Common questions include: Why this country? Why this university? Why this course? What are your career plans? How will you fund your studies? We provide a comprehensive question bank." },
    ],
  },
  {
    slug: "english-test-preparation",
    title: "English Test Preparation",
    shortDescription: "IELTS, PTE, TOEFL preparation with free mock tests and AI scoring.",
    icon: "GraduationCap",
    content: JSON.stringify({
      whatItIs: "English test preparation provides resources, mock tests, and AI-powered scoring for IELTS, PTE, TOEFL, Duolingo, and other accepted English proficiency tests.",
      whyItMatters: "Most universities and immigration authorities require proof of English proficiency. A score even 0.5 below the requirement can mean rejection. Proper preparation ensures you meet or exceed the threshold.",
      whoNeedsIt: "Students who need to take an English test for university admission or visa application. Also for students who want to improve their score to qualify for scholarships or better universities.",
      whatAloHelpsWith: "Test selection guidance (which test to take), free mock tests, AI scoring, speaking/writing review, study plans, test booking assistance.",
      process: ["Take a free placement test", "Receive AI-scored assessment", "Get a personalized study plan", "Practice with mock tests", "Review speaking/writing with AI feedback", "Book your official test when ready"],
      timeline: "4-8 weeks of preparation recommended before taking the official test.",
      fees: "Mock tests are FREE. Official test fees are paid directly to the test provider (IELTS ~BDT 22,500, PTE ~BDT 18,000, TOEFL ~BDT 20,000).",
    }),
    faqs: [
      { question: "Which English test should I take?", answer: "It depends on your destination and university. IELTS is most widely accepted. PTE is faster and increasingly accepted. Duolingo is accepted by many universities but not all immigration authorities. Check with your counselor." },
      { question: "Can I get a free mock test?", answer: "Yes. Our Student Portal offers free mock tests with AI scoring for IELTS, PTE, and TOEFL. You can also take a free placement test to determine your current level." },
      { question: "Do you provide classes or tutoring?", answer: "We focus on self-study resources, mock tests, and AI feedback. For intensive classroom coaching, we can recommend partner English language institutes." },
    ],
  },
  {
    slug: "financial-planning",
    title: "Financial Planning",
    shortDescription: "Bank statement, sponsor docs, and source-of-fund preparation guidance.",
    icon: "DollarSign",
    content: JSON.stringify({
      whatItIs: "Financial planning helps you prepare the financial evidence required for university and visa applications — ensuring your bank statement, sponsor documents, and source-of-fund evidence meet official requirements.",
      whyItMatters: "Insufficient or improperly formatted financial evidence is a leading cause of visa refusal. Different countries have specific requirements for fund history, amount, and documentation format.",
      whoNeedsIt: "Students who need to show financial proof for visa applications. Particularly important for students whose sponsors are parents, relatives, or employers.",
      whatAloHelpsWith: "Bank statement preparation (28-day rule for UK), sponsor letter drafting, source-of-fund documentation, financial evidence formatting, fund amount calculation, currency conversion guidance.",
      process: ["Calculate required fund amount", "Identify your sponsor", "Prepare bank statement (ensure 28-day history where required)", "Draft sponsor letter", "Gather source-of-fund evidence", "Review all financial documents for consistency"],
      timeline: "1-2 weeks (must plan ahead to ensure 28-day bank statement history where required).",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "How much money do I need to show?", answer: "It varies by country. UK requires tuition + £1,334/month living costs (up to 9 months). USA requires proof covering first year tuition + living. Contact us for country-specific amounts." },
      { question: "Can my parents be my sponsor?", answer: "Yes. Parents are the most common sponsors. You'll need a sponsor letter, bank statement, relationship proof (birth certificate), and source-of-fund documentation." },
      { question: "How long must the bank statement history be?", answer: "UK requires 28 consecutive days ending no more than 31 days before your application. Other countries have different requirements — check with your counselor." },
    ],
  },
  {
    slug: "scholarship-guidance",
    title: "Scholarship Guidance",
    shortDescription: "Identify and apply for scholarships you're eligible for.",
    icon: "Award",
    content: JSON.stringify({
      whatItIs: "Scholarship guidance helps you find, assess eligibility for, and apply to scholarships that can significantly reduce your tuition and living costs.",
      whyItMatters: "Scholarships can cover partial to full tuition, living expenses, and even travel costs. Many students miss out simply because they didn't know scholarships existed or applied too late.",
      whoNeedsIt: "All students — especially those with strong academic records, financial need, or specific backgrounds (e.g., women in STEM, developing country nationals).",
      whatAloHelpsWith: "Scholarship search and matching, eligibility assessment, application strategy, deadline tracking, document preparation, scholarship essay/SOP guidance.",
      process: ["Assess your eligibility for various scholarships", "Search our scholarship database", "Check deadlines and requirements", "Prepare scholarship-specific documents", "Submit applications before deadlines", "Monitor application status"],
      timeline: "Scholarship deadlines vary — some close 6-12 months before the intake. Start early!",
      fees: "Included in the comprehensive service package. We never charge a percentage of scholarship money — all scholarship funds go directly to you.",
    }),
    faqs: [
      { question: "Can ALO guarantee a scholarship?", answer: "No. Scholarships are competitive and decided by universities or funding bodies. We help you find and apply to scholarships you're eligible for, but cannot guarantee success." },
      { question: "Are there fully-funded scholarships?", answer: "Yes. Chevening (UK), DAAD (Germany), Australia Awards, and some university-specific scholarships offer full funding. These are highly competitive — strong academics and a compelling application are essential." },
      { question: "Do you take a percentage of the scholarship?", answer: "Absolutely not. All scholarship money goes directly to you. Our service fees are separate and transparent." },
    ],
  },
  {
    slug: "pre-departure-orientation",
    title: "Pre-Departure Orientation",
    shortDescription: "Briefing on travel, accommodation, banking, and cultural adaptation.",
    icon: "Luggage",
    content: JSON.stringify({
      whatItIs: "Pre-departure orientation prepares you for life in your destination country — covering travel, accommodation, banking, health insurance, cultural adaptation, and practical first-week steps.",
      whyItMatters: "Arriving in a new country unprepared leads to stress, wasted money, and homesickness. Proper preparation ensures a smooth transition and helps you focus on your studies from day one.",
      whoNeedsIt: "Students who have received their visa and are preparing to travel. Typically attended 2-4 weeks before departure.",
      whatAloHelpsWith: "Travel booking guidance, accommodation arrangement, banking setup, SIM card advice, health insurance enrollment, cultural orientation, emergency planning, packing checklist, first-week survival guide.",
      process: ["Attend pre-departure briefing session", "Receive destination-specific guide", "Book flights and arrange airport pickup", "Confirm accommodation", "Set up bank account and SIM card", "Purchase health insurance", "Pack using provided checklist", "Get emergency contact list"],
      timeline: "1 session (2-3 hours), 2-4 weeks before departure.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "Do you help with flight booking?", answer: "We provide guidance on when to book and which airlines offer student discounts. We can also connect you with travel agents who specialize in student travel." },
      { question: "Do you arrange airport pickup?", answer: "Many universities offer free airport pickup services for international students. We help you register for this and provide backup options if unavailable." },
      { question: "What should I pack?", answer: "We provide a comprehensive packing checklist tailored to your destination, including climate-appropriate clothing, essential documents, electronics, and items that are hard to find abroad." },
    ],
  },
  {
    slug: "post-arrival-support",
    title: "Post-Arrival Support",
    shortDescription: "Airport pickup, SIM card, bank account, and university registration help.",
    icon: "MapPin",
    content: JSON.stringify({
      whatItIs: "Post-arrival support ensures you have help during your first days in a new country — from airport pickup to university registration and everything in between.",
      whyItMatters: "The first 48 hours in a new country are the most overwhelming. Having local support prevents common mistakes (wrong SIM card, expensive temporary accommodation, missed registration deadlines).",
      whoNeedsIt: "Students traveling to their destination country for the first time, especially those who don't have friends or family in the destination city.",
      whatAloHelpsWith: "Airport pickup coordination, SIM card purchase, bank account opening, university registration, public transport orientation, grocery/halal food locations, emergency contacts, cultural adjustment support.",
      process: ["Arrive at destination airport", "Meet pickup (if arranged)", "Settle into accommodation", "Get local SIM card", "Open bank account", "Attend university orientation", "Register with local authorities if required", "Join ALO student community"],
      timeline: "First 1-2 weeks after arrival.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "Is airport pickup guaranteed?", answer: "We coordinate with university pickup services and local partners. While we strive to arrange pickup for every student, availability depends on the university and arrival time." },
      { question: "What if I have an emergency after arriving?", answer: "You'll have access to our 24/7 emergency WhatsApp support line. We can connect you with local contacts, medical services, or your embassy if needed." },
      { question: "Do you help with finding part-time jobs?", answer: "We provide guidance on work rights and where to look for part-time jobs, but we do not directly place students in jobs. Work rights vary by country — check with your counselor." },
    ],
  },
  {
    slug: "career-counselling",
    title: "Career Counseling",
    shortDescription: "Career planning and guidance for your post-study journey.",
    icon: "Briefcase",
    content: JSON.stringify({
      whatItIs: "Career counseling helps you plan your post-study career path — from choosing the right course for your career goals to understanding post-study work visa options and job market trends.",
      whyItMatters: "Studying abroad is an investment in your future career. Without clear career planning, you might choose a course that doesn't align with your goals or miss post-study work opportunities.",
      whoNeedsIt: "Students at any stage — from those choosing a course to those about to graduate and looking for work opportunities abroad or back in Bangladesh.",
      whatAloHelpsWith: "Career goal setting, course-career alignment, post-study work visa guidance, job market analysis, CV/LinkedIn optimization, interview preparation, networking guidance.",
      process: ["Discuss your career aspirations", "Align course choices with career goals", "Understand post-study work visa options", "Create a career timeline", "Develop a job search strategy", "Optimize your CV and LinkedIn profile"],
      timeline: "Ongoing throughout your study abroad journey.",
      fees: "Included in the comprehensive service package.",
    }),
    faqs: [
      { question: "Can you help me find a job after graduation?", answer: "We provide career guidance, CV optimization, and interview preparation. We do not directly place students in jobs, but we can connect you with our alumni network and job search resources." },
      { question: "What are post-study work visa options?", answer: "UK: 2-year Graduate Route. USA: 1-year OPT (3-year for STEM). Canada: 3-year PGWP. Australia: 2-4-year Temporary Graduate visa. Ireland: 1-year Third Level Graduate Scheme. Contact us for details." },
      { question: "Should I return to Bangladesh after graduation?", answer: "That depends on your career goals, family situation, and visa options. We help you evaluate both options — staying abroad or returning home — based on your specific circumstances." },
    ],
  },
];

// ─── RESOURCE CATEGORIES ──────────────────────────────────────
const CATEGORIES = [
  { slug: "blogs", name: "Blogs", icon: "Newspaper", description: "Study abroad tips, university guides, and student experiences." },
  { slug: "visa-guides", name: "Visa Guides", icon: "Plane", description: "Country-specific visa requirements, processes, and checklists." },
  { slug: "scholarships", name: "Scholarships", icon: "Award", description: "Scholarship opportunities, eligibility, and application strategies." },
  { slug: "application-tips", name: "Application Tips", icon: "Lightbulb", description: "Expert tips for a strong university application." },
  { slug: "pre-departure", name: "Pre-Departure", icon: "Luggage", description: "Everything you need before you fly." },
  { slug: "accommodation", name: "Accommodation", icon: "Home", description: "Student housing guidance and tips." },
  { slug: "financial-planning", name: "Financial Planning", icon: "Wallet", description: "Budgeting, banking, and financial proof guidance." },
  { slug: "english-tests", name: "English Tests", icon: "Languages", description: "IELTS, PTE, TOEFL preparation and comparison." },
  { slug: "student-visa-faqs", name: "Student Visa FAQs", icon: "HelpCircle", description: "Answers to common student visa questions." },
  { slug: "study-abroad-guides", name: "Study Abroad Guides", icon: "BookOpen", description: "Comprehensive guides for each destination country." },
];

// ─── SAMPLE RESOURCES (2 per category) ────────────────────────
const RESOURCES = [
  {
    categorySlug: "visa-guides",
    slug: "uk-student-visa-guide",
    title: "UK Student Visa Guide: Complete Step-by-Step Process for Bangladeshi Students",
    excerpt: "Everything you need to know about applying for a UK Student Visa (Tier 4) from Bangladesh — documents, financial requirements, biometrics, and timeline.",
    content: "<h2>Overview</h2><p>The UK Student Visa (formerly Tier 4) allows international students to study in the UK. This guide covers the complete process for Bangladeshi students.</p><h2>Eligibility</h2><p>You need a Confirmation of Acceptance for Studies (CAS) from a licensed UK university, sufficient funds for tuition and living costs, and valid English proficiency.</p><h2>Required Documents</h2><ul><li>Valid passport</li><li>CAS from university</li><li>Bank statement showing £1,334/month (London) or £1,023/month (outside London) for up to 9 months</li><li>Tuberculosis test certificate</li><li>ATAS certificate (if required)</li></ul><h2>Financial Requirements</h2><p>You must show funds for at least 28 consecutive days ending no more than 31 days before your application.</p><h2>Application Process</h2><p>1. Receive CAS from university</p><p>2. Gather documents</p><p>3. Apply online</p><p>4. Pay visa fee (£490) and immigration health surcharge (£776/year)</p><p>5. Attend biometrics appointment</p><p>6. Receive decision (typically 15 working days)</p><h2>Common Mistakes</h2><ul><li>Insufficient bank statement history</li><li>Inconsistent name across documents</li><li>Missing TB test</li><li>Incorrect visa type</li></ul>",
    readingTime: 8,
    tags: ["UK", "visa", "student visa", "Tier 4", "CAS"],
    sourceUrl: "https://www.gov.uk/student-visa",
    sourceName: "UK Government",
  },
  {
    categorySlug: "visa-guides",
    slug: "canada-study-permit-guide",
    title: "Canada Study Permit Guide: Requirements and Process for Bangladeshi Students",
    excerpt: "Complete guide to obtaining a Canadian Study Permit — including the SDS program, financial requirements, and biometrics.",
    content: "<h2>Overview</h2><p>The Canada Study Permit allows international students to study at designated Learning Institutions (DLIs) in Canada.</p><h2>SDS Program</h2><p>The Student Direct Stream (SDS) offers faster processing (20 calendar days) for students from Bangladesh who meet specific requirements including a GIC of CAD 20,635 and upfront tuition payment.</p><h2>Required Documents</h2><ul><li>Valid passport</li><li>Letter of Acceptance from DLI</li><li>Proof of funds (GIC + tuition)</li><li>IELTS 6.0+ (SDS)</li><li>Medical exam</li><li>Biometrics</li></ul><h2>Financial Requirements</h2><p>SDS: CAD 20,635 GIC + first year tuition. Regular stream: proof of CAD 20,635 + tuition.</p><h2>Application Process</h2><p>1. Receive Letter of Acceptance</p><p>2. Purchase GIC from approved bank</p><p>3. Pay first year tuition</p><p>4. Complete medical exam</p><p>5. Apply online</p><p>6. Give biometrics</p><p>7. Receive decision (20 days SDS, 4-8 weeks regular)</p>",
    readingTime: 7,
    tags: ["Canada", "visa", "study permit", "SDS"],
    sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
    sourceName: "Government of Canada",
  },
  {
    categorySlug: "scholarships",
    slug: "chevening-scholarship-guide",
    title: "Chevening Scholarship: Complete Guide for Bangladeshi Students",
    excerpt: "The UK government's global scholarship programme offering fully-funded Masters study. Learn about eligibility, application process, and tips.",
    content: "<h2>Overview</h2><p>Chevening is the UK government's international awards scheme aimed at developing global leaders. It offers fully-funded Masters study at any UK university.</p><h2>What It Covers</h2><ul><li>Full tuition fees</li><li>Monthly living stipend</li><li>Return airfare to UK</li><li>Arrival allowance</li><li>Departure allowance</li><li>Visa fees</li><li>Travel grant</li></ul><h2>Eligibility</h2><ul><li>Bangladeshi citizen</li><li>At least 2 years work experience (2,800 hours)</li><li>Bachelor's degree qualifying for Masters</li><li>Apply to 3 eligible UK university courses</li><li>Not received Chevening before</li><li>Commit to return to Bangladesh for 2 years</li></ul><h2>Application Timeline</h2><p>Applications open: August. Deadline: November. Results: June.</p><h2>Tips for Success</h2><ul><li>Demonstrate leadership potential</li><li>Show clear career plan for returning to Bangladesh</li><li>Choose courses aligned with Bangladesh's development needs</li><li>Strong references from professional contacts</li></ul>",
    readingTime: 6,
    tags: ["scholarship", "UK", "Chevening", "fully funded", "Masters"],
    sourceUrl: "https://www.chevening.org/",
    sourceName: "Chevening",
  },
  {
    categorySlug: "english-tests",
    slug: "ielts-vs-pte-comparison",
    title: "IELTS vs PTE: Which English Test Should You Take?",
    excerpt: "A detailed comparison of IELTS and PTE — test format, scoring, difficulty, results time, and acceptance to help you choose.",
    content: "<h2>Overview</h2><p>Both IELTS and PTE Academic are widely accepted English proficiency tests. This comparison helps you choose the right one.</p><h2>Test Format</h2><p>IELTS: Paper or computer-based. 4 sections (Listening, Reading, Writing, Speaking). Speaking is face-to-face with an examiner.</p><p>PTE: Computer-based only. 3 sections (Speaking & Writing, Reading, Listening). Speaking is recorded.</p><h2>Scoring</h2><p>IELTS: 0-9 band scale. Most universities require 6.0-7.0.</p><p>PTE: 10-90 scale. Most universities require 50-65.</p><h2>Results Time</h2><p>IELTS: 13 days (paper), 3-5 days (computer).</p><p>PTE: 24-48 hours.</p><h2>Difficulty</h2><p>IELTS speaking is easier for some (face-to-face). PTE writing is considered easier by some. Both require similar preparation.</p><h2>Acceptance</h2><p>IELTS is accepted by ALL UK universities and immigration (UKVI). PTE is accepted by most universities worldwide and UK immigration.</p><h2>Cost in Bangladesh</h2><p>IELTS: ~BDT 22,500. PTE: ~BDT 18,000.</p>",
    readingTime: 5,
    tags: ["IELTS", "PTE", "English test", "comparison"],
    sourceUrl: "https://www.ielts.org/",
    sourceName: "IELTS Official",
  },
  {
    categorySlug: "application-tips",
    slug: "how-to-write-a-strong-sop",
    title: "How to Write a Strong Statement of Purpose (SOP)",
    excerpt: "Learn the structure, content, and common mistakes to avoid when writing your SOP for university applications.",
    content: "<h2>What Is an SOP?</h2><p>A Statement of Purpose (SOP) is a personal essay that explains your motivation for applying to a specific course and university. It's often the deciding factor between similar applicants.</p><h2>SOP Structure</h2><ul><li>Introduction: Your motivation and hook</li><li>Academic background: Relevant courses and achievements</li><li>Professional experience: Work, internships, projects</li><li>Why this course: Specific modules and learning outcomes</li><li>Why this university: Specific facilities, faculty, research</li><li>Career goals: Short-term and long-term plans</li><li>Conclusion: Summary and commitment</li></ul><h2>Common Mistakes</h2><ul><li>Plagiarism — never copy from online samples</li><li>Generic content — tailor each SOP to the university</li><li>Too long — stick to 500-1000 words unless specified</li><li>Focusing on what the university can do for you, not what you can contribute</li><li>Exaggeration or false claims</li></ul><h2>Tips for Success</h2><ul><li>Start early — allow time for revisions</li><li>Be specific — mention course modules, professor names, research areas</li><li>Show, don't tell — use examples to demonstrate qualities</li><li>Proofread — grammar errors create a bad impression</li><li>Get feedback — have your counselor review it</li></ul>",
    readingTime: 6,
    tags: ["SOP", "application", "university", "tips"],
    sourceUrl: null,
    sourceName: "ALO Education",
  },
  {
    categorySlug: "pre-departure",
    slug: "pre-departure-checklist",
    title: "Pre-Departure Checklist: Everything You Need Before You Fly",
    excerpt: "A comprehensive checklist of documents, items, and preparations before traveling to your study destination.",
    content: "<h2>Documents</h2><ul><li>Valid passport (6+ months validity)</li><li>Student visa</li><li>University offer letter / CAS / eCoE / I-20</li><li>Academic certificates and transcripts (original + copies)</li><li>English test score report</li><li>Financial documents (bank statement, sponsor letter)</li><li>Medical/insurance documents</li><li>Passport-size photos (10+)</li></ul><h2>Financial</h2><ul><li>Notify bank of international travel</li><li>Set up online banking</li><li>Carry some local currency for first few days</li><li>Credit/debit card (check international fees)</li><li>Proof of funds for immigration</li></ul><h2>Electronics</h2><ul><li>Laptop + charger</li><li>Phone + charger</li><li>Universal power adapter</li><li>Power bank</li></ul><h2>Clothing</h2><p>Pack according to the climate. Check the weather for your arrival date. Don't overpack — you can buy clothes locally.</p><h2>Health</h2><ul><li>Prescription medications (with doctor's letter)</li><li>Basic first aid kit</li><li>Vaccination records</li></ul>",
    readingTime: 5,
    tags: ["pre-departure", "checklist", "travel"],
    sourceUrl: null,
    sourceName: "ALO Education",
  },
];

// ─── SAMPLE SCHOLARSHIPS ──────────────────────────────────────
const SCHOLARSHIPS = [
  {
    slug: "chevening-scholarship-uk",
    scholarshipCode: "SCH-001",
    name: "Chevening Scholarship",
    countrySlug: "uk",
    studyLevel: "Masters",
    subject: "All subjects",
    fundingType: "FULLY_FUNDED",
    amount: "Full tuition + living stipend",
    currency: "GBP",
    coverage: JSON.stringify({ tuition: true, living: true, accommodation: false, travel: true, insurance: true, other: "Visa fees, arrival allowance" }),
    eligibility: "Bangladeshi citizen, 2+ years work experience, Bachelor's degree, commitment to return for 2 years",
    minimumRequirements: JSON.stringify({ academic: "Bachelor's with strong academic record", english: "Varies by university (typically IELTS 6.5-7.0)", experience: "2+ years (2,800 hours)" }),
    documentsRequired: JSON.stringify(["Passport", "Academic transcripts", "Degree certificate", "English test score", "Two references", "Work experience letters"]),
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://www.chevening.org/apply/",
    openingDate: "August",
    deadline: "November (annually)",
    status: "OPEN",
    verificationStatus: "VERIFIED",
    sourceUrl: "https://www.chevening.org/",
    sourceName: "Chevening",
    faqs: [
      { question: "Is Chevening fully funded?", answer: "Yes. Chevening covers full tuition, monthly living stipend, return airfare, visa fees, and arrival/departure allowances." },
      { question: "Do I need work experience?", answer: "Yes. You need at least 2 years (2,800 hours) of work experience to be eligible." },
      { question: "Can I apply before getting university admission?", answer: "Yes. You apply to Chevening and select 3 university courses. If awarded, Chevening helps you secure admission." },
    ],
  },
  {
    slug: "daad-scholarship-germany",
    scholarshipCode: "SCH-002",
    name: "DAAD Scholarship",
    countrySlug: "germany",
    studyLevel: "Masters",
    subject: "All subjects",
    fundingType: "FULLY_FUNDED",
    amount: "EUR 861/month + tuition waiver",
    currency: "EUR",
    coverage: JSON.stringify({ tuition: true, living: true, accommodation: false, travel: true, insurance: true, other: "Study allowance" }),
    eligibility: "Bangladeshi citizen, Bachelor's degree, 2+ years work experience, English proficiency",
    minimumRequirements: JSON.stringify({ academic: "Bachelor's in relevant field", english: "IELTS 6.5 or TOEFL 80" }),
    documentsRequired: JSON.stringify(["Passport", "Academic transcripts", "Degree certificate", "English test score", "Motivation letter", "Two reference letters", "CV"]),
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://www.daad.de/en/",
    openingDate: "August",
    deadline: "October (varies by programme)",
    status: "OPEN",
    verificationStatus: "VERIFIED",
    sourceUrl: "https://www.daad.de/en/",
    sourceName: "DAAD",
    faqs: [
      { question: "Is DAAD fully funded?", answer: "Yes. DAAD covers tuition waiver, monthly stipend (EUR 861), health insurance, and travel allowance." },
      { question: "Do I need German language?", answer: "For English-taught programmes, no German is required. For German-taught programmes, you need DSH-2 or TestDaF." },
      { question: "Can I work in Germany after graduation?", answer: "Yes. Germany allows 18 months post-study work visa for graduates." },
    ],
  },
  {
    slug: "australia-awards-scholarship",
    scholarshipCode: "SCH-003",
    name: "Australia Awards Scholarship",
    countrySlug: "australia",
    studyLevel: "Masters",
    subject: "Development-related fields",
    fundingType: "FULLY_FUNDED",
    amount: "Full tuition + AUD 30,000/year stipend",
    currency: "AUD",
    coverage: JSON.stringify({ tuition: true, living: true, accommodation: true, travel: true, insurance: true, other: "Establishment allowance, pre-course English" }),
    eligibility: "Bangladeshi citizen, Bachelor's degree, 2+ years work experience in development sector, commitment to return",
    minimumRequirements: JSON.stringify({ academic: "Bachelor's with strong record", english: "IELTS 6.5 (no band below 6.0)" }),
    documentsRequired: JSON.stringify(["Passport", "Academic transcripts", "Degree certificate", "English test score", "Employment certificate", "Development impact statement"]),
    applicationMethod: "SEPARATE_APPLICATION",
    applicationUrl: "https://australiaawardspacific.org/",
    openingDate: "February",
    deadline: "April (annually)",
    status: "UPCOMING",
    verificationStatus: "VERIFIED",
    sourceUrl: "https://www.australiaawards.gov.au/",
    sourceName: "Australian Government",
    faqs: [
      { question: "Is Australia Awards fully funded?", answer: "Yes. It covers full tuition, living stipend, accommodation, travel, health insurance, and establishment allowance." },
      { question: "What fields are eligible?", answer: "Development-related fields including health, education, governance, economic growth, and environment." },
    ],
  },
];

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding Services + Scholarships + Resources...\n");

  // 1. Services + FAQs
  console.log("Services:");
  for (const s of SERVICES) {
    const existing = await db.service.findUnique({ where: { slug: s.slug } });
    if (existing) {
      await db.serviceFaq.deleteMany({ where: { serviceId: existing.id } });
      await db.service.update({ where: { id: existing.id }, data: {
        title: s.title, shortDescription: s.shortDescription, description: s.shortDescription,
        icon: s.icon, content: s.content, status: "PUBLISHED",
      }});
      await db.serviceFaq.createMany({ data: s.faqs.map((f, i) => ({ serviceId: existing.id, question: f.question, answer: f.answer, sortOrder: i })) });
      console.log(`  ✓ Updated: ${s.title}`);
    } else {
      const svc = await db.service.create({ data: {
        slug: s.slug, title: s.title, shortDescription: s.shortDescription, description: s.shortDescription,
        icon: s.icon, content: s.content, status: "PUBLISHED",
      }});
      await db.serviceFaq.createMany({ data: s.faqs.map((f, i) => ({ serviceId: svc.id, question: f.question, answer: f.answer, sortOrder: i })) });
      console.log(`  ✓ Created: ${s.title}`);
    }
  }

  // 2. Categories
  console.log("\nCategories:");
  for (const c of CATEGORIES) {
    await db.resourceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, description: c.description, status: "ACTIVE" },
      create: { slug: c.slug, name: c.name, icon: c.icon, description: c.description, status: "ACTIVE" },
    });
    console.log(`  ✓ ${c.name}`);
  }

  // 3. Resources + FAQs
  console.log("\nResources:");
  for (const r of RESOURCES) {
    const cat = await db.resourceCategory.findUnique({ where: { slug: r.categorySlug } });
    if (!cat) continue;
    const existing = await db.resource.findUnique({ where: { slug: r.slug } });
    if (existing) {
      await db.resourceFaq.deleteMany({ where: { resourceId: existing.id } });
      await db.resource.update({ where: { id: existing.id }, data: {
        categoryId: cat.id, title: r.title, excerpt: r.excerpt, content: r.content,
        readingTime: r.readingTime, tags: JSON.stringify(r.tags), status: "PUBLISHED",
        sourceUrl: r.sourceUrl, sourceName: r.sourceName, publishedAt: new Date(),
      }});
      console.log(`  ✓ Updated: ${r.title}`);
    } else {
      const res = await db.resource.create({ data: {
        slug: r.slug, categoryId: cat.id, title: r.title, excerpt: r.excerpt, content: r.content,
        readingTime: r.readingTime, tags: JSON.stringify(r.tags), status: "PUBLISHED",
        sourceUrl: r.sourceUrl, sourceName: r.sourceName, publishedAt: new Date(),
      }});
      console.log(`  ✓ Created: ${r.title}`);
    }
  }

  // 4. Scholarships + FAQs
  console.log("\nScholarships:");
  for (const sch of SCHOLARSHIPS) {
    const { faqs: schFaqs, ...scholarshipData } = sch;
    const existing = await db.scholarship.findUnique({ where: { slug: sch.slug } });
    if (existing) {
      await db.scholarshipFaq.deleteMany({ where: { scholarshipId: existing.id } });
      await db.scholarship.update({ where: { id: existing.id }, data: { ...scholarshipData, lastVerifiedAt: new Date() } });
      await db.scholarshipFaq.createMany({ data: schFaqs.map((f, i) => ({ scholarshipId: existing.id, question: f.question, answer: f.answer, sortOrder: i })) });
      console.log(`  ✓ Updated: ${sch.name}`);
    } else {
      const s = await db.scholarship.create({ data: { ...scholarshipData, lastVerifiedAt: new Date() } });
      await db.scholarshipFaq.createMany({ data: schFaqs.map((f, i) => ({ scholarshipId: s.id, question: f.question, answer: f.answer, sortOrder: i })) });
      console.log(`  ✓ Created: ${sch.name}`);
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`  Services: ${await db.service.count()}`);
  console.log(`  Service FAQs: ${await db.serviceFaq.count()}`);
  console.log(`  Resource Categories: ${await db.resourceCategory.count()}`);
  console.log(`  Resources: ${await db.resource.count()}`);
  console.log(`  Scholarships: ${await db.scholarship.count()}`);
  console.log(`  Scholarship FAQs: ${await db.scholarshipFaq.count()}`);
  console.log(`\n✅ Seed complete!`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
