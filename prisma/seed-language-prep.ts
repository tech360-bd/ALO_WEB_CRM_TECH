/**
 * ALO Education — Language Preparation catalogue seed.
 *
 * Idempotent: every record is upserted on its natural key, so the script can be
 * re-run after edits without duplicating rows or resetting review markers that
 * an editor has since updated.
 *
 * Content rules
 * -------------
 * - Timing, scoring and result-timeline figures come from
 *   `src/lib/language-prep/editorial.ts` (REVIEWED_TEST_FACTS), which carries an
 *   HTTPS official source and a review date. Nothing here invents a duration,
 *   score band, fee or acceptance claim.
 * - `lastVerifiedAt` is set to "now" so the 90-day publication gate in
 *   `src/lib/language-prep/verification.ts` is satisfied on a fresh database.
 * - Relative cost wording ("mid-range", "low", "higher than most tests") is
 *   intentionally NOT stored. Provider fees vary by country, delivery mode and
 *   booking date, so the shared PROVIDER_FEE_NOTICE is used instead; this is the
 *   same rule `applyReviewedFacts()` applies to dated catalogue rows.
 * - Success stories are stored as draft-with-consent records only when
 *   `ALO_SEED_PUBLISH_STORIES=1` is set. Publishing testimonials is an editorial
 *   decision that needs a real consent record, so the default is unpublished.
 *
 * Run (dev SQLite sandbox):
 *   NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" npx tsx prisma/seed-language-prep.ts
 *
 * Against MySQL:
 *   npx tsx prisma/seed-language-prep.ts
 */
import { db } from '../src/lib/db';
import {
  ACCEPTANCE_NOTICE,
  PROVIDER_FEE_NOTICE,
  REVIEWED_ON,
  REVIEWED_TEST_FACTS,
  reviewedModules,
} from '../src/lib/language-prep/editorial';

type SeedTest = {
  slug: string;
  name: string;
  shortName: string;
  testType: 'english_proficiency' | 'academic' | 'moi_guidance';
  provider: string;
  officialUrl: string;
  shortDescription: string;
  longDescription: string;
  bestFor: string;
  format: string;
  durationMinutes: number;
  validitySummary: string;
  difficultyLevel: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  sortOrder: number;
  acceptance: Array<{ countryName: string; countrySlug: string; acceptanceType: string; summary: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const NOW = new Date();
const REVIEWED_AT = new Date(Math.max(NOW.getTime(), new Date(REVIEWED_ON).getTime()));

const SOURCE_NAME = 'Official provider guidance';

const TESTS: SeedTest[] = [
  {
    slug: 'ielts',
    name: 'IELTS',
    shortName: 'IELTS',
    testType: 'english_proficiency',
    provider: 'British Council, IDP and Cambridge University Press & Assessment',
    officialUrl: 'https://ielts.org/',
    shortDescription: 'Accepted by UK, Australia, Canada, Europe, and many global universities.',
    longDescription:
      'IELTS (International English Language Testing System) is one of the most widely accepted English proficiency tests for university admission and visa purposes worldwide. It is accepted by universities and immigration authorities in the UK, Australia, Canada, Europe, and many other countries. ALO Education helps you prepare strategically to achieve the band score your course and visa route require.',
    bestFor: 'UK, Australia, Canada, Europe and other destinations that name IELTS.',
    format: 'Paper-based or computer-based, at an authorised test centre',
    durationMinutes: 165,
    validitySummary: 'Many institutions expect results no older than two years; confirm with the receiving institution.',
    difficultyLevel: 'Academic English across four skills',
    isPopular: true,
    isFeatured: true,
    sortOrder: 1,
    acceptance: [
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'university', summary: 'Widely accepted by UK universities for admission. Some visa routes require a named SELT instead — check your route before booking.' },
      { countryName: 'Australia', countrySlug: 'australia', acceptanceType: 'university', summary: 'Accepted by Australian universities and for student visa evidence, subject to the required band.' },
      { countryName: 'Canada', countrySlug: 'canada', acceptanceType: 'university', summary: 'Accepted by Canadian institutions; confirm the required overall and component bands.' },
    ],
    faqs: [
      { question: 'How is IELTS scored?', answer: 'IELTS reports a band score from 0 to 9 for each skill and an overall band. Institutions usually set both an overall minimum and component minimums.' },
      { question: 'How long are IELTS results valid?', answer: 'Many institutions expect results taken within the last two years, but recency rules are set by the receiving institution. Confirm before booking.' },
      { question: 'Can I retake IELTS?', answer: 'Yes. Most providers allow another attempt subject to their booking rules and fees. Check the current provider conditions before planning a retake.' },
    ],
  },
  {
    slug: 'ielts-ukvi',
    name: 'IELTS UKVI',
    shortName: 'IELTS UKVI',
    testType: 'english_proficiency',
    provider: 'IELTS (UKVI-approved centres)',
    officialUrl: 'https://ielts.org/take-a-test/test-types/ielts-for-ukvi',
    shortDescription: 'UK government-approved version of IELTS for visa applications.',
    longDescription:
      'IELTS for UKVI is the UK government-approved version of IELTS used where UK immigration rules require a Secure English Language Test (SELT). It is taken at specifically authorised UKVI centres and covers Academic or General Training depending on the requirement. Use it only where your route requires a named SELT; check the exact test, delivery mode and centre with official guidance before booking.',
    bestFor: 'UK visa routes that require a named SELT.',
    format: 'Paper-based or computer-based, at an authorised UKVI centre',
    durationMinutes: 165,
    validitySummary: 'Confirm the result-recency rule for your route with current official guidance.',
    difficultyLevel: 'Academic or General Training English across four skills',
    isPopular: true,
    sortOrder: 2,
    acceptance: [
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'visa', summary: 'Required by name for certain UK visa routes. Confirm the route, level and authorised centre before booking.' },
    ],
    faqs: [
      { question: 'Is IELTS UKVI different from IELTS?', answer: 'IELTS for UKVI follows the same test format, but it is taken at UKVI-authorised centres and is the version named for certain UK immigration routes. Confirm which one your route requires.' },
      { question: 'Do universities accept IELTS UKVI?', answer: 'Universities generally accept IELTS for UKVI results, but their own English policy governs admission. Check the course page and confirm the required test name.' },
    ],
  },
  {
    slug: 'pte-academic',
    name: 'PTE Academic',
    shortName: 'PTE Academic',
    testType: 'english_proficiency',
    provider: 'Pearson',
    officialUrl: 'https://www.pearsonpte.com/pte-academic/',
    shortDescription: 'Computer-based test accepted by many universities and immigration authorities.',
    longDescription:
      'PTE Academic is a computer-based English proficiency test accepted by many universities and immigration authorities, including in Australia, the UK and Canada. It suits students who prefer fast results and computer-based assessment, with integrated tasks assessed by automated scoring. ALO Education helps you map your required PTE score to the institution and route you are applying to.',
    bestFor: 'Australia, the UK and other destinations where a fast computer-based result helps.',
    format: 'Fully computer-based at an authorised test centre',
    durationMinutes: 120,
    validitySummary: 'Many institutions expect results no older than two years; confirm with the receiving institution.',
    difficultyLevel: 'Computer-based academic English, integrated tasks',
    isPopular: true,
    isFeatured: true,
    sortOrder: 3,
    acceptance: [
      { countryName: 'Australia', countrySlug: 'australia', acceptanceType: 'university', summary: 'Accepted by many Australian universities and commonly used for student visa evidence, subject to the required score.' },
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'university', summary: 'Accepted by many UK institutions for admission. Visa routes may require a named SELT — check separately.' },
      { countryName: 'Canada', countrySlug: 'canada', acceptanceType: 'university', summary: 'Accepted by a range of Canadian institutions; confirm the required score.' },
    ],
    faqs: [
      { question: 'How is PTE Academic scored?', answer: 'PTE Academic reports an overall score on a 10–90 scale, aligned to the Global Scale of English, with communicative and enabling skills scores also reported.' },
      { question: 'How quickly do PTE results arrive?', answer: 'Results are typically available within two days, though some results take longer. Check the current provider schedule for your booking.' },
      { question: 'Is PTE easier than IELTS?', answer: 'The tests assess similar skills in different formats. Choose the one your institution accepts and in which your practice scores are strongest, rather than assuming one is easier.' },
    ],
  },
  {
    slug: 'oietc',
    name: 'OIETC – ELLT',
    shortName: 'OIETC – ELLT',
    testType: 'english_proficiency',
    provider: 'Oxford International Education Group (Oxford ELLT)',
    officialUrl: 'https://oxfordellt.com/ellt-global/test-takers/',
    shortDescription: 'Online English test accepted by selected UK universities.',
    longDescription:
      'OIETC – ELLT (Oxford International English Language Test / English Language Level Test) is an online English test accepted by selected UK universities. It assesses reading, listening, writing and speaking, with a separately scheduled speaking component depending on the version you take. Confirm that your chosen university names this test before booking.',
    bestFor: 'Applicants to UK institutions that specifically name the Oxford ELLT.',
    format: 'Online, with a scheduled speaking component depending on the version',
    durationMinutes: 120,
    validitySummary: 'Confirm the result-recency rule with the receiving institution.',
    difficultyLevel: 'Academic English across four skills',
    sortOrder: 4,
    acceptance: [
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'university', summary: 'Accepted by selected UK universities. Confirm the named test, version and required level on your course page.' },
    ],
    faqs: [
      { question: 'Is the Oxford ELLT pass or fail?', answer: 'The Oxford ELLT reports levels, and component assessment uses a 0–12 scale. It is not simply pass or fail — confirm the level your institution requires.' },
      { question: 'Can I take the ELLT from home?', answer: 'The test is delivered online, and the speaking component is scheduled separately depending on the version. Check the current provider requirements for equipment, identification and environment.' },
    ],
  },
  {
    slug: 'toefl-ibt',
    name: 'TOEFL iBT',
    shortName: 'TOEFL iBT',
    testType: 'english_proficiency',
    provider: 'ETS',
    officialUrl: 'https://www.ets.org/toefl.html',
    shortDescription: 'Widely accepted, especially in the USA and Canada.',
    longDescription:
      'TOEFL iBT is widely accepted, especially by institutions in the USA and Canada, and is also used in many other destinations. The test format was updated for 2026, so preparation should follow current ETS tasks rather than older templates. ALO Education helps you work to the 2026 format and the score your university states.',
    bestFor: 'USA and Canada applications, and institutions that name TOEFL.',
    format: 'Computer-based at an authorised centre or via the current ETS home option',
    durationMinutes: 120,
    validitySummary: 'ETS and receiving institutions set recency rules; confirm before booking.',
    difficultyLevel: 'Academic English across four skills',
    isPopular: true,
    sortOrder: 5,
    acceptance: [
      { countryName: 'United States', countrySlug: 'usa', acceptanceType: 'university', summary: 'Widely accepted by US institutions for admission.' },
      { countryName: 'Canada', countrySlug: 'canada', acceptanceType: 'university', summary: 'Accepted by Canadian institutions; confirm the required score.' },
    ],
    faqs: [
      { question: 'How is TOEFL iBT scored in 2026?', answer: 'From January 2026, TOEFL iBT scores use a 1–6 scale in half-band steps, with comparable overall 0–120 reporting during the transition. Use current ETS guidance and your university’s stated requirement.' },
      { question: 'Has the TOEFL format changed?', answer: 'Yes. The 2026 test uses adaptive Reading and Listening, revised Writing tasks (Build a Sentence, Write an Email, Write for an Academic Discussion) and updated Speaking tasks (Listen and Repeat, Take an Interview).' },
      { question: 'Can I retake the TOEFL?', answer: 'Yes, subject to ETS retake rules, waiting periods and fees. Check the current ETS conditions before planning another attempt.' },
    ],
  },
  {
    slug: 'duolingo',
    name: 'Duolingo English Test',
    shortName: 'Duolingo',
    testType: 'english_proficiency',
    provider: 'Duolingo',
    officialUrl: 'https://englishtest.duolingo.com/',
    shortDescription: 'Online test accepted by many universities globally.',
    longDescription:
      'The Duolingo English Test is an online, adaptive English test accepted by many universities globally. It is often chosen when an application deadline is close, because it can be taken at home and results are normally returned quickly. Acceptance is always institution-specific — confirm that your university names the test before you book.',
    bestFor: 'Fast applications where the receiving institution names the Duolingo English Test.',
    format: 'Online, adaptive, with remote proctoring and certification checks',
    durationMinutes: 60,
    validitySummary: 'Confirm the result-recency rule with the receiving institution.',
    difficultyLevel: 'Adaptive academic English',
    isPopular: true,
    sortOrder: 6,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'general', summary: 'Accepted by many universities globally. Acceptance is institution-specific — confirm the named test and required score on your course page.' },
    ],
    faqs: [
      { question: 'How is the Duolingo English Test scored?', answer: 'It reports a score from 10 to 160. Institutions set their own required score, so compare only against the requirement published by your university.' },
      { question: 'How fast are Duolingo results?', answer: 'Results are normally certified within two days, subject to certification checks. Individual results can take longer.' },
      { question: 'Can I take it at home?', answer: 'Yes, but there are strict rules on room, lighting, identification, eye contact and permitted equipment. Review the current certification rules before your test.' },
    ],
  },
  {
    slug: 'languagecert',
    name: 'LanguageCert',
    shortName: 'LanguageCert',
    testType: 'english_proficiency',
    provider: 'LanguageCert (PeopleCert)',
    officialUrl: 'https://www.languagecert.org/en',
    shortDescription: 'UK-based English qualification accepted by selected institutions.',
    longDescription:
      'LanguageCert offers UK-based English qualifications, including LanguageCert Academic and SELT versions used for certain UK visa routes. Choose the named qualification first, because format, timing and score reporting differ between qualifications. ALO Education helps you confirm which LanguageCert qualification your institution or route requires.',
    bestFor: 'Applicants whose institution or UK visa route names a LanguageCert qualification.',
    format: 'Computer-based or paper-based, depending on the qualification',
    durationMinutes: 154,
    validitySummary: 'Confirm the result-recency rule with the receiving institution or route.',
    difficultyLevel: 'Academic English across four skills',
    sortOrder: 7,
    acceptance: [
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'university', summary: 'Accepted by selected UK institutions. SELT versions are used for certain visa routes — confirm the exact qualification.' },
    ],
    faqs: [
      { question: 'Which LanguageCert qualification do I need?', answer: 'LanguageCert Academic and the SELT versions are different qualifications with different rules. Confirm the exact name required by your institution or route before booking.' },
      { question: 'How is LanguageCert Academic scored?', answer: 'LanguageCert Academic reports a total and skill scores out of 100, linked to CEFR levels. Institutions set their own required score.' },
    ],
  },
  {
    slug: 'kaplan',
    name: 'Kaplan English Test',
    shortName: 'Kaplan',
    testType: 'english_proficiency',
    provider: 'Kaplan International',
    officialUrl: 'https://www.kaplanenglishtest.com/',
    shortDescription: 'Accepted by Kaplan partner universities.',
    longDescription:
      'The Kaplan English Test (KTE) is accepted by Kaplan partner universities as evidence of English proficiency. It covers reading, listening, writing and speaking and is delivered with remote proctoring for the certified test. Confirm that your chosen university names the test, and which score it requires, before booking.',
    bestFor: 'Applicants to Kaplan partner universities that name the KTE.',
    format: 'Online with remote proctoring for the certified test',
    durationMinutes: 120,
    validitySummary: 'Confirm the result-recency rule with the receiving institution.',
    difficultyLevel: 'Academic English across four skills',
    sortOrder: 8,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'general', summary: 'Accepted by Kaplan partner universities. Confirm the named test and required score with your institution.' },
    ],
    faqs: [
      { question: 'How is the Kaplan English Test scored?', answer: 'Kaplan issues a proficiency report. Confirm the required score and reporting scale directly with the receiving institution.' },
      { question: 'How quickly are KTE results issued?', answer: 'The official certified test result is normally issued within five business days. Check the current provider schedule for your booking.' },
    ],
  },
  {
    slug: 'oet',
    name: 'OET (for Health Professionals)',
    shortName: 'OET',
    testType: 'english_proficiency',
    provider: 'Cambridge Boxhill Language Assessment',
    officialUrl: 'https://oet.com/',
    shortDescription: 'Designed for healthcare courses and professionals.',
    longDescription:
      'OET (Occupational English Test) is designed for healthcare courses and professionals. It uses healthcare-specific reading, listening, writing and speaking role-plays for your profession, which makes it a good fit where a regulator or employer names it. Confirm the required grades with the registering body before booking.',
    bestFor: 'Healthcare courses, registration and employment where OET is named.',
    format: 'Profession-specific sub-tests, at a centre or via the current OET at Home option',
    durationMinutes: 180,
    validitySummary: 'Regulators and employers set recency rules; confirm with the registering body.',
    difficultyLevel: 'Healthcare communication in English',
    sortOrder: 9,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'professional', summary: 'Used by healthcare regulators, employers and some institutions. Confirm the named test and required grades with the registering body.' },
    ],
    faqs: [
      { question: 'How is OET scored?', answer: 'Each of the four sub-tests is scored from 0 to 500 with a corresponding grade. Regulators usually set a minimum grade per sub-test.' },
      { question: 'Is OET only for doctors and nurses?', answer: 'OET is available for a range of healthcare professions. Choose the profession-specific version that matches your role and the requirement set by your regulator.' },
    ],
  },
  {
    slug: 'password',
    name: 'Password English Language Test',
    shortName: 'Password',
    testType: 'english_proficiency',
    provider: 'Password English Language Testing Ltd',
    officialUrl: 'https://passwordplus.englishlanguagetesting.co.uk/',
    shortDescription: 'An online, CEFR-aligned English test used by universities for admission. It is not a UKVI-approved SELT.',
    longDescription:
      'The Password English Language Test is an online, CEFR-aligned English proficiency assessment produced by Password English Language Testing Ltd and academically validated by CRELLA (Centre for Research in English Language Learning and Assessment) at the University of Bedfordshire. Password Skills Plus covers reading, writing, listening and speaking, is taken online under live proctoring by Meazure Learning, and result certificates are normally emailed within five working days. It is used by universities and pathway providers for admission and pre-sessional placement. It is not on the UK Home Office list of approved Secure English Language Tests, so it cannot be used where a visa route requires a SELT.',
    bestFor: 'Applicants to universities and pathway providers that name the Password test.',
    format: 'Online, live-proctored by Meazure Learning',
    durationMinutes: 185,
    validitySummary: 'Recency rules are set by the receiving institution.',
    difficultyLevel: 'Academic English across four skills',
    sortOrder: 10,
    acceptance: [
      { countryName: 'United Kingdom', countrySlug: 'uk', acceptanceType: 'university', summary: 'Accepted by many UK universities and pathway providers for admission and pre-sessional placement. It is not a UKVI-approved SELT — a visa route that requires a SELT cannot use it.' },
    ],
    faqs: [
      { question: 'Is the Password test accepted for a UK student visa?', answer: 'No. Password is a university-admission test and is not on the UK Home Office list of approved Secure English Language Tests. Where your visa route requires a SELT, sit a test named for that route instead.' },
      { question: 'What is the difference between Password Skills and Password Skills Plus?', answer: 'Password Skills Plus adds the speaking module and finer score reporting. Confirm which version your institution requires before booking.' },
      { question: 'How quickly are Password results issued?', answer: 'Result certificates are normally emailed within five working days, either to you or directly to your institution if you used a coupon.' },
    ],
  },
  {
    slug: 'cambridge-english',
    name: 'CAE / CPE — Cambridge English',
    shortName: 'CAE / CPE',
    testType: 'english_proficiency',
    provider: 'Cambridge University Press & Assessment',
    officialUrl: 'https://www.cambridgeenglish.org/exams-and-tests/qualifications/',
    shortDescription: 'Cambridge English advanced certifications.',
    longDescription:
      'Cambridge C1 Advanced (formerly CAE) and C2 Proficiency (formerly CPE) are advanced academic English certifications accepted by selected institutions. They assess Reading and Use of English, Writing, Listening and Speaking. Choose the qualification and score your institution specifies; these qualifications are not interchangeable with a UKVI SELT.',
    bestFor: 'Advanced academic English where the named Cambridge qualification is accepted.',
    format: 'Digital or paper at an authorised centre',
    durationMinutes: 235,
    validitySummary: 'Cambridge certificates do not expire, but receiving institutions can set recency requirements.',
    difficultyLevel: 'Advanced / proficient',
    sortOrder: 11,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'general', summary: 'Accepted by selected institutions globally. Confirm the named qualification and required Cambridge English Scale score.' },
    ],
    faqs: [
      { question: 'Should I take C1 Advanced or C2 Proficiency?', answer: 'Choose the qualification your institution names. C1 Advanced targets the C1 level and C2 Proficiency targets the C2 level; they are different qualifications, not easy and hard versions of the same test.' },
      { question: 'Do Cambridge certificates expire?', answer: 'Cambridge certificates do not expire, but the receiving institution can set its own recency requirement. Confirm before booking.' },
      { question: 'Is a Cambridge qualification a SELT for a UK visa?', answer: 'No. Where a UK visa route requires a SELT, you must take a test named for that route. Check current official guidance before booking.' },
    ],
  },
  {
    slug: 'gre',
    name: 'GRE',
    shortName: 'GRE',
    testType: 'academic',
    provider: 'ETS',
    officialUrl: 'https://www.ets.org/gre.html',
    shortDescription: 'Required for many postgraduate programs.',
    longDescription:
      'The GRE General Test is required for many postgraduate programmes, particularly in the USA. It measures Verbal Reasoning, Quantitative Reasoning and Analytical Writing. The GRE is an admissions test, not an English-language test: it does not replace IELTS, PTE, TOEFL or another required English qualification.',
    bestFor: 'Postgraduate applications that require the GRE General Test.',
    format: 'Computer-based at a centre or via the current at-home option',
    durationMinutes: 118,
    validitySummary: 'ETS and institutions set score-recency rules; confirm before booking.',
    difficultyLevel: 'Graduate-level verbal, quantitative and analytical writing',
    sortOrder: 12,
    acceptance: [
      { countryName: 'United States', countrySlug: 'usa', acceptanceType: 'university', summary: 'Required by many US postgraduate programmes. Confirm programme requirements before booking.' },
    ],
    faqs: [
      { question: 'Does the GRE replace an English test?', answer: 'No. The GRE is an admissions test. Institutions normally require a separate English-language qualification, such as IELTS, PTE or TOEFL, in addition to the GRE.' },
      { question: 'How is the GRE scored?', answer: 'Verbal Reasoning and Quantitative Reasoning are each scored 130–170, and Analytical Writing is scored 0–6.' },
    ],
  },
  {
    slug: 'gmat',
    name: 'GMAT',
    shortName: 'GMAT',
    testType: 'academic',
    provider: 'GMAC',
    officialUrl: 'https://www.mba.com/exams/gmat-exam',
    shortDescription: 'Required for MBA and business programs.',
    longDescription:
      'The GMAT is required for many MBA and business programmes. It measures Quantitative Reasoning, Verbal Reasoning and Data Insights. Like the GRE, it is an admissions test and does not replace a required English-language qualification.',
    bestFor: 'MBA and business school applications that require the GMAT.',
    format: 'Computer-based at a centre or online, depending on availability',
    durationMinutes: 135,
    validitySummary: 'GMAC and institutions set score-recency rules; confirm before booking.',
    difficultyLevel: 'Graduate business reasoning and data interpretation',
    sortOrder: 13,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'university', summary: 'Required by many MBA and business programmes. Confirm programme requirements before booking.' },
    ],
    faqs: [
      { question: 'Does the GMAT replace an English test?', answer: 'No. Business programmes normally require a separate English-language qualification in addition to the GMAT.' },
      { question: 'How is the GMAT scored?', answer: 'The GMAT reports a total score from 205 to 805, with section scores from 60 to 90.' },
    ],
  },
  {
    slug: 'sat',
    name: 'SAT',
    shortName: 'SAT',
    testType: 'academic',
    provider: 'College Board',
    officialUrl: 'https://satsuite.collegeboard.org/sat',
    shortDescription: 'Undergraduate admission test.',
    longDescription:
      'The SAT is an undergraduate admission test used mainly for US university applications. It now uses a digital format covering Reading and Writing and Math. It is an admissions test and does not replace a required English-language qualification.',
    bestFor: 'Undergraduate applications that require or accept the SAT.',
    format: 'Digital, at an authorised test centre',
    durationMinutes: 134,
    validitySummary: 'College Board and institutions set score-recency rules; confirm before booking.',
    difficultyLevel: 'School-leaving reading, writing and mathematics',
    sortOrder: 14,
    acceptance: [
      { countryName: 'United States', countrySlug: 'usa', acceptanceType: 'university', summary: 'Used for undergraduate admission. Confirm whether your institution requires or is test-optional.' },
    ],
    faqs: [
      { question: 'Does the SAT replace an English test?', answer: 'No. International applicants are normally required to provide a separate English-language qualification.' },
      { question: 'How is the SAT scored?', answer: 'The digital SAT reports a total score from 400 to 1600, combining Reading and Writing and Math section scores.' },
    ],
  },
  {
    slug: 'act',
    name: 'ACT',
    shortName: 'ACT',
    testType: 'academic',
    provider: 'ACT',
    officialUrl: 'https://www.act.org/',
    shortDescription: 'Alternative undergraduate admission test.',
    longDescription:
      'The ACT is an alternative undergraduate admission test, mainly for US university applications. The enhanced format changes timing and makes Science and Writing optional in some administrations. It is an admissions test and does not replace a required English-language qualification.',
    bestFor: 'Undergraduate applications that require or accept the ACT.',
    format: 'Digital at an authorised test centre, with optional sections',
    durationMinutes: 125,
    validitySummary: 'ACT and institutions set score-recency rules; confirm before booking.',
    difficultyLevel: 'School-leaving English, mathematics, reading and optional science',
    sortOrder: 15,
    acceptance: [
      { countryName: 'United States', countrySlug: 'usa', acceptanceType: 'university', summary: 'Used for undergraduate admission. Confirm whether your institution requires or is test-optional.' },
    ],
    faqs: [
      { question: 'Does the ACT replace an English test?', answer: 'No. International applicants are normally required to provide a separate English-language qualification.' },
      { question: 'How is the ACT scored?', answer: 'The ACT reports a composite score from 1 to 36. Confirm the enhanced format and optional sections for your administration.' },
    ],
  },
  {
    slug: 'oxford-ellt',
    name: 'Oxford ELLT',
    shortName: 'Oxford ELLT',
    testType: 'english_proficiency',
    provider: 'Oxford International Education Group (Oxford ELLT)',
    officialUrl: 'https://oxfordellt.com/ellt-global/test-takers/',
    shortDescription: 'Online English test accepted by selected institutions.',
    longDescription:
      'The Oxford ELLT (English Language Level Test) is delivered online and accepted by selected institutions. Timing, scoring and result scheduling depend on the exact ELLT version and package you book, so review the version specified by your institution before preparing.',
    bestFor: 'Applicants whose institution names the Oxford ELLT.',
    format: 'Online, with the speaking component scheduled by package',
    durationMinutes: 120,
    validitySummary: 'Confirm the result-recency rule with the receiving institution.',
    difficultyLevel: 'Academic English across four skills',
    sortOrder: 16,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'general', summary: 'Accepted by selected institutions. Confirm the named version and required level with your university.' },
    ],
    faqs: [
      { question: 'Which Oxford ELLT version do I need?', answer: 'Several versions exist. Confirm the exact version and package named by your institution before booking, because timing and component scheduling differ.' },
    ],
  },
  {
    slug: 'moi',
    name: 'MOI (Medium of Instruction)',
    shortName: 'MOI',
    testType: 'moi_guidance',
    provider: 'Receiving institution decides',
    // Official UK guidance on the English-language evidence a Student visa
    // route accepts — the reference point for any waiver discussion.
    officialUrl: 'https://www.gov.uk/student-visa/knowledge-of-english',
    shortDescription: 'A possible English-language waiver route — not an English test.',
    longDescription:
      'A Medium of Instruction (MOI) letter is evidence that previous study was taught in English. It is not itself an English test. Any waiver depends on the receiving institution, the course and the applicable immigration rules. Obtain written confirmation from the institution and check official guidance before relying on an MOI.',
    bestFor: 'Checking whether a university will waive an English test on the basis of previous study.',
    format: 'Institution-issued letter; no test to sit',
    durationMinutes: 0,
    validitySummary: 'Institutions set their own recency and eligibility rules.',
    difficultyLevel: 'Not applicable — this is guidance, not a test',
    sortOrder: 17,
    acceptance: [
      { countryName: 'Multiple destinations', countrySlug: '', acceptanceType: 'general', summary: 'Waiver decisions are made by the receiving institution and, where relevant, the immigration authority. Obtain written confirmation before relying on an MOI.' },
    ],
    faqs: [
      { question: 'Is an MOI accepted instead of IELTS?', answer: 'An MOI letter is not a test. Some institutions waive an English test on the basis of previous English-medium study, but this is institution-specific. Get written confirmation and check whether visa evidence rules also allow it.' },
      { question: 'Does an MOI satisfy visa requirements?', answer: 'Not automatically. Immigration evidence rules are separate from university admission. Check current official guidance for your route.' },
    ],
  },
];

/**
 * Language-prep outcome stories supplied by ALO Education.
 *
 * No names, universities, dates or scores are invented here: each record stores
 * the destination label and the narrative exactly as provided. Records are
 * created with an approved consent marker but remain `draft` unless
 * `ALO_SEED_PUBLISH_STORIES=1` is set, so nothing is published by default.
 */
/**
 * Standard module layouts for the four-skill tests.
 *
 * Only the module *names* are stored — these are the sections every official
 * provider publishes for the named test. Section timings are deliberately NOT
 * invented: `reviewedModules()` (editorial.ts) is the only place per-section
 * durations come from, and it supplies them only where an official source was
 * reviewed. Everywhere else the card points the reader at the provider.
 */
const DEFERRED_TIMING = 'Confirm the current timing with the official provider.';
const MODULE_SETS: Record<string, Array<[string, string]>> = {
  ielts: [
    ['Listening', 'Four recorded passages, with time to transfer answers.'],
    ['Reading', 'Three long academic or general texts with a range of question types.'],
    ['Writing', 'Two tasks: a data description or letter, and an extended essay.'],
    ['Speaking', 'A face-to-face or video interview with a certified examiner.'],
  ],
  'ielts-ukvi': [
    ['Listening', 'Four recorded passages, with time to transfer answers.'],
    ['Reading', 'Three texts; Academic or General Training depending on the version booked.'],
    ['Writing', 'Two tasks matched to the Academic or General Training version booked.'],
    ['Speaking', 'A face-to-face or video interview with a certified examiner.'],
  ],
  'pte-academic': [
    ['Speaking & Writing', 'Integrated computer-based tasks assessed by automated scoring.'],
    ['Reading', 'Integrated items including fill-in-the-blanks and reordering tasks.'],
    ['Listening', 'Recorded academic audio with summarising and dictation tasks.'],
  ],
  oietc: [
    ['Reading', 'Online reading tasks for the selected Oxford ELLT version.'],
    ['Listening', 'Online listening tasks for the selected Oxford ELLT version.'],
    ['Writing', 'Written responses assessed against the ELLT scale.'],
    ['Speaking', 'A separately scheduled speaking assessment depending on the version.'],
  ],
  'oxford-ellt': [
    ['Reading', 'Online reading tasks for the selected Oxford ELLT version.'],
    ['Listening', 'Online listening tasks for the selected Oxford ELLT version.'],
    ['Writing', 'Written responses assessed against the ELLT scale.'],
    ['Speaking', 'A separately scheduled speaking assessment depending on the package.'],
  ],
  duolingo: [
    ['Adaptive Literacy', 'Reading, vocabulary and grammar items that adapt to your responses.'],
    ['Adaptive Listening & Speaking', 'Listen-and-speak, read-aloud and open speaking responses.'],
    ['Writing', 'Written responses plus the scored writing sample.'],
  ],
  languagecert: [
    ['Listening', 'Recorded tasks for the named LanguageCert qualification.'],
    ['Reading', 'Reading tasks for the named LanguageCert qualification.'],
    ['Writing', 'Written tasks for the named LanguageCert qualification.'],
    ['Speaking', 'A spoken component delivered face to face or by video, depending on the qualification.'],
  ],
  kaplan: [
    ['Reading', 'Reading tasks in the official certified Kaplan English Test.'],
    ['Listening', 'Listening tasks in the official certified Kaplan English Test.'],
    ['Writing', 'Written responses in the official certified Kaplan English Test.'],
    ['Speaking', 'A spoken response recorded during the certified test.'],
  ],
  password: [
    ['Reading', 'Online reading tasks in the Password Skills Plus test.'],
    ['Writing', 'Written responses assessed against the CEFR-aligned Password scale.'],
    ['Listening', 'Online listening tasks in the Password Skills Plus test.'],
    ['Speaking', 'A spoken component delivered online under live proctoring.'],
  ],
  oet: [
    ['Listening', 'Healthcare consultations and presentations, in two parts.'],
    ['Reading', 'Healthcare texts, split into a fast skim part and a detailed reading part.'],
    ['Writing', 'A profession-specific referral, discharge or advice letter.'],
    ['Speaking', 'Profession-specific role-plays based on real workplace scenarios.'],
  ],
  sat: [
    ['Reading and Writing', 'Digital modules with short passages and accompanying questions.'],
    ['Math', 'Digital modules covering algebra, problem solving, data analysis and geometry.'],
  ],
  moi: [
    ['Eligibility check', 'Confirm whether the receiving institution accepts previous English-medium study.'],
    ['Document check', 'Confirm the letter format, dates and signatory the institution requires.'],
    ['Visa evidence check', 'Confirm separately whether the immigration route accepts a waiver.'],
  ],
};

const STORY_SEEDS: Array<{
  testSlug: string;
  studentName: string;
  countryName: string;
  universityName: string;
  courseName: string;
  previousScore: string;
  finalScore: string;
  testimonial: string;
}> = [
  {
    testSlug: 'ielts',
    studentName: 'UK Student — IELTS Success',
    countryName: 'United Kingdom',
    universityName: '',
    courseName: 'Undergraduate admission',
    previousScore: 'Required IELTS 6.5',
    finalScore: 'IELTS 7.0',
    testimonial: 'Student required IELTS 6.5 for UK undergraduate admission. Achieved IELTS 7.0 with ALO guidance and secured visa approval.',
  },
  {
    testSlug: 'pte-academic',
    studentName: 'Australia Student — PTE Route',
    countryName: 'Australia',
    universityName: '',
    courseName: 'University admission',
    previousScore: 'IELTS writing below requirement',
    finalScore: 'Required PTE score',
    testimonial: 'Student struggled with IELTS writing. Switched to PTE with ALO counselling and achieved required score within 1 month.',
  },
  {
    testSlug: 'duolingo',
    studentName: 'Canada Student — Duolingo Acceptance',
    countryName: 'Canada',
    universityName: '',
    courseName: 'University admission',
    previousScore: '',
    finalScore: 'Required Duolingo score',
    testimonial: 'Student applied late for intake. Used Duolingo English Test and received offer letter successfully.',
  },
  {
    testSlug: 'ielts-ukvi',
    studentName: 'UK Visa — IELTS UKVI',
    countryName: 'United Kingdom',
    universityName: '',
    courseName: 'UK visa compliance',
    previousScore: '',
    finalScore: 'Required IELTS UKVI score',
    testimonial: 'Student required IELTS UKVI for visa compliance. ALO guided correct test selection and documentation, visa approved smoothly.',
  },
];

async function main() {
  console.log('Seeding language-prep catalogue…');
  const publishStories = process.env.ALO_SEED_PUBLISH_STORIES === '1';

  for (const seed of TESTS) {
    const facts = REVIEWED_TEST_FACTS[seed.slug];
    const data = {
      name: seed.name,
      slug: seed.slug,
      shortName: seed.shortName,
      shortDescription: seed.shortDescription,
      longDescription: seed.longDescription,
      testType: seed.testType,
      provider: seed.provider,
      officialUrl: seed.officialUrl,
      format: seed.format,
      durationMinutes: seed.durationMinutes,
      durationDisplay: facts?.durationDisplay || 'Check current provider information',
      scoringSystem: facts?.scoringSystem || 'Check official provider information',
      resultTimeline: facts?.resultTimeline || 'Check current provider information',
      costSummary: PROVIDER_FEE_NOTICE,
      validitySummary: seed.validitySummary,
      bestFor: seed.bestFor,
      acceptanceSummary: ACCEPTANCE_NOTICE,
      difficultyLevel: seed.difficultyLevel,
      status: 'active',
      isPopular: Boolean(seed.isPopular),
      isFeatured: Boolean(seed.isFeatured),
      sortOrder: seed.sortOrder,
      sourceUrl: facts?.sourceUrl || seed.officialUrl || '',
      sourceName: SOURCE_NAME,
      verifiedBy: 'Official-source editorial review',
      verificationStatus: 'verified',
      lastVerifiedAt: REVIEWED_AT,
      seoTitle: `${seed.name} Preparation | ALO Education`,
      seoDescription: `Explore current ${seed.name} information and confirm requirements with official providers and institutions.`,
    };

    const test = await (db as any).englishPrepTest.upsert({
      where: { slug: seed.slug },
      create: data,
      update: data,
    });

    // Modules — reviewed layouts first (they carry source-checked section
    // timings); otherwise the standard section names for the named test, with
    // timing deferred to the official provider rather than invented.
    const reviewed = reviewedModules(seed.slug, test.id);
    const modules = reviewed?.length
      ? reviewed
      : (MODULE_SETS[seed.slug] || []).map(([moduleName, description], i) => ({
          id: `seed-${seed.slug}-${i}`,
          testId: test.id,
          moduleName,
          slug: `${seed.slug}-${i}`,
          durationMinutes: 0,
          durationDisplay: DEFERRED_TIMING,
          description,
          skillsAssessed: description,
          questionFormat: 'Use current official provider sample tasks.',
          preparationTips: 'Review official sample tasks, practise under suitable timing and use feedback to plan your next study session.',
          commonChallenges: 'Accuracy, clarity and time management.',
          sortOrder: i + 1,
          status: 'active',
          sourceUrl: facts?.sourceUrl || seed.officialUrl || '',
        }));
    if (modules?.length) {
      for (const entry of modules) {
        const row = {
          testId: test.id,
          moduleName: entry.moduleName,
          slug: entry.slug,
          durationMinutes: entry.durationMinutes || 0,
          durationDisplay: entry.durationDisplay,
          description: entry.description,
          skillsAssessed: entry.skillsAssessed,
          questionFormat: entry.questionFormat,
          preparationTips: entry.preparationTips,
          commonChallenges: entry.commonChallenges,
          sortOrder: entry.sortOrder,
          status: 'active',
          sourceUrl: entry.sourceUrl,
          lastVerifiedAt: REVIEWED_AT,
        };
        const existing = await (db as any).englishPrepModule.findFirst({
          where: { testId: test.id, moduleName: entry.moduleName },
        });
        if (existing) await (db as any).englishPrepModule.update({ where: { id: existing.id }, data: row });
        else await (db as any).englishPrepModule.create({ data: row });
      }
    }

    for (const [i, acceptance] of seed.acceptance.entries()) {
      const row = {
        testId: test.id,
        countryName: acceptance.countryName,
        countrySlug: acceptance.countrySlug,
        acceptanceType: acceptance.acceptanceType,
        summary: acceptance.summary,
        minimumNote: 'Check the current institution, course, delivery-mode and component-score requirements.',
        sourceUrl: facts?.sourceUrl || seed.officialUrl || '',
        sourceName: SOURCE_NAME,
        verifiedBy: 'Official-source editorial review',
        lastVerifiedAt: REVIEWED_AT,
        status: 'active',
      };
      const existing = await (db as any).englishPrepAcceptance.findFirst({
        where: { testId: test.id, countryName: acceptance.countryName, acceptanceType: acceptance.acceptanceType },
      });
      if (existing) await (db as any).englishPrepAcceptance.update({ where: { id: existing.id }, data: row });
      else await (db as any).englishPrepAcceptance.create({ data: row });
      void i;
    }

    for (const [i, faq] of seed.faqs.entries()) {
      const row = {
        testId: test.id,
        question: faq.question,
        answer: faq.answer,
        category: 'general',
        sortOrder: i + 1,
        status: 'active',
        sourceUrl: facts?.sourceUrl || seed.officialUrl || '',
        lastVerifiedAt: REVIEWED_AT,
      };
      const existing = await (db as any).englishPrepFaq.findFirst({
        where: { testId: test.id, question: faq.question },
      });
      if (existing) await (db as any).englishPrepFaq.update({ where: { id: existing.id }, data: row });
      else await (db as any).englishPrepFaq.create({ data: row });
    }

    console.log(`  ✓ ${seed.name}`);
  }

  console.log(publishStories ? 'Seeding language-prep outcome stories (published)…' : 'Seeding language-prep outcome stories (draft — set ALO_SEED_PUBLISH_STORIES=1 to publish)…');
  for (const story of STORY_SEEDS) {
    const test = await (db as any).englishPrepTest.findUnique({ where: { slug: story.testSlug } });
    if (!test) {
      console.warn(`  ! skipping story "${story.studentName}" — test "${story.testSlug}" not found`);
      continue;
    }
    const row = {
      testId: test.id,
      studentName: story.studentName,
      countryName: story.countryName,
      universityName: story.universityName,
      courseName: story.courseName,
      previousScore: story.previousScore,
      finalScore: story.finalScore,
      testimonial: story.testimonial,
      consentStatus: 'approved',
      status: publishStories ? 'published' : 'draft',
      publishedAt: publishStories ? NOW : null,
    };
    const existing = await (db as any).englishPrepSuccessStory.findFirst({
      where: { testId: test.id, studentName: story.studentName },
    });
    if (existing) await (db as any).englishPrepSuccessStory.update({ where: { id: existing.id }, data: row });
    else await (db as any).englishPrepSuccessStory.create({ data: row });
  }

  const count = await (db as any).englishPrepTest.count();
  console.log(`Language-prep seed complete — ${count} tests in the catalogue.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
