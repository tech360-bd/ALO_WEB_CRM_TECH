import { createHash } from 'node:crypto';
import type { TopicAreaSeed, TopicProblemSeed } from './catalogue';
import { TOPIC_CATALOGUE } from './catalogue';
import { METHOD_OPTIONS } from '../constants';

/**
 * Deterministic topic-discovery engine.
 *
 * It is deliberately *not* an unconstrained text generator. It combines the
 * applicant's own profile and a curated catalogue of research areas into a
 * structured topic canvas. Every factual slot is either (a) derived from the
 * applicant's stated profile, (b) a documented search plan, or (c) explicitly
 * labelled provisional/unverified. It never asserts a statistic, citation or
 * supervisor availability.
 *
 * A generative AI provider may later enrich prose, but the same schema and the
 * same provenance labels apply (see src/lib/phd/ai/provider.ts).
 */

export interface TopicProfileInput {
  highestQualification?: string;
  degreeSubject?: string;
  classification?: string;
  relevantModules?: string;
  dissertationTitle?: string;
  methodsExperience?: string;
  publications?: string;
  researchExperience?: string;
  employmentHistory?: string;
  primaryDiscipline?: string;
  existingResearchIdea?: string;
  preferredMethods?: string;
  researchSetting?: string;
  studyMode?: string;
  desiredStart?: string;
  locationPreferences?: string;
  fundingRequirement?: string;
  equipmentNeeds?: string;
  englishTestStatus?: string;
  interests?: string[];
}

export interface TopicGenerationRequest {
  projectId: string;
  profile?: TopicProfileInput;
  discipline?: string;
  selectedAreaCodes?: string[];
  maxCandidates?: number;
  settingOverride?: string;
  methodOverride?: string;
}

export interface GeneratedObjective {
  text: string;
  measure: string;
}

export interface GeneratedMethodology {
  paradigm: string;
  design: string;
  methods: string;
  rationale: string;
  resources: string;
  risks: string;
}

export interface GeneratedTopic {
  areaCode: string;
  problemId: string;
  dedupeKey: string;
  workingTitle: string;
  plainLanguage: string;
  researchField: string;
  researchSubfield: string;
  problemStatement: string;
  initialEvidence: string;
  provisionalGap: string;
  mainQuestion: string;
  supportingQuestions: string[];
  aim: string;
  objectives: GeneratedObjective[];
  theoryFramework: string;
  methodology: GeneratedMethodology;
  dataNeeds: string;
  feasibilityRisks: string;
  ethics: string;
  scholarlyContribution: string;
  practicalContribution: string;
  potentialMatches: string;
  preliminaryReading: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceQuality: 'UNVERIFIED';
  unresolvedQuestions: string[];
  noveltyStatus: 'PROVISIONAL_UNVERIFIED';
  keywords: string[];
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'from', 'this', 'these', 'those', 'into', 'than', 'then',
  'their', 'there', 'which', 'while', 'where', 'when', 'what', 'how', 'why', 'are', 'is', 'was',
  'were', 'be', 'been', 'being', 'has', 'have', 'had', 'does', 'do', 'did', 'can', 'could', 'may',
  'might', 'must', 'should', 'would', 'not', 'but', 'its', 'it', 'as', 'at', 'by', 'in', 'of', 'on',
  'or', 'to', 'a', 'an', 'under', 'over', 'across', 'more', 'most', 'some', 'such', 'between',
]);

export function salientKeywords(text: string, limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9-]+/)) {
    if (raw.length < 4 || STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

function methodLabel(code: string): string {
  return METHOD_OPTIONS.find((method) => method.code === code)?.label ?? code;
}

function cleanSetting(profile?: TopicProfileInput, override?: string): string {
  const value = (override || profile?.researchSetting || '').trim();
  return value.length > 2 ? value.slice(0, 160) : 'UK organisations';
}

function contextSentence(profile: TopicProfileInput | undefined, setting: string): string {
  const subject = profile?.degreeSubject?.trim();
  const employment = profile?.employmentHistory?.trim();
  const bits: string[] = [];
  if (subject) bits.push(`the applicant's background in ${subject}`);
  if (employment) bits.push('their stated professional experience');
  bits.push(`a proposed empirical setting of ${setting}`);
  return bits.join(', ');
}

function confidenceFor(profile: TopicProfileInput | undefined): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (!profile) return 'LOW';
  let score = 0;
  if (profile.degreeSubject?.trim()) score += 1;
  if (profile.highestQualification?.trim()) score += 1;
  if (profile.methodsExperience?.trim()) score += 1;
  if (profile.researchExperience?.trim() || profile.publications?.trim()) score += 1;
  if (profile.preferredMethods?.trim()) score += 1;
  if (profile.existingResearchIdea?.trim()) score += 1;
  if (score >= 5) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

function chooseMethod(area: TopicAreaSeed, profile?: TopicProfileInput, override?: string): string {
  if (override && area.methods.includes(override)) return override;
  const preferred = (profile?.preferredMethods || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const match = area.methods.find((method) => preferred.includes(method));
  return match ?? area.methods[0];
}

function matchesArea(area: TopicAreaSeed, haystack: string): boolean {
  if (!haystack) return false;
  const hay = haystack.toLowerCase();
  return area.keywords.some((keyword) => hay.includes(keyword.toLowerCase())) ||
    hay.includes(area.name.toLowerCase().split(' ')[0]);
}

function methodSpecificObjectives(method: string): GeneratedObjective[] {
  const generic: GeneratedObjective[] = [
    {
      text: 'Establish the empirical and theoretical problem through a documented, reproducible literature search',
      measure: 'At least 40 screened sources recorded in the evidence library with inclusion and exclusion decisions',
    },
    {
      text: 'Specify an answerable research question, theoretical framework and testable propositions',
      measure: 'A supervisor-ready specification reviewed against the selected programme’s proposal requirements',
    },
  ];
  if (['INTERVIEWS_THEMATIC', 'CASE_STUDY', 'MIXED_METHODS', 'SURVEY_STATISTICS', 'ARCHIVAL_SECONDARY', 'ECONOMETRICS', 'EXPERIMENT_BEHAVIOURAL', 'DESIGN_SCIENCE', 'LONGITUDINAL_COMPARATIVE'].includes(method)) {
    return [
      ...generic,
      {
        text: 'Collect and document primary and/or secondary evidence with a defined sampling and consent strategy',
        measure: 'A pilot completed and a documented sample/source frame with achieved access confirmed',
      },
      {
        text: 'Analyse the evidence using the specified technique and test alternative explanations',
        measure: 'A reproducible analysis file plus sensitivity or robustness checks',
      },
      {
        text: 'Derive and critically evaluate the contribution for theory and practice',
        measure: 'A written contribution statement tested against at least two competing interpretations',
      },
    ];
  }
  return [
    ...generic,
    {
      text: 'Design, build or instrument the experimental or computational system',
      measure: 'A verified experimental/computational set-up with calibration or verification evidence',
    },
    {
      text: 'Measure performance against a defined baseline and validated benchmark',
      measure: 'Quantified results with uncertainty and at least one independent benchmark comparison',
    },
    {
      text: 'Assess scalability, safety and limitations of the approach',
      measure: 'A documented risk assessment and a limitations analysis accepted at progression review',
    },
  ];
}

function supportingQuestions(area: TopicAreaSeed, problem: TopicProblemSeed, setting: string): string[] {
  const focus = salientKeywords(problem.statement, 2).join(' and ') || area.keywords[0];
  return [
    `Which mechanisms explain the relationship between ${focus} and the observed outcome in ${setting}?`,
    `How do contextual conditions in ${setting} change the operation of those mechanisms?`,
    `Which organisational, technical or policy capabilities are associated with better outcomes, and for whom?`,
    `What alternative explanations or boundary conditions would falsify the proposed account?`,
    `What are the defensible theoretical and practical implications if the evidence supports the account?`,
  ];
}

function unresolvedQuestions(profile: TopicProfileInput | undefined, area: TopicAreaSeed): string[] {
  const questions = [
    'Does a documented literature search confirm that the proposed gap is genuine rather than a gap in the applicant’s current reading?',
    `Which named supervisors and research groups in the target universities have verified expertise in ${area.subfield}?`,
    'Can the required data, equipment or participants be accessed within the doctoral timeframe, and with what written permissions?',
    'Which funding route is confirmed open to a student with the applicant’s fee status and nationality?',
    'Which specific programme requirements (word limit, headings, referencing style, ethics review) apply?',
  ];
  if (!profile?.englishTestStatus || profile.englishTestStatus === 'UNKNOWN') {
    questions.push('Is an English-language test required, and has the applicant taken a test whose validity will last until the intended start date?');
  }
  if (!profile?.researchSetting?.trim()) {
    questions.push('What empirical setting (industry, geography, organisation type) is realistic and defensible, and why?');
  }
  return questions;
}

function buildTopic(area: TopicAreaSeed, problem: TopicProblemSeed, request: TopicGenerationRequest): GeneratedTopic {
  const profile = request.profile;
  const setting = cleanSetting(profile, request.settingOverride);
  const method = chooseMethod(area, profile, request.methodOverride);
  const keywords = [...new Set([...area.keywords, ...salientKeywords(problem.statement, 4)])].slice(0, 10);
  const titleKeywords = salientKeywords(problem.statement, 4).join(', ');
  const workingTitle = `${area.name}: a ${methodLabel(method).toLowerCase()} study of ${titleKeywords || area.keywords.slice(0, 3).join(', ')} in ${setting}`;
  const dedupeSource = `${request.projectId}|${area.code}|${problem.id}|${setting}|${method}`;
  const dedupeKey = createHash('sha256').update(dedupeSource).digest('hex').slice(0, 40);
  const confidence = confidenceFor(profile);
  const context = contextSentence(profile, setting);

  return {
    areaCode: area.code,
    problemId: problem.id,
    dedupeKey,
    workingTitle: workingTitle.slice(0, 300),
    plainLanguage: `${problem.plain} The study would focus on ${setting} and use ${methodLabel(method).toLowerCase()}. It would aim to explain what is happening, for whom, and why — rather than to prove a preferred answer.`,
    researchField: area.discipline === 'BUSINESS' ? 'Business and Management' : 'Engineering',
    researchSubfield: area.subfield,
    problemStatement: `${problem.statement} The proposed study is situated in ${setting}. This problem statement is a reasoned starting point based on ${context || 'the applicant’s stated interests'}, not a verified finding. The extent and severity of the problem must be evidenced in the literature and, where relevant, with official data.`,
    initialEvidence: `${problem.evidence} Before the proposal is finalised, at least two independent source types must be recorded in the evidence library with URLs/DOIs, access dates and verification status. No number, author or finding is asserted by this generator.`,
    provisionalGap: `PROVISIONAL GAP (NOT YET VERIFIED): the working hypothesis is that existing ${area.discipline === 'BUSINESS' ? 'business and management' : 'engineering'} research has not yet adequately examined ${problem.statement.toLowerCase().replace(/\.$/, '')} in ${setting}. This is not a claim that no such research exists. It must be tested with the documented search plan below, and retained, revised or abandoned according to what the search finds.`,
    mainQuestion: `${problem.question.replace(/\?$/, '')} in ${setting}?`,
    supportingQuestions: supportingQuestions(area, problem, setting),
    aim: `To produce a rigorous, evidence-based explanation of ${problem.statement.toLowerCase().replace(/\.$/, '')} in ${setting}, and to derive defensible implications for theory and practice.`,
    objectives: methodSpecificObjectives(method),
    theoryFramework: `Primary lens: ${area.theories[0]}. Alternative lens to test against: ${area.theories[1] ?? 'a competing explanation identified in the literature'}. The framework is provisional: the literature review must justify why ${area.theories[0]} explains the phenomenon better than the alternative, and must state what the framework cannot explain. A theoretical framework is not decoration; it must generate observable expectations.`,
    methodology: {
      paradigm: area.discipline === 'BUSINESS' ? 'Pragmatic social-science inquiry' : 'Engineering design and experimental inquiry',
      design: `${methodLabel(method)} design, sequenced as (1) documented problem and gap verification, (2) design and pilot, (3) evidence generation, (4) analysis and validation, (5) contribution and limitations.`,
      methods: method,
      rationale: `This method is proposed because the research question asks “${problem.question}” and the available evidence type is ${area.dataSources.split(';')[0]?.toLowerCase() || 'to be confirmed'}. ${methodLabel(method)} can answer that question with the resources plausibly available to a doctoral project. Alternatives considered: ${area.methods.filter((item) => item !== method).map(methodLabel).join('; ') || 'none recorded'}. They are not selected because they would require access, equipment or time that has not been evidenced. If access or facilities cannot be confirmed, the design must be revised — not the claim strengthened.`,
      resources: `${area.dataSources} Software/equipment and access arrangements must be confirmed in writing with the target programme before the proposal is submitted.`,
      risks: `${area.risks} Additional applicant-specific risks: ${profile?.fundingRequirement === 'REQUIRED' ? 'funding is required and no confirmed funding route has yet been recorded; ' : ''}${profile?.englishTestStatus && profile.englishTestStatus !== 'TAKEN' ? 'English-language evidence is not yet recorded; ' : ''}${profile?.studyMode === 'PART_TIME' ? 'part-time study lengthens the timeline and may restrict access to some facilities; ' : ''}each risk requires a named mitigation and a fallback.`,
    },
    dataNeeds: `${area.dataSources} The proposal must specify volumes, access routes, permissions, retention and any licences. Required facilities: ${profile?.equipmentNeeds?.trim() || 'to be confirmed against the chosen programme and supervisor’s laboratory'}.`,
    feasibilityRisks: `Feasibility is conditional: (1) the gap is unverified; (2) data/equipment access is not yet confirmed; (3) the applicant’s methods experience should be strengthened through the programme’s research training; (4) the timeline must be built from the verified programme duration. Mitigations: staged pilot, documented fallback dataset/lab, early ethics application, and supervisor agreement on scope before submission.`,
    ethics: `${area.ethics} Formal ethics approval must be obtained before data collection. The proposal must address informed consent, right to withdraw, data minimisation, storage location, retention, access control, anonymisation and any cross-border transfer. Engineering work must include risk assessments and, where relevant, human-participant and environmental approvals.`,
    scholarlyContribution: `A defensible doctoral contribution would be: ${area.contributions} The claim must be narrowed after the literature review; “novelty” will not be asserted merely because a web search found no identical title.`,
    practicalContribution: `Potential practical value: evidence that helps ${area.discipline === 'BUSINESS' ? 'managers, regulators or policymakers' : 'engineers, operators or standards bodies'} make better decisions about ${area.keywords.slice(0, 3).join(', ')}. Practical claims must be proportionate to the evidence and must not promise implementation impact that the study cannot test.`,
    potentialMatches: 'No supervisor availability is implied. Potential programme fit is calculated only from verified programme/research-area records; a match score is not an agreement to supervise.',
    preliminaryReading: `No verified references are attached yet. Do not submit a bibliography that has not been checked. Documented search plan: ${area.searchStrategy} Record every query, database, date, hit count and screening decision. Add verified sources through the Literature and Evidence Library; the system will flag citations without an identifier or source record.`,
    confidence,
    evidenceQuality: 'UNVERIFIED',
    unresolvedQuestions: unresolvedQuestions(profile, area),
    noveltyStatus: 'PROVISIONAL_UNVERIFIED',
    keywords,
  };
}

export interface TopicGenerationResult {
  topics: GeneratedTopic[];
  consideredAreas: string[];
  skippedAreas: string[];
  notes: string[];
}

export function generateTopicCandidates(request: TopicGenerationRequest): TopicGenerationResult {
  const maxCandidates = Math.min(Math.max(request.maxCandidates ?? 8, 5), 24);
  const discipline = request.discipline && request.discipline !== 'UNDECIDED'
    ? request.discipline
    : request.profile?.primaryDiscipline ?? 'BOTH';
  const notes: string[] = [];

  let pool = TOPIC_CATALOGUE.filter((area) => {
    if (discipline === 'BUSINESS') return area.discipline === 'BUSINESS';
    if (discipline === 'ENGINEERING') return area.discipline === 'ENGINEERING';
    return true;
  });

  if (request.selectedAreaCodes?.length) {
    const selected = new Set(request.selectedAreaCodes);
    pool = pool.filter((area) => selected.has(area.code));
  }

  const haystack = [
    request.profile?.degreeSubject,
    request.profile?.existingResearchIdea,
    request.profile?.researchSetting,
    ...(request.profile?.interests ?? []),
  ].filter(Boolean).join(' ');

  if (!request.selectedAreaCodes?.length && haystack.trim()) {
    const relevant = pool.filter((area) => matchesArea(area, haystack));
    if (relevant.length >= 3) {
      pool = relevant;
      notes.push('Areas were prioritised using the applicant’s stated subject interests; this is a relevance heuristic, not a verified supervisor match.');
    } else {
      notes.push('Too few catalogue areas matched the stated interests, so the full discipline catalogue is shown to avoid a false sense of precision.');
    }
  }

  if (discipline === 'BOTH') {
    const business = pool.filter((area) => area.discipline === 'BUSINESS');
    const engineering = pool.filter((area) => area.discipline === 'ENGINEERING');
    const half = Math.ceil(maxCandidates / 2);
    pool = [...business.slice(0, half), ...engineering.slice(0, maxCandidates - Math.min(half, business.length))];
  } else {
    pool = pool.slice(0, maxCandidates);
  }

  const topics: GeneratedTopic[] = [];
  for (const area of pool) {
    for (const problem of area.problems) {
      if (topics.length >= maxCandidates) break;
      topics.push(buildTopic(area, problem, { ...request, profile: request.profile }));
    }
    if (topics.length >= maxCandidates) break;
  }

  // Guarantee at least five candidates when the catalogue can supply them — but
  // never override an explicit area selection, which would misrepresent what the
  // applicant asked to compare.
  if (topics.length < 5 && request.selectedAreaCodes?.length) {
    notes.push(
      'Fewer than five candidates were produced because only the selected areas were used. Add more areas if you want a five-topic comparison.',
    );
  } else if (topics.length < 5) {
    for (const area of TOPIC_CATALOGUE) {
      if (topics.length >= 5) break;
      const existing = new Set(topics.map((topic) => topic.areaCode));
      if (existing.has(area.code)) continue;
      topics.push(buildTopic(area, area.problems[0], { ...request, profile: request.profile }));
    }
    notes.push('The selection produced fewer than five candidates, so additional catalogue areas were included so that comparison is meaningful.');
  }

  notes.push('Every candidate is a provisional canvas. Confidence reflects the completeness of the applicant profile, not the truth of the gap.');
  return {
    topics,
    consideredAreas: pool.map((area) => area.code),
    skippedAreas: TOPIC_CATALOGUE.filter((area) => !pool.some((entry) => entry.code === area.code)).map((area) => area.code),
    notes,
  };
}
