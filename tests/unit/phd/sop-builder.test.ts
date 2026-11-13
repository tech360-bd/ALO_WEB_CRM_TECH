import { describe, expect, it } from 'vitest';
import {
  EMPTY_PERSONAL_FACTS,
  SOP_DETECTOR_STATEMENT,
  SOP_SECTIONS,
  SOP_STATUSES,
  SOP_TRANSITIONS,
  parsePersonalFacts,
  serialisePersonalFacts,
  type SopPersonalFacts,
} from '@/lib/phd/sop/constants';
import { generateSopDraft, type SopGeneratorInput } from '@/lib/phd/sop/generator';
import { checkSop, findUniversityMismatches } from '@/lib/phd/sop/checks';

const facts = (overrides: Partial<SopPersonalFacts> = {}): SopPersonalFacts => ({
  ...EMPTY_PERSONAL_FACTS,
  motivation:
    'I want to understand how small manufacturers in the West Midlands decide whether to adopt predictive maintenance, because I managed those decisions for six years.',
  whyProgramme:
    'The programme includes a taught module on industrial data and a supervisory team working on maintenance analytics.',
  whyUniversity:
    'The university runs an engineering research centre with a maintenance testbed that I can use for the case study.',
  achievements: ['Ran a maintenance pilot across two factories in 2024'],
  careerPlan: 'I intend to return to manufacturing as a research lead responsible for maintenance strategy.',
  professionalContext: 'I spent six years as a maintenance engineer in two tier-two automotive suppliers.',
  aiUse: 'I used a drafting assistant to structure this statement and rewrote every sentence myself.',
  reviewerNotes: '',
  ...overrides,
});

const baseInput = (overrides: Partial<SopGeneratorInput> = {}): SopGeneratorInput => ({
  university: { name: 'Aston University', officialDomain: 'aston.ac.uk' },
  programme: {
    name: 'Engineering and Applied Science',
    award: 'PhD',
    discipline: 'ENGINEERING',
    verificationStatus: 'VERIFIED_OFFICIAL',
  },
  profile: {
    highestQualification: 'MSc',
    degreeSubject: 'Mechanical Engineering',
    awardingInstitution: 'University of Birmingham',
    classification: 'Distinction',
    dissertationTitle: 'predictive maintenance scheduling in small manufacturing firms',
    relevantModules: 'statistical modelling, operations management',
    researchExperience: 'Six years of industrial maintenance engineering and a masters dissertation.',
    publications: '',
    preferredMethods: ['semi-structured interviews', 'case study'],
    researchSetting: 'UK tier-two automotive suppliers',
  },
  topic: {
    workingTitle: 'Predictive maintenance adoption in UK automotive suppliers',
    mainQuestion: 'Which organisational factors explain whether tier-two suppliers adopt predictive maintenance?',
    provisionalGap: 'the adoption literature focuses on large plants and ignores smaller suppliers',
    methodology: 'a multiple case study with 12 interviews',
  },
  literature: [
    {
      title: 'Maintenance strategy in small firms',
      authors: 'Smith and Ahmed',
      year: 2021,
      verificationStatus: 'VERIFIED_OFFICIAL',
    },
  ],
  facts: facts(),
  aiDisclosureRequired: true,
  ...overrides,
});

describe('SOP personal facts', () => {
  it('round-trips facts and never throws on malformed JSON', () => {
    const serialised = serialisePersonalFacts(facts());
    expect(parsePersonalFacts(serialised).motivation).toContain('West Midlands');
    expect(parsePersonalFacts('{not json').motivation).toBe('');
    expect(parsePersonalFacts(null).achievements).toEqual([]);
    expect(parsePersonalFacts(JSON.stringify({ achievements: ['a', '', 3] })).achievements).toEqual(['a', '3']);
  });
});

describe('SOP generator', () => {
  it('produces all ten sections with the configured titles', () => {
    const result = generateSopDraft(baseInput());
    expect(result.sections).toHaveLength(SOP_SECTIONS.length);
    expect(result.sections.map((section) => section.sectionKey)).toEqual(SOP_SECTIONS.map((section) => section.key));
  });

  it('is deterministic for the same inputs', () => {
    const first = generateSopDraft(baseInput());
    const second = generateSopDraft(baseInput());
    expect(second.sections.map((section) => section.content)).toEqual(first.sections.map((section) => section.content));
    expect(second.wordCount).toBe(first.wordCount);
  });

  it('never invents a motivation or career plan the student did not supply', () => {
    const result = generateSopDraft(
      baseInput({ facts: facts({ motivation: '', careerPlan: '', professionalContext: '' }) }),
    );
    const motivation = result.sections.find((section) => section.sectionKey === 'motivation');
    const career = result.sections.find((section) => section.sectionKey === 'career_plan');
    expect(motivation?.content).toBe('');
    expect(motivation?.needsInput).toBe(true);
    expect(career?.content).toBe('');
    expect(result.needsInputCount).toBeGreaterThan(0);
    expect(result.notes.join(' ')).not.toMatch(/passionate/i);
  });

  it('leaves the research-interest section empty when no topic is selected', () => {
    const result = generateSopDraft(baseInput({ topic: null }));
    const interest = result.sections.find((section) => section.sectionKey === 'research_interest');
    expect(interest?.content).toBe('');
    expect(interest?.missing).toContain('Select or write a working topic title');
  });

  it('does not produce identical text for two students with different facts', () => {
    const first = generateSopDraft(baseInput());
    const second = generateSopDraft(
      baseInput({
        facts: facts({
          motivation: 'My interest began while auditing energy use in three food-processing plants in Wales.',
          whyUniversity: 'The university hosts a maintenance analytics group with an industry advisory board.',
          careerPlan: 'I plan to work in energy policy evaluation for a regional authority.',
          achievements: ['Led an energy audit programme for 14 sites'],
        }),
        profile: {
          ...baseInput().profile,
          degreeSubject: 'Environmental Engineering',
          awardingInstitution: 'Cardiff University',
          dissertationTitle: 'energy auditing in food processing',
          preferredMethods: ['quantitative survey'],
        },
      }),
    );
    const joined = (result: typeof first) => result.sections.map((section) => section.content).join('\n');
    expect(joined(second)).not.toEqual(joined(first));
    const first_words = new Set(joined(first).split(/\s+/));
    const second_words = joined(second).split(/\s+/);
    const shared = second_words.filter((word) => first_words.has(word)).length / second_words.length;
    expect(shared).toBeLessThan(0.95);
  });

  it('only cites sources the student recorded and says when they are unverified', () => {
    const result = generateSopDraft(
      baseInput({
        literature: [
          { title: 'An unverified paper', authors: 'Doe', year: null, verificationStatus: 'NOT_YET_VERIFIED' },
        ],
      }),
    );
    const field = result.sections.find((section) => section.sectionKey === 'field_engagement');
    expect(field?.content).toContain('An unverified paper');
    expect(result.notes.join(' ')).toContain('not yet verified');
  });

  it('flags a missing AI disclosure when the institution requires one', () => {
    const result = generateSopDraft(baseInput({ facts: facts({ aiUse: '' }), aiDisclosureRequired: true }));
    const disclosure = result.sections.find((section) => section.sectionKey === 'ai_disclosure');
    expect(disclosure?.needsInput).toBe(true);
    expect(result.personalisation.factsMissing.join(' ')).toMatch(/disclosure/i);
  });

  it('scores personalisation from supplied facts rather than document length', () => {
    const full = generateSopDraft(baseInput());
    const sparse = generateSopDraft(baseInput({ facts: { ...EMPTY_PERSONAL_FACTS } }));
    expect(full.personalisation.score).toBeGreaterThan(sparse.personalisation.score);
    expect(sparse.personalisation.score).toBe(0);
  });
});

describe('SOP checks', () => {
  const reportFor = (input: Partial<Parameters<typeof checkSop>[0]> = {}) => {
    const generated = generateSopDraft(baseInput());
    return checkSop({
      universityName: 'Aston University',
      programmeName: 'Engineering and Applied Science',
      topicTitle: 'Predictive maintenance adoption in UK automotive suppliers',
      wordLimit: 3000,
      targetWords: 1000,
      aiDisclosureRequired: true,
      personalisationScore: 100,
      evidenceCorpus: `${facts().motivation} ${facts().achievements.join(' ')} ${facts().careerPlan}`,
      sections: generated.sections.map((section) => ({
        sectionKey: section.sectionKey,
        title: section.title,
        content: section.content,
      })),
      ...input,
    });
  };

  it('passes a complete, evidenced statement with no blocking errors', () => {
    const report = reportFor();
    expect(report.errorCount).toBe(0);
    expect(report.wordLimit.status).toBe('WITHIN');
    expect(report.aiDisclosure.status).toBe('REQUIRED_INCLUDED');
  });

  it('blocks an empty section', () => {
    const generated = generateSopDraft(baseInput({ facts: { ...EMPTY_PERSONAL_FACTS } }));
    const report = checkSop({
      universityName: 'Aston University',
      programmeName: 'Engineering and Applied Science',
      topicTitle: null,
      wordLimit: null,
      targetWords: 1000,
      aiDisclosureRequired: null,
      personalisationScore: 0,
      evidenceCorpus: '',
      sections: generated.sections.map((section) => ({
        sectionKey: section.sectionKey,
        title: section.title,
        content: section.content,
      })),
    });
    expect(report.errorCount).toBeGreaterThan(0);
    expect(report.emptySections).toContain('motivation');
    expect(report.readiness).toBe('NOT_READY');
  });

  it('flags interchangeable wording without blocking the export', () => {
    const generated = generateSopDraft(baseInput());
    const report = reportFor({
      sections: generated.sections.map((section) => ({
        sectionKey: section.sectionKey,
        title: section.title,
        content:
          section.sectionKey === 'motivation'
            ? 'I am passionate about manufacturing and I have always been fascinated by maintenance.'
            : section.content,
      })),
    });
    expect(report.genericPhrases).toContain('passionate about');
    expect(report.genericPhrases).toContain('always been fascinated');
    expect(report.errorCount).toBe(0);
    expect(report.warningCount).toBeGreaterThan(0);
  });

  it('blocks a statement that names a different university', () => {
    const report = reportFor({
      sections: [
        {
          sectionKey: 'programme_fit',
          title: 'Why this programme',
          content: 'I am applying to the University of Bath because the programme matches my interests exactly.',
        },
      ],
    });
    expect(report.universityMismatches).toContain('University of Bath');
    expect(report.checks.some((check) => check.code === 'WRONG_UNIVERSITY' && check.severity === 'ERROR')).toBe(true);
  });

  it('does not treat a parent institution name inside the target name as a mismatch', () => {
    expect(findUniversityMismatches('Queen Mary University of London is my choice.', 'Queen Mary University of London')).toEqual([]);
    expect(findUniversityMismatches('I also considered the University of Bath.', 'Aston University')).toEqual(['University of Bath']);
  });

  it('blocks an exceeded word limit and reports an unknown one honestly', () => {
    const long = checkSop({
      universityName: 'Aston University',
      programmeName: 'Engineering and Applied Science',
      topicTitle: null,
      wordLimit: 50,
      targetWords: 1000,
      aiDisclosureRequired: false,
      personalisationScore: 100,
      evidenceCorpus: '',
      sections: [{ sectionKey: 'motivation', title: 'Motivation', content: 'word '.repeat(60) }],
    });
    expect(long.wordLimit.status).toBe('EXCEEDED');
    expect(long.checks.some((check) => check.code === 'WORD_LIMIT_EXCEEDED')).toBe(true);

    const unknown = reportFor({ wordLimit: null });
    expect(unknown.wordLimit.status).toBe('UNKNOWN');
    expect(unknown.checks.some((check) => check.code === 'WORD_LIMIT_UNKNOWN')).toBe(true);
  });

  it('blocks a missing disclosure only when the institution requires one', () => {
    const required = reportFor({ aiDisclosureRequired: true, sections: [] });
    expect(required.checks.some((check) => check.code === 'AI_DISCLOSURE_MISSING')).toBe(true);

    const notRequired = reportFor({ aiDisclosureRequired: false, sections: [] });
    expect(notRequired.checks.some((check) => check.code === 'AI_DISCLOSURE_MISSING')).toBe(false);
  });

  it('warns rather than invents when the disclosure requirement is unknown', () => {
    const report = reportFor({ aiDisclosureRequired: null });
    expect(report.aiDisclosure.status).toBe('UNKNOWN');
    expect(report.checks.some((check) => check.code === 'AI_DISCLOSURE_REQUIREMENT_UNKNOWN')).toBe(true);
  });

  it('flags quantitative and publication claims that the student has not evidenced', () => {
    const report = reportFor({
      evidenceCorpus: 'I worked as a maintenance engineer.',
      sections: [
        {
          sectionKey: 'research_experience',
          title: 'Research experience',
          content: 'I published three papers and reduced downtime by 45 per cent across the plant.',
        },
      ],
    });
    expect(report.unsupportedClaims.length).toBeGreaterThan(0);
    expect(report.checks.filter((check) => check.code === 'UNSUPPORTED_CLAIM').length).toBeGreaterThan(0);
  });

  it('flags duplicated section text', () => {
    const body = 'I completed a masters dissertation on maintenance scheduling in 2024.';
    const report = reportFor({
      sections: [
        { sectionKey: 'academic_background', title: 'Academic background', content: body },
        { sectionKey: 'research_experience', title: 'Research experience', content: body },
      ],
    });
    expect(report.duplicateSections).toContain('research_experience');
  });

  it('never reports or promises an AI-detector score', () => {
    const report = reportFor();
    expect(report.detectorStatement).toBe(SOP_DETECTOR_STATEMENT);
    expect(report.checks.some((check) => check.code === 'AI_DETECTOR_NOT_MEASURED')).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(/detector score of|guaranteed score|below 5%|under 5%/i);
  });

  it('warns when the statement topic differs from the proposal topic', () => {
    const report = reportFor({ proposalTopicTitle: 'A completely different topic' });
    expect(report.checks.some((check) => check.code === 'PROPOSAL_TOPIC_MISMATCH')).toBe(true);
  });
});

describe('SOP review trail', () => {
  it('is one-way except for controlled returns', () => {
    expect(SOP_TRANSITIONS.DRAFT).toEqual(['STUDENT_REVIEWED']);
    expect(SOP_TRANSITIONS.STUDENT_REVIEWED).toContain('FINAL_APPROVED');
    expect(SOP_TRANSITIONS.FINAL_APPROVED).toContain('REQUIREMENTS_VERIFIED');
    expect(SOP_TRANSITIONS.REQUIREMENTS_VERIFIED).toContain('EXPORT_VERIFIED');
    expect(SOP_TRANSITIONS.DRAFT).not.toContain('FINAL_APPROVED');
    expect(SOP_TRANSITIONS.EXPORT_VERIFIED).not.toContain('DRAFT');
  });

  it('names every status with a human label order', () => {
    expect(SOP_STATUSES[0]).toBe('DRAFT');
    expect(SOP_STATUSES[SOP_STATUSES.length - 1]).toBe('EXPORT_VERIFIED');
  });
});
