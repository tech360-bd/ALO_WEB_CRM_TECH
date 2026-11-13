import { auditUnsupportedClaims, validateCitation } from './citations';
import { countWords, totalWordCount } from './sections';

export interface ProposalRequirements {
  wordLimit: number | null;
  requiredHeadings: string[] | null;
  referencingStyle: string;
  abstractRequired: boolean;
  ethicsRequired: boolean;
  fileFormat: string;
  verificationStatus: string;
  sourceUrl?: string | null;
  universityName?: string;
  programmeName?: string;
}

export interface SectionInput {
  sectionKey: string;
  title: string;
  content: string;
  sortOrder?: number;
}

export interface SourceInput {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  venue: string;
  publisher: string;
  doi: string | null;
  url: string | null;
  verificationStatus: string;
  sourceType?: string;
}

export interface CitationInput {
  id: string;
  sectionKey: string;
  rawText: string;
  claimText: string;
  isValid: boolean;
  sourceId: string | null;
  source?: SourceInput | null;
}

export type CheckSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface QualityCheck {
  id: string;
  label: string;
  severity: CheckSeverity;
  passed: boolean;
  detail: string;
  sections: string[];
}

export interface QualityReport {
  checks: QualityCheck[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  wordCount: number;
  citationCount: number;
  verifiedCitationCount: number;
  readiness: 'NOT_READY' | 'NEEDS_WORK' | 'REVIEW_READY';
  draftLabel: string;
  unsupportedClaims: Array<{ sectionKey: string; sentence: string; reason: string }>;
  averageSentenceLength: number;
}

const SECTION_ALIASES: Record<string, string[]> = {
  title: ['working title', 'title'],
  abstract: ['abstract', 'executive summary'],
  background: ['background', 'context', 'introduction'],
  problem: ['problem statement', 'the problem'],
  rationale: ['rationale', 'significance'],
  literature: ['literature review', 'preliminary literature'],
  gap: ['research gap', 'gap'],
  aim: ['aim', 'aims'],
  questions: ['research questions', 'questions', 'hypotheses'],
  framework: ['theoretical framework', 'conceptual framework', 'technical framework', 'framework'],
  methodology: ['methodology', 'research design and methodology', 'methods'],
  data: ['data sources', 'participants', 'equipment', 'experimental setup'],
  analysis: ['data analysis', 'analysis plan'],
  ethics: ['ethics', 'safety', 'privacy', 'data management'],
  feasibility: ['feasibility', 'risk'],
  contribution: ['contribution', 'original contribution'],
  implications: ['implications', 'policy implications', 'industrial implications'],
  timetable: ['timetable', 'timeline', 'project plan'],
  bibliography: ['bibliography', 'references'],
  appendices: ['appendices', 'appendix'],
};

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function lastSection(sections: SectionInput[], key: string): SectionInput | undefined {
  return sections.find((section) => section.sectionKey === key);
}

function hasHeading(sections: SectionInput[], heading: string): boolean {
  const needle = normalise(heading);
  if (!needle) return true;
  return sections.some((section) => {
    const names = [
      normalise(section.title),
      normalise(section.sectionKey.replace(/([a-z])([A-Z])/g, '$1 $2')),
      ...(SECTION_ALIASES[section.sectionKey] ?? []).map(normalise),
    ].filter(Boolean);
    if (names.some((name) => name === needle || name.includes(needle) || needle.includes(name))) return true;
    return section.content
      .split('\n')
      .slice(0, 5)
      .some((line) => normalise(line.replace(/^#+\s*/, '')) === needle);
  });
}

function wordSet(text: string, limit = 40): Set<string> {
  return new Set(
    normalise(text)
      .split(' ')
      .filter((word) => word.length > 4)
      .slice(0, limit),
  );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) if (b.has(word)) count += 1;
  return count;
}

export function evaluateProposal(params: {
  sections: SectionInput[];
  requirements: ProposalRequirements;
  sources: SourceInput[];
  citations: CitationInput[];
  proposalTitle: string;
}): QualityReport {
  const { sections, requirements, sources, citations, proposalTitle } = params;
  const checks: QualityCheck[] = [];
  const add = (check: QualityCheck) => checks.push(check);

  const wordCount = totalWordCount(sections.map((section) => ({ sectionKey: section.sectionKey, content: section.content })));
  const titleSection = lastSection(sections, 'title');
  const effectiveTitle = (proposalTitle || titleSection?.content || '').trim();
  const problem = lastSection(sections, 'problem')?.content ?? '';
  const gap = lastSection(sections, 'gap')?.content ?? '';
  const aim = lastSection(sections, 'aim')?.content ?? '';
  const questions = lastSection(sections, 'questions')?.content ?? '';
  const methodology = lastSection(sections, 'methodology')?.content ?? '';
  const ethics = lastSection(sections, 'ethics')?.content ?? '';
  const contribution = lastSection(sections, 'contribution')?.content ?? '';
  const bibliography = lastSection(sections, 'bibliography')?.content ?? '';
  const analysis = lastSection(sections, 'analysis')?.content ?? '';
  const timetable = lastSection(sections, 'timetable')?.content ?? '';

  const isVerifiedRequirements = requirements.verificationStatus === 'VERIFIED_OFFICIAL';

  add({
    id: 'title',
    label: 'Working title is present and specific',
    severity: 'ERROR',
    passed: countWords(effectiveTitle) >= 5 && countWords(effectiveTitle) <= 40,
    detail: countWords(effectiveTitle) < 5
      ? 'The title is missing or too short to describe the project.'
      : countWords(effectiveTitle) > 40
        ? 'The title is very long; most programmes expect a concise working title.'
        : `Title contains ${countWords(effectiveTitle)} words.`,
    sections: ['title'],
  });

  add({
    id: 'problem',
    label: 'Problem statement is substantive',
    severity: 'ERROR',
    passed: countWords(problem) >= 60,
    detail: `Problem statement contains ${countWords(problem)} assessed words (guideline: at least 60).`,
    sections: ['problem'],
  });

  const gapLower = gap.toLowerCase();
  add({
    id: 'gap-verification',
    label: 'Research gap is labelled provisional or evidenced',
    severity: 'WARNING',
    passed: gapLower.includes('provisional') || gapLower.includes('verified') || citations.length >= 3,
    detail: gapLower.includes('provisional')
      ? 'The gap is correctly labelled provisional. Replace the label only after a documented search.'
      : 'The gap is not labelled provisional and fewer than three citations are attached. Verify it before submission.',
    sections: ['gap'],
  });

  add({
    id: 'aim',
    label: 'Aim is stated',
    severity: 'ERROR',
    passed: countWords(aim) >= 10,
    detail: `Aim section contains ${countWords(aim)} words.`,
    sections: ['aim'],
  });

  const questionCount = (questions.match(/\?/g) || []).length;
  add({
    id: 'questions',
    label: 'Research questions are explicit',
    severity: 'ERROR',
    passed: questionCount >= 2,
    detail: `${questionCount} question mark(s) found. The canvas should contain one main question and three to five supporting questions.`,
    sections: ['questions'],
  });

  add({
    id: 'methodology',
    label: 'Methodology justifies the design',
    severity: 'ERROR',
    passed: countWords(methodology) >= 120 &&
      /(justif|why|alternative|rationale)/i.test(methodology),
    detail: countWords(methodology) < 120
      ? 'Methodology is shorter than 120 words; most doctoral proposals require a justified design, not a label.'
      : /(justif|why|alternative|rationale)/i.test(methodology)
        ? 'Methodology includes an explicit justification language check.'
        : 'Methodology does not explain why the design is appropriate or which alternatives were rejected.',
    sections: ['methodology'],
  });

  add({
    id: 'analysis',
    label: 'Analysis plan is present',
    severity: 'WARNING',
    passed: countWords(analysis) >= 40,
    detail: `Analysis plan contains ${countWords(analysis)} words.`,
    sections: ['analysis'],
  });

  const ethicsLower = ethics.toLowerCase();
  add({
    id: 'ethics',
    label: 'Ethics, consent and data protection addressed',
    severity: 'ERROR',
    passed: countWords(ethics) >= 40 && ethicsLower.includes('consent') && /(approval|ethics)/.test(ethicsLower),
    detail: countWords(ethics) < 40
      ? 'Ethics section is too short for a doctoral proposal.'
      : !ethicsLower.includes('consent')
        ? 'Consent is not addressed.'
        : !/(approval|ethics)/.test(ethicsLower)
          ? 'Ethics approval is not addressed.'
          : 'Ethics section addresses consent and approval. Confirm the programme-specific data-protection requirements.',
    sections: ['ethics'],
  });

  add({
    id: 'contribution',
    label: 'Original contribution is specified',
    severity: 'ERROR',
    passed: countWords(contribution) >= 40,
    detail: `Contribution section contains ${countWords(contribution)} words.`,
    sections: ['contribution'],
  });

  add({
    id: 'timetable',
    label: 'Timetable is present',
    severity: 'WARNING',
    passed: countWords(timetable) >= 25 && !timetable.startsWith('['),
    detail: countWords(timetable) < 25
      ? 'No project timetable is present. A timetable is a suggested plan, not an official deadline.'
      : 'Timetable present. Confirm any official programme dates separately.',
    sections: ['timetable'],
  });

  const titleWords = wordSet(effectiveTitle);
  const alignmentTargets = [
    { key: 'problem', words: wordSet(problem) },
    { key: 'questions', words: wordSet(questions) },
    { key: 'methodology', words: wordSet(methodology) },
    { key: 'contribution', words: wordSet(contribution) },
  ];
  const weakest = alignmentTargets
    .map((target) => ({ key: target.key, overlap: overlapCount(titleWords, target.words) }))
    .filter((entry) => entry.overlap < 2);
  add({
    id: 'alignment',
    label: 'Title, problem, questions, methods and contribution align',
    severity: 'WARNING',
    passed: weakest.length === 0,
    detail: weakest.length === 0
      ? 'Every core section shares at least two substantive terms with the title.'
      : `Weak lexical alignment with: ${weakest.map((entry) => entry.key).join(', ')}. This is a heuristic — a reader must verify conceptual alignment.`,
    sections: ['title', 'problem', 'questions', 'methodology', 'contribution'],
  });

  const citationErrors: string[] = [];
  let verifiedCitations = 0;
  for (const citation of citations) {
    if (!citation.source) {
      citationErrors.push(`Citation “${citation.rawText.slice(0, 60)}” has no linked source record.`);
      continue;
    }
    const validation = validateCitation({
      title: citation.source.title,
      authors: citation.source.authors,
      year: citation.source.year,
      venue: citation.source.venue,
      publisher: citation.source.publisher,
      doi: citation.source.doi,
      url: citation.source.url,
      sourceType: citation.source.sourceType,
      verificationStatus: citation.source.verificationStatus,
    });
    if (!validation.valid) citationErrors.push(...validation.errors.map((error) => `${citation.source?.title}: ${error}`));
    if (citation.source.verificationStatus === 'VERIFIED_OFFICIAL') verifiedCitations += 1;
  }
  add({
    id: 'citations',
    label: 'Citation records are complete and linked',
    severity: 'ERROR',
    passed: citationErrors.length === 0 && citations.length > 0,
    detail: citations.length === 0
      ? 'No citations are attached. A proposal with no references cannot be considered evidenced.'
      : citationErrors.length
        ? citationErrors.slice(0, 6).join(' ')
        : `${citations.length} citation(s) are linked to source records.`,
    sections: ['bibliography'],
  });

  add({
    id: 'bibliography-placeholders',
    label: 'Bibliography contains no unresolved placeholders',
    severity: 'WARNING',
    passed: bibliography.trim().length > 0 && !/\[(no verified|source required|placeholder)/i.test(bibliography),
    detail: bibliography.trim().length === 0
      ? 'Bibliography is empty.'
      : /\[(no verified|source required|placeholder)/i.test(bibliography)
        ? 'Bibliography still contains a placeholder label.'
        : 'Bibliography contains content; verify each entry manually against the publisher record.',
    sections: ['bibliography'],
  });

  const verifiedSources = sources.filter((source) => source.verificationStatus === 'VERIFIED_OFFICIAL' || source.verificationStatus === 'PEER_REVIEWED');
  add({
    id: 'evidence-base',
    label: 'Evidence base contains verified sources',
    severity: 'WARNING',
    passed: verifiedSources.length >= 5,
    detail: `${verifiedSources.length} verified source(s) of ${sources.length} recorded. A doctoral proposal normally needs a documented, broader evidence base.`,
    sections: ['literature', 'gap', 'bibliography'],
  });

  const claims = auditUnsupportedClaims(sections);
  add({
    id: 'unsupported-claims',
    label: 'Unsupported factual assertions are flagged',
    severity: 'WARNING',
    passed: claims.unsupported.length === 0,
    detail: claims.unsupported.length === 0
      ? `No unsupported quantitative/assertive sentence detected across ${claims.checkedSentences} checked sentences. This heuristic cannot detect every uncited claim.`
      : `${claims.unsupported.length} sentence(s) make a quantitative or evidential claim without a visible citation marker.`,
    sections: [...new Set(claims.unsupported.map((claim) => claim.sectionKey))],
  });

  const sentenceLengths = sections
    .filter((section) => !['bibliography', 'appendices', 'title'].includes(section.sectionKey))
    .flatMap((section) => section.content.replace(/\[[^\]]*\]/g, ' ').split(/(?<=[.!?])\s+/))
    .map((sentence) => countWords(sentence))
    .filter((length) => length > 0);
  const averageSentenceLength = sentenceLengths.length
    ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length)
    : 0;
  add({
    id: 'readability',
    label: 'Readability is consistent with academic prose',
    severity: 'INFO',
    passed: averageSentenceLength === 0 || averageSentenceLength <= 35,
    detail: averageSentenceLength === 0
      ? 'No prose to assess yet.'
      : `Average sentence length is ${averageSentenceLength} words. Sentences over 35 words are often harder for reviewers to follow.`,
    sections: [],
  });

  if (requirements.wordLimit) {
    const limit = requirements.wordLimit;
    const over = wordCount > limit;
    add({
      id: 'word-limit',
      label: 'Programme word limit is respected',
      severity: 'ERROR',
      passed: !over,
      detail: `${wordCount} words against a verified limit of ${limit}${over ? ' — over the limit' : ''}. Bibliography and appendices are excluded from this count.`,
      sections: [],
    });
  } else {
    add({
      id: 'word-limit',
      label: 'Programme word limit is unknown',
      severity: 'WARNING',
      passed: false,
      detail: 'No verified word limit is stored for this programme. The export will be labelled “General draft — institutional requirements not yet verified”. Do not assume a universal limit.',
      sections: [],
    });
  }

  if (requirements.abstractRequired) {
    const abstract = lastSection(sections, 'abstract')?.content ?? '';
    add({
      id: 'abstract',
      label: 'Required abstract is present',
      severity: 'ERROR',
      passed: countWords(abstract) >= 40,
      detail: `Abstract contains ${countWords(abstract)} words.`,
      sections: ['abstract'],
    });
  }

  if (requirements.requiredHeadings?.length) {
    const missing = requirements.requiredHeadings.filter((heading) => !hasHeading(sections, heading));
    add({
      id: 'required-headings',
      label: 'Programme-required headings are present',
      severity: 'ERROR',
      passed: missing.length === 0,
      detail: missing.length
        ? `Missing required heading(s): ${missing.join(', ')}.`
        : 'All recorded required headings are represented.',
      sections: [],
    });
  } else {
    add({
      id: 'required-headings',
      label: 'Programme-required headings are not verified',
      severity: 'INFO',
      passed: !isVerifiedRequirements,
      detail: 'No verified list of required headings is stored. Confirm the programme’s proposal guidance before exporting.',
      sections: [],
    });
  }

  add({
    id: 'referencing-style',
    label: 'Referencing style is known',
    severity: 'INFO',
    passed: requirements.referencingStyle !== 'NOT_SPECIFIED' && requirements.referencingStyle !== '',
    detail: requirements.referencingStyle && requirements.referencingStyle !== 'NOT_SPECIFIED'
      ? `Recorded referencing style: ${requirements.referencingStyle}.`
      : 'No referencing style is verified. Format references consistently and check the programme guidance.',
    sections: ['bibliography'],
  });

  add({
    id: 'similarity-check',
    label: 'Similarity check',
    severity: 'INFO',
    passed: false,
    detail: 'No plagiarism/similarity service is connected. This tool cannot certify originality, and a clean report here would be misleading.',
    sections: [],
  });

  const errorCount = checks.filter((check) => check.severity === 'ERROR' && !check.passed).length;
  const warningCount = checks.filter((check) => check.severity === 'WARNING' && !check.passed).length;
  const infoCount = checks.filter((check) => check.severity === 'INFO').length;

  return {
    checks,
    errorCount,
    warningCount,
    infoCount,
    wordCount,
    citationCount: citations.length,
    verifiedCitationCount: verifiedCitations,
    readiness: errorCount > 0 ? 'NOT_READY' : warningCount > 3 ? 'NEEDS_WORK' : warningCount > 0 ? 'NEEDS_WORK' : 'REVIEW_READY',
    draftLabel: isVerifiedRequirements
      ? `Draft prepared against verified requirements for ${requirements.programmeName ?? 'the selected programme'}${requirements.universityName ? `, ${requirements.universityName}` : ''}.`
      : 'General draft — institutional requirements not yet verified.',
    unsupportedClaims: claims.unsupported,
    averageSentenceLength,
  };
}
