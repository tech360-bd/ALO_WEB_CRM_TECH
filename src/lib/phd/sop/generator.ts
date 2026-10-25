import { SOP_SECTIONS, type SopPersonalFacts, type SopSectionKey } from './constants';
import { countWords } from '../proposals/sections';

/**
 * Deterministic SOP draft builder.
 *
 * Design rules, enforced here rather than in a prompt:
 *   • every sentence is derived from a fact supplied by the student or recorded
 *     in the database; nothing is invented;
 *   • a section with no supporting fact is returned empty with the exact input
 *     it needs, so the student writes that part themselves;
 *   • no generic filler is emitted ("I have always been passionate about…"),
 *     because that is what makes statements interchangeable;
 *   • the same inputs always produce the same draft, so a reviewer can diff two
 *     versions and see only what the student changed.
 */

export interface SopGeneratorProfile {
  highestQualification: string;
  degreeSubject: string;
  awardingInstitution: string;
  classification: string;
  dissertationTitle: string;
  relevantModules: string;
  researchExperience: string;
  publications: string;
  preferredMethods: string[];
  researchSetting: string;
}

export interface SopGeneratorTopic {
  workingTitle: string;
  mainQuestion: string;
  provisionalGap: string;
  methodology: string;
}

export interface SopGeneratorLiterature {
  title: string;
  authors: string;
  year: number | null;
  verificationStatus: string;
}

export interface SopGeneratorInput {
  university: { name: string; officialDomain: string } | null;
  programme: { name: string; award: string; discipline: string; verificationStatus: string } | null;
  profile: SopGeneratorProfile;
  topic: SopGeneratorTopic | null;
  literature: SopGeneratorLiterature[];
  facts: SopPersonalFacts;
  aiDisclosureRequired: boolean | null;
}

export interface GeneratedSopSection {
  sectionKey: SopSectionKey;
  title: string;
  content: string;
  needsInput: boolean;
  missing: string[];
}

export interface SopGenerationResult {
  sections: GeneratedSopSection[];
  wordCount: number;
  needsInputCount: number;
  personalisation: {
    score: number;
    factsUsed: string[];
    factsMissing: string[];
  };
  notes: string[];
}

const MAX_LITERATURE = 6;

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function firstSentence(value: string, maxChars = 320): string {
  const text = clean(value);
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const boundary = cut.lastIndexOf('. ');
  return `${(boundary > 80 ? cut.slice(0, boundary) : cut).trim()}…`;
}

function asSentence(value: string): string {
  const text = clean(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function listSentence(items: string[]): string {
  const values = items.map(clean).filter(Boolean);
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;
}

function section(
  key: SopSectionKey,
  sentences: string[],
  missing: string[] = [],
): GeneratedSopSection {
  const definition = SOP_SECTIONS.find((entry) => entry.key === key);
  const content = sentences.map(asSentence).filter(Boolean).join(' ').trim();
  return {
    sectionKey: key,
    title: definition?.title ?? key,
    content,
    needsInput: content.length === 0 || missing.length > 0,
    missing: content.length === 0 || missing.length > 0 ? missing : [],
  };
}

export function generateSopDraft(input: SopGeneratorInput): SopGenerationResult {
  const { profile, facts, topic, programme, university } = input;
  const notes: string[] = [];
  const factsUsed: string[] = [];
  const factsMissing: string[] = [];
  const sections: GeneratedSopSection[] = [];

  const topicTitle = clean(topic?.workingTitle);
  const mainQuestion = clean(topic?.mainQuestion);
  const gap = clean(topic?.provisionalGap);
  const methodsText = clean(topic?.methodology);

  // 1. Why this programme and university
  {
    const sentences: string[] = [];
    if (programme?.name) {
      const award = programme.award ? `${programme.award} ` : '';
      sentences.push(
        `I am applying for the ${award}programme in ${clean(programme.name)} at ${clean(university?.name ?? 'the university')}.`,
      );
      if (programme.discipline && programme.discipline !== 'OTHER') {
        sentences.push(`The programme sits within ${programme.discipline.toLowerCase()}, which is the field I intend to work in.`);
      }
    }
    if (clean(facts.whyProgramme)) {
      sentences.push(firstSentence(facts.whyProgramme));
      factsUsed.push('whyProgramme');
    }
    if (clean(facts.whyUniversity)) {
      sentences.push(firstSentence(facts.whyUniversity));
      factsUsed.push('whyUniversity');
    }
    const missing: string[] = [];
    if (!clean(facts.whyProgramme)) missing.push('Why this programme (your own words)');
    if (!clean(facts.whyUniversity)) missing.push('Why this university (your own words)');
    if (!programme?.name) missing.push('Choose the programme this statement is for');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('programme_fit', sentences, missing));
  }

  // 2. Research interest and proposed topic
  {
    const sentences: string[] = [];
    if (topicTitle) {
      sentences.push(`My proposed area of research is “${topicTitle}”.`);
      factsUsed.push('topic');
    }
    if (mainQuestion) sentences.push(`The question I intend to pursue is: ${asSentence(mainQuestion)}`);
    if (gap) sentences.push(`The gap I am responding to is currently framed as: ${asSentence(gap)}`);
    const missing: string[] = [];
    if (!topicTitle) missing.push('Select or write a working topic title');
    if (!mainQuestion) missing.push('Write your main research question');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('research_interest', sentences, missing));
  }

  // 3. Academic background
  {
    const sentences: string[] = [];
    const qualification = clean(profile.highestQualification);
    const subject = clean(profile.degreeSubject);
    const institution = clean(profile.awardingInstitution);
    const classification = clean(profile.classification);
    if (qualification || subject) {
      sentences.push(
        `I hold ${qualification ? `${/^[aeiou]/i.test(qualification) ? 'an' : 'a'} ${qualification.toLowerCase()}` : 'a degree'}${subject ? ` in ${subject}` : ''}${institution ? ` from ${institution}` : ''}.`,
      );
      factsUsed.push('degree');
    }
    if (classification) sentences.push(`My award classification was ${classification}.`);
    const modules = clean(profile.relevantModules);
    if (modules) sentences.push(`Modules most relevant to this proposal were ${asSentence(modules)}`);
    const missing: string[] = [];
    if (!subject) missing.push('Degree subject');
    if (!institution) missing.push('Awarding institution');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('academic_background', sentences, missing));
  }

  // 4. Research experience (dissertation + recorded experience + achievements)
  {
    const sentences: string[] = [];
    if (clean(profile.dissertationTitle)) {
      sentences.push(`My dissertation examined ${asSentence(profile.dissertationTitle)}`);
      factsUsed.push('dissertation');
    }
    if (clean(profile.researchExperience)) {
      sentences.push(firstSentence(profile.researchExperience, 420));
      factsUsed.push('researchExperience');
    }
    const achievements = facts.achievements.map(clean).filter(Boolean).slice(0, 4);
    if (achievements.length) {
      sentences.push(`Relevant experience I can evidence includes ${asSentence(listSentence(achievements))}`);
      factsUsed.push('achievements');
    }
    if (clean(profile.publications)) {
      sentences.push(`I have the following outputs to declare: ${asSentence(profile.publications)}`);
      factsUsed.push('publications');
    }
    const missing: string[] = [];
    if (!clean(profile.dissertationTitle) && !clean(profile.researchExperience) && achievements.length === 0) {
      missing.push('Describe your dissertation, project or professional research experience');
    }
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('research_experience', sentences, missing));
  }

  // 5. Methods and technical readiness
  {
    const sentences: string[] = [];
    const methods = profile.preferredMethods.map(clean).filter(Boolean);
    if (methods.length) {
      sentences.push(`I can work with ${listSentence(methods)}.`);
      factsUsed.push('methods');
    }
    if (methodsText) {
      sentences.push(`The proposed design would use ${asSentence(methodsText)}`);
      factsUsed.push('topicMethod');
    }
    if (clean(profile.researchSetting)) {
      sentences.push(`The setting I intend to study is ${asSentence(profile.researchSetting)}`);
    }
    const missing: string[] = [];
    if (methods.length === 0) missing.push('List the research methods you can already use');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('methods', sentences, missing));
  }

  // 6. Motivation and professional context — student's own words only
  {
    const sentences: string[] = [];
    if (clean(facts.motivation)) {
      sentences.push(firstSentence(facts.motivation, 600));
      factsUsed.push('motivation');
    }
    if (clean(facts.professionalContext)) {
      sentences.push(firstSentence(facts.professionalContext, 500));
      factsUsed.push('professionalContext');
    }
    const missing: string[] = [];
    if (!clean(facts.motivation)) missing.push('Your motivation, in your own words');
    if (!clean(facts.professionalContext)) missing.push('The professional or practical context behind this interest');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('motivation', sentences, missing));
  }

  // 7. Engagement with the field — recorded literature only
  {
    const sentences: string[] = [];
    const usable = input.literature
      .filter((item) => clean(item.title))
      .slice(0, MAX_LITERATURE);
    if (usable.length) {
      const described = usable.map((item) => {
        const author = clean(item.authors) || 'author not recorded';
        const year = item.year ?? 'n.d.';
        return `${author} (${year}), “${clean(item.title)}”`;
      });
      sentences.push(`Sources I have recorded and read for this project include ${listSentence(described)}.`);
      const unverified = usable.filter((item) => item.verificationStatus !== 'VERIFIED_OFFICIAL').length;
      if (unverified > 0) {
        notes.push(
          `${unverified} cited source(s) are not yet verified against an official or publisher record; they are described as read, not as supporting a specific finding.`,
        );
      }
      factsUsed.push('literature');
    }
    const missing: string[] = [];
    if (usable.length === 0) missing.push('Add at least one source you have actually read to your literature workspace');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('field_engagement', sentences, missing));
  }

  // 8. Intended contribution
  {
    const sentences: string[] = [];
    if (topicTitle) {
      sentences.push(
        `If the project proceeds as planned, it would contribute evidence on ${topicTitle.toLowerCase()}, addressing the question I set out above.`,
      );
      factsUsed.push('contribution');
    }
    if (gap) sentences.push(`That contribution is defined against the gap I described: ${asSentence(gap)}`);
    const missing: string[] = [];
    if (!topicTitle) missing.push('A working topic is needed before a contribution can be stated');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('contribution', sentences, missing));
  }

  // 9. Career plan — student's own words only
  {
    const sentences: string[] = [];
    if (clean(facts.careerPlan)) {
      sentences.push(firstSentence(facts.careerPlan, 500));
      factsUsed.push('careerPlan');
    }
    const missing: string[] = [];
    if (!clean(facts.careerPlan)) missing.push('Your plan after the doctorate');
    missing.forEach((entry) => factsMissing.push(entry));
    sections.push(section('career_plan', sentences, missing));
  }

  // 10. AI disclosure — only when required by the institution or used voluntarily
  {
    const sentences: string[] = [];
    const required = input.aiDisclosureRequired;
    if (clean(facts.aiUse)) {
      sentences.push(firstSentence(facts.aiUse, 500));
      factsUsed.push('aiUse');
    }
    if (required === true && !clean(facts.aiUse)) {
      factsMissing.push('How drafting tools were used (the institution requires a disclosure)');
    }
    sections.push({
      ...section('ai_disclosure', sentences, required === true && !clean(facts.aiUse) ? ['How drafting tools were used'] : []),
      needsInput: required === true && !clean(facts.aiUse),
    });
    if (required === null) {
      notes.push('The institution has not been recorded as requiring (or not requiring) an AI disclosure. Check the official instructions before exporting.');
    }
  }

  const wordCount = sections.reduce((total, item) => total + countWords(item.content), 0);
  const needsInputCount = sections.filter((item) => item.needsInput).length;
  const totalFacts = 6; // whyProgramme, whyUniversity, motivation, careerPlan, achievements, professionalContext
  const suppliedFacts = ['whyProgramme', 'whyUniversity', 'motivation', 'careerPlan', 'professionalContext']
    .filter((key) => clean(facts[key as keyof SopPersonalFacts] as string)).length +
    (facts.achievements.length > 0 ? 1 : 0);
  const score = Math.round((suppliedFacts / totalFacts) * 100);

  if (!clean(university?.name)) {
    notes.push('No university is attached to this statement, so the programme-fit section cannot name one. This document must not be exported as final.');
  }

  return {
    sections,
    wordCount,
    needsInputCount,
    personalisation: { score, factsUsed: Array.from(new Set(factsUsed)), factsMissing: Array.from(new Set(factsMissing)) },
    notes,
  };
}
