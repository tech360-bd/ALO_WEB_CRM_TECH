import { PROPOSAL_SECTIONS, type ProposalSectionKey } from '../constants';

export interface DefaultSection {
  sectionKey: ProposalSectionKey;
  title: string;
  guidance: string;
  content: string;
  sortOrder: number;
  required: boolean;
}

export interface ProposalSeedInput {
  title: string;
  plainLanguage?: string;
  problemStatement?: string;
  provisionalGap?: string;
  mainQuestion?: string;
  supportingQuestions?: string[];
  aim?: string;
  objectives?: Array<{ text: string; measure?: string }>;
  theoryFramework?: string;
  methodology?: { design?: string; methods?: string; rationale?: string; resources?: string; risks?: string; paradigm?: string };
  dataNeeds?: string;
  ethics?: string;
  feasibilityRisks?: string;
  scholarlyContribution?: string;
  practicalContribution?: string;
  preliminaryReading?: string;
  universityName?: string;
  programmeName?: string;
}

/**
 * Creates the 20 required sections. Content is a *starting scaffold* copied
 * from the selected topic canvas or left explicitly blank. Generated text is
 * labelled with its provenance; it is never treated as a verified fact.
 */
export function buildDefaultSections(seed: ProposalSeedInput): DefaultSection[] {
  const q = seed.supportingQuestions ?? [];
  const objectives = seed.objectives ?? [];
  const objectivesText = objectives
    .map((objective, index) => `${index + 1}. ${objective.text}${objective.measure ? ` — measure: ${objective.measure}` : ''}`)
    .join('\n');

  const contentByKey: Record<ProposalSectionKey, string> = {
    title: seed.title,
    abstract: seed.plainLanguage
      ? `[DRAFT — generated from the topic canvas; revise in your own voice]\n\n${seed.plainLanguage}\n\nAim: ${seed.aim ?? '[add aim]'}\n\nMethod: ${seed.methodology?.methods ?? '[add method]'}`
      : '',
    background: '[Source required] Establish the field with verified sources. Do not paste unreferenced claims here.',
    problem: seed.problemStatement ?? '',
    rationale: '[Draft] Explain why the problem matters now, to whom, and what would change if it were answered. Add verified sources for every external claim.',
    literature: '[Preliminary review] Synthesise verified sources from the Evidence Library. An empty section is honest; an invented citation is not.',
    gap: seed.provisionalGap ?? '[Provisional gap — requires a documented literature search]',
    aim: seed.aim ?? '',
    questions: [
      seed.mainQuestion ? `Main: ${seed.mainQuestion}` : 'Main: [state one answerable question]',
      ...q.map((question, index) => `Sub-question ${index + 1}: ${question}`),
    ].join('\n\n'),
    framework: seed.theoryFramework ?? '',
    methodology: [
      seed.methodology?.paradigm ? `Paradigm: ${seed.methodology.paradigm}` : '',
      seed.methodology?.design ?? '',
      seed.methodology?.rationale ? `Justification: ${seed.methodology.rationale}` : '',
      seed.methodology?.resources ? `Resources: ${seed.methodology.resources}` : '',
    ].filter(Boolean).join('\n\n'),
    data: seed.dataNeeds ?? '',
    analysis: '[Analysis plan] Specify techniques, assumptions, software, validation and how alternative explanations will be tested.',
    ethics: seed.ethics ?? '',
    feasibility: seed.feasibilityRisks ?? '',
    contribution: [seed.scholarlyContribution, seed.practicalContribution ? `Practical contribution: ${seed.practicalContribution}` : '']
      .filter(Boolean)
      .join('\n\n'),
    implications: '[Implications] Keep claims proportionate to what the design can test.',
    timetable: '[Timetable] Build a timeline from the verified programme duration. Official deadlines are not the same as a project plan.',
    bibliography: seed.preliminaryReading ?? '[No verified references yet]',
    appendices: '',
  };

  return PROPOSAL_SECTIONS.map((section, index) => ({
    sectionKey: section.key,
    title: section.title,
    guidance: section.guidance,
    content: contentByKey[section.key] ?? '',
    sortOrder: index + 1,
    required: !['appendices'].includes(section.key),
  }));
}

export function countWords(text: string): number {
  const cleaned = text
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[#*_>`~[\]()]/g, ' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function totalWordCount(sections: Array<{ content: string; sectionKey?: string }>): number {
  // Bibliography and appendices normally sit outside the assessed word count.
  return sections
    .filter((section) => !['bibliography', 'appendices'].includes(section.sectionKey ?? ''))
    .reduce((sum, section) => sum + countWords(section.content), 0);
}

export interface SnapshotSection {
  sectionKey: string;
  title: string;
  content: string;
  sortOrder: number;
  required: boolean;
}

export interface ProposalSnapshot {
  title: string;
  sections: SnapshotSection[];
  wordCount: number;
  capturedAt: string;
  requirements: {
    programmeId?: string | null;
    universityName?: string;
    programmeName?: string;
    wordLimit: number | null;
    referencingStyle: string;
    requiredHeadings: string | null;
    abstractRequired: boolean;
    verificationStatus: string;
    sourceUrl?: string | null;
  };
}

export function createSnapshot(params: {
  title: string;
  sections: SnapshotSection[];
  requirements: ProposalSnapshot['requirements'];
}): ProposalSnapshot {
  return {
    title: params.title,
    sections: [...params.sections].sort((a, b) => a.sortOrder - b.sortOrder),
    wordCount: totalWordCount(params.sections),
    capturedAt: new Date().toISOString(),
    requirements: params.requirements,
  };
}
