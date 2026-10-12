// ============================================================================
// ALO "You May Also Want to Know" / Related Questions engine (spec §10, §38).
// Canonical, honest Q&A pool with topic tags; selection is deterministic by
// content type + tags so services/scholarships/resources always show relevant
// (never unrelated random) questions. Pure — unit-testable.
// ============================================================================

export interface RelatedQuestion {
  id: string;
  question: string;
  answer: string;
  tags: string[]; // visa|scholarship|course|application|documents|english|finance|university|general|pre-departure
  href?: string;  // deeper article when available — never irrelevant
}

export const RELATED_QUESTIONS_POOL: RelatedQuestion[] = [
  { id: 'uk-admission-docs', question: 'What documents are needed for UK admission?', answer: 'Typically: passport, academic certificates and transcripts, English test evidence (when required), a personal statement, and reference details. Universities state exact requirements per course — verify on the official course page before applying.', tags: ['documents', 'application', 'university'], href: '/resources/application-tips' },
  { id: 'study-gap', question: 'Can I study abroad with a study gap?', answer: 'Often yes — many universities accept gaps when they are explained honestly (work, family, finances, preparation). The gap must be declared consistently across your CV, SOP and visa file.', tags: ['application', 'visa', 'general'], href: '/resources/study-abroad-guides' },
  { id: 'choose-university', question: 'How do I choose the right university?', answer: 'Match suitability before ranking: entry requirements you actually meet, tuition and living costs, English requirements, scholarships, intake availability, location, and graduate outcomes. ALO shortlists universities against your verified profile.', tags: ['university', 'course', 'general'], href: '/services/university-selection' },
  { id: 'apply-without-ielts', question: 'Can I apply without IELTS?', answer: 'Sometimes — some universities accept PTE, TOEFL, Duolingo, medium-of-instruction evidence, or internal tests; requirements differ per university and country (UKVI routes are stricter). Verify on the official course page or language authority before assuming.', tags: ['english', 'application', 'visa'], href: '/services/english-test-preparation' },
  { id: 'cost-of-study', question: 'How much does studying abroad cost?', answer: 'Total cost = tuition + deposits + living costs + insurance + visa fees + travel + emergency buffer. Figures vary by country, city and university — ALO shows figures only with source and last-verified date; never rely on unsourced numbers.', tags: ['finance', 'general'], href: '/services/financial-planning' },
  { id: 'how-scholarships-work', question: 'How do scholarships work?', answer: 'Scholarships are funds from governments, universities or providers with eligibility rules, deadlines and often separate applications. Some are awarded automatically with admission; others need a separate application. Check each scholarship’s official terms.', tags: ['scholarship', 'finance'], href: '/scholarships' },
  { id: 'visa-documents', question: 'What documents are needed for a student visa?', answer: 'Typically: passport, admission confirmation (CAS/I-20/COE or equivalent), financial evidence meeting the country’s exact rules, academic documents, English evidence where required, and country-specific items (e.g., TB test). Rules change — verify with the official government source before submitting.', tags: ['visa', 'documents'], href: '/services/visa-guidance' },
  { id: 'visa-processing-time', question: 'How long does a student visa take?', answer: 'Processing varies by country, season and applicant circumstances. Apply early against official published timelines; never book travel plans around guessed dates.', tags: ['visa', 'general'], href: '/services/visa-guidance' },
  { id: 'sop-importance', question: 'What should a Statement of Purpose contain?', answer: 'Your real story: why this subject, why this university, how your background connects, and what you plan next. Universities check originality — never copy or fabricate experiences.', tags: ['application', 'documents'], href: '/services/sop-cv-support' },
  { id: 'conditional-vs-unconditional', question: 'What is the difference between a conditional and unconditional offer?', answer: 'A conditional offer requires you to meet stated conditions (final results, English, deposit); an unconditional offer means all conditions are met. Track each condition to completion — ALO monitors this with you.', tags: ['application', 'university'], href: '/services/application-assistance' },
  { id: 'deadline-planning', question: 'When should I start my application?', answer: 'Safe planning starts 9–12 months before intake: shortlist (month 1–2), tests (2–4), applications (4–6), offer conditions (6–8), visa file (8–10), pre-departure (10–12). Adjust to real deadlines per university.', tags: ['application', 'general'], href: '/resources/application-tips' },
  { id: 'multiple-scholarships', question: 'Can I apply for more than one scholarship?', answer: 'Usually yes — most providers allow multiple applications unless terms say otherwise. Track each deadline separately and never reuse a copied statement across applications.', tags: ['scholarship'], href: '/scholarships' },
  { id: 'accommodation-options', question: 'What are my accommodation options abroad?', answer: 'University halls, private student residences, shared flats and homestays — each with different contracts, deposits and notice periods. Book only through verifiable channels and keep written records.', tags: ['pre-departure', 'finance'], href: '/resources/accommodation' },
  { id: 'first-week-in-uk', question: 'What should I do in my first week after arrival?', answer: 'Complete enrolment, register locally where required, open banking, activate insurance, learn your transport routes, and save emergency contacts. ALO provides a first-week checklist in pre-departure orientation.', tags: ['pre-departure', 'visa'], href: '/services/pre-departure-orientation' },
  { id: 'financial-evidence', question: 'How much financial evidence is needed for a visa?', answer: 'Countries set exact formulas (tuition balance + living-cost fund held for a defined period). The amount and holding period must match the current official rule — verify on the government site, never an agent’s number.', tags: ['visa', 'finance', 'documents'], href: '/services/visa-guidance' },
  { id: 'credibility-interview', question: 'What is a credibility interview?', answer: 'An interview testing whether you genuinely intend to study: your course, university, finances and plans. Answers must be consistent with your documents. Questions vary — prepare themes, not memorized scripts.', tags: ['visa', 'application'], href: '/services/interview-preparation' },
];

/** Deterministic, relevant selection: match tags in priority order, stable order. */
export function pickRelatedQuestions(tags: string[], count: number = 6): RelatedQuestion[] {
  const want = new Set(tags.map((t) => t.toLowerCase()));
  const scored = RELATED_QUESTIONS_POOL.map((q, idx) => {
    const hits = q.tags.filter((t) => want.has(t)).length;
    return { q, hits, idx };
  }).filter((s) => s.hits > 0);
  scored.sort((a, b) => b.hits - a.hits || a.idx - b.idx);
  return scored.slice(0, count).map((s) => s.q);
}

/** Map a page context to its question tags. */
export function questionTagsFor(type: 'service' | 'scholarship' | 'resource', slugOrCategory: string): string[] {
  const s = (slugOrCategory || '').toLowerCase();
  const tags = new Set<string>(['general']);
  if (s.includes('visa')) { tags.add('visa'); tags.add('documents'); }
  if (s.includes('scholarship')) { tags.add('scholarship'); tags.add('finance'); }
  if (s.includes('course') || s.includes('university')) { tags.add('course'); tags.add('university'); }
  if (s.includes('application') || s.includes('apply')) { tags.add('application'); }
  if (s.includes('document') || s.includes('checking')) { tags.add('documents'); }
  if (s.includes('english') || s.includes('ielts') || s.includes('test')) { tags.add('english'); }
  if (s.includes('financ') || s.includes('cost') || s.includes('fee')) { tags.add('finance'); }
  if (s.includes('departure') || s.includes('accommodation') || s.includes('arrival')) { tags.add('pre-departure'); }
  if (type === 'scholarship') tags.add('scholarship');
  return [...tags];
}
