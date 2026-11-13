import { TARGET_INSTITUTIONS } from '../data/institutions';
import { OPTIONAL_SOP_SECTIONS, SOP_DETECTOR_STATEMENT, SOP_SECTIONS } from './constants';
import { countWords } from '../proposals/sections';

/**
 * Content checks for a statement of purpose.
 *
 * These checks look for defects that a reviewer would otherwise have to find by
 * reading: unsupported claims, interchangeable wording, the wrong university,
 * word-limit breaches and a missing disclosure. They deliberately do **not**
 * produce an authorship or AI-detector score: such scores are unreliable across
 * tools and versions, and promising one would be misleading.
 */

export type SopCheckSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface SopCheck {
  code: string;
  severity: SopCheckSeverity;
  message: string;
  sectionKey?: string;
}

export interface SopSectionInput {
  sectionKey: string;
  title: string;
  content: string;
}

export interface SopCheckInput {
  universityName: string | null;
  programmeName: string | null;
  topicTitle: string | null;
  proposalTopicTitle?: string | null;
  wordLimit: number | null;
  targetWords: number;
  aiDisclosureRequired: boolean | null;
  personalisationScore: number;
  /** Facts the student supplied — anything not here is not theirs to claim. */
  evidenceCorpus: string;
  sections: SopSectionInput[];
}

export interface SopReviewReport {
  checks: SopCheck[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  wordCount: number;
  sectionCount: number;
  emptySections: string[];
  genericPhrases: string[];
  unsupportedClaims: Array<{ sectionKey: string; sentence: string; reason: string }>;
  universityMismatches: string[];
  duplicateSections: string[];
  aiDisclosure: {
    required: boolean | null;
    included: boolean;
    status: 'REQUIRED_INCLUDED' | 'REQUIRED_MISSING' | 'NOT_REQUIRED' | 'UNKNOWN';
  };
  wordLimit: { limit: number | null; actual: number; status: 'WITHIN' | 'EXCEEDED' | 'UNKNOWN'; target: number };
  personalisationScore: number;
  readiness: 'NOT_READY' | 'NEEDS_WORK' | 'REVIEW_READY';
  detectorStatement: string;
}

/**
 * Wording that makes statements interchangeable. This is a warning, not a ban:
 * a student may keep a phrase if it is genuinely theirs, but they must see it.
 */
const GENERIC_PHRASES = [
  'passionate about',
  'always been fascinated',
  'ever since i was a child',
  'since childhood',
  'dream of',
  'dreams of',
  'world-class',
  'cutting-edge',
  'unique opportunity',
  'deep passion',
  'ever-evolving',
  'make a difference',
  'broaden my horizons',
  'take my knowledge to the next level',
  'perfect fit for me',
  'highly motivated individual',
  'hard-working individual',
  'team player',
  'thirst for knowledge',
  'excited by the prospect',
];

/** Claim patterns that must be traceable to something the student supplied. */
const CLAIM_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b\d+(\.\d+)?\s?(%|per cent|percent)\b/i, reason: 'A quantitative claim was made; it must come from your own evidence.' },
  { pattern: /\b(published|co-authored|authored)\b/i, reason: 'A publication claim must match your recorded outputs.' },
  { pattern: /\b(awarded|winner|won|prize|scholarship)\b/i, reason: 'An award or scholarship claim must match your recorded achievements.' },
  { pattern: /\b(led|managed|supervised)\s+(a\s+)?(team|group|project|department)\b/i, reason: 'A leadership claim must match your recorded experience.' },
  { pattern: /\b(first|only|best|leading|most successful)\b/i, reason: 'A superlative claim needs a specific, checkable basis.' },
  { pattern: /\b(increased|reduced|improved|saved)\b[^.]{0,40}\b\d+/i, reason: 'A measured outcome claim must be evidenced.' },
];

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokens(value: string): string[] {
  return normalise(value).replace(/[^a-z0-9% ]/g, ' ').split(/\s+/).filter(Boolean);
}

function splitSentences(value: string): string[] {
  return value
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/** A claim is supported when its distinctive tokens appear in the student's evidence. */
function claimIsSupported(sentence: string, evidenceTokens: Set<string>): boolean {
  const candidates = tokens(sentence).filter((token) => token.length > 3);
  if (candidates.length === 0) return true;
  let matched = 0;
  for (const token of candidates) {
    if (evidenceTokens.has(token)) matched++;
  }
  return matched / candidates.length >= 0.34;
}

/**
 * Register universities mentioned in the text that are not the statement's own
 * university. "University of London" inside "Queen Mary University of London"
 * is not a mismatch, so substring hits are excluded deliberately.
 */
export function findUniversityMismatches(text: string, ownUniversity: string | null): string[] {
  const haystack = normalise(text);
  const own = normalise(ownUniversity ?? '');
  const hits = new Set<string>();
  for (const institution of TARGET_INSTITUTIONS) {
    const name = normalise(institution.name);
    if (!name || !haystack.includes(name)) continue;
    if (own && (own.includes(name) || name.includes(own))) continue;
    hits.add(institution.name);
  }
  return Array.from(hits);
}

export function checkSop(input: SopCheckInput): SopReviewReport {
  const checks: SopCheck[] = [];
  const evidenceTokens = new Set(tokens(input.evidenceCorpus));
  const genericPhrases: string[] = [];
  const unsupportedClaims: SopReviewReport['unsupportedClaims'] = [];
  const emptySections: string[] = [];
  const duplicateSections: string[] = [];
  const seenContent = new Map<string, string>();
  const universityMismatches = new Set<string>();

  const sectionKeys = new Set(input.sections.map((section) => section.sectionKey));
  const disclosureOptional = input.aiDisclosureRequired !== true;
  for (const expected of SOP_SECTIONS) {
    if (!sectionKeys.has(expected.key)) {
      if (OPTIONAL_SOP_SECTIONS.includes(expected.key) && disclosureOptional) continue;
      emptySections.push(expected.key);
      checks.push({
        code: 'SECTION_MISSING',
        severity: 'ERROR',
        message: `The “${expected.title}” section is missing from this statement.`,
        sectionKey: expected.key,
      });
    }
  }

  for (const section of input.sections) {
    const content = section.content.trim();
    const wordCount = countWords(content);
    if (!content) {
      if (OPTIONAL_SOP_SECTIONS.includes(section.sectionKey as (typeof OPTIONAL_SOP_SECTIONS)[number]) && disclosureOptional) {
        checks.push({
          code: 'AI_DISCLOSURE_NOT_REQUIRED',
          severity: 'INFO',
          message: 'No AI-use disclosure is required by the recorded institutional instructions, so the section is left blank.',
          sectionKey: section.sectionKey,
        });
        continue;
      }
      emptySections.push(section.sectionKey);
      checks.push({
        code: 'SECTION_EMPTY',
        severity: 'ERROR',
        message: `“${section.title}” is empty. A final statement cannot contain an unwritten section.`,
        sectionKey: section.sectionKey,
      });
      continue;
    }

    const fingerprint = normalise(content);
    const previous = seenContent.get(fingerprint);
    if (previous) {
      duplicateSections.push(section.sectionKey);
      checks.push({
        code: 'SECTION_DUPLICATED',
        severity: 'ERROR',
        message: `“${section.title}” repeats the text of another section verbatim. Each part must do distinct work.`,
        sectionKey: section.sectionKey,
      });
    } else {
      seenContent.set(fingerprint, section.sectionKey);
    }

    for (const phrase of GENERIC_PHRASES) {
      if (fingerprint.includes(phrase)) {
        genericPhrases.push(phrase);
        checks.push({
          code: 'GENERIC_LANGUAGE',
          severity: 'WARNING',
          message: `“${section.title}” contains the interchangeable phrase “${phrase}”. Replace it with something only you could write.`,
          sectionKey: section.sectionKey,
        });
      }
    }

    for (const sentence of splitSentences(content)) {
      for (const { pattern, reason } of CLAIM_PATTERNS) {
        if (!pattern.test(sentence)) continue;
        if (claimIsSupported(sentence, evidenceTokens)) continue;
        unsupportedClaims.push({ sectionKey: section.sectionKey, sentence: sentence.slice(0, 240), reason });
        checks.push({
          code: 'UNSUPPORTED_CLAIM',
          severity: 'WARNING',
          message: `Possible unsupported claim in “${section.title}”: ${reason}`,
          sectionKey: section.sectionKey,
        });
        break;
      }
    }

    for (const mismatch of findUniversityMismatches(content, input.universityName)) {
      universityMismatches.add(mismatch);
      checks.push({
        code: 'WRONG_UNIVERSITY',
        severity: 'ERROR',
        message: `“${section.title}” names ${mismatch}, which is not the university this statement is for (${input.universityName ?? 'no university attached'}).`,
        sectionKey: section.sectionKey,
      });
    }

    if (wordCount < 15) {
      checks.push({
        code: 'SECTION_TOO_SHORT',
        severity: 'WARNING',
        message: `“${section.title}” is only ${wordCount} words. Reviewers expect a developed paragraph here.`,
        sectionKey: section.sectionKey,
      });
    }
  }

  const wordCount = input.sections.reduce((total, section) => total + countWords(section.content), 0);
  let limitStatus: SopReviewReport['wordLimit']['status'] = 'UNKNOWN';
  if (typeof input.wordLimit === 'number' && input.wordLimit > 0) {
    limitStatus = wordCount > input.wordLimit ? 'EXCEEDED' : 'WITHIN';
    if (wordCount > input.wordLimit) {
      checks.push({
        code: 'WORD_LIMIT_EXCEEDED',
        severity: 'ERROR',
        message: `The statement is ${wordCount} words; the recorded limit is ${input.wordLimit}.`,
      });
    } else if (wordCount < Math.round(input.wordLimit * 0.6)) {
      checks.push({
        code: 'WORD_LIMIT_UNDERUSED',
        severity: 'WARNING',
        message: `The statement is ${wordCount} words against a limit of ${input.wordLimit}. That is not an error, but it under-uses the space you have.`,
      });
    }
  } else {
    checks.push({
      code: 'WORD_LIMIT_UNKNOWN',
      severity: 'INFO',
      message: 'No official word limit is recorded for this programme. Confirm it on the official page before submitting.',
    });
  }

  if (input.targetWords > 0 && wordCount < Math.round(input.targetWords * 0.6)) {
    checks.push({
      code: 'BELOW_TARGET',
      severity: 'WARNING',
      message: `The statement is ${wordCount} words against your own target of ${input.targetWords}.`,
    });
  }

  const disclosureSection = input.sections.find((section) => section.sectionKey === 'ai_disclosure');
  const disclosureIncluded = Boolean(disclosureSection?.content.trim());
  let disclosureStatus: SopReviewReport['aiDisclosure']['status'] = 'UNKNOWN';
  if (input.aiDisclosureRequired === true) {
    disclosureStatus = disclosureIncluded ? 'REQUIRED_INCLUDED' : 'REQUIRED_MISSING';
    if (!disclosureIncluded) {
      checks.push({
        code: 'AI_DISCLOSURE_MISSING',
        severity: 'ERROR',
        message: 'This institution requires an AI-use disclosure and the disclosure section is empty.',
      });
    }
  } else if (input.aiDisclosureRequired === false) {
    disclosureStatus = 'NOT_REQUIRED';
  } else {
    checks.push({
      code: 'AI_DISCLOSURE_REQUIREMENT_UNKNOWN',
      severity: 'WARNING',
      message: 'It is not recorded whether this institution requires an AI-use disclosure. Check the official instructions; do not assume.',
    });
  }

  if (!input.universityName) {
    checks.push({
      code: 'UNIVERSITY_NOT_SET',
      severity: 'ERROR',
      message: 'No university is attached to this statement.',
    });
  }

  if (input.programmeName) {
    const fit = input.sections.find((section) => section.sectionKey === 'programme_fit');
    if (fit && !normalise(fit.content).includes(normalise(input.programmeName))) {
      checks.push({
        code: 'PROGRAMME_NOT_NAMED',
        severity: 'WARNING',
        message: 'The programme name does not appear in the opening section. Name it explicitly.',
        sectionKey: 'programme_fit',
      });
    }
  }

  if (input.proposalTopicTitle && input.topicTitle) {
    if (normalise(input.proposalTopicTitle) !== normalise(input.topicTitle)) {
      checks.push({
        code: 'PROPOSAL_TOPIC_MISMATCH',
        severity: 'WARNING',
        message: `The statement's topic (“${input.topicTitle}”) differs from the proposal's topic (“${input.proposalTopicTitle}”). Reviewers read both; align them or explain the difference.`,
      });
    }
  }

  if (input.personalisationScore < 40) {
    checks.push({
      code: 'LOW_PERSONALISATION',
      severity: 'WARNING',
      message: `Only ${input.personalisationScore}% of the personal-input fields are filled. A statement built mainly from template text will not distinguish you.`,
    });
  }

  checks.push({
    code: 'AI_DETECTOR_NOT_MEASURED',
    severity: 'INFO',
    message: SOP_DETECTOR_STATEMENT,
  });

  const errorCount = checks.filter((check) => check.severity === 'ERROR').length;
  const warningCount = checks.filter((check) => check.severity === 'WARNING').length;
  const infoCount = checks.filter((check) => check.severity === 'INFO').length;

  const readiness: SopReviewReport['readiness'] =
    errorCount > 0 ? 'NOT_READY' : warningCount > 0 ? 'NEEDS_WORK' : 'REVIEW_READY';

  return {
    checks,
    errorCount,
    warningCount,
    infoCount,
    wordCount,
    sectionCount: input.sections.length,
    emptySections,
    genericPhrases: Array.from(new Set(genericPhrases)),
    unsupportedClaims,
    universityMismatches: Array.from(universityMismatches),
    duplicateSections,
    aiDisclosure: { required: input.aiDisclosureRequired, included: disclosureIncluded, status: disclosureStatus },
    wordLimit: { limit: input.wordLimit, actual: wordCount, status: limitStatus, target: input.targetWords },
    personalisationScore: input.personalisationScore,
    readiness,
    detectorStatement: SOP_DETECTOR_STATEMENT,
  };
}

