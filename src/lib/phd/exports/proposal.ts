import { buildDocx, type DocxInput, type DocxSection } from './docx';
import { buildPdf, type PdfOutput } from './pdf';

export interface ExportSection {
  sectionKey?: string;
  title: string;
  content: string;
}

export interface ExportSource {
  title: string;
  authors: string;
  year?: number | null;
  venue?: string;
  publisher?: string;
  doi?: string | null;
  url?: string | null;
  verificationStatus: string;
}

export interface ProposalExportInput {
  title: string;
  universityName?: string;
  programmeName?: string;
  draftLabel: string;
  requirements?: {
    wordLimit?: number | null;
    referencingStyle?: string;
    verificationStatus?: string;
    sourceUrl?: string | null;
  };
  sections: ExportSection[];
  sources: ExportSource[];
  citations: Array<{ rawText: string; sectionKey: string; sourceTitle?: string | null; isValid: boolean; validationNote?: string }>;
  wordCount?: number;
  qualitySummary?: string;
}

function toBlocks(sections: ExportSection[]): DocxSection[] {
  return sections.map((section) => {
    const lines = section.content.split(/\r?\n/);
    const paragraphs: string[] = [];
    const bullets: string[] = [];
    let buffer: string[] = [];
    const flush = () => {
      if (buffer.join(' ').trim()) paragraphs.push(buffer.join(' ').trim());
      buffer = [];
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flush();
        continue;
      }
      if (/^([-*•]|\d+\.)\s+/.test(trimmed)) {
        flush();
        bullets.push(trimmed.replace(/^([-*•]|\d+\.)\s+/, ''));
      } else {
        buffer.push(trimmed);
      }
    }
    flush();
    return { heading: section.title, paragraphs, bullets };
  });
}

export function buildProposalDocuments(input: ProposalExportInput): {
  docx: Buffer;
  pdf: PdfOutput;
  metadata: Array<{ label: string; value: string }>;
} {
  const metadata: Array<{ label: string; value: string }> = [];
  if (input.universityName) metadata.push({ label: 'Institution', value: input.universityName });
  if (input.programmeName) metadata.push({ label: 'Programme', value: input.programmeName });
  if (typeof input.wordCount === 'number') metadata.push({ label: 'Assessed word count', value: String(input.wordCount) });
  if (input.requirements?.wordLimit) metadata.push({ label: 'Verified word limit', value: String(input.requirements.wordLimit) });
  if (input.requirements?.referencingStyle) metadata.push({ label: 'Referencing style', value: input.requirements.referencingStyle });
  metadata.push({
    label: 'Requirement verification',
    value: input.requirements?.verificationStatus ?? 'NOT_YET_VERIFIED',
  });
  if (input.requirements?.sourceUrl) metadata.push({ label: 'Requirements source', value: input.requirements.sourceUrl });
  if (input.qualitySummary) metadata.push({ label: 'Quality check summary', value: input.qualitySummary });

  const blocks = toBlocks(input.sections);

  const sourceAppendix: DocxSection = {
    heading: 'Source verification appendix (internal — remove before submission if not required)',
    paragraphs: [
      input.sources.length
        ? 'Every source below is stored in the project evidence library. Verification status is shown so an unchecked reference is never mistaken for a verified one.'
        : 'No sources are stored. Do not submit a bibliography that has not been checked.',
    ],
    bullets: input.sources.map((source) => {
      const identifier = source.doi ? `DOI ${source.doi}` : source.url ? source.url : 'NO DOI OR URL';
      return `${source.authors} (${source.year ?? 'year unknown'}). ${source.title}. ${source.venue || source.publisher || ''} — ${identifier}. Status: ${source.verificationStatus}.`;
    }),
  };

  const citationAppendix: DocxSection = {
    heading: 'Citation integrity log (internal)',
    paragraphs: input.citations.length
      ? []
      : ['No citations are attached to this proposal.'],
    bullets: input.citations.map((citation) => {
      return `${citation.sectionKey}: “${citation.rawText.slice(0, 160)}” → ${citation.sourceTitle ?? 'NO LINKED SOURCE'} [${citation.isValid ? 'valid' : 'FLAGGED'}${citation.validationNote ? `: ${citation.validationNote}` : ''}]`;
    }),
  };

  const allSections = [...blocks, sourceAppendix, citationAppendix];

  const docx = buildDocx({
    title: input.title,
    subtitle: [input.universityName, input.programmeName].filter(Boolean).join(' — '),
    draftLabel: input.draftLabel,
    metadata,
    sections: allSections,
    footerNote:
      'Draft export. Source links and verification statuses are retained in the appendix so unsupported claims remain visible. Confirm all requirements on the official programme page before submission.',
  });

  const pdf = buildPdf({
    title: input.title,
    subtitle: [input.universityName, input.programmeName].filter(Boolean).join(' — '),
    draftLabel: input.draftLabel,
    metadata,
    sections: allSections,
    footerNote:
      'Draft export. Source links and verification statuses are retained in the appendix so unsupported claims remain visible. Confirm all requirements on the official programme page before submission.',
  });

  return { docx, pdf, metadata };
}

export function buildCvTemplate(input: {
  name?: string;
  email?: string;
  degreeSubject?: string;
}): Buffer {
  return buildDocx({
    title: 'Academic CV — UK doctoral application template',
    subtitle: 'Editable template. Replace every bracketed placeholder with verified information.',
    draftLabel: 'Template — not a completed CV. Do not submit without editing.',
    metadata: [
      { label: 'Name', value: input.name || '[full name]' },
      { label: 'Email', value: input.email || '[email]' },
      { label: 'Subject area', value: input.degreeSubject || '[subject]' },
    ],
    sections: [
      {
        heading: 'Personal details',
        bullets: ['Full name, contact details, city/country', 'Nationality only if the programme requires it', 'Links to ORCID/Google Scholar only if genuine'],
      },
      {
        heading: 'Education',
        bullets: [
          '[Degree], [subject], [institution], [dates], [classification/GPA]',
          'Dissertation: [title] — [one line on methods and findings]',
          'Relevant modules: [list only modules actually taken]',
        ],
      },
      {
        heading: 'Research experience',
        bullets: [
          '[Project title] — [role], [dates], [supervisor if applicable]',
          'Question, method, data, output, and what you personally did',
          'Do not claim publications or conference presentations that are not confirmed',
        ],
      },
      {
        heading: 'Publications and conference activity',
        paragraphs: ['Use a consistent citation style. Include DOI/URL only after checking the record. Write “in preparation” honestly rather than implying acceptance.'],
      },
      {
        heading: 'Professional experience',
        bullets: ['[Role], [organisation], [dates]', 'Emphasise research-relevant analysis, access, project delivery and communication'],
      },
      {
        heading: 'Methods and technical skills',
        bullets: ['Qualitative/quantitative methods actually used', 'Software and laboratory techniques actually used', 'Language proficiency with evidence where required'],
      },
      {
        heading: 'Awards, funding and training',
        bullets: ['[Award/funding], [body], [year], [competitiveness if known]', 'Research training courses completed'],
      },
      {
        heading: 'Referees',
        bullets: ['[Name], [role], [institution], [email — with permission]', 'Confirm each referee has agreed before submitting their details'],
      },
    ],
    footerNote: 'Template generated by ALO UK PhD Proposal Builder. No personal data is sent anywhere by this export.',
  });
}
