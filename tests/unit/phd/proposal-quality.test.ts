import { describe, expect, it } from 'vitest';
import { evaluateProposal, type CitationInput, type ProposalRequirements, type SectionInput, type SourceInput } from '@/lib/phd/proposals/quality';
import { auditUnsupportedClaims, isValidDoi, validateCitation } from '@/lib/phd/proposals/citations';

const requirements: ProposalRequirements = {
  wordLimit: 6000,
  requiredHeadings: ['Introduction', 'Literature Review', 'Methodology', 'Timeline', 'References'],
  referencingStyle: 'Harvard',
  abstractRequired: true,
  ethicsRequired: true,
  fileFormat: 'PDF',
  verificationStatus: 'VERIFIED_OFFICIAL',
  sourceUrl: 'https://example.ac.uk/phd/requirements',
  universityName: 'Example University',
  programmeName: 'PhD Management',
};

const sentences = [
  'Digital transformation changes how manufacturing firms organise work and measure productivity.',
  'Small and medium-sized manufacturers often lack the analytical capacity to evaluate those changes.',
  'This study examines how digital transformation investments translate into productivity outcomes in manufacturing SMEs.',
  'The design combines semi-structured interviews with documentary evidence from participating firms.',
  'Analysis will follow a documented thematic procedure with independent coding checks.',
];

function text(words: number): string {
  const out: string[] = [];
  let count = 0;
  let index = 0;
  while (count < words) {
    const sentence = sentences[index % sentences.length];
    out.push(sentence);
    count += sentence.split(' ').length;
    index += 1;
  }
  return out.join(' ');
}

const strongSections: SectionInput[] = [
  { sectionKey: 'title', title: 'Working title', content: 'Digital transformation and manufacturing SME productivity in the United Kingdom' },
  { sectionKey: 'abstract', title: 'Abstract', content: text(120) },
  { sectionKey: 'background', title: 'Background and context', content: text(90) },
  { sectionKey: 'literature', title: 'Preliminary literature review', content: text(90) },
  { sectionKey: 'problem', title: 'Problem statement', content: `${text(90)} The problem is specific to manufacturing SMEs.` },
  { sectionKey: 'gap', title: 'Research gap', content: `${text(70)} This gap remains provisional until the documented search is reviewed.` },
  { sectionKey: 'aim', title: 'Aim and objectives', content: 'To explain how digital transformation investments affect productivity in manufacturing SMEs, and to identify the organisational conditions that shape those effects.' },
  { sectionKey: 'questions', title: 'Research questions', content: 'How do manufacturing SMEs convert digital transformation investment into productivity gains? Which capabilities moderate that relationship? What evidence would falsify the proposed mechanism?' },
  { sectionKey: 'methodology', title: 'Methodology', content: `${text(150)} We justify the qualitative design because the mechanism is not observable in cross-sectional data. We considered a survey and rejected it because access to a representative sample is not confirmed.` },
  { sectionKey: 'analysis', title: 'Data analysis plan', content: text(70) },
  { sectionKey: 'ethics', title: 'Ethics', content: `${text(60)} Informed consent will be recorded before interviews. Ethics approval will be sought from the university committee before recruitment, and data will be stored securely.` },
  { sectionKey: 'contribution', title: 'Contribution', content: `${text(60)} The contribution is a mechanism-level account of digital transformation and manufacturing productivity.` },
  { sectionKey: 'timetable', title: 'Timetable', content: text(60) },
  { sectionKey: 'bibliography', title: 'Bibliography', content: 'See citations.' },
];

const source = (id: string, overrides: Partial<SourceInput> = {}): SourceInput => ({
  id,
  title: 'Digital transformation in manufacturing SMEs',
  authors: 'Smith, J. and Patel, R.',
  year: 2024,
  venue: 'Journal of Manufacturing Technology Management',
  publisher: 'Emerald',
  doi: '10.1108/JMTM-01-2024-0001',
  url: 'https://doi.org/10.1108/JMTM-01-2024-0001',
  verificationStatus: 'VERIFIED_OFFICIAL',
  sourceType: 'JOURNAL_ARTICLE',
  ...overrides,
});

const sources = [source('s1'), source('s2', { doi: '10.1016/j.jbusres.2023.113456', title: 'Digital adoption and firm performance' }), source('s3', { doi: '10.1111/joms.12999', title: 'Capabilities and productivity' })];

const citations: CitationInput[] = sources.map((entry, index) => ({
  id: `c${index}`,
  sectionKey: 'bibliography',
  rawText: `${entry.authors} (${entry.year}) ${entry.title}. ${entry.venue}. https://doi.org/${entry.doi}`,
  claimText: 'Supports the framing of digital transformation as a capability-building process.',
  isValid: true,
  sourceId: entry.id,
  source: entry,
}));

describe('proposal quality checks', () => {
  it('passes a substantive, evidenced proposal with a review-ready classification', () => {
    const report = evaluateProposal({
      sections: strongSections,
      requirements,
      sources,
      citations,
      proposalTitle: 'Digital transformation and manufacturing SME productivity in the United Kingdom',
    });
    const failedErrors = report.checks.filter((check) => !check.passed && check.severity === 'ERROR');
    expect(failedErrors.map((check) => check.id)).toEqual([]);
    expect(report.errorCount).toBe(0);
    expect(report.wordCount).toBeGreaterThan(600);
    expect(report.verifiedCitationCount).toBe(3);
    expect(report.readiness).not.toBe('NOT_READY');
    expect(report.draftLabel).toMatch(/verified requirements/i);
    const evidenceBase = report.checks.find((check) => check.id === 'evidence-base')!;
    expect(evidenceBase.passed).toBe(false);
    expect(evidenceBase.detail).toMatch(/verified source/i);
  });

  it('fails an empty proposal and explains each failure', () => {
    const report = evaluateProposal({
      sections: [{ sectionKey: 'title', title: 'Title', content: '' }],
      requirements: { ...requirements, verificationStatus: 'NOT_YET_VERIFIED', requiredHeadings: null, wordLimit: null },
      sources: [],
      citations: [],
      proposalTitle: '',
    });
    expect(report.readiness).toBe('NOT_READY');
    expect(report.errorCount).toBeGreaterThanOrEqual(5);
    const titleCheck = report.checks.find((check) => check.id === 'title')!;
    expect(titleCheck.passed).toBe(false);
    expect(titleCheck.detail.length).toBeGreaterThan(10);
  });

  it('labels a proposal built without verified institutional requirements', () => {
    const report = evaluateProposal({
      sections: strongSections,
      requirements: { ...requirements, verificationStatus: 'NOT_YET_VERIFIED', requiredHeadings: null },
      sources,
      citations,
      proposalTitle: 'Digital transformation and manufacturing SME productivity',
    });
    expect(report.draftLabel).toMatch(/General draft — institutional requirements not yet verified/i);
    const headings = report.checks.find((check) => check.id === 'required-headings')!;
    expect(headings.detail).toMatch(/no verified list of required headings/i);
  });

  it('flags missing required headings and excessive length', () => {
    const report = evaluateProposal({
      sections: strongSections.filter((section) => section.sectionKey !== 'methodology'),
      requirements: { ...requirements, wordLimit: 50 },
      sources,
      citations,
      proposalTitle: 'Digital transformation and manufacturing SME productivity',
    });
    const headings = report.checks.find((check) => check.id === 'required-headings');
    const length = report.checks.find((check) => check.id === 'word-limit');
    expect(headings?.passed).toBe(false);
    expect(length?.passed).toBe(false);
  });

  it('detects citations with no source record and invalid identifiers', () => {
    const report = evaluateProposal({
      sections: strongSections,
      requirements,
      sources,
      citations: [
        ...citations,
        { id: 'bad', sectionKey: 'bibliography', rawText: 'Invented (2024) A paper that does not exist.', claimText: '', isValid: false, sourceId: null, source: null },
      ],
      proposalTitle: 'Digital transformation and manufacturing SME productivity',
    });
    const citationCheck = report.checks.find((check) => check.id === 'citations');
    expect(citationCheck?.passed).toBe(false);
    expect(citationCheck?.detail).toMatch(/no linked source|unverifiable|invalid/i);
  });

  it('labels unsupported quantitative claims', () => {
    const findings = auditUnsupportedClaims([
      { sectionKey: 'problem', content: 'Recent studies show that 87% of manufacturing SMEs fail at digital transformation.' },
      { sectionKey: 'gap', content: 'Smith, J. (2024) reports a productivity effect in the same sector and notes a 4% gain.' },
    ]);
    expect(findings.unsupported).toHaveLength(1);
    expect(findings.unsupported[0].sentence).toContain('87%');
    expect(findings.unsupported[0].reason).toMatch(/citation|source/i);
    expect(findings.checkedSentences).toBeGreaterThanOrEqual(2);
  });
});

describe('citation validation', () => {
  it('accepts a valid DOI and rejects a malformed one', () => {
    expect(isValidDoi('10.1108/JMTM-01-2024-0001')).toBe(true);
    expect(isValidDoi('https://doi.org/10.1108/JMTM-01-2024-0001')).toBe(true);
    expect(isValidDoi('doi:10.1108/JMTM-01-2024-0001')).toBe(true);
    expect(isValidDoi('10.abc/xyz')).toBe(false);
    expect(isValidDoi('not-a-doi')).toBe(false);
  });

  it('requires author, year, title and venue for a usable citation', () => {
    const valid = validateCitation({ title: 'A study', authors: 'Smith, J.', year: 2024, venue: 'Journal', publisher: '', doi: '10.1108/x.2024.001' });
    expect(valid.valid).toBe(true);
    const missing = validateCitation({ title: 'A study', authors: '', year: null, venue: '', publisher: '', doi: '' });
    expect(missing.valid).toBe(false);
    expect(missing.errors.length).toBeGreaterThan(0);
  });

  it('rejects a future publication year', () => {
    const result = validateCitation({ title: 'A study', authors: 'Smith, J.', year: 2099, venue: 'Journal', publisher: '', doi: '' }, 2026);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/plausible range/i);
  });
});
