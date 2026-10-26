import type { EnglishTest } from './types';

/** Official-source editorial facts, not student results or a visa decision. */
export const REVIEWED_ON = '2026-10-26';
export const REQUIRED_TEST_SLUGS = ['ielts', 'ielts-ukvi', 'pte-academic', 'oietc', 'toefl-ibt', 'duolingo', 'languagecert', 'kaplan', 'oet', 'cambridge-english', 'gre', 'gmat', 'sat', 'act'] as const;
export const PROVIDER_FEE_NOTICE = 'Fees depend on location, delivery mode and booking date. View the provider booking price before payment.';
export const ACCEPTANCE_NOTICE = 'Confirm the exact exam, delivery mode and minimum score with your university. Visa evidence rules are separate; a university offer does not confirm visa eligibility.';

type Facts = Pick<EnglishTest, 'durationDisplay' | 'scoringSystem' | 'resultTimeline' | 'sourceUrl'>;
export const REVIEWED_TEST_FACTS: Record<string, Facts> = {
  ielts: { durationDisplay: 'About 2h 45m', scoringSystem: 'IELTS bands 0–9', resultTimeline: 'Computer: usually 1–5 days; paper: usually 13 days. Local delivery arrangements apply.', sourceUrl: 'https://ielts.org/take-a-test/why-choose-ielts/ways-to-take-ielts' },
  'ielts-ukvi': { durationDisplay: 'About 2h 45m (Academic / General Training)', scoringSystem: 'IELTS bands 0–9', resultTimeline: 'Depends on delivery mode and local test centre; confirm when booking.', sourceUrl: 'https://ielts.org/take-a-test/test-types/ielts-for-ukvi' },
  'pte-academic': { durationDisplay: 'About 2 hours', scoringSystem: 'PTE score 10–90', resultTimeline: 'Typically 2 days; some results take longer.', sourceUrl: 'https://www.pearsonpte.com/pte-academic/' },
  oietc: { durationDisplay: 'Four skills; timing and speaking appointment depend on the ELLT version.', scoringSystem: 'Oxford ELLT levels; component assessment includes a 0–12 scale. Not simply pass/fail.', resultTimeline: 'Depends on package and completion of all components; Express has a separate schedule.', sourceUrl: 'https://oxfordellt.com/ellt-global/test-takers/' },
  'oxford-ellt': { durationDisplay: 'Four skills; check the selected ELLT version.', scoringSystem: 'Oxford ELLT levels; component assessment includes a 0–12 scale.', resultTimeline: 'Provider package and component-completion schedule apply.', sourceUrl: 'https://oxfordellt.com/ellt-global/test-takers/' },
  'toefl-ibt': { durationDisplay: 'Allow approximately 2 hours (updated 2026 format)', scoringSystem: '1–6 in half-band increments from January 2026; comparable 0–120 overall scores during the transition.', resultTimeline: 'ETS account scores: 3 days after the test; additional checks can affect delivery.', sourceUrl: 'https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html' },
  duolingo: { durationDisplay: 'About 1 hour', scoringSystem: 'DET score 10–160', resultTimeline: 'Normally within 2 days, subject to certification checks.', sourceUrl: 'https://englishtest.duolingo.com/' },
  languagecert: { durationDisplay: 'Academic: about 2h 34m; other qualifications differ.', scoringSystem: 'Academic: total and skill scores out of 100, linked to CEFR.', resultTimeline: 'Depends on qualification and delivery mode; Academic SELT publishes a 5-working-day schedule.', sourceUrl: 'https://www.languagecert.org/en/about-us/faq/languagecert-academic-faq' },
  kaplan: { durationDisplay: 'Reading/listening average 65m; writing 35–40m; speaking 10–15m.', scoringSystem: 'Kaplan proficiency report; confirm the required score with the receiving institution.', resultTimeline: 'Within 5 business days for the official certified test.', sourceUrl: 'https://www.kaplanenglishtest.com/test-guide/' },
  oet: { durationDisplay: 'Four healthcare communication subtests; confirm sitting and speaking appointment times.', scoringSystem: 'Each subtest 0–500, with corresponding grades.', resultTimeline: 'Delivery-mode and sitting-specific result schedule; use the provider calendar.', sourceUrl: 'https://oet.com/test/results-and-scoring' },
  'cambridge-english': { durationDisplay: 'C1 Advanced about 3h 55m; C2 Proficiency about 3h 56m (paired speaking).', scoringSystem: 'Cambridge English Scale: C1 certificate range 180–199; C2 certificate range 200–230.', resultTimeline: 'Digital: 5–10 working days; paper: normally 4–6 weeks.', sourceUrl: 'https://www.cambridgeenglish.org/exams-and-tests/qualifications/results/' },
  gre: { durationDisplay: 'About 1h 58m (current General Test)', scoringSystem: 'Verbal and Quantitative: 130–170 each; Analytical Writing: 0–6.', resultTimeline: 'Official scores normally 8–10 days after the test.', sourceUrl: 'https://www.ets.org/gre/test-takers/general-test/scores/get-scores.html' },
  gmat: { durationDisplay: '2h 15m, excluding an optional break', scoringSystem: 'Total 205–805; section scores 60–90.', resultTimeline: 'Consult your GMAT account for official score-report availability.', sourceUrl: 'https://www.mba.com/exams/gmat-exam/register' },
  sat: { durationDisplay: '2h 14m, excluding breaks', scoringSystem: 'Total 400–1600', resultTimeline: 'Use the College Board release date for your specific sitting.', sourceUrl: 'https://satsuite.collegeboard.org/sat/whats-on-the-test/structure' },
  act: { durationDisplay: 'Enhanced core test: 2h 05m; optional science/writing add time.', scoringSystem: 'Composite 1–36; confirm the enhanced format for your administration.', resultTimeline: 'Use ACT’s release schedule for your sitting and optional sections.', sourceUrl: 'https://www.act.org/content/dam/act/unsecured/documents/act-enhancements-educator-guide.pdf' },
};

export const CAMBRIDGE_TEST: EnglishTest = {
  id: 'test-cambridge-english', slug: 'cambridge-english', name: 'CAE / CPE — Cambridge English', shortName: 'CAE / CPE',
  shortDescription: 'C1 Advanced and C2 Proficiency qualifications for advanced academic English.',
  longDescription: 'Cambridge C1 Advanced (formerly CAE) and C2 Proficiency (formerly CPE) assess advanced English through Reading and Use of English, Writing, Listening and Speaking. Choose the qualification and required score specified by your institution; these qualifications are not interchangeable with a UKVI SELT.',
  testType: 'english_proficiency', provider: 'Cambridge University Press & Assessment', officialUrl: 'https://www.cambridgeenglish.org/exams-and-tests/qualifications/',
  format: 'Digital or paper at an authorised centre', durationMinutes: 235, ...REVIEWED_TEST_FACTS['cambridge-english'],
  costSummary: PROVIDER_FEE_NOTICE, validitySummary: 'Certificates do not expire; receiving institutions can set recency requirements.', bestFor: 'Advanced academic English where the named qualification is accepted.', acceptanceSummary: ACCEPTANCE_NOTICE,
  difficultyLevel: 'Advanced / proficient', status: 'active', isPopular: false, isFeatured: false, sortOrder: 10,
  sourceName: 'Cambridge English official guidance', verifiedBy: 'Official-source editorial review', verificationStatus: 'verified', lastVerifiedAt: REVIEWED_ON,
  seoTitle: 'Cambridge CAE / CPE Preparation | ALO Education', seoDescription: 'Compare C1 Advanced and C2 Proficiency formats, score reporting and preparation guidance with ALO Education.',
};

/** A newer, explicitly reviewed database entry wins over this dated reference. */
export function applyReviewedFacts(test: EnglishTest): EnglishTest {
  const facts = REVIEWED_TEST_FACTS[test.slug];
  if (!facts || (test.verificationStatus === 'verified' && (test.lastVerifiedAt || '') > REVIEWED_ON)) return test;
  return { ...test, ...facts, costSummary: test.costSummary && !/check current|mid-range|higher than|low cost/i.test(test.costSummary) ? test.costSummary : PROVIDER_FEE_NOTICE,
    acceptanceSummary: ACCEPTANCE_NOTICE, verifiedBy: 'Official-source editorial review', lastVerifiedAt: REVIEWED_ON, verificationStatus: 'verified' };
}

export function preparationSteps(test: Pick<EnglishTest, 'slug' | 'name'>): string[] {
  const focus: Record<string, string> = {
    ielts: 'Plan listening, reading, writing and speaking practice with feedback on writing structure and spoken clarity.',
    'ielts-ukvi': 'Confirm the exact IELTS for UKVI version and authorised centre before using IELTS module practice.',
    'pte-academic': 'Practise speaking into a microphone, integrated tasks and computer-based time management using current Pearson tasks.',
    oietc: 'Practise the selected ELLT components and prepare for the scheduled speaking assessment.',
    'oxford-ellt': 'Review the exact Oxford ELLT version and practise its reading, listening, writing and speaking tasks.',
    'toefl-ibt': 'Use ETS materials for the updated 2026 tasks and score scale, rather than an older TOEFL format.',
    duolingo: 'Practise the adaptive tasks and review room, equipment, identification and certification rules.',
    languagecert: 'Choose the named qualification first; practise its written and spoken components, and SELT requirements when applicable.',
    kaplan: 'Review the official certified KTE format and remote-proctoring requirements; practise academic communication.',
    oet: 'Use profession-specific healthcare reading, writing, listening and role-play speaking tasks.',
    'cambridge-english': 'Choose C1 Advanced or C2 Proficiency and practise Use of English, extended writing and paired speaking.',
    gre: 'Balance verbal reasoning, quantitative reasoning and analytical writing using current ETS practice tasks.',
    gmat: 'Plan Quantitative Reasoning, Verbal Reasoning and Data Insights practice using current GMAC materials.',
    sat: 'Practise digital Reading and Writing and Math with the current College Board tools and timing.',
    act: 'Confirm core and optional sections, then use the enhanced ACT timing and official practice format.',
  };
  return ['Discuss your study goals and request an initial language or academic-skills assessment.', 'Confirm the receiving university, course, visa evidence and required score before setting your target.', focus[test.slug] || `Review the current ${test.name} format and practise the skills it assesses.`, 'Use timed practice and feedback to identify weaknesses and adjust a realistic study schedule.', 'Review readiness, official booking conditions and document requirements; preparation cannot guarantee a score or visa.'];
}

export const LANGUAGE_TEST_FAQS = [
  { q: 'Which English test is best for UK study?', a: 'Choose the exact test and delivery mode accepted by your course and sponsor. IELTS Academic or other accepted tests may meet admission needs; certain visa situations require a named SELT such as IELTS for UKVI. Confirm both requirements before booking.' },
  { q: 'Can I apply without IELTS?', a: 'Some institutions accept PTE, TOEFL, Duolingo, another named test, or an eligible English-language waiver. Acceptance is course-specific, and an admission waiver does not automatically satisfy visa evidence requirements.' },
  { q: 'Is an English test mandatory for a visa?', a: 'You may need to prove English, but an English test is not the only permitted evidence in every case. Rules and exemptions depend on the country, route, qualification and sponsor. Check the current official immigration guidance.' },
  { q: 'Can I retake a test if I do not meet my score?', a: 'Most providers allow another attempt, subject to their waiting periods, attempt limits, booking fees and identification rules. Check those conditions before planning a retake.' },
  { q: 'Does ALO provide coaching?', a: 'Contact ALO for current preparation guidance, resources, mock-test options and feedback support. Ask which assessment or coaching services are available for your chosen exam and timetable before enrolment.' },
];

/** Current formats replace dated reference timings, without deleting stored module history. */
export function reviewedModules(slug: string, testId: string, reviewedAt?: string): import('./types').TestModule[] | null {
  if ((reviewedAt || '') > REVIEWED_ON) return null;
  const layouts: Record<string, Array<[string, string, string]>> = {
    'toefl-ibt': [['Reading', 'Adaptive timing', 'Academic reading and understanding written English.'], ['Listening', 'Adaptive timing', 'Understand conversations, announcements and academic speech.'], ['Writing', 'Current 2026 ETS format', 'Practise sentence building, email writing and academic discussion.'], ['Speaking', 'Current 2026 ETS format', 'Practise intelligible repetition and interview responses.']],
    gre: [['Analytical Writing', '30 minutes', 'Analyse an issue and support your reasoning clearly.'], ['Verbal Reasoning', 'Two sections: 18 and 23 minutes', 'Practise reading comprehension, text completion and sentence equivalence.'], ['Quantitative Reasoning', 'Two sections: 21 and 26 minutes', 'Practise quantitative comparison, problem solving and data interpretation.']],
    gmat: [['Quantitative Reasoning', '45 minutes', 'Practise problem-solving with arithmetic and algebra.'], ['Verbal Reasoning', '45 minutes', 'Practise reading comprehension and critical reasoning.'], ['Data Insights', '45 minutes', 'Interpret tables, graphs and multi-source information.']],
    act: [['English', 'Enhanced format; confirm your administration', 'Practise editing, conventions and language use.'], ['Mathematics', 'Enhanced format; confirm your administration', 'Practise mathematical reasoning and problem solving.'], ['Reading', 'Enhanced format; confirm your administration', 'Practise comprehension and interpretation.'], ['Science (optional)', 'Adds testing time', 'Practise interpreting scientific data when this section is required.'], ['Writing (optional)', 'Adds testing time', 'Practise analysing perspectives and developing an argument when required.']],
    'cambridge-english': [['Reading and Use of English', '90 minutes', 'Practise advanced reading, vocabulary, grammar and language use.'], ['Writing', '90 minutes', 'Practise two extended responses in the chosen exam format.'], ['Listening', 'About 40 minutes', 'Practise understanding a range of extended spoken texts.'], ['Speaking', 'C1: 15m; C2: 16m per pair', 'Practise interactive speaking with another candidate.']],
  };
  const rows = layouts[slug];
  if (!rows) return null;
  return rows.map(([moduleName, durationDisplay, description], i) => ({ id: `reviewed-${slug}-${i}`, testId, moduleName, slug: `${slug}-${i}`, durationMinutes: 0, durationDisplay, description, skillsAssessed: description, questionFormat: 'Use current official provider sample tasks.', preparationTips: 'Review official sample tasks, practise under suitable timing and use feedback to plan your next study session.', commonChallenges: 'Accuracy, clarity and time management.', sortOrder: i + 1, status: 'active', sourceUrl: REVIEWED_TEST_FACTS[slug].sourceUrl }));
}

function newerReview(value: unknown): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value.toISOString() : String(value);
  return date.slice(0, 10) > REVIEWED_ON;
}

/** Correct dated public reference guidance without rewriting stored history. */
export function reviewLanguageFaq<T extends { question: string; answer: string; testId?: string; lastVerifiedAt?: unknown }>(faq: T, slug?: string): T {
  if (newerReview(faq.lastVerifiedAt)) return faq;
  if (/\bSDS\b|Student Direct Stream/i.test(`${faq.question} ${faq.answer}`)) return { ...faq,
    answer: 'Canada closed the Student Direct Stream on 8 November 2024. New applicants must follow the current regular study-permit process. Confirm university English requirements separately with the institution.',
    sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/news/notices/end-student-direct-stream-nigeria-student-express.html', lastVerifiedAt: REVIEWED_ON };
  if (slug === 'toefl-ibt' || faq.testId === 'test-toefl') {
    const question = faq.question.toLowerCase();
    let answer = '';
    if (/scored|what is toefl ibt/.test(question)) answer = 'TOEFL iBT assesses four academic English skills. From January 2026, scores use a 1–6 scale in half-band steps, with comparable overall 0–120 reporting during the transition. Use current ETS guidance and your university’s stated requirements.';
    else if (/writing/.test(question)) answer = 'The 2026 Writing section includes Build a Sentence, Write an Email and Write for an Academic Discussion. Practise the current ETS tasks and scoring criteria rather than relying on an older Integrated Writing template.';
    else if (/speaking/.test(question)) answer = 'The 2026 Speaking section uses Listen and Repeat and Take an Interview tasks. Practise intelligible responses and the current ETS sample tasks; older integrated-task timings do not describe the updated section.';
    else if (/july 2023|compare to ielts|help with toefl/.test(question)) answer = 'Use the updated 2026 ETS format: adaptive Reading and Listening, revised Writing tasks and updated Speaking tasks. Preparation should match your booking version and the receiving university’s requirements.';
    if (answer) return { ...faq, answer, sourceUrl: 'https://www.ets.org/toefl/test-takers/ibt/about/content.html', lastVerifiedAt: REVIEWED_ON };
  }
  return faq;
}

export function reviewLanguageAcceptance<T extends { summary: string; minimumNote?: string; lastVerifiedAt?: unknown }>(record: T): T {
  if (newerReview(record.lastVerifiedAt)) return record;
  if (/\ball\b|\bSDS\b|99%|3,400/i.test(record.summary)) return { ...record, summary: ACCEPTANCE_NOTICE, minimumNote: 'Check the current institution, course, delivery-mode and component-score requirements.' };
  return record;
}
