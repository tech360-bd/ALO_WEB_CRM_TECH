/**
 * Citation validation. The objective is to stop fabricated or incomplete
 * references reaching an exported proposal. Validation never "creates" an
 * identifier: a DOI must already be present and structurally valid.
 */

const DOI_PATTERN = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

export interface CitationRecordInput {
  title: string;
  authors: string;
  year?: number | null;
  venue?: string;
  publisher?: string;
  doi?: string | null;
  url?: string | null;
  sourceType?: string;
  verificationStatus?: string;
  sourceId?: string | null;
}

export interface CitationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalisedDoi: string | null;
}

export function normaliseDoi(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase();
}

export function isValidDoi(value: string): boolean {
  return DOI_PATTERN.test(normaliseDoi(value) ?? '');
}

export function validateCitation(record: CitationRecordInput, currentYear = new Date().getUTCFullYear()): CitationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalisedDoi = normaliseDoi(record.doi);

  if (!record.title?.trim()) errors.push('Title is missing.');
  if (record.title && record.title.trim().length > 500) errors.push('Title is implausibly long.');
  if (!record.authors?.trim()) errors.push('Authors are missing.');
  if (!record.year) {
    warnings.push('Publication year is missing; the reference cannot be checked reliably.');
  } else if (record.year < 1900 || record.year > currentYear + 1) {
    errors.push(`Year ${record.year} is outside the plausible range.`);
  }
  if (!record.venue?.trim() && !record.publisher?.trim() && record.sourceType !== 'REPORT') {
    warnings.push('Journal, conference, publisher or institution is missing.');
  }
  if (record.doi && !normalisedDoi) {
    errors.push('DOI is empty after normalisation.');
  } else if (normalisedDoi && !isValidDoi(normalisedDoi)) {
    errors.push('DOI is not structurally valid (expected 10.xxxx/...).');
  }
  if (record.url) {
    if (!/^https?:\/\//i.test(record.url)) {
      errors.push('URL must begin with http:// or https://.');
    } else {
      try {
        // Throws when the string is not a parseable absolute URL.
        void new URL(record.url);
      } catch {
        errors.push('URL is not parseable.');
      }
    }
  }
  if (!record.doi && !record.url) {
    warnings.push('No DOI or stable URL. This source cannot be independently checked from the proposal.');
  }
  if (record.verificationStatus !== 'VERIFIED_OFFICIAL' && record.verificationStatus !== 'SECONDARY_SOURCE_ONLY' && record.verificationStatus !== 'PEER_REVIEWED') {
    warnings.push('Source has not been verified against the publication or publisher record.');
  }

  return { valid: errors.length === 0, errors, warnings, normalisedDoi };
}

export function findDuplicateDois(records: Array<{ doi?: string | null; title: string }>): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const record of records) {
    const doi = normaliseDoi(record.doi);
    if (!doi) continue;
    if (seen.has(doi)) duplicates.push(doi);
    else seen.set(doi, record.title);
  }
  return duplicates;
}

export interface InlineCitationAudit {
  checkedSentences: number;
  unsupported: Array<{ sectionKey: string; sentence: string; reason: string }>;
}

const CITATION_MARKER = /(\([A-Z][^()]{1,80},\s*(19|20)\d{2}[a-z]?\)|\b[A-Z][A-Za-z'’-]+(?:\s+et al\.)?(?:,?\s+[A-Z]\.)?,?\s*\((?:19|20)\d{2}[a-z]?\)|\[\d{1,3}\]|\[source:[^\]]+\]|https?:\/\/\S+)/;
const ASSERTION_WORDS = /\b(studies show|research shows|evidence shows|proves|proven|demonstrates that|significantly|per cent|percent|%)\b/i;
const NUMBER_CLAIM = /\b\d{1,3}(\.\d+)?\s?(?:%|per cent|percent|million|billion|bn)(?=[\s,.;:)]|$)/i;

/**
 * Heuristic check for factual assertions without a visible citation marker.
 * It intentionally produces conservative warnings, not automatic rewriting.
 */
export function auditUnsupportedClaims(
  sections: Array<{ sectionKey: string; content: string }>,
): InlineCitationAudit {
  const unsupported: InlineCitationAudit['unsupported'] = [];
  let checked = 0;
  for (const section of sections) {
    if (['bibliography', 'appendices', 'title', 'timetable'].includes(section.sectionKey)) continue;
    // Protect initials and common abbreviations so "Smith, J. (2024)" is not
    // split into two sentences before the citation-marker check.
    const protectedContent = section.content
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\b([A-Z])\.\s/g, '$1\u0001 ')
      .replace(/\b(et al|e\.g|i\.e|vs|cf|Fig|No)\.\s/gi, '$1\u0001 ');
    const sentences = protectedContent
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.replace(/\u0001/g, '.').trim())
      .filter((sentence) => sentence.length > 25);
    for (const sentence of sentences) {
      checked += 1;
      if (CITATION_MARKER.test(sentence)) continue;
      if (NUMBER_CLAIM.test(sentence)) {
        unsupported.push({
          sectionKey: section.sectionKey,
          sentence: sentence.slice(0, 300),
          reason: 'Quantitative claim without a visible citation marker.',
        });
      } else if (ASSERTION_WORDS.test(sentence)) {
        unsupported.push({
          sectionKey: section.sectionKey,
          sentence: sentence.slice(0, 300),
          reason: 'Assertion of evidence or significance without a visible citation marker.',
        });
      }
    }
  }
  return { checkedSentences: checked, unsupported };
}
